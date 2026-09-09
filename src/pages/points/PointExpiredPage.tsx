import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CommonButton, ExcelDownloadButton } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import shared from '../ops/opsShared.module.css';
import { POINT_LEDGER, fmtPoint } from './pointLedgerData';
import styles from './pointSubpages.module.css';

const ENTRIES = POINT_LEDGER.filter((entry) => entry.type === '포인트 소멸');
const COLUMNS: GridColumn[] = [
  { label: '소멸 번호' }, { label: '소멸일시' }, { label: '회원' },
  { label: '소멸 포인트', align: 'right' }, { label: '소멸 전 잔액', align: 'right' },
  { label: '소멸 후 잔액', align: 'right' }, { label: '소멸 사유' }, { label: '처리 주체' },
];

export function PointExpiredPage() {
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const rows = useMemo<GridRow[]>(() => ENTRIES
    .filter((entry) => !search || `${entry.id} ${entry.member} ${entry.note}`.toLowerCase().includes(search.toLowerCase()))
    .filter((entry) => (!start || entry.at.slice(0, 10) >= start) && (!end || entry.at.slice(0, 10) <= end))
    .map((entry) => ({
      id: entry.id,
      cells: [
        { kind: 'text', text: entry.id, weight: 650, numeric: true },
        { kind: 'text', text: entry.at, color: '#71717a', numeric: true },
        { kind: 'text', text: entry.member, weight: 650 },
        { kind: 'text', text: fmtPoint(Math.abs(entry.delta)), color: '#dc2626', weight: 700, align: 'right', numeric: true },
        { kind: 'text', text: fmtPoint(entry.before), align: 'right', numeric: true },
        { kind: 'text', text: fmtPoint(entry.after), weight: 650, align: 'right', numeric: true },
        { kind: 'text', text: entry.note, color: '#52525b' },
        { kind: 'badge', text: entry.by, bg: '#f4f4f5', fg: '#52525b' },
      ] as Cell[],
    })), [end, search, start]);
  const reset = () => { setKeyword(''); setSearch(''); setStart(''); setEnd(''); };

  return <div className={styles.page}>
    <header className={styles.header}><div className={styles.title}>소멸 내역</div><div className={styles.subtitle}>유효기간 만료로 소멸 처리된 포인트/적립금 내역을 조회합니다.</div></header>
    <section className={styles.summary}><div className={styles.summaryCard}><span>총 소멸 건수</span><strong>{ENTRIES.length}건</strong></div><div className={styles.summaryCard}><span>총 소멸 포인트</span><strong>{fmtPoint(ENTRIES.reduce((sum, entry) => sum + Math.abs(entry.delta), 0))}</strong></div><div className={styles.summaryCard}><span>시스템 처리</span><strong>{ENTRIES.filter((entry) => entry.by === 'SYSTEM').length}건</strong></div></section>
    <section className={shared.filterBox}>
      <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
        <input aria-label="소멸 내역 검색" className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="소멸 번호 / 회원 / 사유" />
        <CommonButton type="submit" variant="emphasis" size="sm" className={shared.searchBtn}>조회</CommonButton>
      </form>
      <div className={shared.filterRow2}>
        <label className={shared.dateFilterField}><span>소멸일</span><span className={shared.dateRange}><DatePicker value={start} onChange={(event) => setStart(event.target.value)} /><span className={shared.dateSeparator}>~</span><DatePicker value={end} onChange={(event) => setEnd(event.target.value)} /></span></label>
        <span className={shared.rowSpacer} />
        <CommonButton type="button" variant="secondary" size="sm" className={shared.detailFilterBtn}>상세 필터</CommonButton>
        <CommonButton type="button" variant="ghost" size="sm" className={shared.resetBtn} onClick={reset}>초기화</CommonButton>
      </div>
    </section>
    <div className={styles.resultRow}><strong>총 {rows.length}건</strong><div className={styles.resultActions}><ExcelDownloadButton type="button" data-grid-download /><select aria-label="페이지당 표시 개수" className={styles.pageSizeSelect} defaultValue="20개씩 보기"><option>20개씩 보기</option><option>50개씩 보기</option></select></div></div>
    <div className={styles.grid}><DataGrid columns={COLUMNS} rows={rows} gridTemplate="150px 130px 1fr 110px 110px 110px 1.4fr 100px" minWidth="1000px" empty={rows.length === 0} emptyText="검색 조건에 해당하는 소멸 내역이 없습니다." /></div>
  </div>;
}
