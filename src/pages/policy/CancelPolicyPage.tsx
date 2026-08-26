import { useMemo, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './CancelPolicyPage.module.css';
import { CancelReasonEditDialog } from './CancelReasonEditDialog';
import {
  INITIAL_HISTORY,
  INITIAL_POLICY,
  INITIAL_REASONS,
  INITIAL_STAGE_RULES,
  POST_SHIPMENT_STAGES,
  TEST_ORDERS,
  checkEligibility,
  computeWarnings,
  describePolicyChanges,
  describeReasonChanges,
  describeStageChanges,
  type ApprovalNeed,
  type CancelAvailability,
  type CancelPolicy,
  type CancelReason,
  type CancelTimingBase,
  type FieldDiff,
  type PolicyHistoryEntry,
  type PostShipmentAction,
  type StageCancelRule,
  type WithdrawPolicy,
} from './cancelPolicyData';

type Tab = 'basic' | 'stage' | 'partial' | 'reasons' | 'followup' | 'preview' | 'history';
const TABS: [Tab, string][] = [
  ['basic', '기본 정책'],
  ['stage', '단계별 취소'],
  ['partial', '부분 취소'],
  ['reasons', '사유 관리'],
  ['followup', '후속 처리'],
  ['preview', '정책 Preview'],
  ['history', '변경 이력'],
];

function availClass(a: CancelAvailability): string {
  return a === '가능' ? styles.availOk : a === '조건부' ? styles.availCond : styles.availNo;
}

export function CancelPolicyPage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [stageRules, setStageRules] = useState(INITIAL_STAGE_RULES);
  const [reasons, setReasons] = useState(INITIAL_REASONS);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [draftStageRules, setDraftStageRules] = useState(stageRules);
  const [draftReasons, setDraftReasons] = useState(reasons);
  const [reasonEditId, setReasonEditId] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [previewOrderId, setPreviewOrderId] = useState(TEST_ORDERS[0].id);
  const [previewActor, setPreviewActor] = useState<'고객' | '관리자'>('고객');

  const warnings = useMemo(
    () => computeWarnings(editing ? draftPolicy : policy, editing ? draftStageRules : stageRules, editing ? draftReasons : reasons),
    [editing, draftPolicy, draftStageRules, draftReasons, policy, stageRules, reasons],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof CancelPolicy>(key: K, value: CancelPolicy[K]) => setDraftPolicy((current) => ({ ...current, [key]: value }));

  const startEdit = () => {
    setDraftPolicy(policy);
    setDraftStageRules(stageRules);
    setDraftReasons(reasons);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
    setDraftStageRules(stageRules);
    setDraftReasons(reasons);
  };
  const requestSave = () => {
    const diffs = [
      ...describePolicyChanges(policy, draftPolicy),
      ...describeStageChanges(stageRules, draftStageRules),
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
    setStageRules(draftStageRules);
    setReasons(draftReasons);
    setHistory((current) => [...entries, ...current]);
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('취소 정책을 저장했습니다.');
  };

  const setStage = (stage: string, patch: Partial<StageCancelRule>) => {
    setDraftStageRules((current) => current.map((r) => (r.stage === stage ? { ...r, ...patch } : r)));
  };

  const saveReason = (updated: CancelReason) => {
    setDraftReasons((current) => (current.find((r) => r.id === updated.id) ? current.map((r) => (r.id === updated.id ? updated : r)) : [...current, updated]));
    setReasonEditId(null);
  };
  const addReason = (audience: '고객' | '관리자') => {
    const nextOrder = Math.max(0, ...draftReasons.filter((r) => r.audience === audience).map((r) => r.order)) + 1;
    const draft: CancelReason = { id: `NEW-${Date.now()}`, label: '', audience, active: true, order: nextOrder, requiresDetail: false };
    setDraftReasons((current) => [...current, draft]);
    setReasonEditId(draft.id);
  };
  const removeReason = (id: string) => setDraftReasons((current) => current.filter((r) => r.id !== id));
  const moveReason = (item: CancelReason, direction: -1 | 1) => {
    const siblings = draftReasons.filter((r) => r.audience === item.audience).sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((r) => r.id === item.id);
    const swap = siblings[index + direction];
    if (!swap) return;
    setDraftReasons((current) => current.map((r) => (r.id === item.id ? { ...r, order: swap.order } : r.id === swap.id ? { ...r, order: item.order } : r)));
  };

  const activeStageRules = editing ? draftStageRules : stageRules;
  const activeReasons = (editing ? draftReasons : reasons).slice().sort((a, b) => a.order - b.order);
  const customerReasons = activeReasons.filter((r) => r.audience === '고객');
  const adminReasons = activeReasons.filter((r) => r.audience === '관리자');

  const previewOrder = TEST_ORDERS.find((o) => o.id === previewOrderId)!;
  const previewResult = checkEligibility(previewOrder, previewActor, policy, stageRules);
  const editingReasonDraft = reasonEditId ? draftReasons.find((r) => r.id === reasonEditId) : null;

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>취소 정책</h1>
            <p className={shared.subtitle}>주문 취소 가능 조건과 취소 처리 규칙을 설정합니다.</p>
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
                <div className={styles.summaryRow}><span>고객 직접 취소</span><strong>{policy.customerCancelEnabled ? '사용' : '사용 안 함'}</strong></div>
                <div className={styles.summaryRow}><span>관리자 취소</span><strong>{policy.adminCancelEnabled ? '사용' : '사용 안 함'}</strong></div>
                <div className={styles.summaryRow}><span>부분 취소</span><strong>{policy.partialCancelEnabled ? '가능' : '불가'}</strong></div>
                <div className={styles.summaryRow}><span>출고 전 취소</span><strong>가능</strong></div>
                <div className={styles.summaryRow}><span>출고 이후</span><strong>{policy.postShipmentAction}</strong></div>
                <div className={styles.summaryRow}><span>취소 요청 철회</span><strong>{policy.withdrawPolicy}</strong></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>취소 기능</h3>
              <label className={styles.toggleField}>
                <span>고객 직접 취소 허용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.customerCancelEnabled ? styles.switchOn : ''}`} onClick={() => set('customerCancelEnabled', !draftPolicy.customerCancelEnabled)}><i /></button>
              </label>
              <label className={styles.toggleField}>
                <span>관리자 취소 허용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.adminCancelEnabled ? styles.switchOn : ''}`} onClick={() => set('adminCancelEnabled', !draftPolicy.adminCancelEnabled)}><i /></button>
              </label>
              <label className={styles.formField}>
                <span>취소 요청 철회</span>
                <div className={styles.radioGroup}>
                  {(['허용', '처리 시작 전까지만 허용', '불가'] as WithdrawPolicy[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.withdrawPolicy === v} onChange={() => set('withdrawPolicy', v)} />{v}</label>
                  ))}
                </div>
              </label>
            </div>

            <div className={styles.formSection}>
              <h3>취소 가능 시점</h3>
              <label className={styles.formField}>
                <span>기본 취소 가능 시점</span>
                <div className={styles.radioGroup}>
                  {(['출고 전', '주문 처리 시작 전', '주문 확정 전', '단계별 설정'] as CancelTimingBase[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.defaultTimingBase === v} onChange={() => set('defaultTimingBase', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>출고 후 취소 요청</span>
                <div className={styles.radioGroup}>
                  {(['반품 / 회수 절차로 전환', '관리자 확인', '요청 차단'] as PostShipmentAction[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.postShipmentAction === v} onChange={() => set('postShipmentAction', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <div className={styles.infoNote}>이미 물류가 진행된 주문은 상태를 되돌리지 않고 반품/회수 → 환불 Workflow로 넘기는 것을 권장합니다.</div>
            </div>
          </>
        )}

        {tab === 'stage' && (
          <>
            <div className={styles.infoNote}>주문 Lifecycle 단계별로 고객·관리자 취소 가능 여부와 승인 필요 여부를 설정합니다. 출고 이후 단계는 배경으로 구분됩니다.</div>
            <div className={styles.stageTable}>
              <div className={`${styles.stageRow} ${styles.stageHead}`}>
                <span>주문 단계</span><span>고객 취소</span><span>관리자 취소</span><span>승인</span>
              </div>
              {activeStageRules.map((r) => (
                <div key={r.stage} className={`${styles.stageRow} ${POST_SHIPMENT_STAGES.has(r.stage) ? styles.postShipment : ''}`}>
                  <span className={styles.stageName}>{r.stage}</span>
                  {editing ? (
                    <select value={r.customerCancel} onChange={(e) => setStage(r.stage, { customerCancel: e.target.value as CancelAvailability })}>
                      <option>가능</option><option>조건부</option><option>불가</option>
                    </select>
                  ) : <span className={`${styles.availTag} ${availClass(r.customerCancel)}`}>{r.customerCancel}</span>}
                  {editing ? (
                    <select value={r.adminCancel} onChange={(e) => setStage(r.stage, { adminCancel: e.target.value as CancelAvailability })}>
                      <option>가능</option><option>조건부</option><option>불가</option>
                    </select>
                  ) : <span className={`${styles.availTag} ${availClass(r.adminCancel)}`}>{r.adminCancel}</span>}
                  {editing ? (
                    <select value={r.approval} onChange={(e) => setStage(r.stage, { approval: e.target.value as ApprovalNeed })}>
                      <option>불필요</option><option>조건부</option><option>필요</option>
                    </select>
                  ) : <span>{r.approval}</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'partial' && (
          <div className={styles.formSection}>
            <h3>부분 취소</h3>
            <label className={styles.toggleField}>
              <span>부분 취소 허용</span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.partialCancelEnabled ? styles.switchOn : ''}`} onClick={() => set('partialCancelEnabled', !draftPolicy.partialCancelEnabled)}><i /></button>
            </label>
            <label className={styles.toggleField}>
              <span>전체 주문 취소 허용</span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.fullCancelEnabled ? styles.switchOn : ''}`} onClick={() => set('fullCancelEnabled', !draftPolicy.fullCancelEnabled)}><i /></button>
            </label>
            <label className={styles.toggleField}>
              <span>상품 단위 취소 사용<small>부분 취소를 상품 단위까지 허용합니다</small></span>
              <button type="button" disabled={!editing || !draftPolicy.partialCancelEnabled} className={`${styles.switch} ${draftPolicy.itemLevelPartialEnabled ? styles.switchOn : ''}`} onClick={() => set('itemLevelPartialEnabled', !draftPolicy.itemLevelPartialEnabled)}><i /></button>
            </label>
            <div className={styles.infoNote}>수량 단위 부분취소, MOQ·주문단위 검증은 프로젝트 확장 설정으로 제공됩니다.</div>
          </div>
        )}

        {tab === 'reasons' && (
          <>
            <div className={styles.infoNote}>고객 노출용 사유와 관리자 전용 사유를 분리해서 관리합니다. '기타'처럼 자유 서술이 필요한 사유는 상세 입력 필수로 설정하세요.</div>
            <div className={styles.formSection}>
              <h3>고객 취소 사유</h3>
              <div className={styles.reasonList}>
                <div className={`${styles.reasonRow} ${styles.reasonHead}`}><span /><span>사유명</span><span>노출</span><span /><span /></div>
                {customerReasons.map((r) => (
                  <div key={r.id} className={styles.reasonRow}>
                    <span className={styles.dragHandle}>☰</span>
                    <span>{r.label}{r.requiresDetail && <span className={styles.detailTag}>상세필수</span>}</span>
                    <span style={{ color: r.active ? '#059669' : '#a1a1aa' }}>{r.active ? '노출' : '비노출'}</span>
                    {editing ? (
                      <span style={{ display: 'flex', gap: 4 }}><button type="button" className={styles.smallBtn} onClick={() => moveReason(r, -1)}>↑</button><button type="button" className={styles.smallBtn} onClick={() => moveReason(r, 1)}>↓</button></span>
                    ) : <span />}
                    {editing ? (
                      <span style={{ display: 'flex', gap: 4 }}><button type="button" className={styles.smallBtn} onClick={() => setReasonEditId(r.id)}>수정</button><button type="button" className={styles.smallBtn} onClick={() => removeReason(r.id)}>삭제</button></span>
                    ) : <span />}
                  </div>
                ))}
              </div>
              {editing && <button type="button" className={styles.smallBtn} onClick={() => addReason('고객')}>+ 고객 사유 추가</button>}
            </div>
            <div className={styles.formSection}>
              <h3>관리자 취소 사유</h3>
              <div className={styles.reasonList}>
                <div className={`${styles.reasonRow} ${styles.reasonHead}`}><span /><span>사유명</span><span>노출</span><span /><span /></div>
                {adminReasons.map((r) => (
                  <div key={r.id} className={styles.reasonRow}>
                    <span className={styles.dragHandle}>☰</span>
                    <span>{r.label}{r.requiresDetail && <span className={styles.detailTag}>상세필수</span>}</span>
                    <span style={{ color: r.active ? '#059669' : '#a1a1aa' }}>{r.active ? '노출' : '비노출'}</span>
                    {editing ? (
                      <span style={{ display: 'flex', gap: 4 }}><button type="button" className={styles.smallBtn} onClick={() => moveReason(r, -1)}>↑</button><button type="button" className={styles.smallBtn} onClick={() => moveReason(r, 1)}>↓</button></span>
                    ) : <span />}
                    {editing ? (
                      <span style={{ display: 'flex', gap: 4 }}><button type="button" className={styles.smallBtn} onClick={() => setReasonEditId(r.id)}>수정</button><button type="button" className={styles.smallBtn} onClick={() => removeReason(r.id)}>삭제</button></span>
                    ) : <span />}
                  </div>
                ))}
              </div>
              {editing && <button type="button" className={styles.smallBtn} onClick={() => addReason('관리자')}>+ 관리자 사유 추가</button>}
            </div>
          </>
        )}

        {tab === 'followup' && (
          <div className={styles.formSection}>
            <h3>후속 처리</h3>
            <label className={styles.toggleField}>
              <span>전량 취소 시 주문 자동 취소 전환<small>모든 상품의 유효 수량이 0이 되면 주문 상태를 자동으로 전환합니다</small></span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.autoCancelOrderWhenFullyCancelled ? styles.switchOn : ''}`} onClick={() => set('autoCancelOrderWhenFullyCancelled', !draftPolicy.autoCancelOrderWhenFullyCancelled)}><i /></button>
            </label>
            <label className={styles.toggleField}>
              <span>취소 시 재고 복원<small>출고되지 않은 수량만 가용 재고로 복원합니다</small></span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.restockOnCancel ? styles.switchOn : ''}`} onClick={() => set('restockOnCancel', !draftPolicy.restockOnCancel)}><i /></button>
            </label>
            <label className={styles.toggleField}>
              <span>취소 이벤트 알림<small>취소 접수·완료를 고객에게 안내합니다</small></span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.notifyOnCancelEvents ? styles.switchOn : ''}`} onClick={() => set('notifyOnCancelEvents', !draftPolicy.notifyOnCancelEvents)}><i /></button>
            </label>
            <div className={styles.infoNote}>
              결제 완료 주문의 환불 금액 계산은 <button type="button" className={styles.smallBtn} onClick={() => window.location.assign('/policy/refund')}>환불 정책</button>에서 관리합니다.
              배송비·할인 재계산, 쿠폰/포인트 복원, 정산 조정 연계는 프로젝트 확장 설정으로 제공됩니다.
            </div>
          </div>
        )}

        {tab === 'preview' && (
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>테스트 주문 선택</h3>
              <div className={styles.orderPick}>
                {TEST_ORDERS.map((o) => (
                  <button key={o.id} type="button" className={`${styles.orderOption} ${previewOrderId === o.id ? styles.orderOptionActive : ''}`} onClick={() => setPreviewOrderId(o.id)}>
                    <span><strong>{o.id}</strong> · {o.target}</span>
                    <span>{o.stage}</span>
                  </button>
                ))}
              </div>
              <h3>취소 요청자</h3>
              <div className={styles.actorToggle}>
                <button type="button" className={`${styles.actorBtn} ${previewActor === '고객' ? styles.actorBtnActive : ''}`} onClick={() => setPreviewActor('고객')}>고객</button>
                <button type="button" className={`${styles.actorBtn} ${previewActor === '관리자' ? styles.actorBtnActive : ''}`} onClick={() => setPreviewActor('관리자')}>관리자</button>
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 계산합니다.</div>
            </div>
            <div className={styles.previewCard}>
              <h3>취소 가능 여부</h3>
              <div className={`${styles.resultHero} ${previewResult.availability === '가능' ? styles.resultHeroOk : previewResult.availability === '조건부' ? styles.resultHeroCond : styles.resultHeroNo}`}>
                <span>{previewOrder.id} · {previewOrder.stage} · {previewActor} 취소</span>
                <strong>{previewResult.availability}</strong>
              </div>
              <div className={styles.resultRow}><span>승인 필요</span><strong>{previewResult.approvalNeeded ? '필요' : '불필요'}</strong></div>
              <div className={styles.resultRow}><span>부분 취소</span><strong>{previewResult.partialAllowed ? '가능' : '불가'}</strong></div>
              <div className={styles.resultRow}><span>결제 상태</span><strong>{previewOrder.paid ? '결제 완료' : '미결제'}</strong></div>
              <div className={styles.resultRow}><span>주문 금액</span><strong>{previewOrder.amount.toLocaleString()}원</strong></div>
              <div className={styles.noteList}>
                {previewResult.notes.map((n, i) => <div key={i}>· {n}</div>)}
              </div>
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
        <CancelReasonEditDialog initial={editingReasonDraft} onClose={() => setReasonEditId(null)} onSave={saveReason} />
      )}

      {confirmSave && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmSave(null); }}>
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>취소 정책 변경 확인</h2>
            <p className={shared.dialogBody}>변경 사항은 신규 취소 요청부터 적용됩니다. 이미 접수된 취소 요청은 요청 당시 정책 기준으로 처리됩니다.</p>
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
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 출고 Queue 제거 확인 절차 추가" />
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
