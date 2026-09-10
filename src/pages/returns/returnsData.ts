export type ReturnStage =
  | '요청'
  | '승인'
  | '회수 중'
  | '회수 완료'
  | '검수 중'
  | '완료'
  | '반려'
  | '철회'
  | '반품 요청'
  | '반품 승인'
  | '반품 회수'
  | '상품 확인'
  | '반품 완료'
  | '반품 반려';

export type PickupStatus = '회수 대기' | '수거 지시' | '회수 중' | '회수 완료' | '해당 없음';
export type RefundStatus = '환불 대기' | '환불 승인' | '환불 완료' | '환불 실패' | '해당 없음';
export type FaultParty = '구매자(고객)' | '판매자' | '택배사/물류';

export interface AuditLog {
  when: string;
  actor: string;
  action: string;
  prevStage?: string;
  nextStage: string;
  note: string;
  feeInfo?: string;
}

export interface ReturnItem {
  id: string; // 반품번호 (RET-...)
  orderId: string; // 주문번호 (ORD-...)
  member: string; // 고객명
  phone: string; // 연락처
  product: string; // 상품명 및 옵션
  quantity: number; // 반품 수량
  amount: number; // 원 결제 금액
  refundAmount: number; // 최종 환불 예정/완료 금액
  deductFee: number; // 반품 배송비 차감액
  feePayer: '구매자 부담' | '판매자 부담(무료)'; // 배송비 부담 주체
  faultParty: FaultParty; // 귀책 주체
  reasonCategory: '단순 변심' | '상품 불량' | '오배송' | '파손/오염' | '사이즈/색상 불일치';
  reasonDetail: string; // 고객 입력 상세 사유
  stage: ReturnStage; // 반품 상태
  pickupStatus: PickupStatus; // 회수 상태
  refundStatus: RefundStatus; // 환불 상태
  isHold?: boolean; // 보류/처리 지연 여부
  holdReason?: string; // 보류 사유
  cancelReason?: string; // 고객 철회 사유
  requestedAt: string; // 신청일시
  approvedAt?: string; // 승인일시
  collectedAt?: string; // 회수완료일시
  inspectedAt?: string; // 검수일시
  completedAt?: string; // 완료일시
  rejectedAt?: string; // 반려일시
  carrier: string; // 회수 택배사
  returnInvoiceNo: string; // 회수 송장번호
  pickupAddress: string; // 회수지 주소
  pickupMethod: '택배사 자동수거' | '고객 직접발송' | '현장 수거';
  inspectionResult?: '정상 양품' | '재포장 필요' | '상품 훼손' | '부속품 누락' | '검수 대기';
  assignee: string; // 담당자
  rejectReason?: string; // 반려 사유
  memos: { when: string; by: string; text: string }[];
  auditLogs: AuditLog[];
  history: { when: string; title: string; by?: string }[];
}

export const STAGE_META: Record<string, { bg: string; fg: string; dot?: string }> = {
  요청: { bg: '#fff7ed', fg: '#c2410c', dot: '#ea580c' },
  승인: { bg: '#eff6ff', fg: '#2563eb', dot: '#3b82f6' },
  '회수 중': { bg: '#fefce8', fg: '#a16207', dot: '#eab308' },
  '회수 완료': { bg: '#ecfeff', fg: '#0e7490', dot: '#06b6d4' },
  '검수 중': { bg: '#f5f3ff', fg: '#7c3aed', dot: '#8b5cf6' },
  완료: { bg: '#ecfdf5', fg: '#047857', dot: '#10b981' },
  반려: { bg: '#fef2f2', fg: '#dc2626', dot: '#ef4444' },
  철회: { bg: '#f4f4f5', fg: '#71717a', dot: '#a1a1aa' },
  // 이전 단계명 호환
  '반품 요청': { bg: '#fff7ed', fg: '#c2410c', dot: '#ea580c' },
  '반품 승인': { bg: '#eff6ff', fg: '#2563eb', dot: '#3b82f6' },
  '반품 회수': { bg: '#fefce8', fg: '#a16207', dot: '#eab308' },
  '상품 확인': { bg: '#f5f3ff', fg: '#7c3aed', dot: '#8b5cf6' },
  '반품 완료': { bg: '#ecfdf5', fg: '#047857', dot: '#10b981' },
  '반품 반려': { bg: '#fef2f2', fg: '#dc2626', dot: '#ef4444' },
};

