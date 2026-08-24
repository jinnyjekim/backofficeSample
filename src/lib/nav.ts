export interface NavItem {
  key: string;
  label: string;
  icon?: string;
  badge?: string;
  sub?: boolean;
  to?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '일반',
    items: [{ key: 'dash', icon: '▤', label: '대시보드', to: '/dashboard' }],
  },
  {
    label: '서비스 관리',
    items: [
      { key: 'members', icon: '☰', label: '회원 관리', badge: '128,430', to: '/members' },
      { key: 'members_sub1', sub: true, label: '회원 목록', to: '/members' },
      { key: 'left', sub: true, label: '탈퇴 회원', badge: '3,921', to: '/members/left' },
      { key: 'ban', sub: true, label: '제재 회원', badge: '421', to: '/members/ban' },

      { key: 'content', icon: '▣', label: '콘텐츠 관리' },

      { key: 'settlement', icon: '▩', label: '정산 관리', to: '/settlement' },
      { key: 'settlement_list', sub: true, label: '정산 목록', to: '/settlement' },
      { key: 'settlement_pending', sub: true, label: '정산 대기', to: '/settlement/pending' },
      { key: 'settlement_confirmed', sub: true, label: '정산 확정', to: '/settlement/confirmed' },
      { key: 'settlement_pay_scheduled', sub: true, label: '지급 예정', to: '/settlement/payment-scheduled' },
      { key: 'settlement_pay_completed', sub: true, label: '지급 완료', to: '/settlement/payment-completed' },
      { key: 'settlement_hold', sub: true, label: '정산 보류', to: '/settlement/hold' },
      { key: 'settlement_pay_failed', sub: true, label: '지급 실패', to: '/settlement/payment-failed' },
      { key: 'settlement_detail', sub: true, label: '정산 상세', to: '/settlement/detail' },
      { key: 'settlement_tx', sub: true, label: '정산 거래 내역', to: '/settlement/transactions' },
      { key: 'settlement_adjust', sub: true, label: '조정 내역', to: '/settlement/adjustments' },
      { key: 'settlement_history', sub: true, label: '정산 이력', to: '/settlement/history' },

      { key: 'partners', icon: '▧', label: '거래처 관리', to: '/partners/companies' },
      { key: 'partners_companies', sub: true, label: '회사', to: '/partners/companies' },
      { key: 'partners_contacts', sub: true, label: '담당자', to: '/partners/contacts' },
      { key: 'partners_status', sub: true, label: '거래 상태' },
      { key: 'partners_credit', sub: true, label: '신용/거래 조건', to: '/partners/credit-terms' },

      { key: 'products', icon: '▨', label: '상품 관리', to: '/products' },
      { key: 'products_list', sub: true, label: '상품', to: '/products' },
      { key: 'products_supply', sub: true, label: '공급가', to: '/products/supply-price' },
      { key: 'products_partner', sub: true, label: '거래처별 가격', to: '/products/partner-pricing' },
      { key: 'products_moq', sub: true, label: '최소 주문수량', to: '/products/min-order-qty' },

      { key: 'quotes', icon: '▥', label: '견적 관리', to: '/quotes/requests' },
      { key: 'quotes_requests', sub: true, label: '견적 요청', to: '/quotes/requests' },
      { key: 'quotes_list', sub: true, label: '견적서', to: '/quotes' },
      { key: 'quotes_approval', sub: true, label: '승인', to: '/quotes/approval' },
      { key: 'quotes_history', sub: true, label: '견적 이력', to: '/quotes/history' },

      { key: 'orders', icon: '▧', label: '주문 관리', to: '/orders/purchase' },
      { key: 'orders_purchase', sub: true, label: '발주', to: '/orders/purchase' },
      { key: 'orders_approval', sub: true, label: '주문 승인', to: '/orders/approval' },
      { key: 'orders_processing', sub: true, label: '처리', to: '/orders/processing' },
      { key: 'orders_completed', sub: true, label: '완료', to: '/orders/completed' },

      { key: 'contracts', icon: '▤', label: '계약 관리', to: '/contracts' },
      { key: 'contracts_list', sub: true, label: '계약', to: '/contracts' },
      { key: 'contracts_period', sub: true, label: '계약 기간', to: '/contracts/period' },
      { key: 'contracts_price', sub: true, label: '단가', to: '/contracts/unit-price' },
      { key: 'contracts_terms', sub: true, label: '거래 조건', to: '/contracts/trade-terms' },

      { key: 'payments', icon: '▦', label: '결제 / 수금', to: '/payments' },
      { key: 'payments_list', sub: true, label: '결제', to: '/payments' },
      { key: 'payments_receivables', sub: true, label: '미수금', to: '/payments/receivables' },
      { key: 'payments_deposit', sub: true, label: '입금 확인', to: '/payments/deposit-confirm' },
      { key: 'payments_tax', sub: true, label: '세금계산서', to: '/payments/tax-invoices' },

      { key: 'delivery', icon: '▢', label: '배송 관리', to: '/delivery/prep' },
      { key: 'delivery_prep', sub: true, label: '배송 준비', to: '/delivery/prep' },
      { key: 'delivery_outbound_wait', sub: true, label: '출고 대기', to: '/delivery/outbound-waiting' },
      { key: 'delivery_outbound_done', sub: true, label: '출고 완료', to: '/delivery/outbound-complete' },
      { key: 'delivery_transit', sub: true, label: '배송중', to: '/delivery/in-transit' },
      { key: 'delivery_done', sub: true, label: '배송 완료', to: '/delivery/complete' },

      { key: 'ops', icon: '▨', label: '운영 관리' },
      { key: 'cs', icon: '✉', label: '고객센터', badge: '28' },
    ],
  },
  {
    label: '분석 · 시스템',
    items: [
      { key: 'stats', icon: '▥', label: '통계' },
      { key: 'admin', icon: '⚙', label: '관리자' },
      { key: 'sys', icon: '⚙', label: '시스템' },
      { key: 'log', icon: '▤', label: '로그' },
    ],
  },
];

