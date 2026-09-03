import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './PaymentPolicyPage.module.css';
import { CommonButton } from '../../components/common';
import { PaymentMethodEditDialog } from './PaymentMethodEditDialog';
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
  type FieldDiff,
  type LastModified,
  type PaymentBasis,
  type PaymentMethod,
  type PaymentPolicy,
  type PaymentTiming,
  type PolicyHistoryEntry,
  type ShortagePolicy,
} from './paymentPolicyData';

const TTL_PRESETS = ['15', '30', '60'];

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
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [methods, setMethods] = useState(INITIAL_METHODS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastModified, setLastModified] = useState<LastModified>(INITIAL_LAST_MODIFIED);

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

  const set = <K extends keyof PaymentPolicy>(key: K, value: PaymentPolicy[K]) => {
    if (!editing) {
      setDraftPolicy({ ...policy, [key]: value });
      setDraftMethods(methods);
      setEditing(true);
      toastBriefly('정책 수정 모드로 전환되었습니다.');
      return;
    }
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
    if (!editing) {
      const currentList = policy.paymentAllowedStages;
      const nextList = currentList.includes(stage) ? currentList.filter((s) => s !== stage) : [...currentList, stage];
      setDraftPolicy({ ...policy, paymentAllowedStages: nextList });
      setDraftMethods(methods);
      setEditing(true);
      toastBriefly('정책 수정 모드로 전환되었습니다.');
      return;
    }
    setDraftPolicy((current) => ({
      ...current,
      paymentAllowedStages: current.paymentAllowedStages.includes(stage)
        ? current.paymentAllowedStages.filter((s) => s !== stage)
        : [...current.paymentAllowedStages, stage],
    }));
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

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <h1 className={shared.title}>결제 정책</h1>
            <p className={shared.subtitle}>서비스의 결제 방식과 처리 규칙을 설정합니다.</p>
          </div>
          <div className={styles.headMeta}>
            {!editing && <span className={styles.headMetaText}>최종 수정 {lastModified.at} · {lastModified.by}</span>}
            {!editing ? (
              <>
                <button type="button" className={styles.outlineBtn} onClick={() => setTab('history')}>변경 이력</button>
                <button type="button" className={styles.darkBtn} onClick={startEdit}>✏️ 정책 수정</button>
              </>
            ) : (
              <>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>수정 취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>💾 변경 사항 저장</button>
              </>
            )}
          </div>
        </div>

        <div className={`${styles.modeBanner} ${editing ? styles.modeBannerEdit : styles.modeBannerRead}`}>
          <div className={styles.modeBannerLeft}>
            <span className={`${styles.modeTag} ${editing ? styles.modeTagEdit : styles.modeTagRead}`}>
              {editing ? '수정 모드' : '조회 모드'}
            </span>
            <span>
              {editing
                ? '정책을 편집 중입니다. 변경을 마치면 [변경 사항 저장] 버튼을 눌러 확정하세요.'
                : '현재 적용 중인 정책입니다. 버튼이나 스위치를 클릭하면 즉시 수정 모드로 전환됩니다.'}
            </span>
          </div>
          {!editing && (
            <button type="button" className={styles.modeActionBtn} onClick={startEdit}>
              정책 수정 시작
            </button>
          )}
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
            <button type="button" className={styles.warningActionBtn} onClick={() => setTab('partial')}>금액 탭에서 확인</button>
          </div>
        )}

        {tab === 'basic' && (
          <>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHead}><h2>현재 정책 요약</h2></div>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>결제 방식</div><div className={styles.summaryTileValue}>{policy.paymentTiming}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>기본 결제수단</div><div className={styles.summaryTileValue}>{defaultMethod?.name ?? '없음'}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>사용중 결제수단</div><div className={styles.summaryTileValue}>{activeCount}개</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>부분결제</div><div className={styles.summaryTileValue}>{policy.partialPaymentEnabled ? '허용' : '불가'}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>결제 유효시간</div><div className={styles.summaryTileValue}>{policy.sessionExpiryMinutes}분</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>결제 가능 시점</div><div className={styles.summaryTileValue}>{policy.paymentAllowedStages.length}개 단계</div></div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>결제 필요 여부 · 방식</div>
                <div className={styles.cardDesc}>주문이 결제를 거쳐야 하는지와, 어느 단계에서 결제를 받을지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.paymentRequired ? styles.switchOn : ''}`} onClick={() => set('paymentRequired', !draftPolicy.paymentRequired)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>주문별 결제 필요</div>
                    <div className={styles.toggleRowDesc}>끄면 주문이 결제 없이 완료 처리됩니다.</div>
                  </div>
                </div>

                <div className={`${styles.cardGrid} ${styles.dividerTop}`}>
                  <div>
                    <div className={styles.fieldLabel}>기본 결제 방식</div>
                    <div className={styles.pillGroup}>
                      {(['선결제', '후불', '선결제 + 후불'] as PaymentTiming[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.paymentTiming === v ? styles.pillBtnOn : ''}`} onClick={() => set('paymentTiming', v)}>{v}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className={styles.fieldLabel}>결제 기준금액</div>
                    <div className={styles.pillGroup}>
                      {(['최종 주문금액', '청구 확정금액'] as PaymentBasis[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.paymentBasis === v ? styles.pillBtnOn : ''}`} onClick={() => set('paymentBasis', v)}>{v}</button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.cardGridFull}>
                    <div className={styles.fieldLabel}>결제 가능 시점 <span className={styles.fieldLabelHint}>주문 Lifecycle 단계 · 복수 선택</span></div>
                    <div className={styles.pillGroup}>
                      {PAYMENT_STAGES.map((s) => {
                        const on = draftPolicy.paymentAllowedStages.includes(s);
                        return (
                          <button key={s} type="button" className={`${styles.stageBtn} ${on ? styles.stageBtnOn : ''}`} onClick={() => toggleStage(s)}>
                            <span className={`${styles.stageCheck} ${on ? styles.stageCheckOn : ''}`}>{on ? '✓' : ''}</span>
                            <span className={`${styles.stageLabel} ${on ? styles.stageLabelOn : ''}`}>{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>결제 유효시간</div>
                <div className={styles.cardDesc}>결제 요청 후 완료까지 허용할 시간과 만료 이후 동작입니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.fieldLabel}>결제 세션 유효시간</div>
                    <div className={styles.ttlRow}>
                      <input type="number" min="0" className={styles.ttlInput} value={draftPolicy.sessionExpiryMinutes} onChange={(e) => set('sessionExpiryMinutes', Number(e.target.value))} />
                      <span className={styles.ttlUnit}>분</span>
                      <div className={styles.ttlPresets}>
                        {TTL_PRESETS.map((v) => {
                          const on = String(draftPolicy.sessionExpiryMinutes) === v;
                          return (
                            <button key={v} type="button" className={`${styles.presetBtn} ${on ? styles.presetBtnOn : ''}`} onClick={() => set('sessionExpiryMinutes', Number(v))}>{v}분</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className={styles.fieldLabel}>유효시간 만료 후</div>
                    <select value={draftPolicy.expiryAction} onChange={(e) => set('expiryAction', e.target.value as ExpiryAction)} className={styles.ttlInput} style={{ width: '100%' }}>
                      <option>재결제 가능</option>
                      <option>주문 자동 취소</option>
                      <option>관리자 확인 필요</option>
                    </select>
                  </div>
                </div>

                <div className={`${styles.toggleRow} ${styles.dividerTop}`}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.blockProcessingBeforePaid ? styles.switchOn : ''}`} onClick={() => set('blockProcessingBeforePaid', !draftPolicy.blockProcessingBeforePaid)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>결제 완료 전 주문 처리 차단</div>
                    <div className={styles.toggleRowDesc}>선결제 정책에서 결제 확인 전 처리 진행을 막습니다.</div>
                  </div>
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
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>결제 실패</div>
                <div className={styles.cardDesc}>결제 실패 시 주문 처리와, 사용자에게 재시도를 허용할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>실패 시 주문 상태</div>
                  <select value={draftPolicy.failureOrderAction} onChange={(e) => set('failureOrderAction', e.target.value as FailureOrderAction)} className={styles.textField} style={{ maxWidth: 260 }}>
                    <option>유지</option>
                    <option>결제 실패 상태로 전환</option>
                    <option>주문 취소</option>
                  </select>
                </div>

                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.retryAllowed ? styles.switchOn : ''}`} onClick={() => set('retryAllowed', !draftPolicy.retryAllowed)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>사용자 재시도 허용</div>
                  </div>
                </div>

                {draftPolicy.retryAllowed && (
                  <div className={styles.cardGrid}>
                    <div>
                      <div className={styles.fieldLabel}>최대 재시도</div>
                      <input type="number" min="1" className={styles.textField} value={draftPolicy.maxRetryCount} onChange={(e) => set('maxRetryCount', Number(e.target.value))} />
                    </div>
                    <div>
                      <div className={styles.fieldLabel}>재시도 제한시간 <span className={styles.fieldLabelHint}>분</span></div>
                      <input type="number" min="1" className={styles.textField} value={draftPolicy.retryLimitMinutes} onChange={(e) => set('retryLimitMinutes', Number(e.target.value))} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>결제 상태 재조회</div>
                <div className={styles.cardDesc}>내부 상태와 PG 상태가 어긋나는 경우 자동 동기화할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.autoRequery ? styles.switchOn : ''}`} onClick={() => set('autoRequery', !draftPolicy.autoRequery)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>결제 상태 자동 재조회</div>
                    <div className={styles.toggleRowDesc}>내부 상태와 PG 상태가 어긋나는 경우 자동 동기화합니다.</div>
                  </div>
                </div>
                {draftPolicy.autoRequery && (
                  <div>
                    <div className={styles.fieldLabel}>재조회 횟수</div>
                    <input type="number" min="1" className={styles.textField} style={{ width: 120 }} value={draftPolicy.requeryMaxCount} onChange={(e) => set('requeryMaxCount', Number(e.target.value))} />
                  </div>
                )}
                <div className={styles.lockedNote}>중복결제 방지는 시스템 필수 기능으로 항상 사용됩니다. (주문번호·결제대상금액·진행중 결제 여부를 자동 검증)</div>
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

        {tab === 'history' && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitle}>변경 이력</div>
              <div className={styles.cardDesc}>정책 및 결제수단 설정 변경 기록입니다.</div>
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

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
