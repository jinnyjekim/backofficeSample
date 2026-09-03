import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import styles from './FeePolicyPage.module.css';
import { FeePolicyDrawer } from './FeePolicyDrawer';
import {
  FEE_TYPES,
  INITIAL_POLICIES,
  QUICK_FILTERS,
  computeStatus,
  computeWarnings,
  fmtCalc,
  fmtPeriod,
  matchesQuickFilter,
  newFeePolicy,
  type CalcMethod,
  type FeeBearer,
  type FeePolicy,
  type FeeType,
  type QuickFilter,
} from './feePolicyData';

const TODAY = '2026-08-25';

type ConfirmState = { kind: 'delete' | 'end'; item: FeePolicy } | null;

const COLUMNS = [
  { label: '정책명' },
  { label: '유형' },
  { label: '적용대상' },
  { label: '부담주체' },
  { label: '계산방식' },
  { label: '적용기간' },
  { label: '상태' },
];

const TYPE_COLOR: Record<FeeType, { bg: string; fg: string }> = {
  '거래 수수료': { bg: '#eff6ff', fg: '#2563eb' },
  '판매 수수료': { bg: '#ecfdf5', fg: '#059669' },
  '결제 수수료': { bg: '#eef2ff', fg: '#4338ca' },
  '플랫폼 수수료': { bg: '#fdf4ff', fg: '#a21caf' },
  '서비스 수수료': { bg: '#fffbeb', fg: '#b45309' },
  '배송 수수료': { bg: '#f0fdfa', fg: '#0f766e' },
  '정산 수수료': { bg: '#fef2f2', fg: '#dc2626' },
  '기타': { bg: '#f4f4f5', fg: '#52525b' },
};

const STATUS_DOT: Record<string, { dot: string; fg: string }> = {
  '적용중': { dot: '#10b981', fg: '#047857' },
  '적용 예정': { dot: '#3b82f6', fg: '#1d4ed8' },
  '종료': { dot: '#a1a1aa', fg: '#71717a' },
  '비활성': { dot: '#d4d4d8', fg: '#a1a1aa' },
};

