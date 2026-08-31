import type { ContentTaxonomyScope } from './contentBusiness';

export interface Tag {
  id: string;
  scope: ContentTaxonomyScope;
  name: string;
  code: string;
  count: number;
  use: boolean;
  desc: string;
  created: string;
  updated: string;
}

export const TAGS: Tag[] = [
  { id: 'tc01', scope: '공통', name: '중요', code: 'COMMON_IMPORTANT', count: 124, use: true, desc: '서비스 전반의 중요 콘텐츠에 사용', created: '2026.04.18', updated: '2026.08.12' },
  { id: 'tc02', scope: '공통', name: '신규', code: 'COMMON_NEW', count: 88, use: true, desc: '신규 등록 콘텐츠에 사용', created: '2026.05.30', updated: '2026.08.11' },
  { id: 'tc03', scope: '공통', name: '운영 확인', code: 'COMMON_REVIEW', count: 7, use: false, desc: '운영 확인이 필요한 콘텐츠에 사용', created: '2026.07.05', updated: '2026.08.01' },
  { id: 'tb01', scope: 'B2C', name: '시즌', code: 'B2C_SEASON', count: 54, use: true, desc: '계절·시즌 기획 콘텐츠', created: '2026.06.20', updated: '2026.08.09' },
  { id: 'tb02', scope: 'B2C', name: '단독 혜택', code: 'B2C_EXCLUSIVE', count: 31, use: true, desc: '자사몰 단독 프로모션', created: '2026.06.11', updated: '2026.08.05' },
  { id: 'tb03', scope: 'B2C', name: '프리미엄', code: 'B2C_PREMIUM', count: 18, use: true, desc: '프리미엄 브랜드·상품 콘텐츠', created: '2026.07.03', updated: '2026.07.30' },
  { id: 'tu01', scope: 'C2C', name: '일상', code: 'C2C_DAILY', count: 210, use: true, desc: '회원 일상 콘텐츠', created: '2026.04.02', updated: '2026.07.28' },
  { id: 'tu02', scope: 'C2C', name: '반려동물', code: 'C2C_PET', count: 143, use: true, desc: '반려동물 관련 회원 콘텐츠', created: '2026.04.18', updated: '2026.08.12' },
  { id: 'tu03', scope: 'C2C', name: '거래 팁', code: 'C2C_TRADE_TIP', count: 52, use: true, desc: '안전 거래 정보와 회원 노하우', created: '2026.06.20', updated: '2026.08.09' },
  { id: 'tp01', scope: 'B2B', name: '가격 정책', code: 'B2B_PRICE_POLICY', count: 27, use: true, desc: '공급가와 할인 조건 안내', created: '2026.05.14', updated: '2026.08.12' },
  { id: 'tp02', scope: 'B2B', name: '발주 업무', code: 'B2B_ORDER_WORK', count: 19, use: true, desc: '발주·주문 업무 문서', created: '2026.05.02', updated: '2026.08.05' },
  { id: 'tp03', scope: 'B2B', name: '계약 문서', code: 'B2B_CONTRACT_DOC', count: 11, use: false, desc: '계약 검토와 전자서명 자료', created: '2026.03.20', updated: '2026.08.03' },
];
