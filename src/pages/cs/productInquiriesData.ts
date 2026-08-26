import { PRODUCTS } from '../products/productsData';

export type AnswerStatus = '답변 대기' | '답변 완료';
export type Visibility = '공개' | '비공개';
export type InquiryType = '상품 정보' | '배송' | '교환/반품' | '옵션' | '재입고' | '기타';

export const INQUIRY_TYPES: InquiryType[] = ['상품 정보', '배송', '교환/반품', '옵션', '재입고', '기타'];

export const TODAY = '2026-08-26';

export const STATUS_META: Record<AnswerStatus, { bg: string; fg: string }> = {
  '답변 대기': { bg: '#fef2f2', fg: '#b91c1c' },
  '답변 완료': { bg: '#ecfdf5', fg: '#059669' },
};

export interface Attachment {
  id: string;
  name: string;
}

export interface AnswerHistoryEntry {
  id: string;
  at: string;
  by: string;
  action: '답변 등록' | '답변 수정';
  before: string | null;
  after: string;
}

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface Answer {
  content: string;
  by: string;
  at: string;
}

export interface ProductInquiry {
  id: string;
  productCode: string;
  title: string;
  content: string;
  attachments: Attachment[];
  member: string;
  inquiryType: InquiryType;
  visibility: Visibility;
  status: AnswerStatus;
  createdAt: string;
  hidden: boolean;
  answer: Answer | null;
  answerHistory: AnswerHistoryEntry[];
  memos: Memo[];
}

export function productName(code: string): string {
  return PRODUCTS.find((p) => p.code === code)?.name ?? code;
}

export function computeIssues(q: ProductInquiry): string[] {
  const issues: string[] = [];
  if (q.status === '답변 대기') {
    const days = Math.floor((new Date(TODAY).getTime() - new Date(q.createdAt.slice(0, 10)).getTime()) / 86400000);
    if (days >= 3) issues.push(`${days}일째 답변 대기 중입니다.`);
  }
  return issues;
}

export type QuickFilter = '전체' | '답변 대기' | '답변 완료';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '답변 대기', '답변 완료'];

export function matchesQuickFilter(q: ProductInquiry, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  return q.status === filter;
}

