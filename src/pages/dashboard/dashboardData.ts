import type { BusinessScope } from '../../lib/business';
import { ACCENT, AMBER, GREEN, RED } from '../../lib/theme';

export type DashboardTone = 'critical' | 'warning' | 'info' | 'success' | 'neutral';

export interface DashboardKpi {
  label: string;
  value: string;
  delta: string;
  deltaTone: 'positive' | 'negative' | 'neutral';
  comparison: string;
  detail: string;
  to: string;
}

export interface DashboardAlert {
  id: string;
  tone: DashboardTone;
  category: string;
  title: string;
  description: string;
  when: string;
  action: string;
  to: string;
}

export interface DashboardTask {
  label: string;
  count: number;
  unit: string;
  description: string;
  tone: DashboardTone;
  to: string;
}

export interface DashboardTrendPoint {
  day: string;
  primary: number;
  secondary: number;
  risk: number;
}

export interface DashboardHealth {
  label: string;
  value: string;
  detail: string;
  percent: number;
  color: string;
  to: string;
}

export interface DashboardActivity {
  actor: string;
  action: string;
  meta: string;
  when: string;
  color: string;
  to: string;
}

export interface DashboardModeData {
  note: string;
  overview: string;
  kpis: DashboardKpi[];
  alerts: DashboardAlert[];
  tasks: DashboardTask[];
  trendTitle: string;
  trendHint: string;
  trendLegend: Array<{ key: keyof Omit<DashboardTrendPoint, 'day'>; label: string; color: string; total: string }>;
  trend: DashboardTrendPoint[];
  healthTitle: string;
  health: DashboardHealth[];
  activities: DashboardActivity[];
}

const BLUE = '#3b82f6';
const PURPLE = '#8b5cf6';
const SLATE = '#64748b';
const CYAN = '#0891b2';
const days = ['08.25', '08.26', '08.27', '08.28', '08.29', '08.30', '08.31'];
const trend = (rows: Array<[number, number, number]>): DashboardTrendPoint[] => rows.map(([primary, secondary, risk], index) => ({ day: days[index], primary, secondary, risk }));