function history(item: FeePolicy, action: string, before?: string, after?: string): FeePolicy {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}`, at: `${TODAY} 14:00`, by: 'admin01', action, before, after }],
  };
}

export function FeePolicyPage() {
  const [policies, setPolicies] = useState(INITIAL_POLICIES);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FeeType | ''>('');
  const [bearerFilter, setBearerFilter] = useState<FeeBearer | ''>('');
  const [methodFilter, setMethodFilter] = useState<CalcMethod | ''>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerItem, setDrawerItem] = useState<FeePolicy | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState('');

  const warnings = useMemo(() => computeWarnings(policies), [policies]);

  const filtered = useMemo(
    () =>
      policies.filter((p) => {
        if (!matchesQuickFilter(p, quickFilter, warnings)) return false;
        if (search && !`${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter && p.feeType !== typeFilter) return false;
        if (bearerFilter && p.bearer !== bearerFilter) return false;
        if (methodFilter && p.calcMethod !== methodFilter) return false;
        return true;
      }),
    [policies, quickFilter, search, typeFilter, bearerFilter, methodFilter, warnings],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const reset = () => {
    setKeyword('');
    setSearch('');
    setTypeFilter('');
    setBearerFilter('');
    setMethodFilter('');
  };
  const openCreate = () => {
    setDrawerItem(newFeePolicy());
    setIsNew(true);
  };
  const openDetail = (item: FeePolicy) => {
    setDrawerItem(item);
    setIsNew(false);
  };

  const save = (item: FeePolicy) => {
    if (isNew) {
      const saved = history({ ...item, history: [] }, '정책 등록');
      setPolicies((current) => [saved, ...current]);
      setDrawerItem(null);
      setIsNew(false);
      toastBriefly('수수료 정책을 등록했습니다.');
    } else {
      const previous = policies.find((p) => p.id === item.id);
      const saved = previous && previous.rate !== item.rate && item.calcMethod === '정률'
        ? history(item, '수수료율 변경', `${previous.rate}%`, `${item.rate}%`)
        : previous && previous.fixedAmount !== item.fixedAmount && item.calcMethod === '정액'
          ? history(item, '정액 수수료 변경', `${previous.fixedAmount.toLocaleString()}원`, `${item.fixedAmount.toLocaleString()}원`)
          : history(item, '정책 수정');
      setPolicies((current) => current.map((p) => (p.id === item.id ? saved : p)));
      setDrawerItem(saved);
      toastBriefly('정책을 저장했습니다.');
    }
  };

  const toggleActive = (item: FeePolicy) => {
    const updated = history({ ...item, active: !item.active }, item.active ? '정책 비활성화' : '정책 활성화');
    setPolicies((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    setDrawerItem((current) => (current && current.id === updated.id ? updated : current));
    toastBriefly(item.active ? '정책을 비활성화했습니다.' : '정책을 활성화했습니다.');
  };

  const confirmAction = () => {
    if (!confirm) return;
    if (confirm.kind === 'delete') {
      setPolicies((current) => current.filter((p) => p.id !== confirm.item.id));
      setDrawerItem(null);
      toastBriefly('사용 이력이 없는 정책을 삭제했습니다.');
    } else {
      const updated = history({ ...confirm.item, endDate: TODAY }, '정책 종료', '상시', `${TODAY} 종료`);
      setPolicies((current) => current.map((p) => (p.id === updated.id ? updated : p)));
      setDrawerItem((current) => (current && current.id === updated.id ? updated : current));
      toastBriefly('정책을 종료했습니다. 신규 거래부터 적용되지 않습니다.');
    }
    setConfirm(null);
  };

  const rows: GridRow[] = filtered.map((p) => {
    const issues = warnings[p.id] ?? [];
    const status = computeStatus(p);
    const dotColor = STATUS_DOT[status];
    const typeColor = TYPE_COLOR[p.feeType];
    return {
      id: p.id,
      onClick: () => openDetail(p),
      bg: issues.length ? '#fffdf8' : undefined,
      cells: [
        { kind: 'titleWarn', title: p.name, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'badge', text: p.feeType, bg: typeColor.bg, fg: typeColor.fg },
        { kind: 'text', text: p.applyScope === '전체 거래' ? '전체 거래' : p.applyTarget, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: p.bearer, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: fmtCalc(p), size: '12px', weight: 600, color: '#18181b' },
        { kind: 'text', text: fmtPeriod(p), size: '11px', color: '#71717a' },
        { kind: 'statusDot', text: status, dot: dotColor.dot, fg: dotColor.fg },
      ],
    };
  });

  return (
    <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>수수료 정책</h1>
            <p className={shared.subtitle}>거래에 적용되는 수수료와 계산 기준을 관리합니다.</p>
          </div>
          <button type="button" className={shared.createBtn} onClick={openCreate}>+ 수수료 정책 등록</button>
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
              <span className={shared.qfCount}>{policies.filter((p) => matchesQuickFilter(p, filter, warnings)).length}</span>
            </button>
          ))}
        </div>
        <div className={shared.filterBox}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="정책명 또는 정책 코드 검색" />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>유형</span><select aria-label="유형" className={shared.selectSm} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as FeeType | '')}>
              <option value="">전체 유형</option>
              {FEE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select></label>
            <label className="globalFilterField"><span>부담주체</span><select aria-label="부담주체" className={shared.selectSm} value={bearerFilter} onChange={(e) => setBearerFilter(e.target.value as FeeBearer | '')}>
              <option value="">전체 부담주체</option>
              <option>구매자</option>
              <option>판매자 / 공급자</option>
              <option>플랫폼</option>
            </select></label>
            <label className="globalFilterField"><span>계산방식</span><select aria-label="계산방식" className={shared.selectSm} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as CalcMethod | '')}>
              <option value="">전체 계산방식</option>
              <option>정률</option>
              <option>정액</option>
            </select></label>
            <span className={shared.rowSpacer} />
            <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
          </div>
        </div>
      </div>

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length}개 정책</span>
        </div>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="minmax(180px,1fr) 98px 98px 90px 122px 154px 74px"
          minWidth="915px"
          empty={filtered.length === 0}
          emptyText={quickFilter === '확인 필요' ? '현재 확인이 필요한 수수료 정책이 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext="검색어나 필터 조건을 변경해 주세요."
          emptyActionLabel="필터 초기화"
          emptyActionClick={reset}
        />
      </div>

      {drawerItem && (
        <FeePolicyDrawer
          key={`${drawerItem.id}-${isNew}`}
          initial={drawerItem}
          isNew={isNew}
          startEditing={isNew}
          issues={warnings[drawerItem.id] ?? []}
          onClose={() => { setDrawerItem(null); setIsNew(false); }}
          onSave={save}
          onToggleActive={toggleActive}
        />
      )}

      {confirm && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>{confirm.kind === 'delete' ? '수수료 정책 삭제' : '수수료 정책 종료'}</h2>
            <p className={shared.dialogBody}>
              {confirm.kind === 'delete'
                ? '사용 이력이 없는 정책입니다. 삭제하면 복구할 수 없습니다.'
                : '오늘 날짜로 적용 종료일을 설정합니다. 신규 거래에는 더 이상 적용되지 않으며, 이미 확정된 수수료 내역은 유지됩니다.'}
            </p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}><span>정책명</span><strong>{confirm.item.name}</strong></div>
              <div className={shared.dialogSummaryRow}><span>사용 이력</span><strong>{confirm.item.usageCount.toLocaleString()}건</strong></div>
            </div>
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dangerButton} onClick={confirmAction}>{confirm.kind === 'delete' ? '삭제' : '종료'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
