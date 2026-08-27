export type BalanceStatus = '정상' | '지급보류' | '계좌확인';
export type C2CSettlementStatus = '정산대기' | '검토중' | '정산확정' | '검토보류';
export type WithdrawalStatus = '출금요청' | '검토중' | '출금완료' | '출금실패' | '반려';
export type LedgerType = '정산예정' | '정산확정' | '출금' | '지급보류' | '보류해제' | '조정';

export interface MoneyHistory {
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface SellerBalance {
  sellerId: string;
  sellerName: string;
  scheduled: number;
  available: number;
  held: number;
  withdrawalRequested: number;
  withdrawnThisMonth: number;
  lifetimeProceeds: number;
  status: BalanceStatus;
  bankAccount: string;
  lastSettlementAt: string;
  holdSource: string;
  history: MoneyHistory[];
}

export interface C2CSettlement {
  id: string;
  sellerId: string;
  sellerName: string;
  period: string;
  tradeCount: number;
  gross: number;
  cancelRefund: number;
  fee: number;
  adjustment: number;
  net: number;
  status: C2CSettlementStatus;
  assignee: string;
  createdAt: string;
  confirmedAt: string;
  issue: string;
  holdType: '없음' | '정산 검토 보류' | '거래 안전 지급 보류';
  history: MoneyHistory[];
}

export interface Withdrawal {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  requestedAt: string;
  status: WithdrawalStatus;
  bankAccount: string;
  handler: string;
  processedAt: string;
  reason: string;
  history: MoneyHistory[];
}

export interface ProceedsLedger {
  id: string;
  occurredAt: string;
  sellerId: string;
  sellerName: string;
  type: LedgerType;
  amount: number;
  scheduledAfter: number;
  availableAfter: number;
  heldAfter: number;
  reference: string;
  actor: string;
  note: string;
}

const history = (action: string, detail: string, actor = 'SYSTEM', at = '2026-08-27 09:00'): MoneyHistory[] => [
  { at, actor, action, detail },
];

export const SELLER_BALANCES: SellerBalance[] = [
  { sellerId: 'SEL-10482', sellerName: '셀렉트룸', scheduled: 605000, available: 2845000, held: 0, withdrawalRequested: 0, withdrawnThisMonth: 5200000, lifetimeProceeds: 28740000, status: '정상', bankAccount: '국민 **** 2481', lastSettlementAt: '2026-08-26 18:10', holdSource: '-', history: history('정산금액 출금 가능 전환', 'SET-C-260826-011 · 1,320,000원', 'SYSTEM', '2026-08-26 18:10') },
  { sellerId: 'SEL-10813', sellerName: '오브젝트마켓', scheduled: 117000, available: 1280000, held: 0, withdrawalRequested: 680000, withdrawnThisMonth: 2450000, lifetimeProceeds: 16480000, status: '정상', bankAccount: '신한 **** 9031', lastSettlementAt: '2026-08-26 17:45', holdSource: '-', history: history('출금 요청', 'WD-260827-041 · 680,000원', '오브젝트마켓', '2026-08-27 08:20') },
  { sellerId: 'SEL-11209', sellerName: '준호의창고', scheduled: 0, available: 0, held: 1540000, withdrawalRequested: 0, withdrawnThisMonth: 320000, lifetimeProceeds: 6240000, status: '지급보류', bankAccount: '카카오뱅크 **** 6228', lastSettlementAt: '2026-08-25 16:20', holdSource: 'RISK-260827-019', history: history('판매대금 지급 보류', '반복 신고 위험 검토 · RISK-260827-019', 'SYSTEM', '2026-08-27 09:10') },
  { sellerId: 'SEL-11902', sellerName: '카메라생활', scheduled: 2700000, available: 4960000, held: 0, withdrawalRequested: 0, withdrawnThisMonth: 8900000, lifetimeProceeds: 53620000, status: '정상', bankAccount: '하나 **** 3810', lastSettlementAt: '2026-08-26 20:12', holdSource: '-', history: history('거래 안전 보류 해제', 'HOLD-260826-038 · 정상 거래 확인', 'admin05', '2026-08-26 20:12') },
  { sellerId: 'SEL-12438', sellerName: '스니커랩', scheduled: 0, available: 860000, held: 1150000, withdrawalRequested: 0, withdrawnThisMonth: 3100000, lifetimeProceeds: 19870000, status: '지급보류', bankAccount: '우리 **** 9127', lastSettlementAt: '2026-08-27 08:43', holdSource: 'HOLD-260827-012', history: history('판매대금 지급 보류', '고가 거래 배송지 변경 · HOLD-260827-012', 'SYSTEM', '2026-08-27 08:43') },
  { sellerId: 'SEL-12991', sellerName: '수빈북스', scheduled: 149000, available: 735000, held: 0, withdrawalRequested: 0, withdrawnThisMonth: 1250000, lifetimeProceeds: 7830000, status: '계좌확인', bankAccount: '계좌 재인증 필요', lastSettlementAt: '2026-08-26 16:30', holdSource: 'BANK-VERIFY-029', history: history('출금계좌 재인증 요청', '예금주 정보 불일치', 'SYSTEM', '2026-08-27 07:30') },
];

export const C2C_SETTLEMENTS: C2CSettlement[] = [
  { id: 'SET-C-260827-015', sellerId: 'SEL-11902', sellerName: '카메라생활', period: '2026.08.26', tradeCount: 2, gross: 2700000, cancelRefund: 0, fee: 94500, adjustment: 0, net: 2605500, status: '검토중', assignee: 'admin02', createdAt: '2026-08-27 06:00', confirmedAt: '-', issue: '24시간 고액 거래 검토 완료 여부 확인', holdType: '없음', history: history('정산 검토 시작', '거래 안전 보류 해제 확인', 'admin02', '2026-08-27 09:40') },
  { id: 'SET-C-260827-014', sellerId: 'SEL-11209', sellerName: '준호의창고', period: '2026.08.20 ~ 2026.08.26', tradeCount: 6, gross: 1540000, cancelRefund: 240000, fee: 45500, adjustment: 0, net: 1254500, status: '검토보류', assignee: 'admin03', createdAt: '2026-08-27 06:00', confirmedAt: '-', issue: '반복 신고 위험 건 조사 중', holdType: '거래 안전 지급 보류', history: history('정산 검토 보류', 'RISK-260827-019 지급 보류 연계', 'SYSTEM', '2026-08-27 09:10') },
  { id: 'SET-C-260827-013', sellerId: 'SEL-12438', sellerName: '스니커랩', period: '2026.08.26', tradeCount: 1, gross: 1150000, cancelRefund: 0, fee: 40250, adjustment: 0, net: 1109750, status: '검토보류', assignee: 'admin02', createdAt: '2026-08-27 06:00', confirmedAt: '-', issue: '거래 안전 보류 및 정품 소명 대기', holdType: '거래 안전 지급 보류', history: history('정산 검토 보류', 'HOLD-260827-012 거래 안전 보류 연계', 'SYSTEM', '2026-08-27 08:43') },
  { id: 'SET-C-260826-012', sellerId: 'SEL-10813', sellerName: '오브젝트마켓', period: '2026.08.25', tradeCount: 3, gross: 735000, cancelRefund: 0, fee: 25725, adjustment: -10000, net: 699275, status: '정산확정', assignee: 'admin01', createdAt: '2026-08-26 06:00', confirmedAt: '2026-08-26 17:45', issue: '', holdType: '없음', history: history('정산 확정', '판매대금 699,275원 반영', 'admin01', '2026-08-26 17:45') },
  { id: 'SET-C-260826-011', sellerId: 'SEL-10482', sellerName: '셀렉트룸', period: '2026.08.25', tradeCount: 4, gross: 1420000, cancelRefund: 0, fee: 49700, adjustment: -50300, net: 1320000, status: '정산확정', assignee: 'admin01', createdAt: '2026-08-26 06:00', confirmedAt: '2026-08-26 18:10', issue: '', holdType: '없음', history: history('정산 확정', '판매대금 1,320,000원 반영', 'admin01', '2026-08-26 18:10') },
  { id: 'SET-C-260827-016', sellerId: 'SEL-12991', sellerName: '수빈북스', period: '2026.08.26', tradeCount: 2, gross: 149000, cancelRefund: 0, fee: 5215, adjustment: 0, net: 143785, status: '정산대기', assignee: '미배정', createdAt: '2026-08-27 06:00', confirmedAt: '-', issue: '출금계좌 재인증은 지급 전에 확인', holdType: '없음', history: history('정산 생성', '구매 확정 거래 2건 집계', 'SYSTEM', '2026-08-27 06:00') },
];

export const WITHDRAWALS: Withdrawal[] = [
  { id: 'WD-260827-041', sellerId: 'SEL-10813', sellerName: '오브젝트마켓', amount: 680000, requestedAt: '2026-08-27 08:20', status: '출금요청', bankAccount: '신한 **** 9031', handler: '미배정', processedAt: '-', reason: '', history: history('출금 요청', '출금 가능 판매대금 680,000원', '오브젝트마켓', '2026-08-27 08:20') },
  { id: 'WD-260827-040', sellerId: 'SEL-10482', sellerName: '셀렉트룸', amount: 1200000, requestedAt: '2026-08-27 07:55', status: '검토중', bankAccount: '국민 **** 2481', handler: 'admin01', processedAt: '-', reason: '', history: history('출금 검토 시작', '계좌 및 잔액 확인', 'admin01', '2026-08-27 09:05') },
  { id: 'WD-260826-038', sellerId: 'SEL-11902', sellerName: '카메라생활', amount: 3000000, requestedAt: '2026-08-26 14:10', status: '출금완료', bankAccount: '하나 **** 3810', handler: 'admin02', processedAt: '2026-08-26 15:02', reason: '', history: history('출금 완료', '은행 이체 성공 · BANK-TX-88210', 'SYSTEM', '2026-08-26 15:02') },
  { id: 'WD-260826-037', sellerId: 'SEL-12991', sellerName: '수빈북스', amount: 550000, requestedAt: '2026-08-26 13:40', status: '출금실패', bankAccount: '계좌 재인증 필요', handler: 'admin03', processedAt: '2026-08-26 14:01', reason: '예금주 정보 불일치', history: history('출금 실패', '은행 응답: 예금주 정보 불일치', 'SYSTEM', '2026-08-26 14:01') },
  { id: 'WD-260825-034', sellerId: 'SEL-12438', sellerName: '스니커랩', amount: 860000, requestedAt: '2026-08-25 11:20', status: '반려', bankAccount: '우리 **** 9127', handler: 'admin02', processedAt: '2026-08-25 12:10', reason: '거래 안전 지급 보류 적용', history: history('출금 요청 반려', 'HOLD-260827-012 선행 위험 검토', 'admin02', '2026-08-25 12:10') },
];

export const PROCEEDS_LEDGER: ProceedsLedger[] = [
  { id: 'LED-260827-091', occurredAt: '2026-08-27 09:10', sellerId: 'SEL-11209', sellerName: '준호의창고', type: '지급보류', amount: 1540000, scheduledAfter: 0, availableAfter: 0, heldAfter: 1540000, reference: 'RISK-260827-019', actor: 'SYSTEM', note: '반복 신고 위험 검토' },
  { id: 'LED-260827-090', occurredAt: '2026-08-27 08:43', sellerId: 'SEL-12438', sellerName: '스니커랩', type: '지급보류', amount: 1150000, scheduledAfter: 0, availableAfter: 860000, heldAfter: 1150000, reference: 'HOLD-260827-012', actor: 'SYSTEM', note: '고가 거래 배송지 반복 변경' },
  { id: 'LED-260827-089', occurredAt: '2026-08-27 08:20', sellerId: 'SEL-10813', sellerName: '오브젝트마켓', type: '출금', amount: -680000, scheduledAfter: 117000, availableAfter: 600000, heldAfter: 0, reference: 'WD-260827-041', actor: '오브젝트마켓', note: '출금 요청으로 잔액 예약' },
  { id: 'LED-260827-088', occurredAt: '2026-08-27 06:00', sellerId: 'SEL-12991', sellerName: '수빈북스', type: '정산예정', amount: 143785, scheduledAfter: 149000, availableAfter: 735000, heldAfter: 0, reference: 'SET-C-260827-016', actor: 'SYSTEM', note: '구매 확정 거래 2건 집계' },
  { id: 'LED-260826-087', occurredAt: '2026-08-26 20:12', sellerId: 'SEL-11902', sellerName: '카메라생활', type: '보류해제', amount: 720000, scheduledAfter: 2700000, availableAfter: 4960000, heldAfter: 0, reference: 'HOLD-260826-038', actor: 'admin05', note: '정상 거래 확인' },
  { id: 'LED-260826-086', occurredAt: '2026-08-26 18:10', sellerId: 'SEL-10482', sellerName: '셀렉트룸', type: '정산확정', amount: 1320000, scheduledAfter: 605000, availableAfter: 2845000, heldAfter: 0, reference: 'SET-C-260826-011', actor: 'admin01', note: '정산 확정 판매대금 반영' },
  { id: 'LED-260826-085', occurredAt: '2026-08-26 17:45', sellerId: 'SEL-10813', sellerName: '오브젝트마켓', type: '조정', amount: -10000, scheduledAfter: 117000, availableAfter: 1280000, heldAfter: 0, reference: 'SET-C-260826-012', actor: 'admin01', note: '이전 정산 과지급 조정' },
  { id: 'LED-260826-084', occurredAt: '2026-08-26 15:02', sellerId: 'SEL-11902', sellerName: '카메라생활', type: '출금', amount: -3000000, scheduledAfter: 2700000, availableAfter: 4960000, heldAfter: 0, reference: 'WD-260826-038', actor: 'SYSTEM', note: '은행 이체 완료' },
];

export const BALANCE_STATUS_META: Record<BalanceStatus, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#047857' }, 지급보류: { bg: '#fef2f2', fg: '#dc2626' }, 계좌확인: { bg: '#fff7ed', fg: '#c2410c' },
};
export const SETTLEMENT_STATUS_META: Record<C2CSettlementStatus, { bg: string; fg: string }> = {
  정산대기: { bg: '#f4f4f5', fg: '#52525b' }, 검토중: { bg: '#eff6ff', fg: '#1d4ed8' }, 정산확정: { bg: '#ecfdf5', fg: '#047857' }, 검토보류: { bg: '#fef2f2', fg: '#dc2626' },
};
export const WITHDRAWAL_STATUS_META: Record<WithdrawalStatus, { bg: string; fg: string }> = {
  출금요청: { bg: '#fff7ed', fg: '#c2410c' }, 검토중: { bg: '#eff6ff', fg: '#1d4ed8' }, 출금완료: { bg: '#ecfdf5', fg: '#047857' }, 출금실패: { bg: '#fef2f2', fg: '#dc2626' }, 반려: { bg: '#f4f4f5', fg: '#52525b' },
};

export const formatMoney = (value: number) => `${value.toLocaleString('ko-KR')}원`;
