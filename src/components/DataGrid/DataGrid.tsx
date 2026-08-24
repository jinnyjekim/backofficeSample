import styles from './DataGrid.module.css';
import type { Cell, DataGridProps } from './types';

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
      return (
        <span className={styles.link} style={{ fontSize: cell.size ?? '12px' }}>
          {cell.text}
        </span>
      );
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
  const template = (selectable ? '30px ' : '') + gridTemplate;

  return (
    <div className={`${styles.root} ${fillHeight ? styles.fillHeight : ''}`}>
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
        >
          {selectable && (
            <input type="checkbox" className={styles.checkbox} checked={!!allSelected} onChange={onToggleAll} />
          )}
          {columns.map((col, i) =>
            col.onClick ? (
              <button key={i} type="button" className={styles.headBtn} style={{ textAlign: col.align }} onClick={col.onClick}>
                {col.label}
              </button>
            ) : (
              <span key={i} style={{ textAlign: col.align }}>
                {col.label}
              </span>
            ),
          )}
        </div>

        {rows.map((row) => (
          <div
            key={row.id}
            className={styles.row}
            style={{ minWidth, gridTemplateColumns: template, background: row.bg, boxShadow: row.mark }}
            onClick={row.onClick}
          >
            {selectable && (
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={!!row.selected}
                onClick={(e) => {
                  e.stopPropagation();
                  row.onToggleSelect?.(e);
                }}
                onChange={() => {}}
              />
            )}
            {row.cells.map((cell, i) => (
              <div key={i} className={styles.cellWrap} style={{ textAlign: cell.align }}>
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
