import { useMemo, useRef, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  CommonButton,
  CommonButtonGroup,
  CommonBadge,
  CommonCheckbox,
  CommonDatePicker,
  CommonInput,
  CommonSelect,
  CommonToast,
} from '../../components/common';
import styles from './PointPolicyPage.module.css';
import {
  INITIAL_POLICY,
  POLICY_HISTORY,
  TODAY,
  describeChanges,
  type EarnBasis,
  type EarnConfirmTiming,
  type EarnMode,
  type ExpiredRestorePolicy,
  type PointPolicy,
  type PolicyHistoryEntry,
  type RoundingMode,
  type RoundingUnit,
} from './pointPolicyData';

type SectionProps = {
  number: number;
  title: string;
  description: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
};

function PolicySection({ number, title, description, aside, children }: SectionProps) {
  return (
    <section className={styles.policySection}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitleRow}>
          <h2><span className={styles.sectionNumber}>{number}</span>{title}</h2>
          {aside && <div className={styles.sectionAside}>{aside}</div>}
        </div>
        <p>{description}</p>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {helper && <span className={styles.helper}>{helper}</span>}
    </label>
  );
}

function NumberControl({
  value,
  suffix,
  disabled,
  zeroPlaceholder,
  min = 0,
  max,
  onChange,
}: {
  value: number;
  suffix: string;
  disabled: boolean;
  zeroPlaceholder?: string;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <CommonInput.Number
      clearable={false}
      size="md"
      value={zeroPlaceholder ? (value === 0 ? '' : value) : value}
      min={min}
      max={max}
      suffix={suffix}
      placeholder={zeroPlaceholder}
      className={disabled ? styles.lockedNumber : undefined}
      aria-readonly={disabled}
      tabIndex={disabled ? -1 : undefined}
      onChange={(event) => { if (!disabled) onChange(Math.max(min, Number(event.target.value) || 0)); }}
    />
  );
}

