export type MemberStatus = '정상' | '휴면' | '탈퇴';
export type GrantReason = '구매 적립' | '이벤트' | '프로모션' | '회원가입' | '리뷰 보상' | 'CS 보상' | '관리자 지급' | '보정' | '기타';
export type DeductReason = '오지급 회수' | '부정 적립 회수' | '정책 위반' | 'CS 처리' | '기타';

export const TODAY = '2026-08-26';
export const GRANT_REASONS: GrantReason[] = ['구매 적립', '이벤트', '프로모션', '회원가입', '리뷰 보상', 'CS 보상', '관리자 지급', '보정', '기타'];
export const DEDUCT_REASONS: DeductReason[] = ['오지급 회수', '부정 적립 회수', '정책 위반', 'CS 처리', '기타'];

export interface ExpiringBatch {
  expiresAt: string;
  amount: number;
}

export interface PendingBatch {
  confirmAt: string;
  amount: number;
  source: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  type: '지급' | '사용' | '차감' | '소멸' | '복원';
  amount: number;
  note: string;
}

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  detail?: string;
}

export interface MemberPointBalance {
  member: string;
  memberStatus: MemberStatus;

  totalHeld: number;
  available: number;
  pending: number;
  expiringSoon30: number;

  pendingBatches: PendingBatch[];
  expiringBatches: ExpiringBatch[];
  recentActivity: ActivityEntry[];

  lastActivityAt: string;
  memos: Memo[];
  history: HistoryEntry[];
}

export const STATUS_META: Record<MemberStatus, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#059669' },
  휴면: { bg: '#f4f4f5', fg: '#71717a' },
  탈퇴: { bg: '#fef2f2', fg: '#b91c1c' },
};

export function fmtPoint(n: number): string {
  return `${n.toLocaleString('ko-KR')}P`;
}

export function computeIssues(b: MemberPointBalance): string[] {
  const issues: string[] = [];
  if (b.available < 0 || b.totalHeld < 0) issues.push('포인트 잔액이 음수입니다.');
  if (b.available > b.totalHeld) issues.push('사용 가능 금액이 총 보유보다 많습니다.');
  if (b.expiringSoon30 > b.available) issues.push('소멸 예정 금액이 사용 가능 잔액보다 많습니다.');
  if (b.memberStatus === '탈퇴' && b.available > 0) issues.push('탈퇴 회원에게 사용 가능한 포인트가 존재합니다.');
  return issues;
}

export type QuickFilter = '전체' | '보유 중' | '잔액 없음' | '소멸 예정' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '보유 중', '잔액 없음', '소멸 예정', '확인 필요'];

export function matchesQuickFilter(b: MemberPointBalance, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '보유 중') return b.totalHeld > 0;
  if (filter === '잔액 없음') return b.totalHeld === 0;
  if (filter === '소멸 예정') return b.expiringSoon30 > 0;
  return computeIssues(b).length > 0;
}

export function grant(b: MemberPointBalance, amount: number, reason: GrantReason, detail: string, immediate: boolean, confirmAt: string | null): MemberPointBalance {
  const at = `${TODAY} 15:00`;
  const next: MemberPointBalance = {
    ...b,
    totalHeld: b.totalHeld + amount,
    available: immediate ? b.available + amount : b.available,
    pending: immediate ? b.pending : b.pending + amount,
    pendingBatches: immediate ? b.pendingBatches : [...b.pendingBatches, { confirmAt: confirmAt ?? TODAY, amount, source: reason }],
    recentActivity: [{ id: `A-${Date.now()}`, at, type: '지급', amount, note: `${reason}${detail ? ` · ${detail}` : ''}` }, ...b.recentActivity],
    lastActivityAt: TODAY,
    history: [...b.history, { id: `H-${Date.now()}`, at, by: 'admin01', action: '포인트 지급', detail: `${reason} · +${amount.toLocaleString('ko-KR')}P` }],
  };
  return next;
}

export function deduct(b: MemberPointBalance, amount: number, reason: DeductReason, detail: string): MemberPointBalance {
  const at = `${TODAY} 15:00`;
  const next: MemberPointBalance = {
    ...b,
    totalHeld: b.totalHeld - amount,
    available: b.available - amount,
    recentActivity: [{ id: `A-${Date.now()}`, at, type: '차감', amount: -amount, note: `${reason}${detail ? ` · ${detail}` : ''}` }, ...b.recentActivity],
    lastActivityAt: TODAY,
    history: [...b.history, { id: `H-${Date.now()}`, at, by: 'admin01', action: '포인트 차감', detail: `${reason} · -${amount.toLocaleString('ko-KR')}P` }],
  };
  return next;
}

