import { forwardRef, useEffect, useRef, type ChangeEvent, type SelectHTMLAttributes } from 'react';
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
export const DATA_GRID_PAGE_SIZE_EVENT = 'data-grid-page-size-change';

function pageSizeOf(value: string) {
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function notifyNearestDataGrid(select: HTMLSelectElement) {
  const pageSize = pageSizeOf(select.value);
  if (!pageSize) return;

  let scope: HTMLElement | null = select.parentElement;
  let grid: HTMLElement | null = null;

  while (scope && scope !== document.body) {
    const grids = scope.querySelectorAll<HTMLElement>('[data-datagrid]');
    if (grids.length === 1) {
      grid = grids[0];
      break;
    }
    scope = scope.parentElement;
  }

  if (!grid) {
    const grids = document.querySelectorAll<HTMLElement>('[data-datagrid]');
    if (grids.length === 1) grid = grids[0];
  }

  grid?.dispatchEvent(new CustomEvent(DATA_GRID_PAGE_SIZE_EVENT, { detail: { pageSize } }));
}

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
    onChange,
    'aria-label': ariaLabel = '페이지당 표시 개수',
    ...props
  },
  ref,
) {
  const selectRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (selectRef.current) notifyNearestDataGrid(selectRef.current);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    notifyNearestDataGrid(event.currentTarget);
    onChange?.(event);
  };

  return (
    <div className={`${styles.wrapper} ${wrapperClassName ?? ''}`.trim()}>
      <select
        ref={(node) => {
          selectRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        aria-label={ariaLabel}
        defaultValue={props.value !== undefined ? undefined : defaultValue}
        className={`${styles.select} ${className ?? ''}`.trim()}
        onChange={handleChange}
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
