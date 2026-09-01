import { useMemo, useState } from 'react';
import { CommonSwitch } from '../../components/common';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './RefundPolicyPage.module.css';
import {
  INITIAL_HISTORY,
  INITIAL_LAST_MODIFIED,
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
  type LastModified,
  type PolicyHistoryEntry,
  type RefundCalcMode,
  type RefundCompletionBasis,
  type RefundMethodBasis,
  type RefundPeriodBasis,
  type RefundPolicy,
  type RefundReason,
  type RefundScope,
  type RefundType,
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

const REFUND_TYPES: RefundType[] = ['전체 환불', '부분 환불', '과입금 반환', '조정 환불'];

export function RefundPolicyPage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [methodRules, setMethodRules] = useState(INITIAL_METHOD_RULES);
  const [reasons, setReasons] = useState(INITIAL_REASONS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastModified, setLastModified] = useState<LastModified>(INITIAL_LAST_MODIFIED);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [draftMethodRules, setDraftMethodRules] = useState(methodRules);
  const [draftReasons, setDraftReasons] = useState(reasons);
  const [reasonSearch, setReasonSearch] = useState('');
  const [dragReasonId, setDragReasonId] = useState<string | null>(null);
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

  const set = <K extends keyof RefundPolicy>(key: K, value: RefundPolicy[K]) => {
    if (!editing) {
      setDraftPolicy({ ...policy, [key]: value });
      setDraftMethodRules(methodRules);
      setDraftReasons(reasons);
      setEditing(true);
      toastBriefly('환불 정책 수정 모드로 전환되었습니다.');
      return;
    }
    setDraftPolicy((current) => ({ ...current, [key]: value }));
  };

  const startEdit = () => {
    setDraftPolicy(policy);
    setDraftMethodRules(methodRules);
    setDraftReasons(reasons);
    setEditing(true);
    toastBriefly('환불 정책 수정 모드입니다. 변경 후 상단의 [변경 사항 저장]을 클릭하세요.');
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
    setDraftMethodRules(methodRules);
    setDraftReasons(reasons);
    toastBriefly('수정을 취소했습니다.');
  };
  const requestSave = () => {
    const diffs = [
      ...describePolicyChanges(policy, draftPolicy),
      ...describeMethodChanges(methodRules, draftMethodRules),
      ...describeReasonChanges(reasons, draftReasons),
    ];
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
    setMethodRules(draftMethodRules);
    setReasons(draftReasons);
    setHistory((current) => [...entries, ...current]);
    setLastModified({ at: '2026-08-31', by: '운영 관리자' });
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('환불 정책을 저장했습니다.');
  };

  const setMethod = (id: string, patch: Partial<{ active: boolean; pg: string | null }>) => {
    const currentRules = editing ? draftMethodRules : methodRules;
    const updated = currentRules.map((m) => (m.id === id ? { ...m, ...patch } : m));
    if (!editing) {
      setDraftPolicy(policy);
      setDraftMethodRules(updated);
      setDraftReasons(reasons);
      setEditing(true);
      toastBriefly('결제수단별 환불 설정이 수정 모드로 전환되었습니다.');
    } else {
      setDraftMethodRules(updated);
    }
  };

  const setReason2 = <K extends keyof RefundReason>(id: string, key: K, value: RefundReason[K]) => {
    const currentReasons = editing ? draftReasons : reasons;
    const updated = currentReasons.map((r) => (r.id === id ? { ...r, [key]: value } : r));
    if (!editing) {
      setDraftPolicy(policy);
      setDraftMethodRules(methodRules);
      setDraftReasons(updated);
      setEditing(true);
    } else {
      setDraftReasons(updated);
    }
  };
  const addReason = () => {
    const currentReasons = editing ? draftReasons : reasons;
    const nextOrder = Math.max(0, ...currentReasons.map((r) => r.order)) + 1;
    const draft: RefundReason = { id: `NEW-${Date.now()}`, label: '', type: '부분 환불', active: true, order: nextOrder, requiresDetail: false };
    if (!editing) {
      setDraftPolicy(policy);
      setDraftMethodRules(methodRules);
      setDraftReasons([...currentReasons, draft]);
      setEditing(true);
      toastBriefly('환불 사유가 추가되었습니다. 상단의 [변경 사항 저장]을 클릭하세요.');
    } else {
      setDraftReasons((current) => [...current, draft]);
    }
  };
  const removeReason = (id: string) => {
    const currentReasons = editing ? draftReasons : reasons;
    const updated = currentReasons.filter((r) => r.id !== id);
    if (!editing) {
      setDraftPolicy(policy);
      setDraftMethodRules(methodRules);
      setDraftReasons(updated);
      setEditing(true);
      toastBriefly('환불 사유가 삭제되었습니다. 상단의 [변경 사항 저장]을 클릭하세요.');
    } else {
      setDraftReasons(updated);
    }
  };
  const reorderReason = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const currentReasons = editing ? draftReasons : reasons;
    const ordered = currentReasons.slice().sort((a, b) => a.order - b.order);
    const from = ordered.findIndex((r) => r.id === draggedId);
    const to = ordered.findIndex((r) => r.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    const reindexed = new Map(ordered.map((r, i) => [r.id, i + 1]));
    const updated = currentReasons.map((r) => ({ ...r, order: reindexed.get(r.id)! }));
    if (!editing) {
      setDraftPolicy(policy);
      setDraftMethodRules(methodRules);
      setDraftReasons(updated);
      setEditing(true);
      toastBriefly('환불 사유 순서가 변경되었으며 수정 모드로 전환되었습니다.');
    } else {
      setDraftReasons(updated);
    }
  };

  const activeMethodRules = (editing ? draftMethodRules : methodRules).slice().sort((a, b) => a.order - b.order);
  const activeReasons = (editing ? draftReasons : reasons).slice().sort((a, b) => a.order - b.order);
  const visibleReasons = activeReasons.filter((r) => r.label.toLowerCase().includes(reasonSearch.trim().toLowerCase()));
  const exposedReasonCount = activeReasons.filter((r) => r.active).length;

  const previewOrder = TEST_ORDERS.find((o) => o.id === previewOrderId)!;
  const previewBreakdown = computeRefundBreakdown(previewOrder, previewScope, policy, methodRules);

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <h1 className={shared.title}>환불 정책</h1>
            <p className={shared.subtitle}>취소·반품 등으로 환불이 발생했을 때 환불 대상금액 계산 기준과 처리 방식을 설정합니다.</p>
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

        <div className={styles.viewTabs}>
          {TABS.map(([key, label]) => (
            <button key={key} type="button" className={`${styles.viewTabBtn} ${tab === key ? styles.viewTabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
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
            <button type="button" className={styles.warningActionBtn} onClick={() => setTab('methods')}>결제수단에서 확인</button>
          </div>
        )}

        {tab === 'basic' && (
          <>
            <div className={styles.summaryCard}>
              <h2>현재 정책 요약</h2>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>전체 환불</div><div className={styles.summaryTileValue}>{policy.fullRefundEnabled ? '허용' : '불가'}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>부분 환불</div><div className={styles.summaryTileValue}>{policy.partialRefundEnabled ? '허용' : '불가'}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>환불 처리 방식</div><div className={styles.summaryTileValue}>{policy.refundMethodBasis}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>환불 가능기간</div><div className={styles.summaryTileValue}>{policy.refundPeriodBasis === '제한 없음' ? '제한 없음' : `${policy.refundPeriodBasis} ${policy.refundPeriodDays}일`}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>환불 승인</div><div className={styles.summaryTileValue}>{policy.approvalRequired}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>환불 완료 기준</div><div className={styles.summaryTileValue}>{policy.refundCompletionBasis}</div></div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>환불 기능</div>
                <div className={styles.cardDesc}>전체·부분 환불을 허용할지와, 환불 처리 방식을 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div className={styles.toggleRow}>
                    <CommonSwitch checked={draftPolicy.fullRefundEnabled} onChange={(checked) => set('fullRefundEnabled', checked)} aria-label="전체 환불 허용" />
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>전체 환불 허용</div></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <CommonSwitch checked={draftPolicy.partialRefundEnabled} onChange={(checked) => set('partialRefundEnabled', checked)} aria-label="부분 환불 허용" />
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>부분 환불 허용</div></div>
                  </div>
                </div>
                <div className={styles.dividerTop}>
                  <div className={styles.fieldLabel}>환불 처리 방식</div>
                  <div className={styles.pillGroup}>
                    {(['원 결제수단 우선', '관리자 지정', '환불계좌 우선'] as RefundMethodBasis[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.refundMethodBasis === v ? styles.pillBtnOn : ''}`} onClick={() => set('refundMethodBasis', v)}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>환불 가능기간 · 처리</div>
                <div className={styles.cardDesc}>환불 요청 가능 기간과 처리 절차를 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>환불 가능기간 기준</div>
                  <div className={styles.pillGroup}>
                    {(['제한 없음', '거래 완료 후', '반품 완료 후'] as RefundPeriodBasis[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.refundPeriodBasis === v ? styles.pillBtnOn : ''}`} onClick={() => set('refundPeriodBasis', v)}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.cardGrid}>
                  {draftPolicy.refundPeriodBasis !== '제한 없음' && (
                    <div>
                      <div className={styles.fieldLabel}>기준일로부터 <span className={styles.fieldLabelHint}>일</span></div>
                      <input type="number" min={1} className={styles.textField} value={draftPolicy.refundPeriodDays} onChange={(e) => set('refundPeriodDays', Math.max(1, Number(e.target.value) || 1))} />
                    </div>
                  )}
                  <div>
                    <div className={styles.fieldLabel}>환불 처리기한 <span className={styles.fieldLabelHint}>승인 후 영업일</span></div>
                    <input type="number" min={0} className={styles.textField} value={draftPolicy.refundProcessingDays} onChange={(e) => set('refundProcessingDays', Math.max(0, Number(e.target.value) || 0))} />
                  </div>
                </div>

                <div>
                  <div className={styles.fieldLabel}>환불 완료 기준</div>
                  <div className={styles.pillGroup}>
                    {(['PG 취소 성공 시', '관리자 지급 처리 시', '은행 출금 확인 시'] as RefundCompletionBasis[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.refundCompletionBasis === v ? styles.pillBtnOn : ''}`} onClick={() => set('refundCompletionBasis', v)}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className={`${styles.toggleRow} ${styles.dividerTop}`}>
                  <CommonSwitch checked={draftPolicy.notifyOnRefundEvents} onChange={(checked) => set('notifyOnRefundEvents', checked)} aria-label="환불 이벤트 알림" />
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>환불 이벤트 알림</div>
                    <div className={styles.toggleRowDesc}>환불 접수·완료를 고객에게 안내합니다.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>환불금액 계산</div>
                <div className={styles.cardDesc}>환불 금액을 시스템이 자동으로 계산할지, 관리자가 직접 입력할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.pillGroup}>
                  {(['시스템 자동 계산', '관리자 직접 입력'] as RefundCalcMode[]).map((v) => (
                    <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.refundCalcMode === v ? styles.pillBtnOn : ''}`} onClick={() => set('refundCalcMode', v)}>{v}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>시스템 자동 계산을 기본으로 권장합니다. 계산 근거를 알 수 없는 임의 입력을 막기 위해, 별도 조정이 필요한 금액은 사유와 함께 조정 항목으로 남기는 것을 권장합니다.</div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 환불 요청부터 적용되며, 이미 생성된 환불 건에는 영향을 주지 않습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {tab === 'amount' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>환불금액 계산식</div>
                <div className={styles.cardDesc}>아래 설정이 각 항목에 그대로 반영됩니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formulaNote}>
                  <span>취소 상품금액</span><em>+</em><span>배송비 조정</span><em>±</em><span>할인 조정</span><em>=</em><span className={styles.formulaResult}>최종 환불금액</span>
                </div>
                <div className={styles.noteText}>계산 결과(Breakdown)와 적용 당시 정책은 환불 생성 시 Snapshot으로 보존되어, 이후 정책이 바뀌어도 과거 환불 금액은 다시 계산되지 않습니다.</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>배송비 처리</div>
                <div className={styles.cardDesc}>전체·부분 환불 시 배송비를 환불 대상에 포함할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.fieldLabel}>전체 환불 시 배송비</div>
                    <div className={styles.pillGroup}>
                      {(['배송비 반환', '배송비 미반환', '조건에 따라 계산'] as ShippingFullPolicy[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.shippingFullPolicy === v ? styles.pillBtnOn : ''}`} onClick={() => set('shippingFullPolicy', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>부분 환불 시 배송비</div>
                    <div className={styles.pillGroup}>
                      {(['잔여 주문 기준 재계산', '원 배송비 유지'] as ShippingPartialPolicy[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.shippingPartialPolicy === v ? styles.pillBtnOn : ''}`} onClick={() => set('shippingPartialPolicy', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={`${styles.toggleRow} ${styles.dividerTop}`}>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>무료배송 기준금액</div>
                    <div className={styles.toggleRowDesc}>부분환불 후 잔여 주문금액이 이 금액 미만이면 배송비를 재부과합니다.</div>
                  </div>
                  <div className={styles.inlineFieldValue}>
                    <input type="number" min={0} className={styles.textField} value={draftPolicy.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))} />
                    <span className={styles.ttlUnit}>원</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>할인 재계산</div>
                <div className={styles.cardDesc}>부분환불 시 할인을 재계산할지 정합니다. 실제 계산 Rule은 할인/프로모션 모듈을 따릅니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.pillGroup}>
                  {(['기존 할인 배분 기준', '잔여 주문 기준 재계산', '할인 정책에 위임'] as DiscountRecalcPolicy[]).map((v) => (
                    <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.discountRecalcPolicy === v ? styles.pillBtnOn : ''}`} onClick={() => set('discountRecalcPolicy', v)}>{v}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>승인</div>
                <div className={styles.cardDesc}>환불 처리에 관리자 승인이 필요한지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.fieldLabel}>승인 필요 범위</div>
                    <div className={styles.pillGroup}>
                      {(['사용 안 함', '조건부', '모든 환불'] as ApprovalRequirement[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.approvalRequired === v ? styles.pillBtnOn : ''}`} onClick={() => set('approvalRequired', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                  {draftPolicy.approvalRequired === '조건부' && (
                    <div>
                      <div className={styles.fieldLabel}>승인 필요 기준금액</div>
                      <div className={styles.ttlRow}>
                        <input type="number" min={0} className={styles.textField} style={{ width: 140 }} value={draftPolicy.approvalThresholdAmount} onChange={(e) => set('approvalThresholdAmount', Math.max(0, Number(e.target.value) || 0))} />
                        <span className={styles.ttlUnit}>원 초과 환불만 승인</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`${styles.toggleRow} ${styles.dividerTop}`}>
                  <CommonSwitch checked={draftPolicy.autoExecuteAfterApproval} onChange={(checked) => set('autoExecuteAfterApproval', checked)} aria-label="승인 후 자동 환불 실행" />
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>승인 후 자동 환불 실행</div>
                    <div className={styles.toggleRowDesc}>끄면 승인된 건도 운영자가 직접 환불을 실행해야 합니다.</div>
                  </div>
                </div>
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 환불 요청부터 적용되며, 이미 생성된 환불 건에는 영향을 주지 않습니다.</span>
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
                <div className={styles.cardTitle}>결제수단별 환불</div>
                <div className={styles.cardDesc}>결제수단별 기본 환불 처리 방식입니다. 카드 등 PG 자동 환불이 필요한 수단은 연동 PG가 설정되어 있어야 합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.methodList}>
                  <div className={`${styles.methodRow} ${styles.methodHead}`}><span>결제수단</span><span>기본 환불 방식</span><span>연동 PG</span><span>사용</span></div>
                  {activeMethodRules.map((m) => (
                    <div key={m.id} className={styles.methodRow}>
                      <span className={styles.methodName}>{m.name}</span>
                      <span className={styles.methodDim}>{m.defaultAction}</span>
                      {editing ? (
                        <select className={styles.textField} value={m.pg ?? '없음'} onChange={(e) => setMethod(m.id, { pg: e.target.value === '없음' ? null : e.target.value })}>
                          {PG_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                        </select>
                      ) : (
                        <span className={m.requiresPg && !m.pg ? styles.pgWarn : undefined}>{m.pg ?? '없음'}</span>
                      )}
                      <CommonSwitch checked={m.active} onChange={(checked) => setMethod(m.id, { active: checked })} aria-label={`${m.name} 사용`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>환불 실패 처리</div>
                <div className={styles.cardDesc}>환불 요청이 실패했을 때 재시도 여부를 정합니다. 동일 거래에 대한 중복 환불 방지는 항상 적용됩니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div className={styles.toggleRow}>
                    <CommonSwitch checked={draftPolicy.failureRetryEnabled} onChange={(checked) => set('failureRetryEnabled', checked)} aria-label="환불 실패 재시도 허용" />
                    <div className={styles.toggleRowText}>
                      <div className={styles.toggleRowTitle}>환불 실패 재시도 허용</div>
                      <div className={styles.toggleRowDesc}>운영자가 실패한 환불을 다시 요청할 수 있습니다.</div>
                    </div>
                  </div>
                  <div className={styles.toggleRow}>
                    <CommonSwitch checked={draftPolicy.autoRetryEnabled} onChange={(checked) => set('autoRetryEnabled', checked)} aria-label="자동 재시도" />
                    <div className={styles.toggleRowText}>
                      <div className={styles.toggleRowTitle}>자동 재시도</div>
                      <div className={styles.toggleRowDesc}>실패 시 시스템이 자동으로 재요청합니다.</div>
                    </div>
                  </div>
                </div>
                {draftPolicy.autoRetryEnabled && (
                  <div className={styles.dividerTop}>
                    <div className={styles.fieldLabel}>최대 자동 재시도</div>
                    <input type="number" min={1} className={styles.textField} style={{ maxWidth: 160 }} value={draftPolicy.maxRetryCount} onChange={(e) => set('maxRetryCount', Math.max(1, Number(e.target.value) || 1))} />
                  </div>
                )}
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 환불 요청부터 적용되며, 이미 생성된 환불 건에는 영향을 주지 않습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {tab === 'reasons' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardHeadRow}>
                  <div>
                    <div className={styles.cardTitle}>환불 사유 {activeReasons.length}개 · 노출 {exposedReasonCount}개</div>
                    <div className={styles.cardDesc}>유형을 지정하고, 고객·운영 화면 노출 여부를 관리합니다. '기타'처럼 자유 서술이 필요한 사유는 상세 입력을 필수로 두세요.</div>
                  </div>
                  <div className={styles.cardHeadActions}>
                    <input className={`${styles.textField} ${styles.searchInput}`} placeholder="사유명 검색" value={reasonSearch} onChange={(e) => setReasonSearch(e.target.value)} />
                    <button type="button" className={styles.darkBtn} onClick={addReason}>+ 사유 추가</button>
                  </div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.reasonList}>
                  <div className={`${styles.reasonRow} ${styles.reasonHead}`}><span /><span>사유명</span><span>환불 유형</span><span>상세 입력</span><span>노출</span><span /></div>
                  {visibleReasons.map((r) => (
                    <div
                      key={r.id}
                      className={`${styles.reasonRow} ${!r.active ? styles.reasonRowInactive : ''}`}
                      draggable
                      onDragStart={() => setDragReasonId(r.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragReasonId) reorderReason(dragReasonId, r.id); setDragReasonId(null); }}
                    >
                      <span className={styles.dragHandle}>☰</span>
                      <input className={styles.reasonLabelInput} value={r.label} placeholder="사유명 입력" onChange={(e) => setReason2(r.id, 'label', e.target.value)} />
                      <select className={styles.typeSelect} value={r.type} onChange={(e) => setReason2(r.id, 'type', e.target.value as RefundType)}>
                        {REFUND_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <button type="button" className={`${styles.detailPill} ${r.requiresDetail ? styles.detailPillOn : ''}`} onClick={() => setReason2(r.id, 'requiresDetail', !r.requiresDetail)}>{r.requiresDetail ? '필수' : '선택'}</button>
                      <CommonSwitch checked={r.active} onChange={(checked) => setReason2(r.id, 'active', checked)} aria-label={`${r.label} 노출`} />
                      <button type="button" className={styles.removeBtn} onClick={() => removeReason(r.id)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>순서는 드래그로 바꿀 수 있고, 저장 시 고객 화면 선택지 순서에 그대로 반영됩니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
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
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitle}>변경 이력</div>
              <div className={styles.cardDesc}>정책, 결제수단, 사유 설정 변경 기록입니다.</div>
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
