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
  ShoppingBag,
  BellRing,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  sub?: boolean;
  to?: string;
  divider?: boolean;
  business?: 'B' | 'C' | 'BC' | 'B2B';
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

      { key: 'settlement', icon: Scale, label: '거래처 정산 관리', to: '/settlement', business: 'B2B' },
      { key: 'settlement_list', sub: true, label: '정산 목록', to: '/settlement', business: 'B2B' },
      { key: 'settlement_tx', sub: true, label: '정산 거래 내역', to: '/settlement/transactions', business: 'B2B' },
      { key: 'settlement_adjust', sub: true, label: '조정 내역', to: '/settlement/adjustments', business: 'B2B' },

      { key: 'partners', icon: Building2, label: '거래처 관리', to: '/partners/companies', business: 'B2B' },
      { key: 'partners_companies', sub: true, label: '회사', to: '/partners/companies', business: 'B2B' },
      { key: 'partners_contacts', sub: true, label: '담당자', to: '/partners/contacts', business: 'B2B' },
      { key: 'partners_status', sub: true, label: '거래 상태', to: '/partners/trade-status', business: 'B2B' },
      { key: 'partners_credit', sub: true, label: '신용/거래 조건', to: '/partners/credit-terms', business: 'B2B' },

      { key: 'products', icon: Package, label: '공급 상품 관리', to: '/products', business: 'B2B' },
      { key: 'products_list', sub: true, label: '상품 목록', to: '/products', business: 'B2B' },
      { key: 'products_supply', sub: true, label: '공급가', to: '/products/supply-price', business: 'B2B' },
      { key: 'products_partner', sub: true, label: '거래처별 가격', to: '/products/partner-pricing', business: 'B2B' },
      { key: 'products_moq', sub: true, label: '최소 주문수량', to: '/products/min-order-qty', business: 'B2B' },

      { key: 'inventory', icon: Boxes, label: '재고 관리', to: '/inventory/status', business: 'B' },
      { key: 'inventory_status', sub: true, label: '재고 현황', to: '/inventory/status', business: 'B' },
      { key: 'inventory_options', sub: true, label: '옵션별 재고', to: '/b2c/inventory/options', business: 'B' },
      { key: 'inventory_inbound', sub: true, label: '입고 관리', to: '/inventory/inbound', business: 'B' },
      { key: 'inventory_outbound', sub: true, label: '출고 관리', to: '/inventory/outbound', business: 'B' },
      { key: 'inventory_adjust', sub: true, label: '재고 조정', to: '/inventory/adjust', business: 'B' },
      { key: 'inventory_history', sub: true, label: '재고 변동 이력', to: '/inventory/history', business: 'B' },
      { key: 'inventory_soldout', sub: true, label: '품절 상품', to: '/b2c/inventory/sold-out', business: 'B' },
      { key: 'inventory_safety', sub: true, label: '안전 재고', to: '/b2c/inventory/safety-stock', business: 'B' },
      { key: 'inventory_alerts', sub: true, label: '재고 알림', to: '/b2c/inventory/alerts', business: 'B' },

      { key: 'quotes', icon: FileEdit, label: '견적 관리', to: '/quotes/requests', business: 'B2B' },
      { key: 'quotes_requests', sub: true, label: '견적 요청', to: '/quotes/requests', business: 'B2B' },
      { key: 'quotes_list', sub: true, label: '견적서', to: '/quotes', business: 'B2B' },
      { key: 'quotes_approval', sub: true, label: '승인', to: '/quotes/approval', business: 'B2B' },
      { key: 'quotes_history', sub: true, label: '견적 이력', to: '/quotes/history', business: 'B2B' },

      { key: 'orders', icon: ShoppingCart, label: '주문 관리', to: '/orders/purchase', business: 'B2B' },
      { key: 'orders_purchase', sub: true, label: '발주', to: '/orders/purchase', business: 'B2B' },
      { key: 'orders_approval', sub: true, label: '주문 승인', to: '/orders/approval', business: 'B2B' },
      { key: 'orders_processing', sub: true, label: '처리', to: '/orders/processing', business: 'B2B' },
      { key: 'orders_completed', sub: true, label: '완료', to: '/orders/completed', business: 'B2B' },
      { key: 'orders_refunds', sub: true, label: '환불 관리', to: '/orders/refunds', business: 'B2B' },

      { key: 'contracts', icon: FileSignature, label: '계약 관리', to: '/contracts', business: 'B2B' },
      { key: 'contracts_list', sub: true, label: '계약', to: '/contracts', business: 'B2B' },
      { key: 'contracts_period', sub: true, label: '계약 기간', to: '/contracts/period', business: 'B2B' },
      { key: 'contracts_price', sub: true, label: '단가', to: '/contracts/unit-price', business: 'B2B' },
      { key: 'contracts_terms', sub: true, label: '거래 조건', to: '/contracts/trade-terms', business: 'B2B' },

      { key: 'payments', icon: Wallet, label: '결제 / 수금', to: '/payments', business: 'B2B' },
      { key: 'payments_list', sub: true, label: '결제', to: '/payments', business: 'B2B' },
      { key: 'payments_receivables', sub: true, label: '미수금', to: '/payments/receivables', business: 'B2B' },
      { key: 'payments_deposit', sub: true, label: '입금 확인', to: '/payments/deposit-confirm', business: 'B2B' },
      { key: 'payments_tax', sub: true, label: '세금계산서', to: '/payments/tax-invoices', business: 'B2B' },

      { key: 'payment_mgmt', icon: CreditCard, label: '결제 운영', to: '/payment-mgmt/list' },
      { key: 'payment_mgmt_list', sub: true, label: '결제 건 조회', to: '/payment-mgmt/list' },
      { key: 'payment_mgmt_external', sub: true, label: 'PG / 외부 거래', to: '/payment-mgmt/external' },
      { key: 'payment_mgmt_history', sub: true, label: '결제 처리 이력', to: '/payment-mgmt/history' },

      { key: 'delivery', icon: Truck, label: '배송 관리', to: '/delivery/prep', business: 'B' },
      { key: 'delivery_prep', sub: true, label: '배송 준비', to: '/delivery/prep', business: 'B' },
      { key: 'delivery_outbound_wait', sub: true, label: '출고 대기', to: '/delivery/outbound-waiting', business: 'B' },
      { key: 'delivery_outbound_done', sub: true, label: '출고 완료', to: '/delivery/outbound-complete', business: 'B' },
      { key: 'delivery_transit', sub: true, label: '배송중', to: '/delivery/in-transit', business: 'B' },
      { key: 'delivery_done', sub: true, label: '배송 완료', to: '/delivery/complete', business: 'B' },
      { key: 'delivery_failed', sub: true, label: '배송 실패', to: '/b2c/delivery/failed', business: 'B' },
      { key: 'delivery_hold', sub: true, label: '배송 보류', to: '/b2c/delivery/hold', business: 'B' },
      { key: 'delivery_invoices', sub: true, label: '송장 관리', to: '/b2c/delivery/invoices', business: 'B' },
      { key: 'delivery_carriers', sub: true, label: '배송사 관리', to: '/b2c/delivery/carriers', business: 'B' },
      { key: 'delivery_tracking', sub: true, label: '배송 추적', to: '/b2c/delivery/tracking', business: 'B' },
      { key: 'delivery_history', sub: true, label: '배송 이력', to: '/b2c/delivery/history', business: 'B' },

      { key: 'cancel_mgmt', icon: ShoppingCart, label: '취소 관리', to: '/b2c/cancel/requests', business: 'B' },
      { key: 'cancel_requests', sub: true, label: '취소 요청', to: '/b2c/cancel/requests', business: 'B' },
      { key: 'cancel_approval', sub: true, label: '취소 승인', to: '/b2c/cancel/approval', business: 'B' },
      { key: 'cancel_rejected', sub: true, label: '취소 반려', to: '/b2c/cancel/rejected', business: 'B' },
      { key: 'cancel_partial', sub: true, label: '부분 취소', to: '/b2c/cancel/partial', business: 'B' },
      { key: 'cancel_completed', sub: true, label: '취소 완료', to: '/b2c/cancel/completed', business: 'B' },
      { key: 'cancel_history', sub: true, label: '취소 이력', to: '/b2c/cancel/history', business: 'B' },

      { key: 'return_mgmt', icon: ShoppingBag, label: '반품 관리', to: '/b2c/returns/requests', business: 'B' },
      { key: 'return_requests', sub: true, label: '반품 요청', to: '/b2c/returns/requests', business: 'B' },
      { key: 'return_approval', sub: true, label: '반품 승인', to: '/b2c/returns/approval', business: 'B' },
      { key: 'return_collecting', sub: true, label: '반품 회수', to: '/b2c/returns/collecting', business: 'B' },
      { key: 'return_collected', sub: true, label: '회수 완료', to: '/b2c/returns/collected', business: 'B' },
      { key: 'return_inspection', sub: true, label: '상품 확인', to: '/b2c/returns/inspection', business: 'B' },
      { key: 'return_completed', sub: true, label: '반품 완료', to: '/b2c/returns/completed', business: 'B' },
      { key: 'return_rejected', sub: true, label: '반품 반려', to: '/b2c/returns/rejected', business: 'B' },
      { key: 'return_history', sub: true, label: '반품 이력', to: '/b2c/returns/history', business: 'B' },

      { key: 'exchange_mgmt', icon: Package, label: '교환 관리', to: '/b2c/exchanges/requests', business: 'B' },
      { key: 'exchange_requests', sub: true, label: '교환 요청', to: '/b2c/exchanges/requests', business: 'B' },
      { key: 'exchange_approval', sub: true, label: '교환 승인', to: '/b2c/exchanges/approval', business: 'B' },
      { key: 'exchange_collecting', sub: true, label: '상품 회수', to: '/b2c/exchanges/collecting', business: 'B' },
      { key: 'exchange_collected', sub: true, label: '회수 완료', to: '/b2c/exchanges/collected', business: 'B' },
      { key: 'exchange_preparing', sub: true, label: '교환 상품 준비', to: '/b2c/exchanges/preparing', business: 'B' },
      { key: 'exchange_reship', sub: true, label: '재출고', to: '/b2c/exchanges/reship', business: 'B' },
      { key: 'exchange_completed', sub: true, label: '교환 완료', to: '/b2c/exchanges/completed', business: 'B' },
      { key: 'exchange_rejected', sub: true, label: '교환 반려', to: '/b2c/exchanges/rejected', business: 'B' },
      { key: 'exchange_history', sub: true, label: '교환 이력', to: '/b2c/exchanges/history', business: 'B' },

      { key: 'promotions', icon: Percent, label: '프로모션 관리', to: '/promotions', business: 'B' },
      { key: 'promotions_list', sub: true, label: '프로모션 목록', to: '/promotions', business: 'B' },
      { key: 'promotions_period', sub: true, label: '기간 할인', to: '/b2c/promotions/period', business: 'B' },
      { key: 'promotions_product', sub: true, label: '상품 할인', to: '/b2c/promotions/product', business: 'B' },
      { key: 'promotions_category', sub: true, label: '카테고리 할인', to: '/b2c/promotions/category', business: 'B' },
      { key: 'promotions_cart', sub: true, label: '장바구니 할인', to: '/b2c/promotions/cart', business: 'B' },
      { key: 'promotions_member', sub: true, label: '회원 할인', to: '/b2c/promotions/member', business: 'B' },
      { key: 'promotions_targets', sub: true, label: '프로모션 대상 관리', to: '/b2c/promotions/targets', business: 'B' },
      { key: 'promotions_history', sub: true, label: '프로모션 적용 이력', to: '/promotions/history', business: 'B' },

      { key: 'coupons', icon: Ticket, label: '쿠폰 관리', to: '/coupons', business: 'B' },
      { key: 'coupons_list', sub: true, label: '쿠폰 목록', to: '/coupons', business: 'B' },
      { key: 'coupons_create', sub: true, label: '쿠폰 등록', to: '/b2c/coupons/create', business: 'B' },
      { key: 'coupons_issue', sub: true, label: '쿠폰 발급', to: '/coupons/issue', business: 'B' },
      { key: 'coupons_auto', sub: true, label: '자동 발급', to: '/b2c/coupons/automatic', business: 'B' },
      { key: 'coupons_usage', sub: true, label: '쿠폰 사용 내역', to: '/coupons/usage', business: 'B' },
      { key: 'coupons_expired', sub: true, label: '만료 쿠폰', to: '/b2c/coupons/expired', business: 'B' },
      { key: 'coupons_policy', sub: true, label: '쿠폰 정책', to: '/coupons/policy', business: 'B' },

      { key: 'points', icon: Coins, label: '포인트 / 적립금 관리', to: '/points', business: 'B' },
      { key: 'points_status', sub: true, label: '보유 현황', to: '/points', business: 'B' },
      { key: 'points_granted', sub: true, label: '지급 내역', to: '/b2c/points/granted', business: 'B' },
      { key: 'points_used', sub: true, label: '사용 내역', to: '/b2c/points/used', business: 'B' },
      { key: 'points_deducted', sub: true, label: '차감 내역', to: '/b2c/points/deducted', business: 'B' },
      { key: 'points_expired', sub: true, label: '소멸 내역', to: '/b2c/points/expired', business: 'B' },
      { key: 'points_expiring', sub: true, label: '소멸 예정', to: '/b2c/points/expiring', business: 'B' },
      { key: 'points_manual', sub: true, label: '수동 지급', to: '/b2c/points/manual', business: 'B' },
      { key: 'points_history', sub: true, label: '전체 포인트 내역', to: '/points/history', business: 'B' },
      { key: 'points_policy', sub: true, label: '적립 정책', to: '/points/policy', business: 'B' },

      { key: 'brands', icon: Award, label: '브랜드 관리', to: '/brands', business: 'B' },
      { key: 'brands_list', sub: true, label: '브랜드 목록', to: '/brands', business: 'B' },
      { key: 'brands_create', sub: true, label: '브랜드 등록', to: '/b2c/brands/create', business: 'B' },
      { key: 'brands_detail', sub: true, label: '브랜드 상세', to: '/b2c/brands/detail', business: 'B' },
      { key: 'brands_products', sub: true, label: '브랜드별 상품', to: '/b2c/brands/products', business: 'B' },
      { key: 'brands_exposure', sub: true, label: '브랜드 노출 관리', to: '/b2c/brands/exposure', business: 'B' },

      { key: 'reviews', icon: Star, label: '리뷰 관리', to: '/reviews', business: 'B' },
      { key: 'reviews_list', sub: true, label: '리뷰 목록', to: '/reviews', business: 'B' },
      { key: 'reviews_detail', sub: true, label: '리뷰 상세', to: '/b2c/reviews/detail', business: 'B' },
      { key: 'reviews_reported', sub: true, label: '신고 리뷰', to: '/b2c/reviews/reported', business: 'B' },
      { key: 'reviews_hidden', sub: true, label: '숨김 리뷰', to: '/b2c/reviews/hidden', business: 'B' },
      { key: 'reviews_replies', sub: true, label: '리뷰 답변', to: '/b2c/reviews/replies', business: 'B' },
      { key: 'reviews_sanctions', sub: true, label: '리뷰 제재', to: '/b2c/reviews/sanctions', business: 'B' },
      { key: 'reviews_stats', sub: true, label: '리뷰 통계', to: '/b2c/reviews/stats', business: 'B' },

      { key: 'cart_conversion', icon: ShoppingBag, label: '장바구니 / 구매 전환', to: '/cart-conversion', business: 'B' },

      { key: 'c2c_sales', icon: Award, label: '판매 활동 관리', to: '/c2c/sales/sellers', business: 'C' },
      { key: 'c2c_sales_sellers', sub: true, label: '판매자 목록', to: '/c2c/sales/sellers', business: 'C' },
      { key: 'c2c_sales_status', sub: true, label: '판매 상태', to: '/c2c/sales/status', business: 'C' },
      { key: 'c2c_sales_trades', sub: true, label: '판매 거래', to: '/c2c/sales/trades', business: 'C' },
      { key: 'c2c_sales_performance', sub: true, label: '판매 실적', to: '/c2c/sales/performance', business: 'C' },
      { key: 'c2c_sales_history', sub: true, label: '판매 활동 이력', to: '/c2c/sales/history', business: 'C' },

      { key: 'c2c_purchases', icon: ShoppingCart, label: '구매 활동 관리', to: '/c2c/purchases/history', business: 'C' },
      { key: 'c2c_purchases_history', sub: true, label: '구매 내역', to: '/c2c/purchases/history', business: 'C' },
      { key: 'c2c_purchases_cancel', sub: true, label: '구매 취소', to: '/c2c/purchases/cancel', business: 'C' },
      { key: 'c2c_purchases_activity', sub: true, label: '구매 활동 이력', to: '/c2c/purchases/activity', business: 'C' },

      { key: 'c2c_products', icon: Package, label: '사용자 상품 관리', to: '/c2c/products/list', business: 'C' },
      { key: 'c2c_products_list', sub: true, label: '사용자 상품 목록', to: '/c2c/products/list', business: 'C' },
      { key: 'c2c_products_review', sub: true, label: '등록 / 검수 관리', to: '/c2c/products/review', business: 'C' },
      { key: 'c2c_products_moderation', sub: true, label: '노출 / 운영 조치', to: '/c2c/products/moderation', business: 'C' },
      { key: 'c2c_products_history', sub: true, label: '처리 이력', to: '/c2c/products/history', business: 'C' },

      { key: 'c2c_restricted_products', icon: ShieldCheck, label: '상품 정책 / 탐지', to: '/c2c/product-policy/policies', business: 'C' },
      { key: 'c2c_product_policies', sub: true, label: '상품 정책', to: '/c2c/product-policy/policies', business: 'C' },
      { key: 'c2c_detection_rules', sub: true, label: '자동 탐지 규칙', to: '/c2c/product-policy/detection-rules', business: 'C' },
      { key: 'c2c_detection_history', sub: true, label: '탐지 이력', to: '/c2c/product-policy/detection-history', business: 'C' },

      { key: 'c2c_reports', icon: FileText, label: '신고 관리', to: '/c2c/reports/processing', business: 'C' },
      { key: 'c2c_reports_processing', sub: true, label: '신고 처리', to: '/c2c/reports/processing', business: 'C' },
      { key: 'c2c_reports_history', sub: true, label: '신고 처리 이력', to: '/c2c/reports/history', business: 'C' },

      { key: 'c2c_disputes', icon: Scale, label: '분쟁 관리', to: '/c2c/disputes/processing', business: 'C' },
      { key: 'c2c_disputes_processing', sub: true, label: '분쟁 처리', to: '/c2c/disputes/processing', business: 'C' },
      { key: 'c2c_disputes_history', sub: true, label: '분쟁 처리 이력', to: '/c2c/disputes/history', business: 'C' },

      { key: 'c2c_sanctions', icon: ShieldCheck, label: '제재 관리', to: '/c2c/sanctions/processing', business: 'C' },
      { key: 'c2c_sanctions_processing', sub: true, label: '제재 처리', to: '/c2c/sanctions/processing', business: 'C' },
      { key: 'c2c_sanctions_policy', sub: true, label: '제재 정책', to: '/c2c/sanctions/policies', business: 'C' },
      { key: 'c2c_sanctions_history', sub: true, label: '제재 처리 이력', to: '/c2c/sanctions/history', business: 'C' },

      { key: 'c2c_safety', icon: ShieldCheck, label: '거래 안전 관리', to: '/c2c/safety/monitoring', business: 'C' },
      { key: 'c2c_safety_monitoring', sub: true, label: '위험 모니터링', to: '/c2c/safety/monitoring', business: 'C' },
      { key: 'c2c_safety_holds', sub: true, label: '거래 보류 관리', to: '/c2c/safety/holds', business: 'C' },

      { key: 'c2c_proceeds', icon: Wallet, label: '판매대금 / 정산 관리', to: '/c2c/proceeds/overview', business: 'C' },
      { key: 'c2c_proceeds_overview', sub: true, label: '판매대금 현황', to: '/c2c/proceeds/overview', business: 'C' },
      { key: 'c2c_proceeds_settlements', sub: true, label: 'C2C 정산 관리', to: '/c2c/proceeds/settlements', business: 'C' },
      { key: 'c2c_proceeds_withdrawals', sub: true, label: '출금 관리', to: '/c2c/proceeds/withdrawals', business: 'C' },
      { key: 'c2c_proceeds_ledger', sub: true, label: '판매대금 원장', to: '/c2c/proceeds/ledger', business: 'C' },

      { key: 'c2c_chat', icon: BellRing, label: '거래 채팅 관리', to: '/c2c/chat/list', business: 'C' },
      { key: 'c2c_chat_list', sub: true, label: '채팅 조회', to: '/c2c/chat/list', business: 'C' },
      { key: 'c2c_chat_policies', sub: true, label: '메시지 정책', to: '/c2c/chat/policies', business: 'C' },
      { key: 'c2c_chat_audit', sub: true, label: '운영 조회 이력', to: '/c2c/chat/audit', business: 'C' },

      { key: 'c2c_verification', icon: Users, label: '본인 인증 관리', to: '/c2c/verification/review', business: 'C' },
      { key: 'c2c_verification_review', sub: true, label: '인증 심사', to: '/c2c/verification/review', business: 'C' },
      { key: 'c2c_verification_policies', sub: true, label: '인증 정책', to: '/c2c/verification/policies', business: 'C' },
      { key: 'c2c_verification_history', sub: true, label: '인증 처리 이력', to: '/c2c/verification/history', business: 'C' },

      { key: 'ops', icon: Megaphone, label: '운영 관리', to: '/ops/notices' },
      { key: 'ops_notices', sub: true, label: '공지사항', to: '/ops/notices' },
      { key: 'ops_faq', sub: true, label: 'FAQ', to: '/ops/faq' },
      { key: 'ops_banners', sub: true, label: '배너', to: '/ops/banners' },
      { key: 'ops_popups', sub: true, label: '팝업', to: '/ops/popups' },
      { key: 'ops_events', sub: true, label: '이벤트', to: '/ops/events' },
      { key: 'ops_terms', sub: true, label: '약관 관리', to: '/ops/terms' },
      { key: 'ops_policies', sub: true, label: '정책 관리', to: '/ops/policies' },

      { key: 'notifications', icon: BellRing, label: '알림 / 메시지 관리', to: '/notifications/dispatch' },
      { key: 'notifications_dispatch', sub: true, label: '발송 관리', to: '/notifications/dispatch' },
      { key: 'notifications_templates', sub: true, label: '템플릿 관리', to: '/notifications/templates' },

      { key: 'cs', icon: Headset, label: '고객센터', badge: '28', to: '/cs/inquiries' },
      { key: 'cs_inquiries', sub: true, label: '1:1 문의', to: '/cs/inquiries' },
      { key: 'cs_product_inquiry', sub: true, label: '상품 문의 관리', to: '/cs/product-inquiries', business: 'B' },
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
      { key: 'policy_settlement', sub: true, label: '정산 정책', to: '/policy/settlement', business: 'B2B' },
      { key: 'policy_fee', sub: true, label: '수수료 정책', to: '/policy/fee' },

      { key: 'delivery_policy', icon: Receipt, label: '배송 정책', to: '/delivery-policy/base-fee', business: 'B' },
      { key: 'delivery_policy_base', sub: true, label: '기본 배송비', to: '/delivery-policy/base-fee', business: 'B' },
      { key: 'delivery_policy_free', sub: true, label: '무료배송 조건', to: '/delivery-policy/free-shipping', business: 'B' },
      { key: 'delivery_policy_region', sub: true, label: '지역별 추가 배송비', to: '/delivery-policy/region-fee', business: 'B' },
      { key: 'delivery_policy_product', sub: true, label: '상품별 배송 정책', to: '/delivery-policy/product', business: 'B' },
      { key: 'delivery_policy_bundle', sub: true, label: '묶음 배송', to: '/delivery-policy/bundle', business: 'B' },
      { key: 'delivery_policy_remote', sub: true, label: '제주 / 도서산간 정책', to: '/delivery-policy/remote-area', business: 'B' },
      { key: 'delivery_policy_return', sub: true, label: '반품 / 교환 배송비', to: '/delivery-policy/return-exchange', business: 'B' },
    ],
  },
  {
    label: '분석 · 시스템',
    items: [
      { key: 'stats', icon: BarChart3, label: '통계', to: '/stats/overview' },
      { key: 'stats_overview', sub: true, label: '통합 통계', to: '/stats/overview' },
      { key: 'stats_sales', sub: true, label: '매출 분석', to: '/stats/sales' },
      { key: 'stats_inventory', sub: true, label: '재고 분석', to: '/stats/inventory' },
      { key: 'stats_delivery_claims', sub: true, label: '배송/클레임 분석', to: '/stats/delivery-claims', business: 'B' },
      { key: 'stats_promotions', sub: true, label: '프로모션 분석', to: '/stats/promotions', business: 'B' },
      { key: 'stats_customers', sub: true, label: '고객 구매 분석', to: '/stats/customers', business: 'B' },
      { key: 'c2c_stats_products', sub: true, label: '등록 상품 수', to: '/c2c/stats/products', business: 'C' },
      { key: 'c2c_stats_conversion', sub: true, label: '거래 성사율', to: '/c2c/stats/conversion', business: 'C' },
      { key: 'c2c_stats_sellers', sub: true, label: '판매자 활동', to: '/c2c/stats/sellers', business: 'C' },
      { key: 'c2c_stats_buyers', sub: true, label: '구매자 활동', to: '/c2c/stats/buyers', business: 'C' },
      { key: 'c2c_stats_reports', sub: true, label: '신고율', to: '/c2c/stats/reports', business: 'C' },
      { key: 'c2c_stats_disputes', sub: true, label: '분쟁률', to: '/c2c/stats/disputes', business: 'C' },
      { key: 'c2c_stats_cancels', sub: true, label: '거래 취소율', to: '/c2c/stats/cancels', business: 'C' },
      { key: 'c2c_stats_proceeds', sub: true, label: '판매대금 통계', to: '/c2c/stats/proceeds', business: 'C' },
      { key: 'admin', icon: ShieldCheck, label: '관리자', to: '/admin' },
      { key: 'admin_list', sub: true, label: '관리자 목록', to: '/admin' },
      { key: 'admin_roles', sub: true, label: '역할 및 권한 관리', to: '/admin/roles' },
      { key: 'admin_history', sub: true, label: '관리자 이력', to: '/admin/history' },
      { key: 'sys', icon: Settings, label: '시스템 관리', to: '/system/service' },
      { key: 'sys_service', sub: true, label: '서비스 설정', to: '/system/service' },
      { key: 'sys_codes', sub: true, label: '공통 코드', to: '/system/codes' },
      { key: 'sys_integration', sub: true, label: '외부 연동', to: '/system/integration' },
      { key: 'sys_jobs', sub: true, label: '작업 관리', to: '/system/jobs' },
      { key: 'log', icon: History, label: '로그 / 감사', to: '/logs/system' },
      { key: 'log_system', sub: true, label: '시스템 로그', to: '/logs/system' },
      { key: 'log_security', sub: true, label: '보안 로그', to: '/logs/security' },
    ],
  },
];

