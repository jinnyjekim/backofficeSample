export type QuoteStatus = '작성중' | '승인대기' | '발송대기' | '발송완료' | '수락' | '거절' | '만료';

export interface QuoteItem {
  name: string;
  code: string;
  qty: string;
  basePrice: number;
  unitPrice: number;
}

export interface QuoteVersion {
  v: string;
  date: string;
  status: string;
  amount: number;
}

export interface SendLog {
  title: string;
  when: string;
  to: string;
  by: string;
}

export interface Memo {
  when: string;
  admin: string;
  text: string;
}

export interface HistoryEntry {
  when: string;
  action: string;
  by: string;
}

export interface Quote {
  id: string;
  version: string;
  partner: string;
  contact: string;
  status: QuoteStatus;
  owner: string;
  created: string;
  validUntil: string;
  amount: number;
  rfq: string | null;
  items: QuoteItem[];
  discount: number;
  tax: number;
  dueDate: string;
  paymentTerm: string;
  remark: string;
  versions: QuoteVersion[];
  sendLogs: SendLog[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const STATUSES: QuoteStatus[] = ['작성중', '승인대기', '발송대기', '발송완료', '수락', '만료'];
export const QUICK_FILTER_KEYS: ('전체' | QuoteStatus)[] = ['전체', ...STATUSES];

export const STATUS_META: Record<QuoteStatus, { bg: string; fg: string }> = {
  작성중: { bg: '#f4f4f5', fg: '#52525b' },
  승인대기: { bg: '#fffbeb', fg: '#d97706' },
  발송대기: { bg: '#eff6ff', fg: '#2563eb' },
  발송완료: { bg: '#eff6ff', fg: '#2563eb' },
  수락: { bg: '#ecfdf5', fg: '#059669' },
  거절: { bg: '#fef2f2', fg: '#dc2626' },
  만료: { bg: '#f4f4f5', fg: '#71717a' },
};

export function fmt(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function issuesOf(q: Quote): string[] {
  const issues: string[] = [];
  const disc = q.items.some((it) => it.basePrice && (it.unitPrice - it.basePrice) / it.basePrice <= -0.1);
  if (disc) issues.push('기준가 대비 -10% 이상');
  return issues;
}

export const QUOTES: Quote[] = [
  {
    id: 'Q-00182',
    version: 'V2',
    partner: '회사 01',
    contact: '김OO · 구매팀',
    status: '발송완료',
    owner: 'admin01',
    created: '08.14',
    validUntil: '2026.08.31',
    amount: 4820000,
    rfq: 'RFQ-1028',
    items: [
      { name: '상품명 01', code: 'P-001238', qty: '100 EA', basePrice: 32000, unitPrice: 29000 },
      { name: '상품명 02', code: 'P-001239', qty: '50 BOX', basePrice: 18000, unitPrice: 17500 },
    ],
    discount: 50000,
    tax: 452250,
    dueDate: '2026.09.02',
    paymentTerm: '후불 30일',
    remark: '납기 단축 협의중',
    versions: [
      { v: 'V1', date: '2026.08.14', status: '발송 완료', amount: 4950000 },
      { v: 'V2', date: '2026.08.15', status: '발송 완료 · 현재', amount: 4820000 },
    ],
    sendLogs: [{ title: '견적서 발송', when: '2026.08.15 13:10', to: '김OO / ki***@example.com', by: 'admin01' }],
    memos: [{ when: '2026.08.14', admin: 'admin01', text: '가격 재협의 후 V2 발송.' }],
    history: [
      { when: '2026.08.14 09:10', action: '견적서 V1 생성', by: 'admin01' },
      { when: '2026.08.14 14:20', action: '거래처 발송', by: 'admin01' },
      { when: '2026.08.15 09:40', action: '재견적 V2 생성', by: 'admin01' },
      { when: '2026.08.15 13:10', action: 'V2 발송', by: 'admin01' },
    ],
  },
  {
    id: 'Q-00181',
    version: 'V1',
    partner: '회사 02',
    contact: '박OO · 자재팀',
    status: '승인대기',
    owner: 'admin02',
    created: '08.14',
    validUntil: '2026.08.25',
    amount: 1250000,
    rfq: 'RFQ-1027',
    items: [{ name: '상품명 03', code: 'P-001240', qty: '10 EA', basePrice: 120000, unitPrice: 100000 }],
    discount: 0,
    tax: 113636,
    dueDate: '2026.08.28',
    paymentTerm: '후불 45일',
    remark: '-',
    versions: [{ v: 'V1', date: '2026.08.14', status: '승인대기 · 현재', amount: 1250000 }],
    sendLogs: [],
    memos: [],
    history: [
      { when: '2026.08.14 15:00', action: '견적서 V1 생성', by: 'admin02' },
      { when: '2026.08.14 15:30', action: '승인 요청', by: 'admin02' },
    ],
  },
  {
    id: 'Q-00175',
    version: 'V1',
    partner: '㈜한빛물산',
    contact: '최OO · 구매팀',
    status: '작성중',
    owner: 'admin02',
    created: '08.13',
    validUntil: '2026.08.28',
    amount: 960000,
    rfq: null,
    items: [{ name: '상품명 05', code: 'P-000982', qty: '15 EA', basePrice: 64000, unitPrice: 64000 }],
    discount: 0,
    tax: 96000,
    dueDate: '',
    paymentTerm: '',
    remark: '',
    versions: [{ v: 'V1', date: '2026.08.13', status: '작성중 · 현재', amount: 960000 }],
    sendLogs: [],
    memos: [],
    history: [{ when: '2026.08.13 11:00', action: '견적서 V1 생성', by: 'admin02' }],
  },
  {
    id: 'Q-00119',
    version: 'V1',
    partner: '케이스퀘어',
    contact: '정OO · 운영팀',
    status: '수락',
    owner: 'admin03',
    created: '08.05',
    validUntil: '2026.08.20',
    amount: 110000,
    rfq: 'RFQ-1015',
    items: [{ name: '상품명 03', code: 'P-001240', qty: '1 EA', basePrice: 120000, unitPrice: 100000 }],
    discount: 0,
    tax: 10000,
    dueDate: '2026.08.22',
    paymentTerm: '선불',
    remark: '',
    versions: [{ v: 'V1', date: '2026.08.05', status: '수락 · 현재', amount: 110000 }],
    sendLogs: [{ title: '견적서 발송', when: '2026.08.05 14:00', to: '정OO', by: 'admin03' }],
    memos: [],
    history: [
      { when: '2026.08.05 13:00', action: '견적서 V1 생성', by: 'admin03' },
      { when: '2026.08.05 14:00', action: '거래처 발송', by: 'admin03' },
      { when: '2026.08.06 09:00', action: '견적 수락', by: '거래처' },
    ],
  },
  {
    id: 'Q-00098',
    version: 'V1',
    partner: '대성유통',
    contact: '한OO · 구매팀',
    status: '만료',
    owner: 'admin01',
    created: '07.20',
    validUntil: '2026.08.01',
    amount: 750000,
    rfq: 'RFQ-0998',
    items: [{ name: '상품명 01', code: 'P-001238', qty: '30 EA', basePrice: 32000, unitPrice: 25000 }],
    discount: 0,
    tax: 75000,
    dueDate: '2026.08.05',
    paymentTerm: '-',
    remark: '',
    versions: [{ v: 'V1', date: '2026.07.20', status: '만료 · 현재', amount: 750000 }],
    sendLogs: [{ title: '견적서 발송', when: '2026.07.20 15:00', to: '한OO', by: 'admin01' }],
    memos: [],
    history: [
      { when: '2026.07.20 14:00', action: '견적서 V1 생성', by: 'admin01' },
      { when: '2026.07.20 15:00', action: '거래처 발송', by: 'admin01' },
      { when: '2026.08.01 00:00', action: '유효기간 만료', by: 'system' },
    ],
  },
];
