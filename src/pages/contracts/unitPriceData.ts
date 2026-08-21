import type { BadgeCell, Cell, GridColumn, LinkCell, TextCell } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';

export type PriceStatus = '적용예정' | '적용중' | '종료';

export interface QtyTier {
  range: string;
  price: string;
}

export interface PriceUsage {
  orders: number;
  qty: number;
  amount: number;
  recent: string;
}

export interface PriceVersion {
  label: string;
  period: string;
  price: string;
}

export interface PriceHistoryEntry {
  when: string;
  action: string;
  by: string;
}

export interface PendingPriceChange {
  price: number;
  start: string;
}

export interface UnitPrice {
  id: string;
  contract: string;
  partner: string;
  product: string;
  code: string;
  base: number;
  partnerPrice: number;
  quotePrice: number;
  price: number;
  start: string;
  end: string;
  owner: string;
  qtyTiers: QtyTier[];
  usage: PriceUsage;
  versions: PriceVersion[];
  history: PriceHistoryEntry[];
  pendingChange: PendingPriceChange | null;
  issue?: string;
}

export interface UnitPriceCalc extends UnitPrice {
  status: PriceStatus;
  bg: string;
  fg: string;
  diffPct: number;
  hasIssue: boolean;
}

export const TODAY = new Date('2026-08-19');

function parseDot(d: string): Date {
  return new Date(d.replace(/\./g, '-'));
}

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function withCalc(prices: UnitPrice[]): UnitPriceCalc[] {
  return prices.map((p) => {
    const startD = parseDot(p.start);
    const endD = parseDot(p.end);
    let status: PriceStatus;
    let bg: string;
    let fg: string;
    if (TODAY < startD) {
      status = '적용예정';
      bg = '#eff6ff';
      fg = '#2563eb';
    } else if (TODAY > endD) {
      status = '종료';
      bg = '#f4f4f5';
      fg = '#71717a';
    } else {
      status = '적용중';
      bg = '#ecfdf5';
      fg = '#059669';
    }
    const diffPct = Math.round(((p.price - p.base) / p.base) * 1000) / 10;
    return { ...p, status, bg, fg, diffPct, hasIssue: !!p.issue };
  });
}

export const FILTER_KEYS = ['전체', '적용중', '적용예정', '변경예정', '종료', '이슈'] as const;
export type PriceFilterKey = (typeof FILTER_KEYS)[number];

export function computeCounts(list: UnitPriceCalc[]): Record<PriceFilterKey, number> {
  return {
    전체: list.length,
    적용중: list.filter((p) => p.status === '적용중').length,
    적용예정: list.filter((p) => p.status === '적용예정').length,
    변경예정: list.filter((p) => !!p.pendingChange).length,
    종료: list.filter((p) => p.status === '종료').length,
    이슈: list.filter((p) => p.hasIssue).length,
  };
}

export function filterList(list: UnitPriceCalc[], filter: PriceFilterKey, q: string): UnitPriceCalc[] {
  return list.filter((p) => {
    if (filter === '변경예정') {
      if (!p.pendingChange) return false;
    } else if (filter === '이슈') {
      if (!p.hasIssue) return false;
    } else if (filter !== '전체' && p.status !== filter) return false;
    if (q && !(p.contract.includes(q) || p.partner.includes(q) || p.product.includes(q))) return false;
    return true;
  });
}

export const PRICE_GRID_TEMPLATE = '96px 1fr 1fr 96px 96px 84px 122px 84px 88px 60px';
export const PRICE_GRID_MIN_WIDTH = '1240px';

export const PRICE_COLUMNS: GridColumn[] = [
  { label: '계약번호' },
  { label: '거래처' },
  { label: '상품' },
  { label: '기준가' },
  { label: '계약단가' },
  { label: '차이' },
  { label: '적용기간' },
  { label: '상태' },
  { label: '변경예정' },
  { label: '관리' },
];

export function buildPriceRowCells(p: UnitPriceCalc): Cell[] {
  const text = (t: Partial<TextCell> & Pick<TextCell, 'text'>): TextCell => ({ kind: 'text', numeric: true, ...t });
  const badge = (t: Omit<BadgeCell, 'kind'>): BadgeCell => ({ kind: 'badge', ...t });
  const link = (t: Omit<LinkCell, 'kind'>): LinkCell => ({ kind: 'link', ...t });
  const pendingText = p.pendingChange ? p.pendingChange.start : p.hasIssue ? '⚠ 이슈' : '-';
  const pendingColor = p.pendingChange ? '#d97706' : p.hasIssue ? '#dc2626' : '#a1a1aa';
  return [
    text({ text: p.contract, color: '#18181b', size: '12.5px', weight: 600 }),
    text({ text: p.partner, color: '#18181b', size: '13px', weight: 600, numeric: false }),
    text({ text: p.product, color: '#3f3f46', size: '12px', weight: 500, numeric: false }),
    text({ text: fmtWon(p.base), color: '#a1a1aa', size: '11.5px', weight: 500 }),
    text({ text: fmtWon(p.price), color: '#18181b', size: '12.5px', weight: 700 }),
    text({ text: `${p.diffPct}%`, color: p.diffPct < 0 ? '#dc2626' : '#71717a', size: '11.5px', weight: 600 }),
    text({ text: `${p.start.slice(5)}~${p.end.slice(5)}`, color: '#71717a', size: '11.5px', weight: 500 }),
    badge({ text: p.status, bg: p.bg, fg: p.fg }),
    text({ text: pendingText, color: pendingColor, size: '11.5px', weight: 500 }),
    link({ text: '상세', size: '12px' }),
  ];
}

