export type SellerStatus = '판매중' | '판매중지' | '판매제한' | '휴면';
export type SellerGrade = '일반' | '우수' | '파워';
export type ProductStatus = '판매중' | '예약중' | '판매완료' | '숨김' | '검수중';
export type TradeStatus = '결제완료' | '배송중' | '구매확정' | '취소' | '분쟁';
export type RestrictionStatus = '적용중' | '해제' | '만료' | '예약';

export interface Seller {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  status: SellerStatus;
  grade: SellerGrade;
  verification: '완료' | '미완료' | '재인증 필요';
  region: string;
  joinedAt: string;
  lastActiveAt: string;
  statusChangedAt: string;
  statusReason: string;
  activeProducts: number;
  soldProducts: number;
  tradeCount: number;
  salesAmount: number;
  cancelRate: number;
  reportCount: number;
  mannerScore: number;
}

export interface SaleProduct {
  id: string;
  sellerId: string;
  title: string;
  category: string;
  price: number;
  status: ProductStatus;
  condition: '새상품' | '사용감 없음' | '사용감 적음' | '사용감 많음';
  registeredAt: string;
  updatedAt: string;
  views: number;
  wishes: number;
  chats: number;
  reportCount: number;
  exposure: '노출' | '비노출';
}

export interface SaleTrade {
  id: string;
  productId: string;
  sellerId: string;
  buyer: string;
  amount: number;
  fee: number;
  status: TradeStatus;
  paymentMethod: string;
  paidAt: string;
  updatedAt: string;
  delivery: string;
  issue: string;
}

export interface SaleRestriction {
  id: string;
  sellerId: string;
  type: '경고' | '상품 등록 제한' | '판매 제한';
  reason: string;
  startedAt: string;
  endedAt: string;
  status: RestrictionStatus;
  operator: string;
  source: string;
  memo: string;
}

export interface SaleActivityHistory {
  id: string;
  occurredAt: string;
  sellerId: string;
  action: string;
  category: '계정' | '상품' | '거래' | '제한' | '정산';
  target: string;
  before: string;
  after: string;
  actor: string;
  reason: string;
  ip: string;
}

