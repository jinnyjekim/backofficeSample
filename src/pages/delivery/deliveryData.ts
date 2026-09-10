import type { HistoryEntry, Memo, TrackingEntry } from './deliverySharedData';

export type DeliveryStage =
  | '배송 준비'
  | '출고 대기'
  | '출고 완료'
  | '배송 중'
  | '배송 완료'
  | '배송 실패';

export interface DeliveryAuditLog {
  when: string;
  actor: string;
  action: string;
  prevStage?: string;
  nextStage: string;
  note: string;
  invoiceChange?: string;
}

export interface DeliveryItem {
  id: string; // 배송번호 (DEL-...)
  orderId: string; // 주문번호 (ORD-...)
  receiver: string; // 수취인명
  phone: string; // 연락처
  product: string; // 배송 상품 및 옵션
  quantity: number; // 수량
  carrier: string; // 배송사
  invoiceNo: string; // 송장번호
  stage: DeliveryStage; // 배송 진행 단계
  isHold?: boolean; // 보류 여부
  holdReason?: string; // 보류 사유
  failReason?: string; // 배송 실패 사유 (수취인 부재, 주소 불명 등)
  address: string; // 배송지 주소
  deliveryType: '일반택배' | '당일배송' | '새벽배송' | '화물배송';
  assignee: string; // 작업 담당자
  orderedAt: string; // 주문일시
  preparedAt?: string; // 피킹/준비일시
  outboundWaitingAt?: string; // 포장/출고대기일시
  outboundCompletedAt?: string; // 출고완료일시
  inTransitAt?: string; // 집하/배송중일시
  deliveredAt?: string; // 배송완료일시
  failedAt?: string; // 배송실패일시
  memos: Memo[];
  tracking: TrackingEntry[];
  auditLogs: DeliveryAuditLog[];
  history: HistoryEntry[];
}

export const DELIVERY_STAGE_META: Record<DeliveryStage, { bg: string; fg: string; dot: string }> = {
  '배송 준비': { bg: '#fff7ed', fg: '#c2410c', dot: '#ea580c' },
  '출고 대기': { bg: '#fefce8', fg: '#a16207', dot: '#eab308' },
  '출고 완료': { bg: '#ecfeff', fg: '#0e7490', dot: '#06b6d4' },
  '배송 중': { bg: '#eff6ff', fg: '#2563eb', dot: '#3b82f6' },
  '배송 완료': { bg: '#ecfdf5', fg: '#047857', dot: '#10b981' },
  '배송 실패': { bg: '#fef2f2', fg: '#dc2626', dot: '#ef4444' },
};

export const DELIVERY_STAGES: DeliveryStage[] = [
  '배송 준비',
  '출고 대기',
  '출고 완료',
  '배송 중',
  '배송 완료',
  '배송 실패',
];

