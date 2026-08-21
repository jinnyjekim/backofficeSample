export type MoqStatus = '적용중' | '적용예정' | '종료';
export type MoqType = '기본 MOQ' | '거래처별 MOQ' | '계약 MOQ';

export interface MoqContract {
  no: string;
  period: string;
  moq: string;
}

export interface MoqHistoryEntry {
  when: string;
  admin: string;
  from: string;
  to: string;
  applyDate: string;
  reason: string;
}

export interface MoqScheduled {
  moq: number;
  multiple: number;
  date: string;
}

export interface MoqItem {
  id: string;
  code: string;
  name: string;
  partner: string;
  partnerCode: string;
  type: MoqType;
  moq: number;
  multiple: number;
  max: number | null;
  start: string;
  end: string | null;
  period: string;
  status: MoqStatus;
  registered: string;
  admin: string;
  contract: MoqContract | null;
  history: MoqHistoryEntry[];
  scheduled?: MoqScheduled;
}

export const STATUS_META: Record<MoqStatus, { bg: string; fg: string }> = {
  적용중: { bg: '#ecfdf5', fg: '#059669' },
  적용예정: { bg: '#eff6ff', fg: '#2563eb' },
  종료: { bg: '#f4f4f5', fg: '#71717a' },
};

export const QUICK_FILTER_LABELS = ['전체', '기본조건', '개별조건', '변경예정', '이슈'];

export function issueOf(it: MoqItem): string[] {
  const issues: string[] = [];
  if (it.moq % it.multiple !== 0) issues.push('최소수량이 주문단위 배수 아님');
  if (it.max && it.moq > it.max) issues.push('최소수량 > 최대수량');
  return issues;
}

export function moqFilterCount(label: string, list: MoqItem[]): number {
  switch (label) {
    case '전체':
      return list.length;
    case '기본조건':
      return list.filter((i) => i.type === '기본 MOQ').length;
    case '개별조건':
      return list.filter((i) => i.type !== '기본 MOQ').length;
    case '변경예정':
      return list.filter((i) => !!i.scheduled).length;
    case '이슈':
      return list.filter((i) => issueOf(i).length > 0).length;
    default:
      return 0;
  }
}

export const MOQ_ITEMS: MoqItem[] = [
  {
    id: 'MOQ-00090', code: 'P-001238', name: '상품명 01', partner: '전체', partnerCode: '-', type: '기본 MOQ', moq: 10, multiple: 5, max: null, start: '2026.07.01', end: null, period: '상시', status: '적용중',
    registered: '2026.07.01', admin: 'admin01', contract: null,
    history: [{ when: '2026.07.01 09:00', admin: 'admin01', from: '신규 등록', to: '10개 / 5개 단위', applyDate: '2026.07.01', reason: '-' }],
  },
  {
    id: 'MOQ-00128', code: 'P-001238', name: '상품명 01', partner: '회사 01', partnerCode: 'C-00123', type: '거래처별 MOQ', moq: 50, multiple: 10, max: 500, start: '2026.08.01', end: '2026.12.31', period: '08.01~12.31', status: '적용중',
    registered: '2026.07.10', admin: 'admin01', contract: null,
    history: [
      { when: '2026.08.13 14:20', admin: 'admin01', from: '20개 / 10개 단위', to: '50개 / 10개 단위', applyDate: '2026.09.01', reason: '거래 조건 변경' },
      { when: '2026.07.10 10:30', admin: 'admin02', from: '신규 등록', to: '20개 / 10개 단위', applyDate: '2026.07.10', reason: '-' },
    ],
    scheduled: { moq: 100, multiple: 20, date: '2026.09.01' },
  },
  {
    id: 'MOQ-00201', code: 'P-001239', name: '상품명 02', partner: '전체', partnerCode: '-', type: '기본 MOQ', moq: 100, multiple: 100, max: null, start: '2026.01.01', end: null, period: '상시', status: '적용중',
    registered: '2026.01.01', admin: 'admin02', contract: null,
    history: [{ when: '2026.01.01 09:00', admin: 'admin02', from: '신규 등록', to: '100개 / 100개 단위', applyDate: '2026.01.01', reason: '-' }],
  },
  {
    id: 'MOQ-00340', code: 'P-001240', name: '상품명 03', partner: '케이스퀘어', partnerCode: 'C-00340', type: '계약 MOQ', moq: 100, multiple: 20, max: null, start: '2026.01.01', end: '2026.12.31', period: '01.01~12.31', status: '적용중',
    registered: '2026.01.01', admin: 'admin03', contract: { no: 'CT-00128', period: '2026.01.01 ~ 2026.12.31', moq: '100개 / 20개 단위' },
    history: [{ when: '2026.01.01 09:00', admin: 'admin03', from: '신규 등록', to: '100개 / 20개 단위', applyDate: '2026.01.01', reason: '계약 변경' }],
  },
  {
    id: 'MOQ-00415', code: 'P-000982', name: '상품명 05', partner: '㈜한빛물산', partnerCode: 'C-00415', type: '거래처별 MOQ', moq: 20, multiple: 10, max: 200, start: '2025.11.01', end: '2026.03.31', period: '25.11.01~26.03.31', status: '종료',
    registered: '2025.11.01', admin: 'admin01', contract: null,
    history: [{ when: '2026.03.01 09:00', admin: 'admin01', from: '20개 / 10개 단위', to: '적용 종료', applyDate: '2026.03.31', reason: '계약 변경' }],
  },
  {
    id: 'MOQ-00512', code: 'P-001238', name: '상품명 01', partner: '대성유통', partnerCode: 'C-00512', type: '거래처별 MOQ', moq: 55, multiple: 10, max: null, start: '2026.08.01', end: null, period: '상시', status: '적용중',
    registered: '2026.08.01', admin: 'admin02', contract: null,
    history: [{ when: '2026.08.01 09:00', admin: 'admin02', from: '신규 등록', to: '55개 / 10개 단위', applyDate: '2026.08.01', reason: '오류 정정' }],
  },
];
