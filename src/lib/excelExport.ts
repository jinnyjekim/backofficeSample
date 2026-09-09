export type ExcelCellAlign = 'left' | 'center' | 'right';

export interface ExcelCellData {
  value: string | number | null | undefined;
  align?: ExcelCellAlign;
  bold?: boolean;
  color?: string; // 헥스 코드 (예: #18181B)
  bgColor?: string; // 배경 헥스 코드 (예: #DCFCE7)
  numFmtId?: number; // 특정 엑셀 포맷 ID
  customNumFmt?: string; // 커스텀 포맷 (예: '#,##0"원"')
  isHeader?: boolean;
}

export interface ExcelColumnDefinition {
  label: string;
  align?: ExcelCellAlign;
  width?: number;
}

export interface ExportExcelOptions {
  filename: string;
  sheetName?: string;
  columns: (string | ExcelColumnDefinition)[];
  rows: (Array<string | number | null | undefined | ExcelCellData>)[];
}

const encoder = new TextEncoder();

function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizeHexColor(hex?: string): string | null {
  if (!hex) return null;
  const clean = hex.trim().replace(/^#/, '').toUpperCase();
  if (clean.length === 6) return `FF${clean}`;
  if (clean.length === 8) return clean;
  if (clean.length === 3) {
    return `FF${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
  }
  return null;
}

function getColumnName(index: number): string {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function calculateDisplayLength(value: unknown): number {
  const str = String(value ?? '');
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 255) {
      len += 2.0; // 한글 등 전각 문자
    } else if (code >= 65 && code <= 90) {
      len += 1.2; // 영문 대문자
    } else {
      len += 1.0; // 소문자, 숫자, 기호
    }
  }
  return len;
}

/**
 * 상태 배지 텍스트에 따른 기본 스타일 매핑
 */
function getStatusBadgeStyle(text: string): { bgColor: string; color: string; bold: boolean } | null {
  const trimmed = text.trim();
  // 성공 / 정상 / 활성 / 승인 / 완료 / 노출
  if (/^(정상|노출|활성|승인|완료|성공|지급|배송중|배송완료|해제|발송완료)$/.test(trimmed)) {
    return { bgColor: '#DCFCE7', color: '#166534', bold: true };
  }
  // 경고 / 대기 / 진행중 / 검토
  if (/^(대기|검토|진행중|진행 예정|확인중|처리중|요청|임시저장)$/.test(trimmed)) {
    return { bgColor: '#FEF3C7', color: '#92400E', bold: true };
  }
  // 위험 / 취소 / 반려 / 차단 / 실패 / 삭제
  if (/^(취소|반려|실패|차단|정지|거절|불가|제외|오류|비정상)$/.test(trimmed)) {
    return { bgColor: '#FEE2E2', color: '#991B1B', bold: true };
  }
  // 정보 / 특정 유형
  if (/^(일반|상시|특정 상품|특정 카테고리|회원)$/.test(trimmed)) {
    return { bgColor: '#DBEAFE', color: '#1E40AF', bold: true };
  }
  // 중립 / 비활성 / 종료 / 미노출
  if (/^(종료|비활성|비노출|숨김|해당없음|없음|-)$/.test(trimmed)) {
    return { bgColor: '#F3F4F6', color: '#4B5563', bold: false };
  }
  return null;
}

/**
 * 문자열 데이터로부터 데이터 타입 및 서식 자동 감지
 */
export function autoFormatCellValue(
  raw: string | number | null | undefined,
  colLabel = ''
): ExcelCellData {
  if (raw === null || raw === undefined) {
    return { value: '', align: 'center' };
  }

  if (typeof raw === 'number') {
    return {
      value: raw,
      align: 'right',
      numFmtId: Number.isInteger(raw) ? 3 : 4, // 3: #,##0, 4: #,##0.00
    };
  }

  const str = String(raw).trim();
  if (str === '' || str === '-') {
    return { value: str, align: 'center' };
  }

  // 1. 전화번호, 사업자번호, 앞자리가 0인 코드 등은 문자열 유지 및 중앙 정렬
  if (/^0\d{1,3}-\d{3,4}-\d{4}$/.test(str) || /^\d{3}-\d{2}-\d{5}$/.test(str) || /^0\d{3,}$/.test(str)) {
    return { value: str, align: 'center' };
  }

  // 2. 일시 (YYYY-MM-DD HH:mm:ss 또는 YYYY.MM.DD HH:mm)
  if (/^\d{4}[-./]\d{2}[-./]\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(str)) {
    return { value: str, align: 'center' };
  }

  // 3. 날짜 (YYYY-MM-DD 또는 YYYY.MM.DD)
  if (/^\d{4}[-./]\d{2}[-./]\d{2}$/.test(str)) {
    return { value: str, align: 'center' };
  }

  // 4. 기간 (YYYY-MM-DD ~ YYYY-MM-DD)
  if (/^\d{4}[-./]\d{2}[-./]\d{2}\s*~\s*\d{4}[-./]\d{2}[-./]\d{2}$/.test(str)) {
    return { value: str, align: 'center' };
  }

  // 5. 통화/금액 (예: "15,000원", "₩15,000", "-5,000원")
  const currencyMatch = str.match(/^(-)?([₩\\])?\s*([0-9,]+)\s*(원)?$/);
  if (currencyMatch && (currencyMatch[2] || currencyMatch[4])) {
    const isNegative = Boolean(currencyMatch[1]);
    const num = parseInt(currencyMatch[3].replaceAll(',', ''), 10);
    if (!Number.isNaN(num)) {
      return {
        value: isNegative ? -num : num,
        align: 'right',
        customNumFmt: '#,##0"원"',
      };
    }
  }

  // 6. 포인트 (예: "1,000 P", "500P")
  const pointMatch = str.match(/^(-)?([0-9,]+)\s*(P|p|포인트)$/);
  if (pointMatch) {
    const isNegative = Boolean(pointMatch[1]);
    const num = parseInt(pointMatch[2].replaceAll(',', ''), 10);
    if (!Number.isNaN(num)) {
      return {
        value: isNegative ? -num : num,
        align: 'right',
        customNumFmt: '#,##0" P"',
      };
    }
  }

  // 7. 수량 / 건수 (예: "10개", "150건", "3명", "5회")
  const unitMatch = str.match(/^([0-9,]+)\s*(개|건|명|회|곳|종)$/);
  if (unitMatch) {
    const num = parseInt(unitMatch[1].replaceAll(',', ''), 10);
    const unit = unitMatch[2];
    if (!Number.isNaN(num)) {
      return {
        value: num,
        align: 'right',
        customNumFmt: `#,##0"${unit}"`,
      };
    }
  }

  // 8. 퍼센트 (예: "12.5%", "90%")
  const percentMatch = str.match(/^(-)?([0-9]+(?:\.[0-9]+)?)\s*%$/);
  if (percentMatch) {
    const isNegative = Boolean(percentMatch[1]);
    const num = parseFloat(percentMatch[2]);
    if (!Number.isNaN(num)) {
      const val = (isNegative ? -num : num) / 100;
      return {
        value: Number(val.toFixed(4)),
        align: 'right',
        customNumFmt: percentMatch[2].includes('.') ? '0.0%' : '0%',
      };
    }
  }

  // 9. 순수 콤마 숫자 (예: "1,250,000" or "-300")
  const pureNumMatch = str.match(/^(-)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(\.[0-9]+)?$/);
  if (pureNumMatch && (str.includes(',') || (!colLabel.includes('코드') && !colLabel.includes('번호') && !colLabel.includes('ID')))) {
    const isNegative = Boolean(pureNumMatch[1]);
    const intPart = pureNumMatch[2].replaceAll(',', '');
    const decimalPart = pureNumMatch[3] ?? '';
    const num = parseFloat(`${isNegative ? '-' : ''}${intPart}${decimalPart}`);
    if (!Number.isNaN(num)) {
      return {
        value: num,
        align: 'right',
        numFmtId: decimalPart ? 4 : 3,
      };
    }
  }

  // 10. 상태 배지 여부 체크
  const badgeStyle = getStatusBadgeStyle(str);
  if (badgeStyle) {
    return {
      value: str,
      align: 'center',
      bgColor: badgeStyle.bgColor,
      color: badgeStyle.color,
      bold: badgeStyle.bold,
    };
  }

  // 11. 컬럼명이 '상태'이거나 '구분'인 경우 중앙 정렬
  if (colLabel.includes('상태') || colLabel.includes('구분') || colLabel.includes('유형') || colLabel.includes('방식')) {
    return { value: str, align: 'center' };
  }

  // 12. 기본 문자열: 왼쪽 정렬
  return { value: str, align: 'left' };
}

