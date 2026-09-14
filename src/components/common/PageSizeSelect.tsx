import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './PageSizeSelect.module.css';

export interface PageSizeOption {
  label: string;
  value: string | number;
}

export interface PageSizeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** 드롭다운 옵션 목록 (미지정 시 기본 20개씩/50개씩/100개씩 보기) */
  options?: Array<string | number | PageSizeOption>;
  /** 바깥쪽 래퍼 div에 적용할 클래스명 */
  wrapperClassName?: string;
}

export const DEFAULT_PAGE_SIZE_OPTIONS: string[] = ['20개씩 보기', '50개씩 보기', '100개씩 보기'];

/**
 * 목록 및 데이터 그리드 상단에서 사용되는 페이지당 개수 선택(PageSizeSelect) 공통 컴포넌트입니다.
 * - 텍스트와 화살표가 겹치지 않는 충분한 너비(min-width: 104px)와 패딩이 보장됩니다.
 * - ChevronDown 드롭다운 화살표 아이콘이 브라우저/리셋 CSS와 무관하게 100% 항상 표시됩니다.
 */
export const PageSizeSelect = forwardRef<HTMLSelectElement, PageSizeSelectProps>(function PageSizeSelect(
  {
    options = DEFAULT_PAGE_SIZE_OPTIONS,
    className,
    wrapperClassName,
    children,
    defaultValue = '20개씩 보기',
    'aria-label': ariaLabel = '페이지당 표시 개수',
    ...props
  },
  ref,
) {
  return (
    <div className={`${styles.wrapper} ${wrapperClassName ?? ''}`.trim()}>
      <select
        ref={ref}
        aria-label={ariaLabel}
        defaultValue={props.value !== undefined ? undefined : defaultValue}
        className={`${styles.select} ${className ?? ''}`.trim()}
        {...props}
      >
        {children ??
          options.map((opt) => {
            const label = typeof opt === 'object' ? opt.label : String(opt);
            const value = typeof opt === 'object' ? opt.value : String(opt);
            return (
              <option key={String(value)} value={value}>
                {label}
              </option>
            );
          })}
      </select>
      <ChevronDown size={14} className={styles.arrowIcon} aria-hidden="true" />
    </div>
  );
});