export const BREADCRUMB: Record<string, [string, string]> = {
  dash: ['일반', '대시보드'],
  members: ['서비스 관리 · 회원 관리', '회원 목록'],
  left: ['서비스 관리 · 회원 관리', '탈퇴 회원'],
  ban: ['서비스 관리 · 회원 관리', '제재 회원'],

  settlement_list: ['서비스 관리 · 정산 관리', '정산 목록'],
  settlement_pending: ['서비스 관리 · 정산 관리', '정산 대기'],
  settlement_confirmed: ['서비스 관리 · 정산 관리', '정산 확정'],
  settlement_pay_scheduled: ['서비스 관리 · 정산 관리', '지급 예정'],
  settlement_pay_completed: ['서비스 관리 · 정산 관리', '지급 완료'],
  settlement_hold: ['서비스 관리 · 정산 관리', '정산 보류'],
  settlement_pay_failed: ['서비스 관리 · 정산 관리', '지급 실패'],
  settlement_detail: ['서비스 관리 · 정산 관리', '정산 상세'],
  settlement_tx: ['서비스 관리 · 정산 관리', '정산 거래 내역'],
  settlement_adjust: ['서비스 관리 · 정산 관리', '조정 내역'],
  settlement_history: ['서비스 관리 · 정산 관리', '정산 이력'],

  partners_companies: ['서비스 관리 · 거래처 관리', '회사'],
  partners_contacts: ['서비스 관리 · 거래처 관리', '담당자'],
  partners_credit: ['서비스 관리 · 거래처 관리', '신용/거래 조건'],

  products_list: ['서비스 관리 · 상품 관리', '상품'],
  products_supply: ['서비스 관리 · 상품 관리', '공급가'],
  products_partner: ['서비스 관리 · 상품 관리', '거래처별 가격'],
  products_moq: ['서비스 관리 · 상품 관리', '최소 주문수량'],

  quotes_requests: ['서비스 관리 · 견적 관리', '견적 요청'],
  quotes_list: ['서비스 관리 · 견적 관리', '견적서'],
  quotes_approval: ['서비스 관리 · 견적 관리', '승인'],
  quotes_history: ['서비스 관리 · 견적 관리', '견적 이력'],

  orders_purchase: ['서비스 관리 · 주문 관리', '발주'],
  orders_approval: ['서비스 관리 · 주문 관리', '주문 승인'],
  orders_processing: ['서비스 관리 · 주문 관리', '처리'],
  orders_completed: ['서비스 관리 · 주문 관리', '완료'],

  contracts_list: ['서비스 관리 · 계약 관리', '계약'],
  contracts_period: ['서비스 관리 · 계약 관리', '계약 기간'],
  contracts_price: ['서비스 관리 · 계약 관리', '단가'],
  contracts_terms: ['서비스 관리 · 계약 관리', '거래 조건'],

  payments_list: ['서비스 관리 · 결제 / 수금', '결제'],
  payments_receivables: ['서비스 관리 · 결제 / 수금', '미수금'],
  payments_deposit: ['서비스 관리 · 결제 / 수금', '입금 확인'],
  payments_tax: ['서비스 관리 · 결제 / 수금', '세금계산서'],

  delivery_prep: ['서비스 관리 · 배송 관리', '배송 준비'],
  delivery_outbound_wait: ['서비스 관리 · 배송 관리', '출고 대기'],
  delivery_outbound_done: ['서비스 관리 · 배송 관리', '출고 완료'],
  delivery_transit: ['서비스 관리 · 배송 관리', '배송중'],
  delivery_done: ['서비스 관리 · 배송 관리', '배송 완료'],
};

