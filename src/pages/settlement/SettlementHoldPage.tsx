import { SettlementStatusPage } from './SettlementStatusPage';

export function SettlementHoldPage() {
  return (
    <SettlementStatusPage
      title="정산 보류"
      subtitle="문제가 확인되어 정산 진행이 중단된 건입니다. 사유를 확인한 뒤 보류를 해제하세요."
      bannerBg="#f4f4f5"
      bannerFg="#52525b"
      bannerLabel="⚠ 정산보류 상태의 정산 건입니다."
      emptyText="현재 보류된 정산 건이 없습니다."
      filter={(r) => r.settleStatus === '보류'}
    />
  );
}
