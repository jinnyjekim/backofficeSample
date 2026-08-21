export type RequestStatus = '접수' | '검토중' | '보완요청' | '견적작성완료' | '종료';
export type RequestType = '신규 견적' | '재견적' | '조건 변경';

export interface RequestItem {
  name: string;
  code: string;
  qty: number;
  unit: string;
  due: string;
  wishPrice: string;
  currentPrice: string;
  moq: string;
}

export interface RequestFile {
  name: string;
  meta: string;
}

export interface LinkedQuoteRef {
  no: string;
  round: string;
  status: string;
  bg: string;
  fg: string;
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
  note?: string;
}

export interface QuoteRequest {
  id: string;
  partner: string;
  contact: string;
  type: RequestType;
  status: RequestStatus;
  owner: string;
  urgent: boolean;
  requested: string;
  requestedFull: string;
  due: string;
  items: RequestItem[];
  remark: string;
  wishAmount: string;
  paymentTerm: string;
  files: RequestFile[];
  quotes: LinkedQuoteRef[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const STATUSES: RequestStatus[] = ['접수', '검토중', '보완요청', '견적작성완료', '종료'];
export const QUICK_FILTER_KEYS: ('전체' | RequestStatus)[] = ['전체', ...STATUSES];

export const STATUS_META: Record<RequestStatus, { bg: string; fg: string }> = {
  접수: { bg: '#eff6ff', fg: '#2563eb' },
  검토중: { bg: '#fffbeb', fg: '#d97706' },
  보완요청: { bg: '#fef2f2', fg: '#dc2626' },
  견적작성완료: { bg: '#ecfdf5', fg: '#059669' },
  종료: { bg: '#f4f4f5', fg: '#71717a' },
};

export const QUOTE_REQUESTS: QuoteRequest[] = [
  {
    id: 'RFQ-1028',
    partner: '회사 01',
    contact: '김OO · 구매팀',
    type: '신규 견적',
    status: '접수',
    owner: '미배정',
    urgent: false,
    requested: '08.14',
    requestedFull: '2026.08.14 10:30',
    due: '2026.08.30',
    items: [
      { name: '상품명 01', code: 'P-001238', qty: 100, unit: 'EA', due: '2026.08.30', wishPrice: '28,000원', currentPrice: '32,000원', moq: '10개' },
      { name: '상품명 02', code: 'P-001239', qty: 20, unit: 'BOX', due: '2026.08.30', wishPrice: '없음', currentPrice: '18,000원', moq: '20개' },
    ],
    remark: '납기 단축 가능 여부 확인 요청',
    wishAmount: '2,800,000원',
    paymentTerm: '후불 30일',
    files: [{ name: '요청사양서.pdf', meta: 'admin — 320KB' }],
    quotes: [],
    memos: [],
    history: [{ when: '2026.08.14 10:30', action: '견적 요청 등록', by: '거래처 담당자' }],
  },
  {
    id: 'RFQ-1027',
    partner: '회사 02',
    contact: '박OO · 자재팀',
    type: '신규 견적',
    status: '검토중',
    owner: 'admin01',
    urgent: true,
    requested: '08.13',
    requestedFull: '2026.08.13 15:10',
    due: '2026.09.05',
    items: [{ name: '상품명 03', code: 'P-001240', qty: 500, unit: 'EA', due: '2026.09.05', wishPrice: '95,000원', currentPrice: '120,000원', moq: '1개' }],
    remark: '-',
    wishAmount: '47,500,000원',
    paymentTerm: '-',
    files: [],
    quotes: [],
    memos: [{ when: '2026.08.13', admin: 'admin01', text: '기존 계약 단가 확인 필요.' }],
    history: [
      { when: '2026.08.13 15:10', action: '견적 요청 등록', by: '거래처 담당자' },
      { when: '2026.08.13 16:00', action: '담당자 지정 (admin01)', by: 'admin01' },
      { when: '2026.08.13 16:02', action: '검토 시작', by: 'admin01' },
    ],
  },
  {
    id: 'RFQ-1021',
    partner: '㈜한빛물산',
    contact: '최OO · 구매팀',
    type: '재견적',
    status: '보완요청',
    owner: 'admin02',
    urgent: false,
    requested: '08.09',
    requestedFull: '2026.08.09 09:40',
    due: '2026.08.25',
    items: [{ name: '상품명 05', code: 'P-000982', qty: 0, unit: 'EA', due: '2026.08.25', wishPrice: '없음', currentPrice: '64,000원', moq: '20개' }],
    remark: '정확한 주문수량 미기재',
    wishAmount: '-',
    paymentTerm: '-',
    files: [],
    quotes: [{ no: 'Q-00128', round: '1차', status: '발송 완료', bg: '#ecfdf5', fg: '#059669' }],
    memos: [],
    history: [
      { when: '2026.08.09 09:40', action: '견적 요청 등록', by: '거래처 담당자' },
      { when: '2026.08.11 11:20', action: '보완 요청 (수량/납기)', by: 'admin02' },
    ],
  },
  {
    id: 'RFQ-1015',
    partner: '케이스퀘어',
    contact: '정OO · 운영팀',
    type: '신규 견적',
    status: '견적작성완료',
    owner: 'admin03',
    urgent: false,
    requested: '08.05',
    requestedFull: '2026.08.05 11:00',
    due: '2026.08.20',
    items: [{ name: '상품명 03', code: 'P-001240', qty: 1, unit: 'EA', due: '2026.08.20', wishPrice: '100,000원', currentPrice: '120,000원', moq: '1개' }],
    remark: '-',
    wishAmount: '100,000원',
    paymentTerm: '선불',
    files: [],
    quotes: [{ no: 'Q-00119', round: '1차', status: '작성완료', bg: '#eff6ff', fg: '#2563eb' }],
    memos: [],
    history: [
      { when: '2026.08.05 11:00', action: '견적 요청 등록', by: '거래처 담당자' },
      { when: '2026.08.05 13:00', action: '검토 시작', by: 'admin03' },
      { when: '2026.08.06 09:20', action: '견적서 Q-00119 생성', by: 'admin03' },
    ],
  },
  {
    id: 'RFQ-0998',
    partner: '대성유통',
    contact: '한OO · 구매팀',
    type: '신규 견적',
    status: '종료',
    owner: 'admin01',
    urgent: false,
    requested: '07.28',
    requestedFull: '2026.07.28 14:00',
    due: '2026.08.05',
    items: [{ name: '상품명 01', code: 'P-001238', qty: 30, unit: 'EA', due: '2026.08.05', wishPrice: '25,000원', currentPrice: '32,000원', moq: '10개' }],
    remark: '-',
    wishAmount: '750,000원',
    paymentTerm: '-',
    files: [],
    quotes: [],
    memos: [],
    history: [
      { when: '2026.07.28 14:00', action: '견적 요청 등록', by: '거래처 담당자' },
      { when: '2026.07.29 10:00', action: '반려 (공급 불가)', by: 'admin01' },
    ],
  },
];