function SegmentGroup<T extends string | number>({
  value,
  options,
  disabled,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <CommonButtonGroup attached size="md" className={styles.segments}>
      {options.map((option) => (
        <CommonButton
          key={String(option.value)}
          type="button"
          disabled={disabled}
          variant={value === option.value ? 'emphasis' : 'secondary'}
          size="md"
          className={styles.segment}
          selected={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </CommonButton>
      ))}
    </CommonButtonGroup>
  );
}

function roundEarned(value: number, policy: PointPolicy) {
  const divided = value / policy.roundingUnit;
  const rounded = policy.roundingMode === '올림' ? Math.ceil(divided) : policy.roundingMode === '반올림' ? Math.round(divided) : Math.floor(divided);
  return rounded * policy.roundingUnit;
}

export function PointPolicyPage() {
  const [policy, setPolicy] = useState<PointPolicy>(INITIAL_POLICY);
  const [history, setHistory] = useState<PolicyHistoryEntry[]>(POLICY_HISTORY);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PointPolicy>(INITIAL_POLICY);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmChanges, setConfirmChanges] = useState<ReturnType<typeof describeChanges> | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState('');
  const [previewAmount, setPreviewAmount] = useState(50000);
  const [previewPoints, setPreviewPoints] = useState(3200);

  const historyRef = useRef<HTMLElement>(null);
  useOutsideClose(historyRef, () => setShowHistory(false));

  const set = <K extends keyof PointPolicy>(key: K, value: PointPolicy[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setEarnMode = (earnMode: EarnMode) => setDraft((current) => ({
    ...current,
    earnMode,
    purchaseEarnEnabled: earnMode === '정률 적립',
  }));

  function startEdit() {
    setDraft(policy);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(policy);
    setEditing(false);
  }

  function requestSave() {
    const changes = describeChanges(policy, draft);
    if (changes.length === 0) {
      setEditing(false);
      return;
    }
    setConfirmChanges(changes);
  }

  function confirmSave() {
    if (!confirmChanges) return;
    const updated: PointPolicy = { ...draft, updatedAt: TODAY, updatedBy: 'admin01' };
    setPolicy(updated);
    setHistory((current) => [
      { id: `PH-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', reason: reason.trim() || '-', changes: confirmChanges },
      ...current,
    ]);
    setEditing(false);
    setConfirmChanges(null);
    setReason('');
    setToast('포인트 정책을 저장했습니다.');
    window.setTimeout(() => setToast(''), 2400);
  }

  const p = editing ? draft : policy;
  const disabled = !editing;
  const preview = useMemo(() => {
    const basis = previewAmount;
    const earned = p.earnMode === '정률 적립' ? roundEarned((basis * p.earnRate) / 100, p) : 0;
    const ratioLimit = Math.floor((previewAmount * p.maxUseRatioPercent) / 100);
    const policyLimit = p.maxUseAmount > 0 ? Math.min(p.maxUseAmount, ratioLimit || p.maxUseAmount) : ratioLimit;
    const maxUsable = !p.useEnabled ? 0 : Math.min(previewPoints, policyLimit);
    return { basis, earned, maxUsable };
  }, [p, previewAmount, previewPoints]);
  const priorityLabel = p.usagePriority === '소멸 예정일이 빠른 포인트부터' ? '소멸 예정일 순' : '지급일 순';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>거래 정책</div>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>포인트 정책</h1>
            <p className={styles.subtitle}>포인트 적립, 사용, 소멸 및 거래 취소 시 처리 기준을 설정합니다.</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.updated}>최종 수정 {policy.updatedAt} · {policy.updatedBy}</span>
            <CommonButton type="button" variant="secondary" size="md" className={styles.secondaryButton} onClick={() => setShowHistory(true)}>변경 이력</CommonButton>
            {editing ? (
              <>
                <CommonButton type="button" variant="secondary" size="md" className={styles.secondaryButton} onClick={cancelEdit}>취소</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" className={styles.primaryButton} onClick={requestSave}>저장</CommonButton>
              </>
            ) : <CommonButton type="button" variant="emphasis" size="md" className={styles.primaryButton} onClick={startEdit}>수정</CommonButton>}
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <main className={styles.policyCard}>
          <PolicySection number={1} title="적립 방식" description="어떤 주문에 포인트를 지급할지 먼저 정합니다. 아래 설정은 이 선택에 따라 달라집니다.">
            <div className={styles.earnModeOptions}>
              {([
                ['정률 적립', '주문금액에 적립률을 곱해 적립'],
                ['프로모션만 적립', '기본 적립 없이 프로모션 건만'],
                ['미사용', '포인트를 적립하지 않음'],
              ] as const).map(([value, description]) => (
                <CommonButton
                  key={value}
                  type="button"
                  variant="option"
                  size="md"
                  selected={p.earnMode === value}
                  description={description}
                  disabled={disabled}
                  onClick={() => setEarnMode(value)}
                >
                  {value}
                </CommonButton>
              ))}
            </div>
          </PolicySection>

          <PolicySection number={2} title="적립 금액" description="적립률과 기준금액, 확정 시점을 함께 정의합니다. 단수 처리는 아래 계산 정책을 따릅니다." aside={p.earnMode === '정률 적립' ? <CommonBadge type="success-light" size="sm">적용 중</CommonBadge> : undefined}>
            <div className={p.earnMode === '정률 적립' ? '' : styles.disabledGroup}>
              <div className={styles.earnFieldGrid}>
                <Field label="기본 적립률">
                  <div className={styles.rateControls}>
                    <NumberControl value={p.earnRate} suffix="%" max={100} disabled={disabled || p.earnMode !== '정률 적립'} onChange={(value) => set('earnRate', value)} />
                    <CommonButtonGroup attached size="md" className={styles.ratePresets}>
                      {[0.5, 1, 2].map((rate) => <CommonButton key={rate} variant={p.earnRate === rate ? 'emphasis' : 'secondary'} size="md" disabled={disabled || p.earnMode !== '정률 적립'} selected={p.earnRate === rate} onClick={() => set('earnRate', rate)}>{rate}%</CommonButton>)}
                    </CommonButtonGroup>
                  </div>
                </Field>
                <Field label="적립 기준금액"><CommonSelect size="md" disabled={disabled || !p.purchaseEarnEnabled} value={p.earnBasis} options={[{ value: '할인 전 상품금액', label: '할인 전 상품금액' }, { value: '할인 적용 후 상품금액', label: '할인 적용 후 상품금액' }, { value: '실제 결제금액', label: '실제 결제금액' }]} onChange={(value) => set('earnBasis', String(value) as EarnBasis)} /></Field>
                <Field label="적립 확정 시점"><CommonSelect size="md" disabled={disabled} value={p.earnConfirmTiming} options={[{ value: '결제 완료', label: '결제 완료' }, { value: '배송 완료', label: '배송 완료' }, { value: '구매 확정', label: '구매 확정' }, { value: '배송 완료 후 N일', label: '배송 완료 후 N일' }]} onChange={(value) => set('earnConfirmTiming', String(value) as EarnConfirmTiming)} /></Field>
              </div>
              <div className={styles.earnSecondaryRow}>
                <Field label="확정 후 사용 가능"><SegmentGroup value={p.immediateAfterConfirm ? '즉시' : 'N일 후'} disabled={disabled} options={[{ value: '즉시', label: '즉시' }, { value: 'N일 후', label: 'N일 후' }]} onChange={(value) => set('immediateAfterConfirm', value === '즉시')} /></Field>
                <div className={styles.earnBasisOptions}>
                  <span className={styles.fieldLabel}>기준금액 산정</span>
                  <div className={styles.checkRow}>
                    <CommonCheckbox size="sm" disabled={disabled || !p.purchaseEarnEnabled} checked={p.excludePointUsedFromEarnBasis} onChange={(checked) => set('excludePointUsedFromEarnBasis', checked)} label="포인트 사용금액 제외" />
                    <CommonCheckbox size="sm" disabled={disabled || !p.purchaseEarnEnabled} checked={p.includeShippingInEarnBasis} onChange={(checked) => set('includeShippingInEarnBasis', checked)} label="배송비 포함" />
                  </div>
                </div>
              </div>
            </div>
          </PolicySection>

          <PolicySection number={3} title="사용 한도" description="한 주문에서 포인트를 쓸 수 있는 하한과 상한입니다. 비율과 금액 중 낮은 값이 적용됩니다.">
            <div className={`${styles.fieldGrid} ${p.useEnabled ? '' : styles.disabledGroup}`}>
              <Field label="최소 사용 포인트" helper="이 미만은 사용 불가"><NumberControl value={p.minUsePoint} suffix="P" disabled={disabled || !p.useEnabled} onChange={(value) => set('minUsePoint', value)} /></Field>
              <Field label="사용 단위" helper="이 단위로만 입력"><NumberControl value={p.useUnit} suffix="P" min={1} disabled={disabled || !p.useEnabled} onChange={(value) => set('useUnit', Math.max(1, value))} /></Field>
              <Field label="주문당 최대 사용금액" helper="비워두면 제한 없음"><NumberControl value={p.maxUseAmount} suffix="P" zeroPlaceholder="제한 없음" disabled={disabled || !p.useEnabled} onChange={(value) => set('maxUseAmount', value)} /></Field>
              <Field label="주문금액 대비 최대 비율" helper="낮은 값 적용"><NumberControl value={p.maxUseRatioPercent} suffix="%" max={100} disabled={disabled || !p.useEnabled} onChange={(value) => set('maxUseRatioPercent', value)} /></Field>
            </div>
          </PolicySection>

          <PolicySection number={4} title="소멸 · 차감 순서" description="유효기간과, 여러 건을 보유했을 때 어느 포인트부터 차감할지 정합니다.">
            <div className={styles.fieldGridThree}>
              <Field label="포인트 유효기간" helper={p.validityType === '소멸 없음' ? '소멸 기한 없음' : `지급일 기준 ${p.validityDays}일 후 소멸`}>
                <div className={styles.expirationControls}>
                  <SegmentGroup value={p.validityType} disabled={disabled} options={[{ value: '지급일로부터 N일', label: 'N일 후 소멸' }, { value: '소멸 없음', label: '소멸 없음' }]} onChange={(value) => set('validityType', value)} />
                  <NumberControl value={p.validityDays} suffix="일" min={1} disabled={disabled || p.validityType === '소멸 없음'} onChange={(value) => set('validityDays', Math.max(1, value))} />
                </div>
              </Field>
              <div className={styles.priorityField}>
                <div className={styles.fieldLabel}>사용 우선순위</div>
                <div className={styles.priorityCards}>
                  <CommonButton type="button" variant="option" size="sm" disabled={disabled} selected={p.usagePriority === '소멸 예정일이 빠른 포인트부터'} description="회원 손실 최소화" onClick={() => set('usagePriority', '소멸 예정일이 빠른 포인트부터')}>소멸 예정일 순</CommonButton>
                  <CommonButton type="button" variant="option" size="sm" disabled={disabled} selected={p.usagePriority === '지급일이 빠른 포인트부터'} description="선입선출" onClick={() => set('usagePriority', '지급일이 빠른 포인트부터')}>지급일 순</CommonButton>
                </div>
              </div>
            </div>
          </PolicySection>

          <PolicySection number={5} title="취소 · 반품 처리" description="거래가 되돌아갈 때 사용분을 돌려주고 적립분을 회수할지 조합으로 정합니다. 사용한 포인트만큼의 금액은 현금으로 추가 환불되지 않습니다.">
            <div className={styles.policyTable}>
              <div className={styles.policyTableHead}><span>거래 유형</span><span>사용분 복원</span><span>적립분 회수</span></div>
              <div className={styles.policyTableRow}><span>전체 취소</span><span className={styles.tableCheck}><CommonCheckbox aria-label="전체 취소 사용분 복원" size="sm" disabled={disabled} checked={p.fullCancelRestoreUsed} onChange={(checked) => set('fullCancelRestoreUsed', checked)} /></span><span className={styles.tableCheck}><CommonCheckbox aria-label="전체 취소 적립분 회수" size="sm" disabled={disabled} checked={p.fullCancelRevokeEarned} onChange={(checked) => set('fullCancelRevokeEarned', checked)} /></span></div>
              <div className={styles.policyTableRow}><span>전체 반품</span><span className={styles.tableCheck}><CommonCheckbox aria-label="전체 반품 사용분 복원" size="sm" disabled={disabled} checked={p.fullReturnRestoreUsed} onChange={(checked) => set('fullReturnRestoreUsed', checked)} /></span><span className={styles.tableCheck}><CommonCheckbox aria-label="전체 반품 적립분 회수" size="sm" disabled={disabled} checked={p.fullReturnRevokeEarned} onChange={(checked) => set('fullReturnRevokeEarned', checked)} /></span></div>
              <div className={styles.policyTableRow}><span>부분 취소 / 반품</span><span className={styles.tableCheck}><CommonCheckbox aria-label="부분 취소 반품 사용분 복원" size="sm" disabled={disabled} checked={p.partialCancelRecalculate} onChange={(checked) => set('partialCancelRecalculate', checked)} /></span><span className={styles.tableCheck}><CommonCheckbox aria-label="부분 취소 반품 적립분 회수" size="sm" disabled={disabled} checked={p.partialCancelRecalculate} onChange={(checked) => set('partialCancelRecalculate', checked)} /></span></div>
            </div>
            <div className={styles.restoreField}>
              <div className={styles.fieldLabel}>복원 시 원 유효기간이 이미 지난 포인트</div>
              <SegmentGroup value={p.expiredRestorePolicy} disabled={disabled} options={([{ value: '복원하지 않음', label: '복원하지 않음' }, { value: '원 만료일로 복원', label: '원 만료일로 복원' }] as { value: ExpiredRestorePolicy; label: string }[])} onChange={(value) => set('expiredRestorePolicy', value)} />
            </div>
          </PolicySection>

          <PolicySection number={6} title="계산 · 적용" description="적립 금액의 단수 처리와 이 정책이 발효되는 날짜입니다. 마이너스 포인트는 허용하지 않습니다.">
            <div className={styles.calculationGrid}>
              <Field label="소수점 처리"><SegmentGroup value={p.roundingMode} disabled={disabled} options={([{ value: '버림', label: '버림' }, { value: '올림', label: '올림' }, { value: '반올림', label: '반올림' }] as { value: RoundingMode; label: string }[])} onChange={(value) => set('roundingMode', value)} /></Field>
              <Field label="절사 단위"><SegmentGroup value={p.roundingUnit} disabled={disabled} options={([{ value: 1, label: '1P' }, { value: 10, label: '10P' }, { value: 100, label: '100P' }] as { value: RoundingUnit; label: string }[])} onChange={(value) => set('roundingUnit', value)} /></Field>
              <div className={styles.effectiveField}>
                <span className={styles.fieldLabel}>적용 시작일</span>
                <div className={styles.effectiveControlRow}>
                  <CommonDatePicker size="md" clearable={false} disabled={disabled} value={p.effectiveStartDate} aria-label="포인트 정책 적용 시작일" onChange={(value) => { if (!Array.isArray(value) && value) set('effectiveStartDate', value); }} />
                  <span className={styles.helper}>이 날짜 이후 생성 거래부터</span>
                </div>
              </div>
            </div>
          </PolicySection>
        </main>

        <aside className={styles.sideColumn}>
          <section className={styles.sideCard}>
            <div className={styles.sideCardHead}><h2>계산 미리보기</h2><p>현재 설정값으로 즉시 계산됩니다.</p></div>
            <div className={styles.sideCardBody}>
              <div className={styles.previewInputs}>
                <label className={styles.previewInputRow}><span>주문금액</span><CommonInput.Number size="sm" clearable={false} min={0} suffix="원" value={previewAmount} onChange={(event) => setPreviewAmount(Math.max(0, Number(event.target.value) || 0))} /></label>
                <label className={styles.previewInputRow}><span>보유 포인트</span><CommonInput.Number size="sm" clearable={false} min={0} suffix="P" value={previewPoints} onChange={(event) => setPreviewPoints(Math.max(0, Number(event.target.value) || 0))} /></label>
              </div>
              <div className={styles.previewRows}>
                <div className={styles.previewRow}><span>할인 적용 후 상품금액</span><strong>{preview.basis.toLocaleString('ko-KR')}원</strong></div>
                <div className={styles.previewRow}><span>적립률 {p.earnRate}% 계산</span><strong>{preview.earned.toLocaleString('ko-KR')}P</strong></div>
                <div className={styles.previewRow}><span>단수 처리 ({p.roundingMode} · {p.roundingUnit}P)</span><strong>{preview.earned.toLocaleString('ko-KR')}P</strong></div>
                <div className={styles.previewRow}><span>포인트 사용금액은 기준에서 제외</span><strong>{p.excludePointUsedFromEarnBasis ? '적용' : '미적용'}</strong></div>
              </div>
            </div>
            <div className={styles.previewTotal}><span>적립 예정</span><strong>{preview.earned.toLocaleString('ko-KR')}P</strong></div>
            <div className={styles.usableBlock}>
              <strong>이 주문에서 사용 가능</strong>
              <div><span>보유 {previewPoints.toLocaleString('ko-KR')}P</span><b>{previewPoints.toLocaleString('ko-KR')}P</b></div>
              <div><span>주문금액의 {p.maxUseRatioPercent}% 상한</span><b>{Math.floor(previewAmount * p.maxUseRatioPercent / 100).toLocaleString('ko-KR')}P</b></div>
              <div><span>최종 사용 가능 (단위 · 최소 반영)</span><b className={styles.accentValue}>{preview.maxUsable.toLocaleString('ko-KR')}P</b></div>
            </div>
          </section>

          <section className={styles.sideCard}>
            <div className={styles.sideCardHead}><h2>현재 정책 요약</h2></div>
            <div className={`${styles.sideCardBody} ${styles.summaryBody}`}><div className={styles.summaryRows}>
              <div className={styles.summaryRow}><span>적립 방식</span><strong>{p.earnMode}</strong></div>
              <div className={styles.summaryRow}><span>기본 적립률</span><strong>{p.earnRate}% · {p.earnBasis.replace('상품금액', '')}</strong></div>
              <div className={styles.summaryRow}><span>확정 시점</span><strong>{p.earnConfirmTiming} · {p.immediateAfterConfirm ? '즉시' : `${p.availableAfterConfirmDays}일 후`}</strong></div>
              <div className={styles.summaryRow}><span>사용 한도</span><strong>최소 {p.minUsePoint.toLocaleString('ko-KR')}P · 주문금액의 {p.maxUseRatioPercent}%</strong></div>
              <div className={styles.summaryRow}><span>유효기간</span><strong>{p.validityType === '소멸 없음' ? '소멸 없음' : `${p.validityDays}일`}</strong></div>
              <div className={styles.summaryRow}><span>차감 순서</span><strong>{priorityLabel}</strong></div>
              <div className={styles.summaryRow}><span>단수 처리</span><strong>{p.roundingMode} · {p.roundingUnit}P</strong></div>
              <div className={styles.summaryRow}><span>적용 시작</span><strong>{p.effectiveStartDate}</strong></div>
            </div></div>
            <div className={styles.summaryNote}>등급별 추가 적립률과 프로모션 적립은 각각 회원 등급 정책, 프로모션 상세에서 관리합니다.</div>
          </section>
        </aside>
      </div>

      {showHistory && (
        <aside ref={historyRef} className={drawer.aside} aria-label="포인트 정책 변경 이력">
          <div className={drawer.head}><div className={drawer.headRow}><div className={drawer.headBody}><div className={drawer.eyebrow}>포인트 / 적립금 관리 · 포인트 정책</div><div className={drawer.titleRow}><span className={drawer.title}>변경 이력</span></div></div><CommonButton type="button" variant="ghost" size="sm" className={drawer.closeBtn} onClick={() => setShowHistory(false)}>×</CommonButton></div></div>
          <div className={drawer.scroll}>{history.map((entry) => <div key={entry.id} className={drawer.timelineItem}><div className={drawer.timelineDot} /><div className={drawer.timelineBody}><div className={drawer.timelineRow}><span className={drawer.timelineTitle}>{entry.by}</span><span className={drawer.timelineWhen}>{entry.at}</span></div>{entry.changes.length ? entry.changes.map((change) => <div key={change.field} className={drawer.timelineDetail}>{change.field} · {change.before} → {change.after}</div>) : <div className={drawer.timelineDetail}>{entry.reason}</div>}</div></div>)}</div>
        </aside>
      )}

      {confirmChanges && (
        <div className={shared.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmChanges(null); }}>
          <div className={shared.dialogBox}>
            <div className={shared.dialogTitle}>포인트 정책을 변경하시겠습니까?</div>
            <div className={shared.dialogSummary}>{confirmChanges.map((change) => <div key={change.field} className={shared.dialogSummaryRow}><span>{change.field}</span><span>{change.before} → {change.after}</span></div>)}</div>
            <div className={shared.dialogBody} style={{ marginBottom: 10 }}>변경 사항은 이후 생성되는 적립/사용 거래부터 적용됩니다. 기존 주문 및 포인트 내역은 변경되지 않습니다.</div>
            <CommonInput.Text clearable={false} className={shared.searchInput} style={{ width: '100%', maxWidth: 'none', marginBottom: 16 }} placeholder="변경 사유" value={reason} onChange={(event) => setReason(event.target.value)} />
            <div className={shared.dialogActions}><CommonButton type="button" variant="secondary" size="md" className={shared.dialogBtn} onClick={() => setConfirmChanges(null)}>취소</CommonButton><CommonButton type="button" variant="emphasis" size="md" className={shared.dialogBtn} onClick={confirmSave}>변경 적용</CommonButton></div>
          </div>
        </div>
      )}

      {toast && <CommonToast className={styles.toast} type="success" variant="filled" message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
