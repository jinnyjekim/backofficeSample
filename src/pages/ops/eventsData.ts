export type EventStatus = '작성중' | '진행 예정' | '진행중' | '종료' | '비활성';
export type EventType = '안내형' | '참여형' | '응모형' | '혜택형' | '출석형' | '구매조건형' | '기타';
export type EventTarget = '전체 사용자' | '로그인 사용자' | '신규 회원' | '우수 거래처' | '특정 회원 그룹';
export type ParticipationMethod = '신청 버튼' | '응모' | '자동 참여' | '특정 Action 완료' | '외부 페이지 이동' | '참여 기능 없음';
export type ParticipationLimit = '1인 1회' | '하루 1회' | '기간 내 3회' | '제한 없음';
export type BenefitType = '혜택 없음' | '쿠폰' | '포인트' | '할인' | '경품' | '기타';
export type GrantMethod = '참여 즉시' | '조건 충족 즉시' | '이벤트 종료 후' | '관리자 확인 후' | '당첨 후';

export interface EventHistoryEntry { when: string; title: string; by: string; detail?: string }
export interface EventMemo { when: string; by: string; text: string }
export interface EventLink { id: string; name: string; status: '노출중' | '노출예정' | '종료' | '게시중' }
export interface EventWinnerSetting {
  totalEntries: number;
  plannedWinners: number;
  confirmedWinners: number;
  announcementAt: string;
  selectionMethod: '수동' | '랜덤 추첨';
  status: '선정 대기' | '검토 중' | '당첨 확정';
}

export interface EventEntry {
  id: string;
  managementName: string;
  displayName: string;
  type: EventType;
  summary: string;
  content: string;
  participationGuide: string;
  caution: string;
  imageTone: string;
  hasHeroImage: boolean;
  eventStartAt: string;
  eventEndAt: string;
  displayStartAt: string;
  displayEndAt: string;
  target: EventTarget;
  targetDetail?: string;
  exclusions: string[];
  participationMethod: ParticipationMethod;
  participationLimit: ParticipationLimit;
  benefitType: BenefitType;
  benefitName: string;
  grantMethod: GrantMethod;
  benefitTotal: number;
  benefitGranted: number;
  benefitPending: number;
  benefitFailed: number;
  participants: number;
  todayParticipants: number;
  targetCount?: number;
  pageViews: number;
  linkedBanners: EventLink[];
  linkedPopups: EventLink[];
  linkedNotice: EventLink | null;
  manager: string;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  isActive: boolean;
  manuallyEnded: boolean;
  issueFlags: string[];
  winner?: EventWinnerSetting;
  history: EventHistoryEntry[];
  memos: EventMemo[];
}

const DEFAULT_CONTENT = {
  exclusions: ['제재 회원', '탈퇴 회원'],
  benefitPending: 0,
  benefitFailed: 0,
  linkedPopups: [],
  linkedNotice: null,
  isDraft: false,
  isActive: true,
  manuallyEnded: false,
  issueFlags: [],
  memos: [],
} satisfies Partial<EventEntry>;

