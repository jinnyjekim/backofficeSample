import type { BadgeCell, Cell, GridColumn, LinkCell, TextCell } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';

export type TermsStatus = '적용예정' | '적용중' | '종료';

export interface TermsVersion {
  label: string;
  period: string;
  summary: string;
}

export interface TermsHistoryEntry {
  when: string;
  action: string;
  by: string;
}

export interface PendingTermsChange {
  applyAt: string;
}

export interface TradeTerms {
  id: string;
  contract: string;
  partner: string;
  start: string;
  end: string;
  payBase: string;
  payOverride: string;
  moqBase: string;
  moqOverride: string;
  unitBase: string;
  unitOverride: string;
  leadBase: string;
  leadOverride: string;
  minAmountBase: string;
  minAmountOverride: string;
  creditBase: string;
  creditOverride: string;
  overdueRule: string;
  taxType: string;
  invoicing: string;
  settlement: string;
  versions: TermsVersion[];
  history: TermsHistoryEntry[];
  pendingChange: PendingTermsChange | null;
  issue: string | null;
}

export interface TradeTermsCalc extends TradeTerms {
  status: TermsStatus;
  bg: string;
  fg: string;
  hasIssue: boolean;
}

export const TODAY = new Date('2026-08-19');

function parseDot(d: string): Date {
  return new Date(d.replace(/\./g, '-'));
}

export function withCalc(list: TradeTerms[]): TradeTermsCalc[] {
  return list.map((c) => {
    const startD = parseDot(c.start);
    const endD = parseDot(c.end);
    let status: TermsStatus;
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
    return { ...c, status, bg, fg, hasIssue: !!c.issue };
  });
}

export const FILTER_KEYS = ['전체', '적용중', '적용예정', '변경예정', '종료', '이슈'] as const;
export type TermsFilterKey = (typeof FILTER_KEYS)[number];

export function computeCounts(list: TradeTermsCalc[]): Record<TermsFilterKey, number> {
  return {
    전체: list.length,
    적용중: list.filter((c) => c.status === '적용중').length,
    적용예정: list.filter((c) => c.status === '적용예정').length,
    변경예정: list.filter((c) => !!c.pendingChange).length,
    종료: list.filter((c) => c.status === '종료').length,
    이슈: list.filter((c) => c.hasIssue).length,
  };
}

export function filterList(list: TradeTermsCalc[], filter: TermsFilterKey, q: string): TradeTermsCalc[] {
  return list.filter((c) => {
    if (filter === '변경예정') {
      if (!c.pendingChange) return false;
    } else if (filter === '이슈') {
      if (!c.hasIssue) return false;
    } else if (filter !== '전체' && c.status !== filter) return false;
    if (q && !(c.contract.includes(q) || c.partner.includes(q))) return false;
    return true;
  });
}

export const TERMS_GRID_TEMPLATE = '80px minmax(150px,1fr) 68px 80px 56px 62px 124px 76px 60px';
export const TERMS_GRID_MIN_WIDTH = '810px';

export const TERMS_COLUMNS: GridColumn[] = [
  { label: '계약번호' },
  { label: '거래처' },
  { label: '결제조건' },
  { label: '주문조건' },
  { label: '납기' },
  { label: '신용조건' },
  { label: '적용기간' },
  { label: '상태' },
  { label: '관리' },
];

