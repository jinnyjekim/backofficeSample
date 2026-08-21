import { useMemo, useState } from 'react';
import styles from './SettlementPage.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { SettlementDetailDrawer } from './SettlementDetailDrawer';
import {
  buildCounts,
  calcFinal,
  filterSettlements,
  fmt,
  FILTER_KEYS,
  SETTLEMENTS,
  STATUS_META,
  type Settlement,
} from './settlementData';

const GRID_TEMPLATE = '88px 1fr 1fr 100px 96px 96px 84px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '정산번호' },
  { label: '정산대상' },
  { label: '정산기간' },
  { label: '정산금액', align: 'right' },
  { label: '상태' },
  { label: '이슈' },
  { label: '지급예정' },
  { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

export function SettlementPage() {
  const [settlements, setSettlements] = useState<Settlement[]>(SETTLEMENTS);
  const [filter, setFilter] = useState<string>('정산대기');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showHoldPanel, setShowHoldPanel] = useState(false);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => buildCounts(settlements), [settlements]);
  const filtered = useMemo(() => filterSettlements(settlements, filter, q), [settlements, filter, q]);
  const selected = selectedId ? settlements.find((r) => r.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowHoldPanel(false);
  }

  function updateSettlement(id: string, updater: (r: Settlement) => Settlement) {
    setSettlements((prev) => prev.map((r) => (r.id === id ? updater(r) : r)));
  }

  function confirmSettle() {
    if (!selected) return;
    const final = calcFinal(selected);
    updateSettlement(selected.id, (r) => ({
      ...r,
      status: '정산확정',
      history: [...r.history, { when: '방금', title: '정산 확정', detail: fmt(final), by: 'admin01' }],
    }));
  }

  function requestPay() {
    if (!selected) return;
    const final = calcFinal(selected);
    updateSettlement(selected.id, (r) => ({
      ...r,
      status: '지급완료',
      payAt: '방금',
      history: [
        ...r.history,
        { when: '방금', title: '지급 요청', by: 'admin01' },
        { when: '방금', title: '지급 완료', detail: fmt(final), by: 'system' },
      ],
    }));
  }

  function retryPay() {
    if (!selected) return;
    const final = calcFinal(selected);
    updateSettlement(selected.id, (r) => ({
      ...r,
      status: '지급완료',
      history: [...r.history, { when: '방금', title: '지급 재시도 · 완료', detail: fmt(final), by: 'system' }],
    }));
  }

  function resume() {
    if (!selected) return;
    updateSettlement(selected.id, (r) => ({
      ...r,
      status: '정산대기',
      warn: null,
      history: [...r.history, { when: '방금', title: '보류 해제', by: 'admin01' }],
    }));
  }

  function confirmHold() {
    if (!selected) return;
    updateSettlement(selected.id, (r) => ({
      ...r,
      status: '보류',
      warn: '거래 데이터 확인 필요',
      history: [...r.history, { when: '방금', title: '정산 보류', detail: '거래 데이터 확인 필요', by: 'admin01' }],
    }));
    setShowHoldPanel(false);
  }

  const rows: GridRow[] = filtered.map((r) => {
    const sm = STATUS_META[r.status];
    const final = calcFinal(r);
    return {
      id: r.id,
      onClick: () => openDetail(r.id),
      cells: [
        { kind: 'text', text: r.id, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
        { kind: 'text', text: r.target, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: r.period, color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'text', text: fmt(final), color: '#18181b', size: '12.5px', weight: 700, align: 'right', numeric: true },
        { kind: 'badge', text: r.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: r.warn ? `⚠ ${r.warn}` : '-', color: r.warn ? '#d97706' : '#a1a1aa', size: '11.5px', weight: 500 },
        { kind: 'text', text: r.due, color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>정산 관리</div>
        <div className={styles.subtitle}>정산 대상별 정산 금액을 확정하고 지급 상태를 관리합니다.</div>

        <div className={styles.quickFilters}>
          {FILTER_KEYS.map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                type="button"
                className={styles.qfBtn}
                style={{ borderColor: active ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: active ? 'var(--accent)' : '#fff' }}
                onClick={() => setFilter(k)}
              >
                <span className={styles.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{k}</span>
                <span className={styles.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[k] || 0}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <select className={styles.selectSm} defaultValue="전체">
              <option>전체</option>
              <option>정산번호</option>
              <option>대상ID</option>
              <option>대상명</option>
            </select>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="정산번호 또는 대상명"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <select className={styles.selectXs} defaultValue="정산대상 전체">
              <option>정산대상 전체</option>
              <option>대상 001</option>
              <option>대상 002</option>
            </select>
            <button type="button" className={styles.detailFilterBtn}>상세 필터 ＋</button>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
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
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1120px"
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="정산 대상 내역이 없습니다."
        />
      </div>

      {selected && (
        <SettlementDetailDrawer
          settlement={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          showHoldPanel={showHoldPanel}
          onToggleHoldPanel={() => setShowHoldPanel((v) => !v)}
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
