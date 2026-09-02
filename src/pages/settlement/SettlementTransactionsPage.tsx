import { useMemo, useState } from 'react';
import styles from './settlementShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import { useSettlementDrawer } from './useSettlementDrawer';
import { flattenTx } from './settlementData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = [
  'minmax(96px, 1.05fr)',
  'minmax(64px, .7fr)',
  'minmax(96px, 1fr)',
  'minmax(140px, 1.55fr)',
  'minmax(80px, .85fr)',
  'minmax(112px, 1.15fr)',
  'minmax(128px, 1.3fr)',
  'minmax(64px, .7fr)',
].join(' ');
const GRID_COLUMNS: GridColumn[] = [
  { label: '거래번호' },
  { label: '유형' },
  { label: '정산번호' },
  { label: '정산대상' },
  { label: '거래일' },
  { label: '거래금액', align: 'right' },
  { label: '정산반영금액', align: 'right' },
  { label: '상태' },
];

const TYPE_FILTERS = ['전체', '주문', '환불'] as const;

export function SettlementTransactionsPage() {
  const {
    settlements, selected, activeTab, setActiveTab, showHoldPanel,
    openDetail, closeDetail, toggleHoldPanel, confirmSettle, requestPay, retryPay, resume, confirmHold,
  } = useSettlementDrawer();

  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>('전체');
  const [q, setQ] = useState('');
  const [target, setTarget] = useState('전체');
  const [status, setStatus] = useState('전체');
  const [month, setMonth] = useState('전체');
  const [page, setPage] = useState('1');

  const all = useMemo(() => flattenTx(settlements), [settlements]);
  const targetOptions = useMemo(() => ['전체', ...new Set(all.map((item) => item.target))], [all]);
  const statusOptions = useMemo(() => ['전체', ...new Set(all.map((item) => item.status))], [all]);
  const monthOptions = useMemo(() => ['전체', ...new Set(all.map((item) => item.date.slice(0, 2) + '월'))], [all]);
  const filtered = useMemo(
    () =>
      all.filter((t) => {
        if (type !== '전체' && t.type !== type) return false;
        if (q && !(t.orderId.includes(q) || t.settlementId.includes(q) || t.target.includes(q))) return false;
        if (target !== '전체' && t.target !== target) return false;
        if (status !== '전체' && t.status !== status) return false;
        if (month !== '전체' && `${t.date.slice(0, 2)}월` !== month) return false;
        return true;
      }),
    [all, type, q, target, status, month],
  );
  const hasActiveFilters = type !== '전체' || q !== '' || target !== '전체' || status !== '전체' || month !== '전체';
  const resetFilters = () => { setType('전체'); setQ(''); setTarget('전체'); setStatus('전체'); setMonth('전체'); };

  const rows: GridRow[] = filtered.map((t, i) => ({
    id: `${t.settlementId}-${t.orderId}-${i}`,
    onClick: () => openDetail(t.settlementId),
    cells: [
      { kind: 'text', text: t.orderId, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
      { kind: 'badge', text: t.type, bg: t.type === '환불' ? '#fef2f2' : '#f4f4f5', fg: t.type === '환불' ? '#b91c1c' : '#52525b' },
      { kind: 'text', text: t.settlementId, color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: t.target, color: '#18181b', size: '12.5px', weight: 600 },
      { kind: 'text', text: t.date, color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: t.amount, color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
      { kind: 'text', text: t.reflected, color: t.fg, size: '12px', weight: 600, align: 'right', numeric: true },
      { kind: 'text', text: t.status, color: t.fg, size: '11.5px', weight: 500 },
    ],
  }));

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>정산 거래 내역</div>
        <div className={styles.subtitle}>모든 정산에 반영된 거래를 한 곳에서 조회합니다.</div>

        <div className={styles.quickFilters}>
          {TYPE_FILTERS.map((k) => {
            const active = type === k;
            return (
              <button
                key={k}
                type="button"
                className={styles.qfBtn}
                style={{ borderColor: active ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: active ? 'var(--accent)' : '#fff' }}
                onClick={() => setType(k)}
              >
                <span className={styles.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{k}</span>
                <span className={styles.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>
                  {k === '전체' ? all.length : all.filter((t) => t.type === k).length}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="거래번호, 정산번호 또는 정산대상"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>정산대상</span>
              <select className={styles.selectXs} value={target} onChange={(event) => setTarget(event.target.value)}>
                {targetOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>반영상태</span>
              <select className={styles.selectXs} value={status} onChange={(event) => setStatus(event.target.value)}>
                {statusOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>거래월</span>
              <select className={styles.selectXs} value={month} onChange={(event) => setMonth(event.target.value)}>
                {monthOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <div className={styles.rowSpacer} />
            {hasActiveFilters && <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>}
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="800px"
          showPagination
          pages={['1', '2'].map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="조회되는 정산 거래 내역이 없습니다."
        />
      </div>

      {selected && (
        <SettlementDetailDrawer
          settlement={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={closeDetail}
          showHoldPanel={showHoldPanel}
          onToggleHoldPanel={toggleHoldPanel}
          onConfirmSettle={confirmSettle}
          onRequestPay={requestPay}
          onRetryPay={retryPay}
          onResume={resume}
          onConfirmHold={confirmHold}
        />
      )}
    </div>
  );
}
