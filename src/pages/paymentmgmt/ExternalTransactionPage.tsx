import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import { useNavigate } from 'react-router-dom';
import shared from '../ops/opsShared.module.css';
import styles from './ExternalTransactionPage.module.css';
import { ExternalTxDetailDrawer } from './ExternalTxDetailDrawer';
import {
  INITIAL_EXTERNAL_TX,
  QUICK_FILTERS,
  STATUS_LABEL,
  applyRecheck,
  computeIssues,
  computeMatchStatus,
  computeStaleSyncWarnings,
  fmtWon,
  matchesQuickFilter,
  splitAt,
  type ExternalRawStatus,
  type ExternalTransaction,
  type MatchStatus,
  type QuickFilter,
} from './externalTransactionData';
import { INITIAL_PAYMENTS, PAYMENT_METHODS, type PaymentMethod } from './paymentListData';

const COLUMNS = [
  { label: '외부거래번호' },
  { label: '거래일시' },
  { label: 'PG' },
  { label: '수단' },
  { label: '금액', align: 'right' as const },
  { label: '외부상태' },
  { label: '내부결제' },
  { label: '매칭' },
  { label: '관리', align: 'right' as const },
];

const MATCH_COLOR: Record<MatchStatus, { bg: string; fg: string }> = {
  '정상': { bg: '#ecfdf5', fg: '#059669' },
  '미매칭': { bg: '#f4f4f5', fg: '#71717a' },
  '상태 불일치': { bg: '#fef2f2', fg: '#dc2626' },
  '금액 불일치': { bg: '#fef2f2', fg: '#dc2626' },
  '중복 의심': { bg: '#fffbeb', fg: '#b45309' },
};

const STATUS_COLOR: Record<ExternalRawStatus, { bg: string; fg: string }> = {
  PAID: { bg: '#ecfdf5', fg: '#047857' },
  FAILED: { bg: '#fef2f2', fg: '#dc2626' },
  CANCELED: { bg: '#f4f4f5', fg: '#52525b' },
  PROCESSING: { bg: '#eff6ff', fg: '#1d4ed8' },
};

const PG_OPTIONS = ['PG 01', 'PG 02'];

