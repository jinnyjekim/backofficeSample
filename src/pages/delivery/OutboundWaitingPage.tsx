import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { OutboundWaitingDetailDrawer } from './OutboundWaitingDetailDrawer';
import { quickFilterStyle } from './deliverySharedData';
import {
  buildWaitingCounts,
  calcWaiting,
  filterWaitingShipments,
  STATUS_META,
  WAITING_FILTER_KEYS,
  WAITING_FILTER_LABEL,
  WAITING_SHIPMENTS,
  type WaitingShipment,
} from './outboundWaitingData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '82px 66px 1fr 58px 60px 84px 52px 72px 88px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '배송번호' }, { label: '주문번호' }, { label: '배송상품' }, { label: '수령인' }, { label: '택배사' },
  { label: '송장번호' }, { label: '출고예정' }, { label: '상태' }, { label: '이슈' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

export function OutboundWaitingPage() {
  const [shipments, setShipments] = useState<WaitingShipment[]>(WAITING_SHIPMENTS);
  const [filter, setFilter] = useState<string>('오늘출고');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showHoldPanel, setShowHoldPanel] = useState(false);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => buildWaitingCounts(shipments), [shipments]);
  const filtered = useMemo(() => filterWaitingShipments(shipments, filter, q), [shipments, filter, q]);
  const selected = selectedId ? shipments.find((sh) => sh.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowHoldPanel(false);
  }

  function updateShipment(id: string, updater: (sh: WaitingShipment) => WaitingShipment) {
    setShipments((prev) => prev.map((sh) => (sh.id === id ? updater(sh) : sh)));
  }

  const rows: GridRow[] = filtered.map((sh) => {
    const sm = STATUS_META[sh.status];
    const c = calcWaiting(sh);
    const itemsLabel = sh.items.length > 1 ? `${sh.items[0].name} 외 ${sh.items.length - 1}` : sh.items[0].name;
    const dueLabel = sh.dueDate === '2026.08.20' ? '오늘' : c.overdue ? sh.dueDate.slice(5) + ' 지연' : sh.dueDate.slice(5);
    return {
      id: sh.id,
      onClick: () => openDetail(sh.id),
      cells: [
        { kind: 'text', text: sh.id, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: sh.order, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: itemsLabel, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: sh.receiver, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: sh.carrier, color: sh.carrier === '미지정' ? '#dc2626' : '#71717a', size: '11.5px', weight: 500 },
        { kind: 'text', text: sh.invoiceNo || '미등록', color: sh.invoiceNo ? '#3f3f46' : '#dc2626', size: '11.5px', weight: 500 },
        { kind: 'text', text: dueLabel, color: c.overdue ? '#dc2626' : '#71717a', size: '11.5px', weight: 600, numeric: true },
        { kind: 'badge', text: sh.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: c.issues.length ? `⚠ ${c.issues[0]}${c.issues.length > 1 ? ' 외 ' + (c.issues.length - 1) : ''}` : '-', color: c.issues.length ? '#d97706' : '#a1a1aa', size: '11.5px', weight: 500 },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>출고 대기</div>
        <div className={styles.subtitle}>배송 준비가 완료된 건의 출고 일정과 출고 처리를 관리합니다.</div>

        <div className={styles.quickFilters}>
          {WAITING_FILTER_KEYS.map((k) => {
            const active = filter === k;
            const st = quickFilterStyle(active);
            return (
              <button key={k} type="button" className={styles.qfBtn} style={{ borderColor: st.border, background: st.bg }} onClick={() => setFilter(k)}>
                <span className={styles.qfLabel} style={{ color: st.fg }}>{WAITING_FILTER_LABEL[k]}</span>
                <span className={styles.qfCount} style={{ color: st.fg }}>{counts[k] || 0}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm} defaultValue="전체">
              <option>전체</option>
              <option>배송번호</option>
              <option>주문번호</option>
              <option>송장번호</option>
              <option>수령인</option>
            </select></label>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="배송번호 · 주문번호 · 송장번호" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>출고지</span><select aria-label="출고지" className={styles.selectXs} defaultValue="출고지 전체">
              <option>출고지 전체</option>
              <option>출고지 01</option>
              <option>출고지 02</option>
            </select></label>
            <label className="globalFilterField"><span>택배사</span><select aria-label="택배사" className={styles.selectXs} defaultValue="택배사 전체">
              <option>택배사 전체</option>
              <option>택배사 01</option>
              <option>택배사 02</option>
            </select></label>
            <label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={styles.selectXs} defaultValue="담당자 전체">
              <option>담당자 전체</option>
              <option>admin01</option>
              <option>admin02</option>
            </select></label>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('오늘출고'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건`}</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.actionBtn}>출고 확정</button>
            <button type="button" className={styles.actionBtn}>담당자 지정</button>
            <button type="button" className={styles.actionBtn}>출고일 변경</button>
            <ExcelDownloadButton type="button" data-grid-download />
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
          minWidth="1140px"
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="현재 출고 대기 중인 배송 건이 없습니다."
        />
      </div>

      {selected && (
        <OutboundWaitingDetailDrawer
          shipment={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          showHoldPanel={showHoldPanel}
          onToggleHoldPanel={() => setShowHoldPanel((v) => !v)}
          onUpdate={(updater) => updateShipment(selected.id, updater)}
          onConfirmedHold={() => setShowHoldPanel(false)}
        />
      )}
    </div>
  );
}
