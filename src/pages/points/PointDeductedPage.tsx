import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CommonButton, ExcelDownloadButton } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import shared from '../ops/opsShared.module.css';
import { POINT_LEDGER, fmtPoint } from './pointLedgerData';
import styles from './pointSubpages.module.css';

const ENTRIES = POINT_LEDGER.filter((entry) => ['관리자 차감', '적립 취소'].includes(entry.type));
const COLUMNS: GridColumn[] = [
  { label: '차감 번호' }, { label: '차감일시' }, { label: '회원' }, { label: '차감 유형' },
  { label: '차감 포인트', align: 'right' }, { label: '차감 후 잔액', align: 'right' },
  { label: '차감 사유' }, { label: '처리자' },
];

export function PointDeductedPage() {
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const rows = useMemo<GridRow[]>(() => ENTRIES
    .filter((entry) => !search || `${entry.id} ${entry.member} ${entry.note}`.toLowerCase().includes(search.toLowerCase()))
    .filter((entry) => !type || entry.type === type)
    .filter((entry) => (!start || entry.at.slice(0, 10) >= start) && (!end || entry.at.slice(0, 10) <= end))
    .map((entry) => ({
      id: entry.id,
      cells: [
        { kind: 'text', text: entry.id, weight: 650, numeric: true },
        { kind: 'text', text: entry.at, color: '#71717a', numeric: true },
        { kind: 'text', text: entry.member, weight: 650 },
        { kind: 'badge', text: entry.type, bg: '#fff7ed', fg: '#c2410c' },
        { kind: 'text', text: fmtPoint(Math.abs(entry.delta)), color: '#dc2626', weight: 700, align: 'right', numeric: true },
        { kind: 'text', text: fmtPoint(entry.after), color: entry.after < 0 ? '#dc2626' : '#18181b', weight: 650, align: 'right', numeric: true },
        { kind: 'text', text: entry.note, color: '#52525b' },
        { kind: 'text', text: entry.by, color: '#71717a' },
      ] as Cell[],
    })), [end, search, start, type]);
  const reset = () => { setKeyword(''); setSearch(''); setType(''); setStart(''); setEnd(''); };

  return <div className={styles.page}>
    <header className={styles.header}><div className={styles.title}>차감 내역</div><div className={styles.subtitle}>관리자 차감 및 적립 취소로 회수된 포인트 내역을 조회합니다.</div></header>
    <section className={styles.summary}><div className={styles.summaryCard}><span>총 차감 건수</span><strong>{ENTRIES.length}건</strong></div><div className={styles.summaryCard}><span>총 차감 포인트</span><strong>{fmtPoint(ENTRIES.reduce((sum, entry) => sum + Math.abs(entry.delta), 0))}</strong></div><div className={styles.summaryCard}><span>잔액 확인 필요</span><strong>{ENTRIES.filter((entry) => entry.after < 0).length}건</strong></div></section>
    <section className={shared.filterBox}>
      <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
        <input aria-label="차감 내역 검색" className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="차감 번호 / 회원 / 사유" />
        <CommonButton type="submit" variant="emphasis" size="sm" className={shared.searchBtn}>조회</CommonButton>
      </form>
      <div className={shared.filterRow2}>
        <label className="globalFilterField"><span>차감 유형</span><select aria-label="차감 유형" className={shared.selectSm} value={type} onChange={(event) => setType(event.target.value)}><option value="">전체 차감 유형</option><option>관리자 차감</option><option>적립 취소</option></select></label>
        <label className={shared.dateFilterField}><span>차감일</span><span className={shared.dateRange}><DatePicker value={start} onChange={(event) => setStart(event.target.value)} /><span className={shared.dateSeparator}>~</span><DatePicker value={end} onChange={(event) => setEnd(event.target.value)} /></span></label>
        <span className={shared.rowSpacer} />
        <CommonButton type="button" variant="secondary" size="sm" className={shared.detailFilterBtn}>상세 필터</CommonButton>
        <CommonButton type="button" variant="ghost" size="sm" className={shared.resetBtn} onClick={reset}>초기화</CommonButton>
      </div>
    </section>
    <div className={styles.resultRow}><strong>총 {rows.length}건</strong><div className={styles.resultActions}><ExcelDownloadButton type="button" data-grid-download /><select aria-label="페이지당 표시 개수" className={styles.pageSizeSelect} defaultValue="20개씩 보기"><option>20개씩 보기</option><option>50개씩 보기</option></select></div></div>
    <div className={styles.grid}><DataGrid columns={COLUMNS} rows={rows} gridTemplate="150px 130px 1fr 100px 110px 110px 1.3fr 90px" minWidth="1050px" empty={rows.length === 0} emptyText="검색 조건에 해당하는 차감 내역이 없습니다." /></div>
  </div>;
}
