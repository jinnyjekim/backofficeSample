import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { InTransitDetailDrawer } from './InTransitDetailDrawer';
import { quickFilterStyle } from './deliverySharedData';
import {
  buildTransitCounts,
  calcTransit,
  filterTransitShipments,
  statusMeta,
  TRANSIT_FILTER_KEYS,
  TRANSIT_FILTER_LABEL,
  TRANSIT_SHIPMENTS,
  type TransitShipment,
} from './inTransitData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '82px 66px 72px 62px 92px 88px 100px 52px 170px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '배송번호' }, { label: '주문번호' }, { label: '수령인' }, { label: '택배사' }, { label: '송장' },
  { label: '현재상태' }, { label: '최근위치' }, { label: '예상도착' }, { label: '이슈' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

export function InTransitPage() {
  const [shipments, setShipments] = useState<TransitShipment[]>(TRANSIT_SHIPMENTS);
  const [filter, setFilter] = useState<string>('전체배송중');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [page, setPage] = useState('1');

  const counts = useMemo(() => buildTransitCounts(shipments), [shipments]);
  const filtered = useMemo(() => filterTransitShipments(shipments, filter, q), [shipments, filter, q]);
  const selected = selectedId ? shipments.find((sh) => sh.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
  }

  function updateShipment(id: string, updater: (sh: TransitShipment) => TransitShipment) {
    setShipments((prev) => prev.map((sh) => (sh.id === id ? updater(sh) : sh)));
  }

  const rows: GridRow[] = filtered.map((sh) => {
    const sm = statusMeta(sh.carrierStatus);
    const c = calcTransit(sh);
    return {
      id: sh.id,
      onClick: () => openDetail(sh.id),
      cells: [
        { kind: 'text', text: sh.id, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: sh.order, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: sh.receiver, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: sh.carrier, color: '#71717a', size: '11.5px', weight: 500 },
        { kind: 'text', text: sh.invoiceNo, color: '#3f3f46', size: '11.5px', weight: 500 },
        { kind: 'badge', text: sh.carrierStatus, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: sh.lastLoc, color: '#71717a', size: '11.5px', weight: 500 },
        { kind: 'text', text: sh.eta === '2026.08.20' ? '오늘' : sh.eta.slice(5), color: c.overdue ? '#dc2626' : '#71717a', size: '11.5px', weight: 600, numeric: true },
        { kind: 'text', text: c.issues.length ? `⚠ ${c.issues[0]}${c.issues.length > 1 ? ' 외 ' + (c.issues.length - 1) : ''}` : '-', color: c.issues.length ? '#d97706' : '#a1a1aa', size: '11.5px', weight: 500 },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.title}>배송중</div>
        <div className={styles.subtitle}>출고된 상품의 현재 배송 위치와 진행 상태를 확인합니다.</div>

        <div className={styles.quickFilters}>
          {TRANSIT_FILTER_KEYS.map((k) => {
            const active = filter === k;
            const st = quickFilterStyle(active);
            return (
              <button key={k} type="button" className={styles.qfBtn} style={{ borderColor: st.border, background: st.bg }} onClick={() => setFilter(k)}>
                <span className={styles.qfLabel} style={{ color: st.fg }}>{TRANSIT_FILTER_LABEL[k]}</span>
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
            <label className="globalFilterField"><span>택배사</span><select aria-label="택배사" className={styles.selectXs} defaultValue="택배사 전체">
              <option>택배사 전체</option>
              <option>택배사 01</option>
              <option>택배사 02</option>
            </select></label>
            <label className="globalFilterField"><span>배송지역</span><select aria-label="배송지역" className={styles.selectXs} defaultValue="배송지역 전체">
              <option>배송지역 전체</option>
              <option>서울</option>
              <option>경기</option>
              <option>부산</option>
            </select></label>
            <label className="globalFilterField"><span>출고지</span><select aria-label="출고지" className={styles.selectXs} defaultValue="출고지 전체">
              <option>출고지 전체</option>
              <option>출고지 01</option>
              <option>출고지 02</option>
            </select></label>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체배송중'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건`}</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.actionBtn}>상태 재조회</button>
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
          minWidth="1270px"
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="현재 배송중인 건이 없습니다."
        />
      </div>

      {selected && (
        <InTransitDetailDrawer
          shipment={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          onUpdate={(updater) => updateShipment(selected.id, updater)}
        />
      )}
    </div>
  );
}
