import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import styles from './RegionalShippingFeePage.module.css';
import { RegionalFeeDrawer } from './RegionalFeeDrawer';
import {
  DELIVERY_METHODS,
  INITIAL_POLICIES,
  QUICK_FILTERS,
  TEST_ADDRESSES,
  computeAddressShippingPreview,
  computeStatus,
  computeWarnings,
  fmtPeriod,
  fmtRegion,
  fmtWon,
  matchesQuickFilter,
  newRegionalFeePolicy,
  type DeliveryMethod,
  type RegionalFeePolicy,
  type QuickFilter,
  type RegionType,
} from './regionalShippingFeeData';

const TODAY = '2026-08-25';

type View = 'list' | 'preview';
type ConfirmState = { kind: 'delete' | 'end'; item: RegionalFeePolicy } | null;

const COLUMNS = [
  { label: '정책명' },
  { label: '지역유형' },
  { label: '대상지역' },
  { label: '추가배송비', align: 'right' as const },
  { label: '배송방법' },
  { label: '적용기간' },
  { label: '상태' },
  { label: '관리', align: 'right' as const },
];

const STATUS_DOT: Record<string, { dot: string; fg: string }> = {
  '적용중': { dot: '#10b981', fg: '#047857' },
  '적용 예정': { dot: '#3b82f6', fg: '#1d4ed8' },
  '종료': { dot: '#a1a1aa', fg: '#71717a' },
  '비활성': { dot: '#d4d4d8', fg: '#a1a1aa' },
};

