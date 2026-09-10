import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './PaymentPolicyPage.module.css';
import { CommonBadge, CommonButton, CommonDatePicker, CommonInput, CommonSelect, CommonSwitch, showToast } from '../../components/common';
import { PaymentMethodEditDialog } from './PaymentMethodEditDialog';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  INITIAL_HISTORY,
  INITIAL_LAST_MODIFIED,
  INITIAL_METHODS,
  INITIAL_POLICY,
  PAYMENT_STAGES,
  computeWarnings,
  describeMethodChanges,
  describePolicyChanges,
  fmtWon,
  type AmountChangePolicy,
  type ExpiryAction,
  type FailureOrderAction,
  type FailureNotification,
  type FieldDiff,
  type LastModified,
  type PaymentBasis,
  type PaymentMethod,
  type PaymentPolicy,
  type PaymentTiming,
  type PolicyHistoryEntry,
  type RequeryFailureAction,
  type RetryLimitAction,
  type ShortagePolicy,
} from './paymentPolicyData';

const TTL_PRESETS = [15, 30, 60];

const PAYMENT_TIMING_OPTIONS: Array<{ value: PaymentTiming; description: string }> = [
  { value: '선결제', description: '주문 확정 전 대금 수납' },
  { value: '후불', description: '처리 완료 후 청구' },
  { value: '선결제 + 후불', description: '주문별로 선택 가능' },
];

const EXPIRY_OPTIONS: Array<{ value: ExpiryAction; title: string; description: string }> = [
  { value: '재결제 가능', title: '재결제 가능', description: '주문 유지 · 재시도 허용' },
  { value: '주문 자동 취소', title: '주문 자동 취소', description: '만료 즉시 취소 처리' },
  { value: '관리자 확인 필요', title: '관리자 확인 대기', description: '보류 상태로 이관' },
];

type Tab = 'basic' | 'methods' | 'partial' | 'failure' | 'cancel' | 'preview';
const TABS: [Tab, string][] = [
  ['basic', '기본 설정'],
  ['methods', '결제수단'],
  ['failure', '실패 · 재시도'],
  ['preview', '정책 Preview'],
];
const SHOW_LEGACY_BASIC_LAYOUT: boolean = false;

