import { NOW, parseKDate } from './noticesData';

export type BannerStatus = '작성중' | '노출예정' | '노출중' | '노출종료' | '비활성';
export type Device = '전체' | 'PC' | 'Mobile';
export type LinkType = '없음' | '내부 페이지' | '외부 URL';
export type BannerTarget = '전체 사용자' | '로그인 사용자' | '특정 회원 그룹';
export type BannerMode = '고정' | '로테이션';

export interface BannerPositionMeta {
  code: string;
  label: string;
  pcSpec: string;
  mobileSpec: string;
  maxCount: number;
  mode: BannerMode;
}

export const BANNER_POSITIONS: BannerPositionMeta[] = [
  { code: 'MAIN_HERO', label: '메인 상단', pcSpec: '1440×480', mobileSpec: '720×640', maxCount: 5, mode: '로테이션' },
  { code: 'MAIN_MID', label: '메인 중단', pcSpec: '1200×240', mobileSpec: '720×320', maxCount: 3, mode: '로테이션' },
  { code: 'PRODUCT_TOP', label: '상품 목록 상단', pcSpec: '1200×200', mobileSpec: '720×260', maxCount: 1, mode: '고정' },
  { code: 'MYPAGE_TOP', label: '마이페이지 상단', pcSpec: '1200×180', mobileSpec: '720×220', maxCount: 1, mode: '고정' },
  { code: 'APP_SPLASH', label: '앱 스플래시', pcSpec: '-', mobileSpec: '750×1334', maxCount: 1, mode: '고정' },
];

export function positionMeta(code: string): BannerPositionMeta {
  return BANNER_POSITIONS.find((p) => p.code === code) ?? BANNER_POSITIONS[0];
}

export interface LinkedContent {
  type: '공지사항' | '이벤트' | '팝업';
  id: string;
  label: string;
  ended: boolean;
}

export interface BannerHistoryEntry {
  when: string;
  title: string;
  detail?: string;
  by: string;
}
export interface BannerMemo {
  when: string;
  by: string;
  text: string;
}

export interface Banner {
  id: string;
  name: string;
  positionCode: string;
  device: Device;
  hasPcImage: boolean;
  hasMobileImage: boolean;
  useDesktopForMobile: boolean;
  thumbColor: string;
  altText: string;
  title: string;
  description: string;
  buttonLabel: string;
  linkType: LinkType;
  linkUrl: string;
  target: BannerTarget;
  order: number;
  startAt: string | null;
  endAt: string | null;
  manualHidden: boolean;
  linkedContent: LinkedContent | null;
  impressions: number;
  clicks: number;
  manager: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  history: BannerHistoryEntry[];
  memos: BannerMemo[];
}

