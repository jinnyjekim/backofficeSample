import { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import { useLocation, useNavigate } from 'react-router-dom';
import shared from '../ops/opsShared.module.css';
import styles from './PaymentListPage.module.css';
import { PaymentDetailDrawer } from './PaymentDetailDrawer';
import { BUSINESS_BADGE_META, BUSINESS_SCOPES, type BusinessScope } from '../../lib/business';
import {
  INITIAL_PAYMENTS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  QUICK_FILTERS,
  applyRecheck,
  computeExternalMatch,
  computeIssues,
  fmtWon,
  matchesQuickFilter,
  remainingAmount,
  splitAt,
  type ExternalMatchStatus,
  type PaymentEntry,
  type PaymentMethod,
  type PaymentStatus,
  type QuickFilter,
} from './paymentListData';

const COLUMNS = [
  { label: '결제번호' },
  { label: '서비스' },
  { label: '주문번호' },
  { label: '고객' },
  { label: '결제일' },
  { label: '수단' },
  { label: '결제금액', align: 'right' as const },
  { label: '환불 / 잔여' },
  { label: '상태' },
  { label: '외부거래' },
  { label: '관리', align: 'right' as const },
];

const STATUS_DOT: Record<PaymentStatus, { dot: string; fg: string }> = {
  '결제 대기': { dot: '#a1a1aa', fg: '#71717a' },
  '처리중': { dot: '#3b82f6', fg: '#1d4ed8' },
  '결제 완료': { dot: '#10b981', fg: '#047857' },
  '결제 실패': { dot: '#ef4444', fg: '#dc2626' },
  '결제 취소': { dot: '#a1a1aa', fg: '#52525b' },
};

const METHOD_COLOR: Record<PaymentMethod, { bg: string; fg: string }> = {
  '카드': { bg: '#eff6ff', fg: '#2563eb' },
  '계좌이체': { bg: '#ecfdf5', fg: '#059669' },
  '가상계좌': { bg: '#eef2ff', fg: '#4338ca' },
  '무통장입금': { bg: '#fffbeb', fg: '#b45309' },
  '포인트': { bg: '#fdf4ff', fg: '#a21caf' },
  '후불': { bg: '#f0fdfa', fg: '#0f766e' },
  '기타': { bg: '#f4f4f5', fg: '#52525b' },
};

const MATCH_COLOR: Record<ExternalMatchStatus, { bg: string; fg: string }> = {
  '정상': { bg: '#ecfdf5', fg: '#059669' },
  '미매칭': { bg: '#fef2f2', fg: '#dc2626' },
  '상태 불일치': { bg: '#fef2f2', fg: '#dc2626' },
  '금액 불일치': { bg: '#fef2f2', fg: '#dc2626' },
  '외부 거래 없음': { bg: '#f4f4f5', fg: '#71717a' },
};

export function PaymentListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [businessScope, setBusinessScope] = useState<BusinessScope>('통합');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [matchFilter, setMatchFilter] = useState<ExternalMatchStatus | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recheckTarget, setRecheckTarget] = useState<PaymentEntry | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const openPaymentId = (location.state as { openPaymentId?: string } | null)?.openPaymentId;
    if (openPaymentId) {
      setQuickFilter('전체');
      setSelectedId(openPaymentId);
      window.history.replaceState({}, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        if (!matchesQuickFilter(p, quickFilter, payments)) return false;
        if (businessScope !== '통합' && p.businessType !== businessScope) return false;
        if (search) {
          const haystack = `${p.id} ${p.orderId} ${p.customerName} ${p.externalTxId ?? ''}`.toLowerCase();
          if (!haystack.includes(search.toLowerCase())) return false;
        }
        if (methodFilter && p.method !== methodFilter) return false;
        if (statusFilter && p.status !== statusFilter) return false;
        if (matchFilter && computeExternalMatch(p) !== matchFilter) return false;
        if (dateFrom && p.requestedAt.slice(0, 10) < dateFrom) return false;
        if (dateTo && p.requestedAt.slice(0, 10) > dateTo) return false;
        return true;
      }).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [payments, quickFilter, businessScope, search, methodFilter, statusFilter, matchFilter, dateFrom, dateTo],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const reset = () => {
    setKeyword('');
    setSearch('');
    setBusinessScope('통합');
    setMethodFilter('');
    setStatusFilter('');
    setMatchFilter('');
    setDateFrom('');
    setDateTo('');
    setSelected([]);
  };

  const addMemo = (id: string, text: string) => {
    setPayments((current) => current.map((p) => (p.id === id ? { ...p, memos: [...p.memos, { id: `M-${id}-${Date.now()}`, at: '2026-08-25 14:00', by: 'admin01', text }] } : p)));
  };

  const runRecheck = () => {
    if (!recheckTarget) return;
    const { updated, message } = applyRecheck(recheckTarget);
    setPayments((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    setRecheckTarget(null);
    toastBriefly(message);
  };

  const rows: GridRow[] = filtered.map((p) => {
    const issues = computeIssues(p);
    const match = computeExternalMatch(p);
    const matchColor = MATCH_COLOR[match];
    const methodColor = METHOD_COLOR[p.method];
    const statusColor = STATUS_DOT[p.status];
    const [date, time] = splitAt(p.requestedAt);
    return {
      id: p.id,
      selected: selected.includes(p.id),
      onToggleSelect: () => setSelected((current) => (current.includes(p.id) ? current.filter((id) => id !== p.id) : [...current, p.id])),
      onClick: () => setSelectedId(p.id),
      bg: issues.length ? '#fffdf8' : undefined,
      cells: [
        { kind: 'titleWarn', title: p.id, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'badge', text: p.businessType, bg: BUSINESS_BADGE_META[p.businessType].bg, fg: BUSINESS_BADGE_META[p.businessType].fg },
        { kind: 'text', text: p.orderId, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: p.customerName, size: '12px', color: '#3f3f46' },
        { kind: 'stack', title: date, subtitle: time },
        { kind: 'badge', text: p.method, bg: methodColor.bg, fg: methodColor.fg },
        { kind: 'text', text: fmtWon(p.amount), size: '12px', weight: 600, align: 'right', numeric: true },
        { kind: 'stack', title: fmtWon(remainingAmount(p)), subtitle: p.refundedAmount > 0 ? `환불 ${fmtWon(p.refundedAmount)}` : '환불 없음' },
        { kind: 'statusDot', text: p.status, dot: statusColor.dot, fg: statusColor.fg },
        { kind: 'badge', text: match, bg: matchColor.bg, fg: matchColor.fg },
        {
          kind: 'rowMenu',
          align: 'right',
          open: openMenu === p.id,
          onToggle: () => setOpenMenu(openMenu === p.id ? null : p.id),
          items: [
            { label: '주문 보기', click: () => navigate('/orders/processing') },
            ...(p.status === '처리중' || match !== '정상' ? [{ label: '상태 재조회', click: () => setRecheckTarget(p) }] : []),
          ],
        },
      ],
    };
  });

  return (
    <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>결제 건 조회</h1>
            <p className={shared.subtitle}>B2C·C2C·B2B에서 발생한 결제 승인·취소·환불 상태를 통합 조회합니다.</p>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${shared.qfBtn} ${quickFilter === filter ? styles.quickActive : ''}`}
              onClick={() => { setQuickFilter(filter); setSelected([]); }}
            >
              <span className={shared.qfLabel}>{filter}</span>
              <span className={shared.qfCount}>{payments.filter((p) => (businessScope === '통합' || p.businessType === businessScope) && matchesQuickFilter(p, filter, payments)).length}</span>
            </button>
          ))}
        </div>

        <div className={shared.filterBox}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <input
              className={shared.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="결제번호, 주문번호, 고객명, 외부 거래번호 검색"
            />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>적용 범위</span><select aria-label="적용 범위" className={shared.selectSm} value={businessScope} onChange={(e) => setBusinessScope(e.target.value as BusinessScope)}>
              {BUSINESS_SCOPES.map((scope) => <option key={scope}>{scope}</option>)}
            </select></label>
            <label className="globalFilterField"><span>상태</span><select aria-label="상태" className={shared.selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')}>
              <option value="">전체 상태</option>
              {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select></label>
            <label className="globalFilterField"><span>결제수단</span><select aria-label="결제수단" className={shared.selectSm} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | '')}>
              <option value="">전체 결제수단</option>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select></label>
            <label className="globalFilterField"><span>외부매칭</span><select aria-label="외부매칭" className={shared.selectSm} value={matchFilter} onChange={(e) => setMatchFilter(e.target.value as ExternalMatchStatus | '')}>
              <option value="">전체 외부매칭</option>
              <option>정상</option>
              <option>상태 불일치</option>
              <option>금액 불일치</option>
              <option>외부 거래 없음</option>
            </select></label>
            <button type="button" className={shared.detailFilterBtn} onClick={() => setShowAdvanced((current) => !current)}>
              {showAdvanced ? '상세 필터 −' : '상세 필터 +'}
            </button>
            <span className={shared.rowSpacer} />
            <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
          </div>
          {showAdvanced && (
            <div className={styles.advancedFilters}>
              <label>결제일 <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
              <label>~ <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
            </div>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className={shared.bulkBar}>
          <span className={shared.bulkLabel}>{selected.length}건 선택</span>
          <button type="button" className={shared.bulkBtn} onClick={() => setDownloadOpen(true)}>다운로드</button>
        </div>
      )}

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length.toLocaleString()}건</span>
          <div className={shared.resultActions}>
            <button type="button" className={shared.downloadBtn} onClick={() => setDownloadOpen(true)}>다운로드</button>
          </div>
        </div>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="112px 72px 100px 100px 96px 88px 116px 140px 92px 100px 54px"
          minWidth="1310px"
          selectable
          allSelected={filtered.length > 0 && filtered.every((p) => selected.includes(p.id))}
          onToggleAll={() => setSelected(filtered.every((p) => selected.includes(p.id)) ? [] : filtered.map((p) => p.id))}
          empty={filtered.length === 0}
          emptyText={quickFilter === '확인 필요' ? '현재 확인이 필요한 결제가 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext="검색어나 필터 조건을 변경해 주세요."
          emptyActionLabel="필터 초기화"
          emptyActionClick={reset}
        />
      </div>

      {selectedId && (() => {
        const p = payments.find((item) => item.id === selectedId);
        return p ? (
          <PaymentDetailDrawer
            key={p.id}
            payment={p}
            onClose={() => setSelectedId(null)}
            onAddMemo={addMemo}
            onRequestRecheck={(item) => setRecheckTarget(item)}
          />
        ) : null;
      })()}

      {recheckTarget && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setRecheckTarget(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>결제 상태 재조회</h2>
            <p className={shared.dialogBody}>외부 PG에 결제 상태를 다시 조회합니다.</p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}><span>내부 상태</span><strong>{recheckTarget.status}</strong></div>
              <div className={shared.dialogSummaryRow}><span>마지막 외부 상태</span><strong>{recheckTarget.externalStatus ?? '없음'}</strong></div>
              <div className={shared.dialogSummaryRow}><span>최종 조회</span><strong>{recheckTarget.lastSyncedAt ?? '조회 이력 없음'}</strong></div>
            </div>
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setRecheckTarget(null)}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={runRecheck}>재조회</button>
            </div>
          </div>
        </div>
      )}

      {downloadOpen && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setDownloadOpen(false); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>결제 내역 다운로드</h2>
            <p className={shared.dialogBody}>
              {selected.length > 0 ? `선택한 ${selected.length}건을 다운로드합니다.` : `현재 검색 결과 ${filtered.length}건을 다운로드합니다.`}
            </p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}>
                <span>포함 항목</span>
                <strong>결제번호 · 서비스 · 주문번호 · 고객 · 결제일 · 수단 · 결제금액 · 환불금액 · 잔여금액 · 상태 · 외부거래번호</strong>
              </div>
            </div>
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setDownloadOpen(false)}>취소</button>
              <button type="button" className={styles.primaryButton} data-grid-download onClick={() => { setDownloadOpen(false); toastBriefly('결제 내역을 다운로드했습니다.'); }}>다운로드</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
