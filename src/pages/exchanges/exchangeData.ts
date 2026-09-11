export type ExchangeStage =
  | '교환 요청'
  | '교환 승인'
  | '상품 회수'
  | '회수 중'
  | '회수 완료'
  | '검수 대기'
  | '교환 상품 준비'
  | '출고 준비'
  | '재출고'
  | '교환 완료'
  | '교환 반려'
  | '교환 철회'
  | '교환 보류';

export type HoldReason = '재고 부족' | '고객 연락 두절' | '배송비 미입금' | '기타';

export interface ExchangeItem {
  id: string;
  orderId: string;
  member: string;
  phone?: string;
  product: string;
  reason: string;
  optionBefore: string;
  optionAfter: string;
  stage: ExchangeStage;
  requestedAt: string;
  updatedAt: string;
  amount: number;
  assignee: string;
  channel: string;
  carrier: string;
  trackingNo: string;
  reshipCarrier?: string;
  reshipTrackingNo?: string;
  stockStatus: string;
  inspection: string;
  holdReason?: HoldReason;
  holdMemo?: string;
  completedAt?: string;
  rejectedAt?: string;
  withdrawnAt?: string;
}

export const EXCHANGE_STAGE_META: Record<ExchangeStage, { bg: string; fg: string }> = {
  '교환 요청': { bg: '#fff7ed', fg: '#c2410c' },
  '교환 승인': { bg: '#eff6ff', fg: '#2563eb' },
  '상품 회수': { bg: '#fefce8', fg: '#a16207' },
  '회수 중': { bg: '#fefce8', fg: '#b45309' },
  '회수 완료': { bg: '#eff6ff', fg: '#1d4ed8' },
  '검수 대기': { bg: '#faf5ff', fg: '#7e22ce' },
  '교환 상품 준비': { bg: '#f5f3ff', fg: '#6d28d9' },
  '출고 준비': { bg: '#f5f3ff', fg: '#6d28d9' },
  '재출고': { bg: '#ecfeff', fg: '#0e7490' },
  '교환 완료': { bg: '#ecfdf5', fg: '#047857' },
  '교환 반려': { bg: '#fef2f2', fg: '#dc2626' },
  '교환 철회': { bg: '#f1f5f9', fg: '#475569' },
  '교환 보류': { bg: '#fffbeb', fg: '#d97706' },
};

