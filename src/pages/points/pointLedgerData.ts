export type LedgerType = '구매 적립' | '관리자 지급' | '이벤트 지급' | '적립 보정' | '포인트 복원' | '주문 사용' | '관리자 차감' | '포인트 소멸' | '적립 취소';
export type SourceType = '주문' | '취소' | '반품' | '환불' | '회원' | '이벤트' | '프로모션' | '관리자' | '시스템';

export const TODAY = '2026-08-26';

const INCREASE_TYPES: LedgerType[] = ['구매 적립', '관리자 지급', '이벤트 지급', '적립 보정', '포인트 복원'];

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface PointLedgerEntry {
  id: string;
  at: string;
  member: string;
  type: LedgerType;
  before: number;
  delta: number;
  after: number;
  sourceType: SourceType;
  sourceId: string | null;
  by: string;
  note: string;
  memos: Memo[];
}

export function fmtPoint(n: number): string {
  return `${n.toLocaleString('ko-KR')}P`;
}

export function isIncrease(type: LedgerType): boolean {
  return INCREASE_TYPES.includes(type);
}

export function computeIssues(e: PointLedgerEntry, all: PointLedgerEntry[]): string[] {
  const issues: string[] = [];
  if (e.before + e.delta !== e.after) issues.push('변동 전 + 증감 값이 변동 후 잔액과 일치하지 않습니다.');
  if (e.after < 0) issues.push('변동 후 잔액이 음수입니다.');
  if ((e.sourceType === '주문' || e.sourceType === '취소' || e.sourceType === '반품' || e.sourceType === '환불') && !e.sourceId) {
    issues.push('Source 정보가 없습니다.');
  }
  if (e.sourceId) {
    const dup = all.find((o) => o.id !== e.id && o.sourceId === e.sourceId && o.type === e.type);
    if (dup) issues.push(`동일 Source(${e.sourceId})에 중복된 ${e.type} 내역이 있습니다.`);
  }
  return issues;
}

export type QuickFilter = '전체' | '지급' | '사용' | '차감 / 소멸' | '복원' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '지급', '사용', '차감 / 소멸', '복원', '확인 필요'];

export function matchesQuickFilter(e: PointLedgerEntry, filter: QuickFilter, all: PointLedgerEntry[]): boolean {
  if (filter === '전체') return true;
  if (filter === '지급') return ['구매 적립', '관리자 지급', '이벤트 지급', '적립 보정'].includes(e.type);
  if (filter === '사용') return e.type === '주문 사용';
  if (filter === '차감 / 소멸') return ['관리자 차감', '포인트 소멸', '적립 취소'].includes(e.type);
  if (filter === '복원') return e.type === '포인트 복원';
  return computeIssues(e, all).length > 0;
}

