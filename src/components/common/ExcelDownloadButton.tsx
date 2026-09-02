import { FileSpreadsheet } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { CommonButton } from './CommonControls';
import styles from './ExcelDownloadButton.module.css';

export type ExcelDownloadButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export function ExcelDownloadButton({ className = '', type = 'button', ...props }: ExcelDownloadButtonProps) {
  return (
    <CommonButton {...props} type={type} variant="secondary" size="sm" icon={<FileSpreadsheet size={14} strokeWidth={1.8} aria-hidden="true" />} className={`${styles.button} ${className}`.trim()} data-excel-download>
      <span>Excel 다운로드</span>
    </CommonButton>
  );
}
