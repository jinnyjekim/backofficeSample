export type PublicationStatus = '작성중' | '공개예정' | '공개중' | '게시종료' | '비공개';
export type NoticeCategory = '서비스 안내' | '시스템 / 점검' | '정책 / 약관' | '업데이트' | '이벤트 안내' | '기타';
export type NoticeTarget = '전체 사용자' | '특정 회원 그룹';

export interface Attachment {
  name: string;
  size: string;
}

export interface LinkedExposure {
  type: '팝업' | '배너';
  id: string;
  label: string;
}

export interface NoticeHistoryEntry {
  when: string;
  title: string;
  detail?: string;
  by: string;
}
export interface NoticeMemo {
  when: string;
  by: string;
  text: string;
}

export interface Notice {
  id: string;
  title: string;
  category: NoticeCategory;
  important: boolean;
  pinStart: string | null;
  pinEnd: string | null;
  manualHidden: boolean;
  startAt: string | null;
  endAt: string | null;
  target: NoticeTarget;
  author: string;
  updatedBy: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  attachments: Attachment[];
  linkedExposures: LinkedExposure[];
  history: NoticeHistoryEntry[];
  memos: NoticeMemo[];
}

// 데모 기준 시각 — 실제 서비스라면 현재 시각을 사용합니다.
export const NOW = parseKDate('2026.08.24 12:00');

export function parseKDate(s: string): Date {
  const [datePart, timePart] = s.split(' ');
  const [y, m, d] = datePart.split('.').map(Number);
  const [hh, mm] = (timePart ?? '00:00').split(':').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh || 0, mm || 0);
}

// 공개 상태는 저장값이 아니라 시작일/종료일/강제 비공개 여부로부터 계산합니다.
export function computeStatus(n: Notice, now: Date = NOW): PublicationStatus {
  if (n.manualHidden) return '비공개';
  if (!n.startAt) return '작성중';
  const start = parseKDate(n.startAt);
  if (now < start) return '공개예정';
  if (n.endAt) {
    const end = parseKDate(n.endAt);
    if (now >= end) return '게시종료';
  }
  return '공개중';
}

export function isPinnedNow(n: Notice, now: Date = NOW): boolean {
  if (!n.pinStart) return false;
  const start = parseKDate(n.pinStart);
  if (now < start) return false;
  if (n.pinEnd && now > parseKDate(n.pinEnd)) return false;
  return true;
}

