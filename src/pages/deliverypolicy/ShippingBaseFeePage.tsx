import { useMemo, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './ShippingBaseFeePage.module.css';
import { DatePicker } from '../../components/forms';
import { CommonButton } from '../../components/common';
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

type Tab = 'basic' | 'free' | 'bundle' | 'preview' | 'history';
const TABS: [Tab, string][] = [
  ['basic', '기본 설정'],
  ['free', '무료배송'],
  ['bundle', '묶음 · 분할배송'],
  ['preview', '정책 Preview'],
  ['history', '변경 이력'],
];

const USAGE_OPTIONS: { value: ShippingUsage; title: string; desc: string }[] = [
  { value: '사용', title: '사용', desc: '모든 주문에 기본 배송비를 부과합니다.' },
  { value: '무료배송만 사용', title: '무료배송만 사용', desc: '기준 금액 이상이면 무료, 미만이면 기본 배송비.' },
  { value: '미사용', title: '미사용', desc: '배송비를 부과하지 않습니다.' },
];
const CALC_UNIT_OPTIONS: { value: CalcUnit; title: string; desc: string }[] = [
  { value: '배송건당', title: '배송건당', desc: '분할 출고 시 건마다 계산' },
  { value: '주문당', title: '주문당', desc: '주문 1건에 1회만 계산' },
];
const BASE_FEE_PRESETS = [2500, 3000, 3500];

function RadioCards<T extends string>({ options, value, onChange }: { options: { value: T; title: string; desc: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className={styles.radioGrid} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button key={o.value} type="button" className={`${styles.radioCard} ${value === o.value ? styles.radioCardActive : ''}`} onClick={() => onChange(o.value)}>
          <span className={styles.radioCardTitle}>{o.title}</span>
          <span className={styles.radioCardDesc}>{o.desc}</span>
        </button>
      ))}
    </div>
  );
}

