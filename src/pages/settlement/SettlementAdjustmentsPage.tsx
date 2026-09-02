import { useMemo, useState } from 'react';
import styles from './settlementShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import { useSettlementDrawer } from './useSettlementDrawer';
import { flattenAdjustments, signed } from './settlementData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = '76px 1fr 96px 1.4fr 62px 110px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '정산번호' },
  { label: '정산대상' },
  { label: '조정금액', align: 'right' },
  { label: '조정 사유' },
  { label: '처리자' },
  { label: '처리일시' },
];
const DIRECTION_FILTERS = ['전체', '가산', '차감'] as const;

export function SettlementAdjustmentsPage() {
  const {
    settlements, selected, activeTab, setActiveTab, showHoldPanel,
    openDetail, closeDetail, toggleHoldPanel, confirmSettle, requestPay, retryPay, resume, confirmHold,
  } = useSettlementDrawer();

  const [q, setQ] = useState('');
  const [direction, setDirection] = useState<(typeof DIRECTION_FILTERS)[number]>('전체');
  const [target, setTarget] = useState('전체');
  const [actor, setActor] = useState('전체');
  const [month, setMonth] = useState('전체');
  const [page, setPage] = useState('1');

  const all = useMemo(() => flattenAdjustments(settlements), [settlements]);
  const targetOptions = useMemo(() => ['전체', ...new Set(all.map((item) => item.target))], [all]);
  const actorOptions = useMemo(() => ['전체', ...new Set(all.map((item) => item.by))], [all]);
  const monthOptions = useMemo(() => ['전체', ...new Set(all.map((item) => `${item.when.slice(5, 7)}월`))], [all]);
  const filtered = useMemo(
    () => all.filter((a) => {
      if (q && !(a.settlementId.includes(q) || a.target.includes(q) || a.reason.includes(q))) return false;
      if (direction === '가산' && a.amount <= 0) return false;
      if (direction === '차감' && a.amount >= 0) return false;
      if (target !== '전체' && a.target !== target) return false;
      if (actor !== '전체' && a.by !== actor) return false;
      if (month !== '전체' && `${a.when.slice(5, 7)}월` !== month) return false;
      return true;
    }),
    [all, q, direction, target, actor, month],
  );
  const netTotal = filtered.reduce((sum, a) => sum + a.amount, 0);
  const hasActiveFilters = direction !== '전체' || q !== '' || target !== '전체' || actor !== '전체' || month !== '전체';
  const resetFilters = () => { setDirection('전체'); setQ(''); setTarget('전체'); setActor('전체'); setMonth('전체'); };

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

        <div className={styles.quickFilters}>
          {DIRECTION_FILTERS.map((filter) => {
            const active = direction === filter;
            const count = filter === '전체' ? all.length : all.filter((item) => filter === '가산' ? item.amount > 0 : item.amount < 0).length;
            return (
              <CommonButton
                key={filter}
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${active ? styles.active : ''}`}
                onClick={() => setDirection(filter)}
              >
                <span className={styles.qfLabel}>{filter}</span>
                <span className={styles.qfCount}>{count}</span>
              </CommonButton>
            );
          })}
        </div>

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
          <div className={styles.filterRow2}>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>정산대상</span>
              <select className={styles.selectXs} value={target} onChange={(event) => setTarget(event.target.value)}>
                {targetOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>처리자</span>
              <select className={styles.selectXs} value={actor} onChange={(event) => setActor(event.target.value)}>
                {actorOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>처리월</span>
              <select className={styles.selectXs} value={month} onChange={(event) => setMonth(event.target.value)}>
                {monthOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <div className={styles.rowSpacer} />
            {hasActiveFilters && <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>}
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>
            총 {filtered.length}건 · 순 조정 {signed(netTotal)}
          </span>
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
          minWidth="850px"
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
