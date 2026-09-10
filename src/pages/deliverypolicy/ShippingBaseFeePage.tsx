import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './ShippingBaseFeePage.module.css';
import { CommonBadge, CommonButton, CommonDatePicker, CommonInput, CommonSwitch } from '../../components/common';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  INITIAL_POLICIES as INITIAL_FREE_SHIPPING_POLICIES,
  computeStatus as computeFreeShippingStatus,
  fmtCondition as fmtFreeShippingCondition,
} from './freeShippingConditionData';
import {
  INITIAL_HISTORY,
  INITIAL_LAST_MODIFIED,
  INITIAL_POLICY,
  TEST_ORDERS,
  computeShippingPreview,
  computeWarnings,
  describePolicyChanges,
  fmtWon,
  signed,
  type BundleCalc,
  type CalcUnit,
  type FieldDiff,
  type FreeShippingBasis,
  type FreeShippingCompare,
  type FreeShippingScope,
  type LastModified,
  type PolicyHistoryEntry,
  type ShippingBasePolicy,
  type ShippingUsage,
  type TaxTreatment,
} from './shippingBaseFeeData';

type Tab = 'basic' | 'free' | 'bundle' | 'preview';
const TABS: [Tab, string][] = [
  ['basic', '기본 설정'],
  ['free', '무료배송'],
  ['bundle', '묶음 · 분할배송'],
  ['preview', '배송비 계산 테스트'],
];

const USAGE_OPTIONS: { value: ShippingUsage; title: string; desc: string }[] = [
  { value: '사용', title: '사용', desc: '모든 주문에 기본 배송비 부과' },
  { value: '무료배송만 사용', title: '무료배송만 사용', desc: '기준 금액 이상 무료, 미만은 기본 배송비' },
  { value: '미사용', title: '미사용', desc: '배송비를 부과하지 않음' },
];
const CALC_UNIT_OPTIONS: { value: CalcUnit; title: string; desc: string }[] = [
  { value: '배송건당', title: '배송건당', desc: '분할 출고 시 건마다 계산' },
  { value: '주문당', title: '주문당', desc: '주문 1건에 1회만 계산' },
];
const BASE_FEE_PRESETS = [2500, 3000, 3500];

