import { STATUS_META, type MoqItem } from './minOrderQtyData';

export interface FieldRow {
  label: string;
  value: string;
  color?: string;
  weight?: number;
}

export interface MoqDetail {
  id: string;
  name: string;
  target: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  typeLabel: string;
  moqLabel: string;
  baseMoqLabel: string;
  isContractLocked: boolean;
  canEdit: boolean;

  basicFields: FieldRow[];
  condFields: FieldRow[];
  possibleQtys: string;
  showsScheduled: boolean;
  scheduledLabel: string;

  compareFields: FieldRow[];

  hasContract: boolean;
  noContract: boolean;
  contractFields: FieldRow[];

  history: MoqItem['history'];
}

export function buildMoqDetail(selected: MoqItem, baseline: MoqItem | undefined): MoqDetail {
  const sm = STATUS_META[selected.status];
  const isLocked = selected.type === '계약 MOQ';

  const qtys: number[] = [];
  for (let n = selected.moq, i = 0; i < 5; n += selected.multiple, i++) qtys.push(n);

  return {
    id: selected.id,
    name: selected.name,
    target: selected.partner,
    statusLabel: selected.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    typeLabel: selected.type,
    moqLabel: `${selected.moq}개 / ${selected.multiple}개 단위`,
    baseMoqLabel: baseline ? `${baseline.moq}개 / ${baseline.multiple}개 단위` : '-',
    isContractLocked: isLocked,
    canEdit: !isLocked,

    basicFields: [
      { label: '조건 ID', value: selected.id },
      { label: '상품', value: `${selected.name} / ${selected.code}` },
      { label: '조건 유형', value: selected.type },
      { label: '적용 대상', value: selected.partner },
      { label: '상태', value: selected.status },
      { label: '등록자', value: selected.admin },
    ],

    condFields: [
      { label: '최소 주문수량', value: `${selected.moq}개` },
      { label: '주문 단위', value: `${selected.multiple}개` },
      { label: '최대 주문수량', value: selected.max ? `${selected.max}개` : '제한 없음' },
    ],
    possibleQtys: qtys.join(' / ') + ' ...',
    showsScheduled: !!selected.scheduled,
    scheduledLabel: selected.scheduled ? `${selected.scheduled.date} ~ · ${selected.scheduled.moq}개 / ${selected.scheduled.multiple}개 단위` : '',

    compareFields: baseline
      ? [
          { label: '상품 기본 조건', value: `${baseline.moq}개 / ${baseline.multiple}개 단위`, weight: 500, color: '#3f3f46' },
          { label: '현재 적용 조건', value: `${selected.moq}개 / ${selected.multiple}개 단위`, weight: 600, color: '#18181b' },
        ]
      : [
          { label: '상품 기본 조건', value: '미설정', weight: 500, color: '#71717a' },
          { label: '현재 적용 조건', value: `${selected.moq}개 / ${selected.multiple}개 단위`, weight: 600, color: '#18181b' },
        ],

    hasContract: !!selected.contract,
    noContract: !selected.contract,
    contractFields: selected.contract
      ? [
          { label: '계약', value: selected.contract.no },
          { label: '계약기간', value: selected.contract.period },
          { label: '계약 조건', value: selected.contract.moq },
        ]
      : [],

    history: selected.history,
  };
}
