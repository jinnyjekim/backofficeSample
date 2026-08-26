import { useMemo, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './SettlementPolicyPage.module.css';
import {
  INITIAL_HISTORY,
  INITIAL_POLICY,
  TEST_TARGETS,
  computeSettlementBreakdown,
  computeWarnings,
  describePolicyChanges,
  fmtWon,
  signed,
  type ConfirmMode,
  type FieldDiff,
  type HolidayPolicy,
  type NegativeSettlementPolicy,
  type PayMethod,
  type PolicyHistoryEntry,
  type PostConfirmRefundPolicy,
  type PreCloseCancelPolicy,
  type SettlementAmountBasis,
  type SettlementCreationTiming,
  type SettlementCycle,
  type SettlementDateBasis,
  type SettlementPolicy,
  type SettlementTargetBasis,
  type ShortfallPolicy,
} from './settlementPolicyData';

type Tab = 'basic' | 'cycle' | 'amount' | 'confirm' | 'preview' | 'history';
const TABS: [Tab, string][] = [
  ['basic', '기본 정책'],
  ['cycle', '주기 · 마감'],
  ['amount', '정산 금액'],
  ['confirm', '확정 · 이월'],
  ['preview', '정책 Preview'],
  ['history', '변경 이력'],
];

export function SettlementPolicyPage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [previewTargetId, setPreviewTargetId] = useState(TEST_TARGETS[0].id);

  const warnings = useMemo(() => computeWarnings(editing ? draftPolicy : policy), [editing, draftPolicy, policy]);

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof SettlementPolicy>(key: K, value: SettlementPolicy[K]) => setDraftPolicy((current) => ({ ...current, [key]: value }));

  const startEdit = () => {
    setDraftPolicy(policy);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
  };
  const requestSave = () => {
    const diffs = describePolicyChanges(policy, draftPolicy);
    if (diffs.length === 0) return setEditing(false);
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
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('정산 정책을 저장했습니다.');
  };

  const previewTarget = TEST_TARGETS.find((t) => t.id === previewTargetId)!;
  const previewBreakdown = computeSettlementBreakdown(previewTarget, policy);

  const heroClass = previewBreakdown.status === '지급 대상'
    ? styles.resultHero
    : previewBreakdown.status.startsWith('마이너스')
      ? `${styles.resultHero} ${styles.resultHeroNeg}`
      : `${styles.resultHero} ${styles.resultHeroWarn}`;

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>정산 정책</h1>
            <p className={shared.subtitle}>어떤 거래를 언제 정산 대상으로 잡고, 어떤 기준으로 확정·지급할지 설정합니다.</p>
          </div>
          {!editing ? (
            <button type="button" className={shared.createBtn} onClick={startEdit}>정책 수정</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={styles.cancelButton} onClick={cancelEdit}>수정 취소</button>
              <button type="button" className={styles.primaryButton} onClick={requestSave}>변경 사항 저장</button>
            </div>
          )}
        </div>
        <div className={styles.viewTabs}>
          {TABS.map(([key, label]) => (
            <button key={key} type="button" className={`${styles.viewTabBtn} ${tab === key ? styles.viewTabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {warnings.length > 0 && (
          <div className={styles.warningBanner}>
            <strong>설정 확인 필요</strong>
            {warnings.map((w) => <span key={w.id}>⚠ {w.message}</span>)}
          </div>
        )}

        {tab === 'basic' && (
          <>
            <div className={styles.summaryCard}>
              <h2>현재 정책 요약</h2>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryRow}><span>정산 사용</span><strong>{policy.settlementEnabled ? '사용' : '사용 안 함'}</strong></div>
                <div className={styles.summaryRow}><span>정산 대상 기준</span><strong>{policy.targetBasis}</strong></div>
                <div className={styles.summaryRow}><span>정산 주기</span><strong>{policy.cycle}</strong></div>
                <div className={styles.summaryRow}><span>정산 마감</span><strong>{policy.closingDayOfMonth === 0 ? '매월 말일' : `매월 ${policy.closingDayOfMonth}일`}</strong></div>
                <div className={styles.summaryRow}><span>지급 예정</span><strong>{policy.payDayOfMonth === 0 ? '익월 말일' : `익월 ${policy.payDayOfMonth}일`}</strong></div>
                <div className={styles.summaryRow}><span>정산 확정</span><strong>{policy.confirmMode}</strong></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>정산 사용</h3>
              <label className={styles.toggleField}>
                <span>정산 기능 사용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.settlementEnabled ? styles.switchOn : ''}`} onClick={() => set('settlementEnabled', !draftPolicy.settlementEnabled)}><i /></button>
              </label>
              <label className={styles.toggleField}>
                <span>정산 자동 생성<small>마감된 정산 기간에 대해 시스템이 자동으로 정산건을 생성합니다</small></span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.autoCreateEnabled ? styles.switchOn : ''}`} onClick={() => set('autoCreateEnabled', !draftPolicy.autoCreateEnabled)}><i /></button>
              </label>
              <label className={styles.formField}>
                <span>정산 생성 시점</span>
                <div className={styles.radioGroup}>
                  {(['마감일 이후 자동 생성', '지급 예정일 기준 자동 생성', '관리자 직접 생성'] as SettlementCreationTiming[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing || !draftPolicy.autoCreateEnabled} checked={draftPolicy.creationTiming === v} onChange={() => set('creationTiming', v)} />{v}</label>
                  ))}
                </div>
              </label>
            </div>

            <div className={styles.formSection}>
              <h3>정산 대상 기준</h3>
              <label className={styles.formField}>
                <span>정산 대상 기준 *<small>이 시점을 지나야 정산 가능한 매출로 인정합니다</small></span>
                <div className={styles.radioGroup}>
                  {(['결제 완료', '주문 완료', '배송 완료', '거래 확정', '구매 확정'] as SettlementTargetBasis[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.targetBasis === v} onChange={() => set('targetBasis', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>정산 기준일<small>정산 대상 선정과 기간 계산에 사용하는 날짜입니다</small></span>
                <div className={styles.radioGroup}>
                  {(['정산 대상 확정일', '주문일', '결제일', '배송 완료일', '구매 확정일'] as SettlementDateBasis[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.dateBasis === v} onChange={() => set('dateBasis', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <div className={styles.infoNote}>정산 대상 여부와 정산 상태는 별개입니다. '배송 완료 = 정산 완료'가 아니라, 배송 완료 이후 정산 기간에 포함되어야 정산건이 생성됩니다.</div>
            </div>
          </>
        )}

        {tab === 'cycle' && (
          <>
            <div className={styles.formSection}>
              <h3>정산 주기</h3>
              <div className={styles.radioGroup}>
                {(['매일', '주 1회', '월 1회', '직접 설정'] as SettlementCycle[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.cycle === v} onChange={() => set('cycle', v)} />{v}</label>
                ))}
              </div>
              {draftPolicy.cycle === '월 1회' ? (
                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>정산 마감일<small>0 = 말일</small></span>
                    <input type="number" min={0} max={31} disabled={!editing} value={draftPolicy.closingDayOfMonth} onChange={(e) => set('closingDayOfMonth', Math.max(0, Math.min(31, Number(e.target.value) || 0)))} />
                  </label>
                  <label className={styles.formField}>
                    <span>지급 예정일 (익월)<small>0 = 말일</small></span>
                    <input type="number" min={0} max={31} disabled={!editing} value={draftPolicy.payDayOfMonth} onChange={(e) => set('payDayOfMonth', Math.max(0, Math.min(31, Number(e.target.value) || 0)))} />
                  </label>
                </div>
              ) : (
                <label className={styles.formField}>
                  <span>지급 예정일<small>마감 후 N영업일</small></span>
                  <input type="number" min={0} disabled={!editing} value={draftPolicy.payOffsetDays} onChange={(e) => set('payOffsetDays', Math.max(0, Number(e.target.value) || 0))} />
                </label>
              )}
              <label className={styles.formField}>
                <span>지급 예정일이 휴일인 경우</span>
                <div className={styles.radioGroup}>
                  {(['이전 영업일', '다음 영업일', '날짜 유지'] as HolidayPolicy[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.holidayPolicy === v} onChange={() => set('holidayPolicy', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <div className={styles.infoNote}>실제 공휴일 계산은 공통 Calendar를 참조합니다. 이 페이지의 Preview는 토요일·일요일 기준으로 간단히 계산합니다.</div>
            </div>

            <div className={styles.formSection}>
              <h3>지급 방법</h3>
              <div className={styles.radioGroup}>
                {(['계좌이체', '외부 지급시스템', '수동 지급'] as PayMethod[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.payMethod === v} onChange={() => set('payMethod', v)} />{v}</label>
                ))}
              </div>
              <div className={styles.infoNote}>지급 대상별 계좌 정보는 거래처/정산 대상 마스터에서 관리합니다.</div>
            </div>
          </>
        )}

        {tab === 'amount' && (
          <>
            <div className={styles.formSection}>
              <h3>정산금액 구성</h3>
              <label className={styles.toggleField}><span>배송비 포함</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.includeShippingFee ? styles.switchOn : ''}`} onClick={() => set('includeShippingFee', !draftPolicy.includeShippingFee)}><i /></button></label>
              <label className={styles.toggleField}><span>기타 서비스금액 포함</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.includeOtherServiceAmount ? styles.switchOn : ''}`} onClick={() => set('includeOtherServiceAmount', !draftPolicy.includeOtherServiceAmount)}><i /></button></label>
              <label className={styles.toggleField}><span>취소 차감</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.deductCancel ? styles.switchOn : ''}`} onClick={() => set('deductCancel', !draftPolicy.deductCancel)}><i /></button></label>
              <label className={styles.toggleField}><span>환불 차감</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.deductRefund ? styles.switchOn : ''}`} onClick={() => set('deductRefund', !draftPolicy.deductRefund)}><i /></button></label>
              <label className={styles.toggleField}><span>수수료 차감</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.deductFee ? styles.switchOn : ''}`} onClick={() => set('deductFee', !draftPolicy.deductFee)}><i /></button></label>
              <label className={styles.toggleField}><span>할인 분담액 차감</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.deductDiscountShare ? styles.switchOn : ''}`} onClick={() => set('deductDiscountShare', !draftPolicy.deductDiscountShare)}><i /></button></label>
              <label className={styles.toggleField}><span>조정금액 반영</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.includeAdjustment ? styles.switchOn : ''}`} onClick={() => set('includeAdjustment', !draftPolicy.includeAdjustment)}><i /></button></label>
              <label className={styles.toggleField}><span>이전 정산 이월금 반영</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.includeCarryOver ? styles.switchOn : ''}`} onClick={() => set('includeCarryOver', !draftPolicy.includeCarryOver)}><i /></button></label>
              <label className={styles.formField}>
                <span>정산 기준금액</span>
                <div className={styles.radioGroup}>
                  {(['공급가액', '공급가액 + 세액'] as SettlementAmountBasis[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.amountBasis === v} onChange={() => set('amountBasis', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <div className={styles.infoNote}>수수료율·세율 등 각 금액의 계산식은 수수료 정책·세금 정책을 참조합니다. 이 화면에서는 어떤 항목을 정산에 포함할지만 결정합니다.</div>
            </div>

            <div className={styles.formSection}>
              <h3>정산금액 계산식</h3>
              <div className={styles.formulaNote}>
                <span>거래금액</span><em>−</em><span>취소·환불</span><em>−</em><span>수수료</span><em>±</em><span>조정·이월</span><em>=</em><span>최종 정산금액</span>
              </div>
              <div className={styles.infoNote}>계산 결과와 적용 당시 정책은 정산 생성 시 Snapshot으로 함께 보존됩니다. 이후 정책이 변경되어도 이미 생성된 정산금액은 다시 계산되지 않습니다.</div>
            </div>

            <div className={styles.formSection}>
              <h3>취소 · 환불 반영 시점</h3>
              <label className={styles.formField}>
                <span>정산 마감 전 취소</span>
                <div className={styles.radioGroup}>
                  {(['해당 정산에서 제외', '다음 정산에서 차감'] as PreCloseCancelPolicy[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.preCloseCancelPolicy === v} onChange={() => set('preCloseCancelPolicy', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>정산 확정 후 발생한 환불</span>
                <div className={styles.radioGroup}>
                  {(['다음 정산에서 자동 차감', '별도 조정 승인 후 반영'] as PostConfirmRefundPolicy[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.postConfirmRefundPolicy === v} onChange={() => set('postConfirmRefundPolicy', v)} />{v}</label>
                  ))}
                </div>
              </label>
            </div>
          </>
        )}

        {tab === 'confirm' && (
          <>
            <div className={styles.formSection}>
              <h3>정산 확정</h3>
              <div className={styles.radioGroup}>
                {(['관리자 수동 확정', '조건 충족 시 자동 확정'] as ConfirmMode[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.confirmMode === v} onChange={() => set('confirmMode', v)} />{v}</label>
                ))}
              </div>
              <label className={styles.toggleField}><span>확정 조건 · 미확정 거래 없음</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.requireNoUnsettledTx ? styles.switchOn : ''}`} onClick={() => set('requireNoUnsettledTx', !draftPolicy.requireNoUnsettledTx)}><i /></button></label>
              <label className={styles.toggleField}><span>확정 조건 · 미처리 환불 없음</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.requireNoUnprocessedRefund ? styles.switchOn : ''}`} onClick={() => set('requireNoUnprocessedRefund', !draftPolicy.requireNoUnprocessedRefund)}><i /></button></label>
              <label className={styles.toggleField}><span>확정 조건 · 미승인 조정 없음</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.requireNoUnapprovedAdjustment ? styles.switchOn : ''}`} onClick={() => set('requireNoUnapprovedAdjustment', !draftPolicy.requireNoUnapprovedAdjustment)}><i /></button></label>
              <label className={styles.toggleField}><span>확정 조건 · 지급정보 존재</span><button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.requirePayoutInfo ? styles.switchOn : ''}`} onClick={() => set('requirePayoutInfo', !draftPolicy.requirePayoutInfo)}><i /></button></label>
              <div className={styles.infoNote}>정산 확정 이후에는 금액이 재계산되지 않습니다. 확정 후 발생하는 취소·환불·조정은 다음 정산에 반영됩니다.</div>
            </div>

            <div className={styles.formSection}>
              <h3>최소 지급금액 · 이월</h3>
              <label className={styles.formField}>
                <span>최소 지급금액</span>
                <input type="number" min={0} disabled={!editing} value={draftPolicy.minPayoutAmount} onChange={(e) => set('minPayoutAmount', Math.max(0, Number(e.target.value) || 0))} />
              </label>
              <div className={styles.radioGroup}>
                {(['다음 정산으로 이월', '그대로 지급', '관리자 확인'] as ShortfallPolicy[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.shortfallPolicy === v} onChange={() => set('shortfallPolicy', v)} />{v}</label>
                ))}
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>마이너스 정산</h3>
              <div className={styles.radioGroup}>
                {(['다음 정산으로 이월', '지급 보류', '관리자 확인'] as NegativeSettlementPolicy[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.negativeSettlementPolicy === v} onChange={() => set('negativeSettlementPolicy', v)} />{v}</label>
                ))}
              </div>
              <div className={styles.infoNote}>환불이 매출보다 커서 정산금액이 음수가 되는 경우의 처리 방식입니다. 이월된 금액은 다음 정산 Breakdown에 별도 항목으로 표시됩니다.</div>
            </div>

            <div className={styles.formSection}>
              <h3>지급 실패 처리</h3>
              <label className={styles.toggleField}>
                <span>지급 실패 재시도 허용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.failureRetryEnabled ? styles.switchOn : ''}`} onClick={() => set('failureRetryEnabled', !draftPolicy.failureRetryEnabled)}><i /></button>
              </label>
              <label className={styles.toggleField}>
                <span>자동 재시도<small>실패 시 시스템이 자동으로 재요청합니다</small></span>
                <button type="button" disabled={!editing || !draftPolicy.failureRetryEnabled} className={`${styles.switch} ${draftPolicy.autoRetryEnabled ? styles.switchOn : ''}`} onClick={() => set('autoRetryEnabled', !draftPolicy.autoRetryEnabled)}><i /></button>
              </label>
              {draftPolicy.autoRetryEnabled && (
                <label className={styles.formField}>
                  <span>최대 자동 재시도</span>
                  <input type="number" min={1} disabled={!editing} value={draftPolicy.maxRetryCount} onChange={(e) => set('maxRetryCount', Math.max(1, Number(e.target.value) || 1))} />
                </label>
              )}
              <div className={styles.infoNote}>정산 확정 상태와 지급 상태는 분리되어 관리됩니다. 지급이 실패해도 확정된 정산금액은 유지되며, 중복 지급 방지는 시스템 기본 안전장치로 항상 적용됩니다.</div>
            </div>
          </>
        )}

        {tab === 'preview' && (
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>테스트 정산 대상 선택</h3>
              <div className={styles.orderPick}>
                {TEST_TARGETS.map((t) => (
                  <button key={t.id} type="button" className={`${styles.orderOption} ${previewTargetId === t.id ? styles.orderOptionActive : ''}`} onClick={() => setPreviewTargetId(t.id)}>
                    <span><strong>{t.name}</strong> · {t.period}</span>
                    <span>{t.txCount}건</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 계산합니다.</div>
            </div>
            <div className={styles.previewCard}>
              <h3>정산 예상 결과</h3>
              <div className={heroClass}>
                <span>{previewTarget.id} · {previewTarget.name} · {previewTarget.period}</span>
                <strong>{previewBreakdown.status}</strong>
              </div>
              <div className={styles.breakdownTable}>
                {previewBreakdown.items.map((item, i) => (
                  <div key={i} className={styles.breakdownRow}>
                    <span>{item.label}</span>
                    <span className={item.amount < 0 ? styles.breakdownNeg : styles.breakdownPos}>{signed(item.amount)}</span>
                  </div>
                ))}
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                  <span>지급 예정 금액</span>
                  <span>{fmtWon(previewBreakdown.payoutAmount)}</span>
                </div>
              </div>
              {previewBreakdown.carryOverToNext !== 0 && (
                <div className={styles.noteList}>
                  <div>⚠ {signed(previewBreakdown.carryOverToNext)}이(가) 다음 정산으로 이월됩니다.</div>
                </div>
              )}
              <div className={styles.resultRow}><span>지급 예정일</span><strong>{previewBreakdown.payDate}{previewBreakdown.payDateShifted ? ' (휴일 조정됨)' : ''}</strong></div>
              <div className={styles.resultRow}><span>대상 거래</span><strong>{previewTarget.txCount}건</strong></div>
              {previewTarget.excluded.length > 0 && (
                <div className={styles.excludedList}>
                  <h4>정산 제외 ({previewTarget.excluded.reduce((s, e) => s + e.count, 0)}건)</h4>
                  {previewTarget.excluded.map((e) => (
                    <div key={e.label} className={styles.excludedRow}><span>{e.label}</span><span>{e.count}건</span></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <>
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
          </>
        )}
      </div>

      {confirmSave && (
        <div className={shared.dialogOverlay}>
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>정산 정책 변경 확인</h2>
            <p className={shared.dialogBody}>변경 사항은 다음 정산 기간부터 적용됩니다. 이미 생성·확정된 정산은 생성 당시 정책 Snapshot 기준으로 유지됩니다.</p>
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
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 정산 검토 기간 확보를 위한 지급일 조정" />
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