export function buildTermsRowCells(c: TradeTermsCalc): Cell[] {
  const text = (t: Partial<TextCell> & Pick<TextCell, 'text'>): TextCell => ({ kind: 'text', numeric: true, ...t });
  const badge = (t: Omit<BadgeCell, 'kind'>): BadgeCell => ({ kind: 'badge', ...t });
  const link = (t: Omit<LinkCell, 'kind'>): LinkCell => ({ kind: 'link', ...t });
  return [
    text({ text: c.contract, color: '#18181b', size: '12.5px', weight: 600 }),
    text({ text: c.partner, color: '#18181b', size: '13px', weight: 600, numeric: false }),
    text({ text: c.payOverride, color: '#3f3f46', size: '12px', weight: 500, numeric: false }),
    text({ text: `MOQ ${c.moqOverride}`, color: '#3f3f46', size: '12px', weight: 500, numeric: false }),
    text({ text: c.leadOverride, color: '#71717a', size: '11.5px', weight: 500, numeric: false }),
    text({ text: c.creditOverride === '미사용' ? '미사용' : '별도 한도', color: '#71717a', size: '11.5px', weight: 500, numeric: false }),
    text({ text: `${c.start.slice(2)}~${c.end.slice(2)}`, color: '#71717a', size: '11.5px', weight: 500 }),
    badge({ text: c.status, bg: c.bg, fg: c.fg }),
    link({ text: '상세', size: '12px' }),
  ];
}

export const TERMS_TABS: [string, string][] = [
  ['compare', '조건요약'],
  ['payment', '결제'],
  ['orderCond', '주문/납품'],
  ['credit', '신용/세금'],
  ['version', 'Version'],
  ['history', '변경이력'],
];

export const ACCENT_MARK = `inset 0 -2px 0 ${ACCENT}`;