export const PRICE_TABS: [string, string][] = [
  ['info', '기본정보'],
  ['compare', '가격비교'],
  ['conditions', '적용조건'],
  ['qty', '수량조건'],
  ['usage', '주문적용'],
  ['version', 'Version'],
  ['history', '변경이력'],
];

export const ACCENT_MARK = `inset 0 -2px 0 ${ACCENT}`;

export const UNIT_PRICES: UnitPrice[] = [
  {
    id: 'PRICE-CT-00128',
    contract: 'CT-00182',
    partner: '회사 01',
    product: '상품 01',
    code: 'P-00128',
    base: 32000,
    partnerPrice: 29000,
    quotePrice: 28000,
    price: 27500,
    start: '2026.09.01',
    end: '2026.12.31',
    owner: 'admin01',
    qtyTiers: [
      { range: '1 ~ 99개', price: '29,000원' },
      { range: '100 ~ 499개', price: '27,500원' },
      { range: '500개 이상', price: '25,800원' },
    ],
    usage: { orders: 42, qty: 8240, amount: 226600000, recent: '2026.08.18' },
    versions: [
      { label: 'V2 적용중', period: '2026.09.01 ~ 2026.12.31', price: '27,500원' },
      { label: 'V1', period: '2026.01.01 ~ 2026.08.31', price: '29,000원' },
    ],
    history: [
      { when: '2026.08.20', action: '계약단가 변경 (29,000 → 27,500)', by: 'admin01' },
      { when: '2026.01.01', action: '계약단가 최초 등록 (29,000원)', by: 'admin01' },
    ],
    pendingChange: null,
  },
  {
    id: 'PRICE-CT-00129',
    contract: 'CT-00182',
    partner: '회사 01',
    product: '상품 02',
    code: 'P-00129',
    base: 18000,
    partnerPrice: 17500,
    quotePrice: 16500,
    price: 16500,
    start: '2026.09.01',
    end: '2026.12.31',
    owner: 'admin01',
    qtyTiers: [{ range: '전 수량', price: '16,500원' }],
    usage: { orders: 31, qty: 5100, amount: 84150000, recent: '2026.08.16' },
    versions: [
      { label: 'V2 적용중', period: '2026.09.01 ~ 2026.12.31', price: '16,500원' },
      { label: 'V1', period: '2026.01.01 ~ 2026.08.31', price: '17,500원' },
    ],
    history: [{ when: '2026.08.20', action: '계약단가 변경 (17,500 → 16,500)', by: 'admin01' }],
    pendingChange: { price: 16000, start: '2027.01.01' },
  },
  {
    id: 'PRICE-CT-00181A',
    contract: 'CT-00181',
    partner: '회사 02',
    product: '상품 03',
    code: 'P-00140',
    base: 98000,
    partnerPrice: 96000,
    quotePrice: 95000,
    price: 95000,
    start: '2026.03.01',
    end: '2026.08.31',
    owner: 'admin02',
    qtyTiers: [{ range: '전 수량', price: '95,000원' }],
    usage: { orders: 8, qty: 640, amount: 60800000, recent: '2026.08.05' },
    versions: [{ label: 'V1 적용중', period: '2026.03.01 ~ 2026.08.31', price: '95,000원' }],
    history: [{ when: '2026.03.01', action: '계약단가 최초 등록 (95,000원)', by: 'admin02' }],
    pendingChange: null,
    issue: '계약 만료 D-12',
  },
  {
    id: 'PRICE-CT-00175A',
    contract: 'CT-00175',
    partner: '㈜한빛물산',
    product: '상품 05',
    code: 'P-00160',
    base: 12000,
    partnerPrice: 11000,
    quotePrice: 10000,
    price: 10000,
    start: '2026.09.01',
    end: '2027.02.28',
    owner: 'admin03',
    qtyTiers: [
      { range: '1 ~ 19개', price: '11,000원' },
      { range: '20개 이상', price: '10,000원' },
    ],
    usage: { orders: 0, qty: 0, amount: 0, recent: '-' },
    versions: [{ label: 'V1 적용예정', period: '2026.09.01 ~ 2027.02.28', price: '10,000원' }],
    history: [{ when: '2026.08.15', action: '계약단가 등록 (적용예정)', by: 'admin03' }],
    pendingChange: null,
  },
  {
    id: 'PRICE-CT-00120A',
    contract: 'CT-00120',
    partner: '대성유통',
    product: '상품 01',
    code: 'P-00128',
    base: 32000,
    partnerPrice: 31000,
    quotePrice: 30000,
    price: 30000,
    start: '2025.09.01',
    end: '2026.08.31',
    owner: 'admin01',
    qtyTiers: [{ range: '전 수량', price: '30,000원' }],
    usage: { orders: 24, qty: 1500, amount: 45000000, recent: '2026.08.10' },
    versions: [{ label: 'V1 종료', period: '2025.09.01 ~ 2026.08.31', price: '30,000원' }],
    history: [{ when: '2025.09.01', action: '계약단가 최초 등록 (30,000원)', by: 'admin01' }],
    pendingChange: null,
    issue: '계약기간 초과 (단가 종료일이 계약과 일치하지 않음)',
  },
];
