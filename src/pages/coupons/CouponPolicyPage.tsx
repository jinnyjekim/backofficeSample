import { useRef, useState, type DragEvent } from 'react';
import { GripVertical } from 'lucide-react';
import shared from './shared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './CouponPolicyPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { CommonButton, CommonCheckbox, CommonInput, CommonSelect, CommonSwitch, showToast } from '../../components/common';
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

function roundDiscount(amount: number, mode: RoundingMode, unit: RoundingUnit): number {
  if (unit <= 1) return Math.round(amount);
  if (mode === '버림') return Math.floor(amount / unit) * unit;
  if (mode === '올림') return Math.ceil(amount / unit) * unit;
  return Math.round(amount / unit) * unit;
}

function SectionDesc({ num, title, desc, note }: { num: number; title: string; desc: string; note?: string }) {
  return (
    <div className={styles.sectionDesc}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionNum}>{num}</span>
        <span className={styles.sectionHeadTitle}>{title}</span>
      </div>
      <div className={styles.sectionDescText}>{desc}</div>
      {note && (
        <div className={styles.infoNote}>
          <span className={styles.infoNoteIcon}>i</span>
          <div className={styles.infoNoteText}>{note}</div>
        </div>
      )}
    </div>
  );
}

function ChoiceCard({ title, caption, active, disabled, onClick }: { title: string; caption: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <CommonButton type="button" variant={active ? 'emphasis' : 'secondary'} size="md" disabled={disabled} aria-pressed={active} className={styles.choiceCard} onClick={onClick}>
      <span className={styles.choiceCardTitle}>{title}</span>
      <span className={styles.choiceCardCaption}>{caption}</span>
    </CommonButton>
  );
}

