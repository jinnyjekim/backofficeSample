import { useMemo, useState } from 'react';
import styles from './settlementShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import { useSettlementDrawer } from './useSettlementDrawer';
import { flattenTx } from './settlementData';

const GRID_TEMPLATE = '112px 66px 108px 1fr 72px 116px 116px 76px 70px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '거래번호' },
  { label: '유형' },
  { label: '정산번호' },
  { label: '정산대상' },
  { label: '거래일' },
  { label: '거래금액', align: 'right' },
  { label: '정산반영금액', align: 'right' },
  { label: '상태' },
  { label: '관리' },
];

const TYPE_FILTERS = ['전체', '주문', '환불'] as const;

export function SettlementTransactionsPage() {
  const {
    settlements, selected, activeTab, setActiveTab, showHoldPanel,
    openDetail, closeDetail, toggleHoldPanel, confirmSettle, requestPay, retryPay, resume, confirmHold,
  } = useSettlementDrawer();

  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>('전체');
  const [q, setQ] = useState('');
  const [page, setPage] = useState('1');

  const all = useMemo(() => flattenTx(settlements), [settlements]);
  const filtered = useMemo(
    () =>
      all.filter((t) => {
        if (type !== '전체' && t.type !== type) return false;
        if (q && !(t.orderId.includes(q) || t.settlementId.includes(q) || t.target.includes(q))) return false;
        return true;
      }),
    [all, type, q],
  );

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
      { kind: 'link', text: '정산보기', size: '12px' },
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
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn} data-grid-download>↓ 다운로드</button>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1080px"
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
