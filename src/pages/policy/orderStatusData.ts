export type LifecycleStage = '접수' | '승인' | '확정' | '처리' | '완료' | '취소' | '예외';
export type ChangeMode = '수동' | '자동' | '수동+자동';
export type EditPolicy = '가능' | '제한적' | '불가';
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ReasonRule = '없음' | '선택' | '필수';

export interface StatusHistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface OrderStatusEntry {
  id: string;
  name: string;
  code: string;
  description: string;
  stage: LifecycleStage;
  isTerminal: boolean;
  isSuccess: boolean;
  isCancelled: boolean;
  isException: boolean;
  changeMode: ChangeMode;
  editPolicy: EditPolicy;
  userLabel: string;
  userVisible: boolean;
  badgeTone: BadgeTone;
  order: number;
  active: boolean;
  orderCount: number;
  adminMemo: string;
  updatedAt: string;
  updatedBy: string;
  history: StatusHistoryEntry[];
}

export interface TransitionEntry {
  id: string;
  from: string;
  to: string;
  mode: ChangeMode;
  condition?: string;
  reasonRule: ReasonRule;
  allowedRoles: string[];
}

export const LIFECYCLE_STAGES: LifecycleStage[] = ['접수', '승인', '확정', '처리', '완료', '취소', '예외'];
export const BADGE_TONE_META: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: '#f4f4f5', fg: '#52525b' },
  info: { bg: '#eff6ff', fg: '#2563eb' },
  success: { bg: '#ecfdf5', fg: '#059669' },
  warning: { bg: '#fffbeb', fg: '#b45309' },
  danger: { bg: '#fef2f2', fg: '#dc2626' },
};
export const ROLE_OPTIONS = ['주문 관리자', 'CS 관리자', '일반 상담원'];
export const CHANGE_MODES: ChangeMode[] = ['수동', '자동', '수동+자동'];
export const REASON_RULES: ReasonRule[] = ['없음', '선택', '필수'];

