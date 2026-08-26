import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Scale,
  Building2,
  Package,
  Boxes,
  FileEdit,
  ShoppingCart,
  FileSignature,
  Wallet,
  CreditCard,
  Truck,
  Percent,
  Ticket,
  Coins,
  Award,
  Star,
  Megaphone,
  Headset,
  ScrollText,
  Receipt,
  BarChart3,
  ShieldCheck,
  Settings,
  History,
  PiggyBank,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  sub?: boolean;
  to?: string;
  divider?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '일반',
    items: [{ key: 'dash', icon: LayoutDashboard, label: '대시보드', to: '/dashboard' }],
  },
  {
    label: '서비스 관리',
    items: [
      { key: 'members', icon: Users, label: '회원 관리', badge: '128,430', to: '/members' },
      { key: 'members_sub1', sub: true, label: '회원 목록', to: '/members' },
      { key: 'left', sub: true, label: '탈퇴 회원', badge: '3,921', to: '/members/left' },
      { key: 'ban', sub: true, label: '제재 회원', badge: '421', to: '/members/ban' },

      { key: 'content', icon: FileText, label: '콘텐츠 관리', to: '/content' },
      { key: 'content_list', sub: true, label: '콘텐츠 목록', to: '/content' },
      { key: 'content_categories', sub: true, label: '카테고리 관리', to: '/content/categories' },
      { key: 'content_tags', sub: true, label: '태그 관리', to: '/content/tags' },
      { key: 'content_exposure', sub: true, label: '노출 관리', to: '/content/exposure' },
      { key: 'content_review', sub: true, label: '검수 관리', badge: '14', to: '/content/review' },

      { key: 'settlement', icon: Scale, label: '정산 관리', to: '/settlement' },
      { key: 'settlement_list', sub: true, label: '정산 목록', to: '/settlement' },
      { key: 'settlement_tx', sub: true, label: '정산 거래 내역', to: '/settlement/transactions' },
      { key: 'settlement_adjust', sub: true, label: '조정 내역', to: '/settlement/adjustments' },

      { key: 'partners', icon: Building2, label: '거래처 관리', to: '/partners/companies' },
      { key: 'partners_companies', sub: true, label: '회사', to: '/partners/companies' },
      { key: 'partners_contacts', sub: true, label: '담당자', to: '/partners/contacts' },
      { key: 'partners_status', sub: true, label: '거래 상태', to: '/partners/trade-status' },
      { key: 'partners_credit', sub: true, label: '신용/거래 조건', to: '/partners/credit-terms' },

      { key: 'products', icon: Package, label: '상품 관리', to: '/products' },
      { key: 'products_list', sub: true, label: '상품', to: '/products' },
      { key: 'products_supply', sub: true, label: '공급가', to: '/products/supply-price' },
      { key: 'products_partner', sub: true, label: '거래처별 가격', to: '/products/partner-pricing' },
      { key: 'products_moq', sub: true, label: '최소 주문수량', to: '/products/min-order-qty' },

      { key: 'inventory', icon: Boxes, label: '재고 관리', to: '/inventory/status' },
      { key: 'inventory_status', sub: true, label: '재고 현황', to: '/inventory/status' },
      { key: 'inventory_inbound', sub: true, label: '입고 관리', to: '/inventory/inbound' },
      { key: 'inventory_outbound', sub: true, label: '재고 출고', to: '/inventory/outbound' },
      { key: 'inventory_adjust', sub: true, label: '재고 조정', to: '/inventory/adjust' },
      { key: 'inventory_history', sub: true, label: '재고 변동 이력', to: '/inventory/history' },

      { key: 'quotes', icon: FileEdit, label: '견적 관리', to: '/quotes/requests' },
      { key: 'quotes_requests', sub: true, label: '견적 요청', to: '/quotes/requests' },
      { key: 'quotes_list', sub: true, label: '견적서', to: '/quotes' },
      { key: 'quotes_approval', sub: true, label: '승인', to: '/quotes/approval' },
      { key: 'quotes_history', sub: true, label: '견적 이력', to: '/quotes/history' },

      { key: 'orders', icon: ShoppingCart, label: '주문 관리', to: '/orders/purchase' },
      { key: 'orders_purchase', sub: true, label: '발주', to: '/orders/purchase' },
      { key: 'orders_approval', sub: true, label: '주문 승인', to: '/orders/approval' },
      { key: 'orders_processing', sub: true, label: '처리', to: '/orders/processing' },
      { key: 'orders_completed', sub: true, label: '완료', to: '/orders/completed' },
      { key: 'orders_cancel', sub: true, label: '취소 관리', to: '/orders/cancel' },
      { key: 'orders_return', sub: true, label: '반품 관리', to: '/orders/return' },
      { key: 'orders_exchange', sub: true, label: '교환 관리', to: '/orders/exchange' },
      { key: 'orders_refunds', sub: true, label: '환불 관리', to: '/orders/refunds' },

      { key: 'contracts', icon: FileSignature, label: '계약 관리', to: '/contracts' },
      { key: 'contracts_list', sub: true, label: '계약', to: '/contracts' },
      { key: 'contracts_period', sub: true, label: '계약 기간', to: '/contracts/period' },
      { key: 'contracts_price', sub: true, label: '단가', to: '/contracts/unit-price' },
      { key: 'contracts_terms', sub: true, label: '거래 조건', to: '/contracts/trade-terms' },

      { key: 'payments', icon: Wallet, label: '결제 / 수금', to: '/payments' },
      { key: 'payments_list', sub: true, label: '결제', to: '/payments' },
      { key: 'payments_receivables', sub: true, label: '미수금', to: '/payments/receivables' },
      { key: 'payments_deposit', sub: true, label: '입금 확인', to: '/payments/deposit-confirm' },
      { key: 'payments_tax', sub: true, label: '세금계산서', to: '/payments/tax-invoices' },

      { key: 'payment_mgmt', icon: CreditCard, label: '결제 관리', to: '/payment-mgmt/list' },
      { key: 'payment_mgmt_list', sub: true, label: '결제 목록', to: '/payment-mgmt/list' },
      { key: 'payment_mgmt_external', sub: true, label: '외부 거래 조회', to: '/payment-mgmt/external' },
      { key: 'payment_mgmt_history', sub: true, label: '결제 처리 이력', to: '/payment-mgmt/history' },

      { key: 'delivery', icon: Truck, label: '배송 관리', to: '/delivery/prep' },
      { key: 'delivery_prep', sub: true, label: '배송 준비', to: '/delivery/prep' },
      { key: 'delivery_outbound_wait', sub: true, label: '출고 대기', to: '/delivery/outbound-waiting' },
      { key: 'delivery_outbound_done', sub: true, label: '출고 완료', to: '/delivery/outbound-complete' },
      { key: 'delivery_transit', sub: true, label: '배송중', to: '/delivery/in-transit' },
      { key: 'delivery_done', sub: true, label: '배송 완료', to: '/delivery/complete' },

      { key: 'promotions', icon: Percent, label: '프로모션 관리', to: '/promotions' },
      { key: 'promotions_list', sub: true, label: '프로모션 목록', to: '/promotions' },
      { key: 'promotions_history', sub: true, label: '적용 이력', to: '/promotions/history' },

      { key: 'coupons', icon: Ticket, label: '쿠폰 관리', to: '/coupons' },
      { key: 'coupons_list', sub: true, label: '쿠폰 목록', to: '/coupons' },
      { key: 'coupons_issue', sub: true, label: '쿠폰 발급 관리', to: '/coupons/issue' },
      { key: 'coupons_usage', sub: true, label: '쿠폰 사용 내역', to: '/coupons/usage' },
      { key: 'coupons_policy', sub: true, label: '쿠폰 정책', to: '/coupons/policy' },

      { key: 'points', icon: Coins, label: '포인트 / 적립금 관리', to: '/points' },
      { key: 'points_status', sub: true, label: '보유 현황', to: '/points' },
      { key: 'points_history', sub: true, label: '포인트 내역', to: '/points/history' },

      { key: 'brands', icon: Award, label: '브랜드 관리', to: '/brands' },

      { key: 'reviews', icon: Star, label: '리뷰 관리', to: '/reviews' },

      { key: 'ops', icon: Megaphone, label: '운영 관리', to: '/ops/notices' },
      { key: 'ops_notices', sub: true, label: '공지사항', to: '/ops/notices' },
      { key: 'ops_faq', sub: true, label: 'FAQ', to: '/ops/faq' },
      { key: 'ops_banners', sub: true, label: '배너', to: '/ops/banners' },
      { key: 'ops_popups', sub: true, label: '팝업', to: '/ops/popups' },
      { key: 'ops_events', sub: true, label: '이벤트', to: '/ops/events' },

      { key: 'cs', icon: Headset, label: '고객센터', badge: '28', to: '/cs/inquiries' },
      { key: 'cs_inquiries', sub: true, label: '1:1 문의', to: '/cs/inquiries' },
      { key: 'cs_product_inquiry', sub: true, label: '상품 문의', to: '/cs/product-inquiries' },
      { key: 'cs_inquiry_types', sub: true, label: '문의 유형 관리', to: '/cs/inquiry-types' },
      { key: 'cs_consultations', sub: true, label: '상담 내역', to: '/cs/consultations' },
      { key: 'cs_templates', sub: true, label: '답변 템플릿', to: '/cs/templates' },
      { key: 'cs_memos', sub: true, label: '관리자 메모', to: '/cs/memos' },
      { key: 'cs_history', sub: true, label: 'CS 처리 이력', to: '/cs/history' },

      { key: 'policy_divider', label: '정책', divider: true },
      { key: 'policy', icon: ScrollText, label: '거래 정책', to: '/policy/order-status' },
      { key: 'policy_order_status', sub: true, label: '주문 상태 설정', to: '/policy/order-status' },
      { key: 'policy_payment', sub: true, label: '결제 정책', to: '/policy/payment' },
      { key: 'policy_cancel', sub: true, label: '취소 정책', to: '/policy/cancellation' },
      { key: 'policy_refund', sub: true, label: '환불 정책', to: '/policy/refund' },
      { key: 'policy_settlement', sub: true, label: '정산 정책', to: '/policy/settlement' },
      { key: 'policy_fee', sub: true, label: '수수료 정책', to: '/policy/fee' },

      { key: 'delivery_policy', icon: Receipt, label: '배송 정책', to: '/delivery-policy/base-fee' },
      { key: 'delivery_policy_base', sub: true, label: '기본 배송비', to: '/delivery-policy/base-fee' },
      { key: 'delivery_policy_free', sub: true, label: '무료배송 조건', to: '/delivery-policy/free-shipping' },
      { key: 'delivery_policy_region', sub: true, label: '지역별 추가 배송비', to: '/delivery-policy/region-fee' },
      { key: 'delivery_policy_product', sub: true, label: '상품별 배송 정책', to: '/delivery-policy/product' },
      { key: 'delivery_policy_bundle', sub: true, label: '묶음 배송', to: '/delivery-policy/bundle' },
      { key: 'delivery_policy_remote', sub: true, label: '제주 / 도서산간 정책', to: '/delivery-policy/remote-area' },
      { key: 'delivery_policy_return', sub: true, label: '반품 / 교환 배송비', to: '/delivery-policy/return-exchange' },

      { key: 'points_policy', icon: PiggyBank, label: '포인트 정책', to: '/points/policy' },
    ],
  },
  {
    label: '분석 · 시스템',
    items: [
      { key: 'stats', icon: BarChart3, label: '통계', to: '/stats/overview' },
      { key: 'admin', icon: ShieldCheck, label: '관리자' },
      { key: 'sys', icon: Settings, label: '시스템' },
      { key: 'log', icon: History, label: '로그' },
    ],
  },
];

