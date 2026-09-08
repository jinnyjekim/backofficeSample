import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { DatePicker } from '../../components/forms/DatePicker';
import styles from '../delivery/deliveryShared.module.css';
import { ExchangeDetailDrawer } from './ExchangeDetailDrawer';
import { formatWon, INITIAL_EXCHANGES, matchesExchangeKeyword } from './exchangeData';

const COLUMNS: GridColumn[] = [{ label: '교환번호' }, { label: '주문번호' }, { label: '고객명' }, { label: '교환상품 / 옵션' }, { label: '교환금액', align: 'right' }, { label: '택배사 / 송장' }, { label: '담당자' }, { label: '완료일시' }];

export function ExchangeCompletedPage() {
  const [keyword, setKeyword] = useState('');
  const [carrier, setCarrier] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => INITIAL_EXCHANGES.filter((item) => item.stage === '교환 완료' && (!carrier || item.carrier === carrier) && matchesExchangeKeyword(item, keyword)), [carrier, keyword]);
  const selected = INITIAL_EXCHANGES.find((item) => item.id === selectedId) ?? null;
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'text', text: item.id, weight: 600 }, { kind: 'text', text: item.orderId }, { kind: 'text', text: item.member, weight: 600 }, { kind: 'stack', title: item.product, subtitle: item.optionAfter }, { kind: 'text', text: formatWon(item.amount), align: 'right', numeric: true, weight: 600 }, { kind: 'stack', title: item.carrier, subtitle: item.trackingNo }, { kind: 'text', text: item.assignee }, { kind: 'text', text: item.completedAt ?? item.updatedAt, numeric: true }] }));
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>교환 완료</div>
            <div className={styles.subtitle}>교환 상품 배송이 완료되어 정상 종결된 교환 건을 조회합니다.</div>
          </div>
        </div>
        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            
            <input className={styles.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="교환번호 / 주문번호 / 고객명 / 상품명"/>
            <button className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>택배사</span><select className={styles.selectSm} value={carrier} onChange={(event) => setCarrier(event.target.value)}><option value="">전체 택배사</option><option>CJ대한통운</option><option>우체국택배</option></select></label>
            <label className={styles.dateFilterField}><span>완료일</span><span className={styles.dateRange}><DatePicker defaultValue="2026-09-01"/><span className={styles.dateSeparator}>~</span><DatePicker defaultValue="2026-09-07"/></span></label>
            <span className={styles.rowSpacer}/>
            <button type="button" className="detailFilterBtn">상세 필터</button>
            <button className={styles.resetBtn} onClick={() => { setKeyword(''); setCarrier(''); }}>초기화</button>
          </div>
        </div>
        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 교환 완료</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton data-grid-download/>
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </header>
      <div className={styles.tableWrap}>
        <DataGrid columns={COLUMNS} rows={rows} gridTemplate="140px 140px 90px minmax(210px,1fr) 100px 150px 100px 130px" minWidth="1060px" empty={!rows.length} emptyText="완료된 교환 건이 없습니다." showPagination pages={[{ label: '1', active: true }]}/>
      </div>
      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="교환 완료 상세"
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
