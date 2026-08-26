import { useMemo, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './ReturnExchangeFeePage.module.css';
import {
  INITIAL_HISTORY,
  INITIAL_POLICY,
  TEST_SCENARIOS,
  computeReturnExchangeFee,
  computeWarnings,
  customerExchangeFee,
  describePolicyChanges,
  fmtSigned,
  fmtWon,
  productReturnExceptions,
  sellerExchangeFee,
  type FieldDiff,
  type FreeShippingFullReturnPolicy,
  type PaymentMethod,
  type PolicyHistoryEntry,
  type RemoteAreaTreatment,
  type ReturnExchangeBasePolicy,
} from './returnExchangeFeeData';

type Tab = 'basic' | 'free' | 'remote' | 'exception' | 'preview' | 'history';
const TABS: [Tab, string][] = [
  ['basic', '기본 정책'],
  ['free', '무료배송 · 부분반품'],
  ['remote', '제주 · 도서산간'],
  ['exception', '상품별 예외'],
  ['preview', '계산 Preview'],
  ['history', '변경 이력'],
];

const TODAY = '2026-08-25';

export function ReturnExchangeFeePage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [scenarioId, setScenarioId] = useState(TEST_SCENARIOS[0].id);

  const warnings = useMemo(() => computeWarnings(editing ? draftPolicy : policy), [editing, draftPolicy, policy]);
  const exceptions = useMemo(() => productReturnExceptions(), []);

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof ReturnExchangeBasePolicy>(key: K, value: ReturnExchangeBasePolicy[K]) => setDraftPolicy((current) => ({ ...current, [key]: value }));

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
      at: `${TODAY} 15:00`,
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
    toastBriefly('반품/교환 배송비 정책을 저장했습니다.');
  };

  const scenario = TEST_SCENARIOS.find((s) => s.id === scenarioId)!;
  const preview = computeReturnExchangeFee(scenario, policy);

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>반품 / 교환 배송비</h1>
            <p className={shared.subtitle}>반품 및 교환 시 적용되는 배송비 기준을 관리합니다.</p>
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
                <div className={styles.summaryRow}><span>고객 귀책 반품비</span><strong>{fmtWon(policy.customerReturnFee)} (편도)</strong></div>
                <div className={styles.summaryRow}><span>판매자 귀책 반품비</span><strong>{fmtWon(policy.sellerReturnFee)}</strong></div>
                <div className={styles.summaryRow}><span>고객 귀책 교환비</span><strong>{fmtWon(customerExchangeFee(policy))} (왕복)</strong></div>
                <div className={styles.summaryRow}><span>판매자 귀책 교환비</span><strong>{fmtWon(sellerExchangeFee(policy))}</strong></div>
                <div className={styles.summaryRow}><span>배송비 납부 방식</span><strong>{policy.paymentMethod}</strong></div>
                <div className={styles.summaryRow}><span>적용 시작일</span><strong>{policy.startDate}</strong></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>고객 귀책</h3>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>반품 배송비 * (편도, 원)</span>
                  <input type="number" min={0} disabled={!editing} value={draftPolicy.customerReturnFee} onChange={(e) => set('customerReturnFee', Math.max(0, Number(e.target.value) || 0))} />
                </label>
                <label className={styles.formField}>
                  <span>교환 배송비 (왕복, 원)</span><small>반품 배송비 × 2로 자동 계산됩니다</small>
                  <input type="number" disabled value={customerExchangeFee(draftPolicy)} />
                </label>
              </div>
              <label className={styles.toggleField}>
                <span>전체 반품 시 최초 배송비 환불</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.firstFeeRefundCustomerFault ? styles.switchOn : ''}`} onClick={() => set('firstFeeRefundCustomerFault', !draftPolicy.firstFeeRefundCustomerFault)}><i /></button>
              </label>
            </div>

            <div className={styles.formSection}>
              <h3>판매자 귀책</h3>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>반품 배송비 (편도, 원)</span>
                  <input type="number" min={0} disabled={!editing} value={draftPolicy.sellerReturnFee} onChange={(e) => set('sellerReturnFee', Math.max(0, Number(e.target.value) || 0))} />
                </label>
                <label className={styles.formField}>
                  <span>교환 배송비 (왕복, 원)</span><small>반품 배송비 × 2로 자동 계산됩니다</small>
                  <input type="number" disabled value={sellerExchangeFee(draftPolicy)} />
                </label>
              </div>
              <label className={styles.toggleField}>
                <span>전체 반품 시 최초 배송비 환불</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.firstFeeRefundSellerFault ? styles.switchOn : ''}`} onClick={() => set('firstFeeRefundSellerFault', !draftPolicy.firstFeeRefundSellerFault)}><i /></button>
              </label>
            </div>

            <div className={styles.formSection}>
              <h3>배송비 납부 방식</h3>
              <div className={styles.radioGroup}>
                {(['환불금액에서 차감', '별도 결제'] as PaymentMethod[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.paymentMethod === v} onChange={() => set('paymentMethod', v)} />{v}</label>
                ))}
              </div>
              <div className={styles.infoNote}>실제 반품 배송비 납부 여부(선불 발송, 환불 차감 등)는 주문 관리 &gt; 환불 관리에서 건별로 기록합니다. 이 설정은 기본 납부 방식만 정의합니다.</div>
            </div>
          </>
        )}

        {tab === 'free' && (
          <>
            <div className={styles.formSection}>
              <h3>무료배송 주문 전체 반품/교환</h3>
              <label className={styles.formField}>
                <span>고객 귀책 전체 반품/교환 시</span>
                <div className={styles.radioGroup}>
                  {(['최초 배송비 + 반품 배송비 부과', '반품 배송비만 부과', '배송비 부과하지 않음'] as FreeShippingFullReturnPolicy[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.freeShippingFullReturnPolicy === v} onChange={() => set('freeShippingFullReturnPolicy', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <div className={styles.infoNote}>무료배송 주문을 전체 반품하면 판매자가 부담했던 최초 배송비를 회수하지 못합니다. 정책에 따라 최초 배송비를 반품 배송비와 함께 부과할 수 있습니다.</div>
            </div>
            <div className={styles.formSection}>
              <h3>부분 반품</h3>
              <label className={styles.toggleField}>
                <span>부분 반품 후 무료배송 조건 미충족 시 최초 배송비 재부과<small>남은 주문금액이 무료배송 기준 미만이 되는 경우</small></span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.partialReturnFreeShippingRecalc ? styles.switchOn : ''}`} onClick={() => set('partialReturnFreeShippingRecalc', !draftPolicy.partialReturnFreeShippingRecalc)}><i /></button>
              </label>
              <div className={styles.infoNote}>무료배송 기준 금액은 배송 정책 &gt; 기본 배송비 설정을 따릅니다.</div>
            </div>
          </>
        )}

        {tab === 'remote' && (
          <div className={styles.formSection}>
            <h3>제주 / 도서산간 지역 추가비</h3>
            <div className={styles.radioGroup}>
              {(['기본 정책 사용', '적용 안 함'] as RemoteAreaTreatment[]).map((v) => (
                <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.remoteAreaTreatment === v} onChange={() => set('remoteAreaTreatment', v)} />{v}</label>
              ))}
            </div>
            <div className={styles.infoNote}>
              제주/도서산간 지역 추가 배송비 금액은 배송 정책 &gt; 제주/도서산간 정책의 기본 정책을 그대로 사용합니다. 반품은 회수 시 1회, 교환은 회수·재배송 각각 부과됩니다.
            </div>
          </div>
        )}

        {tab === 'exception' && (
          <div className={styles.formSection}>
            <h3>상품별 반품 / 교환 배송비 예외 ({exceptions.length}개)</h3>
            {exceptions.length === 0 ? (
              <div className={styles.infoNote}>상품별 반품/교환 배송비 예외가 없습니다. 현재 모든 상품이 기본 정책을 사용합니다.</div>
            ) : (
              <div className={styles.exceptionTable}>
                <div className={styles.exceptionHead}><span>상품</span><span>반품비</span><span>교환비</span></div>
                {exceptions.map((row) => (
                  <div key={row.code} className={styles.exceptionRow}>
                    <span>{row.name} · {row.code}</span>
                    <span>{fmtWon(row.returnFeeOverride)}</span>
                    <span>{fmtWon(row.exchangeFeeOverride)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.infoNote}>상품별 예외는 배송 정책 &gt; 상품별 배송 정책에서 등록·수정합니다. 상품별 예외가 설정된 상품은 이 페이지의 기본 정책보다 항상 우선 적용됩니다.</div>
          </div>
        )}

        {tab === 'preview' && (
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>테스트 시나리오 선택</h3>
              <div className={styles.orderPick}>
                {TEST_SCENARIOS.map((s) => (
                  <button key={s.id} type="button" className={`${styles.orderOption} ${scenarioId === s.id ? styles.orderOptionActive : ''}`} onClick={() => setScenarioId(s.id)}>
                    <span><strong>{s.label}</strong> · {s.fault}</span>
                    <span>{s.region}</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 계산합니다.</div>
            </div>
            <div className={styles.previewCard}>
              <h3>배송비 계산 결과</h3>
              <div className={`${styles.resultHero} ${preview.total === 0 ? styles.resultHeroFree : ''}`}>
                <span>{scenario.label}</span>
                <strong>{preview.total > 0 ? fmtWon(preview.total) : '배송비 없음'}</strong>
              </div>
              <div className={styles.breakdownTable}>
                {preview.lines.map((line, i) => (
                  <div key={i} className={styles.breakdownRow}>
                    <div className={styles.breakdownMain}>
                      <span>{line.label}</span>
                      {line.note && <span className={styles.breakdownNote}>{line.note}</span>}
                    </div>
                    <span>{fmtSigned(line.amount)}</span>
                  </div>
                ))}
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                  <span>총 배송비</span>
                  <span>{fmtWon(preview.total)}</span>
                </div>
              </div>
              <div className={styles.resultRow}><span>적용 근거</span><strong>{preview.source}</strong></div>
              <div className={styles.resultRow}><span>최초 배송비 환불</span><strong>{preview.firstFeeRefundNote}</strong></div>
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
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmSave(null); }}>
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>반품 / 교환 배송비 정책 변경 확인</h2>
            <p className={shared.dialogBody}>변경 사항은 적용 시작일부터 신규 반품/교환 신청부터 적용됩니다. 이미 접수된 반품/교환의 배송비는 신청 시점 정책으로 유지됩니다.</p>
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
