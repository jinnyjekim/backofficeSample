import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DeliveryPrepDetailDrawer } from './DeliveryPrepDetailDrawer';
import { quickFilterStyle } from './deliverySharedData';
import {
  buildPrepCounts,
  calcPrep,
  filterPrepShipments,
  PREP_FILTER_KEYS,
  PREP_SHIPMENTS,
  STATUS_META,
  type PrepShipment,
} from './deliveryPrepData';

const GRID_TEMPLATE = '96px 1fr 84px 1fr 84px 84px 84px 84px 96px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '주문번호' }, { label: '주문상품' }, { label: '수령인' }, { label: '배송지' },
  { label: '상품준비' }, { label: '송장' }, { label: '출고예정' }, { label: '상태' }, { label: '이슈' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

export function DeliveryPrepPage() {
  const [shipments, setShipments] = useState<PrepShipment[]>(PREP_SHIPMENTS);
  const [filter, setFilter] = useState<string>('준비필요');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showHoldPanel, setShowHoldPanel] = useState(false);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => buildPrepCounts(shipments), [shipments]);
  const filtered = useMemo(() => filterPrepShipments(shipments, filter, q), [shipments, filter, q]);
  const selected = selectedId ? shipments.find((sh) => sh.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowHoldPanel(false);
  }

  function updateShipment(id: string, updater: (sh: PrepShipment) => PrepShipment) {
    setShipments((prev) => prev.map((sh) => (sh.id === id ? updater(sh) : sh)));
  }

  const rows: GridRow[] = filtered.map((sh) => {
    const sm = STATUS_META[sh.status];
    const c = calcPrep(sh);
    const productLabel = sh.items.length > 1 ? `${sh.items[0].name} 외 ${sh.items.length - 1}` : sh.items[0].name;
    const readyQty = sh.items.reduce((a, it) => a + it.ready, 0);
    const totalQty = sh.items.reduce((a, it) => a + it.qty, 0);
    return {
      id: sh.id,
      onClick: () => openDetail(sh.id),
      cells: [
        { kind: 'text', text: sh.order, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: productLabel, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: sh.receiver, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: sh.address, color: '#71717a', size: '11.5px', weight: 500 },
        { kind: 'text', text: `${readyQty}/${totalQty}`, color: readyQty < totalQty ? '#d97706' : '#3f3f46', size: '12px', weight: 600, numeric: true },
        { kind: 'text', text: sh.invoiceNo ? '등록' : '미등록', color: sh.invoiceNo ? '#059669' : '#a1a1aa', size: '11.5px', weight: 500 },
        { kind: 'text', text: sh.dueDate.slice(5), color: c.overdue ? '#dc2626' : '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'badge', text: sh.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: c.issues.length ? `⚠ ${c.issues[0]}${c.issues.length > 1 ? ' 외 ' + (c.issues.length - 1) : ''}` : '-', color: c.issues.length ? '#d97706' : '#a1a1aa', size: '11.5px', weight: 500 },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>배송 준비</div>
        <div className={styles.subtitle}>출고 전 주문의 상품 준비와 배송 정보를 관리합니다.</div>

        <div className={styles.quickFilters}>
          {PREP_FILTER_KEYS.map((k) => {
            const active = filter === k;
            const st = quickFilterStyle(active);
            return (
              <button key={k} type="button" className={styles.qfBtn} style={{ borderColor: st.border, background: st.bg }} onClick={() => setFilter(k)}>
                <span className={styles.qfLabel} style={{ color: st.fg }}>{k}</span>
                <span className={styles.qfCount} style={{ color: st.fg }}>{counts[k] || 0}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm} defaultValue="전체">
              <option>전체</option>
              <option>주문번호</option>
              <option>수령인</option>
              <option>상품명</option>
              <option>송장번호</option>
            </select></label>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="주문번호 · 수령인 · 상품명" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>배송방식</span><select aria-label="배송방식" className={styles.selectXs} defaultValue="배송방식 전체">
              <option>배송방식 전체</option>
              <option>택배</option>
              <option>직접배송</option>
              <option>방문수령</option>
            </select></label>
            <label className="globalFilterField"><span>택배사</span><select aria-label="택배사" className={styles.selectXs} defaultValue="택배사 전체">
              <option>택배사 전체</option>
              <option>택배사 01</option>
              <option>택배사 02</option>
            </select></label>
            <label className="globalFilterField"><span>출고지</span><select aria-label="출고지" className={styles.selectXs} defaultValue="출고지 전체">
              <option>출고지 전체</option>
              <option>출고지 01</option>
              <option>출고지 02</option>
            </select></label>
            <button type="button" className={styles.detailFilterBtn}>상세 필터 ＋</button>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('준비필요'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건`}</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.actionBtn}>담당자 지정</button>
            <button type="button" className={styles.actionBtn}>택배사 지정</button>
            <button type="button" className={styles.actionBtn}>송장 등록</button>
            <button type="button" className={styles.actionBtn} data-grid-download>↓ 다운로드</button>
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
          minWidth="1280px"
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="현재 배송 준비가 필요한 주문이 없습니다."
        />
      </div>

      {selected && (
        <DeliveryPrepDetailDrawer
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
