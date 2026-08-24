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
import { SettlementPendingPage } from './pages/settlement/SettlementPendingPage';
import { SettlementConfirmedPage } from './pages/settlement/SettlementConfirmedPage';
import { SettlementPayScheduledPage } from './pages/settlement/SettlementPayScheduledPage';
import { SettlementPayCompletedPage } from './pages/settlement/SettlementPayCompletedPage';
import { SettlementHoldPage } from './pages/settlement/SettlementHoldPage';
import { SettlementPayFailedPage } from './pages/settlement/SettlementPayFailedPage';
import { SettlementDetailReportPage } from './pages/settlement/SettlementDetailReportPage';
import { SettlementTransactionsPage } from './pages/settlement/SettlementTransactionsPage';
import { SettlementAdjustmentsPage } from './pages/settlement/SettlementAdjustmentsPage';
import { SettlementHistoryPage } from './pages/settlement/SettlementHistoryPage';
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
        <Route path="settlement/pending" element={<SettlementPendingPage />} />
        <Route path="settlement/confirmed" element={<SettlementConfirmedPage />} />
        <Route path="settlement/payment-scheduled" element={<SettlementPayScheduledPage />} />
        <Route path="settlement/payment-completed" element={<SettlementPayCompletedPage />} />
        <Route path="settlement/hold" element={<SettlementHoldPage />} />
        <Route path="settlement/payment-failed" element={<SettlementPayFailedPage />} />
        <Route path="settlement/detail" element={<SettlementDetailReportPage />} />
        <Route path="settlement/transactions" element={<SettlementTransactionsPage />} />
        <Route path="settlement/adjustments" element={<SettlementAdjustmentsPage />} />
        <Route path="settlement/history" element={<SettlementHistoryPage />} />

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
