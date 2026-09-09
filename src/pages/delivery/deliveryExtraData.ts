import type { HistoryEntry, Memo, TrackingEntry } from './deliverySharedData';

/* 1. 배송 실패 (Failed) */
export interface FailedDelivery {
  id: string;
  order: string;
  receiver: string;
  phone: string;
  carrier: string;
  invoiceNo: string;
  failedAt: string;
  reason: '수취인 부재' | '주소 불명' | '연락 불가' | '수취 거절' | '파손/오염';
  attemptCount: number;
  status: '재배송 대기' | '반송 접수' | '주소 확인중' | '처리 완료';
  location: string;
  address: string;
  notes: string;
  tracking: TrackingEntry[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const FAILED_DELIVERIES: FailedDelivery[] = [
  {
    id: 'SHP-F00101',
    order: 'O-20260827-0101',
    receiver: '김민준',
    phone: '010-3841-9921',
    carrier: 'CJ대한통운',
    invoiceNo: '6891-4421-0834',
    failedAt: '2026.08.27 14:20',
    reason: '수취인 부재',
    attemptCount: 2,
    status: '재배송 대기',
    location: '서울 마포SUB',
    address: '서울특별시 마포구 월드컵북로 120 (성산동) 302호',
    notes: '2회 방문 부재. 고객 안내 알림톡 발송 완료.',
    tracking: [
      { title: '출고 완료', when: '08.26 09:20', source: '시스템', dot: '#a1a1aa' },
      { title: '배달 출발', when: '08.27 08:30', source: '택배사 API', dot: '#a1a1aa' },
      { title: '1차 부재', when: '08.27 11:15', source: '택배사 API', dot: '#f59e0b' },
      { title: '2차 부재 (배송 실패)', when: '08.27 14:20', source: '택배사 API', dot: '#dc2626' },
    ],
    memos: [{ when: '08.27 14:30', by: 'admin01', text: '고객에게 전화 부재로 알림톡 재배송 안내문 발송함.' }],
    history: [
      { when: '08.26 09:20', title: '출고 완료' },
      { when: '08.27 14:20', title: '배송 실패 처리 (수취인 부재)', by: '택배사 API' },
    ],
  },
  {
    id: 'SHP-F00102',
    order: 'O-20260827-0102',
    receiver: '이지은',
    phone: '010-8712-4011',
    carrier: '한진택배',
    invoiceNo: '5418-0921-7720',
    failedAt: '2026.08.27 13:10',
    reason: '주소 불명',
    attemptCount: 1,
    status: '주소 확인중',
    location: '경기 성남SUB',
    address: '경기도 성남시 분당구 판교역로 동호수 누락',
    notes: '동/호수 상세 주소 기재 누락으로 배송원 배송 불가 판정.',
    tracking: [
      { title: '출고 완료', when: '08.26 14:00', source: '시스템', dot: '#a1a1aa' },
      { title: '배송 불가 (주소 불명)', when: '08.27 13:10', source: '택배사 API', dot: '#dc2626' },
    ],
    memos: [{ when: '08.27 13:20', by: 'cs_agent', text: '고객 연락 시도 중이나 통화 중.' }],
    history: [
      { when: '08.26 14:00', title: '출고 완료' },
      { when: '08.27 13:10', title: '주소 불명 배송 실패 등록' },
    ],
  },
  {
    id: 'SHP-F00103',
    order: 'O-20260827-0103',
    receiver: '박서준',
    phone: '010-6192-3320',
    carrier: '롯데택배',
    invoiceNo: '2387-1140-9301',
    failedAt: '2026.08.27 11:45',
    reason: '수취 거절',
    attemptCount: 1,
    status: '반송 접수',
    location: '인천 부평SUB',
    address: '인천광역시 부평구 부평대로 45 101동 502호',
    notes: '고객 주문 취소 의사로 수취 거부.',
    tracking: [
      { title: '출고 완료', when: '08.26 10:10', source: '시스템', dot: '#a1a1aa' },
      { title: '수취 거절 접수', when: '08.27 11:45', source: '택배사 API', dot: '#dc2626' },
    ],
    memos: [{ when: '08.27 12:00', by: 'admin02', text: '반송장 생성 및 창고 회수 접수.' }],
    history: [{ when: '08.27 11:45', title: '수취 거절에 따른 반송 등록' }],
  },
  {
    id: 'SHP-F00104',
    order: 'O-20260826-0099',
    receiver: '최유나',
    phone: '010-4491-1188',
    carrier: '우체국택배',
    invoiceNo: '66012-3401-8812',
    failedAt: '2026.08.26 16:30',
    reason: '연락 불가',
    attemptCount: 3,
    status: '반송 접수',
    location: '부산 해운대HUB',
    address: '부산광역시 해운대구 센텀중앙로 88 1204호',
    notes: '3일 연속 미수취 및 통화 불가로 최종 반송 조치.',
    tracking: [
      { title: '출고 완료', when: '08.24 16:00', source: '시스템', dot: '#a1a1aa' },
      { title: '최종 반송 확정', when: '08.26 16:30', source: '택배사 API', dot: '#dc2626' },
    ],
    memos: [],
    history: [{ when: '08.26 16:30', title: '장기 미수취 반송 처리' }],
  },
];

/* 2. 배송 보류 (Hold) */
export interface HoldDelivery {
  id: string;
  order: string;
  receiver: string;
  phone: string;
  carrier: string;
  holdAt: string;
  reasonType: '고객 요청' | '배송지 변경' | '기상/재해' | '재고 검수' | '주문 취소 접수';
  status: '보류중' | '해제 대기' | '출고 재개' | '주문 취소';
  requester: string;
  targetReleaseDate: string;
  details: string;
  tracking: TrackingEntry[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const HOLD_DELIVERIES: HoldDelivery[] = [
  {
    id: 'SHP-H00201',
    order: 'O-20260827-0201',
    receiver: '정태양',
    phone: '010-9921-3310',
    carrier: 'CJ대한통운',
    holdAt: '2026.08.27 10:15',
    reasonType: '고객 요청',
    status: '보류중',
    requester: '고객센터 (상담)',
    targetReleaseDate: '2026.08.30',
    details: '고객 휴가 일정으로 인해 8월 30일 이후 출고 요청.',
    tracking: [{ title: '출고 준비중 보류 전환', when: '08.27 10:15', source: '시스템', dot: '#f59e0b' }],
    memos: [{ when: '08.27 10:20', by: 'cs_agent', text: '고객 일정 30일 배송 요청 확인 후 플래그 설정.' }],
    history: [{ when: '08.27 10:15', title: '고객 요청 보류 설정' }],
  },
  {
    id: 'SHP-H00202',
    order: 'O-20260827-0202',
    receiver: '강소라',
    phone: '010-2391-4455',
    carrier: '한진택배',
    holdAt: '2026.08.27 11:40',
    reasonType: '배송지 변경',
    status: '해제 대기',
    requester: '회원 (마이페이지)',
    targetReleaseDate: '2026.08.28',
    details: '배송지 주소 이전 요청 접수됨. 새 주소 검증 완료.',
    tracking: [{ title: '배송지 변경 접수로 보류', when: '08.27 11:40', source: '시스템', dot: '#f59e0b' }],
    memos: [{ when: '08.27 12:10', by: 'admin01', text: '신규 주소 송장 채번 후 금일 오후 출고 재개 예정.' }],
    history: [{ when: '08.27 11:40', title: '주소 변경 보류 등록' }],
  },
  {
    id: 'SHP-H00203',
    order: 'O-20260826-0189',
    receiver: '오도현',
    phone: '010-7711-2099',
    carrier: '우체국택배',
    holdAt: '2026.08.26 16:00',
    reasonType: '기상/재해',
    status: '보류중',
    requester: '물류운영팀',
    targetReleaseDate: '2026.08.29',
    details: '도서지역 태풍 기상 특보로 인한 선편 운항 통제.',
    tracking: [{ title: '기상 악화 도서 통제', when: '08.26 16:00', source: '택배사 공지', dot: '#f59e0b' }],
    memos: [{ when: '08.26 16:15', by: 'logistics_lead', text: '선편 재개 확인 시 자동 해제 예정.' }],
    history: [{ when: '08.26 16:00', title: '천재지변 배송 보류 등록' }],
  },
];

/* 3. 송장 관리 (Invoices) */
export interface InvoiceItem {
  id: string;
  orderId: string;
  receiver: string;
  carrier: string;
  invoiceNo: string;
  issuedAt: string;
  printStatus: '출력완료' | '출력대기' | '재발행' | '오류';
  printCount: number;
  shipmentStatus: '배송준비' | '출고완료' | '배송중' | '취소/회수';
  productSummary: string;
  tracking: TrackingEntry[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const INVOICE_ITEMS: InvoiceItem[] = [
  {
    id: 'INV-20260827-001',
    orderId: 'ORD-20260827-7712',
    receiver: '한예린',
    carrier: 'CJ대한통운',
    invoiceNo: '6891-9921-1029',
    issuedAt: '2026.08.27 10:20',
    printStatus: '출력완료',
    printCount: 1,
    shipmentStatus: '출고완료',
    productSummary: '오가닉 코튼 티셔츠 화이트 L 외 1건',
    tracking: [{ title: '송장 채번 완료', when: '08.27 10:20', source: 'WMS', dot: '#10b981' }],
    memos: [],
    history: [{ when: '08.27 10:20', title: '송장 채번 및 인쇄' }],
  },
  {
    id: 'INV-20260827-002',
    orderId: 'ORD-20260827-7715',
    receiver: '장동건',
    carrier: '한진택배',
    invoiceNo: '5418-8831-2910',
    issuedAt: '2026.08.27 11:05',
    printStatus: '출력대기',
    printCount: 0,
    shipmentStatus: '배송준비',
    productSummary: '프리미엄 세라믹 머그 4P 세트',
    tracking: [{ title: '송장 채번 완료 (미출력)', when: '08.27 11:05', source: 'WMS', dot: '#a1a1aa' }],
    memos: [],
    history: [{ when: '08.27 11:05', title: '송장 채번 완료' }],
  },
  {
    id: 'INV-20260827-003',
    orderId: 'ORD-20260827-7690',
    receiver: '송혜교',
    carrier: '롯데택배',
    invoiceNo: '2387-9912-4011',
    issuedAt: '2026.08.27 09:40',
    printStatus: '재발행',
    printCount: 2,
    shipmentStatus: '출고완료',
    productSummary: '스마트 블루투스 스피커 프로',
    tracking: [{ title: '송장 라벨 훼손 재발행', when: '08.27 09:40', source: '물류창고', dot: '#f59e0b' }],
    memos: [{ when: '08.27 09:42', by: 'packer01', text: '라벨 바코드 인쇄 불량으로 재발행 출력.' }],
    history: [{ when: '08.27 09:40', title: '송장 재발행' }],
  },
  {
    id: 'INV-20260827-004',
    orderId: 'ORD-20260827-7640',
    receiver: '윤여정',
    carrier: '우체국택배',
    invoiceNo: '66012-9901-2244',
    issuedAt: '2026.08.27 08:30',
    printStatus: '출력완료',
    printCount: 1,
    shipmentStatus: '배송중',
    productSummary: '천연 아로마 디퓨저 200ml 세트',
    tracking: [{ title: '송장 채번 완료', when: '08.27 08:30', source: 'WMS', dot: '#10b981' }],
    memos: [],
    history: [{ when: '08.27 08:30', title: '송장 채번 및 인쇄' }],
  },
];

/* 4. 배송사 관리 (Carriers) */
export interface CarrierInfo {
  id: string;
  code: string;
  name: string;
  serviceType: string;
  cutoffTime: string;
  trackingMethod: string;
  successRate: string;
  status: '정상' | '점검' | '중지';
  apiEndpoint: string;
  owner: string;
  updatedAt: string;
  dailyCapacity: string;
}

export const CARRIER_INFOS: CarrierInfo[] = [
  {
    id: 'CAR-001',
    code: 'CJ',
    name: 'CJ대한통운',
    serviceType: '일반택배 / 당일배송',
    cutoffTime: '평일 15:00',
    trackingMethod: '실시간 Webhook 연동',
    successRate: '99.7%',
    status: '정상',
    apiEndpoint: 'https://api.cjlogistics.com/v2/shipment',
    owner: '배송운영1팀',
    updatedAt: '2026.08.26 17:40',
    dailyCapacity: '일 평균 15,000건',
  },
  {
    id: 'CAR-002',
    code: 'HANJIN',
    name: '한진택배',
    serviceType: '일반택배 / 예약집하',
    cutoffTime: '평일 14:30',
    trackingMethod: '10분 주기 Polling',
    successRate: '99.2%',
    status: '정상',
    apiEndpoint: 'https://api.hanjin.co.kr/gateway',
    owner: '배송운영1팀',
    updatedAt: '2026.08.25 11:18',
    dailyCapacity: '일 평균 8,500건',
  },
  {
    id: 'CAR-003',
    code: 'LOTTE',
    name: '롯데택배',
    serviceType: '일반택배',
    cutoffTime: '평일 15:00',
    trackingMethod: '실시간 Webhook 연동',
    successRate: '98.9%',
    status: '점검',
    apiEndpoint: 'https://api.lotteglogis.com/tracker',
    owner: '플랫폼인프라팀',
    updatedAt: '2026.08.27 13:05',
    dailyCapacity: '일 평균 6,000건',
  },
  {
    id: 'CAR-004',
    code: 'POST',
    name: '우체국택배',
    serviceType: '일반 / 도서산간 전담',
    cutoffTime: '평일 13:30',
    trackingMethod: '30분 주기 Polling',
    successRate: '99.8%',
    status: '정상',
    apiEndpoint: 'https://openapi.epost.go.kr/parcel',
    owner: '배송운영2팀',
    updatedAt: '2026.08.24 09:12',
    dailyCapacity: '일 평균 4,000건',
  },
  {
    id: 'CAR-005',
    code: 'LOGEN',
    name: '로젠택배',
    serviceType: '일반택배',
    cutoffTime: '평일 14:00',
    trackingMethod: '연동 중지',
    successRate: '97.4%',
    status: '중지',
    apiEndpoint: 'https://api.ilogen.com/edi',
    owner: '플랫폼인프라팀',
    updatedAt: '2026.08.20 16:30',
    dailyCapacity: '일 평균 0건 (연동 중지)',
  },
];

/* 5. 배송 추적 (Tracking) */
export interface TrackingItem {
  id: string;
  orderId: string;
  receiver: string;
  carrier: string;
  invoiceNo: string;
  currentStep: '집하완료' | '간선수송' | 'HUB입출고' | '배달출발' | '배달완료' | '배송지연';
  currentLocation: string;
  driverName: string;
  driverPhone: string;
  shippedAt: string;
  lastUpdated: string;
  eta: string;
  timeline: TrackingEntry[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const TRACKING_ITEMS: TrackingItem[] = [
  {
    id: 'TRK-001',
    orderId: 'ORD-20260827-1011',
    receiver: '배수현',
    carrier: 'CJ대한통운',
    invoiceNo: '6891-3310-4091',
    currentStep: '배달출발',
    currentLocation: '서울 마포구 상암동 배송캠프',
    driverName: '김기사',
    driverPhone: '010-2210-9944',
    shippedAt: '2026.08.26 18:10',
    lastUpdated: '2026.08.27 10:40',
    eta: '오늘 16:00 ~ 18:00',
    timeline: [
      { title: '출고 및 송장 채번', when: '08.26 15:30', loc: '용인HUB', source: '시스템', dot: '#a1a1aa' },
      { title: '택배사 집하 완료', when: '08.26 18:10', loc: '용인HUB', source: 'CJ대한통운', dot: '#a1a1aa' },
      { title: '옥천HUB 간선수송', when: '08.27 02:40', loc: '옥천HUB', source: 'CJ대한통운', dot: '#a1a1aa' },
      { title: '마포 배송캠프 입고', when: '08.27 07:15', loc: '마포캠프', source: 'CJ대한통운', dot: '#a1a1aa' },
      { title: '배달 출발 (김기사 님)', when: '08.27 10:40', loc: '상암동', source: 'CJ대한통운', dot: 'var(--accent)' },
    ],
    memos: [],
    history: [{ when: '08.27 10:40', title: '배달 출발 상태 갱신' }],
  },
  {
    id: 'TRK-002',
    orderId: 'ORD-20260827-1012',
    receiver: '안성민',
    carrier: '한진택배',
    invoiceNo: '5418-2201-9988',
    currentStep: '간선수송',
    currentLocation: '대전HUB 터미널 이동중',
    driverName: '간선수송',
    driverPhone: '042-881-0011',
    shippedAt: '2026.08.27 09:20',
    lastUpdated: '2026.08.27 13:50',
    eta: '내일 14:00 도착 예정',
    timeline: [
      { title: '출고 완료', when: '08.27 09:20', loc: '이천물류', source: '시스템', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.27 11:30', loc: '이천HUB', source: '한진택배', dot: '#a1a1aa' },
      { title: '대전HUB 간선 수송중', when: '08.27 13:50', loc: '경부고속도로', source: '한진택배', dot: 'var(--accent)' },
    ],
    memos: [],
    history: [{ when: '08.27 13:50', title: '간선 수송 이동중 확인' }],
  },
  {
    id: 'TRK-003',
    orderId: 'ORD-20260826-0955',
    receiver: '문서현',
    carrier: '롯데택배',
    invoiceNo: '2387-5501-1120',
    currentStep: '배송지연',
    currentLocation: '군포HUB 분류 지연',
    driverName: '담당자 배정중',
    driverPhone: '-',
    shippedAt: '2026.08.25 17:00',
    lastUpdated: '2026.08.27 11:20',
    eta: '지연 예상 (확인중)',
    timeline: [
      { title: '출고 완료', when: '08.25 17:00', loc: '용인물류', source: '시스템', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.25 19:30', loc: '용인HUB', source: '롯데택배', dot: '#a1a1aa' },
      { title: '분류 지연 감지', when: '08.27 11:20', loc: '군포HUB', source: '시스템 SLA 감지', dot: '#dc2626' },
    ],
    memos: [{ when: '08.27 11:30', by: 'admin01', text: '롯데택배 담당자에게 분류 지연 원인 확인 요청 메일 발송함.' }],
    history: [{ when: '08.27 11:20', title: 'SLA 기준 24시간 초과 지연 등록' }],
  },
];

/* 6. 배송 이력 (History) */
export interface DeliveryEventLog {
  id: string;
  orderId: string;
  shipmentId: string;
  eventType: '출고' | '송장변경' | '상태전환' | '예외발생' | '배송완료' | '반송' | '관리자개입';
  actor: string;
  actorRole: 'SYSTEM' | '배송사 연동' | '운영 관리자' | 'CS 상담원';
  carrier: string;
  invoiceNo: string;
  description: string;
  occurredAt: string;
  ipAddress: string;
}

export const DELIVERY_EVENT_LOGS: DeliveryEventLog[] = [
  {
    id: 'EVT-260827-0941',
    orderId: 'ORD-20260827-0101',
    shipmentId: 'SHP-F00101',
    eventType: '예외발생',
    actor: 'CJ대한통운 API',
    actorRole: '배송사 연동',
    carrier: 'CJ대한통운',
    invoiceNo: '6891-4421-0834',
    description: '수취인 부재 2회 연속 발생에 따른 배송 실패 코드 수신',
    occurredAt: '2026.08.27 14:20:12',
    ipAddress: '210.112.44.18',
  },
  {
    id: 'EVT-260827-0932',
    orderId: 'ORD-20260827-0201',
    shipmentId: 'SHP-H00201',
    eventType: '관리자개입',
    actor: 'admin01',
    actorRole: '운영 관리자',
    carrier: 'CJ대한통운',
    invoiceNo: '6891-0021-3319',
    description: '고객 휴가 일정으로 배송 보류 설정 (해제 예정: 8/30)',
    occurredAt: '2026.08.27 10:15:40',
    ipAddress: '192.168.1.45',
  },
  {
    id: 'EVT-260827-0918',
    orderId: 'ORD-20260827-7712',
    shipmentId: 'SHP-00185',
    eventType: '출고',
    actor: 'WMS Batch',
    actorRole: 'SYSTEM',
    carrier: 'CJ대한통운',
    invoiceNo: '6891-9921-1029',
    description: '용인 제1물류센터 출고 검수 완료 및 송장 자동 채번',
    occurredAt: '2026.08.27 09:40:05',
    ipAddress: '10.0.4.12',
  },
  {
    id: 'EVT-260827-0899',
    orderId: 'ORD-20260826-0955',
    shipmentId: 'SHP-00180',
    eventType: '상태전환',
    actor: 'SLA Watcher',
    actorRole: 'SYSTEM',
    carrier: '롯데택배',
    invoiceNo: '2387-5501-1120',
    description: '군포HUB 체류 시간 24시간 초과로 [배송지연] 자동 감지 플래그 부여',
    occurredAt: '2026.08.27 08:30:00',
    ipAddress: '10.0.1.8',
  },
  {
    id: 'EVT-260826-0782',
    orderId: 'ORD-20260826-0099',
    shipmentId: 'SHP-F00104',
    eventType: '반송',
    actor: 'admin02',
    actorRole: '운영 관리자',
    carrier: '우체국택배',
    invoiceNo: '66012-3401-8812',
    description: '장기 미수취 건에 대한 물류센터 반송 및 결제 취소 연계 승인',
    occurredAt: '2026.08.26 16:30:22',
    ipAddress: '192.168.1.52',
  },
];