export const TRADE_TERMS: TradeTerms[] = [
  {
    id: 'CONDITION-00182',
    contract: 'CT-00182',
    partner: '회사 01',
    start: '2026.09.01',
    end: '2027.08.31',
    payBase: '후불 30일',
    payOverride: '후불 45일',
    moqBase: '50개',
    moqOverride: '100개',
    unitBase: '10개',
    unitOverride: '20개',
    leadBase: '7영업일',
    leadOverride: '5영업일',
    minAmountBase: '없음',
    minAmountOverride: '500,000원',
    creditBase: '50,000,000원 (기본)',
    creditOverride: '80,000,000원 (계약 별도)',
    overdueRule: '승인 필요',
    taxType: 'VAT 별도',
    invoicing: '월말 합산 발행',
    settlement: '해당없음',
    versions: [
      { label: 'V2 현재', period: '2026.09.01 ~ 2027.08.31', summary: '후불 45일 · MOQ 100 · 납기 5영업일' },
      { label: 'V1', period: '2026.01.01 ~ 2026.08.31', summary: '후불 30일 · MOQ 50 · 납기 7영업일' },
    ],
    history: [
      { when: '2026.08.19', action: '거래조건 변경 (결제 30→45일, MOQ 50→100, 납기 7→5일)', by: 'admin01' },
      { when: '2026.01.01', action: '거래조건 최초 등록', by: 'admin01' },
    ],
    pendingChange: null,
    issue: null,
  },
  {
    id: 'CONDITION-00181',
    contract: 'CT-00181',
    partner: '회사 02',
    start: '2026.03.01',
    end: '2026.08.31',
    payBase: '후불 45일',
    payOverride: '선결제',
    moqBase: '없음',
    moqOverride: '없음',
    unitBase: '1개',
    unitOverride: '1개',
    leadBase: '7영업일',
    leadOverride: '7영업일',
    minAmountBase: '없음',
    minAmountOverride: '없음',
    creditBase: '30,000,000원 (기본)',
    creditOverride: '미사용',
    overdueRule: '해당없음',
    taxType: 'VAT 별도',
    invoicing: '건별 발행',
    settlement: '해당없음',
    versions: [{ label: 'V1 현재', period: '2026.03.01 ~ 2026.08.31', summary: '선결제 · MOQ 없음 · 납기 7영업일' }],
    history: [{ when: '2026.03.01', action: '거래조건 최초 등록', by: 'admin02' }],
    pendingChange: null,
    issue: '계약 만료 D-12',
  },
  {
    id: 'CONDITION-00175',
    contract: 'CT-00175',
    partner: '㈜한빛물산',
    start: '2026.09.01',
    end: '2027.02.28',
    payBase: '선결제',
    payOverride: '선결제',
    moqBase: '10개',
    moqOverride: '20개',
    unitBase: '5개',
    unitOverride: '5개',
    leadBase: '7영업일',
    leadOverride: '7영업일',
    minAmountBase: '없음',
    minAmountOverride: '없음',
    creditBase: '미사용',
    creditOverride: '미사용',
    overdueRule: '해당없음',
    taxType: 'VAT 별도',
    invoicing: '건별 발행',
    settlement: '해당없음',
    versions: [{ label: 'V1 적용예정', period: '2026.09.01 ~ 2027.02.28', summary: '선결제 · MOQ 20 · 납기 7영업일' }],
    history: [{ when: '2026.08.15', action: '거래조건 등록 (적용예정)', by: 'admin03' }],
    pendingChange: null,
    issue: null,
  },
  {
    id: 'CONDITION-00120',
    contract: 'CT-00120',
    partner: '대성유통',
    start: '2025.09.01',
    end: '2026.12.31',
    payBase: '선결제',
    payOverride: '선결제',
    moqBase: '10개',
    moqOverride: '10개',
    unitBase: '5개',
    unitOverride: '5개',
    leadBase: '7영업일',
    leadOverride: '7영업일',
    minAmountBase: '없음',
    minAmountOverride: '없음',
    creditBase: '미사용',
    creditOverride: '미사용',
    overdueRule: '해당없음',
    taxType: 'VAT 별도',
    invoicing: '건별 발행',
    settlement: '해당없음',
    versions: [{ label: 'V1 종료', period: '2025.09.01 ~ 2026.12.31', summary: '선결제 · MOQ 10 · 납기 7영업일' }],
    history: [{ when: '2025.09.01', action: '거래조건 최초 등록', by: 'admin01' }],
    pendingChange: null,
    issue: '계약기간(~2026.08.31)보다 조건 적용기간이 깁니다',
  },
  {
    id: 'CONDITION-00098',
    contract: 'CT-00098',
    partner: '케이스퀘어',
    start: '2025.05.01',
    end: '2025.12.20',
    payBase: '선결제',
    payOverride: '선결제',
    moqBase: '1개',
    moqOverride: '1개',
    unitBase: '1개',
    unitOverride: '1개',
    leadBase: '7영업일',
    leadOverride: '7영업일',
    minAmountBase: '없음',
    minAmountOverride: '없음',
    creditBase: '미사용',
    creditOverride: '미사용',
    overdueRule: '해당없음',
    taxType: 'VAT 별도',
    invoicing: '건별 발행',
    settlement: '해당없음',
    versions: [{ label: 'V1 종료', period: '2025.05.01 ~ 2025.12.20', summary: '선결제 · MOQ 1 · 납기 7영업일' }],
    history: [
      { when: '2025.05.01', action: '거래조건 최초 등록', by: 'admin02' },
      { when: '2025.12.20', action: '계약 해지로 조건 종료', by: 'admin03' },
    ],
    pendingChange: null,
    issue: null,
  },
  {
    id: 'CONDITION-00182B',
    contract: 'CT-00182',
    partner: '회사 01',
    start: '2027.09.01',
    end: '2028.02.28',
    payBase: '후불 30일',
    payOverride: '후불 60일',
    moqBase: '50개',
    moqOverride: '150개',
    unitBase: '10개',
    unitOverride: '30개',
    leadBase: '7영업일',
    leadOverride: '4영업일',
    minAmountBase: '없음',
    minAmountOverride: '1,000,000원',
    creditBase: '50,000,000원 (기본)',
    creditOverride: '100,000,000원 (계약 별도)',
    overdueRule: '승인 필요',
    taxType: 'VAT 별도',
    invoicing: '월말 합산 발행',
    settlement: '해당없음',
    versions: [{ label: 'V1 적용예정', period: '2027.09.01 ~ 2028.02.28', summary: '후불 60일 · MOQ 150 · 납기 4영업일' }],
    history: [{ when: '2026.08.19', action: '변경 예약 등록 (2027.09.01 적용)', by: 'admin01' }],
    pendingChange: { applyAt: '2027.09.01' },
    issue: '승인 대기',
  },
];
