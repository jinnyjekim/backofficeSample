import { PRODUCTS } from '../products/productsData';

export type Exposure = '노출' | '비노출' | '삭제';
export type ModerationStatus = '정상' | '검토 필요';
export type ReportStatus = '접수' | '검토중' | '처리 완료' | '반려';
export type ReportType = '욕설/비방' | '광고/스팸' | '개인정보 노출' | '상품과 무관' | '기타';
export type HideReason = '욕설 / 비방' | '광고 / 스팸' | '개인정보 노출' | '상품과 무관한 내용' | '허위 / 부적절 콘텐츠' | '신고 누적' | '운영 정책 위반' | '기타';

export const TODAY = '2026-08-26';
export const HIDE_REASONS: HideReason[] = ['욕설 / 비방', '광고 / 스팸', '개인정보 노출', '상품과 무관한 내용', '허위 / 부적절 콘텐츠', '신고 누적', '운영 정책 위반', '기타'];
export const DELETE_REASONS = ['욕설 / 비방', '허위 / 부적절 콘텐츠', '운영 정책 위반', '회원 요청', '기타'];

export const EXPOSURE_META: Record<Exposure, { bg: string; fg: string }> = {
  노출: { bg: '#ecfdf5', fg: '#059669' },
  비노출: { bg: '#f4f4f5', fg: '#71717a' },
  삭제: { bg: '#fef2f2', fg: '#b91c1c' },
};

export interface Report {
  id: string;
  at: string;
  type: ReportType;
  reporter: string;
  status: ReportStatus;
}

export interface AdminReply {
  at: string;
  by: string;
  text: string;
}

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  detail?: string;
}

export interface Review {
  id: string;
  productCode: string;
  member: string;
  orderId: string | null;
  rating: number;
  content: string;
  imageCount: number;
  exposure: Exposure;
  moderationStatus: ModerationStatus;
  reviewFlags: string[];
  hideReason: HideReason | null;
  hideDetail: string | null;
  deleteReason: string | null;
  reports: Report[];
  adminReply: AdminReply | null;
  createdAt: string;
  updatedAt: string;
  memos: Memo[];
  history: HistoryEntry[];
}

export function productName(code: string): string {
  return PRODUCTS.find((p) => p.code === code)?.name ?? code;
}

export function pendingReportCount(r: Review): number {
  return r.reports.filter((x) => x.status === '접수' || x.status === '검토중').length;
}

export function computeIssues(r: Review): string[] {
  const issues = [...r.reviewFlags];
  if (r.exposure === '노출' && pendingReportCount(r) > 0) issues.push('신고가 접수되었지만 아직 노출중입니다.');
  return issues;
}

export type QuickFilter = '전체' | '노출중' | '검토 필요' | '신고 리뷰' | '비노출' | '삭제됨';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '노출중', '검토 필요', '신고 리뷰', '비노출', '삭제됨'];

export function matchesQuickFilter(r: Review, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '노출중') return r.exposure === '노출';
  if (filter === '검토 필요') return r.moderationStatus === '검토 필요';
  if (filter === '신고 리뷰') return pendingReportCount(r) > 0;
  if (filter === '비노출') return r.exposure === '비노출';
  return r.exposure === '삭제';
}

