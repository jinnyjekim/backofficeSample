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
  const fields = [
    { label: '교환 사유', value: item.reason },
    { label: '옵션 변경', value: `${item.optionBefore} → ${item.optionAfter}` },
    { label: '고객 연락처', value: item.phone || '-' },
    { label: '접수 채널', value: item.channel },
    { label: '접수일시', value: item.requestedAt },
    { label: '재고 상태', value: item.stockStatus },
    { label: '회수 송장', value: item.trackingNo !== '-' ? `${item.carrier} (${item.trackingNo})` : '회수 접수 전' },
    { label: '검수 상태', value: item.inspection },
  ];

  if (item.reshipTrackingNo) {
    fields.push({
      label: '재출고 송장',
      value: `${item.reshipCarrier || item.carrier} (${item.reshipTrackingNo})`,
    });
  }

  if (item.stage === '교환 보류' && item.holdReason) {
    fields.push(
      { label: '보류 사유', value: item.holdReason },
      { label: '보류 상세/메모', value: item.holdMemo || '-' },
    );
  }

  if (item.completedAt) {
    fields.push({ label: '완료일시', value: item.completedAt });
  }
  if (item.rejectedAt) {
    fields.push({ label: '반려일시', value: item.rejectedAt });
  }
  if (item.withdrawnAt) {
    fields.push({ label: '철회일시', value: item.withdrawnAt });
  }

  return (
    <DetailDrawer
      eyebrow={`${eyebrow} · ${item.id}`}
      title={item.product}
      status={item.stage}
      statusMeta={EXCHANGE_STAGE_META[item.stage] || { bg: '#f1f5f9', fg: '#475569' }}
      subtitle={`${item.orderId} · ${item.member}`}
      onClose={onClose}
      actions={actions}
      stats={[
        { label: '교환 금액', value: formatWon(item.amount) },
        { label: '현재 단계', value: item.stage },
        { label: '담당자', value: item.assignee },
      ]}
      fields={fields}
    />
  );
}
