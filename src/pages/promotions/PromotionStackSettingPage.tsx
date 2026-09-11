import { useState, useMemo } from 'react';
import styles from '../delivery/deliveryShared.module.css';
import { CommonButton, showToast } from '../../components/common';
import {
  DEFAULT_STACK_POLICY,
  type StackCombinationMode,
  type StackDiscountPolicy,
  type StackDiscountStep,
} from './promotionsData';

export function PromotionStackSettingPage() {
  const [policy, setPolicy] = useState<StackDiscountPolicy>(DEFAULT_STACK_POLICY);
  const [hasChanges, setHasChanges] = useState(false);

  // 시뮬레이션 계산기 상태
  const [simProductPrice, setSimProductPrice] = useState(100000);
  const [simProductDiscountRate, setSimProductDiscountRate] = useState(15);
  const [simMemberTier, setSimMemberTier] = useState<'NONE' | 'VIP' | 'VVIP'>('VIP');
  const [simCartDiscount, setSimCartDiscount] = useState(5000);
  const [simCouponDiscount, setSimCouponDiscount] = useState(3000);

  // 모드 변경
  const handleModeChange = (mode: StackCombinationMode) => {
    setPolicy((prev) => ({ ...prev, combinationMode: mode }));
    setHasChanges(true);
  };

  // 단계 토글
  const toggleStep = (id: StackDiscountStep['id']) => {
    setPolicy((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
    setHasChanges(true);
  };

  // 한도 변경
  const handleRateLimitChange = (val: number) => {
    setPolicy((prev) => ({ ...prev, maxDiscountRateLimit: val }));
    setHasChanges(true);
  };

  const handleAmountLimitChange = (val: number) => {
    setPolicy((prev) => ({ ...prev, maxDiscountAmountLimit: val }));
    setHasChanges(true);
  };

  const handleCouponToggle = (val: boolean) => {
    setPolicy((prev) => ({ ...prev, allowCouponOverlap: val }));
    setHasChanges(true);
  };

  // 저장
  const handleSave = () => {
    setPolicy((prev) => ({
      ...prev,
      updatedAt: '2026-09-11 11:45',
      updatedBy: 'admin01',
    }));
    setHasChanges(false);
    showToast({
      message: '중복 할인 정책이 성공적으로 저장되었습니다. 신규 주문부터 즉시 적용됩니다.',
      type: 'success',
    });
  };

  // 초기화
  const handleReset = () => {
    setPolicy(DEFAULT_STACK_POLICY);
    setHasChanges(false);
    showToast({
      message: '중복 할인 정책을 기본 권장 설정으로 초기화했습니다.',
      type: 'info',
    });
  };

  // 시뮬레이션 계산 로직
  const simulation = useMemo(() => {
    const original = simProductPrice;
    let current = original;

    let productDisc = 0;
    let memberDisc = 0;
    let cartDisc = 0;
    let couponDisc = 0;

    const memberRate = simMemberTier === 'VVIP' ? 0.07 : simMemberTier === 'VIP' ? 0.05 : 0;

    if (policy.combinationMode === 'MAX_ONE') {
      // 가장 큰 할인 1건만 선택
      const candidateProduct = (original * simProductDiscountRate) / 100;
      const candidateMember = original * memberRate;
      const candidateCart = simCartDiscount;
      const candidateCoupon = policy.allowCouponOverlap ? simCouponDiscount : 0;

      const maxVal = Math.max(candidateProduct, candidateMember, candidateCart);
      if (maxVal === candidateProduct) productDisc = candidateProduct;
      else if (maxVal === candidateMember) memberDisc = candidateMember;
      else cartDisc = candidateCart;

      // 쿠폰 허용 시 쿠폰 별도 적용
      couponDisc = candidateCoupon;
      current = Math.max(policy.minFinalPayAmount, original - maxVal - couponDisc);
    } else if (policy.combinationMode === 'CONDITIONAL') {
      // 단계별 순차 적용
      // 1. 상품 할인
      const stepProduct = policy.steps.find((s) => s.id === 'product');
      if (stepProduct?.enabled) {
        productDisc = (current * simProductDiscountRate) / 100;
        current -= productDisc;
      }
      // 2. 회원 할인
      const stepMember = policy.steps.find((s) => s.id === 'member');
      if (stepMember?.enabled && memberRate > 0) {
        memberDisc = current * memberRate;
        current -= memberDisc;
      }
      // 3. 장바구니 할인
      const stepCart = policy.steps.find((s) => s.id === 'cart');
      if (stepCart?.enabled) {
        cartDisc = Math.min(current, simCartDiscount);
        current -= cartDisc;
      }
      // 4. 쿠폰 할인
      if (policy.allowCouponOverlap) {
        const stepCoupon = policy.steps.find((s) => s.id === 'coupon');
        if (stepCoupon?.enabled) {
          couponDisc = Math.min(current, simCouponDiscount);
          current -= couponDisc;
        }
      }
    } else {
      // 전부 적용 (누적 합산)
      productDisc = (original * simProductDiscountRate) / 100;
      memberDisc = original * memberRate;
      cartDisc = simCartDiscount;
      couponDisc = policy.allowCouponOverlap ? simCouponDiscount : 0;
    }

    let totalRawDiscount = productDisc + memberDisc + cartDisc + couponDisc;

    // 안전장치 한도 적용
    const maxAllowedByRate = (original * policy.maxDiscountRateLimit) / 100;
    const maxAllowedByAmount = policy.maxDiscountAmountLimit;
    const effectiveMaxLimit = Math.min(maxAllowedByRate, maxAllowedByAmount);

    const isCapped = totalRawDiscount > effectiveMaxLimit;
    const finalDiscount = Math.min(totalRawDiscount, effectiveMaxLimit);
    const finalPay = Math.max(policy.minFinalPayAmount, original - finalDiscount);
    const effectiveDiscountRate = original > 0 ? ((finalDiscount / original) * 100).toFixed(1) : '0';

    return {
      original,
      productDisc,
      memberDisc,
      cartDisc,
      couponDisc,
      totalRawDiscount,
      finalDiscount,
      finalPay,
      effectiveDiscountRate,
      isCapped,
      effectiveMaxLimit,
    };
  }, [
    policy,
    simProductPrice,
    simProductDiscountRate,
    simMemberTier,
    simCartDiscount,
    simCouponDiscount,
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>중복 할인 설정</div>
            <div className={styles.subtitle}>
              상품 할인, 회원 할인, 장바구니 할인 및 쿠폰이 한 주문에 동시에 적용될 때의 중복 규칙과 마진 보호 안전장치를 관리합니다.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <CommonButton variant="secondary" size="md" onClick={handleReset}>
              기본값 초기화
            </CommonButton>
            <CommonButton
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              설정 저장 {hasChanges && '●'}
            </CommonButton>
          </div>
        </div>
      </header>

      <div style={{ padding: '0 24px 36px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        {/* 좌측: 정책 설정 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 카드 1: 동시 적용 모드 */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: '#18181b' }}>
              1. 복수 할인 동시 적용 규칙
            </div>
            <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '16px' }}>
              한 주문에 2개 이상의 프로모션(상품, 회원, 장바구니) 혜택 대상이 겹칠 때의 처리 방식을 정합니다.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '9px',
                  border: `1.5px solid ${policy.combinationMode === 'CONDITIONAL' ? 'var(--accent, #2563eb)' : '#e4e4e7'}`,
                  background: policy.combinationMode === 'CONDITIONAL' ? '#eff6ff' : '#fafafa',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="comboMode"
                  checked={policy.combinationMode === 'CONDITIONAL'}
                  onChange={() => handleModeChange('CONDITIONAL')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#18181b' }}>
                    조건부 순차 적용 <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, marginLeft: '6px' }}>(추천)</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#52525b', marginTop: '2px' }}>
                    상품 할인 적용 후 남은 잔액에 대해 회원 할인, 장바구니 할인을 순서대로 단계별 계산합니다. (과다 할인 방지)
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '9px',
                  border: `1.5px solid ${policy.combinationMode === 'MAX_ONE' ? 'var(--accent, #2563eb)' : '#e4e4e7'}`,
                  background: policy.combinationMode === 'MAX_ONE' ? '#eff6ff' : '#fafafa',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="comboMode"
                  checked={policy.combinationMode === 'MAX_ONE'}
                  onChange={() => handleModeChange('MAX_ONE')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#18181b' }}>
                    최대 할인 1건만 적용 (단일 할인)
                  </div>
                  <div style={{ fontSize: '12px', color: '#52525b', marginTop: '2px' }}>
                    동시 만족하는 할인 조건 중 고객 혜택(할인액)이 가장 큰 단 1개의 프로모션만 자동 적용합니다. (마진 최우선 보호)
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '9px',
                  border: `1.5px solid ${policy.combinationMode === 'ALL' ? 'var(--accent, #2563eb)' : '#e4e4e7'}`,
                  background: policy.combinationMode === 'ALL' ? '#eff6ff' : '#fafafa',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="comboMode"
                  checked={policy.combinationMode === 'ALL'}
                  onChange={() => handleModeChange('ALL')}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#18181b' }}>
                    모든 할인 중복 허용 (누적 할인)
                  </div>
                  <div style={{ fontSize: '12px', color: '#52525b', marginTop: '2px' }}>
                    조건을 충족하는 모든 프로모션 할인을 원금액 기준으로 각각 계산하여 합산 차감합니다. (프로모션 효과 극대화)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 카드 2: 단계별 적용 순서 */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: '#18181b' }}>
              2. 할인 적용 단계 및 우선순위 체인
            </div>
            <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '16px' }}>
              할인이 순차적으로 계산되는 우선순위와 각 단계의 중복 허용 여부를 켜거나 끌 수 있습니다.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {policy.steps.map((step, idx) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: step.enabled ? '#f8fafc' : '#f4f4f5',
                    border: '1px solid #e2e8f0',
                    opacity: step.enabled ? 1 : 0.6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                        {step.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {step.description}
                      </div>
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={step.enabled}
                      onChange={() => toggleStep(step.id)}
                    />
                    <span style={{ fontSize: '12px', color: step.enabled ? '#0f172a' : '#94a3b8' }}>
                      {step.enabled ? '적용 허용' : '제외됨'}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 카드 3: 마진 보호 안전장치 */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: '#18181b' }}>
              3. 마진 보호 안전장치 (최대 할인 한도)
            </div>
            <div style={{ fontSize: '12.5px', color: '#71717a', marginBottom: '16px' }}>
              프로모션과 쿠폰이 누적되어 판매 원가 이하로 결제되는 것을 방어하는 필수 상한선입니다.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>
                  주문 금액 대비 최대 할인율 상한 (%)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={10}
                    max={90}
                    value={policy.maxDiscountRateLimit}
                    onChange={(e) => handleRateLimitChange(Number(e.target.value) || 0)}
                    className={styles.searchInput}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#71717a' }}>%</span>
                </div>
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '3px' }}>
                  * 주문 금액의 {policy.maxDiscountRateLimit}%를 초과하는 할인은 자동 제한됩니다.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>
                  1회 주문당 최대 할인 금액 상한 (원)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={1000}
                    step={5000}
                    value={policy.maxDiscountAmountLimit}
                    onChange={(e) => handleAmountLimitChange(Number(e.target.value) || 0)}
                    className={styles.searchInput}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#71717a' }}>원</span>
                </div>
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '3px' }}>
                  * 주문당 최대 {policy.maxDiscountAmountLimit.toLocaleString('ko-KR')}원까지 감면됩니다.
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#fefce8',
                border: '1px solid #fef08a',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#854d0e' }}>
                  쿠폰과의 동시 중복 적용 허용
                </div>
                <div style={{ fontSize: '11.5px', color: '#a16207' }}>
                  프로모션 할인이 적용된 상품/장바구니에 고객 보유 쿠폰을 추가로 적용할 수 있도록 허용합니다.
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={policy.allowCouponOverlap}
                  onChange={(e) => handleCouponToggle(e.target.checked)}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: policy.allowCouponOverlap ? '#15803d' : '#b91c1c' }}>
                  {policy.allowCouponOverlap ? '동시 허용' : '중복 불가'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 우측: 실시간 시뮬레이션 계산기 */}
        <div>
          <div
            style={{
              background: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              position: 'sticky',
              top: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#18181b' }}>
                실시간 할인 시뮬레이터
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  color: '#475569',
                }}
              >
                정책 검증용
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '16px' }}>
              가상의 주문 상품과 회원 조건을 입력하면 위 정책에 따른 최종 결제액을 즉시 계산합니다.
            </div>

            {/* 시뮬레이션 입력 폼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>상품 정가 (원)</label>
                <input
                  type="number"
                  step={10000}
                  value={simProductPrice}
                  onChange={(e) => setSimProductPrice(Number(e.target.value) || 0)}
                  className={styles.searchInput}
                  style={{ width: '100%', height: '32px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>상품 프로모션 (%)</label>
                  <input
                    type="number"
                    value={simProductDiscountRate}
                    onChange={(e) => setSimProductDiscountRate(Number(e.target.value) || 0)}
                    className={styles.searchInput}
                    style={{ width: '100%', height: '32px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>대상 회원 등급</label>
                  <select
                    value={simMemberTier}
                    onChange={(e) => setSimMemberTier(e.target.value as any)}
                    className={styles.selectSm}
                    style={{ width: '100%', height: '32px' }}
                  >
                    <option value="NONE">일반 (0%)</option>
                    <option value="VIP">VIP (5%)</option>
                    <option value="VVIP">VVIP (7%)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>장바구니 할인 (원)</label>
                  <input
                    type="number"
                    step={1000}
                    value={simCartDiscount}
                    onChange={(e) => setSimCartDiscount(Number(e.target.value) || 0)}
                    className={styles.searchInput}
                    style={{ width: '100%', height: '32px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>보유 쿠폰 (원)</label>
                  <input
                    type="number"
                    step={1000}
                    value={simCouponDiscount}
                    onChange={(e) => setSimCouponDiscount(Number(e.target.value) || 0)}
                    className={styles.searchInput}
                    style={{ width: '100%', height: '32px', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>

            {/* 계산 결과 박스 */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                단계별 할인 내역 ({policy.combinationMode === 'CONDITIONAL' ? '순차 적용' : policy.combinationMode === 'MAX_ONE' ? '최대 1건' : '누적 합산'})
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                <span>상품 할인 ({simProductDiscountRate}%)</span>
                <span>-{simulation.productDisc.toLocaleString('ko-KR')}원</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                <span>회원 등급 할인 ({simMemberTier})</span>
                <span>-{simulation.memberDisc.toLocaleString('ko-KR')}원</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                <span>장바구니 할인</span>
                <span>-{simulation.cartDisc.toLocaleString('ko-KR')}원</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                <span>쿠폰 할인</span>
                <span>{policy.allowCouponOverlap ? `-${simulation.couponDisc.toLocaleString('ko-KR')}원` : '중복 불가 (0원)'}</span>
              </div>

              {simulation.isCapped && (
                <div
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    fontSize: '11px',
                    color: '#b91c1c',
                    marginBottom: '8px',
                  }}
                >
                  ⚠ 안전장치 발동: 합산 할인({simulation.totalRawDiscount.toLocaleString('ko-KR')}원)이 최대 한도({simulation.effectiveMaxLimit.toLocaleString('ko-KR')}원)를 초과하여 상한선으로 제한되었습니다.
                </div>
              )}

              <div style={{ height: '1px', background: '#cbd5e1', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>
                <span>총 할인 지원금</span>
                <span>-{simulation.finalDiscount.toLocaleString('ko-KR')}원 ({simulation.effectiveDiscountRate}%)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>최종 고객 결제금액</span>
                <span style={{ fontSize: '19px', fontWeight: 800, color: 'var(--accent, #2563eb)' }}>
                  {simulation.finalPay.toLocaleString('ko-KR')}원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
