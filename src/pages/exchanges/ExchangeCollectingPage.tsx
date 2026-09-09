import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { showToast } from '../../components/common';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { DatePicker } from '../../components/forms/DatePicker';
import styles from '../delivery/deliveryShared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import { ExchangeDetailDrawer } from './ExchangeDetailDrawer';
import { INITIAL_EXCHANGES, matchesExchangeKeyword, type ExchangeItem } from './exchangeData';

const COLUMNS: GridColumn[] = [{ label: '교환번호' }, { label: '주문번호' }, { label: '고객명' }, { label: '택배사' }, { label: '회수 송장' }, { label: '교환상품' }, { label: '회수상태' }, { label: '최근갱신' }];

export function ExchangeCollectingPage() {
  const [items, setItems] = useState<ExchangeItem[]>(INITIAL_EXCHANGES);
  const [keyword, setKeyword] = useState('');
  const [carrier, setCarrier] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => items.filter((item) => item.stage === '상품 회수' && (!carrier || item.carrier === carrier) && matchesExchangeKeyword(item, keyword)), [carrier, items, keyword]);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const receive = () => { if (!selected) return; setItems((current) => current.map((item) => item.id === selected.id ? { ...item, stage: '회수 완료', inspection: '외관 확인 필요', updatedAt: '2026-09-07 15:20' } : item)); showToast({ message: '회수 상품을 입고 처리했습니다.', type: 'success' }); setSelectedId(null); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'text', text: item.id, weight: 600 }, { kind: 'text', text: item.orderId }, { kind: 'text', text: item.member, weight: 600 }, { kind: 'text', text: item.carrier }, { kind: 'text', text: item.trackingNo, numeric: true }, { kind: 'text', text: item.product }, { kind: 'badge', text: '회수중', bg: '#fefce8', fg: '#a16207' }, { kind: 'text', text: item.updatedAt, numeric: true }] }));
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>상품 회수</div>
            <div className={styles.subtitle}>교환 대상 상품의 택배사 회수 상태와 물류센터 입고 여부를 추적합니다.</div>
          </div>
        </div>
        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            
            <input className={styles.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="교환번호 / 주문번호 / 고객명 / 회수 송장"/>
            <button className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>택배사</span><select className={styles.selectSm} value={carrier} onChange={(event) => setCarrier(event.target.value)}><option value="">전체 택배사</option><option>CJ대한통운</option><option>한진택배</option><option>롯데택배</option></select></label>
            <label className={styles.dateFilterField}><span>회수 시작일</span><span className={styles.dateRange}><DatePicker defaultValue="2026-09-01"/><span className={styles.dateSeparator}>~</span><DatePicker defaultValue="2026-09-07"/></span></label>
            <span className={styles.rowSpacer}/>
            <button type="button" className="detailFilterBtn">상세 필터</button>
            <button className={styles.resetBtn} onClick={() => { setKeyword(''); setCarrier(''); }}>초기화</button>
          </div>
        </div>
        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 회수 진행</span>
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
        <DataGrid columns={COLUMNS} rows={rows} gridTemplate="140px 140px 90px 100px 130px minmax(200px,1fr) 90px 130px" minWidth="1020px" empty={!rows.length} emptyText="회수 중인 교환 상품이 없습니다." showPagination pages={[{ label: '1', active: true }]}/>
      </div>
      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="상품 회수 상세"
          onClose={() => setSelectedId(null)}
          actions={<button className={drawer.primaryBtn} onClick={receive}>회수 완료 입고</button>}
        />
      )}
    </div>
  );
}