export const MEMBER_BALANCES: MemberPointBalance[] = [
  {
    member: 'user01', memberStatus: '정상',
    totalHeld: 18500, available: 15000, pending: 2000, expiringSoon30: 3000,
    pendingBatches: [{ confirmAt: '2026-09-02', amount: 2000, source: '구매 적립' }],
    expiringBatches: [{ expiresAt: '2026-09-01', amount: 1500 }, { expiresAt: '2026-09-15', amount: 1500 }],
    recentActivity: [
      { id: 'A-1', at: '2026-08-26 10:20', type: '지급', amount: 3000, note: '구매 적립 · 주문 O-01041' },
      { id: 'A-2', at: '2026-08-20 09:00', type: '사용', amount: -2000, note: '주문 O-01020 사용' },
    ],
    lastActivityAt: '2026-08-26', memos: [], history: [{ id: 'H-1', at: '2026-07-01 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
  {
    member: 'user02', memberStatus: '정상',
    totalHeld: 5000, available: 5000, pending: 0, expiringSoon30: 0,
    pendingBatches: [], expiringBatches: [],
    recentActivity: [{ id: 'A-1', at: '2026-08-24 13:00', type: '지급', amount: 5000, note: '이벤트 지급' }],
    lastActivityAt: '2026-08-24', memos: [], history: [{ id: 'H-1', at: '2026-07-05 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
  {
    member: 'user03', memberStatus: '정상',
    totalHeld: 0, available: 0, pending: 0, expiringSoon30: 0,
    pendingBatches: [], expiringBatches: [],
    recentActivity: [{ id: 'A-1', at: '2026-08-20 10:00', type: '사용', amount: -3000, note: '주문 O-00960 사용' }],
    lastActivityAt: '2026-08-20', memos: [], history: [{ id: 'H-1', at: '2026-06-01 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
  {
    member: 'user04', memberStatus: '정상',
    totalHeld: 32000, available: 28000, pending: 4000, expiringSoon30: 6000,
    pendingBatches: [{ confirmAt: '2026-09-05', amount: 4000, source: '구매 적립' }],
    expiringBatches: [{ expiresAt: '2026-09-10', amount: 6000 }],
    recentActivity: [{ id: 'A-1', at: '2026-08-23 09:12', type: '지급', amount: 8000, note: '구매 적립 · 주문 O-01020' }],
    lastActivityAt: '2026-08-23', memos: [], history: [{ id: 'H-1', at: '2026-05-15 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
  {
    member: 'user05', memberStatus: '정상',
    totalHeld: 10000, available: 12000, pending: 0, expiringSoon30: 0,
    pendingBatches: [], expiringBatches: [],
    recentActivity: [{ id: 'A-1', at: '2026-08-20 13:00', type: '지급', amount: 12000, note: '이벤트 보상' }],
    lastActivityAt: '2026-08-20',
    memos: [{ id: 'M-1', at: '2026-08-26 09:00', by: 'admin02', text: '사용 가능 금액이 총 보유보다 큽니다. 원장 확인 필요.' }],
    history: [{ id: 'H-1', at: '2026-06-10 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
  {
    member: 'user06', memberStatus: '정상',
    totalHeld: 9000, available: 5000, pending: 0, expiringSoon30: 8000,
    pendingBatches: [], expiringBatches: [{ expiresAt: '2026-09-05', amount: 8000 }],
    recentActivity: [{ id: 'A-1', at: '2026-07-10 13:00', type: '지급', amount: 9000, note: '구매 적립 · 주문 O-00750' }],
    lastActivityAt: '2026-07-10',
    memos: [{ id: 'M-1', at: '2026-08-26 09:10', by: 'admin02', text: '소멸 예정 금액이 사용 가능 잔액보다 큽니다. 배치 확인 필요.' }],
    history: [{ id: 'H-1', at: '2026-04-01 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
  {
    member: 'user07', memberStatus: '탈퇴',
    totalHeld: 3000, available: 3000, pending: 0, expiringSoon30: 0,
    pendingBatches: [], expiringBatches: [],
    recentActivity: [
      { id: 'A-1', at: '2026-06-01 09:00', type: '지급', amount: 3000, note: '구매 적립 · 주문 O-00610' },
    ],
    lastActivityAt: '2026-07-01',
    memos: [{ id: 'M-1', at: '2026-08-26 09:15', by: 'admin01', text: '탈퇴 회원 포인트 소멸 처리가 누락된 것으로 보입니다.' }],
    history: [
      { id: 'H-1', at: '2026-05-01 09:00', by: 'SYSTEM', action: '포인트 계정 생성' },
      { id: 'H-2', at: '2026-07-01 10:00', by: 'admin02', action: '회원 탈퇴 처리' },
    ],
  },
  {
    member: 'user08', memberStatus: '정상',
    totalHeld: -1500, available: -1500, pending: 0, expiringSoon30: 0,
    pendingBatches: [], expiringBatches: [],
    recentActivity: [
      { id: 'A-1', at: '2026-07-01 10:00', type: '지급', amount: 1000, note: '구매 적립 · 주문 O-00550' },
      { id: 'A-2', at: '2026-07-05 11:00', type: '차감', amount: -2500, note: '오지급 회수' },
    ],
    lastActivityAt: '2026-07-05',
    memos: [{ id: 'M-1', at: '2026-08-26 09:20', by: 'admin02', text: '차감 처리 중 마이너스 잔액이 발생했습니다. 확인 필요.' }],
    history: [{ id: 'H-1', at: '2026-04-15 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
  {
    member: 'user09', memberStatus: '정상',
    totalHeld: 62000, available: 50000, pending: 12000, expiringSoon30: 0,
    pendingBatches: [{ confirmAt: '2026-09-10', amount: 12000, source: '구매 적립' }],
    expiringBatches: [],
    recentActivity: [{ id: 'A-1', at: '2026-08-18 10:00', type: '지급', amount: 20000, note: '구매 적립' }],
    lastActivityAt: '2026-08-18', memos: [], history: [{ id: 'H-1', at: '2026-03-01 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
  {
    member: 'user10', memberStatus: '휴면',
    totalHeld: 1200, available: 1200, pending: 0, expiringSoon30: 1200,
    pendingBatches: [], expiringBatches: [{ expiresAt: '2026-08-31', amount: 1200 }],
    recentActivity: [{ id: 'A-1', at: '2026-05-01 09:00', type: '지급', amount: 1200, note: '이벤트 지급' }],
    lastActivityAt: '2026-05-01', memos: [], history: [{ id: 'H-1', at: '2026-02-01 09:00', by: 'SYSTEM', action: '포인트 계정 생성' }],
  },
];
