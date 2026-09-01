import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { ApplicationDetailDrawer } from './ApplicationDetailDrawer';
import { PROMOTIONS, fmtWon } from './promotionsData';
import {
  APPLICATIONS,
  APPLY_STATUS_META,
  QUICK_FILTERS,
  computeIssues,
  matchesQuickFilter,
  targetSummary,
  type ApplyStatus,
  type PromotionApplication,
  type QuickFilter,
} from './applicationsData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '86px 1.3fr 72px 60px 70px 80px 80px 84px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '적용일시' },
  { label: '프로모션' },
  { label: '주문번호' },
  { label: '회원' },
  { label: '대상' },
  { label: '기준금액', align: 'right' },
  { label: '할인', align: 'right' },
  { label: '상태' },
  { label: '관리' },
];

export function PromotionApplicationsPage() {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<PromotionApplication[]>(APPLICATIONS);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [promotionFilter, setPromotionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplyStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setPromotionFilter(code);
  }, [searchParams]);

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    applications.forEach((a) => { map[a.id] = computeIssues(a); });
    return map;
  }, [applications]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = applications.filter((a) => matchesQuickFilter(a, f)).length; });
    return c;
  }, [applications]);

  const filtered = useMemo(
    () =>
      applications.filter((a) => {
        if (!matchesQuickFilter(a, quickFilter)) return false;
        if (search && !`${a.orderId} ${a.member} ${a.promotionNameSnapshot} ${a.promotionCode}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (promotionFilter && a.promotionCode !== promotionFilter) return false;
        if (statusFilter && a.status !== statusFilter) return false;
        if (startDate && a.appliedAt.slice(0, 10) < startDate) return false;
        if (endDate && a.appliedAt.slice(0, 10) > endDate) return false;
        return true;
      }),
    [applications, quickFilter, search, promotionFilter, statusFilter, startDate, endDate],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setPromotionFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  function addMemo(id: string, text: string) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, memos: [...a.memos, { id: `M-${Date.now()}`, at: '2026-08-26 15:00', by: 'admin01', text }] } : a)),
    );
  }

  const selected = drawerId ? applications.find((a) => a.id === drawerId) ?? null : null;

  const rows: GridRow[] = filtered.map((a) => {
    const sm = APPLY_STATUS_META[a.status];
    const issues = issuesMap[a.id] ?? [];
    const cells: Cell[] = [
      { kind: 'text', text: a.appliedAt.replace(/^\d{4}-/, '').replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'titleWarn', title: `${a.promotionNameSnapshot} · ${a.id}`, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
      { kind: 'text', text: a.orderId, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: a.member, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: targetSummary(a), color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: fmtWon(a.baseAmount), color: '#3f3f46', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: a.currentDiscountAmount < 0 ? fmtWon(a.currentDiscountAmount) : `-${fmtWon(a.currentDiscountAmount)}`, color: a.currentDiscountAmount < 0 ? '#dc2626' : '#18181b', size: '12.5px', weight: 700, align: 'right', numeric: true },
      { kind: 'badge', text: a.status, bg: sm.bg, fg: sm.fg },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: a.id, cells, onClick: () => setDrawerId(a.id) };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>프로모션 적용 이력</div>
            <div className={styles.subtitle}>실제 주문 및 거래에 적용된 프로모션과 할인 결과를 조회합니다.</div>
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
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="주문번호, 회원, 프로모션명 또는 코드 검색" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>프로모션</span><select aria-label="프로모션" className={styles.selectSm} value={promotionFilter} onChange={(e) => setPromotionFilter(e.target.value)}>
              <option value="">프로모션 전체</option>
              {PROMOTIONS.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select></label>
            <label className="globalFilterField"><span>적용 상태</span><select aria-label="적용 상태" className={styles.selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApplyStatus | '')}>
              <option value="">적용 상태 전체</option>
              <option value="정상 적용">정상 적용</option>
              <option value="적용 취소">적용 취소</option>
              <option value="부분 취소">부분 취소</option>
              <option value="환불 반영">환불 반영</option>
              <option value="부분 환불 반영">부분 환불 반영</option>
            </select></label>
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
            <ExcelDownloadButton type="button" data-grid-download onClick={() => toastBriefly('데이터 다운로드를 준비했습니다.')} />
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="920px"
          empty={rows.length === 0}
          emptyText={applications.length === 0 ? '프로모션 적용 이력이 없습니다.' : quickFilter === '확인 필요' ? '현재 확인이 필요한 프로모션 적용 이력이 없습니다.' : '검색 조건에 해당하는 프로모션 적용 이력이 없습니다.'}
          emptySubtext={applications.length === 0 ? '프로모션이 실제 주문에 적용되면 이곳에서 확인할 수 있습니다.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={applications.length > 0 ? '필터 초기화' : undefined}
          emptyActionClick={applications.length > 0 ? resetFilters : undefined}
        />
      </div>

      {selected && (
        <ApplicationDetailDrawer key={selected.id} app={selected} onClose={() => setDrawerId(null)} onAddMemo={(text) => addMemo(selected.id, text)} />
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
