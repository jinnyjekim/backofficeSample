import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/shell/Shell';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MembersPage } from './pages/members/MembersPage';
import { RecordsPage } from './pages/records/RecordsPage';
import { ContentListPage } from './pages/content/ContentListPage';
import { CategoriesPage } from './pages/content/CategoriesPage';
import { TagsPage } from './pages/content/TagsPage';
import { ExposurePage } from './pages/content/ExposurePage';
import { ReviewPage } from './pages/content/ReviewPage';
import { CompaniesPage } from './pages/partners/CompaniesPage';
import { ContactsPage } from './pages/partners/ContactsPage';
import { TradeStatusPage } from './pages/partners/TradeStatusPage';
import { CreditTermsPage } from './pages/partners/CreditTermsPage';
import { ProductsListPage } from './pages/products/ProductsListPage';
import { SupplyPricePage } from './pages/products/SupplyPricePage';
import { PartnerPricingPage } from './pages/products/PartnerPricingPage';
import { MinOrderQtyPage } from './pages/products/MinOrderQtyPage';
import { QuoteRequestsPage } from './pages/quotes/QuoteRequestsPage';
import { QuotesPage } from './pages/quotes/QuotesPage';
import { QuoteApprovalPage } from './pages/quotes/QuoteApprovalPage';
import { QuoteHistoryPage } from './pages/quotes/QuoteHistoryPage';
import { PurchaseOrdersPage } from './pages/orders/PurchaseOrdersPage';
import { OrderApprovalPage } from './pages/orders/OrderApprovalPage';
import { OrderProcessingPage } from './pages/orders/OrderProcessingPage';
import { OrderCompletedPage } from './pages/orders/OrderCompletedPage';
import { RefundPage } from './pages/orders/RefundPage';
import { ContractsPage } from './pages/contracts/ContractsPage';
import { ContractPeriodPage } from './pages/contracts/ContractPeriodPage';
import { UnitPricePage } from './pages/contracts/UnitPricePage';
import { TradeTermsPage } from './pages/contracts/TradeTermsPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { ReceivablesPage } from './pages/payments/ReceivablesPage';
import { DepositConfirmPage } from './pages/payments/DepositConfirmPage';
import { TaxInvoicesPage } from './pages/payments/TaxInvoicesPage';
import { SettlementPage } from './pages/settlement/SettlementPage';
import { SettlementTransactionsPage } from './pages/settlement/SettlementTransactionsPage';
import { SettlementAdjustmentsPage } from './pages/settlement/SettlementAdjustmentsPage';
import { CsInquiriesPage } from './pages/cs/CsInquiriesPage';
import { InquiryTypesPage } from './pages/cs/InquiryTypesPage';
import { ConsultationsPage } from './pages/cs/ConsultationsPage';
import { ResponseTemplatesPage } from './pages/cs/ResponseTemplatesPage';
import { AdminMemosPage } from './pages/cs/AdminMemosPage';
import { CsHistoryPage } from './pages/cs/CsHistoryPage';
import { NoticesPage } from './pages/ops/NoticesPage';
import { FaqPage } from './pages/ops/FaqPage';
import { BannersPage } from './pages/ops/BannersPage';
import { PopupsPage } from './pages/ops/PopupsPage';
import { EventsPage } from './pages/ops/EventsPage';
import { PaymentListPage } from './pages/paymentmgmt/PaymentListPage';
import { ExternalTransactionPage } from './pages/paymentmgmt/ExternalTransactionPage';
import { PaymentAuditPage } from './pages/paymentmgmt/PaymentAuditPage';
import { ShippingBaseFeePage } from './pages/deliverypolicy/ShippingBaseFeePage';
import { RegionalShippingFeePage } from './pages/deliverypolicy/RegionalShippingFeePage';
import { FreeShippingConditionPage } from './pages/deliverypolicy/FreeShippingConditionPage';
import { ProductShippingPolicyPage } from './pages/deliverypolicy/ProductShippingPolicyPage';
import { BundleShippingPage } from './pages/deliverypolicy/BundleShippingPage';
import { JejuRemotePolicyPage } from './pages/deliverypolicy/JejuRemotePolicyPage';
import { ReturnExchangeFeePage } from './pages/deliverypolicy/ReturnExchangeFeePage';
import { OrderStatusPage } from './pages/policy/OrderStatusPage';
import { PaymentPolicyPage } from './pages/policy/PaymentPolicyPage';
import { CancelPolicyPage } from './pages/policy/CancelPolicyPage';
import { RefundPolicyPage } from './pages/policy/RefundPolicyPage';
import { SettlementPolicyPage } from './pages/policy/SettlementPolicyPage';
import { FeePolicyPage } from './pages/policy/FeePolicyPage';
import { IntegratedStatsPage } from './pages/stats/IntegratedStatsPage';
import { ModulePlaceholderPage } from './pages/common/ModulePlaceholderPage';
import { InventoryStatusPage } from './pages/inventory/InventoryStatusPage';
import { InboundManagementPage } from './pages/inventory/InboundManagementPage';
import { StockOutboundManagementPage } from './pages/inventory/StockOutboundManagementPage';
import { PromotionsListPage } from './pages/promotions/PromotionsListPage';
import { PromotionApplicationsPage } from './pages/promotions/PromotionApplicationsPage';
import { CouponsListPage } from './pages/coupons/CouponsListPage';
import { CouponIssuesPage } from './pages/coupons/CouponIssuesPage';
import { CouponUsagePage } from './pages/coupons/CouponUsagePage';
import { CouponPolicyPage } from './pages/coupons/CouponPolicyPage';
import { PointsBalancePage } from './pages/points/PointsBalancePage';
import { PointLedgerPage } from './pages/points/PointLedgerPage';
import { PointPolicyPage } from './pages/points/PointPolicyPage';
import { BrandsListPage } from './pages/brands/BrandsListPage';
import { ReviewsListPage } from './pages/reviews/ReviewsListPage';
import { AdminsListPage } from './pages/admin/AdminsListPage';
import { AdminRolesPage } from './pages/admin/AdminRolesPage';
import { DeliveryPrepPage } from './pages/delivery/DeliveryPrepPage';
import { OutboundWaitingPage } from './pages/delivery/OutboundWaitingPage';
import { OutboundCompletePage } from './pages/delivery/OutboundCompletePage';
import { InTransitPage } from './pages/delivery/InTransitPage';
import { DeliveryCompletePage } from './pages/delivery/DeliveryCompletePage';

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/members" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="members/left" element={<RecordsPage kind="left" />} />
        <Route path="members/ban" element={<RecordsPage kind="ban" />} />

        <Route path="content" element={<ContentListPage />} />
        <Route path="content/categories" element={<CategoriesPage />} />
        <Route path="content/tags" element={<TagsPage />} />
        <Route path="content/exposure" element={<ExposurePage />} />
        <Route path="content/review" element={<ReviewPage />} />

        <Route path="partners/companies" element={<CompaniesPage />} />
        <Route path="partners/contacts" element={<ContactsPage />} />
        <Route path="partners/trade-status" element={<TradeStatusPage />} />
        <Route path="partners/credit-terms" element={<CreditTermsPage />} />

        <Route path="products" element={<ProductsListPage />} />
        <Route path="products/supply-price" element={<SupplyPricePage />} />
        <Route path="products/partner-pricing" element={<PartnerPricingPage />} />
        <Route path="products/min-order-qty" element={<MinOrderQtyPage />} />

        <Route path="inventory/status" element={<InventoryStatusPage />} />
        <Route path="inventory/inbound" element={<InboundManagementPage />} />
        <Route path="inventory/outbound" element={<StockOutboundManagementPage />} />
        <Route path="inventory/adjust" element={<ModulePlaceholderPage title="재고 조정" subtitle="실사, 파손 등으로 인한 재고 수량 조정을 관리합니다." icon="⊟" />} />
        <Route path="inventory/history" element={<ModulePlaceholderPage title="재고 변동 이력" subtitle="입고·출고·조정에 따른 재고 변동 이력을 확인합니다." icon="⊟" />} />

        <Route path="quotes/requests" element={<QuoteRequestsPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="quotes/approval" element={<QuoteApprovalPage />} />
        <Route path="quotes/history" element={<QuoteHistoryPage />} />

        <Route path="orders/purchase" element={<PurchaseOrdersPage />} />
        <Route path="orders/approval" element={<OrderApprovalPage />} />
        <Route path="orders/processing" element={<OrderProcessingPage />} />
        <Route path="orders/completed" element={<OrderCompletedPage />} />
        <Route path="orders/cancel" element={<ModulePlaceholderPage title="취소 관리" subtitle="주문 취소 요청과 처리 상태를 관리합니다." icon="▧" />} />
        <Route path="orders/return" element={<ModulePlaceholderPage title="반품 관리" subtitle="반품 요청, 회수 및 검수 처리를 관리합니다." icon="▧" />} />
        <Route path="orders/exchange" element={<ModulePlaceholderPage title="교환 관리" subtitle="교환 요청, 회수 및 재출고 처리를 관리합니다." icon="▧" />} />
        <Route path="orders/refunds" element={<RefundPage />} />

        <Route path="contracts" element={<ContractsPage />} />
        <Route path="contracts/period" element={<ContractPeriodPage />} />
        <Route path="contracts/unit-price" element={<UnitPricePage />} />
        <Route path="contracts/trade-terms" element={<TradeTermsPage />} />

        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payments/receivables" element={<ReceivablesPage />} />
        <Route path="payments/deposit-confirm" element={<DepositConfirmPage />} />
        <Route path="payments/tax-invoices" element={<TaxInvoicesPage />} />

        <Route path="settlement" element={<SettlementPage />} />
        <Route path="settlement/transactions" element={<SettlementTransactionsPage />} />
        <Route path="settlement/adjustments" element={<SettlementAdjustmentsPage />} />

        <Route path="cs/inquiries" element={<CsInquiriesPage />} />
        <Route path="cs/product-inquiries" element={<ModulePlaceholderPage title="상품 문의" subtitle="상품에 대한 고객 문의와 답변을 관리합니다." icon="✉" />} />
        <Route path="cs/inquiry-types" element={<InquiryTypesPage />} />
        <Route path="cs/consultations" element={<ConsultationsPage />} />
        <Route path="cs/templates" element={<ResponseTemplatesPage />} />
        <Route path="cs/memos" element={<AdminMemosPage />} />
        <Route path="cs/history" element={<CsHistoryPage />} />

        <Route path="delivery-policy/base-fee" element={<ShippingBaseFeePage />} />
        <Route path="delivery-policy/free-shipping" element={<FreeShippingConditionPage />} />
        <Route path="delivery-policy/region-fee" element={<RegionalShippingFeePage />} />
        <Route path="delivery-policy/product" element={<ProductShippingPolicyPage />} />
        <Route path="delivery-policy/bundle" element={<BundleShippingPage />} />
        <Route path="delivery-policy/remote-area" element={<JejuRemotePolicyPage />} />
        <Route path="delivery-policy/return-exchange" element={<ReturnExchangeFeePage />} />

        <Route path="ops/notices" element={<NoticesPage />} />
        <Route path="ops/faq" element={<FaqPage />} />
        <Route path="ops/banners" element={<BannersPage />} />
        <Route path="ops/popups" element={<PopupsPage />} />
        <Route path="ops/events" element={<EventsPage />} />

        <Route path="payment-mgmt/list" element={<PaymentListPage />} />
        <Route path="payment-mgmt/external" element={<ExternalTransactionPage />} />
        <Route path="payment-mgmt/history" element={<PaymentAuditPage />} />

        <Route path="policy/order-status" element={<OrderStatusPage />} />
        <Route path="policy/payment" element={<PaymentPolicyPage />} />
        <Route path="policy/cancellation" element={<CancelPolicyPage />} />
        <Route path="policy/refund" element={<RefundPolicyPage />} />
        <Route path="policy/settlement" element={<SettlementPolicyPage />} />
        <Route path="policy/fee" element={<FeePolicyPage />} />

        <Route path="stats/overview" element={<IntegratedStatsPage />} />

        <Route path="delivery/prep" element={<DeliveryPrepPage />} />
        <Route path="delivery/outbound-waiting" element={<OutboundWaitingPage />} />
        <Route path="delivery/outbound-complete" element={<OutboundCompletePage />} />
        <Route path="delivery/in-transit" element={<InTransitPage />} />
        <Route path="delivery/complete" element={<DeliveryCompletePage />} />

        <Route path="promotions" element={<PromotionsListPage />} />
        <Route path="promotions/history" element={<PromotionApplicationsPage />} />

        <Route path="coupons" element={<CouponsListPage />} />
        <Route path="coupons/issue" element={<CouponIssuesPage />} />
        <Route path="coupons/usage" element={<CouponUsagePage />} />
        <Route path="coupons/policy" element={<CouponPolicyPage />} />

        <Route path="points" element={<PointsBalancePage />} />
        <Route path="points/history" element={<PointLedgerPage />} />
        <Route path="points/policy" element={<PointPolicyPage />} />

        <Route path="brands" element={<BrandsListPage />} />

        <Route path="reviews" element={<ReviewsListPage />} />

        <Route path="admin" element={<AdminsListPage />} />
        <Route path="admin/roles" element={<AdminRolesPage />} />
        <Route path="admin/history" element={<ModulePlaceholderPage title="관리자 이력" subtitle="관리자 계정의 활동 및 변경 이력을 확인합니다." icon="🕓" />} />

        <Route path="*" element={<Navigate to="/members" replace />} />
      </Route>
    </Routes>
  );
}
