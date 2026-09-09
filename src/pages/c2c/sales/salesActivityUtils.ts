import { downloadExcelFile } from '../../../lib/excelExport';

export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>) {
  let xlsxName = filename.trim();
  if (xlsxName.toLowerCase().endsWith('.csv')) {
    xlsxName = xlsxName.slice(0, -4) + '.xlsx';
  } else if (!xlsxName.toLowerCase().endsWith('.xlsx')) {
    xlsxName = xlsxName + '.xlsx';
  }

  downloadExcelFile({
    filename: xlsxName,
    sheetName: xlsxName.replace(/\.xlsx$/i, '').slice(0, 31),
    columns: header,
    rows,
  });
}

export const pages = [{ label: '‹' }, { label: '1', active: true }, { label: '›' }];