export function activeKeyForPath(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'dash';
  if (pathname.startsWith('/members/left')) return 'left';
  if (pathname.startsWith('/members/ban')) return 'ban';
  if (pathname.startsWith('/members')) return 'members_sub1';

  if (pathname.startsWith('/partners/companies')) return 'partners_companies';
  if (pathname.startsWith('/partners/contacts')) return 'partners_contacts';
  if (pathname.startsWith('/partners/credit-terms')) return 'partners_credit';

  if (pathname.startsWith('/products/supply-price')) return 'products_supply';
  if (pathname.startsWith('/products/partner-pricing')) return 'products_partner';
  if (pathname.startsWith('/products/min-order-qty')) return 'products_moq';
  if (pathname.startsWith('/products')) return 'products_list';

  if (pathname.startsWith('/quotes/requests')) return 'quotes_requests';
  if (pathname.startsWith('/quotes/approval')) return 'quotes_approval';
  if (pathname.startsWith('/quotes/history')) return 'quotes_history';
  if (pathname.startsWith('/quotes')) return 'quotes_list';

  if (pathname.startsWith('/orders/purchase')) return 'orders_purchase';
  if (pathname.startsWith('/orders/approval')) return 'orders_approval';
  if (pathname.startsWith('/orders/processing')) return 'orders_processing';
  if (pathname.startsWith('/orders/completed')) return 'orders_completed';

  if (pathname.startsWith('/contracts/period')) return 'contracts_period';
  if (pathname.startsWith('/contracts/unit-price')) return 'contracts_price';
  if (pathname.startsWith('/contracts/trade-terms')) return 'contracts_terms';
  if (pathname.startsWith('/contracts')) return 'contracts_list';

  if (pathname.startsWith('/payments/receivables')) return 'payments_receivables';
  if (pathname.startsWith('/payments/deposit-confirm')) return 'payments_deposit';
  if (pathname.startsWith('/payments/tax-invoices')) return 'payments_tax';
  if (pathname.startsWith('/payments')) return 'payments_list';

  if (pathname.startsWith('/settlement/pending')) return 'settlement_pending';
  if (pathname.startsWith('/settlement/confirmed')) return 'settlement_confirmed';
  if (pathname.startsWith('/settlement/payment-scheduled')) return 'settlement_pay_scheduled';
  if (pathname.startsWith('/settlement/payment-completed')) return 'settlement_pay_completed';
  if (pathname.startsWith('/settlement/hold')) return 'settlement_hold';
  if (pathname.startsWith('/settlement/payment-failed')) return 'settlement_pay_failed';
  if (pathname.startsWith('/settlement/detail')) return 'settlement_detail';
  if (pathname.startsWith('/settlement/transactions')) return 'settlement_tx';
  if (pathname.startsWith('/settlement/adjustments')) return 'settlement_adjust';
  if (pathname.startsWith('/settlement/history')) return 'settlement_history';
  if (pathname.startsWith('/settlement')) return 'settlement_list';

  if (pathname.startsWith('/delivery/prep')) return 'delivery_prep';
  if (pathname.startsWith('/delivery/outbound-waiting')) return 'delivery_outbound_wait';
  if (pathname.startsWith('/delivery/outbound-complete')) return 'delivery_outbound_done';
  if (pathname.startsWith('/delivery/in-transit')) return 'delivery_transit';
  if (pathname.startsWith('/delivery/complete')) return 'delivery_done';

  return 'members_sub1';
}