/* ========================================================================= */
/* OpenXML SpreadsheetML 패키지 생성 및 스타일 레지스트리                     */
/* ========================================================================= */

interface StyleKey {
  numFmtId: number;
  customNumFmt?: string;
  fontBold: boolean;
  fontColor: string; // Hex (e.g. FFFFFFFF)
  fontSize: number;
  fillColor?: string; // Hex (e.g. FF2B3440)
  align: ExcelCellAlign;
  border: boolean;
}

class ExcelStyleRegistry {
  private customNumFmts = new Map<string, number>();
  private nextCustomNumFmtId = 164;

  private fonts = new Map<string, number>();
  private fontList: Array<{ sz: number; name: string; bold: boolean; color?: string }> = [];

  private fills = new Map<string, number>();
  private fillList: Array<string | null> = [null, null]; // 0: none, 1: gray125

  private xfs = new Map<string, number>();
  private xfList: Array<{
    numFmtId: number;
    fontId: number;
    fillId: number;
    borderId: number;
    align: ExcelCellAlign;
  }> = [];

  constructor() {
    // 기본 스타일 등록 (Index 0: Normal)
    this.getOrAddXf({
      numFmtId: 0,
      fontBold: false,
      fontColor: 'FF18181B',
      fontSize: 10,
      align: 'left',
      border: true,
    });
  }

