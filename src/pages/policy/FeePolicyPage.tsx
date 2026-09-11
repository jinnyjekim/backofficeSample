import { useMemo, useRef, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './FeePolicyPage.module.css';
import {
  CommonBadge,
  CommonButton,
  CommonDatePicker,
  CommonInput,
  CommonRadio,
  CommonSelect,
  CommonSwitch,
  showToast,
} from '../../components/common';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { FeePolicyDrawer } from './FeePolicyDrawer';
import {
  INITIAL_POLICIES,
  INITIAL_GLOBAL_FEE_POLICY,
  INITIAL_CATEGORY_FEES,
  INITIAL_TIER_FEES,
  INITIAL_GLOBAL_HISTORY,
  INITIAL_LAST_MODIFIED,
  TEST_TRANSACTIONS,
  CALC_UNITS,
  CALC_BASES,
  FEE_TYPES,
  QUICK_FILTERS,
  computeStatus,
  computeWarnings,
  computeGlobalFeeWarnings,
  describeGlobalFeeChanges,
  computeScenarioFeeBreakdown,
  fmtPeriod,
  fmtCalc,
  matchesQuickFilter,
  newFeePolicy,
  type FeePolicy,
  type GlobalFeePolicy,
  type CategoryFeeItem,
  type TierFeeItem,
  type FieldDiff,
  type GlobalFeeHistoryEntry,
  type LastModified,
  type QuickFilter,
  type FeeType,
  type FeeBearer,
  type CalcMethod,
  type CalcUnit,
  type CalcBasis,
  type RoundingRule,
  type TaxTreatment,
  type CancelFeePolicy,
  type RefundFeePolicy,
} from './feePolicyData';

const TODAY = '2026-08-25';

type Tab = 'basic' | 'rate' | 'exempt' | 'rules' | 'preview';
const TABS: [Tab, string][] = [
  ['basic', '기본 수수료'],
  ['rate', '차등 · 우대'],
  ['exempt', '취소 · 환불'],
  ['rules', '규칙 관리'],
  ['preview', '정책 Preview'],
];

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
  기타: { bg: '#f4f4f5', fg: '#52525b' },
};

const STATUS_DOT: Record<string, { dot: string; fg: string }> = {
  적용중: { dot: '#10b981', fg: '#047857' },
  '적용 예정': { dot: '#3b82f6', fg: '#1d4ed8' },
  종료: { dot: '#a1a1aa', fg: '#71717a' },
  비활성: { dot: '#d4d4d8', fg: '#a1a1aa' },
};

function fmtWon(n?: number | null): string {
  if (n === undefined || n === null) return '0원';
  return n.toLocaleString('ko-KR') + '원';
}

function feeHistory(
  item: FeePolicy,
  action: string,
  before?: string,
  after?: string,
): FeePolicy {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [
      ...item.history,
      {
        id: `H-${item.id}-${Date.now()}`,
        at: `${TODAY} 14:00`,
        by: 'admin01',
        action,
        before,
        after,
      },
    ],
  };
}

