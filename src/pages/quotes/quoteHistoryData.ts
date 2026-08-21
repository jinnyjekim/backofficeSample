export type HistoryStatus = '수락' | '거절' | '만료' | '취소';

export interface HistoryVersion {
  label: string;
  tag: string;
  date: string;
  admin: string;
  amount: number;
  changes: string;
  payment: string;
  due: string;
  validUntil: string;
  prices: Record<string, number>;
}

export interface ApprovalEvent {
  when: string;
  action: string;
  by: string;
  note?: string;
}

export interface ApprovalGroup {
  version: string;
  events: ApprovalEvent[];
}

export interface HistorySendLog {
  title: string;
  when: string;
  to: string;
  by: string;
}

export interface TimelineEvent {
  when: string;
  action: string;
  by: string;
}

export interface QuoteRecord {
  id: string;
  partner: string;
  firstAmount: number;
  finalAmount: number;
  status: HistoryStatus;
  owner: string;
  created: string;
  finalized: string;
  versions: HistoryVersion[];
  approvalGroups: ApprovalGroup[];
  sendLogs: HistorySendLog[];
  resultDate: string;
  resultBy: string;
  reason: string;
  rfq: string | null;
  contract: string | null;
  order: string | null;
  timeline: TimelineEvent[];
}

export const STATUSES: ('전체' | HistoryStatus)[] = ['전체', '수락', '거절', '만료', '취소'];

