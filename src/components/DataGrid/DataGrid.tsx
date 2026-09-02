import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './DataGrid.module.css';
import type { Cell, DataGridProps } from './types';

const isInlineDetailLabel = (value?: string) => Boolean(value && /^상세(?:\s*보기)?$/.test(value.trim()));

function trimMenuSeparators(items: Extract<Cell, { kind: 'rowMenu' }>['items']) {
  const withoutDetail = items.filter((item) => !isInlineDetailLabel(item.label));
  return withoutDetail.filter((item, index) => {
    if (!item.sep) return true;
    return index > 0 && index < withoutDetail.length - 1 && !withoutDetail[index - 1].sep && !withoutDetail[index + 1].sep;
  });
}

function withoutManagementDetail(cell: Cell | undefined): Cell | null {
  if (!cell) return null;
  if (cell.kind === 'rowMenu') {
    const items = trimMenuSeparators(cell.items);
    if (!items.some((item) => !item.sep && item.label)) return null;
    return { ...cell, detailLabel: undefined, onDetail: undefined, items };
  }
  if ((cell.kind === 'link' || cell.kind === 'text') && isInlineDetailLabel(cell.text)) return null;
  return cell;
}

function hasManagementAction(cell: Cell | null) {
  if (!cell) return false;
  if (cell.kind === 'rowMenu') return cell.items.some((item) => !item.sep && item.label);
  if (cell.kind === 'link' || cell.kind === 'text') return Boolean(cell.text.trim());
  return true;
}

