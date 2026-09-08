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

const COLUMNS: GridColumn[] = [{ label: '교환번호' }, { label: '주문번호' }, { label: '고객명' }, { label: '교환상품 / 옵션' }, { label: '택배사' }, { label: '재출고 송장' }, { label: '배송상태' }, { label: '출고일시' }];

export function ExchangeReshipPage() {
  const [items, setItems] = useState<ExchangeItem[]>(INITIAL_EXCHANGES);
  const [keyword, setKeyword] = useState('');
  const [carrier, setCarrier] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => items.filter((item) => item.stage === '재출고' && (!carrier || item.carrier === carrier) && matchesExchangeKeyword(item, keyword)), [carrier, items, keyword]);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const complete = () => { if (!selected) return; setItems((current) => current.map((item) => item.id === selected.id ? { ...item, stage: '교환 완료', completedAt: '2026-09-07 15:20', stockStatus: '배송 완료', updatedAt: '2026-09-07 15:20' } : item)); showToast({ message: '교환 배송을 완료 처리했습니다.', type: 'success' }); setSelectedId(null); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'text', text: item.id, weight: 600 }, { kind: 'text', text: item.orderId }, { kind: 'text', text: item.member, weight: 600 }, { kind: 'stack', title: item.product, subtitle: item.optionAfter }, { kind: 'text', text: item.carrier }, { kind: 'text', text: item.trackingNo, numeric: true }, { kind: 'badge', text: item.stockStatus, bg: '#ecfeff', fg: '#0e7490' }, { kind: 'text', text: item.updatedAt, numeric: true }] }));
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>재출고</div>
            <div className={styles.subtitle}>교환 상품의 재출고 송장과 배송 진행 상태를 조회합니다.</div>
          </div>
        </div>
        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            
            <input className={styles.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="교환번호 / 주문번호 / 고객명 / 재출고 송장"/>
            <button className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>택배사</span><select className={styles.selectSm} value={carrier} onChange={(event) => setCarrier(event.target.value)}><option value="">전체 택배사</option><option>CJ대한통운</option><option>우체국택배</option></select></label>
            <label className={styles.dateFilterField}><span>재출고일</span><span className={styles.dateRange}><DatePicker defaultValue="2026-09-01"/><span className={styles.dateSeparator}>~</span><DatePicker defaultValue="2026-09-07"/></span></label>
            <span className={styles.rowSpacer}/>
            <button type="button" className="detailFilterBtn">상세 필터</button>
            <button className={styles.resetBtn} onClick={() => { setKeyword(''); setCarrier(''); }}>초기화</button>
          </div>
        </div>
        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 배송 중</span>
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
        <DataGrid columns={COLUMNS} rows={rows} gridTemplate="140px 140px 90px minmax(210px,1fr) 100px 130px 100px 130px" minWidth="1030px" empty={!rows.length} emptyText="재출고 진행 중인 교환 건이 없습니다." showPagination pages={[{ label: '1', active: true }]}/>
      </div>
      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="재출고 배송 상세"
          onClose={() => setSelectedId(null)}
          actions={<button className={drawer.primaryBtn} onClick={complete}>배송 완료 처리</button>}
        />
      )}
    </div>
  );
}
