import type { BadgeCell, Cell, GridColumn, LinkCell, TextCell } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';

export type ContractStatus = '계약 예정' | '계약중' | '만료' | '해지' | '종료';

export interface ContractLineItem {
  name: string;
  qty: number;
  used: number;
  unitPrice: number;
  moq: string;
}

export interface ContractPriceRow {
  name: string;
  base: string;
  partner: string;
  contract: string;
}

export interface ContractPriceHistoryEntry {
  period: string;
  price: string;
}

export interface ContractTermRow {
  label: string;
  base: string;
  override: string;
  weight: number;
  fg: string;
}

export interface ContractOrderRow {
  po: string;
  order: string;
  amount: string;
  status: string;
  bg: string;
  fg: string;
}

export interface ContractVersion {
  label: string;
  note: string;
  appliedAt: string;
  amount: string;
}

export interface ContractMemo {
  when: string;
  admin: string;
  text: string;
}

export interface ContractHistoryEntry {
  when: string;
  action: string;
  by: string;
  note?: string;
}

export interface Contract {
  id: string;
  name: string;
  partner: string;
  type: string;
  status: ContractStatus;
  start: string;
  end: string;
  amount: number;
  owner: string;
  dday: number | null;
  items: ContractLineItem[];
  priceRows: ContractPriceRow[];
  priceHistory: ContractPriceHistoryEntry[];
  termRows: ContractTermRow[];
  specialTerms: string;
  orderRows: ContractOrderRow[];
  docs: string[];
  linkedQuote: string;
  versions: ContractVersion[];
  memos: ContractMemo[];
  history: ContractHistoryEntry[];
  issue: string | null;
  arOutstanding: number;
  openOrders: number;
}

export const STATUS_META: Record<ContractStatus, { bg: string; fg: string }> = {
  '계약 예정': { bg: '#eff6ff', fg: '#2563eb' },
  계약중: { bg: '#ecfdf5', fg: '#059669' },
  만료: { bg: '#f4f4f5', fg: '#71717a' },
  해지: { bg: '#fef2f2', fg: '#dc2626' },
  종료: { bg: '#f4f4f5', fg: '#71717a' },
};

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function fmtM(n: number): string {
  return (n / 1000000).toFixed(0) + 'M';
}

export function isExpiringSoon(c: Contract): boolean {
  return c.dday !== null && c.dday >= 0 && c.dday <= 30;
}

export const FILTER_KEYS = ['전체', '계약 예정', '계약중', '만료 예정', '만료', '종료'] as const;
export type ContractFilterKey = (typeof FILTER_KEYS)[number];

export function computeCounts(contracts: Contract[]): Record<ContractFilterKey, number> {
  return {
    전체: contracts.length,
    '계약 예정': contracts.filter((c) => c.status === '계약 예정').length,
    계약중: contracts.filter((c) => c.status === '계약중').length,
    '만료 예정': contracts.filter(isExpiringSoon).length,
    만료: contracts.filter((c) => c.status === '만료').length,
    종료: contracts.filter((c) => c.status === '종료' || c.status === '해지').length,
  };
}

export function filterContracts(contracts: Contract[], filter: ContractFilterKey, q: string): Contract[] {
  return contracts.filter((c) => {
    if (filter === '만료 예정') {
      if (!isExpiringSoon(c)) return false;
    } else if (filter === '종료') {
      if (c.status !== '종료' && c.status !== '해지') return false;
    } else if (filter !== '전체' && c.status !== filter) return false;
    if (q && !(c.id.includes(q) || c.partner.includes(q) || c.name.includes(q))) return false;
    return true;
  });
}

export const CONTRACT_GRID_TEMPLATE = '96px 1fr 1fr 96px 130px 100px 92px 78px 74px 60px';
export const CONTRACT_GRID_MIN_WIDTH = '1220px';

export const CONTRACT_COLUMNS: GridColumn[] = [
  { label: '계약번호' },
  { label: '계약명' },
  { label: '거래처' },
  { label: '유형' },
  { label: '계약기간' },
  { label: '계약금액', align: 'right' },
  { label: '상태' },
  { label: '담당자' },
  { label: '만료' },
  { label: '관리' },
];

