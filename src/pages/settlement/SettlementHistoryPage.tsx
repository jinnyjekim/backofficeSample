import { useMemo, useState } from 'react';
import styles from './settlementShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import { useSettlementDrawer } from './useSettlementDrawer';
import { flattenHistory } from './settlementData';

const GRID_TEMPLATE = '108px 1fr 1.6fr 1.6fr 84px 132px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '정산번호' },
  { label: '정산대상' },
  { label: '처리 내용' },
  { label: '상세' },
  { label: '처리자' },
  { label: '처리일시' },
];

export function SettlementHistoryPage() {
  const {
    settlements, selected, activeTab, setActiveTab, showHoldPanel,
    openDetail, closeDetail, toggleHoldPanel, confirmSettle, requestPay, retryPay, resume, confirmHold,
  } = useSettlementDrawer();

  const [q, setQ] = useState('');
  const [page, setPage] = useState('1');

  const all = useMemo(() => flattenHistory(settlements), [settlements]);
  const filtered = useMemo(
    () => all.filter((h) => !q || h.settlementId.includes(q) || h.target.includes(q) || h.title.includes(q)),
    [all, q],
  );

  const rows: GridRow[] = filtered.map((h, i) => ({
    id: `${h.settlementId}-${i}`,
    onClick: () => openDetail(h.settlementId),
    cells: [
      { kind: 'text', text: h.settlementId, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
      { kind: 'text', text: h.target, color: '#18181b', size: '12.5px', weight: 600 },
      { kind: 'text', text: h.title, color: '#3f3f46', size: '12px', weight: 600 },
      { kind: 'text', text: h.detail ?? '-', color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'text', text: h.by ?? '-', color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'text', text: h.when, color: '#a1a1aa', size: '11px', weight: 500, numeric: true },
    ],
  }));

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>정산 이력</div>
        <div className={styles.subtitle}>정산 생성부터 지급 완료까지 모든 처리 이력을 시간순으로 조회합니다.</div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="정산번호, 정산대상 또는 처리 내용"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
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
          minWidth="1080px"
          showPagination
          pages={['1', '2'].map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="정산 처리 이력이 없습니다."
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
