import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CouponIssueDetailDrawer } from './CouponIssueDetailDrawer';
import { CouponIssueFormDrawer, type CouponIssueFormData } from './CouponIssueFormDrawer';
import { COUPONS } from './couponsData';
import {
  COUPON_ISSUES,
  HOLDER_STATUS_META,
  QUICK_FILTERS,
  REVOKE_REASONS,
  TODAY,
  computeIssues,
  computeStatus,
  issueCoupon,
  matchesQuickFilter,
  type CouponIssue,
  type HolderStatus,
  type QuickFilter,
  type RevokeReason,
} from './couponIssuesData';

const GRID_TEMPLATE = '150px 90px 1.3fr 90px 90px 90px 90px 84px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '발급번호' },
  { label: '회원' },
  { label: '쿠폰' },
  { label: '발급일' },
  { label: '만료일' },
  { label: '발급방식' },
  { label: '사용일' },
  { label: '상태' },
  { label: '관리' },
];

type ConfirmState = { kind: 'revoke'; item: CouponIssue } | { kind: 'bulkRevoke' } | null;

export function CouponIssuesPage() {
  const [searchParams] = useSearchParams();
  const [issues, setIssues] = useState<CouponIssue[]>(COUPON_ISSUES);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<HolderStatus | ''>('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [revokeReason, setRevokeReason] = useState<RevokeReason>('오발급');
  const [revokeDetail, setRevokeDetail] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setCouponFilter(code);
    const issueId = searchParams.get('issue');
    if (issueId) setDrawerId(issueId);
  }, [searchParams]);

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    issues.forEach((h) => { map[h.id] = computeIssues(h); });
    return map;
  }, [issues]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = issues.filter((h) => matchesQuickFilter(h, f)).length; });
    return c;
  }, [issues]);

  const filtered = useMemo(
    () =>
      issues.filter((h) => {
        if (!matchesQuickFilter(h, quickFilter)) return false;
        if (search && !`${h.member} ${h.couponNameSnapshot} ${h.couponCode} ${h.id}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (couponFilter && h.couponCode !== couponFilter) return false;
        if (statusFilter && computeStatus(h) !== statusFilter) return false;
        return true;
      }),
    [issues, quickFilter, search, couponFilter, statusFilter],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setCouponFilter('');
    setStatusFilter('');
  };

  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((h) => h.id)));
  }

  const selected = drawerId ? issues.find((h) => h.id === drawerId) ?? null : null;

  function openDetail(id: string) {
    setDrawerId(id);
    setShowIssueForm(false);
    setMenuId(null);
  }

  function addMemo(id: string, text: string) {
    setIssues((prev) => prev.map((h) => (h.id === id ? { ...h, memos: [...h.memos, { id: `M-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', text }] } : h)));
  }

  function submitIssueForm(form: CouponIssueFormData) {
    const coupon = COUPONS.find((c) => c.id === form.couponId);
    if (!coupon) return;
    const created = issueCoupon(coupon, form.member, form.method, form.reason, form.detail, issues);
    setIssues((prev) => [created, ...prev]);
    setShowIssueForm(false);
    toastBriefly(`${form.member}에게 쿠폰을 발급했습니다.`);
    openDetail(created.id);
  }

  function revoke(item: CouponIssue, reason: RevokeReason, detail: string) {
    setIssues((prev) =>
      prev.map((h) =>
        h.id === item.id
          ? {
              ...h,
              status: '회수',
              revokedAt: `${TODAY} 15:00`,
              revokedBy: 'admin01',
              revokeReason: reason,
              revokeDetail: detail || null,
              history: [...h.history, { id: `H-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', action: '쿠폰 회수', detail: reason }],
            }
          : h,
      ),
    );
  }

  function confirmAction() {
    if (!confirm) return;
    if (confirm.kind === 'revoke') {
      revoke(confirm.item, revokeReason, revokeDetail.trim());
      toastBriefly('쿠폰을 회수했습니다.');
    } else if (confirm.kind === 'bulkRevoke') {
      const eligible = selectedIds.filter((id) => computeStatus(issues.find((h) => h.id === id)!) === '사용 가능');
      eligible.forEach((id) => revoke(issues.find((h) => h.id === id)!, revokeReason, revokeDetail.trim()));
      toastBriefly(`${eligible.length}건을 회수했습니다.`);
      setSelectedIds([]);
    }
    setRevokeDetail('');
    setConfirm(null);
  }

  const bulkRevokeEligible = selectedIds.filter((id) => computeStatus(issues.find((h) => h.id === id)!) === '사용 가능');

  function rowMenuItems(h: CouponIssue, status: HolderStatus) {
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(h.id) },
    ];
    if (status === '사용 가능') {
      items.push({ sep: true });
      items.push({ label: '쿠폰 회수', fg: '#dc2626', click: () => { setConfirm({ kind: 'revoke', item: h }); setMenuId(null); } });
    }
    return items;
  }

  const rows: GridRow[] = filtered.map((h) => {
    const status = computeStatus(h);
    const sm = HOLDER_STATUS_META[status];
    const issueList = issuesMap[h.id] ?? [];
    const cells: Cell[] = [
      { kind: 'text', text: h.id, color: '#71717a', size: '11px', weight: 500 },
      { kind: 'text', text: h.member, color: '#3f3f46', size: '12px', weight: 600 },
      { kind: 'titleWarn', title: `${h.couponNameSnapshot} · ${h.couponCode}`, hasIssue: issueList.length > 0, issueTitle: issueList.join(' · ') },
      { kind: 'text', text: h.issuedAt.slice(5, 10).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: h.expiresAt.slice(5, 10).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: h.issueMethod, color: '#52525b', size: '11.5px', weight: 500 },
      { kind: 'text', text: h.usedAt ? h.usedAt.slice(5, 10).replace('-', '.') : '-', color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'badge', text: status, bg: sm.bg, fg: sm.fg },
      {
        kind: 'rowMenu',
        align: 'right',
        detailLabel: '상세',
        onDetail: () => openDetail(h.id),
        open: menuId === h.id,
        onToggle: () => setMenuId(menuId === h.id ? null : h.id),
        items: rowMenuItems(h, status),
      },
    ];
    return { id: h.id, cells, onClick: () => openDetail(h.id), selected: selectedIds.includes(h.id), onToggleSelect: () => toggleSel(h.id) };
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>쿠폰 발급 관리</div>
            <div className={styles.subtitle}>회원에게 발급된 쿠폰의 보유 및 사용 가능 상태를 관리합니다.</div>
          </div>
          <button type="button" className={styles.createBtn} onClick={() => { setShowIssueForm(true); setDrawerId(null); }}>+ 쿠폰 발급</button>
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
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="회원, 쿠폰명, 쿠폰코드 또는 발급번호 검색" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <select className={styles.selectSm} value={couponFilter} onChange={(e) => setCouponFilter(e.target.value)}>
              <option value="">쿠폰 전체</option>
              {COUPONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <select className={styles.selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as HolderStatus | '')}>
              <option value="">보유 상태 전체</option>
              <option value="사용 가능">사용 가능</option>
              <option value="사용 완료">사용 완료</option>
              <option value="만료">만료</option>
              <option value="회수">회수</option>
            </select>
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

      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{selectedIds.length}건 선택됨</span>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkRevoke' })}>쿠폰 회수</button>
          <button type="button" className={styles.bulkBtn} onClick={() => toastBriefly(`${selectedIds.length}건을 다운로드했습니다.`)}>다운로드</button>
        </div>
      )}

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1080px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          empty={rows.length === 0}
          emptyText={issues.length === 0 ? '발급된 쿠폰이 없습니다.' : quickFilter === '확인 필요' ? '현재 확인이 필요한 발급 쿠폰이 없습니다.' : '검색 조건에 해당하는 발급 쿠폰이 없습니다.'}
          emptySubtext={issues.length === 0 ? '회원에게 쿠폰이 발급되면 이곳에서 확인할 수 있습니다.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={issues.length === 0 ? '+ 쿠폰 발급' : '필터 초기화'}
          emptyActionClick={issues.length === 0 ? () => setShowIssueForm(true) : resetFilters}
        />
      </div>

      {selected && (
        <CouponIssueDetailDrawer
          key={selected.id}
          issue={selected}
          onClose={() => setDrawerId(null)}
          onRequestRevoke={() => setConfirm({ kind: 'revoke', item: selected })}
          onAddMemo={(text) => addMemo(selected.id, text)}
        />
      )}

      {showIssueForm && (
        <CouponIssueFormDrawer existingHolders={issues} onCancel={() => setShowIssueForm(false)} onSubmit={submitIssueForm} />
      )}

      {(confirm?.kind === 'revoke' || confirm?.kind === 'bulkRevoke') && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{confirm.kind === 'revoke' ? '쿠폰을 회수하시겠습니까?' : `${selectedIds.length}건 쿠폰 회수`}</div>
            {confirm.kind === 'revoke' ? (
              <div className={styles.dialogSummary}>
                <div className={styles.dialogSummaryRow}><span>회원</span><span>{confirm.item.member}</span></div>
                <div className={styles.dialogSummaryRow}><span>쿠폰</span><span>{confirm.item.couponNameSnapshot}</span></div>
                <div className={styles.dialogSummaryRow}><span>만료일</span><span>{confirm.item.expiresAt.slice(0, 10)}</span></div>
              </div>
            ) : (
              <div className={styles.dialogSummary}>
                <div className={styles.dialogSummaryRow}><span>회수 가능</span><span>{bulkRevokeEligible.length}건</span></div>
                <div className={styles.dialogSummaryRow}><span>제외 (사용완료/만료/회수됨)</span><span>{selectedIds.length - bulkRevokeEligible.length}건</span></div>
              </div>
            )}
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 10 }} value={revokeReason} onChange={(e) => setRevokeReason(e.target.value as RevokeReason)}>
              {REVOKE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <input className={styles.searchInput} style={{ width: '100%', maxWidth: 'none', marginBottom: 16 }} placeholder="상세 사유 (선택)" value={revokeDetail} onChange={(e) => setRevokeDetail(e.target.value)} />
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button
                type="button"
                className={styles.dialogBtn}
                style={{ border: 0, background: '#dc2626', color: '#fff' }}
                disabled={confirm.kind === 'bulkRevoke' && bulkRevokeEligible.length === 0}
                onClick={confirmAction}
              >
                쿠폰 회수
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