export function PaymentPolicyPage() {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [methods, setMethods] = useState(INITIAL_METHODS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastModified, setLastModified] = useState<LastModified>(INITIAL_LAST_MODIFIED);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [draftMethods, setDraftMethods] = useState(methods);
  const [showHistory, setShowHistory] = useState(false);
  const [methodEditId, setMethodEditId] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [previewAmount, setPreviewAmount] = useState(50000);
  const [previewSucceeded, setPreviewSucceeded] = useState(true);
  const [failurePreviewCause, setFailurePreviewCause] = useState<'한도 초과' | '인증 실패' | 'PG 오류'>('한도 초과');
  const historyRef = useRef<HTMLElement>(null);

  useOutsideClose(historyRef, () => setShowHistory(false));

  const warnings = useMemo(
    () => computeWarnings(editing ? draftPolicy : policy, editing ? draftMethods : methods),
    [editing, draftPolicy, draftMethods, policy, methods],
  );
  const sortedMethods = useMemo(() => [...(editing ? draftMethods : methods)].sort((a, b) => a.order - b.order), [editing, draftMethods, methods]);

  const toastBriefly = (message: string) => {
    showToast({ message, type: 'success' });
  };

  const set = <K extends keyof PaymentPolicy>(key: K, value: PaymentPolicy[K]) => {
    if (!editing) return;
    setDraftPolicy((current) => ({ ...current, [key]: value }));
  };

  const startEdit = () => {
    setDraftPolicy(policy);
    setDraftMethods(methods);
    setEditing(true);
    toastBriefly('정책 수정 모드입니다. 변경 후 상단의 [변경 사항 저장]을 클릭하세요.');
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
    setDraftMethods(methods);
    toastBriefly('수정을 취소했습니다.');
  };
  const requestSave = () => {
    const diffs = [...describePolicyChanges(policy, draftPolicy), ...describeMethodChanges(methods, draftMethods)];
    if (diffs.length === 0) {
      setEditing(false);
      toastBriefly('변경된 내용이 없어 수정 모드를 종료합니다.');
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
      at: '2026-08-24 14:00',
      by: 'admin01',
      field: d.field,
      before: d.before,
      after: d.after,
      reason: reason.trim(),
    }));
    setPolicy(draftPolicy);
    setMethods(draftMethods);
    setHistory((current) => [...entries, ...current]);
    setLastModified({ at: '2026-08-31', by: '운영 관리자' });
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('결제 정책을 저장했습니다.');
  };

  const toggleStage = (stage: string) => {
    if (!editing) return;
    setDraftPolicy((current) => ({
      ...current,
      paymentAllowedStages: current.paymentAllowedStages.includes(stage)
        ? current.paymentAllowedStages.filter((s) => s !== stage)
        : [...current.paymentAllowedStages, stage],
    }));
  };

  const setDefaultMethod = (methodId: string) => {
    if (!editing) return;
    setDraftMethods((current) => current.map((method) => ({ ...method, isDefault: method.id === methodId })));
  };

  const moveMethod = (item: PaymentMethod, direction: -1 | 1) => {
    const targetMethods = editing ? draftMethods : methods;
    const ordered = [...targetMethods].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((m) => m.id === item.id);
    const swap = ordered[index + direction];
    if (!swap) return;
    const updated = targetMethods.map((m) => (m.id === item.id ? { ...m, order: swap.order } : m.id === swap.id ? { ...m, order: item.order } : m));
    if (!editing) {
      setDraftPolicy(policy);
      setDraftMethods(updated);
      setEditing(true);
      toastBriefly('순서가 변경되었으며 수정 모드로 전환되었습니다.');
    } else {
      setDraftMethods(updated);
    }
  };

  const saveMethod = (updated: PaymentMethod) => {
    if (!editing) {
      setDraftPolicy(policy);
      setDraftMethods(methods.map((m) => (m.id === updated.id ? updated : updated.isDefault ? { ...m, isDefault: false } : m)));
      setEditing(true);
      toastBriefly('결제수단 설정이 임시 저장되었습니다. 상단의 [변경 사항 저장]을 클릭하세요.');
    } else {
      setDraftMethods((current) => current.map((m) => (m.id === updated.id ? updated : updated.isDefault ? { ...m, isDefault: false } : m)));
    }
    setMethodEditId(null);
  };

  const activeCount = (editing ? draftMethods : methods).filter((m) => m.active).length;
  const defaultMethod = (editing ? draftMethods : methods).find((m) => m.isDefault);
  const previewFinalState = !draftPolicy.paymentRequired
    ? '결제 없이 완료'
    : previewSucceeded
      ? '결제 완료'
      : draftPolicy.failureOrderAction === '주문 취소'
        ? '주문 자동 취소'
        : draftPolicy.failureOrderAction === '결제 실패 상태로 전환'
          ? '결제 실패'
          : '결제 대기 유지';
  const retryAttemptTimes = Array.from(
    { length: draftPolicy.maxRetryCount + 1 },
    (_, index) =>
      index === 0
        ? 0
        : Math.round(
            (draftPolicy.retryLimitMinutes * index) /
              draftPolicy.maxRetryCount,
          ),
  );
  const failurePreviewSuccess =
    draftPolicy.retryAllowed && draftPolicy.maxRetryCount > 0;
  const previewHasUnsavedChanges = editing && (
    describePolicyChanges(policy, draftPolicy).length > 0 ||
    describeMethodChanges(methods, draftMethods).length > 0
  );

  const policySide = (
    <div className={styles.policySide}>
      <div className={styles.sideCard}>
        <div className={styles.sideHead}>
          <div className={styles.sideTitle}>결제 흐름 미리보기</div>
          <div className={styles.sideDesc}>현재 설정값으로 즉시 계산됩니다</div>
        </div>
        <div className={styles.sideFields}>
          <div className={styles.sideFieldRow}>
            <span className={styles.sideFieldLabel}>주문금액</span>
            <div className={styles.sideFieldControl}>
              <CommonInput.Number
                clearable={false}
                min={0}
                suffix="원"
                aria-label="미리보기 주문금액"
                value={previewAmount}
                onChange={(event) => setPreviewAmount(Math.max(0, Number(event.target.value) || 0))}
              />
            </div>
          </div>
          <div className={styles.sideFieldRow}>
            <span className={styles.sideFieldLabel}>결제 시도 결과</span>
            <div className={styles.resultToggle}>
              <CommonButton type="button" variant={previewSucceeded ? 'emphasis' : 'secondary'} size="sm" onClick={() => setPreviewSucceeded(true)}>성공</CommonButton>
              <CommonButton type="button" variant={!previewSucceeded ? 'emphasis' : 'secondary'} size="sm" onClick={() => setPreviewSucceeded(false)}>실패</CommonButton>
            </div>
          </div>
        </div>
        <div className={styles.sideBody}>
          <div className={styles.sideLine}><span className={styles.sideLineLabel}>결제 대기 없음</span><span className={styles.sideLineValue}>—</span></div>
          <div className={styles.sideLine}>
            <span className={styles.sideLineLabel}>{previewSucceeded ? '주문 결제 완료 처리' : '결제 실패 처리'}</span>
            <span className={styles.sideLineValue}>{fmtWon(previewAmount)}</span>
          </div>
        </div>
        <div className={styles.sideTotalRow}>
          <span className={styles.sideTotalLabel}>최종 주문 상태</span>
          <span className={styles.sideTotalValue}>{previewFinalState}</span>
        </div>
        <div className={styles.flowDetails}>
          <div className={styles.flowDetailsTitle}>이 주문에 적용되는 조건</div>
          <div className={styles.flowDetailRow}><span>결제 가능 단계 수</span><strong>{draftPolicy.paymentAllowedStages.length}개</strong></div>
          <div className={styles.flowDetailRow}><span>재시도 포함 최대 소요</span><strong>{draftPolicy.retryAllowed ? `${draftPolicy.retryLimitMinutes * draftPolicy.maxRetryCount}분` : '재시도 없음'}</strong></div>
          <div className={styles.flowDetailRow}><span>처리 차단</span><strong>{draftPolicy.blockProcessingBeforePaid ? '결제 완료 전 차단' : '차단 안 함'}</strong></div>
        </div>
      </div>

      <div className={styles.sideCard}>
        <div className={styles.sideHead}><div className={styles.sideTitle}>현재 정책 요약</div></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>결제 방식</span><span className={styles.digestValue}>{draftPolicy.paymentTiming}</span></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>주문별 결제</span><span className={styles.digestValue}>{draftPolicy.paymentRequired ? '필수' : '선택'}</span></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>기본 결제수단</span><span className={styles.digestValue}>{defaultMethod?.name ?? '없음'}</span></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>결제 기준금액</span><span className={styles.digestValue}>{draftPolicy.paymentBasis}</span></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>결제 가능 시점</span><span className={styles.digestValue}>{draftPolicy.paymentAllowedStages.join(' · ') || '없음'}</span></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>유효시간</span><span className={styles.digestValue}>{draftPolicy.sessionExpiryMinutes}분 · {draftPolicy.expiryAction}</span></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>실패 재시도</span><span className={styles.digestValue}>{draftPolicy.retryAllowed ? `${draftPolicy.maxRetryCount}회 · ${draftPolicy.retryLimitMinutes}분 간격` : '사용 안 함'}</span></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>최종 실패 시</span><span className={styles.digestValue}>{draftPolicy.failureOrderAction}</span></div>
        <div className={styles.digestRow}><span className={styles.digestLabel}>적용 시작</span><span className={styles.digestValue}>{draftPolicy.effectiveFrom}</span></div>
        <div className={styles.sideFootNote}>결제수단별 한도와 부분결제 조건은 결제수단 관리에서, 취소·환불 연계는 각 정책에서 관리합니다.</div>
      </div>
    </div>
  );

  return (
    <div className={`${shared.page} ${styles.pageRoot}`}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <div className={shared.title}>결제 정책</div>
            <div className={shared.subtitle}>주문 결제 방식과 결제수단, 실패·재시도 및 주문 연계 기준을 설정합니다.</div>
          </div>
          <div className={styles.headMeta}>
            {!editing && <span className={styles.headMetaText}>최종 수정 {lastModified.at} · {lastModified.by}</span>}
            <CommonButton type="button" variant="secondary" size="md" onClick={() => setShowHistory(true)}>변경 이력</CommonButton>
            {!editing ? (
              <CommonButton type="button" variant="emphasis" size="md" onClick={startEdit}>수정</CommonButton>
            ) : (
              <>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>취소</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={requestSave}>저장</CommonButton>
              </>
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
      </header>

      <div className={styles.body}>
        {tab !== 'basic' && tab !== 'failure' && tab !== 'preview' && warnings.length > 0 && (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>!</span>
            <div className={styles.warningBody}>
              <div className={styles.warningTitle}>설정 확인 필요 · {warnings.length}건</div>
              <div className={styles.warningList}>
                {warnings.map((w) => <div key={w.id} className={styles.warningItem}>{w.message}</div>)}
              </div>
            </div>
            <button type="button" className={styles.warningActionBtn} onClick={() => setTab('methods')}>결제수단에서 확인</button>
          </div>
        )}

        {tab === 'basic' && (
          <>
            <div className={styles.policyLayout}>
              <div className={styles.policyMain}>
                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>1</span>
                      <span className={styles.sectionHeadTitle}>결제 방식</span>
                    </div>
                    <p className={styles.sectionDescText}>주문이 결제를 거쳐야 하는지, 어느 시점에 대금을 받을지 먼저 정합니다. 아래 설정은 이 선택에 따라 달라집니다.</p>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.optionGrid}>
                      {PAYMENT_TIMING_OPTIONS.map((option) => (
                        <CommonButton
                          key={option.value}
                          type="button"
                          variant="option"
                          size="md"
                          selected={draftPolicy.paymentTiming === option.value}
                          description={option.description}
                          disabled={!editing}
                          onClick={() => set('paymentTiming', option.value)}
                        >
                          {option.value}
                        </CommonButton>
                      ))}
                    </div>
                    <div className={styles.sectionDivider}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>주문별 결제</div>
                        <div className={styles.compactPills}>
                          <CommonButton type="button" variant={draftPolicy.paymentRequired ? 'emphasis' : 'secondary'} size="md" disabled={!editing} onClick={() => set('paymentRequired', true)}>필수</CommonButton>
                          <CommonButton type="button" variant={!draftPolicy.paymentRequired ? 'emphasis' : 'secondary'} size="md" disabled={!editing} onClick={() => set('paymentRequired', false)}>선택</CommonButton>
                        </div>
                        <div className={styles.fieldHint}>결제 없이 주문 완료 처리 가능 여부</div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>기본 결제수단</div>
                        <CommonSelect
                          className={styles.selectControl}
                          options={sortedMethods.filter((method) => method.active).map((method) => ({ label: method.name, value: method.id }))}
                          value={defaultMethod?.id ?? ''}
                          disabled={!editing}
                          aria-label="기본 결제수단"
                          onChange={(value) => setDefaultMethod(String(value))}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>결제 기준금액</div>
                        <CommonSelect
                          className={styles.selectControl}
                          options={(['최종 주문금액', '청구 확정금액'] as PaymentBasis[]).map((value) => ({ label: value, value }))}
                          value={draftPolicy.paymentBasis}
                          disabled={!editing}
                          aria-label="결제 기준금액"
                          onChange={(value) => set('paymentBasis', String(value) as PaymentBasis)}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>2</span>
                      <span className={styles.sectionHeadTitle}>결제 가능 시점</span>
                      <span className={styles.stepBadge}>{draftPolicy.paymentAllowedStages.length}개 단계</span>
                    </div>
                    <p className={styles.sectionDescText}>주문 Lifecycle 중 결제를 받을 수 있는 단계를 복수로 지정합니다.</p>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.stageRow}>
                      {PAYMENT_STAGES.map((stage) => {
                        const selected = draftPolicy.paymentAllowedStages.includes(stage);
                        return (
                          <CommonButton
                            key={stage}
                            type="button"
                            variant={selected ? 'primary-light' : 'secondary'}
                            size="md"
                            selected={selected}
                            disabled={!editing}
                            onClick={() => toggleStage(stage)}
                          >
                            <span className={styles.stageButtonContent}><span className={styles.stageMark}>{selected ? '✓' : ''}</span>{stage}</span>
                          </CommonButton>
                        );
                      })}
                    </div>
                    <div className={`${styles.switchRow} ${styles.sectionDividerTop}`}>
                      <CommonSwitch size="md" checked={draftPolicy.reserveStockOnPayment} label="결제 시 재고 선점" disabled={!editing} onChange={(checked) => set('reserveStockOnPayment', checked)} />
                      <CommonSwitch size="md" checked={draftPolicy.partialPaymentEnabled} label="부분결제 허용" disabled={!editing} onChange={(checked) => set('partialPaymentEnabled', checked)} />
                    </div>
                  </div>
                </section>

                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>3</span>
                      <span className={styles.sectionHeadTitle}>결제 유효시간</span>
                    </div>
                    <p className={styles.sectionDescText}>결제 요청 후 완료까지 허용할 시간과 만료 이후 동작입니다.</p>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.expiryGrid}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>결제 세션 유효시간</div>
                        <div className={styles.durationRow}>
                          <CommonInput.Number clearable={false} className={styles.numberControl} min={1} suffix="분" aria-label="결제 세션 유효시간" disabled={!editing} value={draftPolicy.sessionExpiryMinutes} onChange={(event) => set('sessionExpiryMinutes', Math.max(1, Number(event.target.value) || 1))} />
                          <div className={styles.compactPills}>
                            {TTL_PRESETS.map((value) => (
                              <CommonButton key={value} type="button" variant={draftPolicy.sessionExpiryMinutes === value ? 'emphasis' : 'secondary'} size="sm" disabled={!editing} onClick={() => set('sessionExpiryMinutes', value)}>{value}분</CommonButton>
                            ))}
                          </div>
                        </div>
                        <div className={styles.fieldHint}>요청 후 {draftPolicy.sessionExpiryMinutes}분 내 완료 필요</div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>유효시간 만료 후</div>
                        <div className={styles.optionGridCompact}>
                          {EXPIRY_OPTIONS.map((option) => (
                            <CommonButton key={option.value} type="button" variant="option" size="md" selected={draftPolicy.expiryAction === option.value} description={option.description} disabled={!editing} onClick={() => set('expiryAction', option.value)}>{option.title}</CommonButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>4</span>
                      <span className={styles.sectionHeadTitle}>실패 · 재시도</span>
                    </div>
                    <p className={styles.sectionDescText}>결제가 실패했을 때 몇 번까지, 얼마 간격으로 다시 시도할지 정합니다.</p>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.retryGrid}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>재시도 횟수</div>
                        <CommonInput.Number clearable={false} className={styles.numberControl} min={1} suffix="회" aria-label="재시도 횟수" disabled={!editing || !draftPolicy.retryAllowed} value={draftPolicy.maxRetryCount} onChange={(event) => set('maxRetryCount', Math.max(1, Number(event.target.value) || 1))} />
                        <div className={styles.fieldHint}>0이면 재시도 없음</div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>재시도 간격</div>
                        <CommonInput.Number clearable={false} className={styles.numberControl} min={1} suffix="분" aria-label="재시도 간격" disabled={!editing || !draftPolicy.retryAllowed} value={draftPolicy.retryLimitMinutes} onChange={(event) => set('retryLimitMinutes', Math.max(1, Number(event.target.value) || 1))} />
                        <div className={styles.fieldHint}>실패 후 대기 시간</div>
                      </div>
                      <div className={styles.fieldGroupWide}>
                        <div className={styles.fieldBlockLabel}>최종 실패 시</div>
                        <div className={styles.failureOptions}>
                          <CommonButton type="button" variant={draftPolicy.failureOrderAction === '주문 취소' ? 'emphasis' : 'secondary'} size="md" disabled={!editing} onClick={() => set('failureOrderAction', '주문 취소')}>주문 자동 취소</CommonButton>
                          <CommonButton type="button" variant={draftPolicy.failureOrderAction === '유지' ? 'emphasis' : 'secondary'} size="md" disabled={!editing} onClick={() => set('failureOrderAction', '유지')}>결제 대기 유지</CommonButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>5</span>
                      <span className={styles.sectionHeadTitle}>주문 연계 · 적용</span>
                    </div>
                    <p className={styles.sectionDescText}>결제 상태가 주문 처리에 어떻게 반영되는지와 이 정책이 발효되는 날짜입니다.</p>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.applyGrid}>
                      <div className={styles.fieldGroupWide}>
                        <div className={styles.fieldBlockLabel}>주문 처리 연계</div>
                        <div className={styles.switchRow}>
                          <CommonSwitch size="md" checked={draftPolicy.blockProcessingBeforePaid} label="결제 완료 전 주문 처리 차단" disabled={!editing} onChange={(checked) => set('blockProcessingBeforePaid', checked)} />
                          <CommonSwitch size="md" checked={draftPolicy.notifyAssigneeOnFailure} label="결제 실패 시 담당자 알림" disabled={!editing} onChange={(checked) => set('notifyAssigneeOnFailure', checked)} />
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>적용 시작일</div>
                        <div className={styles.dateRow}>
                          <CommonDatePicker size="md" clearable={false} className={styles.dateControl} value={draftPolicy.effectiveFrom} aria-label="적용 시작일" disabled={!editing} onChange={(value) => { if (!Array.isArray(value) && value) set('effectiveFrom', value); }} />
                          <span className={styles.fieldHint}>이 날짜 이후 생성 주문부터</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <aside className={styles.policySideOuter}>{policySide}</aside>
            </div>
            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 주문부터 적용되며, 진행 중인 결제 건에는 영향을 주지 않습니다.</span>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>취소</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={requestSave}>저장</CommonButton>
              </div>
            )}
          </>
        )}

        {tab === 'methods' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>결제수단</div>
                <div className={styles.cardDesc}>사용 여부·금액 제한·PG 연결은 결제수단별로 [수정]에서 설정합니다. 노출 순서는 ↑↓ 버튼으로 조정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.methodList}>
                  <div className={`${styles.methodRow} ${styles.methodHead}`}>
                    <span />
                    <span>결제수단</span>
                    <span>사용</span>
                    <span>결제금액</span>
                    <span>부분결제 / 자동확정</span>
                    <span>PG</span>
                    <span />
                    <span />
                  </div>
                  {sortedMethods.map((m) => (
                    <div key={m.id} className={styles.methodRow}>
                      <span className={styles.dragHandle}>☰</span>
                      <span className={styles.methodName}>{m.name}{m.isDefault && <span className={styles.defaultTag}>기본</span>}</span>
                      <span style={{ color: m.active ? '#059669' : '#a1a1aa' }}>{m.active ? '사용' : '비활성'}</span>
                      <span className={styles.methodDim}>{fmtWon(m.minAmount)} ~ {m.maxAmount === null ? '제한 없음' : fmtWon(m.maxAmount)}</span>
                      <span className={styles.methodDim}>{m.partialAllowed ? '부분결제 O' : '부분결제 X'} · {m.autoConfirm ? '자동확정' : '수동확정'}</span>
                      <span className={styles.methodDim}>{m.pg ?? '-'}</span>
                      <span style={{ display: 'flex', gap: 4 }}>
                        <button type="button" className={styles.methodEditBtn} onClick={() => moveMethod(m, -1)}>↑</button>
                        <button type="button" className={styles.methodEditBtn} onClick={() => moveMethod(m, 1)}>↓</button>
                      </span>
                      <button
                        type="button"
                        className={styles.methodEditBtn}
                        onClick={() => {
                          if (!editing) {
                            setDraftPolicy(policy);
                            setDraftMethods(methods);
                          }
                          setMethodEditId(m.id);
                        }}
                      >
                        {editing ? '수정' : '설정 보기'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 주문부터 적용되며, 진행 중인 결제 건에는 영향을 주지 않습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {tab === 'partial' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>부분결제</div>
                <div className={styles.cardDesc}>주문 금액을 여러 번에 나눠 결제할 수 있는지와, 그 조건을 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.partialPaymentEnabled ? styles.switchOn : ''}`} onClick={() => set('partialPaymentEnabled', !draftPolicy.partialPaymentEnabled)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>부분결제 허용</div>
                  </div>
                </div>

                {draftPolicy.partialPaymentEnabled && (
                  <div className={styles.cardGrid}>
                    <div>
                      <div className={styles.fieldLabel}>최소 1회 결제금액</div>
                      <input type="number" min="0" className={styles.textField} value={draftPolicy.minPartialAmount} onChange={(e) => set('minPartialAmount', Number(e.target.value))} />
                    </div>
                    <div>
                      <div className={styles.fieldLabel}>최소 결제 비율 (%)</div>
                      <input type="number" min="0" max="100" className={styles.textField} value={draftPolicy.minPartialRatioPct} onChange={(e) => set('minPartialRatioPct', Number(e.target.value))} />
                    </div>
                    <div>
                      <div className={styles.fieldLabel}>최대 결제 횟수</div>
                      <input type="number" min="1" className={styles.textField} value={draftPolicy.maxPartialCount} onChange={(e) => set('maxPartialCount', Number(e.target.value))} />
                    </div>
                    <div>
                      <div className={styles.fieldLabel}>잔액 결제 마감 <span className={styles.fieldLabelHint}>주문 확정 후 N일</span></div>
                      <input type="number" min="0" className={styles.textField} value={draftPolicy.balanceDueDays} onChange={(e) => set('balanceDueDays', Number(e.target.value))} />
                    </div>
                    <div className={styles.cardGridFull}>
                      <div className={styles.fieldLabel}>부족 결제 처리</div>
                      <select value={draftPolicy.shortagePolicy} onChange={(e) => set('shortagePolicy', e.target.value as ShortagePolicy)} className={styles.textField}>
                        <option>부분결제로 처리</option>
                        <option>결제 확인 차단</option>
                        <option>관리자 확인 필요</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.infoNote}>복수 결제수단 병행, 과결제 처리 등 세부 규칙은 프로젝트 확장 설정으로 제공됩니다.</div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 주문부터 적용되며, 진행 중인 결제 건에는 영향을 주지 않습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {tab === 'failure' && (
          <>
            <div className={styles.failurePolicyLayout}>
              <div className={styles.failurePolicyMain}>
                <section className={styles.failurePolicySection}>
                  <div className={styles.failureSectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>1</span>
                      <span className={styles.sectionHeadTitle}>결제 실패 처리</span>
                      <CommonBadge type="success-light" size="sm">{draftPolicy.failureOrderAction === '유지' ? '유지' : draftPolicy.failureOrderAction}</CommonBadge>
                    </div>
                    <p className={styles.sectionDescText}>결제가 실패했을 때 주문을 어떤 상태로 둘지, 재고 선점을 언제까지 유지할지 정합니다.</p>
                  </div>
                  <div className={styles.failureSectionControls}>
                    <div className={styles.failureActionOptions}>
                      {([
                        ['유지', '유지', '주문을 그대로 두고 재결제 대기'],
                        ['결제 실패 상태로 전환', '결제 대기', '별도 상태로 분리해 관리'],
                        ['주문 취소', '자동 취소', '선점 시간 경과 후 주문 취소'],
                      ] as [FailureOrderAction, string, string][]).map(([value, title, description]) => (
                        <CommonButton key={value} type="button" variant="option" size="md" selected={draftPolicy.failureOrderAction === value} description={description} disabled={!editing} onClick={() => set('failureOrderAction', value)}>{title}</CommonButton>
                      ))}
                    </div>
                    <div className={styles.failureDividerFields}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>재고 선점 유지</div>
                        <CommonInput.Number clearable={false} className={styles.numberControl} min={0} suffix="분" value={draftPolicy.stockReservationMinutes} disabled={!editing} aria-label="재고 선점 유지 시간" onChange={(event) => set('stockReservationMinutes', Math.max(0, Number(event.target.value) || 0))} />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>실패 알림</div>
                        <div className={styles.compactPills}>
                          {(['앱 푸시', '문자', '없음'] as FailureNotification[]).map((value) => (
                            <CommonButton key={value} type="button" variant={draftPolicy.failureNotification === value ? 'emphasis' : 'secondary'} size="md" disabled={!editing} onClick={() => set('failureNotification', value)}>{value}</CommonButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.failurePolicySection}>
                  <div className={styles.failureSectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>2</span>
                      <span className={styles.sectionHeadTitle}>사용자 재시도</span>
                    </div>
                    <p className={styles.sectionDescText}>고객이 같은 주문으로 결제를 다시 시도할 수 있는 횟수와 제한 시간입니다.</p>
                  </div>
                  <div className={styles.failureSectionControls}>
                    <div className={styles.failureFeatureCard}>
                      <CommonSwitch size="md" checked={draftPolicy.retryAllowed} label="사용자 재시도 허용" disabled={!editing} onChange={(checked) => set('retryAllowed', checked)} />
                      <span>재시도를 끄면 실패 후 새 주문으로만 결제할 수 있습니다</span>
                    </div>
                    <div className={styles.failureDividerFields}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>최대 재시도</div>
                        <CommonInput.Number clearable={false} className={styles.numberControl} min={1} suffix="회" value={draftPolicy.maxRetryCount} disabled={!editing || !draftPolicy.retryAllowed} aria-label="최대 재시도" onChange={(event) => set('maxRetryCount', Math.max(1, Number(event.target.value) || 1))} />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>재시도 제한시간</div>
                        <CommonInput.Number clearable={false} className={styles.numberControl} min={1} suffix="분" value={draftPolicy.retryLimitMinutes} disabled={!editing || !draftPolicy.retryAllowed} aria-label="재시도 제한시간" onChange={(event) => set('retryLimitMinutes', Math.max(1, Number(event.target.value) || 1))} />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>한도 초과 시</div>
                        <div className={styles.compactPills}>
                          {(['새 주문으로 안내', '주문 자동 취소'] as RetryLimitAction[]).map((value) => (
                            <CommonButton key={value} type="button" variant={draftPolicy.retryLimitAction === value ? 'emphasis' : 'secondary'} size="md" disabled={!editing || !draftPolicy.retryAllowed} onClick={() => set('retryLimitAction', value)}>{value}</CommonButton>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={styles.switchRow}>
                      <CommonSwitch size="md" checked={draftPolicy.keepFailedPaymentStage} label="실패한 결제수단 그대로 유지" disabled={!editing} onChange={(checked) => set('keepFailedPaymentStage', checked)} />
                      <CommonSwitch size="md" checked={draftPolicy.blockOrderChangesDuringRetry} label="재시도 중 주문금액 변경 차단" disabled={!editing} onChange={(checked) => set('blockOrderChangesDuringRetry', checked)} />
                    </div>
                  </div>
                </section>

                <section className={styles.failurePolicySection}>
                  <div className={styles.failureSectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>3</span>
                      <span className={styles.sectionHeadTitle}>결제 상태 재조회</span>
                    </div>
                    <p className={styles.sectionDescText}>내부 상태와 PG 상태가 어긋나는 경우 자동으로 동기화할지 정합니다.</p>
                    <div className={styles.failureInfoNote}>중복결제 방지는 시스템 필수 기능으로 항상 사용됩니다. 주문번호·결제 대상금액·진행 중 결제 여부를 자동 검증합니다.</div>
                  </div>
                  <div className={styles.failureSectionControls}>
                    <div className={styles.failureFeatureCard}>
                      <CommonSwitch size="md" checked={draftPolicy.autoRequery} label="결제 상태 자동 재조회" disabled={!editing} onChange={(checked) => set('autoRequery', checked)} />
                      <span>불일치가 감지되면 PG 상태 기준으로 동기화합니다</span>
                    </div>
                    <div className={styles.failureDividerFields}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>재조회 횟수</div>
                        <CommonInput.Number clearable={false} className={styles.numberControl} min={1} suffix="회" value={draftPolicy.requeryMaxCount} disabled={!editing || !draftPolicy.autoRequery} aria-label="재조회 횟수" onChange={(event) => set('requeryMaxCount', Math.max(1, Number(event.target.value) || 1))} />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>재조회 간격</div>
                        <CommonInput.Number clearable={false} className={styles.numberControl} min={1} suffix="초" value={draftPolicy.requeryIntervalSeconds} disabled={!editing || !draftPolicy.autoRequery} aria-label="재조회 간격" onChange={(event) => set('requeryIntervalSeconds', Math.max(1, Number(event.target.value) || 1))} />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>끝까지 불일치일 때</div>
                        <div className={styles.compactPills}>
                          {(['관리자 알림', 'PG 상태 우선 적용'] as RequeryFailureAction[]).map((value) => (
                            <CommonButton key={value} type="button" variant={draftPolicy.requeryFailureAction === value ? 'emphasis' : 'secondary'} size="md" disabled={!editing || !draftPolicy.autoRequery} onClick={() => set('requeryFailureAction', value)}>{value}</CommonButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <aside className={styles.failureSide}>
                <div className={styles.sideCard}>
                  <div className={styles.sideHead}><div className={styles.sideTitle}>실패 시나리오 미리보기</div><div className={styles.sideDesc}>현재 설정으로 고객의 재시도 흐름을 계산합니다</div></div>
                  <div className={styles.failureCauseRow}>
                    <span>실패 원인</span>
                    <div className={styles.failureSegmented}>
                      {(['한도 초과', '인증 실패', 'PG 오류'] as const).map((cause) => <button key={cause} type="button" className={failurePreviewCause === cause ? styles.failureSegmentActive : ''} onClick={() => setFailurePreviewCause(cause)}>{cause}</button>)}
                    </div>
                  </div>
                  <div className={styles.retryTimeline}>
                    {retryAttemptTimes.map((minute, index) => {
                      const success = failurePreviewSuccess && index === retryAttemptTimes.length - 1;
                      const attemptLabel = index === 0 ? '1차 결제 실패' : success ? (index + 1) + '차 재시도 성공' : (index + 1) + '차 재시도 실패';
                      return (
                        <div className={styles.retryTimelineRow} key={index}>
                          <span className={styles.retryDot + ' ' + (success ? styles.retryDotSuccess : styles.retryDotFailure)} />
                          <strong>{attemptLabel}{index === 0 ? ' (' + failurePreviewCause + ')' : ''}</strong>
                          <span>{minute}분</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.failureResultBand + ' ' + (failurePreviewSuccess ? styles.failureResultSuccess : styles.failureResultPending)}>
                    <span>최종 처리</span>
                    <strong>{failurePreviewSuccess ? '재시도 내 결제 완료' : draftPolicy.retryLimitAction}</strong>
                  </div>
                  <div className={styles.failureImpact}>
                    <div className={styles.flowDetailsTitle}>이 설정의 영향</div>
                    <div><span>고객이 시도할 수 있는 총 횟수</span><strong>{draftPolicy.retryAllowed ? draftPolicy.maxRetryCount + 1 : 1}회</strong></div>
                    <div><span>재시도 가능 시간</span><strong>{draftPolicy.retryAllowed ? draftPolicy.retryLimitMinutes + '분' : '없음'}</strong></div>
                    <div><span>재고 선점 유지</span><strong>{draftPolicy.stockReservationMinutes}분</strong></div>
                    <div><span>상태 재조회</span><strong>{draftPolicy.autoRequery ? draftPolicy.requeryMaxCount + '회 · ' + draftPolicy.requeryIntervalSeconds + '초 간격' : '사용 안 함'}</strong></div>
                  </div>
                </div>

                <div className={styles.sideCard}>
                  <div className={styles.sideHead}><div className={styles.sideTitle}>실패 재시도 요약</div></div>
                  <div className={styles.digestRow}><span className={styles.digestLabel}>실패 시 주문 상태</span><span className={styles.digestValue}>{draftPolicy.failureOrderAction}</span></div>
                  <div className={styles.digestRow}><span className={styles.digestLabel}>재시도</span><span className={styles.digestValue}>{draftPolicy.retryAllowed ? '최대 ' + draftPolicy.maxRetryCount + '회 · ' + draftPolicy.retryLimitMinutes + '분 내' : '허용 안 함'}</span></div>
                  <div className={styles.digestRow}><span className={styles.digestLabel}>한도 초과 시</span><span className={styles.digestValue}>{draftPolicy.retryLimitAction}</span></div>
                  <div className={styles.digestRow}><span className={styles.digestLabel}>재고 선점</span><span className={styles.digestValue}>{draftPolicy.stockReservationMinutes}분 유지</span></div>
                  <div className={styles.digestRow}><span className={styles.digestLabel}>실패 알림</span><span className={styles.digestValue}>{draftPolicy.failureNotification}</span></div>
                  <div className={styles.digestRow}><span className={styles.digestLabel}>상태 재조회</span><span className={styles.digestValue}>{draftPolicy.autoRequery ? draftPolicy.requeryMaxCount + '회 · ' + draftPolicy.requeryFailureAction : '사용 안 함'}</span></div>
                  <div className={styles.digestRow}><span className={styles.digestLabel}>중복결제 방지</span><span className={styles.digestValue}>항상 사용</span></div>
                  <div className={styles.sideFootNote}>PG 연동과 결제수단별 예외는 결제수단에서, 실패 후 자동 취소 조건은 기본 설정 탭에서 관리합니다.</div>
                </div>
              </aside>
            </div>
            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 주문부터 적용되며, 진행 중인 결제 건에는 영향을 주지 않습니다.</span>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>취소</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={requestSave}>저장</CommonButton>
              </div>
            )}
          </>
        )}
        {tab === 'cancel' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>취소 연계</div>
                <div className={styles.cardDesc}>결제 취소 기능과, 결제 완료 후 금액 변경 처리 방식을 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.cancelEnabled ? styles.switchOn : ''}`} onClick={() => set('cancelEnabled', !draftPolicy.cancelEnabled)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>결제 취소 기능 사용</div>
                  </div>
                </div>

                <div>
                  <div className={styles.fieldLabel}>결제 완료 후 주문 금액 변경</div>
                  <select value={draftPolicy.amountChangePolicy} onChange={(e) => set('amountChangePolicy', e.target.value as AmountChangePolicy)} className={styles.textField} style={{ maxWidth: 260 }}>
                    <option>직접 수정 허용</option>
                    <option>변경 요청 Workflow</option>
                    <option>수정 불가</option>
                  </select>
                </div>

                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.manualPaymentEnabled ? styles.switchOn : ''}`} onClick={() => set('manualPaymentEnabled', !draftPolicy.manualPaymentEnabled)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>관리자 수동 결제 등록 허용</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>
              결제 취소 이후 주문 상태 처리, 부분 취소·환불 계산 규칙은 <button type="button" className={styles.methodEditBtn} onClick={() => navigate('/policy/cancellation')}>취소 정책</button>{' '}
              및 <button type="button" className={styles.methodEditBtn} onClick={() => navigate('/policy/refund')}>환불 정책</button>에서 관리합니다.
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 주문부터 적용되며, 진행 중인 결제 건에는 영향을 주지 않습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {tab === 'preview' && (
          <div className={styles.policyPreviewLayout}>
            <div className={styles.policyPreviewMain}>
              <section className={styles.previewDocumentCard}>
                <div className={styles.previewDocumentHead}>
                  <div>
                    <div className={styles.previewDocumentTitle}>적용될 정책 전문</div>
                    <div className={styles.previewDocumentDesc}>현재 설정이 실제 결제 흐름에 어떻게 적용되는지 문장으로 확인합니다. 이 탭은 읽기 전용입니다.</div>
                  </div>
                  <span className={previewHasUnsavedChanges ? styles.previewDraftBadge : styles.previewLiveBadge}>
                    {previewHasUnsavedChanges ? '미저장 초안' : `적용 중 · ${draftPolicy.effectiveFrom}`}
                  </span>
                </div>

                <div className={styles.policySentenceList}>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>1</span>
                    <div><strong>결제 방식</strong><p>‘{draftPolicy.paymentTiming}’ 방식으로 운영하며, 주문별 결제는 {draftPolicy.paymentRequired ? '필수입니다' : '선택입니다'}. 결제가 완료되어야 주문이 다음 단계로 진행됩니다.</p></div>
                    <span className={styles.previewRowTag}>{draftPolicy.paymentRequired ? '필수 결제' : '선택 결제'}</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>2</span>
                    <div><strong>결제 기준금액 · 수단</strong><p>결제 대상 금액은 {draftPolicy.paymentBasis} 기준으로 산정하고, 기본 결제수단은 {defaultMethod?.name ?? '지정되지 않음'}입니다. 부분결제는 {draftPolicy.partialPaymentEnabled ? '허용합니다' : '허용하지 않습니다'}.</p></div>
                    <span className={styles.previewRowTag}>금액</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>3</span>
                    <div><strong>결제 가능 시점</strong><p>{draftPolicy.paymentAllowedStages.length > 0 ? `${draftPolicy.paymentAllowedStages.join(' · ')} 단계에서 결제를 요청할 수 있으며` : '결제 가능한 주문 단계가 없으며'}, 결제 요청 시 재고를 {draftPolicy.reserveStockOnPayment ? '선점합니다' : '선점하지 않습니다'}.</p></div>
                    <span className={styles.previewRowTag}>{draftPolicy.paymentAllowedStages.length}개 단계</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>4</span>
                    <div><strong>결제 세션 유효시간</strong><p>결제 요청 후 {draftPolicy.sessionExpiryMinutes}분 내에 완료해야 하며, 만료되면 {draftPolicy.expiryAction}합니다.</p></div>
                    <span className={styles.previewRowTag}>세션</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>5</span>
                    <div><strong>실패 · 재시도</strong><p>결제 실패 시 주문 상태를 ‘{draftPolicy.failureOrderAction}’로 처리하고{draftPolicy.retryAllowed ? `, ${draftPolicy.retryLimitMinutes}분 내 최대 ${draftPolicy.maxRetryCount}회까지 재시도할 수 있습니다.` : ', 재시도는 허용하지 않습니다.'} 모두 실패하면 {draftPolicy.retryLimitAction}합니다.</p></div>
                    <span className={styles.previewRowTag}>재시도</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>6</span>
                    <div><strong>운영 처리</strong><p>결제 미완료 주문은 처리 단계로 {draftPolicy.blockProcessingBeforePaid ? '넘어가지 않습니다' : '진행할 수 있습니다'}. 결제 실패 시 고객에게 {draftPolicy.failureNotification === '없음' ? '별도 알림을 보내지 않으며' : `${draftPolicy.failureNotification} 알림을 보내며`}, {draftPolicy.effectiveFrom} 이후 생성된 주문부터 적용됩니다.</p></div>
                    <span className={styles.previewRowTag}>운영</span>
                  </div>
                </div>
              </section>

              <section className={styles.previewStageCard}>
                <div className={styles.previewCardHead}>
                  <div className={styles.previewDocumentTitle}>단계별 결제 판정</div>
                  <div className={styles.previewDocumentDesc}>주문 단계마다 결제 요청이 가능한지와 그때 적용되는 처리입니다.</div>
                </div>
                <div className={styles.previewStageTable}>
                  <div className={`${styles.previewStageRow} ${styles.previewStageHead}`}>
                    <span>주문 단계</span><span>결제 요청</span><span>적용 처리</span>
                  </div>
                  {PAYMENT_STAGES.map((stage) => {
                    const allowed = draftPolicy.paymentAllowedStages.includes(stage);
                    return (
                      <div className={styles.previewStageRow} key={stage}>
                        <strong>{stage}</strong>
                        <span><CommonBadge type={allowed ? 'success-light' : 'secondary'} size="sm">{allowed ? '가능' : '불가'}</CommonBadge></span>
                        <span>{allowed ? `${draftPolicy.reserveStockOnPayment ? '재고 선점 · ' : ''}${draftPolicy.sessionExpiryMinutes}분 내 완료` : '결제 요청 생성 불가'}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className={styles.policyPreviewSide}>
              <section className={styles.previewSideCard}>
                <div className={styles.previewCardHead}>
                  <div className={styles.previewDocumentTitle}>고객 안내 문구</div>
                  <div className={styles.previewDocumentDesc}>설정에 따라 자동 생성되는 안내입니다</div>
                </div>
                <div className={styles.customerMessageList}>
                  <div className={styles.customerMessage}><span>주문서 · 결제 단계</span><strong>결제창을 열고 {draftPolicy.sessionExpiryMinutes}분 내 결제를 완료해 주세요.</strong></div>
                  <div className={styles.customerMessage}><span>결제 만료 안내</span><strong>{draftPolicy.sessionExpiryMinutes}분이 지나면 결제 요청이 만료되며, {draftPolicy.expiryAction}합니다.</strong></div>
                  <div className={styles.customerMessage}><span>결제 실패 화면</span><strong>{draftPolicy.retryAllowed ? `${draftPolicy.retryLimitMinutes}분 내 다시 시도할 수 있습니다. 최대 ${draftPolicy.maxRetryCount}회까지 재시도됩니다.` : '결제를 다시 진행하려면 고객센터에 문의해 주세요.'}</strong></div>
                </div>
                <div className={`${styles.previewDeployBand} ${warnings.length > 0 ? styles.previewDeployWarning : ''}`}>
                  <span>배포 가능 여부</span><strong>{warnings.length > 0 ? '확인 필요' : '배포 가능'}</strong>
                </div>
              </section>

              <section className={styles.previewSideCard}>
                <div className={styles.previewCardHead}><div className={styles.previewDocumentTitle}>전체 설정 요약</div></div>
                <div className={styles.previewDigestRow}><span>결제 방식</span><strong>{draftPolicy.paymentTiming}</strong></div>
                <div className={styles.previewDigestRow}><span>주문별 결제</span><strong>{draftPolicy.paymentRequired ? '필수' : '선택'}</strong></div>
                <div className={styles.previewDigestRow}><span>기본 결제수단</span><strong>{defaultMethod?.name ?? '없음'}</strong></div>
                <div className={styles.previewDigestRow}><span>결제 기준금액</span><strong>{draftPolicy.paymentBasis}</strong></div>
                <div className={styles.previewDigestRow}><span>결제 가능 시점</span><strong>{draftPolicy.paymentAllowedStages.join(' · ') || '없음'}</strong></div>
                <div className={styles.previewDigestRow}><span>유효시간</span><strong>{draftPolicy.sessionExpiryMinutes}분 · {draftPolicy.expiryAction}</strong></div>
                <div className={styles.previewDigestRow}><span>실패 재시도</span><strong>{draftPolicy.retryAllowed ? `${draftPolicy.maxRetryCount}회 · ${draftPolicy.retryLimitMinutes}분 간격` : '사용 안 함'}</strong></div>
                <div className={styles.previewDigestRow}><span>최종 실패 시</span><strong>{draftPolicy.retryLimitAction}</strong></div>
                <div className={styles.previewDigestRow}><span>적용 시작</span><strong>{draftPolicy.effectiveFrom}</strong></div>
                <div className={styles.previewSideFoot}>저장 시 이 문서가 변경 이력에 스냅샷으로 함께 기록됩니다.</div>
              </section>
            </aside>
          </div>
        )}

      </div>

      {showHistory && (
        <aside ref={historyRef} className={timeline.aside} aria-label="결제 정책 변경 이력">
          <div className={timeline.head}>
            <div className={timeline.headRow}>
              <div className={timeline.headBody}>
                <div className={timeline.eyebrow}>거래 정책 · 결제 정책</div>
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
                  <div className={timeline.timelineRow}>
                    <strong className={timeline.timelineTitle}>{entry.field}</strong>
                    <span className={timeline.timelineWhen}>{entry.at}</span>
                  </div>
                  <div className={timeline.timelineDetail}>{entry.before} → {entry.after}</div>
                  <div className={timeline.timelineDetail}>{entry.reason} · {entry.by}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {methodEditId && (
        <PaymentMethodEditDialog
          initial={draftMethods.find((m) => m.id === methodEditId)!}
          onClose={() => setMethodEditId(null)}
          onSave={saveMethod}
        />
      )}

      {confirmSave && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmSave(null); }}>
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>결제 정책 변경 확인</h2>
            <p className={shared.dialogBody}>변경 사항은 신규 주문·결제부터 적용됩니다. 이미 발생한 결제 Transaction에는 영향을 주지 않습니다.</p>
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
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 결제 운영 정책 변경" />
            </label>
            {saveError && <div className={styles.formError}>{saveError}</div>}
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmSave(null)}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={commitSave}>변경 저장</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
