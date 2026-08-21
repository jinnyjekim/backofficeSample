import type { HistoryEntry, Memo, Sibling, TrackingEntry } from './deliverySharedData';

export type CompleteType = '정상' | '지연' | '부분';

export interface CompleteItem {
  name: string;
  out: number;
  delivered: number;
}

export interface AftercareEntry {
  type: string;
  id: string;
  note: string;
  status: string;
  fg: string;
}

export interface CompleteShipment {
  id: string;
  order: string;
  receiver: string;
  carrier: string;
  invoiceNo: string;
  outAt: string;
  completedAt: string;
  plannedEta: string;
  type: CompleteType;
  method: string;
  proofs: string[];
  aftercare: AftercareEntry[];
  items: CompleteItem[];
  siblings: Sibling[];
  orderProgress?: string;
  tracking: TrackingEntry[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const TYPE_META: Record<CompleteType, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#059669' },
  지연: { bg: '#fef2f2', fg: '#dc2626' },
  부분: { bg: '#fffbeb', fg: '#d97706' },
};

function durHours(a: string, b: string): number {
  const toDate = (s: string) => new Date(s.replace(/\./g, '-').replace(' ', 'T'));
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 3600000);
}

export function fmtDur(h: number): string {
  return h >= 24 ? `${Math.floor(h / 24)}일 ${h % 24}시간` : `${h}시간`;
}

