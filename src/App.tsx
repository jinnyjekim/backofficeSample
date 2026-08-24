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
import { PolicyPlaceholderPage } from './pages/policy/PolicyPlaceholderPage';
import { OrderStatusPage } from './pages/policy/OrderStatusPage';
import { PaymentPolicyPage } from './pages/policy/PaymentPolicyPage';
import { CancelPolicyPage } from './pages/policy/CancelPolicyPage';
import { RefundPolicyPage } from './pages/policy/RefundPolicyPage';
import { StatsPlaceholderPage } from './pages/stats/StatsPlaceholderPage';
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

        <Route path="quotes/requests" element={<QuoteRequestsPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="quotes/approval" element={<QuoteApprovalPage />} />
        <Route path="quotes/history" element={<QuoteHistoryPage />} />

        <Route path="orders/purchase" element={<PurchaseOrdersPage />} />
        <Route path="orders/approval" element={<OrderApprovalPage />} />
        <Route path="orders/processing" element={<OrderProcessingPage />} />
        <Route path="orders/completed" element={<OrderCompletedPage />} />

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
        <Route path="cs/inquiry-types" element={<InquiryTypesPage />} />
        <Route path="cs/consultations" element={<ConsultationsPage />} />
        <Route path="cs/templates" element={<ResponseTemplatesPage />} />
        <Route path="cs/memos" element={<AdminMemosPage />} />
        <Route path="cs/history" element={<CsHistoryPage />} />

        <Route path="ops/notices" element={<NoticesPage />} />
        <Route path="ops/faq" element={<FaqPage />} />
        <Route path="ops/banners" element={<BannersPage />} />
        <Route path="ops/popups" element={<PopupsPage />} />
        <Route path="ops/events" element={<EventsPage />} />

        <Route path="policy/order-status" element={<OrderStatusPage />} />
        <Route path="policy/payment" element={<PaymentPolicyPage />} />
        <Route path="policy/cancellation" element={<CancelPolicyPage />} />
        <Route path="policy/refund" element={<RefundPolicyPage />} />
        <Route path="policy/settlement" element={<PolicyPlaceholderPage title="정산 정책" subtitle="정산 주기, 대상, 계산 기준을 관리합니다." />} />
        <Route path="policy/fee" element={<PolicyPlaceholderPage title="수수료 정책" subtitle="플랫폼/결제/배송 등 수수료 기준을 관리합니다." />} />

        <Route path="stats/orders" element={<StatsPlaceholderPage title="주문 통계" subtitle="기간별 주문 건수와 추이를 확인합니다." />} />
        <Route path="stats/payments" element={<StatsPlaceholderPage title="결제 통계" subtitle="결제수단·상태별 결제 현황을 확인합니다." />} />
        <Route path="stats/refunds" element={<StatsPlaceholderPage title="환불 통계" subtitle="환불 사유·금액별 환불 현황을 확인합니다." />} />
        <Route path="stats/settlement" element={<StatsPlaceholderPage title="정산 통계" subtitle="정산 주기별 정산 금액과 현황을 확인합니다." />} />
        <Route path="stats/amount" element={<StatsPlaceholderPage title="거래금액 통계" subtitle="기간·거래처별 거래금액 추이를 확인합니다." />} />
        <Route path="stats/report" element={<StatsPlaceholderPage title="거래 리포트" subtitle="거래 지표를 종합한 리포트를 확인합니다." />} />

        <Route path="delivery/prep" element={<DeliveryPrepPage />} />
        <Route path="delivery/outbound-waiting" element={<OutboundWaitingPage />} />
        <Route path="delivery/outbound-complete" element={<OutboundCompletePage />} />
        <Route path="delivery/in-transit" element={<InTransitPage />} />
        <Route path="delivery/complete" element={<DeliveryCompletePage />} />

        <Route path="*" element={<Navigate to="/members" replace />} />
      </Route>
    </Routes>
  );
}
