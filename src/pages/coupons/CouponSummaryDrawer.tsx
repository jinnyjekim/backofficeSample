import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import { STATUS_META, computeIssues, computeStatus, discountSummary, issuePeriodSummary, targetSummary, validitySummary, type Coupon } from './couponsData';

interface Props { coupon: Coupon; eyebrow: string; onClose: () => void; }

export function CouponSummaryDrawer({ coupon, eyebrow, onClose }: Props) {
  const status = computeStatus(coupon);
  return <DetailDrawer eyebrow={`${eyebrow} · ${coupon.code}`} title={coupon.name} status={status} statusMeta={STATUS_META[status]} subtitle={`${targetSummary(coupon)} · ${discountSummary(coupon)}`} onClose={onClose} stats={[{ label: '발급', value: `${coupon.issuedCount.toLocaleString()}건` }, { label: '사용', value: `${coupon.usedCount.toLocaleString()}건` }, { label: '사용률', value: coupon.issuedCount ? `${((coupon.usedCount / coupon.issuedCount) * 100).toFixed(1)}%` : '0%' }]} fields={[{ label: '발급 방식', value: coupon.issueMethod }, { label: '발급 기간', value: issuePeriodSummary(coupon) }, { label: '사용 유효기간', value: validitySummary(coupon) }, { label: '회원별 한도', value: `${coupon.perMemberLimit}장` }, { label: '적용 대상', value: targetSummary(coupon) }, { label: '담당자', value: coupon.owner }, { label: '검토 항목', value: computeIssues(coupon).join(' · ') || '없음' }]}/>;
}
