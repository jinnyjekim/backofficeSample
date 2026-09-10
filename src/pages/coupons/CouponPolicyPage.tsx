import { useRef, useState, type ReactElement } from 'react';
import shared from './shared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './CouponPolicyPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { CommonBadge, CommonButton, CommonCheckbox, CommonDatePicker, CommonInput, CommonSortableList, CommonTabs, showToast } from '../../components/common';
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

type Tab = 'basic' | 'preview';
const TABS: [Tab, string][] = [
  ['basic', '기본 설정'],
  ['preview', '정책 Preview'],
];

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

const MIN_BASIS_OPTIONS: { value: MinPurchaseBasis; desc: string }[] = [
  { value: '쿠폰 적용 직전 금액', desc: '앞 단계 할인 반영' },
  { value: '최초 상품 판매금액', desc: '할인 전 원가 기준' },
];
const MEMBER_LIMIT_OPTIONS: { value: MemberLimitBasis; desc: string }[] = [
  { value: '누적 발급 기준', desc: '사용 · 소멸분도 포함' },
  { value: '현재 보유 기준', desc: '미사용분만 계산' },
];

function roundDiscount(amount: number, mode: RoundingMode, unit: RoundingUnit): number {
  if (unit <= 1) return Math.round(amount);
  if (mode === '버림') return Math.floor(amount / unit) * unit;
  if (mode === '올림') return Math.ceil(amount / unit) * unit;
  return Math.round(amount / unit) * unit;
}

