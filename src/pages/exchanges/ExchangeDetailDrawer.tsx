import type { ReactNode } from 'react';
import { DetailDrawer } from '../c2c/sales/SalesActivityShared';
import type { ExchangeItem } from './exchangeData';
import { EXCHANGE_STAGE_META, formatWon } from './exchangeData';

interface ExchangeDetailDrawerProps {
  item: ExchangeItem;
  eyebrow: string;
  onClose: () => void;
  actions?: ReactNode;
}

export function ExchangeDetailDrawer({ item, eyebrow, onClose, actions }: ExchangeDetailDrawerProps) {
  return (
    <DetailDrawer
      variant="panel"
      eyebrow={`${eyebrow} · ${item.id}`}
      title={item.product}
      status={item.stage}
      statusMeta={EXCHANGE_STAGE_META[item.stage]}
      subtitle={`${item.orderId} · ${item.member}`}
      onClose={onClose}
      actions={actions}
      stats={[{ label: '교환 금액', value: formatWon(item.amount) }, { label: '현재 단계', value: item.stage }, { label: '담당자', value: item.assignee }]}
      fields={[{ label: '교환 사유', value: item.reason }, { label: '옵션 변경', value: `${item.optionBefore} → ${item.optionAfter}` }, { label: '접수 채널', value: item.channel }, { label: '접수일', value: item.requestedAt }, { label: '택배사 / 송장', value: `${item.carrier} · ${item.trackingNo}` }, { label: '검수 결과', value: item.inspection }]}
    />
  );
}