export const NOTICES: Notice[] = [
  {
    id: 'NTC-0142', title: '서비스 점검 안내', category: '시스템 / 점검', important: true,
    pinStart: '2026.08.18', pinEnd: '2026.08.27', manualHidden: false,
    startAt: '2026.08.18 09:00', endAt: '2026.08.26 06:00', target: '전체 사용자',
    author: 'admin01', updatedBy: 'admin01', views: 1284, createdAt: '2026.08.17', updatedAt: '2026.08.24 10:20',
    body: '안정적인 서비스 제공을 위해 아래와 같이 정기 점검을 진행합니다.\n\n일시: 2026.08.25 02:00 ~ 06:00\n대상: 전체 서비스\n영향: 점검 시간 동안 접속이 제한됩니다.',
    attachments: [{ name: '점검안내.pdf', size: '1.2MB' }],
    linkedExposures: [{ type: '팝업', id: 'PUP-018', label: '8월 정기점검 안내 팝업' }],
    history: [
      { when: '2026.08.17 14:00', title: '공지 등록', by: 'admin01' },
      { when: '2026.08.18 09:00', title: '자동 공개', by: '시스템' },
      { when: '2026.08.24 10:20', title: '본문 수정', detail: '점검 종료시간 05:00 → 06:00', by: 'admin01' },
    ],
    memos: [{ when: '2026.08.24', by: 'admin01', text: '점검 종료시간 변경 가능성 있어 여유 있게 반영함.' }],
  },
  {
    id: 'NTC-0141', title: '이용정책 변경 안내', category: '정책 / 약관', important: true,
    pinStart: null, pinEnd: null, manualHidden: false,
    startAt: '2026.08.27 09:00', endAt: null, target: '전체 사용자',
    author: 'admin02', updatedBy: 'admin02', views: 0, createdAt: '2026.08.23', updatedAt: '2026.08.23',
    body: '2026.09.01부터 적용되는 이용정책 개정 사항을 안내드립니다.\n\n주요 변경사항\n1. 위탁업체 목록 갱신\n2. 정보 보유기간 조정',
    attachments: [], linkedExposures: [],
    history: [{ when: '2026.08.23 17:10', title: '공지 등록 (예약 게시)', detail: '공개 시작 2026.08.27 09:00', by: 'admin02' }],
    memos: [{ when: '2026.08.23', by: 'admin02', text: '법무팀 검토 완료본으로 최종 반영.' }],
  },
  {
    id: 'NTC-0140', title: '개인정보 처리방침 개정 안내', category: '정책 / 약관', important: false,
    pinStart: null, pinEnd: null, manualHidden: false,
    startAt: '2026.08.10 10:00', endAt: null, target: '전체 사용자',
    author: 'admin02', updatedBy: 'admin02', views: 3120, createdAt: '2026.08.08', updatedAt: '2026.08.10',
    body: '개인정보 처리방침 일부 조항이 개정되어 안내드립니다. 자세한 내용은 첨부파일을 참고해 주세요.',
    attachments: [{ name: '개인정보처리방침_v3.pdf', size: '340KB' }], linkedExposures: [],
    history: [{ when: '2026.08.08 11:00', title: '공지 등록', by: 'admin02' }, { when: '2026.08.10 10:00', title: '자동 공개', by: '시스템' }],
    memos: [],
  },
  {
    id: 'NTC-0139', title: '신규 정산 관리 기능 업데이트', category: '업데이트', important: false,
    pinStart: null, pinEnd: null, manualHidden: false,
    startAt: '2026.08.05 09:00', endAt: '2026.08.20 00:00', target: '전체 사용자',
    author: 'admin01', updatedBy: 'admin01', views: 1890, createdAt: '2026.08.04', updatedAt: '2026.08.04',
    body: '정산 관리 메뉴가 개편되어 정산 상태와 지급 상태를 분리해서 확인하실 수 있습니다.',
    attachments: [], linkedExposures: [],
    history: [
      { when: '2026.08.04 16:00', title: '공지 등록', by: 'admin01' },
      { when: '2026.08.05 09:00', title: '자동 공개', by: '시스템' },
      { when: '2026.08.20 00:00', title: '자동 게시 종료', by: '시스템' },
    ],
    memos: [],
  },
  {
    id: 'NTC-0138', title: '추석 연휴 배송 및 고객센터 운영 안내', category: '서비스 안내', important: false,
    pinStart: null, pinEnd: null, manualHidden: false,
    startAt: '2026.09.10 09:00', endAt: '2026.09.25 00:00', target: '전체 사용자',
    author: 'admin03', updatedBy: 'admin03', views: 0, createdAt: '2026.08.20', updatedAt: '2026.08.20',
    body: '추석 연휴 기간 중 배송 일정 및 고객센터 운영시간 변경 사항을 안내드립니다.',
    attachments: [], linkedExposures: [],
    history: [{ when: '2026.08.20 15:20', title: '공지 등록 (예약 게시)', detail: '공개 시작 2026.09.10 09:00', by: 'admin03' }],
    memos: [],
  },
  {
    id: 'NTC-0137', title: '7월 서비스 점검 완료 안내', category: '시스템 / 점검', important: false,
    pinStart: null, pinEnd: null, manualHidden: false,
    startAt: '2026.07.15 09:00', endAt: '2026.07.20 00:00', target: '전체 사용자',
    author: 'admin01', updatedBy: 'admin01', views: 2410, createdAt: '2026.07.14', updatedAt: '2026.07.14',
    body: '7월 정기 점검이 정상적으로 완료되었습니다. 이용에 불편을 드려 죄송합니다.',
    attachments: [], linkedExposures: [],
    history: [
      { when: '2026.07.14 10:00', title: '공지 등록', by: 'admin01' },
      { when: '2026.07.15 09:00', title: '자동 공개', by: '시스템' },
      { when: '2026.07.20 00:00', title: '자동 게시 종료', by: '시스템' },
    ],
    memos: [],
  },
  {
    id: 'NTC-0136', title: '[초안] 여름 성수기 발주 마감시간 안내', category: '서비스 안내', important: false,
    pinStart: null, pinEnd: null, manualHidden: false,
    startAt: null, endAt: null, target: '전체 사용자',
    author: 'admin03', updatedBy: 'admin03', views: 0, createdAt: '2026.08.22', updatedAt: '2026.08.22',
    body: '성수기 물량 증가로 발주 마감시간이 임시로 변경될 예정입니다. (내용 검토 중)',
    attachments: [], linkedExposures: [],
    history: [{ when: '2026.08.22 11:00', title: '공지 Draft 생성', by: 'admin03' }],
    memos: [{ when: '2026.08.22', by: 'admin03', text: '물류팀 확정 일정 받는 대로 공개 예약 처리 예정.' }],
  },
  {
    id: 'NTC-0135', title: '거래처 신용한도 정책 변경 안내', category: '정책 / 약관', important: false,
    pinStart: null, pinEnd: null, manualHidden: true,
    startAt: '2026.07.01 09:00', endAt: null, target: '특정 회원 그룹',
    author: 'admin02', updatedBy: 'admin02', views: 980, createdAt: '2026.06.28', updatedAt: '2026.08.15',
    body: '거래처 신용한도 산정 기준이 일부 변경됩니다. 자세한 내용은 담당자에게 문의해 주세요.',
    attachments: [], linkedExposures: [],
    history: [
      { when: '2026.06.28 09:00', title: '공지 등록', by: 'admin02' },
      { when: '2026.07.01 09:00', title: '자동 공개', by: '시스템' },
      { when: '2026.08.15 09:30', title: '비공개 전환', detail: '정책 재검토로 임시 비공개', by: 'admin02' },
    ],
    memos: [{ when: '2026.08.15', by: 'admin02', text: '정책 재검토 중이라 임시 비공개 처리.' }],
  },
];