export function ShippingBaseFeePage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastModified, setLastModified] = useState<LastModified>(INITIAL_LAST_MODIFIED);

  const [tab, setTab] = useState<Tab>('basic');
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [previewOrderId, setPreviewOrderId] = useState(TEST_ORDERS[0].id);
  const [calcAmount, setCalcAmount] = useState(38000);
  const [calcCount, setCalcCount] = useState(2);

  const warnings = useMemo(() => computeWarnings(draftPolicy), [draftPolicy]);

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof ShippingBasePolicy>(key: K, value: ShippingBasePolicy[K]) => setDraftPolicy((current) => ({ ...current, [key]: value }));

  const cancelEdit = () => setDraftPolicy(policy);
  const requestSave = () => {
    const diffs = describePolicyChanges(policy, draftPolicy);
    if (diffs.length === 0) return toastBriefly('변경된 내용이 없습니다.');
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
    ['계산 단위', draftPolicy.calcUnit],
    ['무료배송 기준', draftPolicy.freeShippingEnabled ? `${fmtWon(draftPolicy.freeShippingThreshold)} ${draftPolicy.freeShippingCompare}` : '사용 안 함'],
    ['묶음배송', draftPolicy.bundleCalc],
    ['적용 시작일', draftPolicy.startDate],
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
            <button type="button" className={styles.outlineBtn} onClick={() => setTab('history')}>변경 이력</button>
            <button type="button" className={styles.darkBtn} onClick={requestSave}>정책 수정</button>
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
            {warnings[0] && warningFix(warnings[0].id) && (
              <button type="button" className={styles.warningAction} onClick={warningFix(warnings[0].id)!.onClick}>{warningFix(warnings[0].id)!.label}</button>
            )}
          </div>
        )}

        {tab === 'basic' && (
          <>
            <div className={styles.chipsBar}>
              <div className={styles.chipsBody}>
                {chips.map(([label, value]) => (
                  <div key={label} className={styles.chipItem}>
                    <span className={styles.chipLabel}>{label}</span>
                    <span className={styles.chipValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.basicGrid}>
              <div className={`${styles.card} ${styles.basicUsage}`}>
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>배송비 사용 방식</div>
                  <div className={styles.cardDesc}>어떤 주문에 배송비를 부과할지 먼저 정합니다. 아래 설정은 이 선택에 따라 달라집니다.</div>
                </div>
                <div className={styles.cardBody}>
                  <RadioCards options={USAGE_OPTIONS} value={draftPolicy.usage} onChange={(v) => set('usage', v)} />

                  <div className={`${styles.toggleRow} ${styles.dividerTop} ${styles.thresholdRow}`}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.freeShippingEnabled ? styles.switchOn : ''}`} onClick={() => set('freeShippingEnabled', !draftPolicy.freeShippingEnabled)}><i /></button>
                    <div className={styles.toggleRowText}>
                      <div className={styles.toggleRowTitle}>무료배송 기준</div>
                      <div className={styles.toggleRowDesc}>{draftPolicy.freeShippingEnabled ? '기준 금액을 넘는 주문은 배송비가 면제됩니다.' : '꺼져 있어 모든 주문에 배송비가 부과됩니다.'}</div>
                    </div>
                    <div className={styles.inlineThreshold}>
                      <div className={styles.inputWithUnit}>
                        <input type="number" min={0} className={styles.textField} disabled={!draftPolicy.freeShippingEnabled} value={draftPolicy.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))} />
                        <span className={styles.inputUnit}>원</span>
                      </div>
                      <span>{draftPolicy.freeShippingCompare} 무료</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${styles.card} ${styles.basicPreview}`}>
                <div className={styles.cardHead}>
                  <div className={styles.cardTitle}>계산 미리보기</div>
                  <div className={styles.cardDesc}>현재 설정값으로 즉시 계산됩니다.</div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.previewFieldRow}>
                    <div className={styles.fieldLabel}>주문금액</div>
                    <div className={styles.inputWithUnit}>
                      <input type="number" min={0} className={styles.textField} value={calcAmount} onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value) || 0))} />
                      <span className={styles.inputUnit}>원</span>
                    </div>
                  </div>
                  <div className={styles.previewFieldRow}>
                    <div className={styles.fieldLabel}>배송 건수</div>
                    <div className={styles.calcStepper}>
                      <button type="button" className={styles.stepperBtn} onClick={() => setCalcCount((n) => Math.max(1, n - 1))}>−</button>
                      <span className={styles.stepperValue}>{calcCount}</span>
                      <button type="button" className={styles.stepperBtn} onClick={() => setCalcCount((n) => Math.min(9, n + 1))}>+</button>
                    </div>
                  </div>

                  <div className={styles.breakdownTable}>
                    <div className={styles.breakdownRow}><span>기본 배송비</span><span className={styles.breakdownPos}>{fmtWon(draftPolicy.baseFee)}</span></div>
                    {calcCount > 1 && <div className={styles.breakdownRow}><span>묶음배송 · {draftPolicy.bundleCalc} ({calcCount}건)</span><span className={styles.breakdownPos}>× {bundleMultiplier}</span></div>}
                    {calcResult.freeShippingApplied && <div className={styles.breakdownRow}><span>무료배송 할인</span><span className={styles.breakdownNeg}>-{fmtWon(calcResult.rawTotal - calcResult.finalFee)}</span></div>}
                    <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}><span>청구 배송비</span><span>{fmtWon(calcResult.finalFee)}</span></div>
                  </div>

                  <div className={styles.scenarioTable}>
                    <div className={styles.scenarioTitle}>임계값 시나리오</div>
                    {scenarioAmounts.map((amount) => {
                      const result = computeShippingPreview({ id: 'S', target: '', productAmount: amount, discount: 0, pointsUsed: 0, shippingGroups: 1, hasIndividualItem: false, individualItemLabel: '' }, draftPolicy);
                      return (
                        <div key={amount} className={styles.scenarioRow}>
                          <span>{fmtWon(amount)} 주문</span>
                          <strong>{result.finalFee > 0 ? fmtWon(result.finalFee) : '무료배송'}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            <div className={`${styles.card} ${styles.basicAmount}`}>
              <div className={styles.cardHeadRow}>
                <div>
                  <div className={styles.cardTitle}>부과 금액</div>
                  <div className={styles.cardDesc}>기본값과 상·하한을 함께 정의합니다. 상한은 지역 추가 배송비까지 합산한 뒤 적용됩니다.</div>
                </div>
                <span className={styles.badgeActive}>적용 중</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.amountGrid}>
                  <div>
                    <div className={styles.fieldLabel}>기본 배송비</div>
                    <div className={styles.inputWithUnit}>
                      <input type="number" min={0} className={styles.textField} disabled={draftPolicy.usage === '미사용'} value={draftPolicy.baseFee} onChange={(e) => set('baseFee', Math.max(0, Number(e.target.value) || 0))} />
                      <span className={styles.inputUnit}>원</span>
                    </div>
                    <div className={styles.presetRow}>
                      {BASE_FEE_PRESETS.map((v) => (
                        <button key={v} type="button" className={`${styles.presetChip} ${draftPolicy.baseFee === v ? styles.presetChipOn : ''}`} onClick={() => set('baseFee', v)}>{v.toLocaleString('ko-KR')}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>계산 단위</div>
                    <RadioCards options={CALC_UNIT_OPTIONS} value={draftPolicy.calcUnit} onChange={(v) => set('calcUnit', v)} />
                    <div className={styles.toggleRow} style={{ marginTop: 10 }}>
                      <button type="button" className={`${styles.switch} ${draftPolicy.bundleCalc === '배송비 1회만 부과' ? styles.switchOn : ''}`} onClick={() => set('bundleCalc', draftPolicy.bundleCalc === '배송비 1회만 부과' ? '모든 배송비 합산' : '배송비 1회만 부과')}><i /></button>
                      <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>묶음배송 시 배송비 1회만 부과</div></div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>최소 배송비</div>
                    <div className={styles.inputWithUnit}>
                      <input type="number" min={0} className={styles.textField} value={draftPolicy.minFee} onChange={(e) => set('minFee', Math.max(0, Number(e.target.value) || 0))} />
                      <span className={styles.inputUnit}>원</span>
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>최대 배송비 <span className={styles.fieldLabelHint}>비워두면 제한 없음</span></div>
                    <div className={styles.inputWithUnit}>
                      <input type="number" min={0} className={styles.textField} placeholder="제한 없음" value={draftPolicy.maxFee ?? ''} onChange={(e) => set('maxFee', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} />
                      <span className={styles.inputUnit}>원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles.card} ${styles.basicTax}`}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>과세 · 적용</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.fieldLabel}>배송비 과세 구분</div>
                    <div className={styles.pillGroup}>
                      {(['과세', '비과세', '세금 정책에 따름'] as TaxTreatment[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.taxTreatment === v ? styles.pillBtnOn : ''}`} onClick={() => set('taxTreatment', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>적용 시작일</div>
                    <div className={styles.dateFieldRow}>
                      <DatePicker className={styles.policyDatePicker} value={draftPolicy.startDate} onChange={(e) => set('startDate', e.target.value)} />
                      <span className={styles.fieldLabelHint}>이 날짜 이후 생성되는 주문부터 적용</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className={`${styles.footerBar} ${styles.basicFooter}`}>
              <span className={styles.footerNote}>지역별 추가 배송비와 상품·거래처별 Override는 각각 <button type="button" className={styles.linkBtn} onClick={() => window.location.assign('/delivery-policy/region-fee')}>지역 추가 배송비</button>, 상품/거래처 상세에서 관리합니다.</span>
              <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
              <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
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
                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.freeShippingEnabled ? styles.switchOn : ''}`} onClick={() => set('freeShippingEnabled', !draftPolicy.freeShippingEnabled)}><i /></button>
                  <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>무료배송 사용</div></div>
                </div>

                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.fieldLabel}>무료배송 기준금액 <span className={styles.fieldLabelHint}>원</span></div>
                    <input type="number" min={0} className={styles.textField} disabled={!draftPolicy.freeShippingEnabled} value={draftPolicy.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))} />
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>무료배송 기준 비교</div>
                    <div className={styles.pillGroup}>
                      {(['이상', '초과'] as FreeShippingCompare[]).map((v) => (
                        <button key={v} type="button" disabled={!draftPolicy.freeShippingEnabled} className={`${styles.pillBtn} ${draftPolicy.freeShippingCompare === v ? styles.pillBtnOn : ''}`} onClick={() => set('freeShippingCompare', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className={styles.fieldLabel}>기준금액 계산</div>
                  <div className={styles.pillGroup}>
                    {(['할인 후 상품금액', '할인 전 상품금액', '최종 결제금액', '배송비 제외 주문금액'] as FreeShippingBasis[]).map((v) => (
                      <button key={v} type="button" disabled={!draftPolicy.freeShippingEnabled} className={`${styles.pillBtn} ${draftPolicy.freeShippingBasis === v ? styles.pillBtnOn : ''}`} onClick={() => set('freeShippingBasis', v)}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.dividerTop}>
                  <div className={styles.fieldLabel}>무료배송 적용 범위</div>
                  <div className={styles.pillGroup}>
                    {(['기본 배송비만 면제', '지역 추가배송비 포함 전체 면제'] as FreeShippingScope[]).map((v) => (
                      <button key={v} type="button" disabled={!draftPolicy.freeShippingEnabled} className={`${styles.pillBtn} ${draftPolicy.freeShippingScope === v ? styles.pillBtnOn : ''}`} onClick={() => set('freeShippingScope', v)}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>포인트 사용액은 결제수단으로 취급되어 '최종 결제금액' 기준을 선택했을 때만 무료배송 기준금액에서 차감됩니다. 할인 전/후 기준을 선택하면 포인트 사용 여부와 무관하게 계산됩니다.</div>

            <div className={styles.footerBar}>
              <span className={styles.footerNote}>저장하면 적용 시작일부터 신규 주문에 적용되며, 이미 확정된 주문의 배송비 Snapshot은 유지됩니다.</span>
              <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
              <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
            </div>
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
                  <div className={styles.fieldLabel}>묶음배송 시 배송비 계산</div>
                  <div className={styles.pillGroup}>
                    {(['배송비 1회만 부과', '가장 높은 배송비 1건 적용', '모든 배송비 합산'] as BundleCalc[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.bundleCalc === v ? styles.pillBtnOn : ''}`} onClick={() => set('bundleCalc', v)}>{v}</button>
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
                  <button type="button" className={`${styles.switch} ${draftPolicy.splitShippingExtraFee ? styles.switchOn : ''}`} onClick={() => set('splitShippingExtraFee', !draftPolicy.splitShippingExtraFee)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>운영상 분할배송 시 추가 배송비 부과</div>
                    <div className={styles.toggleRowDesc}>재고 문제 등으로 시스템이 배송을 나눈 경우입니다.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>고객이 결제한 배송비는 주문 확정 시점에 Snapshot으로 고정됩니다. 이후 운영 사정으로 배송이 나뉘어도 기본적으로 추가 배송비를 부과하지 않는 것을 권장합니다.</div>

            <div className={styles.footerBar}>
              <span className={styles.footerNote}>저장하면 적용 시작일부터 신규 주문에 적용되며, 이미 확정된 주문의 배송비 Snapshot은 유지됩니다.</span>
              <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
              <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
            </div>
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

        {tab === 'history' && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitle}>변경 이력</div>
              <div className={styles.cardDesc}>기본 배송비 정책 변경 기록입니다.</div>
            </div>
            <div className={styles.cardBody}>
              {history.length === 0 && <div className={styles.infoNote}>변경 이력이 없습니다.</div>}
              {history.map((h) => (
                <div key={h.id} className={timeline.timelineItem}>
                  <span className={timeline.timelineDot} />
                  <div className={timeline.timelineBody}>
                    <div className={timeline.timelineRow}><strong className={timeline.timelineTitle}>{h.field}</strong><span className={timeline.timelineWhen}>{h.at}</span></div>
                    <div className={timeline.timelineDetail}>{h.before} → {h.after} · {h.by}</div>
                    <div className={timeline.timelineDetail}>사유: {h.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 택배 기본 운임 변경" />
            </label>
            {saveError && <div className={styles.formError}>{saveError}</div>}
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmSave(null)}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={commitSave}>변경 저장</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
