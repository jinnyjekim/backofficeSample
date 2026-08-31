import type { ConfigScope } from '../../lib/business';

export type MessageStatus = '작성중' | '발송 예정' | '발송중' | '발송 완료' | '일부 실패' | '실패' | '중지';
export type MessageChannel = '앱 내' | 'Push' | '이메일' | 'SMS';
export type TargetType = '전체 사용자' | '조건 지정' | '개별 지정';

export interface DeliveryFailure { userId: string; channel: MessageChannel; reason: string; at: string }
export interface MessageHistory { at: string; actor: string; action: string; detail: string }
export interface OperatingMessage {
  id: string; businessScope?: ConfigScope; managementName: string; title: string; type: string; channels: MessageChannel[]; targetType: TargetType;
  targetDetail: string; estimatedTargets: number; actualTargets: number; status: MessageStatus; scheduledAt: string | null;
  sentAt: string | null; content: string; createdBy: string; createdAt: string; updatedAt: string;
  result: { success: number; failed: number; opened: number; clicked: number }; failures: DeliveryFailure[]; history: MessageHistory[];
}

export const MESSAGE_TYPES = ['공지', '안내', '이벤트', '점검', '정책 변경', '기타'];
export const CHANNELS: MessageChannel[] = ['앱 내', 'Push', '이메일', 'SMS'];

const MESSAGE_SCOPE_BY_ID: Record<string, ConfigScope> = {
  'MSG-20260826-001': '공통',
  'MSG-20260825-004': '공통',
  'MSG-20260825-003': 'B2C',
  'MSG-20260825-002': '공통',
  'MSG-20260824-008': 'C2C',
  'MSG-20260823-002': 'B2C',
  'MSG-20260822-006': '공통',
  'MSG-20260821-003': '공통',
  'MSG-20260820-001': 'B2B',
};

export function operatingMessageScope(message: OperatingMessage): ConfigScope {
  return message.businessScope ?? MESSAGE_SCOPE_BY_ID[message.id] ?? '공통';
}
const body = (subject: string) => `안녕하세요.\n\n${subject}와 관련하여 안내드립니다.\n서비스 이용에 참고해 주시기 바라며, 자세한 내용은 연결된 화면에서 확인하실 수 있습니다.\n\n감사합니다.`;

