import { SettlementStatusPage } from './SettlementStatusPage';

export function SettlementPendingPage() {
  return (
    <SettlementStatusPage
      title="정산 대기"
      subtitle="아직 금액이 확정되지 않은 정산 건을 검토합니다."
      bannerBg="#fffbeb"
      bannerFg="#b45309"
      bannerLabel="⏳ 정산대기 · 검토중 상태의 정산 건입니다."
      emptyText="현재 검토가 필요한 정산 건이 없습니다."
      filter={(r) => r.settleStatus === '정산대기' || r.settleStatus === '검토중'}
    />
  );
}
