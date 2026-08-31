import type { ContentTaxonomyScope } from './contentBusiness';

export interface Category {
  id: string;
  scope: ContentTaxonomyScope;
  name: string;
  code: string;
  parent: string | null;
  use: boolean;
  desc: string;
  count: number;
  created: string;
  updated: string;
  locked: boolean;
}

export const MAX_DEPTH = 3;

export const CATEGORIES: Category[] = [
  { id: 'com01', scope: '공통', name: '공지', code: 'COMMON_NOTICE', parent: null, use: true, desc: '모든 서비스에서 공통으로 사용하는 공지 분류', count: 18, created: '2025.11.02', updated: '2026.08.11', locked: true },
  { id: 'com02', scope: '공통', name: '고객지원', code: 'COMMON_SUPPORT', parent: null, use: true, desc: '도움말과 서비스 이용 안내에 사용하는 공통 분류', count: 27, created: '2025.11.02', updated: '2026.07.30', locked: true },
  { id: 'com021', scope: '공통', name: '서비스 이용 안내', code: 'COMMON_GUIDE', parent: 'com02', use: true, desc: '', count: 14, created: '2026.01.14', updated: '2026.06.21', locked: false },
  { id: 'b2c01', scope: 'B2C', name: '쇼핑 콘텐츠', code: 'B2C_SHOPPING', parent: null, use: true, desc: '상품 탐색과 구매 전환을 위한 콘텐츠', count: 0, created: '2025.11.02', updated: '2026.08.03', locked: true },
  { id: 'b2c011', scope: 'B2C', name: '기획전', code: 'B2C_EXHIBITION', parent: 'b2c01', use: true, desc: '테마·시즌별 상품 기획전', count: 54, created: '2025.11.02', updated: '2026.08.03', locked: true },
  { id: 'b2c012', scope: 'B2C', name: '브랜드', code: 'B2C_BRAND', parent: 'b2c01', use: true, desc: '브랜드 소개와 브랜드 스토리', count: 31, created: '2025.12.01', updated: '2026.08.05', locked: false },
  { id: 'b2c02', scope: 'B2C', name: '혜택 / 이벤트', code: 'B2C_BENEFIT', parent: null, use: true, desc: '쿠폰·할인·프로모션 안내', count: 42, created: '2026.02.18', updated: '2026.08.01', locked: false },
  { id: 'c2c01', scope: 'C2C', name: '커뮤니티', code: 'C2C_COMMUNITY', parent: null, use: true, desc: '회원이 작성하는 커뮤니티 콘텐츠', count: 0, created: '2025.11.02', updated: '2026.08.11', locked: true },
  { id: 'c2c011', scope: 'C2C', name: '에세이', code: 'C2C_ESSAY', parent: 'c2c01', use: true, desc: '회원의 경험과 일상 기록', count: 96, created: '2025.12.01', updated: '2026.07.18', locked: true },
  { id: 'c2c012', scope: 'C2C', name: '자유', code: 'C2C_FREE', parent: 'c2c01', use: true, desc: '주제 제한이 없는 회원 게시물', count: 148, created: '2025.12.01', updated: '2026.08.09', locked: true },
  { id: 'c2c02', scope: 'C2C', name: '거래 가이드', code: 'C2C_TRADE_GUIDE', parent: null, use: true, desc: '안전한 개인 거래를 위한 운영 가이드', count: 22, created: '2026.03.05', updated: '2026.07.18', locked: false },
  { id: 'b2b01', scope: 'B2B', name: '거래처 공지', code: 'B2B_PARTNER_NOTICE', parent: null, use: true, desc: '공급가·정책·일정 관련 거래처 공지', count: 24, created: '2025.11.02', updated: '2026.08.12', locked: true },
  { id: 'b2b02', scope: 'B2B', name: '업무 자료', code: 'B2B_BUSINESS_DOCS', parent: null, use: true, desc: '거래처 담당자를 위한 업무 문서와 매뉴얼', count: 0, created: '2026.01.14', updated: '2026.08.05', locked: true },
  { id: 'b2b021', scope: 'B2B', name: '발주', code: 'B2B_ORDER_GUIDE', parent: 'b2b02', use: true, desc: '발주·주문 업무 안내', count: 17, created: '2026.02.18', updated: '2026.08.05', locked: false },
  { id: 'b2b022', scope: 'B2B', name: '계약', code: 'B2B_CONTRACT_GUIDE', parent: 'b2b02', use: false, desc: '계약 검토와 전자서명 안내', count: 9, created: '2026.02.18', updated: '2026.08.03', locked: false },
];
