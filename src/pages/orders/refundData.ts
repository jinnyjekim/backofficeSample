export type RefundStatus = '요청' | '검토중' | '승인' | '처리중' | '완료' | '반려' | '실패';
export type RefundType = '전체 환불' | '부분 환불';
export type RefundReason = '고객 변심' | '상품 불량' | '배송 오류' | '오배송' | '결제 오류' | '기타';
export type OriginType = '반품' | '주문 취소' | '관리자 조정' | '결제 오류' | '기타';
export type PaymentMethod = '신용카드' | '계좌이체' | '가상계좌' | '포인트';
export type AdjustmentType = '쿠폰 할인 재계산' | '반품 배송비' | '기타 차감' | '추가 환급';

export const REFUND_REASONS: RefundReason[] = ['고객 변심', '상품 불량', '배송 오류', '오배송', '결제 오류', '기타'];
export const PAYMENT_METHODS: PaymentMethod[] = ['신용카드', '계좌이체', '가상계좌', '포인트'];
export const REJECT_REASONS = ['환불 가능 기간 경과', '반품 상품 미회수', '환불 정책 대상 아님', '고객 요청 철회', '기타'];
export const ADJUSTMENT_TYPES: AdjustmentType[] = ['쿠폰 할인 재계산', '반품 배송비', '기타 차감', '추가 환급'];
export const OWNERS = ['admin01', 'admin02', '미배정'];

export interface RefundItem {
  productCode: string;
  productName: string;
  orderQty: number;
  refundQty: number;
  amount: number;
}

export interface Adjustment {
  id: string;
  type: AdjustmentType;
  amount: number; // signed: negative = deduction, positive = additional refund
  reason: string;
  basis?: string;
  by: string;
  at: string;
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

export interface RefundRequest {
  id: string;
  orderId: string;
  customer: string;
  refundType: RefundType;
  status: RefundStatus;
  reason: RefundReason;
  reasonDetail: string;
  requesterType: '고객' | '관리자';
  requester: string;
  requestedAt: string;

  originType: OriginType;
  originId: string | null;
  orderStatus: string;
  returnStatus?: string;
  inspectionResult?: string;

  items: RefundItem[];
  adjustments: Adjustment[];

  paymentMethod: PaymentMethod;
  originalPaymentAmount: number;

  owner: string;

  approvedAt?: string;
  approvedBy?: string;
  approvalMemo?: string;

  executedAt?: string;
  pgTxId?: string;

  completedAt?: string;
  externalRefundNo?: string;

  failedAt?: string;
  failCode?: string;
  failReason?: string;

  rejectReason?: string;
  rejectDetail?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  notifyCustomer?: boolean;

