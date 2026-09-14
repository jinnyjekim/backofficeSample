import { useMemo, useState } from 'react';
import shared from '../delivery/deliveryShared.module.css';
import styles from './PromotionStackSettingPage.module.css';
import {
  CommonBadge,
  CommonButton,
  CommonInput,
  CommonRadio,
  CommonSelect,
  CommonSwitch,
  CommonTabs,
  showToast,
} from '../../components/common';
import {
  DEFAULT_STACK_POLICY,
  type StackCombinationMode,
  type StackDiscountPolicy,
  type StackDiscountStep,
} from './promotionsData';

type Tab = 'rules' | 'sentences' | 'preflight';
const TABS: [Tab, string][] = [
  ['rules', '할인 규칙'],
  ['sentences', '정책 문구'],
  ['preflight', '적용 전 점검'],
];

type MemberTier = 'NONE' | 'VIP' | 'VVIP';
const TIER_RATE: Record<MemberTier, number> = { NONE: 0, VIP: 0.05, VVIP: 0.07 };
const TIER_OPTIONS = [
  { value: 'NONE', label: '일반 (0%)' },
  { value: 'VIP', label: 'VIP (5%)' },
  { value: 'VVIP', label: 'VVIP (7%)' },
];

const MODE_OPTIONS: { value: StackCombinationMode; name: string; desc: string; recommend?: boolean }[] = [
  {
    value: 'CONDITIONAL',
    name: '조건부 순차 적용',
    desc: '상품 할인 적용 후 남은 잔액에 대해 회원 할인, 장바구니 할인을 순서대로 단계별 계산합니다. (과다 할인 방지)',
    recommend: true,
  },
  {
    value: 'MAX_ONE',
    name: '최대 할인 1건만 적용 (단일 할인)',
    desc: '동시 만족하는 할인 조건 중 고객 혜택(할인액)이 가장 큰 단 1개의 프로모션만 자동 적용합니다. (마진 최우선 보호)',
  },
  {
    value: 'ALL',
    name: '모든 할인 중복 허용 (누적 할인)',
    desc: '조건을 충족하는 모든 프로모션 할인을 원금액 기준으로 각각 계산하여 합산 차감합니다. (프로모션 효과 극대화)',
  },
];

const MODE_LABEL: Record<StackCombinationMode, string> = {
  CONDITIONAL: '조건부 순차 적용',
  MAX_ONE: '최대 할인 1건만 적용',
  ALL: '모든 할인 중복 허용',
};

const MODE_SUMMARY: Record<StackCombinationMode, string> = {
  CONDITIONAL: '앞 단계 할인 후 남은 잔액에 다음 할인을 적용합니다. 과다 할인을 막는 기본 권장 방식입니다.',
  MAX_ONE: '가장 큰 할인 1건만 적용합니다. 마진을 최우선으로 보호하지만 고객 체감 혜택은 줄어듭니다.',
  ALL: '모든 할인을 원금액 기준으로 합산합니다. 혜택은 커지지만 마진 상한선 의존도가 높아집니다.',
};

const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

