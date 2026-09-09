import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import { STATUS_META, computeIssues, computeStatus, discountSummary, fmtWon, periodSummary, targetSummary, type Promotion } from './promotionsData';

interface Props { promotion: Promotion; eyebrow: string; onClose: () => void; }

export function PromotionScopeDetailDrawer({ promotion, eyebrow, onClose }: Props) {
  const status = computeStatus(promotion);
  return <DetailDrawer eyebrow={`${eyebrow} · ${promotion.code}`} title={promotion.name} status={status} statusMeta={STATUS_META[status]} subtitle={`${targetSummary(promotion)} · ${periodSummary(promotion)}`} onClose={onClose} stats={[{ label: '할인', value: discountSummary(promotion) }, { label: '적용 건수', value: `${promotion.appliedCount.toLocaleString()}건` }, { label: '할인 금액', value: fmtWon(promotion.appliedAmount) }]} fields={[{ label: '적용 단위', value: promotion.applyUnit }, { label: '적용 대상', value: targetSummary(promotion) }, { label: '최소 구매금액', value: fmtWon(promotion.minPurchaseAmount) }, { label: '프로모션 중복', value: promotion.stackPromotion }, { label: '쿠폰 중복', value: promotion.stackCoupon }, { label: '담당자', value: promotion.owner }, { label: '검토 항목', value: computeIssues(promotion, [promotion]).join(' · ') || '없음' }]}/>;
}