export const REVIEWS: Review[] = [
  {
    id: 'RV-20260826-00182', productCode: 'P-001238', member: 'user01', orderId: 'O-01041',
    rating: 5, content: '배송도 빠르고 상품 상태도 좋았습니다. 재구매 의사 있어요.', imageCount: 2,
    exposure: '노출', moderationStatus: '정상', reviewFlags: [], hideReason: null, hideDetail: null, deleteReason: null,
    reports: [], adminReply: null,
    createdAt: '2026-08-26 10:20', updatedAt: '2026-08-26 10:20', memos: [],
    history: [{ id: 'H-1', at: '2026-08-26 10:20', by: 'user01', action: '리뷰 등록' }],
  },
  {
    id: 'RV-20260826-00183', productCode: 'P-001239', member: 'user02', orderId: null,
    rating: 1, content: '상품이 너무 별로예요. 사진과 다릅니다.', imageCount: 0,
    exposure: '노출', moderationStatus: '검토 필요', reviewFlags: ['구매 인증 데이터 없음'], hideReason: null, hideDetail: null, deleteReason: null,
    reports: [
      { id: 'RPT-1', at: '2026-08-26 10:40', type: '상품과 무관', reporter: 'user11', status: '접수' },
      { id: 'RPT-2', at: '2026-08-26 10:42', type: '기타', reporter: 'user22', status: '접수' },
      { id: 'RPT-3', at: '2026-08-26 11:03', type: '욕설/비방', reporter: 'user31', status: '검토중' },
    ],
    adminReply: null,
    createdAt: '2026-08-25 09:00', updatedAt: '2026-08-26 11:03',
    memos: [{ id: 'M-1', at: '2026-08-26 11:10', by: 'admin01', text: '구매 인증 없이 등록된 리뷰입니다. 신고도 누적되어 검토 필요.' }],
    history: [
      { id: 'H-1', at: '2026-08-25 09:00', by: 'user02', action: '리뷰 등록' },
      { id: 'H-2', at: '2026-08-26 11:03', by: 'SYSTEM', action: '신고 3건 누적' },
    ],
  },
  {
    id: 'RV-20260825-00170', productCode: 'P-001240', member: 'user03', orderId: 'O-00700',
    rating: 4, content: '생각보다 괜찮습니다. 자세한 후기는 블로그 링크 참고하세요 (링크 생략).', imageCount: 1,
    exposure: '비노출', moderationStatus: '정상', reviewFlags: [], hideReason: '광고 / 스팸', hideDetail: '리뷰 내 외부 링크 홍보 포함', deleteReason: null,
    reports: [], adminReply: null,
    createdAt: '2026-08-20 14:00', updatedAt: '2026-08-21 09:00',
    memos: [], history: [
      { id: 'H-1', at: '2026-08-20 14:00', by: 'user03', action: '리뷰 등록' },
      { id: 'H-2', at: '2026-08-21 09:00', by: 'admin02', action: '비노출 처리', detail: '광고 / 스팸' },
    ],
  },
  {
    id: 'RV-20260823-00150', productCode: 'P-001238', member: 'user04', orderId: 'O-00920',
    rating: 5, content: '이 가격에 이 품질이면 만족합니다.', imageCount: 0,
    exposure: '노출', moderationStatus: '정상', reviewFlags: [], hideReason: null, hideDetail: null, deleteReason: null,
    reports: [], adminReply: { at: '2026-08-24 09:00', by: 'admin01', text: '소중한 리뷰 감사합니다. 앞으로도 좋은 모습 보여드리겠습니다.' },
    createdAt: '2026-08-23 12:00', updatedAt: '2026-08-24 09:00', memos: [],
    history: [
      { id: 'H-1', at: '2026-08-23 12:00', by: 'user04', action: '리뷰 등록' },
      { id: 'H-2', at: '2026-08-24 09:00', by: 'admin01', action: '관리자 답변 등록' },
    ],
  },
  {
    id: 'RV-20260822-00140', productCode: 'P-001239', member: 'user08', orderId: 'O-00990',
    rating: 3, content: '나쁘지 않은데 옵션 표기가 헷갈렸어요.', imageCount: 0,
    exposure: '노출', moderationStatus: '검토 필요', reviewFlags: ['리뷰 상품과 주문 상품 불일치'], hideReason: null, hideDetail: null, deleteReason: null,
    reports: [], adminReply: null,
    createdAt: '2026-08-22 10:00', updatedAt: '2026-08-22 10:00',
    memos: [{ id: 'M-1', at: '2026-08-26 09:30', by: 'admin02', text: '주문 상품과 리뷰 대상 상품이 다른 것으로 보입니다. 확인 필요.' }],
    history: [{ id: 'H-1', at: '2026-08-22 10:00', by: 'user08', action: '리뷰 등록' }],
  },
  {
    id: 'RV-20260815-00090', productCode: 'P-000982', member: 'user06', orderId: 'O-00750',
    rating: 5, content: '(삭제된 리뷰)', imageCount: 0,
    exposure: '삭제', moderationStatus: '정상', reviewFlags: [], hideReason: null, hideDetail: null, deleteReason: '운영 정책 위반',
    reports: [{ id: 'RPT-1', at: '2026-08-15 10:00', type: '욕설/비방', reporter: 'user12', status: '처리 완료' }],
    adminReply: null,
    createdAt: '2026-08-14 09:00', updatedAt: '2026-08-15 11:00', memos: [],
    history: [
      { id: 'H-1', at: '2026-08-14 09:00', by: 'user06', action: '리뷰 등록' },
      { id: 'H-2', at: '2026-08-15 10:00', by: 'SYSTEM', action: '신고 접수' },
      { id: 'H-3', at: '2026-08-15 11:00', by: 'admin03', action: '삭제 처리', detail: '운영 정책 위반' },
    ],
  },
  {
    id: 'RV-20260701-00050', productCode: 'P-001238', member: 'user07', orderId: 'O-00610',
    rating: 4, content: '무난하게 잘 쓰고 있습니다.', imageCount: 1,
    exposure: '노출', moderationStatus: '정상', reviewFlags: [], hideReason: null, hideDetail: null, deleteReason: null,
    reports: [], adminReply: null,
    createdAt: '2026-07-01 09:00', updatedAt: '2026-07-01 09:00', memos: [],
    history: [{ id: 'H-1', at: '2026-07-01 09:00', by: 'user07', action: '리뷰 등록' }],
  },
  {
    id: 'RV-20260628-00040', productCode: 'P-001239', member: 'user08', orderId: 'O-00550',
    rating: 1, content: '문제가 있는 것 같아요. 환불 요청했습니다.', imageCount: 0,
    exposure: '노출', moderationStatus: '검토 필요', reviewFlags: ['신고 접수'], hideReason: null, hideDetail: null, deleteReason: null,
    reports: [
      { id: 'RPT-1', at: '2026-06-29 09:00', type: '기타', reporter: 'user09', status: '접수' },
      { id: 'RPT-2', at: '2026-06-29 10:00', type: '상품과 무관', reporter: 'user10', status: '접수' },
    ],
    adminReply: null,
    createdAt: '2026-06-28 09:00', updatedAt: '2026-06-29 10:00', memos: [],
    history: [
      { id: 'H-1', at: '2026-06-28 09:00', by: 'user08', action: '리뷰 등록' },
      { id: 'H-2', at: '2026-06-29 10:00', by: 'SYSTEM', action: '신고 2건 누적' },
    ],
  },
  {
    id: 'RV-20260618-00030', productCode: 'P-001240', member: 'user09', orderId: null,
    rating: 5, content: '문의드립니다 - 이 상품 재입고 언제 되나요?', imageCount: 0,
    exposure: '비노출', moderationStatus: '정상', reviewFlags: [], hideReason: '상품과 무관한 내용', hideDetail: '리뷰가 아닌 문의성 내용', deleteReason: null,
    reports: [], adminReply: null,
    createdAt: '2026-06-18 09:00', updatedAt: '2026-06-19 09:00', memos: [],
    history: [
      { id: 'H-1', at: '2026-06-18 09:00', by: 'user09', action: '리뷰 등록' },
      { id: 'H-2', at: '2026-06-19 09:00', by: 'admin01', action: '비노출 처리', detail: '상품과 무관한 내용' },
    ],
  },
  {
    id: 'RV-20260601-00010', productCode: 'P-001241', member: 'user10', orderId: 'O-01050',
    rating: 3, content: '보통이에요.', imageCount: 0,
    exposure: '노출', moderationStatus: '정상', reviewFlags: [], hideReason: null, hideDetail: null, deleteReason: null,
    reports: [], adminReply: null,
    createdAt: '2026-06-01 09:00', updatedAt: '2026-06-01 09:00', memos: [],
    history: [{ id: 'H-1', at: '2026-06-01 09:00', by: 'user10', action: '리뷰 등록' }],
  },
];
