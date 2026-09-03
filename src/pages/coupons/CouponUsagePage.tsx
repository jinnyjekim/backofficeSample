import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import shared from './shared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { DatePicker } from '../../components/forms/DatePicker';
import { CouponUsageDetailDrawer } from './CouponUsageDetailDrawer';
import { COUPONS, fmtWon } from './couponsData';
import {
  COUPON_USAGES,
  QUICK_FILTERS,
  TODAY,
  USAGE_STATUS_META,
  computeIssues,
  matchesQuickFilter,
  type CouponUsage,
  type QuickFilter,
  type UsageStatus,
} from './couponUsageData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton, showToast } from '../../components/common';

const GRID_TEMPLATE = '132px 1.3fr 60px 72px 80px 80px 52px 100px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '사용번호' },
  { label: '쿠폰' },
  { label: '회원' },
  { label: '주문번호' },
  { label: '기준금액', align: 'right' },
  { label: '할인', align: 'right' },
  { label: '사용일' },
  { label: '상태' },
  { label: '관리' },
];

export function CouponUsagePage() {
  const [searchParams] = useSearchParams();
  const [usages, setUsages] = useState<CouponUsage[]>(COUPON_USAGES);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<UsageStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [drawerId, setDrawerId] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setCouponFilter(code);
  }, [searchParams]);

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    usages.forEach((u) => { map[u.id] = computeIssues(u); });
    return map;
  }, [usages]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = usages.filter((u) => matchesQuickFilter(u, f)).length; });
    return c;
  }, [usages]);

  const filtered = useMemo(
    () =>
      usages.filter((u) => {
        if (!matchesQuickFilter(u, quickFilter)) return false;
        if (search && !`${u.orderId} ${u.member} ${u.couponNameSnapshot} ${u.id}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (couponFilter && u.couponCode !== couponFilter) return false;
        if (statusFilter && u.status !== statusFilter) return false;
        if (startDate && u.usedAt.slice(0, 10) < startDate) return false;
        if (endDate && u.usedAt.slice(0, 10) > endDate) return false;
        return true;
      }),
    [usages, quickFilter, search, couponFilter, statusFilter, startDate, endDate],
  );

  const toastBriefly = (message: string) => showToast({ message, type: 'success' });
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setCouponFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  function addMemo(id: string, text: string) {
    setUsages((prev) => prev.map((u) => (u.id === id ? { ...u, memos: [...u.memos, { id: `M-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', text }] } : u)));
  }

  const selected = drawerId ? usages.find((u) => u.id === drawerId) ?? null : null;

  const rows: GridRow[] = filtered.map((u) => {
    const sm = USAGE_STATUS_META[u.status];
    const issueList = issuesMap[u.id] ?? [];
    const cells: Cell[] = [
      { kind: 'text', text: u.id, color: '#71717a', size: '11px', weight: 500 },
      { kind: 'titleWarn', title: `${u.couponNameSnapshot} · ${u.couponCode}`, hasIssue: issueList.length > 0, issueTitle: issueList.join(' · ') },
      { kind: 'text', text: u.member, color: '#3f3f46', size: '12px', weight: 600 },
      { kind: 'text', text: u.orderId, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: fmtWon(u.baseAmount), color: '#3f3f46', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: u.currentDiscountAmount < 0 ? fmtWon(u.currentDiscountAmount) : `-${fmtWon(u.currentDiscountAmount)}`, color: u.currentDiscountAmount < 0 ? '#dc2626' : '#18181b', size: '12.5px', weight: 700, align: 'right', numeric: true },
      { kind: 'text', text: u.usedAt.slice(5, 10).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'badge', text: u.status, bg: sm.bg, fg: sm.fg },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: u.id, cells, onClick: () => setDrawerId(u.id) };
  });

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={shared.title}>쿠폰 사용 내역</div>
            <div className={shared.subtitle}>주문에서 실제 사용된 쿠폰과 할인 처리 결과를 조회합니다.</div>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((f) => {
            const active = quickFilter === f;
            return (
              <CommonButton
                key={f}
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${shared.quickFilterBtn} ${active ? shared.active : ''}`}
                onClick={() => setQuickFilter(f)}
              >
                <span className={shared.quickFilterLabel}>{f}</span>
                <span className={shared.quickFilterCount}>{counts[f] ?? 0}</span>
              </CommonButton>
            );
          })}
        </div>

        <div className={shared.filterCard}>
          <form className={shared.filterRow1} onSubmit={(e) => { e.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="주문번호, 회원, 쿠폰명 또는 사용번호 검색" />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>쿠폰</span><select aria-label="쿠폰" className={shared.selectSm} value={couponFilter} onChange={(e) => setCouponFilter(e.target.value)}>
              <option value="">쿠폰 전체</option>
              {COUPONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select></label>
            <label className="globalFilterField"><span>사용 상태</span><select aria-label="사용 상태" className={shared.selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as UsageStatus | '')}>
              <option value="">사용 상태 전체</option>
              <option value="정상 사용">정상 사용</option>
              <option value="부분 취소 반영">부분 취소 반영</option>
              <option value="전체 취소 반영">전체 취소 반영</option>
              <option value="부분 환불 반영">부분 환불 반영</option>
              <option value="전체 환불 반영">전체 환불 반영</option>
            </select></label>
            <label className={shared.dateFilterField}>
              <span>사용일</span>
              <div className={shared.dateRange}>
                <DatePicker value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className={shared.dateSeparator}>~</span>
                <DatePicker value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </label>
            <span className={shared.spacer} />
            <button type="button" className={shared.clearBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={shared.resultBar}>
          <span className={shared.resultLabel}>총 {filtered.length}건</span>
          <div className={shared.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download onClick={() => toastBriefly('데이터 다운로드를 준비했습니다.')} />
          </div>
        </div>
      </header>

      <div className={shared.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="920px"
          empty={rows.length === 0}
          emptyText={usages.length === 0 ? '쿠폰 사용 내역이 없습니다.' : quickFilter === '확인 필요' ? '현재 확인이 필요한 쿠폰 사용 내역이 없습니다.' : '검색 조건에 해당하는 쿠폰 사용 내역이 없습니다.'}
          emptySubtext={usages.length === 0 ? '회원이 쿠폰을 주문에 사용하면 이곳에서 확인할 수 있습니다.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={usages.length > 0 ? '필터 초기화' : undefined}
          emptyActionClick={usages.length > 0 ? resetFilters : undefined}
        />
      </div>

      {selected && (
        <CouponUsageDetailDrawer key={selected.id} usage={selected} onClose={() => setDrawerId(null)} onAddMemo={(text) => addMemo(selected.id, text)} />
      )}

    </div>
  );
}