export const SELLERS: Seller[] = [
  { id: 'SEL-10482', name: '김민수', nickname: '셀렉트룸', email: 'selectroom@example.com', phone: '010-2481-7732', status: '판매중', grade: '파워', verification: '완료', region: '서울', joinedAt: '2024-02-18', lastActiveAt: '2026-08-26 14:32', statusChangedAt: '2026-04-11 09:10', statusReason: '우수 판매자 자동 승급', activeProducts: 18, soldProducts: 142, tradeCount: 151, salesAmount: 28740000, cancelRate: 0.7, reportCount: 1, mannerScore: 97 },
  { id: 'SEL-10813', name: '박서연', nickname: '오브젝트마켓', email: 'objectmarket@example.com', phone: '010-9031-2284', status: '판매중', grade: '우수', verification: '완료', region: '경기', joinedAt: '2024-08-03', lastActiveAt: '2026-08-26 12:18', statusChangedAt: '2026-06-20 13:44', statusReason: '최근 90일 거래 평가 충족', activeProducts: 12, soldProducts: 86, tradeCount: 91, salesAmount: 16480000, cancelRate: 1.1, reportCount: 0, mannerScore: 94 },
  { id: 'SEL-11209', name: '이준호', nickname: '준호의창고', email: 'jhstore@example.com', phone: '010-6228-4911', status: '판매제한', grade: '일반', verification: '재인증 필요', region: '부산', joinedAt: '2025-01-14', lastActiveAt: '2026-08-25 21:03', statusChangedAt: '2026-08-25 16:20', statusReason: '동일 상품 반복 등록 및 신고 누적', activeProducts: 0, soldProducts: 31, tradeCount: 38, salesAmount: 6240000, cancelRate: 8.4, reportCount: 7, mannerScore: 63 },
  { id: 'SEL-11544', name: '최유진', nickname: '유진셀렉션', email: 'yujinpick@example.com', phone: '010-7745-1180', status: '판매중지', grade: '우수', verification: '완료', region: '대구', joinedAt: '2025-03-09', lastActiveAt: '2026-08-24 18:46', statusChangedAt: '2026-08-24 18:48', statusReason: '판매자 직접 일시 중지', activeProducts: 0, soldProducts: 59, tradeCount: 61, salesAmount: 11230000, cancelRate: 1.6, reportCount: 1, mannerScore: 91 },
  { id: 'SEL-11902', name: '정도현', nickname: '카메라생활', email: 'camera.life@example.com', phone: '010-3810-7749', status: '판매중', grade: '파워', verification: '완료', region: '서울', joinedAt: '2025-06-27', lastActiveAt: '2026-08-26 09:55', statusChangedAt: '2026-07-01 10:00', statusReason: '월 거래액 기준 자동 승급', activeProducts: 26, soldProducts: 174, tradeCount: 182, salesAmount: 53620000, cancelRate: 0.5, reportCount: 2, mannerScore: 98 },
  { id: 'SEL-12187', name: '한지우', nickname: '빈티지서랍', email: 'vintage.drawer@example.com', phone: '010-6652-0921', status: '판매중', grade: '일반', verification: '완료', region: '광주', joinedAt: '2025-09-11', lastActiveAt: '2026-08-25 23:17', statusChangedAt: '2025-09-11 11:20', statusReason: '판매자 등록 완료', activeProducts: 7, soldProducts: 23, tradeCount: 25, salesAmount: 4120000, cancelRate: 2.0, reportCount: 0, mannerScore: 88 },
  { id: 'SEL-12438', name: '오현우', nickname: '스니커랩', email: 'sneakerlab@example.com', phone: '010-9127-4300', status: '판매제한', grade: '우수', verification: '완료', region: '인천', joinedAt: '2025-11-05', lastActiveAt: '2026-08-26 08:22', statusChangedAt: '2026-08-23 15:08', statusReason: '정품 소명 자료 검토 중', activeProducts: 0, soldProducts: 68, tradeCount: 75, salesAmount: 19870000, cancelRate: 4.0, reportCount: 5, mannerScore: 72 },
  { id: 'SEL-12704', name: '윤가은', nickname: '가은리빙', email: 'gaeun.living@example.com', phone: '010-4302-8116', status: '휴면', grade: '일반', verification: '미완료', region: '대전', joinedAt: '2026-01-19', lastActiveAt: '2026-05-03 10:12', statusChangedAt: '2026-08-03 00:00', statusReason: '90일 이상 판매 활동 없음', activeProducts: 0, soldProducts: 4, tradeCount: 5, salesAmount: 470000, cancelRate: 0, reportCount: 0, mannerScore: 84 },
  { id: 'SEL-12991', name: '임수빈', nickname: '수빈북스', email: 'subinbooks@example.com', phone: '010-2088-3914', status: '판매중', grade: '우수', verification: '완료', region: '경기', joinedAt: '2026-02-23', lastActiveAt: '2026-08-26 13:02', statusChangedAt: '2026-08-10 10:30', statusReason: '거래 50건 달성', activeProducts: 15, soldProducts: 51, tradeCount: 54, salesAmount: 7830000, cancelRate: 1.9, reportCount: 0, mannerScore: 95 },
  { id: 'SEL-13226', name: '송태윤', nickname: '태윤테크', email: 'taeyoon.tech@example.com', phone: '010-7008-6492', status: '판매중지', grade: '일반', verification: '완료', region: '울산', joinedAt: '2026-04-16', lastActiveAt: '2026-08-20 16:33', statusChangedAt: '2026-08-20 16:35', statusReason: '재고 정리로 판매 일시 중지', activeProducts: 0, soldProducts: 12, tradeCount: 14, salesAmount: 3210000, cancelRate: 7.1, reportCount: 2, mannerScore: 79 },
];