export const ORDER_STATUSES: OrderStatusEntry[] = [
  {
    id: 'RECEIVED', name: '주문 접수', code: 'RECEIVED', description: '고객 주문이 접수되어 확인 대기중인 상태입니다.',
    stage: '접수', isTerminal: false, isSuccess: false, isCancelled: false, isException: false,
    changeMode: '수동+자동', editPolicy: '가능', userLabel: '주문 접수', userVisible: true, badgeTone: 'neutral',
    order: 1, active: true, orderCount: 48, adminMemo: '',
    updatedAt: '2026-07-01', updatedBy: 'admin01',
    history: [{ id: 'H-RECEIVED-1', at: '2026-07-01 09:00', by: 'admin01', action: '상태 생성' }],
  },
  {
    id: 'APPROVAL_PENDING', name: '승인 대기', code: 'APPROVAL_PENDING', description: '내부 승인 절차가 필요한 주문이 대기중인 상태입니다.',
    stage: '승인', isTerminal: false, isSuccess: false, isCancelled: false, isException: false,
    changeMode: '수동', editPolicy: '제한적', userLabel: '주문 확인중', userVisible: true, badgeTone: 'warning',
    order: 2, active: true, orderCount: 12, adminMemo: '고액 주문 · 신규 거래처 주문에서 주로 발생',
    updatedAt: '2026-07-01', updatedBy: 'admin01',
    history: [{ id: 'H-APPROVAL_PENDING-1', at: '2026-07-01 09:00', by: 'admin01', action: '상태 생성' }],
  },
  {
    id: 'CONFIRMED', name: '주문 확정', code: 'CONFIRMED', description: '주문 내용이 확인되어 처리를 시작할 수 있는 상태입니다.',
    stage: '확정', isTerminal: false, isSuccess: false, isCancelled: false, isException: false,
    changeMode: '수동', editPolicy: '제한적', userLabel: '주문 확정', userVisible: true, badgeTone: 'info',
    order: 3, active: true, orderCount: 34, adminMemo: '',
    updatedAt: '2026-07-01', updatedBy: 'admin01',
    history: [{ id: 'H-CONFIRMED-1', at: '2026-07-01 09:00', by: 'admin01', action: '상태 생성' }],
  },
  {
    id: 'PROCESSING', name: '처리중', code: 'PROCESSING', description: '상품 준비 및 출고 작업이 진행중인 상태입니다.',
    stage: '처리', isTerminal: false, isSuccess: false, isCancelled: false, isException: false,
    changeMode: '수동+자동', editPolicy: '제한적', userLabel: '상품 준비중', userVisible: true, badgeTone: 'info',
    order: 4, active: true, orderCount: 21, adminMemo: '',
    updatedAt: '2026-08-10', updatedBy: 'admin02',
    history: [
      { id: 'H-PROCESSING-1', at: '2026-07-01 09:00', by: 'admin01', action: '상태 생성' },
      { id: 'H-PROCESSING-2', at: '2026-08-10 11:20', by: 'admin02', action: '사용자 노출명 변경', before: '처리중', after: '상품 준비중' },
    ],
  },
  {
    id: 'SHIPPING_PREP', name: '배송 준비중', code: 'SHIPPING_PREP', description: '출고 검수를 마치고 배송사 인계를 준비중인 상태입니다.',
    stage: '처리', isTerminal: false, isSuccess: false, isCancelled: false, isException: false,
    changeMode: '자동', editPolicy: '불가', userLabel: '배송 준비중', userVisible: true, badgeTone: 'info',
    order: 5, active: true, orderCount: 9, adminMemo: '배송 관리 모듈의 출고 이벤트로 자동 전환됨',
    updatedAt: '2026-07-01', updatedBy: 'admin01',
    history: [{ id: 'H-SHIPPING_PREP-1', at: '2026-07-01 09:00', by: 'admin01', action: '상태 생성' }],
  },
  {
    id: 'COMPLETED', name: '주문 완료', code: 'COMPLETED', description: '모든 상품의 배송이 완료되어 주문이 종료된 상태입니다.',
    stage: '완료', isTerminal: true, isSuccess: true, isCancelled: false, isException: false,
    changeMode: '자동', editPolicy: '불가', userLabel: '주문 완료', userVisible: true, badgeTone: 'success',
    order: 6, active: true, orderCount: 4822, adminMemo: '',
    updatedAt: '2026-07-01', updatedBy: 'admin01',
    history: [{ id: 'H-COMPLETED-1', at: '2026-07-01 09:00', by: 'admin01', action: '상태 생성' }],
  },
  {
    id: 'CANCELLED', name: '주문 취소', code: 'CANCELLED', description: '고객 요청 또는 운영 사유로 주문이 취소된 상태입니다.',
    stage: '취소', isTerminal: true, isSuccess: false, isCancelled: true, isException: false,
    changeMode: '수동', editPolicy: '불가', userLabel: '주문 취소', userVisible: true, badgeTone: 'danger',
    order: 7, active: true, orderCount: 156, adminMemo: '',
    updatedAt: '2026-07-01', updatedBy: 'admin01',
    history: [{ id: 'H-CANCELLED-1', at: '2026-07-01 09:00', by: 'admin01', action: '상태 생성' }],
  },
  {
    id: 'ON_HOLD', name: '처리 보류', code: 'ON_HOLD', description: '재고·결제 등 이슈 확인이 필요해 처리를 일시 중단한 상태입니다.',
    stage: '예외', isTerminal: false, isSuccess: false, isCancelled: false, isException: true,
    changeMode: '수동', editPolicy: '제한적', userLabel: '주문 확인중', userVisible: false, badgeTone: 'warning',
    order: 8, active: true, orderCount: 3, adminMemo: '다음 상태 전환 미설정 · 확인 필요',
    updatedAt: '2026-08-20', updatedBy: 'admin02',
    history: [{ id: 'H-ON_HOLD-1', at: '2026-08-20 10:00', by: 'admin02', action: '상태 생성' }],
  },
];

