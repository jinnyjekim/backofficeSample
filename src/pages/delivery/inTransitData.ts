import type { HistoryEntry, Memo, TrackingEntry } from './deliverySharedData';

export interface TransitItem {
  name: string;
  qty: number;
}

export interface TransitShipment {
  id: string;
  order: string;
  receiver: string;
  region: string;
  carrier: string;
  invoiceNo: string;
  internalStatus: string;
  carrierStatus: string;
  lastLoc: string;
  lastAt: string;
  eta: string;
  etaOrig: string;
  mismatch: boolean;
  items: TransitItem[];
  address: string;
  reqNote: string;
  tracking: TrackingEntry[];
  issueList: string[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const NOW = new Date('2026-08-20T10:00:00');

export const STATUS_META: Record<string, { bg: string; fg: string }> = {
  배달출발: { bg: '#eff6ff', fg: '#2563eb' },
  이동중: { bg: '#eef2ff', fg: '#4f46e5' },
  터미널입고: { bg: '#eef2ff', fg: '#4f46e5' },
  배송완료: { bg: '#ecfdf5', fg: '#059669' },
};

export function statusKey(c: string): string {
  return c.replace(/\s/g, '');
}

export function statusMeta(carrierStatus: string): { bg: string; fg: string } {
  return STATUS_META[statusKey(carrierStatus)] || { bg: '#f4f4f5', fg: '#71717a' };
}

export const TRANSIT_SHIPMENTS: TransitShipment[] = [
  {
    id: 'SHP-00182', order: 'O-00582', receiver: 'user01', region: '서울', carrier: '택배사 01', invoiceNo: '1234567890', internalStatus: '배송중', carrierStatus: '배달 출발', lastLoc: '지역01 배송센터', lastAt: '2026-08-20T08:42:00', eta: '2026.08.20', etaOrig: '2026.08.20', mismatch: false,
    items: [{ name: '상품01', qty: 2 }, { name: '상품02', qty: 5 }, { name: '상품03', qty: 1 }],
    address: '서울 강남구 ...', reqNote: '문 앞에 놓아주세요.',
    tracking: [
      { title: '출고 완료', when: '08.19 15:42', loc: null, source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.19 17:10', loc: '출고지 01', source: '택배사 API', dot: '#a1a1aa' },
      { title: '터미널 입고', when: '08.19 20:35', loc: '터미널 01', source: '택배사 API', dot: '#a1a1aa' },
      { title: '터미널 출발', when: '08.20 02:20', loc: null, source: '택배사 API', dot: '#a1a1aa' },
      { title: '지역 터미널 도착', when: '08.20 06:40', loc: '지역01', source: '택배사 API', dot: '#a1a1aa' },
      { title: '배달 출발', when: '08.20 08:42', loc: '지역01 배송센터', source: '택배사 API', dot: 'var(--accent)' },
    ],
    issueList: [],
    memos: [],
    history: [{ when: '08.19 15:42', title: '출고 완료' }, { when: '08.19 17:10', title: '택배사 집하' }, { when: '08.20 08:42', title: '배달 출발' }],
  },
  {
    id: 'SHP-00181', order: 'O-00581', receiver: 'user02', region: '경기', carrier: '택배사 02', invoiceNo: '987654', internalStatus: '배송중', carrierStatus: '이동중', lastLoc: '터미널01', lastAt: '2026-08-18T22:10:00', eta: '2026.08.19', etaOrig: '2026.08.19', mismatch: false,
    items: [{ name: '상품02', qty: 4 }],
    address: '경기 성남시 ...', reqNote: '부재 시 연락 바랍니다.',
    tracking: [
      { title: '출고 완료', when: '08.18 14:10', loc: null, source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.18 16:00', loc: '출고지 01', source: '택배사 API', dot: '#a1a1aa' },
      { title: '터미널 입고', when: '08.18 22:10', loc: '터미널01', source: '택배사 API', dot: 'var(--accent)' },
    ],
    issueList: ['배송 1일 지연', '최근 36시간 동안 배송 상태 변경 없음'],
    memos: [{ when: '08.20', by: 'admin01', text: '택배사에 지연 여부 문의함.' }],
    history: [{ when: '08.18 14:10', title: '출고 완료' }, { when: '08.18 16:00', title: '택배사 집하' }, { when: '08.20 09:00', title: '배송 지연 확인', by: 'admin01' }],
  },
  {
    id: 'SHP-00179', order: 'O-00579', receiver: '회사 01', region: '서울', carrier: '택배사 01', invoiceNo: '1234511', internalStatus: '배송중', carrierStatus: '배송 완료', lastLoc: '배송지', lastAt: '2026-08-20T09:20:00', eta: '2026.08.20', etaOrig: '2026.08.20', mismatch: true,
    items: [{ name: '상품05', qty: 10 }, { name: '상품02', qty: 3 }],
    address: '서울 서초구 ...', reqNote: '-',
    tracking: [
      { title: '출고 완료', when: '08.20 08:10', loc: null, source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.20 08:40', loc: '출고지 02', source: '택배사 API', dot: '#a1a1aa' },
      { title: '배송 완료 (택배사 보고)', when: '08.20 09:20', loc: '배송지', source: '택배사 API', dot: 'var(--accent)' },
    ],
    issueList: ['내부 상태와 택배사 상태 불일치'],
    memos: [],
    history: [{ when: '08.20 08:10', title: '출고 완료' }, { when: '08.20 09:20', title: '택배사 배송완료 보고 수신 (내부 상태 미반영)', by: 'system' }],
  },
  {
    id: 'SHP-00170', order: 'O-00570', receiver: '㈜한빛물산', region: '부산', carrier: '택배사 01', invoiceNo: '1234499', internalStatus: '배송중', carrierStatus: '터미널 입고', lastLoc: '터미널02', lastAt: '2026-08-16T20:00:00', eta: '2026.08.18', etaOrig: '2026.08.18', mismatch: false,
    items: [{ name: '상품05', qty: 25 }],
    address: '부산 해운대구 ...', reqNote: '-',
    tracking: [
      { title: '출고 완료', when: '08.16 09:30', loc: null, source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.16 11:00', loc: '출고지 01', source: '택배사 API', dot: '#a1a1aa' },
      { title: '터미널 입고', when: '08.16 20:00', loc: '터미널02', source: '택배사 API', dot: 'var(--accent)' },
    ],
    issueList: ['예상 도착일 2일 초과', '분실 가능성 확인 필요'],
    memos: [{ when: '08.20', by: 'admin03', text: '택배사에 위치 확인 요청, 회신 대기중.' }],
    history: [{ when: '08.16 09:30', title: '출고 완료' }, { when: '08.16 11:00', title: '택배사 집하' }, { when: '08.20 09:00', title: '분실 의심 감지', by: 'system' }],
  },
  {
    id: 'SHP-00168', order: 'O-00568', receiver: '대성유통', region: '대구', carrier: '택배사 01', invoiceNo: '1234480', internalStatus: '배송중', carrierStatus: '배달 출발', lastLoc: '지역03 배송센터', lastAt: '2026-08-20T07:00:00', eta: '2026.08.20', etaOrig: '2026.08.20', mismatch: false,
    items: [{ name: '상품01', qty: 30 }],
    address: '대구 수성구 ...', reqNote: '-',
    tracking: [
      { title: '출고 완료', when: '08.19 12:00', loc: null, source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.19 13:30', loc: '출고지 01', source: '택배사 API', dot: '#a1a1aa' },
      { title: '배달 출발', when: '08.20 07:00', loc: '지역03 배송센터', source: '택배사 API', dot: 'var(--accent)' },
    ],
    issueList: [],
    memos: [],
    history: [{ when: '08.19 12:00', title: '출고 완료' }, { when: '08.20 07:00', title: '배달 출발' }],
  },
];

export interface TransitCalc {
  overdue: boolean;
  stale: boolean;
  issues: string[];
}

export function calcTransit(sh: TransitShipment): TransitCalc {
  const etaD = new Date(sh.eta + 'T23:59:59');
  const overdue = NOW > etaD;
  const lastAtD = new Date(sh.lastAt);
  const hoursSince = (NOW.getTime() - lastAtD.getTime()) / 3600000;
  const stale = hoursSince > 24;
  const issues = [...sh.issueList];
  if (overdue && !issues.some((i) => i.includes('지연') || i.includes('초과'))) issues.push('예상 도착일 초과');
  return { overdue, stale, issues };
}

export const TRANSIT_FILTER_KEYS = ['전체배송중', '배달예정', '배달출발', '배송지연', '상태미변경', '배송이슈'] as const;
export type TransitFilterKey = (typeof TRANSIT_FILTER_KEYS)[number];
export const TRANSIT_FILTER_LABEL: Record<TransitFilterKey, string> = {
  전체배송중: '전체 배송중', 배달예정: '배달 예정', 배달출발: '배달 출발', 배송지연: '배송 지연', 상태미변경: '상태 미변경', 배송이슈: '배송 이슈',
};

export function buildTransitCounts(list: TransitShipment[]): Record<TransitFilterKey, number> {
  const withCalc = list.map((sh) => ({ sh, c: calcTransit(sh) }));
  return {
    전체배송중: withCalc.length,
    배달예정: withCalc.filter(({ sh, c }) => !c.overdue && sh.carrierStatus !== '배달 출발').length,
    배달출발: withCalc.filter(({ sh }) => sh.carrierStatus === '배달 출발').length,
    배송지연: withCalc.filter(({ c }) => c.overdue).length,
    상태미변경: withCalc.filter(({ c }) => c.stale).length,
    배송이슈: withCalc.filter(({ c }) => c.issues.length > 0).length,
  };
}

export function filterTransitShipments(list: TransitShipment[], filter: string, q: string): TransitShipment[] {
  return list.filter((sh) => {
    const c = calcTransit(sh);
    if (filter === '배달예정' && (c.overdue || sh.carrierStatus === '배달 출발')) return false;
    else if (filter === '배달출발' && sh.carrierStatus !== '배달 출발') return false;
    else if (filter === '배송지연' && !c.overdue) return false;
    else if (filter === '상태미변경' && !c.stale) return false;
    else if (filter === '배송이슈' && c.issues.length === 0) return false;
    if (q && !(sh.id.includes(q) || sh.order.includes(q) || sh.invoiceNo.includes(q))) return false;
    return true;
  });
}
