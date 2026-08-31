import {
  Fragment,
  createContext,
  useContext,
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronDown, ChevronRight, CircleAlert, Inbox, SearchX } from 'lucide-react';
import { CommonButton, CommonCheckbox, type CommonClassNames, type CommonSize } from './CommonControls';
import styles from './common.module.css';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const rootClass = (classNames?: CommonClassNames) =>
  typeof classNames === 'string' ? classNames : classNames?.root;

export interface CommonTableColumn<T> {
  key: keyof T | string;
  title: ReactNode;
  dataIndex?: keyof T;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: unknown, row: T, index: number) => ReactNode;
  colSpan?: number | ((row: T, index: number) => number);
  rowSpan?: number | ((row: T, index: number) => number);
  className?: string;
}

export interface CommonTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onChange?: (page: number, pageSize: number) => void;
}

export interface CommonTableProps<T> {
  columns: CommonTableColumn<T>[];
  data: T[];
  rowKey?: keyof T | ((row: T) => string | number);
  selectable?: boolean;
  selectedRows?: Array<string | number>;
  onSelectionChange?: (keys: Array<string | number>, rows: T[]) => void;
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc' | null) => void;
  pagination?: CommonTablePagination | false;
  striped?: boolean;
  emptyText?: string;
  emptyComponent?: ReactNode;
  loading?: boolean;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  classNames?: CommonClassNames & { table?: string; header?: string; row?: string; cell?: string };
}