function splitGridTracks(template: string) {
  const tracks: string[] = [];
  let current = '';
  let depth = 0;
  for (const character of template.trim()) {
    if (character === '(') depth += 1;
    if (character === ')') depth = Math.max(0, depth - 1);
    if (/\s/.test(character) && depth === 0) {
      if (current) tracks.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  if (current) tracks.push(current);
  return tracks;
}

function withoutGridTracks(template: string, removed: Set<number>, columnCount: number) {
  if (!removed.size) return template;
  const tracks = splitGridTracks(template);
  if (tracks.length === columnCount) return tracks.filter((_, index) => !removed.has(index)).join(' ');
  if ([...removed].every((index) => index >= columnCount - removed.size)) return tracks.slice(0, Math.max(0, tracks.length - removed.size)).join(' ');
  return template;
}

function cellExportValue(cell: Cell): string {
  switch (cell.kind) {
    case 'text':
    case 'pillText':
    case 'badge':
    case 'badgeSquare':
    case 'statusDot':
    case 'link':
      return cell.text;
    case 'badgeSub':
      return [cell.text, cell.subText].filter(Boolean).join(' / ');
    case 'checkGroup':
      return cell.items.map((item) => item.label).join(' / ');
    case 'stack':
      return [cell.title, cell.subtitle].filter(Boolean).join(' / ');
    case 'avatarText':
      return [cell.title, cell.subtitle].filter(Boolean).join(' / ');
    case 'progress':
      return cell.label;
    case 'titleWarn':
      return cell.title;
    case 'noWarn':
    case 'noTag':
      return cell.no;
    case 'thumbTitle':
      return `${cell.title} / ${cell.id}`;
    case 'rowMenu':
      return '';
    default:
      return '';
  }
}

function isBadgeCell(cell: Cell) {
  return cell.kind === 'pillText' || cell.kind === 'badge' || cell.kind === 'badgeSub' || cell.kind === 'badgeSquare';
}

function isTemporalColumnLabel(label: string) {
  const compact = label.replace(/\s/g, '');
  if (compact.includes('날짜') || compact.includes('기간') || compact.includes('일시') || compact.includes('일자')) return true;
  return compact.split('/').some((part) => part.endsWith('일') || part.endsWith('요일'));
}

function isSerialColumnLabel(label: string) {
  const compact = label.replace(/\s/g, '');
  if (compact.includes('번호')) return true;
  return compact.split('/').some((part) => /(?:ID|코드|NO\.?|No\.?)$/.test(part));
}

function isStatusColumnLabel(label: string) {
  return label.replace(/\s/g, '').includes('상태');
}

function CellView({ cell }: { cell: Cell }) {
  switch (cell.kind) {
    case 'text':
      return (
        <span
          title={cell.tip}
          className={styles.textCell}
          style={{ fontSize: cell.size ?? '12px', color: cell.color, fontWeight: cell.weight, fontVariantNumeric: cell.numeric ? 'tabular-nums' : undefined }}
        >
          {cell.text}
        </span>
      );
    case 'pillText':
      return (
        <div style={{ minWidth: 0 }}>
          <span
            className={styles.pillTextValue}
            style={{ background: cell.bg, color: cell.fg, padding: '2px 8px', fontSize: cell.size ?? '11px', fontWeight: cell.weight ?? 600 }}
          >
            {cell.text}
          </span>
          {cell.sub && <span className={styles.pillTextSub}>{cell.sub}</span>}
        </div>
      );
    case 'badge':
      return (
        <span className={styles.badge} style={{ background: cell.bg, color: cell.fg }}>
          {cell.text}
        </span>
      );
    case 'badgeSub':
      return (
        <span>
          <span className={styles.badgeSub} style={{ background: cell.bg, color: cell.fg }}>
            {cell.text}
          </span>
          {cell.subText && <span className={styles.badgeSubText}>{cell.subText}</span>}
        </span>
      );
    case 'badgeSquare':
      return (
        <span className={styles.badgeSquare} style={{ background: cell.bg, color: cell.fg }}>
          {cell.text}
        </span>
      );
    case 'checkGroup':
      return (
        <span className={styles.checkGroup}>
          {cell.items.map((item) => (
            <span key={`${item.label}-${item.tone}`} className={`${styles.checkChip} ${styles[`checkChip_${item.tone}`]}`}>
              <i aria-hidden="true">{item.tone === 'success' ? '✓' : item.tone === 'error' ? '×' : item.tone === 'warning' ? '!' : '·'}</i>
              {item.label}
            </span>
          ))}
        </span>
      );
    case 'statusDot':
      return (
        <span className={styles.statusDot} style={{ color: cell.fg }}>
          <span className={styles.dot} style={{ background: cell.dot }} />
          {cell.text}
        </span>
      );
    case 'stack':
      return (
        <div style={{ minWidth: 0 }}>
          <div className={styles.stackTitle}>{cell.title}</div>
          <div className={styles.stackSub}>{cell.subtitle}</div>
        </div>
      );
    case 'avatarText':
      return (
        <div className={styles.avatarText}>
          <div className={styles.avatar} style={{ width: 24, height: 24, background: cell.avatarBg, color: cell.avatarFg }}>
            {cell.avatarChar}
          </div>
          <div className={styles.avatarTitleRow}>
            <span className={styles.avatarTitle}>{cell.title}</span>
            <span className={styles.avatarSub}>{cell.subtitle}</span>
          </div>
        </div>
      );
    case 'link':
      return <span className={styles.link}>{cell.text}</span>;
    case 'progress':
      return (
        <div className={styles.progressWrap}>
          <span className={styles.progressTrack}>
            <span className={styles.progressFill} style={{ width: `${cell.pct}%` }} />
          </span>
          <span className={styles.progressLabel}>{cell.label}</span>
        </div>
      );
    case 'titleWarn':
      return (
        <div className={styles.titleWarn}>
          <span className={styles.titleWarnText}>{cell.title}</span>
          {cell.hasIssue && (
            <span title={cell.issueTitle} className={styles.warnIcon}>
              ⚠
            </span>
          )}
        </div>
      );
    case 'noWarn':
      return (
        <span className={styles.noWarn}>
          <span className={styles.noWarnText}>{cell.no}</span>
          {cell.hasIssue && (
            <span title={cell.issueTitle} className={styles.warnIcon}>
              ⚠
            </span>
          )}
        </span>
      );
    case 'noTag':
      return (
        <span className={styles.noWarn}>
          <span className={styles.noWarnText}>{cell.no}</span>
          {cell.hasTag && (
            <span className={styles.noTagTag} style={{ color: cell.tagFg, background: cell.tagBg }}>
              {cell.tagText}
            </span>
          )}
        </span>
      );
    case 'thumbTitle':
      return (
        <div className={styles.thumbTitle}>
          <div className={styles.thumb} style={{ background: `repeating-linear-gradient(135deg, ${cell.thumb} 0 6px, #fff 6px 12px)` }} />
          <div style={{ minWidth: 0 }}>
            <button type="button" onClick={cell.onClick} className={styles.thumbTitleBtn} style={{ color: cell.titleFg }}>
              {cell.title}
            </button>
            <span className={styles.thumbTitleId}>#{cell.id}</span>
          </div>
        </div>
      );
    case 'rowMenu':
      return (
        <div className={styles.rowMenu} onClick={(e) => e.stopPropagation()}>
          {cell.detailLabel && (
            <button type="button" className={styles.rowMenuDetailBtn} onClick={cell.onDetail}>
              {cell.detailLabel}
            </button>
          )}
          <button type="button" className={styles.rowMenuToggle} onClick={cell.onToggle}>
            ⋯
          </button>
          {cell.open && (
            <div className={styles.rowMenuPopover}>
              {cell.items.map((m, i) =>
                m.sep ? (
                  <div key={i} className={styles.rowMenuSep} />
                ) : (
                  <button key={i} type="button" className={styles.rowMenuItem} style={{ color: m.fg }} onClick={m.click}>
                    {m.label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
}

export function DataGrid({
  columns,
  rows,
  gridTemplate,
  minWidth,
  selectable,
  allSelected,
  onToggleAll,
  showPagination,
  pages,
  rangeLabel,
  empty,
  emptyText = '데이터가 없습니다.',
  emptySubtext,
  emptyActionLabel,
  emptyActionClick,
  fillHeight,
  stickyHeader,
  showTopBar,
  totalLabel,
  actions,
}: DataGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [autoSelectable, setAutoSelectable] = useState(false);
  const [internalSelected, setInternalSelected] = useState<Set<string | number>>(() => new Set());

  useLayoutEffect(() => {
    if (selectable !== undefined) return;
    setAutoSelectable(Boolean(rootRef.current?.ownerDocument.querySelector('[data-excel-download]')));
  }, [selectable]);

  useEffect(() => {
    const available = new Set(rows.map((row) => row.id));
    setInternalSelected((current) => {
      const next = new Set([...current].filter((id) => available.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [rows]);

  const effectiveSelectable = selectable ?? autoSelectable;
  const selectedOf = (row: DataGridProps['rows'][number]) => row.onToggleSelect || row.selected !== undefined ? Boolean(row.selected) : internalSelected.has(row.id);
  const effectiveAllSelected = allSelected ?? (rows.length > 0 && rows.every(selectedOf));
  const toggleAllRows = () => {
    if (onToggleAll) {
      onToggleAll();
      return;
    }
    setInternalSelected(effectiveAllSelected ? new Set() : new Set(rows.map((row) => row.id)));
  };
  const toggleRow = (row: DataGridProps['rows'][number], event: React.MouseEvent) => {
    if (row.onToggleSelect) {
      row.onToggleSelect(event);
      return;
    }
    setInternalSelected((current) => {
      const next = new Set(current);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  };
  const managementIndexes = columns.flatMap((column, index) => column.label.trim() === '관리' ? [index] : []);
  const cleanedManagement = new Map(managementIndexes.map((index) => [index, rows.map((row) => withoutManagementDetail(row.cells[index]))]));
  const removedManagement = new Set(managementIndexes.filter((index) => rows.length > 0 && cleanedManagement.get(index)?.every((cell) => !hasManagementAction(cell))));
  const displayColumns = columns.filter((_, index) => !removedManagement.has(index));
  const displayRows = rows.map((row, rowIndex) => ({
    ...row,
    cells: row.cells.flatMap((cell, cellIndex) => {
      if (removedManagement.has(cellIndex)) return [];
      if (!managementIndexes.includes(cellIndex)) return [cell];
      return [cleanedManagement.get(cellIndex)?.[rowIndex] ?? { kind: 'text', text: '' } as Cell];
    }),
  }));
  const temporalColumnIndexes = new Set(displayColumns.flatMap((column, columnIndex) =>
    isTemporalColumnLabel(column.label) ? [columnIndex] : [],
  ));
  const serialColumnIndexes = new Set(displayColumns.flatMap((column, columnIndex) =>
    isSerialColumnLabel(column.label) ? [columnIndex] : [],
  ));
  const statusColumnIndexes = new Set(displayColumns.flatMap((column, columnIndex) =>
    isStatusColumnLabel(column.label) ? [columnIndex] : [],
  ));
  const displayGridTemplate = withoutGridTracks(gridTemplate, removedManagement, columns.length);
  const template = (effectiveSelectable ? '30px ' : '') + displayGridTemplate;

  return (
    <div ref={rootRef} className={`${styles.root} ${fillHeight ? styles.fillHeight : ''}`} data-datagrid>
      {showTopBar && (
        <div className={styles.topBar}>
          <span className={styles.totalLabel}>{totalLabel}</span>
          <div className={styles.topActions}>
            {actions?.map((a) => (
              <button key={a.label} type="button" className={styles.topActionBtn} onClick={a.onClick}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${styles.bodyWrap} ${fillHeight ? styles.fillHeight : ''}`}>
        <div
          className={`${styles.headRow} ${stickyHeader ? styles.sticky : ''}`}
          style={{ minWidth, gridTemplateColumns: template }}
          data-datagrid-head
        >
          {effectiveSelectable && (
            <input type="checkbox" className={styles.checkbox} checked={effectiveAllSelected} onChange={toggleAllRows} aria-label="현재 목록 전체 선택" />
          )}
          {displayColumns.map((col, i) =>
            col.onClick ? (
              <button key={i} type="button" className={styles.headBtn} style={{ textAlign: 'center' }} onClick={col.onClick}>
                <span data-datagrid-column>{col.label}</span>
              </button>
            ) : (
              <span key={i} style={{ textAlign: 'center' }} data-datagrid-column>
                {col.label}
              </span>
            ),
          )}
        </div>

        {displayRows.map((row) => (
          <div
            key={row.id}
            className={styles.row}
            style={{ minWidth, gridTemplateColumns: template, background: row.bg, boxShadow: row.mark }}
            onClick={row.onClick}
            data-datagrid-row
            data-selected={selectedOf(row) ? 'true' : 'false'}
          >
            {effectiveSelectable && (
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={selectedOf(row)}
                aria-label={`${row.id} 선택`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRow(row, e);
                }}
                onChange={() => {}}
              />
            )}
            {row.cells.map((cell, i) => (
              <div key={i} className={`${styles.cellWrap} ${isBadgeCell(cell) ? styles.badgeCellWrap : ''}`} style={{ textAlign: temporalColumnIndexes.has(i) || serialColumnIndexes.has(i) || statusColumnIndexes.has(i) ? 'center' : isBadgeCell(cell) ? undefined : cell.align }} data-datagrid-cell data-export-value={cellExportValue(cell)}>
                <CellView cell={cell} />
              </div>
            ))}
          </div>
        ))}

        {empty && (
          <div className={styles.empty}>
            <div className={styles.emptyText}>{emptyText}</div>
            {emptySubtext && <div className={styles.emptySubtext}>{emptySubtext}</div>}
            {emptyActionLabel && (
              <button type="button" className={styles.emptyAction} onClick={emptyActionClick}>
                {emptyActionLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {showPagination && (
        <div className={`${styles.pager} ${rangeLabel ? styles.spaced : styles.centered}`}>
          {rangeLabel && <span className={styles.rangeLabel}>{rangeLabel}</span>}
          <div className={styles.pageButtons}>
            {pages?.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`${styles.pageBtn} ${p.active ? styles.active : ''}`}
                onClick={p.onClick}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