export const EVENTS: EventEntry[] = [
  {
    ...DEFAULT_CONTENT,
    id: 'EVENT-00182', managementName: '2026_08_신규거래처_웰컴', displayName: '신규 거래처 웰컴 쿠폰 이벤트', type: '참여형',
    summary: '8월 신규 가입 거래처를 위한 첫 주문 지원 프로모션입니다.',
    content: '신규 거래처라면 이벤트에 참여하고 첫 주문에 사용할 수 있는 웰컴 쿠폰을 받아보세요.',
    participationGuide: '1. 로그인\n2. 이벤트 참여 버튼 선택\n3. 쿠폰함에서 지급된 쿠폰 확인',
    caution: '쿠폰은 거래처당 1회만 지급되며 다른 쿠폰과 중복 적용할 수 없습니다.', imageTone: '#4f46e5', hasHeroImage: true,
    eventStartAt: '2026-08-01 00:00', eventEndAt: '2026-08-31 23:59', displayStartAt: '2026-07-25 09:00', displayEndAt: '2026-09-05 23:59',
    target: '신규 회원', targetDetail: '2026-08-01 이후 가입한 거래처', exclusions: ['이미 참여 완료', '제재 회원', '탈퇴 회원'],
    participationMethod: '신청 버튼', participationLimit: '1인 1회', benefitType: '쿠폰', benefitName: '첫 주문 20,000원 할인 쿠폰', grantMethod: '참여 즉시',
    benefitTotal: 500, benefitGranted: 428, benefitPending: 4, benefitFailed: 1, participants: 432, todayParticipants: 28, targetCount: 1250, pageViews: 3264,
    linkedBanners: [{ id: 'BNR-00182', name: '메인 상단 웰컴 이벤트', status: '노출중' }, { id: 'BNR-00179', name: '마이페이지 웰컴 배너', status: '노출중' }],
    linkedPopups: [{ id: 'POP-00182', name: '첫 로그인 웰컴 팝업', status: '노출중' }], linkedNotice: { id: 'NOTICE-0084', name: '8월 신규 거래처 혜택 안내', status: '게시중' },
    manager: 'admin01', createdAt: '2026-07-22 10:00', updatedAt: '2026-08-24 09:30', issueFlags: ['혜택 지급 실패 1건'],
    history: [{ when: '2026-07-22 10:00', title: '이벤트 등록', by: 'admin01' }, { when: '2026-07-25 09:00', title: '페이지 노출 시작', by: '시스템' }, { when: '2026-08-01 00:00', title: '이벤트 자동 시작', by: '시스템' }, { when: '2026-08-20 14:10', title: '이벤트 설명 수정', by: 'admin01' }],
    memos: [{ when: '2026-07-24 16:20', by: 'admin01', text: '배너는 7월 25일부터 선노출 예정.' }],
  },
  {
    ...DEFAULT_CONTENT,
    id: 'EVENT-00181', managementName: '2026_08_대량주문_럭키드로우', displayName: '여름 성수기 대량주문 럭키드로우', type: '응모형',
    summary: '행사 기간 중 누적 300만원 이상 주문한 거래처 대상 경품 이벤트입니다.', content: '누적 주문 조건을 달성하면 자동으로 응모됩니다. 당첨 결과는 9월 5일 공지사항에서 확인할 수 있습니다.',
    participationGuide: '행사 기간 주문 합계 300만원 달성 시 자동 응모', caution: '취소·반품 금액은 주문 합계에서 제외됩니다.', imageTone: '#0f766e', hasHeroImage: true,
    eventStartAt: '2026-08-10 00:00', eventEndAt: '2026-08-28 23:59', displayStartAt: '2026-08-05 09:00', displayEndAt: '2026-09-08 23:59',
    target: '우수 거래처', targetDetail: '최근 3개월 평균 주문액 100만원 이상', participationMethod: '자동 참여', participationLimit: '1인 1회',
    benefitType: '경품', benefitName: '여행 상품권 외 3종', grantMethod: '당첨 후', benefitTotal: 30, benefitGranted: 0, participants: 89, todayParticipants: 12, targetCount: 420, pageViews: 1280,
    linkedBanners: [{ id: 'BNR-00180', name: '대량주문 럭키드로우', status: '노출중' }], manager: 'admin02', createdAt: '2026-08-03 11:20', updatedAt: '2026-08-23 17:10',
    issueFlags: ['당첨 공지 미연결'], winner: { totalEntries: 89, plannedWinners: 30, confirmedWinners: 0, announcementAt: '2026-09-05 10:00', selectionMethod: '랜덤 추첨', status: '선정 대기' },
    history: [{ when: '2026-08-03 11:20', title: '이벤트 등록', by: 'admin02' }, { when: '2026-08-10 00:00', title: '이벤트 자동 시작', by: '시스템' }],
  },
  {
    ...DEFAULT_CONTENT,
    id: 'EVENT-00180', managementName: '2026_09_추석_출석', displayName: '추석맞이 발주 출석 이벤트', type: '출석형',
    summary: '매일 발주 화면을 방문하고 출석 포인트를 받는 이벤트입니다.', content: '행사 기간 동안 하루 한 번 출석할 수 있습니다.',
    participationGuide: '발주 화면 방문 후 출석 버튼 선택', caution: '매일 자정 참여 횟수가 초기화됩니다.', imageTone: '#d97706', hasHeroImage: true,
    eventStartAt: '2026-09-01 00:00', eventEndAt: '2026-09-20 23:59', displayStartAt: '2026-08-25 09:00', displayEndAt: '2026-09-23 23:59',
    target: '로그인 사용자', participationMethod: '특정 Action 완료', participationLimit: '하루 1회', benefitType: '포인트', benefitName: '출석 1회당 500P', grantMethod: '조건 충족 즉시',
    benefitTotal: 10000, benefitGranted: 0, participants: 0, todayParticipants: 0, targetCount: 5600, pageViews: 0,
    linkedBanners: [{ id: 'BNR-00183', name: '추석 출석 예고', status: '노출예정' }], linkedPopups: [{ id: 'POP-00184', name: '추석 출석 안내', status: '노출예정' }],
    manager: 'admin03', createdAt: '2026-08-20 15:40', updatedAt: '2026-08-24 10:00', history: [{ when: '2026-08-20 15:40', title: '이벤트 등록', by: 'admin03' }, { when: '2026-08-24 10:00', title: '노출 연결 설정', by: 'admin03' }],
  },
  {
    ...DEFAULT_CONTENT,
    id: 'EVENT-00179', managementName: '2026_09_재구매_쿠폰', displayName: '9월 재구매 감사 쿠폰', type: '혜택형',
    summary: '최근 구매 거래처를 위한 재구매 쿠폰 이벤트입니다.', content: '대상 거래처에 자동으로 쿠폰이 지급됩니다.', participationGuide: '대상 조건 충족 시 자동 지급', caution: '쿠폰 사용 조건은 쿠폰 상세 정책을 따릅니다.', imageTone: '#7c3aed', hasHeroImage: false,
    eventStartAt: '2026-09-05 00:00', eventEndAt: '2026-09-30 23:59', displayStartAt: '2026-09-01 09:00', displayEndAt: '2026-09-25 23:59',
    target: '특정 회원 그룹', targetDetail: '최근 60일 내 2회 이상 구매', participationMethod: '자동 참여', participationLimit: '1인 1회', benefitType: '쿠폰', benefitName: '재구매 5% 할인 쿠폰', grantMethod: '조건 충족 즉시',
    benefitTotal: 2000, benefitGranted: 0, participants: 0, todayParticipants: 0, targetCount: 2140, pageViews: 0, linkedBanners: [], manager: 'admin01',
    createdAt: '2026-08-22 11:00', updatedAt: '2026-08-24 08:40', issueFlags: ['이벤트 종료 전 페이지 노출 종료', '연결 노출 없음'], history: [{ when: '2026-08-22 11:00', title: '이벤트 등록', by: 'admin01' }],
  },
  {
    ...DEFAULT_CONTENT,
    id: 'EVENT-00178', managementName: '2026_08_리뷰_포인트', displayName: '상품 리뷰 작성 포인트', type: '참여형',
    summary: '구매 상품 리뷰 작성 시 포인트를 지급합니다.', content: '사진 리뷰 작성 시 추가 포인트를 받을 수 있습니다.', participationGuide: '마이페이지에서 구매 상품 리뷰 작성', caution: '운영 정책에 위배되는 리뷰는 참여가 무효 처리될 수 있습니다.', imageTone: '#2563eb', hasHeroImage: true,
    eventStartAt: '2026-08-01 00:00', eventEndAt: '2026-08-24 23:59', displayStartAt: '2026-08-01 00:00', displayEndAt: '2026-08-31 23:59',
    target: '로그인 사용자', participationMethod: '특정 Action 완료', participationLimit: '제한 없음', benefitType: '포인트', benefitName: '텍스트 300P / 포토 500P', grantMethod: '관리자 확인 후',
    benefitTotal: 3000, benefitGranted: 2840, benefitPending: 138, benefitFailed: 7, participants: 2978, todayParticipants: 146, targetCount: 8200, pageViews: 8420,
    linkedBanners: [{ id: 'BNR-00178', name: '리뷰 포인트 안내', status: '노출중' }], linkedNotice: { id: 'NOTICE-0081', name: '리뷰 운영 정책 안내', status: '게시중' },
    manager: 'admin02', createdAt: '2026-07-29 13:30', updatedAt: '2026-08-24 11:30', issueFlags: ['혜택 지급 실패 7건', '종료 후 지급 대기 예상'],
    history: [{ when: '2026-07-29 13:30', title: '이벤트 등록', by: 'admin02' }, { when: '2026-08-01 00:00', title: '이벤트 자동 시작', by: '시스템' }],
  },
  {
    ...DEFAULT_CONTENT,
    id: 'EVENT-00177', managementName: '2026_07_만족도_설문', displayName: '거래처 만족도 설문 이벤트', type: '참여형',
    summary: '서비스 만족도 설문 참여 이벤트입니다.', content: '설문에 참여해 주신 거래처에 감사 포인트를 지급합니다.', participationGuide: '설문 시작 버튼 선택 후 모든 문항 응답', caution: '중복 응답은 인정되지 않습니다.', imageTone: '#0891b2', hasHeroImage: true,
    eventStartAt: '2026-07-01 00:00', eventEndAt: '2026-07-15 23:59', displayStartAt: '2026-06-25 09:00', displayEndAt: '2026-07-22 23:59', target: '전체 사용자', exclusions: ['이미 참여 완료', '탈퇴 회원'],
    participationMethod: '외부 페이지 이동', participationLimit: '1인 1회', benefitType: '포인트', benefitName: '설문 완료 1,000P', grantMethod: '관리자 확인 후',
    benefitTotal: 520, benefitGranted: 512, participants: 512, todayParticipants: 0, targetCount: 2500, pageViews: 3420, linkedBanners: [], linkedNotice: { id: 'NOTICE-0077', name: '설문 결과 안내', status: '게시중' },
    manager: 'admin01', createdAt: '2026-06-25 09:00', updatedAt: '2026-07-22 10:20',
    history: [{ when: '2026-06-25 09:00', title: '이벤트 등록', by: 'admin01' }, { when: '2026-07-01 00:00', title: '이벤트 자동 시작', by: '시스템' }, { when: '2026-07-15 23:59', title: '이벤트 자동 종료', by: '시스템' }],
    memos: [{ when: '2026-07-16 09:20', by: 'admin01', text: '응답률 목표치 초과 달성, 결과 보고서 공유함.' }],
  },
  {
    ...DEFAULT_CONTENT,
    id: 'EVENT-00176', managementName: '2026_09_신상품_사전체험', displayName: '신상품 사전 체험단 모집', type: '응모형',
    summary: '신상품 출시 전 체험단 모집 이벤트 초안입니다.', content: '', participationGuide: '', caution: '', imageTone: '#be123c', hasHeroImage: false,
    eventStartAt: '2026-09-10 00:00', eventEndAt: '2026-09-18 23:59', displayStartAt: '2026-09-03 09:00', displayEndAt: '2026-09-25 23:59', target: '우수 거래처',
    participationMethod: '응모', participationLimit: '1인 1회', benefitType: '경품', benefitName: '신상품 체험 키트', grantMethod: '당첨 후',
    benefitTotal: 50, benefitGranted: 0, participants: 0, todayParticipants: 0, targetCount: 600, pageViews: 0, linkedBanners: [], manager: 'admin03',
    createdAt: '2026-08-23 14:00', updatedAt: '2026-08-23 14:00', isDraft: true, issueFlags: ['대표 이미지 미등록', '콘텐츠 작성 필요', '연결 노출 없음'],
    winner: { totalEntries: 0, plannedWinners: 50, confirmedWinners: 0, announcementAt: '2026-09-22 10:00', selectionMethod: '수동', status: '선정 대기' },
    history: [{ when: '2026-08-23 14:00', title: '임시 저장', by: 'admin03' }],
  },
  {
    ...DEFAULT_CONTENT,
    id: 'EVENT-00175', managementName: '2026_08_긴급배송_안내', displayName: '휴가철 긴급배송 지원 안내', type: '안내형',
    summary: '휴가철 긴급배송 운영 안내 페이지입니다.', content: '지역별 긴급배송 가능 일정과 접수 방법을 확인해 주세요.', participationGuide: '참여 기능 없음', caution: '지역별 접수 마감 시간이 다릅니다.', imageTone: '#475569', hasHeroImage: true,
    eventStartAt: '2026-08-01 00:00', eventEndAt: '2026-08-31 23:59', displayStartAt: '2026-07-28 09:00', displayEndAt: '2026-09-01 23:59', target: '전체 사용자', exclusions: [],
    participationMethod: '참여 기능 없음', participationLimit: '제한 없음', benefitType: '혜택 없음', benefitName: '-', grantMethod: '이벤트 종료 후', benefitTotal: 0, benefitGranted: 0,
    participants: 0, todayParticipants: 0, pageViews: 460, linkedBanners: [], linkedNotice: { id: 'NOTICE-0083', name: '휴가철 배송 안내', status: '게시중' }, manager: 'admin02',
    createdAt: '2026-07-27 18:00', updatedAt: '2026-08-02 09:10', isActive: false,
    history: [{ when: '2026-07-27 18:00', title: '이벤트 등록', by: 'admin02' }, { when: '2026-08-02 09:10', title: '비활성 처리', by: 'admin02', detail: '운영 정책 변경' }],
  },
];