export const STATUS_META: Record<HistoryStatus, { bg: string; fg: string }> = {
  수락: { bg: '#ecfdf5', fg: '#059669' },
  거절: { bg: '#fef2f2', fg: '#dc2626' },
  만료: { bg: '#f4f4f5', fg: '#71717a' },
  취소: { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export function fmt(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export const QUOTE_RECORDS: QuoteRecord[] = [
  {
    id: 'Q-00182',
    partner: '회사 01',
    firstAmount: 5200000,
    finalAmount: 4820000,
    status: '수락',
    owner: 'admin01',
    created: '08.12',
    finalized: '08.16',
    versions: [
      { label: 'V1', tag: '최초', date: '2026.08.12 11:20', admin: 'admin02', amount: 5200000, changes: '최초 작성', payment: '후불 30일', due: '2026.09.10', validUntil: '2026.08.31', prices: { '상품 01': 30000, '상품 02': 40000 } },
      { label: 'V2', tag: '', date: '2026.08.14 15:10', admin: 'admin01', amount: 4950000, changes: '상품 01 단가 인하 · 납기 변경', payment: '후불 30일', due: '2026.09.07', validUntil: '2026.09.02', prices: { '상품 01': 29000, '상품 02': 39000 } },
      { label: 'V3', tag: '최종 · 수락', date: '2026.08.15 11:40', admin: 'admin01', amount: 4820000, changes: '상품 01/02 단가 재조정 · 결제조건 30일→45일', payment: '후불 45일', due: '2026.09.05', validUntil: '2026.09.05', prices: { '상품 01': 28000, '상품 02': 38000 } },
    ],
    approvalGroups: [
      { version: 'V1', events: [{ when: '08.12 15:30', action: '승인 요청', by: 'admin01' }, { when: '08.12 16:10', action: '승인', by: 'admin03' }] },
      { version: 'V2', events: [{ when: '08.14 15:20', action: '승인 요청', by: 'admin01' }, { when: '08.14 15:40', action: '반려', by: 'admin03', note: '할인율 재검토' }] },
      { version: 'V3', events: [{ when: '08.15 11:40', action: '승인 완료', by: 'admin03' }] },
    ],
    sendLogs: [
      { title: 'V1 발송', when: '2026.08.12 17:00', to: '김OO / 회사 01', by: 'admin01' },
      { title: 'V2 발송', when: '2026.08.14 17:40', to: '김OO / 회사 01', by: 'admin01' },
      { title: 'V3 발송', when: '2026.08.15 14:20', to: '김OO / 회사 01', by: 'admin02' },
    ],
    resultDate: '2026.08.16',
    resultBy: '김OO / 구매팀',
    reason: '',
    rfq: 'RFQ-1028',
    contract: 'CT-00182',
    order: 'O-00382',
    timeline: [
      { when: '08.12 11:20', action: '견적 V1 생성', by: 'admin02' },
      { when: '08.12 15:30', action: '승인 요청', by: 'admin01' },
      { when: '08.12 16:10', action: '승인 완료', by: 'admin03' },
      { when: '08.12 17:00', action: '거래처 발송', by: 'admin01' },
      { when: '08.13 10:20', action: '재견적 요청 접수', by: '거래처' },
      { when: '08.14 15:10', action: 'V2 생성', by: 'admin01' },
      { when: '08.15 11:40', action: 'V3 최종 승인', by: 'admin03' },
      { when: '08.16 10:20', action: '거래처 수락', by: '거래처' },
      { when: '08.16 11:10', action: '주문 O-00382 생성', by: 'system' },
    ],
  },
  {
    id: 'Q-00181',
    partner: '회사 02',
    firstAmount: 8500000,
    finalAmount: 8100000,
    status: '만료',
    owner: 'admin02',
    created: '08.10',
    finalized: '08.25',
    versions: [
      { label: 'V1', tag: '최초', date: '2026.08.10 09:00', admin: 'admin02', amount: 8500000, changes: '최초 작성', payment: '후불 30일', due: '2026.09.01', validUntil: '2026.08.20', prices: { '상품 03': 95000 } },
      { label: 'V2', tag: '최종 · 만료', date: '2026.08.11 14:00', admin: 'admin02', amount: 8100000, changes: '수량 확대에 따른 단가 인하', payment: '후불 30일', due: '2026.09.01', validUntil: '2026.08.25', prices: { '상품 03': 90000 } },
    ],
    approvalGroups: [
      { version: 'V1', events: [{ when: '08.10 10:00', action: '승인 요청', by: 'admin02' }, { when: '08.10 11:00', action: '승인', by: 'admin03' }] },
      { version: 'V2', events: [{ when: '08.11 14:30', action: '승인 요청', by: 'admin02' }, { when: '08.11 15:00', action: '승인', by: 'admin03' }] },
    ],
    sendLogs: [
      { title: 'V1 발송', when: '2026.08.10 11:30', to: '박OO / 회사 02', by: 'admin02' },
      { title: 'V2 발송', when: '2026.08.11 15:30', to: '박OO / 회사 02', by: 'admin02' },
    ],
    resultDate: '2026.08.25',
    resultBy: '-',
    reason: '유효기간 경과 (미회신)',
    rfq: 'RFQ-1027',
    contract: null,
    order: null,
    timeline: [
      { when: '08.10 09:00', action: '견적 V1 생성', by: 'admin02' },
      { when: '08.10 11:30', action: '거래처 발송', by: 'admin02' },
      { when: '08.11 14:00', action: 'V2 생성', by: 'admin02' },
      { when: '08.11 15:30', action: '거래처 발송', by: 'admin02' },
      { when: '08.25 00:00', action: '유효기간 만료', by: 'system' },
    ],
  },
  {
    id: 'Q-00119',
    partner: '케이스퀘어',
    firstAmount: 110000,
    finalAmount: 110000,
    status: '수락',
    owner: 'admin03',
    created: '08.05',
    finalized: '08.06',
    versions: [
      { label: 'V1', tag: '최초 · 최종 · 수락', date: '2026.08.05 13:00', admin: 'admin03', amount: 110000, changes: '최초 작성', payment: '선불', due: '2026.08.22', validUntil: '2026.08.20', prices: { '상품 03': 100000 } },
    ],
    approvalGroups: [{ version: 'V1', events: [{ when: '08.05 13:20', action: '승인 요청', by: 'admin03' }, { when: '08.05 13:40', action: '승인', by: 'admin03' }] }],
    sendLogs: [{ title: 'V1 발송', when: '2026.08.05 14:00', to: '정OO', by: 'admin03' }],
    resultDate: '2026.08.06',
    resultBy: '정OO / 운영팀',
    reason: '',
    rfq: 'RFQ-1015',
    contract: null,
    order: 'O-00192',
    timeline: [
      { when: '08.05 13:00', action: '견적 V1 생성', by: 'admin03' },
      { when: '08.05 14:00', action: '거래처 발송', by: 'admin03' },
      { when: '08.06 09:00', action: '거래처 수락', by: '거래처' },
      { when: '08.06 09:30', action: '주문 O-00192 생성', by: 'system' },
    ],
  },
  {
    id: 'Q-00155',
    partner: '대성유통',
    firstAmount: 1200000,
    finalAmount: 900000,
    status: '거절',
    owner: 'admin01',
    created: '08.10',
    finalized: '08.10',
    versions: [
      { label: 'V1', tag: '최초 · 최종 · 거절', date: '2026.08.10 14:00', admin: 'admin01', amount: 900000, changes: '최초 작성', payment: '선불', due: '-', validUntil: '2026.08.20', prices: { '상품 01': 24000 } },
    ],
    approvalGroups: [{ version: 'V1', events: [{ when: '08.10 14:20', action: '승인 요청', by: 'admin01' }, { when: '08.10 15:00', action: '반려', by: 'admin03', note: '할인율 과다' }] }],
    sendLogs: [],
    resultDate: '2026.08.10',
    resultBy: '한OO / 구매팀',
    reason: '가격 조건 불일치',
    rfq: 'RFQ-0998',
    contract: null,
    order: null,
    timeline: [
      { when: '08.10 14:00', action: '견적 V1 생성', by: 'admin01' },
      { when: '08.10 15:00', action: '내부 반려', by: 'admin03' },
      { when: '08.10 16:00', action: '거래처 거절', by: '거래처' },
    ],
  },
  {
    id: 'Q-00098',
    partner: '㈜한빛물산',
    firstAmount: 750000,
    finalAmount: 750000,
    status: '취소',
    owner: 'admin02',
    created: '07.20',
    finalized: '07.22',
    versions: [
      { label: 'V1', tag: '최초 · 최종 · 취소', date: '2026.07.20 14:00', admin: 'admin02', amount: 750000, changes: '최초 작성', payment: '-', due: '-', validUntil: '2026.08.05', prices: { '상품 05': 25000 } },
    ],
    approvalGroups: [],
    sendLogs: [],
    resultDate: '2026.07.22',
    resultBy: 'admin02',
    reason: '거래처 요청 철회',
    rfq: null,
    contract: null,
    order: null,
    timeline: [
      { when: '07.20 14:00', action: '견적 V1 생성', by: 'admin02' },
      { when: '07.22 10:00', action: '요청 철회로 견적 취소', by: 'admin02' },
    ],
  },
];
