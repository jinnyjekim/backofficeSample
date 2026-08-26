import { useMemo, useState } from 'react';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { PointLedgerDetailDrawer } from './PointLedgerDetailDrawer';
import {
  POINT_LEDGER,
  QUICK_FILTERS,
  computeIssues,
  fmtPoint,
  isIncrease,
  matchesQuickFilter,
  type LedgerType,
  type PointLedgerEntry,
  type QuickFilter,
} from './pointLedgerData';

const GRID_TEMPLATE = '110px 90px 1fr 100px 100px 100px 110px 80px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '발생일시' },
  { label: '회원' },
  { label: '유형' },
  { label: '변동 전', align: 'right' },
  { label: '증감', align: 'right' },
  { label: '변동 후', align: 'right' },
  { label: 'Source' },
  { label: '처리자' },
  { label: '관리' },
];

const LEDGER_TYPES: LedgerType[] = ['구매 적립', '관리자 지급', '이벤트 지급', '적립 보정', '포인트 복원', '주문 사용', '관리자 차감', '포인트 소멸', '적립 취소'];

export function PointLedgerPage() {
  const [entries, setEntries] = useState<PointLedgerEntry[]>(POINT_LEDGER);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<LedgerType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = entries.filter((e) => matchesQuickFilter(e, f, entries)).length; });
    return c;
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (!matchesQuickFilter(e, quickFilter, entries)) return false;
        if (search && !`${e.id} ${e.member} ${e.sourceId ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter && e.type !== typeFilter) return false;
        if (startDate && e.at.slice(0, 10) < startDate) return false;
        if (endDate && e.at.slice(0, 10) > endDate) return false;
        return true;
      }),
    [entries, quickFilter, search, typeFilter, startDate, endDate],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setTypeFilter('');
    setStartDate('');
    setEndDate('');
  };

  function addMemo(id: string, text: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, memos: [...e.memos, { id: `M-${Date.now()}`, at: '2026-08-26 15:00', by: 'admin01', text }] } : e)));
  }

  const selected = drawerId ? entries.find((e) => e.id === drawerId) ?? null : null;

  const rows: GridRow[] = filtered.map((e) => {
    const issueList = computeIssues(e, entries);
    const increase = isIncrease(e.type);
    const cells: Cell[] = [
      { kind: 'text', text: e.at.slice(5).replace('-', '.'), color: '#71717a', size: '11px', weight: 500, numeric: true },
      { kind: 'text', text: e.member, color: '#3f3f46', size: '12px', weight: 600 },
      { kind: 'titleWarn', title: e.type, hasIssue: issueList.length > 0, issueTitle: issueList.join(' · ') },
      { kind: 'text', text: fmtPoint(e.before), color: '#71717a', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: `${e.delta > 0 ? '+' : ''}${fmtPoint(e.delta)}`, color: increase ? '#059669' : '#dc2626', size: '12.5px', weight: 700, align: 'right', numeric: true },
      { kind: 'text', text: fmtPoint(e.after), color: e.after < 0 ? '#dc2626' : '#18181b', size: '12.5px', weight: 700, align: 'right', numeric: true },
      { kind: 'text', text: e.sourceId ?? e.sourceType, color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'text', text: e.by, color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: e.id, cells, onClick: () => setDrawerId(e.id) };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>포인트 내역</div>
            <div className={styles.subtitle}>회원별 포인트/적립금 지급, 사용, 차감, 소멸 및 복원 내역을 조회합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((f) => (
            <button key={f} type="button" className={styles.qfBtn} style={{ borderColor: quickFilter === f ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: quickFilter === f ? 'var(--accent)' : '#fff' }} onClick={() => setQuickFilter(f)}>
              <span className={styles.qfLabel} style={{ color: quickFilter === f ? '#fff' : '#3f3f46' }}>{f}</span>
              <span className={styles.qfCount} style={{ color: quickFilter === f ? '#fff' : '#3f3f46' }}>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className={styles.filterBox}>
          <form className={styles.filterRow1} onSubmit={(e) => { e.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="내역번호, 회원 또는 Source 번호 검색" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <select className={styles.selectSm} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as LedgerType | '')}>
              <option value="">변동 유형 전체</option>
              {LEDGER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input type="date" className={styles.selectSm} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span style={{ color: '#a1a1aa', fontSize: 12 }}>~</span>
            <input type="date" className={styles.selectSm} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <span className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn} onClick={() => toastBriefly('데이터 다운로드를 준비했습니다.')}>↓ 데이터 다운로드</button>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1080px"
          empty={rows.length === 0}
          emptyText={entries.length === 0 ? '포인트 변동 내역이 없습니다.' : quickFilter === '확인 필요' ? '현재 확인이 필요한 포인트 내역이 없습니다.' : '검색 조건에 해당하는 포인트 내역이 없습니다.'}
          emptySubtext={entries.length > 0 ? '검색어나 필터 조건을 변경해 주세요.' : undefined}
          emptyActionLabel={entries.length > 0 ? '필터 초기화' : undefined}
          emptyActionClick={entries.length > 0 ? resetFilters : undefined}
        />
      </div>

      {selected && (
        <PointLedgerDetailDrawer key={selected.id} entry={selected} all={entries} onClose={() => setDrawerId(null)} onAddMemo={(text) => addMemo(selected.id, text)} />
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
