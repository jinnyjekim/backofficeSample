import { SettlementStatusPage } from './SettlementStatusPage';

export function SettlementPayScheduledPage() {
  return (
    <SettlementStatusPage
      title="지급 예정"
      subtitle="정산금액은 확정됐지만 아직 지급이 완료되지 않은 정산 건입니다."
      bannerBg="#eef2ff"
      bannerFg="#4338ca"
      bannerLabel="→ 지급예정 상태의 정산 건입니다."
      emptyText="현재 예정된 지급 건이 없습니다."
      filter={(r) => r.payStatus === '지급예정'}
    />
  );
}
