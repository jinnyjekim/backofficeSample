import { NOW, parseKDate } from './noticesData';
import type { Device } from './bannersData';

export type PopupStatus = '작성중' | '노출예정' | '노출중' | '노출종료' | '비활성';
export type PopupType = '이미지' | '텍스트' | '이미지 + 텍스트';
export type PopupTarget = '전체 사용자' | '로그인 사용자' | '비로그인 사용자' | '특정 회원 그룹';
export type PopupTiming = '페이지 진입 즉시' | '로그인 완료 후' | 'N초 후';
export type PopupFrequency = '매 방문마다' | '세션당 1회' | '하루 1회' | '최초 1회' | '사용자당 N회';
export type LinkType = '없음' | '내부 페이지' | '외부 URL' | '공지사항' | '이벤트';

export const POPUP_SCREENS = ['전체 서비스', '메인', '로그인', '회원가입', '마이페이지', '상품 목록', '상품 상세', '주문 완료'];

export interface CloseOptions {
  showCloseButton: boolean;
  closeOnOutsideClick: boolean;
  closeOnEsc: boolean;
  hideToday: boolean;
  hideForever: boolean;
}

export interface LinkedContent {
  type: '공지사항' | '이벤트';
  id: string;
  label: string;
  ended: boolean;
}

export interface PopupHistoryEntry {
  when: string;
  title: string;
  detail?: string;
  by: string;
}
export interface PopupMemo {
  when: string;
  by: string;
  text: string;
}

export interface Popup {
  id: string;
  name: string;
  title: string;
  body: string;
  type: PopupType;
  screen: string;
  device: Device;
  hasPcImage: boolean;
  hasMobileImage: boolean;
  useDesktopForMobile: boolean;
  thumbColor: string;
  timing: PopupTiming;
  delaySeconds: number;
  target: PopupTarget;
  frequency: PopupFrequency;
  maxCount: number;
  close: CloseOptions;
  primaryLabel: string;
  linkType: LinkType;
  linkUrl: string;
  priority: number;
  startAt: string | null;
  endAt: string | null;
  manualHidden: boolean;
  linkedContent: LinkedContent | null;
  impressions: number;
  clicks: number;
  closes: number;
  hideTodayCount: number;
  manager: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  history: PopupHistoryEntry[];
  memos: PopupMemo[];
}

// 작성중(시작일 미설정) / 노출예정 / 노출중 / 노출종료(종료일 경과) / 비활성(운영자가 의도적으로 중지)
export function computeStatus(p: Popup, now: Date = NOW): PopupStatus {
  if (p.manualHidden) return '비활성';
  if (!p.startAt) return '작성중';
  const start = parseKDate(p.startAt);
  if (now < start) return '노출예정';
  if (p.endAt) {
    const end = parseKDate(p.endAt);
    if (now >= end) return '노출종료';
  }
  return '노출중';
}

