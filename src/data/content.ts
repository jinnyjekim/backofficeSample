export type ContentStatus = '공개' | '비공개' | '임시저장' | '예약' | '삭제';
export type ReviewStatus = '승인' | '대기' | '반려' | '—';
export type ExposureStatus = '일반' | '추천' | '고정';
export type AuthorType = '회원' | '관리자';

export interface ContentItem {
  id: string;
  businessType: 'B2C' | 'C2C' | 'B2B';
  contentKind: string;
  audience: string;
  title: string;
  cat: string;
  cats: string[];
  author: string;
  uid: string;
  ujoin: string;
  utype: AuthorType;
  status: ContentStatus;
  review: ReviewStatus;
  expose: ExposureStatus;
  updated: string;
  created: string;
  views: string;
  desc: string;
  tint: string;
}

export const CONTENT_ITEMS: ContentItem[] = [
  { id: 'C10284', businessType: 'B2C', contentKind: '기획 콘텐츠', audience: '전체 고객', title: '여름 리빙 기획전', cat: '기획전', cats: ['기획전', '리빙', '시즌'], author: 'admin01', uid: 'A0001', ujoin: '2023.11.10', utype: '관리자', status: '공개', review: '승인', expose: '추천', updated: '2026.08.13', created: '2026.08.01', views: '12,840', desc: '여름 시즌 리빙 상품과 혜택을 소개하는 쇼핑 기획 콘텐츠입니다.', tint: '#fde8ef' },
  { id: 'C10283', businessType: 'B2B', contentKind: '거래처 공지', audience: '전체 거래처', title: '8월 공급가 변경 안내', cat: '거래처 공지', cats: ['거래처 공지', '가격 정책'], author: 'partner-admin', uid: 'A0002', ujoin: '2024.01.02', utype: '관리자', status: '비공개', review: '승인', expose: '일반', updated: '2026.08.12', created: '2026.08.12', views: '0', desc: '주요 공급 상품의 8월 단가 변경과 적용 일정을 안내합니다.', tint: '#e6ecfb' },
  { id: 'C10281', businessType: 'B2C', contentKind: '이벤트 안내', audience: '일반 회원', title: '여름 특집 기획전 안내', cat: '이벤트', cats: ['이벤트', '시즌 프로모션'], author: 'admin01', uid: 'A0001', ujoin: '2023.11.10', utype: '관리자', status: '예약', review: '승인', expose: '고정', updated: '2026.08.12', created: '2026.08.10', views: '—', desc: '8월 15일 공개 예정인 여름 특집 기획전 안내 콘텐츠입니다.', tint: '#e8f4ec' },
  { id: 'C10278', businessType: 'C2C', contentKind: '회원 게시물', audience: '전체 회원', title: '무인도에서 살아남기', cat: '액션', cats: ['액션', '서바이벌'], author: 'user77', uid: 'U11902', ujoin: '2026.01.14', utype: '회원', status: '공개', review: '대기', expose: '일반', updated: '2026.08.11', created: '2026.08.09', views: '3,182', desc: '회원 작성 서바이벌 콘텐츠로 정책 검수 대기 중입니다.', tint: '#fdf0e2' },
  { id: 'C10275', businessType: 'C2C', contentKind: '회원 게시물', audience: '전체 회원', title: '광고성 문구가 포함된 게시물', cat: '자유', cats: ['자유'], author: 'user23', uid: 'U10877', ujoin: '2025.09.02', utype: '회원', status: '비공개', review: '반려', expose: '일반', updated: '2026.08.11', created: '2026.08.08', views: '412', desc: '외부 광고 링크가 포함되어 정책 검수에서 반려된 콘텐츠입니다.', tint: '#fbe7e7' },
  { id: 'C10271', businessType: 'C2C', contentKind: '회원 에세이', audience: '전체 회원', title: '조용한 새벽의 편지', cat: '에세이', cats: ['에세이', '일상'], author: 'user04', uid: 'U10322', ujoin: '2024.06.30', utype: '회원', status: '공개', review: '승인', expose: '일반', updated: '2026.08.10', created: '2026.07.28', views: '8,904', desc: '새벽 감성을 담은 회원 작성 에세이 시리즈입니다.', tint: '#eeeaf7' },
  { id: 'C10268', businessType: 'C2C', contentKind: '회원 초안', audience: '작성자만', title: '작성 중인 초안', cat: '미분류', cats: ['미분류'], author: 'user12', uid: 'U10561', ujoin: '2025.02.11', utype: '회원', status: '임시저장', review: '—', expose: '일반', updated: '2026.08.09', created: '2026.08.09', views: '—', desc: '작성자가 저장만 하고 아직 제출하지 않은 초안입니다.', tint: '#f0f0f2' },
  { id: 'C10264', businessType: 'B2C', contentKind: '브랜드 콘텐츠', audience: 'VIP 고객', title: '프리미엄 브랜드 스토리', cat: '브랜드', cats: ['브랜드', '프리미엄'], author: 'brand-admin', uid: 'A0004', ujoin: '2024.04.18', utype: '관리자', status: '공개', review: '승인', expose: '추천', updated: '2026.08.08', created: '2026.07.20', views: '21,338', desc: 'VIP 고객을 대상으로 노출되는 프리미엄 브랜드 소개 콘텐츠입니다.', tint: '#e3edf6' },
  { id: 'C10259', businessType: 'C2C', contentKind: '회원 에세이', audience: '전체 회원', title: '고양이와 함께한 열두 달', cat: '에세이', cats: ['에세이', '반려동물'], author: 'user08', uid: 'U10410', ujoin: '2024.10.05', utype: '회원', status: '공개', review: '승인', expose: '일반', updated: '2026.08.07', created: '2026.07.12', views: '6,220', desc: '반려묘와 보낸 1년의 기록을 담은 회원 포토 에세이입니다.', tint: '#fdf3e0' },
  { id: 'C10255', businessType: 'C2C', contentKind: '회원 게시물', audience: '노출 중지', title: '삭제된 테스트 항목', cat: '자유', cats: ['자유'], author: 'user23', uid: 'U10877', ujoin: '2025.09.02', utype: '회원', status: '삭제', review: '—', expose: '일반', updated: '2026.08.06', created: '2026.07.02', views: '—', desc: '운영자가 삭제 처리한 회원 콘텐츠입니다.', tint: '#f0f0f2' },
  { id: 'C10250', businessType: 'B2B', contentKind: '업무 가이드', audience: '구매 담당자', title: '대량 발주 업무 가이드', cat: '업무 자료', cats: ['업무 자료', '발주'], author: 'b2b-admin', uid: 'A0005', ujoin: '2024.02.11', utype: '관리자', status: '공개', review: '대기', expose: '일반', updated: '2026.08.05', created: '2026.06.29', views: '1,942', desc: '거래처 구매 담당자를 위한 대량 발주 절차와 승인 기준 안내입니다.', tint: '#eaf3e6' },
  { id: 'C10244', businessType: 'B2B', contentKind: '매뉴얼', audience: '거래처 관리자', title: '전자계약 사용 매뉴얼', cat: '업무 자료', cats: ['업무 자료', '계약'], author: 'b2b-admin', uid: 'A0005', ujoin: '2024.02.11', utype: '관리자', status: '공개', review: '승인', expose: '고정', updated: '2026.08.03', created: '2026.08.01', views: '15,701', desc: '거래처 관리자를 위한 전자계약 검토·승인·서명 절차 안내입니다.', tint: '#e8f4ec' },
];

export function findContent(id: string): ContentItem | undefined {
  return CONTENT_ITEMS.find((c) => c.id === id);
}

export const STATUS_PILL: Record<ContentStatus, { bg: string; fg: string }> = {
  공개: { bg: '#ecfdf5', fg: '#059669' },
  비공개: { bg: '#f4f4f5', fg: '#52525b' },
  임시저장: { bg: '#fffbeb', fg: '#b45309' },
  예약: { bg: '#eef2ff', fg: '#4338ca' },
  삭제: { bg: '#fef2f2', fg: '#b91c1c' },
};

export const REVIEW_PILL: Record<ReviewStatus, { bg: string; fg: string }> = {
  승인: { bg: '#ecfdf5', fg: '#059669' },
  대기: { bg: '#fffbeb', fg: '#b45309' },
  반려: { bg: '#fef2f2', fg: '#b91c1c' },
  '—': { bg: 'transparent', fg: '#c4c4c8' },
};

export const EXPOSE_PILL: Record<ExposureStatus, { bg: string; fg: string }> = {
  일반: { bg: 'transparent', fg: '#71717a' },
  추천: { bg: '#eef2ff', fg: '#4338ca' },
  고정: { bg: '#18181b', fg: '#fff' },
};
