import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { DatePicker } from '../../components/forms/DatePicker';
import styles from '../delivery/deliveryShared.module.css';
import { ExchangeDetailDrawer } from './ExchangeDetailDrawer';
import { INITIAL_EXCHANGES, matchesExchangeKeyword } from './exchangeData';

const COLUMNS: GridColumn[] = [{ label: '교환번호' }, { label: '주문번호' }, { label: '고객명' }, { label: '교환상품' }, { label: '반려사유' }, { label: '검수결과' }, { label: '담당자' }, { label: '반려일시' }];

export function ExchangeRejectedPage() {
  const [keyword, setKeyword] = useState(''); const [reason, setReason] = useState(''); const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => INITIAL_EXCHANGES.filter((item) => item.stage === '교환 반려' && (!reason || item.reason.includes(reason) || item.inspection.includes(reason)) && matchesExchangeKeyword(item, keyword)), [keyword, reason]); const selected = INITIAL_EXCHANGES.find((item) => item.id === selectedId) ?? null;
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'text', text: item.id, weight: 600 }, { kind: 'text', text: item.orderId }, { kind: 'text', text: item.member, weight: 600 }, { kind: 'text', text: item.product }, { kind: 'text', text: item.reason, color: '#dc2626' }, { kind: 'badge', text: item.inspection, bg: '#fef2f2', fg: '#dc2626' }, { kind: 'text', text: item.assignee }, { kind: 'text', text: item.rejectedAt ?? item.updatedAt, numeric: true }] }));
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>교환 반려</div>
            <div className={styles.subtitle}>교환 조건 미충족 또는 검수 불합격으로 반려된 건과 사유를 조회합니다.</div>
          </div>
        </div>
        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            
            <input className={styles.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="교환번호 / 주문번호 / 고객명 / 상품명"/>
            <button className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>반려 구분</span><select className={styles.selectSm} value={reason} onChange={(event) => setReason(event.target.value)}><option value="">전체 반려 구분</option><option>사용 흔적</option><option>재고</option></select></label>
            <label className={styles.dateFilterField}><span>반려일</span><span className={styles.dateRange}><DatePicker defaultValue="2026-09-01"/><span className={styles.dateSeparator}>~</span><DatePicker defaultValue="2026-09-07"/></span></label>
            <span className={styles.rowSpacer}/>
            <button type="button" className="detailFilterBtn">상세 필터</button>
            <button className={styles.resetBtn} onClick={() => { setKeyword(''); setReason(''); }}>초기화</button>
          </div>
        </div>
        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 교환 반려</span>
          <div className={styles.resultActions}><ExcelDownloadButton data-grid-download/></div>
        </div>
      </header>
      <div className={styles.tableWrap}>
        <DataGrid columns={COLUMNS} rows={rows} gridTemplate="140px 140px 90px minmax(180px,1fr) minmax(200px,1.2fr) 110px 100px 130px" minWidth="1050px" empty={!rows.length} emptyText="반려된 교환 건이 없습니다." showPagination pages={[{ label: '1', active: true }]}/>
      </div>
      {selected && (
        <ExchangeDetailDrawer item={selected} eyebrow="교환 반려 상세" onClose={() => setSelectedId(null)}/>
      )}
    </div>
  );
}
