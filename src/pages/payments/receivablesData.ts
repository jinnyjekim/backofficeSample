export interface Invoice {
  no: string;
  billed: number;
  collected: number;
  due: string;
}

export interface InvoiceCalc extends Invoice {
  remaining: number;
  overdueDays: number;
  status: string;
}

export interface Promise_ {
  date: string;
  amount: number;
  status: '예정' | '미이행';
}

export interface Collection {
  when: string;
  pay: string;
  amount: string;
}

export interface Activity {
  type: string;
  when: string;
  note: string;
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
}

export interface Partner {
  id: string;
  name: string;
  owner: string;
  promise: Promise_ | null;
  invoices: Invoice[];
  collections: Collection[];
  activities: Activity[];
  creditLimit: number;
  creditUsed: number;
  pendingOrders: number;
  memos: Memo[];
  history: HistoryEntry[];
}

export interface PartnerCalc extends Partner {
  invoices: InvoiceCalc[];
  totalBilled: number;
  totalCollected: number;
  totalAr: number;
  overdueAmount: number;
  maxOverdueDays: number;
  openCount: number;
  status: '정상' | '연체' | '완료';
}

export const TODAY = new Date('2026-08-19');

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function parseDate(d: string): Date {
  return new Date(d.replace(/\./g, '-'));
}

export function computeInvoice(iv: Invoice): InvoiceCalc {
  const remaining = iv.billed - iv.collected;
  const dueD = parseDate(iv.due);
  const overdueDays = Math.max(0, Math.round((TODAY.getTime() - dueD.getTime()) / 86400000));
  const status = remaining <= 0 ? '완료' : overdueDays > 0 ? `연체 ${overdueDays}일` : '정상';
  return { ...iv, remaining, overdueDays, status };
}

export function computePartner(p: Partner): PartnerCalc {
  const invoices = p.invoices.map(computeInvoice);
  const totalBilled = invoices.reduce((a, i) => a + i.billed, 0);
  const totalCollected = invoices.reduce((a, i) => a + i.collected, 0);
  const totalAr = totalBilled - totalCollected;
  const overdueAmount = invoices.filter((i) => i.overdueDays > 0).reduce((a, i) => a + i.remaining, 0);
  const maxOverdueDays = Math.max(0, ...invoices.map((i) => i.overdueDays));
  const openCount = invoices.filter((i) => i.remaining > 0).length;
  const status: PartnerCalc['status'] = overdueAmount > 0 ? '연체' : totalAr > 0 ? '정상' : '완료';
  return { ...p, invoices, totalBilled, totalCollected, totalAr, overdueAmount, maxOverdueDays, openCount, status };
}

export const STATUS_META: Record<string, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#059669' },
  연체: { bg: '#fef2f2', fg: '#dc2626' },
};

export const FILTER_KEYS = ['전체', '정상 미수', '연체', '30일 이상', '60일 이상', '90일 이상', '수금 약속'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export const PARTNERS: Partner[] = [
  {
    id: '회사01', name: '회사 01', owner: 'admin01', promise: { date: '2026.08.25', amount: 2000000, status: '예정' },
    invoices: [
      { no: 'INV-00182', billed: 10000000, collected: 8000000, due: '2026.07.29' },
      { no: 'INV-00191', billed: 8000000, collected: 4000000, due: '2026.08.31' },
      { no: 'INV-00201', billed: 10000000, collected: 10000000, due: '2026.08.15' },
    ],
    collections: [{ when: '08.10', pay: 'PAY-00170', amount: '3,000,000원' }, { when: '08.15', pay: 'PAY-00175', amount: '5,000,000원' }],
    activities: [
      { type: '전화', when: '08.19 10:20', note: '김OO 담당자와 통화. 08.25 입금 예정 확인.', by: 'admin01' },
      { type: '이메일', when: '08.16 14:10', note: '미수금 안내 발송.', by: 'admin01' },
    ],
    creditLimit: 50000000, creditUsed: 18000000, pendingOrders: 20000000,
    memos: [{ when: '08.19', admin: 'admin01', text: '8/25 입금 예정, 확인 필요.' }],
    history: [{ when: '08.19', action: '수금 활동 등록 (전화)' }, { when: '08.16', action: '미수금 안내 발송' }, { when: '07.29', action: 'INV-00182 연체 전환' }],
  },
  {
    id: '회사02', name: '회사 02', owner: 'admin02', promise: null,
    invoices: [{ no: 'INV-00191', billed: 5000000, collected: 2000000, due: '2026.08.30' }],
    collections: [{ when: '08.05', pay: 'PAY-00160', amount: '2,000,000원' }],
    activities: [],
    creditLimit: 30000000, creditUsed: 5000000, pendingOrders: 3000000,
    memos: [],
    history: [{ when: '08.05', action: '부분 수금 2,000,000원' }],
  },
  {
    id: '㈜한빛물산', name: '㈜한빛물산', owner: 'admin03', promise: null,
    invoices: [{ no: 'INV-00170', billed: 1500000, collected: 1500000, due: '2026.08.22' }],
    collections: [{ when: '08.18', pay: 'PAY-00179', amount: '1,500,000원' }],
    activities: [],
    creditLimit: 20000000, creditUsed: 0, pendingOrders: 0,
    memos: [],
    history: [{ when: '08.18', action: '수금 완료' }],
  },
  {
    id: '대성유통', name: '대성유통', owner: 'admin01', promise: { date: '2026.07.15', amount: 900000, status: '미이행' },
    invoices: [{ no: 'INV-00160', billed: 900000, collected: 0, due: '2026.05.20' }],
    collections: [],
    activities: [
      { type: '공문', when: '08.10 09:00', note: '2차 독촉 공문 발송.', by: 'admin01' },
      { type: '전화', when: '07.20 11:00', note: '연락 두절, 회신 없음.', by: 'admin01' },
    ],
    creditLimit: 10000000, creditUsed: 900000, pendingOrders: 0,
    memos: [{ when: '08.10', admin: 'admin01', text: '90일 이상 연체, 대손 검토 필요.' }],
    history: [{ when: '08.10', action: '2차 독촉 공문 발송' }, { when: '07.15', action: '지급 약속 미이행' }, { when: '05.20', action: '연체 전환' }],
  },
  {
    id: '케이스퀘어', name: '케이스퀘어', owner: 'admin02', promise: null,
    invoices: [{ no: 'INV-00151', billed: 110000, collected: 0, due: '2026.08.10' }],
    collections: [],
    activities: [],
    creditLimit: 5000000, creditUsed: 110000, pendingOrders: 0,
    memos: [],
    history: [{ when: '08.10', action: '연체 전환' }],
  },
];