export const EVENT_STATUS_META: Record<EventStatus, { bg: string; fg: string }> = {
  작성중: { bg: '#f4f4f5', fg: '#52525b' }, '진행 예정': { bg: '#eef2ff', fg: '#4338ca' }, 진행중: { bg: '#ecfdf5', fg: '#047857' },
  종료: { bg: '#f4f4f5', fg: '#71717a' }, 비활성: { bg: '#fff1f2', fg: '#be123c' },
};

export const EVENT_TYPES: EventType[] = ['안내형', '참여형', '응모형', '혜택형', '출석형', '구매조건형', '기타'];
export const EVENT_TARGETS: EventTarget[] = ['전체 사용자', '로그인 사용자', '신규 회원', '우수 거래처', '특정 회원 그룹'];
export const EVENT_MANAGERS = ['admin01', 'admin02', 'admin03'];
export const PARTICIPATION_METHODS: ParticipationMethod[] = ['신청 버튼', '응모', '자동 참여', '특정 Action 완료', '외부 페이지 이동', '참여 기능 없음'];
export const PARTICIPATION_LIMITS: ParticipationLimit[] = ['1인 1회', '하루 1회', '기간 내 3회', '제한 없음'];
export const BENEFIT_TYPES: BenefitType[] = ['혜택 없음', '쿠폰', '포인트', '할인', '경품', '기타'];
export const GRANT_METHODS: GrantMethod[] = ['참여 즉시', '조건 충족 즉시', '이벤트 종료 후', '관리자 확인 후', '당첨 후'];
export const QUICK_FILTER_LABELS = ['전체', '진행중', '진행 예정', '종료', '비활성', '확인 필요'] as const;
export type EventQuickFilter = (typeof QUICK_FILTER_LABELS)[number];