  private getOrAddFont(sz: number, name: string, bold: boolean, color?: string): number {
    const key = `${sz}_${name}_${bold ? '1' : '0'}_${color ?? ''}`;
    let id = this.fonts.get(key);
    if (id !== undefined) return id;

    id = this.fontList.length;
    this.fonts.set(key, id);
    this.fontList.push({ sz, name, bold, color });
    return id;
  }

  private getOrAddFill(color?: string): number {
    if (!color) return 0; // none
    const key = color.toUpperCase();
    let id = this.fills.get(key);
    if (id !== undefined) return id;

    id = this.fillList.length;
    this.fills.set(key, id);
    this.fillList.push(key);
    return id;
  }

  private getOrAddNumFmt(customFormat?: string, defaultId = 0): number {
    if (!customFormat) return defaultId;
    let id = this.customNumFmts.get(customFormat);
    if (id !== undefined) return id;

    id = this.nextCustomNumFmtId++;
    this.customNumFmts.set(customFormat, id);
    return id;
  }

  public getOrAddXf(style: StyleKey): number {
    const numFmtId = this.getOrAddNumFmt(style.customNumFmt, style.numFmtId);
    const fontId = this.getOrAddFont(style.fontSize, '맑은 고딕', style.fontBold, style.fontColor);
    const fillId = this.getOrAddFill(style.fillColor);
    const borderId = style.border ? 1 : 0;

    const key = `${numFmtId}_${fontId}_${fillId}_${borderId}_${style.align}`;
    let xfId = this.xfs.get(key);
    if (xfId !== undefined) return xfId;

    xfId = this.xfList.length;
    this.xfs.set(key, xfId);
    this.xfList.push({
      numFmtId,
      fontId,
      fillId,
      borderId,
      align: style.align,
    });
    return xfId;
  }

  public generateStylesXml(): string {
    // 1. numFmts
    const numFmtXml = this.customNumFmts.size > 0
      ? `<numFmts count="${this.customNumFmts.size}">` +
        Array.from(this.customNumFmts.entries())
          .map(([fmt, id]) => `<numFmt numFmtId="${id}" formatCode="${xmlEscape(fmt)}"/>`)
          .join('') +
        `</numFmts>`
      : '';

    // 2. fonts
    const fontsXml = `<fonts count="${this.fontList.length}">` +
      this.fontList
        .map((f) => {
          const boldXml = f.bold ? '<b/>' : '';
          const colorXml = f.color ? `<color rgb="${f.color}"/>` : '<color rgb="FF18181B"/>';
          return `<font><sz val="${f.sz}"/><name val="${f.name}"/>${boldXml}${colorXml}</font>`;
        })
        .join('') +
      `</fonts>`;

    // 3. fills
    const fillsXml = `<fills count="${this.fillList.length}">` +
      `<fill><patternFill patternType="none"/></fill>` +
      `<fill><patternFill patternType="gray125"/></fill>` +
      this.fillList.slice(2).map((hex) => {
        return `<fill><patternFill patternType="solid"><fgColor rgb="${hex}"/><bgColor indexed="64"/></patternFill></fill>`;
      }).join('') +
      `</fills>`;

    // 4. borders (0: none, 1: thin borders)
    const bordersXml = `<borders count="2">` +
      `<border/>` +
      `<border>` +
        `<left style="thin"><color rgb="FFE2E8F0"/></left>` +
        `<right style="thin"><color rgb="FFE2E8F0"/></right>` +
        `<top style="thin"><color rgb="FFE2E8F0"/></top>` +
        `<bottom style="thin"><color rgb="FFE2E8F0"/></bottom>` +
      `</border>` +
      `</borders>`;

    // 5. cellStyleXfs & cellXfs
    const cellStyleXfsXml = `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`;
    const cellXfsXml = `<cellXfs count="${this.xfList.length}">` +
      this.xfList
        .map((xf) => {
          return `<xf numFmtId="${xf.numFmtId}" fontId="${xf.fontId}" fillId="${xf.fillId}" borderId="${xf.borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">` +
            `<alignment horizontal="${xf.align}" vertical="center"/>` +
            `</xf>`;
        })
        .join('') +
      `</cellXfs>`;

    const cellStylesXml = `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>`;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      numFmtXml +
      fontsXml +
      fillsXml +
      bordersXml +
      cellStyleXfsXml +
      cellXfsXml +
      cellStylesXml +
      `</styleSheet>`;
  }
}