export const BREADCRUMB: Record<string, [string, string]> = {
  dash: ['일반', '대시보드'],
  members: ['서비스 관리 · 회원 관리', '회원 목록'],
  left: ['서비스 관리 · 회원 관리', '탈퇴 회원'],
  ban: ['서비스 관리 · 회원 관리', '제재 회원'],

  content_list: ['서비스 관리 · 콘텐츠 관리', '콘텐츠 목록'],
  content_categories: ['서비스 관리 · 콘텐츠 관리', '카테고리 관리'],
  content_tags: ['서비스 관리 · 콘텐츠 관리', '태그 관리'],
  content_exposure: ['서비스 관리 · 콘텐츠 관리', '노출 관리'],
  content_review: ['서비스 관리 · 콘텐츠 관리', '검수 관리'],

  settlement_list: ['서비스 관리 · 정산 관리', '정산 목록'],
  settlement_tx: ['서비스 관리 · 정산 관리', '정산 거래 내역'],
  settlement_adjust: ['서비스 관리 · 정산 관리', '조정 내역'],

  partners_companies: ['서비스 관리 · 거래처 관리', '회사'],
  partners_contacts: ['서비스 관리 · 거래처 관리', '담당자'],
  partners_status: ['서비스 관리 · 거래처 관리', '거래 상태'],
  partners_credit: ['서비스 관리 · 거래처 관리', '신용/거래 조건'],

  products_list: ['서비스 관리 · 상품 관리', '상품'],
  products_supply: ['서비스 관리 · 상품 관리', '공급가'],
  products_partner: ['서비스 관리 · 상품 관리', '거래처별 가격'],
  products_moq: ['서비스 관리 · 상품 관리', '최소 주문수량'],

  inventory_status: ['서비스 관리 · 재고 관리', '재고 현황'],
  inventory_inbound: ['서비스 관리 · 재고 관리', '입고 관리'],
  inventory_outbound: ['서비스 관리 · 재고 관리', '재고 출고'],
  inventory_adjust: ['서비스 관리 · 재고 관리', '재고 조정'],
  inventory_history: ['서비스 관리 · 재고 관리', '재고 변동 이력'],

  quotes_requests: ['서비스 관리 · 견적 관리', '견적 요청'],
  quotes_list: ['서비스 관리 · 견적 관리', '견적서'],
  quotes_approval: ['서비스 관리 · 견적 관리', '승인'],
  quotes_history: ['서비스 관리 · 견적 관리', '견적 이력'],

  orders_purchase: ['서비스 관리 · 주문 관리', '발주'],
  orders_approval: ['서비스 관리 · 주문 관리', '주문 승인'],
  orders_processing: ['서비스 관리 · 주문 관리', '처리'],
  orders_completed: ['서비스 관리 · 주문 관리', '완료'],
  orders_cancel: ['서비스 관리 · 주문 관리', '취소 관리'],
  orders_return: ['서비스 관리 · 주문 관리', '반품 관리'],
  orders_exchange: ['서비스 관리 · 주문 관리', '교환 관리'],
  orders_refunds: ['서비스 관리 · 주문 관리', '환불 관리'],

  contracts_list: ['서비스 관리 · 계약 관리', '계약'],
  contracts_period: ['서비스 관리 · 계약 관리', '계약 기간'],
  contracts_price: ['서비스 관리 · 계약 관리', '단가'],
  contracts_terms: ['서비스 관리 · 계약 관리', '거래 조건'],

  payments_list: ['서비스 관리 · 결제 / 수금', '결제'],
  payments_receivables: ['서비스 관리 · 결제 / 수금', '미수금'],
  payments_deposit: ['서비스 관리 · 결제 / 수금', '입금 확인'],
  payments_tax: ['서비스 관리 · 결제 / 수금', '세금계산서'],

  cs_inquiries: ['서비스 관리 · 고객센터', '1:1 문의'],
  cs_product_inquiry: ['서비스 관리 · 고객센터', '상품 문의'],
  cs_inquiry_types: ['서비스 관리 · 고객센터', '문의 유형 관리'],
  cs_consultations: ['서비스 관리 · 고객센터', '상담 내역'],
  cs_templates: ['서비스 관리 · 고객센터', '답변 템플릿'],
  cs_memos: ['서비스 관리 · 고객센터', '관리자 메모'],
  cs_history: ['서비스 관리 · 고객센터', 'CS 처리 이력'],

  delivery_policy_base: ['서비스 관리 · 배송 정책', '기본 배송비'],
  delivery_policy_free: ['서비스 관리 · 배송 정책', '무료배송 조건'],
  delivery_policy_region: ['서비스 관리 · 배송 정책', '지역별 추가 배송비'],
  delivery_policy_product: ['서비스 관리 · 배송 정책', '상품별 배송 정책'],
  delivery_policy_bundle: ['서비스 관리 · 배송 정책', '묶음 배송'],
  delivery_policy_remote: ['서비스 관리 · 배송 정책', '제주 / 도서산간 정책'],
  delivery_policy_return: ['서비스 관리 · 배송 정책', '반품 / 교환 배송비'],

  ops_notices: ['서비스 관리 · 운영 관리', '공지사항'],
  ops_faq: ['서비스 관리 · 운영 관리', 'FAQ'],
  ops_banners: ['서비스 관리 · 운영 관리', '배너'],
  ops_popups: ['서비스 관리 · 운영 관리', '팝업'],
  ops_events: ['서비스 관리 · 운영 관리', '이벤트'],

  payment_mgmt_list: ['서비스 관리 · 결제 관리', '결제 목록'],
  payment_mgmt_external: ['서비스 관리 · 결제 관리', '외부 거래 조회'],
  payment_mgmt_history: ['서비스 관리 · 결제 관리', '결제 처리 이력'],

  policy_order_status: ['서비스 관리 · 거래 정책', '주문 상태 설정'],
  policy_payment: ['서비스 관리 · 거래 정책', '결제 정책'],
  policy_cancel: ['서비스 관리 · 거래 정책', '취소 정책'],
  policy_refund: ['서비스 관리 · 거래 정책', '환불 정책'],
  policy_settlement: ['서비스 관리 · 거래 정책', '정산 정책'],
  policy_fee: ['서비스 관리 · 거래 정책', '수수료 정책'],

  stats: ['분석 · 시스템', '통합 통계'],

  delivery_prep: ['서비스 관리 · 배송 관리', '배송 준비'],
  delivery_outbound_wait: ['서비스 관리 · 배송 관리', '출고 대기'],
  delivery_outbound_done: ['서비스 관리 · 배송 관리', '출고 완료'],
  delivery_transit: ['서비스 관리 · 배송 관리', '배송중'],
  delivery_done: ['서비스 관리 · 배송 관리', '배송 완료'],

  promotions_list: ['서비스 관리 · 프로모션 관리', '프로모션 목록'],
  promotions_history: ['서비스 관리 · 프로모션 관리', '적용 이력'],

  coupons_list: ['서비스 관리 · 쿠폰 관리', '쿠폰 목록'],
  coupons_issue: ['서비스 관리 · 쿠폰 관리', '쿠폰 발급 관리'],
  coupons_usage: ['서비스 관리 · 쿠폰 관리', '쿠폰 사용 내역'],
  coupons_policy: ['서비스 관리 · 쿠폰 관리', '쿠폰 정책'],

  points_status: ['서비스 관리 · 포인트 / 적립금 관리', '보유 현황'],
  points_history: ['서비스 관리 · 포인트 / 적립금 관리', '포인트 내역'],

  brands: ['서비스 관리', '브랜드 관리'],
  reviews: ['서비스 관리', '리뷰 관리'],
  points_policy: ['서비스 관리', '포인트 정책'],
};

