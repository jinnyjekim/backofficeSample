import type { BadgeCell, Cell, GridColumn, LinkCell, TextCell } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';

export type PeriodContractStatus = '계약중' | '계약 예정' | '만료' | '해지';
export type RenewalStatus = '검토전' | '검토중' | '갱신완료' | '갱신안함' | '해당없음';
export type PeriodStatus = '조기 종료' | '시작 예정' | '만료' | '만료 임박' | '유효';

export interface PeriodHistoryEntry {
  when: string;
  action: string;
  by: string;
  note?: string;
}

export interface PeriodLinkedField {
  label: string;
  value: string;
}

export interface PeriodGap {
  days: number;
  range: string;
}

export interface PeriodContract {
  id: string;
  partner: string;
  name: string;
  status: PeriodContractStatus;
  start: string;
  end: string;
  renewal: RenewalStatus;
  owner: string;
  successor: string | null;
  gap: PeriodGap | null;
  linked: PeriodLinkedField[];
  history: PeriodHistoryEntry[];
}

export interface PeriodContractCalc extends PeriodContract {
  startD: Date;
  endD: Date;
  totalDays: number;
  remain: number;
  elapsed: number;
  periodStatus: PeriodStatus;
  periodBg: string;
  periodFg: string;
}

export const TODAY = new Date('2026-08-19');

function dayDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function fmtDate(d: string): string {
  return d.replace(/-/g, '.');
}

