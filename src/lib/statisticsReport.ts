export type ReportValue = string | number | boolean | Date | null | undefined;

export interface StatisticsReportMetric {
  label: string;
  current: ReportValue;
  previous?: ReportValue;
  change?: ReportValue;
  changeRate?: ReportValue;
}

export interface StatisticsReportSheet {
  name: string;
  headers: string[];
  rows: ReportValue[][];
}

export interface StatisticsReportDefinition {
  term: string;
  description: string;
}

export interface StatisticsReportOptions {
  reportName: string;
  mode?: string;
  period?: string;
  comparisonPeriod?: string;
  filters?: Array<[string, ReportValue]>;
  summary: StatisticsReportMetric[];
  trend?: StatisticsReportSheet;
  dimensions?: StatisticsReportSheet[];
  definitions: StatisticsReportDefinition[];
  generatedBy?: string;
  dataAsOf?: string;
  fileName?: string;
}

interface WorkbookSheet {
  name: string;
  rows: ReportValue[][];
  headerRows: Set<number>;
}

const encoder = new TextEncoder();

function xmlEscape(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function columnName(index: number) {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function normalizeSheetName(name: string, used: Set<string>) {
  const base = name.replace(/[\\/?*\[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet';
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    const tail = `_${suffix++}`;
    candidate = `${base.slice(0, 31 - tail.length)}${tail}`;
  }
  used.add(candidate);
  return candidate;
}

function displayLength(value: ReportValue) {
  return String(value ?? '').split('').reduce((length, character) => length + (character.charCodeAt(0) > 255 ? 2 : 1), 0);
}

function sheetXml(sheet: WorkbookSheet) {
  const columnCount = Math.max(1, ...sheet.rows.map((row) => row.length));
  const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
    const width = Math.max(10, ...sheet.rows.map((row) => displayLength(row[columnIndex]) + 2));
    return Math.min(42, width);
  });
  const cols = widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('');
  const rows = sheet.rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
      const style = rowIndex === 0 && sheet.name === '01_요약' ? 1 : sheet.headerRows.has(rowIndex) ? 2 : columnIndex === 0 && sheet.name === '01_요약' ? 3 : 0;
      if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${reference}" s="${style}"><v>${value}</v></c>`;
      if (typeof value === 'boolean') return `<c r="${reference}" s="${style}" t="b"><v>${value ? 1 : 0}</v></c>`;
      const text = value instanceof Date ? value.toISOString() : String(value ?? '');
      return `<c r="${reference}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');
  const lastCell = `${columnName(columnCount - 1)}${Math.max(1, sheet.rows.length)}`;
  const filterRow = [...sheet.headerRows][0] ?? 0;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastCell}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${cols}</cols><sheetData>${rows}</sheetData><autoFilter ref="A${filterRow + 1}:${columnName(columnCount - 1)}${filterRow + 1}"/></worksheet>`;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function concat(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function zip(files: Array<[string, string]>) {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let localOffset = 0;
  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    writeUint32(local, 0, 0x04034b50);
    writeUint16(local, 4, 20);
    writeUint16(local, 6, 0x0800);
    writeUint16(local, 8, 0);
    writeUint32(local, 14, crc);
    writeUint32(local, 18, data.length);
    writeUint32(local, 22, data.length);
    writeUint16(local, 26, nameBytes.length);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    locals.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    writeUint32(central, 0, 0x02014b50);
    writeUint16(central, 4, 20);
    writeUint16(central, 6, 20);
    writeUint16(central, 8, 0x0800);
    writeUint16(central, 10, 0);
    writeUint32(central, 16, crc);
    writeUint32(central, 20, data.length);
    writeUint32(central, 24, data.length);
    writeUint16(central, 28, nameBytes.length);
    writeUint32(central, 42, localOffset);
    central.set(nameBytes, 46);
    centrals.push(central);
    localOffset += local.length;
  }
  const centralSize = centrals.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, files.length);
  writeUint16(end, 10, files.length);
  writeUint32(end, 12, centralSize);
  writeUint32(end, 16, localOffset);
  return concat([...locals, ...centrals, end]);
}

function buildWorkbook(sheets: WorkbookSheet[]) {
  const sheetEntries = sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('');
  const relationships = sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('');
  const worksheetOverrides = sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
  const generatedAt = new Date().toISOString();
  const files: Array<[string, string]> = [
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${worksheetOverrides}</Types>`],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'],
    ['docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Backoffice</dc:creator><cp:lastModifiedBy>Backoffice</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${generatedAt}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${generatedAt}</dcterms:modified></cp:coreProperties>`],
    ['docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Backoffice Statistics</Application><TitlesOfParts><vt:vector size="${sheets.length}" baseType="lpstr">${sheets.map((sheet) => `<vt:lpstr>${xmlEscape(sheet.name)}</vt:lpstr>`).join('')}</vt:vector></TitlesOfParts></Properties>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sheetEntries}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="16"/><color rgb="FF18181B"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF4F46E5"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFE4E4E7"/></left><right style="thin"><color rgb="FFE4E4E7"/></right><top style="thin"><color rgb="FFE4E4E7"/></top><bottom style="thin"><color rgb="FFE4E4E7"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
  ];
  sheets.forEach((sheet, index) => files.push([`xl/worksheets/sheet${index + 1}.xml`, sheetXml(sheet)]));
  return zip(files);
}

function reportTimestamp() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date());
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_').replace(/_+/g, '_');
}

