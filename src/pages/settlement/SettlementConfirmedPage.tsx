import { SettlementStatusPage } from './SettlementStatusPage';

export function SettlementConfirmedPage() {
  return (
    <SettlementStatusPage
      title="정산 확정"
      subtitle="정산금액이 확정되어 더 이상 거래·공제 내역을 수정할 수 없는 정산 건입니다."
      bannerBg="#eef2ff"
      bannerFg="#4338ca"
      bannerLabel="✓ 정산확정 상태의 정산 건입니다."
      emptyText="현재 확정된 정산 건이 없습니다."
      filter={(r) => r.settleStatus === '정산확정'}
    />
  );
}