export const INITIAL_DELIVERIES: DeliveryItem[] = [
  {
    id: 'DEL-260827-0101',
    orderId: 'ORD-20260827-7712',
    receiver: '김민준',
    phone: '010-3841-9921',
    product: '초경량 쿠셔닝 러닝화 270 Black',
    quantity: 1,
    carrier: 'CJ대한통운',
    invoiceNo: '6891-4421-0834',
    stage: '배송 실패',
    isHold: false,
    failReason: '수취인 부재 (2회 방문)',
    address: '서울특별시 마포구 월드컵북로 120 (성산동) 302호',
    deliveryType: '일반택배',
    assignee: '김영희',
    orderedAt: '2026.08.25 10:30',
    preparedAt: '2026.08.25 14:00',
    outboundCompletedAt: '2026.08.26 09:20',
    inTransitAt: '2026.08.26 15:40',
    failedAt: '2026.08.27 14:20',
    memos: [{ when: '08.27 14:30', by: 'admin01', text: '고객 전화 부재로 알림톡 재배송 안내문 발송 완료.' }],
    tracking: [
      { title: '배송 준비', when: '08.25 14:00', source: 'WMS', dot: '#a1a1aa' },
      { title: '출고 완료', when: '08.26 09:20', source: '시스템', dot: '#a1a1aa' },
      { title: '배송 출발', when: '08.27 08:30', source: '택배사 API', dot: '#a1a1aa' },
      { title: '2차 부재 (배송 실패)', when: '08.27 14:20', source: '택배사 API', dot: '#dc2626' },
    ],
    auditLogs: [
      { when: '2026.08.25 14:00', actor: 'WMS', action: '배송 준비 (피킹 완료)', nextStage: '배송 준비', note: '주문 접수 후 피킹 리스트 생성' },
      { when: '2026.08.26 09:20', actor: '출고팀', action: '출고 완료', prevStage: '출고 대기', nextStage: '출고 완료', note: '송장 부착 및 물류센터 출고 완료' },
      { when: '2026.08.27 14:20', actor: '택배사(CJ)', action: '배송 실패 등록', prevStage: '배송 중', nextStage: '배송 실패', note: '수취인 2회 부재로 배송 실패 기록' },
    ],
    history: [
      { when: '08.25 14:00', title: '배송 준비 등록' },
      { when: '08.26 09:20', title: '창고 출고 완료' },
      { when: '08.27 14:20', title: '배송 실패 (수취인 부재)' },
    ],
  },
  {
    id: 'DEL-260827-0102',
    orderId: 'ORD-20260827-7715',
    receiver: '이지은',
    phone: '010-8712-4011',
    product: '프리미엄 세라믹 머그 4P 세트',
    quantity: 1,
    carrier: '한진택배',
    invoiceNo: '5418-8831-2910',
    stage: '배송 준비',
    isHold: false,
    address: '경기도 성남시 분당구 판교역로 145 701호',
    deliveryType: '일반택배',
    assignee: '박철수',
    orderedAt: '2026.08.27 09:10',
    preparedAt: '2026.08.27 11:00',
    memos: [],
    tracking: [{ title: '상품 피킹 및 준비 중', when: '08.27 11:00', source: 'WMS', dot: '#ea580c' }],
    auditLogs: [
      { when: '2026.08.27 11:00', actor: '박철수 (물류)', action: '배송 준비 지시', nextStage: '배송 준비', note: '용인센터 피킹 지시' },
    ],
    history: [{ when: '08.27 11:00', title: '배송 준비 착수' }],
  },
  {
    id: 'DEL-260827-0103',
    orderId: 'ORD-20260827-7720',
    receiver: '정태양',
    phone: '010-9921-3310',
    product: '휴대용 블루투스 방수 스피커 Pro',
    quantity: 1,
    carrier: 'CJ대한통운',
    invoiceNo: '6891-9923-0011',
    stage: '출고 대기',
    isHold: true,
    holdReason: '고객 휴가 일정으로 인한 출고 일시 보류 요청 (8/30 출고 요청)',
    address: '부산광역시 해운대구 센텀중앙로 88 1204호',
    deliveryType: '일반택배',
    assignee: '한유진',
    orderedAt: '2026.08.26 15:20',
    preparedAt: '2026.08.27 09:30',
    outboundWaitingAt: '2026.08.27 10:15',
    memos: [{ when: '08.27 10:20', by: 'cs_agent', text: '고객 휴가로 8/30 출고 요청 접수되어 보류 지정.' }],
    tracking: [{ title: '포장 완료 및 출고 보류', when: '08.27 10:15', source: '시스템', dot: '#f59e0b' }],
    auditLogs: [
      { when: '2026.08.27 09:30', actor: 'WMS', action: '포장 완료', prevStage: '배송 준비', nextStage: '출고 대기', note: '검수 및 에어캡 포장 완료' },
      { when: '2026.08.27 10:15', actor: '한유진 (운영)', action: '출고 보류 지정', nextStage: '출고 대기', note: '고객 요청으로 8/30까지 출고 보류' },
    ],
    history: [
      { when: '08.27 09:30', title: '포장 완료 (출고 대기)' },
      { when: '08.27 10:15', title: '출고 보류 설정 (고객 요청)' },
    ],
  },
  {
    id: 'DEL-260827-0104',
    orderId: 'ORD-20260826-6640',
    receiver: '한예린',
    phone: '010-3321-9988',
    product: '친환경 세라믹 디너웨어 4인 세트',
    quantity: 1,
    carrier: '롯데택배',
    invoiceNo: '2387-9912-4011',
    stage: '출고 완료',
    isHold: false,
    address: '인천광역시 부평구 부평대로 45 101동 502호',
    deliveryType: '일반택배',
    assignee: '정하늘',
    orderedAt: '2026.08.26 11:10',
    preparedAt: '2026.08.26 14:00',
    outboundWaitingAt: '2026.08.26 16:30',
    outboundCompletedAt: '2026.08.27 09:40',
    memos: [],
    tracking: [
      { title: '포장 완료', when: '08.26 16:30', source: '물류센터', dot: '#a1a1aa' },
      { title: '창고 출고 완료 (배송사 집하 대기)', when: '08.27 09:40', source: '시스템', dot: '#06b6d4' },
    ],
    auditLogs: [
      { when: '2026.08.27 09:40', actor: '물류창고', action: '출고 처리 완료', prevStage: '출고 대기', nextStage: '출고 완료', note: '택배사 인계 도크로 이동' },
    ],
    history: [{ when: '08.27 09:40', title: '출고 완료 (집하 대기)' }],
  },
  {
    id: 'DEL-260827-0105',
    orderId: 'ORD-20260825-5510',
    receiver: '최준혁',
    phone: '010-1234-5678',
    product: '무선 노이즈캔슬링 헤드폰 Matte Gray',
    quantity: 1,
    carrier: '우체국택배',
    invoiceNo: '66012-9901-2244',
    stage: '배송 중',
    isHold: false,
    address: '대구광역시 수성구 동대구로 200 301호',
    deliveryType: '일반택배',
    assignee: '김민호',
    orderedAt: '2026.08.25 13:00',
    preparedAt: '2026.08.25 15:00',
    outboundCompletedAt: '2026.08.26 09:00',
    inTransitAt: '2026.08.26 18:20',
    memos: [],
    tracking: [
      { title: '출고 완료', when: '08.26 09:00', source: '시스템', dot: '#a1a1aa' },
      { title: '우체국 집중국 집하 완료', when: '08.26 18:20', source: '우체국 API', dot: '#3b82f6' },
      { title: '대구 수성SUB 이동 중', when: '08.27 06:10', source: '우체국 API', dot: '#3b82f6' },
    ],
    auditLogs: [
      { when: '2026.08.26 18:20', actor: '우체국택배', action: '택배사 집하 확인 (배송 중 전환)', prevStage: '출고 완료', nextStage: '배송 중', note: '집하 바코드 스캔 연동' },
    ],
    history: [
      { when: '08.26 09:00', title: '출고 완료' },
      { when: '08.26 18:20', title: '집하 완료 및 배송 중' },
    ],
  },
  {
    id: 'DEL-260827-0106',
    orderId: 'ORD-20260824-4420',
    receiver: '윤소희',
    phone: '010-5512-4401',
    product: '스테인리스 보온보냉 텀블러 500ml',
    quantity: 2,
    carrier: 'CJ대한통운',
    invoiceNo: '6891-1192-3344',
    stage: '배송 완료',
    isHold: false,
    address: '서울특별시 송파구 올림픽로 300 1201호',
    deliveryType: '새벽배송',
    assignee: 'SYSTEM',
    orderedAt: '2026.08.24 16:10',
    preparedAt: '2026.08.24 18:00',
    outboundCompletedAt: '2026.08.24 22:30',
    inTransitAt: '2026.08.25 03:10',
    deliveredAt: '2026.08.25 06:40',
    memos: [{ when: '08.25 06:45', by: 'SYSTEM', text: '배송 완료 알림톡 발송 (문앞 배송 사진 첨부).' }],
    tracking: [
      { title: '출고 완료', when: '08.24 22:30', source: '시스템', dot: '#a1a1aa' },
      { title: '새벽 배송 출발', when: '08.25 03:10', source: 'CJ대한통운', dot: '#a1a1aa' },
      { title: '배송 완료 (문 앞)', when: '08.25 06:40', source: 'CJ대한통운', dot: '#10b981' },
    ],
    auditLogs: [
      { when: '2026.08.25 06:40', actor: 'CJ대한통운 API', action: '최종 배송 완료 처리', prevStage: '배송 중', nextStage: '배송 완료', note: '수취인 문 앞 전달 완료' },
    ],
    history: [
      { when: '08.24 22:30', title: '출고 완료' },
      { when: '08.25 06:40', title: '배송 완료' },
    ],
  },
  {
    id: 'DEL-260827-0107',
    orderId: 'ORD-20260826-3390',
    receiver: '오세훈',
    phone: '010-7788-9900',
    product: '스마트 LED 무드등 탁상시계',
    quantity: 1,
    carrier: '한진택배',
    invoiceNo: '5418-3312-7788',
    stage: '출고 대기',
    isHold: false,
    address: '대전광역시 유성구 대학로 99 203호',
    deliveryType: '일반택배',
    assignee: '박지수',
    orderedAt: '2026.08.26 14:20',
    preparedAt: '2026.08.27 08:50',
    outboundWaitingAt: '2026.08.27 10:40',
    memos: [],
    tracking: [{ title: '포장 완료 (출고 대기)', when: '08.27 10:40', source: 'WMS', dot: '#eab308' }],
    auditLogs: [
      { when: '2026.08.27 10:40', actor: 'WMS', action: '포장 완료 및 송장 부착', prevStage: '배송 준비', nextStage: '출고 대기', note: '출고 대기장 이동' },
    ],
    history: [{ when: '08.27 10:40', title: '출고 대기 등록' }],
  },
  {
    id: 'DEL-260827-0108',
    orderId: 'ORD-20260825-2281',
    receiver: '강소라',
    phone: '010-2391-4455',
    product: '원목 스탠드 조명 Walnut Edition',
    quantity: 1,
    carrier: '한진택배',
    invoiceNo: '5418-0921-7720',
    stage: '배송 실패',
    isHold: false,
    failReason: '주소 불명 (상세주소 동호수 누락)',
    address: '경기도 성남시 분당구 판교역로 동호수 누락',
    deliveryType: '일반택배',
    assignee: 'CS운영팀',
    orderedAt: '2026.08.25 11:00',
    preparedAt: '2026.08.25 13:00',
    outboundCompletedAt: '2026.08.26 14:00',
    inTransitAt: '2026.08.26 19:00',
    failedAt: '2026.08.27 13:10',
    memos: [{ when: '08.27 13:20', by: 'cs_agent', text: '고객 상세 주소 확인 후 재배송 지시 예정.' }],
    tracking: [
      { title: '출고 완료', when: '08.26 14:00', source: '시스템', dot: '#a1a1aa' },
      { title: '배송 실패 (주소 불명)', when: '08.27 13:10', source: '한진택배 API', dot: '#dc2626' },
    ],
    auditLogs: [
      { when: '2026.08.27 13:10', actor: '한진택배', action: '배송 실패 등록 (주소 불명)', prevStage: '배송 중', nextStage: '배송 실패', note: '상세 동호수 미기재로 배송 불가' },
    ],
    history: [{ when: '08.27 13:10', title: '배송 실패 등록 (주소 불명)' }],
  },
];
