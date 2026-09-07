export interface CancelItem {
  id: string; // 취소번호 (CAN-...)
  orderId: string; // 주문번호 (ORD-...)
  member: string; // 고객명
  phone: string; // 연락처
  product: string; // 취소 품목명 및 옵션
  totalOrderAmount: number; // 전체 주문 금액
  cancelAmount: number; // 취소/환불 요청 금액
  cancelType: '전체 취소' | '부분 취소';
  reasonCategory: '단순 변심' | '주문 정보 변경' | '배송 지연' | '중복 주문' | '결제 수단 변경';
  reasonDetail: string; // 상세 사유
  stage: '취소 요청' | '취소 승인' | '취소 반려' | '취소 완료';
  paymentMethod: string; // 결제 수단 (신용카드, 카카오페이 등)
  requestedAt: string; // 취소 신청일시
  approvedAt?: string; // 승인일시
  completedAt?: string; // 환불 완료일시
  rejectedAt?: string; // 반려일시
  rejectReason?: string; // 반려 사유 (출고 완료 등)
  deductCoupon?: number; // 부분 취소 시 쿠폰 할인 차감액
  assignee: string; // 담당자
  memos: { when: string; by: string; text: string }[];
  history: { when: string; title: string; by?: string }[];
}

export const CANCEL_STAGE_META: Record<string, { bg: string; fg: string }> = {
  '취소 요청': { bg: '#fff7ed', fg: '#c2410c' },
  '취소 승인': { bg: '#eff6ff', fg: '#2563eb' },
  '취소 반려': { bg: '#fef2f2', fg: '#dc2626' },
  '취소 완료': { bg: '#ecfdf5', fg: '#047857' },
};

export const CANCEL_REASON_META: Record<string, { bg: string; fg: string }> = {
  '단순 변심': { bg: '#f4f4f5', fg: '#52525b' },
  '주문 정보 변경': { bg: '#eff6ff', fg: '#1d4ed8' },
  '배송 지연': { bg: '#fefce8', fg: '#a16207' },
  '중복 주문': { bg: '#fffbeb', fg: '#b45309' },
  '결제 수단 변경': { bg: '#f5f3ff', fg: '#7c3aed' },
};

