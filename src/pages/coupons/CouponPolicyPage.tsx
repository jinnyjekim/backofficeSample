import { useRef, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  INITIAL_POLICY,
  POLICY_HISTORY,
  TODAY,
  describeChanges,
  type AllocationMethod,
  type CouponPolicy,
  type MaxDiscountHandling,
  type MemberLimitBasis,
  type MinPurchaseBasis,
  type PolicyHistoryEntry,
  type RoundingMode,
  type RoundingUnit,
} from './couponPolicyData';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={shared.filterBox} style={{ margin: '0 0 16px' }}>
      <div className={drawer.sectionTitle} style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#18181b' }}>{title}</div>
      {children}
    </div>
  );
}

export function CouponPolicyPage() {
  const [policy, setPolicy] = useState<CouponPolicy>(INITIAL_POLICY);
  const [history, setHistory] = useState<PolicyHistoryEntry[]>(POLICY_HISTORY);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CouponPolicy>(INITIAL_POLICY);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmChanges, setConfirmChanges] = useState<ReturnType<typeof describeChanges> | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState('');

  const historyRef = useRef<HTMLElement>(null);
  useOutsideClose(historyRef, () => setShowHistory(false));

  const set = <K extends keyof CouponPolicy>(key: K, value: CouponPolicy[K]) => setDraft((cur) => ({ ...cur, [key]: value }));

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
    const updated: CouponPolicy = { ...draft, updatedAt: TODAY, updatedBy: 'admin01' };
    setPolicy(updated);
    setHistory((prev) => [{ id: `PH-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', reason: reason.trim() || '-', changes: confirmChanges }, ...prev]);
    setEditing(false);
    setConfirmChanges(null);
    setReason('');
    setToast('쿠폰 정책을 저장했습니다.');
    window.setTimeout(() => setToast(''), 2400);
  }

  function moveOrder(index: number, dir: -1 | 1) {
    const next = [...draft.discountOrder];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set('discountOrder', next);
  }

  const p = editing ? draft : policy;
  const disabled = !editing;

  return (
    <div className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <div className={shared.title}>쿠폰 정책</div>
            <div className={shared.subtitle}>서비스 전체 쿠폰의 사용, 중복 적용 및 취소/환불 처리 기준을 설정합니다.</div>
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
        <Section title="1. 사용 / 계산 정책 — 할인 적용 순서">
          {p.discountOrder.map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderBottom: i < p.discountOrder.length - 1 ? '1px solid rgba(0,0,0,.05)' : 'none' }}>
              <span style={{ fontSize: 11.5, color: '#a1a1aa', width: 16 }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, color: '#18181b', flex: 1 }}>{step}</span>
              {editing && (
                <>
                  <button type="button" disabled={i === 0} onClick={() => moveOrder(i, -1)} className={drawer.actionLink} style={{ height: 26, padding: '0 8px' }}>↑</button>
                  <button type="button" disabled={i === p.discountOrder.length - 1} onClick={() => moveOrder(i, 1)} className={drawer.actionLink} style={{ height: 26, padding: '0 8px' }}>↓</button>
                </>
              )}
            </div>
          ))}
          {editing && <div className={drawer.emptyInline} style={{ marginTop: 10 }}>⚠ 할인 적용 순서를 변경하면 향후 주문의 계산 결과가 달라질 수 있습니다. 기존 주문의 할인 내역에는 영향을 주지 않습니다.</div>}
        </Section>

        <Section title="2. 중복 사용 정책">
          <label className={drawer.checkRow} style={{ marginBottom: 12 }}>
            <input type="checkbox" disabled={disabled} checked={p.allowMultipleCoupons} onChange={(e) => set('allowMultipleCoupons', e.target.checked)} />
            한 주문에서 여러 쿠폰 사용 허용
          </label>
          <div className={drawer.formRow} style={{ marginBottom: 12, opacity: p.allowMultipleCoupons ? 1 : 0.4 }}>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>상품 쿠폰 최대 사용 (장)</span>
              <input className={drawer.formInput} type="number" min={1} disabled={disabled || !p.allowMultipleCoupons} value={p.maxProductCoupons} onChange={(e) => set('maxProductCoupons', Math.max(1, Number(e.target.value) || 1))} />
            </label>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>주문 쿠폰 최대 사용 (장)</span>
              <input className={drawer.formInput} type="number" min={1} disabled={disabled || !p.allowMultipleCoupons} value={p.maxOrderCoupons} onChange={(e) => set('maxOrderCoupons', Math.max(1, Number(e.target.value) || 1))} />
            </label>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>배송비 쿠폰 최대 사용 (장)</span>
              <input className={drawer.formInput} type="number" min={1} disabled={disabled || !p.allowMultipleCoupons} value={p.maxShippingCoupons} onChange={(e) => set('maxShippingCoupons', Math.max(1, Number(e.target.value) || 1))} />
            </label>
          </div>
          <label className={drawer.checkRow} style={{ marginBottom: 8 }}>
            <input type="checkbox" disabled={disabled} checked={p.allowSameCouponMultiple} onChange={(e) => set('allowSameCouponMultiple', e.target.checked)} />
            동일 쿠폰 여러 장 동시 사용 허용
          </label>
          <label className={drawer.checkRow} style={{ marginBottom: 8 }}>
            <input type="checkbox" disabled={disabled} checked={p.promotionStackDefault} onChange={(e) => set('promotionStackDefault', e.target.checked)} />
            프로모션과 쿠폰 중복 기본값 — 허용
          </label>
          <label className={drawer.checkRow}>
            <input type="checkbox" disabled={disabled} checked={p.pointStackAllowed} onChange={(e) => set('pointStackAllowed', e.target.checked)} />
            쿠폰 사용 주문에서 포인트 중복 사용 허용
          </label>
        </Section>

        <Section title="3. 구매금액 기준">
          <div className={drawer.formGroup}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>최소 구매금액 계산 기준</span>
            <div className={drawer.radioRow}>
              {(['쿠폰 적용 직전 금액', '최초 상품 판매금액'] as MinPurchaseBasis[]).map((v) => (
                <label key={v} className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.minPurchaseBasis === v} onChange={() => set('minPurchaseBasis', v)} />{v}</label>
              ))}
            </div>
          </div>
          <label className={drawer.checkRow}>
            <input type="checkbox" disabled={disabled} checked={p.includeShippingInMin} onChange={(e) => set('includeShippingInMin', e.target.checked)} />
            최소 구매금액 계산 시 배송비 포함
          </label>
        </Section>

        <Section title="4. 취소 / 환불 정책">
          <div className={drawer.formRow} style={{ marginBottom: 10 }}>
            <label className={drawer.checkRow} style={{ flex: 1 }}>
              <input type="checkbox" disabled={disabled} checked={p.fullCancelRestore} onChange={(e) => set('fullCancelRestore', e.target.checked)} />
              전체 취소 시 쿠폰 복원
            </label>
            <label className={drawer.checkRow} style={{ flex: 1 }}>
              <input type="checkbox" disabled={disabled} checked={p.fullRefundRestore} onChange={(e) => set('fullRefundRestore', e.target.checked)} />
              전체 반품 시 쿠폰 복원
            </label>
          </div>
          <div className={drawer.formRow}>
            <label className={drawer.checkRow} style={{ flex: 1 }}>
              <input type="checkbox" disabled={disabled} checked={p.partialCancelRecalculate} onChange={(e) => set('partialCancelRecalculate', e.target.checked)} />
              부분 취소 시 잔여 주문 기준 재계산
            </label>
            <label className={drawer.checkRow} style={{ flex: 1 }}>
              <input type="checkbox" disabled={disabled} checked={p.partialRefundRecalculate} onChange={(e) => set('partialRefundRecalculate', e.target.checked)} />
              부분 반품 시 잔여 주문 기준 재계산
            </label>
          </div>
          <div className={drawer.emptyInline} style={{ marginTop: 10 }}>ⓘ 부분 취소/반품 시 재계산 정책은 최종 환불금액에 영향을 줍니다. 쿠폰 할인금액은 현금으로 추가 환불되지 않습니다.</div>
        </Section>

        <Section title="5. 쿠폰 복원 정책">
          <label className={drawer.checkRow}>
            <input type="checkbox" disabled={disabled} checked={p.restoreExpiredCoupon} onChange={(e) => set('restoreExpiredCoupon', e.target.checked)} />
            원 유효기간이 이미 지난 쿠폰도 복원
          </label>
          <div className={drawer.emptyInline} style={{ marginTop: 8 }}>기본값은 미복원입니다 — 원 유효기간이 지난 쿠폰은 취소/환불이 발생해도 복원되지 않습니다.</div>
        </Section>

        <Section title="6. 발급 정책">
          <div className={drawer.formGroup}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>회원당 발급 한도 기준</span>
            <div className={drawer.radioRow}>
              {(['누적 발급 기준', '현재 보유 기준'] as MemberLimitBasis[]).map((v) => (
                <label key={v} className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.memberLimitBasis === v} onChange={() => set('memberLimitBasis', v)} />{v}</label>
              ))}
            </div>
          </div>
          <label className={drawer.checkRow}>
            <input type="checkbox" disabled={disabled} checked={p.blockOnLimitExceeded} onChange={(e) => set('blockOnLimitExceeded', e.target.checked)} />
            총 발급 한도 초과 시 발급 차단
          </label>
        </Section>

        <Section title="7. 금액 계산 정책">
          <div className={drawer.formRow} style={{ marginBottom: 10 }}>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>정률 할인 소수점 처리</span>
              <select className={drawer.formSelect} disabled={disabled} value={p.roundingMode} onChange={(e) => set('roundingMode', e.target.value as RoundingMode)}>
                <option value="버림">버림</option>
                <option value="반올림">반올림</option>
                <option value="올림">올림</option>
              </select>
            </label>
            <label className={drawer.formGroup} style={{ flex: 1, marginBottom: 0 }}>
              <span className={drawer.formLabel}>계산 단위</span>
              <select className={drawer.formSelect} disabled={disabled} value={p.roundingUnit} onChange={(e) => set('roundingUnit', Number(e.target.value) as RoundingUnit)}>
                <option value={1}>1원</option>
                <option value={10}>10원</option>
                <option value={100}>100원</option>
              </select>
            </label>
          </div>
          <div className={drawer.formGroup}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>할인금액이 결제 대상 금액을 초과하는 경우</span>
            <div className={drawer.radioRow}>
              {(['결제 대상 금액까지 할인', '쿠폰 사용 불가'] as MaxDiscountHandling[]).map((v) => (
                <label key={v} className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.maxDiscountHandling === v} onChange={() => set('maxDiscountHandling', v)} />{v}</label>
              ))}
            </div>
          </div>
          <div className={drawer.formGroup} style={{ marginBottom: 0 }}>
            <span className={drawer.formLabel} style={{ marginBottom: 6 }}>주문 쿠폰 할인금액 배분 방식</span>
            <div className={drawer.radioRow}>
              {(['상품 판매금액 비례', '상품 수량 비례'] as AllocationMethod[]).map((v) => (
                <label key={v} className={drawer.radioOption}><input type="radio" disabled={disabled} checked={p.allocationMethod === v} onChange={() => set('allocationMethod', v)} />{v}</label>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {showHistory && (
        <aside ref={historyRef} className={drawer.aside} aria-label="쿠폰 정책 변경 이력">
          <div className={drawer.head}>
            <div className={drawer.headRow}>
              <div className={drawer.headBody}>
                <div className={drawer.eyebrow}>쿠폰 관리 · 쿠폰 정책</div>
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
            <div className={shared.dialogTitle}>쿠폰 정책을 변경하시겠습니까?</div>
            <div className={shared.dialogSummary}>
              {confirmChanges.map((c) => (
                <div key={c.field} className={shared.dialogSummaryRow}><span>{c.field}</span><span>{c.before} → {c.after}</span></div>
              ))}
            </div>
            <div className={shared.dialogBody} style={{ marginBottom: 10 }}>변경 사항은 이후 생성되는 주문/쿠폰 사용부터 적용됩니다. 기존 주문 및 사용 이력은 변경되지 않습니다.</div>
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