export const INITIAL_EXCHANGES: ExchangeItem[] = [
  // 1. 교환 요청 (신규 심사 대기)
  {
    id: 'EXC-260907-0072',
    orderId: 'ORD-20260906-6104',
    member: '박서연',
    phone: '010-3841-9210',
    product: '옥스퍼드 오버핏 셔츠',
    reason: '사이즈 변경',
    optionBefore: 'M / 화이트',
    optionAfter: 'L / 화이트',
    stage: '교환 요청',
    requestedAt: '2026-09-07 09:18',
    updatedAt: '2026-09-07 09:18',
    amount: 69000,
    assignee: '미배정',
    channel: '고객 신청',
    carrier: '-',
    trackingNo: '-',
    stockStatus: '교환 가능 (재고 8개)',
    inspection: '미회수',
  },
  {
    id: 'EXC-260907-0069',
    orderId: 'ORD-20260905-6088',
    member: '최민준',
    phone: '010-7712-4491',
    product: '에어로 라이트 러닝화',
    reason: '색상 변경',
    optionBefore: '270 / 블랙',
    optionAfter: '270 / 화이트',
    stage: '교환 요청',
    requestedAt: '2026-09-07 08:42',
    updatedAt: '2026-09-07 08:42',
    amount: 119000,
    assignee: '미배정',
    channel: 'CS 접수',
    carrier: '-',
    trackingNo: '-',
    stockStatus: '교환 가능 (재고 3개)',
    inspection: '미회수',
  },
  {
    id: 'EXC-260907-0066',
    orderId: 'ORD-20260905-6051',
    member: '정다운',
    phone: '010-8293-1102',
    product: '슬림 테이퍼드 슬랙스',
    reason: '단순 변심 (사이즈 교환)',
    optionBefore: '30 / 네이비',
    optionAfter: '32 / 네이비',
    stage: '교환 요청',
    requestedAt: '2026-09-07 08:10',
    updatedAt: '2026-09-07 08:10',
    amount: 54000,
    assignee: 'admin01',
    channel: '고객 신청',
    carrier: '-',
    trackingNo: '-',
    stockStatus: '교환 가능 (재고 15개)',
    inspection: '미회수',
  },

  // 2. 회수·검수 (회수 중, 회수 완료, 검수 대기)
  {
    id: 'EXC-260906-0061',
    orderId: 'ORD-20260903-5981',
    member: '이도윤',
    phone: '010-9182-3712',
    product: '노이즈캔슬링 블루투스 이어폰',
    reason: '초기 불량 (좌측 미출력)',
    optionBefore: '블랙',
    optionAfter: '블랙',
    stage: '회수 중',
    requestedAt: '2026-09-06 11:30',
    updatedAt: '2026-09-07 07:48',
    amount: 148000,
    assignee: 'admin02',
    channel: 'CS 접수',
    carrier: '한진택배',
    trackingNo: 'H-84392158',
    stockStatus: '교환품 보유 (재고 6개)',
    inspection: '회수 이동 중',
  },
  {
    id: 'EXC-260906-0059',
    orderId: 'ORD-20260903-5940',
    member: '강서진',
    phone: '010-2341-8902',
    product: '코튼 베이직 반팔 티셔츠',
    reason: '사이즈 변경',
    optionBefore: '95 / 멜란지',
    optionAfter: '100 / 멜란지',
    stage: '회수 중',
    requestedAt: '2026-09-06 10:15',
    updatedAt: '2026-09-07 08:00',
    amount: 29000,
    assignee: 'admin01',
    channel: '고객 신청',
    carrier: 'CJ대한통운',
    trackingNo: 'C-99120412',
    stockStatus: '교환품 보유 (재고 40개)',
    inspection: '회수 기사 방문 예정',
  },
  {
    id: 'EXC-260905-0057',
    orderId: 'ORD-20260902-5874',
    member: '정수빈',
    phone: '010-4491-0021',
    product: '세라믹 머그 4P 세트',
    reason: '색상 오배송',
    optionBefore: '베이지',
    optionAfter: '그린',
    stage: '회수 완료',
    requestedAt: '2026-09-05 15:12',
    updatedAt: '2026-09-07 06:55',
    amount: 42000,
    assignee: 'admin03',
    channel: '고객 신청',
    carrier: '롯데택배',
    trackingNo: 'L-22019431',
    stockStatus: '교환품 보유 (재고 21개)',
    inspection: '물류 입고 완료 (검수 대기중)',
  },
  {
    id: 'EXC-260905-0055',
    orderId: 'ORD-20260902-5830',
    member: '조민지',
    phone: '010-5512-9843',
    product: '구스다운 패딩 베스트',
    reason: '충전재 불량 의심',
    optionBefore: '90 / 블랙',
    optionAfter: '90 / 블랙',
    stage: '검수 대기',
    requestedAt: '2026-09-05 13:20',
    updatedAt: '2026-09-07 09:00',
    amount: 189000,
    assignee: 'admin02',
    channel: 'CS 접수',
    carrier: 'CJ대한통운',
    trackingNo: 'C-77401923',
    stockStatus: '교환품 보유 (재고 5개)',
    inspection: '실물 확인 진행 중 (외관/태그 점검)',
  },

  // 3. 재출고 (출고 준비, 출고 완료 / 재출고 배송)
  {
    id: 'EXC-260905-0053',
    orderId: 'ORD-20260901-5790',
    member: '윤지호',
    phone: '010-1284-9921',
    product: 'RGB 기계식 키보드',
    reason: '스위치 축 변경',
    optionBefore: '청축',
    optionAfter: '저소음 적축',
    stage: '출고 준비',
    requestedAt: '2026-09-05 10:08',
    updatedAt: '2026-09-06 17:32',
    amount: 139000,
    assignee: 'admin02',
    channel: '고객 신청',
    carrier: 'CJ대한통운',
    trackingNo: 'C-77520418',
    reshipCarrier: 'CJ대한통운',
    reshipTrackingNo: '미발급 (피킹 대기)',
    stockStatus: '피킹 완료 / 송장 출력 대기',
    inspection: '검수 통과 (정상 입고 확인)',
  },
  {
    id: 'EXC-260904-0048',
    orderId: 'ORD-20260831-5621',
    member: '한지민',
    phone: '010-9943-2210',
    product: '스테인리스 보온 텀블러 500ml',
    reason: '색상 오배송',
    optionBefore: '실버',
    optionAfter: '블랙',
    stage: '재출고',
    requestedAt: '2026-09-04 13:44',
    updatedAt: '2026-09-06 16:05',
    amount: 32000,
    assignee: 'admin01',
    channel: 'CS 접수',
    carrier: '우체국택배',
    trackingNo: 'P-11854022',
    reshipCarrier: '우체국택배',
    reshipTrackingNo: 'P-99014281',
    stockStatus: '재출고 완료 (배송 중)',
    inspection: '검수 통과 (정상)',
  },

  // 4. 교환 보류 (신규 메뉴: 재고 부족, 배송비 미입금, 고객 연락 두절 등)
  {
    id: 'EXC-260906-0062',
    orderId: 'ORD-20260904-6031',
    member: '배현우',
    phone: '010-7731-0941',
    product: '울 블렌드 싱글 코트',
    reason: '사이즈 변경 (L → XL)',
    optionBefore: 'L / 차콜',
    optionAfter: 'XL / 차콜',
    stage: '교환 보류',
    requestedAt: '2026-09-06 13:00',
    updatedAt: '2026-09-07 09:30',
    amount: 249000,
    assignee: 'admin02',
    channel: '고객 신청',
    carrier: 'CJ대한통운',
    trackingNo: 'C-88120491',
    stockStatus: '재고 부족 (입고 예정 9/15)',
    inspection: '검수 통과 (양호)',
    holdReason: '재고 부족',
    holdMemo: '희망 옵션 XL 차콜 물류 품절. 9월 15일 재입고 후 재출고 예정 안내 완료.',
  },
  {
    id: 'EXC-260905-0056',
    orderId: 'ORD-20260902-5850',
    member: '송태섭',
    phone: '010-6623-1192',
    product: '프로 가죽 농구공 7호',
    reason: '단순 변심 (모델 변경)',
    optionBefore: '인도어용',
    optionAfter: '올코트용',
    stage: '교환 보류',
    requestedAt: '2026-09-05 14:10',
    updatedAt: '2026-09-06 18:20',
    amount: 68000,
    assignee: 'admin03',
    channel: '고객 신청',
    carrier: '한진택배',
    trackingNo: 'H-55102931',
    stockStatus: '출고 대기',
    inspection: '검수 통과 (미사용 확인)',
    holdReason: '배송비 미입금',
    holdMemo: '고객 귀책 사유 편도/왕복 배송비 6,000원 계좌 입금 미확인 (가상계좌 발급 문자 발송).',
  },
  {
    id: 'EXC-260904-0050',
    orderId: 'ORD-20260901-5740',
    member: '채소연',
    phone: '010-3321-4456',
    product: '이지핏 밴딩 조거팬츠',
    reason: '색상 및 사이즈 문의',
    optionBefore: 'S / 그레이',
    optionAfter: '미지정',
    stage: '교환 보류',
    requestedAt: '2026-09-04 15:40',
    updatedAt: '2026-09-06 11:00',
    amount: 45000,
    assignee: 'admin01',
    channel: 'CS 접수',
    carrier: '우체국택배',
    trackingNo: 'P-33190241',
    stockStatus: '확인 대기',
    inspection: '입고 완료',
    holdReason: '고객 연락 두절',
    holdMemo: '변경 희망 옵션 불명확하여 3회 유선 통화 시도 부재중. 알림톡 남김.',
  },

  // 5. 교환 이력 (종료된 건: 교환 완료, 교환 반려, 교환 철회)
  {
    id: 'EXC-260903-0044',
    orderId: 'ORD-20260830-5518',
    member: '오세훈',
    phone: '010-9901-3829',
    product: 'USB-C 멀티 허브 7-in-1',
    reason: '포트 인식 불량',
    optionBefore: '7-in-1',
    optionAfter: '7-in-1',
    stage: '교환 완료',
    requestedAt: '2026-09-03 09:22',
    updatedAt: '2026-09-06 14:10',
    amount: 61000,
    assignee: 'admin03',
    channel: '고객 신청',
    carrier: 'CJ대한통운',
    trackingNo: 'C-77519002',
    reshipCarrier: 'CJ대한통운',
    reshipTrackingNo: 'C-77590214',
    stockStatus: '배송 완료',
    inspection: '불량 확인',
    completedAt: '2026-09-06 14:10',
  },
  {
    id: 'EXC-260903-0041',
    orderId: 'ORD-20260829-5480',
    member: '장원영',
    phone: '010-1234-5678',
    product: '실크 리본 블라우스',
    reason: '사이즈 교환',
    optionBefore: 'S / 아이보리',
    optionAfter: 'M / 아이보리',
    stage: '교환 완료',
    requestedAt: '2026-09-03 08:30',
    updatedAt: '2026-09-05 16:40',
    amount: 89000,
    assignee: 'admin01',
    channel: '고객 신청',
    carrier: '우체국택배',
    trackingNo: 'P-11940210',
    reshipCarrier: '우체국택배',
    reshipTrackingNo: 'P-11985420',
    stockStatus: '배송 완료',
    inspection: '정상 입고',
    completedAt: '2026-09-05 16:40',
  },
  {
    id: 'EXC-260902-0039',
    orderId: 'ORD-20260829-5403',
    member: '임도현',
    phone: '010-7788-9900',
    product: '경량 캠핑 릴렉스 체어',
    reason: '사용 흔적 확인 (흙탕물 오염)',
    optionBefore: '카키',
    optionAfter: '블랙',
    stage: '교환 반려',
    requestedAt: '2026-09-02 12:06',
    updatedAt: '2026-09-03 10:20',
    amount: 89000,
    assignee: 'admin02',
    channel: '고객 신청',
    carrier: '한진택배',
    trackingNo: 'H-99201481',
    stockStatus: '교환 중단 (원주소 착불 반송)',
    inspection: '검수 불합격 (야외 실사용 흔적 및 오염)',
    rejectedAt: '2026-09-03 10:20',
  },
  {
    id: 'EXC-260901-0033',
    orderId: 'ORD-20260828-5312',
    member: '강다니엘',
    phone: '010-5544-3322',
    product: '프리미엄 린넨 셔츠',
    reason: '고객 교환 철회 (그대로 착용 결정)',
    optionBefore: '105 / 스카이블루',
    optionAfter: '100 / 스카이블루',
    stage: '교환 철회',
    requestedAt: '2026-09-01 14:20',
    updatedAt: '2026-09-02 09:15',
    amount: 72000,
    assignee: 'admin01',
    channel: '고객 신청',
    carrier: '-',
    trackingNo: '-',
    stockStatus: '철회 종결',
    inspection: '미회수 (고객 취소)',
    withdrawnAt: '2026-09-02 09:15',
  },
];

export const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export const matchesExchangeKeyword = (item: ExchangeItem, keyword: string) => {
  if (!keyword) return true;
  const target = `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.reason} ${item.carrier} ${item.trackingNo} ${item.reshipTrackingNo || ''} ${item.holdReason || ''}`.toLowerCase();
  return target.includes(keyword.toLowerCase());
};
