import { useRef, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  INITIAL_POLICY,
  POLICY_HISTORY,
  TODAY,
  describeChanges,
  type EarnBasis,
  type EarnConfirmTiming,
  type ExpiredRestorePolicy,
  type PointPolicy,
  type PolicyHistoryEntry,
  type RoundingMode,
  type RoundingUnit,
  type UsagePriority,
  type WithdrawalPolicy,
} from './pointPolicyData';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={shared.filterBox} style={{ margin: '0 0 16px' }}>
      <div className={drawer.sectionTitle} style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#18181b' }}>{title}</div>
      {children}
    </div>
  );
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

  const historyRef = useRef<HTMLElement>(null);
  useOutsideClose(historyRef, () => setShowHistory(false));

  const set = <K extends keyof PointPolicy>(key: K, value: PointPolicy[K]) => setDraft((cur) => ({ ...cur, [key]: value }));

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
    setHistory((prev) => [{ id: `PH-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', reason: reason.trim() || '-', changes: confirmChanges }, ...prev]);
    setEditing(false);
    setConfirmChanges(null);
    setReason('');
    setToast('포인트 정책을 저장했습니다.');
    window.setTimeout(() => setToast(''), 2400);
  }

  const p = editing ? draft : policy;
  const disabled = !editing;

  return (
    <div className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <div className={shared.title}>포인트 정책</div>
            <div className={shared.subtitle}>포인트 적립, 사용, 소멸 및 거래 취소 시 처리 기준을 설정합니다.</div>
            <div style={{ fontSize: 11.5, color: '#a1a1aa', marginTop: -8, marginBottom: 12 }}>최종 수정 {policy.updatedAt} · {policy.updatedBy}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={shared.resetBtn} style={{ border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, color: '#3f3f46' }} onClick={() => setShowHistory(true)}>변경 이력</button>
            {editing ? (
              <>
                <button type="button" className={shared.resetBtn} style={{ border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, color: '#3f3f46' }} onClick={cancelEdit}>취소</button>
                <button type="button" className={shared.createBtn} onClick={requestSave}>저장</button>
              </>
            ) : (
              <button type="button" className={shared.createBtn} onClick={startEdit}>수정</button>
            )}
          </div>
        </div>
      </div>

      <div className={shared.gridWrap} style={{ maxWidth: 820 }}>
        <Section title="1. 적립 정책">
          <label className={drawer.checkRow} style={{ marginBottom: 12 }}>
            <input type="checkbox" disabled={disabled} checked={p.purchaseEarnEnabled} onChange={(e) => set('purchaseEarnEnabled', e.target.checked)} />
            구매 포인트 적립 사용
          </label>
          <div className={drawer.formRow} style={{ marginBottom: 10, opacity: p.purchaseEarnEnabled ? 1 : 0.4 }}>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>기본 적립률 (%)</span>
              <input className={drawer.formInput} type="number" min={0} max={100} disabled={disabled || !p.purchaseEarnEnabled} value={p.earnRate} onChange={(e) => set('earnRate', Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>적립 기준금액</span>
              <select className={drawer.formSelect} disabled={disabled || !p.purchaseEarnEnabled} value={p.earnBasis} onChange={(e) => set('earnBasis', e.target.value as EarnBasis)}>
                <option value="할인 전 상품금액">할인 전 상품금액</option>
                <option value="할인 적용 후 상품금액">할인 적용 후 상품금액</option>
                <option value="실제 결제금액">실제 결제금액</option>
              </select>
            </label>
          </div>
          <label className={drawer.checkRow} style={{ marginBottom: 8, opacity: p.purchaseEarnEnabled ? 1 : 0.4 }}>
            <input type="checkbox" disabled={disabled || !p.purchaseEarnEnabled} checked={p.excludePointUsedFromEarnBasis} onChange={(e) => set('excludePointUsedFromEarnBasis', e.target.checked)} />
            포인트 사용금액은 적립 대상에서 제외
          </label>
          <label className={drawer.checkRow} style={{ marginBottom: 12, opacity: p.purchaseEarnEnabled ? 1 : 0.4 }}>
            <input type="checkbox" disabled={disabled || !p.purchaseEarnEnabled} checked={p.includeShippingInEarnBasis} onChange={(e) => set('includeShippingInEarnBasis', e.target.checked)} />
            배송비를 적립 기준금액에 포함
          </label>

          <div className={drawer.formGroup}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>적립 확정 시점</span>
            <select className={drawer.formSelect} disabled={disabled} value={p.earnConfirmTiming} onChange={(e) => set('earnConfirmTiming', e.target.value as EarnConfirmTiming)}>
              <option value="결제 완료">결제 완료</option>
              <option value="배송 완료">배송 완료</option>
              <option value="구매 확정">구매 확정</option>
              <option value="배송 완료 후 N일">배송 완료 후 N일</option>
            </select>
          </div>
          {p.earnConfirmTiming === '배송 완료 후 N일' && (
            <div className={drawer.formGroup}>
              <span className={drawer.formLabel}>배송 완료 후 (일)</span>
              <input className={drawer.formInput} type="number" min={1} disabled={disabled} value={p.earnConfirmDays} onChange={(e) => set('earnConfirmDays', Math.max(1, Number(e.target.value) || 1))} />
            </div>
          )}
          <div className={drawer.formGroup} style={{ marginBottom: 0 }}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>확정 후 사용 가능</span>
            <div className={drawer.radioRow}>
              <label className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.immediateAfterConfirm} onChange={() => set('immediateAfterConfirm', true)} />즉시</label>
              <label className={drawer.radioOption}><input type="radio" disabled={disabled} checked={!p.immediateAfterConfirm} onChange={() => set('immediateAfterConfirm', false)} />N일 후</label>
            </div>
            {!p.immediateAfterConfirm && (
              <input className={drawer.formInput} style={{ marginTop: 8, maxWidth: 160 }} type="number" min={1} disabled={disabled} value={p.availableAfterConfirmDays} onChange={(e) => set('availableAfterConfirmDays', Math.max(1, Number(e.target.value) || 1))} />
            )}
          </div>
        </Section>

        <Section title="2. 사용 정책">
          <label className={drawer.checkRow} style={{ marginBottom: 12 }}>
            <input type="checkbox" disabled={disabled} checked={p.useEnabled} onChange={(e) => set('useEnabled', e.target.checked)} />
            포인트 사용 허용
          </label>
          <div className={drawer.formRow} style={{ marginBottom: 10, opacity: p.useEnabled ? 1 : 0.4 }}>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>최소 사용 포인트 (P)</span>
              <input className={drawer.formInput} type="number" min={0} disabled={disabled || !p.useEnabled} value={p.minUsePoint} onChange={(e) => set('minUsePoint', Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>사용 단위 (P)</span>
              <input className={drawer.formInput} type="number" min={1} disabled={disabled || !p.useEnabled} value={p.useUnit} onChange={(e) => set('useUnit', Math.max(1, Number(e.target.value) || 1))} />
            </label>
          </div>
          <div className={drawer.formRow} style={{ opacity: p.useEnabled ? 1 : 0.4 }}>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>주문당 최대 사용금액 (P)</span>
              <input className={drawer.formInput} type="number" min={0} disabled={disabled || !p.useEnabled} value={p.maxUseAmount} onChange={(e) => set('maxUseAmount', Math.max(0, Number(e.target.value) || 0))} placeholder="0 = 제한 없음" />
            </label>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>주문금액 대비 최대 사용 비율 (%)</span>
              <input className={drawer.formInput} type="number" min={0} max={100} disabled={disabled || !p.useEnabled} value={p.maxUseRatioPercent} onChange={(e) => set('maxUseRatioPercent', Math.max(0, Number(e.target.value) || 0))} placeholder="0 = 제한 없음" />
            </label>
          </div>
        </Section>

        <Section title="3. 소멸 정책">
          <div className={drawer.formGroup}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>포인트 유효기간</span>
            <div className={drawer.radioRow}>
              <label className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.validityType === '지급일로부터 N일'} onChange={() => set('validityType', '지급일로부터 N일')} />지급일로부터 N일</label>
              <label className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.validityType === '소멸 없음'} onChange={() => set('validityType', '소멸 없음')} />소멸 없음</label>
            </div>
            {p.validityType === '지급일로부터 N일' && (
              <input className={drawer.formInput} style={{ marginTop: 8, maxWidth: 160 }} type="number" min={1} disabled={disabled} value={p.validityDays} onChange={(e) => set('validityDays', Math.max(1, Number(e.target.value) || 1))} />
            )}
          </div>
          <div className={drawer.formGroup} style={{ marginBottom: 0 }}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>사용 우선순위</span>
            <div className={drawer.radioRow}>
              {(['소멸 예정일이 빠른 포인트부터', '지급일이 빠른 포인트부터'] as UsagePriority[]).map((v) => (
                <label key={v} className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.usagePriority === v} onChange={() => set('usagePriority', v)} />{v}</label>
              ))}
            </div>
          </div>
        </Section>

        <Section title="4. 취소 / 반품 정책">
          <div className={drawer.formRow} style={{ marginBottom: 10 }}>
            <label className={drawer.checkRow} style={{ flex: 1 }}>
              <input type="checkbox" disabled={disabled} checked={p.fullCancelRestoreUsed} onChange={(e) => set('fullCancelRestoreUsed', e.target.checked)} />
              전체 취소 시 사용 포인트 복원
            </label>
            <label className={drawer.checkRow} style={{ flex: 1 }}>
              <input type="checkbox" disabled={disabled} checked={p.fullCancelRevokeEarned} onChange={(e) => set('fullCancelRevokeEarned', e.target.checked)} />
              전체 취소 시 적립 포인트 회수
            </label>
          </div>
          <div className={drawer.formRow} style={{ marginBottom: 10 }}>
            <label className={drawer.checkRow} style={{ flex: 1 }}>
              <input type="checkbox" disabled={disabled} checked={p.fullReturnRestoreUsed} onChange={(e) => set('fullReturnRestoreUsed', e.target.checked)} />
              전체 반품 시 사용 포인트 복원
            </label>
            <label className={drawer.checkRow} style={{ flex: 1 }}>
              <input type="checkbox" disabled={disabled} checked={p.fullReturnRevokeEarned} onChange={(e) => set('fullReturnRevokeEarned', e.target.checked)} />
              전체 반품 시 적립 포인트 회수
            </label>
          </div>
          <label className={drawer.checkRow} style={{ marginBottom: 12 }}>
            <input type="checkbox" disabled={disabled} checked={p.partialCancelRecalculate} onChange={(e) => set('partialCancelRecalculate', e.target.checked)} />
            부분 취소 / 반품 시 잔여 주문 기준 적립 재계산
          </label>
          <div className={drawer.formGroup} style={{ marginBottom: 0 }}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>복원 시 원 유효기간이 이미 지난 포인트</span>
            <div className={drawer.radioRow}>
              {(['복원하지 않음', '원 만료일로 복원'] as ExpiredRestorePolicy[]).map((v) => (
                <label key={v} className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.expiredRestorePolicy === v} onChange={() => set('expiredRestorePolicy', v)} />{v}</label>
              ))}
            </div>
          </div>
          <div className={drawer.emptyInline} style={{ marginTop: 10 }}>ⓘ 부분 취소/반품 재계산 정책은 최종 환불금액에 영향을 줍니다. 사용한 포인트만큼의 금액은 현금으로 추가 환불되지 않습니다.</div>
        </Section>

        <Section title="5. 계산 정책">
          <div className={drawer.formRow} style={{ marginBottom: 10 }}>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>적립 계산 소수점 처리</span>
              <select className={drawer.formSelect} disabled={disabled} value={p.roundingMode} onChange={(e) => set('roundingMode', e.target.value as RoundingMode)}>
                <option value="버림">버림</option>
                <option value="반올림">반올림</option>
                <option value="올림">올림</option>
              </select>
            </label>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>절사 단위</span>
              <select className={drawer.formSelect} disabled={disabled} value={p.roundingUnit} onChange={(e) => set('roundingUnit', Number(e.target.value) as RoundingUnit)}>
                <option value={1}>1P</option>
                <option value={10}>10P</option>
                <option value={100}>100P</option>
              </select>
            </label>
          </div>
          <div className={drawer.emptyInline}>마이너스 포인트는 허용하지 않습니다 — 회수/차감은 보유 포인트 범위까지만 가능합니다.</div>
        </Section>

        <Section title="6. 정책 관리">
          <div className={drawer.formGroup} style={{ marginBottom: 0 }}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>회원 탈퇴 시 잔여 포인트</span>
            <div className={drawer.radioRow}>
              {(['전액 소멸', '유지'] as WithdrawalPolicy[]).map((v) => (
                <label key={v} className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.withdrawalPolicy === v} onChange={() => set('withdrawalPolicy', v)} />{v}</label>
              ))}
            </div>
          </div>
          <div className={drawer.emptyInline} style={{ marginTop: 10 }}>정책 변경 사항은 이후 생성되는 적립/사용 거래부터 적용됩니다. 기존 주문 및 포인트 내역은 변경되지 않습니다.</div>
        </Section>
      </div>

      {showHistory && (
        <aside ref={historyRef} className={drawer.aside} aria-label="포인트 정책 변경 이력">
          <div className={drawer.head}>
            <div className={drawer.headRow}>
              <div className={drawer.headBody}>
                <div className={drawer.eyebrow}>포인트 / 적립금 관리 · 포인트 정책</div>
                <div className={drawer.titleRow}><span className={drawer.title}>변경 이력</span></div>
              </div>
              <button type="button" className={drawer.closeBtn} onClick={() => setShowHistory(false)}>×</button>
            </div>
          </div>
          <div className={drawer.scroll}>
            {history.length === 0 ? (
              <div className={drawer.emptyInline}>변경 이력이 없습니다.</div>
            ) : (
              history.map((h) => (
                <div key={h.id} className={drawer.timelineItem}>
                  <div className={drawer.timelineDot} />
                  <div className={drawer.timelineBody}>
                    <div className={drawer.timelineRow}>
                      <span className={drawer.timelineTitle}>{h.by}</span>
                      <span className={drawer.timelineWhen}>{h.at}</span>
                    </div>
                    {h.changes.length === 0 ? (
                      <div className={drawer.timelineDetail}>{h.reason}</div>
                    ) : (
                      <>
                        {h.changes.map((c) => (
                          <div key={c.field} className={drawer.timelineDetail}>{c.field} · {c.before} → {c.after}</div>
                        ))}
                        <div className={drawer.timelineDetail} style={{ color: '#a1a1aa' }}>사유: {h.reason}</div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {confirmChanges && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmChanges(null); }}>
          <div className={shared.dialogBox}>
            <div className={shared.dialogTitle}>포인트 정책을 변경하시겠습니까?</div>
            <div className={shared.dialogSummary}>
              {confirmChanges.map((c) => (
                <div key={c.field} className={shared.dialogSummaryRow}><span>{c.field}</span><span>{c.before} → {c.after}</span></div>
              ))}
            </div>
            <div className={shared.dialogBody} style={{ marginBottom: 10 }}>변경 사항은 이후 생성되는 적립/사용 거래부터 적용됩니다. 기존 주문 및 포인트 내역은 변경되지 않습니다.</div>
            <input className={shared.searchInput} style={{ width: '100%', maxWidth: 'none', marginBottom: 16 }} placeholder="변경 사유" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className={shared.dialogActions}>
              <button type="button" className={shared.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirmChanges(null)}>취소</button>
              <button type="button" className={shared.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmSave}>변경 적용</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
