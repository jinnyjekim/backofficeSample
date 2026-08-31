import { useEffect, type RefObject } from 'react';

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function safeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-') || 'data';
}

function visible(element: HTMLElement) {
  return element.getClientRects().length > 0;
}

export function downloadCsvFile(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const csv = [headers, ...rows].map((row) => row.map((value) => csvCell(String(value ?? ''))).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadGrid(grid: HTMLElement, button: HTMLButtonElement) {
  const headers = Array.from(grid.querySelectorAll<HTMLElement>('[data-datagrid-column]')).map((cell) => cell.textContent?.trim() ?? '');
  const allRows = Array.from(grid.querySelectorAll<HTMLElement>('[data-datagrid-row]'));
  const selectedRows = allRows.filter((row) => row.dataset.selected === 'true');
  const selectionMode = button.dataset.gridDownload === 'selected';
  const rows = selectionMode || selectedRows.length > 0 ? selectedRows : allRows;
  if (rows.length === 0) return;

  const values = rows.map((row) => Array.from(row.querySelectorAll<HTMLElement>('[data-datagrid-cell]')).map((cell) => cell.dataset.exportValue ?? cell.textContent?.trim() ?? ''));
  const usableColumns = headers.map((_, index) => index).filter((index) => headers[index] || values.some((row) => row[index]));
  const title = document.querySelector<HTMLElement>('h1')?.textContent
    ?? document.querySelector<HTMLElement>('[class*="headerTitle"], [class*="title"]')?.textContent
    ?? 'data';
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date()).replaceAll('-', '');
  const filename = button.dataset.downloadFilename ?? `${safeFileName(title)}-${date}.csv`;
  downloadCsvFile(filename, usableColumns.map((index) => headers[index]), values.map((row) => usableColumns.map((index) => row[index] ?? '')));
}

export function useGridDownload(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('button');
      const isListDownload = button?.textContent?.trim() === '목록 다운로드';
      if (!button || (!button.hasAttribute('data-grid-download') && !isListDownload) || !root?.contains(button)) return;
      const grids = Array.from(root.querySelectorAll<HTMLElement>('[data-datagrid]')).filter(visible);
      const grid = grids.find((candidate) => button.closest('section, main, [class*="page"]')?.contains(candidate)) ?? grids[0];
      if (!grid) return;
      event.preventDefault();
      downloadGrid(grid, button);
    }

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, [rootRef]);
}
