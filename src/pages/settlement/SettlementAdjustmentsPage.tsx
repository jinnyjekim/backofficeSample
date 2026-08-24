import { useMemo, useState } from 'react';
import styles from './settlementShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import { useSettlementDrawer } from './useSettlementDrawer';
import { flattenAdjustments, signed } from './settlementData';

const GRID_TEMPLATE = '108px 1fr 96px 1.4fr 84px 132px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '정산번호' },
  { label: '정산대상' },
  { label: '조정금액', align: 'right' },
  { label: '조정 사유' },
  { label: '처리자' },
  { label: '처리일시' },
];

export function SettlementAdjustmentsPage() {
  const {
    settlements, selected, activeTab, setActiveTab, showHoldPanel,
    openDetail, closeDetail, toggleHoldPanel, confirmSettle, requestPay, retryPay, resume, confirmHold,
  } = useSettlementDrawer();

  const [q, setQ] = useState('');
  const [page, setPage] = useState('1');

  const all = useMemo(() => flattenAdjustments(settlements), [settlements]);
  const filtered = useMemo(
    () => all.filter((a) => !q || a.settlementId.includes(q) || a.target.includes(q) || a.reason.includes(q)),
    [all, q],
  );
  const netTotal = filtered.reduce((sum, a) => sum + a.amount, 0);

  const rows: GridRow[] = filtered.map((a, i) => ({
    id: `${a.settlementId}-${i}`,
    onClick: () => openDetail(a.settlementId),
    cells: [
      { kind: 'text', text: a.settlementId, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
      { kind: 'text', text: a.target, color: '#18181b', size: '12.5px', weight: 600 },
      { kind: 'text', text: signed(a.amount), color: a.amount < 0 ? '#dc2626' : '#059669', size: '12.5px', weight: 700, align: 'right', numeric: true },
      { kind: 'text', text: a.reason, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: a.by, color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'text', text: a.when, color: '#a1a1aa', size: '11px', weight: 500, numeric: true },
    ],
  }));

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>조정 내역</div>
        <div className={styles.subtitle}>정산금액에 반영된 모든 가산·차감 조정을 조회합니다.</div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="정산번호, 정산대상 또는 조정 사유"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>
            총 {filtered.length}건 · 순 조정 {signed(netTotal)}
          </span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="920px"
          showPagination
          pages={['1', '2'].map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="등록된 조정 내역이 없습니다."
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