export const OPERATING_MESSAGES: OperatingMessage[] = [
  { id: 'MSG-20260826-001', managementName: '8월 정기 점검 완료 안내', title: '서비스 점검이 완료되었습니다', type: '점검', channels: ['앱 내', 'Push'], targetType: '전체 사용자', targetDetail: '정상 회원 전체', estimatedTargets: 12482, actualTargets: 12482, status: '일부 실패', scheduledAt: null, sentAt: '2026-08-26 14:30', content: body('8월 정기 점검 완료'), createdBy: 'admin01', createdAt: '2026-08-25 17:20', updatedAt: '2026-08-26 14:36', result: { success: 12318, failed: 164, opened: 9864, clicked: 2431 }, failures: [{ userId: 'U-00123', channel: 'Push', reason: '디바이스 토큰 만료', at: '2026-08-26 14:32' }, { userId: 'U-00124', channel: 'Push', reason: '수신 거부 토큰', at: '2026-08-26 14:32' }, { userId: 'U-00482', channel: '앱 내', reason: '탈퇴 처리 중 계정', at: '2026-08-26 14:33' }], history: [{ at: '2026-08-26 14:36', actor: 'SYSTEM', action: '발송 완료', detail: '성공 12,318 · 실패 164' }, { at: '2026-08-26 14:30', actor: 'admin01', action: '즉시 발송', detail: '전체 사용자 · 앱 내, Push' }] },
  { id: 'MSG-20260825-004', managementName: '9월 개인정보 정책 변경 안내', title: '개인정보 처리방침 변경 안내', type: '정책 변경', channels: ['앱 내', '이메일'], targetType: '전체 사용자', targetDetail: '정상 회원 전체', estimatedTargets: 12044, actualTargets: 0, status: '발송 예정', scheduledAt: '2026-09-01 10:00', sentAt: null, content: body('개인정보 처리방침 변경'), createdBy: 'admin02', createdAt: '2026-08-25 13:10', updatedAt: '2026-08-25 16:25', result: { success: 0, failed: 0, opened: 0, clicked: 0 }, failures: [], history: [{ at: '2026-08-25 16:25', actor: 'admin02', action: '예약 발송 설정', detail: '2026-09-01 10:00' }] },
  { id: 'MSG-20260825-003', managementName: 'VIP 고객 감사 쿠폰 안내', title: 'VIP 고객님을 위한 감사 혜택', type: '이벤트', channels: ['Push', '이메일'], targetType: '조건 지정', targetDetail: '회원 상태 정상 · 회원 등급 VIP · 마케팅 동의', estimatedTargets: 1842, actualTargets: 0, status: '발송 예정', scheduledAt: '2026-08-30 11:00', sentAt: null, content: body('VIP 감사 쿠폰 지급'), createdBy: 'admin01', createdAt: '2026-08-25 10:10', updatedAt: '2026-08-25 10:40', result: { success: 0, failed: 0, opened: 0, clicked: 0 }, failures: [], history: [{ at: '2026-08-25 10:40', actor: 'admin01', action: '예약 발송 설정', detail: 'VIP 1,842명 예상' }] },
  { id: 'MSG-20260825-002', managementName: '신규 회원 온보딩 메시지 초안', title: '서비스 이용을 시작해 보세요', type: '안내', channels: ['앱 내'], targetType: '조건 지정', targetDetail: '가입 7일 이내 · 정상 회원', estimatedTargets: 326, actualTargets: 0, status: '작성중', scheduledAt: null, sentAt: null, content: body('신규 회원 서비스 이용 방법'), createdBy: 'admin02', createdAt: '2026-08-25 09:20', updatedAt: '2026-08-25 09:32', result: { success: 0, failed: 0, opened: 0, clicked: 0 }, failures: [], history: [{ at: '2026-08-25 09:32', actor: 'admin02', action: '임시저장', detail: '콘텐츠 검토 전' }] },
  { id: 'MSG-20260824-008', managementName: '결제 오류 복구 개별 안내', title: '결제 오류가 복구되었습니다', type: '안내', channels: ['SMS'], targetType: '개별 지정', targetDetail: 'U-10520 외 14명', estimatedTargets: 15, actualTargets: 15, status: '발송 완료', scheduledAt: null, sentAt: '2026-08-24 18:25', content: body('결제 오류 복구'), createdBy: 'admin01', createdAt: '2026-08-24 18:10', updatedAt: '2026-08-24 18:26', result: { success: 15, failed: 0, opened: 0, clicked: 0 }, failures: [], history: [{ at: '2026-08-24 18:26', actor: 'SYSTEM', action: '발송 완료', detail: 'SMS 성공 15건' }] },
  { id: 'MSG-20260823-002', managementName: '주말 이벤트 오픈 공지', title: '이번 주말 한정 이벤트가 시작됩니다', type: '이벤트', channels: ['앱 내', 'Push'], targetType: '전체 사용자', targetDetail: '정상 회원 전체', estimatedTargets: 12186, actualTargets: 12186, status: '발송 완료', scheduledAt: '2026-08-23 09:00', sentAt: '2026-08-23 09:00', content: body('주말 한정 이벤트'), createdBy: 'admin02', createdAt: '2026-08-20 11:30', updatedAt: '2026-08-23 09:05', result: { success: 12186, failed: 0, opened: 9102, clicked: 3842 }, failures: [], history: [{ at: '2026-08-23 09:05', actor: 'SYSTEM', action: '발송 완료', detail: '전체 채널 성공' }] },
  { id: 'MSG-20260822-006', managementName: '휴면 전환 사전 안내', title: '계정 휴면 전환 예정 안내', type: '공지', channels: ['이메일', 'SMS'], targetType: '조건 지정', targetDetail: '최근 접속 11개월 이상 · 정상 회원', estimatedTargets: 542, actualTargets: 542, status: '실패', scheduledAt: '2026-08-22 10:00', sentAt: '2026-08-22 10:00', content: body('휴면 전환 예정'), createdBy: 'admin01', createdAt: '2026-08-20 09:10', updatedAt: '2026-08-22 10:02', result: { success: 0, failed: 542, opened: 0, clicked: 0 }, failures: [{ userId: '전체 대상', channel: '이메일', reason: '메일 발송 서비스 인증 오류', at: '2026-08-22 10:01' }], history: [{ at: '2026-08-22 10:02', actor: 'SYSTEM', action: '발송 실패', detail: '외부 채널 인증 오류' }] },
  { id: 'MSG-20260821-003', managementName: '긴급 점검 예약 취소 건', title: '긴급 점검 안내', type: '점검', channels: ['Push'], targetType: '전체 사용자', targetDetail: '정상 회원 전체', estimatedTargets: 12090, actualTargets: 0, status: '중지', scheduledAt: '2026-08-21 23:00', sentAt: null, content: body('긴급 점검'), createdBy: 'admin02', createdAt: '2026-08-21 17:10', updatedAt: '2026-08-21 18:02', result: { success: 0, failed: 0, opened: 0, clicked: 0 }, failures: [], history: [{ at: '2026-08-21 18:02', actor: 'admin02', action: '예약 발송 취소', detail: '점검 일정 취소' }] },
  { id: 'MSG-20260820-001', managementName: '대량 발송 처리 중 샘플', title: '서비스 이용 안내', type: '안내', channels: ['앱 내', 'Push', '이메일'], targetType: '전체 사용자', targetDetail: '정상 회원 전체', estimatedTargets: 12044, actualTargets: 7360, status: '발송중', scheduledAt: null, sentAt: '2026-08-26 15:35', content: body('서비스 이용'), createdBy: 'admin01', createdAt: '2026-08-20 10:00', updatedAt: '2026-08-26 15:40', result: { success: 7310, failed: 50, opened: 3842, clicked: 806 }, failures: [], history: [{ at: '2026-08-26 15:35', actor: 'admin01', action: '즉시 발송 시작', detail: '다중 채널 발송 처리 중' }] },
];
