import type { HistoryEntry, Memo, Sibling, TrackingEntry } from './deliverySharedData';

export type ShipStatus = '집하대기' | '배송중';

export interface OutboundItem {
  name: string;
  ready: number;
  actual: number;
}

export interface OutboundShipment {
  id: string;
  order: string;
  outbase: string;
  carrier: string;
  invoiceNo: string;
  plannedDate: string;
  actualDate: string;
  pickup: '완료' | '대기';
  pickupAt: string | null;
  shipStatus: ShipStatus;
  partial: boolean;
  stockError: boolean;
  items: OutboundItem[];
  siblings: Sibling[];
  tracking: TrackingEntry[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const NOW = new Date('2026-08-20T20:00:00');

export const SHIP_META: Record<ShipStatus, { bg: string; fg: string }> = {
  집하대기: { bg: '#fffbeb', fg: '#b45309' },
  배송중: { bg: '#eff6ff', fg: '#2563eb' },
};

export const OUTBOUND_SHIPMENTS: OutboundShipment[] = [
  {
    id: 'SHP-00182', order: 'O-00582', outbase: '출고지 01', carrier: '택배사 01', invoiceNo: '1234567890', plannedDate: '2026.08.20', actualDate: '2026.08.20 15:42', pickup: '완료', pickupAt: '2026.08.20 17:12', shipStatus: '배송중', partial: false, stockError: false,
    items: [{ name: '상품01', ready: 2, actual: 2 }, { name: '상품02', ready: 5, actual: 5 }, { name: '상품03', ready: 1, actual: 1 }],
    siblings: [],
    tracking: [{ title: '출고 완료', when: '15:42', source: '', dot: '' }, { title: '집하 완료', when: '17:12', source: '', dot: '' }, { title: '배송중 전환', when: '18:10', source: '', dot: '' }],
    memos: [{ when: '08.20 16:00', by: 'admin01', text: '16시 집하 차량에 인계 완료.' }],
    history: [
      { when: '08.20 09:10', title: '배송 준비 완료' },
      { when: '08.20 09:11', title: '출고 대기' },
      { when: '08.20 15:42', title: '출고 완료', by: 'admin01' },
      { when: '08.20 17:12', title: '택배사 집하 완료' },
      { when: '08.20 18:10', title: '배송중 전환' },
    ],
  },
  {
    id: 'SHP-00181', order: 'O-00581', outbase: '출고지 01', carrier: '택배사 02', invoiceNo: '987654', plannedDate: '2026.08.19', actualDate: '2026.08.20 14:10', pickup: '대기', pickupAt: null, shipStatus: '집하대기', partial: false, stockError: false,
    items: [{ name: '상품02', ready: 4, actual: 4 }],
    siblings: [],
    tracking: [{ title: '출고 완료', when: '14:10', source: '', dot: '' }],
    memos: [],
    history: [
      { when: '08.19 15:00', title: '배송 준비 완료' },
      { when: '08.19 15:01', title: '출고 대기' },
      { when: '08.20 14:10', title: '출고 완료', by: 'admin01' },
    ],
  },
  {
    id: 'SHP-00182-01', order: 'O-00582', outbase: '출고지 02', carrier: '택배사 01', invoiceNo: '1234511', plannedDate: '2026.08.19', actualDate: '2026.08.19 11:00', pickup: '완료', pickupAt: '2026.08.19 13:00', shipStatus: '배송중', partial: true, stockError: false,
    items: [{ name: '상품05', ready: 6, actual: 6 }],
    siblings: [{ id: 'SHP-00182-02', item: '상품05 4개', status: '출고 대기', fg: '#2563eb' }],
    tracking: [{ title: '출고 완료', when: '11:00', source: '', dot: '' }, { title: '집하 완료', when: '13:00', source: '', dot: '' }],
    memos: [],
    history: [
      { when: '08.19 10:00', title: '배송 준비 완료' },
      { when: '08.19 10:01', title: '출고 대기' },
      { when: '08.19 11:00', title: '출고 완료 (부분 출고 6/10)', by: 'admin02' },
    ],
  },
  {
    id: 'SHP-00176', order: 'O-00576', outbase: '출고지 01', carrier: '택배사 01', invoiceNo: '1234480', plannedDate: '2026.08.19', actualDate: '2026.08.19 10:40', pickup: '대기', pickupAt: null, shipStatus: '집하대기', partial: false, stockError: true,
    items: [{ name: '상품01', ready: 1, actual: 1 }],
    siblings: [],
    tracking: [{ title: '출고 완료', when: '10:40', source: '', dot: '' }],
    memos: [],
    history: [
      { when: '08.19 10:00', title: '배송 준비 완료' },
      { when: '08.19 10:40', title: '출고 완료', by: 'admin02' },
      { when: '08.19 10:41', title: '재고 반영 오류 감지', by: 'system' },
    ],
  },
];

export interface OutboundCalc {
  pickupDelay: boolean;
  remain: boolean;
  issues: string[];
  isToday: boolean;
}

export function calcOutbound(sh: OutboundShipment): OutboundCalc {
  const actualD = new Date(sh.actualDate.replace(/\./g, '-').replace(' ', 'T'));
  const hoursSince = (NOW.getTime() - actualD.getTime()) / 3600000;
  const pickupDelay = sh.pickup === '대기' && hoursSince > 12;
  const remain = sh.items.some((it) => it.actual < it.ready);
  const issues: string[] = [];
  if (pickupDelay) issues.push('집하 지연');
  if (sh.partial) issues.push('부분 출고');
  if (sh.stockError) issues.push('재고 반영 오류');
  const isToday = sh.actualDate.startsWith('2026.08.20');
  return { pickupDelay, remain, issues, isToday };
}

export const OUTBOUND_FILTER_KEYS = ['오늘출고', '집하대기', '배송중전환', '부분출고', '출고이슈', '전체'] as const;
export type OutboundFilterKey = (typeof OUTBOUND_FILTER_KEYS)[number];
export const OUTBOUND_FILTER_LABEL: Record<OutboundFilterKey, string> = {
  오늘출고: '오늘 출고', 집하대기: '집하 대기', 배송중전환: '배송중 전환', 부분출고: '부분 출고', 출고이슈: '출고 이슈', 전체: '전체',
};

export function buildOutboundCounts(list: OutboundShipment[]): Record<OutboundFilterKey, number> {
  const withCalc = list.map((sh) => ({ sh, c: calcOutbound(sh) }));
  return {
    오늘출고: withCalc.filter(({ c }) => c.isToday).length,
    집하대기: withCalc.filter(({ sh }) => sh.pickup === '대기').length,
    배송중전환: withCalc.filter(({ sh }) => sh.shipStatus === '배송중').length,
    부분출고: withCalc.filter(({ sh }) => sh.partial).length,
    출고이슈: withCalc.filter(({ c }) => c.issues.length > 0).length,
    전체: withCalc.length,
  };
}

export function filterOutboundShipments(list: OutboundShipment[], filter: string, q: string): OutboundShipment[] {
  return list.filter((sh) => {
    const c = calcOutbound(sh);
    if (filter === '오늘출고' && !c.isToday) return false;
    else if (filter === '집하대기' && sh.pickup !== '대기') return false;
    else if (filter === '배송중전환' && sh.shipStatus !== '배송중') return false;
    else if (filter === '부분출고' && !sh.partial) return false;
    else if (filter === '출고이슈' && c.issues.length === 0) return false;
    if (q && !(sh.id.includes(q) || sh.order.includes(q) || sh.invoiceNo.includes(q))) return false;
    return true;
  });
}
