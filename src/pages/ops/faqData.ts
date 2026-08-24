import { NOW, parseKDate } from './noticesData';

export type FaqStatus = '비공개' | '공개예정' | '공개중' | '게시종료';
// 카테고리는 운영자가 직접 추가/관리할 수 있어 닫힌 유니온이 아닌 문자열로 둡니다.
export type FaqCategory = string;
export type FaqTarget = '전체 사용자' | '특정 회원 그룹';

export interface RelatedLink {
  label: string;
  url: string;
}
export interface FaqHistoryEntry {
  when: string;
  title: string;
  detail?: string;
  by: string;
}
export interface FaqMemo {
  when: string;
  by: string;
  text: string;
}

export interface Faq {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  keywords: string[];
  important: boolean;
  order: number;
  target: FaqTarget;
  startAt: string | null;
  endAt: string | null;
  manualHidden: boolean;
  relatedFaqIds: string[];
  relatedLinks: RelatedLink[];
  views: number;
  helpful: number;
  unhelpful: number;
  author: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  history: FaqHistoryEntry[];
  memos: FaqMemo[];
}

// FAQ는 별도의 "작성중" 상태를 두지 않고, 시작일이 없거나 강제 비공개면 비공개로 취급합니다.
export function computeStatus(f: Faq, now: Date = NOW): FaqStatus {
  if (f.manualHidden || !f.startAt) return '비공개';
  const start = parseKDate(f.startAt);
  if (now < start) return '공개예정';
  if (f.endAt) {
    const end = parseKDate(f.endAt);
    if (now >= end) return '게시종료';
  }
  return '공개중';
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export interface ReviewFlag {
  flag: boolean;
  reasons: string[];
}

export function needsReview(f: Faq, now: Date = NOW): ReviewFlag {
  const reasons: string[] = [];
  if (monthsBetween(parseKDate(f.updatedAt), now) >= 6) reasons.push('6개월 이상 수정 없음');
  const total = f.helpful + f.unhelpful;
  if (total >= 10 && f.unhelpful / total > 0.3) reasons.push('도움안됨 비율 높음');
  if (f.keywords.length === 0) reasons.push('검색 키워드 없음');
  return { flag: reasons.length > 0, reasons };
}

export const FAQS: Faq[] = [
  {
    id: 'FAQ-021', category: '이용 안내', question: '서비스 이용 방법은 무엇인가요?',
    answer: '거래처 등록 후 견적 요청 → 계약 → 발주 → 배송 → 정산 순으로 이용하실 수 있습니다.\n\n각 단계는 좌측 메뉴에서 확인하실 수 있습니다.',
    keywords: ['이용방법', '시작하기', '가이드'], important: true, order: 1, target: '전체 사용자',
    startAt: '2026.04.12 09:00', endAt: null, manualHidden: false,
    relatedFaqIds: [], relatedLinks: [{ label: '대시보드 바로가기', url: '/dashboard' }],
    views: 5210, helpful: 480, unhelpful: 12, author: 'admin01', updatedBy: 'admin01', createdAt: '2026.04.12', updatedAt: '2026.08.22',
    history: [{ when: '2026.04.12 09:00', title: 'FAQ 등록', by: 'admin01' }, { when: '2026.08.22 14:20', title: '답변 수정', by: 'admin01' }],
    memos: [],
  },
  {
    id: 'FAQ-020', category: '결제', question: '결제 취소는 어떻게 하나요?',
    answer: '결제/수금 > 결제 메뉴에서 해당 건을 선택 후 결제 취소를 요청할 수 있습니다. 이미 정산이 진행된 건은 조정으로 처리됩니다.',
    keywords: ['결제취소', '취소', '카드취소', '결제환불', '승인취소'], important: false, order: 1, target: '전체 사용자',
    startAt: '2026.05.10 10:05', endAt: null, manualHidden: false,
    relatedFaqIds: [], relatedLinks: [],
    views: 3980, helpful: 320, unhelpful: 40, author: 'admin01', updatedBy: 'admin01', createdAt: '2026.05.10', updatedAt: '2026.05.10',
    history: [{ when: '2026.05.10 10:05', title: 'FAQ 등록', by: 'admin01' }], memos: [],
  },
  {
    id: 'FAQ-019', category: '배송', question: '배송 상태는 어디에서 확인하나요?',
    answer: '주문 상세에서 배송 상태와 송장번호를 확인할 수 있습니다.\n\n1. 주문 내역으로 이동합니다.\n2. 확인할 주문을 선택합니다.\n3. 배송정보의 송장번호를 확인합니다.',
    keywords: ['배송조회', '택배조회', '송장'], important: true, order: 1, target: '전체 사용자',
    startAt: '2026.04.22 09:30', endAt: null, manualHidden: false,
    relatedFaqIds: ['FAQ-018', 'FAQ-017'], relatedLinks: [{ label: '주문 내역 바로가기', url: '/orders/purchase' }],
    views: 6720, helpful: 610, unhelpful: 15, author: 'admin02', updatedBy: 'admin02', createdAt: '2026.04.22', updatedAt: '2026.04.22',
    history: [{ when: '2026.04.22 09:30', title: 'FAQ 등록', by: 'admin02' }], memos: [],
  },
  {
    id: 'FAQ-018', category: '배송', question: '송장번호는 어디에서 확인하나요?',
    answer: '배송 관리 > 배송중 메뉴에서 주문번호로 검색하면 송장번호를 확인할 수 있습니다.',
    keywords: ['송장번호', '운송장'], important: false, order: 2, target: '전체 사용자',
    startAt: '2026.04.25 10:00', endAt: null, manualHidden: false,
    relatedFaqIds: ['FAQ-019'], relatedLinks: [],
    views: 2890, helpful: 240, unhelpful: 9, author: 'admin02', updatedBy: 'admin02', createdAt: '2026.04.25', updatedAt: '2026.04.25',
    history: [{ when: '2026.04.25 10:00', title: 'FAQ 등록', by: 'admin02' }], memos: [],
  },
  {
    id: 'FAQ-017', category: '배송', question: '배송지를 변경할 수 있나요?',
    answer: '출고 전이라면 주문 상세에서 배송지를 변경할 수 있습니다. 출고 이후에는 고객센터로 문의해 주세요.',
    keywords: ['배송지변경', '주소변경'], important: false, order: 3, target: '전체 사용자',
    startAt: '2026.04.25 10:05', endAt: null, manualHidden: false,
    relatedFaqIds: ['FAQ-019'], relatedLinks: [],
    views: 1420, helpful: 110, unhelpful: 8, author: 'admin02', updatedBy: 'admin02', createdAt: '2026.04.25', updatedAt: '2026.04.25',
    history: [{ when: '2026.04.25 10:05', title: 'FAQ 등록', by: 'admin02' }], memos: [],
  },
  {
    id: 'FAQ-016', category: '주문', question: '최소 주문수량 미만으로 주문할 수 있나요?',
    answer: '상품별로 설정된 최소 주문수량(MOQ) 미만 주문은 원칙적으로 불가하며, 예외 승인이 필요합니다.',
    keywords: ['최소주문', 'MOQ'], important: false, order: 1, target: '전체 사용자',
    startAt: '2026.02.25 15:20', endAt: null, manualHidden: true,
    relatedFaqIds: [], relatedLinks: [],
    views: 430, helpful: 30, unhelpful: 6, author: 'admin01', updatedBy: 'admin01', createdAt: '2026.02.25', updatedAt: '2026.06.10',
    history: [
      { when: '2026.02.25 15:20', title: 'FAQ 등록', by: 'admin01' },
      { when: '2026.06.10 09:00', title: '비공개 전환', detail: '정책 재검토 중', by: 'admin01' },
    ],
    memos: [{ when: '2026.06.10', by: 'admin01', text: '정책 재검토 중이라 임시 비공개 처리.' }],
  },
  {
    id: 'FAQ-015', category: '주문', question: '견적서 유효기간은 얼마나 되나요?',
    answer: '별도 명시가 없는 경우 견적서 발행일로부터 14일간 유효합니다.',
    keywords: ['견적서', '유효기간'], important: false, order: 2, target: '전체 사용자',
    startAt: '2026.02.02 10:00', endAt: null, manualHidden: false,
    relatedFaqIds: [], relatedLinks: [],
    views: 2110, helpful: 180, unhelpful: 5, author: 'admin02', updatedBy: 'admin02', createdAt: '2026.02.02', updatedAt: '2026.02.02',
    history: [{ when: '2026.02.02 10:00', title: 'FAQ 등록', by: 'admin02' }], memos: [],
  },
  {
    id: 'FAQ-014', category: '결제', question: '거래처 신용한도는 어떻게 산정되나요?',
    answer: '최근 6개월 거래 실적과 결제 이력을 기준으로 산정되며, 변경을 원하시면 담당자에게 문의해 주세요.',
    keywords: ['신용한도', '한도'], important: false, order: 2, target: '전체 사용자',
    startAt: '2025.09.10 14:00', endAt: null, manualHidden: false,
    relatedFaqIds: [], relatedLinks: [],
    views: 1240, helpful: 90, unhelpful: 14, author: 'admin02', updatedBy: 'admin02', createdAt: '2025.09.10', updatedAt: '2025.09.10',
    history: [{ when: '2025.09.10 14:00', title: 'FAQ 등록', by: 'admin02' }],
    memos: [{ when: '2026.06.01', by: 'admin02', text: '신용한도 정책 개정에 맞춰 답변 업데이트 필요.' }],
  },
  {
    id: 'FAQ-013', category: '회원 / 계정', question: '회원 탈퇴는 어떻게 하나요?',
    answer: '거래처 관리 > 담당자 메뉴에서 계정 삭제를 요청하거나, 고객센터로 문의해 주세요.',
    keywords: [], important: false, order: 1, target: '전체 사용자',
    startAt: '2026.03.18 11:00', endAt: null, manualHidden: false,
    relatedFaqIds: [], relatedLinks: [],
    views: 890, helpful: 20, unhelpful: 35, author: 'admin03', updatedBy: 'admin03', createdAt: '2026.03.18', updatedAt: '2026.03.18',
    history: [{ when: '2026.03.18 11:00', title: 'FAQ 등록', by: 'admin03' }], memos: [],
  },
  {
    id: 'FAQ-012', category: '배송', question: '추석 연휴 배송 일정은 어떻게 되나요?',
    answer: '추석 연휴 기간(09.10~09.25) 중 배송 일정이 조정됩니다. 자세한 내용은 공지사항을 참고해 주세요.',
    keywords: ['추석', '연휴', '배송일정'], important: false, order: 4, target: '전체 사용자',
    startAt: '2026.09.05 09:00', endAt: '2026.09.26 00:00', manualHidden: false,
    relatedFaqIds: [], relatedLinks: [{ label: '추석 연휴 공지 보기', url: '/ops/notices' }],
    views: 0, helpful: 0, unhelpful: 0, author: 'admin03', updatedBy: 'admin03', createdAt: '2026.08.20', updatedAt: '2026.08.20',
    history: [{ when: '2026.08.20 15:40', title: 'FAQ 등록 (예약 게시)', by: 'admin03' }], memos: [],
  },
  {
    id: 'FAQ-011', category: '이용 안내', question: '설날 연휴 배송 일정은 어떻게 되나요? (종료)',
    answer: '설날 연휴 기간 중 배송 일정 안내였습니다. 현재는 유효하지 않은 정보입니다.',
    keywords: ['설날', '연휴'], important: false, order: 5, target: '전체 사용자',
    startAt: '2026.02.01 09:00', endAt: '2026.02.15 00:00', manualHidden: false,
    relatedFaqIds: [], relatedLinks: [],
    views: 3200, helpful: 210, unhelpful: 8, author: 'admin03', updatedBy: 'admin03', createdAt: '2026.01.28', updatedAt: '2026.01.28',
    history: [
      { when: '2026.01.28 10:00', title: 'FAQ 등록', by: 'admin03' },
      { when: '2026.02.15 00:00', title: '자동 게시 종료', by: '시스템' },
    ],
    memos: [],
  },
];

export const FAQ_STATUS_META: Record<FaqStatus, { bg: string; fg: string }> = {
  비공개: { bg: '#f4f4f5', fg: '#71717a' },
  공개예정: { bg: '#eef2ff', fg: '#4338ca' },
  공개중: { bg: '#ecfdf5', fg: '#059669' },
  게시종료: { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export const DEFAULT_FAQ_CATEGORIES: FaqCategory[] = ['이용 안내', '회원 / 계정', '주문', '결제', '배송', '취소 / 환불', '기타'];
export const QUICK_FILTER_LABELS = ['전체', '공개중', '비공개', '공개예정', '검토필요'] as const;
export type FaqQuickFilter = (typeof QUICK_FILTER_LABELS)[number];

export function matchesQuickFilter(f: Faq, key: FaqQuickFilter): boolean {
  if (key === '전체') return true;
  if (key === '검토필요') return needsReview(f).flag;
  return computeStatus(f) === key;
}

export function fmtRange(f: Faq): string {
  if (!f.startAt) return '-';
  const start = f.startAt.slice(5, 10);
  if (!f.endAt) return `${start} ~`;
  return `${start} ~ ${f.endAt.slice(5, 10)}`;
}
