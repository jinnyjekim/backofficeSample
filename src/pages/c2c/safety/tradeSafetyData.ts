export type RiskSignalType = '반복 취소' | '반복 신고' | '비정상 거래' | '의심 계정';
export type RiskLevel = '긴급' | '높음' | '보통' | '낮음';
export type RiskStatus = '탐지' | '검토중' | '소명대기' | '조치완료' | '오탐종결';
export type HoldStatus = '보류중' | '해제 승인 대기' | '해제' | '만료';

export interface SafetyHistory {
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface RiskCase {
  id: string;
  detectedAt: string;
  signalType: RiskSignalType;
  targetType: '거래' | '계정';
  targetId: string;
  accountId: string;
  accountName: string;
  score: number;
  level: RiskLevel;
  status: RiskStatus;
  assignee: string;
  summary: string;
  indicators: string[];
  relatedTrades: number;
  amount: number;
  lastActionAt: string;
  history: SafetyHistory[];
}

export interface TradeHold {
  id: string;
  tradeId: string;
  riskCaseId: string;
  accountId: string;
  accountName: string;
  buyer: string;
  amount: number;
  reason: string;
  scopes: Array<'거래 진행' | '판매대금 지급'>;
  heldAt: string;
  releaseDueAt: string;
  status: HoldStatus;
  handler: string;
  approvalBy: string;
  history: SafetyHistory[];
}

const history = (action: string, detail: string, actor = 'SYSTEM', at = '2026-08-27 09:10'): SafetyHistory[] => [
  { at, actor, action, detail },
];

export const RISK_CASES: RiskCase[] = [
  {
    id: 'RISK-260827-019', detectedAt: '2026-08-27 09:10', signalType: '반복 신고', targetType: '계정', targetId: 'SEL-11209', accountId: 'SEL-11209', accountName: '준호의창고', score: 94, level: '긴급', status: '검토중', assignee: 'admin03',
    summary: '최근 14일 동안 서로 다른 구매자 신고 7건이 동일 판매자에게 집중되었습니다.', indicators: ['14일 신고 7건', '상품 신고 5건', '거래 신고 2건', '과거 판매 제한 1회'], relatedTrades: 6, amount: 1540000, lastActionAt: '2026-08-27 09:24',
    history: [{ at: '2026-08-27 09:24', actor: 'admin03', action: '검토 시작', detail: '판매 상품과 최근 거래 증빙 확인' }, ...history('위험 건 생성', '반복 신고 임계치 5건 초과')],
  },
  {
    id: 'RISK-260827-018', detectedAt: '2026-08-27 08:42', signalType: '비정상 거래', targetType: '거래', targetId: 'TRD-202608-8109', accountId: 'SEL-12438', accountName: '스니커랩', score: 89, level: '높음', status: '소명대기', assignee: 'admin02',
    summary: '고가 상품 거래 직후 배송지와 수취인이 연속 변경되어 안전결제가 자동 보류되었습니다.', indicators: ['결제 후 배송지 3회 변경', '구매자 신규 계정', '판매가 1,150,000원', '동일 기기 다계정 접속'], relatedTrades: 1, amount: 1150000, lastActionAt: '2026-08-27 09:02',
    history: [{ at: '2026-08-27 09:02', actor: 'admin02', action: '소명 요청', detail: '판매자에게 정품 및 발송 증빙 제출 요청' }, ...history('자동 거래 보류', '위험 점수 85점 이상', 'SYSTEM', '2026-08-27 08:43')],
  },
  {
    id: 'RISK-260827-017', detectedAt: '2026-08-27 07:58', signalType: '반복 취소', targetType: '계정', targetId: 'SEL-13226', accountId: 'SEL-13226', accountName: '태윤테크', score: 76, level: '높음', status: '탐지', assignee: '미배정',
    summary: '판매자 귀책 취소율이 최근 30일 기준 운영 임계치를 초과했습니다.', indicators: ['30일 취소율 12.4%', '판매자 귀책 5건', '평균 취소율 대비 4.1배'], relatedTrades: 8, amount: 2130000, lastActionAt: '2026-08-27 07:58',
    history: history('위험 건 생성', '30일 판매자 귀책 취소율 10% 초과', 'SYSTEM', '2026-08-27 07:58'),
  },
  {
    id: 'RISK-260826-044', detectedAt: '2026-08-26 22:31', signalType: '의심 계정', targetType: '계정', targetId: 'buyer_8841', accountId: 'buyer_8841', accountName: 'quickdeal88', score: 83, level: '높음', status: '검토중', assignee: 'admin04',
    summary: '하나의 결제수단과 기기에서 신규 구매자 계정 4개가 연속 생성되었습니다.', indicators: ['동일 기기 계정 4개', '동일 결제수단 3개 계정', '24시간 내 가입'], relatedTrades: 4, amount: 860000, lastActionAt: '2026-08-27 08:12',
    history: [{ at: '2026-08-27 08:12', actor: 'admin04', action: '연관 계정 병합 검토', detail: '본인 인증 및 결제수단 명의 대조' }, ...history('위험 건 생성', '다계정 연관도 90% 이상', 'SYSTEM', '2026-08-26 22:31')],
  },
  {
    id: 'RISK-260826-039', detectedAt: '2026-08-26 18:05', signalType: '비정상 거래', targetType: '거래', targetId: 'TRD-202608-8107', accountId: 'SEL-11902', accountName: '카메라생활', score: 62, level: '보통', status: '조치완료', assignee: 'admin01',
    summary: '단기간 고액 거래가 집중됐으나 판매 이력과 본인 인증을 확인해 정상 거래로 종결했습니다.', indicators: ['24시간 거래액 2,700,000원', '신규 배송지', '과거 정상 거래 182건'], relatedTrades: 2, amount: 2700000, lastActionAt: '2026-08-26 20:10',
    history: [{ at: '2026-08-26 20:10', actor: 'admin01', action: '정상 거래 확인', detail: '판매자 거래 이력 및 구매자 본인 인증 확인' }, ...history('위험 건 생성', '24시간 고액 거래 집중', 'SYSTEM', '2026-08-26 18:05')],
  },
  {
    id: 'RISK-260826-031', detectedAt: '2026-08-26 14:20', signalType: '반복 신고', targetType: '계정', targetId: 'SEL-10482', accountId: 'SEL-10482', accountName: '셀렉트룸', score: 31, level: '낮음', status: '오탐종결', assignee: 'admin03',
    summary: '동일 구매자의 중복 신고로 확인되어 위험 건을 오탐 종결했습니다.', indicators: ['동일 신고자 3건', '신고 내용 동일', '상품 증빙 확인 완료'], relatedTrades: 1, amount: 420000, lastActionAt: '2026-08-26 15:18',
    history: [{ at: '2026-08-26 15:18', actor: 'admin03', action: '오탐 종결', detail: '동일 사용자의 중복 접수로 확인' }, ...history('위험 건 생성', '24시간 신고 3건', 'SYSTEM', '2026-08-26 14:20')],
  },
];

export const TRADE_HOLDS: TradeHold[] = [
  {
    id: 'HOLD-260827-012', tradeId: 'TRD-202608-8109', riskCaseId: 'RISK-260827-018', accountId: 'SEL-12438', accountName: '스니커랩', buyer: 'sneaker88', amount: 1150000, reason: '고가 거래 배송지 반복 변경 및 정품 소명 대기', scopes: ['거래 진행', '판매대금 지급'], heldAt: '2026-08-27 08:43', releaseDueAt: '2026-08-29 18:00', status: '보류중', handler: 'admin02', approvalBy: '미지정',
    history: history('거래 및 판매대금 보류', '위험 점수 89점 · 자동 보류', 'SYSTEM', '2026-08-27 08:43'),
  },
  {
    id: 'HOLD-260827-011', tradeId: 'TRD-202608-8104', riskCaseId: 'RISK-260827-019', accountId: 'SEL-11209', accountName: '준호의창고', buyer: 'figure82', amount: 240000, reason: '판매자 신고 누적에 따른 거래 조사', scopes: ['판매대금 지급'], heldAt: '2026-08-27 07:50', releaseDueAt: '2026-08-28 17:00', status: '해제 승인 대기', handler: 'admin03', approvalBy: 'admin05',
    history: [{ at: '2026-08-27 10:15', actor: 'admin03', action: '보류 해제 요청', detail: '구매자 환불 완료 및 추가 지급 위험 없음' }, ...history('판매대금 보류', '반복 신고 위험 건 연계', 'admin03', '2026-08-27 07:50')],
  },
  {
    id: 'HOLD-260826-038', tradeId: 'TRD-202608-8107', riskCaseId: 'RISK-260826-039', accountId: 'SEL-11902', accountName: '카메라생활', buyer: 'lensman', amount: 720000, reason: '단기간 고액 거래 집중 검토', scopes: ['거래 진행', '판매대금 지급'], heldAt: '2026-08-26 18:06', releaseDueAt: '2026-08-28 12:00', status: '해제', handler: 'admin01', approvalBy: 'admin05',
    history: [{ at: '2026-08-26 20:12', actor: 'admin05', action: '보류 해제 승인', detail: '정상 거래 확인' }, ...history('거래 보류', '고액 거래 집중 자동 탐지', 'SYSTEM', '2026-08-26 18:06')],
  },
  {
    id: 'HOLD-260826-032', tradeId: 'TRD-202608-8113', riskCaseId: 'RISK-260826-044', accountId: 'buyer_8841', accountName: 'quickdeal88', buyer: 'quickdeal88', amount: 490000, reason: '동일 기기 다계정 거래 조사', scopes: ['거래 진행'], heldAt: '2026-08-26 22:32', releaseDueAt: '2026-08-27 18:00', status: '보류중', handler: 'admin04', approvalBy: '미지정',
    history: history('거래 진행 보류', '연관 계정 본인 인증 확인 필요', 'SYSTEM', '2026-08-26 22:32'),
  },
  {
    id: 'HOLD-260824-021', tradeId: 'TRD-202608-8102', riskCaseId: 'RISK-260824-018', accountId: 'SEL-10813', accountName: '오브젝트마켓', buyer: 'moodhome', amount: 68000, reason: '구매자 결제 재시도 패턴 확인', scopes: ['거래 진행'], heldAt: '2026-08-24 10:20', releaseDueAt: '2026-08-25 10:20', status: '만료', handler: 'SYSTEM', approvalBy: '자동 해제',
    history: [{ at: '2026-08-25 10:20', actor: 'SYSTEM', action: '보류 자동 만료', detail: '추가 위험 신호 없음' }, ...history('거래 진행 보류', '결제 재시도 임계치 초과', 'SYSTEM', '2026-08-24 10:20')],
  },
];

export const RISK_STATUS_META: Record<RiskStatus, { bg: string; fg: string }> = {
  탐지: { bg: '#fef2f2', fg: '#dc2626' },
  검토중: { bg: '#fff7ed', fg: '#c2410c' },
  소명대기: { bg: '#f5f3ff', fg: '#6d28d9' },
  조치완료: { bg: '#ecfdf5', fg: '#047857' },
  오탐종결: { bg: '#f4f4f5', fg: '#52525b' },
};

export const HOLD_STATUS_META: Record<HoldStatus, { bg: string; fg: string }> = {
  보류중: { bg: '#fef2f2', fg: '#dc2626' },
  '해제 승인 대기': { bg: '#fff7ed', fg: '#c2410c' },
  해제: { bg: '#ecfdf5', fg: '#047857' },
  만료: { bg: '#f4f4f5', fg: '#52525b' },
};

export const RISK_LEVEL_META: Record<RiskLevel, { bg: string; fg: string }> = {
  긴급: { bg: '#fee2e2', fg: '#991b1b' },
  높음: { bg: '#fff7ed', fg: '#c2410c' },
  보통: { bg: '#eff6ff', fg: '#1d4ed8' },
  낮음: { bg: '#f4f4f5', fg: '#52525b' },
};
