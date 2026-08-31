import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { OutboundCompleteDetailDrawer } from './OutboundCompleteDetailDrawer';
import { quickFilterStyle } from './deliverySharedData';
import {
  buildOutboundCounts,
  calcOutbound,
  filterOutboundShipments,
  OUTBOUND_FILTER_KEYS,
  OUTBOUND_FILTER_LABEL,
  OUTBOUND_SHIPMENTS,
  SHIP_META,
  type OutboundShipment,
} from './outboundCompleteData';

const GRID_TEMPLATE = '96px 88px 1fr 74px 88px 96px 108px 78px 88px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '배송번호' }, { label: '주문번호' }, { label: '배송상품' }, { label: '출고수량' }, { label: '택배사' },
  { label: '송장' }, { label: '실제출고' }, { label: '집하' }, { label: '배송상태' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

export function OutboundCompletePage() {
  const [shipments, setShipments] = useState<OutboundShipment[]>(OUTBOUND_SHIPMENTS);
  const [filter, setFilter] = useState<string>('오늘출고');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showCancelPanel, setShowCancelPanel] = useState(false);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => buildOutboundCounts(shipments), [shipments]);
  const filtered = useMemo(() => filterOutboundShipments(shipments, filter, q), [shipments, filter, q]);
  const selected = selectedId ? shipments.find((sh) => sh.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowCancelPanel(false);
  }

  function updateShipment(id: string, updater: (sh: OutboundShipment) => OutboundShipment) {
    setShipments((prev) => prev.map((sh) => (sh.id === id ? updater(sh) : sh)));
  }

  const rows: GridRow[] = filtered.map((sh) => {
    const sm = SHIP_META[sh.shipStatus];
    const c = calcOutbound(sh);
    const itemsLabel = sh.items.length > 1 ? `${sh.items[0].name} 외 ${sh.items.length - 1}` : sh.items[0].name;
    const outQty = sh.items.reduce((a, it) => a + it.actual, 0);
    return {
      id: sh.id,
      onClick: () => openDetail(sh.id),
      cells: [
        { kind: 'text', text: sh.id, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: sh.order, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: itemsLabel, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: String(outQty), color: '#18181b', size: '12.5px', weight: 700, numeric: true },
        { kind: 'text', text: sh.carrier, color: '#71717a', size: '11.5px', weight: 500 },
        { kind: 'text', text: sh.invoiceNo, color: '#3f3f46', size: '11.5px', weight: 500 },
        { kind: 'text', text: sh.actualDate.slice(5), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'text', text: sh.pickup === '완료' ? '완료' : '대기', color: sh.pickup === '완료' ? '#059669' : c.pickupDelay ? '#dc2626' : '#d97706', size: '11.5px', weight: 600 },
        { kind: 'badge', text: sh.shipStatus, bg: sm.bg, fg: sm.fg },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>출고 완료</div>
        <div className={styles.subtitle}>실제 출고된 배송 건과 배송사 인계 상태를 조회합니다.</div>

        <div className={styles.quickFilters}>
          {OUTBOUND_FILTER_KEYS.map((k) => {
            const active = filter === k;
            const st = quickFilterStyle(active);
            return (
              <button key={k} type="button" className={styles.qfBtn} style={{ borderColor: st.border, background: st.bg }} onClick={() => setFilter(k)}>
                <span className={styles.qfLabel} style={{ color: st.fg }}>{OUTBOUND_FILTER_LABEL[k]}</span>
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
            </select></label>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="배송번호 · 주문번호 · 송장번호" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>배송상태</span><select aria-label="배송상태" className={styles.selectXs} defaultValue="배송상태 전체">
              <option>배송상태 전체</option>
              <option>집하대기</option>
              <option>배송중</option>
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
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('오늘출고'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건`}</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.actionBtn}>배송상태 조회</button>
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
          minWidth="1300px"
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="오늘 완료된 출고 건이 없습니다."
        />
      </div>

      {selected && (
        <OutboundCompleteDetailDrawer
          shipment={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          showCancelPanel={showCancelPanel}
          onToggleCancelPanel={() => setShowCancelPanel((v) => !v)}
          onUpdate={(updater) => updateShipment(selected.id, updater)}
          onConfirmedCancel={() => setShowCancelPanel(false)}
        />
      )}
    </div>
  );
}
