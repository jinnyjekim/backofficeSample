import { useMemo, useRef, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import drawerShared from '../ops/opsDrawerShared.module.css';
import styles from './BundleShippingPage.module.css';
import { BundleGroupDrawer } from './BundleGroupDrawer';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  DELIVERY_METHODS,
  INITIAL_BASE_SETTINGS,
  INITIAL_GROUPS,
  QUICK_FILTERS,
  TEST_SCENARIOS,
  WAREHOUSES,
  computeOrderShippingPreview,
  computeWarnings,
  fmtWon,
  matchesQuickFilter,
  newGroup,
  productName,
  type BaseBundleSettings,
  type BundleDeliveryMethod,
  type BundleGroup,
  type NoGroupHandling,
  type QuickFilter,
} from './bundleShippingData';

const TODAY = '2026-08-25';

type ConfirmState = { kind: 'delete' | 'deactivate' | 'activate'; item: BundleGroup } | null;

function history(item: BundleGroup, action: string, before?: string, after?: string): BundleGroup {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 15:00`, by: 'admin01', action, before, after }],
  };
}

export function BundleShippingPage() {
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [baseSettings, setBaseSettings] = useState(INITIAL_BASE_SETTINGS);
  const [editingBase, setEditingBase] = useState(false);
  const [draftBase, setDraftBase] = useState<BaseBundleSettings>(INITIAL_BASE_SETTINGS);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<BundleDeliveryMethod | ''>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState('');

  const [showTest, setShowTest] = useState(false);
  const [scenarioId, setScenarioId] = useState(TEST_SCENARIOS[0].id);

  const testAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(testAsideRef, () => setShowTest(false), showTest);

  const warnings = useMemo(() => computeWarnings(groups), [groups]);

  const filtered = useMemo(
    () =>
      groups.filter((g) => {
        if (!matchesQuickFilter(g, quickFilter, warnings)) return false;
        if (search && !`${g.name} ${g.code}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (warehouseFilter && g.warehouse !== warehouseFilter) return false;
        if (methodFilter && g.deliveryMethod !== methodFilter) return false;
        return true;
      }),
    [groups, quickFilter, search, warehouseFilter, methodFilter, warnings],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const reset = () => {
    setKeyword('');
    setSearch('');
    setWarehouseFilter('');
    setMethodFilter('');
  };

  const openCreate = () => {
    setDrawerId('new');
    setIsNew(true);
  };
  const openDetail = (id: string) => {
    setDrawerId(id);
    setIsNew(false);
  };
  const drawerItem: BundleGroup | null = useMemo(
    () => (drawerId === 'new' ? newGroup() : drawerId ? groups.find((g) => g.id === drawerId) ?? null : null),
    [drawerId, groups],
  );

  const save = (item: BundleGroup) => {
    if (isNew) {
      const saved = history({ ...item, history: [] }, '그룹 생성');
      setGroups((current) => [saved, ...current]);
      setDrawerId(null);
      setIsNew(false);
      toastBriefly('묶음 배송 그룹을 등록했습니다.');
    } else {
      const previous = groups.find((g) => g.id === item.id);
      const saved = previous ? history(item, '그룹 정보 수정') : item;
      setGroups((current) => current.map((g) => (g.id === item.id ? saved : g)));
      toastBriefly('그룹을 저장했습니다.');
    }
  };

  const toggleStatus = (item: BundleGroup) => {
    setConfirm({ kind: item.status === '사용' ? 'deactivate' : 'activate', item });
  };

  const addMemo = (id: string, text: string) => {
    setGroups((current) => current.map((g) => (g.id === id ? { ...g, memos: [...g.memos, { id: `M-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', text }] } : g)));
  };

  const confirmAction = () => {
    if (!confirm) return;
    if (confirm.kind === 'delete') {
      setGroups((current) => current.filter((g) => g.id !== confirm.item.id));
      setDrawerId(null);
      toastBriefly('그룹을 삭제했습니다.');
    } else if (confirm.kind === 'deactivate') {
      const updated = history({ ...confirm.item, status: '비활성' }, '그룹 비활성화');
      setGroups((current) => current.map((g) => (g.id === updated.id ? updated : g)));
      toastBriefly('그룹을 비활성화했습니다. 연결 상품은 상품별/기본 배송 정책 기준으로 계산됩니다.');
    } else {
      const updated = history({ ...confirm.item, status: '사용' }, '그룹 활성화');
      setGroups((current) => current.map((g) => (g.id === updated.id ? updated : g)));
      toastBriefly('그룹을 활성화했습니다.');
    }
    setConfirm(null);
  };

  const saveBaseSettings = () => {
    setBaseSettings({ ...draftBase, updatedAt: TODAY, updatedBy: 'admin01' });
    setEditingBase(false);
    toastBriefly('기본 묶음배송 설정을 저장했습니다.');
  };

  const calcSummary = (g: BundleGroup) => {
    if (g.calcMethod === '그룹당 고정 배송비') return `그룹당 ${fmtWon(g.groupFee)}`;
    return g.calcMethod;
  };

  const rows: GridRow[] = filtered.map((g) => {
    const issues = warnings[g.id] ?? [];
    return {
      id: g.id,
      onClick: () => openDetail(g.id),
      bg: issues.length ? '#fffdf8' : undefined,
      cells: [
        { kind: 'titleWarn', title: `${g.name} · ${g.code}`, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'text', text: `${g.productCodes.length}개`, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: g.warehouse, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: g.deliveryMethod, size: '12px', color: '#3f3f46' },
        { kind: 'text', text: calcSummary(g), size: '12px', weight: 600, color: '#18181b' },
        { kind: 'badge', text: g.regionalFeePolicy === '별도 정책 설정' ? '별도' : '기본', bg: g.regionalFeePolicy === '별도 정책 설정' ? '#eef2ff' : '#f4f4f5', fg: g.regionalFeePolicy === '별도 정책 설정' ? '#4338ca' : '#71717a' },
        { kind: 'statusDot', text: g.status, dot: g.status === '사용' ? '#10b981' : '#a1a1aa', fg: g.status === '사용' ? '#047857' : '#71717a' },
        {
          kind: 'rowMenu',
          align: 'right',
          detailLabel: '상세',
          onDetail: () => openDetail(g.id),
          open: openMenu === g.id,
          onToggle: () => setOpenMenu(openMenu === g.id ? null : g.id),
          items: [
            { label: '수정', click: () => openDetail(g.id) },
            g.status === '사용' ? { label: '비활성화', click: () => setConfirm({ kind: 'deactivate', item: g }) } : { label: '활성화', click: () => setConfirm({ kind: 'activate', item: g }) },
            ...(g.orderUsageCount === 0 ? [{ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item: g }) }] : []),
          ],
        },
      ],
    };
  });

  const scenario = TEST_SCENARIOS.find((s) => s.id === scenarioId)!;
  const result = computeOrderShippingPreview(scenario, groups, baseSettings);

  return (
    <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>묶음 배송</h1>
            <p className={shared.subtitle}>여러 상품을 함께 주문했을 때 묶음배송과 배송비 계산 기준을 관리합니다.</p>
          </div>
          <div className={styles.topActions}>
            <button type="button" className={styles.testBtn} onClick={() => setShowTest(true)}>배송비 계산 테스트</button>
            <button type="button" className={shared.createBtn} onClick={openCreate}>+ 그룹 등록</button>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((filter) => (
            <button key={filter} type="button" className={`${shared.qfBtn} ${quickFilter === filter ? styles.quickActive : ''}`} onClick={() => setQuickFilter(filter)}>
              <span className={shared.qfLabel}>{filter}</span>
              <span className={shared.qfCount}>{groups.filter((g) => matchesQuickFilter(g, filter, warnings)).length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.settingsCard}>
        <div className={styles.settingsHead}>
          <span className={styles.settingsTitle}>기본 묶음배송 설정</span>
          {editingBase ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={styles.cancelButton} onClick={() => { setDraftBase(baseSettings); setEditingBase(false); }}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={saveBaseSettings}>저장</button>
            </div>
          ) : (
            <button type="button" className={styles.editLink} onClick={() => { setDraftBase(baseSettings); setEditingBase(true); }}>수정</button>
          )}
        </div>
        {editingBase ? (
          <>
            <label className={styles.toggleField} style={{ marginTop: 12 }}>
              <span>묶음배송 사용</span>
              <button type="button" className={`${styles.switch} ${draftBase.enabled ? styles.switchOn : ''}`} onClick={() => setDraftBase({ ...draftBase, enabled: !draftBase.enabled })}><i /></button>
            </label>
            <div className={styles.formGrid} style={{ marginTop: 8 }}>
              <label className={drawerShared.checkRow}>
                <input type="checkbox" checked={draftBase.requireSameWarehouse} onChange={(e) => setDraftBase({ ...draftBase, requireSameWarehouse: e.target.checked })} /> 같은 출고지
              </label>
              <label className={drawerShared.checkRow}>
                <input type="checkbox" checked={draftBase.requireSameMethod} onChange={(e) => setDraftBase({ ...draftBase, requireSameMethod: e.target.checked })} /> 같은 배송 방식
              </label>
            </div>
            <label className={styles.formField} style={{ marginTop: 10 }}>
              <span>배송 그룹이 없는 상품</span>
              <div className={styles.radioGroup}>
                {(['상품별 배송비 각각 계산', '기본 배송 그룹으로 처리'] as NoGroupHandling[]).map((v) => (
                  <label key={v}><input type="radio" checked={draftBase.noGroupHandling === v} onChange={() => setDraftBase({ ...draftBase, noGroupHandling: v })} />{v}</label>
                ))}
              </div>
            </label>
          </>
        ) : (
          <div className={styles.settingsGrid}>
            <div className={styles.settingsField}><span className={styles.settingsLabel}>묶음배송 사용</span><span className={styles.settingsValue}>{baseSettings.enabled ? '사용' : '사용 안 함'}</span></div>
            <div className={styles.settingsField}><span className={styles.settingsLabel}>묶음배송 기본 조건</span><span className={styles.settingsValue}>{[baseSettings.requireSameWarehouse && '같은 출고지', baseSettings.requireSameMethod && '같은 배송 방식'].filter(Boolean).join(' · ') || '없음'}</span></div>
            <div className={styles.settingsField}><span className={styles.settingsLabel}>배송 그룹이 없는 상품</span><span className={styles.settingsValue}>{baseSettings.noGroupHandling}</span></div>
            <div className={styles.settingsField}><span className={styles.settingsLabel}>무료배송 상품 혼합 처리</span><span className={styles.settingsValue}>해당 상품만 무료</span></div>
          </div>
        )}
      </div>

      <div className={shared.filterBox} style={{ margin: '0 24px 16px' }}>
        <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
          <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="그룹명, 그룹코드 검색" />
          <button type="submit" className={shared.searchBtn}>검색</button>
        </form>
        <div className={shared.filterRow2}>
          <select className={shared.selectSm} value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
            <option value="">전체 출고지</option>
            {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
          </select>
          <select className={shared.selectSm} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as BundleDeliveryMethod | '')}>
            <option value="">전체 배송방식</option>
            {DELIVERY_METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
          <span className={shared.rowSpacer} />
          <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
        </div>
      </div>

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length}개 그룹</span>
        </div>
        <DataGrid
          columns={[
            { label: '그룹명' }, { label: '상품수' }, { label: '출고지' }, { label: '배송방식' },
            { label: '배송비 계산' }, { label: '지역비' }, { label: '상태' }, { label: '관리', align: 'right' as const },
          ]}
          rows={rows}
          gridTemplate="1.3fr 80px 100px 90px 140px 70px 84px 70px"
          minWidth="1120px"
          empty={filtered.length === 0}
          emptyText={groups.length === 0 ? '등록된 묶음 배송 그룹이 없습니다.' : quickFilter === '설정 확인' ? '현재 확인이 필요한 묶음배송 설정이 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext={groups.length === 0 ? '상품별 배송비를 묶어서 계산하려면 배송 그룹을 등록해 주세요.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={groups.length === 0 ? '+ 묶음 배송 그룹 등록' : '필터 초기화'}
          emptyActionClick={groups.length === 0 ? openCreate : reset}
        />
      </div>

      {drawerItem && (
        <BundleGroupDrawer
          key={`${drawerItem.id}-${isNew}`}
          group={drawerItem}
          allGroups={groups}
          isNew={isNew}
          startEditing={isNew}
          issues={warnings[drawerItem.id] ?? []}
          onClose={() => { setDrawerId(null); setIsNew(false); }}
          onSave={save}
          onToggleStatus={toggleStatus}
          onDelete={(item) => setConfirm({ kind: 'delete', item })}
          onAddMemo={(text) => addMemo(drawerItem.id, text)}
        />
      )}

      {showTest && (
        <aside ref={testAsideRef} className={`${drawerShared.aside} ${styles.testDrawer}`} aria-label="배송비 계산 테스트">
          <div className={drawerShared.head}>
            <div className={drawerShared.headRow}>
              <div className={drawerShared.headBody}>
                <div className={drawerShared.eyebrow}>묶음 배송 · 배송비 계산 테스트</div>
                <h2 className={drawerShared.title}>주문 배송비 계산 Preview</h2>
              </div>
              <button type="button" className={drawerShared.closeBtn} onClick={() => setShowTest(false)}>✕</button>
            </div>
          </div>
          <div className={drawerShared.scroll}>
            <div className={styles.previewCard} style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700 }}>테스트 주문 선택</h3>
              <div className={styles.orderPick}>
                {TEST_SCENARIOS.map((s) => (
                  <button key={s.id} type="button" className={`${styles.orderOption} ${scenarioId === s.id ? styles.orderOptionActive : ''}`} onClick={() => setScenarioId(s.id)}>
                    <span><strong>{s.label}</strong> · {s.items.map((it) => productName(it.productCode)).join(' + ')}</span>
                    <span>{s.region}</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 그룹 정책과 기본 묶음배송 설정 기준으로 계산합니다.</div>
            </div>

            <div className={styles.resultHero}>
              <span>{scenario.label}</span>
              <strong>{fmtWon(result.total)}</strong>
            </div>

            {result.units.map((u) => (
              <div key={u.key} className={styles.unitCard}>
                <div className={styles.unitHead}>
                  <span className={styles.unitLabel}>{u.label}</span>
                  <span className={styles.unitTotal}>{fmtWon(u.unitTotal)}</span>
                </div>
                <div className={styles.unitReason}>{u.reason}</div>
                <div className={styles.unitItems}>
                  {u.items.map((it) => <span key={it.code} className={styles.unitItemChip}>{it.name} × {it.qty}</span>)}
                </div>
                <div className={styles.unitBreakdown}>
                  <span>배송비 {fmtWon(u.fee)}</span>
                  <span>지역 추가비 {fmtWon(u.regionFee)}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {confirm && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>
              {confirm.kind === 'delete' ? '묶음 배송 그룹 삭제' : confirm.kind === 'deactivate' ? '묶음 배송 그룹 비활성화' : '묶음 배송 그룹 활성화'}
            </h2>
            <p className={shared.dialogBody}>
              {confirm.kind === 'delete' && '주문 적용 이력이 없는 그룹입니다. 삭제하면 복구할 수 없습니다.'}
              {confirm.kind === 'deactivate' && '비활성화 후 연결 상품은 상품별 배송 정책 또는 기본 배송 정책 기준으로 배송비가 계산됩니다.'}
              {confirm.kind === 'activate' && '그룹을 다시 활성화하면 연결 상품에 그룹 배송비 정책이 적용됩니다.'}
            </p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}><span>그룹명</span><strong>{confirm.item.name}</strong></div>
              <div className={shared.dialogSummaryRow}><span>연결 상품</span><strong>{confirm.item.productCodes.length}개</strong></div>
              <div className={shared.dialogSummaryRow}><span>주문 적용 이력</span><strong>{confirm.item.orderUsageCount.toLocaleString()}건</strong></div>
            </div>
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={confirm.kind === 'delete' ? styles.dangerButton : styles.primaryButton} onClick={confirmAction}>
                {confirm.kind === 'delete' ? '삭제' : confirm.kind === 'deactivate' ? '비활성화' : '활성화'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