export function buildContractRowCells(c: Contract): Cell[] {
  const sm = STATUS_META[c.status];
  const ddayLabel = c.status === '만료' || c.status === '해지' || c.status === '종료' ? '-' : c.dday === null ? '-' : `D-${c.dday}`;
  const text = (t: Partial<TextCell> & Pick<TextCell, 'text'>): TextCell => ({ kind: 'text', numeric: true, ...t });
  const badge = (t: Omit<BadgeCell, 'kind'>): BadgeCell => ({ kind: 'badge', ...t });
  const link = (t: Omit<LinkCell, 'kind'>): LinkCell => ({ kind: 'link', ...t });
  return [
    text({ text: c.id, color: '#18181b', size: '12.5px', weight: 600 }),
    text({ text: c.name, color: '#18181b', size: '13px', weight: 600, numeric: false }),
    text({ text: c.partner, color: '#3f3f46', size: '12px', weight: 500, numeric: false }),
    text({ text: c.type, color: '#52525b', size: '12px', weight: 500, numeric: false }),
    text({ text: `${c.start.slice(2)} ~ ${c.end.slice(2)}`, color: '#71717a', size: '11.5px', weight: 500 }),
    text({ text: fmtM(c.amount), color: '#18181b', size: '12.5px', weight: 600, align: 'right' }),
    badge({ text: c.status, bg: sm.bg, fg: sm.fg }),
    text({ text: c.owner, color: '#52525b', size: '12px', weight: 500, numeric: false }),
    text({ text: ddayLabel, color: isExpiringSoon(c) ? '#d97706' : '#71717a', size: '11.5px', weight: isExpiringSoon(c) ? 700 : 500 }),
    link({ text: '상세', size: '12px' }),
  ];
}

export const CONTRACT_TABS: [string, string][] = [
  ['summary', '계약요약'],
  ['items', '계약항목'],
  ['price', '가격/단가'],
  ['terms', '거래조건'],
  ['fulfill', '이행현황'],
  ['orders', '발주/주문'],
  ['docs', '계약문서'],
  ['version', 'Version'],
  ['memo', '관리자메모'],
  ['history', '계약이력'],
];

export const ACCENT_MARK = `inset 0 -2px 0 ${ACCENT}`;