export const PICKUP_META: Record<PickupStatus, { bg: string; fg: string }> = {
  '회수 대기': { bg: '#f4f4f5', fg: '#52525b' },
  '수거 지시': { bg: '#eff6ff', fg: '#1d4ed8' },
  '회수 중': { bg: '#fefce8', fg: '#854d0e' },
  '회수 완료': { bg: '#ecfeff', fg: '#0891b2' },
  '해당 없음': { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export const REFUND_META: Record<RefundStatus, { bg: string; fg: string }> = {
  '환불 대기': { bg: '#fff7ed', fg: '#c2410c' },
  '환불 승인': { bg: '#eff6ff', fg: '#2563eb' },
  '환불 완료': { bg: '#ecfdf5', fg: '#059669' },
  '환불 실패': { bg: '#fef2f2', fg: '#dc2626' },
  '해당 없음': { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export const FAULT_META: Record<FaultParty, { bg: string; fg: string }> = {
  '구매자(고객)': { bg: '#fff7ed', fg: '#9a3412' },
  판매자: { bg: '#eff6ff', fg: '#1e40af' },
  '택배사/물류': { bg: '#f5f3ff', fg: '#6b21a8' },
};

export const REASON_META: Record<string, { bg: string; fg: string }> = {
  '단순 변심': { bg: '#f4f4f5', fg: '#52525b' },
  '상품 불량': { bg: '#fef2f2', fg: '#dc2626' },
  오배송: { bg: '#fffbeb', fg: '#b45309' },
  '파손/오염': { bg: '#fef2f2', fg: '#b91c1c' },
  '사이즈/색상 불일치': { bg: '#eff6ff', fg: '#1d4ed8' },
};

export const RETURN_STAGES: ReturnStage[] = [
  '요청',
  '승인',
  '회수 중',
  '회수 완료',
  '검수 중',
  '완료',
  '반려',
  '철회',
];

export const INITIAL_RETURNS: ReturnItem[] = [
  {
    id: 'RET-260827-0098',
    orderId: 'ORD-20260823-5128',
    member: '이민수',
    phone: '010-4412-8890',
    product: '초경량 쿠셔닝 러닝화 270 Black',
    quantity: 1,
    amount: 112000,
    refundAmount: 106000,
    deductFee: 6000,
    feePayer: '구매자 부담',
    faultParty: '구매자(고객)',
    reasonCategory: '사이즈/색상 불일치',
    reasonDetail: '발볼이 너무 좁아 착용이 어렵습니다. 미착용 새상품입니다.',
    stage: '요청',
    pickupStatus: '회수 대기',
    refundStatus: '환불 대기',
    isHold: false,
    requestedAt: '2026.08.27 11:42',
    carrier: 'CJ대한통운',
    returnInvoiceNo: '6891-0021-9981',
    pickupAddress: '서울특별시 마포구 백범로 31 102동 405호',
    pickupMethod: '택배사 자동수거',
    assignee: '미배정',
    memos: [],
    auditLogs: [
      {
        when: '2026.08.27 11:42',
        actor: '고객(이민수)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '온라인 고객센터를 통한 반품 신청 접수',
        feeInfo: '반품 배송비 6,000원 구매자 부담 산정',
      },
    ],
    history: [{ when: '08.27 11:42', title: '고객 반품 요청 접수' }],
  },
  {
    id: 'RET-260827-0095',
    orderId: 'ORD-20260824-6012',
    member: '김서연',
    phone: '010-8831-2244',
    product: '프리미엄 린넨 셔츠 Sky Blue M',
    quantity: 2,
    amount: 98000,
    refundAmount: 92000,
    deductFee: 6000,
    feePayer: '구매자 부담',
    faultParty: '구매자(고객)',
    reasonCategory: '단순 변심',
    reasonDetail: '생각했던 색상 톤과 달라서 반품 신청합니다.',
    stage: '승인',
    pickupStatus: '수거 지시',
    refundStatus: '환불 대기',
    isHold: false,
    requestedAt: '2026.08.27 09:15',
    approvedAt: '2026.08.27 10:20',
    carrier: '한진택배',
    returnInvoiceNo: '5418-9901-3312',
    pickupAddress: '경기도 성남시 분당구 판교역로 145 701호',
    pickupMethod: '택배사 자동수거',
    assignee: '박지수',
    memos: [{ when: '08.27 10:20', by: '박지수', text: '고객 단순 변심으로 왕복 배송비 6,000원 차감 안내 승인함.' }],
    auditLogs: [
      {
        when: '2026.08.27 09:15',
        actor: '고객(김서연)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '고객 단순 변심 접수',
      },
      {
        when: '2026.08.27 10:20',
        actor: '박지수 (운영자)',
        action: '반품 승인 및 수거 지시',
        prevStage: '요청',
        nextStage: '승인',
        note: '반품 승인 완료 및 택배사 자동 수거 연동 완료',
        feeInfo: '배송비 6,000원 차감 확정',
      },
    ],
    history: [
      { when: '08.27 09:15', title: '반품 요청 접수' },
      { when: '08.27 10:20', title: '관리자 반품 승인 (회수 지시 완료)' },
    ],
  },
  {
    id: 'RET-260827-0092',
    orderId: 'ORD-20260822-4981',
    member: '강태양',
    phone: '010-9912-3345',
    product: '휴대용 블루투스 방수 스피커 Pro',
    quantity: 1,
    amount: 76000,
    refundAmount: 76000,
    deductFee: 0,
    feePayer: '판매자 부담(무료)',
    faultParty: '판매자',
    reasonCategory: '상품 불량',
    reasonDetail: '충전 케이블 연결 시 전원이 전혀 켜지지 않습니다.',
    stage: '회수 중',
    pickupStatus: '회수 중',
    refundStatus: '환불 대기',
    isHold: false,
    requestedAt: '2026.08.25 14:10',
    approvedAt: '2026.08.25 15:30',
    carrier: 'CJ대한통운',
    returnInvoiceNo: '6891-7712-4402',
    pickupAddress: '부산광역시 해운대구 센텀중앙로 88 1204호',
    pickupMethod: '택배사 자동수거',
    assignee: '한유진',
    memos: [{ when: '08.26 09:00', by: '한유진', text: '기사 배정 확인. 금일 오후 고객 방문 예정.' }],
    auditLogs: [
      {
        when: '2026.08.25 14:10',
        actor: '고객(강태양)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '초기 불량 접수',
      },
      {
        when: '2026.08.25 15:30',
        actor: '한유진 (운영자)',
        action: '반품 승인',
        prevStage: '요청',
        nextStage: '승인',
        note: '불량 사유 확인 및 무료 반품 승인',
        feeInfo: '판매자 귀책으로 배송비 면제(0원)',
      },
      {
        when: '2026.08.26 09:00',
        actor: 'CJ대한통운(연동)',
        action: '기사 배정 및 수거 출발',
        prevStage: '승인',
        nextStage: '회수 중',
        note: '집하 기사 방문 배정',
      },
    ],
    history: [
      { when: '08.25 14:10', title: '반품 요청 접수' },
      { when: '08.25 15:30', title: '반품 승인 및 회수 연동' },
      { when: '08.26 09:00', title: '택배사 기사 배정 및 수거 출발' },
    ],
  },
  {
    id: 'RET-260826-0089',
    orderId: 'ORD-20260821-4420',
    member: '한예린',
    phone: '010-3321-9988',
    product: '친환경 세라믹 디너웨어 4인 세트',
    quantity: 1,
    amount: 145000,
    refundAmount: 145000,
    deductFee: 0,
    feePayer: '판매자 부담(무료)',
    faultParty: '택배사/물류',
    reasonCategory: '파손/오염',
    reasonDetail: '택배 수령 시 대접 1개가 깨져서 도착했습니다.',
    stage: '회수 완료',
    pickupStatus: '회수 완료',
    refundStatus: '환불 대기',
    isHold: false,
    requestedAt: '2026.08.24 10:30',
    approvedAt: '2026.08.24 11:10',
    collectedAt: '2026.08.26 16:20',
    carrier: '롯데택배',
    returnInvoiceNo: '2387-4401-9921',
    pickupAddress: '인천광역시 부평구 부평대로 45 101동 502호',
    pickupMethod: '택배사 자동수거',
    inspectionResult: '검수 대기',
    assignee: '정하늘',
    memos: [{ when: '08.26 16:25', by: '정하늘', text: '용인 제1물류센터 입고 완료 확인. 검수 대기 중.' }],
    auditLogs: [
      {
        when: '2026.08.24 10:30',
        actor: '고객(한예린)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '배송 중 파손 접수',
      },
      {
        when: '2026.08.24 11:10',
        actor: '정하늘 (운영자)',
        action: '반품 승인',
        prevStage: '요청',
        nextStage: '승인',
        note: '파손 사진 확인 후 즉시 승인',
      },
      {
        when: '2026.08.26 16:20',
        actor: '물류센터(용인)',
        action: '반품 상품 물류센터 입고',
        prevStage: '회수 중',
        nextStage: '회수 완료',
        note: '실물 입고 확인 완료 (검수 인계)',
      },
    ],
    history: [
      { when: '08.24 10:30', title: '반품 요청 접수' },
      { when: '08.24 11:10', title: '반품 승인' },
      { when: '08.26 16:20', title: '물류센터 반품 입고 완료' },
    ],
  },
  {
    id: 'RET-260826-0084',
    orderId: 'ORD-20260820-3812',
    member: '최준혁',
    phone: '010-1234-5678',
    product: '무선 노이즈캔슬링 헤드폰 Matte Gray',
    quantity: 1,
    amount: 289000,
    refundAmount: 289000,
    deductFee: 0,
    feePayer: '판매자 부담(무료)',
    faultParty: '판매자',
    reasonCategory: '상품 불량',
    reasonDetail: '오른쪽 유닛 볼륨 출력이 매우 작고 잡음이 발생합니다.',
    stage: '검수 중',
    pickupStatus: '회수 완료',
    refundStatus: '환불 대기',
    isHold: false,
    requestedAt: '2026.08.23 13:00',
    approvedAt: '2026.08.23 14:00',
    collectedAt: '2026.08.25 15:40',
    inspectedAt: '2026.08.26 11:20',
    carrier: '우체국택배',
    returnInvoiceNo: '66012-4412-0091',
    pickupAddress: '대구광역시 수성구 동대구로 200 301호',
    pickupMethod: '택배사 자동수거',
    inspectionResult: '재포장 필요',
    assignee: '김민호',
    memos: [{ when: '08.26 11:25', by: '김민호', text: '외관 스크래치 없음. 음향 출력 불량 증상 확인되어 환불 승인 대상.' }],
    auditLogs: [
      {
        when: '2026.08.23 13:00',
        actor: '고객(최준혁)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '음향 불량 접수',
      },
      {
        when: '2026.08.25 15:40',
        actor: '물류센터',
        action: '회수 완료',
        prevStage: '회수 중',
        nextStage: '회수 완료',
        note: '물류센터 실물 입고',
      },
      {
        when: '2026.08.26 11:20',
        actor: '김민호 (검수팀)',
        action: '상품 검수 진행',
        prevStage: '회수 완료',
        nextStage: '검수 중',
        note: '정밀 음향 테스트 및 구성품 대조 중',
      },
    ],
    history: [
      { when: '08.23 13:00', title: '반품 요청 접수' },
      { when: '08.25 15:40', title: '물류센터 입고' },
      { when: '08.26 11:20', title: '상품 실물 검수 진행 (검수 중)' },
    ],
  },
  {
    id: 'RET-260825-0077',
    orderId: 'ORD-20260819-2910',
    member: '윤소희',
    phone: '010-5512-4401',
    product: '스테인리스 보온보냉 텀블러 500ml',
    quantity: 1,
    amount: 32000,
    refundAmount: 26000,
    deductFee: 6000,
    feePayer: '구매자 부담',
    faultParty: '구매자(고객)',
    reasonCategory: '단순 변심',
    reasonDetail: '다른 모델을 구매하여 반품합니다.',
    stage: '완료',
    pickupStatus: '회수 완료',
    refundStatus: '환불 완료',
    isHold: false,
    requestedAt: '2026.08.20 16:10',
    approvedAt: '2026.08.21 09:30',
    collectedAt: '2026.08.23 14:10',
    inspectedAt: '2026.08.24 10:00',
    completedAt: '2026.08.25 14:30',
    carrier: 'CJ대한통운',
    returnInvoiceNo: '6891-1192-3344',
    pickupAddress: '서울특별시 송파구 올림픽로 300 1201호',
    pickupMethod: '택배사 자동수거',
    inspectionResult: '정상 양품',
    assignee: 'SYSTEM',
    memos: [{ when: '08.25 14:30', by: 'SYSTEM', text: 'PG 환불 연동 완료 (카드 승인 부분취소 26,000원).' }],
    auditLogs: [
      {
        when: '2026.08.20 16:10',
        actor: '고객(윤소희)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '단순 변심 접수',
      },
      {
        when: '2026.08.24 10:00',
        actor: '검수팀',
        action: '검수 완료 (정상 양품)',
        prevStage: '검수 중',
        nextStage: '완료 대기',
        note: '미사용 양품 확인 및 재고 환입',
      },
      {
        when: '2026.08.25 14:30',
        actor: 'PG 결제 시스템',
        action: '최종 반품 처리 완료 및 환불 완료',
        prevStage: '검수 중',
        nextStage: '완료',
        note: 'PG사 결제 카드 부분 승인취소 26,000원 완료',
        feeInfo: '반품 배송비 6,000원 차감 정산',
      },
    ],
    history: [
      { when: '08.20 16:10', title: '반품 요청 접수' },
      { when: '08.24 10:00', title: '검수 양품 판정' },
      { when: '08.25 14:30', title: '환불 완료 및 반품 종결' },
    ],
  },
  {
    id: 'RET-260824-0062',
    orderId: 'ORD-20260818-1901',
    member: '오세훈',
    phone: '010-7788-9900',
    product: '스마트 LED 무드등 탁상시계',
    quantity: 1,
    amount: 49000,
    refundAmount: 0,
    deductFee: 0,
    feePayer: '구매자 부담',
    faultParty: '구매자(고객)',
    reasonCategory: '단순 변심',
    reasonDetail: '전원 케이블 분실 및 사용 흔적으로 검수 불합격',
    stage: '반려',
    pickupStatus: '회수 완료',
    refundStatus: '해당 없음',
    isHold: false,
    requestedAt: '2026.08.19 11:20',
    approvedAt: '2026.08.19 14:00',
    collectedAt: '2026.08.22 17:10',
    inspectedAt: '2026.08.23 11:00',
    rejectedAt: '2026.08.24 10:15',
    carrier: '한진택배',
    returnInvoiceNo: '5418-3312-7788',
    pickupAddress: '대전광역시 유성구 대학로 99 203호',
    pickupMethod: '택배사 자동수거',
    inspectionResult: '부속품 누락',
    rejectReason: '기본 구성품(전원 어댑터 및 C타입 케이블) 누락 및 본체 스크래치 다수 발견으로 반품 불가 판정. 고객 착불 재반송.',
    assignee: '박지수',
    memos: [{ when: '08.24 10:15', by: '박지수', text: '고객 유선 상담 완료 후 착불 반송 안내함.' }],
    auditLogs: [
      {
        when: '2026.08.19 11:20',
        actor: '고객(오세훈)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '단순 변심 신청',
      },
      {
        when: '2026.08.23 11:00',
        actor: '검수팀',
        action: '검수 불합격 판정',
        prevStage: '검수 중',
        nextStage: '검수 중',
        note: '부속품 누락 및 본체 훼손 확인',
      },
      {
        when: '2026.08.24 10:15',
        actor: '박지수 (운영자)',
        action: '반품 최종 반려 처리',
        prevStage: '검수 중',
        nextStage: '반려',
        note: '고객 안내 완료 후 반품 반려 및 착불 재반송 조치',
      },
    ],
    history: [
      { when: '08.19 11:20', title: '반품 요청 접수' },
      { when: '08.23 11:00', title: '검수 불합격 (부속품 누락)' },
      { when: '08.24 10:15', title: '반품 반려 및 고객 재반송 처리' },
    ],
  },
  {
    id: 'RET-260824-0055',
    orderId: 'ORD-20260817-1045',
    member: '송미경',
    phone: '010-6677-1234',
    product: '원목 스탠드 조명 Walnut Edition',
    quantity: 1,
    amount: 89000,
    refundAmount: 0,
    deductFee: 0,
    feePayer: '구매자 부담',
    faultParty: '구매자(고객)',
    reasonCategory: '단순 변심',
    reasonDetail: '주문 후 마음이 바뀌어 반품 접수했으나 그냥 사용하기로 함',
    stage: '철회',
    pickupStatus: '해당 없음',
    refundStatus: '해당 없음',
    isHold: false,
    cancelReason: '고객 직접 요청 취소(단순 사용 결정)',
    requestedAt: '2026.08.22 09:40',
    carrier: 'CJ대한통운',
    returnInvoiceNo: '-',
    pickupAddress: '서울특별시 강남구 테헤란로 152 14층',
    pickupMethod: '고객 직접발송',
    assignee: 'SYSTEM',
    memos: [{ when: '08.22 14:10', by: 'SYSTEM', text: '고객 마이페이지에서 반품 신청 철회 완료' }],
    auditLogs: [
      {
        when: '2026.08.22 09:40',
        actor: '고객(송미경)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '반품 접수',
      },
      {
        when: '2026.08.22 14:10',
        actor: '고객(송미경)',
        action: '반품 요청 고객 철회',
        prevStage: '요청',
        nextStage: '철회',
        note: '고객 마이페이지에서 직접 반품 요청 취소함',
      },
    ],
    history: [
      { when: '08.22 09:40', title: '반품 요청 접수' },
      { when: '08.22 14:10', title: '고객 반품 요청 철회 (취소)' },
    ],
  },
  {
    id: 'RET-260823-0048',
    orderId: 'ORD-20260816-0922',
    member: '임태훈',
    phone: '010-3849-0012',
    product: '프리미엄 밸런스 요가매트 10mm Purple',
    quantity: 1,
    amount: 54000,
    refundAmount: 48000,
    deductFee: 6000,
    feePayer: '구매자 부담',
    faultParty: '구매자(고객)',
    reasonCategory: '단순 변심',
    reasonDetail: '색상이 마음에 들지 않아 반품 접수',
    stage: '승인',
    pickupStatus: '수거 지시',
    refundStatus: '환불 대기',
    isHold: true,
    holdReason: '고객 부재 및 연락 두절로 수거 기사 3회 방문 실패 (보류 처리)',
    requestedAt: '2026.08.21 15:30',
    approvedAt: '2026.08.21 16:00',
    carrier: 'CJ대한통운',
    returnInvoiceNo: '6891-9923-0011',
    pickupAddress: '경기도 고양시 일산동구 중앙로 1261 402호',
    pickupMethod: '택배사 자동수거',
    assignee: '박지수',
    memos: [
      { when: '08.23 11:00', by: '박지수', text: '기사님 회수 3회 시도 실패(부재중). 고객 안내 문자 발송 및 보류 전환.' },
    ],
    auditLogs: [
      {
        when: '2026.08.21 15:30',
        actor: '고객(임태훈)',
        action: '반품 요청 접수',
        nextStage: '요청',
        note: '반품 접수',
      },
      {
        when: '2026.08.21 16:00',
        actor: '박지수 (운영자)',
        action: '반품 승인',
        prevStage: '요청',
        nextStage: '승인',
        note: '수거 지시 연동',
      },
      {
        when: '2026.08.23 11:00',
        actor: '박지수 (운영자)',
        action: '처리 보류 지정',
        nextStage: '승인',
        note: '고객 부재로 인한 회수 지연으로 처리 보류 설정',
      },
    ],
    history: [
      { when: '08.21 15:30', title: '반품 요청 접수' },
      { when: '08.21 16:00', title: '반품 승인' },
      { when: '08.23 11:00', title: '회수 지연으로 인한 처리 보류 지정' },
    ],
  },
];