// 작성중(시작일 미설정) / 노출예정 / 노출중 / 노출종료(종료일 경과) / 비활성(운영자가 의도적으로 중지)
export function computeStatus(b: Banner, now: Date = NOW): BannerStatus {
  if (b.manualHidden) return '비활성';
  if (!b.startAt) return '작성중';
  const start = parseKDate(b.startAt);
  if (now < start) return '노출예정';
  if (b.endAt) {
    const end = parseKDate(b.endAt);
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

export function needsReview(b: Banner, now: Date = NOW): ReviewFlag {
  const reasons: string[] = [];
  if (!b.altText.trim()) reasons.push('대체텍스트 없음');
  if ((b.device === '전체' || b.device === 'Mobile') && !b.hasMobileImage && !b.useDesktopForMobile) reasons.push('Mobile 소재 없음');
  if (b.linkedContent?.ended) reasons.push('연결 콘텐츠 종료');
  if (b.endAt && computeStatus(b, now) === '노출중') {
    const d = daysBetween(now, parseKDate(b.endAt));
    if (d >= 0 && d <= 3) reasons.push('노출 종료 임박');
  }
  return { flag: reasons.length > 0, reasons };
}

// 같은 위치에서 기간이 겹치는 다른 배너 수 (본인 제외) — 최대 동시 노출 개수 초과 여부 확인용
export function countOverlapping(list: Banner[], positionCode: string, startAt: string, endAt: string | null, excludeId?: string): number {
  const s = parseKDate(startAt);
  const e = endAt ? parseKDate(endAt) : new Date(9999, 0, 1);
  return list.filter((b) => {
    if (b.id === excludeId) return false;
    if (b.positionCode !== positionCode) return false;
    if (b.manualHidden || !b.startAt) return false;
    const bs = parseKDate(b.startAt);
    const be = b.endAt ? parseKDate(b.endAt) : new Date(9999, 0, 1);
    return s <= be && bs <= e;
  }).length;
}

export const BANNERS: Banner[] = [
  {
    id: 'BNR-032', name: '8월 신규 거래처 프로모션', positionCode: 'MAIN_HERO', device: '전체',
    hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#4f46e5',
    altText: '8월 신규 거래처 프로모션 배너', title: '8월 신규 거래처 프로모션', description: '신규 거래처 첫 발주 혜택을 확인해보세요', buttonLabel: '자세히 보기',
    linkType: '외부 URL', linkUrl: '/promo/2026-08', target: '전체 사용자', order: 1,
    startAt: '2026.08.18 09:00', endAt: '2026.09.02 23:59', manualHidden: false, linkedContent: null,
    impressions: 128400, clicks: 3210, manager: 'admin01', updatedBy: 'admin01', createdAt: '2026.07.28', updatedAt: '2026.07.28',
    history: [{ when: '2026.07.28 10:00', title: '배너 등록', by: 'admin01' }, { when: '2026.08.18 09:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
  {
    id: 'BNR-031', name: '최소 주문수량 완화 안내', positionCode: 'MAIN_MID', device: '전체',
    hasPcImage: true, hasMobileImage: false, useDesktopForMobile: true, thumbColor: '#059669',
    altText: '최소 주문수량 완화 안내 배너', title: '최소 주문수량 완화', description: 'MOQ 기준이 완화되었습니다', buttonLabel: '자세히 보기',
    linkType: '내부 페이지', linkUrl: '/ops/notices', target: '전체 사용자', order: 1,
    startAt: '2026.07.20 09:00', endAt: '2026.09.20 23:59', manualHidden: false, linkedContent: null,
    impressions: 64200, clicks: 980, manager: 'admin02', updatedBy: 'admin02', createdAt: '2026.07.18', updatedAt: '2026.07.18',
    history: [{ when: '2026.07.18 09:00', title: '배너 등록', by: 'admin02' }, { when: '2026.07.20 09:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
  {
    id: 'BNR-030', name: '추석 연휴 배송 안내', positionCode: 'MAIN_HERO', device: '전체',
    hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#d97706',
    altText: '추석 연휴 배송 안내 배너', title: '추석 연휴 배송 안내', description: '연휴 기간 배송 일정을 확인하세요', buttonLabel: '자세히 보기',
    linkType: '내부 페이지', linkUrl: '/ops/notices', target: '전체 사용자', order: 2,
    startAt: '2026.09.10 09:00', endAt: '2026.09.25 00:00', manualHidden: false,
    linkedContent: { type: '공지사항', id: 'NTC-0138', label: '추석 연휴 배송 및 고객센터 운영 안내', ended: false },
    impressions: 0, clicks: 0, manager: 'admin03', updatedBy: 'admin03', createdAt: '2026.08.20', updatedAt: '2026.08.20',
    history: [{ when: '2026.08.20 15:00', title: '배너 등록 (예약)', detail: '노출 시작 2026.09.10 09:00', by: 'admin03' }],
    memos: [],
  },
  {
    id: 'BNR-029', name: '카테고리별 신상품 모음', positionCode: 'PRODUCT_TOP', device: '전체',
    hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#0369a1',
    altText: '신상품 모음 배너', title: '신상품 모음', description: '이번 달 새로 입고된 상품을 확인하세요', buttonLabel: '상품 보기',
    linkType: '내부 페이지', linkUrl: '/products', target: '전체 사용자', order: 1,
    startAt: '2026.08.05 00:00', endAt: '2026.09.05 23:59', manualHidden: false, linkedContent: null,
    impressions: 41200, clicks: 1520, manager: 'admin01', updatedBy: 'admin01', createdAt: '2026.08.04', updatedAt: '2026.08.04',
    history: [{ when: '2026.08.04 11:00', title: '배너 등록', by: 'admin01' }, { when: '2026.08.05 00:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
  {
    id: 'BNR-028', name: '앱 전용 첫 주문 혜택', positionCode: 'APP_SPLASH', device: 'Mobile',
    hasPcImage: false, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#a21caf',
    altText: '앱 전용 첫 주문 혜택 배너', title: '앱 전용 혜택', description: '앱에서 첫 주문 시 특별 혜택', buttonLabel: '앱에서 보기',
    linkType: '외부 URL', linkUrl: '/app/first-order', target: '전체 사용자', order: 1,
    startAt: '2026.07.01 00:00', endAt: '2026.07.31 23:59', manualHidden: false, linkedContent: null,
    impressions: 89400, clicks: 4210, manager: 'admin02', updatedBy: 'admin02', createdAt: '2026.06.28', updatedAt: '2026.06.28',
    history: [
      { when: '2026.06.28 09:00', title: '배너 등록', by: 'admin02' },
      { when: '2026.07.01 00:00', title: '자동 노출 시작', by: '시스템' },
      { when: '2026.07.31 23:59', title: '자동 노출 종료', by: '시스템' },
    ],
    memos: [],
  },
  {
    id: 'BNR-027', name: '여름 성수기 발주 안내', positionCode: 'MAIN_MID', device: '전체',
    hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#b91c1c',
    altText: '여름 성수기 발주 안내 배너', title: '여름 성수기 발주 안내', description: '마감시간 임시 변경 안내', buttonLabel: '자세히 보기',
    linkType: '내부 페이지', linkUrl: '/ops/notices', target: '전체 사용자', order: 2,
    startAt: '2026.06.20 00:00', endAt: '2026.07.10 23:59', manualHidden: true, linkedContent: null,
    impressions: 22100, clicks: 340, manager: 'admin03', updatedBy: 'admin03', createdAt: '2026.06.18', updatedAt: '2026.06.25',
    history: [
      { when: '2026.06.18 09:00', title: '배너 등록', by: 'admin03' },
      { when: '2026.06.20 00:00', title: '자동 노출 시작', by: '시스템' },
      { when: '2026.06.25 14:00', title: '노출 중지', detail: '이미지 오류 발견', by: 'admin03' },
    ],
    memos: [{ when: '2026.06.25', by: 'admin03', text: '이미지 오류 발견되어 임시 중지, 수정본 대기 중.' }],
  },
  {
    id: 'BNR-026', name: '마이페이지 등급 안내', positionCode: 'MYPAGE_TOP', device: '전체',
    hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#0891b2',
    altText: '', title: '등급 혜택 안내', description: '거래 등급별 혜택을 확인하세요', buttonLabel: '자세히 보기',
    linkType: '내부 페이지', linkUrl: '/partners/companies', target: '전체 사용자', order: 1,
    startAt: '2026.08.10 09:00', endAt: '2026.08.26 23:59', manualHidden: false, linkedContent: null,
    impressions: 15200, clicks: 410, manager: 'admin02', updatedBy: 'admin02', createdAt: '2026.08.09', updatedAt: '2026.08.09',
    history: [{ when: '2026.08.09 10:00', title: '배너 등록', by: 'admin02' }, { when: '2026.08.10 09:00', title: '자동 노출 시작', by: '시스템' }],
    memos: [],
  },
  {
    id: 'BNR-025', name: '가을 신상품 프리뷰', positionCode: 'PRODUCT_TOP', device: '전체',
    hasPcImage: true, hasMobileImage: false, useDesktopForMobile: false, thumbColor: '#ea580c',
    altText: '가을 신상품 프리뷰 배너', title: '가을 신상품 프리뷰', description: '가을 시즌 신상품을 미리 만나보세요', buttonLabel: '자세히 보기',
    linkType: '내부 페이지', linkUrl: '/products', target: '전체 사용자', order: 2,
    startAt: null, endAt: null, manualHidden: false, linkedContent: null,
    impressions: 0, clicks: 0, manager: 'admin01', updatedBy: 'admin01', createdAt: '2026.08.22', updatedAt: '2026.08.22',
    history: [{ when: '2026.08.22 11:00', title: '배너 Draft 생성', by: 'admin01' }],
    memos: [{ when: '2026.08.22', by: 'admin01', text: '상품 촬영 완료 후 소재 교체하여 예약 게시 예정.' }],
  },
  {
    id: 'BNR-024', name: '여름 프로모션 마무리 안내', positionCode: 'MAIN_HERO', device: '전체',
    hasPcImage: true, hasMobileImage: true, useDesktopForMobile: false, thumbColor: '#65a30d',
    altText: '여름 프로모션 마무리 안내 배너', title: '여름 프로모션 마감 임박', description: '이번 주 안에 확인해보세요', buttonLabel: '자세히 보기',
    linkType: '외부 URL', linkUrl: '/promo/summer-end', target: '전체 사용자', order: 3,
    startAt: '2026.06.01 00:00', endAt: '2026.06.30 23:59', manualHidden: false, linkedContent: null,
    impressions: 51200, clicks: 1890, manager: 'admin03', updatedBy: 'admin03', createdAt: '2026.05.28', updatedAt: '2026.05.28',
    history: [
      { when: '2026.05.28 09:00', title: '배너 등록', by: 'admin03' },
      { when: '2026.06.01 00:00', title: '자동 노출 시작', by: '시스템' },
      { when: '2026.06.30 23:59', title: '자동 노출 종료', by: '시스템' },
    ],
    memos: [],
  },
];

export const BANNER_STATUS_META: Record<BannerStatus, { bg: string; fg: string }> = {
  작성중: { bg: '#f4f4f5', fg: '#71717a' },
  노출예정: { bg: '#eef2ff', fg: '#4338ca' },
  노출중: { bg: '#ecfdf5', fg: '#059669' },
  노출종료: { bg: '#f4f4f5', fg: '#a1a1aa' },
  비활성: { bg: '#fef2f2', fg: '#b91c1c' },
};

export const QUICK_FILTER_LABELS = ['전체', '노출중', '노출예정', '노출종료', '비활성'] as const;
export type BannerQuickFilter = (typeof QUICK_FILTER_LABELS)[number];

export function matchesQuickFilter(b: Banner, key: BannerQuickFilter): boolean {
  return key === '전체' || computeStatus(b) === key;
}

export function fmtRange(b: Banner): string {
  if (!b.startAt) return '-';
  const start = b.startAt.slice(5, 10);
  if (!b.endAt) return `${start} ~`;
  return `${start} ~ ${b.endAt.slice(5, 10)}`;
}