export const TRANSITIONS: TransitionEntry[] = [
  { id: 'T-1', from: 'RECEIVED', to: 'APPROVAL_PENDING', mode: '수동', reasonRule: '없음', allowedRoles: ['주문 관리자', 'CS 관리자'] },
  { id: 'T-2', from: 'RECEIVED', to: 'CONFIRMED', mode: '수동', reasonRule: '없음', allowedRoles: ['주문 관리자', 'CS 관리자'] },
  { id: 'T-3', from: 'RECEIVED', to: 'CANCELLED', mode: '수동', reasonRule: '필수', allowedRoles: ['주문 관리자', 'CS 관리자'] },
  { id: 'T-4', from: 'APPROVAL_PENDING', to: 'CONFIRMED', mode: '수동', reasonRule: '없음', allowedRoles: ['주문 관리자'] },
  { id: 'T-5', from: 'APPROVAL_PENDING', to: 'CANCELLED', mode: '수동', reasonRule: '필수', allowedRoles: ['주문 관리자'] },
  { id: 'T-6', from: 'CONFIRMED', to: 'PROCESSING', mode: '수동+자동', condition: '결제 완료', reasonRule: '없음', allowedRoles: ['주문 관리자'] },
  { id: 'T-7', from: 'CONFIRMED', to: 'CANCELLED', mode: '수동', reasonRule: '필수', allowedRoles: ['주문 관리자'] },
  { id: 'T-8', from: 'PROCESSING', to: 'SHIPPING_PREP', mode: '자동', condition: '출고 검수 완료', reasonRule: '없음', allowedRoles: [] },
  { id: 'T-9', from: 'PROCESSING', to: 'ON_HOLD', mode: '수동', reasonRule: '필수', allowedRoles: ['주문 관리자', 'CS 관리자'] },
  { id: 'T-10', from: 'SHIPPING_PREP', to: 'COMPLETED', mode: '자동', condition: '잔여 출고수량 0건', reasonRule: '없음', allowedRoles: [] },
];

export const STATUS_MAP: Record<string, OrderStatusEntry> = Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, s]));

export function outgoing(statusId: string, transitions: TransitionEntry[] = TRANSITIONS): TransitionEntry[] {
  return transitions.filter((t) => t.from === statusId);
}
export function incoming(statusId: string, transitions: TransitionEntry[] = TRANSITIONS): TransitionEntry[] {
  return transitions.filter((t) => t.to === statusId);
}
export function findTransition(from: string, to: string, transitions: TransitionEntry[] = TRANSITIONS): TransitionEntry | null {
  return transitions.find((t) => t.from === from && t.to === to) ?? null;
}

export interface ValidationWarning {
  id: string;
  statusId: string;
  message: string;
}

export function computeValidationWarnings(statuses: OrderStatusEntry[] = ORDER_STATUSES, transitions: TransitionEntry[] = TRANSITIONS): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  statuses.filter((s) => s.active).forEach((s) => {
    if (!s.isTerminal && outgoing(s.id, transitions).length === 0) {
      warnings.push({ id: `deadend-${s.id}`, statusId: s.id, message: `'${s.name}' 상태는 다음 상태로 전환할 경로가 없는 비종료 상태입니다.` });
    }
    if (s.stage !== '접수' && incoming(s.id, transitions).length === 0) {
      warnings.push({ id: `unreachable-${s.id}`, statusId: s.id, message: `'${s.name}' 상태로 진입 가능한 전환이 없습니다.` });
    }
    if (s.isTerminal && outgoing(s.id, transitions).length > 0) {
      warnings.push({ id: `terminal-out-${s.id}`, statusId: s.id, message: `종료 상태인 '${s.name}'에 다음 상태로의 전환이 설정되어 있습니다.` });
    }
  });
  return warnings;
}

export type QuickFilter = '전체' | '사용중' | '비활성' | '종료 상태' | '설정 오류';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '사용중', '비활성', '종료 상태', '설정 오류'];

export function statusIssues(status: OrderStatusEntry, warnings: ValidationWarning[]): string[] {
  return warnings.filter((w) => w.statusId === status.id).map((w) => w.message);
}

export function matchesQuickFilter(status: OrderStatusEntry, filter: QuickFilter, warnings: ValidationWarning[]): boolean {
  if (filter === '사용중') return status.active;
  if (filter === '비활성') return !status.active;
  if (filter === '종료 상태') return status.isTerminal;
  if (filter === '설정 오류') return statusIssues(status, warnings).length > 0;
  return true;
}

export function newOrderStatus(): OrderStatusEntry {
  return {
    id: `STATUS-${Date.now()}`, name: '', code: '', description: '',
    stage: '처리', isTerminal: false, isSuccess: false, isCancelled: false, isException: false,
    changeMode: '수동', editPolicy: '제한적', userLabel: '', userVisible: true, badgeTone: 'neutral',
    order: 99, active: true, orderCount: 0, adminMemo: '',
    updatedAt: '2026-08-24', updatedBy: 'admin01', history: [],
  };
}
