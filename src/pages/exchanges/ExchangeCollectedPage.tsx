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

const COLUMNS: GridColumn[] = [{ label: '교환번호' }, { label: '주문번호' }, { label: '고객명' }, { label: '교환상품' }, { label: '회수 송장' }, { label: '입고상태' }, { label: '검수담당' }, { label: '입고일시' }];

export function ExchangeCollectedPage() {
  const [items, setItems] = useState<ExchangeItem[]>(INITIAL_EXCHANGES);
  const [keyword, setKeyword] = useState('');
  const [inspection, setInspection] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => items.filter((item) => item.stage === '회수 완료' && (!inspection || item.inspection === inspection) && matchesExchangeKeyword(item, keyword)), [inspection, items, keyword]);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const inspect = () => { if (!selected) return; setItems((current) => current.map((item) => item.id === selected.id ? { ...item, stage: '교환 상품 준비', inspection: '정상', stockStatus: '피킹 대기', updatedAt: '2026-09-07 15:20' } : item)); showToast({ message: '검수를 완료하고 교환 상품 준비 단계로 이동했습니다.', type: 'success' }); setSelectedId(null); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'text', text: item.id, weight: 600 }, { kind: 'text', text: item.orderId }, { kind: 'text', text: item.member, weight: 600 }, { kind: 'stack', title: item.product, subtitle: item.reason }, { kind: 'text', text: item.trackingNo, numeric: true }, { kind: 'badge', text: item.inspection, bg: '#f5f3ff', fg: '#7c3aed' }, { kind: 'text', text: item.assignee }, { kind: 'text', text: item.updatedAt, numeric: true }] }));
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>회수 완료</div>
            <div className={styles.subtitle}>물류센터에 입고된 교환 상품의 외관과 구성품을 확인합니다.</div>
          </div>
        </div>
        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <label className="globalFilterField"><span>검색 범위</span><select className={styles.selectSm} aria-label="검색 범위"><option>전체</option><option>교환번호</option><option>회수 송장</option></select></label>
            <input className={styles.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="교환번호 / 주문번호 / 고객명 / 상품명"/>
            <button className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>검수 상태</span><select className={styles.selectSm} value={inspection} onChange={(event) => setInspection(event.target.value)}><option value="">전체 검수 상태</option><option>외관 확인 필요</option><option>정상</option></select></label>
            <label className={styles.dateFilterField}><span>입고일</span><span className={styles.dateRange}><DatePicker defaultValue="2026-09-01"/><span className={styles.dateSeparator}>~</span><DatePicker defaultValue="2026-09-07"/></span></label>
            <span className={styles.rowSpacer}/>
            <button className={styles.resetBtn} onClick={() => { setKeyword(''); setInspection(''); }}>초기화</button>
          </div>
        </div>
        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 검수 대기</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton data-grid-download/>
          </div>
        </div>
      </header>
      <div className={styles.tableWrap}>
        <DataGrid columns={COLUMNS} rows={rows} gridTemplate="140px 140px 90px minmax(210px,1fr) 130px 110px 100px 130px" minWidth="1020px" empty={!rows.length} emptyText="검수 대기 중인 회수 상품이 없습니다." showPagination pages={[{ label: '1', active: true }]}/>
      </div>
      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="회수 상품 검수"
          onClose={() => setSelectedId(null)}
          actions={<button className={drawer.primaryBtn} onClick={inspect}>정상 검수 완료</button>}
        />
      )}
    </div>
  );
}