export const DASHBOARD_DATA: Record<BusinessScope, DashboardModeData> = {
  통합: {
    note: '전체 비즈니스의 운영 현황을 한 화면에서 봅니다',
    overview: 'B2C·C2C·B2B에서 고객 영향과 처리 시급도가 높은 업무를 통합 집계합니다.',
    kpis: [
      { label: '오늘 거래액', value: '5,684만원', delta: '+9.8%', deltaTone: 'positive', comparison: '전일 대비', detail: 'B2C 842만 · C2C 1,362만 · B2B 3,480만', to: '/stats/overview' },
      { label: '오늘 거래', value: '493건', delta: '+10.7%', deltaTone: 'positive', comparison: '전일 대비', detail: '주문 287 · C2C 거래 164 · 발주 42', to: '/stats/overview' },
      { label: '처리 대기', value: '94건', delta: '-12건', deltaTone: 'positive', comparison: '오전 9시 대비', detail: '승인·검수·문의·분쟁 업무 합계', to: '/cs/inquiries' },
      { label: '주의 필요', value: '19건', delta: '+3건', deltaTone: 'negative', comparison: '전일 동시간', detail: '결제 오류·위험 거래·연체·배송 실패', to: '/payment-mgmt/history' },
    ],
    alerts: [
      { id: 'ALL-01', tone: 'critical', category: '결제', title: '최근 1시간 결제 실패율이 기준치를 초과했습니다', description: 'B2C 카드 결제 7건과 C2C 안전결제 2건을 확인해 주세요.', when: '12분 전', action: '결제 오류 확인', to: '/payment-mgmt/history' },
      { id: 'ALL-02', tone: 'warning', category: '고객센터', title: '첫 답변 SLA 임박 문의가 18건 있습니다', description: 'B2C 9건 · C2C 6건 · B2B 3건이며 2시간 이내 답변이 필요합니다.', when: '24분 전', action: '문의 배정', to: '/cs/inquiries' },
      { id: 'ALL-03', tone: 'warning', category: '운영', title: '오늘 종료 또는 예약된 운영 항목이 5건 있습니다', description: '프로모션 2건 · 공지 1건 · 메시지 예약 2건의 노출 시각을 확인해 주세요.', when: '41분 전', action: '발송 일정 확인', to: '/notifications/dispatch' },
    ],
    tasks: [
      { label: '미배정 문의', count: 28, unit: '건', description: '담당자 배정 필요', tone: 'warning', to: '/cs/inquiries' },
      { label: '결제 확인 필요', count: 9, unit: '건', description: 'PG 상태 불일치 포함', tone: 'critical', to: '/payment-mgmt/list' },
      { label: '콘텐츠 검수', count: 14, unit: '건', description: '공개 예정 4건 포함', tone: 'info', to: '/content/review' },
      { label: '예약 발송', count: 6, unit: '건', description: '오늘 발송 3건', tone: 'neutral', to: '/notifications/dispatch' },
    ],
    trendTitle: '최근 7일 운영 흐름', trendHint: '비즈니스 전체 거래·신규 계정·주의 업무',
    trendLegend: [{ key: 'primary', label: '거래', color: ACCENT, total: '3,142건' }, { key: 'secondary', label: '신규 계정', color: GREEN, total: '438명' }, { key: 'risk', label: '주의 업무', color: AMBER, total: '126건' }],
    trend: trend([[58, 42, 26], [71, 56, 21], [49, 38, 17], [83, 64, 24], [96, 79, 20], [88, 91, 15], [74, 68, 19]]),
    healthTitle: '비즈니스 운영 건전성',
    health: [
      { label: 'B2C 주문 정상 처리', value: '96.8%', detail: '배송 실패 7건', percent: 96.8, color: BLUE, to: '/delivery/prep' },
      { label: 'C2C 안전 거래', value: '94.1%', detail: '거래 보류 5건', percent: 94.1, color: PURPLE, to: '/c2c/safety/monitoring' },
      { label: 'B2B 수금 정상', value: '91.6%', detail: '연체 거래처 4곳', percent: 91.6, color: GREEN, to: '/payments/receivables' },
      { label: 'CS SLA 준수', value: '89.4%', detail: '임박 18건', percent: 89.4, color: AMBER, to: '/cs/inquiries' },
    ],
    activities: [
      { actor: 'B2C', action: '주문 ORD-9821 결제가 완료되었습니다.', meta: '89,000원 · 카드', when: '2분 전', color: BLUE, to: '/payment-mgmt/list' },
      { actor: 'C2C', action: '거래 TR-0428 구매가 확정되었습니다.', meta: '판매대금 확정', when: '4분 전', color: PURPLE, to: '/c2c/proceeds/overview' },
      { actor: 'B2B', action: '견적 QT-0284 승인 요청이 등록되었습니다.', meta: '한빛물산', when: '7분 전', color: GREEN, to: '/quotes/approval' },
      { actor: 'SYSTEM', action: '위험 거래 1건을 자동 보류했습니다.', meta: '가격 이상 탐지', when: '11분 전', color: RED, to: '/c2c/safety/holds' },
      { actor: 'CS', action: '배송 지연 문의가 우선순위 높음으로 접수되었습니다.', meta: 'QNA-00192', when: '14분 전', color: AMBER, to: '/cs/inquiries' },
    ],
  },
  B2C: {
    note: '쇼핑 주문·매출·재고·배송 중심으로 봅니다',
    overview: '구매 전환부터 결제, 출고, 배송, 클레임까지 B2C 주문 흐름을 집계합니다.',
    kpis: [
      { label: '오늘 매출', value: '842만원', delta: '+12.5%', deltaTone: 'positive', comparison: '전일 대비', detail: '객단가 29,300원 · 순매출 기준', to: '/stats/sales' },
      { label: '오늘 주문', value: '287건', delta: '+32건', deltaTone: 'positive', comparison: '전일 대비', detail: '결제 완료 264 · 취소 요청 8', to: '/b2c/cancel/requests' },
      { label: '구매 전환율', value: '4.82%', delta: '+0.34%p', deltaTone: 'positive', comparison: '최근 7일 평균', detail: '장바구니 1,942건 기준', to: '/cart-conversion' },
      { label: '품절 위험', value: '18개', delta: '+4개', deltaTone: 'negative', comparison: '전일 대비', detail: '안전재고 이하 11개 포함', to: '/b2c/inventory/safety-stock' },
    ],
    alerts: [
      { id: 'B2C-01', tone: 'critical', category: '배송', title: '배송 실패 7건의 재처리가 필요합니다', description: '주소 오류 4건 · 수취인 부재 3건이며 고객 안내가 발송되지 않은 건이 2건입니다.', when: '18분 전', action: '실패 배송 확인', to: '/b2c/delivery/failed' },
      { id: 'B2C-02', tone: 'warning', category: '재고', title: '주문량 급증 상품 5개가 안전재고 이하입니다', description: '현재 판매 속도 기준 6시간 이내 품절 가능성이 있습니다.', when: '27분 전', action: '재고 확인', to: '/inventory/status' },
      { id: 'B2C-03', tone: 'info', category: '프로모션', title: '오늘 23:59 종료 예정 프로모션이 2건 있습니다', description: '쿠폰 자동 발급과 메인 배너 종료 시각이 동일하게 설정되어 있습니다.', when: '42분 전', action: '프로모션 확인', to: '/promotions' },
    ],
    tasks: [
      { label: '배송 준비', count: 36, unit: '건', description: '오늘 출고 대상', tone: 'info', to: '/delivery/prep' },
      { label: '취소 승인', count: 8, unit: '건', description: '부분 취소 2건 포함', tone: 'warning', to: '/b2c/cancel/approval' },
      { label: '반품 상품 확인', count: 12, unit: '건', description: '회수 완료 상품', tone: 'warning', to: '/b2c/returns/inspection' },
      { label: '리뷰 검토', count: 6, unit: '건', description: '신고 리뷰 4건', tone: 'critical', to: '/reviews' },
    ],
    trendTitle: '주문과 매출 흐름', trendHint: '최근 7일 주문·결제 완료·클레임',
    trendLegend: [{ key: 'primary', label: '주문', color: BLUE, total: '1,842건' }, { key: 'secondary', label: '결제 완료', color: GREEN, total: '1,716건' }, { key: 'risk', label: '클레임', color: AMBER, total: '84건' }],
    trend: trend([[62, 57, 18], [74, 69, 14], [58, 55, 12], [86, 81, 16], [96, 92, 15], [91, 87, 11], [78, 74, 13]]),
    healthTitle: '주문 운영 건전성',
    health: [
      { label: '결제 성공률', value: '98.3%', detail: '실패 7건', percent: 98.3, color: GREEN, to: '/payment-mgmt/list' },
      { label: '정시 출고율', value: '95.7%', detail: '출고 지연 11건', percent: 95.7, color: BLUE, to: '/delivery/outbound-waiting' },
      { label: '재고 가용률', value: '93.2%', detail: '품절 위험 18개', percent: 93.2, color: CYAN, to: '/inventory/status' },
      { label: '클레임 미발생', value: '97.1%', detail: '취소·반품·교환 28건', percent: 97.1, color: AMBER, to: '/b2c/returns/requests' },
    ],
    activities: [
      { actor: '이민준', action: '주문 ORD-9821 결제를 완료했습니다.', meta: '89,000원 · 카드', when: '2분 전', color: BLUE, to: '/payment-mgmt/list' },
      { actor: '김지수', action: 'VIP 감사 쿠폰을 사용했습니다.', meta: '20% 할인', when: '5분 전', color: GREEN, to: '/coupons/usage' },
      { actor: 'SYSTEM', action: '상품 옵션 2개의 안전재고 경고를 생성했습니다.', meta: '재고 알림', when: '7분 전', color: AMBER, to: '/b2c/inventory/alerts' },
      { actor: '박소연', action: '배송 지연 문의를 접수했습니다.', meta: 'QNA-00192', when: '8분 전', color: AMBER, to: '/cs/inquiries' },
      { actor: '최현우', action: '주문 ORD-9820 반품을 요청했습니다.', meta: '상품 파손', when: '12분 전', color: RED, to: '/b2c/returns/requests' },
    ],
  },
  C2C: {
    note: '회원 거래·상품 검수·신고·분쟁·판매대금 중심으로 봅니다',
    overview: 'C2C 거래 성사와 안전성, 판매자 활동, 판매대금 지급 상태를 집계합니다.',
    kpis: [
      { label: '오늘 거래', value: '164건', delta: '+8.4%', deltaTone: 'positive', comparison: '전일 대비', detail: '거래 성사율 72.6%', to: '/c2c/sales/trades' },
      { label: '등록 상품', value: '438개', delta: '+14.1%', deltaTone: 'positive', comparison: '전일 대비', detail: '검수 대기 23개', to: '/c2c/products/list' },
      { label: '판매대금 확정', value: '1,920만원', delta: '+5.7%', deltaTone: 'positive', comparison: '전일 대비', detail: '출금 가능 1,480만원', to: '/c2c/proceeds/overview' },
      { label: '위험 신호', value: '17건', delta: '+5건', deltaTone: 'negative', comparison: '전일 동시간', detail: '신고 9 · 탐지 5 · 분쟁 3', to: '/c2c/safety/monitoring' },
    ],
    alerts: [
      { id: 'C2C-01', tone: 'critical', category: '거래 안전', title: '위험 거래 5건이 자동 보류되었습니다', description: '가격 이상 2건 · 반복 취소 2건 · 의심 계정 1건입니다.', when: '9분 전', action: '보류 사유 확인', to: '/c2c/safety/holds' },
      { id: 'C2C-02', tone: 'warning', category: '분쟁', title: '증빙 제출 기한이 임박한 분쟁이 4건 있습니다', description: '24시간 이내 운영자 판단이 필요한 건을 우선 확인해 주세요.', when: '31분 전', action: '분쟁 검토', to: '/c2c/disputes/processing' },
      { id: 'C2C-03', tone: 'warning', category: '판매대금', title: '지급 보류 7건 중 2건이 3일 이상 경과했습니다', description: '연결 신고와 분쟁 처리 상태를 함께 확인해야 합니다.', when: '48분 전', action: '지급 보류 확인', to: '/c2c/proceeds/settlements' },
    ],
    tasks: [
      { label: '상품 검수', count: 23, unit: '건', description: '자동 탐지 6건 포함', tone: 'warning', to: '/c2c/products/review' },
      { label: '신고 처리', count: 19, unit: '건', description: '긴급 신고 3건', tone: 'critical', to: '/c2c/reports/processing' },
      { label: '분쟁 검토', count: 11, unit: '건', description: '증빙 대기 4건', tone: 'warning', to: '/c2c/disputes/processing' },
      { label: '출금 승인', count: 8, unit: '건', description: '본인 인증 완료', tone: 'info', to: '/c2c/proceeds/withdrawals' },
    ],
    trendTitle: '거래와 안전 지표', trendHint: '최근 7일 성사 거래·등록 상품·위험 신호',
    trendLegend: [{ key: 'primary', label: '성사 거래', color: PURPLE, total: '1,028건' }, { key: 'secondary', label: '등록 상품', color: BLUE, total: '2,914개' }, { key: 'risk', label: '위험 신호', color: RED, total: '76건' }],
    trend: trend([[48, 64, 20], [57, 71, 16], [52, 61, 21], [69, 82, 18], [82, 94, 24], [91, 88, 19], [71, 79, 17]]),
    healthTitle: '거래 안전 건전성',
    health: [
      { label: '거래 성사율', value: '72.6%', detail: '취소율 8.2%', percent: 72.6, color: PURPLE, to: '/c2c/stats/conversion' },
      { label: '신고 미발생', value: '96.4%', detail: '신고 19건', percent: 96.4, color: GREEN, to: '/c2c/reports/processing' },
      { label: '분쟁 미발생', value: '98.1%', detail: '분쟁 11건', percent: 98.1, color: BLUE, to: '/c2c/disputes/processing' },
      { label: '판매대금 정상 지급', value: '94.8%', detail: '지급 보류 7건', percent: 94.8, color: AMBER, to: '/c2c/proceeds/settlements' },
    ],
    activities: [
      { actor: 'user77', action: '거래 TR-0428 구매를 확정했습니다.', meta: '판매대금 확정', when: '방금 전', color: PURPLE, to: '/c2c/sales/trades' },
      { actor: 'user23', action: '상품 신고를 접수했습니다.', meta: '금지 상품 의심', when: '3분 전', color: RED, to: '/c2c/reports/processing' },
      { actor: 'SYSTEM', action: '위험 거래 1건을 자동 보류했습니다.', meta: '가격 이상 규칙', when: '7분 전', color: AMBER, to: '/c2c/safety/holds' },
      { actor: 'admin01', action: '분쟁 DSP-0114 검토를 시작했습니다.', meta: '구매자 증빙 확인', when: '11분 전', color: BLUE, to: '/c2c/disputes/processing' },
      { actor: 'seller88', action: '판매대금 출금을 요청했습니다.', meta: '420,000원', when: '15분 전', color: GREEN, to: '/c2c/proceeds/withdrawals' },
    ],
  },
  B2B: {
    note: '거래처·견적·발주·계약·납품·수금 중심으로 봅니다',
    overview: 'B2B 영업 파이프라인과 주문 승인, 납품, 수금 및 신용 위험을 집계합니다.',
    kpis: [
      { label: '오늘 발주 금액', value: '3,480만원', delta: '+4.8%', deltaTone: 'positive', comparison: '전일 대비', detail: '42건 · 평균 82.9만원', to: '/orders/purchase' },
      { label: '견적 전환율', value: '38.6%', delta: '+2.1%p', deltaTone: 'positive', comparison: '이번 달 평균', detail: '확정 34건 · 검토중 18건', to: '/quotes' },
      { label: '수금 예정', value: '6,240만원', delta: '12건', deltaTone: 'neutral', comparison: '이번 주', detail: '오늘 입금 예정 4건', to: '/payments/deposit-confirm' },
      { label: '연체 미수금', value: '1,280만원', delta: '+180만원', deltaTone: 'negative', comparison: '전주 대비', detail: '30일 이상 연체 거래처 2곳', to: '/payments/receivables' },
    ],
    alerts: [
      { id: 'B2B-01', tone: 'critical', category: '수금', title: '30일 이상 연체된 미수금이 4건 있습니다', description: '신용 한도에 영향을 주는 거래처 2곳의 독촉 이력을 확인해 주세요.', when: '1시간 전', action: '미수금 확인', to: '/payments/receivables' },
      { id: 'B2B-02', tone: 'warning', category: '견적', title: '고객 회신 예정일이 오늘인 견적이 3건 있습니다', description: '전체 승인 대기 8건 중 고액 견적 2건이 포함되어 있습니다.', when: '22분 전', action: '견적 승인', to: '/quotes/approval' },
      { id: 'B2B-03', tone: 'warning', category: '계약', title: '30일 이내 만료되는 계약이 6건 있습니다', description: '자동 갱신 대상 2건과 단가 재협의 대상 3건을 확인해 주세요.', when: '46분 전', action: '계약 확인', to: '/contracts/period' },
    ],
    tasks: [
      { label: '견적 승인', count: 8, unit: '건', description: '고액 견적 2건', tone: 'warning', to: '/quotes/approval' },
      { label: '주문 승인', count: 7, unit: '건', description: '한도 확인 2건', tone: 'warning', to: '/orders/approval' },
      { label: '입금 확인', count: 4, unit: '건', description: '오늘 입금 예정', tone: 'info', to: '/payments/deposit-confirm' },
      { label: '계약 갱신', count: 6, unit: '건', description: '30일 이내 만료', tone: 'critical', to: '/contracts/period' },
    ],
    trendTitle: '영업과 수금 흐름', trendHint: '최근 7일 발주·견적 요청·수금 지연',
    trendLegend: [{ key: 'primary', label: '발주', color: GREEN, total: '241건' }, { key: 'secondary', label: '견적 요청', color: BLUE, total: '118건' }, { key: 'risk', label: '수금 지연', color: RED, total: '21건' }],
    trend: trend([[41, 29, 13], [54, 35, 18], [48, 27, 15], [63, 42, 16], [72, 39, 21], [36, 18, 11], [44, 25, 14]]),
    healthTitle: '거래처 운영 건전성',
    health: [
      { label: '견적 전환율', value: '38.6%', detail: '확정 34건', percent: 38.6, color: BLUE, to: '/quotes' },
      { label: '주문 승인 완료율', value: '91.4%', detail: '대기 7건', percent: 91.4, color: GREEN, to: '/orders/approval' },
      { label: '납품 준수율', value: '94.2%', detail: '지연 3건', percent: 94.2, color: CYAN, to: '/orders/processing' },
      { label: '수금 정상률', value: '91.6%', detail: '연체 4건', percent: 91.6, color: AMBER, to: '/payments/receivables' },
    ],
    activities: [
      { actor: '한빛물산', action: '견적 QT-0284 승인을 요청했습니다.', meta: '3,200만원', when: '2분 전', color: BLUE, to: '/quotes/approval' },
      { actor: '대성상사', action: '발주 PO-1842를 등록했습니다.', meta: '상품 12종', when: '6분 전', color: GREEN, to: '/orders/purchase' },
      { actor: 'admin02', action: '계약 CT-0012 갱신 검토를 시작했습니다.', meta: '단가 재협의', when: '9분 전', color: PURPLE, to: '/contracts/period' },
      { actor: 'SYSTEM', action: '신용 한도 초과 주문을 보류했습니다.', meta: '회사 18', when: '14분 전', color: RED, to: '/partners/credit-terms' },
      { actor: '회사 07', action: '세금계산서 발행을 요청했습니다.', meta: '8월 거래분', when: '18분 전', color: SLATE, to: '/payments/tax-invoices' },
    ],
  },
};
