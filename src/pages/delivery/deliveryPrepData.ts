import type { HistoryEntry, Memo } from './deliverySharedData';

export type PrepStatus = '준비중' | '보류' | '준비완료';

export interface PrepItem {
  name: string;
  qty: number;
  ready: number;
  stock: number;
  remain: number;
}

export interface PrepShipment {
  id: string;
  order: string;
  receiver: string;
  address: string;
  addrOk: boolean;
  dueDate: string;
  status: PrepStatus;
  method: string;
  carrier: string;
  invoiceNo: string;
  outbase: string;
  reqNote: string;
  changeNote: string | null;
  items: PrepItem[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const TODAY = new Date('2026-08-20');

export const STATUS_META: Record<PrepStatus, { bg: string; fg: string }> = {
  준비중: { bg: '#eff6ff', fg: '#2563eb' },
  보류: { bg: '#f4f4f5', fg: '#71717a' },
  준비완료: { bg: '#ecfdf5', fg: '#059669' },
};

export const PREP_SHIPMENTS: PrepShipment[] = [
  {
    id: 'SHP-00182', order: 'O-00582', receiver: 'user01', address: '서울 강남구 ...', addrOk: true, dueDate: '2026.08.20', status: '준비중', method: '택배', carrier: '택배사 01', invoiceNo: '', outbase: '출고지 01', reqNote: '문 앞에 놓아주세요.', changeNote: null,
    items: [
      { name: '상품01', qty: 2, ready: 2, stock: 12, remain: 0 },
      { name: '상품02', qty: 5, ready: 4, stock: 5, remain: 1 },
      { name: '상품03', qty: 1, ready: 1, stock: 8, remain: 0 },
    ],
    memos: [{ when: '08.20 09:15', by: 'admin01', text: '상품02 오후 입고 예정.' }],
    history: [
      { when: '08.20 09:10', title: '배송 준비 생성' },
      { when: '08.20 09:15', title: '담당자 지정', by: 'admin01' },
      { when: '08.20 09:22', title: '상품01 2개 준비 완료', by: 'admin01' },
    ],
  },
  {
    id: 'SHP-00181', order: 'O-00581', receiver: 'user02', address: '경기 성남시 ...', addrOk: false, dueDate: '2026.08.20', status: '보류', method: '택배', carrier: '미지정', invoiceNo: '', outbase: '출고지 01', reqNote: '부재 시 연락 바랍니다.', changeNote: null,
    items: [{ name: '상품02', qty: 2, ready: 1, stock: 1, remain: 1 }],
    memos: [],
    history: [
      { when: '08.20 08:40', title: '배송 준비 생성' },
      { when: '08.20 09:05', title: '재고 부족 · 배송 보류', by: 'admin01' },
    ],
  },
  {
    id: 'SHP-00179', order: 'O-00579', receiver: '회사 01', address: '서울 서초구 ...', addrOk: true, dueDate: '2026.08.20', status: '준비중', method: '직접배송', carrier: '-', invoiceNo: '', outbase: '출고지 02', reqNote: '-', changeNote: '상품02 5개 → 3개로 변경되었습니다.',
    items: [
      { name: '상품05', qty: 10, ready: 10, stock: 40, remain: 0 },
      { name: '상품02', qty: 3, ready: 5, stock: 20, remain: -2 },
    ],
    memos: [],
    history: [
      { when: '08.19 16:00', title: '배송 준비 생성' },
      { when: '08.20 08:00', title: '주문 변경 감지 (상품02 5→3)' },
    ],
  },
  {
    id: 'SHP-00176', order: 'O-00576', receiver: 'user09', address: '인천 연수구 ...', addrOk: true, dueDate: '2026.08.19', status: '준비완료', method: '택배', carrier: '택배사 02', invoiceNo: '1234567890', outbase: '출고지 01', reqNote: '-', changeNote: null,
    items: [{ name: '상품01', qty: 1, ready: 1, stock: 12, remain: 0 }],
    memos: [],
    history: [
      { when: '08.19 10:00', title: '배송 준비 생성' },
      { when: '08.19 10:40', title: '송장번호 등록', by: 'admin02' },
      { when: '08.19 10:45', title: '배송 준비 완료', by: 'admin02' },
    ],
  },
  {
    id: 'SHP-00170', order: 'O-00570', receiver: '㈜한빛물산', address: '부산 해운대구 ...', addrOk: true, dueDate: '2026.08.18', status: '준비중', method: '택배', carrier: '택배사 01', invoiceNo: '', outbase: '출고지 01', reqNote: '-', changeNote: null,
    items: [{ name: '상품05', qty: 25, ready: 25, stock: 60, remain: 0 }],
    memos: [],
    history: [
      { when: '08.18 09:00', title: '배송 준비 생성' },
      { when: '08.18 09:30', title: '상품05 25개 준비 완료', by: 'admin03' },
    ],
  },
  {
    id: 'SHP-00165', order: 'O-00565', receiver: '대성유통', address: '주소 확인 필요', addrOk: false, dueDate: '2026.08.17', status: '준비중', method: '택배', carrier: '미지정', invoiceNo: '', outbase: '출고지 01', reqNote: '-', changeNote: null,
    items: [{ name: '상품01', qty: 30, ready: 30, stock: 50, remain: 0 }],
    memos: [],
    history: [{ when: '08.17 09:00', title: '배송 준비 생성' }],
  },
];

export interface PrepCalc {
  readyCount: number;
  stockIssue: boolean;
  invoiceNeeded: boolean;
  overdue: boolean;
  issues: string[];
}

export function calcPrep(sh: PrepShipment): PrepCalc {
  const readyCount = sh.items.filter((it) => it.remain <= 0).length;
  const stockIssue = sh.items.some((it) => it.remain > 0);
  const invoiceNeeded = sh.status !== '준비완료' && !sh.invoiceNo;
  const dueD = new Date(sh.dueDate.replace(/\./g, '-'));
  const overdue = TODAY > dueD && sh.status !== '준비완료';
  const issues: string[] = [];
  if (stockIssue) issues.push('재고 부족');
  if (!sh.addrOk) issues.push('배송지 확인 필요');
  if (sh.changeNote) issues.push('주문 변경');
  if (overdue) issues.push('출고예정일 경과');
  return { readyCount, stockIssue, invoiceNeeded, overdue, issues };
}

export const PREP_FILTER_KEYS = ['준비필요', '준비중', '보류', '재고 이슈', '송장 필요', '준비 완료'] as const;
export type PrepFilterKey = (typeof PREP_FILTER_KEYS)[number];

export function buildPrepCounts(list: PrepShipment[]): Record<PrepFilterKey, number> {
  const withCalc = list.map((sh) => ({ sh, c: calcPrep(sh) }));
  return {
    준비필요: withCalc.filter(({ sh, c }) => sh.status === '준비중' && c.readyCount < sh.items.length).length,
    준비중: withCalc.filter(({ sh }) => sh.status === '준비중').length,
    보류: withCalc.filter(({ sh }) => sh.status === '보류').length,
    '재고 이슈': withCalc.filter(({ c }) => c.stockIssue).length,
    '송장 필요': withCalc.filter(({ c }) => c.invoiceNeeded).length,
    '준비 완료': withCalc.filter(({ sh }) => sh.status === '준비완료').length,
  };
}

export function filterPrepShipments(list: PrepShipment[], filter: string, q: string): PrepShipment[] {
  return list.filter((sh) => {
    const c = calcPrep(sh);
    if (filter === '준비필요' && !(sh.status === '준비중' && c.readyCount < sh.items.length)) return false;
    else if (filter === '준비중' && sh.status !== '준비중') return false;
    else if (filter === '보류' && sh.status !== '보류') return false;
    else if (filter === '재고 이슈' && !c.stockIssue) return false;
    else if (filter === '송장 필요' && !c.invoiceNeeded) return false;
    else if (filter === '준비 완료' && sh.status !== '준비완료') return false;
    if (q && !(sh.order.includes(q) || sh.receiver.includes(q) || sh.items.some((it) => it.name.includes(q)))) return false;
    return true;
  });
}
