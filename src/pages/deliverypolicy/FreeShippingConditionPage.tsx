import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import styles from './FreeShippingConditionPage.module.css';
import { FreeShippingConditionDrawer } from './FreeShippingConditionDrawer';
import {
  DELIVERY_METHODS,
  INITIAL_POLICIES,
  QUICK_FILTERS,
  TEST_ORDERS,
  computeOrderShippingPreview,
  computeStatus,
  computeWarnings,
  fmtCondition,
  fmtPeriod,
  fmtWon,
  matchesQuickFilter,
  newFreeShippingPolicy,
  type DeliveryMethod,
  type FreeShippingPolicy,
  type QuickFilter,
} from './freeShippingConditionData';
import { CommonButton, showToast } from '../../components/common';

const TODAY = '2026-08-25';

type View = 'list' | 'preview';
type ConfirmState = { kind: 'delete' | 'end'; item: FreeShippingPolicy } | null;

const COLUMNS = [
  { label: '정책명' },
  { label: '조건' },
  { label: '배송방법' },
  { label: '면제 범위' },
  { label: '우선순위' },
  { label: '적용기간' },
  { label: '상태' },
];

const STATUS_DOT: Record<string, { dot: string; fg: string }> = {
  '적용중': { dot: '#10b981', fg: '#047857' },
  '적용 예정': { dot: '#3b82f6', fg: '#1d4ed8' },
  '종료': { dot: '#a1a1aa', fg: '#71717a' },
  '비활성': { dot: '#d4d4d8', fg: '#a1a1aa' },
};

