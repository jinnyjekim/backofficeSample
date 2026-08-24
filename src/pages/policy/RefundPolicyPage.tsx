import { useMemo, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './RefundPolicyPage.module.css';
import { RefundReasonEditDialog } from './RefundReasonEditDialog';
import {
  INITIAL_HISTORY,
  INITIAL_METHOD_RULES,
  INITIAL_POLICY,
  INITIAL_REASONS,
  PG_OPTIONS,
  TEST_ORDERS,
  computeRefundBreakdown,
  computeWarnings,
  describeMethodChanges,
  describePolicyChanges,
  describeReasonChanges,
  fmtWon,
  type ApprovalRequirement,
  type DiscountRecalcPolicy,
  type FieldDiff,
  type PolicyHistoryEntry,
  type RefundCalcMode,
  type RefundCompletionBasis,
  type RefundMethodBasis,
  type RefundPeriodBasis,
  type RefundPolicy,
  type RefundReason,
  type RefundScope,
  type ShippingFullPolicy,
  type ShippingPartialPolicy,
} from './refundPolicyData';

type Tab = 'basic' | 'amount' | 'methods' | 'reasons' | 'preview' | 'history';
const TABS: [Tab, string][] = [
  ['basic', '기본 정책'],
  ['amount', '환불 금액'],
  ['methods', '결제수단'],
  ['reasons', '환불 사유'],
  ['preview', '정책 Preview'],
  ['history', '변경 이력'],
];

function signed(n: number): string {
  if (n === 0) return '0원';
  return (n > 0 ? '+' : '-') + fmtWon(Math.abs(n));
}

export function RefundPolicyPage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [methodRules, setMethodRules] = useState(INITIAL_METHOD_RULES);
  const [reasons, setReasons] = useState(INITIAL_REASONS);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [draftMethodRules, setDraftMethodRules] = useState(methodRules);
  const [draftReasons, setDraftReasons] = useState(reasons);
  const [reasonEditId, setReasonEditId] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [previewOrderId, setPreviewOrderId] = useState(TEST_ORDERS[0].id);
  const [previewScope, setPreviewScope] = useState<RefundScope>('full');

  const warnings = useMemo(
    () => computeWarnings(editing ? draftPolicy : policy, editing ? draftMethodRules : methodRules, editing ? draftReasons : reasons),
    [editing, draftPolicy, draftMethodRules, draftReasons, policy, methodRules, reasons],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof RefundPolicy>(key: K, value: RefundPolicy[K]) => setDraftPolicy((current) => ({ ...current, [key]: value }));

  const startEdit = () => {
    setDraftPolicy(policy);
    setDraftMethodRules(methodRules);
    setDraftReasons(reasons);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
    setDraftMethodRules(methodRules);
    setDraftReasons(reasons);
  };
  const requestSave = () => {
    const diffs = [
      ...describePolicyChanges(policy, draftPolicy),
      ...describeMethodChanges(methodRules, draftMethodRules),
      ...describeReasonChanges(reasons, draftReasons),
    ];
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
      at: '2026-08-24 14:00',
      by: 'admin01',
      field: d.field,
      before: d.before,
      after: d.after,
      reason: reason.trim(),
    }));
    setPolicy(draftPolicy);
    setMethodRules(draftMethodRules);
    setReasons(draftReasons);
    setHistory((current) => [...entries, ...current]);
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('환불 정책을 저장했습니다.');
  };

  const setMethod = (id: string, patch: Partial<{ active: boolean; pg: string | null }>) => {
    setDraftMethodRules((current) => current.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const saveReason = (updated: RefundReason) => {
    setDraftReasons((current) => (current.find((r) => r.id === updated.id) ? current.map((r) => (r.id === updated.id ? updated : r)) : [...current, updated]));
    setReasonEditId(null);
  };
  const addReason = () => {
    const nextOrder = Math.max(0, ...draftReasons.map((r) => r.order)) + 1;
    const draft: RefundReason = { id: `NEW-${Date.now()}`, label: '', type: '부분 환불', active: true, order: nextOrder, requiresDetail: false };
    setDraftReasons((current) => [...current, draft]);
    setReasonEditId(draft.id);
  };
  const removeReason = (id: string) => setDraftReasons((current) => current.filter((r) => r.id !== id));
  const moveReason = (item: RefundReason, direction: -1 | 1) => {
    const siblings = draftReasons.slice().sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((r) => r.id === item.id);
    const swap = siblings[index + direction];
    if (!swap) return;
    setDraftReasons((current) => current.map((r) => (r.id === item.id ? { ...r, order: swap.order } : r.id === swap.id ? { ...r, order: item.order } : r)));
  };

  const activeMethodRules = (editing ? draftMethodRules : methodRules).slice().sort((a, b) => a.order - b.order);
  const activeReasons = (editing ? draftReasons : reasons).slice().sort((a, b) => a.order - b.order);

  const previewOrder = TEST_ORDERS.find((o) => o.id === previewOrderId)!;
  const previewBreakdown = computeRefundBreakdown(previewOrder, previewScope, policy, methodRules);
  const editingReasonDraft = reasonEditId ? draftReasons.find((r) => r.id === reasonEditId) : null;

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>환불 정책</h1>
            <p className={shared.subtitle}>취소·반품 등으로 환불이 발생했을 때 환불 대상금액 계산 기준과 처리 방식을 설정합니다.</p>
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
                <div className={styles.summaryRow}><span>전체 환불</span><strong>{policy.fullRefundEnabled ? '허용' : '불가'}</strong></div>
                <div className={styles.summaryRow}><span>부분 환불</span><strong>{policy.partialRefundEnabled ? '허용' : '불가'}</strong></div>
                <div className={styles.summaryRow}><span>환불 처리 방식</span><strong>{policy.refundMethodBasis}</strong></div>
                <div className={styles.summaryRow}><span>환불 가능기간</span><strong>{policy.refundPeriodBasis === '제한 없음' ? '제한 없음' : `${policy.refundPeriodBasis} ${policy.refundPeriodDays}일`}</strong></div>
                <div className={styles.summaryRow}><span>환불 승인</span><strong>{policy.approvalRequired}</strong></div>
                <div className={styles.summaryRow}><span>환불 완료 기준</span><strong>{policy.refundCompletionBasis}</strong></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>환불 기능</h3>
              <label className={styles.toggleField}>
                <span>전체 환불 허용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.fullRefundEnabled ? styles.switchOn : ''}`} onClick={() => set('fullRefundEnabled', !draftPolicy.fullRefundEnabled)}><i /></button>
              </label>
              <label className={styles.toggleField}>
                <span>부분 환불 허용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.partialRefundEnabled ? styles.switchOn : ''}`} onClick={() => set('partialRefundEnabled', !draftPolicy.partialRefundEnabled)}><i /></button>
              </label>
              <label className={styles.formField}>
                <span>환불 처리 방식</span>
                <div className={styles.radioGroup}>
                  {(['원 결제수단 우선', '관리자 지정', '환불계좌 우선'] as RefundMethodBasis[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.refundMethodBasis === v} onChange={() => set('refundMethodBasis', v)} />{v}</label>
                  ))}
                </div>
              </label>
            </div>

            <div className={styles.formSection}>
              <h3>환불 가능기간 · 처리</h3>
              <label className={styles.formField}>
                <span>환불 가능기간 기준</span>
                <div className={styles.radioGroup}>
                  {(['제한 없음', '거래 완료 후', '반품 완료 후'] as RefundPeriodBasis[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.refundPeriodBasis === v} onChange={() => set('refundPeriodBasis', v)} />{v}</label>
                  ))}
                </div>
              </label>
              {draftPolicy.refundPeriodBasis !== '제한 없음' && (
                <label className={styles.formField}>
                  <span>기준일로부터</span>
                  <input type="number" min={1} disabled={!editing} value={draftPolicy.refundPeriodDays} onChange={(e) => set('refundPeriodDays', Math.max(1, Number(e.target.value) || 1))} />
                </label>
              )}
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>환불 처리기한<small>승인 후 영업일</small></span>
                  <input type="number" min={0} disabled={!editing} value={draftPolicy.refundProcessingDays} onChange={(e) => set('refundProcessingDays', Math.max(0, Number(e.target.value) || 0))} />
                </label>
              </div>
              <label className={styles.formField}>
                <span>환불 완료 기준</span>
                <div className={styles.radioGroup}>
                  {(['PG 취소 성공 시', '관리자 지급 처리 시', '은행 출금 확인 시'] as RefundCompletionBasis[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.refundCompletionBasis === v} onChange={() => set('refundCompletionBasis', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.toggleField}>
                <span>환불 이벤트 알림<small>환불 접수·완료를 고객에게 안내합니다</small></span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.notifyOnRefundEvents ? styles.switchOn : ''}`} onClick={() => set('notifyOnRefundEvents', !draftPolicy.notifyOnRefundEvents)}><i /></button>
              </label>
            </div>

            <div className={styles.formSection}>
              <h3>환불금액 계산</h3>
              <div className={styles.radioGroup}>
                {(['시스템 자동 계산', '관리자 직접 입력'] as RefundCalcMode[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.refundCalcMode === v} onChange={() => set('refundCalcMode', v)} />{v}</label>
                ))}
              </div>
              <div className={styles.infoNote}>시스템 자동 계산을 기본으로 권장합니다. 계산 근거를 알 수 없는 임의 입력을 막기 위해, 별도 조정이 필요한 금액은 사유와 함께 조정 항목으로 남기는 것을 권장합니다.</div>
            </div>
          </>
        )}

        {tab === 'amount' && (
          <>
            <div className={styles.formSection}>
              <h3>배송비 처리</h3>
              <label className={styles.formField}>
                <span>전체 환불 시 배송비</span>
                <div className={styles.radioGroup}>
                  {(['배송비 반환', '배송비 미반환', '조건에 따라 계산'] as ShippingFullPolicy[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.shippingFullPolicy === v} onChange={() => set('shippingFullPolicy', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>부분 환불 시 배송비</span>
                <div className={styles.radioGroup}>
                  {(['잔여 주문 기준 재계산', '원 배송비 유지'] as ShippingPartialPolicy[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.shippingPartialPolicy === v} onChange={() => set('shippingPartialPolicy', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>무료배송 기준금액<small>부분환불 후 잔여 주문금액이 이 금액 미만이면 배송비를 재부과합니다</small></span>
                <input type="number" min={0} disabled={!editing} value={draftPolicy.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))} />
              </label>
            </div>

            <div className={styles.formSection}>
              <h3>할인 재계산</h3>
              <div className={styles.radioGroup}>
                {(['기존 할인 배분 기준', '잔여 주문 기준 재계산', '할인 정책에 위임'] as DiscountRecalcPolicy[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.discountRecalcPolicy === v} onChange={() => set('discountRecalcPolicy', v)} />{v}</label>
                ))}
              </div>
              <div className={styles.infoNote}>실제 할인 계산 Rule은 할인/프로모션 모듈을 참조합니다. 이 설정은 부분환불 시 할인을 재계산할지 여부만 결정합니다.</div>
            </div>

            <div className={styles.formSection}>
              <h3>환불금액 계산식</h3>
              <div className={styles.formulaNote}>
                <span>취소 상품금액</span><em>+</em><span>배송비 조정</span><em>±</em><span>할인 조정</span><em>=</em><span>최종 환불금액</span>
              </div>
              <div className={styles.infoNote}>계산 결과(Breakdown)와 적용 당시 정책은 환불 생성 시 Snapshot으로 함께 보존됩니다. 이후 정책이 변경되어도 과거 환불 금액은 다시 계산되지 않습니다.</div>
            </div>

            <div className={styles.formSection}>
              <h3>승인</h3>
              <div className={styles.radioGroup}>
                {(['사용 안 함', '조건부', '모든 환불'] as ApprovalRequirement[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.approvalRequired === v} onChange={() => set('approvalRequired', v)} />{v}</label>
                ))}
              </div>
              {draftPolicy.approvalRequired === '조건부' && (
                <label className={styles.formField}>
                  <span>승인 필요 기준금액 이상</span>
                  <input type="number" min={0} disabled={!editing} value={draftPolicy.approvalThresholdAmount} onChange={(e) => set('approvalThresholdAmount', Math.max(0, Number(e.target.value) || 0))} />
                </label>
              )}
            </div>
          </>
        )}

        {tab === 'methods' && (
          <>
            <div className={styles.infoNote}>결제수단별 기본 환불 처리 방식입니다. 카드 등 PG 자동 환불이 필요한 수단은 연동 PG가 설정되어 있어야 합니다.</div>
            <div className={styles.methodList}>
              <div className={`${styles.methodRow} ${styles.methodHead}`}><span>결제수단</span><span>기본 환불 방식</span><span>연동 PG</span><span>사용</span></div>
              {activeMethodRules.map((m) => (
                <div key={m.id} className={styles.methodRow}>
                  <span className={styles.methodName}>{m.name}</span>
                  <span className={styles.methodDim}>{m.defaultAction}</span>
                  {editing ? (
                    <select value={m.pg ?? '없음'} onChange={(e) => setMethod(m.id, { pg: e.target.value === '없음' ? null : e.target.value })}>
                      {PG_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  ) : (
                    <span className={m.requiresPg && !m.pg ? styles.pgWarn : undefined}>{m.pg ?? '없음'}</span>
                  )}
                  {editing ? (
                    <button type="button" className={`${styles.switch} ${m.active ? styles.switchOn : ''}`} onClick={() => setMethod(m.id, { active: !m.active })}><i /></button>
                  ) : (
                    <span>{m.active ? '사용' : '비활성'}</span>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.formSection}>
              <h3>환불 실패 처리</h3>
              <label className={styles.toggleField}>
                <span>환불 실패 재시도 허용</span>
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
              <div className={styles.infoNote}>동일 거래에 대한 중복 환불 방지는 시스템 기본 안전장치로 항상 적용되며 별도 설정이 필요하지 않습니다.</div>
            </div>
          </>
        )}

        {tab === 'reasons' && (
          <>
            <div className={styles.infoNote}>환불 사유별로 유형을 지정하고, 고객·운영 화면 노출 여부를 관리합니다. '기타'처럼 자유 서술이 필요한 사유는 상세 입력 필수로 설정하세요.</div>
            <div className={styles.reasonList}>
              <div className={`${styles.reasonRow} ${styles.reasonHead}`}><span /><span>사유명</span><span>유형</span><span>노출</span><span /></div>
              {activeReasons.map((r) => (
                <div key={r.id} className={styles.reasonRow}>
                  <span className={styles.dragHandle}>☰</span>
                  <span>{r.label}{r.requiresDetail && <span className={styles.detailTag}>상세필수</span>}</span>
                  <span className={styles.typeTag}>{r.type}</span>
                  <span style={{ color: r.active ? '#059669' : '#a1a1aa' }}>{r.active ? '노출' : '비노출'}</span>
                  {editing ? (
                    <span style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className={styles.smallBtn} onClick={() => moveReason(r, -1)}>↑</button>
                      <button type="button" className={styles.smallBtn} onClick={() => moveReason(r, 1)}>↓</button>
                      <button type="button" className={styles.smallBtn} onClick={() => setReasonEditId(r.id)}>수정</button>
                      <button type="button" className={styles.smallBtn} onClick={() => removeReason(r.id)}>삭제</button>
                    </span>
                  ) : <span />}
                </div>
              ))}
            </div>
            {editing && <button type="button" className={styles.smallBtn} onClick={addReason}>+ 환불 사유 추가</button>}
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
                    <span>{o.method}</span>
                  </button>
                ))}
              </div>
              <h3>환불 범위</h3>
              <div className={styles.actorToggle}>
                <button type="button" className={`${styles.actorBtn} ${previewScope === 'full' ? styles.actorBtnActive : ''}`} onClick={() => setPreviewScope('full')}>전체 환불</button>
                <button type="button" className={`${styles.actorBtn} ${previewScope === 'partial' ? styles.actorBtnActive : ''}`} onClick={() => setPreviewScope('partial')}>부분 환불</button>
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 계산합니다.</div>
            </div>
            <div className={styles.previewCard}>
              <h3>환불금액 계산 결과</h3>
              <div className={`${styles.resultHero} ${previewBreakdown.capped ? styles.resultHeroCapped : ''}`}>
                <span>{previewOrder.id} · {previewScope === 'full' ? '전체 환불' : '부분 환불'} · {previewOrder.method}</span>
                <strong>{fmtWon(previewBreakdown.total)}</strong>
              </div>
              <div className={styles.breakdownTable}>
                {previewBreakdown.items.map((item, i) => (
                  <div key={i} className={styles.breakdownRow}>
                    <span>{item.label}</span>
                    <span className={item.amount < 0 ? styles.breakdownNeg : styles.breakdownPos}>{signed(item.amount)}</span>
                  </div>
                ))}
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                  <span>최종 환불금액</span>
                  <span>{fmtWon(previewBreakdown.total)}</span>
                </div>
              </div>
              {previewBreakdown.capped && (
                <div className={styles.noteList}>
                  <div>⚠ 계산 금액이 환불 가능금액({fmtWon(previewBreakdown.availableMax)})을 초과하여 자동 조정되었습니다.</div>
                </div>
              )}
              <div className={styles.resultRow}><span>환불 방식</span><strong>{previewBreakdown.methodAction}</strong></div>
              <div className={styles.resultRow}><span>연동 PG</span><strong>{previewBreakdown.methodPg ?? '없음'}</strong></div>
              <div className={styles.resultRow}><span>승인 필요</span><strong>{previewBreakdown.approvalNeeded ? '필요' : '불필요'}</strong></div>
              <div className={styles.resultRow}><span>환불 가능금액</span><strong>{fmtWon(previewBreakdown.availableMax)}</strong></div>
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

      {editingReasonDraft && (
        <RefundReasonEditDialog initial={editingReasonDraft} onClose={() => setReasonEditId(null)} onSave={saveReason} />
      )}

      {confirmSave && (
        <div className={shared.dialogOverlay}>
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>환불 정책 변경 확인</h2>
            <p className={shared.dialogBody}>변경 사항은 신규 환불 요청부터 적용됩니다. 이미 생성된 환불 건은 생성 당시 정책 Snapshot 기준으로 처리됩니다.</p>
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
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 무료배송 조건 미충족 시 배송비 누락 방지" />
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
