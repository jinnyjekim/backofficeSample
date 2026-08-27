import { SALE_PRODUCTS, type SaleProduct } from '../sales/salesActivityData';

export type ReviewStage = '등록대기' | '검수중' | '승인' | '반려';
export type ModerationStatus = '검토대기' | '소명중' | '조치완료';

export interface ProductReviewItem {
  id: string;
  productId: string;
  stage: ReviewStage;
  submittedAt: string;
  reviewer: string;
  imageCheck: boolean;
  descriptionCheck: boolean;
  categoryCheck: boolean;
  prohibitedKeyword: string;
  reason: string;
}

export interface ProductModerationCase {
  id: string;
  productId: string;
  source: '회원 신고' | '자동 탐지' | '운영 모니터링';
  issue: string;
  risk: '일반' | '주의' | '긴급';
  status: ModerationStatus;
  receivedAt: string;
  assignee: string;
  action: '미조치' | '숨김' | '삭제' | '복구';
  appeal: string;
}

export interface UserProductHistory {
  id: string;
  occurredAt: string;
  productId: string;
  action: string;
  before: string;
  after: string;
  actor: string;
  reason: string;
  source: string;
}

const REVIEW_STAGES: ReviewStage[] = ['검수중', '등록대기', '승인', '반려'];
export const PRODUCT_REVIEWS: ProductReviewItem[] = SALE_PRODUCTS.slice(0, 12).map((product, index) => ({
  id: `REV-2608-${String(401 + index).padStart(4, '0')}`,
  productId: product.id,
  stage: REVIEW_STAGES[index % REVIEW_STAGES.length],
  submittedAt: `2026-08-${String(26 - Math.floor(index / 2)).padStart(2, '0')} ${String(9 + index % 8).padStart(2, '0')}:20`,
  reviewer: index % 4 === 1 ? '미배정' : `admin0${index % 4 + 1}`,
  imageCheck: index % 5 !== 0,
  descriptionCheck: index % 4 !== 1,
  categoryCheck: index % 6 !== 2,
  prohibitedKeyword: index === 3 ? '한정판 정품 보장' : index === 8 ? '레플리카' : '-',
  reason: index % 4 === 3 ? '상품 설명 및 증빙 자료 보완 필요' : index % 4 === 2 ? '검수 기준 충족' : '검수 체크리스트 확인 중',
}));

const MODERATION_SEEDS: Array<[number, ProductModerationCase['source'], string, ProductModerationCase['risk'], ModerationStatus, ProductModerationCase['action']]> = [
  [3, '회원 신고', '동일 상품 반복 등록', '주의', '검토대기', '미조치'],
  [8, '자동 탐지', '가품 의심 키워드 및 가격 이상', '긴급', '소명중', '숨김'],
  [5, '회원 신고', '상품 상태 설명 불일치', '주의', '검토대기', '미조치'],
  [12, '운영 모니터링', '연락처 외부 노출', '일반', '조치완료', '삭제'],
  [9, '자동 탐지', '중복 이미지 탐지', '일반', '조치완료', '숨김'],
  [0, '회원 신고', '카테고리 오등록', '일반', '조치완료', '복구'],
  [6, '회원 신고', '가격 허위 기재 의심', '주의', '소명중', '숨김'],
];

export const PRODUCT_MODERATION_CASES: ProductModerationCase[] = MODERATION_SEEDS.map((seed, index) => ({
  id: `MOD-2608-${String(201 + index).padStart(4, '0')}`,
  productId: SALE_PRODUCTS[seed[0]].id,
  source: seed[1], issue: seed[2], risk: seed[3], status: seed[4], action: seed[5],
  receivedAt: `2026-08-${String(26 - index).padStart(2, '0')} ${String(10 + index).padStart(2, '0')}:15`,
  assignee: index % 3 === 0 ? '미배정' : `admin0${index % 4 + 1}`,
  appeal: seed[4] === '소명중' ? '판매자 소명 자료 제출 대기' : seed[5] === '복구' ? '판매자 수정 완료 후 복구' : '-',
}));

const HISTORY_SEEDS: Array<[number, string, string, string, string, string]> = [
  [8, '상품 숨김', '노출', '비노출', '가품 의심 자동 탐지', '자동 탐지 DET-2208'],
  [3, '검수 반려', '검수중', '반려', '상품 설명 및 증빙 보완 필요', '등록 검수'],
  [0, '상품 승인', '검수중', '판매중', '검수 체크리스트 충족', '등록 검수'],
  [12, '상품 삭제', '숨김', '삭제', '외부 연락처 반복 노출', '운영 모니터링'],
  [9, '상품 숨김', '판매중', '숨김', '중복 이미지 자동 탐지', '자동 탐지 DET-2184'],
  [5, '판매자 소명 접수', '검토대기', '소명중', '상품 상태 설명 보완 자료 제출', '회원 신고 RPT-9301'],
  [0, '상품 복구', '숨김', '판매중', '카테고리 수정 완료', '회원 신고 RPT-9288'],
  [6, '가격 수정', '720,000원', '690,000원', '판매자 직접 수정', '상품 수정'],
  [11, '판매 완료', '예약중', '판매완료', '구매자 구매 확정', '거래 TRD-8111'],
  [2, '카테고리 변경', '가구', '리빙 > 조명', '검수 담당자 카테고리 보정', '등록 검수'],
  [4, '상품 승인', '등록대기', '판매중', '자동 검수 통과', '자동 검수'],
  [7, '상품 정보 수정', '사용감 적음', '사용감 많음', '판매자 상품 상태 수정', '상품 수정'],
];

export const USER_PRODUCT_HISTORY: UserProductHistory[] = HISTORY_SEEDS.map((seed, index) => ({
  id: `PLOG-2608-${String(601 + index).padStart(4, '0')}`,
  occurredAt: `2026-08-${String(26 - Math.floor(index / 3)).padStart(2, '0')} ${String(15 - index % 6).padStart(2, '0')}:${String(10 + index * 3).slice(-2)}`,
  productId: SALE_PRODUCTS[seed[0]].id,
  action: seed[1], before: seed[2], after: seed[3], reason: seed[4], source: seed[5],
  actor: index % 4 === 0 ? 'SYSTEM' : `admin0${index % 4 + 1}`,
}));

export const productById = (id: string): SaleProduct | undefined => SALE_PRODUCTS.find((product) => product.id === id);
export const REVIEW_META: Record<ReviewStage, { bg: string; fg: string }> = { 등록대기:{bg:'#fff7ed',fg:'#c2410c'},검수중:{bg:'#eff6ff',fg:'#1d4ed8'},승인:{bg:'#ecfdf5',fg:'#047857'},반려:{bg:'#fef2f2',fg:'#dc2626'} };
export const MODERATION_META: Record<ModerationStatus, { bg: string; fg: string }> = { 검토대기:{bg:'#fff7ed',fg:'#c2410c'},소명중:{bg:'#f5f3ff',fg:'#6d28d9'},조치완료:{bg:'#ecfdf5',fg:'#047857'} };
