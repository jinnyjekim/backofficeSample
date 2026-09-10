import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronDown, ChevronRight, CircleAlert, GripVertical, Inbox, SearchX } from 'lucide-react';
import { Breadcrumb as M2MBreadcrumb } from 'm2m-uiux-react/Breadcrumb';
import { Accordion as M2MAccordion } from 'm2m-uiux-react/Accordion';
import { List as M2MList } from 'm2m-uiux-react/List';
import { ListItem as M2MListItem } from 'm2m-uiux-react/ListItem';
import { Grid as M2MGrid } from 'm2m-uiux-react/Grid';
import { NoData as M2MNoData } from 'm2m-uiux-react/NoData';
import { Tabs as M2MTabs } from 'm2m-uiux-react/Tabs';
import { Table as M2MTable } from 'm2m-uiux-react/Table';
import { Tooltip as M2MTooltip } from 'm2m-uiux-react/Tooltip';
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

export function CommonTable<T extends object>({
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

  const packageCompatible = !onRowClick
    && columns.every((column) => column.colSpan == null && column.rowSpan == null && column.className == null && (column.dataIndex == null || String(column.dataIndex) === String(column.key)))
    && (typeof classNames === 'string' || classNames == null);
  if (packageCompatible) {
    return <M2MTable
      columns={columns.map((column) => ({
        key: String(column.dataIndex ?? column.key),
        label: column.title,
        width: column.width,
        align: column.align,
        sortable: sortable || column.sortable,
        render: column.render,
      }))}
      data={data}
      rowKey={typeof rowKey === 'function' ? (row, index) => rowKey(row) ?? index : rowKey == null ? undefined : String(rowKey)}
      selectable={selectable}
      selectedRowKeys={selectedRows}
      onSelectionChange={onSelectionChange}
      sort={sort.direction ? { key: sort.key, direction: sort.direction } : null}
      onSortChange={(next) => {
        const normalized = next ? { key: next.key, direction: next.direction } : { key: '', direction: null };
        setSort(normalized);
        onSort?.(normalized.key, normalized.direction);
      }}
      pagination={pagination ? { page, pageSize: pagination.pageSize, total: pagination.total, onChange: (nextPage) => pagination.onChange?.(nextPage, pagination.pageSize) } : undefined}
      striped={striped}
      hover
      emptyText={emptyText}
      emptyContent={emptyComponent}
      loading={loading}
      classNames={cx(styles.tableRoot, styles.tableAdapter, rootClass(classNames), className)}
    />;
  }

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
                  {selectable && (
                    <td
                      className={styles.tableCheck}
                      onClick={(event) => {
                        event.stopPropagation();
                        select(key, !selectedRows.includes(key));
                      }}
                    >
                      <CommonCheckbox
                        aria-label={`${key} 선택`}
                        checked={selectedRows.includes(key)}
                        onChange={(checked) => select(key, checked)}
                      />
                    </td>
                  )}
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
  const bodyTitle = title ?? children ?? '';
  const bodyDescription = title == null ? description : description || children ? <>{description}{children}</> : undefined;
  return <M2MListItem title={bodyTitle} description={bodyDescription} avatar={leading} extra={trailing} clickable={Boolean(onClick) && !disabled} aria-disabled={disabled || undefined} classNames={cx(styles.listItem, styles.listItemAdapter, selected && styles.listItemSelected, disabled && styles.disabled, className)} onClick={() => !disabled && onClick?.()} onKeyDown={onKeyDown} />;
}

export interface CommonListProps<T = unknown> { children?: ReactNode; items?: T[]; renderItem?: (item: T, index: number) => ReactNode; itemKey?: keyof T | ((item: T, index: number) => string | number); loading?: boolean; emptyText?: ReactNode; divided?: boolean; bordered?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonList<T = unknown>({ children, items, renderItem, itemKey, loading = false, emptyText = '데이터가 없습니다.', divided = true, bordered = false, className, classNames }: CommonListProps<T>) {
  const keyOf = (item: T, index: number) => typeof itemKey === 'function' ? itemKey(item, index) : itemKey != null ? String(item[itemKey]) : (item as { id?: string | number }).id ?? index;
  if (!loading && items && items.length === 0) return <div role="list" className={cx(styles.list, bordered && styles.listBordered, rootClass(classNames), className)}><CommonNoData title={emptyText} /></div>;
  return <M2MList
    items={items}
    renderItem={items && renderItem ? (item, index) => {
      const rendered = renderItem(item, index);
      const element = isValidElement(rendered) ? rendered : <M2MListItem title={rendered ?? ''} />;
      return cloneElement(element, { key: keyOf(item, index) });
    } : undefined}
    loading={loading}
    divided={divided}
    classNames={cx(styles.list, divided && styles.listDivided, bordered && styles.listBordered, styles.listAdapter, rootClass(classNames), className)}
  >{children}</M2MList>;
}

interface AccordionContextValue { expanded: (value: string) => boolean; toggle: (value: string) => void; disabled?: boolean; packageBased?: boolean; }
const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface CommonAccordionItemProps { value?: string; title: ReactNode; children: ReactNode; defaultOpen?: boolean; open?: boolean; disabled?: boolean; onChange?: (open: boolean) => void; className?: string; classNames?: CommonClassNames; }
export function CommonAccordionItem({ value, title, children, defaultOpen = false, open, disabled, onChange, className, classNames }: CommonAccordionItemProps) {
  const id = useId();
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const group = useContext(AccordionContext);
  const isDisabled = disabled || group?.disabled;
  if (value && group?.packageBased) {
    return <M2MAccordion.Item value={value} title={title} disabled={isDisabled} classNames={cx(styles.accordionItem, styles.accordionItemAdapter, rootClass(classNames), className)}>{children}</M2MAccordion.Item>;
  }
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
  if (collapsible) {
    return <AccordionContext.Provider value={{ expanded, toggle, disabled, packageBased: true }}><M2MAccordion type={type} value={value} defaultValue={defaultValue} onValueChange={onValueChange} classNames={cx(styles.accordion, styles.accordionAdapter, bordered && styles.listBordered, rootClass(classNames), className)}>{children}</M2MAccordion></AccordionContext.Provider>;
  }
  return <AccordionContext.Provider value={{ expanded, toggle, disabled }}><div className={cx(styles.accordion, bordered && styles.listBordered, rootClass(classNames), className)}>{children}</div></AccordionContext.Provider>;
}

export interface CommonNoDataProps { icon?: ReactNode; title?: ReactNode; description?: ReactNode; action?: ReactNode; type?: 'empty' | 'error' | 'primary' | 'search'; onRetry?: () => void; retryLabel?: ReactNode; className?: string; classNames?: CommonClassNames; }
export function CommonNoData({ icon, title = '데이터가 없습니다.', description, action, type = 'empty', onRetry, retryLabel = '다시 시도', className, classNames }: CommonNoDataProps) {
  const defaultIcon = type === 'error' ? <CircleAlert /> : type === 'search' ? <SearchX /> : <Inbox />;
  const retryAction = action ?? (onRetry && retryLabel !== '다시 시도' ? <CommonButton variant="secondary" size="sm" onClick={onRetry}>{retryLabel}</CommonButton> : undefined);
  return <M2MNoData type={type === 'primary' ? 'empty' : type} icon={icon ?? defaultIcon} title={title} description={description} action={retryAction} onRetry={retryAction ? undefined : onRetry} classNames={cx(styles.noData, styles.noDataAdapter, styles[`noData_${type}`], rootClass(classNames), className)} />;
}

export interface CommonTooltipProps { content: ReactNode; children: ReactNode; placement?: 'top' | 'right' | 'bottom' | 'left'; delay?: number; disabled?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonTooltip({ content, children, placement = 'top', delay = 0, disabled, className, classNames }: CommonTooltipProps) {
  return <M2MTooltip content={content} placement={placement} delay={delay} disabled={disabled} classNames={cx(styles.tooltipAdapter, rootClass(classNames), className)}><span className={styles.tooltipAnchor}>{children}</span></M2MTooltip>;
}

export interface CommonTabItem { key: string; label: ReactNode; icon?: ReactNode; badge?: ReactNode; disabled?: boolean; content?: ReactNode; }
export interface CommonTabsProps { items: CommonTabItem[]; value?: string; defaultValue?: string; onChange?: (key: string) => void; type?: 'line' | 'card' | 'pill'; size?: CommonSize; centered?: boolean; fullWidth?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonTabs({ items, value, defaultValue, onChange, type = 'line', size = 'md', centered, fullWidth, className, classNames }: CommonTabsProps) {
  return <M2MTabs items={items.map((item) => ({ ...item, badge: typeof item.badge === 'string' || typeof item.badge === 'number' ? item.badge : undefined }))} activeKey={value} defaultKey={defaultValue} onChange={onChange} type={type} size={size} centered={centered} fullWidth={fullWidth} classNames={cx(styles.tabsRoot, styles.tabsAdapter, styles[`tabs_${type}`], styles[`tabs_${size}`], centered && styles.tabsCentered, fullWidth && styles.tabsFull, rootClass(classNames), className)} />;
}

export function CommonTab(props: CommonTabsProps) {
  return <CommonTabs {...props} />;
}

export interface CommonBreadcrumbItem { label: ReactNode; href?: string; onClick?: () => void; icon?: ReactNode; }
export interface CommonBreadcrumbProps { items: CommonBreadcrumbItem[]; separator?: ReactNode; maxItems?: number; size?: CommonSize; className?: string; classNames?: CommonClassNames; }
export function CommonBreadcrumb({ items, separator = <ChevronRight size={13} />, maxItems, size = 'md', className, classNames }: CommonBreadcrumbProps) {
  return <M2MBreadcrumb items={items} separator={separator} maxItems={maxItems} size={size} classNames={cx(styles.breadcrumb, styles[`breadcrumb_${size}`], styles.breadcrumbAdapter, rootClass(classNames), className)} />;
}

export interface CommonGridProps { children: ReactNode; columns?: number | string; gap?: number | string; minColumnWidth?: number | string; align?: CSSProperties['alignItems']; className?: string; }
export function CommonGrid({ children, columns = 1, gap = 12, minColumnWidth, align, className }: CommonGridProps) {
  const template = minColumnWidth ? `repeat(auto-fit, minmax(${typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth}, 1fr))` : typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns;
  return <M2MGrid columns={template} gap={gap} alignItems={align as 'start' | 'center' | 'end' | 'stretch' | undefined} classNames={cx(styles.commonGrid, className)}>{children}</M2MGrid>;
}

/**
 * 드래그앤드롭으로 순서를 바꾸는 목록.
 * 마우스 드래그와 키보드(항목 포커스 후 방향키) 양쪽으로 정렬할 수 있습니다.
 */
export interface CommonSortableListProps<T = string> {
  items: T[];
  /** 순서가 바뀐 새 배열을 돌려줍니다. */
  onChange?: (next: T[]) => void;
  /** 항목의 React key. 생략하면 문자열/숫자는 값 자체, 객체는 `id`를 씁니다. */
  itemKey?: (item: T, index: number) => string;
  /** 기본 렌더링에서 보여줄 라벨. 생략하면 문자열/숫자는 값 자체, 객체는 `label` · `name`을 씁니다. */
  itemLabel?: (item: T, index: number) => ReactNode;
  /** 항목 내부를 통째로 그립니다. 지정하면 번호·라벨 대신 이 결과가 들어갑니다. */
  renderItem?: (item: T, index: number) => ReactNode;
  /** `horizontal`은 반응형 그리드로 배치합니다. */
  direction?: 'vertical' | 'horizontal';
  /** 앞에 순번 배지를 표시합니다. */
  numbered?: boolean;
  /** 드래그 손잡이 아이콘 표시 여부. */
  grip?: boolean;
  disabled?: boolean;
  size?: CommonSize;
  /** `horizontal`일 때 한 항목의 최소 폭. */
  minItemWidth?: number | string;
  className?: string;
  classNames?: CommonClassNames;
}

export function CommonSortableList<T = string>({
  items,
  onChange,
  itemKey,
  itemLabel,
  renderItem,
  direction = 'vertical',
  numbered = false,
  grip = true,
  disabled = false,
  size = 'md',
  minItemWidth,
  className,
  classNames,
}: CommonSortableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const keyOf = (item: T, index: number) => {
    if (itemKey) return itemKey(item, index);
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return String((item as { id?: string | number } | null)?.id ?? index);
  };
  const labelOf = (item: T, index: number): ReactNode => {
    if (itemLabel) return itemLabel(item, index);
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    const record = item as { label?: ReactNode; name?: ReactNode } | null;
    return record?.label ?? record?.name ?? '';
  };

  const move = (from: number, to: number) => {
    if (disabled || from === to) return;
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange?.(next);
  };

  const prevKey = direction === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const nextKey = direction === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (disabled || (event.key !== prevKey && event.key !== nextKey)) return;
    const to = index + (event.key === prevKey ? -1 : 1);
    if (to < 0 || to >= items.length) return;
    event.preventDefault();
    const list = event.currentTarget.parentElement;
    move(index, to);
    window.requestAnimationFrame(() => (list?.children[to] as HTMLElement | undefined)?.focus());
  };

  const clearDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <ol
      className={cx(
        direction === 'horizontal' ? styles.sortableHorizontal : styles.sortable,
        disabled && styles.sortableDisabled,
        rootClass(classNames),
        className,
      )}
      style={
        minItemWidth
          ? ({ '--common-sortable-min': typeof minItemWidth === 'number' ? `${minItemWidth}px` : minItemWidth } as CSSProperties)
          : undefined
      }
    >
      {items.map((item, index) => (
        <li
          key={keyOf(item, index)}
          className={cx(
            styles.sortableItem,
            styles[`size_${size}`],
            dragIndex === index && styles.sortableItemDragging,
            overIndex === index && dragIndex !== index && styles.sortableItemOver,
          )}
          draggable={!disabled}
          tabIndex={disabled ? -1 : 0}
          aria-roledescription="정렬 가능한 항목"
          aria-label={`${index + 1}번째 항목${disabled ? '' : ', 방향키로 순서를 바꿀 수 있습니다'}`}
          title={disabled ? undefined : '드래그하거나 방향키로 순서를 바꾸세요'}
          onKeyDown={(event) => onKeyDown(event, index)}
          onDragStart={(event) => {
            if (disabled) {
              event.preventDefault();
              return;
            }
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(index));
            setDragIndex(index);
            setOverIndex(index);
          }}
          onDragEnter={() => {
            if (dragIndex !== null) setOverIndex(index);
          }}
          onDragOver={(event) => {
            if (disabled || dragIndex === null) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(event) => {
            event.preventDefault();
            const transferred = Number(event.dataTransfer.getData('text/plain'));
            const from = dragIndex ?? (Number.isInteger(transferred) ? transferred : null);
            if (from !== null) move(from, index);
            clearDrag();
          }}
          onDragEnd={clearDrag}
        >
          {grip && <GripVertical className={styles.sortableGrip} size={14} aria-hidden="true" />}
          {renderItem ? (
            renderItem(item, index)
          ) : (
            <>
              {numbered && <span className={styles.sortableNum}>{index + 1}</span>}
              <span className={styles.sortableLabel}>{labelOf(item, index)}</span>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}
