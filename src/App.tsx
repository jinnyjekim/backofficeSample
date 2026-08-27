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
import { TermsManagementPage } from './pages/ops/TermsManagementPage';
import { PolicyManagementPage } from './pages/ops/PolicyManagementPage';
import { OperatingMessagesPage } from './pages/ops/OperatingMessagesPage';
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
import { BusinessModulePage } from './pages/common/BusinessModulePage';
import { NotificationDispatchPage } from './pages/notifications/NotificationDispatchPage';
import { InventoryStatusPage } from './pages/inventory/InventoryStatusPage';
import { InboundManagementPage } from './pages/inventory/InboundManagementPage';
import { StockOutboundManagementPage } from './pages/inventory/StockOutboundManagementPage';
import { InventoryAdjustmentPage } from './pages/inventory/InventoryAdjustmentPage';
import { StockMovementHistoryPage } from './pages/inventory/StockMovementHistoryPage';
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
import { AdminHistoryPage } from './pages/admin/AdminHistoryPage';
import { ProductInquiriesListPage } from './pages/cs/ProductInquiriesListPage';
import { ProductInquiryDetailPage } from './pages/cs/ProductInquiryDetailPage';
import { CartConversionPage } from './pages/cartconversion/CartConversionPage';
import { SystemLogPage } from './pages/logs/SystemLogPage';
import { SecurityLogPage } from './pages/logs/SecurityLogPage';
import { DeliveryPrepPage } from './pages/delivery/DeliveryPrepPage';
import { OutboundWaitingPage } from './pages/delivery/OutboundWaitingPage';
import { OutboundCompletePage } from './pages/delivery/OutboundCompletePage';
import { InTransitPage } from './pages/delivery/InTransitPage';
import { DeliveryCompletePage } from './pages/delivery/DeliveryCompletePage';
import { SellerListPage } from './pages/c2c/sales/SellerListPage';
import { SalesStatusPage } from './pages/c2c/sales/SalesStatusPage';
import { SellerProductsPage as UserProductListPage } from './pages/c2c/sales/SellerProductsPage';
import { SalesTradesPage } from './pages/c2c/sales/SalesTradesPage';
import { SalesPerformancePage } from './pages/c2c/sales/SalesPerformancePage';
import { SalesActivityHistoryPage } from './pages/c2c/sales/SalesActivityHistoryPage';
import { PurchaseHistoryPage } from './pages/c2c/purchases/PurchaseHistoryPage';
import { PurchaseCancelPage } from './pages/c2c/purchases/PurchaseCancelPage';
import { PurchaseDisputesPage } from './pages/c2c/purchases/PurchaseDisputesPage';
import { DisputeHistoryPage } from './pages/c2c/purchases/DisputeHistoryPage';
import { PurchaseActivityHistoryPage } from './pages/c2c/purchases/PurchaseActivityHistoryPage';
import { UserProductHistoryPage, UserProductModerationPage, UserProductReviewPage } from './pages/c2c/products/UserProductWorkflowPages';
import { TradeHoldManagementPage, TradeRiskMonitoringPage } from './pages/c2c/safety/TradeSafetyPages';
import { C2CSettlementManagementPage, ProceedsLedgerPage, ProceedsOverviewPage, WithdrawalManagementPage } from './pages/c2c/proceeds/ProceedsPages';
import { ReportHistoryPage, ReportProcessingPage } from './pages/c2c/reports/ReportManagementPages';
import { SanctionHistoryPage, SanctionPolicyPage, SanctionProcessingPage } from './pages/c2c/sanctions/SanctionManagementPages';
import { ChatAccessHistoryPage, ChatListPage, MessagePolicyPage } from './pages/c2c/chat/ChatManagementPages';
import { VerificationHistoryPage, VerificationPolicyPage, VerificationReviewPage } from './pages/c2c/verification/VerificationManagementPages';
import { DetectionHistoryPage, DetectionRulePage, ProductPolicyPage } from './pages/c2c/productPolicy/ProductPolicyManagementPages';

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/members" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="b2c/product-inquiries/list" element={<Navigate to="/cs/product-inquiries" replace />} />
        <Route path="b2c/product-inquiries/waiting" element={<Navigate to="/cs/product-inquiries?status=waiting" replace />} />
        <Route path="b2c/product-inquiries/answered" element={<Navigate to="/cs/product-inquiries?status=answered" replace />} />
        <Route path="b2c/product-inquiries/detail" element={<Navigate to="/cs/product-inquiries" replace />} />
        <Route path="b2c/product-inquiries/history" element={<Navigate to="/cs/product-inquiries" replace />} />
        <Route path="b2c/product-inquiries/:id" element={<Navigate to="/cs/product-inquiries" replace />} />
        <Route path="b2c/*" element={<BusinessModulePage />} />
        <Route path="c2c/sales/sellers" element={<SellerListPage />} />
        <Route path="c2c/sales/status" element={<SalesStatusPage />} />
        <Route path="c2c/sales/products" element={<Navigate to="/c2c/products/list" replace />} />
        <Route path="c2c/sales/trades" element={<SalesTradesPage />} />
        <Route path="c2c/sales/performance" element={<SalesPerformancePage />} />
        <Route path="c2c/sales/restrictions" element={<Navigate to="/c2c/sanctions/processing?type=sales" replace />} />
        <Route path="c2c/sales/history" element={<SalesActivityHistoryPage />} />
        <Route path="c2c/purchases/history" element={<PurchaseHistoryPage />} />
        <Route path="c2c/purchases/cancel" element={<PurchaseCancelPage />} />
        <Route path="c2c/purchases/disputes" element={<Navigate to="/c2c/disputes/processing" replace />} />
        <Route path="c2c/purchases/activity" element={<PurchaseActivityHistoryPage />} />
        <Route path="c2c/products/list" element={<UserProductListPage />} />
        <Route path="c2c/products/review" element={<UserProductReviewPage />} />
        <Route path="c2c/products/moderation" element={<UserProductModerationPage />} />
        <Route path="c2c/products/history" element={<UserProductHistoryPage />} />
        <Route path="c2c/products/registered" element={<Navigate to="/c2c/products/list" replace />} />
        <Route path="c2c/products/pending" element={<Navigate to="/c2c/products/review" replace />} />
        <Route path="c2c/products/approved" element={<Navigate to="/c2c/products/list" replace />} />
        <Route path="c2c/products/rejected" element={<Navigate to="/c2c/products/review" replace />} />
        <Route path="c2c/products/sold" element={<Navigate to="/c2c/products/list" replace />} />
        <Route path="c2c/products/hidden" element={<Navigate to="/c2c/products/moderation" replace />} />
        <Route path="c2c/products/deleted" element={<Navigate to="/c2c/products/moderation" replace />} />
        <Route path="c2c/restricted-products/prohibited" element={<Navigate to="/c2c/product-policy/policies?level=prohibited" replace />} />
        <Route path="c2c/restricted-products/limited" element={<Navigate to="/c2c/product-policy/policies?level=limited" replace />} />
        <Route path="c2c/restricted-products/reported" element={<Navigate to="/c2c/reports/products" replace />} />
        <Route path="c2c/restricted-products/detected" element={<Navigate to="/c2c/products/moderation" replace />} />
        <Route path="c2c/restricted-products/history" element={<Navigate to="/c2c/product-policy/detection-history" replace />} />
        <Route path="c2c/product-policy/policies" element={<ProductPolicyPage />} />
        <Route path="c2c/product-policy/detection-rules" element={<DetectionRulePage />} />
        <Route path="c2c/product-policy/detection-history" element={<DetectionHistoryPage />} />
        <Route path="c2c/product-policy/prohibited" element={<Navigate to="/c2c/product-policy/policies?level=prohibited" replace />} />
        <Route path="c2c/product-policy/limited" element={<Navigate to="/c2c/product-policy/policies?level=limited" replace />} />
        <Route path="c2c/safety/monitoring" element={<TradeRiskMonitoringPage />} />
        <Route path="c2c/safety/holds" element={<TradeHoldManagementPage />} />
        <Route path="c2c/safety/anomalies" element={<Navigate to="/c2c/safety/monitoring" replace />} />
        <Route path="c2c/safety/cancels" element={<Navigate to="/c2c/safety/monitoring?signal=cancels" replace />} />
        <Route path="c2c/safety/reports" element={<Navigate to="/c2c/safety/monitoring?signal=reports" replace />} />
        <Route path="c2c/safety/abnormal" element={<Navigate to="/c2c/safety/monitoring?signal=abnormal" replace />} />
        <Route path="c2c/safety/accounts" element={<Navigate to="/c2c/safety/monitoring?signal=accounts" replace />} />
        <Route path="c2c/proceeds/overview" element={<ProceedsOverviewPage />} />
        <Route path="c2c/proceeds/settlements" element={<C2CSettlementManagementPage />} />
        <Route path="c2c/proceeds/withdrawals" element={<WithdrawalManagementPage />} />
        <Route path="c2c/proceeds/ledger" element={<ProceedsLedgerPage />} />
        <Route path="c2c/proceeds/status" element={<Navigate to="/c2c/proceeds/overview" replace />} />
        <Route path="c2c/proceeds/scheduled" element={<Navigate to="/c2c/proceeds/overview?balance=scheduled" replace />} />
        <Route path="c2c/proceeds/available" element={<Navigate to="/c2c/proceeds/overview?balance=available" replace />} />
        <Route path="c2c/proceeds/requests" element={<Navigate to="/c2c/proceeds/withdrawals?status=requested" replace />} />
        <Route path="c2c/proceeds/completed" element={<Navigate to="/c2c/proceeds/withdrawals?status=completed" replace />} />
        <Route path="c2c/proceeds/holds" element={<Navigate to="/c2c/proceeds/overview?balance=held" replace />} />
        <Route path="c2c/proceeds/history" element={<Navigate to="/c2c/proceeds/ledger" replace />} />
        <Route path="c2c/settlement/sellers" element={<Navigate to="/c2c/proceeds/settlements" replace />} />
        <Route path="c2c/settlement/trades" element={<Navigate to="/c2c/proceeds/settlements" replace />} />
        <Route path="c2c/settlement/fees" element={<Navigate to="/c2c/proceeds/settlements" replace />} />
        <Route path="c2c/settlement/holds" element={<Navigate to="/c2c/proceeds/settlements?status=held" replace />} />
        <Route path="c2c/settlement/confirmed" element={<Navigate to="/c2c/proceeds/settlements?status=confirmed" replace />} />
        <Route path="c2c/settlement/history" element={<Navigate to="/c2c/proceeds/ledger?type=settlement" replace />} />
        <Route path="c2c/reports/processing" element={<ReportProcessingPage />} />
        <Route path="c2c/reports/history" element={<ReportHistoryPage />} />
        <Route path="c2c/disputes/processing" element={<PurchaseDisputesPage />} />
        <Route path="c2c/disputes/history" element={<DisputeHistoryPage />} />
        <Route path="c2c/disputes/received" element={<Navigate to="/c2c/disputes/processing?status=received" replace />} />
        <Route path="c2c/disputes/review" element={<Navigate to="/c2c/disputes/processing?status=review" replace />} />
        <Route path="c2c/disputes/buyer" element={<Navigate to="/c2c/disputes/processing" replace />} />
        <Route path="c2c/disputes/seller" element={<Navigate to="/c2c/disputes/processing" replace />} />
        <Route path="c2c/disputes/evidence" element={<Navigate to="/c2c/disputes/processing?status=evidence" replace />} />
        <Route path="c2c/disputes/decision" element={<Navigate to="/c2c/disputes/processing?status=decision" replace />} />
        <Route path="c2c/disputes/completed" element={<Navigate to="/c2c/disputes/processing?status=completed" replace />} />
        <Route path="c2c/sanctions/processing" element={<SanctionProcessingPage />} />
        <Route path="c2c/sanctions/policies" element={<SanctionPolicyPage />} />
        <Route path="c2c/sanctions/history" element={<SanctionHistoryPage />} />
        <Route path="c2c/sanctions/warnings" element={<Navigate to="/c2c/sanctions/processing?type=warning" replace />} />
        <Route path="c2c/sanctions/products" element={<Navigate to="/c2c/sanctions/processing?type=products" replace />} />
        <Route path="c2c/sanctions/sales" element={<Navigate to="/c2c/sanctions/processing?type=sales" replace />} />
        <Route path="c2c/sanctions/purchases" element={<Navigate to="/c2c/sanctions/processing?type=purchases" replace />} />
        <Route path="c2c/sanctions/chat" element={<Navigate to="/c2c/sanctions/processing?type=chat" replace />} />
        <Route path="c2c/sanctions/temporary" element={<Navigate to="/c2c/sanctions/processing?term=temporary" replace />} />
        <Route path="c2c/sanctions/permanent" element={<Navigate to="/c2c/sanctions/processing?type=account&term=permanent" replace />} />
        <Route path="c2c/chat/list" element={<ChatListPage />} />
        <Route path="c2c/chat/policies" element={<MessagePolicyPage />} />
        <Route path="c2c/chat/audit" element={<ChatAccessHistoryPage />} />
        <Route path="c2c/chat/restricted" element={<Navigate to="/c2c/chat/policies" replace />} />
        <Route path="c2c/verification/review" element={<VerificationReviewPage />} />
        <Route path="c2c/verification/policies" element={<VerificationPolicyPage />} />
        <Route path="c2c/verification/history" element={<VerificationHistoryPage />} />
        <Route path="c2c/verification/status" element={<Navigate to="/c2c/verification/review" replace />} />
        <Route path="c2c/verification/failed" element={<Navigate to="/c2c/verification/review?status=failed" replace />} />
        <Route path="c2c/verification/retry" element={<Navigate to="/c2c/verification/review?purpose=reverification" replace />} />
        <Route path="c2c/verification/sellers" element={<Navigate to="/c2c/verification/review?purpose=seller" replace />} />
        <Route path="c2c/reports/members" element={<Navigate to="/c2c/reports/processing?target=members" replace />} />
        <Route path="c2c/reports/products" element={<Navigate to="/c2c/reports/processing?target=products" replace />} />
        <Route path="c2c/reports/trades" element={<Navigate to="/c2c/reports/processing?target=trades" replace />} />
        <Route path="c2c/reports/messages" element={<Navigate to="/c2c/reports/processing?target=messages" replace />} />
        <Route path="c2c/reports/reviews" element={<Navigate to="/c2c/reports/processing?target=reviews" replace />} />
        <Route path="c2c/reports/pending" element={<Navigate to="/c2c/reports/processing?status=pending" replace />} />
        <Route path="c2c/reports/completed" element={<Navigate to="/c2c/reports/processing?status=completed" replace />} />
        <Route path="c2c/chat/reported" element={<Navigate to="/c2c/reports/processing?target=messages" replace />} />
        <Route path="c2c/*" element={<BusinessModulePage />} />
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
        <Route path="inventory/adjust" element={<InventoryAdjustmentPage />} />
        <Route path="inventory/history" element={<StockMovementHistoryPage />} />

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
        <Route path="cs/product-inquiries" element={<ProductInquiriesListPage />} />
        <Route path="cs/product-inquiries/:id" element={<ProductInquiryDetailPage />} />
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

        <Route path="notifications/dispatch" element={<NotificationDispatchPage />} />
        <Route path="notifications/templates" element={<ModulePlaceholderPage title="템플릿 관리" subtitle="앱 내, Push, 이메일과 SMS 발송에 사용할 메시지 템플릿을 관리합니다." icon="▤" />} />
        <Route path="notifications/send" element={<Navigate to="/notifications/dispatch" replace />} />
        <Route path="notifications/scheduled" element={<Navigate to="/notifications/dispatch" replace />} />
        <Route path="notifications/history" element={<Navigate to="/notifications/dispatch" replace />} />
        <Route path="notifications/templates/messages" element={<Navigate to="/notifications/templates" replace />} />
        <Route path="notifications/templates/email" element={<Navigate to="/notifications/templates" replace />} />
        <Route path="notifications/templates/sms" element={<Navigate to="/notifications/templates" replace />} />
        <Route path="notifications/templates/push" element={<Navigate to="/notifications/templates" replace />} />
        <Route path="ops/terms" element={<TermsManagementPage />} />
        <Route path="ops/policies" element={<PolicyManagementPage />} />
        <Route path="ops/messages" element={<OperatingMessagesPage />} />

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
        <Route path="stats/*" element={<BusinessModulePage />} />

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

        <Route path="cart-conversion" element={<CartConversionPage />} />

        <Route path="admin" element={<AdminsListPage />} />
        <Route path="admin/roles" element={<AdminRolesPage />} />
        <Route path="admin/history" element={<AdminHistoryPage />} />

        <Route path="system/service" element={<ModulePlaceholderPage title="서비스 설정" subtitle="서비스 운영에 필요한 기본 설정을 관리합니다." icon="⚙" />} />
        <Route path="system/codes" element={<ModulePlaceholderPage title="공통 코드" subtitle="시스템 전반에서 사용하는 공통 코드를 관리합니다." icon="🏷" />} />
        <Route path="system/integration" element={<ModulePlaceholderPage title="외부 연동" subtitle="외부 시스템 및 API 연동 설정을 관리합니다." icon="🔗" />} />
        <Route path="system/jobs" element={<ModulePlaceholderPage title="작업 관리" subtitle="배치 작업 및 스케줄러를 관리합니다." icon="🗂" />} />

        <Route path="logs/system" element={<SystemLogPage />} />
        <Route path="logs/security" element={<SecurityLogPage />} />

        <Route path="*" element={<Navigate to="/members" replace />} />
      </Route>
    </Routes>
  );
}