export function ShippingBaseFeePage() {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastModified, setLastModified] = useState<LastModified>(INITIAL_LAST_MODIFIED);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [previewOrderId, setPreviewOrderId] = useState(TEST_ORDERS[0].id);
  const [calcAmount, setCalcAmount] = useState(38000);
  const [calcCount, setCalcCount] = useState(2);
  const historyRef = useRef<HTMLElement>(null);

  useOutsideClose(historyRef, () => setShowHistory(false));

  const warnings = useMemo(() => computeWarnings(draftPolicy), [draftPolicy]);
  const activeFreeShippingPolicies = useMemo(
    () => INITIAL_FREE_SHIPPING_POLICIES.filter((item) => computeFreeShippingStatus(item) === '적용중'),
    [],
  );
  const primaryFreeShippingPolicy = useMemo(
    () => [...activeFreeShippingPolicies].sort((a, b) => a.priority - b.priority)[0],
    [activeFreeShippingPolicies],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof ShippingBasePolicy>(key: K, value: ShippingBasePolicy[K]) => {
    if (!editing) return;
    setDraftPolicy((current) => ({ ...current, [key]: value }));
  };

  const startEdit = () => {
    setDraftPolicy(policy);
    setEditing(true);
  };
  const cancelEdit = () => {
    setDraftPolicy(policy);
    setEditing(false);
  };
  const requestSave = () => {
    const diffs = describePolicyChanges(policy, draftPolicy);
    if (diffs.length === 0) {
      setEditing(false);
      return;
    }
    setReason('');
    setSaveError('');
    setConfirmSave(diffs);
  };
  const commitSave = () => {
    if (!reason.trim()) return setSaveError('변경 사유를 입력해 주세요.');
    if (!confirmSave) return;
    const entries: PolicyHistoryEntry[] = confirmSave.map((d, i) => ({
      id: `H-${Date.now()}-${i}`,
      at: '2026-08-25 14:00',
      by: 'admin01',
      field: d.field,
      before: d.before,
      after: d.after,
      reason: reason.trim(),
    }));
    setPolicy(draftPolicy);
    setHistory((current) => [...entries, ...current]);
    setLastModified({ at: '2026-09-01', by: '운영 관리자' });
    setEditing(false);
    setConfirmSave(null);
    toastBriefly('기본 배송비 정책을 저장했습니다.');
  };

  const previewOrder = TEST_ORDERS.find((o) => o.id === previewOrderId)!;
  const previewResult = computeShippingPreview(previewOrder, policy);

  const calcResult = computeShippingPreview(
    { id: 'CALC', target: '', productAmount: calcAmount, discount: 0, pointsUsed: 0, shippingGroups: calcCount, hasIndividualItem: false, individualItemLabel: '' },
    draftPolicy,
  );
  const bundleMultiplier = draftPolicy.bundleCalc === '모든 배송비 합산' ? calcCount : 1;
  const scenarioBase = Math.max(0, draftPolicy.freeShippingThreshold);
  const scenarioAmounts = [Math.max(0, scenarioBase - 1000), scenarioBase, scenarioBase + 20000];

  const warningFix = (id: string): { label: string; onClick: () => void } | undefined => {
    if (id === 'usage-mismatch') return { label: '무료배송 켜기', onClick: () => set('freeShippingEnabled', true) };
    if (id === 'threshold-zero') return { label: '기준금액 수정', onClick: () => set('freeShippingThreshold', 50000) };
    if (id === 'min-max') return { label: '최대 배송비 초기화', onClick: () => set('maxFee', null) };
    return undefined;
  };

  const chips: [string, string][] = [
    ['배송비 사용', draftPolicy.usage],
    ['기본 배송비', fmtWon(draftPolicy.baseFee)],
    ['계산 단위', `${draftPolicy.calcUnit}${draftPolicy.bundleCalc === '배송비 1회만 부과' ? ' · 1회만' : ''}`],
    ['무료배송 기준', draftPolicy.freeShippingEnabled ? `${fmtWon(draftPolicy.freeShippingThreshold)} ${draftPolicy.freeShippingCompare}` : '사용 안 함'],
    ['상 · 하한', `${fmtWon(draftPolicy.minFee)} ~ ${draftPolicy.maxFee === null ? '제한 없음' : fmtWon(draftPolicy.maxFee)}`],
    ['과세 구분', draftPolicy.taxTreatment],
    ['적용 시작', draftPolicy.startDate],
  ];

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <div className={styles.eyebrow}>배송 정책</div>
            <h1 className={shared.title}>기본 배송비</h1>
            <p className={shared.subtitle}>별도 상품·거래처·지역 배송비 조건이 없는 주문에 적용되는 전역 기본값입니다.</p>
          </div>
          <div className={styles.headMeta}>
            <span className={styles.headMetaText}>최종 수정 {lastModified.at} · {lastModified.by}</span>
            <CommonButton type="button" variant="secondary" size="md" onClick={() => setShowHistory(true)}>변경 이력</CommonButton>
            {editing ? (
              <>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>취소</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={requestSave}>저장</CommonButton>
              </>
            ) : (
              <CommonButton type="button" variant="emphasis" size="md" onClick={startEdit}>수정</CommonButton>
            )}
          </div>
        </div>
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
      </div>

      <div className={styles.body}>
        {warnings.length > 0 && (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>!</span>
            <div className={styles.warningBody}>
              <div className={styles.warningTitle}>설정 확인 필요 · {warnings.length}건</div>
              <div className={styles.warningList}>
                {warnings.map((w) => <div key={w.id} className={styles.warningItem}>{w.message}</div>)}
              </div>
            </div>
            {editing && warnings[0] && warningFix(warnings[0].id) && (
              <CommonButton type="button" variant="secondary" size="sm" className={styles.warningAction} onClick={warningFix(warnings[0].id)!.onClick}>{warningFix(warnings[0].id)!.label}</CommonButton>
            )}
          </div>
        )}

        {tab === 'basic' && (
          <div className={styles.summaryCard}>
            <div className={styles.integrationHead}>
              <div>
                <h2>연결 정책 요약</h2>
                <p>상세 조건은 각 전용 정책 화면에서 관리하며 여기에는 현재 적용값만 표시합니다.</p>
              </div>
              <div className={styles.integrationActions}>
                <CommonButton type="button" variant="secondary" size="sm" onClick={() => navigate('/delivery-policy/free-shipping')}>무료배송 조건 관리</CommonButton>
                <CommonButton type="button" variant="secondary" size="sm" onClick={() => navigate('/delivery-policy/bundle')}>묶음배송 정책 관리</CommonButton>
              </div>
            </div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryTile}>
                <span className={styles.summaryTileLabel}>적용 중인 무료배송 조건</span>
                <span className={styles.summaryTileValue}>{activeFreeShippingPolicies.length}개</span>
              </div>
              <div className={styles.summaryTile}>
                <span className={styles.summaryTileLabel}>우선 적용 조건</span>
                <span className={styles.summaryTileValue}>{primaryFreeShippingPolicy ? `${primaryFreeShippingPolicy.name} · ${fmtFreeShippingCondition(primaryFreeShippingPolicy)}` : '없음'}</span>
              </div>
              <div className={styles.summaryTile}>
                <span className={styles.summaryTileLabel}>묶음배송 계산 방식</span>
                <span className={styles.summaryTileValue}>{draftPolicy.bundleCalc}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'basic' && (
          <>
            <div className={styles.policyLayout}>
              <div className={styles.policyMain}>

                <div className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>1</span>
                      <span className={styles.sectionHeadTitle}>배송비 사용 방식</span>
                    </div>
                    <div className={styles.sectionDescText}>어떤 주문에 배송비를 부과할지 먼저 정합니다. 아래 설정은 이 선택에 따라 달라집니다.</div>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.usageGrid}>
                      {USAGE_OPTIONS.map((o) => (
                        <CommonButton
                          key={o.value}
                          type="button"
                          variant="option"
                          size="md"
                          selected={draftPolicy.usage === o.value}
                          description={o.desc}
                          disabled={!editing}
                          onClick={() => set('usage', o.value)}
                        >
                          {o.title}
                        </CommonButton>
                      ))}
                    </div>

                    <div className={styles.thresholdRow}>
                      <CommonSwitch
                        size="md"
                        checked={draftPolicy.freeShippingEnabled}
                        disabled={!editing}
                        aria-label="무료배송 기준 사용"
                        onChange={(checked) => set('freeShippingEnabled', checked)}
                      />
                      <div className={styles.thresholdText}>
                        <div className={styles.thresholdTitle}>무료배송 기준</div>
                        <div className={styles.thresholdDesc}>{draftPolicy.freeShippingEnabled ? '기준 금액을 넘는 주문은 배송비가 면제됩니다.' : '꺼져 있어 모든 주문에 배송비가 부과됩니다.'}</div>
                      </div>
                      <div className={styles.thresholdInputRow}>
                        <CommonInput.Number
                          clearable={false}
                          className={styles.thresholdInput}
                          min={0}
                          suffix="원"
                          aria-label="무료배송 기준금액"
                          disabled={!editing || !draftPolicy.freeShippingEnabled}
                          value={draftPolicy.freeShippingThreshold}
                          onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))}
                        />
                        <span className={styles.thresholdSuffix}>{draftPolicy.freeShippingCompare} 무료</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>2</span>
                      <span className={styles.sectionHeadTitle}>부과 금액</span>
                      <CommonBadge type="success-light" size="sm">적용 중</CommonBadge>
                    </div>
                    <div className={styles.sectionDescText}>기본값과 상·하한을 함께 정의합니다. 상한은 지역 추가 배송비까지 합산한 뒤 적용됩니다.</div>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.amountRow}>
                      <div>
                        <div className={styles.fieldBlockLabel}>기본 배송비</div>
                        <CommonInput.Number
                          clearable={false}
                          className={styles.fieldInput}
                          min={0}
                          suffix="원"
                          aria-label="기본 배송비"
                          disabled={!editing || draftPolicy.usage === '미사용'}
                          value={draftPolicy.baseFee}
                          onChange={(e) => set('baseFee', Math.max(0, Number(e.target.value) || 0))}
                        />
                        <div className={styles.presetRow2}>
                          {BASE_FEE_PRESETS.map((v) => (
                            <CommonButton
                              key={v}
                              type="button"
                              variant={draftPolicy.baseFee === v ? 'emphasis' : 'secondary'}
                              size="sm"
                              aria-pressed={draftPolicy.baseFee === v}
                              className={styles.presetChip2}
                              disabled={!editing || draftPolicy.usage === '미사용'}
                              onClick={() => set('baseFee', v)}
                            >
                              {v.toLocaleString('ko-KR')}
                            </CommonButton>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className={styles.fieldBlockLabel}>최소 배송비</div>
                        <CommonInput.Number
                          clearable={false}
                          className={styles.fieldInput}
                          min={0}
                          suffix="원"
                          aria-label="최소 배송비"
                          disabled={!editing}
                          value={draftPolicy.minFee}
                          onChange={(e) => set('minFee', Math.max(0, Number(e.target.value) || 0))}
                        />
                      </div>
                      <div>
                        <div className={styles.fieldBlockLabel}>최대 배송비 <span className={styles.fieldBlockHint}>비워두면 제한 없음</span></div>
                        <CommonInput.Number
                          clearable={false}
                          className={styles.fieldInput}
                          min={0}
                          suffix="원"
                          placeholder="제한 없음"
                          aria-label="최대 배송비"
                          disabled={!editing}
                          value={draftPolicy.maxFee ?? ''}
                          onChange={(e) => set('maxFee', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))}
                        />
                      </div>
                    </div>

                    <div className={styles.unitRow}>
                      <div>
                        <div className={styles.fieldBlockLabel}>계산 단위</div>
                        <div className={styles.pillRow2}>
                          {CALC_UNIT_OPTIONS.map((o) => (
                            <CommonButton
                              key={o.value}
                              type="button"
                              variant={draftPolicy.calcUnit === o.value ? 'emphasis' : 'secondary'}
                              size="md"
                              aria-pressed={draftPolicy.calcUnit === o.value}
                              className={styles.pillItem}
                              disabled={!editing}
                              onClick={() => set('calcUnit', o.value)}
                            >
                              {o.title}
                            </CommonButton>
                          ))}
                        </div>
                        <div className={styles.unitHint}>{CALC_UNIT_OPTIONS.find((o) => o.value === draftPolicy.calcUnit)?.desc}</div>
                      </div>
                      <div>
                        <div className={styles.fieldBlockLabel}>묶음배송</div>
                        <div className={styles.bundleSwitchRow}>
                          <CommonSwitch
                            size="md"
                            checked={draftPolicy.bundleCalc === '배송비 1회만 부과'}
                            label="배송비 1회만 부과"
                            disabled={!editing}
                            onChange={(checked) => set('bundleCalc', checked ? '배송비 1회만 부과' : '모든 배송비 합산')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>3</span>
                      <span className={styles.sectionHeadTitle}>과세 · 적용</span>
                    </div>
                    <div className={styles.sectionDescText}>배송비의 세금 처리 기준과 이 정책이 발효되는 날짜입니다.</div>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.taxRow}>
                      <div>
                        <div className={styles.fieldBlockLabel}>배송비 과세 구분</div>
                        <div className={styles.pillRow2}>
                          {(['과세', '비과세', '세금 정책에 따름'] as TaxTreatment[]).map((v) => (
                            <CommonButton
                              key={v}
                              type="button"
                              variant={draftPolicy.taxTreatment === v ? 'emphasis' : 'secondary'}
                              size="md"
                              aria-pressed={draftPolicy.taxTreatment === v}
                              className={styles.pillItem}
                              disabled={!editing}
                              onClick={() => set('taxTreatment', v)}
                            >
                              {v}
                            </CommonButton>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className={styles.fieldBlockLabel}>적용 시작일</div>
                        <div className={styles.dateRow2}>
                          <CommonDatePicker
                            size="md"
                            className={styles.dateField}
                            clearable={false}
                            value={draftPolicy.startDate}
                            aria-label="적용 시작일"
                            disabled={!editing}
                            onChange={(value) => { if (!Array.isArray(value) && value) set('startDate', value); }}
                          />
                          <span className={styles.dateHint}>이 날짜 이후 주문부터 적용</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className={styles.policySideOuter}>
                <div className={styles.policySide}>

                  <div className={styles.sideCard}>
                    <div className={styles.sideHead}>
                      <div className={styles.sideTitle}>배송비 계산 테스트</div>
                      <div className={styles.sideDesc}>현재 설정값으로 즉시 계산됩니다</div>
                    </div>
                    <div className={styles.sideFields}>
                      <div className={styles.sideFieldRow}>
                        <span className={styles.sideFieldLabel}>주문금액</span>
                        <div className={styles.sideFieldControl}>
                          <CommonInput.Number
                            clearable={false}
                            className={styles.fieldInput}
                            min={0}
                            suffix="원"
                            aria-label="미리보기 주문금액"
                            value={calcAmount}
                            onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value) || 0))}
                          />
                        </div>
                      </div>
                      <div className={styles.sideFieldRow}>
                        <span className={styles.sideFieldLabel}>배송 건수</span>
                        <div className={styles.sideFieldControl}>
                          <div className={styles.sideStepper}>
                            <CommonButton type="button" variant="secondary" size="sm" aria-label="배송 건수 감소" onClick={() => setCalcCount((n) => Math.max(1, n - 1))}>−</CommonButton>
                            <span className={styles.sideStepperValue}>{calcCount}</span>
                            <CommonButton type="button" variant="secondary" size="sm" aria-label="배송 건수 증가" onClick={() => setCalcCount((n) => Math.min(9, n + 1))}>+</CommonButton>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.sideBody}>
                      <div className={styles.sideLine}>
                        <span className={styles.sideLineLabel}>기본 배송비</span>
                        <span className={styles.sideLineValue}>{fmtWon(draftPolicy.baseFee)}</span>
                      </div>
                      {calcCount > 1 && (
                        <div className={styles.sideLine}>
                          <span className={styles.sideLineLabel}>묶음배송 · {draftPolicy.bundleCalc} ({calcCount}건)</span>
                          <span className={`${styles.sideLineValue} ${styles.sideLineValueMuted}`}>× {bundleMultiplier}</span>
                        </div>
                      )}
                      {calcResult.freeShippingApplied && (
                        <div className={styles.sideLine}>
                          <span className={styles.sideLineLabel}>무료배송 할인</span>
                          <span className={`${styles.sideLineValue} ${styles.sideLineValueNeg}`}>-{fmtWon(calcResult.rawTotal - calcResult.finalFee)}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.sideTotalRow}>
                      <span className={styles.sideTotalLabel}>청구 배송비</span>
                      <span className={styles.sideTotalValue}>{fmtWon(calcResult.finalFee)}</span>
                    </div>
                    <div className={styles.scenarioBox}>
                      <div className={styles.scenarioBoxTitle}>임계값 시나리오</div>
                      {scenarioAmounts.map((amount) => {
                        const result = computeShippingPreview({ id: 'S', target: '', productAmount: amount, discount: 0, pointsUsed: 0, shippingGroups: 1, hasIndividualItem: false, individualItemLabel: '' }, draftPolicy);
                        return (
                          <div key={amount} className={styles.scenarioBoxRow}>
                            <span>{fmtWon(amount)} 주문</span>
                            <strong>{result.finalFee > 0 ? fmtWon(result.finalFee) : '무료배송'}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.sideCard}>
                    <div className={styles.sideHead}>
                      <div className={styles.sideTitle}>현재 정책 요약</div>
                    </div>
                    {chips.map(([label, value]) => (
                      <div key={label} className={styles.digestRow}>
                        <span className={styles.digestLabel}>{label}</span>
                        <span className={styles.digestValue}>{value}</span>
                      </div>
                    ))}
                    <div className={styles.sideFootNote}>
                      지역별 추가비와 배송 가능 여부는 <button type="button" className={styles.linkBtn} onClick={() => window.location.assign('/delivery-policy/region-fee')}>지역별 배송 정책</button>에서, 상품별 예외는 상품별 배송 정책에서 관리합니다.
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </>
        )}

        {tab === 'free' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>무료배송</div>
                <div className={styles.cardDesc}>기준금액 이상 주문 시 배송비를 면제할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.bundleSwitchRow}>
                  <CommonSwitch size="md" checked={draftPolicy.freeShippingEnabled} label="무료배송 사용" disabled={!editing} onChange={(checked) => set('freeShippingEnabled', checked)} />
                </div>

                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.fieldBlockLabel}>무료배송 기준금액</div>
                    <CommonInput.Number clearable={false} className={styles.fieldInput} min={0} suffix="원" aria-label="무료배송 기준금액" disabled={!editing || !draftPolicy.freeShippingEnabled} value={draftPolicy.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))} />
                  </div>
                  <div>
                    <div className={styles.fieldBlockLabel}>무료배송 기준 비교</div>
                    <div className={styles.pillRow2}>
                      {(['이상', '초과'] as FreeShippingCompare[]).map((v) => (
                        <CommonButton key={v} type="button" variant={draftPolicy.freeShippingCompare === v ? 'emphasis' : 'secondary'} size="md" aria-pressed={draftPolicy.freeShippingCompare === v} className={styles.pillItem} disabled={!editing || !draftPolicy.freeShippingEnabled} onClick={() => set('freeShippingCompare', v)}>{v}</CommonButton>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className={styles.fieldBlockLabel}>기준금액 계산</div>
                  <div className={styles.pillRow2}>
                    {(['할인 후 상품금액', '할인 전 상품금액', '최종 결제금액', '배송비 제외 주문금액'] as FreeShippingBasis[]).map((v) => (
                      <CommonButton key={v} type="button" variant={draftPolicy.freeShippingBasis === v ? 'emphasis' : 'secondary'} size="md" aria-pressed={draftPolicy.freeShippingBasis === v} className={styles.pillItem} disabled={!editing || !draftPolicy.freeShippingEnabled} onClick={() => set('freeShippingBasis', v)}>{v}</CommonButton>
                    ))}
                  </div>
                </div>

                <div className={styles.dividerTop}>
                  <div className={styles.fieldBlockLabel}>무료배송 적용 범위</div>
                  <div className={styles.pillRow2}>
                    {(['기본 배송비만 면제', '지역 추가배송비 포함 전체 면제'] as FreeShippingScope[]).map((v) => (
                      <CommonButton key={v} type="button" variant={draftPolicy.freeShippingScope === v ? 'emphasis' : 'secondary'} size="md" aria-pressed={draftPolicy.freeShippingScope === v} className={styles.pillItem} disabled={!editing || !draftPolicy.freeShippingEnabled} onClick={() => set('freeShippingScope', v)}>{v}</CommonButton>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>포인트 사용액은 결제수단으로 취급되어 '최종 결제금액' 기준을 선택했을 때만 무료배송 기준금액에서 차감됩니다. 할인 전/후 기준을 선택하면 포인트 사용 여부와 무관하게 계산됩니다.</div>

          </>
        )}

        {tab === 'bundle' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>묶음배송</div>
                <div className={styles.cardDesc}>여러 배송 그룹이 함께 결제될 때 배송비를 어떻게 계산할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldBlockLabel}>묶음배송 시 배송비 계산</div>
                  <div className={styles.pillRow2}>
                    {(['배송비 1회만 부과', '가장 높은 배송비 1건 적용', '모든 배송비 합산'] as BundleCalc[]).map((v) => (
                      <CommonButton key={v} type="button" variant={draftPolicy.bundleCalc === v ? 'emphasis' : 'secondary'} size="md" aria-pressed={draftPolicy.bundleCalc === v} className={styles.pillItem} disabled={!editing} onClick={() => set('bundleCalc', v)}>{v}</CommonButton>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>개별배송 상품(상품 상세에서 별도 설정)은 묶음배송 대상에서 항상 제외되어 별도 배송비가 추가됩니다.</div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>분할배송</div>
                <div className={styles.cardDesc}>운영 사정으로 배송이 여러 건으로 나뉠 때 추가 배송비를 부과할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <CommonSwitch size="md" checked={draftPolicy.splitShippingExtraFee} aria-label="운영상 분할배송 시 추가 배송비 부과" disabled={!editing} onChange={(checked) => set('splitShippingExtraFee', checked)} />
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>운영상 분할배송 시 추가 배송비 부과</div>
                    <div className={styles.toggleRowDesc}>재고 문제 등으로 시스템이 배송을 나눈 경우입니다.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>고객이 결제한 배송비는 주문 확정 시점에 Snapshot으로 고정됩니다. 이후 운영 사정으로 배송이 나뉘어도 기본적으로 추가 배송비를 부과하지 않는 것을 권장합니다.</div>

          </>
        )}

        {tab === 'preview' && (
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>테스트 주문 선택</h3>
              <div className={styles.orderPick}>
                {TEST_ORDERS.map((o) => (
                  <button key={o.id} type="button" className={`${styles.orderOption} ${previewOrderId === o.id ? styles.orderOptionActive : ''}`} onClick={() => setPreviewOrderId(o.id)}>
                    <span><strong>{o.id}</strong> · {o.target}</span>
                    <span>{fmtWon(o.productAmount)}</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 계산합니다.</div>
            </div>
            <div className={styles.previewCard}>
              <h3>배송비 계산 결과</h3>
              <div className={`${styles.resultHero} ${previewResult.finalFee > 0 ? styles.resultHeroPaid : ''}`}>
                <span>{previewOrder.id} · {previewOrder.target}</span>
                <strong>{previewResult.finalFee > 0 ? fmtWon(previewResult.finalFee) : '무료배송'}</strong>
              </div>
              <div className={styles.breakdownTable}>
                {previewResult.items.map((item, i) => (
                  <div key={i} className={styles.breakdownRow}>
                    <span>{item.label}</span>
                    <span className={item.amount < 0 ? styles.breakdownNeg : styles.breakdownPos}>{signed(item.amount)}</span>
                  </div>
                ))}
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                  <span>최종 배송비</span>
                  <span>{fmtWon(previewResult.finalFee)}</span>
                </div>
              </div>
              <div className={styles.resultRow}><span>기준금액 ({policy.freeShippingBasis})</span><strong>{fmtWon(previewResult.basisAmount)}</strong></div>
              <div className={styles.resultRow}><span>무료배송 적용</span><strong>{previewResult.freeShippingApplied ? '적용' : '미적용'}</strong></div>
              {previewResult.clamped && <div className={styles.resultRow}><span>최소/최대 배송비 적용</span><strong>적용됨</strong></div>}
              <div className={styles.resultRow}><span>지역 추가배송비</span><strong>별도 정책 적용</strong></div>
            </div>
          </div>
        )}

      </div>

      {showHistory && (
        <aside ref={historyRef} className={timeline.aside} aria-label="기본 배송비 정책 변경 이력">
          <div className={timeline.head}>
            <div className={timeline.headRow}>
              <div className={timeline.headBody}>
                <div className={timeline.eyebrow}>배송 정책 · 기본 배송비</div>
                <div className={timeline.titleRow}><span className={timeline.title}>변경 이력</span></div>
              </div>
              <CommonButton type="button" variant="ghost" size="sm" className={timeline.closeBtn} onClick={() => setShowHistory(false)}>×</CommonButton>
            </div>
          </div>
          <div className={timeline.scroll}>
            {history.length === 0 && <div className={timeline.emptyInline}>변경 이력이 없습니다.</div>}
            {history.map((entry) => (
              <div key={entry.id} className={timeline.timelineItem}>
                <span className={timeline.timelineDot} />
                <div className={timeline.timelineBody}>
                  <div className={timeline.timelineRow}><strong className={timeline.timelineTitle}>{entry.field}</strong><span className={timeline.timelineWhen}>{entry.at}</span></div>
                  <div className={timeline.timelineDetail}>{entry.before} → {entry.after}</div>
                  <div className={timeline.timelineDetail}>{entry.reason} · {entry.by}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {confirmSave && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmSave(null); }}>
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>기본 배송비 정책 변경 확인</h2>
            <p className={shared.dialogBody}>변경 사항은 적용 시작일부터 신규 주문에 적용됩니다. 이미 확정된 주문의 배송비 Snapshot은 유지됩니다.</p>
            <div className={styles.diffTable}>
              {confirmSave.map((d, i) => (
                <div key={i} className={styles.diffRow}>
                  <span className={styles.diffField}>{d.field}</span>
                  <span className={styles.diffBefore}>{d.before}</span>
                  <span className={styles.diffAfter}>{d.after}</span>
                </div>
              ))}
            </div>
            <label className={styles.formField}>
              <span>변경 사유 *</span>
              <CommonInput.Text value={reason} error={!!saveError} placeholder="예: 택배 기본 운임 변경" onChange={(e) => setReason(e.target.value)} />
            </label>
            {saveError && <div className={styles.formError}>{saveError}</div>}
            <div className={shared.dialogActions}>
              <CommonButton type="button" variant="secondary" size="md" onClick={() => setConfirmSave(null)}>취소</CommonButton>
              <CommonButton type="button" variant="emphasis" size="md" onClick={commitSave}>변경 저장</CommonButton>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
