import { PROMOTIONS, type ApplyUnit, type DiscountMethod, type StackOption } from './promotionsData';

export type ApplyStatus = '정상 적용' | '적용 취소' | '부분 취소' | '환불 반영' | '부분 환불 반영';

export const APPLY_STATUS_META: Record<ApplyStatus, { bg: string; fg: string }> = {
  '정상 적용': { bg: '#ecfdf5', fg: '#059669' },
  '적용 취소': { bg: '#f4f4f5', fg: '#71717a' },
  '부분 취소': { bg: '#fff7ed', fg: '#c2410c' },
  '환불 반영': { bg: '#fef2f2', fg: '#b91c1c' },
  '부분 환불 반영': { bg: '#fff7ed', fg: '#c2410c' },
};

export interface ConditionSnapshot {
  applyUnit: ApplyUnit;
  discountMethod: DiscountMethod;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  stackPromotion: StackOption;
  stackCoupon: StackOption;
}

export interface AppliedProductRow {
  productCode: string;
  productName: string;
  qty: number;
  baseAmount: number;
  discountAmount: number;
}

export interface StackedPromotion {
  promotionCode: string;
  promotionName: string;
  discountAmount: number;
}

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface PromotionApplication {
  id: string;
  promotionId: string;
  promotionCode: string;
  promotionNameSnapshot: string;
  promotionVersion: number;
  conditionSnapshot: ConditionSnapshot;

  orderId: string;
  member: string;
  orderTotalAmount: number;
  baseAmount: number;
  appliedProducts: AppliedProductRow[];

  discountAmount: number;
  currentDiscountAmount: number;
  status: ApplyStatus;
  appliedAt: string;

  stackedWith: StackedPromotion[];
  couponCode: string | null;
  couponDiscountAmount: number;

  refundId: string | null;
  refundAmount: number | null;

  memos: Memo[];
  history: HistoryEntry[];
}

function snapshotOf(code: string): ConditionSnapshot {
  const p = PROMOTIONS.find((x) => x.code === code)!;
  return {
    applyUnit: p.applyUnit,
    discountMethod: p.discountMethod,
    discountValue: p.discountValue,
    maxDiscountAmount: p.maxDiscountAmount,
    minPurchaseAmount: p.minPurchaseAmount,
    stackPromotion: p.stackPromotion,
    stackCoupon: p.stackCoupon,
  };
}

function promoOf(code: string) {
  const p = PROMOTIONS.find((x) => x.code === code)!;
  return { id: p.id, code: p.code, name: p.name };
}

export function targetSummary(app: PromotionApplication): string {
  if (app.appliedProducts.length === 0) return '주문 전체';
  if (app.appliedProducts.length === 1) return app.appliedProducts[0].productName;
  return `상품 ${app.appliedProducts.length}개`;
}

export function computeIssues(app: PromotionApplication): string[] {
  const issues: string[] = [];
  if (app.currentDiscountAmount < 0) issues.push('계산 결과가 음수입니다.');
  if ((app.status === '적용 취소') && app.currentDiscountAmount !== 0) issues.push('취소됐지만 할인 복원이 반영되지 않았습니다.');
  if (app.refundId && app.status === '정상 적용') issues.push('환불이 발생했지만 적용 상태가 반영되지 않았습니다.');
  if (app.appliedProducts.length > 0) {
    const sum = app.appliedProducts.reduce((s, r) => s + r.discountAmount, 0);
    if (sum !== app.discountAmount) issues.push('적용금액과 상품별 할인금액 합계가 일치하지 않습니다.');
  }
  return issues;
}

export type QuickFilter = '전체' | '정상 적용' | '취소 / 환불' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '정상 적용', '취소 / 환불', '확인 필요'];

export function matchesQuickFilter(app: PromotionApplication, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '정상 적용') return app.status === '정상 적용';
  if (filter === '취소 / 환불') return app.status !== '정상 적용';
  return computeIssues(app).length > 0;
}

const P1002 = promoOf('PROMO-202608-002');
const P1003 = promoOf('PROMO-202608-003');
const P1004 = promoOf('PROMO-202608-004');
const P1006 = promoOf('PROMO-202607-006');
const P1007 = promoOf('PROMO-202606-007');
const P1008 = promoOf('PROMO-202605-008');
const P1009 = promoOf('PROMO-202604-009');