export function CommonTable<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortable = false,
  onSort,
  pagination = false,
  striped = false,
  emptyText = '데이터가 없습니다.',
  emptyComponent,
  loading = false,
  onRowClick,
  className,
  classNames,
}: CommonTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const keyOf = (row: T, index = 0) => {
    if (typeof rowKey === 'function') return rowKey(row);
    if (rowKey != null) return String(row[rowKey]);
    return (row as { id?: string | number }).id ?? index;
  };
  const pageCount = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;
  const page = pagination ? Math.min(pagination.page, pageCount) : 1;
  const visibleKeys = data.map(keyOf);
  const allSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedRows.includes(key));
  const partlySelected = visibleKeys.some((key) => selectedRows.includes(key)) && !allSelected;

  const select = (key: string | number, checked: boolean) => {
    const next = checked ? [...new Set([...selectedRows, key])] : selectedRows.filter((item) => item !== key);
    onSelectionChange?.(next, data.filter((row) => next.includes(keyOf(row))));
  };
  const selectPage = (checked: boolean) => {
    const next = checked
      ? [...new Set([...selectedRows, ...visibleKeys])]
      : selectedRows.filter((key) => !visibleKeys.includes(key));
    onSelectionChange?.(next, data.filter((row) => next.includes(keyOf(row))));
  };
  const changeSort = (key: string) => {
    const direction = sort.key !== key || sort.direction === null ? 'asc' : sort.direction === 'asc' ? 'desc' : null;
    setSort({ key, direction });
    onSort?.(key, direction);
  };

  return (
    <div className={cx(styles.tableRoot, rootClass(classNames), className)} aria-busy={loading || undefined}>
      <div className={styles.tableScroll}>
        <table className={cx(styles.commonTable, classNames && typeof classNames !== 'string' && classNames.table)}>
          <thead className={classNames && typeof classNames !== 'string' ? classNames.header : undefined}>
            <tr>
              {selectable && <th className={styles.tableCheck}><CommonCheckbox aria-label="현재 페이지 전체 선택" checked={allSelected} indeterminate={partlySelected} onChange={selectPage} /></th>}
              {columns.map((column) => {
                const key = String(column.key);
                const canSort = sortable || column.sortable;
                return (
                  <th key={key} style={{ width: column.width, textAlign: column.align }} className={column.className}>
                    {canSort ? (
                      <button type="button" className={styles.sortButton} onClick={() => changeSort(key)}>
                        {column.title}<span aria-hidden="true">{sort.key === key ? sort.direction === 'asc' ? '↑' : sort.direction === 'desc' ? '↓' : '↕' : '↕'}</span>
                      </button>
                    ) : column.title}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {!loading && data.map((row, index) => {
              const key = keyOf(row, index);
              return (
                <tr
                  key={key}
                  className={cx(striped && index % 2 === 1 && styles.stripedRow, onRowClick && styles.clickableRow, classNames && typeof classNames !== 'string' && classNames.row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row, index)}
                  onKeyDown={(event) => { if (onRowClick && (event.key === 'Enter' || event.key === ' ')) onRowClick(row, index); }}
                >
                  {selectable && <td className={styles.tableCheck} onClick={(event) => event.stopPropagation()}><CommonCheckbox aria-label={`${key} 선택`} checked={selectedRows.includes(key)} onChange={(checked) => select(key, checked)} /></td>}
                  {columns.map((column) => {
                    const value = column.dataIndex == null ? undefined : row[column.dataIndex];
                    const colSpan = typeof column.colSpan === 'function' ? column.colSpan(row, index) : column.colSpan;
                    const rowSpan = typeof column.rowSpan === 'function' ? column.rowSpan(row, index) : column.rowSpan;
                    if (colSpan === 0 || rowSpan === 0) return null;
                    return <td key={String(column.key)} colSpan={colSpan} rowSpan={rowSpan} style={{ textAlign: column.align }} className={cx(column.className, classNames && typeof classNames !== 'string' && classNames.cell)}>{column.render ? column.render(value, row, index) : String(value ?? '')}</td>;
                  })}
                </tr>
              );
            })}
            {!loading && data.length === 0 && <tr><td className={styles.tableEmpty} colSpan={columns.length + (selectable ? 1 : 0)}>{emptyComponent ?? <CommonNoData title={emptyText} />}</td></tr>}
          </tbody>
        </table>
        {loading && <div className={styles.tableLoading}><span className={styles.spinner} /><span>불러오는 중</span></div>}
      </div>
      {pagination && <nav className={styles.pagination} aria-label="페이지 이동"><CommonButton variant="secondary" size="sm" disabled={page <= 1} onClick={() => pagination.onChange?.(page - 1, pagination.pageSize)}>이전</CommonButton><span><b>{page}</b> / {pageCount}</span><CommonButton variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => pagination.onChange?.(page + 1, pagination.pageSize)}>다음</CommonButton></nav>}
    </div>
  );
}

export interface CommonListItemProps {
  title?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

export function CommonListItem({ title, description, leading, trailing, selected, disabled, onClick, children, className }: CommonListItemProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && onClick && (event.key === 'Enter' || event.key === ' ')) onClick();
  };
  return <div role={onClick ? 'button' : 'listitem'} tabIndex={onClick && !disabled ? 0 : undefined} aria-disabled={disabled || undefined} className={cx(styles.listItem, selected && styles.listItemSelected, disabled && styles.disabled, className)} onClick={() => !disabled && onClick?.()} onKeyDown={onKeyDown}>{leading && <span className={styles.listLeading}>{leading}</span>}<span className={styles.listBody}>{title && <strong>{title}</strong>}{description && <small>{description}</small>}{children}</span>{trailing && <span className={styles.listTrailing}>{trailing}</span>}</div>;
}

export interface CommonListProps<T = unknown> { children?: ReactNode; items?: T[]; renderItem?: (item: T, index: number) => ReactNode; itemKey?: keyof T | ((item: T, index: number) => string | number); loading?: boolean; emptyText?: ReactNode; divided?: boolean; bordered?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonList<T = unknown>({ children, items, renderItem, itemKey, loading = false, emptyText = '데이터가 없습니다.', divided = true, bordered = false, className, classNames }: CommonListProps<T>) {
  const keyOf = (item: T, index: number) => typeof itemKey === 'function' ? itemKey(item, index) : itemKey != null ? String(item[itemKey]) : (item as { id?: string | number }).id ?? index;
  let content = children;
  if (items) content = items.map((item, index) => <Fragment key={keyOf(item, index)}>{renderItem?.(item, index)}</Fragment>);
  if (loading) content = <div className={styles.listLoading}><span className={styles.spinner} />불러오는 중</div>;
  else if (items && items.length === 0) content = <CommonNoData title={emptyText} />;
  return <div role="list" className={cx(styles.list, divided && styles.listDivided, bordered && styles.listBordered, rootClass(classNames), className)}>{content}</div>;
}

interface AccordionContextValue { expanded: (value: string) => boolean; toggle: (value: string) => void; disabled?: boolean; }
const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface CommonAccordionItemProps { value?: string; title: ReactNode; children: ReactNode; defaultOpen?: boolean; open?: boolean; disabled?: boolean; onChange?: (open: boolean) => void; className?: string; classNames?: CommonClassNames; }
export function CommonAccordionItem({ value, title, children, defaultOpen = false, open, disabled, onChange, className, classNames }: CommonAccordionItemProps) {
  const id = useId();
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const group = useContext(AccordionContext);
  const isDisabled = disabled || group?.disabled;
  const expanded = value && group ? group.expanded(value) : open ?? innerOpen;
  const toggle = () => { if (isDisabled) return; if (value && group) group.toggle(value); else if (open === undefined) setInnerOpen(!expanded); onChange?.(!expanded); };
  return <section className={cx(styles.accordionItem, isDisabled && styles.disabled, rootClass(classNames), className)}><button type="button" aria-expanded={expanded} aria-controls={id} disabled={isDisabled} className={styles.accordionButton} onClick={toggle}><span>{title}</span><ChevronDown size={16} /></button>{expanded && <div id={id} className={styles.accordionPanel}>{children}</div>}</section>;
}

export interface CommonAccordionProps { children: ReactNode; type?: 'single' | 'multiple'; value?: string | string[]; defaultValue?: string | string[]; onValueChange?: (value: string | string[]) => void; collapsible?: boolean; disabled?: boolean; bordered?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonAccordion({ children, type = 'single', value, defaultValue, onValueChange, collapsible = true, disabled, bordered = true, className, classNames }: CommonAccordionProps) {
  const initial = defaultValue ?? (type === 'multiple' ? [] : '');
  const [innerValue, setInnerValue] = useState<string | string[]>(initial);
  const selected = value ?? innerValue;
  const expanded = (item: string) => Array.isArray(selected) ? selected.includes(item) : selected === item;
  const toggle = (item: string) => {
    let next: string | string[];
    if (type === 'multiple') {
      const current = Array.isArray(selected) ? selected : selected ? [selected] : [];
      next = current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item];
    } else next = selected === item && collapsible ? '' : item;
    if (value === undefined) setInnerValue(next);
    onValueChange?.(next);
  };
  return <AccordionContext.Provider value={{ expanded, toggle, disabled }}><div className={cx(styles.accordion, bordered && styles.listBordered, rootClass(classNames), className)}>{children}</div></AccordionContext.Provider>;
}

export interface CommonNoDataProps { icon?: ReactNode; title?: ReactNode; description?: ReactNode; action?: ReactNode; type?: 'empty' | 'error' | 'primary' | 'search'; onRetry?: () => void; retryLabel?: ReactNode; className?: string; classNames?: CommonClassNames; }
export function CommonNoData({ icon, title = '데이터가 없습니다.', description, action, type = 'empty', onRetry, retryLabel = '다시 시도', className, classNames }: CommonNoDataProps) {
  const defaultIcon = type === 'error' ? <CircleAlert /> : type === 'search' ? <SearchX /> : <Inbox />;
  return <div className={cx(styles.noData, styles[`noData_${type}`], rootClass(classNames), className)}><span className={styles.noDataIcon}>{icon ?? defaultIcon}</span><strong>{title}</strong>{description && <p>{description}</p>}{action ? <div>{action}</div> : onRetry ? <CommonButton variant="secondary" size="sm" onClick={onRetry}>{retryLabel}</CommonButton> : null}</div>;
}

export interface CommonTooltipProps { content: ReactNode; children: ReactNode; placement?: 'top' | 'right' | 'bottom' | 'left'; delay?: number; disabled?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonTooltip({ content, children, placement = 'top', delay = 0, disabled, className, classNames }: CommonTooltipProps) {
  return <span className={cx(styles.tooltip, disabled && styles.tooltipDisabled, rootClass(classNames), className)}><span className={styles.tooltipAnchor}>{children}</span><span role="tooltip" className={cx(styles.tooltipBubble, styles[`tooltip_${placement}`])} style={{ transitionDelay: `${delay}ms` }}>{content}</span></span>;
}

export interface CommonTabItem { key: string; label: ReactNode; icon?: ReactNode; badge?: ReactNode; disabled?: boolean; content?: ReactNode; }
export interface CommonTabsProps { items: CommonTabItem[]; value?: string; defaultValue?: string; onChange?: (key: string) => void; type?: 'line' | 'card' | 'pill'; size?: CommonSize; centered?: boolean; fullWidth?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonTabs({ items, value, defaultValue, onChange, type = 'line', size = 'md', centered, fullWidth, className, classNames }: CommonTabsProps) {
  const first = defaultValue ?? items.find((item) => !item.disabled)?.key ?? '';
  const [innerValue, setInnerValue] = useState(first);
  const active = value ?? innerValue;
  const choose = (key: string) => { if (value === undefined) setInnerValue(key); onChange?.(key); };
  return <div className={cx(styles.tabsRoot, rootClass(classNames), className)}><div role="tablist" className={cx(styles.tabs, styles[`tabs_${type}`], styles[`tabs_${size}`], centered && styles.tabsCentered, fullWidth && styles.tabsFull)}>{items.map((item) => <button key={item.key} role="tab" type="button" aria-selected={active === item.key} disabled={item.disabled} className={cx(active === item.key && styles.tabActive)} onClick={() => choose(item.key)}>{item.icon}{item.label}{item.badge && <span className={styles.tabBadge}>{item.badge}</span>}</button>)}</div>{items.map((item) => item.key === active && item.content != null ? <div key={item.key} role="tabpanel" className={styles.tabPanel}>{item.content}</div> : null)}</div>;
}

export function CommonTab(props: CommonTabsProps) {
  return <CommonTabs {...props} />;
}

export interface CommonBreadcrumbItem { label: ReactNode; href?: string; onClick?: () => void; icon?: ReactNode; }
export interface CommonBreadcrumbProps { items: CommonBreadcrumbItem[]; separator?: ReactNode; maxItems?: number; size?: CommonSize; className?: string; classNames?: CommonClassNames; }
export function CommonBreadcrumb({ items, separator = <ChevronRight size={13} />, maxItems, size = 'md', className, classNames }: CommonBreadcrumbProps) {
  const shown = maxItems && items.length > maxItems ? [items[0], null, ...items.slice(-(maxItems - 2))] : items;
  return <nav aria-label="현재 위치" className={cx(styles.breadcrumb, styles[`breadcrumb_${size}`], rootClass(classNames), className)}>{shown.map((item, index) => <Fragment key={item ? `${String(item.label)}-${index}` : `ellipsis-${index}`}>{index > 0 && <span className={styles.breadcrumbSeparator}>{separator}</span>}{item ? item.href ? <a href={item.href} onClick={item.onClick}>{item.icon}{item.label}</a> : <span aria-current={index === shown.length - 1 ? 'page' : undefined}>{item.icon}{item.label}</span> : <span>…</span>}</Fragment>)}</nav>;
}

export interface CommonGridProps { children: ReactNode; columns?: number | string; gap?: number | string; minColumnWidth?: number | string; align?: CSSProperties['alignItems']; className?: string; }
export function CommonGrid({ children, columns = 1, gap = 12, minColumnWidth, align, className }: CommonGridProps) {
  const template = minColumnWidth ? `repeat(auto-fit, minmax(${typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth}, 1fr))` : typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns;
  return <div className={cx(styles.commonGrid, className)} style={{ gridTemplateColumns: template, gap: typeof gap === 'number' ? `${gap}px` : gap, alignItems: align }}>{children}</div>;
}