export const PUBLICATION_STATUS_META: Record<PublicationStatus, { bg: string; fg: string }> = {
  작성중: { bg: '#f4f4f5', fg: '#71717a' },
  공개예정: { bg: '#eef2ff', fg: '#4338ca' },
  공개중: { bg: '#ecfdf5', fg: '#059669' },
  게시종료: { bg: '#f4f4f5', fg: '#a1a1aa' },
  비공개: { bg: '#fef2f2', fg: '#b91c1c' },
};

export const NOTICE_CATEGORIES: NoticeCategory[] = ['서비스 안내', '시스템 / 점검', '정책 / 약관', '업데이트', '이벤트 안내', '기타'];
export const QUICK_FILTER_LABELS = ['전체', '공개중', '공개예정', '게시종료', '비공개'] as const;
export type NoticeQuickFilter = (typeof QUICK_FILTER_LABELS)[number];

export function matchesQuickFilter(n: Notice, key: NoticeQuickFilter): boolean {
  return key === '전체' || computeStatus(n) === key;
}

export function fmtNow(): string {
  const y = NOW.getFullYear();
  const m = String(NOW.getMonth() + 1).padStart(2, '0');
  const d = String(NOW.getDate()).padStart(2, '0');
  const hh = String(NOW.getHours()).padStart(2, '0');
  const mm = String(NOW.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${hh}:${mm}`;
}

export function todayIso(): string {
  const y = NOW.getFullYear();
  const m = String(NOW.getMonth() + 1).padStart(2, '0');
  const d = String(NOW.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fmtRange(n: Notice): string {
  if (!n.startAt) return '-';
  const start = n.startAt.slice(5, 10);
  if (!n.endAt) return `${start} ~`;
  return `${start} ~ ${n.endAt.slice(5, 10)}`;
}
