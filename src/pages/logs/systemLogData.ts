export const TODAY = '2026-08-26';

export type ApiResult = '성공' | '실패';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const MODULES = ['회원', '주문', '결제', '정산', '상품', '쿠폰/프로모션', '알림', '인증'] as const;
export type ModuleName = (typeof MODULES)[number];

export const SLOW_MS = 800;

export interface RelatedData {
  order?: string;
  member?: string;
  payment?: string;
}

export interface ApiLogEntry {
  id: string;
  at: string;
  method: HttpMethod;
  endpoint: string;
  statusCode: number;
  result: ApiResult;
  module: ModuleName;
  requester: string;
  ip: string;
  durationMs: number;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown> | null;
  errorCode: string | null;
  related: RelatedData;
}

const MASK_KEYS = new Set(['password', 'accessToken', 'refreshToken', 'authorization', 'apiSecret', 'secret', 'token']);

export function maskValue(key: string, value: unknown): unknown {
  if (MASK_KEYS.has(key)) return '********';
  if (key === 'email' && typeof value === 'string') {
    const [local, domain] = value.split('@');
    if (!domain) return value;
    return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
  }
  if (key === 'phone' && typeof value === 'string') {
    return value.replace(/(\d{2,3}-?\d{3,4}-?)(\d{4})/, (_, a) => `${a.replace(/\d/g, '*')}${value.slice(-4)}`);
  }
  return value;
}

export function maskBody(body: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!body) return null;
  const out: Record<string, unknown> = {};
  Object.entries(body).forEach(([k, v]) => {
    out[k] = typeof v === 'object' && v !== null && !Array.isArray(v) ? maskBody(v as Record<string, unknown>) : maskValue(k, v);
  });
  return out;
}