export function downloadStatisticsReport(options: StatisticsReportOptions) {
  const generatedAt = reportTimestamp();
  const metadata: ReportValue[][] = [
    [options.reportName],
    [],
    ['리포트', options.reportName],
    ['Mode', options.mode ?? '통합'],
    ['조회 기간', options.period ?? '-'],
    ['비교 기간', options.comparisonPeriod ?? '비교 없음'],
    ...(options.filters ?? []).map(([label, value]) => [label, value]),
    ['데이터 기준 시각', options.dataAsOf ?? generatedAt],
    ['생성 일시', generatedAt],
    ['생성 관리자', options.generatedBy ?? 'admin01'],
    ['Timezone', 'Asia/Seoul'],
    [],
    ['항목', '현재기간', '비교기간', '증감', '증감률'],
    ...options.summary.map((metric) => [metric.label, metric.current, metric.previous ?? '-', metric.change ?? '-', metric.changeRate ?? '-']),
  ];
  const summaryHeaderIndex = metadata.findIndex((row) => row[0] === '항목');
  const usedNames = new Set<string>();
  const sheets: WorkbookSheet[] = [{ name: normalizeSheetName('01_요약', usedNames), rows: metadata, headerRows: new Set([summaryHeaderIndex]) }];
  if (options.trend) sheets.push({ name: normalizeSheetName(options.trend.name || '02_추이', usedNames), rows: [options.trend.headers, ...options.trend.rows], headerRows: new Set([0]) });
  (options.dimensions ?? []).forEach((sheet, index) => sheets.push({ name: normalizeSheetName(`${String(index + 3).padStart(2, '0')}_${sheet.name}`, usedNames), rows: [sheet.headers, ...sheet.rows], headerRows: new Set([0]) }));
  sheets.push({
    name: normalizeSheetName('99_집계기준', usedNames),
    rows: [
      ['항목', '정의'],
      ...options.definitions.map((definition) => [definition.term, definition.description]),
      [],
      ['데이터 기준 시각', options.dataAsOf ?? generatedAt],
      ['리포트 생성', generatedAt],
      ['Timezone', 'Asia/Seoul'],
    ],
    headerRows: new Set([0]),
  });

  const workbook = buildWorkbook(sheets);
  const blob = new Blob([workbook], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const periodToken = (options.period ?? generatedAt.slice(0, 10)).replace(/[^0-9~-]/g, '').replaceAll('-', '');
  anchor.href = url;
  anchor.download = safeFileName(options.fileName ?? `${options.reportName}_${options.mode ?? '통합'}_${periodToken}.xlsx`);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);

  try {
    const key = 'statisticsReportDownloadHistory';
    const history = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[];
    localStorage.setItem(key, JSON.stringify([{ reportName: options.reportName, mode: options.mode ?? '통합', period: options.period ?? '-', generatedAt, generatedBy: options.generatedBy ?? 'admin01', format: 'Excel', scope: '전체 분석' }, ...history].slice(0, 100)));
  } catch {
    // 다운로드는 감사 로그 저장 실패와 관계없이 완료합니다.
  }
}