export const INITIAL_CANCELS: CancelItem[] = [
  {
    id: 'CAN-260827-0162',
    orderId: 'ORD-20260827-7712',
    member: '김지은',
    phone: '010-3321-4491',
    product: '오가닉 코튼 티셔츠 화이트 L',
    totalOrderAmount: 48000,
    cancelAmount: 48000,
    cancelType: '전체 취소',
    reasonCategory: '단순 변심',
    reasonDetail: '주문 직후 다른 상품으로 재주문하기 위해 취소합니다.',
    stage: '취소 요청',
    paymentMethod: '신용카드 (현대카드)',
    requestedAt: '2026.08.27 11:50',
    assignee: '미배정',
    memos: [],
    history: [{ when: '08.27 11:50', title: '고객 취소 요청 접수' }],
  },
  {
    id: 'CAN-260827-0158',
    orderId: 'ORD-20260827-7690',
    member: '박서연',
    phone: '010-8812-7744',
    product: '스마트 블루투스 스피커 프로 (외 1건)',
    totalOrderAmount: 139000,
    cancelAmount: 69000,
    cancelType: '부분 취소',
    reasonCategory: '주문 정보 변경',
    reasonDetail: '옵션 수량 2개 중 1개만 취소하고 1개는 그대로 수령 원함.',
    stage: '취소 요청',
    paymentMethod: '카카오페이 (머니)',
    requestedAt: '2026.08.27 10:45',
    deductCoupon: 5000,
    assignee: '박지수',
    memos: [{ when: '08.27 10:50', by: '박지수', text: '부분 취소에 따른 쿠폰 조건(10만원 이상 5천원 할인) 미달로 5,000원 차감 환불 안내 필요.' }],
    history: [{ when: '08.27 10:45', title: '고객 부분 취소 요청 접수' }],
  },
  {
    id: 'CAN-260827-0155',
    orderId: 'ORD-20260826-7510',
    member: '이민수',
    phone: '010-9921-3312',
    product: '친환경 우드 커트러리 2인 세트',
    totalOrderAmount: 38000,
    cancelAmount: 38000,
    cancelType: '전체 취소',
    reasonCategory: '배송 지연',
    reasonDetail: '출고 예정일이 지연되어 주문 취소합니다.',
    stage: '취소 승인',
    paymentMethod: '네이버페이 (포인트)',
    requestedAt: '2026.08.27 09:10',
    approvedAt: '2026.08.27 09:40',
    assignee: '정하늘',
    memos: [{ when: '08.27 09:40', by: '정하늘', text: '배송 전 상태 확인 후 취소 승인 완료. PG 자동 환불 대기열 등록.' }],
    history: [
      { when: '08.27 09:10', title: '취소 요청 접수' },
      { when: '08.27 09:40', title: '관리자 취소 승인 (환불 대기)' },
    ],
  },
  {
    id: 'CAN-260826-0151',
    orderId: 'ORD-20260826-7312',
    member: '최준혁',
    phone: '010-4411-2299',
    product: '캠핑 롤 테이블 120cm Black',
    totalOrderAmount: 89000,
    cancelAmount: 89000,
    cancelType: '전체 취소',
    reasonCategory: '단순 변심',
    reasonDetail: '주문 취소 요청했으나 이미 상품이 출고 완료됨.',
    stage: '취소 반려',
    paymentMethod: '신용카드 (신한카드)',
    requestedAt: '2026.08.26 16:04',
    rejectedAt: '2026.08.26 17:10',
    rejectReason: '물류센터에서 송장 채번 및 택배사 인계(출고 완료) 상태로 취소 불가. 상품 수령 후 반품 접수로 안내.',
    assignee: '박지수',
    memos: [{ when: '08.26 17:10', by: '박지수', text: '고객 알림톡 발송 완료. 수령 후 반품 처리 프로세스 안내함.' }],
    history: [
      { when: '08.26 16:04', title: '취소 요청 접수' },
      { when: '08.26 17:10', title: '출고 완료로 인한 취소 반려' },
    ],
  },
  {
    id: 'CAN-260826-0148',
    orderId: 'ORD-20260826-7201',
    member: '강태양',
    phone: '010-7711-5500',
    product: '홈카페 글라스 잔 4P 세트 (외 2건)',
    totalOrderAmount: 92000,
    cancelAmount: 28000,
    cancelType: '부분 취소',
    reasonCategory: '중복 주문',
    reasonDetail: '글라스 잔 세트만 주문 중복으로 부분 취소 요청.',
    stage: '취소 완료',
    paymentMethod: '신용카드 (삼성카드)',
    requestedAt: '2026.08.26 14:00',
    approvedAt: '2026.08.26 14:20',
    completedAt: '2026.08.26 14:35',
    assignee: 'SYSTEM',
    memos: [{ when: '08.26 14:35', by: 'SYSTEM', text: '카드사 28,000원 부분 취소 승인 완료.' }],
    history: [
      { when: '08.26 14:00', title: '부분 취소 요청 접수' },
      { when: '08.26 14:20', title: '취소 승인' },
      { when: '08.26 14:35', title: '카드 부분 취소 환불 완료' },
    ],
  },
  {
    id: 'CAN-260826-0142',
    orderId: 'ORD-20260826-7085',
    member: '윤소희',
    phone: '010-6644-1188',
    product: '프리미엄 세라믹 머그 2P 세트',
    totalOrderAmount: 39800,
    cancelAmount: 39800,
    cancelType: '전체 취소',
    reasonCategory: '중복 주문',
    reasonDetail: '동일 상품을 실수로 2번 결제하여 1건 취소함.',
    stage: '취소 완료',
    paymentMethod: '토스페이 (계좌)',
    requestedAt: '2026.08.26 10:21',
    approvedAt: '2026.08.26 10:40',
    completedAt: '2026.08.26 11:02',
    assignee: 'SYSTEM',
    memos: [{ when: '08.26 11:02', by: 'SYSTEM', text: '토스페이 즉시 전액 환불 처리 완료.' }],
    history: [
      { when: '08.26 10:21', title: '취소 요청 접수' },
      { when: '08.26 10:40', title: '취소 승인' },
      { when: '08.26 11:02', title: '환불 완료' },
    ],
  },
];