export const API_LOGS: ApiLogEntry[] = [
  { id: 'REQ-20260826-001284', at: '2026-08-26 14:21:32.128', method: 'POST', endpoint: '/api/orders', statusCode: 200, result: '성공', module: '주문', requester: 'user01', ip: '121.134.22.10', durationMs: 124, requestBody: { userId: 'user01', productId: 'P-001238', quantity: 2 }, responseBody: { orderId: 'O-01041', status: 'CREATED' }, errorCode: null, related: { order: 'O-01041', member: 'user01' } },
  { id: 'REQ-20260826-001283', at: '2026-08-26 14:21:30.842', method: 'GET', endpoint: '/api/users/user08', statusCode: 500, result: '실패', module: '회원', requester: 'admin02', ip: '121.134.22.41', durationMs: 842, requestBody: null, responseBody: { message: 'Internal server error' }, errorCode: 'INTERNAL_ERROR', related: { member: 'user08' } },
  { id: 'REQ-20260826-001282', at: '2026-08-26 14:20:02.301', method: 'POST', endpoint: '/api/payments/confirm', statusCode: 502, result: '실패', module: '결제', requester: 'user08', ip: '58.229.10.20', durationMs: 3120, requestBody: { orderId: 'O-01042', amount: 89000, cardToken: 'tok_abc' }, responseBody: { message: 'PG timeout' }, errorCode: 'PAYMENT_FAILED', related: { order: 'O-01042', member: 'user08' } },
  { id: 'REQ-20260826-001281', at: '2026-08-26 14:19:40.552', method: 'POST', endpoint: '/api/auth/login', statusCode: 401, result: '실패', module: '인증', requester: 'admin03', ip: '58.229.10.77', durationMs: 88, requestBody: { email: 'admin03@example.com', password: 'p@ssw0rd!' }, responseBody: { message: 'Invalid credentials' }, errorCode: 'AUTH_FAILED', related: {} },
  { id: 'REQ-20260826-001280', at: '2026-08-26 14:18:11.019', method: 'GET', endpoint: '/api/products/P-001239', statusCode: 200, result: '성공', module: '상품', requester: 'user02', ip: '121.134.22.15', durationMs: 46, requestBody: null, responseBody: { productCode: 'P-001239', name: '상품명 02' }, errorCode: null, related: {} },
  { id: 'REQ-20260826-001279', at: '2026-08-26 14:15:03.771', method: 'POST', endpoint: '/api/coupons/issue', statusCode: 200, result: '성공', module: '쿠폰/프로모션', requester: 'admin01', ip: '121.134.22.10', durationMs: 212, requestBody: { memberId: 'user05', couponCode: 'NEW5000' }, responseBody: { issueId: 'CI-20260826-00401' }, errorCode: null, related: { member: 'user05' } },
  { id: 'REQ-20260826-001278', at: '2026-08-26 14:10:55.404', method: 'PATCH', endpoint: '/api/orders/O-01035/status', statusCode: 500, result: '실패', module: '주문', requester: 'admin02', ip: '121.134.22.41', durationMs: 1980, requestBody: { status: 'SHIPPED' }, responseBody: { message: 'DB deadlock' }, errorCode: 'DB_ERROR', related: { order: 'O-01035' } },
  { id: 'REQ-20260826-001277', at: '2026-08-26 13:58:20.114', method: 'POST', endpoint: '/api/admin/roles', statusCode: 200, result: '성공', module: '인증', requester: 'admin01', ip: '121.134.22.10', durationMs: 66, requestBody: { roleId: 'role-content', permission: 'delete', value: false }, responseBody: { ok: true }, errorCode: null, related: {} },
  { id: 'REQ-20260826-001276', at: '2026-08-26 13:44:02.900', method: 'POST', endpoint: '/api/payments/confirm', statusCode: 502, result: '실패', module: '결제', requester: 'user04', ip: '58.229.10.55', durationMs: 3410, requestBody: { orderId: 'O-00920', amount: 45000, cardToken: 'tok_xyz' }, responseBody: { message: 'PG timeout' }, errorCode: 'PAYMENT_FAILED', related: { order: 'O-00920', member: 'user04' } },
  { id: 'REQ-20260826-001275', at: '2026-08-26 13:30:18.230', method: 'GET', endpoint: '/api/notifications/send', statusCode: 200, result: '성공', module: '알림', requester: 'admin01', ip: '121.134.22.10', durationMs: 58, requestBody: null, responseBody: { sent: 128 }, errorCode: null, related: {} },
  { id: 'REQ-20260825-001260', at: '2026-08-25 11:22:51.500', method: 'POST', endpoint: '/api/settlement/close', statusCode: 200, result: '성공', module: '정산', requester: 'admin04', ip: '121.134.22.90', durationMs: 640, requestBody: { settlementId: 'SET-20260825-011' }, responseBody: { status: 'CLOSED' }, errorCode: null, related: {} },
  { id: 'REQ-20260825-001259', at: '2026-08-25 09:12:44.061', method: 'POST', endpoint: '/api/payments/confirm', statusCode: 502, result: '실패', module: '결제', requester: 'user06', ip: '58.229.10.20', durationMs: 2890, requestBody: { orderId: 'O-00750', amount: 132000, cardToken: 'tok_def' }, responseBody: { message: 'PG timeout' }, errorCode: 'PAYMENT_FAILED', related: { order: 'O-00750', member: 'user06' } },
];

export type ErrorLevel = 'Critical' | 'Error' | 'Warning';
export const ERROR_LEVELS: ErrorLevel[] = ['Critical', 'Error', 'Warning'];
export const LEVEL_META: Record<ErrorLevel, { bg: string; fg: string }> = {
  Critical: { bg: '#fef2f2', fg: '#b91c1c' },
  Error: { bg: '#fff7ed', fg: '#c2410c' },
  Warning: { bg: '#fffbeb', fg: '#b45309' },
};

export interface ErrorOccurrence {
  id: string;
  at: string;
  requestId: string | null;
  member: string | null;
  order: string | null;
}

export interface ErrorGroup {
  errorCode: string;
  level: ErrorLevel;
  module: ModuleName;
  message: string;
  exception: string;
  stackTrace: string;
  occurrences: ErrorOccurrence[];
}

