import { useMemo, useState } from 'react';
import styles from './deliveryShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DeliveryCompleteDetailDrawer } from './DeliveryCompleteDetailDrawer';
import {
  buildCompleteCounts,
  calcComplete,
  COMPLETE_FILTER_KEYS,
  COMPLETE_FILTER_LABEL,
  COMPLETE_SHIPMENTS,
  filterCompleteShipments,
  fmtDur,
  TYPE_META,
  type CompleteShipment,
} from './deliveryCompleteData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = '96px 66px 56px 62px 84px 116px 62px 84px 34px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '배송번호' }, { label: '주문번호' }, { label: '수령인' }, { label: '택배사' }, { label: '송장' },
  { label: '실제완료' }, { label: '소요일' }, { label: '완료유형' }, { label: '이슈' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

export function DeliveryCompletePage() {
  const [shipments] = useState<CompleteShipment[]>(COMPLETE_SHIPMENTS);
  const [filter, setFilter] = useState<string>('오늘완료');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [page, setPage] = useState('1');

  const counts = useMemo(() => buildCompleteCounts(shipments), [shipments]);
  const filtered = useMemo(() => filterCompleteShipments(shipments, filter, q), [shipments, filter, q]);
  const selected = selectedId ? shipments.find((sh) => sh.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
  }

  const rows: GridRow[] = filtered.map((sh) => {
    const tm = TYPE_META[sh.type];
    const c = calcComplete(sh);
    return {
      id: sh.id,
      onClick: () => openDetail(sh.id),
      cells: [
        { kind: 'text', text: sh.id, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: sh.order, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: sh.receiver, color: '#18181b', size: '12.5px', weight: 600 },
        { kind: 'text', text: sh.carrier, color: '#71717a', size: '11.5px', weight: 500 },
        { kind: 'text', text: sh.invoiceNo, color: '#3f3f46', size: '11.5px', weight: 500 },
        { kind: 'text', text: sh.completedAt, color: '#18181b', size: '11.5px', weight: 600, numeric: true },
        { kind: 'text', text: fmtDur(c.durationH), color: '#71717a', size: '11.5px', weight: 500 },
        { kind: 'badge', text: sh.type + ' 완료', bg: tm.bg, fg: tm.fg },
        { kind: 'text', text: sh.aftercare.length ? `⚠ ${sh.aftercare[0].type}` : '-', color: sh.aftercare.length ? '#d97706' : '#a1a1aa', size: '11.5px', weight: 500 },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>배송 완료</div>
            <div className={styles.subtitle}>완료된 배송의 최종 수령 결과와 사후 이슈를 조회합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {COMPLETE_FILTER_KEYS.map((k) => {
            const active = filter === k;
            return (
              <CommonButton
                key={k}
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${active ? styles.active : ''}`}
                onClick={() => setFilter(k)}
              >
                <span className={styles.qfLabel}>{COMPLETE_FILTER_LABEL[k]}</span>
                <span className={styles.qfCount}>{counts[k] || 0}</span>
              </CommonButton>
            );
          })}
        </div>

        <div className={styles.filterCard}>
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
            <label className="globalFilterField"><span>완료유형</span><select aria-label="완료유형" className={styles.selectXs} defaultValue="완료유형 전체">
              <option>완료유형 전체</option>
              <option>정상 완료</option>
              <option>지연 완료</option>
              <option>부분 완료</option>
            </select></label>
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
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('오늘완료'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>{`총 ${filtered.length}건`}</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1160px"
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="오늘 배송 완료된 건이 없습니다."
        />
      </div>

      {selected && (
        <DeliveryCompleteDetailDrawer
          shipment={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