function PillBtn({ title, active, disabled, onClick }: { title: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <CommonButton type="button" variant={active ? 'emphasis' : 'secondary'} size="md" disabled={disabled} aria-pressed={active} className={styles.pillBtn2} onClick={onClick}>
      {title}
    </CommonButton>
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
  const [previewAmount, setPreviewAmount] = useState(50000);
  const [previewRate, setPreviewRate] = useState(10);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const historyRef = useRef<HTMLElement>(null);
  useOutsideClose(historyRef, () => setShowHistory(false));

  const set = <K extends keyof CouponPolicy>(key: K, value: CouponPolicy[K]) => setDraft((cur) => ({ ...cur, [key]: value }));

  function startEdit() {
    setDraft(policy);
    setDraggingIndex(null);
    setDragOverIndex(null);
    setEditing(true);
  }
  function cancelEdit() {
    setDraft(policy);
    setDraggingIndex(null);
    setDragOverIndex(null);
    setEditing(false);
  }
  function requestSave() {
    const changes = describeChanges(policy, draft);
    if (changes.length === 0) {
      setEditing(false);
      showToast({ message: '변경된 쿠폰 정책이 없습니다.', type: 'info' });
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
    setDraggingIndex(null);
    setDragOverIndex(null);
    setConfirmChanges(null);
    setReason('');
    showToast({ message: '쿠폰 정책을 저장했습니다.', type: 'success' });
  }

  function reorderDiscounts(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = [...draft.discountOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    set('discountOrder', next);
  }

  function startOrderDrag(event: DragEvent<HTMLDivElement>, index: number) {
    if (!editing) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    setDraggingIndex(index);
    setDragOverIndex(index);
  }

  function dropOrder(event: DragEvent<HTMLDivElement>, toIndex: number) {
    event.preventDefault();
    const transferredIndex = Number(event.dataTransfer.getData('text/plain'));
    const fromIndex = draggingIndex ?? (Number.isInteger(transferredIndex) ? transferredIndex : null);
    if (fromIndex !== null) reorderDiscounts(fromIndex, toIndex);
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  function endOrderDrag() {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  const p = editing ? draft : policy;
  const disabled = !editing;

  const baseAmount = Math.max(0, previewAmount);
  const rawDiscount = Math.round(baseAmount * (previewRate / 100));
  const roundedDiscount = roundDiscount(rawDiscount, p.roundingMode, p.roundingUnit);
  const cappedDiscount = p.maxDiscountHandling === '쿠폰 사용 불가' && roundedDiscount > baseAmount ? 0 : Math.min(roundedDiscount, baseAmount);
  const payable = Math.max(0, baseAmount - cappedDiscount);

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <div className={shared.title}>쿠폰 정책</div>
            <div className={shared.subtitle}>서비스 전체 쿠폰의 사용, 중복 적용 및 취소/환불 처리 기준을 설정합니다.</div>
          </div>
          <div className={styles.headMeta}>
            {!editing && <span className={styles.headMetaText}>최종 수정 {policy.updatedAt} · {policy.updatedBy}</span>}
            {!editing ? (
              <>
                <CommonButton type="button" variant="secondary" size="md" onClick={() => setShowHistory(true)}>변경 이력</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={startEdit}>수정</CommonButton>
              </>
            ) : (
              <>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>취소</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={requestSave}>저장</CommonButton>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={styles.summaryChips}>
        <span className={styles.summaryChip}><span className={styles.summaryChipLabel}>중복 사용</span><span className={`${styles.summaryChipValue} ${p.allowMultipleCoupons ? styles.positive : styles.negative}`}>{p.allowMultipleCoupons ? '허용' : '불허'}</span></span>
        <span className={styles.summaryChip}><span className={styles.summaryChipLabel}>상품/주문/배송</span><span className={styles.summaryChipValue}>{p.maxProductCoupons} · {p.maxOrderCoupons} · {p.maxShippingCoupons}장</span></span>
        <span className={styles.summaryChip}><span className={styles.summaryChipLabel}>구매금액 기준</span><span className={styles.summaryChipValue}>{p.minPurchaseBasis}</span></span>
        <span className={styles.summaryChip}><span className={styles.summaryChipLabel}>단수 처리</span><span className={styles.summaryChipValue}>{p.roundingMode} · {p.roundingUnit}원</span></span>
        <span className={styles.summaryChip}><span className={styles.summaryChipLabel}>만료 쿠폰 복원</span><span className={`${styles.summaryChipValue} ${p.restoreExpiredCoupon ? styles.positive : styles.negative}`}>{p.restoreExpiredCoupon ? '복원' : '미복원'}</span></span>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>

          <div className={styles.section}>
            <SectionDesc num={1} title="할인 적용 순서" desc="위에서 아래로 순차 적용됩니다. 앞 단계의 결과 금액이 다음 단계의 기준이 됩니다." note="배송비 쿠폰은 상품금액과 무관하게 마지막에 적용됩니다." />
            <div className={styles.sectionControls}>
              <div className={styles.orderGrid}>
                {p.discountOrder.map((step, i) => (
                  <div
                    key={step}
                    className={`${styles.orderItem} ${editing ? styles.orderItemEditable : ''} ${draggingIndex === i ? styles.orderItemDragging : ''} ${dragOverIndex === i && draggingIndex !== i ? styles.orderItemDropTarget : ''}`}
                    draggable={editing}
                    title={editing ? '드래그하여 할인 적용 순서를 변경하세요' : undefined}
                    onDragStart={(event) => startOrderDrag(event, i)}
                    onDragEnter={() => { if (draggingIndex !== null) setDragOverIndex(i); }}
                    onDragOver={(event) => { if (editing) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }}
                    onDrop={(event) => dropOrder(event, i)}
                    onDragEnd={endOrderDrag}
                  >
                    <GripVertical className={styles.dragHandle} size={15} aria-hidden="true" />
                    <span className={styles.orderItemNum}>{i + 1}</span>
                    <span className={styles.orderItemLabel}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionDesc}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionNum}>2</span>
                <span className={styles.sectionHeadTitle}>중복 사용 정책</span>
              </div>
              <div className={styles.sectionDescText}>한 주문에서 쿠폰을 몇 장까지, 어떤 조합으로 쓸 수 있는지 정합니다.</div>
              <CommonSwitch
                size="md"
                className={styles.policySwitch}
                disabled={disabled}
                checked={p.allowMultipleCoupons}
                label={p.allowMultipleCoupons ? '한 주문에서 여러 쿠폰 사용 허용' : '쿠폰 1장만 사용'}
                onChange={(checked) => set('allowMultipleCoupons', checked)}
              />
            </div>
            <div className={styles.sectionControls} style={{ opacity: p.allowMultipleCoupons ? 1 : 0.45 }}>
              <div className={styles.numberGrid2}>
                <div>
                  <div className={styles.numberFieldLabel}>상품 쿠폰 최대 사용</div>
                  <CommonInput.Number className={styles.numberInput} min={1} suffix="장" disabled={disabled || !p.allowMultipleCoupons} value={p.maxProductCoupons} onChange={(e) => set('maxProductCoupons', Math.max(1, Number(e.target.value) || 1))} />
                </div>
                <div>
                  <div className={styles.numberFieldLabel}>주문 쿠폰 최대 사용</div>
                  <CommonInput.Number className={styles.numberInput} min={1} suffix="장" disabled={disabled || !p.allowMultipleCoupons} value={p.maxOrderCoupons} onChange={(e) => set('maxOrderCoupons', Math.max(1, Number(e.target.value) || 1))} />
                </div>
                <div>
                  <div className={styles.numberFieldLabel}>배송비 쿠폰 최대 사용</div>
                  <CommonInput.Number className={styles.numberInput} min={1} suffix="장" disabled={disabled || !p.allowMultipleCoupons} value={p.maxShippingCoupons} onChange={(e) => set('maxShippingCoupons', Math.max(1, Number(e.target.value) || 1))} />
                </div>
              </div>
              <div className={styles.checkGrid}>
                <CommonCheckbox size="md" label="동일 쿠폰 여러 장 동시 사용 허용" checked={p.allowSameCouponMultiple} disabled={disabled} onChange={(checked) => set('allowSameCouponMultiple', checked)} />
                <CommonCheckbox size="md" label="프로모션과 쿠폰 중복 적용 허용" checked={p.promotionStackDefault} disabled={disabled} onChange={(checked) => set('promotionStackDefault', checked)} />
                <CommonCheckbox size="md" label="쿠폰 사용 주문에서 포인트 중복 사용 허용" checked={p.pointStackAllowed} disabled={disabled} onChange={(checked) => set('pointStackAllowed', checked)} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <SectionDesc num={3} title="구매금액 기준" desc="쿠폰의 최소 구매금액 조건을 무엇으로 판정할지 정합니다." />
            <div className={styles.sectionControls} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '15px 20px', alignItems: 'start' }}>
              <div>
                <span className={styles.selectLabel2}>최소 구매금액 계산 기준</span>
                <div className={styles.choiceGrid2col}>
                  {(['쿠폰 적용 직전 금액', '최초 상품 판매금액'] as MinPurchaseBasis[]).map((v) => (
                    <ChoiceCard key={v} title={v} caption={v === '쿠폰 적용 직전 금액' ? '앞 단계 할인 반영' : '할인 전 원가 기준'} active={p.minPurchaseBasis === v} disabled={disabled} onClick={() => set('minPurchaseBasis', v)} />
                  ))}
                </div>
              </div>
              <div>
                <span className={styles.selectLabel2}>포함 항목</span>
                <div className={styles.checkFullRow}>
                  <CommonCheckbox size="md" label="최소 구매금액 계산 시 배송비 포함" checked={p.includeShippingInMin} disabled={disabled} onChange={(checked) => set('includeShippingInMin', checked)} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <SectionDesc num={4} title="취소 / 환불 · 복원" desc="거래가 되돌아갈 때 쿠폰을 되돌려줄지, 잔여 주문을 다시 계산할지 조합으로 정합니다." note="부분 취소/반품 시 재계산 정책은 최종 환불금액에 영향을 줍니다. 쿠폰 할인금액은 현금으로 추가 환불되지 않습니다." />
            <div className={styles.sectionControls}>
              <div className={styles.tableWrap2}>
                <div className={styles.tableScroll}>
                  <div className={styles.tableInner}>
                    <div className={styles.tableHead2}>
                      <span className={styles.tableHeadCell}>거래 유형</span>
                      <span className={`${styles.tableHeadCell} ${styles.center}`}>쿠폰 복원</span>
                      <span className={`${styles.tableHeadCell} ${styles.center}`}>잔여 기준 재계산</span>
                    </div>
                    <div className={styles.tableRow2}>
                      <span className={styles.tableRowLabel}>전체 취소</span>
                      <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="전체 취소 시 쿠폰 복원" checked={p.fullCancelRestore} disabled={disabled} onChange={(checked) => set('fullCancelRestore', checked)} /></span>
                      <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="전체 취소 시 잔여 기준 재계산" checked={false} disabled /></span>
                    </div>
                    <div className={styles.tableRow2}>
                      <span className={styles.tableRowLabel}>전체 반품</span>
                      <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="전체 반품 시 쿠폰 복원" checked={p.fullRefundRestore} disabled={disabled} onChange={(checked) => set('fullRefundRestore', checked)} /></span>
                      <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="전체 반품 시 잔여 기준 재계산" checked={false} disabled /></span>
                    </div>
                    <div className={styles.tableRow2}>
                      <span className={styles.tableRowLabel}>부분 취소</span>
                      <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="부분 취소 시 쿠폰 복원" checked={false} disabled /></span>
                      <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="부분 취소 시 잔여 기준 재계산" checked={p.partialCancelRecalculate} disabled={disabled} onChange={(checked) => set('partialCancelRecalculate', checked)} /></span>
                    </div>
                    <div className={styles.tableRow2}>
                      <span className={styles.tableRowLabel}>부분 반품</span>
                      <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="부분 반품 시 쿠폰 복원" checked={false} disabled /></span>
                      <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="부분 반품 시 잔여 기준 재계산" checked={p.partialRefundRecalculate} disabled={disabled} onChange={(checked) => set('partialRefundRecalculate', checked)} /></span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className={styles.selectLabel2}>복원 시 원 유효기간이 이미 지난 쿠폰</div>
                <div className={styles.pillRow}>
                  <PillBtn title="복원하지 않음" active={!p.restoreExpiredCoupon} disabled={disabled} onClick={() => set('restoreExpiredCoupon', false)} />
                  <PillBtn title="원 만료일로 복원" active={p.restoreExpiredCoupon} disabled={disabled} onClick={() => set('restoreExpiredCoupon', true)} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <SectionDesc num={5} title="발급 정책" desc="회원당 발급 한도를 무엇으로 셀지, 총 한도 초과 시 어떻게 할지 정합니다." />
            <div className={styles.sectionControls} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '15px 20px', alignItems: 'start' }}>
              <div>
                <span className={styles.selectLabel2}>회원당 발급 한도 기준</span>
                <div className={styles.choiceGrid2col}>
                  {(['누적 발급 기준', '현재 보유 기준'] as MemberLimitBasis[]).map((v) => (
                    <ChoiceCard key={v} title={v} caption={v === '누적 발급 기준' ? '사용·소멸분도 포함' : '미사용분만 계산'} active={p.memberLimitBasis === v} disabled={disabled} onClick={() => set('memberLimitBasis', v)} />
                  ))}
                </div>
              </div>
              <div>
                <span className={styles.selectLabel2}>총 한도 초과 시</span>
                <div className={styles.checkFullRow}>
                  <CommonCheckbox size="md" label="발급 차단" checked={p.blockOnLimitExceeded} disabled={disabled} onChange={(checked) => set('blockOnLimitExceeded', checked)} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <SectionDesc num={6} title="금액 계산 정책" desc="정률 할인의 단수 처리, 초과 사용 처리, 주문 쿠폰의 상품별 배분 방식입니다." />
            <div className={styles.selectGrid2}>
              <div>
                <label className={styles.selectLabel2}>정률 할인 소수점 처리</label>
                <CommonSelect
                  size="md"
                  disabled={disabled}
                  value={p.roundingMode}
                  options={(['버림', '올림', '반올림'] as RoundingMode[]).map((value) => ({ value, label: value }))}
                  onChange={(value) => set('roundingMode', String(value) as RoundingMode)}
                />
              </div>
              <div>
                <label className={styles.selectLabel2}>계산 단위</label>
                <CommonSelect
                  size="md"
                  disabled={disabled}
                  value={String(p.roundingUnit)}
                  options={([1, 10, 100] as RoundingUnit[]).map((value) => ({ value: String(value), label: `${value}원` }))}
                  onChange={(value) => set('roundingUnit', Number(value) as RoundingUnit)}
                />
              </div>
              <div className={styles.selectFullRow}>
                <div>
                  <div className={styles.selectLabel2}>할인금액이 결제 대상 금액을 초과할 때</div>
                  <div className={styles.pillRow}>
                    {(['결제 대상 금액까지 할인', '쿠폰 사용 불가'] as MaxDiscountHandling[]).map((v) => (
                      <PillBtn key={v} title={v} active={p.maxDiscountHandling === v} disabled={disabled} onClick={() => set('maxDiscountHandling', v)} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className={styles.selectLabel2}>주문 쿠폰 할인금액 배분 방식</div>
                  <div className={styles.pillRow}>
                    {(['상품 판매금액 비례', '상품 수량 비례'] as AllocationMethod[]).map((v) => (
                      <PillBtn key={v} title={v} active={p.allocationMethod === v} disabled={disabled} onClick={() => set('allocationMethod', v)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className={styles.sidebarOuter}>
          <div className={styles.sidebar}>
            <div className={styles.sideCard2}>
              <div className={styles.previewHead}>
                <div className={styles.previewTitle}>적용 프리뷰</div>
                <div className={styles.previewDesc}>현재 적용 순서로 계산한 결과입니다.</div>
              </div>
              <div className={styles.previewInputsGrid}>
                <div>
                  <div className={styles.previewInputLabel}>상품금액</div>
                  <CommonInput.Number size="md" className={styles.previewInput} min={0} suffix="원" value={previewAmount} onChange={(e) => setPreviewAmount(Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div>
                  <div className={styles.previewInputLabel}>주문 쿠폰 할인율</div>
                  <CommonInput.Number size="md" className={styles.previewInput} min={0} max={100} suffix="%" value={previewRate} onChange={(e) => setPreviewRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                </div>
              </div>
              <div className={styles.previewBody}>
                <div className={styles.previewLine}><span className={styles.previewLineLabel}>상품금액</span><span className={`${styles.previewLineValue} ${styles.strong}`}>{baseAmount.toLocaleString('ko-KR')}원</span></div>
                <div className={styles.previewLine}><span className={styles.previewLineLabel}>쿠폰 적용 기준금액</span><span className={`${styles.previewLineValue} ${styles.strong}`}>{baseAmount.toLocaleString('ko-KR')}원</span></div>
                <div className={styles.previewLine}><span className={styles.previewLineLabel}>할인율 {previewRate}% 계산</span><span className={styles.previewLineValue}>{rawDiscount.toLocaleString('ko-KR')}원</span></div>
                <div className={styles.previewLine}><span className={styles.previewLineLabel}>단수 처리 ({p.roundingMode} · {p.roundingUnit}원)</span><span className={`${styles.previewLineValue} ${styles.neg}`}>-{cappedDiscount.toLocaleString('ko-KR')}원</span></div>
                <div className={styles.previewLine}><span className={styles.previewLineLabel}>배분 방식</span><span className={styles.previewLineValue}>{p.allocationMethod}</span></div>
              </div>
              <div className={styles.previewFooter}>
                <span className={styles.previewFooterLabel}>결제 예정금액</span>
                <span className={styles.previewFooterValue}>{payable.toLocaleString('ko-KR')}원</span>
              </div>
            </div>

            <div className={styles.sideCard2}>
              <div className={styles.digestHead}>정책 요약</div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>적용 순서</span><span className={styles.digestValue}>{p.discountOrder.slice(0, 3).join(' → ')}{p.discountOrder.length > 3 ? ' …' : ''}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>중복 사용</span><span className={styles.digestValue}>{p.allowMultipleCoupons ? `상품 ${p.maxProductCoupons} · 주문 ${p.maxOrderCoupons} · 배송비 ${p.maxShippingCoupons}장` : '쿠폰 1장만'}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>프로모션 중복</span><span className={styles.digestValue}>{p.promotionStackDefault ? '허용' : '불허'}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>포인트 중복</span><span className={styles.digestValue}>{p.pointStackAllowed ? '허용' : '불허'}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>구매금액 기준</span><span className={styles.digestValue}>{p.minPurchaseBasis}{p.includeShippingInMin ? ' · 배송비 포함' : ''}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>취소 / 반품</span><span className={styles.digestValue}>전체는 쿠폰 복원 · 부분은 잔여 기준 재계산</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>발급 한도</span><span className={styles.digestValue}>{p.memberLimitBasis}{p.blockOnLimitExceeded ? ' · 초과 시 차단' : ''}</span></div>
            </div>

            <div className={styles.sideCard2}>
              <div className={styles.histHead}>
                <span className={styles.histHeadTitle}>최근 변경</span>
                <CommonButton type="button" variant="none" size="sm" className={styles.histLink} onClick={() => setShowHistory(true)}>전체 보기</CommonButton>
              </div>
              {history.slice(0, 3).map((h) => (
                <div key={h.id} className={styles.histItem}>
                  <div className={styles.histMeta}>
                    <span className={styles.histDate}>{h.at.slice(0, 10)}</span>
                    <span className={styles.histWho}>{h.by}</span>
                  </div>
                  <div className={styles.histWhat}>{h.changes.length ? `${h.changes[0].field}을(를) ${h.changes[0].before} → ${h.changes[0].after}로 변경` : h.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showHistory && (
        <aside ref={historyRef} className={drawer.aside} aria-label="쿠폰 정책 변경 이력">
          <div className={drawer.head}>
            <div className={drawer.headRow}>
              <div className={drawer.headBody}>
                <div className={drawer.eyebrow}>쿠폰 관리 · 쿠폰 정책</div>
                <div className={drawer.titleRow}><span className={drawer.title}>변경 이력</span></div>
              </div>
              <CommonButton type="button" variant="none" size="sm" className={drawer.closeBtn} aria-label="변경 이력 닫기" onClick={() => setShowHistory(false)}>×</CommonButton>
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
            <CommonInput size="md" className={styles.reasonInput} placeholder="변경 사유" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className={shared.dialogActions}>
              <CommonButton type="button" variant="secondary" size="md" className={shared.dialogBtn} onClick={() => setConfirmChanges(null)}>취소</CommonButton>
              <CommonButton type="button" variant="primary" size="md" className={shared.dialogBtn} onClick={confirmSave}>변경 적용</CommonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