export const ERROR_GROUPS: ErrorGroup[] = [
  {
    errorCode: 'PAYMENT_FAILED', level: 'Critical', module: '결제', message: '결제 처리 중 PG 타임아웃이 발생했습니다.',
    exception: 'PgTimeoutException: upstream did not respond within 3000ms',
    stackTrace: 'at PaymentGateway.confirm (payment/gateway.ts:88)\n  at PaymentService.pay (payment/service.ts:142)\n  at async PaymentController.confirm (payment/controller.ts:41)',
    occurrences: [
      { id: 'ERR-00512', at: '2026-08-26 14:20:02', requestId: 'REQ-20260826-001282', member: 'user08', order: 'O-01042' },
      { id: 'ERR-00498', at: '2026-08-26 13:44:02', requestId: 'REQ-20260826-001276', member: 'user04', order: 'O-00920' },
      { id: 'ERR-00471', at: '2026-08-25 09:12:44', requestId: 'REQ-20260825-001259', member: 'user06', order: 'O-00750' },
    ],
  },
  {
    errorCode: 'DB_ERROR', level: 'Error', module: '주문', message: '주문 상태 변경 처리 중 데이터베이스 오류가 발생했습니다.',
    exception: 'DeadlockException: transaction was rolled back due to lock timeout',
    stackTrace: 'at OrderRepository.updateStatus (order/repository.ts:210)\n  at OrderService.ship (order/service.ts:88)\n  at async OrderController.updateStatus (order/controller.ts:63)',
    occurrences: [
      { id: 'ERR-00509', at: '2026-08-26 14:10:55', requestId: 'REQ-20260826-001278', member: null, order: 'O-01035' },
    ],
  },
  {
    errorCode: 'INTERNAL_ERROR', level: 'Error', module: '회원', message: '회원 정보 조회 처리 중 예상하지 못한 오류가 발생했습니다.',
    exception: 'TypeError: Cannot read properties of null (reading \'gradeId\')',
    stackTrace: 'at MemberService.getProfile (member/service.ts:57)\n  at async MemberController.get (member/controller.ts:22)',
    occurrences: [
      { id: 'ERR-00511', at: '2026-08-26 14:21:30', requestId: 'REQ-20260826-001283', member: 'user08', order: null },
    ],
  },
  {
    errorCode: 'AUTH_FAILED', level: 'Warning', module: '인증', message: '로그인 인증에 반복적으로 실패했습니다.',
    exception: 'InvalidCredentialsException: password mismatch',
    stackTrace: 'at AuthService.login (auth/service.ts:35)\n  at async AuthController.login (auth/controller.ts:18)',
    occurrences: [
      { id: 'ERR-00510', at: '2026-08-26 14:19:40', requestId: 'REQ-20260826-001281', member: null, order: null },
      { id: 'ERR-00505', at: '2026-08-26 11:06:20', requestId: null, member: null, order: null },
      { id: 'ERR-00504', at: '2026-08-26 11:05:58', requestId: null, member: null, order: null },
      { id: 'ERR-00503', at: '2026-08-26 11:05:40', requestId: null, member: null, order: null },
    ],
  },
];

export function errorFirstAt(g: ErrorGroup): string {
  return g.occurrences.reduce((min, o) => (o.at < min ? o.at : min), g.occurrences[0].at);
}
export function errorLastAt(g: ErrorGroup): string {
  return g.occurrences.reduce((max, o) => (o.at > max ? o.at : max), g.occurrences[0].at);
}

export type QuickRange = '오늘' | '어제' | '최근 7일' | '최근 30일';
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function quickRangeDates(range: QuickRange): [string, string] {
  switch (range) {
    case '오늘': return [TODAY, TODAY];
    case '어제': { const y = addDays(TODAY, -1); return [y, y]; }
    case '최근 7일': return [addDays(TODAY, -6), TODAY];
    case '최근 30일': return [addDays(TODAY, -29), TODAY];
  }
}