function history(item: FreeShippingPolicy, action: string, before?: string, after?: string): FreeShippingPolicy {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}`, at: `${TODAY} 14:00`, by: 'admin01', action, before, after }],
  };
}

export function FreeShippingConditionPage() {
  const [policies, setPolicies] = useState(INITIAL_POLICIES);
  const [view, setView] = useState<View>('list');

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<DeliveryMethod | ''>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerItem, setDrawerItem] = useState<FreeShippingPolicy | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const [previewOrderId, setPreviewOrderId] = useState(TEST_ORDERS[0].id);

  const warnings = useMemo(() => computeWarnings(policies), [policies]);

  const filtered = useMemo(
    () =>
      policies.filter((p) => {
        if (!matchesQuickFilter(p, quickFilter, warnings)) return false;
        if (search && !`${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (methodFilter && p.deliveryMethod !== methodFilter) return false;
        return true;
      }),
    [policies, quickFilter, search, methodFilter, warnings],
  );

  const toastBriefly = (message: string) => {
    showToast({ message, type: 'success' });
  };
  const reset = () => {
    setKeyword('');
    setSearch('');
    setMethodFilter('');
  };
  const openCreate = () => {
    setDrawerItem(newFreeShippingPolicy());
    setIsNew(true);
  };
  const openDetail = (item: FreeShippingPolicy) => {
    setDrawerItem(item);
    setIsNew(false);
  };

  const save = (item: FreeShippingPolicy) => {
    if (isNew) {
      const saved = history({ ...item, history: [] }, '정책 등록');
      setPolicies((current) => [saved, ...current]);
      setDrawerItem(null);
      setIsNew(false);
      toastBriefly('무료배송 조건을 등록했습니다.');
    } else {
      const previous = policies.find((p) => p.id === item.id);
      const saved = previous && previous.threshold !== item.threshold
        ? history(item, '무료배송 기준금액 변경', fmtWon(previous.threshold), fmtWon(item.threshold))
        : history(item, '정책 수정');
      setPolicies((current) => current.map((p) => (p.id === item.id ? saved : p)));
      setDrawerItem(saved);
      toastBriefly('정책을 저장했습니다.');
    }
  };

  const toggleActive = (item: FreeShippingPolicy) => {
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
      toastBriefly('정책을 종료했습니다. 신규 주문부터 적용되지 않습니다.');
    }
    setConfirm(null);
  };

  const rows: GridRow[] = filtered.map((p) => {
    const issues = warnings[p.id] ?? [];
    const status = computeStatus(p);
    const dotColor = STATUS_DOT[status];
    return {
      id: p.id,
      onClick: () => openDetail(p),
      bg: issues.length ? '#fffdf8' : undefined,
      cells: [
        { kind: 'titleWarn', title: p.name, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'text', text: fmtCondition(p), size: '12px', weight: 600, color: '#18181b' },
        { kind: 'text', text: p.deliveryMethod, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: p.exemptionScope, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: `${p.priority}`, size: '12px', color: '#71717a', align: 'right', numeric: true },
        { kind: 'text', text: fmtPeriod(p), size: '11px', color: '#71717a' },
        { kind: 'statusDot', text: status, dot: dotColor.dot, fg: dotColor.fg },
      ],
    };
  });

  const previewOrder = TEST_ORDERS.find((o) => o.id === previewOrderId)!;
  const previewResult = computeOrderShippingPreview(previewOrder, policies);

  return (
    <div className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={shared.title}>무료 배송 조건</div>
            <div className={shared.subtitle}>어떤 주문이 어떤 조건을 충족했을 때 배송비를 면제할지 관리합니다.</div>
          </div>
          {view === 'list' && <button type="button" className={shared.createBtn} onClick={openCreate}>+ 무료배송 조건 등록</button>}
        </div>

        <div className={shared.quickFilters}>
          <CommonButton
            type="button"
            variant={view === 'list' ? 'primary-light' : 'secondary'}
            size="md"
            className={`${shared.qfBtn} ${view === 'list' ? styles.quickActive : ''}`}
            onClick={() => setView('list')}
          >
            <span className={shared.qfLabel}>정책 목록</span>
          </CommonButton>
          <CommonButton
            type="button"
            variant={view === 'preview' ? 'primary-light' : 'secondary'}
            size="md"
            className={`${shared.qfBtn} ${view === 'preview' ? styles.quickActive : ''}`}
            onClick={() => setView('preview')}
          >
            <span className={shared.qfLabel}>정책 Preview</span>
          </CommonButton>
        </div>

        {view === 'list' && (
          <>
            <div className={shared.quickFilters}>
              {QUICK_FILTERS.map((filter) => {
                const active = quickFilter === filter;
                return (
                  <CommonButton
                    key={filter}
                    variant={active ? 'primary-light' : 'secondary'}
                    size="md"
                    className={`${shared.qfBtn} ${active ? styles.quickActive : ''}`}
                    onClick={() => setQuickFilter(filter)}
                  >
                    <span className={shared.qfLabel}>{filter}</span>
                    <span className={shared.qfCount}>{policies.filter((p) => matchesQuickFilter(p, filter, warnings)).length}</span>
                  </CommonButton>
                );
              })}
            </div>
            <div className={shared.filterBox}>
              <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
                <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="정책명, 정책 코드 검색" />
                <button type="submit" className={shared.searchBtn}>검색</button>
              </form>
              <div className={shared.filterRow2}>
                <label className="globalFilterField"><span>배송방법</span><select aria-label="배송방법" className={shared.selectSm} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as DeliveryMethod | '')}>
                  <option value="">전체 배송방법</option>
                  {DELIVERY_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select></label>
                <span className={shared.rowSpacer} />
                <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
              </div>
            </div>
          </>
        )}
      </header>

      {view === 'list' && (
        <div className={shared.gridWrap}>
          <div className={shared.resultRow}>
            <span className={shared.resultLabel}>총 {filtered.length}개 정책</span>
          </div>
          <DataGrid
            columns={COLUMNS}
            rows={rows}
            gridTemplate="1fr 98px 56px 70px 52px 156px 70px"
            minWidth="900px"
            empty={filtered.length === 0}
            emptyText={quickFilter === '확인 필요' ? '현재 확인이 필요한 무료배송 조건이 없습니다.' : '검색 결과가 없습니다.'}
            emptySubtext={filtered.length === 0 && policies.length === 0 ? '현재 모든 주문에는 기본 배송비 정책이 적용됩니다.' : '검색어나 필터 조건을 변경해 주세요.'}
            emptyActionLabel="필터 초기화"
            emptyActionClick={reset}
          />
        </div>
      )}

      {view === 'preview' && (
        <div className={shared.gridWrap} style={{ marginTop: 0 }}>
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>테스트 주문 선택</h3>
              <div className={styles.orderPick}>
                {TEST_ORDERS.map((o) => (
                  <button key={o.id} type="button" className={`${styles.orderOption} ${previewOrderId === o.id ? styles.orderOptionActive : ''}`} onClick={() => setPreviewOrderId(o.id)}>
                    <span><strong>{o.target}</strong> · {o.deliveryMethod}</span>
                    <span>{fmtWon(o.productAmount)}</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 판정합니다. 기본 배송비는 배송 정책 &gt; 기본 배송비 설정을 따릅니다.</div>
            </div>
            <div className={styles.previewCard}>
              <h3>무료배송 판정 · 배송비 계산 결과</h3>
              <div className={`${styles.resultHero} ${previewResult.match.tie ? styles.resultHeroWarn : !previewResult.match.matched ? styles.resultHeroPaid : ''}`}>
                <span>{previewOrder.target} · {previewOrder.deliveryMethod} · {fmtWon(previewOrder.productAmount)}</span>
                <strong>{previewResult.match.matched ? '무료배송 적용' : '무료배송 미적용'}</strong>
              </div>
              <div className={styles.breakdownTable}>
                <div className={styles.breakdownRow}><span>기본 배송비</span><span>{fmtWon(previewResult.finalBaseFee)}</span></div>
                <div className={styles.breakdownRow}><span>지역 추가배송비 (예시)</span><span>{fmtWon(previewResult.finalRegionFee)}</span></div>
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}><span>최종 배송비</span><span>{fmtWon(previewResult.finalFee)}</span></div>
              </div>
              {previewResult.match.tie && (
                <div className={styles.noteList}>
                  <div>⚠ 동일 우선순위로 매칭되는 정책이 {previewResult.match.candidates.length}건 있습니다: {previewResult.match.candidates.map((c) => c.name).join(', ')}. 정책 목록에서 우선순위를 조정해 주세요.</div>
                </div>
              )}
              {!previewResult.match.matched && previewResult.match.shortfall && (
                <div className={styles.noteList}>
                  <div>ℹ {fmtWon(previewResult.match.shortfall.amount)} 더 구매하면 '{previewResult.match.shortfall.policy.name}' 조건으로 무료배송이 적용됩니다.</div>
                </div>
              )}
              <div className={styles.resultRow}><span>판정 기준금액</span><strong>{fmtWon(previewResult.basisAmount)}</strong></div>
              <div className={styles.resultRow}><span>매칭 정책</span><strong>{previewResult.match.matched?.name ?? '없음'}</strong></div>
              {previewResult.match.matched && <div className={styles.resultRow}><span>면제 범위</span><strong>{previewResult.match.matched.exemptionScope}</strong></div>}
            </div>
          </div>
        </div>
      )}

      {drawerItem && (
        <FreeShippingConditionDrawer
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
            <h2 className={shared.dialogTitle}>{confirm.kind === 'delete' ? '무료배송 조건 삭제' : '무료배송 조건 종료'}</h2>
            <p className={shared.dialogBody}>
              {confirm.kind === 'delete'
                ? '사용 이력이 없는 정책입니다. 삭제하면 복구할 수 없습니다.'
                : '오늘 날짜로 적용 종료일을 설정합니다. 신규 주문에는 더 이상 적용되지 않습니다.'}
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

    </div>
  );
}