export const APPLICATIONS: PromotionApplication[] = [
  {
    id: 'PA-20260825-00201', promotionId: P1002.id, promotionCode: P1002.code, promotionNameSnapshot: P1002.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1002.code), orderId: 'O-01041', member: 'user01', orderTotalAmount: 60000, baseAmount: 60000,
    appliedProducts: [], discountAmount: 5000, currentDiscountAmount: 5000, status: '정상 적용', appliedAt: '2026-08-25 14:20',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: null, refundAmount: null, memos: [],
    history: [{ id: 'H-1', at: '2026-08-25 14:20', by: 'system', action: '프로모션 적용' }],
  },
  {
    id: 'PA-20260825-00202', promotionId: P1003.id, promotionCode: P1003.code, promotionNameSnapshot: P1003.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1003.code), orderId: 'O-01042', member: 'user02', orderTotalAmount: 152000, baseAmount: 152000,
    appliedProducts: [
      { productCode: 'P-001238', productName: '상품명 01', qty: 2, baseAmount: 64000, discountAmount: 9600 },
      { productCode: 'P-001240', productName: '상품명 03', qty: 1, baseAmount: 120000, discountAmount: 18000 },
    ],
    discountAmount: 27600, currentDiscountAmount: 27600, status: '정상 적용', appliedAt: '2026-08-25 11:05',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: null, refundAmount: null, memos: [],
    history: [{ id: 'H-1', at: '2026-08-25 11:05', by: 'system', action: '프로모션 적용' }],
  },
  {
    id: 'PA-20260824-00190', promotionId: P1004.id, promotionCode: P1004.code, promotionNameSnapshot: P1004.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1004.code), orderId: 'O-01035', member: 'user03', orderTotalAmount: 32000, baseAmount: 32000,
    appliedProducts: [{ productCode: 'P-001238', productName: '상품명 01', qty: 1, baseAmount: 32000, discountAmount: 6400 }],
    discountAmount: 6400, currentDiscountAmount: 6400, status: '정상 적용', appliedAt: '2026-08-24 16:40',
    stackedWith: [{ promotionCode: P1002.code, promotionName: P1002.name, discountAmount: 5000 }],
    couponCode: null, couponDiscountAmount: 0, refundId: null, refundAmount: null, memos: [],
    history: [{ id: 'H-1', at: '2026-08-24 16:40', by: 'system', action: '프로모션 적용' }],
  },
  {
    id: 'PA-20260823-00177', promotionId: P1002.id, promotionCode: P1002.code, promotionNameSnapshot: P1002.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1002.code), orderId: 'O-01020', member: 'user04', orderTotalAmount: 88000, baseAmount: 88000,
    appliedProducts: [], discountAmount: 5000, currentDiscountAmount: 5000, status: '정상 적용', appliedAt: '2026-08-23 09:12',
    stackedWith: [], couponCode: 'CP-00311', couponDiscountAmount: 3000, refundId: null, refundAmount: null, memos: [],
    history: [{ id: 'H-1', at: '2026-08-23 09:12', by: 'system', action: '프로모션 적용' }],
  },
  {
    id: 'PA-20260820-00150', promotionId: P1003.id, promotionCode: P1003.code, promotionNameSnapshot: P1003.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1003.code), orderId: 'O-00998', member: 'user05', orderTotalAmount: 64000, baseAmount: 64000,
    appliedProducts: [
      { productCode: 'P-001238', productName: '상품명 01', qty: 1, baseAmount: 32000, discountAmount: 4800 },
      { productCode: 'P-001240', productName: '상품명 03', qty: 1, baseAmount: 32000, discountAmount: 4800 },
    ],
    discountAmount: 9600, currentDiscountAmount: 4800, status: '부분 취소', appliedAt: '2026-08-20 13:00',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: null, refundAmount: null,
    memos: [{ id: 'M-1', at: '2026-08-21 10:12', by: 'admin01', text: '상품명 03 라인 취소로 할인 일부 회수.' }],
    history: [
      { id: 'H-1', at: '2026-08-20 13:00', by: 'system', action: '프로모션 적용' },
      { id: 'H-2', at: '2026-08-21 10:10', by: 'admin01', action: '상품명 03 부분 취소', before: '9,600원', after: '4,800원' },
    ],
  },
  {
    id: 'PA-20260620-00042', promotionId: P1007.id, promotionCode: P1007.code, promotionNameSnapshot: P1007.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1007.code), orderId: 'O-00582', member: 'user01', orderTotalAmount: 48000, baseAmount: 18500,
    appliedProducts: [{ productCode: 'P-001239', productName: '상품명 02', qty: 1, baseAmount: 18500, discountAmount: 1850 }],
    discountAmount: 1850, currentDiscountAmount: 0, status: '환불 반영', appliedAt: '2026-06-20 14:00',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: 'REF-00182', refundAmount: 17000,
    memos: [{ id: 'M-1', at: '2026-08-25 12:22', by: 'admin01', text: '반품 건 REF-00182 승인에 따라 할인 전액 회수.' }],
    history: [
      { id: 'H-1', at: '2026-06-20 14:00', by: 'system', action: '프로모션 적용' },
      { id: 'H-2', at: '2026-08-25 12:20', by: 'admin01', action: '환불 반영으로 할인 회수', before: '1,850원', after: '0원' },
    ],
  },
  {
    id: 'PA-20260810-00120', promotionId: P1008.id, promotionCode: P1008.code, promotionNameSnapshot: P1008.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1008.code), orderId: 'O-00840', member: 'user06', orderTotalAmount: 120000, baseAmount: 120000,
    appliedProducts: [], discountAmount: 8000, currentDiscountAmount: 8000, status: '적용 취소', appliedAt: '2026-05-18 10:30',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: null, refundAmount: null,
    memos: [{ id: 'M-1', at: '2026-08-26 09:00', by: 'admin02', text: '주문 전체 취소되었으나 할인 회수 처리가 누락된 것으로 보입니다. 확인 필요.' }],
    history: [
      { id: 'H-1', at: '2026-05-18 10:30', by: 'system', action: '프로모션 적용' },
      { id: 'H-2', at: '2026-05-19 09:00', by: 'admin02', action: '주문 전체 취소 반영' },
    ],
  },
  {
    id: 'PA-20260805-00098', promotionId: P1002.id, promotionCode: P1002.code, promotionNameSnapshot: P1002.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1002.code), orderId: 'O-00780', member: 'user02', orderTotalAmount: 200000, baseAmount: 200000,
    appliedProducts: [], discountAmount: 5000, currentDiscountAmount: 5000, status: '환불 반영', appliedAt: '2026-08-05 15:45',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: 'REF-00099', refundAmount: 195000,
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-05 15:45', by: 'system', action: '프로모션 적용' },
      { id: 'H-2', at: '2026-08-07 09:30', by: 'admin01', action: '환불 완료' },
    ],
  },
  {
    id: 'PA-20260722-00071', promotionId: P1006.id, promotionCode: P1006.code, promotionNameSnapshot: P1006.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1006.code), orderId: 'O-00610', member: 'user07', orderTotalAmount: 120000, baseAmount: 120000,
    appliedProducts: [{ productCode: 'P-001240', productName: '상품명 03', qty: 1, baseAmount: 120000, discountAmount: 180000 }],
    discountAmount: -60000, currentDiscountAmount: -60000, status: '정상 적용', appliedAt: '2026-07-22 10:00',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: null, refundAmount: null,
    memos: [{ id: 'M-1', at: '2026-07-22 11:00', by: 'admin01', text: '프로모션 할인율(150%) 오입력으로 계산 결과가 비정상입니다.' }],
    history: [{ id: 'H-1', at: '2026-07-22 10:00', by: 'system', action: '프로모션 적용' }],
  },
  {
    id: 'PA-20260415-00030', promotionId: P1009.id, promotionCode: P1009.code, promotionNameSnapshot: P1009.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1009.code), orderId: 'O-00410', member: 'user08', orderTotalAmount: 18500, baseAmount: 18500,
    appliedProducts: [{ productCode: 'P-001239', productName: '상품명 02', qty: 1, baseAmount: 18500, discountAmount: 2220 }],
    discountAmount: 2220, currentDiscountAmount: 2220, status: '정상 적용', appliedAt: '2026-04-15 09:20',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: null, refundAmount: null, memos: [],
    history: [{ id: 'H-1', at: '2026-04-15 09:20', by: 'system', action: '프로모션 적용' }],
  },
  {
    id: 'PA-20260818-00165', promotionId: P1003.id, promotionCode: P1003.code, promotionNameSnapshot: P1003.name, promotionVersion: 1,
    conditionSnapshot: snapshotOf(P1003.code), orderId: 'O-00960', member: 'user03', orderTotalAmount: 32000, baseAmount: 32000,
    appliedProducts: [{ productCode: 'P-001238', productName: '상품명 01', qty: 1, baseAmount: 32000, discountAmount: 4800 }],
    discountAmount: 4800, currentDiscountAmount: 2400, status: '부분 환불 반영', appliedAt: '2026-08-18 12:00',
    stackedWith: [], couponCode: null, couponDiscountAmount: 0, refundId: 'REF-00161', refundAmount: 14600,
    memos: [], history: [
      { id: 'H-1', at: '2026-08-18 12:00', by: 'system', action: '프로모션 적용' },
      { id: 'H-2', at: '2026-08-19 14:10', by: 'admin02', action: '부분 환불 반영', before: '4,800원', after: '2,400원' },
    ],
  },
];