export const BREADCRUMB: Record<string, [string, string]> = {
  dash: ['일반', '대시보드'],
  components: ['일반', '컴포넌트'],
  members: ['서비스 관리 · 회원 관리', '회원 목록'],
  left: ['서비스 관리 · 회원 관리', '탈퇴 회원'],
  ban: ['서비스 관리 · 회원 관리', '제재 회원'],

  content_list: ['서비스 관리 · 콘텐츠 관리', '콘텐츠 목록'],
  content_categories: ['서비스 관리 · 콘텐츠 관리', '카테고리 관리'],
  content_tags: ['서비스 관리 · 콘텐츠 관리', '태그 관리'],
  content_exposure: ['서비스 관리 · 콘텐츠 관리', '노출 관리'],
  content_review: ['서비스 관리 · 콘텐츠 관리', '검수 관리'],

  settlement_list: ['서비스 관리 · 거래처 정산 관리', '정산 목록'],
  settlement_tx: ['서비스 관리 · 거래처 정산 관리', '정산 거래 내역'],
  settlement_adjust: ['서비스 관리 · 거래처 정산 관리', '조정 내역'],

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
  cs_product_inquiry: ['서비스 관리 · 고객센터', '상품 문의 관리'],
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
  ops_terms: ['서비스 관리 · 운영 관리', '약관 관리'],
  ops_policies: ['서비스 관리 · 운영 관리', '정책 관리'],

  notifications_dispatch: ['서비스 관리 · 알림 / 메시지 관리', '발송 관리'],
  notifications_templates: ['서비스 관리 · 알림 / 메시지 관리', '템플릿 관리'],

  payment_mgmt_list: ['서비스 관리 · 결제 운영', '결제 건 조회'],
  payment_mgmt_external: ['서비스 관리 · 결제 운영', 'PG / 외부 거래'],
  payment_mgmt_history: ['서비스 관리 · 결제 운영', '결제 처리 이력'],

  policy_order_status: ['서비스 관리 · 거래 정책', '주문 상태 설정'],
  policy_payment: ['서비스 관리 · 거래 정책', '결제 정책'],
  policy_cancel: ['서비스 관리 · 거래 정책', '취소 정책'],
  policy_refund: ['서비스 관리 · 거래 정책', '환불 정책'],
  policy_settlement: ['서비스 관리 · 거래 정책', '정산 정책'],
  policy_fee: ['서비스 관리 · 거래 정책', '수수료 정책'],

  stats_overview: ['분석 · 시스템 · 통계', '통합 통계'],
  stats_sales: ['분석 · 시스템 · 통계', '매출 분석'],
  stats_inventory: ['분석 · 시스템 · 통계', '재고 분석'],
  stats_delivery_claims: ['분석 · 시스템 · 통계', '배송/클레임 분석'],
  stats_promotions: ['분석 · 시스템 · 통계', '프로모션 분석'],
  stats_customers: ['분석 · 시스템 · 통계', '고객 구매 분석'],

  admin_list: ['분석 · 시스템 · 관리자', '관리자 목록'],
  admin_roles: ['분석 · 시스템 · 관리자', '역할 및 권한 관리'],
  admin_history: ['분석 · 시스템 · 관리자', '관리자 이력'],

  sys_service: ['분석 · 시스템 · 시스템 관리', '서비스 설정'],
  sys_codes: ['분석 · 시스템 · 시스템 관리', '공통 코드'],
  sys_integration: ['분석 · 시스템 · 시스템 관리', '외부 연동'],
  sys_jobs: ['분석 · 시스템 · 시스템 관리', '작업 관리'],

  log_system: ['분석 · 시스템 · 로그 / 감사', '시스템 로그'],
  log_security: ['분석 · 시스템 · 로그 / 감사', '보안 로그'],

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
  cart_conversion: ['서비스 관리', '장바구니 / 구매 전환'],
  points_policy: ['서비스 관리', '포인트 정책'],
};