export const POINT_LEDGER: PointLedgerEntry[] = [
  {
    id: 'PT-20260820-00101', at: '2026-08-20 09:00', member: 'user01', type: '주문 사용',
    before: 14000, delta: -2000, after: 12000, sourceType: '주문', sourceId: 'O-01020', by: 'SYSTEM',
    note: '주문 O-01020 사용', memos: [],
  },
  {
    id: 'PT-20260826-00182', at: '2026-08-26 10:20', member: 'user01', type: '구매 적립',
    before: 12000, delta: 3000, after: 15000, sourceType: '주문', sourceId: 'O-01041', by: 'SYSTEM',
    note: '구매 적립 · 주문 O-01041', memos: [],
  },
  {
    id: 'PT-20260823-00110', at: '2026-08-23 09:12', member: 'user04', type: '구매 적립',
    before: 20000, delta: 8000, after: 28000, sourceType: '주문', sourceId: 'O-01020', by: 'SYSTEM',
    note: '구매 적립 · 주문 O-01020', memos: [],
  },
  {
    id: 'PT-20260823-00111', at: '2026-08-23 09:13', member: 'user04', type: '구매 적립',
    before: 28000, delta: 800, after: 28800, sourceType: '주문', sourceId: 'O-01020', by: 'SYSTEM',
    note: '구매 적립 · 주문 O-01020 (중복 적립 의심)', memos: [],
  },
  {
    id: 'PT-20260824-00090', at: '2026-08-24 13:00', member: 'user02', type: '이벤트 지급',
    before: 0, delta: 5000, after: 5000, sourceType: '이벤트', sourceId: null, by: 'SYSTEM',
    note: '이벤트 지급', memos: [],
  },
  {
    id: 'PT-20260815-00060', at: '2026-08-15 10:00', member: 'user03', type: '주문 사용',
    before: 6000, delta: -3000, after: 3000, sourceType: '주문', sourceId: null, by: 'SYSTEM',
    note: '주문 사용 (Source 연결 누락)', memos: [{ id: 'M-1', at: '2026-08-26 09:30', by: 'admin02', text: '주문번호 연결이 누락되어 있습니다. 확인 필요.' }],
  },
  {
    id: 'PT-20260820-00061', at: '2026-08-20 10:00', member: 'user03', type: '주문 사용',
    before: 3000, delta: -3000, after: 0, sourceType: '주문', sourceId: 'O-00960', by: 'SYSTEM',
    note: '주문 O-00960 사용', memos: [],
  },
  {
    id: 'PT-20260820-00070', at: '2026-08-20 13:00', member: 'user05', type: '이벤트 지급',
    before: 0, delta: 12000, after: 12000, sourceType: '이벤트', sourceId: null, by: 'admin02',
    note: '이벤트 보상', memos: [],
  },
  {
    id: 'PT-20260710-00040', at: '2026-07-10 13:00', member: 'user06', type: '구매 적립',
    before: 0, delta: 9000, after: 9000, sourceType: '주문', sourceId: 'O-00750', by: 'SYSTEM',
    note: '구매 적립 · 주문 O-00750', memos: [],
  },
  {
    id: 'PT-20260715-00041', at: '2026-07-15 10:10', member: 'user06', type: '적립 취소',
    before: 9000, delta: -1000, after: 8000, sourceType: '반품', sourceId: 'O-00750', by: 'admin01',
    note: '부분 환불 반영 적립 회수 · 주문 O-00750', memos: [],
  },
  {
    id: 'PT-20260601-00010', at: '2026-06-01 09:00', member: 'user07', type: '구매 적립',
    before: 0, delta: 3000, after: 3000, sourceType: '주문', sourceId: 'O-00610', by: 'SYSTEM',
    note: '구매 적립 · 주문 O-00610', memos: [],
  },
  {
    id: 'PT-20260701-00020', at: '2026-07-01 10:00', member: 'user08', type: '구매 적립',
    before: 0, delta: 1000, after: 1000, sourceType: '주문', sourceId: 'O-00550', by: 'SYSTEM',
    note: '구매 적립 · 주문 O-00550', memos: [],
  },
  {
    id: 'PT-20260705-00021', at: '2026-07-05 11:00', member: 'user08', type: '관리자 차감',
    before: 1000, delta: -2500, after: -1500, sourceType: '관리자', sourceId: null, by: 'admin02',
    note: '오지급 회수', memos: [{ id: 'M-1', at: '2026-08-26 09:40', by: 'admin02', text: '차감 처리 중 마이너스 잔액이 발생했습니다. 확인 필요.' }],
  },
  {
    id: 'PT-20260805-00080', at: '2026-08-05 09:00', member: 'user09', type: '포인트 소멸',
    before: 31000, delta: -1000, after: 30000, sourceType: '시스템', sourceId: null, by: 'SYSTEM',
    note: '유효기간 만료 (7월 적립분)', memos: [],
  },
  {
    id: 'PT-20260818-00081', at: '2026-08-18 10:00', member: 'user09', type: '구매 적립',
    before: 30000, delta: 20000, after: 50000, sourceType: '주문', sourceId: 'O-01050', by: 'SYSTEM',
    note: '구매 적립 · 주문 O-01050', memos: [],
  },
  {
    id: 'PT-20260501-00001', at: '2026-05-01 09:00', member: 'user10', type: '이벤트 지급',
    before: 0, delta: 1200, after: 1200, sourceType: '이벤트', sourceId: null, by: 'SYSTEM',
    note: '이벤트 지급', memos: [],
  },
  {
    id: 'PT-20260723-00099', at: '2026-07-23 09:35', member: 'user05', type: '포인트 복원',
    before: 8000, delta: 3000, after: 11000, sourceType: '취소', sourceId: 'O-00700', by: 'admin02',
    note: '주문 전체 취소 반영 포인트 복원 · 주문 O-00700', memos: [],
  },
];