/* ========================================================================= */
/* ZIP 패키징 엔진 (CRC32 및 PKZip)                                          */
/* ========================================================================= */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let value = i;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
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

function zipFiles(files: Array<[string, string]>): Uint8Array {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let localOffset = 0;

  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);

    // Local file header
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    writeUint32(local, 0, 0x04034b50);
    writeUint16(local, 4, 20); // version needed
    writeUint16(local, 6, 0x0800); // flags (UTF-8)
    writeUint16(local, 8, 0); // compression method (0 = uncompressed)
    writeUint32(local, 14, crc);
    writeUint32(local, 18, data.length); // compressed size
    writeUint32(local, 22, data.length); // uncompressed size
    writeUint16(local, 26, nameBytes.length);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    locals.push(local);

    // Central directory header
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

  const centralSize = centrals.reduce((sum, p) => sum + p.length, 0);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, files.length);
  writeUint16(end, 10, files.length);
  writeUint32(end, 12, centralSize);
  writeUint32(end, 16, localOffset);

  const totalLength = locals.reduce((sum, p) => sum + p.length, 0) + centralSize + end.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of locals) {
    result.set(part, pos);
    pos += part.length;
  }
  for (const part of centrals) {
    result.set(part, pos);
    pos += part.length;
  }
  result.set(end, pos);

  return result;
}

/* ========================================================================= */
/* 메인 엑셀 다운로드 함수                                                    */
/* ========================================================================= */