export function breadcrumbForKey(key: string): [string, string] {
  if (BREADCRUMB[key]) return BREADCRUMB[key];
  for (const group of NAV_GROUPS) {
    let parent = '';
    for (const item of group.items) {
      if (item.divider) continue;
      if (!item.sub) parent = item.label;
      if (item.key === key) return item.sub ? [`${group.label} · ${parent}`, item.label] : [group.label, item.label];
    }
  }
  return BREADCRUMB.members;
}

export function activeKeyForPath(pathname: string): string {
  const exactSub = NAV_GROUPS.flatMap((group) => group.items).find((item) => item.sub && item.to === pathname);
  if (exactSub) return exactSub.key;
  if (pathname.startsWith('/dashboard')) return 'dash';
  if (pathname.startsWith('/components')) return 'components';
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
  if (pathname.startsWith('/ops/terms')) return 'ops_terms';
  if (pathname.startsWith('/ops/policies')) return 'ops_policies';
  if (pathname.startsWith('/ops/messages')) return 'notifications_dispatch';

  if (pathname.startsWith('/notifications/templates')) return 'notifications_templates';
  if (pathname.startsWith('/notifications/dispatch') || pathname.startsWith('/notifications/send') || pathname.startsWith('/notifications/scheduled') || pathname.startsWith('/notifications/history')) return 'notifications_dispatch';

  if (pathname.startsWith('/payment-mgmt/list')) return 'payment_mgmt_list';
  if (pathname.startsWith('/payment-mgmt/external')) return 'payment_mgmt_external';
  if (pathname.startsWith('/payment-mgmt/history')) return 'payment_mgmt_history';

  if (pathname.startsWith('/policy/order-status')) return 'policy_order_status';
  if (pathname.startsWith('/policy/payment')) return 'policy_payment';
  if (pathname.startsWith('/policy/cancellation')) return 'policy_cancel';
  if (pathname.startsWith('/policy/refund')) return 'policy_refund';
  if (pathname.startsWith('/policy/settlement')) return 'policy_settlement';
  if (pathname.startsWith('/policy/fee')) return 'policy_fee';

  if (pathname.startsWith('/stats/sales')) return 'stats_sales';
  if (pathname.startsWith('/stats/inventory')) return 'stats_inventory';
  if (pathname.startsWith('/stats/delivery-claims')) return 'stats_delivery_claims';
  if (pathname.startsWith('/stats/promotions')) return 'stats_promotions';
  if (pathname.startsWith('/stats/customers')) return 'stats_customers';
  if (pathname.startsWith('/stats/overview')) return 'stats_overview';

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
  if (pathname.startsWith('/cart-conversion')) return 'cart_conversion';

  if (pathname.startsWith('/admin/roles')) return 'admin_roles';
  if (pathname.startsWith('/admin/history')) return 'admin_history';
  if (pathname.startsWith('/admin')) return 'admin_list';

  if (pathname.startsWith('/system/service')) return 'sys_service';
  if (pathname.startsWith('/system/codes')) return 'sys_codes';
  if (pathname.startsWith('/system/integration')) return 'sys_integration';
  if (pathname.startsWith('/system/jobs')) return 'sys_jobs';

  if (pathname.startsWith('/logs/system')) return 'log_system';
  if (pathname.startsWith('/logs/security')) return 'log_security';

  return 'members_sub1';
}
