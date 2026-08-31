import { useMemo, useState } from 'react';
import styles from './settlementShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import { useSettlementDrawer } from './useSettlementDrawer';
import { buildSettlementRows, SETTLEMENT_GRID_COLUMNS, SETTLEMENT_GRID_MIN_WIDTH, SETTLEMENT_GRID_TEMPLATE } from './settlementGrid';
import {
  buildMainQuickCounts, EMPTY_FILTERS, filterSettlements, MAIN_QUICK_FILTERS, uniqueAssignees, uniqueTargets,
  type PayStatus, type SettleStatus, type SettlementFilters,
} from './settlementData';

const PAGE_LABELS = ['1', '2'];
const SETTLE_STATUS_OPTIONS: (SettleStatus | '전체')[] = ['전체', '정산대기', '검토중', '정산확정', '보류'];
const PAY_STATUS_OPTIONS: (PayStatus | '전체')[] = ['전체', '지급전', '지급예정', '지급완료', '지급실패', '지급보류'];

export function SettlementPage() {
  const {
    settlements, selected, activeTab, setActiveTab, showHoldPanel,
    openDetail, closeDetail, toggleHoldPanel, confirmSettle, requestPay, retryPay, resume, confirmHold,
  } = useSettlementDrawer();

  const [filters, setFilters] = useState<SettlementFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState('1');

  const targetOptions = useMemo(() => ['전체', ...uniqueTargets(settlements)], [settlements]);
  const assigneeOptions = useMemo(() => ['전체', ...uniqueAssignees(settlements)], [settlements]);

  const counts = useMemo(() => buildMainQuickCounts(settlements), [settlements]);
  const filtered = useMemo(() => filterSettlements(settlements, filters), [settlements, filters]);
  const rows = useMemo(() => buildSettlementRows(filtered, openDetail), [filtered, openDetail]);

  function setField<K extends keyof SettlementFilters>(key: K, value: SettlementFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }
  const hasActiveFilters = filters.quick !== '전체' || filters.q !== '' || filters.settleStatus !== '전체'
    || filters.payStatus !== '전체' || filters.target !== '전체' || filters.assignee !== '전체';

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>정산 목록</div>
        <div className={styles.subtitle}>정산 대상별 거래를 모아 최종 정산금액과 지급 상태를 관리합니다.</div>

        <div className={styles.quickFilters}>
          {MAIN_QUICK_FILTERS.map((k) => {
            const active = filters.quick === k;
            return (
              <button
                key={k}
                type="button"
                className={styles.qfBtn}
                style={{ borderColor: active ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: active ? 'var(--accent)' : '#fff' }}
                onClick={() => setField('quick', k)}
              >
                <span className={styles.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{k}</span>
                <span className={styles.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[k] || 0}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={filters.q}
              onChange={(e) => setField('q', e.target.value)}
              placeholder="정산번호, 회사명 또는 사업자번호로 검색"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>정산상태</span>
              <select className={styles.selectXs} value={filters.settleStatus} onChange={(e) => setField('settleStatus', e.target.value as SettleStatus | '전체')}>
                {SETTLE_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>지급상태</span>
              <select className={styles.selectXs} value={filters.payStatus} onChange={(e) => setField('payStatus', e.target.value as PayStatus | '전체')}>
                {PAY_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>정산대상</span>
              <select className={styles.selectXs} value={filters.target} onChange={(e) => setField('target', e.target.value)}>
                {targetOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>담당자</span>
              <select className={styles.selectXs} value={filters.assignee} onChange={(e) => setField('assignee', e.target.value)}>
                {assigneeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <div className={styles.rowSpacer} />
            {hasActiveFilters && (
              <button type="button" className={styles.resetBtn} onClick={() => setFilters(EMPTY_FILTERS)}>초기화</button>
            )}
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={SETTLEMENT_GRID_COLUMNS}
          rows={rows}
          gridTemplate={SETTLEMENT_GRID_TEMPLATE}
          minWidth={SETTLEMENT_GRID_MIN_WIDTH}
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="등록된 정산 내역이 없습니다."
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