function asTime(value: string): number {
  return value ? new Date(value.replace(' ', 'T')).getTime() : Number.NaN;
}

export function computeEventStatus(event: EventEntry, now = new Date()): EventStatus {
  if (event.isDraft) return '작성중';
  if (!event.isActive) return '비활성';
  if (event.manuallyEnded) return '종료';
  if (now.getTime() < asTime(event.eventStartAt)) return '진행 예정';
  if (now.getTime() <= asTime(event.eventEndAt)) return '진행중';
  return '종료';
}

export function eventIssues(event: EventEntry): string[] {
  const issues = new Set(event.issueFlags);
  if (event.displayEndAt && event.eventEndAt && asTime(event.displayEndAt) < asTime(event.eventEndAt)) issues.add('이벤트 종료 전 페이지 노출 종료');
  if (event.benefitTotal > 0 && event.benefitGranted >= event.benefitTotal) issues.add('혜택 소진');
  if (event.benefitFailed > 0) issues.add(`혜택 지급 실패 ${event.benefitFailed}건`);
  return [...issues];
}

export function matchesQuickFilter(event: EventEntry, key: EventQuickFilter): boolean {
  if (key === '전체') return true;
  if (key === '확인 필요') return eventIssues(event).length > 0;
  return computeEventStatus(event) === key;
}

export function fmtDateTime(value: string): string {
  return value ? value.replace(/-/g, '.') : '-';
}

export function fmtCompactRange(startAt: string, endAt: string): string {
  if (!startAt || !endAt) return '기간 미설정';
  return `${fmtDateTime(startAt).slice(5)} ~ ${fmtDateTime(endAt).slice(5)}`;
}

export function benefitSummary(event: EventEntry): string {
  return event.benefitType === '혜택 없음' ? '없음' : event.benefitType;
}

export function linkedExposureSummary(event: EventEntry): string {
  const items: string[] = [];
  if (event.linkedBanners.length) items.push(`배너 ${event.linkedBanners.length}`);
  if (event.linkedPopups.length) items.push(`팝업 ${event.linkedPopups.length}`);
  if (event.linkedNotice) items.push('공지 1');
  return items.length ? items.join(' · ') : '-';
}

export function nextEventId(events: EventEntry[]): string {
  const max = events.reduce((acc, event) => Math.max(acc, Number(event.id.replace(/\D/g, '')) || 0), 0);
  return `EVENT-${String(max + 1).padStart(5, '0')}`;
}