export const CONTRACTS: Contract[] = [
  {
    id: 'CT-00182',
    name: '2026년 기본 공급계약',
    partner: '회사 01',
    type: '공급 계약',
    status: '계약중',
    start: '2026.01.01',
    end: '2026.12.31',
    amount: 120000000,
    owner: 'admin01',
    dday: 134,
    items: [
      { name: '상품명 01', qty: 10000, used: 6200, unitPrice: 29000, moq: 'MOQ 100' },
      { name: '상품명 02', qty: 5000, used: 3100, unitPrice: 18000, moq: 'MOQ 50' },
    ],
    priceRows: [
      { name: '상품명 01', base: '32,000원', partner: '29,000원', contract: '27,500원' },
      { name: '상품명 02', base: '20,000원', partner: '19,000원', contract: '18,000원' },
    ],
    priceHistory: [
      { period: '2026.01.01 ~ 2026.10.31', price: '27,500원' },
      { period: '2026.11.01 ~', price: '26,800원' },
    ],
    termRows: [
      { label: '결제조건', base: '후불 30일', override: '후불 45일', weight: 700, fg: '#d97706' },
      { label: '최소 주문수량', base: '50개', override: '100개', weight: 700, fg: '#d97706' },
      { label: '납기', base: '7영업일', override: '5영업일', weight: 700, fg: '#d97706' },
      { label: '통화', base: 'KRW', override: 'KRW', weight: 500, fg: '#3f3f46' },
    ],
    specialTerms: '1. 발주 후 5영업일 이내 납품\n2. 월 구매량 1,000개 이상 조건\n3. 단가 적용은 계약기간 동안 유효',
    orderRows: [
      { po: 'PO-00182', order: 'O-00582', amount: '4.82M', status: '완료', bg: '#ecfdf5', fg: '#059669' },
      { po: 'PO-00191', order: 'O-00591', amount: '8.20M', status: '처리중', bg: '#eef2ff', fg: '#4f46e5' },
    ],
    docs: ['기본계약서.pdf', '단가합의서.pdf', '품목명세서.xlsx'],
    linkedQuote: 'RFQ-1028 → Q-00182 / V3',
    versions: [
      { label: 'V2 현재', note: '계약단가 변경', appliedAt: '2026.11.01 적용', amount: '120,000,000원' },
      { label: 'V1', note: '최초 계약', appliedAt: '2026.01.01', amount: '125,000,000원' },
    ],
    memos: [{ when: '2026.08.19', admin: 'admin01', text: '11월부터 상품01 계약단가 조정 예정.' }],
    history: [
      { when: '2025.12.10 10:10', action: '계약 작성', by: 'admin01' },
      { when: '2025.12.12 13:20', action: '승인 요청', by: 'admin01' },
      { when: '2025.12.15 09:20', action: '승인 완료', by: 'admin03' },
      { when: '2026.01.01', action: '계약 시작', by: 'system' },
      { when: '2026.10.15', action: '계약 변경 요청', by: 'admin01' },
      { when: '2026.11.01', action: '계약단가 변경 적용 (27,500 → 26,800)', by: 'admin01' },
    ],
    issue: null,
    arOutstanding: 0,
    openOrders: 0,
  },
  {
    id: 'CT-00181',
    name: '연간 공급계약',
    partner: '회사 02',
    type: '공급 계약',
    status: '계약중',
    start: '2026.03.01',
    end: '2026.08.31',
    amount: 82000000,
    owner: 'admin02',
    dday: 12,
    items: [{ name: '상품명 03', qty: 4000, used: 3600, unitPrice: 95000, moq: 'MOQ 1' }],
    priceRows: [{ name: '상품명 03', base: '98,000원', partner: '96,000원', contract: '95,000원' }],
    priceHistory: [{ period: '2026.03.01 ~', price: '95,000원' }],
    termRows: [
      { label: '결제조건', base: '후불 45일', override: '후불 45일', weight: 500, fg: '#3f3f46' },
      { label: '최소 주문수량', base: '1개', override: '1개', weight: 500, fg: '#3f3f46' },
      { label: '납기', base: '7영업일', override: '7영업일', weight: 500, fg: '#3f3f46' },
    ],
    specialTerms: '1. 대량 발주 조건으로 단가 인하 적용\n2. 계약 종료 30일 전 갱신 협의 필요',
    orderRows: [{ po: 'PO-00181', order: 'O-00581', amount: '7.60M', status: '완료', bg: '#ecfdf5', fg: '#059669' }],
    docs: ['기본계약서.pdf'],
    linkedQuote: '연결 없음 (직접 계약)',
    versions: [{ label: 'V1 현재', note: '최초 계약', appliedAt: '2026.03.01', amount: '82,000,000원' }],
    memos: [{ when: '2026.08.10', admin: 'admin02', text: '갱신 여부 8월 중 확인 필요.' }],
    history: [
      { when: '2026.02.20 11:00', action: '계약 작성', by: 'admin02' },
      { when: '2026.02.25 14:00', action: '승인 완료', by: 'admin03' },
      { when: '2026.03.01', action: '계약 시작', by: 'system' },
    ],
    issue: '계약 만료 D-12',
    arOutstanding: 0,
    openOrders: 0,
  },
  {
    id: 'CT-00175',
    name: '2026 상반기 단가계약',
    partner: '㈜한빛물산',
    type: '단가 계약',
    status: '계약 예정',
    start: '2026.09.01',
    end: '2027.02.28',
    amount: 30000000,
    owner: 'admin03',
    dday: null,
    items: [{ name: '상품명 05', qty: 3000, used: 0, unitPrice: 10000, moq: 'MOQ 20' }],
    priceRows: [{ name: '상품명 05', base: '12,000원', partner: '11,000원', contract: '10,000원' }],
    priceHistory: [{ period: '2026.09.01 ~', price: '10,000원' }],
    termRows: [
      { label: '결제조건', base: '선불', override: '선불', weight: 500, fg: '#3f3f46' },
      { label: '최소 주문수량', base: '10개', override: '20개', weight: 700, fg: '#d97706' },
    ],
    specialTerms: '1. 계약 시작 전 단가 확정 완료\n2. 계약 개시일 이전 발주 불가',
    orderRows: [],
    docs: ['기본계약서.pdf', '단가합의서.pdf'],
    linkedQuote: 'RFQ-1040 → Q-00201 / V1',
    versions: [{ label: 'V1 현재', note: '최초 계약', appliedAt: '2026.08.15', amount: '30,000,000원' }],
    memos: [],
    history: [
      { when: '2026.08.15 10:00', action: '계약 작성', by: 'admin03' },
      { when: '2026.08.18 15:00', action: '승인 완료', by: 'admin03' },
    ],
    issue: null,
    arOutstanding: 0,
    openOrders: 0,
  },
  {
    id: 'CT-00120',
    name: '2025 기간계약',
    partner: '대성유통',
    type: '기간 계약',
    status: '만료',
    start: '2025.09.01',
    end: '2026.08.31',
    amount: 45000000,
    owner: 'admin01',
    dday: -1,
    items: [{ name: '상품명 01', qty: 1500, used: 1500, unitPrice: 30000, moq: 'MOQ 10' }],
    priceRows: [{ name: '상품명 01', base: '32,000원', partner: '31,000원', contract: '30,000원' }],
    priceHistory: [{ period: '2025.09.01 ~ 2026.08.31', price: '30,000원' }],
    termRows: [
      { label: '결제조건', base: '선불', override: '선불', weight: 500, fg: '#3f3f46' },
      { label: '최소 주문수량', base: '10개', override: '10개', weight: 500, fg: '#3f3f46' },
    ],
    specialTerms: '1. 계약기간 내 총 1,500개 이행 완료',
    orderRows: [
      { po: 'PO-00120', order: 'O-00460', amount: '12.0M', status: '완료', bg: '#ecfdf5', fg: '#059669' },
      { po: 'PO-00135', order: 'O-00490', amount: '15.0M', status: '완료', bg: '#ecfdf5', fg: '#059669' },
    ],
    docs: ['기본계약서.pdf', '거래명세서.pdf'],
    linkedQuote: '연결 없음 (직접 계약)',
    versions: [{ label: 'V1 현재', note: '최초 계약', appliedAt: '2025.09.01', amount: '45,000,000원' }],
    memos: [],
    history: [
      { when: '2025.08.20 09:00', action: '계약 작성', by: 'admin01' },
      { when: '2025.09.01', action: '계약 시작', by: 'system' },
      { when: '2026.08.31', action: '계약 만료', by: 'system' },
    ],
    issue: '갱신 미확정',
    arOutstanding: 0,
    openOrders: 0,
  },
  {
    id: 'CT-00098',
    name: '단가 협의 계약',
    partner: '케이스퀘어',
    type: '단가 계약',
    status: '해지',
    start: '2025.05.01',
    end: '2026.04.30',
    amount: 8000000,
    owner: 'admin02',
    dday: null,
    items: [{ name: '상품명 03', qty: 200, used: 120, unitPrice: 100000, moq: 'MOQ 1' }],
    priceRows: [{ name: '상품명 03', base: '110,000원', partner: '105,000원', contract: '100,000원' }],
    priceHistory: [{ period: '2025.05.01 ~ 2025.12.20', price: '100,000원' }],
    termRows: [{ label: '결제조건', base: '선불', override: '선불', weight: 500, fg: '#3f3f46' }],
    specialTerms: '1. 거래처 요청으로 계약 중도 해지',
    orderRows: [{ po: 'PO-00098', order: 'O-00300', amount: '12.0M', status: '완료', bg: '#ecfdf5', fg: '#059669' }],
    docs: ['기본계약서.pdf', '해지합의서.pdf'],
    linkedQuote: '연결 없음 (직접 계약)',
    versions: [{ label: 'V1 현재', note: '최초 계약', appliedAt: '2025.05.01', amount: '8,000,000원' }],
    memos: [{ when: '2025.12.20', admin: 'admin02', text: '거래처 경영 사정으로 계약 해지 요청.' }],
    history: [
      { when: '2025.04.20 09:00', action: '계약 작성', by: 'admin02' },
      { when: '2025.05.01', action: '계약 시작', by: 'system' },
      { when: '2025.12.20', action: '계약 해지', by: 'admin03', note: '거래처 요청' },
    ],
    issue: null,
    arOutstanding: 0,
    openOrders: 0,
  },
];
