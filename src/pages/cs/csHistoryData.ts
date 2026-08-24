export type AuditTargetType = '1:1 문의' | '상담' | '관리자 메모' | '답변' | '문의 유형' | '답변 템플릿';
export type AuditActorType = 'ADMIN' | 'SYSTEM' | 'API';
export type AuditResult = '성공' | '실패' | '부분 성공';
export type AuditSource = 'Backoffice' | 'Auto Routing' | 'SLA Scheduler' | '고객 화면' | 'API';
export type AuditCategory = 'STATUS' | 'ASSIGNEE' | 'REPLY' | 'MEMO' | 'SYSTEM' | 'OTHER';

export interface AuditChange {
  field: string;
  before: string;
  after: string;
}

export interface CsAuditLog {
  id: string;
  targetType: AuditTargetType;
  targetId: string;
  targetSummary: string;
  customerId: string | null;
  customerName: string | null;
  actionCode: string;
  actionLabel: string;
  category: AuditCategory;
  summary: string;
  changes: AuditChange[];
  actorType: AuditActorType;
  actorId: string;
  team: string | null;
  source: AuditSource;
  reason?: string;
  result: AuditResult;
  resultDetail?: string;
  important: boolean;
  at: string;
  relatedInquiryId?: string;
  relatedConsultationId?: string;
}

export const AUDIT_TEAMS = ['일반 CS팀', '주문 CS팀', '결제 CS팀', '배송 CS팀', '정산 CS팀'];
export const AUDIT_ADMINS = ['admin01', 'admin02', 'admin03', 'admin04'];
export const TARGET_TYPES: AuditTargetType[] = ['1:1 문의', '상담', '관리자 메모', '답변', '문의 유형', '답변 템플릿'];
export const RESULT_TYPES: AuditResult[] = ['성공', '실패', '부분 성공'];
export const SOURCE_TYPES: AuditSource[] = ['Backoffice', 'Auto Routing', 'SLA Scheduler', '고객 화면', 'API'];
export const ACTION_LABELS = [
  '문의 접수', '문의 유형 기반 Routing', '자동 담당자 배정', '담당자 지정', '담당자 변경', '담당팀 이관',
  '문의 유형 변경', '우선순위 변경', '처리 시작', '상태 변경', '보류', '처리 재개', '처리 완료', '문의 재오픈',
  '고객 재문의 감지', '답변 발송', '추가 답변 발송', '알림 발송', 'SLA 변경', 'SLA 초과',
  '관리자 메모 등록', '관리자 메모 숨김', '상담 등록', '상담 결과 등록', '상담 기록 정정', '답변 템플릿 수정',
];

const CURRENT_ADMIN = 'admin01';
const TODAY_PREFIX = '2026-08-24';

export const CRITICAL_ACTION_CODES = new Set([
  'STATUS_COMPLETION_CANCELLED', 'INQUIRY_REOPENED', 'TEAM_TRANSFERRED', 'TYPE_CHANGED',
  'SLA_CHANGED', 'CONSULTATION_CORRECTED', 'MEMO_HIDDEN',
]);