export const RENEWAL_META: Record<RenewalStatus, { bg: string; fg: string }> = {
  검토전: { bg: '#f4f4f5', fg: '#71717a' },
  검토중: { bg: '#fffbeb', fg: '#d97706' },
  갱신완료: { bg: '#ecfdf5', fg: '#059669' },
  갱신안함: { bg: '#fef2f2', fg: '#dc2626' },
  해당없음: { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export function withCalc(contracts: PeriodContract[]): PeriodContractCalc[] {
  return contracts.map((c) => {
    const startD = new Date(c.start);
    const endD = new Date(c.end);
    const totalDays = dayDiff(startD, endD);
    const remain = dayDiff(TODAY, endD);
    const elapsed = dayDiff(startD, TODAY);
    let periodStatus: PeriodStatus;
    let periodBg: string;
    let periodFg: string;
    if (c.status === '해지') {
      periodStatus = '조기 종료';
      periodBg = '#fef2f2';
      periodFg = '#dc2626';
    } else if (TODAY < startD) {
      periodStatus = '시작 예정';
      periodBg = '#eff6ff';
      periodFg = '#2563eb';
    } else if (TODAY > endD) {
      periodStatus = '만료';
      periodBg = '#f4f4f5';
      periodFg = '#71717a';
    } else if (remain <= 30) {
      periodStatus = '만료 임박';
      periodBg = '#fffbeb';
      periodFg = '#d97706';
    } else {
      periodStatus = '유효';
      periodBg = '#ecfdf5';
      periodFg = '#059669';
    }
    return { ...c, startD, endD, totalDays, remain, elapsed, periodStatus, periodBg, periodFg };
  });
}

export const FILTER_KEYS = ['전체', '시작 예정', '계약중', '30일 내 만료', '갱신 검토', '만료'] as const;
export type PeriodFilterKey = (typeof FILTER_KEYS)[number];

export function computeCounts(list: PeriodContractCalc[]): Record<PeriodFilterKey, number> {
  return {
    전체: list.length,
    '시작 예정': list.filter((c) => c.periodStatus === '시작 예정').length,
    계약중: list.filter((c) => c.status === '계약중').length,
    '30일 내 만료': list.filter((c) => c.periodStatus === '만료 임박').length,
    '갱신 검토': list.filter((c) => c.renewal === '검토전' || c.renewal === '검토중').length,
    만료: list.filter((c) => c.periodStatus === '만료').length,
  };
}

export function filterList(list: PeriodContractCalc[], filter: PeriodFilterKey, q: string): PeriodContractCalc[] {
  return list.filter((c) => {
    if (filter === '시작 예정' && c.periodStatus !== '시작 예정') return false;
    else if (filter === '계약중' && c.status !== '계약중') return false;
    else if (filter === '30일 내 만료' && c.periodStatus !== '만료 임박') return false;
    else if (filter === '갱신 검토' && !(c.renewal === '검토전' || c.renewal === '검토중')) return false;
    else if (filter === '만료' && c.periodStatus !== '만료') return false;
    if (q && !(c.id.includes(q) || c.partner.includes(q) || c.name.includes(q))) return false;
    return true;
  });
}

export const PERIOD_GRID_TEMPLATE = '96px 1fr 1fr 92px 92px 88px 90px 84px 78px 60px';
export const PERIOD_GRID_MIN_WIDTH = '1220px';

export const PERIOD_COLUMNS: GridColumn[] = [
  { label: '계약번호' },
  { label: '거래처' },
  { label: '계약명' },
  { label: '시작일' },
  { label: '종료일' },
  { label: '잔여기간' },
  { label: '갱신' },
  { label: '상태' },
  { label: '담당자' },
  { label: '관리' },
];

export function buildPeriodRowCells(c: PeriodContractCalc): Cell[] {
  const rm = RENEWAL_META[c.renewal];
  const ddayLabel =
    c.periodStatus === '만료'
      ? `만료 +${Math.abs(c.remain)}일`
      : c.periodStatus === '시작 예정'
        ? `D-${Math.abs(dayDiff(TODAY, c.startD))}`
        : `D-${c.remain}`;
  const text = (t: Partial<TextCell> & Pick<TextCell, 'text'>): TextCell => ({ kind: 'text', numeric: true, ...t });
  const badge = (t: Omit<BadgeCell, 'kind'>): BadgeCell => ({ kind: 'badge', ...t });
  const link = (t: Omit<LinkCell, 'kind'>): LinkCell => ({ kind: 'link', ...t });
  return [
    text({ text: c.id, color: '#18181b', size: '12.5px', weight: 600 }),
    text({ text: c.partner, color: '#18181b', size: '13px', weight: 600, numeric: false }),
    text({ text: c.name, color: '#3f3f46', size: '12px', weight: 500, numeric: false }),
    text({ text: fmtDate(c.start), color: '#71717a', size: '11.5px', weight: 500 }),
    text({ text: fmtDate(c.end), color: '#71717a', size: '11.5px', weight: 500 }),
    text({ text: ddayLabel, color: c.periodStatus === '만료 임박' ? '#d97706' : '#3f3f46', size: '11.5px', weight: c.periodStatus === '만료 임박' ? 700 : 500 }),
    badge({ text: c.renewal, bg: rm.bg, fg: rm.fg }),
    badge({ text: c.periodStatus, bg: c.periodBg, fg: c.periodFg }),
    text({ text: c.owner, color: '#52525b', size: '12px', weight: 500, numeric: false }),
    link({ text: '상세', size: '12px' }),
  ];
}

export const PERIOD_TABS: [string, string][] = [
  ['summary', '기간요약'],
  ['renewal', '갱신정보'],
  ['linked', '연결업무'],
  ['history', '변경이력'],
];

export const ACCENT_MARK = `inset 0 -2px 0 ${ACCENT}`;

export const PERIOD_CONTRACTS: PeriodContract[] = [
  {
    id: 'CT-00182',
    partner: '회사 01',
    name: '2026년 기본 공급계약',
    status: '계약중',
    start: '2026-01-01',
    end: '2026-12-31',
    renewal: '검토전',
    owner: 'admin01',
    successor: null,
    gap: null,
    linked: [
      { label: '진행중 발주', value: '2건' },
      { label: '처리중 주문', value: '1건' },
      { label: '예약 납품', value: '3건' },
    ],
    history: [{ when: '2025.12.10', action: '계약기간 등록 (2026.01.01 ~ 2026.12.31)', by: 'admin01' }],
  },
  {
    id: 'CT-00181',
    partner: '회사 02',
    name: '연간 공급계약',
    status: '계약중',
    start: '2026-03-01',
    end: '2026-08-31',
    renewal: '검토중',
    owner: 'admin02',
    successor: null,
    gap: null,
    linked: [
      { label: '진행중 발주', value: '1건' },
      { label: '처리중 주문', value: '0건' },
      { label: '예약 납품', value: '0건' },
    ],
    history: [
      { when: '2026.02.20', action: '계약기간 등록 (2026.03.01 ~ 2026.08.31)', by: 'admin02' },
      { when: '2026.08.05', action: '갱신 검토 시작', by: 'admin02', note: '조건 변경 후 갱신' },
    ],
  },
  {
    id: 'CT-00175',
    partner: '㈜한빛물산',
    name: '2026 상반기 단가계약',
    status: '계약 예정',
    start: '2026-09-01',
    end: '2027-02-28',
    renewal: '해당없음',
    owner: 'admin03',
    successor: null,
    gap: null,
    linked: [
      { label: '진행중 발주', value: '0건' },
      { label: '처리중 주문', value: '0건' },
      { label: '예약 납품', value: '0건' },
    ],
    history: [{ when: '2026.08.15', action: '계약기간 등록 (2026.09.01 ~ 2027.02.28)', by: 'admin03' }],
  },
  {
    id: 'CT-00120',
    partner: '대성유통',
    name: '2025 기간계약',
    status: '만료',
    start: '2025-09-01',
    end: '2026-08-31',
    renewal: '갱신완료',
    owner: 'admin01',
    successor: 'CT-00241 · 2026.09.01 ~ 2027.08.31',
    gap: { days: 1, range: '없음' },
    linked: [
      { label: '진행중 발주', value: '0건' },
      { label: '처리중 주문', value: '0건' },
      { label: '예약 납품', value: '0건' },
    ],
    history: [
      { when: '2025.08.20', action: '계약기간 등록 (2025.09.01 ~ 2026.08.31)', by: 'admin01' },
      { when: '2026.07.10', action: '갱신 검토 시작', by: 'admin01' },
      { when: '2026.08.01', action: '후속 계약 CT-00241 생성', by: 'admin01' },
    ],
  },
  {
    id: 'CT-00098',
    partner: '케이스퀘어',
    name: '단가 협의 계약',
    status: '해지',
    start: '2025-05-01',
    end: '2026-04-30',
    renewal: '갱신안함',
    owner: 'admin02',
    successor: null,
    gap: null,
    linked: [
      { label: '진행중 발주', value: '0건' },
      { label: '처리중 주문', value: '0건' },
      { label: '예약 납품', value: '0건' },
    ],
    history: [
      { when: '2025.04.20', action: '계약기간 등록 (2025.05.01 ~ 2026.04.30)', by: 'admin02' },
      { when: '2025.12.20', action: '계약 해지로 기간 조기 종료', by: 'admin03', note: '거래처 요청' },
    ],
  },
  {
    id: 'CT-00241',
    partner: '대성유통',
    name: '2026 기간계약 (재계약)',
    status: '계약 예정',
    start: '2026-09-01',
    end: '2027-08-31',
    renewal: '해당없음',
    owner: 'admin01',
    successor: null,
    gap: null,
    linked: [
      { label: '진행중 발주', value: '0건' },
      { label: '처리중 주문', value: '0건' },
      { label: '예약 납품', value: '0건' },
    ],
    history: [{ when: '2026.08.01', action: '계약기간 등록 (2026.09.01 ~ 2027.08.31)', by: 'admin01', note: 'CT-00120 후속 계약' }],
  },
];