export function activeKeyForPath(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'dash';
  if (pathname.startsWith('/members/left')) return 'left';
  if (pathname.startsWith('/members/ban')) return 'ban';
  if (pathname.startsWith('/members')) return 'members_sub1';

  if (pathname.startsWith('/content/categories')) return 'content_categories';
  if (pathname.startsWith('/content/tags')) return 'content_tags';
  if (pathname.startsWith('/content/exposure')) return 'content_exposure';
  if (pathname.startsWith('/content/review')) return 'content_review';
  if (pathname.startsWith('/content')) return 'content_list';

  if (pathname.startsWith('/partners/companies')) return 'partners_companies';
  if (pathname.startsWith('/partners/contacts')) return 'partners_contacts';
  if (pathname.startsWith('/partners/trade-status')) return 'partners_status';
  if (pathname.startsWith('/partners/credit-terms')) return 'partners_credit';

  if (pathname.startsWith('/products/supply-price')) return 'products_supply';
  if (pathname.startsWith('/products/partner-pricing')) return 'products_partner';
  if (pathname.startsWith('/products/min-order-qty')) return 'products_moq';
  if (pathname.startsWith('/products')) return 'products_list';

  if (pathname.startsWith('/inventory/inbound')) return 'inventory_inbound';
  if (pathname.startsWith('/inventory/outbound')) return 'inventory_outbound';
  if (pathname.startsWith('/inventory/adjust')) return 'inventory_adjust';
  if (pathname.startsWith('/inventory/history')) return 'inventory_history';
  if (pathname.startsWith('/inventory')) return 'inventory_status';

  if (pathname.startsWith('/quotes/requests')) return 'quotes_requests';
  if (pathname.startsWith('/quotes/approval')) return 'quotes_approval';
  if (pathname.startsWith('/quotes/history')) return 'quotes_history';
  if (pathname.startsWith('/quotes')) return 'quotes_list';

  if (pathname.startsWith('/orders/purchase')) return 'orders_purchase';
  if (pathname.startsWith('/orders/approval')) return 'orders_approval';
  if (pathname.startsWith('/orders/processing')) return 'orders_processing';
  if (pathname.startsWith('/orders/completed')) return 'orders_completed';
  if (pathname.startsWith('/orders/cancel')) return 'orders_cancel';
  if (pathname.startsWith('/orders/return')) return 'orders_return';
  if (pathname.startsWith('/orders/exchange')) return 'orders_exchange';
  if (pathname.startsWith('/orders/refunds')) return 'orders_refunds';

  if (pathname.startsWith('/contracts/period')) return 'contracts_period';
  if (pathname.startsWith('/contracts/unit-price')) return 'contracts_price';
  if (pathname.startsWith('/contracts/trade-terms')) return 'contracts_terms';
  if (pathname.startsWith('/contracts')) return 'contracts_list';

  if (pathname.startsWith('/payments/receivables')) return 'payments_receivables';
  if (pathname.startsWith('/payments/deposit-confirm')) return 'payments_deposit';
  if (pathname.startsWith('/payments/tax-invoices')) return 'payments_tax';
  if (pathname.startsWith('/payments')) return 'payments_list';

  if (pathname.startsWith('/settlement/transactions')) return 'settlement_tx';
  if (pathname.startsWith('/settlement/adjustments')) return 'settlement_adjust';
  if (pathname.startsWith('/settlement')) return 'settlement_list';

  if (pathname.startsWith('/cs/product-inquiries')) return 'cs_product_inquiry';
  if (pathname.startsWith('/cs/inquiries')) return 'cs_inquiries';
  if (pathname.startsWith('/cs/inquiry-types')) return 'cs_inquiry_types';
  if (pathname.startsWith('/cs/consultations')) return 'cs_consultations';
  if (pathname.startsWith('/cs/templates')) return 'cs_templates';
  if (pathname.startsWith('/cs/memos')) return 'cs_memos';
  if (pathname.startsWith('/cs/history')) return 'cs_history';

  if (pathname.startsWith('/delivery-policy/base-fee')) return 'delivery_policy_base';
  if (pathname.startsWith('/delivery-policy/free-shipping')) return 'delivery_policy_free';
  if (pathname.startsWith('/delivery-policy/region-fee')) return 'delivery_policy_region';
  if (pathname.startsWith('/delivery-policy/product')) return 'delivery_policy_product';
  if (pathname.startsWith('/delivery-policy/bundle')) return 'delivery_policy_bundle';
  if (pathname.startsWith('/delivery-policy/remote-area')) return 'delivery_policy_remote';
  if (pathname.startsWith('/delivery-policy/return-exchange')) return 'delivery_policy_return';

  if (pathname.startsWith('/ops/notices')) return 'ops_notices';
  if (pathname.startsWith('/ops/faq')) return 'ops_faq';
  if (pathname.startsWith('/ops/banners')) return 'ops_banners';
  if (pathname.startsWith('/ops/popups')) return 'ops_popups';
  if (pathname.startsWith('/ops/events')) return 'ops_events';

  if (pathname.startsWith('/payment-mgmt/list')) return 'payment_mgmt_list';
  if (pathname.startsWith('/payment-mgmt/external')) return 'payment_mgmt_external';
  if (pathname.startsWith('/payment-mgmt/history')) return 'payment_mgmt_history';

  if (pathname.startsWith('/policy/order-status')) return 'policy_order_status';
  if (pathname.startsWith('/policy/payment')) return 'policy_payment';
  if (pathname.startsWith('/policy/cancellation')) return 'policy_cancel';
  if (pathname.startsWith('/policy/refund')) return 'policy_refund';
  if (pathname.startsWith('/policy/settlement')) return 'policy_settlement';
  if (pathname.startsWith('/policy/fee')) return 'policy_fee';

  if (pathname.startsWith('/stats/overview')) return 'stats';

  if (pathname.startsWith('/delivery/prep')) return 'delivery_prep';
  if (pathname.startsWith('/delivery/outbound-waiting')) return 'delivery_outbound_wait';
  if (pathname.startsWith('/delivery/outbound-complete')) return 'delivery_outbound_done';
  if (pathname.startsWith('/delivery/in-transit')) return 'delivery_transit';
  if (pathname.startsWith('/delivery/complete')) return 'delivery_done';

  if (pathname.startsWith('/promotions/history')) return 'promotions_history';
  if (pathname.startsWith('/promotions')) return 'promotions_list';

  if (pathname.startsWith('/coupons/issue')) return 'coupons_issue';
  if (pathname.startsWith('/coupons/usage')) return 'coupons_usage';
  if (pathname.startsWith('/coupons/policy')) return 'coupons_policy';
  if (pathname.startsWith('/coupons')) return 'coupons_list';

  if (pathname.startsWith('/points/history')) return 'points_history';
  if (pathname.startsWith('/points/policy')) return 'points_policy';
  if (pathname.startsWith('/points')) return 'points_status';

  if (pathname.startsWith('/brands')) return 'brands';
  if (pathname.startsWith('/reviews')) return 'reviews';

  return 'members_sub1';
}
