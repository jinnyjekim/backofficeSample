import { useMemo, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './PaymentPolicyPage.module.css';
import { PaymentMethodEditDialog } from './PaymentMethodEditDialog';
import {
  INITIAL_HISTORY,
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
  type FieldDiff,
  type PaymentBasis,
  type PaymentMethod,
  type PaymentPolicy,
  type PaymentTiming,
  type PolicyHistoryEntry,
  type ShortagePolicy,
} from './paymentPolicyData';

type Tab = 'basic' | 'methods' | 'partial' | 'failure' | 'cancel' | 'history';
const TABS: [Tab, string][] = [
  ['basic', '기본 정책'],
  ['methods', '결제수단'],
  ['partial', '금액 / 부분결제'],
  ['failure', '실패 / 재시도'],
  ['cancel', '취소 연계'],
  ['history', '변경 이력'],
];

export function PaymentPolicyPage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [methods, setMethods] = useState(INITIAL_METHODS);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [draftMethods, setDraftMethods] = useState(methods);
  const [methodEditId, setMethodEditId] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const warnings = useMemo(
    () => computeWarnings(editing ? draftPolicy : policy, editing ? draftMethods : methods),
    [editing, draftPolicy, draftMethods, policy, methods],
  );
  const sortedMethods = useMemo(() => [...(editing ? draftMethods : methods)].sort((a, b) => a.order - b.order), [editing, draftMethods, methods]);

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof PaymentPolicy>(key: K, value: PaymentPolicy[K]) => setDraftPolicy((current) => ({ ...current, [key]: value }));

  const startEdit = () => {
    setDraftPolicy(policy);
    setDraftMethods(methods);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
    setDraftMethods(methods);
  };
  const requestSave = () => {
    const diffs = [...describePolicyChanges(policy, draftPolicy), ...describeMethodChanges(methods, draftMethods)];
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
    setMethods(draftMethods);
    setHistory((current) => [...entries, ...current]);
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('결제 정책을 저장했습니다.');
  };

  const toggleStage = (stage: string) => {
    setDraftPolicy((current) => ({
      ...current,
      paymentAllowedStages: current.paymentAllowedStages.includes(stage)
        ? current.paymentAllowedStages.filter((s) => s !== stage)
        : [...current.paymentAllowedStages, stage],
    }));
  };

  const moveMethod = (item: PaymentMethod, direction: -1 | 1) => {
    const ordered = [...draftMethods].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((m) => m.id === item.id);
    const swap = ordered[index + direction];
    if (!swap) return;
    setDraftMethods((current) => current.map((m) => (m.id === item.id ? { ...m, order: swap.order } : m.id === swap.id ? { ...m, order: item.order } : m)));
  };

  const saveMethod = (updated: PaymentMethod) => {
    setDraftMethods((current) => current.map((m) => (m.id === updated.id ? updated : updated.isDefault ? { ...m, isDefault: false } : m)));
    setMethodEditId(null);
  };

  const activeCount = (editing ? draftMethods : methods).filter((m) => m.active).length;
  const defaultMethod = (editing ? draftMethods : methods).find((m) => m.isDefault);

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>결제 정책</h1>
            <p className={shared.subtitle}>서비스의 결제 방식과 처리 규칙을 설정합니다.</p>
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
              <div className={styles.summaryHead}><h2>현재 정책 요약</h2></div>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryRow}><span>결제 방식</span><strong>{policy.paymentTiming}</strong></div>
                <div className={styles.summaryRow}><span>기본 결제수단</span><strong>{defaultMethod?.name ?? '없음'}</strong></div>
                <div className={styles.summaryRow}><span>사용중 결제수단</span><strong>{activeCount}개</strong></div>
                <div className={styles.summaryRow}><span>부분결제</span><strong>{policy.partialPaymentEnabled ? '허용' : '불가'}</strong></div>
                <div className={styles.summaryRow}><span>결제 유효시간</span><strong>{policy.sessionExpiryMinutes}분</strong></div>
                <div className={styles.summaryRow}><span>결제 상태 자동 재조회</span><strong>{policy.autoRequery ? '사용' : '사용 안 함'}</strong></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>결제 필요 여부 · 방식</h3>
              <label className={styles.toggleField}>
                <span>주문별 결제 필요</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.paymentRequired ? styles.switchOn : ''}`} onClick={() => set('paymentRequired', !draftPolicy.paymentRequired)}><i /></button>
              </label>
              <label className={styles.formField}>
                <span>기본 결제 방식</span>
                <div className={styles.radioGroup}>
                  {(['선결제', '후불', '선결제 + 후불'] as PaymentTiming[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.paymentTiming === v} onChange={() => set('paymentTiming', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>결제 가능 시점 (주문 Lifecycle 단계)</span>
                <div className={styles.radioGroup}>
                  {PAYMENT_STAGES.map((s) => (
                    <label key={s}><input type="checkbox" disabled={!editing} checked={draftPolicy.paymentAllowedStages.includes(s)} onChange={() => toggleStage(s)} />{s}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>결제 기준금액</span>
                <div className={styles.radioGroup}>
                  {(['최종 주문금액', '청구 확정금액'] as PaymentBasis[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.paymentBasis === v} onChange={() => set('paymentBasis', v)} />{v}</label>
                  ))}
                </div>
              </label>
            </div>

            <div className={styles.formSection}>
              <h3>결제 유효시간</h3>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>결제 세션 유효시간 (분)</span>
                  <input type="number" min="0" disabled={!editing} value={draftPolicy.sessionExpiryMinutes} onChange={(e) => set('sessionExpiryMinutes', Number(e.target.value))} />
                </label>
                <label className={styles.formField}>
                  <span>유효시간 만료 후</span>
                  <select disabled={!editing} value={draftPolicy.expiryAction} onChange={(e) => set('expiryAction', e.target.value as ExpiryAction)}>
                    <option>재결제 가능</option>
                    <option>주문 자동 취소</option>
                    <option>관리자 확인 필요</option>
                  </select>
                </label>
              </div>
              <label className={styles.toggleField}>
                <span>결제 완료 전 주문 처리 차단<small>선결제 정책에서 결제 확인 전 처리 진행을 막습니다</small></span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.blockProcessingBeforePaid ? styles.switchOn : ''}`} onClick={() => set('blockProcessingBeforePaid', !draftPolicy.blockProcessingBeforePaid)}><i /></button>
              </label>
            </div>
          </>
        )}

        {tab === 'methods' && (
          <>
            <div className={styles.infoNote}>사용 여부·금액 제한·PG 연결은 결제수단별로 [수정]에서 설정합니다. 노출 순서는 ↑↓ 버튼으로 조정합니다.</div>
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
                  {editing ? (
                    <>
                      <span style={{ display: 'flex', gap: 4 }}>
                        <button type="button" className={styles.methodEditBtn} onClick={() => moveMethod(m, -1)}>↑</button>
                        <button type="button" className={styles.methodEditBtn} onClick={() => moveMethod(m, 1)}>↓</button>
                      </span>
                      <button type="button" className={styles.methodEditBtn} onClick={() => setMethodEditId(m.id)}>수정</button>
                    </>
                  ) : (
                    <>
                      <span />
                      <span />
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'partial' && (
          <div className={styles.formSection}>
            <h3>부분결제</h3>
            <label className={styles.toggleField}>
              <span>부분결제 허용</span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.partialPaymentEnabled ? styles.switchOn : ''}`} onClick={() => set('partialPaymentEnabled', !draftPolicy.partialPaymentEnabled)}><i /></button>
            </label>
            {draftPolicy.partialPaymentEnabled && (
              <>
                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>최소 1회 결제금액</span>
                    <input type="number" min="0" disabled={!editing} value={draftPolicy.minPartialAmount} onChange={(e) => set('minPartialAmount', Number(e.target.value))} />
                  </label>
                  <label className={styles.formField}>
                    <span>최소 결제 비율 (%)</span>
                    <input type="number" min="0" max="100" disabled={!editing} value={draftPolicy.minPartialRatioPct} onChange={(e) => set('minPartialRatioPct', Number(e.target.value))} />
                  </label>
                  <label className={styles.formField}>
                    <span>최대 결제 횟수</span>
                    <input type="number" min="1" disabled={!editing} value={draftPolicy.maxPartialCount} onChange={(e) => set('maxPartialCount', Number(e.target.value))} />
                  </label>
                  <label className={styles.formField}>
                    <span>잔액 결제 마감 (주문 확정 후 N일)</span>
                    <input type="number" min="0" disabled={!editing} value={draftPolicy.balanceDueDays} onChange={(e) => set('balanceDueDays', Number(e.target.value))} />
                  </label>
                </div>
                <label className={styles.formField}>
                  <span>부족 결제 처리</span>
                  <select disabled={!editing} value={draftPolicy.shortagePolicy} onChange={(e) => set('shortagePolicy', e.target.value as ShortagePolicy)}>
                    <option>부분결제로 처리</option>
                    <option>결제 확인 차단</option>
                    <option>관리자 확인 필요</option>
                  </select>
                </label>
              </>
            )}
            <div className={styles.infoNote}>복수 결제수단 병행, 과결제 처리 등 세부 규칙은 프로젝트 확장 설정으로 제공됩니다.</div>
          </div>
        )}

        {tab === 'failure' && (
          <>
            <div className={styles.formSection}>
              <h3>결제 실패</h3>
              <label className={styles.formField}>
                <span>실패 시 주문 상태</span>
                <select disabled={!editing} value={draftPolicy.failureOrderAction} onChange={(e) => set('failureOrderAction', e.target.value as FailureOrderAction)}>
                  <option>유지</option>
                  <option>결제 실패 상태로 전환</option>
                  <option>주문 취소</option>
                </select>
              </label>
              <label className={styles.toggleField}>
                <span>사용자 재시도 허용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.retryAllowed ? styles.switchOn : ''}`} onClick={() => set('retryAllowed', !draftPolicy.retryAllowed)}><i /></button>
              </label>
              {draftPolicy.retryAllowed && (
                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>최대 재시도</span>
                    <input type="number" min="1" disabled={!editing} value={draftPolicy.maxRetryCount} onChange={(e) => set('maxRetryCount', Number(e.target.value))} />
                  </label>
                  <label className={styles.formField}>
                    <span>재시도 제한시간 (분)</span>
                    <input type="number" min="1" disabled={!editing} value={draftPolicy.retryLimitMinutes} onChange={(e) => set('retryLimitMinutes', Number(e.target.value))} />
                  </label>
                </div>
              )}
            </div>
            <div className={styles.formSection}>
              <h3>결제 상태 재조회</h3>
              <label className={styles.toggleField}>
                <span>결제 상태 자동 재조회<small>내부 상태와 PG 상태가 어긋나는 경우 자동 동기화</small></span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.autoRequery ? styles.switchOn : ''}`} onClick={() => set('autoRequery', !draftPolicy.autoRequery)}><i /></button>
              </label>
              {draftPolicy.autoRequery && (
                <label className={styles.formField}>
                  <span>재조회 횟수</span>
                  <input type="number" min="1" disabled={!editing} value={draftPolicy.requeryMaxCount} onChange={(e) => set('requeryMaxCount', Number(e.target.value))} />
                </label>
              )}
              <div className={styles.lockedNote}>중복결제 방지는 시스템 필수 기능으로 항상 사용됩니다. (주문번호·결제대상금액·진행중 결제 여부를 자동 검증)</div>
            </div>
          </>
        )}

        {tab === 'cancel' && (
          <div className={styles.formSection}>
            <h3>취소 연계</h3>
            <label className={styles.toggleField}>
              <span>결제 취소 기능 사용</span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.cancelEnabled ? styles.switchOn : ''}`} onClick={() => set('cancelEnabled', !draftPolicy.cancelEnabled)}><i /></button>
            </label>
            <label className={styles.formField}>
              <span>결제 완료 후 주문 금액 변경</span>
              <select disabled={!editing} value={draftPolicy.amountChangePolicy} onChange={(e) => set('amountChangePolicy', e.target.value as AmountChangePolicy)}>
                <option>직접 수정 허용</option>
                <option>변경 요청 Workflow</option>
                <option>수정 불가</option>
              </select>
            </label>
            <label className={styles.toggleField}>
              <span>관리자 수동 결제 등록 허용</span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.manualPaymentEnabled ? styles.switchOn : ''}`} onClick={() => set('manualPaymentEnabled', !draftPolicy.manualPaymentEnabled)}><i /></button>
            </label>
            <div className={styles.infoNote}>
              결제 취소 이후 주문 상태 처리, 부분 취소·환불 계산 규칙은 <button type="button" className={styles.methodEditBtn} onClick={() => window.location.assign('/policy/cancellation')}>취소 정책</button>{' '}
              및 <button type="button" className={styles.methodEditBtn} onClick={() => window.location.assign('/policy/refund')}>환불 정책</button>에서 관리합니다.
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

      {methodEditId && (
        <PaymentMethodEditDialog
          initial={draftMethods.find((m) => m.id === methodEditId)!}
          onClose={() => setMethodEditId(null)}
          onSave={saveMethod}
        />
      )}

      {confirmSave && (
        <div className={shared.dialogOverlay}>
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

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