export function FeePolicyPage() {
  // ── 전역 정책 상태 ──
  const [globalPolicy, setGlobalPolicy] = useState<GlobalFeePolicy>(INITIAL_GLOBAL_FEE_POLICY);
  const [draftGlobalPolicy, setDraftGlobalPolicy] = useState<GlobalFeePolicy>(INITIAL_GLOBAL_FEE_POLICY);
  const [categoryFees, setCategoryFees] = useState<CategoryFeeItem[]>(INITIAL_CATEGORY_FEES);
  const [draftCategoryFees, setDraftCategoryFees] = useState<CategoryFeeItem[]>(INITIAL_CATEGORY_FEES);
  const [tierFees, setTierFees] = useState<TierFeeItem[]>(INITIAL_TIER_FEES);
  const [draftTierFees, setDraftTierFees] = useState<TierFeeItem[]>(INITIAL_TIER_FEES);
  const [historyList, setHistoryList] = useState<GlobalFeeHistoryEntry[]>(INITIAL_GLOBAL_HISTORY);
  const [lastModified, setLastModified] = useState<LastModified>(INITIAL_LAST_MODIFIED);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [saveReason, setSaveReason] = useState('');
  const [saveError, setSaveError] = useState('');

  // ── 기존 9개 개별 규칙 관리 상태 ──
  const [policies, setPolicies] = useState<FeePolicy[]>(INITIAL_POLICIES);
  const [rulesSearch, setRulesSearch] = useState('');
  const [rulesFilter, setRulesFilter] = useState<QuickFilter>('전체');
  const [rulesTypeFilter, setRulesTypeFilter] = useState<FeeType | ''>('');
  const [drawerItem, setDrawerItem] = useState<FeePolicy | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);

  // ── 사이드바 실시간 계산 시뮬레이터 상태 ──
  const [simOrderAmount, setSimOrderAmount] = useState(50000);
  const [simShippingFee, setSimShippingFee] = useState(3000);
  const [simCategory, setSimCategory] = useState('패션 · 의류');
  const [simTier, setSimTier] = useState('일반 판매자');

  // ── Preview 탭 시나리오 선택 상태 ──
  const [previewTxId, setPreviewTxId] = useState(TEST_TRANSACTIONS[0].id);

  const historyRef = useRef<HTMLElement>(null);
  useOutsideClose(historyRef, () => setShowHistory(false));

  const activeGlobal = editing ? draftGlobalPolicy : globalPolicy;
  const activeCategories = editing ? draftCategoryFees : categoryFees;
  const activeTiers = editing ? draftTierFees : tierFees;

  const warnings = useMemo(
    () => computeGlobalFeeWarnings(activeGlobal, activeCategories, activeTiers),
    [activeGlobal, activeCategories, activeTiers],
  );

  const ruleWarnings = useMemo(() => computeWarnings(policies), [policies]);

  const toastBriefly = (message: string) => {
    showToast({ message, type: 'success' });
  };

  const setGlobal = <K extends keyof GlobalFeePolicy>(key: K, value: GlobalFeePolicy[K]) => {
    if (!editing) return;
    setDraftGlobalPolicy((curr) => ({ ...curr, [key]: value }));
  };

  const startEdit = () => {
    setDraftGlobalPolicy(globalPolicy);
    setDraftCategoryFees(categoryFees);
    setDraftTierFees(tierFees);
    setEditing(true);
    toastBriefly('수수료 정책 수정 모드로 전환되었습니다.');
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraftGlobalPolicy(globalPolicy);
    setDraftCategoryFees(categoryFees);
    setDraftTierFees(tierFees);
    toastBriefly('수정을 취소했습니다.');
  };

  const requestSave = () => {
    const diffs = describeGlobalFeeChanges(
      globalPolicy,
      draftGlobalPolicy,
      categoryFees,
      draftCategoryFees,
      tierFees,
      draftTierFees,
    );
    if (diffs.length === 0) {
      setEditing(false);
      toastBriefly('변경된 내용이 없어 수정 모드를 종료합니다.');
      return;
    }
    setSaveReason('');
    setSaveError('');
    setConfirmSave(diffs);
  };

  const commitSave = () => {
    if (!saveReason.trim()) {
      setSaveError('변경 사유를 입력해 주세요.');
      return;
    }
    if (!confirmSave) return;

    const entries: GlobalFeeHistoryEntry[] = confirmSave.map((d, i) => ({
      id: `H-${Date.now()}-${i}`,
      at: '2026-08-25 10:00',
      by: '운영 관리자',
      field: d.field,
      before: d.before,
      after: d.after,
      reason: saveReason.trim(),
    }));

    setGlobalPolicy(draftGlobalPolicy);
    setCategoryFees(draftCategoryFees);
    setTierFees(draftTierFees);
    setHistoryList((curr) => [...entries, ...curr]);
    setLastModified({ at: '2026-08-25 10:00', by: '운영 관리자' });
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('수수료 정책이 성공적으로 저장되었습니다.');
  };

  // ── 사이드바 실시간 수수료 시뮬레이션 계산 ──
  const simCalc = useMemo(() => {
    const catItem = activeCategories.find((c) => c.category === simCategory);
    const tierItem = activeTiers.find((t) => t.name === simTier || t.tier === simTier);

    let effectiveRate = activeGlobal.defaultFeeRate;
    let catRateDelta = 0;
    let tierDiscount = 0;

    if (activeGlobal.categoryFeeEnabled && catItem) {
      catRateDelta = catItem.rate - activeGlobal.defaultFeeRate;
      effectiveRate = catItem.rate;
    }
    if (activeGlobal.tierDiscountEnabled && tierItem) {
      tierDiscount = tierItem.discount;
      effectiveRate = Math.max(0, effectiveRate - tierDiscount);
    }

    const itemFeeRaw =
      activeGlobal.calcMethod === '정액'
        ? activeGlobal.fixedFeeAmount
        : Math.round(simOrderAmount * (effectiveRate / 100));

    const deliveryFeeFee =
      activeGlobal.includeShippingInFee
        ? Math.round(simShippingFee * (activeGlobal.defaultFeeRate / 100))
        : 0;

    let subTotal = itemFeeRaw + deliveryFeeFee;
    if (activeGlobal.minFeeAmount > 0) subTotal = Math.max(subTotal, activeGlobal.minFeeAmount);
    if (activeGlobal.maxFeeAmount !== null && activeGlobal.maxFeeAmount > 0) {
      subTotal = Math.min(subTotal, activeGlobal.maxFeeAmount);
    }

    const unit = activeGlobal.roundingUnit || 1;
    let roundedFee = subTotal;
    if (activeGlobal.roundingRule === '절사') roundedFee = Math.floor(subTotal / unit) * unit;
    else if (activeGlobal.roundingRule === '올림') roundedFee = Math.ceil(subTotal / unit) * unit;
    else roundedFee = Math.round(subTotal / unit) * unit;

    const vat = activeGlobal.taxTreatment === '별도' ? Math.round(roundedFee * 0.1) : 0;
    const finalFee = roundedFee + vat;
    const totalOrder = simOrderAmount + simShippingFee;
    const effectivePct = totalOrder > 0 ? ((finalFee / totalOrder) * 100).toFixed(1) : '0.0';

    return {
      effectiveRate,
      catRateDelta,
      tierDiscount,
      itemFeeRaw,
      deliveryFeeFee,
      roundedFee,
      vat,
      finalFee,
      effectivePct,
    };
  }, [activeGlobal, activeCategories, activeTiers, simOrderAmount, simShippingFee, simCategory, simTier]);

  // ── Preview 탭 시나리오 분해 ──
  const previewTx = TEST_TRANSACTIONS.find((t) => t.id === previewTxId) || TEST_TRANSACTIONS[0];
  const previewBreakdown = computeScenarioFeeBreakdown(
    activeGlobal,
    previewTx,
    activeCategories,
    activeTiers,
  );

  // ── 규칙 관리 탭 필터링 및 DataGrid 행 변환 ──
  const filteredRules = useMemo(() => {
    return policies.filter((p) => {
      if (!matchesQuickFilter(p, rulesFilter, ruleWarnings)) return false;
      if (
        rulesSearch &&
        !`${p.name} ${p.code}`.toLowerCase().includes(rulesSearch.toLowerCase())
      ) {
        return false;
      }
      if (rulesTypeFilter && p.feeType !== rulesTypeFilter) return false;
      return true;
    });
  }, [policies, rulesFilter, rulesSearch, rulesTypeFilter, ruleWarnings]);

  const ruleRows: GridRow[] = useMemo(() => {
    return filteredRules.map((p) => {
      const typeColor = TYPE_COLOR[p.feeType] ?? TYPE_COLOR['기타'];
      const status = computeStatus(p);
      const dotColor = STATUS_DOT[status] ?? { dot: '#d4d4d8', fg: '#a1a1aa' };
      const issues = ruleWarnings[p.id] ?? [];

      return {
        id: p.id,
        onClick: () => {
          setDrawerItem(p);
          setIsNewRule(false);
        },
        cells: [
          {
            kind: 'titleDesc',
            title: p.name,
            desc: p.code,
            issue: issues.length > 0,
            issueTitle: issues.join(' · '),
          },
          { kind: 'badge', text: p.feeType, bg: typeColor.bg, fg: typeColor.fg },
          {
            kind: 'text',
            text: p.applyScope === '전체 거래' ? '전체 거래' : p.applyTarget,
            size: '12px',
            color: '#3f3f46',
          },
          { kind: 'text', text: p.bearer, size: '12px', color: '#3f3f46' },
          {
            kind: 'text',
            text: fmtCalc(p),
            size: '12px',
            weight: 600,
            color: '#18181b',
          },
          { kind: 'text', text: fmtPeriod(p), size: '11px', color: '#71717a' },
          { kind: 'statusDot', text: status, dot: dotColor.dot, fg: dotColor.fg },
        ],
      };
    });
  }, [filteredRules, ruleWarnings]);

  const handleSaveRule = (item: FeePolicy) => {
    if (isNewRule) {
      const saved = feeHistory({ ...item, history: [] }, '정책 등록');
      setPolicies((curr) => [saved, ...curr]);
      setDrawerItem(null);
      setIsNewRule(false);
      toastBriefly('수수료 정책을 등록했습니다.');
    } else {
      const prev = policies.find((p) => p.id === item.id);
      const saved =
        prev && prev.rate !== item.rate && item.calcMethod === '정률'
          ? feeHistory(item, '수수료율 변경', `${prev.rate}%`, `${item.rate}%`)
          : feeHistory(item, '정책 수정');
      setPolicies((curr) => curr.map((p) => (p.id === item.id ? saved : p)));
      setDrawerItem(null);
      toastBriefly('수수료 정책을 수정했습니다.');
    }
  };

  const handleToggleRuleActive = (item: FeePolicy) => {
    const updated = feeHistory(
      { ...item, active: !item.active },
      item.active ? '정책 비활성화' : '정책 활성화',
    );
    setPolicies((curr) => curr.map((p) => (p.id === item.id ? updated : p)));
    setDrawerItem(null);
    toastBriefly(item.active ? '정책을 비활성화했습니다.' : '정책을 활성화했습니다.');
  };

  return (
    <div className={`${shared.page} ${styles.pageRoot}`}>
      {/* ── 거래 정책 표준 공통 헤더 ── */}
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <div className={shared.title}>수수료 정책</div>
            <div className={shared.subtitle}>
              거래 및 판매에 적용되는 기본 수수료율 체계와 카테고리·등급별 차등 및 취소·환불 예외 기준을 설정합니다.
            </div>
          </div>
          <div className={styles.headMeta}>
            {!editing && (
              <span className={styles.headMetaText}>
                최종 수정 {lastModified.at} · {lastModified.by}
              </span>
            )}
            <CommonButton
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowHistory(true)}
            >
              변경 이력
            </CommonButton>
            {!editing ? (
              <CommonButton type="button" variant="emphasis" size="md" onClick={startEdit}>
                수정
              </CommonButton>
            ) : (
              <>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>
                  취소
                </CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={requestSave}>
                  저장
                </CommonButton>
              </>
            )}
          </div>
        </div>

        {/* ── 5대 탭 표준 바 ── */}
        <div className={shared.quickFilters}>
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <CommonButton
                key={key}
                type="button"
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${shared.qfBtn} ${active ? shared.quickActive : ''}`}
                onClick={() => setTab(key)}
              >
                <span className={shared.qfLabel}>{label}</span>
              </CommonButton>
            );
          })}
        </div>
      </header>

      <div className={styles.body}>
        {/* 수정 모드 배너 */}
        {editing && (
          <div className={`${styles.modeBanner} ${styles.modeBannerEdit}`}>
            <div className={styles.modeBannerLeft}>
              <span className={`${styles.modeTag} ${styles.modeTagEdit}`}>수정 모드</span>
              <span>수수료 정책을 편집 중입니다. 변경을 마치면 상단의 [저장] 버튼을 클릭하세요.</span>
            </div>
            <CommonButton type="button" variant="secondary" size="sm" onClick={cancelEdit}>
              수정 취소
            </CommonButton>
          </div>
        )}

        {/* 유효성 경고 배너 */}
        {tab !== 'preview' && warnings.length > 0 && (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>!</span>
            <div className={styles.warningBody}>
              <div className={styles.warningTitle}>설정 확인 필요 · {warnings.length}건</div>
              <div className={styles.warningList}>
                {warnings.map((w) => (
                  <div key={w.id} className={styles.warningItem}>
                    {w.message}
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className={styles.warningActionBtn}
              onClick={() => setTab(warnings[0].tab as Tab)}
            >
              해당 탭에서 확인
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            1. 기본 수수료 탭 (basic - 표준 2열 policyLayout)
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'basic' && (
          <div className={styles.policyLayout}>
            {/* 좌측 메인 폼 (policyMain) */}
            <div className={styles.policyMain}>
              {/* 섹션 1: 수수료 부과 체계 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>1</span>
                    <span className={styles.sectionHeadTitle}>부과 방식 및 요율</span>
                    <CommonBadge type="info-light" size="sm">
                      필수
                    </CommonBadge>
                  </div>
                  <p className={styles.sectionDescText}>
                    플랫폼 판매에 적용되는 기본 계산 방식(정률/정액)과 기준 수수료율을 설정합니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.actorOptions}>
                    <CommonButton
                      type="button"
                      variant="option"
                      size="md"
                      selected={activeGlobal.calcMethod === '정률'}
                      description="판매금액의 일정 비율(%)을 수수료로 부과"
                      disabled={!editing}
                      onClick={() => setGlobal('calcMethod', '정률')}
                    >
                      정률제 (수수료율 %)
                    </CommonButton>
                    <CommonButton
                      type="button"
                      variant="option"
                      size="md"
                      selected={activeGlobal.calcMethod === '정액'}
                      description="거래 건당 고정 금액(원) 부과"
                      disabled={!editing}
                      onClick={() => setGlobal('calcMethod', '정액')}
                    >
                      정액제 (건당 고정)
                    </CommonButton>
                  </div>

                  <div className={styles.sectionDividerTop}>
                    <div className={styles.applyRow}>
                      {activeGlobal.calcMethod === '정률' ? (
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldBlockLabel}>기본 거래 수수료율</div>
                          <CommonInput.Number
                            clearable={false}
                            className={styles.shortControl}
                            min={0}
                            max={100}
                            step={0.1}
                            suffix="%"
                            value={activeGlobal.defaultFeeRate}
                            disabled={!editing}
                            aria-label="기본 거래 수수료율"
                            onChange={(e) =>
                              setGlobal('defaultFeeRate', Math.max(0, Number(e.target.value) || 0))
                            }
                          />
                          <div className={styles.fieldHint}>일반 판매자 기본 적용 요율</div>
                        </div>
                      ) : (
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldBlockLabel}>건당 고정 수수료</div>
                          <CommonInput.Number
                            clearable={false}
                            className={styles.moneyControl}
                            min={0}
                            step={100}
                            suffix="원"
                            value={activeGlobal.fixedFeeAmount}
                            disabled={!editing}
                            aria-label="건당 고정 수수료"
                            onChange={(e) =>
                              setGlobal('fixedFeeAmount', Math.max(0, Number(e.target.value) || 0))
                            }
                          />
                          <div className={styles.fieldHint}>거래 1건당 고정 차감액</div>
                        </div>
                      )}

                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>부과 단위</div>
                        <CommonSelect
                          className={styles.shortControl}
                          options={CALC_UNITS.map((u) => ({ label: u, value: u }))}
                          value={activeGlobal.calcUnit}
                          disabled={!editing}
                          aria-label="부과 단위"
                          onChange={(v) => setGlobal('calcUnit', String(v) as CalcUnit)}
                        />
                        <div className={styles.fieldHint}>수수료가 산정되는 거래 단위</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 섹션 2: 과세 기준 및 배송비 수수료 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>2</span>
                    <span className={styles.sectionHeadTitle}>과세 기준 및 배송비</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    수수료에 대한 부가세(VAT) 처리 기준과 배송비 수수료 부과 여부를 정합니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.applyRow}>
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldBlockLabel}>부가세(VAT) 처리 기준</div>
                      <CommonSelect
                        className={styles.shortControl}
                        options={[
                          { label: '부가세 별도 (10% 가산)', value: '별도' },
                          { label: '부가세 포함', value: '포함' },
                          { label: '비과세', value: '비과세' },
                        ]}
                        value={activeGlobal.taxTreatment}
                        disabled={!editing}
                        aria-label="부가세 처리 기준"
                        onChange={(v) => setGlobal('taxTreatment', String(v) as TaxTreatment)}
                      />
                      <div className={styles.fieldHint}>수수료 정산서 세무 반영 방식</div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldBlockLabel}>계산 기준금액</div>
                      <CommonSelect
                        className={styles.shortControl}
                        options={CALC_BASES.map((b) => ({ label: b, value: b }))}
                        value={activeGlobal.calcBasis}
                        disabled={!editing}
                        aria-label="계산 기준금액"
                        onChange={(v) => setGlobal('calcBasis', String(v) as CalcBasis)}
                      />
                      <div className={styles.fieldHint}>요율이 곱해지는 기준 금액</div>
                    </div>
                  </div>

                  <div className={styles.sectionDividerTop}>
                    <div className={styles.switchRow}>
                      <CommonSwitch
                        size="md"
                        checked={activeGlobal.includeShippingInFee}
                        label="배송비에도 수수료 부과"
                        disabled={!editing}
                        onChange={(checked) => setGlobal('includeShippingInFee', checked)}
                      />
                    </div>
                    <div className={styles.fieldHint}>
                      활성화 시 고객이 결제한 배송비 금액에도 기본 거래 수수료율이 동일하게 적용됩니다.
                    </div>
                  </div>
                </div>
              </section>

              {/* 섹션 3: 수수료 한도 및 안전장치 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>3</span>
                    <span className={styles.sectionHeadTitle}>한도 및 안전장치</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    거래 1건당 부과되는 수수료의 최소 및 최대 상한선을 설정하여 과도한 수수료를 방지합니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.applyRow}>
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldBlockLabel}>최대 수수료 상한 (Max Cap)</div>
                      <CommonInput.Number
                        clearable={false}
                        className={styles.moneyControl}
                        min={0}
                        step={10000}
                        suffix="원"
                        value={activeGlobal.maxFeeAmount ?? 0}
                        disabled={!editing}
                        aria-label="최대 수수료 상한"
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setGlobal('maxFeeAmount', val > 0 ? val : null);
                        }}
                      />
                      <div className={styles.fieldHint}>고액 거래 시 파트너 부담 완화 상한선</div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldBlockLabel}>최소 수수료 (Min Floor)</div>
                      <CommonInput.Number
                        clearable={false}
                        className={styles.moneyControl}
                        min={0}
                        step={100}
                        suffix="원"
                        value={activeGlobal.minFeeAmount}
                        disabled={!editing}
                        aria-label="최소 수수료"
                        onChange={(e) =>
                          setGlobal('minFeeAmount', Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                      <div className={styles.fieldHint}>거래 건당 최소 회수 수수료 (0원 설정 시 미적용)</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 섹션 4: 절사 및 단수 처리 기준 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>4</span>
                    <span className={styles.sectionHeadTitle}>절사 및 단수 처리</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    수수료 계산 시 발생하는 원단위 단수 금액의 처리 방식을 정합니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.applyRow}>
                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldBlockLabel}>절사 방식</div>
                      <div className={styles.compactPills}>
                        {(['절사', '반올림', '올림'] as RoundingRule[]).map((rule) => (
                          <CommonButton
                            key={rule}
                            type="button"
                            variant={activeGlobal.roundingRule === rule ? 'emphasis' : 'secondary'}
                            size="md"
                            disabled={!editing}
                            onClick={() => setGlobal('roundingRule', rule)}
                          >
                            {rule}
                          </CommonButton>
                        ))}
                      </div>
                    </div>

                    <div className={styles.fieldGroup}>
                      <div className={styles.fieldBlockLabel}>단수 처리 단위</div>
                      <div className={styles.compactPills}>
                        {[1, 10, 100].map((u) => (
                          <CommonButton
                            key={u}
                            type="button"
                            variant={activeGlobal.roundingUnit === u ? 'emphasis' : 'secondary'}
                            size="md"
                            disabled={!editing}
                            onClick={() => setGlobal('roundingUnit', u)}
                          >
                            {u}원 단위
                          </CommonButton>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* 우측 사이드바 (policySideOuter) */}
            <aside className={styles.policySideOuter}>
              {/* 사이드 카드 1: 실시간 수수료 시뮬레이터 */}
              <div className={styles.sideCard}>
                <div className={styles.sideHead}>
                  <div className={styles.sideTitle}>실시간 수수료 시뮬레이터</div>
                  <div className={styles.sideSubtitle}>현재 설정으로 거래 수수료를 실시간 계산합니다</div>
                </div>
                <div className={styles.previewInputs}>
                  <div className={styles.previewInputRow}>
                    <span>상품 판매가</span>
                    <CommonInput.Number
                      clearable={false}
                      className={styles.moneyControl}
                      min={0}
                      step={10000}
                      suffix="원"
                      value={simOrderAmount}
                      onChange={(e) => setSimOrderAmount(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </div>
                  <div className={styles.previewInputRow}>
                    <span>배송비</span>
                    <CommonInput.Number
                      clearable={false}
                      className={styles.moneyControl}
                      min={0}
                      step={500}
                      suffix="원"
                      value={simShippingFee}
                      onChange={(e) => setSimShippingFee(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </div>
                  <div className={styles.previewInputRow}>
                    <span>카테고리</span>
                    <CommonSelect
                      className={styles.shortControl}
                      options={activeCategories.map((c) => ({ label: c.category, value: c.category }))}
                      value={simCategory}
                      onChange={(v) => setSimCategory(String(v))}
                    />
                  </div>
                  <div className={styles.previewInputRow}>
                    <span>판매자 등급</span>
                    <CommonSelect
                      className={styles.shortControl}
                      options={activeTiers.map((t) => ({ label: t.name, value: t.name }))}
                      value={simTier}
                      onChange={(v) => setSimTier(String(v))}
                    />
                  </div>
                </div>

                <div className={styles.calcRows}>
                  <div>
                    <span>적용 실효 요율</span>
                    <strong>{simCalc.effectiveRate.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span>상품 수수료</span>
                    <strong>{fmtWon(simCalc.itemFeeRaw)}</strong>
                  </div>
                  {activeGlobal.includeShippingInFee && (
                    <div>
                      <span>배송비 수수료</span>
                      <strong>{fmtWon(simCalc.deliveryFeeFee)}</strong>
                    </div>
                  )}
                  {activeGlobal.taxTreatment === '별도' && (
                    <div>
                      <span>부가세 (VAT 10%)</span>
                      <strong>+{fmtWon(simCalc.vat)}</strong>
                    </div>
                  )}
                </div>

                <div className={`${styles.resultBand} ${styles.resultBandOk}`}>
                  <span>최종 정산 수수료</span>
                  <strong>{fmtWon(simCalc.finalFee)}</strong>
                </div>

                <div className={styles.sideFootNote}>
                  전체 결제금액 대비 실효 수수료율은 약 <strong>{simCalc.effectivePct}%</strong> 입니다.
                </div>
              </div>

              {/* 사이드 카드 2: 현재 정책 요약 */}
              <div className={styles.sideCard}>
                <div className={styles.sideHead}>
                  <div className={styles.sideTitle}>수수료 정책 요약</div>
                </div>
                <div className={styles.digestRow}>
                  <span>부과 방식</span>
                  <strong>{activeGlobal.calcMethod === '정률' ? `정률 (${activeGlobal.defaultFeeRate}%)` : `정액 (${fmtWon(activeGlobal.fixedFeeAmount)})`}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>부과 단위</span>
                  <strong>{activeGlobal.calcUnit}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>과세 기준</span>
                  <strong>{activeGlobal.taxTreatment === '별도' ? '부가세 별도 (10%)' : activeGlobal.taxTreatment === '포함' ? '부가세 포함' : '비과세'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>계산 기준</span>
                  <strong>{activeGlobal.calcBasis}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>배송비 수수료</span>
                  <strong>{activeGlobal.includeShippingInFee ? '부과함' : '미부과 (면제)'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>최대 상한 (Cap)</span>
                  <strong>{activeGlobal.maxFeeAmount ? fmtWon(activeGlobal.maxFeeAmount) : '제한 없음'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>절사 기준</span>
                  <strong>{activeGlobal.roundingUnit}원 단위 {activeGlobal.roundingRule}</strong>
                </div>
                <div className={styles.sideFootNote}>
                  차등 요율 및 판매자 우대 할인은 상단 탭에서 상세 설정할 수 있습니다.
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            2. 차등 · 우대 탭 (rate - 표준 2열 policyLayout)
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'rate' && (
          <div className={styles.policyLayout}>
            <div className={styles.policyMain}>
              {/* 섹션 1: 카테고리별 차등 수수료 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>1</span>
                    <span className={styles.sectionHeadTitle}>카테고리별 차등 요율</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    상품 카테고리 특성에 따라 기본 수수료율 대신 적용할 전용 요율을 지정합니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.switchRow}>
                    <CommonSwitch
                      size="md"
                      checked={activeGlobal.categoryFeeEnabled}
                      label="카테고리별 차등 수수료 활성화"
                      disabled={!editing}
                      onChange={(checked) => setGlobal('categoryFeeEnabled', checked)}
                    />
                  </div>

                  <div className={styles.tableWrap}>
                    <div className={`${styles.tableRow} ${styles.tableHead}`}>
                      <span>카테고리</span>
                      <span>적용 요율</span>
                      <span style={{ textAlign: 'center' }}>상태</span>
                    </div>
                    {activeCategories.map((c) => (
                      <div key={c.id} className={styles.tableRow}>
                        <span className={styles.tableName}>{c.category}</span>
                        <div>
                          <CommonInput.Number
                            clearable={false}
                            className={styles.shortControl}
                            min={0}
                            max={100}
                            step={0.1}
                            suffix="%"
                            value={c.rate}
                            disabled={!editing || !activeGlobal.categoryFeeEnabled}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftCategoryFees((curr) =>
                                curr.map((item) => (item.id === c.id ? { ...item, rate: val } : item)),
                              );
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <CommonBadge type={c.active ? 'success-light' : 'neutral-light'} size="sm">
                            {c.active ? '적용' : '미적용'}
                          </CommonBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 섹션 2: 판매자 등급별 우대 수수료 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>2</span>
                    <span className={styles.sectionHeadTitle}>판매자 등급별 우대</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    판매 실적 및 우수 파트너 등급에 따른 수수료 감면(할인) 혜택을 설정합니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.switchRow}>
                    <CommonSwitch
                      size="md"
                      checked={activeGlobal.tierDiscountEnabled}
                      label="판매자 등급 우대 감면 활성화"
                      disabled={!editing}
                      onChange={(checked) => setGlobal('tierDiscountEnabled', checked)}
                    />
                  </div>

                  <div className={styles.tableWrap}>
                    <div className={`${styles.tableRow} ${styles.tableHead}`}>
                      <span>등급 명칭</span>
                      <span>감면 혜택 (차감율)</span>
                      <span style={{ textAlign: 'center' }}>상태</span>
                    </div>
                    {activeTiers.map((t) => (
                      <div key={t.tier} className={styles.tableRow}>
                        <span className={styles.tableName}>
                          <CommonBadge type="info-light" size="sm">
                            {t.tier}
                          </CommonBadge>
                          {t.name}
                        </span>
                        <div>
                          <CommonInput.Number
                            clearable={false}
                            className={styles.shortControl}
                            min={0}
                            max={10}
                            step={0.1}
                            suffix="%p 감면"
                            value={t.discount}
                            disabled={!editing || !activeGlobal.tierDiscountEnabled}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftTierFees((curr) =>
                                curr.map((item) =>
                                  item.tier === t.tier ? { ...item, discount: val } : item,
                                ),
                              );
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <CommonBadge type={t.active ? 'success-light' : 'neutral-light'} size="sm">
                            {t.active ? '적용' : '일반'}
                          </CommonBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 섹션 3: 정책적 감면 및 프로모션 지원 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>3</span>
                    <span className={styles.sectionHeadTitle}>정책적 감면 지원</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    신규 입점 판매자 유치 및 영세·중소상공인 상생 협력을 위한 감면 정책을 운영합니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.switchRow}>
                    <CommonSwitch
                      size="md"
                      checked={activeGlobal.newSellerPromoEnabled}
                      label="신규 입점 웰컴 프로모션 수수료 지원"
                      disabled={!editing}
                      onChange={(checked) => setGlobal('newSellerPromoEnabled', checked)}
                    />
                  </div>
                  {activeGlobal.newSellerPromoEnabled && (
                    <div className={styles.applyRow}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>웰컴 특별 수수료율</div>
                        <CommonInput.Number
                          clearable={false}
                          className={styles.shortControl}
                          min={0}
                          max={100}
                          step={0.1}
                          suffix="%"
                          value={activeGlobal.newSellerPromoRate}
                          disabled={!editing}
                          onChange={(e) =>
                            setGlobal('newSellerPromoRate', Math.max(0, Number(e.target.value) || 0))
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>적용 기간 (입점일 기준)</div>
                        <CommonInput.Number
                          clearable={false}
                          className={styles.shortControl}
                          min={1}
                          max={365}
                          suffix="일간"
                          value={activeGlobal.newSellerPromoDays}
                          disabled={!editing}
                          onChange={(e) =>
                            setGlobal('newSellerPromoDays', Math.max(1, Number(e.target.value) || 1))
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className={styles.sectionDividerTop}>
                    <div className={styles.switchRow}>
                      <CommonSwitch
                        size="md"
                        checked={activeGlobal.smallBusinessDiscountEnabled}
                        label="영세 · 중소상공인 상생 우대 요율 적용"
                        disabled={!editing}
                        onChange={(checked) => setGlobal('smallBusinessDiscountEnabled', checked)}
                      />
                    </div>
                    {activeGlobal.smallBusinessDiscountEnabled && (
                      <div className={styles.applyRow}>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldBlockLabel}>상생 특별 수수료율</div>
                          <CommonInput.Number
                            clearable={false}
                            className={styles.shortControl}
                            min={0}
                            max={100}
                            step={0.1}
                            suffix="%"
                            value={activeGlobal.smallBusinessDiscountRate}
                            disabled={!editing}
                            onChange={(e) =>
                              setGlobal(
                                'smallBusinessDiscountRate',
                                Math.max(0, Number(e.target.value) || 0),
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* 우측 사이드바 */}
            <aside className={styles.policySideOuter}>
              <div className={styles.sideCard}>
                <div className={styles.sideHead}>
                  <div className={styles.sideTitle}>차등 · 우대 적용 규칙</div>
                  <div className={styles.sideSubtitle}>수수료가 산정되는 우선순위 원칙입니다</div>
                </div>
                <div className={styles.customerMessageList}>
                  <div>
                    <span>1. 카테고리 요율 우선</span>
                    <p>카테고리별 차등 요율이 활성화된 경우 기본 수수료율보다 우선하여 기준 요율로 채택됩니다.</p>
                  </div>
                  <div>
                    <span>2. 판매자 등급 감면 차감</span>
                    <p>우수/VIP 판매자는 확정된 기준 요율에서 등급별 감면율(%p)이 추가로 공제됩니다.</p>
                  </div>
                  <div>
                    <span>3. 상생/프로모션 적용</span>
                    <p>신규 입점 웰컴 프로모션 대상자는 모든 계산에 앞서 특별 고정 요율이 최우선 적용됩니다.</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            3. 취소 · 환불 탭 (exempt - 표준 2열 policyLayout)
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'exempt' && (
          <div className={styles.policyLayout}>
            <div className={styles.policyMain}>
              {/* 섹션 1: 주문 취소 시 수수료 처리 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>1</span>
                    <span className={styles.sectionHeadTitle}>주문 취소 시 처리</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    배송 전 주문 취소 발생 시 이미 계산된 플랫폼 수수료를 정산에 어떻게 반영할지 정합니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.actorOptions}>
                    <CommonButton
                      type="button"
                      variant="option"
                      size="md"
                      selected={activeGlobal.cancelFeePolicy === '전액 취소'}
                      description="수수료를 100% 면제 환원하여 정산 차감 취소"
                      disabled={!editing}
                      onClick={() => setGlobal('cancelFeePolicy', '전액 취소')}
                    >
                      수수료 전액 면제 (환원)
                    </CommonButton>
                    <CommonButton
                      type="button"
                      variant="option"
                      size="md"
                      selected={activeGlobal.cancelFeePolicy === '수수료 유지'}
                      description="결제망 수수료 등 발생 비용 감안 수수료 정상 청구"
                      disabled={!editing}
                      onClick={() => setGlobal('cancelFeePolicy', '수수료 유지')}
                    >
                      수수료 유지 (부과)
                    </CommonButton>
                  </div>
                </div>
              </section>

              {/* 섹션 2: 반품 · 환불 시 귀책별 수수료 부담 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>2</span>
                    <span className={styles.sectionHeadTitle}>환불 시 수수료 반환</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    출고 후 반품/환불 발생 시 환불 금액 비율 및 귀책 사유에 따른 수수료 정산 기준입니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldBlockLabel}>기본 환불 수수료 정책</div>
                    <CommonSelect
                      className={styles.shortControl}
                      options={[
                        { label: '환불 비율만큼 감소 (비례 반환)', value: '환불 비율만큼 감소' },
                        { label: '전액 반환 (100% 수수료 면제)', value: '전액 반환' },
                        { label: '유지 (수수료 미반환)', value: '유지' },
                      ]}
                      value={activeGlobal.refundFeePolicy}
                      disabled={!editing}
                      aria-label="기본 환불 수수료 정책"
                      onChange={(v) => setGlobal('refundFeePolicy', String(v) as RefundFeePolicy)}
                    />
                  </div>

                  <div className={styles.sectionDividerTop}>
                    <div className={styles.costTable}>
                      <div className={`${styles.costRow} ${styles.costHead}`}>
                        <span>귀책 사유</span>
                        <span>수수료 면제</span>
                        <span>수수료 부과</span>
                      </div>
                      <div className={styles.costRow}>
                        <strong>고객 변심 반품</strong>
                        <CommonRadio
                          value="면제"
                          checked={true}
                          disabled={!editing}
                          aria-label="고객 변심 수수료 면제"
                          onChange={() => undefined}
                        />
                        <CommonRadio
                          value="부과"
                          checked={false}
                          disabled={!editing}
                          aria-label="고객 변심 수수료 부과"
                          onChange={() => undefined}
                        />
                      </div>
                      <div className={styles.costRow}>
                        <strong>판매자 귀책 (품절·지연)</strong>
                        <CommonRadio
                          value="면제"
                          checked={false}
                          disabled={!editing}
                          aria-label="판매자 귀책 수수료 면제"
                          onChange={() => undefined}
                        />
                        <CommonRadio
                          value="부과"
                          checked={true}
                          disabled={!editing}
                          aria-label="판매자 귀책 수수료 부과"
                          onChange={() => undefined}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 섹션 3: 안전 통제 및 수기 감면 */}
              <section className={styles.policySection}>
                <div className={styles.sectionDesc}>
                  <div className={styles.sectionHead}>
                    <span className={styles.sectionNum}>3</span>
                    <span className={styles.sectionHeadTitle}>안전 통제 및 감면</span>
                  </div>
                  <p className={styles.sectionDescText}>
                    정산 지급 실패 재시도 시 수수료 부과 여부와 운영자 수기 감면 승인 보안 통제입니다.
                  </p>
                </div>
                <div className={styles.sectionControls}>
                  <div className={styles.switchRow}>
                    <CommonSwitch
                      size="md"
                      checked={activeGlobal.chargeFailedPayoutFee}
                      label="정산 지급 실패 재시도 수수료 부과"
                      disabled={!editing}
                      onChange={(checked) => setGlobal('chargeFailedPayoutFee', checked)}
                    />
                    <CommonSwitch
                      size="md"
                      checked={activeGlobal.requireApprovalForManualDiscount}
                      label="수기 수수료 감면 시 관리자 승인 필수"
                      disabled={!editing}
                      onChange={(checked) =>
                        setGlobal('requireApprovalForManualDiscount', checked)
                      }
                    />
                  </div>
                  <div className={styles.fieldHint}>
                    수기 수수료 감면 승인 필수 옵션이 켜지면 10만원 이상의 수기 감면 시 총괄 관리자의 2차 승인이 요구됩니다.
                  </div>
                </div>
              </section>
            </div>

            {/* 우측 사이드바 */}
            <aside className={styles.policySideOuter}>
              <div className={styles.sideCard}>
                <div className={styles.sideHead}>
                  <div className={styles.sideTitle}>취소 · 환불 정산 안내</div>
                  <div className={styles.sideSubtitle}>수수료 정산 반영 프로세스</div>
                </div>
                <div className={styles.customerMessageList}>
                  <div>
                    <span>주문 취소 정산서 반영</span>
                    <p>당월 마감 전 취소된 주문의 수수료는 마이너스 수수료 항목으로 자동 상계 처리됩니다.</p>
                  </div>
                  <div>
                    <span>정산 확정 후 반품 발생</span>
                    <p>이미 지급 완료된 정산건의 반품 환불 수수료는 익월 차기 정산 대금에서 자동 차감 또는 이월 정산됩니다.</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            4. 규칙 관리 탭 (rules - 기존 DataGrid 완벽 복원)
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'rules' && (
          <div className={styles.rulesContainer}>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchLeft}>
                <CommonInput.Search
                  placeholder="정책명 또는 정책 코드 검색"
                  value={rulesSearch}
                  className={styles.moneyControl}
                  onChange={(e) => setRulesSearch(e.target.value)}
                  onClear={() => setRulesSearch('')}
                />
                <div className={styles.compactPills}>
                  {QUICK_FILTERS.map((f) => (
                    <CommonButton
                      key={f}
                      type="button"
                      variant={rulesFilter === f ? 'primary-light' : 'secondary'}
                      size="sm"
                      onClick={() => setRulesFilter(f)}
                    >
                      {f} ({policies.filter((p) => matchesQuickFilter(p, f, ruleWarnings)).length})
                    </CommonButton>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExcelDownloadButton type="button" data-grid-download />
                <CommonButton
                  type="button"
                  variant="emphasis"
                  size="md"
                  onClick={() => {
                    setDrawerItem(newFeePolicy());
                    setIsNewRule(true);
                  }}
                >
                  + 수수료 정책 등록
                </CommonButton>
              </div>
            </div>

            <div className={styles.rulesGridWrap}>
              <DataGrid
                columns={COLUMNS}
                rows={ruleRows}
                gridTemplate="minmax(180px,1fr) 98px 98px 90px 122px 154px 74px"
                minWidth="915px"
                empty={filteredRules.length === 0}
                emptyText={
                  rulesFilter === '확인 필요'
                    ? '현재 확인이 필요한 수수료 정책이 없습니다.'
                    : '검색 결과가 없습니다.'
                }
                emptySubtext="검색어나 필터 조건을 변경해 주세요."
                emptyActionLabel="초기화"
                emptyActionClick={() => {
                  setRulesSearch('');
                  setRulesFilter('전체');
                  setRulesTypeFilter('');
                }}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            5. 정책 Preview 탭 (preview - 취소/정산 정책 표준 2열 4카드)
        ══════════════════════════════════════════════════════════════ */}
        {tab === 'preview' && (
          <div className={styles.policyPreviewLayout}>
            {/* 좌측 메인 2개 카드 */}
            <div className={styles.policyPreviewMain}>
              {/* 1. 적용될 정책 전문 카드 */}
              <div className={styles.previewDocumentCard}>
                <div className={styles.previewDocumentHead}>
                  <div>
                    <div className={styles.previewDocumentTitle}>적용될 수수료 정책 전문</div>
                    <div className={styles.previewDocumentDesc}>
                      현재 설정된 값으로 판매자 정산 시 자동 적용되는 7대 공식 조항입니다.
                    </div>
                  </div>
                  <span className={editing ? styles.previewDraftBadge : styles.previewLiveBadge}>
                    {editing ? '미저장 초안' : '적용 중'}
                  </span>
                </div>

                <div className={styles.policySentenceList}>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>1</span>
                    <div>
                      <strong>기본 수수료율 및 부과 체계</strong>
                      <p>
                        플랫폼의 모든 일반 거래에 대해 {activeGlobal.calcMethod === '정률' ? `기본 ${activeGlobal.defaultFeeRate}% 정률` : `건당 ${fmtWon(activeGlobal.fixedFeeAmount)} 고정 정액`}({activeGlobal.calcUnit})을 수수료로 부과합니다.
                      </p>
                    </div>
                    <span className={styles.previewRowTag}>{activeGlobal.calcMethod}</span>
                  </div>

                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>2</span>
                    <div>
                      <strong>과세 기준 및 단수 처리</strong>
                      <p>
                        수수료는 {activeGlobal.calcBasis}을 기준으로 하며, 부가세는 {activeGlobal.taxTreatment === '별도' ? '10% 별도 가산' : activeGlobal.taxTreatment} 처리 후 {activeGlobal.roundingUnit}원 단위 {activeGlobal.roundingRule}합니다.
                      </p>
                    </div>
                    <span className={styles.previewRowTag}>{activeGlobal.roundingRule}</span>
                  </div>

                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>3</span>
                    <div>
                      <strong>배송비 수수료 부과 여부</strong>
                      <p>
                        고객이 결제한 배송비에 대해서는 {activeGlobal.includeShippingInFee ? `기본 수수료율(${activeGlobal.defaultFeeRate}%)을 합산 부과` : '수수료를 부과하지 않습니다(0원 면제)'}.
                      </p>
                    </div>
                    <span className={styles.previewRowTag}>{activeGlobal.includeShippingInFee ? '부과' : '면제'}</span>
                  </div>

                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>4</span>
                    <div>
                      <strong>카테고리 및 판매자 등급 차등</strong>
                      <p>
                        {activeGlobal.categoryFeeEnabled ? '카테고리별 차등 수수료율이 우선 적용' : '카테고리 차등 미적용'}되며, {activeGlobal.tierDiscountEnabled ? '우수/VIP 등급 판매자에게 감면 할인' : '등급 감면 미적용'}이 제공됩니다.
                      </p>
                    </div>
                    <span className={styles.previewRowTag}>{activeGlobal.categoryFeeEnabled ? '차등 활성' : '단일 요율'}</span>
                  </div>

                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>5</span>
                    <div>
                      <strong>신규 입점 및 상생 지원</strong>
                      <p>
                        {activeGlobal.newSellerPromoEnabled ? `신규 입점 판매자는 최초 ${activeGlobal.newSellerPromoDays}일간 ${activeGlobal.newSellerPromoRate}% 우대` : '웰컴 프로모션 미적용'}, {activeGlobal.smallBusinessDiscountEnabled ? `영세/중소상공인은 ${activeGlobal.smallBusinessDiscountRate}% 상생 요율` : '상생 요율 미적용'}을 지원합니다.
                      </p>
                    </div>
                    <span className={styles.previewRowTag}>{activeGlobal.newSellerPromoEnabled ? '지원 활성' : '미지원'}</span>
                  </div>

                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>6</span>
                    <div>
                      <strong>주문 취소 및 환불 수수료 반환</strong>
                      <p>
                        주문 취소 시에는 수수료를 {activeGlobal.cancelFeePolicy}하며, 환불 시에는 {activeGlobal.refundFeePolicy} 기준을 적용합니다.
                      </p>
                    </div>
                    <span className={styles.previewRowTag}>{activeGlobal.cancelFeePolicy}</span>
                  </div>

                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>7</span>
                    <div>
                      <strong>수기 감면 보안 승인 통제</strong>
                      <p>
                        운영자 수기 수수료 감면 시 {activeGlobal.requireApprovalForManualDiscount ? '총괄 관리자의 2차 승인이 필수 요구' : '즉시 반영 가능'}됩니다.
                      </p>
                    </div>
                    <span className={activeGlobal.requireApprovalForManualDiscount ? styles.previewRowTagWarn : styles.previewRowTag}>
                      {activeGlobal.requireApprovalForManualDiscount ? '승인 필수' : '일반'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 시나리오 판정 카드 */}
              <div className={styles.previewDecisionCard}>
                <div className={styles.previewDecisionHead}>
                  <div>
                    <div className={styles.previewDocumentTitle}>수수료 시나리오 실시간 판정</div>
                    <div className={styles.previewDocumentDesc}>
                      대표 거래 건에 현재 정책을 적용했을 때의 수수료 분해 내역입니다.
                    </div>
                  </div>
                  <div className={styles.compactPills}>
                    {TEST_TRANSACTIONS.map((tx) => (
                      <CommonButton
                        key={tx.id}
                        type="button"
                        variant={previewTxId === tx.id ? 'primary-light' : 'secondary'}
                        size="sm"
                        onClick={() => setPreviewTxId(tx.id)}
                      >
                        {tx.title}
                      </CommonButton>
                    ))}
                  </div>
                </div>

                <div className={styles.previewDecisionHero}>
                  <div>
                    <div className={styles.previewDecisionHeroTitle}>
                      {previewTx.seller} · {previewTx.category} ({previewTx.sellerTier})
                    </div>
                    <div className={styles.previewDecisionHeroSub}>
                      주문금액 {fmtWon(previewTx.orderAmount)} + 배송비 {fmtWon(previewTx.shippingFee)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#8b8b93' }}>실효 수수료율</div>
                    <strong style={{ fontSize: 18, color: '#18181b' }}>{previewBreakdown.appliedRate.toFixed(1)}%</strong>
                  </div>
                </div>

                <div className={styles.previewDecisionTable}>
                  <div className={`${styles.previewDecisionRow} ${styles.previewDecisionTableHead}`}>
                    <span>수수료 항목</span>
                    <span style={{ textAlign: 'right' }}>기준 요율</span>
                    <span style={{ textAlign: 'right' }}>산출 금액</span>
                    <span style={{ textAlign: 'right' }}>정산 반영</span>
                  </div>
                  <div className={styles.previewDecisionRow}>
                    <strong>상품 판매 수수료</strong>
                    <span style={{ textAlign: 'right' }}>{previewBreakdown.appliedRate}%</span>
                    <span style={{ textAlign: 'right' }}>{fmtWon(previewBreakdown.calculatedFee)}</span>
                    <span style={{ textAlign: 'right' }}>판매자 차감</span>
                  </div>
                  <div className={styles.previewDecisionRow}>
                    <strong>배송비 수수료</strong>
                    <span style={{ textAlign: 'right' }}>{activeGlobal.includeShippingInFee ? `${activeGlobal.defaultFeeRate}%` : '면제'}</span>
                    <span style={{ textAlign: 'right' }}>{activeGlobal.includeShippingInFee ? fmtWon(Math.round(previewTx.shippingFee * (activeGlobal.defaultFeeRate / 100))) : '0원'}</span>
                    <span style={{ textAlign: 'right' }}>{activeGlobal.includeShippingInFee ? '판매자 차감' : '면제'}</span>
                  </div>
                  {activeGlobal.taxTreatment === '별도' && (
                    <div className={styles.previewDecisionRow}>
                      <strong>부가세 (VAT 10%)</strong>
                      <span style={{ textAlign: 'right' }}>10%</span>
                      <span style={{ textAlign: 'right' }}>+{fmtWon(previewBreakdown.taxAmount)}</span>
                      <span style={{ textAlign: 'right' }}>세금계산서</span>
                    </div>
                  )}
                  <div className={styles.previewDecisionRow} style={{ background: '#fafafa', fontWeight: 700 }}>
                    <strong>최종 플랫폼 수수료</strong>
                    <span style={{ textAlign: 'right' }}>—</span>
                    <span style={{ textAlign: 'right', color: '#dc2626' }}>-{fmtWon(previewBreakdown.totalFee)}</span>
                    <span style={{ textAlign: 'right', color: '#166534' }}>정산 차감 확정</span>
                  </div>
                  <div className={styles.previewDecisionRow} style={{ background: '#f8fafc', fontWeight: 600 }}>
                    <strong>판매자 최종 정산 지급액</strong>
                    <span style={{ textAlign: 'right' }}>—</span>
                    <span style={{ textAlign: 'right', color: '#166534' }}>{fmtWon(previewBreakdown.sellerReceives)}</span>
                    <span style={{ textAlign: 'right' }}>지급 확정</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 사이드 2개 카드 */}
            <div className={styles.policyPreviewSide}>
              {/* 3. 판매자 안내 문구 카드 */}
              <div className={styles.sideCard}>
                <div className={styles.sideHead}>
                  <div className={styles.sideTitle}>판매자 파트너 포털 안내 문구</div>
                  <div className={styles.sideSubtitle}>파트너 입점 계약서 및 정산 화면 고지 조항</div>
                </div>
                <div className={styles.customerMessageList}>
                  <div>
                    <span>기본 수수료 및 부과 기준</span>
                    <p>
                      모든 정산 대금은 상품 결제금액의 {activeGlobal.calcMethod === '정률' ? `${activeGlobal.defaultFeeRate}%` : fmtWon(activeGlobal.fixedFeeAmount)}를 수수료로 공제 후 지급됩니다.
                    </p>
                  </div>
                  <div>
                    <span>배송비 및 부가세 안내</span>
                    <p>
                      배송비는 수수료 {activeGlobal.includeShippingInFee ? '부과 대상' : '비대상'}이며, 수수료에 대한 부가세는 {activeGlobal.taxTreatment === '별도' ? '별도 10% 가산' : activeGlobal.taxTreatment} 청구됩니다.
                    </p>
                  </div>
                  <div>
                    <span>취소 · 환불 수수료 환원</span>
                    <p>
                      배송 전 취소 건은 수수료가 전액 면제 환원되며, 구매자 변심 반품 시에도 수수료가 공제 환원됩니다.
                    </p>
                  </div>
                </div>

                <div className={editing ? styles.previewDeployPending : styles.previewDeployReady}>
                  <span>포털 배포 상태</span>
                  <strong>{editing ? '저장 후 즉시 반영' : '배포 완료 (적용 중)'}</strong>
                </div>
              </div>

              {/* 4. 전체 설정 요약 카드 */}
              <div className={styles.sideCard}>
                <div className={styles.sideHead}>
                  <div className={styles.sideTitle}>전체 설정 요약</div>
                </div>
                <div className={styles.digestRow}>
                  <span>기본 수수료율</span>
                  <strong>{activeGlobal.defaultFeeRate}%</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>계산 방식</span>
                  <strong>{activeGlobal.calcMethod}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>과세 기준</span>
                  <strong>{activeGlobal.taxTreatment}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>배송비 수수료</span>
                  <strong>{activeGlobal.includeShippingInFee ? '부과' : '면제'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>최대 상한 (Cap)</span>
                  <strong>{activeGlobal.maxFeeAmount ? fmtWon(activeGlobal.maxFeeAmount) : '없음'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>최소 수수료 (Floor)</span>
                  <strong>{activeGlobal.minFeeAmount ? fmtWon(activeGlobal.minFeeAmount) : '없음'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>절사 기준</span>
                  <strong>{activeGlobal.roundingUnit}원 {activeGlobal.roundingRule}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>카테고리 차등</span>
                  <strong>{activeGlobal.categoryFeeEnabled ? '사용' : '미사용'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>판매자 등급 우대</span>
                  <strong>{activeGlobal.tierDiscountEnabled ? '사용' : '미사용'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>신규 입점 웰컴</span>
                  <strong>{activeGlobal.newSellerPromoEnabled ? `${activeGlobal.newSellerPromoRate}%` : '미사용'}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>취소 시 수수료</span>
                  <strong>{activeGlobal.cancelFeePolicy}</strong>
                </div>
                <div className={styles.digestRow}>
                  <span>수기 감면 승인</span>
                  <strong>{activeGlobal.requireApprovalForManualDiscount ? '필수' : '선택'}</strong>
                </div>
                <div className={styles.sideFootNote}>
                  본 설정 요약 스냅샷은 파트너 정산 시 거래 레코드에 함께 박제됩니다.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 우측 슬라이드 인 변경 이력 타임라인 드로어 ── */}
      {showHistory && (
        <aside ref={historyRef} className={timeline.aside}>
          <div className={timeline.drawerHead}>
            <span className={timeline.drawerTitle}>수수료 정책 변경 이력</span>
            <button
              type="button"
              className={timeline.closeBtn}
              onClick={() => setShowHistory(false)}
            >
              ✕
            </button>
          </div>
          <div className={timeline.timelineWrap}>
            {historyList.map((entry) => (
              <div key={entry.id} className={timeline.item}>
                <div className={timeline.itemHead}>
                  <strong className={timeline.action}>{entry.field}</strong>
                  <span className={timeline.time}>{entry.at}</span>
                </div>
                <div className={timeline.by}>작업자: {entry.by}</div>
                <div style={{ fontSize: 11.5, color: '#52525b', marginTop: 4 }}>
                  <span style={{ color: '#a1a1aa', textDecoration: 'line-through' }}>
                    {entry.before}
                  </span>{' '}
                  → <strong style={{ color: '#18181b' }}>{entry.after}</strong>
                </div>
                <div style={{ fontSize: 11.5, color: '#71717a', marginTop: 4, background: '#f4f4f5', padding: '4px 8px', borderRadius: 6 }}>
                  사유: {entry.reason}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── 저장 전 변경 확인 다이얼로그 (Diff) ── */}
      {confirmSave && (
        <div className="dialogBackdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className={`dialogContent ${styles.saveDialog}`} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>수수료 정책 변경 사항 확인</h3>
            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#71717a' }}>
              다음 {confirmSave.length}개 항목이 변경되었습니다. 변경 사유를 입력하고 확정하세요.
            </p>

            <div className={styles.diffTable}>
              {confirmSave.map((d, i) => (
                <div key={i} className={styles.diffRow}>
                  <span className={styles.diffField}>{d.field}</span>
                  <span className={styles.diffBefore}>{d.before}</span>
                  <span className={styles.diffAfter}>{d.after}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#52525b', marginBottom: 6 }}>
                변경 사유 (필수)
              </label>
              <CommonInput
                placeholder="예: 2026 하반기 수수료 체계 개편 및 상생 감면 확대"
                value={saveReason}
                onChange={(e) => {
                  setSaveReason(e.target.value);
                  if (saveError) setSaveError('');
                }}
              />
              {saveError && <div className={styles.formError}>{saveError}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <CommonButton type="button" variant="secondary" size="md" onClick={() => setConfirmSave(null)}>
                취소
              </CommonButton>
              <CommonButton type="button" variant="emphasis" size="md" onClick={commitSave}>
                저장 확정
              </CommonButton>
            </div>
          </div>
        </div>
      )}

      {/* ── 규칙 관리 개별 정책 Drawer (기존 방식 복원) ── */}
      {drawerItem && (
        <FeePolicyDrawer
          key={`${drawerItem.id}-${isNewRule}`}
          initial={drawerItem}
          isNew={isNewRule}
          startEditing={isNewRule}
          issues={ruleWarnings[drawerItem.id] ?? []}
          onClose={() => {
            setDrawerItem(null);
            setIsNewRule(false);
          }}
          onSave={handleSaveRule}
          onToggleActive={handleToggleRuleActive}
        />
      )}
    </div>
  );
}