export function ExternalTransactionPage() {
  const navigate = useNavigate();
  const [txList, setTxList] = useState(INITIAL_EXTERNAL_TX);
  const [payments] = useState(INITIAL_PAYMENTS);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [pgFilter, setPgFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recheckTarget, setRecheckTarget] = useState<ExternalTransaction | null>(null);
  const [toast, setToast] = useState('');

  const syncWarnings = useMemo(() => computeStaleSyncWarnings(txList), [txList]);

  const filtered = useMemo(
    () =>
      txList.filter((tx) => {
        if (!matchesQuickFilter(tx, quickFilter, txList, payments)) return false;
        if (search) {
          const haystack = `${tx.id} ${tx.linkedPaymentId ?? ''}`.toLowerCase();
          if (!haystack.includes(search.toLowerCase())) return false;
        }
        if (pgFilter && tx.pg !== pgFilter) return false;
        if (methodFilter && tx.method !== methodFilter) return false;
        if (dateFrom && tx.occurredAt.slice(0, 10) < dateFrom) return false;
        if (dateTo && tx.occurredAt.slice(0, 10) > dateTo) return false;
        return true;
      }).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [txList, quickFilter, search, pgFilter, methodFilter, dateFrom, dateTo, payments],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const reset = () => {
    setKeyword('');
    setSearch('');
    setPgFilter('');
    setMethodFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const addMemo = (id: string, text: string) => {
    setTxList((current) => current.map((tx) => (tx.id === id ? { ...tx, memos: [...tx.memos, { id: `M-${id}-${Date.now()}`, at: '2026-08-25 14:00', by: 'admin01', text }] } : tx)));
  };

  const runRecheck = () => {
    if (!recheckTarget) return;
    const { updated, message } = applyRecheck(recheckTarget, txList, payments);
    setTxList((current) => current.map((tx) => (tx.id === updated.id ? updated : tx)));
    setRecheckTarget(null);
    toastBriefly(message);
  };

  const rows: GridRow[] = filtered.map((tx) => {
    const match = computeMatchStatus(tx, txList, payments);
    const issues = computeIssues(tx, txList, payments);
    const matchColor = MATCH_COLOR[match];
    const statusColor = STATUS_COLOR[tx.externalStatus];
    const [date, time] = splitAt(tx.occurredAt);
    return {
      id: tx.id,
      onClick: () => setSelectedId(tx.id),
      bg: issues.length ? '#fffdf8' : undefined,
      cells: [
        { kind: 'titleWarn', title: tx.id, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'stack', title: date, subtitle: time },
        { kind: 'text', text: tx.pg, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: tx.method, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: fmtWon(tx.amount), size: '12px', weight: 600, align: 'right', numeric: true },
        { kind: 'badge', text: STATUS_LABEL[tx.externalStatus], bg: statusColor.bg, fg: statusColor.fg },
        { kind: 'text', text: tx.linkedPaymentId ?? '-', size: '12px', color: tx.linkedPaymentId ? '#3f3f46' : '#a1a1aa' },
        { kind: 'badge', text: match, bg: matchColor.bg, fg: matchColor.fg },
        {
          kind: 'rowMenu',
          align: 'right',
          detailLabel: '상세',
          onDetail: () => setSelectedId(tx.id),
          open: openMenu === tx.id,
          onToggle: () => setOpenMenu(openMenu === tx.id ? null : tx.id),
          items: [
            { label: '상세 보기', click: () => setSelectedId(tx.id) },
            ...(tx.linkedPaymentId ? [{ label: '내부 결제 보기', click: () => navigate('/payment-mgmt/list', { state: { openPaymentId: tx.linkedPaymentId } }) }] : []),
            ...(match !== '정상' ? [{ label: '상태 재조회', click: () => setRecheckTarget(tx) }] : []),
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
            <h1 className={shared.title}>PG / 외부 거래</h1>
            <p className={shared.subtitle}>PG·은행 등 외부 결제 거래와 내부 결제 데이터의 일치 여부를 확인합니다.</p>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${shared.qfBtn} ${quickFilter === filter ? styles.quickActive : ''}`}
              onClick={() => setQuickFilter(filter)}
            >
              <span className={shared.qfLabel}>{filter}</span>
              <span className={shared.qfCount}>{txList.filter((tx) => matchesQuickFilter(tx, filter, txList, payments)).length}</span>
            </button>
          ))}
        </div>

        <div className={shared.filterBox}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <input
              className={shared.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="외부 거래번호, 내부 결제번호 검색"
            />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>외부 연동</span><select aria-label="외부 연동" className={shared.selectSm} value={pgFilter} onChange={(e) => setPgFilter(e.target.value)}>
              <option value="">전체 외부 연동</option>
              {PG_OPTIONS.map((pg) => <option key={pg}>{pg}</option>)}
            </select></label>
            <label className="globalFilterField"><span>결제수단</span><select aria-label="결제수단" className={shared.selectSm} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | '')}>
              <option value="">전체 결제수단</option>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select></label>
            <button type="button" className={shared.detailFilterBtn} onClick={() => setShowAdvanced((current) => !current)}>
              {showAdvanced ? '상세 필터 −' : '상세 필터 +'}
            </button>
            <span className={shared.rowSpacer} />
            <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
          </div>
          {showAdvanced && (
            <div className={styles.advancedFilters}>
              <label>거래일 <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
              <label>~ <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
            </div>
          )}
        </div>

        {syncWarnings.length > 0 && (
          <div className={styles.issueBanner}>
            <strong>외부 연동 확인 필요</strong>
            {syncWarnings.map((w) => <span key={w.pg}>⚠ {w.pg} 거래 정보가 최근 동기화되지 않았습니다. 마지막 정상 동기화: {w.lastSyncedAt}</span>)}
          </div>
        )}
      </div>

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length.toLocaleString()}건</span>
        </div>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="120px 88px 52px 60px 90px 78px 78px 88px 46px"
          minWidth="810px"
          empty={filtered.length === 0}
          emptyText={quickFilter === '미매칭' ? '현재 미매칭 외부 거래가 없습니다.' : quickFilter === '확인 필요' ? '현재 확인이 필요한 외부 거래가 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext={quickFilter === '미매칭' ? '모든 외부 거래가 내부 결제와 정상적으로 연결되어 있습니다.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel="필터 초기화"
          emptyActionClick={reset}
        />
      </div>

      {selectedId && (() => {
        const tx = txList.find((item) => item.id === selectedId);
        return tx ? (
          <ExternalTxDetailDrawer
            key={tx.id}
            tx={tx}
            all={txList}
            payments={payments}
            onClose={() => setSelectedId(null)}
            onAddMemo={addMemo}
            onRequestRecheck={(item) => setRecheckTarget(item)}
          />
        ) : null;
      })()}

      {recheckTarget && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setRecheckTarget(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>외부 거래 상태 재조회</h2>
            <p className={shared.dialogBody}>외부 PG/은행에 거래 상태를 다시 조회합니다.</p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}><span>외부 거래번호</span><strong>{recheckTarget.id}</strong></div>
              <div className={shared.dialogSummaryRow}><span>외부 상태</span><strong>{STATUS_LABEL[recheckTarget.externalStatus]}</strong></div>
              <div className={shared.dialogSummaryRow}><span>마지막 조회</span><strong>{recheckTarget.lastSyncedAt}</strong></div>
            </div>
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setRecheckTarget(null)}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={runRecheck}>재조회</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
