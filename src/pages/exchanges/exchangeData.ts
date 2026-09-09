export type ExchangeStage = '교환 요청' | '교환 승인' | '상품 회수' | '회수 완료' | '교환 상품 준비' | '재출고' | '교환 완료' | '교환 반려';

export interface ExchangeItem {
  id: string;
  orderId: string;
  member: string;
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
  stockStatus: string;
  inspection: string;
  completedAt?: string;
  rejectedAt?: string;
}

export const EXCHANGE_STAGE_META: Record<ExchangeStage, { bg: string; fg: string }> = {
  '교환 요청': { bg: '#fff7ed', fg: '#c2410c' },
  '교환 승인': { bg: '#eff6ff', fg: '#2563eb' },
  '상품 회수': { bg: '#fefce8', fg: '#a16207' },
  '회수 완료': { bg: '#f5f3ff', fg: '#7c3aed' },
  '교환 상품 준비': { bg: '#f5f3ff', fg: '#7c3aed' },
  '재출고': { bg: '#ecfeff', fg: '#0e7490' },
  '교환 완료': { bg: '#ecfdf5', fg: '#047857' },
  '교환 반려': { bg: '#fef2f2', fg: '#dc2626' },
};

export const INITIAL_EXCHANGES: ExchangeItem[] = [
  { id: 'EXC-260907-0072', orderId: 'ORD-20260906-6104', member: '박서연', product: '옥스퍼드 셔츠', reason: '사이즈 변경', optionBefore: 'M / 화이트', optionAfter: 'L / 화이트', stage: '교환 요청', requestedAt: '2026-09-07 09:18', updatedAt: '2026-09-07 09:18', amount: 69000, assignee: '미배정', channel: '고객 신청', carrier: '-', trackingNo: '-', stockStatus: '재고 8개', inspection: '대기' },
  { id: 'EXC-260907-0069', orderId: 'ORD-20260905-6088', member: '최민준', product: '러닝화', reason: '색상 변경', optionBefore: '270 / 블랙', optionAfter: '270 / 화이트', stage: '교환 요청', requestedAt: '2026-09-07 08:42', updatedAt: '2026-09-07 08:42', amount: 119000, assignee: '미배정', channel: 'CS 접수', carrier: '-', trackingNo: '-', stockStatus: '재고 3개', inspection: '대기' },
  { id: 'EXC-260906-0065', orderId: 'ORD-20260904-6012', member: '김하늘', product: '데님 팬츠', reason: '사이즈 변경', optionBefore: 'M', optionAfter: 'L', stage: '교환 승인', requestedAt: '2026-09-06 14:25', updatedAt: '2026-09-07 08:15', amount: 79000, assignee: 'admin01', channel: '고객 신청', carrier: 'CJ대한통운', trackingNo: '회수 접수 전', stockStatus: '재고 12개', inspection: '대기' },
  { id: 'EXC-260906-0061', orderId: 'ORD-20260903-5981', member: '이도윤', product: '블루투스 이어폰', reason: '초기 불량', optionBefore: '블랙', optionAfter: '블랙', stage: '상품 회수', requestedAt: '2026-09-06 11:30', updatedAt: '2026-09-07 07:48', amount: 148000, assignee: 'admin02', channel: 'CS 접수', carrier: '한진택배', trackingNo: 'H-84392158', stockStatus: '재고 6개', inspection: '대기' },
  { id: 'EXC-260905-0057', orderId: 'ORD-20260902-5874', member: '정수빈', product: '세라믹 머그 세트', reason: '색상 오배송', optionBefore: '베이지', optionAfter: '그린', stage: '회수 완료', requestedAt: '2026-09-05 15:12', updatedAt: '2026-09-07 06:55', amount: 42000, assignee: 'admin03', channel: '고객 신청', carrier: '롯데택배', trackingNo: 'L-22019431', stockStatus: '재고 21개', inspection: '외관 확인 필요' },
  { id: 'EXC-260905-0053', orderId: 'ORD-20260901-5790', member: '윤지호', product: '기계식 키보드', reason: '축 변경', optionBefore: '청축', optionAfter: '저소음 적축', stage: '교환 상품 준비', requestedAt: '2026-09-05 10:08', updatedAt: '2026-09-06 17:32', amount: 139000, assignee: 'admin02', channel: '고객 신청', carrier: 'CJ대한통운', trackingNo: 'C-77520418', stockStatus: '피킹 완료', inspection: '정상' },
  { id: 'EXC-260904-0048', orderId: 'ORD-20260831-5621', member: '한지민', product: '스테인리스 텀블러', reason: '색상 오배송', optionBefore: '실버', optionAfter: '블랙', stage: '재출고', requestedAt: '2026-09-04 13:44', updatedAt: '2026-09-06 16:05', amount: 32000, assignee: 'admin01', channel: 'CS 접수', carrier: '우체국택배', trackingNo: 'P-11854022', stockStatus: '출고 완료', inspection: '정상' },
  { id: 'EXC-260903-0044', orderId: 'ORD-20260830-5518', member: '오세훈', product: 'USB-C 허브', reason: '포트 인식 불량', optionBefore: '7-in-1', optionAfter: '7-in-1', stage: '교환 완료', requestedAt: '2026-09-03 09:22', updatedAt: '2026-09-06 14:10', amount: 61000, assignee: 'admin03', channel: '고객 신청', carrier: 'CJ대한통운', trackingNo: 'C-77519002', stockStatus: '배송 완료', inspection: '불량 확인', completedAt: '2026-09-06 14:10' },
  { id: 'EXC-260902-0039', orderId: 'ORD-20260829-5403', member: '임도현', product: '캠핑 체어', reason: '사용 흔적 확인', optionBefore: '카키', optionAfter: '블랙', stage: '교환 반려', requestedAt: '2026-09-02 12:06', updatedAt: '2026-09-03 10:20', amount: 89000, assignee: 'admin02', channel: '고객 신청', carrier: '-', trackingNo: '-', stockStatus: '교환 중단', inspection: '사용 흔적', rejectedAt: '2026-09-03 10:20' },
];

export const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export const matchesExchangeKeyword = (item: ExchangeItem, keyword: string) =>
  !keyword || `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.reason} ${item.trackingNo}`.toLowerCase().includes(keyword.toLowerCase());