export const CS_AUDIT_LOGS: CsAuditLog[] = [
  { id: 'LOG-0018201', targetType: '1:1 문의', targetId: 'QNA-00182', targetSummary: '배송 > 배송 지연', customerId: 'user01', customerName: '김민수', actionCode: 'INQUIRY_RECEIVED', actionLabel: '문의 접수', category: 'STATUS', summary: '문의 접수', changes: [], actorType: 'SYSTEM', actorId: 'SYSTEM', team: null, source: '고객 화면', result: '성공', important: false, at: '2026-08-24 10:20:05' },
  { id: 'LOG-0018202', targetType: '1:1 문의', targetId: 'QNA-00182', targetSummary: '배송 > 배송 지연', customerId: 'user01', customerName: '김민수', actionCode: 'AUTO_ROUTED', actionLabel: '문의 유형 기반 Routing', category: 'SYSTEM', summary: '일반 CS팀 → 배송 CS팀', changes: [{ field: '담당팀', before: '일반 CS팀', after: '배송 CS팀' }], actorType: 'SYSTEM', actorId: 'SYSTEM', team: '배송 CS팀', source: 'Auto Routing', result: '성공', important: false, at: '2026-08-24 10:20:06' },
  { id: 'LOG-0018203', targetType: '1:1 문의', targetId: 'QNA-00182', targetSummary: '배송 > 배송 지연', customerId: 'user01', customerName: '김민수', actionCode: 'ASSIGNEE_ASSIGNED', actionLabel: '자동 담당자 배정', category: 'ASSIGNEE', summary: '- → admin01', changes: [{ field: '담당자', before: '-', after: 'admin01' }], actorType: 'SYSTEM', actorId: 'SYSTEM', team: '배송 CS팀', source: 'Auto Routing', result: '성공', important: false, at: '2026-08-24 10:21:00' },
  { id: 'LOG-0018204', targetType: '1:1 문의', targetId: 'QNA-00182', targetSummary: '배송 > 배송 지연', customerId: 'user01', customerName: '김민수', actionCode: 'STATUS_CHANGED', actionLabel: '처리 시작', category: 'STATUS', summary: '접수 → 처리중', changes: [{ field: '처리 상태', before: '접수', after: '처리중' }], actorType: 'ADMIN', actorId: 'admin01', team: '배송 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-24 10:25:11' },
  { id: 'LOG-0018205', targetType: '1:1 문의', targetId: 'QNA-00182', targetSummary: '배송 > 배송 지연', customerId: 'user01', customerName: '김민수', actionCode: 'REPLY_SENT', actionLabel: '답변 발송', category: 'REPLY', summary: 'MESSAGE-00821 발송', changes: [], actorType: 'ADMIN', actorId: 'admin01', team: '배송 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-24 10:42:30', relatedConsultationId: 'CS-00382' },
  { id: 'LOG-0018206', targetType: '답변', targetId: 'MESSAGE-00821', targetSummary: 'QNA-00182 답변 알림', customerId: 'user01', customerName: '김민수', actionCode: 'NOTIFY_SENT', actionLabel: '알림 발송', category: 'SYSTEM', summary: '이메일 발송 성공 · SMS 발송 실패', changes: [], actorType: 'SYSTEM', actorId: 'SYSTEM', team: null, source: 'Backoffice', result: '부분 성공', resultDetail: '이메일 발송 성공 · SMS 발송 실패 (연락처 미인증)', important: false, at: '2026-08-24 10:42:35', relatedInquiryId: 'QNA-00182' },
  { id: 'LOG-0018207', targetType: '관리자 메모', targetId: 'MEMO-00182', targetSummary: '배송사 회신 대기중', customerId: 'user01', customerName: '김민수', actionCode: 'MEMO_CREATED', actionLabel: '관리자 메모 등록', category: 'MEMO', summary: '관리자 메모 등록', changes: [], actorType: 'ADMIN', actorId: 'admin01', team: '배송 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-24 10:45:02', relatedInquiryId: 'QNA-00182' },

  { id: 'LOG-0018181', targetType: '1:1 문의', targetId: 'QNA-00181', targetSummary: '결제 > 중복 결제', customerId: 'buyer02', customerName: '박서연', actionCode: 'INQUIRY_RECEIVED', actionLabel: '문의 접수', category: 'STATUS', summary: '문의 접수', changes: [], actorType: 'SYSTEM', actorId: 'SYSTEM', team: null, source: '고객 화면', result: '성공', important: false, at: '2026-08-24 09:45:00' },
  { id: 'LOG-0018182', targetType: '관리자 메모', targetId: 'MEMO-00176', targetSummary: '결제 담당팀 우선 확인 요청', customerId: 'buyer02', customerName: '박서연', actionCode: 'MEMO_CREATED', actionLabel: '관리자 메모 등록', category: 'MEMO', summary: '관리자 메모 등록', changes: [], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-24 09:55:00', relatedInquiryId: 'QNA-00181' },

  { id: 'LOG-0017901', targetType: '상담', targetId: 'CS-00379', targetSummary: '취소 / 환불 > 환불 지연', customerId: 'shop04', customerName: '최지우', actionCode: 'CONSULTATION_STARTED', actionLabel: '상담 등록', category: 'OTHER', summary: '이메일 상담 등록', changes: [], actorType: 'SYSTEM', actorId: 'SYSTEM', team: '결제 CS팀', source: '고객 화면', result: '성공', important: false, at: '2026-08-23 16:10:00', relatedInquiryId: 'QNA-00179' },
  { id: 'LOG-0017902', targetType: '상담', targetId: 'CS-00379', targetSummary: '취소 / 환불 > 환불 지연', customerId: 'shop04', customerName: '최지우', actionCode: 'REPLY_SENT', actionLabel: '답변 발송', category: 'REPLY', summary: '카드사 매입 취소 반영 확인 중 안내', changes: [], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-24 09:28:00', relatedInquiryId: 'QNA-00179' },
  { id: 'LOG-0017903', targetType: '1:1 문의', targetId: 'QNA-00179', targetSummary: '취소 / 환불 > 환불 지연', customerId: 'shop04', customerName: '최지우', actionCode: 'CUSTOMER_REOPEN_DETECTED', actionLabel: '고객 재문의 감지', category: 'SYSTEM', summary: '고객 추가 메시지 수신', changes: [], actorType: 'SYSTEM', actorId: 'SYSTEM', team: '결제 CS팀', source: '고객 화면', result: '성공', important: false, at: '2026-08-24 09:30:00' },
  { id: 'LOG-0017904', targetType: '1:1 문의', targetId: 'QNA-00179', targetSummary: '취소 / 환불 > 환불 지연', customerId: 'shop04', customerName: '최지우', actionCode: 'INQUIRY_REOPENED', actionLabel: '문의 재오픈', category: 'STATUS', summary: '처리 완료 → 처리중', changes: [{ field: '처리 상태', before: '처리 완료', after: '처리중' }], actorType: 'SYSTEM', actorId: 'SYSTEM', team: '결제 CS팀', source: '고객 화면', reason: '고객 재문의', result: '성공', important: true, at: '2026-08-24 09:30:05' },
  { id: 'LOG-0017905', targetType: '1:1 문의', targetId: 'QNA-00179', targetSummary: '취소 / 환불 > 환불 지연', customerId: 'shop04', customerName: '최지우', actionCode: 'SLA_BREACHED', actionLabel: 'SLA 초과', category: 'SYSTEM', summary: '첫 답변 SLA 초과', changes: [{ field: '첫 답변 SLA', before: '진행중', after: '초과' }], actorType: 'SYSTEM', actorId: 'SYSTEM', team: '결제 CS팀', source: 'SLA Scheduler', result: '성공', important: false, at: '2026-08-24 13:00:00' },
  { id: 'LOG-0017906', targetType: '상담', targetId: 'CS-00379', targetSummary: '취소 / 환불 > 환불 지연', customerId: 'shop04', customerName: '최지우', actionCode: 'TEAM_TRANSFERRED', actionLabel: '담당팀 이관', category: 'ASSIGNEE', summary: '결제 CS팀 → 정산 CS팀', changes: [{ field: '담당팀', before: '결제 CS팀', after: '정산 CS팀' }, { field: '담당자', before: 'admin02', after: 'admin04' }], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', reason: '환불 처리 협의 필요', result: '성공', important: true, at: '2026-08-24 10:40:00', relatedInquiryId: 'QNA-00179' },
  { id: 'LOG-0017907', targetType: '관리자 메모', targetId: 'MEMO-00181', targetSummary: 'PG사 취소 전문 정상 수신', customerId: 'shop04', customerName: '최지우', actionCode: 'MEMO_CREATED', actionLabel: '관리자 메모 등록', category: 'MEMO', summary: '관리자 메모 등록', changes: [], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-24 09:15:00', relatedConsultationId: 'CS-00379' },

  { id: 'LOG-0018001', targetType: '상담', targetId: 'CS-00381', targetSummary: '결제 > 결제 오류', customerId: 'buyer02', customerName: '박서연', actionCode: 'CONSULTATION_STARTED', actionLabel: '상담 등록', category: 'OTHER', summary: '전화 상담 등록', changes: [], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-23 16:12:00' },
  { id: 'LOG-0018002', targetType: '상담', targetId: 'CS-00381', targetSummary: '결제 > 결제 오류', customerId: 'buyer02', customerName: '박서연', actionCode: 'RESULT_RECORDED', actionLabel: '상담 결과 등록', category: 'STATUS', summary: '처리 결과: 안내 완료', changes: [{ field: '처리 결과', before: '-', after: '안내 완료' }], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-23 16:24:00' },
  { id: 'LOG-0018003', targetType: '관리자 메모', targetId: 'MEMO-00175', targetSummary: '동일 내용 중복 등록', customerId: 'buyer02', customerName: '박서연', actionCode: 'MEMO_CREATED', actionLabel: '관리자 메모 등록', category: 'MEMO', summary: '관리자 메모 등록', changes: [], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-23 16:30:00', relatedConsultationId: 'CS-00381' },
  { id: 'LOG-0018004', targetType: '관리자 메모', targetId: 'MEMO-00175', targetSummary: '동일 내용 중복 등록', customerId: 'buyer02', customerName: '박서연', actionCode: 'MEMO_HIDDEN', actionLabel: '관리자 메모 숨김', category: 'MEMO', summary: '메모 숨김', changes: [{ field: '노출 상태', before: '노출', after: '숨김' }], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', reason: '동일 내용 중복 등록', result: '성공', important: true, at: '2026-08-23 16:35:00', relatedConsultationId: 'CS-00381' },

  { id: 'LOG-0018380', targetType: '상담', targetId: 'CS-00380', targetSummary: '회원 / 계정 > 비밀번호', customerId: 'company03', customerName: '이준호', actionCode: 'CONSULTATION_CORRECTED', actionLabel: '상담 기록 정정', category: 'STATUS', summary: '해결 → 고객 확인 완료', changes: [{ field: '처리 결과', before: '해결', after: '고객 확인 완료' }], actorType: 'ADMIN', actorId: 'admin03', team: '일반 CS팀', source: 'Backoffice', reason: '결과 분류 오류', result: '성공', important: true, at: '2026-08-24 09:30:00' },

  { id: 'LOG-0018376', targetType: '1:1 문의', targetId: 'QNA-00176', targetSummary: '배송 > 배송지 변경', customerId: 'store07', customerName: '오세훈', actionCode: 'REPLY_SENT', actionLabel: '답변 발송', category: 'REPLY', summary: '배송사 수령지 변경 절차 안내', changes: [], actorType: 'ADMIN', actorId: 'admin02', team: '배송 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-20 12:00:00', relatedConsultationId: 'CS-00376' },
  { id: 'LOG-0018377', targetType: '답변', targetId: 'MESSAGE-00376', targetSummary: 'QNA-00176 답변 알림', customerId: 'store07', customerName: '오세훈', actionCode: 'NOTIFY_SENT', actionLabel: '알림 발송', category: 'SYSTEM', summary: '이메일 알림 발송 실패', changes: [], actorType: 'SYSTEM', actorId: 'SYSTEM', team: null, source: 'Backoffice', result: '실패', resultDetail: '이메일 주소 미등록', important: false, at: '2026-08-20 12:01:00', relatedInquiryId: 'QNA-00176' },

  { id: 'LOG-0018175', targetType: '1:1 문의', targetId: 'QNA-00175', targetSummary: '정산 > 세금계산서', customerId: 'corp08', customerName: '문가영', actionCode: 'TYPE_CHANGED', actionLabel: '문의 유형 변경', category: 'OTHER', summary: '기타 → 정산 > 세금계산서', changes: [{ field: '문의 유형', before: '기타', after: '정산 > 세금계산서' }, { field: '담당팀', before: '일반 CS팀', after: '정산 CS팀' }], actorType: 'ADMIN', actorId: 'admin04', team: '정산 CS팀', source: 'Backoffice', reason: '분류 오류 정정', result: '성공', important: true, at: '2026-08-23 14:22:00' },

  { id: 'LOG-0018601', targetType: '문의 유형', targetId: 'TYPE-006', targetSummary: '결제 > 중복 결제', customerId: null, customerName: null, actionCode: 'SLA_CHANGED', actionLabel: 'SLA 변경', category: 'OTHER', summary: '첫 답변 SLA 4시간 → 2시간', changes: [{ field: '첫 답변 SLA', before: '4시간', after: '2시간' }], actorType: 'ADMIN', actorId: 'admin02', team: '결제 CS팀', source: 'Backoffice', result: '성공', important: true, at: '2026-08-24 11:20:00' },
  { id: 'LOG-0018602', targetType: '문의 유형', targetId: 'TYPE-008', targetSummary: '배송 > 배송 지연', customerId: null, customerName: null, actionCode: 'TEAM_TRANSFERRED', actionLabel: '기본 담당팀 변경', category: 'OTHER', summary: '일반 CS팀 → 배송 CS팀', changes: [{ field: '기본 담당팀', before: '일반 CS팀', after: '배송 CS팀' }], actorType: 'ADMIN', actorId: 'admin02', team: '배송 CS팀', source: 'Backoffice', result: '성공', important: true, at: '2026-08-20 09:10:00' },
  { id: 'LOG-0018603', targetType: '문의 유형', targetId: 'TYPE-008', targetSummary: '배송 > 배송 지연', customerId: null, customerName: null, actionCode: 'SLA_CHANGED', actionLabel: 'SLA 변경', category: 'OTHER', summary: '첫 답변 SLA 24시간 → 4시간', changes: [{ field: '첫 답변 SLA', before: '24시간', after: '4시간' }], actorType: 'ADMIN', actorId: 'admin01', team: '배송 CS팀', source: 'Backoffice', reason: '배송팀 요청', result: '성공', important: true, at: '2026-08-24 11:20:00' },

  { id: 'LOG-0018701', targetType: '답변 템플릿', targetId: 'TPL-00182', targetSummary: '배송 지연 기본 안내', customerId: null, customerName: null, actionCode: 'TEMPLATE_UPDATED', actionLabel: '답변 템플릿 수정', category: 'OTHER', summary: 'V2 → V3', changes: [{ field: '버전', before: 'V2', after: 'V3' }], actorType: 'ADMIN', actorId: 'admin01', team: '배송 CS팀', source: 'Backoffice', reason: '배송팀 요청으로 안내 문구 수정', result: '성공', important: false, at: '2026-08-20 09:40:00' },

  { id: 'LOG-0018078', targetType: '1:1 문의', targetId: 'QNA-00178', targetSummary: '교환 / 반품 > 상품 파손', customerId: 'market05', customerName: '정하늘', actionCode: 'ASSIGNEE_ASSIGNED', actionLabel: '담당자 지정', category: 'ASSIGNEE', summary: '- → admin01', changes: [{ field: '담당자', before: '-', after: 'admin01' }], actorType: 'SYSTEM', actorId: 'SYSTEM', team: '배송 CS팀', source: 'Auto Routing', result: '성공', important: false, at: '2026-08-22 13:06:00' },
  { id: 'LOG-0018079', targetType: '1:1 문의', targetId: 'QNA-00178', targetSummary: '교환 / 반품 > 상품 파손', customerId: 'market05', customerName: '정하늘', actionCode: 'STATUS_CHANGED', actionLabel: '처리 완료', category: 'STATUS', summary: '처리중 → 처리 완료', changes: [{ field: '처리 상태', before: '처리중', after: '처리 완료' }], actorType: 'ADMIN', actorId: 'admin01', team: '배송 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-22 14:18:00' },

  { id: 'LOG-0018800', targetType: '1:1 문의', targetId: 'QNA-00180', targetSummary: '회원 / 계정 > 비밀번호', customerId: 'company03', customerName: '이준호', actionCode: 'STATUS_CHANGED', actionLabel: '처리 완료', category: 'STATUS', summary: '처리중 → 처리 완료', changes: [{ field: '처리 상태', before: '처리중', after: '처리 완료' }], actorType: 'ADMIN', actorId: 'admin03', team: '일반 CS팀', source: 'Backoffice', result: '성공', important: false, at: '2026-08-24 09:10:00' },
];

export type QuickFilterKey = '전체' | '오늘 처리' | '내 작업' | '상태 변경' | '담당자 변경' | '답변 발송' | '중요 변경';
export const QUICK_FILTERS: QuickFilterKey[] = ['전체', '오늘 처리', '내 작업', '상태 변경', '담당자 변경', '답변 발송', '중요 변경'];

export function matchesQuickFilter(log: CsAuditLog, filter: QuickFilterKey): boolean {
  if (filter === '오늘 처리') return log.at.startsWith(TODAY_PREFIX);
  if (filter === '내 작업') return log.actorType === 'ADMIN' && log.actorId === CURRENT_ADMIN;
  if (filter === '상태 변경') return log.category === 'STATUS';
  if (filter === '담당자 변경') return log.category === 'ASSIGNEE';
  if (filter === '답변 발송') return log.category === 'REPLY';
  if (filter === '중요 변경') return log.important;
  return true;
}

export function actorLabel(type: AuditActorType): string {
  return type === 'ADMIN' ? '관리자' : type === 'SYSTEM' ? '자동' : 'API';
}

export function actorColor(type: AuditActorType): { bg: string; fg: string } {
  if (type === 'ADMIN') return { bg: '#eff6ff', fg: '#2563eb' };
  if (type === 'SYSTEM') return { bg: '#f4f4f5', fg: '#52525b' };
  return { bg: '#f5f3ff', fg: '#7c3aed' };
}

export function categoryColor(category: AuditCategory): { bg: string; fg: string } {
  if (category === 'STATUS') return { bg: '#eff6ff', fg: '#2563eb' };
  if (category === 'ASSIGNEE') return { bg: '#f5f3ff', fg: '#7c3aed' };
  if (category === 'REPLY') return { bg: '#ecfdf5', fg: '#047857' };
  if (category === 'MEMO') return { bg: '#fffbeb', fg: '#b45309' };
  if (category === 'SYSTEM') return { bg: '#f4f4f5', fg: '#52525b' };
  return { bg: '#fdf4ff', fg: '#a21caf' };
}

export function resultColor(result: AuditResult): { bg: string; fg: string; dot: string } {
  if (result === '성공') return { bg: '#ecfdf5', fg: '#047857', dot: '#10b981' };
  if (result === '부분 성공') return { bg: '#fffbeb', fg: '#b45309', dot: '#f59e0b' };
  return { bg: '#fef2f2', fg: '#dc2626', dot: '#ef4444' };
}

export function splitAt(at: string): [string, string] {
  const [date, time] = at.split(' ');
  return [date.replace(/-/g, '.'), time ?? ''];
}

export function findAdjacent(log: CsAuditLog, all: CsAuditLog[]): { prev: CsAuditLog | null; next: CsAuditLog | null } {
  const sameTarget = all.filter((item) => item.targetType === log.targetType && item.targetId === log.targetId).sort((a, b) => a.at.localeCompare(b.at));
  const index = sameTarget.findIndex((item) => item.id === log.id);
  return { prev: index > 0 ? sameTarget[index - 1] : null, next: index >= 0 && index < sameTarget.length - 1 ? sameTarget[index + 1] : null };
}