export function CouponPolicyPage() {
  const [policy, setPolicy] = useState<CouponPolicy>(INITIAL_POLICY);
  const [history, setHistory] = useState<PolicyHistoryEntry[]>(POLICY_HISTORY);
  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CouponPolicy>(INITIAL_POLICY);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmChanges, setConfirmChanges] = useState<ReturnType<typeof describeChanges> | null>(null);
  const [reason, setReason] = useState('');
  const [previewAmount, setPreviewAmount] = useState(50000);
  const [previewRate, setPreviewRate] = useState(10);

  const historyRef = useRef<HTMLElement>(null);
  useOutsideClose(historyRef, () => setShowHistory(false));

  const set = <K extends keyof CouponPolicy>(key: K, value: CouponPolicy[K]) => {
    if (!editing) return;
    setDraft((cur) => ({ ...cur, [key]: value }));
  };

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
      showToast({ message: '변경된 쿠폰 정책이 없습니다.', type: 'info' });
      return;
    }
    setConfirmChanges(changes);
  }
  function confirmSave() {
    if (!confirmChanges) return;
    const updated: CouponPolicy = { ...draft, updatedAt: TODAY, updatedBy: '운영 관리자' };
    setPolicy(updated);
    setHistory((prev) => [{ id: `PH-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', reason: reason.trim() || '-', changes: confirmChanges }, ...prev]);
    setEditing(false);
    setConfirmChanges(null);
    setReason('');
    showToast({ message: '쿠폰 정책을 저장했습니다.', type: 'success' });
  }

  const p = editing ? draft : policy;
  const previewHasUnsavedChanges = editing && describeChanges(policy, draft).length > 0;

  const baseAmount = Math.max(0, previewAmount);
  const rawDiscount = Math.round(baseAmount * (previewRate / 100));
  const roundedDiscount = roundDiscount(rawDiscount, p.roundingMode, p.roundingUnit);
  const cappedDiscount = p.maxDiscountHandling === '쿠폰 사용 불가' && roundedDiscount > baseAmount ? 0 : Math.min(roundedDiscount, baseAmount);
  const payable = Math.max(0, baseAmount - cappedDiscount);
  const usableCount = p.allowMultipleCoupons ? p.maxProductCoupons + p.maxOrderCoupons + p.maxShippingCoupons : 1;

  const digest: [string, string][] = [
    ['적용 순서', `${p.discountOrder.slice(0, 3).join(' → ')}${p.discountOrder.length > 3 ? ' …' : ''}`],
    ['중복 사용', p.allowMultipleCoupons ? `상품 ${p.maxProductCoupons} · 주문 ${p.maxOrderCoupons} · 배송비 ${p.maxShippingCoupons}장` : '쿠폰 1장만'],
    ['프로모션 / 포인트', `${p.promotionStackDefault ? '프로모션 허용' : '프로모션 불허'} · ${p.pointStackAllowed ? '포인트 허용' : '포인트 불허'}`],
    ['구매금액 기준', `${p.minPurchaseBasis}${p.includeShippingInMin ? ' · 배송비 포함' : ''}`],
    ['취소 / 반품', '전체는 쿠폰 복원 · 부분은 잔여 재계산'],
    ['만료 쿠폰 복원', p.restoreExpiredCoupon ? '원 만료일로 복원' : '복원하지 않음'],
    ['발급 한도', `${p.memberLimitBasis}${p.blockOnLimitExceeded ? ' · 초과 시 차단' : ''}`],
    ['단수 처리', `${p.roundingMode} · ${p.roundingUnit}원`],
    ['적용 시작', p.startDate],
  ];

  /* ── 섹션 ──────────────────────────────────────────── */

  const sectionOrder = (
    <div className={styles.section} key="order">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>1</span>
          <span className={styles.sectionHeadTitle}>할인 적용 순서</span>
        </div>
        <div className={styles.sectionDescText}>위에서 아래로 순차 적용됩니다. 앞 단계의 결과 금액이 다음 단계의 기준이 됩니다.</div>
        <div className={styles.infoNote}>
          <span className={styles.infoNoteIcon}>i</span>
          <div className={styles.infoNoteText}>배송비 쿠폰은 상품금액과 무관하게 마지막에 적용됩니다.</div>
        </div>
      </div>
      <div className={styles.sectionControls}>
        <CommonSortableList
          items={p.discountOrder}
          direction="horizontal"
          numbered
          minItemWidth={150}
          disabled={!editing}
          onChange={(next) => set('discountOrder', next)}
        />
        {editing && <div className={styles.fieldNote}>항목을 드래그하거나, 선택 후 ← → 키로 순서를 바꿀 수 있습니다.</div>}
      </div>
    </div>
  );

  const sectionStack = (
    <div className={styles.section} key="stack">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>2</span>
          <span className={styles.sectionHeadTitle}>중복 사용</span>
          <CommonBadge type="success-light" size="sm">적용 중</CommonBadge>
        </div>
        <div className={styles.sectionDescText}>한 주문에서 쿠폰을 몇 장까지, 어떤 조합으로 쓸 수 있는지 정합니다.</div>
      </div>
      <div className={styles.sectionControls}>
        <div className={styles.optionRow}>
          <CommonButton type="button" variant="option" size="md" selected={p.allowMultipleCoupons} description="유형별 최대 장수까지 조합 사용" onClick={() => set('allowMultipleCoupons', true)}>여러 장 허용</CommonButton>
          <CommonButton type="button" variant="option" size="md" selected={!p.allowMultipleCoupons} description="한 주문에 쿠폰 1장으로 제한" onClick={() => set('allowMultipleCoupons', false)}>1장만 사용</CommonButton>
        </div>

        <div className={styles.fieldRow}>
          <div>
            <div className={styles.fieldLabel}>상품 쿠폰</div>
            <CommonInput.Number clearable={false} className={styles.fieldInput} min={1} suffix="장" aria-label="상품 쿠폰 최대 사용" disabled={!p.allowMultipleCoupons} value={p.maxProductCoupons} onChange={(e) => set('maxProductCoupons', Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div>
            <div className={styles.fieldLabel}>주문 쿠폰</div>
            <CommonInput.Number clearable={false} className={styles.fieldInput} min={1} suffix="장" aria-label="주문 쿠폰 최대 사용" disabled={!p.allowMultipleCoupons} value={p.maxOrderCoupons} onChange={(e) => set('maxOrderCoupons', Math.max(1, Number(e.target.value) || 1))} />
          </div>
          <div>
            <div className={styles.fieldLabel}>배송비 쿠폰</div>
            <CommonInput.Number clearable={false} className={styles.fieldInput} min={1} suffix="장" aria-label="배송비 쿠폰 최대 사용" disabled={!p.allowMultipleCoupons} value={p.maxShippingCoupons} onChange={(e) => set('maxShippingCoupons', Math.max(1, Number(e.target.value) || 1))} />
          </div>
        </div>

        <div className={styles.checkGrid}>
          <CommonCheckbox size="md" label="동일 쿠폰 여러 장" checked={p.allowSameCouponMultiple} onChange={(checked) => set('allowSameCouponMultiple', checked)} />
          <CommonCheckbox size="md" label="프로모션과 중복" checked={p.promotionStackDefault} onChange={(checked) => set('promotionStackDefault', checked)} />
          <CommonCheckbox size="md" label="포인트와 중복" checked={p.pointStackAllowed} onChange={(checked) => set('pointStackAllowed', checked)} />
        </div>
      </div>
    </div>
  );

  const sectionMinPurchase = (
    <div className={styles.section} key="min">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>3</span>
          <span className={styles.sectionHeadTitle}>구매금액 기준</span>
        </div>
        <div className={styles.sectionDescText}>쿠폰의 최소 구매금액 조건을 무엇으로 판정할지 정합니다.</div>
      </div>
      <div className={styles.sectionControls}>
        <div className={styles.fieldRow}>
          <div>
            <div className={styles.fieldLabel}>최소 구매금액 계산 기준</div>
            <div className={styles.optionCol}>
              {MIN_BASIS_OPTIONS.map((o) => (
                <CommonButton key={o.value} type="button" variant="option" size="md" selected={p.minPurchaseBasis === o.value} description={o.desc} onClick={() => set('minPurchaseBasis', o.value)}>{o.value}</CommonButton>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.fieldLabel}>포함 항목</div>
            <div className={styles.checkRow}>
              <CommonCheckbox size="md" label="배송비 포함" checked={p.includeShippingInMin} onChange={(checked) => set('includeShippingInMin', checked)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const sectionCancel = (
    <div className={styles.section} key="cancel">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>4</span>
          <span className={styles.sectionHeadTitle}>취소 · 반품 처리</span>
        </div>
        <div className={styles.sectionDescText}>거래가 되돌아갈 때 쿠폰을 복원할지, 잔여 주문 기준으로 재계산할지 조합으로 정합니다. 쿠폰 할인금액은 현금으로 추가 환불되지 않습니다.</div>
      </div>
      <div className={styles.sectionControls}>
        <div className={styles.tableWrap}>
          <div className={styles.tableScroll}>
            <div className={styles.tableInner}>
              <div className={styles.tableHead}>
                <span className={styles.tableHeadCell}>거래 유형</span>
                <span className={`${styles.tableHeadCell} ${styles.center}`}>쿠폰 복원</span>
                <span className={`${styles.tableHeadCell} ${styles.center}`}>잔여 재계산</span>
              </div>
              <div className={styles.tableRow}>
                <span className={styles.tableRowLabel}>전체 취소</span>
                <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="전체 취소 시 쿠폰 복원" checked={p.fullCancelRestore} onChange={(checked) => set('fullCancelRestore', checked)} /></span>
                <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="전체 취소 시 잔여 재계산" checked={false} disabled /></span>
              </div>
              <div className={styles.tableRow}>
                <span className={styles.tableRowLabel}>전체 반품</span>
                <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="전체 반품 시 쿠폰 복원" checked={p.fullRefundRestore} onChange={(checked) => set('fullRefundRestore', checked)} /></span>
                <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="전체 반품 시 잔여 재계산" checked={false} disabled /></span>
              </div>
              <div className={styles.tableRow}>
                <span className={styles.tableRowLabel}>부분 취소</span>
                <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="부분 취소 시 쿠폰 복원" checked={false} disabled /></span>
                <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="부분 취소 시 잔여 재계산" checked={p.partialCancelRecalculate} onChange={(checked) => set('partialCancelRecalculate', checked)} /></span>
              </div>
              <div className={styles.tableRow}>
                <span className={styles.tableRowLabel}>부분 반품</span>
                <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="부분 반품 시 쿠폰 복원" checked={false} disabled /></span>
                <span className={styles.tableCellCenter}><CommonCheckbox size="sm" aria-label="부분 반품 시 잔여 재계산" checked={p.partialRefundRecalculate} onChange={(checked) => set('partialRefundRecalculate', checked)} /></span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className={styles.fieldLabel}>복원 시 원 유효기간이 이미 지난 쿠폰</div>
          <div className={styles.pillRow}>
            {([false, true] as boolean[]).map((v) => (
              <CommonButton key={String(v)} type="button" variant={p.restoreExpiredCoupon === v ? 'emphasis' : 'secondary'} size="md" className={styles.pillItem} aria-pressed={p.restoreExpiredCoupon === v} onClick={() => set('restoreExpiredCoupon', v)}>
                {v ? '원 만료일로 복원' : '복원하지 않음'}
              </CommonButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const sectionIssue = (
    <div className={styles.section} key="issue">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>5</span>
          <span className={styles.sectionHeadTitle}>발급 정책</span>
        </div>
        <div className={styles.sectionDescText}>회원당 발급 한도를 무엇으로 셀지, 총 한도 초과 시 어떻게 할지 정합니다.</div>
      </div>
      <div className={styles.sectionControls}>
        <div className={styles.fieldRow}>
          <div>
            <div className={styles.fieldLabel}>회원당 발급 한도 기준</div>
            <div className={styles.optionCol}>
              {MEMBER_LIMIT_OPTIONS.map((o) => (
                <CommonButton key={o.value} type="button" variant="option" size="md" selected={p.memberLimitBasis === o.value} description={o.desc} onClick={() => set('memberLimitBasis', o.value)}>{o.value}</CommonButton>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.fieldLabel}>총 한도 초과 시</div>
            <div className={styles.checkRow}>
              <CommonCheckbox size="md" label="발급 차단" checked={p.blockOnLimitExceeded} onChange={(checked) => set('blockOnLimitExceeded', checked)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const sectionCalc = (
    <div className={styles.section} key="calc">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>6</span>
          <span className={styles.sectionHeadTitle}>계산 · 적용</span>
        </div>
        <div className={styles.sectionDescText}>정률 할인의 단수 처리, 초과 사용 처리, 주문 쿠폰의 상품별 배분 방식과 발효일입니다.</div>
      </div>
      <div className={styles.sectionControls}>
        <div className={styles.fieldRow}>
          <div>
            <div className={styles.fieldLabel}>소수점 처리</div>
            <div className={styles.pillRow}>
              {(['버림', '올림', '반올림'] as RoundingMode[]).map((v) => (
                <CommonButton key={v} type="button" variant={p.roundingMode === v ? 'emphasis' : 'secondary'} size="md" className={styles.pillItem} aria-pressed={p.roundingMode === v} onClick={() => set('roundingMode', v)}>{v}</CommonButton>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.fieldLabel}>계산 단위</div>
            <div className={styles.pillRow}>
              {([1, 10, 100] as RoundingUnit[]).map((v) => (
                <CommonButton key={v} type="button" variant={p.roundingUnit === v ? 'emphasis' : 'secondary'} size="md" className={styles.pillItem} aria-pressed={p.roundingUnit === v} onClick={() => set('roundingUnit', v)}>{v}원</CommonButton>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.fieldLabel}>적용 시작일</div>
            <CommonDatePicker size="md" className={styles.fieldInput} clearable={false} value={p.startDate} aria-label="적용 시작일" onChange={(value) => { if (!Array.isArray(value) && value) set('startDate', value); }} />
            <div className={styles.fieldNote}>이 날짜 이후 생성 거래부터</div>
          </div>
        </div>

        <div className={`${styles.fieldRow} ${styles.fieldRowTop}`}>
          <div>
            <div className={styles.fieldLabel}>할인금액이 결제 대상 금액을 초과할 때</div>
            <div className={styles.pillRow}>
              {(['결제 대상 금액까지 할인', '쿠폰 사용 불가'] as MaxDiscountHandling[]).map((v) => (
                <CommonButton key={v} type="button" variant={p.maxDiscountHandling === v ? 'emphasis' : 'secondary'} size="md" className={styles.pillItem} aria-pressed={p.maxDiscountHandling === v} onClick={() => set('maxDiscountHandling', v)}>{v === '결제 대상 금액까지 할인' ? '결제 대상 금액까지' : v}</CommonButton>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.fieldLabel}>주문 쿠폰 할인금액 배분</div>
            <div className={styles.pillRow}>
              {(['상품 판매금액 비례', '상품 수량 비례'] as AllocationMethod[]).map((v) => (
                <CommonButton key={v} type="button" variant={p.allocationMethod === v ? 'emphasis' : 'secondary'} size="md" className={styles.pillItem} aria-pressed={p.allocationMethod === v} onClick={() => set('allocationMethod', v)}>{v === '상품 판매금액 비례' ? '판매금액 비례' : '수량 비례'}</CommonButton>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const sectionsByTab: Record<Tab, ReactElement[]> = {
    basic: [sectionOrder, sectionStack, sectionMinPurchase, sectionCancel, sectionIssue, sectionCalc],
    preview: [],
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <div className={shared.title}>쿠폰 정책</div>
            <div className={shared.subtitle}>서비스 전체 쿠폰의 사용, 중복 적용, 발급 한도 및 취소/환불 처리 기준이 되는 전역 기본값입니다.</div>
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

      <CommonTabs
        className={styles.policyTabs}
        items={TABS.map(([key, label]) => ({ key, label }))}
        value={tab}
        onChange={(key) => setTab(key as Tab)}
        type="line"
        size="md"
      />

      {tab === 'preview' ? (
        <div className={styles.policyPreviewLayout}>
          <div className={styles.policyPreviewMain}>
            <section className={styles.previewDocumentCard}>
              <div className={styles.previewDocumentHead}>
                <div>
                  <div className={styles.previewDocumentTitle}>적용될 정책 전문</div>
                  <div className={styles.previewDocumentDesc}>현재 설정이 실제 주문에 어떻게 적용되는지 문장으로 확인합니다. 이 탭은 읽기 전용입니다.</div>
                </div>
                <span className={previewHasUnsavedChanges ? styles.previewDraftBadge : styles.previewLiveBadge}>{previewHasUnsavedChanges ? '미저장 초안' : '적용 중 · ' + p.startDate}</span>
              </div>
              <div className={styles.policySentenceList}>
                <div className={styles.policySentenceRow}>
                  <span className={styles.policySentenceNum}>1</span>
                  <div><strong>할인 적용 순서</strong><p>{p.discountOrder.join(' → ')} 순으로 적용되며, 앞 단계의 결과 금액이 다음 단계의 기준이 됩니다. 배송비 쿠폰은 마지막에 적용됩니다.</p></div>
                  <span className={styles.previewRowTag}>정상</span>
                </div>
                <div className={styles.policySentenceRow}>
                  <span className={styles.policySentenceNum}>2</span>
                  <div><strong>중복 사용</strong><p>{p.allowMultipleCoupons ? '한 주문에서 상품 쿠폰 ' + p.maxProductCoupons + '장, 주문 쿠폰 ' + p.maxOrderCoupons + '장, 배송비 쿠폰 ' + p.maxShippingCoupons + '장까지 조합해 사용할 수 있습니다.' : '한 주문에 쿠폰 1장만 사용할 수 있습니다.'} 동일 쿠폰 여러 장은 {p.allowSameCouponMultiple ? '허용' : '불허'}하며, 프로모션 중복은 {p.promotionStackDefault ? '허용' : '불허'}, 포인트 동시 사용은 {p.pointStackAllowed ? '허용' : '불허'}합니다.</p></div>
                  <span className={styles.previewRowTag}>{p.allowMultipleCoupons ? '중복 허용' : '1장 제한'}</span>
                </div>
                <div className={styles.policySentenceRow}>
                  <span className={styles.policySentenceNum}>3</span>
                  <div><strong>구매금액 기준</strong><p>쿠폰의 최소 구매금액은 {p.minPurchaseBasis}으로 판정하며, 배송비는 {p.includeShippingInMin ? '포함합니다.' : '제외합니다.'}</p></div>
                  <span className={styles.previewRowTag}>판정</span>
                </div>
                <div className={styles.policySentenceRow}>
                  <span className={styles.policySentenceNum}>4</span>
                  <div><strong>취소 · 반품 처리</strong><p>전체 취소·반품 시 사용한 쿠폰을 {p.fullCancelRestore && p.fullRefundRestore ? '복원하고' : '정책에 따라 처리하고'}, 부분 취소·반품 시 {p.partialCancelRecalculate && p.partialRefundRecalculate ? '잔여 주문 기준으로 재계산합니다.' : '기존 쿠폰 상태를 유지합니다.'} 복원 시 원 유효기간이 지난 쿠폰은 {p.restoreExpiredCoupon ? '원 만료일로 복원합니다.' : '복원하지 않습니다.'}</p></div>
                  <span className={styles.previewRowTag}>환불</span>
                </div>
                <div className={styles.policySentenceRow}>
                  <span className={styles.policySentenceNum}>5</span>
                  <div><strong>발급 정책</strong><p>회원당 발급 한도는 ‘{p.memberLimitBasis}’으로 계산하며, 총 한도를 초과하면 {p.blockOnLimitExceeded ? '발급을 차단합니다.' : '관리자 예외 발급을 허용합니다.'}</p></div>
                  <span className={styles.previewRowTag}>{p.blockOnLimitExceeded ? '차단' : '예외 허용'}</span>
                </div>
                <div className={styles.policySentenceRow}>
                  <span className={styles.policySentenceNum}>6</span>
                  <div><strong>계산 · 적용</strong><p>정률 할인은 {p.roundingUnit}원 단위로 {p.roundingMode} 처리하고, 할인금액이 결제 대상 금액을 초과하면 {p.maxDiscountHandling}합니다. 주문 쿠폰 할인금액은 {p.allocationMethod}로 배분되며, {p.startDate} 이후 생성된 거래부터 적용됩니다.</p></div>
                  <span className={styles.previewRowTag}>계산</span>
                </div>
              </div>
            </section>

            <section className={styles.previewOrderCard}>
              <div className={styles.previewOrderHead}>
                <div className={styles.previewDocumentTitle}>할인 적용 순서 판정</div>
                <div className={styles.previewDocumentDesc}>현재 순서대로 각 단계가 이전 금액을 기준으로 계산되는지 보여줍니다.</div>
              </div>
              <div className={styles.previewOrderTable}>
                <div className={styles.previewOrderRow + ' ' + styles.previewOrderTableHead}><span>순서</span><span>적용 단계</span><span>계산 기준</span><span>최대 장수</span></div>
                {p.discountOrder.map((stage, index) => {
                  const maxCount = stage === '상품 쿠폰' ? p.maxProductCoupons + '장' : stage === '주문 쿠폰' ? p.maxOrderCoupons + '장' : stage === '배송비 쿠폰' ? p.maxShippingCoupons + '장' : '해당 없음';
                  const basis = index === 0 ? '최초 상품 판매금액' : stage === '배송비 쿠폰' ? '배송비' : '이전 단계 결과 금액';
                  return (
                    <div className={styles.previewOrderRow} key={stage}>
                      <span>{index + 1}</span>
                      <strong>{stage}</strong>
                      <span>{basis}</span>
                      <span className={maxCount === '해당 없음' ? styles.previewCountMuted : styles.previewCountActive}>{maxCount}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className={styles.policyPreviewSide}>
            <div className={styles.sideCard}>
              <div className={styles.sideHead}><div className={styles.sideTitle}>고객 안내 문구</div><div className={styles.sideDesc}>설정에 따라 자동 생성되는 안내입니다</div></div>
              <div className={styles.customerMessageList}>
                <div><span>주문서 · 쿠폰 선택</span><p>이 주문에 최대 {usableCount}장까지 쿠폰을 함께 사용할 수 있습니다.</p></div>
                <div><span>무료 적용 시</span><p>최소 구매금액은 쿠폰 적용 직전 금액 기준으로 판정되며 배송비는 {p.includeShippingInMin ? '포함됩니다.' : '제외됩니다.'}</p></div>
                <div><span>취소 · 반품 안내</span><p>전체 취소 시 사용한 쿠폰이 {p.fullCancelRestore ? '복원되고' : '복원되지 않으며'}, 부분 취소 시 잔여 금액으로 {p.partialCancelRecalculate ? '재계산됩니다.' : '재계산되지 않습니다.'}</p></div>
              </div>
              <div className={previewHasUnsavedChanges ? styles.previewDeployPending : styles.previewDeployReady}><span>배포 가능 여부</span><strong>{previewHasUnsavedChanges ? '저장 필요' : '배포 가능'}</strong></div>
            </div>

            <div className={styles.sideCard}>
              <div className={styles.sideHead}><div className={styles.sideTitle}>전체 설정 요약</div></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>적용 순서</span><span className={styles.digestValue}>{p.discountOrder.slice(0, 4).join(' → ')}{p.discountOrder.length > 4 ? ' …' : ''}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>중복 사용</span><span className={styles.digestValue}>{p.allowMultipleCoupons ? '상품 ' + p.maxProductCoupons + ' · 주문 ' + p.maxOrderCoupons + ' · 배송비 ' + p.maxShippingCoupons + '장' : '1장만 사용'}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>프로모션 / 포인트</span><span className={styles.digestValue}>{p.promotionStackDefault ? '프로모션 허용' : '프로모션 불허'} · {p.pointStackAllowed ? '포인트 허용' : '포인트 불허'}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>구매금액 기준</span><span className={styles.digestValue}>{p.minPurchaseBasis}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>취소 / 반품</span><span className={styles.digestValue}>전체는 쿠폰 복원 · 부분은 잔여 재계산</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>만료 쿠폰 복원</span><span className={styles.digestValue}>{p.restoreExpiredCoupon ? '원 만료일로 복원' : '복원하지 않음'}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>발급 한도</span><span className={styles.digestValue}>{p.memberLimitBasis}{p.blockOnLimitExceeded ? ' · 초과 시 차단' : ''}</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>단수 처리</span><span className={styles.digestValue}>{p.roundingMode} · {p.roundingUnit}원</span></div>
              <div className={styles.digestRow}><span className={styles.digestLabel}>적용 시작</span><span className={styles.digestValue}>{p.startDate}</span></div>
              <div className={styles.sideFootNote}>저장 시 이 문서가 변경 이력에 스냅샷으로 함께 기록됩니다.</div>
            </div>
          </aside>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.main}>{sectionsByTab[tab]}</div>

          <div className={styles.sidebarOuter}>
            <div className={styles.sidebar}>
              <div className={styles.sideCard}>
                <div className={styles.sideHead}>
                  <div className={styles.sideTitle}>계산 미리보기</div>
                  <div className={styles.sideDesc}>현재 적용 순서와 설정값으로 즉시 계산됩니다</div>
                </div>
                <div className={styles.sideFields}>
                  <div className={styles.sideFieldRow}>
                    <span className={styles.sideFieldLabel}>상품금액</span>
                    <div className={styles.sideFieldControl}>
                      <CommonInput.Number clearable={false} className={styles.fieldInput} min={0} suffix="원" aria-label="미리보기 상품금액" value={previewAmount} onChange={(e) => setPreviewAmount(Math.max(0, Number(e.target.value) || 0))} />
                    </div>
                  </div>
                  <div className={styles.sideFieldRow}>
                    <span className={styles.sideFieldLabel}>주문 쿠폰 할인율</span>
                    <div className={styles.sideFieldControl}>
                      <CommonInput.Number clearable={false} className={styles.fieldInput} min={0} max={100} suffix="%" aria-label="미리보기 할인율" value={previewRate} onChange={(e) => setPreviewRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                    </div>
                  </div>
                </div>
                <div className={styles.sideBody}>
                  <div className={styles.sideLine}><span className={styles.sideLineLabel}>쿠폰 적용 직전 금액</span><span className={styles.sideLineValue}>{won(baseAmount)}</span></div>
                  <div className={styles.sideLine}><span className={styles.sideLineLabel}>할인율 {previewRate}% 계산</span><span className={styles.sideLineValue}>{won(rawDiscount)}</span></div>
                  <div className={styles.sideLine}><span className={styles.sideLineLabel}>단수 처리 ({p.roundingMode} · {p.roundingUnit}원)</span><span className={`${styles.sideLineValue} ${styles.sideLineValueNeg}`}>-{won(cappedDiscount)}</span></div>
                  <div className={styles.sideLine}><span className={styles.sideLineLabel}>배분 방식 ({p.allocationMethod})</span><span className={`${styles.sideLineValue} ${styles.sideLineValueMuted}`}>주문 쿠폰</span></div>
                </div>
                <div className={styles.sideTotalRow}>
                  <span className={styles.sideTotalLabel}>결제 예정금액</span>
                  <span className={styles.sideTotalValue}>{won(payable)}</span>
                </div>
                <div className={styles.scenarioBox}>
                  <div className={styles.scenarioBoxTitle}>이 주문에서 사용 가능</div>
                  <div className={styles.scenarioBoxRow}><span>동시 사용 가능 장수</span><strong>{usableCount}장</strong></div>
                  <div className={styles.scenarioBoxRow}><span>최소 구매금액 판정 기준</span><strong>{p.includeShippingInMin ? '배송비 포함' : '상품금액만'}</strong></div>
                  <div className={styles.scenarioBoxRow}><span>총 할인금액</span><strong className={styles.accent}>-{won(cappedDiscount)}</strong></div>
                </div>
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sideHead}>
                  <div className={styles.sideTitle}>현재 정책 요약</div>
                </div>
                {digest.map(([label, value]) => (
                  <div key={label} className={styles.digestRow}>
                    <span className={styles.digestLabel}>{label}</span>
                    <span className={styles.digestValue}>{value}</span>
                  </div>
                ))}
                <div className={styles.sideFootNote}>
                  개별 쿠폰의 발급 수량과 대상 상품은 <button type="button" className={styles.linkBtn} onClick={() => window.location.assign('/coupons/list')}>쿠폰 관리</button>에서, 프로모션 중복 조건은 프로모션 상세에서 관리합니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