function history(item: RegionalFeePolicy, action: string, before?: string, after?: string): RegionalFeePolicy {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}`, at: `${TODAY} 14:00`, by: 'admin01', action, before, after }],
  };
}

export function RegionalShippingFeePage() {
  const [policies, setPolicies] = useState(INITIAL_POLICIES);
  const [view, setView] = useState<View>('list');

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [regionTypeFilter, setRegionTypeFilter] = useState<RegionType | ''>('');
  const [methodFilter, setMethodFilter] = useState<DeliveryMethod | ''>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerItem, setDrawerItem] = useState<RegionalFeePolicy | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState('');

  const [previewAddrId, setPreviewAddrId] = useState(TEST_ADDRESSES[0].id);

  const warnings = useMemo(() => computeWarnings(policies), [policies]);

  const filtered = useMemo(
    () =>
      policies.filter((p) => {
        if (!matchesQuickFilter(p, quickFilter, warnings)) return false;
        if (search && !`${p.name} ${p.code} ${p.sido} ${p.sigungu}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (regionTypeFilter && p.regionType !== regionTypeFilter) return false;
        if (methodFilter && p.deliveryMethod !== methodFilter) return false;
        return true;
      }),
    [policies, quickFilter, search, regionTypeFilter, methodFilter, warnings],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const reset = () => {
    setKeyword('');
    setSearch('');
    setRegionTypeFilter('');
    setMethodFilter('');
  };
  const openCreate = () => {
    setDrawerItem(newRegionalFeePolicy());
    setIsNew(true);
  };
  const openDetail = (item: RegionalFeePolicy) => {
    setDrawerItem(item);
    setIsNew(false);
  };

  const save = (item: RegionalFeePolicy) => {
    if (isNew) {
      const saved = history({ ...item, history: [] }, '정책 등록');
      setPolicies((current) => [saved, ...current]);
      setDrawerItem(null);
      setIsNew(false);
      toastBriefly('지역 추가배송비 정책을 등록했습니다.');
    } else {
      const previous = policies.find((p) => p.id === item.id);
      const saved = previous && previous.extraFee !== item.extraFee
        ? history(item, '추가 배송비 변경', fmtWon(previous.extraFee), fmtWon(item.extraFee))
        : history(item, '정책 수정');
      setPolicies((current) => current.map((p) => (p.id === item.id ? saved : p)));
      setDrawerItem(saved);
      toastBriefly('정책을 저장했습니다.');
    }
  };

  const toggleActive = (item: RegionalFeePolicy) => {
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
        { kind: 'badge', text: p.regionType, bg: p.regionType === '우편번호' ? '#eef2ff' : '#eff6ff', fg: p.regionType === '우편번호' ? '#4338ca' : '#2563eb' },
        { kind: 'text', text: fmtRegion(p), size: '12px', color: '#3f3f46' },
        { kind: 'text', text: `+${fmtWon(p.extraFee)}`, size: '12px', weight: 600, align: 'right', numeric: true },
        { kind: 'text', text: p.deliveryMethod, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: fmtPeriod(p), size: '11px', color: '#71717a' },
        { kind: 'statusDot', text: status, dot: dotColor.dot, fg: dotColor.fg },
        {
          kind: 'rowMenu',
          align: 'right',
          detailLabel: '상세',
          onDetail: () => openDetail(p),
          open: openMenu === p.id,
          onToggle: () => setOpenMenu(openMenu === p.id ? null : p.id),
          items: [
            { label: '수정', click: () => openDetail(p) },
            ...(status === '적용중' ? [{ label: '정책 종료', click: () => setConfirm({ kind: 'end', item: p }) }] : []),
            { sep: true },
            p.active ? { label: '비활성화', fg: '#dc2626', click: () => toggleActive(p) } : { label: '활성화', click: () => toggleActive(p) },
            ...(p.usageCount === 0 ? [{ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item: p }) }] : []),
          ],
        },
      ],
    };
  });

  const previewAddr = TEST_ADDRESSES.find((a) => a.id === previewAddrId)!;
  const previewResult = computeAddressShippingPreview(previewAddr, policies);

  return (
    <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>지역별 추가 배송비</h1>
            <p className={shared.subtitle}>배송지에 따라 기본 배송비 위에 추가로 부과되는 지역 할증 배송비를 관리합니다.</p>
          </div>
          {view === 'list' && <button type="button" className={shared.createBtn} onClick={openCreate}>+ 지역 배송비 등록</button>}
        </div>

        <div className={styles.viewTabs}>
          <button type="button" className={`${styles.viewTabBtn} ${view === 'list' ? styles.viewTabActive : ''}`} onClick={() => setView('list')}>정책 목록</button>
          <button type="button" className={`${styles.viewTabBtn} ${view === 'preview' ? styles.viewTabActive : ''}`} onClick={() => setView('preview')}>지역 판정 Preview</button>
        </div>

        {view === 'list' && (
          <>
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
                <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="정책명, 정책 코드, 지역명 검색" />
                <button type="submit" className={shared.searchBtn}>검색</button>
              </form>
              <div className={shared.filterRow2}>
                <label className="globalFilterField"><span>지역유형</span><select aria-label="지역유형" className={shared.selectSm} value={regionTypeFilter} onChange={(e) => setRegionTypeFilter(e.target.value as RegionType | '')}>
                  <option value="">전체 지역유형</option>
                  <option>행정구역</option>
                  <option>우편번호</option>
                </select></label>
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
      </div>

      {view === 'list' && (
        <div className={shared.gridWrap}>
          <div className={shared.resultRow}>
            <span className={shared.resultLabel}>총 {filtered.length}개 정책</span>
          </div>
          <DataGrid
            columns={COLUMNS}
            rows={rows}
            gridTemplate="1fr 72px 122px 74px 56px 148px 70px 40px"
            minWidth="990px"
            empty={filtered.length === 0}
            emptyText={quickFilter === '확인 필요' ? '현재 확인이 필요한 지역 배송비 정책이 없습니다.' : '검색 결과가 없습니다.'}
            emptySubtext="검색어나 필터 조건을 변경해 주세요."
            emptyActionLabel="필터 초기화"
            emptyActionClick={reset}
          />
        </div>
      )}

      {view === 'preview' && (
        <div className={shared.gridWrap} style={{ marginTop: 0 }}>
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>테스트 배송지 선택</h3>
              <div className={styles.orderPick}>
                {TEST_ADDRESSES.map((a) => (
                  <button key={a.id} type="button" className={`${styles.orderOption} ${previewAddrId === a.id ? styles.orderOptionActive : ''}`} onClick={() => setPreviewAddrId(a.id)}>
                    <span><strong>{a.label}</strong> · {a.deliveryMethod}</span>
                    <span>{a.postalCode}</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 판정합니다. 기본 배송비는 배송 정책 &gt; 기본 배송비 설정을 따릅니다.</div>
            </div>
            <div className={styles.previewCard}>
              <h3>지역 판정 · 배송비 계산 결과</h3>
              <div className={`${styles.resultHero} ${previewResult.match.tie ? styles.resultHeroWarn : ''}`}>
                <span>{previewAddr.label} ({previewAddr.sido} {previewAddr.sigungu}) · {previewAddr.deliveryMethod}</span>
                <strong>{fmtWon(previewResult.finalFee)}</strong>
              </div>
              <div className={styles.breakdownTable}>
                <div className={styles.breakdownRow}><span>기본 배송비</span><span>{fmtWon(previewResult.finalBaseFee)}</span></div>
                <div className={styles.breakdownRow}><span>지역 추가배송비{previewResult.match.matched ? ` (${previewResult.match.matched.name})` : ''}</span><span>{fmtWon(previewResult.finalRegionFee)}</span></div>
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}><span>최종 배송비</span><span>{fmtWon(previewResult.finalFee)}</span></div>
              </div>
              {previewResult.match.tie && (
                <div className={styles.noteList}>
                  <div>⚠ 동일 우선순위로 매칭되는 정책이 {previewResult.match.candidates.length}건 있습니다: {previewResult.match.candidates.map((c) => c.name).join(', ')}. 정책 목록에서 우선순위를 조정해 주세요.</div>
                </div>
              )}
              <div className={styles.resultRow}><span>매칭 정책</span><strong>{previewResult.match.matched?.name ?? '매칭된 정책 없음'}</strong></div>
              <div className={styles.resultRow}><span>무료배송 적용</span><strong>{previewResult.freeShippingApplied ? '적용' : '미적용'}</strong></div>
            </div>
          </div>
        </div>
      )}

      {drawerItem && (
        <RegionalFeeDrawer
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
            <h2 className={shared.dialogTitle}>{confirm.kind === 'delete' ? '지역 배송비 정책 삭제' : '지역 배송비 정책 종료'}</h2>
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

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
