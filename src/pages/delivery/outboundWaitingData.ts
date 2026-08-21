import type { HistoryEntry, Memo } from './deliverySharedData';

export type WaitingStatus = '출고대기' | '보류' | '출고완료';

export interface WaitingItem {
  name: string;
  qty: number;
  shipQty: number;
  packStatus: string;
}

export interface WaitingShipment {
  id: string;
  order: string;
  receiver: string;
  outbase: string;
  carrier: string;
  invoiceNo: string;
  invoiceIssue: string | null;
  dueDate: string;
  status: WaitingStatus;
  reserved: boolean;
  reserveDate: string | null;
  address: string;
  addrChanged: boolean;
  cancelReq: boolean;
  changeNote: string | null;
  items: WaitingItem[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const TODAY = new Date('2026-08-20');

export const STATUS_META: Record<WaitingStatus, { bg: string; fg: string }> = {
  출고대기: { bg: '#eff6ff', fg: '#2563eb' },
  보류: { bg: '#f4f4f5', fg: '#71717a' },
  출고완료: { bg: '#ecfdf5', fg: '#059669' },
};

export const WAITING_SHIPMENTS: WaitingShipment[] = [
  {
    id: 'SHP-00182', order: 'O-00582', receiver: 'user01', outbase: '출고지 01', carrier: '택배사 01', invoiceNo: '1234567890', invoiceIssue: null, dueDate: '2026.08.20', status: '출고대기', reserved: false, reserveDate: null, address: '서울 강남구 ...', addrChanged: false, cancelReq: false, changeNote: null,
    items: [
      { name: '상품01', qty: 2, shipQty: 2, packStatus: '완료' },
      { name: '상품02', qty: 5, shipQty: 5, packStatus: '완료' },
      { name: '상품03', qty: 1, shipQty: 1, packStatus: '완료' },
    ],
    memos: [{ when: '08.20 09:11', by: 'system', text: '배송 준비 완료로 출고 대기 생성.' }],
    history: [
      { when: '08.20 09:10', title: '배송 준비 완료' },
      { when: '08.20 09:11', title: '출고 대기 생성' },
      { when: '08.20 10:00', title: 'admin01 출고 담당 지정', by: 'admin01' },
      { when: '08.20 11:20', title: '송장 검증 완료', by: 'system' },
    ],
  },
  {
    id: 'SHP-00181', order: 'O-00581', receiver: 'user02', outbase: '출고지 01', carrier: '택배사 02', invoiceNo: '987654', invoiceIssue: null, dueDate: '2026.08.19', status: '출고대기', reserved: false, reserveDate: null, address: '경기 성남시 ...', addrChanged: false, cancelReq: false, changeNote: null,
    items: [{ name: '상품02', qty: 2, shipQty: 2, packStatus: '완료' }],
    memos: [],
    history: [
      { when: '08.19 15:00', title: '배송 준비 완료' },
      { when: '08.19 15:01', title: '출고 대기 생성' },
    ],
  },
  {
    id: 'SHP-00179', order: 'O-00579', receiver: '회사 01', outbase: '출고지 02', carrier: '미지정', invoiceNo: '', invoiceIssue: '송장번호가 등록되지 않았습니다.', dueDate: '2026.08.20', status: '출고대기', reserved: false, reserveDate: null, address: '서울 서초구 ...', addrChanged: false, cancelReq: false, changeNote: null,
    items: [
      { name: '상품05', qty: 10, shipQty: 10, packStatus: '완료' },
      { name: '상품02', qty: 3, shipQty: 3, packStatus: '완료' },
    ],
    memos: [],
    history: [
      { when: '08.20 08:10', title: '배송 준비 완료' },
      { when: '08.20 08:11', title: '출고 대기 생성' },
    ],
  },
  {
    id: 'SHP-00176', order: 'O-00576', receiver: 'user09', outbase: '출고지 01', carrier: '택배사 01', invoiceNo: '1234511', invoiceIssue: null, dueDate: '2026.08.25', status: '출고대기', reserved: true, reserveDate: '2026.08.25', address: '인천 연수구 ...', addrChanged: false, cancelReq: false, changeNote: null,
    items: [{ name: '상품01', qty: 1, shipQty: 1, packStatus: '완료' }],
    memos: [],
    history: [
      { when: '08.19 10:00', title: '배송 준비 완료' },
      { when: '08.19 10:01', title: '출고 대기 생성 (예약 출고)' },
    ],
  },
  {
    id: 'SHP-00170', order: 'O-00570', receiver: '㈜한빛물산', outbase: '출고지 01', carrier: '택배사 01', invoiceNo: '1234499', invoiceIssue: null, dueDate: '2026.08.18', status: '보류', reserved: false, reserveDate: null, address: '부산 해운대구 ...', addrChanged: false, cancelReq: false, changeNote: null,
    items: [{ name: '상품05', qty: 25, shipQty: 25, packStatus: '완료' }],
    memos: [{ when: '08.18', by: 'admin03', text: '배송지 확인 요청함.' }],
    history: [
      { when: '08.18 09:30', title: '배송 준비 완료' },
      { when: '08.18 09:31', title: '출고 대기 생성' },
      { when: '08.19 09:00', title: '출고 보류 (배송지 확인)', by: 'admin03' },
    ],
  },
  {
    id: 'SHP-00168', order: 'O-00568', receiver: '대성유통', outbase: '출고지 01', carrier: '택배사 01', invoiceNo: '1234480', invoiceIssue: null, dueDate: '2026.08.20', status: '출고대기', reserved: false, reserveDate: null, address: '대구 수성구 ...', addrChanged: true, cancelReq: false, changeNote: null,
    items: [{ name: '상품01', qty: 30, shipQty: 30, packStatus: '완료' }],
    memos: [],
    history: [
      { when: '08.20 07:40', title: '배송 준비 완료' },
      { when: '08.20 07:41', title: '출고 대기 생성' },
      { when: '08.20 08:15', title: '배송지 변경 감지', by: 'system' },
    ],
  },
  {
    id: 'SHP-00165', order: 'O-00565', receiver: '케이스퀘어', outbase: '출고지 01', carrier: '택배사 02', invoiceNo: '1234410', invoiceIssue: null, dueDate: '2026.08.19', status: '출고대기', reserved: false, reserveDate: null, address: '대전 유성구 ...', addrChanged: false, cancelReq: true, changeNote: '주문 취소 요청이 접수되었습니다. 상품01 1개 취소 요청.',
    items: [{ name: '상품01', qty: 1, shipQty: 1, packStatus: '완료' }],
    memos: [],
    history: [
      { when: '08.19 09:00', title: '배송 준비 완료' },
      { when: '08.19 09:01', title: '출고 대기 생성' },
      { when: '08.20 09:00', title: '주문 취소 요청 접수', by: 'system' },
    ],
  },
];

export interface WaitingCalc {
  isToday: boolean;
  overdue: boolean;
  qtyMismatch: boolean;
  invoiceIssue: boolean;
  issues: string[];
}

export function calcWaiting(sh: WaitingShipment): WaitingCalc {
  const dueD = new Date(sh.dueDate.replace(/\./g, '-'));
  const isToday = sh.dueDate === '2026.08.20';
  const overdue = TODAY > dueD && sh.status !== '보류' && !sh.reserved;
  const qtyMismatch = sh.items.some((it) => it.qty !== it.shipQty);
  const invoiceIssue = !!sh.invoiceIssue;
  const issues: string[] = [];
  if (overdue) issues.push('출고 지연');
  if (invoiceIssue) issues.push('송장 미등록');
  if (sh.cancelReq) issues.push('취소 요청');
  if (sh.addrChanged) issues.push('배송지 변경');
  if (sh.reserved) issues.push('예약 출고');
  if (qtyMismatch) issues.push('출고수량 불일치');
  return { isToday, overdue, qtyMismatch, invoiceIssue, issues };
}

export const WAITING_FILTER_KEYS = ['오늘출고', '출고대기', '예약출고', '출고지연', '보류', '송장이슈'] as const;
export type WaitingFilterKey = (typeof WAITING_FILTER_KEYS)[number];
export const WAITING_FILTER_LABEL: Record<WaitingFilterKey, string> = {
  오늘출고: '오늘 출고', 출고대기: '출고 대기', 예약출고: '예약 출고', 출고지연: '출고 지연', 보류: '보류', 송장이슈: '송장 이슈',
};

export function buildWaitingCounts(list: WaitingShipment[]): Record<WaitingFilterKey, number> {
  const withCalc = list.map((sh) => ({ sh, c: calcWaiting(sh) }));
  return {
    오늘출고: withCalc.filter(({ sh, c }) => c.isToday && sh.status === '출고대기').length,
    출고대기: withCalc.filter(({ sh }) => sh.status === '출고대기').length,
    예약출고: withCalc.filter(({ sh }) => sh.reserved).length,
    출고지연: withCalc.filter(({ c }) => c.overdue).length,
    보류: withCalc.filter(({ sh }) => sh.status === '보류').length,
    송장이슈: withCalc.filter(({ c }) => c.invoiceIssue).length,
  };
}

export function filterWaitingShipments(list: WaitingShipment[], filter: string, q: string): WaitingShipment[] {
  return list.filter((sh) => {
    const c = calcWaiting(sh);
    if (filter === '오늘출고' && !(c.isToday && sh.status === '출고대기')) return false;
    else if (filter === '출고대기' && sh.status !== '출고대기') return false;
    else if (filter === '예약출고' && !sh.reserved) return false;
    else if (filter === '출고지연' && !c.overdue) return false;
    else if (filter === '보류' && sh.status !== '보류') return false;
    else if (filter === '송장이슈' && !c.invoiceIssue) return false;
    if (q && !(sh.id.includes(q) || sh.order.includes(q) || sh.invoiceNo.includes(q))) return false;
    return true;
  });
}