export function PromotionStackSettingPage() {
  const [policy, setPolicy] = useState<StackDiscountPolicy>(DEFAULT_STACK_POLICY);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StackDiscountPolicy>(DEFAULT_STACK_POLICY);
  const [tab, setTab] = useState<Tab>('rules');

  // 시뮬레이터 입력값 — 정책이 아니라 가정값이라 수정 모드와 무관하게 항상 조작할 수 있습니다.
  const [simPrice, setSimPrice] = useState(100000);
  const [simProductRate, setSimProductRate] = useState(15);
  const [simTier, setSimTier] = useState<MemberTier>('VIP');
  const [simCart, setSimCart] = useState(5000);
  const [simCoupon, setSimCoupon] = useState(3000);

  // 화면에 보여줄 정책 — 수정 모드에서는 초안, 아니면 저장된 값입니다.
  const p = editing ? draft : policy;

  const patch = (next: Partial<StackDiscountPolicy>) => {
    if (!editing) return;
    setDraft((prev) => ({ ...prev, ...next }));
  };

  const toggleStep = (id: StackDiscountStep['id']) => {
    patch({ steps: p.steps.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)) });
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= p.steps.length) return;
    const next = [...p.steps];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ steps: next.map((s, i) => ({ ...s, order: i + 1 })) });
  };

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(policy);

  function startEdit() {
    setDraft(policy);
    setEditing(true);
    showToast({ message: '정책 수정 모드입니다. 변경 후 상단의 [저장]을 클릭하세요.', type: 'info' });
  }

  function cancelEdit() {
    setDraft(policy);
    setEditing(false);
    showToast({ message: '수정을 취소했습니다.', type: 'info' });
  }

  function handleSave() {
    if (!hasChanges) {
      setEditing(false);
      showToast({ message: '변경된 내용이 없어 수정 모드를 종료합니다.', type: 'info' });
      return;
    }
    setPolicy({ ...draft, updatedAt: '2026-09-11 11:45', updatedBy: '운영 관리자' });
    setEditing(false);
    showToast({ message: '중복 할인 정책을 저장했습니다. 신규 주문부터 즉시 적용됩니다.', type: 'success' });
  }

  function handleReset() {
    setDraft(DEFAULT_STACK_POLICY);
    showToast({ message: '기본 권장 설정을 불러왔습니다. 저장해야 실제로 반영됩니다.', type: 'info' });
  }

  /* ── 시뮬레이션 ───────────────────────────────────── */

  const sim = useMemo(() => {
    const original = Math.max(0, simPrice);
    const tierRate = TIER_RATE[simTier];
    const enabled = (id: StackDiscountStep['id']) => p.steps.find((s) => s.id === id)?.enabled ?? false;
    const couponUsable = p.allowCouponOverlap && enabled('coupon');

    const amountOf = (id: StackDiscountStep['id'], base: number) => {
      if (id === 'product') return (base * simProductRate) / 100;
      if (id === 'member') return base * tierRate;
      if (id === 'cart') return Math.min(base, simCart);
      return Math.min(base, simCoupon);
    };

    const parts: Record<StackDiscountStep['id'], number> = { product: 0, member: 0, cart: 0, coupon: 0 };

    if (p.combinationMode === 'CONDITIONAL') {
      let remain = original;
      for (const step of p.steps) {
        if (!step.enabled) continue;
        if (step.id === 'coupon' && !couponUsable) continue;
        const value = Math.min(remain, amountOf(step.id, remain));
        parts[step.id] = value;
        remain -= value;
      }
    } else if (p.combinationMode === 'MAX_ONE') {
      const candidates = p.steps
        .filter((s) => s.enabled && s.id !== 'coupon')
        .map((s) => ({ id: s.id, value: amountOf(s.id, original) }));
      const best = candidates.reduce<{ id: StackDiscountStep['id']; value: number } | null>(
        (acc, cur) => (acc === null || cur.value > acc.value ? cur : acc),
        null,
      );
      if (best && best.value > 0) parts[best.id] = best.value;
      if (couponUsable) parts.coupon = amountOf('coupon', original);
    } else {
      for (const step of p.steps) {
        if (!step.enabled) continue;
        if (step.id === 'coupon' && !couponUsable) continue;
        parts[step.id] = amountOf(step.id, original);
      }
    }

    const raw = parts.product + parts.member + parts.cart + parts.coupon;
    const capByRate = (original * p.maxDiscountRateLimit) / 100;
    const cap = Math.min(capByRate, p.maxDiscountAmountLimit);
    const capped = raw > cap;
    const discount = Math.min(raw, cap);
    const pay = Math.max(p.minFinalPayAmount, original - discount);
    const applied = Math.round(discount) !== 0 ? original - pay : 0;

    return {
      original,
      parts,
      raw,
      cap,
      capped,
      discount: applied || discount,
      pay,
      rate: original > 0 ? ((discount / original) * 100).toFixed(1) : '0.0',
      activeSteps: p.steps.filter((s) => s.enabled && (s.id !== 'coupon' || p.allowCouponOverlap)).length,
      headroom: Math.max(0, cap - discount),
    };
  }, [p, simPrice, simProductRate, simTier, simCart, simCoupon]);

  const stepLabel: Record<StackDiscountStep['id'], string> = {
    product: '상품 할인',
    member: '회원 등급 할인',
    cart: '장바구니 할인',
    coupon: '쿠폰 할인',
  };

  /* ── 섹션 ─────────────────────────────────────────── */

  const sectionMode = (
    <div className={styles.section} key="mode">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>1</span>
          <span className={styles.sectionHeadTitle}>복수 할인 동시 적용</span>
        </div>
        <div className={styles.sectionDescText}>한 주문에 2개 이상의 혜택 대상이 겹칠 때의 처리 방식을 정합니다.</div>
      </div>
      <div className={styles.sectionControls}>
        <div className={styles.modeList} role="radiogroup" aria-label="복수 할인 동시 적용 방식">
          {MODE_OPTIONS.map((o) => {
            const selected = p.combinationMode === o.value;
            return (
              <label key={o.value} className={`${styles.modeItem} ${selected ? styles.modeItemSelected : ''} ${editing ? '' : styles.modeItemLocked}`}>
                <CommonRadio
                  className={styles.modeRadio}
                  name="stackMode"
                  size="md"
                  value={o.value}
                  checked={selected}
                  disabled={!editing}
                  onChange={() => patch({ combinationMode: o.value })}
                />
                <span className={styles.modeBody}>
                  <span className={styles.modeName}>
                    {o.name}
                    {o.recommend && <span className={styles.modeRecommend}>권장</span>}
                  </span>
                  <span className={styles.modeDesc}>{o.desc}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  const sectionSteps = (
    <div className={styles.section} key="steps">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>2</span>
          <span className={styles.sectionHeadTitle}>적용 단계 및 우선순위</span>
        </div>
        <div className={styles.sectionDescText}>
          할인이 계산되는 순서와 각 단계의 사용 여부를 정합니다. 순서는 화살표로 조정합니다.
        </div>
      </div>
      <div className={styles.sectionControls}>
        <ol className={styles.stepList}>
          {p.steps.map((step, i) => (
            <li key={step.id} className={`${styles.stepItem} ${step.enabled ? '' : styles.stepItemOff}`}>
              <span className={styles.stepNum}>{i + 1}</span>
              <div className={styles.stepBody}>
                <div className={styles.stepName}>{step.name}</div>
                <div className={styles.stepDesc}>{step.description}</div>
              </div>
              <div className={styles.stepArrows}>
                <CommonButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={styles.stepArrowBtn}
                  aria-label={`${step.name} 우선순위 올리기`}
                  disabled={!editing || i === 0}
                  onClick={() => moveStep(i, -1)}
                >
                  ▲
                </CommonButton>
                <CommonButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={styles.stepArrowBtn}
                  aria-label={`${step.name} 우선순위 내리기`}
                  disabled={!editing || i === p.steps.length - 1}
                  onClick={() => moveStep(i, 1)}
                >
                  ▼
                </CommonButton>
              </div>
              <div className={styles.stepSwitch}>
                <CommonSwitch
                  size="md"
                  label="적용 허용"
                  aria-label={`${step.name} 적용 허용`}
                  disabled={!editing}
                  checked={step.enabled}
                  onChange={() => toggleStep(step.id)}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  const sectionGuard = (
    <div className={styles.section} key="guard">
      <div className={styles.sectionDesc}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>3</span>
          <span className={styles.sectionHeadTitle}>마진 보호 안전장치</span>
        </div>
        <div className={styles.sectionDescText}>할인이 누적되어 원가 이하로 결제되는 것을 막는 상한선입니다.</div>
      </div>
      <div className={styles.sectionControls}>
        <div className={styles.fieldRow}>
          <div>
            <div className={styles.fieldLabel}>주문 금액 대비 할인율 상한</div>
            <CommonInput.Number
              clearable={false}
              className={styles.fieldInput}
              min={0}
              max={100}
              suffix="%"
              aria-label="주문 금액 대비 할인율 상한"
              disabled={!editing}
              value={p.maxDiscountRateLimit}
              onChange={(e) => patch({ maxDiscountRateLimit: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
            />
            <div className={styles.fieldNote}>주문 금액의 {p.maxDiscountRateLimit}%를 초과하는 할인은 자동 제한됩니다.</div>
          </div>
          <div>
            <div className={styles.fieldLabel}>1회 주문당 할인 금액 상한</div>
            <CommonInput.Number
              clearable={false}
              className={styles.fieldInput}
              min={0}
              suffix="원"
              aria-label="1회 주문당 할인 금액 상한"
              disabled={!editing}
              value={p.maxDiscountAmountLimit}
              onChange={(e) => patch({ maxDiscountAmountLimit: Math.max(0, Number(e.target.value) || 0) })}
            />
            <div className={styles.fieldNote}>주문당 최대 {p.maxDiscountAmountLimit.toLocaleString('ko-KR')}원까지 감면됩니다.</div>
          </div>
        </div>

        <div className={styles.guardNote}>
          <div className={styles.guardNoteBody}>
            <div className={styles.guardNoteTitle}>쿠폰과의 동시 중복 적용</div>
            <div className={styles.guardNoteDesc}>
              프로모션 할인이 적용된 상품·장바구니에 고객 보유 쿠폰을 추가로 적용할 수 있도록 허용합니다.
            </div>
          </div>
          <CommonSwitch
            size="md"
            label="동시 허용"
            aria-label="쿠폰과의 동시 중복 적용"
            disabled={!editing}
            checked={p.allowCouponOverlap}
            onChange={(checked) => patch({ allowCouponOverlap: checked })}
          />
        </div>
      </div>
    </div>
  );

  /* ── 탭 본문 ──────────────────────────────────────── */

  const rulesMain = (
    <>
      <div className={styles.card}>
        {sectionMode}
        {sectionSteps}
      </div>
      <div className={styles.card}>{sectionGuard}</div>
    </>
  );

  const orderText = p.steps.filter((s) => s.enabled).map((s) => stepLabel[s.id]).join(' → ') || '적용 단계 없음';

  const sentencesMain = (
    <div className={styles.card}>
      <div className={styles.sentenceList}>
        <div className={styles.sentenceRow}>
          <span className={styles.sentenceNum}>1</span>
          <div className={styles.sentenceBody}>
            <strong>동시 적용 방식</strong>
            <p>{MODE_LABEL[p.combinationMode]} 방식으로 계산합니다. {MODE_SUMMARY[p.combinationMode]}</p>
          </div>
        </div>
        <div className={styles.sentenceRow}>
          <span className={styles.sentenceNum}>2</span>
          <div className={styles.sentenceBody}>
            <strong>적용 순서</strong>
            <p>{orderText} 순으로 적용되며, 사용하지 않도록 설정한 단계는 계산에서 제외됩니다.</p>
          </div>
        </div>
        <div className={styles.sentenceRow}>
          <span className={styles.sentenceNum}>3</span>
          <div className={styles.sentenceBody}>
            <strong>쿠폰 중복</strong>
            <p>
              프로모션 할인이 적용된 주문에 고객 보유 쿠폰을{' '}
              {p.allowCouponOverlap ? '추가로 사용할 수 있습니다.' : '추가로 사용할 수 없습니다.'}
            </p>
          </div>
        </div>
        <div className={styles.sentenceRow}>
          <span className={styles.sentenceNum}>4</span>
          <div className={styles.sentenceBody}>
            <strong>마진 보호</strong>
            <p>
              총 할인은 주문 금액의 {p.maxDiscountRateLimit}% 또는{' '}
              {p.maxDiscountAmountLimit.toLocaleString('ko-KR')}원 중 낮은 값까지만 적용되며, 최종 결제금액은 최소{' '}
              {won(p.minFinalPayAmount)} 이상으로 유지됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const checks = [
    {
      ok: p.steps.some((s) => s.enabled),
      title: '적용 단계가 1개 이상 켜져 있는지',
      desc: p.steps.some((s) => s.enabled)
        ? `${p.steps.filter((s) => s.enabled).length}개 단계가 활성화되어 있습니다.`
        : '모든 단계가 꺼져 있어 어떤 할인도 적용되지 않습니다.',
    },
    {
      ok: !(p.allowCouponOverlap && !p.steps.find((s) => s.id === 'coupon')?.enabled),
      title: '쿠폰 중복 설정과 쿠폰 단계가 일치하는지',
      desc:
        p.allowCouponOverlap && !p.steps.find((s) => s.id === 'coupon')?.enabled
          ? '쿠폰 중복은 허용이지만 쿠폰 할인 단계가 꺼져 있어 실제로는 적용되지 않습니다.'
          : '쿠폰 중복 설정과 단계 사용 여부가 서로 맞습니다.',
    },
    {
      ok: !sim.capped,
      title: '현재 시뮬레이션이 상한에 걸리지 않는지',
      desc: sim.capped
        ? `누적 할인 ${won(sim.raw)}이 상한 ${won(sim.cap)}을 초과해 자동 제한되었습니다.`
        : `누적 할인이 상한 ${won(sim.cap)} 이내입니다.`,
    },
    {
      ok: p.maxDiscountRateLimit <= 70,
      title: '할인율 상한이 과도하지 않은지',
      desc:
        p.maxDiscountRateLimit <= 70
          ? `할인율 상한 ${p.maxDiscountRateLimit}%는 권장 범위(70% 이하)입니다.`
          : `할인율 상한 ${p.maxDiscountRateLimit}%는 마진 위험이 높습니다.`,
    },
  ];

  const preflightMain = (
    <div className={styles.card}>
      {checks.map((c) => (
        <div key={c.title} className={styles.checkRow}>
          <CommonBadge type={c.ok ? 'success-light' : 'warning-light'} size="sm">
            {c.ok ? '정상' : '확인'}
          </CommonBadge>
          <div className={styles.checkBody}>
            <div className={styles.checkTitle}>{c.title}</div>
            <div className={styles.checkDesc}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const mainByTab: Record<Tab, React.ReactNode> = {
    rules: rulesMain,
    sentences: sentencesMain,
    preflight: preflightMain,
  };

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <div className={shared.title}>중복 할인 설정</div>
            <div className={shared.subtitle}>
              상품 할인, 회원 할인, 장바구니 할인, 쿠폰이 한 주문에 겹칠 때의 계산 방식과 마진 보호 상한선을 정합니다.
            </div>
          </div>
          <div className={styles.headMeta}>
            {!editing && (
              <span className={styles.headMetaText}>
                최종 수정 {policy.updatedAt} · {policy.updatedBy}
              </span>
            )}
            {!editing ? (
              <CommonButton type="button" variant="emphasis" size="md" onClick={startEdit}>
                수정
              </CommonButton>
            ) : (
              <>
                <CommonButton type="button" variant="secondary" size="md" onClick={handleReset}>
                  기본값 복원
                </CommonButton>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>
                  취소
                </CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={handleSave}>
                  저장
                </CommonButton>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={`${styles.banner} ${editing ? styles.bannerEditing : ''}`}>
        <CommonBadge type={editing ? 'warning-light' : 'primary-light'} size="sm">
          {editing ? '수정 중' : MODE_LABEL[p.combinationMode]}
        </CommonBadge>
        <div className={styles.bannerText}>
          {editing
            ? `${MODE_LABEL[p.combinationMode]} · 변경 사항은 저장을 눌러야 반영됩니다. 아래 시뮬레이터는 수정 중인 값으로 계산됩니다.`
            : MODE_SUMMARY[p.combinationMode]}
        </div>
      </div>

      <CommonTabs
        className={styles.policyTabs}
        items={TABS.map(([key, label]) => ({ key, label }))}
        value={tab}
        onChange={(key) => setTab(key as Tab)}
        kind="filter"
        size="md"
      />

      <div className={styles.layout}>
        <div className={styles.main}>{mainByTab[tab]}</div>

        <div className={styles.sidebarOuter}>
          <div className={styles.sidebar}>
            <div className={styles.sideCard}>
              <div className={styles.sideHead}>
                <div className={styles.sideHeadBody}>
                  <div className={styles.sideTitle}>실시간 할인 시뮬레이터</div>
                  <div className={styles.sideDesc}>가상 주문 조건으로 {editing ? "수정 중인" : "현재"} 정책의 결제 금액을 즉시 계산합니다.</div>
                </div>
                <CommonBadge type={editing ? "warning-light" : "secondary"} size="sm">
                  {editing ? "미저장 초안" : "정책 검증용"}
                </CommonBadge>
              </div>

              <div className={styles.sideFields}>
                <div>
                  <div className={styles.sideFieldLabel}>상품 정가 (원)</div>
                  <CommonInput.Number
                    clearable={false}
                    className={styles.sideControl}
                    min={0}
                    aria-label="상품 정가"
                    value={simPrice}
                    onChange={(e) => setSimPrice(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div>
                  <div className={styles.sideFieldLabel}>상품 프로모션 (%)</div>
                  <CommonInput.Number
                    clearable={false}
                    className={styles.sideControl}
                    min={0}
                    max={100}
                    aria-label="상품 프로모션 할인율"
                    value={simProductRate}
                    onChange={(e) => setSimProductRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  />
                </div>
                <div>
                  <div className={styles.sideFieldLabel}>대상 회원 등급</div>
                  <CommonSelect
                    size="md"
                    className={styles.sideControl}
                    aria-label="대상 회원 등급"
                    options={TIER_OPTIONS}
                    value={simTier}
                    onChange={(v) => setSimTier(v as MemberTier)}
                  />
                </div>
                <div>
                  <div className={styles.sideFieldLabel}>장바구니 할인 (원)</div>
                  <CommonInput.Number
                    clearable={false}
                    className={styles.sideControl}
                    min={0}
                    aria-label="장바구니 할인"
                    value={simCart}
                    onChange={(e) => setSimCart(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div>
                  <div className={styles.sideFieldLabel}>보유 쿠폰 (원)</div>
                  <CommonInput.Number
                    clearable={false}
                    className={styles.sideControl}
                    min={0}
                    aria-label="보유 쿠폰"
                    value={simCoupon}
                    onChange={(e) => setSimCoupon(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
              </div>

              <div className={styles.sideBody}>
                <div className={styles.sideBodyTitle}>단계별 할인 내역 ({MODE_LABEL[p.combinationMode]})</div>
                {p.steps.map((step) => {
                  const value = sim.parts[step.id];
                  const off = !step.enabled || (step.id === 'coupon' && !p.allowCouponOverlap);
                  return (
                    <div key={step.id} className={styles.sideLine}>
                      <span className={styles.sideLineLabel}>
                        {stepLabel[step.id]}
                        {step.id === 'product' && !off ? ` (${simProductRate}%)` : ''}
                      </span>
                      {off ? (
                        <span className={`${styles.sideLineValue} ${styles.sideLineValueMuted}`}>미적용</span>
                      ) : (
                        <span className={`${styles.sideLineValue} ${styles.sideLineValueNeg}`}>-{won(value)}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.sideSumRow}>
                <span className={styles.sideSumLabel}>총 할인 지원금</span>
                <span className={styles.sideSumValue}>
                  -{won(sim.discount)} ({sim.rate}%)
                </span>
              </div>

              <div className={styles.sideTotalRow}>
                <span className={styles.sideTotalLabel}>최종 고객 결제금액</span>
                <span className={styles.sideTotalValue}>{won(sim.pay)}</span>
              </div>

              <div className={styles.statGrid}>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>할인율</div>
                  <div className={styles.statValue}>{sim.rate}%</div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>적용 단계</div>
                  <div className={styles.statValue}>
                    {sim.activeSteps} / {p.steps.length}
                  </div>
                </div>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>상한 여유</div>
                  <div className={`${styles.statValue} ${sim.capped ? styles.statValueWarn : ''}`}>
                    {won(sim.headroom)}
                  </div>
                </div>
              </div>

              {sim.capped && (
                <div className={styles.capNote}>
                  누적 할인 {won(sim.raw)}이 상한 {won(sim.cap)}을 초과해 자동 제한되었습니다. 고객에게는 상한까지만
                  적용됩니다.
                </div>
              )}
            </div>

            <div className={styles.sideCard}>
              <div className={styles.sideHead}>
                <div className={styles.sideHeadBody}>
                  <div className={styles.sideTitle}>현재 정책 요약</div>
                </div>
              </div>
              <div className={styles.digestRow}>
                <span className={styles.digestLabel}>동시 적용</span>
                <span className={styles.digestValue}>{MODE_LABEL[p.combinationMode]}</span>
              </div>
              <div className={styles.digestRow}>
                <span className={styles.digestLabel}>적용 순서</span>
                <span className={styles.digestValue}>{orderText}</span>
              </div>
              <div className={styles.digestRow}>
                <span className={styles.digestLabel}>쿠폰 중복</span>
                <span className={styles.digestValue}>{p.allowCouponOverlap ? '허용' : '불허'}</span>
              </div>
              <div className={styles.digestRow}>
                <span className={styles.digestLabel}>할인율 상한</span>
                <span className={styles.digestValue}>{p.maxDiscountRateLimit}%</span>
              </div>
              <div className={styles.digestRow}>
                <span className={styles.digestLabel}>할인 금액 상한</span>
                <span className={styles.digestValue}>{won(p.maxDiscountAmountLimit)}</span>
              </div>
              <div className={styles.digestRow}>
                <span className={styles.digestLabel}>최소 결제금액</span>
                <span className={styles.digestValue}>{won(p.minFinalPayAmount)}</span>
              </div>
              <div className={styles.sideFootNote}>
                개별 프로모션의 대상과 기간은 프로모션 목록에서, 쿠폰 발급 조건은 쿠폰 정책에서 관리합니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
