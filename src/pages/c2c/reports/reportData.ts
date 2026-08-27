export type ReportTargetType = '회원' | '상품' | '거래' | '메시지' | '리뷰';
export type ReportStatus = '접수' | '검토중' | '소명대기' | '조치연계' | '처리완료' | '반려';
export type ReportPriority = '긴급' | '높음' | '보통' | '낮음';

export interface ReportHistory {
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface ReportCase {
  id: string;
  receivedAt: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  reporterId: string;
  reportedUserId: string;
  category: string;
  summary: string;
  status: ReportStatus;
  priority: ReportPriority;
  assignee: string;
  dueAt: string;
  duplicateCount: number;
  evidence: string[];
  linkedAction: string;
  actionResult: string;
  history: ReportHistory[];
}

export interface ReportAuditLog {
  id: string;
  occurredAt: string;
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
  action: string;
  before: string;
  after: string;
  actor: string;
  reason: string;
  linkedAction: string;
}

const history = (action: string, detail: string, actor = 'SYSTEM', at = '2026-08-27 09:00'): ReportHistory[] => [{ at, actor, action, detail }];

export const REPORT_CASES: ReportCase[] = [
  { id: 'RPT-260827-052', receivedAt: '2026-08-27 09:18', targetType: '상품', targetId: 'PRD-260824', targetTitle: '한정판 캐릭터 피규어 세트', reporterId: 'buyer_3182', reportedUserId: 'SEL-11209', category: '위조품 의심', summary: '정품 인증 이미지가 다른 판매 게시물과 동일하다는 신고입니다.', status: '검토중', priority: '긴급', assignee: 'admin03', dueAt: '2026-08-27 15:00', duplicateCount: 4, evidence: ['신고자 비교 이미지 2장', '원본 상품 URL', '채팅 캡처 1장'], linkedAction: '/c2c/products/moderation', actionResult: '상품 임시 숨김 · 판매자 소명 대기', history: [{ at: '2026-08-27 09:32', actor: 'admin03', action: '검토 시작', detail: '중복 신고 4건 병합 및 상품 임시 숨김 요청' }, ...history('신고 접수', '상품 신고 자동 분류', 'SYSTEM', '2026-08-27 09:18')] },
  { id: 'RPT-260827-051', receivedAt: '2026-08-27 08:54', targetType: '메시지', targetId: 'MSG-882104', targetTitle: '거래 채팅 메시지', reporterId: 'buyer_9012', reportedUserId: 'SEL-12438', category: '외부 결제 유도', summary: '판매자가 안전결제를 취소하고 계좌이체를 요구했습니다.', status: '접수', priority: '높음', assignee: '미배정', dueAt: '2026-08-27 16:00', duplicateCount: 1, evidence: ['신고 메시지 원문', '앞뒤 대화 10건'], linkedAction: '/c2c/sanctions/processing?type=chat', actionResult: '미결정', history: history('신고 접수', '금지 표현 사전 매칭 · 외부 결제', 'SYSTEM', '2026-08-27 08:54') },
  { id: 'RPT-260827-050', receivedAt: '2026-08-27 08:20', targetType: '거래', targetId: 'TRD-202608-8107', targetTitle: '시그마 28-70mm F2.8 거래', reporterId: 'lensman', reportedUserId: 'SEL-11902', category: '상품 상태 불일치', summary: '설명에 없던 렌즈 흠집이 확인되어 구매자가 거래를 신고했습니다.', status: '소명대기', priority: '높음', assignee: 'admin02', dueAt: '2026-08-28 12:00', duplicateCount: 1, evidence: ['수령 상품 사진 4장', '상품 설명 캡처'], linkedAction: '/c2c/disputes/processing?status=received', actionResult: '분쟁 DSP-260827-014 생성', history: [{ at: '2026-08-27 09:05', actor: 'admin02', action: '판매자 소명 요청', detail: '출고 전 상품 상태 사진 제출 요청' }, ...history('신고 접수', '거래 분쟁 가능성 높음', 'SYSTEM', '2026-08-27 08:20')] },
  { id: 'RPT-260827-049', receivedAt: '2026-08-27 07:42', targetType: '회원', targetId: 'SEL-13226', targetTitle: '태윤테크', reporterId: 'buyer_1128', reportedUserId: 'SEL-13226', category: '반복 거래 취소', summary: '결제 이후 판매자가 반복적으로 일방 취소한다는 신고입니다.', status: '조치연계', priority: '보통', assignee: 'admin04', dueAt: '2026-08-28 18:00', duplicateCount: 3, evidence: ['취소 거래 3건', '판매자 채팅 응답'], linkedAction: '/c2c/sanctions/processing?type=sales', actionResult: '판매 제한 검토 SNC-260827-031 연계', history: [{ at: '2026-08-27 10:00', actor: 'admin04', action: '판매 제한 검토 연계', detail: '반복 취소 신고 3건 및 취소율 지표 전달' }, ...history('신고 접수', '동일 대상 신고 3건 자동 병합', 'SYSTEM', '2026-08-27 07:42')] },
  { id: 'RPT-260826-118', receivedAt: '2026-08-26 22:11', targetType: '리뷰', targetId: 'REV-C-260826-91', targetTitle: '거래 후기', reporterId: 'SEL-10813', reportedUserId: 'buyer_5512', category: '욕설 / 비방', summary: '거래 후기에서 판매자 개인정보와 모욕적 표현이 노출됐습니다.', status: '검토중', priority: '보통', assignee: 'admin01', dueAt: '2026-08-27 18:00', duplicateCount: 1, evidence: ['리뷰 원문', '수정 전 스냅샷'], linkedAction: '/b2c/reviews/reported', actionResult: '리뷰 비노출 검토중', history: [{ at: '2026-08-27 08:40', actor: 'admin01', action: '검토 시작', detail: '개인정보 포함 여부 확인' }, ...history('신고 접수', '욕설 키워드 자동 표시', 'SYSTEM', '2026-08-26 22:11')] },
  { id: 'RPT-260826-113', receivedAt: '2026-08-26 19:30', targetType: '메시지', targetId: 'MSG-881955', targetTitle: '거래 채팅 메시지', reporterId: 'buyer_3021', reportedUserId: 'SEL-10482', category: '스팸', summary: '거래와 무관한 홍보 링크가 반복 전송됐다는 신고입니다.', status: '처리완료', priority: '낮음', assignee: 'admin01', dueAt: '2026-08-27 18:00', duplicateCount: 2, evidence: ['신고 메시지 3건'], linkedAction: '/c2c/sanctions/processing?type=chat', actionResult: '메시지 삭제 · 24시간 채팅 제한', history: [{ at: '2026-08-26 20:02', actor: 'admin01', action: '처리 완료', detail: '메시지 삭제 및 24시간 채팅 제한' }, ...history('신고 접수', '스팸 URL 패턴 감지', 'SYSTEM', '2026-08-26 19:30')] },
  { id: 'RPT-260826-108', receivedAt: '2026-08-26 16:12', targetType: '상품', targetId: 'PRD-260821', targetTitle: '아크테릭스 베타 LT 재킷', reporterId: 'buyer_4301', reportedUserId: 'SEL-10482', category: '카테고리 오류', summary: '상품 카테고리가 잘못 등록됐다는 신고였으나 정상 분류로 확인했습니다.', status: '반려', priority: '낮음', assignee: 'admin02', dueAt: '2026-08-27 16:00', duplicateCount: 1, evidence: ['상품 상세 캡처'], linkedAction: '-', actionResult: '신고 반려 · 상품 상태 유지', history: [{ at: '2026-08-26 17:00', actor: 'admin02', action: '신고 반려', detail: '운영 카테고리 기준상 정상 분류' }, ...history('신고 접수', '상품 카테고리 신고', 'SYSTEM', '2026-08-26 16:12')] },
  { id: 'RPT-260826-101', receivedAt: '2026-08-26 13:05', targetType: '회원', targetId: 'buyer_8841', targetTitle: 'quickdeal88', reporterId: 'SEL-12991', reportedUserId: 'buyer_8841', category: '비정상 구매 활동', summary: '서로 다른 계정으로 동일 상품을 반복 예약했다가 취소했습니다.', status: '조치연계', priority: '높음', assignee: 'admin04', dueAt: '2026-08-27 13:00', duplicateCount: 2, evidence: ['연관 거래 4건', '기기 식별 결과'], linkedAction: '/c2c/safety/monitoring', actionResult: '위험 건 RISK-260826-044 연계', history: [{ at: '2026-08-26 22:31', actor: 'SYSTEM', action: '거래 안전 연계', detail: '의심 계정 위험 점수 83점' }, ...history('신고 접수', '반복 예약 취소', 'SYSTEM', '2026-08-26 13:05')] },
];

export const REPORT_AUDIT_LOGS: ReportAuditLog[] = REPORT_CASES.flatMap((report, reportIndex) => report.history.map((item, historyIndex) => ({
  id: `RLOG-${String(reportIndex + 1).padStart(2, '0')}-${historyIndex + 1}`,
  occurredAt: item.at,
  reportId: report.id,
  targetType: report.targetType,
  targetId: report.targetId,
  action: item.action,
  before: historyIndex === report.history.length - 1 ? '-' : report.status === '처리완료' || report.status === '반려' ? '검토중' : '접수',
  after: historyIndex === report.history.length - 1 ? '접수' : report.status,
  actor: item.actor,
  reason: item.detail,
  linkedAction: report.linkedAction,
})));

export const REPORT_STATUS_META: Record<ReportStatus, { bg: string; fg: string }> = {
  접수: { bg: '#fef2f2', fg: '#dc2626' }, 검토중: { bg: '#eff6ff', fg: '#1d4ed8' }, 소명대기: { bg: '#f5f3ff', fg: '#6d28d9' }, 조치연계: { bg: '#fff7ed', fg: '#c2410c' }, 처리완료: { bg: '#ecfdf5', fg: '#047857' }, 반려: { bg: '#f4f4f5', fg: '#52525b' },
};
export const REPORT_PRIORITY_META: Record<ReportPriority, { bg: string; fg: string }> = {
  긴급: { bg: '#fee2e2', fg: '#991b1b' }, 높음: { bg: '#fff7ed', fg: '#c2410c' }, 보통: { bg: '#eff6ff', fg: '#1d4ed8' }, 낮음: { bg: '#f4f4f5', fg: '#52525b' },
};
