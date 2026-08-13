import { ACCENT, AMBER, GREEN, GREEN_STRONG, RED } from '../../lib/theme';

export const CHART_JOIN = 'oklch(0.62 0.15 258)';
export const CHART_ORDER = 'oklch(0.7 0.13 155)';
export const CHART_INQ = 'oklch(0.78 0.14 70)';

export const ALERTS = [
  { title: '결제 오류 3건', sub: '최근 1시간 내 결제 실패 급증 — 결제 게이트웨이 확인 필요', when: '12분 전', cta: '오류 보기', dot: RED },
  { title: '24시간 이상 미처리 문의 28건', sub: '배송 지연 문의가 19건으로 가장 많습니다', when: '1시간 전', cta: '문의 보기', dot: AMBER },
];

export const KPIS_MAIN = [
  { label: '오늘 가입자', value: '134', delta: '▲ 18.2%', deltaFg: GREEN_STRONG, sub: '전일 113명 · 주간 평균 118명' },
  { label: '활성 사용자', value: '12,847', delta: '▲ 3.1%', deltaFg: GREEN_STRONG, sub: '전체 회원의 10.0%' },
  { label: '오늘 매출', value: '842만원', delta: '▲ 12.5%', deltaFg: GREEN_STRONG, sub: '주문 287건 · 객단가 29,300원' },
];

const CHART_RAW: [number, number, number][] = [
  [42, 58, 31],
  [56, 71, 22],
  [38, 49, 18],
  [64, 83, 26],
  [79, 96, 20],
  [91, 88, 15],
  [68, 74, 19],
];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const CMAX = 100;

export const CHART = CHART_RAW.map(([join, order, inq], i) => ({
  day: DAYS[i],
  join: (join / CMAX) * 100,
  order: (order / CMAX) * 100,
  inq: (inq / CMAX) * 100,
}));

export const LEGEND = [
  { label: '가입', color: CHART_JOIN, total: '438' },
  { label: '주문', color: CHART_ORDER, total: '519' },
  { label: '문의', color: CHART_INQ, total: '151' },
];

export const MEMBER_MIX = [
  { label: '활성 회원', value: '12,847', pct: '70%', color: GREEN, view: 'all' as const },
  { label: '휴면 회원', value: '3,921', pct: '22%', color: AMBER, view: 'risk' as const },
  { label: '정지 회원', value: '421', pct: '4%', color: RED, view: 'risk' as const },
  { label: '탈퇴 회원', value: '1,740', pct: '10%', color: '#d4d4d8', view: 'all' as const },
];

export const FEED = [
  { who: '김지수', what: '신규 회원 가입', when: '방금 전', dot: GREEN },
  { who: '이민준', what: '주문 #ORD-9821 결제 완료 · 89,000원', when: '2분 전', dot: ACCENT },
  { who: '박소연', what: '문의 접수 — 배송 지연 관련', when: '5분 전', dot: AMBER },
  { who: '최현우', what: '주문 #ORD-9820 환불 요청', when: '12분 전', dot: RED },
  { who: '정다은', what: '신규 회원 가입', when: '18분 전', dot: GREEN },
];