export function downloadExcelFile({
  filename,
  sheetName = 'Sheet1',
  columns,
  rows,
}: ExportExcelOptions): void {
  const styles = new ExcelStyleRegistry();

  // 컬럼 헤더 정규화
  const colDefs: ExcelColumnDefinition[] = columns.map((col) => {
    if (typeof col === 'string') return { label: col };
    return col;
  });

  const columnCount = colDefs.length;
  const rowCount = rows.length;

  // 헤더 스타일 미리 등록 (백오피스 다크 네이비 테마)
  const headerXfs = colDefs.map((col) => {
    return styles.getOrAddXf({
      numFmtId: 0,
      fontBold: true,
      fontColor: 'FFFFFFFF',
      fontSize: 10.5,
      fillColor: 'FF2B3440', // 세련된 다크 헤더 배경
      align: col.align ?? 'center',
      border: true,
    });
  });

  // 열 너비 계산기 (각 열의 텍스트 길이를 바탕으로 최적 너비 산출)
  const colWidths = colDefs.map((col) => Math.max(12, calculateDisplayLength(col.label) + 4));

  // 각 데이터 셀 파싱 및 XML 생성
  const rowsXml: string[] = [];

  // 1. 헤더 행 생성 (Row 1)
  const headerCellsXml = colDefs
    .map((col, cIdx) => {
      const cellRef = `${getColumnName(cIdx)}1`;
      const xf = headerXfs[cIdx];
      return `<c r="${cellRef}" s="${xf}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(col.label)}</t></is></c>`;
    })
    .join('');
  rowsXml.push(`<row r="1" ht="26" customHeight="1">${headerCellsXml}</row>`);

  // 2. 데이터 행들 생성 (Row 2 ~ N+1)
  rows.forEach((row, rIdx) => {
    const rowNumber = rIdx + 2;
    const isEven = rIdx % 2 === 1;
    // 짝수행 얼터네이팅 배경색: 아주 은은한 #F8FAFC
    const defaultRowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    const cellsXml = row.map((rawCell, cIdx) => {
      if (cIdx >= columnCount) return '';
      const cellRef = `${getColumnName(cIdx)}${rowNumber}`;
      const col = colDefs[cIdx];

      let cell: ExcelCellData;
      if (typeof rawCell === 'object' && rawCell !== null && 'value' in rawCell) {
        cell = rawCell as ExcelCellData;
      } else {
        cell = autoFormatCellValue(rawCell, col.label);
      }

      // 열 너비 갱신
      const displayLen = calculateDisplayLength(cell.formattedValue ?? cell.value);
      if (displayLen + 4 > colWidths[cIdx]) {
        colWidths[cIdx] = Math.min(65, displayLen + 4);
      }

      // 셀 스타일 등록
      const cellAlign = cell.align ?? col.align ?? 'left';
      const cellBg = normalizeHexColor(cell.bgColor) ?? defaultRowBg;
      const cellFg = normalizeHexColor(cell.color) ?? (cell.bgColor ? 'FF18181B' : 'FF18181B');

      const xf = styles.getOrAddXf({
        numFmtId: cell.numFmtId ?? 0,
        customNumFmt: cell.customNumFmt,
        fontBold: cell.bold ?? false,
        fontColor: cellFg,
        fontSize: 10,
        fillColor: cellBg,
        align: cellAlign,
        border: true,
      });

      const val = cell.value;
      if (val === null || val === undefined || val === '') {
        return `<c r="${cellRef}" s="${xf}"/>`;
      }

      if (typeof val === 'number' && Number.isFinite(val)) {
        return `<c r="${cellRef}" s="${xf}"><v>${val}</v></c>`;
      }

      if (typeof val === 'boolean') {
        return `<c r="${cellRef}" s="${xf}" t="b"><v>${val ? 1 : 0}</v></c>`;
      }

      return `<c r="${cellRef}" s="${xf}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(val))}</t></is></c>`;
    }).join('');

    rowsXml.push(`<row r="${rowNumber}" ht="20" customHeight="1">${cellsXml}</row>`);
  });

  // 열 너비 (<cols>) XML 정의
  const colsXml = colWidths
    .map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${w.toFixed(1)}" customWidth="1"/>`)
    .join('');

  // 시트 범위 (A1:LastColLastRow)
  const lastColName = getColumnName(columnCount - 1);
  const lastRowNumber = Math.max(1, rowCount + 1);
  const sheetDimension = `A1:${lastColName}${lastRowNumber}`;
  const autoFilterRef = `A1:${lastColName}1`;

  // Worksheet XML (헤더 행 틀고정, 자동필터, 눈금선 표시)
  const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<dimension ref="${sheetDimension}"/>` +
    `<sheetViews>` +
      `<sheetView tabSelected="1" workbookViewId="0" showGridLines="1">` +
        `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
      `</sheetView>` +
    `</sheetViews>` +
    `<sheetFormatPr defaultRowHeight="20"/>` +
    `<cols>${colsXml}</cols>` +
    `<sheetData>${rowsXml.join('')}</sheetData>` +
    `<autoFilter ref="${autoFilterRef}"/>` +
    `</worksheet>`;

  // 스타일 XML 생성
  const stylesXml = styles.generateStylesXml();

  // 안전한 파일명 처리 (.xlsx 강제 보장)
  let safeName = filename.trim().replace(/[\\/:*?"<>|]+/g, '-');
  if (!safeName.toLowerCase().endsWith('.xlsx')) {
    safeName = safeName.replace(/\.csv$/i, '') + '.xlsx';
  }

  const cleanSheetName = (sheetName || 'Sheet1').replace(/[\\/?*\[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet1';
  const now = new Date().toISOString();

  // 패키지 ZIP 구성
  const files: Array<[string, string]> = [
    [
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
        `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
      `</Types>`,
    ],
    [
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
        `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>` +
      `</Relationships>`,
    ],
    [
      'docProps/core.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
        `<dc:creator>Backoffice</dc:creator>` +
        `<cp:lastModifiedBy>Backoffice</cp:lastModifiedBy>` +
        `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>` +
        `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>` +
      `</cp:coreProperties>`,
    ],
    [
      'docProps/app.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">` +
        `<Application>Backoffice Sample</Application>` +
      `</Properties>`,
    ],
    [
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>` +
          `<sheet name="${xmlEscape(cleanSheetName)}" sheetId="1" r:id="rId1"/>` +
        `</sheets>` +
      `</workbook>`,
    ],
    [
      'xl/_rels/workbook.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`,
    ],
    ['xl/styles.xml', stylesXml],
    ['xl/worksheets/sheet1.xml', worksheetXml],
  ];

  // ZIP 압축 및 Blob 브라우저 다운로드 트리거
  const zipBytes = zipFiles(files);
  const blob = new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