const PRODUCT_SEEDS: Array<[string, string, string, number, ProductStatus, SaleProduct['condition'], number]> = [
  ['SEL-10482', '아크테릭스 베타 LT 재킷', '패션 > 아우터', 420000, '판매중', '사용감 적음', 0],
  ['SEL-10482', '빈티지 오크 사이드 테이블', '가구 > 테이블', 185000, '예약중', '사용감 적음', 0],
  ['SEL-10813', '무인양품 스탠드 조명', '리빙 > 조명', 68000, '판매중', '사용감 없음', 0],
  ['SEL-11209', '한정판 캐릭터 피규어 세트', '취미 > 피규어', 240000, '숨김', '새상품', 4],
  ['SEL-11544', '르메르 범백 스몰', '패션 > 가방', 390000, '판매완료', '사용감 적음', 0],
  ['SEL-11902', '소니 A7C II 바디', '디지털 > 카메라', 1980000, '판매중', '사용감 없음', 1],
  ['SEL-11902', '시그마 28-70mm F2.8', '디지털 > 렌즈', 720000, '예약중', '사용감 적음', 0],
  ['SEL-12187', '70s 프렌치 워크 재킷', '패션 > 빈티지', 128000, '판매중', '사용감 많음', 0],
  ['SEL-12438', '나이키 트래비스 스캇 로우', '패션 > 스니커즈', 1150000, '검수중', '새상품', 3],
  ['SEL-12704', '라탄 수납 바구니 3종', '리빙 > 수납', 32000, '숨김', '사용감 적음', 0],
  ['SEL-12991', '절판 디자인 서적 5권', '도서 > 디자인', 94000, '판매중', '사용감 적음', 0],
  ['SEL-12991', '건축 디테일 연감 2024', '도서 > 건축', 55000, '판매완료', '사용감 없음', 0],
  ['SEL-13226', '아이패드 미니 6 64GB', '디지털 > 태블릿', 490000, '판매완료', '사용감 적음', 1],
  ['SEL-10813', '알바 알토 화병 리프로덕션', '리빙 > 오브제', 49000, '판매중', '새상품', 0],
  ['SEL-11902', '라이카 Q2 가죽 케이스', '디지털 > 액세서리', 170000, '판매중', '사용감 없음', 0],
];

export const SALE_PRODUCTS: SaleProduct[] = PRODUCT_SEEDS.map((item, index) => ({
  id: `PRD-${260821 + index}`,
  sellerId: item[0], title: item[1], category: item[2], price: item[3], status: item[4], condition: item[5], reportCount: item[6],
  registeredAt: `2026-08-${String(11 + index).padStart(2, '0')} ${String(9 + index % 8).padStart(2, '0')}:20`,
  updatedAt: `2026-08-${String(19 + index % 8).padStart(2, '0')} ${String(10 + index % 7).padStart(2, '0')}:40`,
  views: 84 + index * 73, wishes: 3 + index * 4, chats: 1 + index % 9, exposure: item[4] === '숨김' ? '비노출' : '노출',
}));

const TRADE_SEEDS: Array<[number, string, string, number, TradeStatus, string]> = [
  [0, 'buyer_3021', '안전결제', 420000, '결제완료', ''], [1, 'tablelover', '카드', 185000, '배송중', ''],
  [2, 'moodhome', '간편결제', 68000, '구매확정', ''], [3, 'figure82', '카드', 240000, '취소', '판매 제한에 따른 자동 취소'],
  [4, 'dailybag', '안전결제', 390000, '구매확정', ''], [5, 'photo_j', '카드', 1980000, '배송중', '배송 지연 문의 1건'],
  [6, 'lensman', '간편결제', 720000, '분쟁', '상품 상태 설명 불일치'], [7, 'oldcloset', '안전결제', 128000, '결제완료', ''],
  [8, 'sneaker88', '카드', 1150000, '취소', '정품 검수 보류'], [10, 'bookcollector', '안전결제', 94000, '배송중', ''],
  [11, 'archi22', '카드', 55000, '구매확정', ''], [12, 'minipad', '간편결제', 490000, '구매확정', ''],
  [13, 'objet_user', '안전결제', 49000, '결제완료', ''], [14, 'leica_q', '카드', 170000, '배송중', ''],
];

