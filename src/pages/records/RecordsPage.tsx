import { useMemo, useState } from 'react';
import styles from './RecordsPage.module.css';
import { BAN_MEMBERS, LEFT_MEMBERS, type BanMember, type LeftMember } from '../../data/members';
import { buildBanView, buildLeftView } from './recordsData';
import { buildBanDetail, buildLeftDetail } from './recordDetail';
import { RecordDetailDrawer } from './RecordDetailDrawer';
import { formatNumber } from '../../lib/theme';

const PAGE_LABELS = ['‹', '1', '2', '3', '4', '5', '›'];

interface Props {
  kind: 'left' | 'ban';
}

export function RecordsPage({ kind }: Props) {
  const [filter, setFilter] = useState('전체');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const isLeft = kind === 'left';
  const rec = useMemo(
    () => (isLeft ? buildLeftView(LEFT_MEMBERS, filter, query) : buildBanView(BAN_MEMBERS, filter, query)),
    [isLeft, filter, query],
  );

  const openRow = openId != null
    ? (isLeft ? LEFT_MEMBERS.find((r) => r.id === openId) : BAN_MEMBERS.find((r) => r.id === openId))
    : null;
  const detail = openRow
    ? (isLeft ? buildLeftDetail(openRow as LeftMember) : buildBanDetail(openRow as BanMember))
    : null;

  return (
    <div className={styles.page}>
      {detail && <RecordDetailDrawer detail={detail} onClose={() => setOpenId(null)} />}

      <header className={styles.header}>
        <div className={styles.headTitleRow}>
          <span className={styles.headTitle}>{rec.title}</span>
          <span className={styles.headTotal}>{rec.total}</span>
        </div>
        <nav className={styles.viewNav}>
          {rec.views.map((v) => (
            <span key={v.label} className={`${styles.viewBtn} ${v.active ? styles.active : ''}`}>
              {v.label}
              <span className={styles.viewCount}>{formatNumber(v.count)}</span>
            </span>
          ))}
        </nav>
        <div className={styles.spacer} />
        <button type="button" className={styles.exportBtn}>내보내기</button>
      </header>

      <div className={styles.body}>
        <div className={styles.filterZone}>
          <div className={styles.stepLabel}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepTitle}>조건 설정</span>
            <span className={styles.stepHint}>{rec.filterHint}</span>
          </div>

          <div className={styles.conditionBar}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={rec.placeholder}
              />
            </div>
            {rec.filters.map((f) => (
              <button
                key={f.label}
                type="button"
                className={`${styles.filterBtn} ${f.active ? styles.active : ''}`}
                onClick={() => setFilter(f.label)}
              >
                {f.label}
                <span className={styles.filterCount}>{f.count}</span>
              </button>
            ))}
          </div>

          <div className={`${styles.stepLabel} ${styles.step2}`}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepTitle}>{rec.summaryTitle}</span>
            <span className={styles.stepHint}>{rec.summaryHint}</span>
          </div>

          <div className={styles.statsBand}>
            {rec.stats.map((s) => (
              <div className={styles.statCell} key={s.label}>
                <div className={styles.statCellLabel}>{s.label}</div>
                <div className={styles.statCellValueRow}>
                  <span className={styles.statCellValue} style={{ color: s.color }}>{s.value}</span>
                  <span className={styles.statCellUnit}>{s.unit}</span>
                </div>
                <div className={styles.statCellSub}>{s.sub}</div>
              </div>
            ))}
            <div className={styles.ctaCell}>
              <div>
                <div className={styles.statCellLabel}>{rec.ctaLabel}</div>
                <div className={styles.ctaHint}>{rec.ctaHint}</div>
              </div>
              <button type="button" className={styles.ctaButton}>{rec.ctaButton}</button>
            </div>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHead}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepTitle}>{rec.listTitle}</span>
            <span className={styles.tableHeadHint}>{rec.listHint}</span>
            <div className={styles.spacer} />
            <span className={styles.tableHeadResult}>{rec.resultLabel}</span>
          </div>

          <div className={styles.tableScroll}>
            <div className={styles.colHead} style={{ minWidth: rec.minWidth, gridTemplateColumns: rec.grid }}>
              {rec.cols.map((c) => (
                <span key={c.label} style={{ textAlign: c.align }}>{c.label}</span>
              ))}
            </div>
            <div>
              {rec.rows.map((r) => (
                <div
                  key={r.raw.id}
                  className={styles.row}
                  style={{
                    minWidth: rec.minWidth,
                    gridTemplateColumns: rec.grid,
                    background: openId === r.raw.id ? '#f8fafc' : 'transparent',
                  }}
                  onClick={() => setOpenId(openId === r.raw.id ? null : r.raw.id)}
                >
                  {r.cells.map((c, i) => (
                    <div className={styles.cellWrap} style={{ textAlign: c.align }} key={i}>
                      <span
                        className={styles.cellText}
                        style={{
                          background: c.pill?.bg,
                          color: c.pill?.fg ?? c.color,
                          padding: c.pill ? '2px 8px' : 0,
                          fontSize: c.pill ? '11px' : c.size,
                          fontWeight: c.pill ? 600 : c.weight,
                        }}
                      >
                        {c.text}
                      </span>
                      {c.sub && <span className={styles.cellSub}>{c.sub}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.pager}>
            <span className={styles.rangeLabel}>{rec.rangeLabel}</span>
            <div className={styles.pageButtons}>
              {PAGE_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`${styles.pageBtn} ${String(page) === label ? styles.active : ''}`}
                  onClick={() => {
                    const p = parseInt(label, 10);
                    if (p) setPage(p);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
