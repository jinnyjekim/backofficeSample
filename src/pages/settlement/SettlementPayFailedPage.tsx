import { SettlementStatusPage } from './SettlementStatusPage';

export function SettlementPayFailedPage() {
  return (
    <SettlementStatusPage
      title="지급 실패"
      subtitle="정산은 확정됐지만 지급 처리에 실패한 건입니다. 계좌 정보를 확인한 뒤 재지급하세요."
      bannerBg="#fef2f2"
      bannerFg="#b91c1c"
      bannerLabel="✕ 지급실패 상태의 정산 건입니다."
      emptyText="현재 확인이 필요한 지급 실패 건이 없습니다."
      filter={(r) => r.payStatus === '지급실패'}
    />
  );
}