export const SALE_TRADES: SaleTrade[] = TRADE_SEEDS.map((item, index) => {
  const product = SALE_PRODUCTS[item[0]];
  return {
    id: `TRD-202608-${String(8101 + index).padStart(4, '0')}`, productId: product.id, sellerId: product.sellerId,
    buyer: item[1], paymentMethod: item[2], amount: item[3], fee: Math.round(item[3] * 0.035), status: item[4], issue: item[5],
    paidAt: `2026-08-${String(18 + index % 8).padStart(2, '0')} ${String(9 + index % 9).padStart(2, '0')}:12`,
    updatedAt: `2026-08-${String(20 + index % 7).padStart(2, '0')} ${String(10 + index % 8).padStart(2, '0')}:45`,
    delivery: item[4] === '배송중' ? 'CJ대한통운 · 이동중' : item[4] === '구매확정' ? '배송 완료' : item[4] === '취소' ? '배송 없음' : '송장 미등록',
  };
});

export const SALE_RESTRICTIONS: SaleRestriction[] = [
  { id: 'RST-260825-019', sellerId: 'SEL-11209', type: '판매 제한', reason: '동일 상품 반복 등록 및 신고 누적', startedAt: '2026-08-25 16:20', endedAt: '2026-09-24 23:59', status: '적용중', operator: 'admin03', source: '신고 CASE-5821', memo: '소명 접수 시 운영 정책팀 재검토' },
  { id: 'RST-260823-014', sellerId: 'SEL-12438', type: '상품 등록 제한', reason: '정품 여부 소명 자료 검토 중', startedAt: '2026-08-23 15:08', endedAt: '2026-09-06 23:59', status: '적용중', operator: 'admin02', source: '자동 탐지 DET-2208', memo: '브랜드 구매 영수증 제출 요청' },
  { id: 'RST-260812-007', sellerId: 'SEL-13226', type: '경고', reason: '송장 등록 지연 3회', startedAt: '2026-08-12 11:30', endedAt: '2026-08-19 23:59', status: '만료', operator: 'admin04', source: '배송 모니터링', memo: '추가 발생 시 7일 판매 제한' },
  { id: 'RST-260719-011', sellerId: 'SEL-10482', type: '경고', reason: '카테고리 오등록', startedAt: '2026-07-19 14:05', endedAt: '2026-07-26 23:59', status: '만료', operator: 'admin01', source: '상품 검수', memo: '판매자가 즉시 카테고리 수정' },
  { id: 'RST-260902-003', sellerId: 'SEL-13226', type: '판매 제한', reason: '반복 취소율 개선 모니터링', startedAt: '2026-09-02 00:00', endedAt: '2026-09-09 23:59', status: '예약', operator: 'admin04', source: '위험 지표 RISK-118', memo: '8월 말 취소율 개선 시 예약 취소 검토' },
];

