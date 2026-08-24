import { SettlementStatusPage } from './SettlementStatusPage';

export function SettlementPayCompletedPage() {
  return (
    <SettlementStatusPage
      title="지급 완료"
      subtitle="실제 지급까지 끝난 정산 건입니다."
      bannerBg="#ecfdf5"
      bannerFg="#059669"
      bannerLabel="✓ 지급완료 상태의 정산 건입니다."
      emptyText="완료된 지급 내역이 없습니다."
      filter={(r) => r.payStatus === '지급완료'}
    />
  );
}