export interface ReviewFlag {
  flag: boolean;
  reasons: string[];
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function needsReview(p: Popup, list: Popup[], now: Date = NOW): ReviewFlag {
  const reasons: string[] = [];
  const status = computeStatus(p, now);
  if ((p.device === '전체' || p.device === 'Mobile') && !p.hasMobileImage && !p.useDesktopForMobile && p.type !== '텍스트') reasons.push('Mobile 소재 없음');
  if (!p.close.showCloseButton && !p.close.closeOnOutsideClick && !p.close.closeOnEsc) reasons.push('닫기 수단 없음');
  if (p.linkedContent?.ended) reasons.push('연결 콘텐츠 종료');
  if (p.frequency === '매 방문마다') reasons.push('노출 빈도 항상');
  if (status === '노출중') {
    if (!p.endAt) reasons.push('종료일 없음');
    if (p.endAt) {
      const d = daysBetween(now, parseKDate(p.endAt));
      if (d >= 0 && d <= 3) reasons.push('노출 종료 임박');
    }
    if (p.startAt && daysBetween(parseKDate(p.startAt), now) >= 30) reasons.push('30일 이상 장기 노출');
    if (countPriorityConflicts(list, p.screen, p.priority, p.startAt!, p.endAt, p.id) > 0) reasons.push('동일 우선순위 충돌');
  }
  return { flag: reasons.length > 0, reasons };
}

// 같은 화면에서 기간이 겹치는 다른 팝업 수 (본인 제외)
export function countOverlappingOnScreen(list: Popup[], screen: string, startAt: string, endAt: string | null, excludeId?: string): number {
  const s = parseKDate(startAt);
  const e = endAt ? parseKDate(endAt) : new Date(9999, 0, 1);
  return list.filter((p) => {
    if (p.id === excludeId || p.screen !== screen || p.manualHidden || !p.startAt) return false;
    const ps = parseKDate(p.startAt);
    const pe = p.endAt ? parseKDate(p.endAt) : new Date(9999, 0, 1);
    return s <= pe && ps <= e;
  }).length;
}

// 같은 화면 + 같은 우선순위 + 기간이 겹치는 다른 팝업 수 (본인 제외)
export function countPriorityConflicts(list: Popup[], screen: string, priority: number, startAt: string, endAt: string | null, excludeId?: string): number {
  const s = parseKDate(startAt);
  const e = endAt ? parseKDate(endAt) : new Date(9999, 0, 1);
  return list.filter((p) => {
    if (p.id === excludeId || p.screen !== screen || p.priority !== priority || p.manualHidden || !p.startAt) return false;
    const ps = parseKDate(p.startAt);
    const pe = p.endAt ? parseKDate(p.endAt) : new Date(9999, 0, 1);
    return s <= pe && ps <= e;
  }).length;
}

export const POPUPS: Popup[] = [
  {
    id: 'POP-018', name: '2026_점검_전체팝업', title: '서비스 점검 안내', body: '2026.08.25 02:00~06:00 정기 점검이 진행됩니다.',
    type: '이미지 + 텍스트', screen: '전체 서비스', device: '전체', hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#4f46e5',
    timing: '페이지 진입 즉시', delaySeconds: 0, target: '전체 사용자', frequency: '하루 1회', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: true, hideForever: false },
    primaryLabel: '자세히 보기', linkType: '공지사항', linkUrl: '/ops/notices', priority: 1,
    startAt: '2026.08.18 09:00', endAt: '2026.08.26 06:00', manualHidden: false,
    linkedContent: { type: '공지사항', id: 'NTC-0142', label: '서비스 점검 안내', ended: false },
    impressions: 42100, clicks: 3200, closes: 40800, hideTodayCount: 8100,
    manager: 'admin01', updatedBy: 'admin01', createdAt: '2026.08.17', updatedAt: '2026.08.17',
    history: [{ when: '2026.08.17 14:30', title: '팝업 등록', by: 'admin01' }, { when: '2026.08.18 09:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
  {
    id: 'POP-019', name: '2026_여름_신규환영', title: '신규 거래처 환영 혜택', body: '첫 발주 시 특별 혜택을 확인해보세요.',
    type: '이미지 + 텍스트', screen: '메인', device: '전체', hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#059669',
    timing: '페이지 진입 즉시', delaySeconds: 0, target: '전체 사용자', frequency: '최초 1회', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: false, hideForever: true },
    primaryLabel: '자세히 보기', linkType: '이벤트', linkUrl: '/ops/events', priority: 1,
    startAt: '2026.08.01 00:00', endAt: '2026.08.31 23:59', manualHidden: false, linkedContent: null,
    impressions: 3200, clicks: 610, closes: 2100, hideTodayCount: 0,
    manager: 'admin02', updatedBy: 'admin02', createdAt: '2026.07.29', updatedAt: '2026.07.29',
    history: [{ when: '2026.07.29 10:00', title: '팝업 등록', by: 'admin02' }, { when: '2026.08.01 00:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
  {
    id: 'POP-020', name: '2026_가을_프로모션', title: '가을 시즌 프로모션 안내', body: '가을 시즌 한정 프로모션을 만나보세요.',
    type: '이미지 + 텍스트', screen: '메인', device: '전체', hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#ea580c',
    timing: '페이지 진입 즉시', delaySeconds: 0, target: '전체 사용자', frequency: '세션당 1회', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: true, hideForever: false },
    primaryLabel: '자세히 보기', linkType: '외부 URL', linkUrl: '/promo/autumn', priority: 1,
    startAt: '2026.08.15 00:00', endAt: '2026.09.15 23:59', manualHidden: false, linkedContent: null,
    impressions: 8900, clicks: 720, closes: 8100, hideTodayCount: 1400,
    manager: 'admin01', updatedBy: 'admin01', createdAt: '2026.08.13', updatedAt: '2026.08.13',
    history: [{ when: '2026.08.13 09:00', title: '팝업 등록', by: 'admin01' }, { when: '2026.08.15 00:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
  {
    id: 'POP-016', name: '2026_약관개정_동의안내', title: '이용약관 개정 동의 안내', body: '2026.09.01부터 적용되는 이용약관 개정 사항을 안내드립니다.',
    type: '텍스트', screen: '전체 서비스', device: '전체', hasPcImage: false, hasMobileImage: false, useDesktopForMobile: false, thumbColor: '#d97706',
    timing: '로그인 완료 후', delaySeconds: 0, target: '전체 사용자', frequency: '매 방문마다', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: false, closeOnEsc: false, hideToday: false, hideForever: false },
    primaryLabel: '확인', linkType: '없음', linkUrl: '', priority: 1,
    startAt: '2026.09.01 09:00', endAt: '2026.09.15 23:59', manualHidden: false, linkedContent: null,
    impressions: 0, clicks: 0, closes: 0, hideTodayCount: 0,
    manager: 'admin03', updatedBy: 'admin03', createdAt: '2026.08.20', updatedAt: '2026.08.20',
    history: [{ when: '2026.08.20 16:00', title: '팝업 등록 (예약)', detail: '노출 시작 2026.09.01 09:00', by: 'admin03' }],
    memos: [{ when: '2026.08.20', by: 'admin03', text: '법무팀 확인 후 문구 최종 반영 예정.' }],
  },
  {
    id: 'POP-015', name: '2026_휴면_재방문설문', title: '휴면 회원 재방문 설문', body: '서비스 개선을 위한 짧은 설문에 참여해주세요.',
    type: '이미지 + 텍스트', screen: '마이페이지', device: '전체', hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#0369a1',
    timing: 'N초 후', delaySeconds: 3, target: '로그인 사용자', frequency: '하루 1회', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: true, hideForever: false },
    primaryLabel: '설문 참여', linkType: '외부 URL', linkUrl: '/survey/dormant', priority: 2,
    startAt: '2026.07.10 00:00', endAt: '2026.07.31 23:59', manualHidden: false, linkedContent: null,
    impressions: 890, clicks: 210, closes: 720, hideTodayCount: 40,
    manager: 'admin01', updatedBy: 'admin01', createdAt: '2026.07.08', updatedAt: '2026.07.08',
    history: [
      { when: '2026.07.08 09:00', title: '팝업 등록', by: 'admin01' },
      { when: '2026.07.10 00:00', title: '자동 노출 시작', by: '시스템' },
      { when: '2026.07.31 23:59', title: '자동 노출 종료', by: '시스템' },
    ],
    memos: [],
  },
  {
    id: 'POP-014', name: '2026_결제_프로모션', title: '결제 페이지 프로모션 안내', body: '결제 시 사용 가능한 할인 혜택을 확인하세요.',
    type: '이미지 + 텍스트', screen: '주문 완료', device: '전체', hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#b91c1c',
    timing: '페이지 진입 즉시', delaySeconds: 0, target: '전체 사용자', frequency: '세션당 1회', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: false, hideForever: false },
    primaryLabel: '혜택 보기', linkType: '외부 URL', linkUrl: '/promo/payment', priority: 2,
    startAt: '2026.06.15 00:00', endAt: '2026.07.15 23:59', manualHidden: true, linkedContent: null,
    impressions: 15400, clicks: 1820, closes: 14200, hideTodayCount: 0,
    manager: 'admin02', updatedBy: 'admin02', createdAt: '2026.06.12', updatedAt: '2026.06.30',
    history: [
      { when: '2026.06.12 09:00', title: '팝업 등록', by: 'admin02' },
      { when: '2026.06.15 00:00', title: '자동 노출 시작', by: '시스템' },
      { when: '2026.06.30 11:00', title: '노출 중지', detail: '프로모션 조건 변경', by: 'admin02' },
    ],
    memos: [{ when: '2026.06.30', by: 'admin02', text: '프로모션 조건 변경으로 임시 중지, 재개 여부 검토 중.' }],
  },
  {
    id: 'POP-013', name: '2026_시스템_상시안내', title: '시스템 이용 안내', body: '서비스 이용 중 문의사항은 고객센터로 연락해주세요.',
    type: '텍스트', screen: '전체 서비스', device: '전체', hasPcImage: false, hasMobileImage: false, useDesktopForMobile: false, thumbColor: '#71717a',
    timing: '페이지 진입 즉시', delaySeconds: 0, target: '전체 사용자', frequency: '하루 1회', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: true, hideForever: false },
    primaryLabel: '확인', linkType: '없음', linkUrl: '', priority: 3,
    startAt: '2026.05.01 09:00', endAt: null, manualHidden: false, linkedContent: null,
    impressions: 62000, clicks: 0, closes: 60500, hideTodayCount: 22000,
    manager: 'admin03', updatedBy: 'admin03', createdAt: '2026.04.28', updatedAt: '2026.04.28',
    history: [{ when: '2026.04.28 09:00', title: '팝업 등록', by: 'admin03' }, { when: '2026.05.01 09:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
  {
    id: 'POP-012', name: '2026_가입축하_쿠폰', title: '가입을 축하합니다', body: '회원가입 축하 쿠폰이 발급되었습니다.',
    type: '이미지 + 텍스트', screen: '회원가입', device: '전체', hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#a21caf',
    timing: '페이지 진입 즉시', delaySeconds: 0, target: '전체 사용자', frequency: '최초 1회', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: false, hideForever: false },
    primaryLabel: '쿠폰함 보기', linkType: '내부 페이지', linkUrl: '/members', priority: 1,
    startAt: null, endAt: null, manualHidden: false, linkedContent: null,
    impressions: 0, clicks: 0, closes: 0, hideTodayCount: 0,
    manager: 'admin01', updatedBy: 'admin01', createdAt: '2026.08.22', updatedAt: '2026.08.22',
    history: [{ when: '2026.08.22 11:20', title: '팝업 Draft 생성', by: 'admin01' }],
    memos: [{ when: '2026.08.22', by: 'admin01', text: '쿠폰 정책 확정 후 예약 게시 예정.' }],
  },
  {
    id: 'POP-011', name: '2026_재입고_알림신청', title: '재입고 알림 신청', body: '품절 상품의 재입고 소식을 가장 먼저 받아보세요.',
    type: '이미지 + 텍스트', screen: '상품 상세', device: '전체', hasPcImage: true, hasMobileImage: false, useDesktopForMobile: false, thumbColor: '#0891b2',
    timing: 'N초 후', delaySeconds: 5, target: '전체 사용자', frequency: '세션당 1회', maxCount: 0,
    close: { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: true, hideForever: false },
    primaryLabel: '알림 신청', linkType: '없음', linkUrl: '', priority: 2,
    startAt: '2026.08.05 00:00', endAt: '2026.09.05 23:59', manualHidden: false, linkedContent: null,
    impressions: 5400, clicks: 480, closes: 4900, hideTodayCount: 300,
    manager: 'admin02', updatedBy: 'admin02', createdAt: '2026.08.04', updatedAt: '2026.08.04',
    history: [{ when: '2026.08.04 10:00', title: '팝업 등록', by: 'admin02' }, { when: '2026.08.05 00:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
];

export const POPUP_STATUS_META: Record<PopupStatus, { bg: string; fg: string }> = {
  작성중: { bg: '#f4f4f5', fg: '#71717a' },
  노출예정: { bg: '#eef2ff', fg: '#4338ca' },
  노출중: { bg: '#ecfdf5', fg: '#059669' },
  노출종료: { bg: '#f4f4f5', fg: '#a1a1aa' },
  비활성: { bg: '#fef2f2', fg: '#b91c1c' },
};

export const QUICK_FILTER_LABELS = ['전체', '노출중', '노출예정', '노출종료', '비활성'] as const;
export type PopupQuickFilter = (typeof QUICK_FILTER_LABELS)[number];

export function matchesQuickFilter(p: Popup, key: PopupQuickFilter): boolean {
  return key === '전체' || computeStatus(p) === key;
}

export function fmtRange(p: Popup): string {
  if (!p.startAt) return '-';
  const start = p.startAt.slice(5, 10);
  if (!p.endAt) return `${start} ~`;
  return `${start} ~ ${p.endAt.slice(5, 10)}`;
}