const HISTORY_ACTIONS: Array<[string, SaleActivityHistory['category'], string, string, string, string]> = [
  ['판매 상태 변경', '계정', '판매 상태', '판매중', '판매제한', '신고 누적에 따른 제한'],
  ['상품 비노출', '상품', 'PRD-260824', '노출', '비노출', '정품 자료 검토'],
  ['판매자 등급 변경', '계정', '판매 등급', '일반', '우수', '거래 50건 달성'],
  ['거래 상태 변경', '거래', 'TRD-202608-8107', '배송중', '분쟁', '구매자 이의 제기'],
  ['판매 일시 중지', '계정', '판매 상태', '판매중', '판매중지', '판매자 직접 요청'],
  ['정산 보류', '정산', 'SET-2608-382', '지급예정', '보류', '분쟁 조사'],
  ['상품 승인', '상품', 'PRD-260833', '검수중', '판매중', '검수 기준 충족'],
  ['제한 해제', '제한', 'RST-260731-032', '적용중', '해제', '분쟁 합의 완료'],
  ['본인 인증 변경', '계정', '본인 인증', '완료', '재인증 필요', '인증 유효기간 만료'],
  ['상품 판매 완료', '상품', 'PRD-260832', '예약중', '판매완료', '구매 확정'],
  ['판매 상태 변경', '계정', '판매 상태', '판매중지', '판매중', '판매 재개'],
  ['상품 신고 접수', '상품', 'PRD-260824', '신고 3건', '신고 4건', '중복 상품 신고'],
  ['경고 만료', '제한', 'RST-260812-007', '적용중', '만료', '제한 기간 종료'],
  ['거래 취소', '거래', 'TRD-202608-8104', '결제완료', '취소', '판매 제한 자동 취소'],
  ['판매자 승급', '계정', '판매 등급', '우수', '파워', '월 거래액 기준 충족'],
  ['상품 정보 수정', '상품', 'PRD-260821', '가격 450,000원', '가격 420,000원', '판매자 가격 수정'],
];

export const SALE_ACTIVITY_HISTORY: SaleActivityHistory[] = HISTORY_ACTIONS.map((item, index) => ({
  id: `LOG-260826-${String(301 + index).padStart(4, '0')}`,
  occurredAt: `2026-08-${String(26 - Math.floor(index / 3)).padStart(2, '0')} ${String(15 - index % 7).padStart(2, '0')}:${String(8 + index * 3).slice(-2)}`,
  sellerId: SELLERS[index % SELLERS.length].id,
  action: item[0], category: item[1], target: item[2], before: item[3], after: item[4], reason: item[5],
  actor: index % 4 === 0 ? 'SYSTEM' : `admin0${index % 4 + 1}`,
  ip: index % 4 === 0 ? '-' : `10.20.${index % 8}.${18 + index}`,
}));

export const SELLER_STATUS_META: Record<SellerStatus, { bg: string; fg: string }> = {
  판매중: { bg: '#ecfdf5', fg: '#047857' }, 판매중지: { bg: '#f4f4f5', fg: '#52525b' }, 판매제한: { bg: '#fef2f2', fg: '#dc2626' }, 휴면: { bg: '#fff7ed', fg: '#c2410c' },
};
export const PRODUCT_STATUS_META: Record<ProductStatus, { bg: string; fg: string }> = {
  판매중: { bg: '#ecfdf5', fg: '#047857' }, 예약중: { bg: '#eff6ff', fg: '#1d4ed8' }, 판매완료: { bg: '#f4f4f5', fg: '#52525b' }, 숨김: { bg: '#fef2f2', fg: '#dc2626' }, 검수중: { bg: '#fff7ed', fg: '#c2410c' },
};
export const TRADE_STATUS_META: Record<TradeStatus, { bg: string; fg: string }> = {
  결제완료: { bg: '#eff6ff', fg: '#1d4ed8' }, 배송중: { bg: '#f5f3ff', fg: '#6d28d9' }, 구매확정: { bg: '#ecfdf5', fg: '#047857' }, 취소: { bg: '#f4f4f5', fg: '#52525b' }, 분쟁: { bg: '#fef2f2', fg: '#dc2626' },
};
export const RESTRICTION_STATUS_META: Record<RestrictionStatus, { bg: string; fg: string }> = {
  적용중: { bg: '#fef2f2', fg: '#dc2626' }, 해제: { bg: '#eff6ff', fg: '#1d4ed8' }, 만료: { bg: '#f4f4f5', fg: '#52525b' }, 예약: { bg: '#fff7ed', fg: '#c2410c' },
};

export const sellerById = (id: string) => SELLERS.find((seller) => seller.id === id);
export const productById = (id: string) => SALE_PRODUCTS.find((product) => product.id === id);
export const formatWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;
