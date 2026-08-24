export type ContentStatus = '공개' | '비공개' | '임시저장' | '예약' | '삭제';
export type ReviewStatus = '승인' | '대기' | '반려' | '—';
export type ExposureStatus = '일반' | '추천' | '고정';
export type AuthorType = '회원' | '관리자';

export interface ContentItem {
  id: string;
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
  { id: 'C10284', title: '봄날의 이야기', cat: '로맨스', cats: ['현대 로맨스', '오피스', '계약연애'], author: 'user01', uid: 'U10289', ujoin: '2025.03.22', utype: '회원', status: '공개', review: '승인', expose: '추천', updated: '2026.08.13', created: '2026.08.01', views: '12,840', desc: '봄을 배경으로 한 오피스 로맨스 연재물. 매주 화·금 업데이트되는 정기 연재 콘텐츠입니다.', tint: '#fde8ef' },
  { id: 'C10283', title: '테스트 콘텐츠 - 배포 확인용', cat: '판타지', cats: ['판타지'], author: 'admin', uid: 'A0002', ujoin: '2024.01.02', utype: '관리자', status: '비공개', review: '승인', expose: '일반', updated: '2026.08.12', created: '2026.08.12', views: '0', desc: '배포 확인을 위한 내부 테스트 콘텐츠입니다. 서비스에 노출되지 않습니다.', tint: '#e6ecfb' },
  { id: 'C10281', title: '여름 특집 기획전 안내', cat: '공지', cats: ['공지', '이벤트'], author: 'admin', uid: 'A0001', ujoin: '2023.11.10', utype: '관리자', status: '예약', review: '승인', expose: '고정', updated: '2026.08.12', created: '2026.08.10', views: '—', desc: '8월 15일 00시 공개 예정인 여름 특집 기획전 안내 콘텐츠입니다.', tint: '#e8f4ec' },
  { id: 'C10278', title: '무인도에서 살아남기', cat: '액션', cats: ['액션', '서바이벌'], author: 'user77', uid: 'U11902', ujoin: '2026.01.14', utype: '회원', status: '공개', review: '대기', expose: '일반', updated: '2026.08.11', created: '2026.08.09', views: '3,182', desc: '신인 작가의 서바이벌 액션물. 검수 대기 중이며 승인 전까지 추천 영역에 노출되지 않습니다.', tint: '#fdf0e2' },
  { id: 'C10275', title: '광고성 문구가 포함된 게시물', cat: '자유', cats: ['자유'], author: 'user23', uid: 'U10877', ujoin: '2025.09.02', utype: '회원', status: '비공개', review: '반려', expose: '일반', updated: '2026.08.11', created: '2026.08.08', views: '412', desc: '외부 광고 링크가 포함되어 검수에서 반려된 콘텐츠입니다.', tint: '#fbe7e7' },
  { id: 'C10271', title: '조용한 새벽의 편지', cat: '에세이', cats: ['에세이', '일상'], author: 'user04', uid: 'U10322', ujoin: '2024.06.30', utype: '회원', status: '공개', review: '승인', expose: '일반', updated: '2026.08.10', created: '2026.07.28', views: '8,904', desc: '새벽 감성을 담은 짧은 에세이 시리즈입니다.', tint: '#eeeaf7' },
  { id: 'C10268', title: '작성 중인 초안', cat: '미분류', cats: ['미분류'], author: 'user12', uid: 'U10561', ujoin: '2025.02.11', utype: '회원', status: '임시저장', review: '—', expose: '일반', updated: '2026.08.09', created: '2026.08.09', views: '—', desc: '작성자가 저장만 하고 아직 제출하지 않은 초안입니다.', tint: '#f0f0f2' },
  { id: 'C10264', title: '도시의 밤을 걷다', cat: '스릴러', cats: ['스릴러', '미스터리'], author: 'user31', uid: 'U11004', ujoin: '2025.05.19', utype: '회원', status: '공개', review: '승인', expose: '추천', updated: '2026.08.08', created: '2026.07.20', views: '21,338', desc: '도심 미스터리 스릴러. 이번 주 추천 콘텐츠로 지정되어 있습니다.', tint: '#e3edf6' },
  { id: 'C10259', title: '고양이와 함께한 열두 달', cat: '에세이', cats: ['에세이', '반려동물'], author: 'user08', uid: 'U10410', ujoin: '2024.10.05', utype: '회원', status: '공개', review: '승인', expose: '일반', updated: '2026.08.07', created: '2026.07.12', views: '6,220', desc: '반려묘와 보낸 1년의 기록을 담은 포토 에세이입니다.', tint: '#fdf3e0' },
  { id: 'C10255', title: '삭제된 테스트 항목', cat: '자유', cats: ['자유'], author: 'user23', uid: 'U10877', ujoin: '2025.09.02', utype: '회원', status: '삭제', review: '—', expose: '일반', updated: '2026.08.06', created: '2026.07.02', views: '—', desc: '운영자가 삭제 처리한 콘텐츠입니다. 30일간 보관 후 완전 삭제됩니다.', tint: '#f0f0f2' },
  { id: 'C10250', title: '초보자를 위한 요리 안내서', cat: '라이프', cats: ['라이프', '요리'], author: 'user55', uid: 'U11488', ujoin: '2025.12.01', utype: '회원', status: '공개', review: '대기', expose: '일반', updated: '2026.08.05', created: '2026.06.29', views: '1,942', desc: '주 1회 연재되는 초보자용 요리 가이드입니다.', tint: '#eaf3e6' },
  { id: 'C10244', title: '8월 업데이트 노트', cat: '공지', cats: ['공지'], author: 'admin', uid: 'A0001', ujoin: '2023.11.10', utype: '관리자', status: '공개', review: '승인', expose: '고정', updated: '2026.08.03', created: '2026.08.01', views: '15,701', desc: '8월 서비스 업데이트 내역 안내. 목록 상단에 고정 노출됩니다.', tint: '#e8f4ec' },
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
