import { FileSpreadsheet } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import styles from './ExcelDownloadButton.module.css';

export type ExcelDownloadButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export function ExcelDownloadButton({ className = '', type = 'button', ...props }: ExcelDownloadButtonProps) {
  return (
    <button {...props} type={type} className={`${styles.button} ${className}`.trim()} data-excel-download>
      <FileSpreadsheet size={14} strokeWidth={1.8} aria-hidden="true" />
      <span>Excel 다운로드</span>
    </button>
  );
}