  memos: Memo[];
  history: HistoryEntry[];
}

const TODAY = '2026-08-25';

export const STATUS_META: Record<RefundStatus, { bg: string; fg: string; dot: string }> = {
  요청: { bg: '#f4f4f5', fg: '#52525b', dot: '#a1a1aa' },
  검토중: { bg: '#eff6ff', fg: '#1d4ed8', dot: '#3b82f6' },
  승인: { bg: '#eef2ff', fg: '#4338ca', dot: '#6366f1' },
  처리중: { bg: '#fffbeb', fg: '#b45309', dot: '#f59e0b' },
  완료: { bg: '#ecfdf5', fg: '#047857', dot: '#10b981' },
  반려: { bg: '#f4f4f5', fg: '#71717a', dot: '#a1a1aa' },
  실패: { bg: '#fef2f2', fg: '#dc2626', dot: '#ef4444' },
};

export function itemsAmount(items: RefundItem[]): number {
  return items.filter((i) => i.refundQty > 0).reduce((sum, i) => sum + i.amount, 0);
}

export function adjustmentsTotal(adjustments: Adjustment[]): number {
  return adjustments.reduce((sum, a) => sum + a.amount, 0);
}

export function computeFinalAmount(req: RefundRequest): number {
  return itemsAmount(req.items) + adjustmentsTotal(req.adjustments);
}

export function computeCumulativeRefunded(orderId: string, all: RefundRequest[], excludeId?: string): number {
  return all
    .filter((r) => r.orderId === orderId && r.id !== excludeId && r.status === '완료')
    .reduce((sum, r) => sum + computeFinalAmount(r), 0);
}

export function computeRefundableBalance(req: RefundRequest, all: RefundRequest[]): number {
  return req.originalPaymentAmount - computeCumulativeRefunded(req.orderId, all, req.id);
}

export function findDuplicates(req: RefundRequest, all: RefundRequest[]): RefundRequest[] {
  const activeStatuses: RefundStatus[] = ['요청', '검토중', '승인', '처리중'];
  const codes = new Set(req.items.filter((i) => i.refundQty > 0).map((i) => i.productCode));
  return all.filter(
    (r) =>
      r.id !== req.id &&
      r.orderId === req.orderId &&
      activeStatuses.includes(r.status) &&
      r.items.some((i) => i.refundQty > 0 && codes.has(i.productCode)),
  );
}

export interface ChecklistItem {
  label: string;
  pass: boolean;
  detail?: string;
}

export function computeApprovalChecklist(req: RefundRequest, all: RefundRequest[]): ChecklistItem[] {
  const dup = findDuplicates(req, all);
  const balance = computeRefundableBalance(req, all);
  const finalAmount = computeFinalAmount(req);
  return [
    { label: '환불 대상 확인', pass: req.items.some((i) => i.refundQty > 0) },
    {
      label: '반품 검수 완료',
      pass: req.originType !== '반품' || req.inspectionResult === '정상',
      detail: req.originType === '반품' && req.inspectionResult !== '정상' ? `현재 검수 상태: ${req.inspectionResult ?? '미확인'}` : undefined,
    },
    {
      label: '환불 가능 금액 확인',
      pass: finalAmount <= balance,
      detail: finalAmount > balance ? `환불 예정금액(${fmtWon(finalAmount)})이 환불 가능 잔액(${fmtWon(balance)})을 초과합니다.` : undefined,
    },
    { label: '결제수단 확인', pass: !!req.paymentMethod },
    {
      label: '중복 환불 없음',
      pass: dup.length === 0,
      detail: dup.length > 0 ? `동일 주문/상품에 처리중인 환불이 있습니다: ${dup.map((d) => d.id).join(', ')}` : undefined,
    },
  ];
}

export function canApprove(req: RefundRequest, all: RefundRequest[]): boolean {
  return req.status === '검토중' && computeApprovalChecklist(req, all).every((c) => c.pass);
}

export function fmtWon(n: number): string {
  return `${n < 0 ? '-' : ''}${Math.abs(n).toLocaleString('ko-KR')}원`;
}

export function fmtSigned(n: number): string {
  if (n === 0) return '0원';
  return `${n > 0 ? '+' : '-'}${Math.abs(n).toLocaleString('ko-KR')}원`;
}

function item(productCode: string, productName: string, orderQty: number, refundQty: number, amount: number): RefundItem {
  return { productCode, productName, orderQty, refundQty, amount };
}

export const INITIAL_REFUNDS: RefundRequest[] = [
  {
    id: 'REF-00182',
    orderId: 'O-00582',
    customer: 'user01',
    refundType: '부분 환불',
    status: '검토중',
    reason: '고객 변심',
    reasonDetail: '상품 사이즈가 맞지 않습니다.',
    requesterType: '고객',
    requester: 'user01',
    requestedAt: '2026-08-25 10:20',
    originType: '반품',
    originId: 'RETURN-00182',
    orderStatus: '배송 완료',
    returnStatus: '회수 완료',
    inspectionResult: '정상',
    items: [item('P-001238', '상품01', 2, 1, 20000), item('P-001239', '상품02', 1, 0, 0)],
    adjustments: [
      { id: 'A-1', type: '쿠폰 할인 재계산', amount: -2000, reason: '쿠폰 CP-00182 할인분 배분 차감', basis: '쿠폰 CP-00182', by: 'admin01', at: '2026-08-25 12:20' },
      { id: 'A-2', type: '반품 배송비', amount: -3000, reason: '반품 배송비 차감', basis: '상품별 배송 정책 POLICY-0018', by: 'admin01', at: '2026-08-25 12:20' },
      { id: 'A-3', type: '추가 환급', amount: 2000, reason: '배송 지연 보상', by: 'admin02', at: '2026-08-25 12:20' },
    ],
    paymentMethod: '신용카드',
    originalPaymentAmount: 48000,
    owner: 'admin01',
    memos: [
      { id: 'M-1', at: '2026-08-25 11:30', by: 'admin01', text: '상품 검수 완료.' },
      { id: 'M-2', at: '2026-08-25 12:20', by: 'admin02', text: '배송비 3,000원 차감 후 승인 예정.' },
    ],
    history: [
      { id: 'H-1', at: '2026-08-25 10:20', by: 'user01', action: '환불 요청' },
      { id: 'H-2', at: '2026-08-25 10:30', by: 'admin01', action: '담당자 지정' },
      { id: 'H-3', at: '2026-08-25 11:00', by: 'admin01', action: '검토 시작' },
      { id: 'H-4', at: '2026-08-25 12:20', by: 'admin01', action: '환불금액 확정', before: '20,000원', after: '17,000원' },
    ],
  },
  {
    id: 'REF-00181',
    orderId: 'O-00581',
    customer: 'user02',
    refundType: '전체 환불',
    status: '처리중',
    reason: '배송 오류',
    reasonDetail: '주문한 상품과 다른 상품이 배송되었습니다.',
    requesterType: '고객',
    requester: 'user02',
    requestedAt: '2026-08-25 09:10',
    originType: '주문 취소',
    originId: 'CANCEL-00181',
    orderStatus: '주문 취소',
    items: [item('P-001240', '상품A', 1, 1, 42000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 42000,
    owner: 'admin02',
    approvedAt: '2026-08-25 10:40',
    approvedBy: 'admin02',
    executedAt: '2026-08-25 11:10',
    pgTxId: 'TX-R-00181',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-25 09:10', by: 'user02', action: '환불 요청' },
      { id: 'H-2', at: '2026-08-25 09:40', by: 'admin02', action: '검토 시작' },
      { id: 'H-3', at: '2026-08-25 10:40', by: 'admin02', action: '환불 승인' },
      { id: 'H-4', at: '2026-08-25 11:10', by: 'admin02', action: 'PG 환불 요청' },
    ],
  },
  {
    id: 'REF-00179',
    orderId: 'O-00582',
    customer: 'user01',
    refundType: '부분 환불',
    status: '완료',
    reason: '고객 변심',
    reasonDetail: '색상이 마음에 들지 않습니다.',
    requesterType: '고객',
    requester: 'user01',
    requestedAt: '2026-08-19 14:00',
    originType: '반품',
    originId: 'RETURN-00179',
    orderStatus: '배송 완료',
    returnStatus: '회수 완료',
    inspectionResult: '정상',
    items: [item('P-001241', '상품03', 1, 1, 10000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 48000,
    owner: 'admin01',
    approvedAt: '2026-08-20 09:00',
    approvedBy: 'admin01',
    executedAt: '2026-08-20 09:10',
    pgTxId: 'TX-R-00179',
    completedAt: '2026-08-20 09:12',
    externalRefundNo: 'R-00179',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-19 14:00', by: 'user01', action: '환불 요청' },
      { id: 'H-2', at: '2026-08-20 09:00', by: 'admin01', action: '환불 승인' },
      { id: 'H-3', at: '2026-08-20 09:10', by: 'admin01', action: 'PG 환불 요청' },
      { id: 'H-4', at: '2026-08-20 09:12', by: 'admin01', action: '환불 완료' },
    ],
  },
  {
    id: 'REF-00160',
    orderId: 'O-00560',
    customer: 'user03',
    refundType: '부분 환불',
    status: '완료',
    reason: '상품 불량',
    reasonDetail: '박음질 불량으로 확인되어 반품 접수합니다.',
    requesterType: '고객',
    requester: 'user03',
    requestedAt: '2026-08-24 10:00',
    originType: '반품',
    originId: 'RETURN-00160',
    orderStatus: '배송 완료',
    returnStatus: '검수 완료',
    inspectionResult: '정상',
    items: [item('P-000982', '상품05', 1, 1, 35000)],
    adjustments: [],
    paymentMethod: '계좌이체',
    originalPaymentAmount: 35000,
    owner: 'admin01',
    approvedAt: '2026-08-24 15:00',
    approvedBy: 'admin01',
    executedAt: '2026-08-24 16:20',
    pgTxId: 'TX-R-00160',
    completedAt: '2026-08-24 16:40',
    externalRefundNo: 'R-00160',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-24 10:00', by: 'user03', action: '환불 요청' },
      { id: 'H-2', at: '2026-08-24 15:00', by: 'admin01', action: '환불 승인' },
      { id: 'H-3', at: '2026-08-24 16:20', by: 'admin01', action: 'PG 환불 요청' },
      { id: 'H-4', at: '2026-08-24 16:40', by: 'admin01', action: '환불 완료' },
    ],
  },
  {
    id: 'REF-00155',
    orderId: 'O-00555',
    customer: 'user04',
    refundType: '전체 환불',
    status: '반려',
    reason: '기타',
    reasonDetail: '단순 변심으로 환불 요청.',
    requesterType: '고객',
    requester: 'user04',
    requestedAt: '2026-08-15 10:00',
    originType: '기타',
    originId: null,
    orderStatus: '배송 완료',
    items: [item('P-001238', '상품04', 1, 1, 15000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 15000,
    owner: 'admin02',
    rejectReason: '환불 가능 기간 경과',
    rejectDetail: '구매확정 후 30일이 경과하여 환불이 불가합니다.',
    rejectedAt: '2026-08-23 11:00',
    rejectedBy: 'admin02',
    notifyCustomer: true,
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-15 10:00', by: 'user04', action: '환불 요청' },
      { id: 'H-2', at: '2026-08-23 10:40', by: 'admin02', action: '검토 시작' },
      { id: 'H-3', at: '2026-08-23 11:00', by: 'admin02', action: '환불 반려', after: '환불 가능 기간 경과' },
    ],
  },
  {
    id: 'REF-00150',
    orderId: 'O-00550',
    customer: 'user05',
    refundType: '부분 환불',
    status: '실패',
    reason: '오배송',
    reasonDetail: '다른 상품이 배송되어 환불 요청합니다.',
    requesterType: '고객',
    requester: 'user05',
    requestedAt: '2026-08-22 08:00',
    originType: '반품',
    originId: 'RETURN-00150',
    orderStatus: '배송 완료',
    returnStatus: '회수 완료',
    inspectionResult: '정상',
    items: [item('P-001239', '상품05', 2, 1, 25000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 60000,
    owner: 'admin01',
    approvedAt: '2026-08-22 08:40',
    approvedBy: 'admin01',
    executedAt: '2026-08-22 09:00',
    pgTxId: 'TX-R-00150',
    failedAt: '2026-08-22 09:02',
    failCode: 'PG-R102',
    failReason: '원 거래 상태 확인 필요',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-22 08:00', by: 'user05', action: '환불 요청' },
      { id: 'H-2', at: '2026-08-22 08:40', by: 'admin01', action: '환불 승인' },
      { id: 'H-3', at: '2026-08-22 09:00', by: 'admin01', action: 'PG 환불 요청' },
      { id: 'H-4', at: '2026-08-22 09:02', by: 'admin01', action: '환불 실패', after: 'PG-R102' },
    ],
  },
  {
    id: 'REF-00145',
    orderId: 'O-00545',
    customer: 'user01',
    refundType: '전체 환불',
    status: '승인',
    reason: '고객 변심',
    reasonDetail: '재고가 있는 다른 상품으로 재구매 예정입니다.',
    requesterType: '고객',
    requester: 'user01',
    requestedAt: '2026-08-24 09:00',
    originType: '반품',
    originId: 'RETURN-00145',
    orderStatus: '배송 완료',
    returnStatus: '검수 완료',
    inspectionResult: '정상',
    items: [item('P-001240', '상품06', 1, 1, 28000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 28000,
    owner: 'admin01',
    approvedAt: '2026-08-25 09:00',
    approvedBy: 'admin01',
    approvalMemo: '검수 정상 확인, 승인 처리합니다.',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-24 09:00', by: 'user01', action: '환불 요청' },
      { id: 'H-2', at: '2026-08-24 10:00', by: 'admin01', action: '검토 시작' },
      { id: 'H-3', at: '2026-08-25 09:00', by: 'admin01', action: '환불 승인' },
    ],
  },
  {
    id: 'REF-00140',
    orderId: 'O-00540',
    customer: 'user02',
    refundType: '부분 환불',
    status: '요청',
    reason: '상품 불량',
    reasonDetail: '작동이 되지 않습니다.',
    requesterType: '고객',
    requester: 'user02',
    requestedAt: '2026-08-25 13:40',
    originType: '반품',
    originId: 'RETURN-00140',
    orderStatus: '배송 완료',
    returnStatus: '회수 대기',
    items: [item('P-001241', '상품07', 3, 1, 12000)],
    adjustments: [],
    paymentMethod: '가상계좌',
    originalPaymentAmount: 36000,
    owner: '미배정',
    memos: [],
    history: [{ id: 'H-1', at: '2026-08-25 13:40', by: 'user02', action: '환불 요청' }],
  },
  {
    id: 'REF-00185',
    orderId: 'O-00570',
    customer: 'user03',
    refundType: '부분 환불',
    status: '검토중',
    reason: '상품 불량',
    reasonDetail: '표면에 스크래치가 있습니다.',
    requesterType: '고객',
    requester: 'user03',
    requestedAt: '2026-08-24 15:00',
    originType: '반품',
    originId: 'RETURN-00185',
    orderStatus: '배송 완료',
    returnStatus: '검수중',
    inspectionResult: '검수 대기',
    items: [item('P-000982', '상품08', 1, 1, 18000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 18000,
    owner: 'admin02',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-24 15:00', by: 'user03', action: '환불 요청' },
      { id: 'H-2', at: '2026-08-24 15:30', by: 'admin02', action: '검토 시작' },
    ],
  },
  {
    id: 'REF-00171',
    orderId: 'O-00590',
    customer: 'user04',
    refundType: '부분 환불',
    status: '요청',
    reason: '고객 변심',
    reasonDetail: '사용하지 않아 환불 원합니다.',
    requesterType: '고객',
    requester: 'user04',
    requestedAt: '2026-08-25 08:00',
    originType: '반품',
    originId: 'RETURN-00171',
    orderStatus: '배송 완료',
    returnStatus: '회수 대기',
    items: [item('P-001238', '상품A', 2, 1, 22000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 44000,
    owner: '미배정',
    memos: [],
    history: [{ id: 'H-1', at: '2026-08-25 08:00', by: 'user04', action: '환불 요청' }],
  },
  {
    id: 'REF-00172',
    orderId: 'O-00590',
    customer: 'user04',
    refundType: '부분 환불',
    status: '검토중',
    reason: '오배송',
    reasonDetail: 'CS 상담 중 오배송으로 확인되어 등록.',
    requesterType: '관리자',
    requester: 'admin01',
    requestedAt: '2026-08-25 08:10',
    originType: '기타',
    originId: null,
    orderStatus: '배송 완료',
    items: [item('P-001238', '상품A', 2, 1, 22000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 44000,
    owner: 'admin01',
    memos: [{ id: 'M-1', at: '2026-08-25 08:20', by: 'admin01', text: 'CS 요청 건. REF-00171과 중복 여부 확인 필요.' }],
    history: [
      { id: 'H-1', at: '2026-08-25 08:10', by: 'admin01', action: '환불 등록 (관리자)' },
      { id: 'H-2', at: '2026-08-25 08:20', by: 'admin01', action: '검토 시작' },
    ],
  },
  {
    id: 'REF-00190',
    orderId: 'O-00595',
    customer: 'user05',
    refundType: '전체 환불',
    status: '처리중',
    reason: '결제 오류',
    reasonDetail: '중복 결제가 확인되어 환불 처리합니다.',
    requesterType: '관리자',
    requester: 'admin02',
    requestedAt: '2026-08-25 11:40',
    originType: '결제 오류',
    originId: null,
    orderStatus: '주문 완료',
    items: [item('P-001239', '상품09', 1, 1, 9000)],
    adjustments: [],
    paymentMethod: '신용카드',
    originalPaymentAmount: 9000,
    owner: 'admin02',
    approvedAt: '2026-08-25 11:50',
    approvedBy: 'admin02',
    executedAt: '2026-08-25 12:00',
    pgTxId: 'TX-R-00190',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-08-25 11:40', by: 'admin02', action: '환불 등록 (관리자)' },
      { id: 'H-2', at: '2026-08-25 11:50', by: 'admin02', action: '환불 승인' },
      { id: 'H-3', at: '2026-08-25 12:00', by: 'admin02', action: 'PG 환불 요청' },
    ],
  },
];

export type QuickFilter = '전체' | '처리 필요' | '요청' | '검토중' | '승인' | '처리중' | '완료' | '반려' | '실패';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '처리 필요', '요청', '검토중', '승인', '처리중', '완료', '반려', '실패'];

export function matchesQuickFilter(req: RefundRequest, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '처리 필요') return req.status === '요청' || req.status === '검토중' || req.status === '승인' || req.status === '실패';
  return req.status === filter;
}

export const TODAY_DATE = TODAY;