export function nextInquiryId(all: ProductInquiry[]): string {
  const max = all.reduce((m, q) => {
    const n = Number(q.id.replace('Q-', ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `Q-${String(max + 1).padStart(5, '0')}`;
}

export const PRODUCT_INQUIRIES: ProductInquiry[] = [
  {
    id: 'Q-00128', productCode: 'P-001238', title: '배송 관련 문의', content: '주문한 상품 배송이 언제쯤 시작되는지 궁금합니다. 급하게 필요한 상황이라 빠른 답변 부탁드립니다.',
    attachments: [], member: 'user01', inquiryType: '배송', visibility: '공개', status: '답변 대기', createdAt: '2026-08-26 09:12',
    hidden: false, answer: null, answerHistory: [], memos: [],
  },
  {
    id: 'Q-00127', productCode: 'P-001239', title: '옵션 문의', content: '색상 옵션에 네이비도 추가될 예정인가요? 사이트에는 블랙/화이트만 보여서 문의드립니다.',
    attachments: [{ id: 'AT-1', name: '옵션문의_참고이미지.jpg' }], member: 'user02', inquiryType: '옵션', visibility: '공개', status: '답변 완료', createdAt: '2026-08-26 08:40',
    hidden: false,
    answer: { content: '문의 주셔서 감사합니다. 네이비 색상은 9월 초 재입고 예정이며, 재입고 알림 신청을 이용해 주시면 안내드리겠습니다.', by: 'admin02', at: '2026-08-26 10:05' },
    answerHistory: [{ id: 'AH-1', at: '2026-08-26 10:05', by: 'admin02', action: '답변 등록', before: null, after: '문의 주셔서 감사합니다. 네이비 색상은 9월 초 재입고 예정이며, 재입고 알림 신청을 이용해 주시면 안내드리겠습니다.' }],
    memos: [],
  },
  {
    id: 'Q-00126', productCode: 'P-001240', title: '상품 구성 문의', content: '패키지 안에 구성품이 정확히 몇 개 들어있는지 상세페이지에 표기가 없어서 여쭤봅니다.',
    attachments: [], member: 'user03', inquiryType: '상품 정보', visibility: '공개', status: '답변 완료', createdAt: '2026-08-25 15:20',
    hidden: false,
    answer: { content: '기본 구성품은 본체 1개, 설명서 1부, 보증서 1부이며 별도 액세서리는 포함되어 있지 않습니다.', by: 'admin01', at: '2026-08-25 16:40' },
    answerHistory: [{ id: 'AH-2', at: '2026-08-25 16:40', by: 'admin01', action: '답변 등록', before: null, after: '기본 구성품은 본체 1개, 설명서 1부, 보증서 1부이며 별도 액세서리는 포함되어 있지 않습니다.' }],
    memos: [],
  },
  {
    id: 'Q-00125', productCode: 'P-001238', title: '재입고 문의', content: '품절로 표시되는데 재입고는 언제쯤인가요?',
    attachments: [], member: 'user04', inquiryType: '재입고', visibility: '공개', status: '답변 대기', createdAt: '2026-08-23 11:02',
    hidden: false, answer: null, answerHistory: [], memos: [{ id: 'M-1', at: '2026-08-24 09:00', by: 'admin01', text: '상품팀에 재입고 일정 확인 요청함.' }],
  },
  {
    id: 'Q-00124', productCode: 'P-000982', title: '결제 관련 개인정보 포함 문의 (비공개)', content: '환불 계좌를 변경하고 싶은데 계좌번호가 010-XXXX 통장이 맞는지 확인 부탁드립니다. 계좌번호: 123-456-789012',
    attachments: [], member: 'user05', inquiryType: '기타', visibility: '비공개', status: '답변 완료', createdAt: '2026-08-22 13:44',
    hidden: false,
    answer: { content: '안내드린 계좌 정보로 정상 확인되었습니다. 환불은 영업일 기준 3~5일 소요됩니다.', by: 'admin03', at: '2026-08-22 15:10' },
    answerHistory: [{ id: 'AH-3', at: '2026-08-22 15:10', by: 'admin03', action: '답변 등록', before: null, after: '안내드린 계좌 정보로 정상 확인되었습니다. 환불은 영업일 기준 3~5일 소요됩니다.' }],
    memos: [],
  },
  {
    id: 'Q-00123', productCode: 'P-001241', title: '교환 문의', content: '사이즈가 안 맞아서 교환하고 싶습니다. 절차가 어떻게 되나요?',
    attachments: [{ id: 'AT-2', name: '수령상품_사진1.jpg' }, { id: 'AT-3', name: '수령상품_사진2.jpg' }], member: 'user06', inquiryType: '교환/반품', visibility: '공개', status: '답변 완료', createdAt: '2026-08-21 10:15',
    hidden: false,
    answer: { content: '마이페이지 > 주문내역에서 교환 신청이 가능합니다. 신청 후 회수 기사님이 방문 예정입니다.', by: 'admin02', at: '2026-08-21 11:00' },
    answerHistory: [
      { id: 'AH-4', at: '2026-08-21 11:00', by: 'admin02', action: '답변 등록', before: null, after: '마이페이지에서 교환 신청 부탁드립니다.' },
      { id: 'AH-5', at: '2026-08-21 14:22', by: 'admin01', action: '답변 수정', before: '마이페이지에서 교환 신청 부탁드립니다.', after: '마이페이지 > 주문내역에서 교환 신청이 가능합니다. 신청 후 회수 기사님이 방문 예정입니다.' },
    ],
    memos: [],
  },
  {
    id: 'Q-00122', productCode: 'P-001239', title: '기타 문의', content: '선물 포장이 가능한가요?', attachments: [], member: 'user07', inquiryType: '기타', visibility: '공개', status: '답변 대기', createdAt: '2026-08-26 07:55',
    hidden: false, answer: null, answerHistory: [], memos: [],
  },
  {
    id: 'Q-00121', productCode: 'P-000982', title: '배송 지연 문의', content: '주문한지 일주일이 넘었는데 아직도 배송 준비중입니다. 확인 부탁드립니다.',
    attachments: [], member: 'user08', inquiryType: '배송', visibility: '공개', status: '답변 대기', createdAt: '2026-08-19 09:30',
    hidden: false, answer: null, answerHistory: [], memos: [],
  },
  {
    id: 'Q-00120', productCode: 'P-001240', title: '욕설이 포함된 부적절한 문의', content: '(부적절한 표현이 포함되어 관리자에 의해 숨김 처리되었습니다.)',
    attachments: [], member: 'user09', inquiryType: '기타', visibility: '공개', status: '답변 완료', createdAt: '2026-08-18 20:11',
    hidden: true,
    answer: { content: '운영 정책에 따라 해당 문의는 비노출 처리되었습니다.', by: 'admin01', at: '2026-08-19 09:00' },
    answerHistory: [{ id: 'AH-6', at: '2026-08-19 09:00', by: 'admin01', action: '답변 등록', before: null, after: '운영 정책에 따라 해당 문의는 비노출 처리되었습니다.' }],
    memos: [{ id: 'M-2', at: '2026-08-19 09:01', by: 'admin01', text: '욕설 포함으로 문의 숨김 처리함. 재발 시 회원 제재 검토.' }],
  },
  {
    id: 'Q-00119', productCode: 'P-001238', title: '상품 소재 문의', content: '세탁 시 주의사항이 있을까요? 소재가 궁금합니다.',
    attachments: [], member: 'user10', inquiryType: '상품 정보', visibility: '공개', status: '답변 완료', createdAt: '2026-08-17 12:00',
    hidden: false,
    answer: { content: '면 80%, 폴리에스터 20% 혼방 소재로 찬물 손세탁을 권장드립니다.', by: 'admin03', at: '2026-08-17 13:30' },
    answerHistory: [{ id: 'AH-7', at: '2026-08-17 13:30', by: 'admin03', action: '답변 등록', before: null, after: '면 80%, 폴리에스터 20% 혼방 소재로 찬물 손세탁을 권장드립니다.' }],
    memos: [],
  },
  {
    id: 'Q-00118', productCode: 'P-001241', title: '입고 문의', content: '4번 상품은 판매가가 0원으로 표시되는데 정상인가요?',
    attachments: [], member: 'user02', inquiryType: '상품 정보', visibility: '공개', status: '답변 대기', createdAt: '2026-08-23 16:48',
    hidden: false, answer: null, answerHistory: [], memos: [],
  },
];
