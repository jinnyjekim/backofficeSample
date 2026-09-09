import { useEffect, type RefObject } from 'react';
import {
  downloadExcelFile,
  autoFormatCellValue,
  type ExcelCellAlign,
  type ExcelCellData,
  type ExcelColumnDefinition,
} from './excelExport';

export { downloadExcelFile };

function safeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-') || 'data';
}

function visible(element: HTMLElement) {
  return element.getClientRects().length > 0;
}

/**
 * 기존 CSV 다운로드 함수와의 호환성을 유지하면서,
 * 실제로는 서식과 스타일이 적용된 .xlsx 파일로 다운로드합니다.
 */
export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined | ExcelCellData>>
) {
  let xlsxName = filename.trim();
  if (xlsxName.toLowerCase().endsWith('.csv')) {
    xlsxName = xlsxName.slice(0, -4) + '.xlsx';
  } else if (!xlsxName.toLowerCase().endsWith('.xlsx')) {
    xlsxName = xlsxName + '.xlsx';
  }

  downloadExcelFile({
    filename: xlsxName,
    sheetName: xlsxName.replace(/\.xlsx$/i, '').slice(0, 31),
    columns: headers,
    rows,
  });
}

function parseDomCell(cell: HTMLElement, colLabel: string): ExcelCellData {
  const exportValue = cell.dataset.exportValue ?? cell.textContent?.trim() ?? '';
  const cellAlign = (cell.dataset.cellAlign as ExcelCellAlign) || undefined;
  const cellBg = cell.dataset.cellBg || undefined;
  const cellFg = cell.dataset.cellFg || undefined;

  // 기본 자동 포맷팅 적용
  const formatted = autoFormatCellValue(exportValue, colLabel);

  // DOM에 명시된 배경색, 글자색, 정렬이 있다면 반영
  if (cellAlign) formatted.align = cellAlign;
  if (cellBg) formatted.bgColor = cellBg;
  if (cellFg) formatted.color = cellFg;

  return formatted;
}

function downloadGrid(grid: HTMLElement, button: HTMLButtonElement) {
  const columnElements = Array.from(grid.querySelectorAll<HTMLElement>('[data-datagrid-column]'));
  const headers = columnElements.map((cell) => cell.textContent?.trim() ?? '');
  const allRows = Array.from(grid.querySelectorAll<HTMLElement>('[data-datagrid-row]'));
  const selectedRows = allRows.filter((row) => row.dataset.selected === 'true');
  const selectionMode = button.dataset.gridDownload === 'selected';
  const rows = selectionMode || selectedRows.length > 0 ? selectedRows : allRows;
  if (rows.length === 0) return;

  const rawRowValues = rows.map((row) =>
    Array.from(row.querySelectorAll<HTMLElement>('[data-datagrid-cell]')).map((cell) =>
      cell.dataset.exportValue ?? cell.textContent?.trim() ?? ''
    )
  );

  const usableColumnIndices = headers
    .map((_, index) => index)
    .filter((index) => headers[index] || rawRowValues.some((row) => row[index]));

  if (usableColumnIndices.length === 0) return;

  const columns: ExcelColumnDefinition[] = usableColumnIndices.map((index) => {
    const colEl = columnElements[index];
    const align = (colEl?.style?.textAlign as ExcelCellAlign) || 'center';
    return {
      label: headers[index] || `열 ${index + 1}`,
      align,
    };
  });

  const parsedRows: ExcelCellData[][] = rows.map((row) => {
    const cellElements = Array.from(row.querySelectorAll<HTMLElement>('[data-datagrid-cell]'));
    return usableColumnIndices.map((colIdx) => {
      const cellEl = cellElements[colIdx];
      const colLabel = columns[usableColumnIndices.indexOf(colIdx)]?.label ?? '';
      if (!cellEl) return { value: '', align: 'center' };
      return parseDomCell(cellEl, colLabel);
    });
  });

  const title =
    document.querySelector<HTMLElement>('h1')?.textContent ??
    document.querySelector<HTMLElement>('[class*="headerTitle"], [class*="title"]')?.textContent ??
    '목록';

  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })
    .format(new Date())
    .replaceAll('-', '');

  let filename = button.dataset.downloadFilename;
  if (!filename) {
    filename = `${safeFileName(title)}-${date}.xlsx`;
  } else {
    filename = filename.replace(/\.csv$/i, '') + '.xlsx';
  }

  downloadExcelFile({
    filename,
    sheetName: safeFileName(title).slice(0, 31),
    columns,
    rows: parsedRows,
  });
}

export function useGridDownload(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button');
      const isExcelBtn =
        button?.hasAttribute('data-excel-download') ||
        button?.hasAttribute('data-grid-download') ||
        button?.textContent?.trim() === 'Excel 다운로드' ||
        button?.textContent?.trim() === '목록 다운로드';

      if (!button || !isExcelBtn || !root?.contains(button)) return;

      const grids = Array.from(root.querySelectorAll<HTMLElement>('[data-datagrid]')).filter(visible);
      const grid =
        grids.find((candidate) => button.closest('section, main, [class*="page"]')?.contains(candidate)) ??
        grids[0];

      if (!grid) return;
      event.preventDefault();
      downloadGrid(grid, button);
    }

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, [rootRef]);
}
