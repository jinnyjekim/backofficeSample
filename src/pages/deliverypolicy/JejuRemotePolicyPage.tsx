import { useMemo, useRef, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import drawerShared from '../ops/opsDrawerShared.module.css';
import styles from './JejuRemotePolicyPage.module.css';
import { JejuRegionDrawer } from './JejuRegionDrawer';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  INITIAL_BASE_POLICY,
  INITIAL_REGIONS,
  QUICK_FILTERS,
  TEST_SCENARIOS,
  computeJejuShippingPreview,
  computeWarnings,
  effectiveExtraFee,
  fmtWon,
  matchesQuickFilter,
  newRegion,
  type BasePolicy,
  type DeliverableStatus,
  type FreeShippingTreatment,
  type QuickFilter,
  type RemoteDeliverable,
  type SpecialRegion,
} from './jejuRemotePolicyData';
import { CommonButton } from '../../components/common';

const TODAY = '2026-08-25';

function history(item: SpecialRegion, action: string, before?: string, after?: string): SpecialRegion {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 15:00`, by: 'admin01', action, before, after }],
  };
}

export function JejuRemotePolicyPage() {
  const [regions, setRegions] = useState(INITIAL_REGIONS);
  const [basePolicy, setBasePolicy] = useState(INITIAL_BASE_POLICY);
  const [editingBase, setEditingBase] = useState(false);
  const [draftBase, setDraftBase] = useState<BasePolicy>(INITIAL_BASE_POLICY);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toast, setToast] = useState('');
  const [showTest, setShowTest] = useState(false);
  const [scenarioId, setScenarioId] = useState(TEST_SCENARIOS[0].id);

  const testAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(testAsideRef, () => setShowTest(false), showTest);

  const warnings = useMemo(() => computeWarnings(regions), [regions]);

  const filtered = useMemo(
    () =>
      regions.filter((r) => {
        if (!matchesQuickFilter(r, quickFilter, warnings)) return false;
        if (search && !`${r.name} ${r.postalCodes.join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [regions, quickFilter, search, warnings],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const reset = () => {
    setKeyword('');
    setSearch('');
  };

  const openCreate = () => {
    setDrawerId('new');
    setIsNew(true);
  };
  const openDetail = (id: string) => {
    setDrawerId(id);
    setIsNew(false);
  };
  const drawerItem: SpecialRegion | null = useMemo(
    () => (drawerId === 'new' ? newRegion() : drawerId ? regions.find((r) => r.id === drawerId) ?? null : null),
    [drawerId, regions],
  );

  const save = (item: SpecialRegion) => {
    if (isNew) {
      const saved = history({ ...item, history: [] }, '지역 등록');
      setRegions((current) => [saved, ...current]);
      setDrawerId(null);
      setIsNew(false);
      toastBriefly('특수지역을 등록했습니다.');
    } else {
      const previous = regions.find((r) => r.id === item.id);
      const saved = previous ? history(item, '지역 정보 수정') : item;
      setRegions((current) => current.map((r) => (r.id === item.id ? saved : r)));
      toastBriefly('지역 정보를 저장했습니다.');
    }
  };

  const toggleStatus = (item: SpecialRegion) => {
    const updated = history({ ...item, status: item.status === '사용' ? '비활성' : '사용' }, item.status === '사용' ? '지역 비활성화' : '지역 활성화');
    setRegions((current) => current.map((r) => (r.id === updated.id ? updated : r)));
    toastBriefly(item.status === '사용' ? '지역을 비활성화했습니다.' : '지역을 활성화했습니다.');
  };

  const addMemo = (id: string, text: string) => {
    setRegions((current) => current.map((r) => (r.id === id ? { ...r, memos: [...r.memos, { id: `M-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', text }] } : r)));
  };

  const saveBasePolicy = () => {
    setBasePolicy({ ...draftBase, updatedAt: TODAY, updatedBy: 'admin01' });
    setEditingBase(false);
    toastBriefly('기본 정책을 저장했습니다.');
  };

  const rows: GridRow[] = filtered.map((r) => {
    const issues = warnings[r.id] ?? [];
    const fee = effectiveExtraFee(r, basePolicy);
    return {
      id: r.id,
      onClick: () => openDetail(r.id),
      bg: issues.length ? '#fffdf8' : undefined,
      cells: [
        { kind: 'titleWarn', title: r.name, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'badge', text: r.kind, bg: r.kind === '제주' ? '#eef2ff' : '#f4f4f5', fg: r.kind === '제주' ? '#4338ca' : '#71717a' },
        { kind: 'text', text: r.postalCodes[0] ? `${r.postalCodes[0]}${r.postalCodes.length > 1 ? ` 외 ${r.postalCodes.length - 1}` : ''}` : '-', size: '12px', color: '#3f3f46' },
        { kind: 'text', text: r.deliverable === '가능' ? `+${fmtWon(fee)}` : '-', size: '12px', weight: 600, align: 'right', numeric: true },
        { kind: 'badge', text: r.deliverable, bg: r.deliverable === '가능' ? '#eff6ff' : '#fef2f2', fg: r.deliverable === '가능' ? '#2563eb' : '#dc2626' },
        { kind: 'badge', text: r.policySource === '지역 예외' ? '예외' : '기본', bg: r.policySource === '지역 예외' ? '#fffbeb' : '#f4f4f5', fg: r.policySource === '지역 예외' ? '#b45309' : '#71717a' },
        { kind: 'statusDot', text: r.status, dot: r.status === '사용' ? '#10b981' : '#a1a1aa', fg: r.status === '사용' ? '#047857' : '#71717a' },
        {
          kind: 'rowMenu',
          align: 'right',
          detailLabel: '상세',
          onDetail: () => openDetail(r.id),
          open: openMenu === r.id,
          onToggle: () => setOpenMenu(openMenu === r.id ? null : r.id),
          items: [
            { label: '수정', click: () => openDetail(r.id) },
            r.status === '사용' ? { label: '비활성화', click: () => toggleStatus(r) } : { label: '활성화', click: () => toggleStatus(r) },
          ],
        },
      ],
    };
  });

  const scenario = TEST_SCENARIOS.find((s) => s.id === scenarioId)!;
  const preview = computeJejuShippingPreview(scenario, basePolicy, regions);

  return (
    <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>제주 / 도서산간 정책</h1>
            <p className={shared.subtitle}>특수 배송지역의 배송 가능 여부와 추가 배송비 기준을 관리합니다.</p>
          </div>
          <div className={styles.topActions}>
            <button type="button" className={styles.testBtn} onClick={() => setShowTest(true)}>배송비 계산 테스트</button>
            <button type="button" className={shared.createBtn} onClick={openCreate}>+ 지역 등록</button>
          </div>
        </div>

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
                <span className={shared.qfCount}>{regions.filter((r) => matchesQuickFilter(r, filter, warnings)).length}</span>
              </CommonButton>
            );
          })}
        </div>
      </div>

      <div className={styles.settingsCard}>
        <div className={styles.settingsHead}>
          <span className={styles.settingsTitle}>기본 정책</span>
          {editingBase ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={styles.cancelButton} onClick={() => { setDraftBase(basePolicy); setEditingBase(false); }}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={saveBasePolicy}>저장</button>
            </div>
          ) : (
            <button type="button" className={styles.editLink} onClick={() => { setDraftBase(basePolicy); setEditingBase(true); }}>수정</button>
          )}
        </div>
        {editingBase ? (
          <>
            <div className={styles.formGrid} style={{ marginTop: 12 }}>
              <label className={styles.formField}>
                <span>제주 배송</span>
                <div className={styles.radioGroup}>
                  {(['가능', '불가'] as DeliverableStatus[]).map((v) => (
                    <label key={v}><input type="radio" checked={draftBase.jejuDeliverable === v} onChange={() => setDraftBase({ ...draftBase, jejuDeliverable: v })} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>제주 추가 배송비 (원)</span>
                <input type="number" min={0} value={draftBase.jejuExtraFee} onChange={(e) => setDraftBase({ ...draftBase, jejuExtraFee: Math.max(0, Number(e.target.value) || 0) })} />
              </label>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.formField}>
                <span>도서산간 배송</span>
                <div className={styles.radioGroup}>
                  {(['가능', '일부 지역만 가능', '불가'] as RemoteDeliverable[]).map((v) => (
                    <label key={v}><input type="radio" checked={draftBase.remoteDeliverable === v} onChange={() => setDraftBase({ ...draftBase, remoteDeliverable: v })} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>도서산간 추가 배송비 (원)</span>
                <input type="number" min={0} value={draftBase.remoteExtraFee} onChange={(e) => setDraftBase({ ...draftBase, remoteExtraFee: Math.max(0, Number(e.target.value) || 0) })} />
              </label>
            </div>
            <label className={styles.formField}>
              <span>무료배송 주문</span>
              <div className={styles.radioGroup}>
                {(['기본 배송비만 무료', '지역 추가비까지 모두 무료'] as FreeShippingTreatment[]).map((v) => (
                  <label key={v}><input type="radio" checked={draftBase.freeShippingTreatment === v} onChange={() => setDraftBase({ ...draftBase, freeShippingTreatment: v })} />{v}</label>
                ))}
              </div>
            </label>
          </>
        ) : (
          <div className={styles.settingsGrid}>
            <div className={styles.settingsField}><span className={styles.settingsLabel}>제주</span><span className={styles.settingsValue}>배송 {basePolicy.jejuDeliverable} · +{fmtWon(basePolicy.jejuExtraFee)}</span></div>
            <div className={styles.settingsField}><span className={styles.settingsLabel}>도서산간</span><span className={styles.settingsValue}>배송 {basePolicy.remoteDeliverable} · +{fmtWon(basePolicy.remoteExtraFee)}</span></div>
            <div className={styles.settingsField}><span className={styles.settingsLabel}>무료배송 주문</span><span className={styles.settingsValue}>{basePolicy.freeShippingTreatment}</span></div>
            <div className={styles.settingsField}><span className={styles.settingsLabel}>묶음배송</span><span className={styles.settingsValue}>{basePolicy.bundleFeeUnit}</span></div>
          </div>
        )}
      </div>

      <div className={shared.filterBox} style={{ margin: '0 24px 16px' }}>
        <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
          <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="지역명, 우편번호 검색" />
          <button type="submit" className={shared.searchBtn}>검색</button>
        </form>
        <div className={shared.filterRow2}>
          <span className={shared.rowSpacer} />
          <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
        </div>
      </div>

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length}개 지역</span>
        </div>
        <DataGrid
          columns={[
            { label: '지역' }, { label: '유형' }, { label: '우편번호' }, { label: '추가비', align: 'right' as const },
            { label: '배송여부' }, { label: '정책' }, { label: '상태' }, { label: '관리', align: 'right' as const },
          ]}
          rows={rows}
          gridTemplate="1.3fr 72px 76px 68px 52px 52px 58px 40px"
          minWidth="890px"
          empty={filtered.length === 0}
          emptyText={regions.length === 0 ? '등록된 제주/도서산간 지역이 없습니다.' : quickFilter === '확인 필요' ? '현재 확인이 필요한 제주/도서산간 정책이 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext={regions.length === 0 ? undefined : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={regions.length === 0 ? '+ 지역 등록' : '필터 초기화'}
          emptyActionClick={regions.length === 0 ? openCreate : reset}
        />
      </div>

      {drawerItem && (
        <JejuRegionDrawer
          key={`${drawerItem.id}-${isNew}`}
          region={drawerItem}
          basePolicy={basePolicy}
          isNew={isNew}
          startEditing={isNew}
          issues={warnings[drawerItem.id] ?? []}
          onClose={() => { setDrawerId(null); setIsNew(false); }}
          onSave={save}
          onToggleStatus={toggleStatus}
          onAddMemo={(text) => addMemo(drawerItem.id, text)}
        />
      )}

      {showTest && (
        <aside ref={testAsideRef} className={`${drawerShared.aside} ${styles.testDrawer}`} aria-label="배송비 계산 테스트">
          <div className={drawerShared.head}>
            <div className={drawerShared.headRow}>
              <div className={drawerShared.headBody}>
                <div className={drawerShared.eyebrow}>제주 / 도서산간 정책 · 배송비 계산 테스트</div>
                <h2 className={drawerShared.title}>배송비 계산 Preview</h2>
              </div>
              <button type="button" className={drawerShared.closeBtn} onClick={() => setShowTest(false)}>✕</button>
            </div>
          </div>
          <div className={drawerShared.scroll}>
            <div className={styles.previewCard} style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700 }}>테스트 배송지 선택</h3>
              <div className={styles.orderPick}>
                {TEST_SCENARIOS.map((s) => (
                  <button key={s.id} type="button" className={`${styles.orderOption} ${scenarioId === s.id ? styles.orderOptionActive : ''}`} onClick={() => setScenarioId(s.id)}>
                    <span><strong>{s.label}</strong> · {s.addressLabel}</span>
                    <span>{s.postalCode}</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 기본 정책과 지역 목록 기준으로 계산합니다. 기본 배송비는 배송 정책 &gt; 기본 배송비 설정을 따릅니다.</div>
            </div>

            <div className={`${styles.resultHero} ${!preview.deliverable ? styles.resultHeroWarn : ''}`}>
              <span>{scenario.addressLabel} ({scenario.postalCode})</span>
              <strong>{preview.deliverable ? fmtWon(preview.finalFee) : '배송 불가'}</strong>
            </div>

            <div className={styles.resultRow}><span>지역 판정</span><strong>{preview.regionKind}</strong></div>
            <div className={styles.resultRow}><span>판정 근거</span><strong>{preview.matchBasis}</strong></div>

            {preview.items.map((it) => (
              <div key={it.code} className={`${styles.itemStatusRow} ${!it.deliverable ? styles.itemBlocked : ''}`}>
                <span>{it.name} × {it.qty}{it.blockReason ? ` — ${it.blockReason}` : ''}</span>
                <span>{it.deliverable ? '배송 가능' : '배송 불가'}</span>
              </div>
            ))}

            {preview.deliverable && (
              <div className={styles.breakdownTable} style={{ marginTop: 12 }}>
                <div className={styles.breakdownRow}><span>기본 배송비{preview.freeShippingApplied ? ' (무료배송 기준 충족)' : ''}</span><span>{fmtWon(preview.baseFee)}</span></div>
                <div className={styles.breakdownRow}><span>지역 추가배송비</span><span>{fmtWon(preview.extraFee)}</span></div>
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}><span>최종 배송비</span><span>{fmtWon(preview.finalFee)}</span></div>
              </div>
            )}
          </div>
        </aside>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
