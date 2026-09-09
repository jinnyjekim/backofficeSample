import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CommonButton, ExcelDownloadButton } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import shared from '../ops/opsShared.module.css';
import { MEMBER_BALANCES, fmtPoint } from './pointsData';
import styles from './pointSubpages.module.css';

type ExpiringRow = { id: string; member: string; expiresAt: string; amount: number; available: number; status: string };
const ENTRIES: ExpiringRow[] = MEMBER_BALANCES.flatMap((balance) => balance.expiringBatches.map((batch, index) => ({ id: `EXP-${balance.member}-${index + 1}`, member: balance.member, expiresAt: batch.expiresAt, amount: batch.amount, available: balance.available, status: balance.memberStatus })));
const COLUMNS: GridColumn[] = [
  { label: '소멸 예정 번호' }, { label: '소멸 예정일' }, { label: '회원' }, { label: '회원 상태' },
  { label: '소멸 예정 포인트', align: 'right' }, { label: '사용 가능 포인트', align: 'right' }, { label: '잔여일', align: 'right' },
];

export function PointExpiringPage() {
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const rows = useMemo<GridRow[]>(() => ENTRIES
    .filter((entry) => !search || `${entry.id} ${entry.member}`.toLowerCase().includes(search.toLowerCase()))
    .filter((entry) => !status || entry.status === status)
    .filter((entry) => (!start || entry.expiresAt >= start) && (!end || entry.expiresAt <= end))
    .map((entry) => {
      const days = Math.ceil((new Date(`${entry.expiresAt}T00:00:00`).getTime() - new Date('2026-08-26T00:00:00').getTime()) / 86400000);
      return { id: entry.id, cells: [
        { kind: 'text', text: entry.id, weight: 650, numeric: true },
        { kind: 'text', text: entry.expiresAt, weight: 650, numeric: true },
        { kind: 'text', text: entry.member, weight: 650 },
        { kind: 'badge', text: entry.status, bg: entry.status === '정상' ? '#ecfdf5' : '#f4f4f5', fg: entry.status === '정상' ? '#047857' : '#71717a' },
        { kind: 'text', text: fmtPoint(entry.amount), color: '#c2410c', weight: 700, align: 'right', numeric: true },
        { kind: 'text', text: fmtPoint(entry.available), align: 'right', numeric: true },
        { kind: 'text', text: `D-${days}`, color: days <= 7 ? '#dc2626' : '#71717a', weight: 650, align: 'right', numeric: true },
      ] as Cell[] };
    }), [end, search, start, status]);
  const reset = () => { setKeyword(''); setSearch(''); setStatus(''); setStart(''); setEnd(''); };

  return <div className={styles.page}>
    <header className={styles.header}><div className={styles.title}>소멸 예정</div><div className={styles.subtitle}>유효기간이 임박한 회원별 포인트와 소멸 예정일을 조회합니다.</div></header>
    <section className={styles.summary}><div className={styles.summaryCard}><span>소멸 예정 회원</span><strong>{new Set(ENTRIES.map((entry) => entry.member)).size}명</strong></div><div className={styles.summaryCard}><span>소멸 예정 건수</span><strong>{ENTRIES.length}건</strong></div><div className={styles.summaryCard}><span>소멸 예정 포인트</span><strong>{fmtPoint(ENTRIES.reduce((sum, entry) => sum + entry.amount, 0))}</strong></div></section>
    <section className={shared.filterBox}>
      <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
        <input aria-label="소멸 예정 검색" className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="소멸 예정 번호 / 회원" />
        <CommonButton type="submit" variant="emphasis" size="sm" className={shared.searchBtn}>조회</CommonButton>
      </form>
      <div className={shared.filterRow2}>
        <label className="globalFilterField"><span>회원 상태</span><select aria-label="회원 상태" className={shared.selectSm} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">전체 회원 상태</option><option>정상</option><option>휴면</option><option>탈퇴</option></select></label>
        <label className={shared.dateFilterField}><span>소멸 예정일</span><span className={shared.dateRange}><DatePicker value={start} onChange={(event) => setStart(event.target.value)} /><span className={shared.dateSeparator}>~</span><DatePicker value={end} onChange={(event) => setEnd(event.target.value)} /></span></label>
        <span className={shared.rowSpacer} />
        <CommonButton type="button" variant="secondary" size="sm" className={shared.detailFilterBtn}>상세 필터</CommonButton>
        <CommonButton type="button" variant="ghost" size="sm" className={shared.resetBtn} onClick={reset}>초기화</CommonButton>
      </div>
    </section>
    <div className={styles.resultRow}><strong>총 {rows.length}건</strong><div className={styles.resultActions}><ExcelDownloadButton type="button" data-grid-download /><select aria-label="페이지당 표시 개수" className={styles.pageSizeSelect} defaultValue="20개씩 보기"><option>20개씩 보기</option><option>50개씩 보기</option></select></div></div>
    <div className={styles.grid}><DataGrid columns={COLUMNS} rows={rows} gridTemplate="170px 130px 1fr 100px 140px 140px 90px" minWidth="950px" empty={rows.length === 0} emptyText="검색 조건에 해당하는 소멸 예정 내역이 없습니다." /></div>
  </div>;
}
