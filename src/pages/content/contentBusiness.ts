export type ContentBusinessType = 'B2C' | 'C2C' | 'B2B';
export type ContentTaxonomyScope = '공통' | ContentBusinessType;

export const CONTENT_BUSINESS_MODES: ContentBusinessType[] = ['B2C', 'C2C', 'B2B'];
export const CONTENT_TAXONOMY_SCOPES: ContentTaxonomyScope[] = ['공통', ...CONTENT_BUSINESS_MODES];

export const CONTENT_BUSINESS_META: Record<ContentBusinessType, {
  listNote: string;
  exposureNote: string;
  reviewNote: string;
}> = {
  B2C: {
    listNote: '상품·기획·프로모션 콘텐츠',
    exposureNote: '쇼핑 홈·기획전 노출',
    reviewNote: '게시 품질·브랜드 검수',
  },
  C2C: {
    listNote: '회원 작성·커뮤니티 콘텐츠',
    exposureNote: '탐색·추천·커뮤니티 노출',
    reviewNote: '운영 정책·신고 위험 검수',
  },
  B2B: {
    listNote: '거래처 공지·자료·카탈로그',
    exposureNote: '거래처 포털·권한별 노출',
    reviewNote: '문서 승인·공개 범위 검수',
  },
};
