import { COUPONS, computeStatus as computeCouponStatus, targetSummary, type Coupon } from './couponsData';

export type HolderStatus = '사용 가능' | '사용 완료' | '만료' | '회수';
export type StoredStatus = '사용 가능' | '사용 완료' | '회수';
export type IssueMethod = '관리자 발급' | '자동 발급' | '회원 다운로드';
export type IssueReason = '회원가입' | '첫 구매' | '이벤트' | '프로모션' | 'CS 보상' | '운영자 지급' | '기타';
export type RevokeReason = '중복 발급' | '오발급' | '회원 요청' | '프로모션 종료' | 'CS 처리' | '정책 위반' | '기타';

export const TODAY = '2026-08-26';
export const ISSUE_REASONS: IssueReason[] = ['회원가입', '첫 구매', '이벤트', '프로모션', 'CS 보상', '운영자 지급', '기타'];
export const REVOKE_REASONS: RevokeReason[] = ['중복 발급', '오발급', '회원 요청', '프로모션 종료', 'CS 처리', '정책 위반', '기타'];

export const HOLDER_STATUS_META: Record<HolderStatus, { bg: string; fg: string }> = {
  '사용 가능': { bg: '#ecfdf5', fg: '#059669' },
  '사용 완료': { bg: '#eef2ff', fg: '#4338ca' },
  만료: { bg: '#f4f4f5', fg: '#71717a' },
  회수: { bg: '#fef2f2', fg: '#b91c1c' },
};

export interface BenefitSnapshot {
  applyUnit: Coupon['applyUnit'];
  discountMethod: Coupon['discountMethod'];
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  targetSummary: string;
  stackPromotion: Coupon['stackPromotion'];
  stackCoupon: Coupon['stackCoupon'];
}

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  detail?: string;
}

export interface CouponIssue {
  id: string;
  couponId: string;
  couponCode: string;
  couponNameSnapshot: string;
  couponVersion: number;
  benefitSnapshot: BenefitSnapshot;

  member: string;
  issueMethod: IssueMethod;
  issueReason: IssueReason;
  issueDetail: string;
  issuedAt: string;
  expiresAt: string;

  status: StoredStatus;
  usedAt: string | null;
  orderId: string | null;
  discountAmount: number | null;

  revokedAt: string | null;
  revokedBy: string | null;
  revokeReason: RevokeReason | null;
  revokeDetail: string | null;

  owner: string;
  memos: Memo[];
  history: HistoryEntry[];
}

export function computeStatus(h: CouponIssue, today: string = TODAY): HolderStatus {
  if (h.status === '회수') return '회수';
  if (h.status === '사용 완료') return '사용 완료';
  if (today > h.expiresAt.slice(0, 10)) return '만료';
  return '사용 가능';
}

function benefitSnapshotOf(c: Coupon): BenefitSnapshot {
  return {
    applyUnit: c.applyUnit,
    discountMethod: c.discountMethod,
    discountValue: c.discountValue,
    maxDiscountAmount: c.maxDiscountAmount,
    minPurchaseAmount: c.minPurchaseAmount,
    targetSummary: targetSummary(c),
    stackPromotion: c.stackPromotion,
    stackCoupon: c.stackCoupon,
  };
}

export function couponOf(code: string) {
  const c = COUPONS.find((x) => x.code === code)!;
  return { id: c.id, code: c.code, name: c.name };
}

export function computeIssues(h: CouponIssue): string[] {
  const issues: string[] = [];
  const coupon = COUPONS.find((c) => c.id === h.couponId);
  if (!coupon) issues.push('연결된 쿠폰 정책을 찾을 수 없습니다.');
  if (h.usedAt && h.status !== '사용 완료') issues.push('사용 기록이 있지만 상태가 사용 완료로 반영되지 않았습니다.');
  if (h.status === '회수' && h.usedAt) issues.push('회수된 쿠폰인데 사용 기록이 존재합니다.');
  if (h.expiresAt.slice(0, 10) < h.issuedAt.slice(0, 10)) issues.push('만료일이 발급일보다 빠릅니다.');
  return issues;
}