export const COMPLETE_SHIPMENTS: CompleteShipment[] = [
  {
    id: 'SHP-00182', order: 'O-00582', receiver: 'user01', carrier: '택배사 01', invoiceNo: '1234567890', outAt: '2026.08.19 15:42', completedAt: '2026.08.20 14:22', plannedEta: '2026.08.20', type: '정상', method: '문 앞', proofs: [], aftercare: [],
    items: [{ name: '상품01', out: 2, delivered: 2 }, { name: '상품02', out: 5, delivered: 5 }, { name: '상품03', out: 1, delivered: 1 }],
    siblings: [],
    tracking: [
      { title: '출고 완료', when: '08.19 15:42', source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.19 17:12', source: '택배사 API', dot: '#a1a1aa' },
      { title: '배달 출발', when: '08.20 08:42', source: '택배사 API', dot: '#a1a1aa' },
      { title: '배송 완료', when: '08.20 14:22', source: '택배사 API', dot: 'var(--accent)' },
    ],
    memos: [{ when: '08.20', by: 'admin01', text: '정상 배송 완료 확인.' }],
    history: [
      { when: '08.19 15:42', title: '출고 완료' },
      { when: '08.19 17:12', title: '택배사 집하 완료' },
      { when: '08.20 08:42', title: '배달 출발' },
      { when: '08.20 14:22', title: '배송 완료', by: '택배사 API' },
    ],
  },
  {
    id: 'SHP-00181', order: 'O-00581', receiver: 'user02', carrier: '택배사 02', invoiceNo: '987654', outAt: '2026.08.17 14:10', completedAt: '2026.08.20 18:40', plannedEta: '2026.08.18', type: '지연', method: '경비실', proofs: [], aftercare: [],
    items: [{ name: '상품02', out: 4, delivered: 4 }],
    siblings: [],
    tracking: [
      { title: '출고 완료', when: '08.17 14:10', source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.17 16:00', source: '택배사 API', dot: '#a1a1aa' },
      { title: '1차 배송 실패 (수취인 부재)', when: '08.19 11:00', source: '택배사 API', dot: '#dc2626' },
      { title: '재배송', when: '08.20 15:00', source: '택배사 API', dot: '#a1a1aa' },
      { title: '배송 완료', when: '08.20 18:40', source: '택배사 API', dot: 'var(--accent)' },
    ],
    memos: [],
    history: [
      { when: '08.17 14:10', title: '출고 완료' },
      { when: '08.19 11:00', title: '1차 배송 실패 (수취인 부재)' },
      { when: '08.20 18:40', title: '재배송 후 완료', by: '택배사 API' },
    ],
  },
  {
    id: 'SHP-00182-01', order: 'O-00582', receiver: '회사 01', carrier: '택배사 01', invoiceNo: '1234511', outAt: '2026.08.19 11:00', completedAt: '2026.08.20 09:10', plannedEta: '2026.08.20', type: '부분', method: '직접 전달', proofs: ['납품확인서.pdf'], aftercare: [],
    items: [{ name: '상품05', out: 6, delivered: 6 }],
    siblings: [{ id: 'SHP-00182-02', item: '상품05 4개', status: '출고 대기', fg: '#2563eb' }],
    orderProgress: '주문 배송 6 / 10 완료 (60%)',
    tracking: [
      { title: '출고 완료', when: '08.19 11:00', source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.19 13:00', source: '택배사 API', dot: '#a1a1aa' },
      { title: '배송 완료', when: '08.20 09:10', source: '택배사 API', dot: 'var(--accent)' },
    ],
    memos: [],
    history: [
      { when: '08.19 11:00', title: '출고 완료' },
      { when: '08.20 09:10', title: '배송 완료 (부분 6/10)', by: '택배사 API' },
    ],
  },
  {
    id: 'SHP-00170', order: 'O-00570', receiver: '㈜한빛물산', carrier: '택배사 01', invoiceNo: '1234499', outAt: '2026.08.16 09:30', completedAt: '2026.08.19 10:20', plannedEta: '2026.08.18', type: '지연', method: '문 앞', proofs: [], aftercare: [{ type: '반품', id: 'R-00170', note: '상품05 1개 파손 확인', status: '진행중', fg: '#d97706' }],
    items: [{ name: '상품05', out: 25, delivered: 25 }],
    siblings: [],
    tracking: [
      { title: '출고 완료', when: '08.16 09:30', source: 'system', dot: '#a1a1aa' },
      { title: '집하 완료', when: '08.16 11:00', source: '택배사 API', dot: '#a1a1aa' },
      { title: '배송 완료', when: '08.19 10:20', source: '택배사 API', dot: 'var(--accent)' },
    ],
    memos: [{ when: '08.20', by: 'admin03', text: '파손 클레임 접수, 반품 진행중.' }],
    history: [
      { when: '08.16 09:30', title: '출고 완료' },
      { when: '08.19 10:20', title: '배송 완료', by: '택배사 API' },
      { when: '08.20 09:00', title: '파손 반품 접수', by: 'admin03' },
    ],
  },
];

export interface CompleteCalc {
  durationH: number;
  isToday: boolean;
}

export function calcComplete(sh: CompleteShipment): CompleteCalc {
  return { durationH: durHours(sh.outAt, sh.completedAt), isToday: sh.completedAt.startsWith('2026.08.20') };
}

export const COMPLETE_FILTER_KEYS = ['오늘완료', '정상완료', '지연완료', '부분완료', '완료후이슈', '전체'] as const;
export type CompleteFilterKey = (typeof COMPLETE_FILTER_KEYS)[number];
export const COMPLETE_FILTER_LABEL: Record<CompleteFilterKey, string> = {
  오늘완료: '오늘 완료', 정상완료: '정상 완료', 지연완료: '지연 완료', 부분완료: '부분 완료', 완료후이슈: '완료 후 이슈', 전체: '전체',
};

export function buildCompleteCounts(list: CompleteShipment[]): Record<CompleteFilterKey, number> {
  const withCalc = list.map((sh) => ({ sh, c: calcComplete(sh) }));
  return {
    오늘완료: withCalc.filter(({ c }) => c.isToday).length,
    정상완료: withCalc.filter(({ sh }) => sh.type === '정상').length,
    지연완료: withCalc.filter(({ sh }) => sh.type === '지연').length,
    부분완료: withCalc.filter(({ sh }) => sh.type === '부분').length,
    완료후이슈: withCalc.filter(({ sh }) => sh.aftercare.length > 0).length,
    전체: withCalc.length,
  };
}

export function filterCompleteShipments(list: CompleteShipment[], filter: string, q: string): CompleteShipment[] {
  return list.filter((sh) => {
    const c = calcComplete(sh);
    if (filter === '오늘완료' && !c.isToday) return false;
    else if (filter === '정상완료' && sh.type !== '정상') return false;
    else if (filter === '지연완료' && sh.type !== '지연') return false;
    else if (filter === '부분완료' && sh.type !== '부분') return false;
    else if (filter === '완료후이슈' && sh.aftercare.length === 0) return false;
    if (q && !(sh.id.includes(q) || sh.order.includes(q) || sh.invoiceNo.includes(q))) return false;
    return true;
  });
}