export type QuickFilter = '전체' | '사용 가능' | '사용 완료' | '만료' | '회수' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '사용 가능', '사용 완료', '만료', '회수', '확인 필요'];

export function matchesQuickFilter(h: CouponIssue, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '확인 필요') return computeIssues(h).length > 0;
  return computeStatus(h) === filter;
}

function nextIssueId(list: CouponIssue[]): string {
  const prefix = `CI-${TODAY.replaceAll('-', '')}-`;
  const maxSeq = list.reduce((max, h) => {
    if (!h.id.startsWith(prefix)) return max;
    const n = parseInt(h.id.slice(prefix.length), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`;
}

function computeExpiry(coupon: Coupon, issuedAtDate: string): string {
  if (coupon.validityType === '날짜지정') {
    return `${coupon.validEnd ?? issuedAtDate} 23:59`;
  }
  const issued = new Date(`${issuedAtDate}T00:00:00`);
  issued.setDate(issued.getDate() + coupon.validityDays);
  return `${issued.toISOString().slice(0, 10)} 23:59`;
}

export interface IssueValidation {
  ok: boolean;
  reasons: string[];
}

export function validateIssue(coupon: Coupon, existingHolders: CouponIssue[], member: string): IssueValidation {
  const reasons: string[] = [];
  const status = computeCouponStatus(coupon);
  if (status !== '발급중') reasons.push(`현재 발급 가능한 상태가 아닙니다. (${status})`);
  if (coupon.validityType === '날짜지정' && coupon.validEnd && coupon.validEnd < TODAY) reasons.push('쿠폰 사용기간이 이미 종료되었습니다.');
  if (coupon.totalLimit > 0 && coupon.issuedCount >= coupon.totalLimit) reasons.push('총 발급 한도에 도달했습니다.');
  const memberCount = existingHolders.filter((h) => h.couponId === coupon.id && h.member === member).length;
  if (memberCount >= coupon.perMemberLimit) reasons.push(`회원당 발급 한도(${coupon.perMemberLimit}장)를 초과합니다.`);
  return { ok: reasons.length === 0, reasons };
}

export function issueCoupon(coupon: Coupon, member: string, method: IssueMethod, reason: IssueReason, detail: string, list: CouponIssue[]): CouponIssue {
  const issuedAt = `${TODAY} 15:00`;
  return {
    id: nextIssueId(list),
    couponId: coupon.id,
    couponCode: coupon.code,
    couponNameSnapshot: coupon.name,
    couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(coupon),
    member,
    issueMethod: method,
    issueReason: reason,
    issueDetail: detail,
    issuedAt,
    expiresAt: computeExpiry(coupon, TODAY),
    status: '사용 가능',
    usedAt: null,
    orderId: null,
    discountAmount: null,
    revokedAt: null,
    revokedBy: null,
    revokeReason: null,
    revokeDetail: null,
    owner: method === '자동 발급' ? 'SYSTEM' : 'admin01',
    memos: [],
    history: [{ id: 'H-1', at: issuedAt, by: method === '자동 발급' ? 'SYSTEM' : 'admin01', action: '쿠폰 발급', detail: reason }],
  };
}

const NEW5000 = couponOf('NEW5000');
const PRODUCT10 = couponOf('PRODUCT10');
const CATE01 = couponOf('CATE01');
const LIMIT100 = couponOf('LIMIT100');
const SPRING02 = couponOf('SPRING02');

export const COUPON_ISSUES: CouponIssue[] = [
  {
    id: 'CI-20260820-00182', couponId: NEW5000.id, couponCode: NEW5000.code, couponNameSnapshot: NEW5000.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === NEW5000.id)!),
    member: 'user01', issueMethod: '자동 발급', issueReason: '회원가입', issueDetail: '회원가입 완료 이벤트',
    issuedAt: '2026-08-20 10:30', expiresAt: '2026-09-19 23:59',
    status: '사용 가능', usedAt: null, orderId: null, discountAmount: null,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'SYSTEM', memos: [],
    history: [{ id: 'H-1', at: '2026-08-20 10:30', by: 'SYSTEM', action: '쿠폰 발급', detail: '회원가입' }],
  },
  {
    id: 'CI-20260825-00201', couponId: NEW5000.id, couponCode: NEW5000.code, couponNameSnapshot: NEW5000.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === NEW5000.id)!),
    member: 'user01', issueMethod: '자동 발급', issueReason: '회원가입', issueDetail: '회원가입 완료 이벤트',
    issuedAt: '2026-07-25 09:00', expiresAt: '2026-08-24 23:59',
    status: '사용 완료', usedAt: '2026-08-25 14:20', orderId: 'O-01041', discountAmount: 5000,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'SYSTEM', memos: [],
    history: [
      { id: 'H-1', at: '2026-07-25 09:00', by: 'SYSTEM', action: '쿠폰 발급', detail: '회원가입' },
      { id: 'H-2', at: '2026-08-25 14:20', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-01041 · 할인 5,000원' },
    ],
  },
  {
    id: 'CI-20260821-00050', couponId: CATE01.id, couponCode: CATE01.code, couponNameSnapshot: CATE01.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === CATE01.id)!),
    member: 'user02', issueMethod: '관리자 발급', issueReason: 'CS 보상', issueDetail: '배송 지연 보상',
    issuedAt: '2026-08-21 11:00', expiresAt: '2026-09-20 23:59',
    status: '사용 가능', usedAt: null, orderId: null, discountAmount: null,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'admin01', memos: [{ id: 'M-1', at: '2026-08-21 11:05', by: 'admin01', text: '배송 지연 보상으로 수동 발급.' }],
    history: [{ id: 'H-1', at: '2026-08-21 11:00', by: 'admin01', action: '쿠폰 발급', detail: 'CS 보상' }],
  },
  {
    id: 'CI-20260818-00040', couponId: CATE01.id, couponCode: CATE01.code, couponNameSnapshot: CATE01.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === CATE01.id)!),
    member: 'user03', issueMethod: '자동 발급', issueReason: '이벤트', issueDetail: '카테고리 01 프로모션 참여',
    issuedAt: '2026-07-18 09:00', expiresAt: '2026-08-17 23:59',
    status: '사용 가능', usedAt: null, orderId: null, discountAmount: null,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'SYSTEM', memos: [],
    history: [{ id: 'H-1', at: '2026-07-18 09:00', by: 'SYSTEM', action: '쿠폰 발급', detail: '이벤트' }],
  },
  {
    id: 'CI-20260810-00020', couponId: LIMIT100.id, couponCode: LIMIT100.code, couponNameSnapshot: LIMIT100.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === LIMIT100.id)!),
    member: 'user04', issueMethod: '관리자 발급', issueReason: '운영자 지급', issueDetail: '선착순 이벤트 당첨',
    issuedAt: '2026-08-10 10:00', expiresAt: '2026-08-24 23:59',
    status: '사용 완료', usedAt: '2026-08-15 12:00', orderId: 'O-00920', discountAmount: 3000,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'admin03', memos: [],
    history: [
      { id: 'H-1', at: '2026-08-10 10:00', by: 'admin03', action: '쿠폰 발급', detail: '운영자 지급' },
      { id: 'H-2', at: '2026-08-15 12:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00920 · 할인 3,000원' },
    ],
  },
  {
    id: 'CI-20260805-00015', couponId: LIMIT100.id, couponCode: LIMIT100.code, couponNameSnapshot: LIMIT100.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === LIMIT100.id)!),
    member: 'user05', issueMethod: '관리자 발급', issueReason: '운영자 지급', issueDetail: '선착순 이벤트 당첨',
    issuedAt: '2026-08-05 10:00', expiresAt: '2026-08-19 23:59',
    status: '사용 가능', usedAt: null, orderId: null, discountAmount: null,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'admin03', memos: [],
    history: [{ id: 'H-1', at: '2026-08-05 10:00', by: 'admin03', action: '쿠폰 발급', detail: '운영자 지급' }],
  },
  {
    id: 'CI-20260701-00003', couponId: SPRING02.id, couponCode: SPRING02.code, couponNameSnapshot: SPRING02.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === SPRING02.id)!),
    member: 'user06', issueMethod: '관리자 발급', issueReason: '기타', issueDetail: '중복 발급 확인됨',
    issuedAt: '2026-04-05 09:00', expiresAt: '2026-05-05 23:59',
    status: '회수', usedAt: null, orderId: null, discountAmount: null,
    revokedAt: '2026-04-06 10:00', revokedBy: 'admin03', revokeReason: '중복 발급', revokeDetail: '동일 쿠폰 이중 발급으로 확인되어 회수.',
    owner: 'admin03', memos: [],
    history: [
      { id: 'H-1', at: '2026-04-05 09:00', by: 'admin03', action: '쿠폰 발급', detail: '기타' },
      { id: 'H-2', at: '2026-04-06 10:00', by: 'admin03', action: '쿠폰 회수', detail: '중복 발급' },
    ],
  },
  {
    id: 'CI-20260410-00002', couponId: SPRING02.id, couponCode: SPRING02.code, couponNameSnapshot: SPRING02.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === SPRING02.id)!),
    member: 'user07', issueMethod: '자동 발급', issueReason: '이벤트', issueDetail: '봄맞이 카테고리 02 프로모션',
    issuedAt: '2026-04-10 09:00', expiresAt: '2026-05-10 23:59',
    status: '사용 가능', usedAt: null, orderId: null, discountAmount: null,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'SYSTEM', memos: [],
    history: [{ id: 'H-1', at: '2026-04-10 09:00', by: 'SYSTEM', action: '쿠폰 발급', detail: '이벤트' }],
  },
  {
    id: 'CI-20260822-00060', couponId: PRODUCT10.id, couponCode: PRODUCT10.code, couponNameSnapshot: PRODUCT10.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === PRODUCT10.id)!),
    member: 'user08', issueMethod: '관리자 발급', issueReason: '프로모션', issueDetail: '9월 상품 프로모션 사전 발급',
    issuedAt: '2026-08-22 09:00', expiresAt: '2026-10-31 23:59',
    status: '사용 완료', usedAt: '2026-08-24 10:00', orderId: 'O-00990', discountAmount: 4200,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'admin02', memos: [],
    history: [
      { id: 'H-1', at: '2026-08-22 09:00', by: 'admin02', action: '쿠폰 발급', detail: '프로모션' },
      { id: 'H-2', at: '2026-08-24 10:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00990 · 할인 4,200원' },
    ],
  },
  {
    id: 'CI-20260719-00035', couponId: CATE01.id, couponCode: CATE01.code, couponNameSnapshot: CATE01.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === CATE01.id)!),
    member: 'user01', issueMethod: '자동 발급', issueReason: '이벤트', issueDetail: '카테고리 01 프로모션 참여',
    issuedAt: '2026-07-19 09:00', expiresAt: '2026-08-18 23:59',
    status: '사용 가능', usedAt: null, orderId: null, discountAmount: null,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'SYSTEM', memos: [],
    history: [{ id: 'H-1', at: '2026-07-19 09:00', by: 'SYSTEM', action: '쿠폰 발급', detail: '이벤트' }],
  },
  {
    id: 'CI-20260812-00028', couponId: NEW5000.id, couponCode: NEW5000.code, couponNameSnapshot: NEW5000.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(COUPONS.find((c) => c.id === NEW5000.id)!),
    member: 'user05', issueMethod: '자동 발급', issueReason: '회원가입', issueDetail: '회원가입 완료 이벤트',
    issuedAt: '2026-08-12 08:00', expiresAt: '2026-08-11 23:59',
    status: '사용 가능', usedAt: null, orderId: null, discountAmount: null,
    revokedAt: null, revokedBy: null, revokeReason: null, revokeDetail: null,
    owner: 'SYSTEM', memos: [{ id: 'M-1', at: '2026-08-26 09:00', by: 'admin02', text: '만료일이 발급일 이전으로 계산된 것으로 보입니다. 확인 필요.' }],
    history: [{ id: 'H-1', at: '2026-08-12 08:00', by: 'SYSTEM', action: '쿠폰 발급', detail: '회원가입' }],
  },
];
