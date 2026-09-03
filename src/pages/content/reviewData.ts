import type { ContentBusinessType } from './contentBusiness';

export interface ReviewHistoryEntry {
  at: string;
  act: string;
  by: string;
  note?: string;
}

export interface ReviewDiffField {
  before: string;
  after: string;
}

export type ReviewItemStatus = '대기' | '검수중' | '승인' | '반려' | '보류';

export interface ReviewItem {
  id: string;
  businessType: ContentBusinessType;
  ctid: string;
  title: string;
  reqType: '신규 등록' | '수정' | '재검수';
  requester: string;
  reqUtype: '회원' | '관리자';
  reqAt: string;
  assignee: string;
  status: ReviewItemStatus;
  doneAt: string;
  cat: string;
  memo: string;
  rejectReason: string;
  checklist: boolean[];
  diff?: Record<string, ReviewDiffField>;
  history: ReviewHistoryEntry[];
}

export const STATUS_PILL: Record<ReviewItemStatus, { bg: string; fg: string }> = {
  대기: { bg: '#fffbeb', fg: '#b45309' },
  검수중: { bg: '#eef2ff', fg: '#4338ca' },
  승인: { bg: '#ecfdf5', fg: '#059669' },
  반려: { bg: '#fef2f2', fg: '#b91c1c' },
  보류: { bg: '#f4f4f5', fg: '#71717a' },
};

export const REJECT_REASONS = ['필수 정보 누락', '형식 오류', '품질 기준 미충족', '운영 정책 미충족', '중복 콘텐츠', '기타'];
export const CHECK_LABELS_BY_BUSINESS: Record<ContentBusinessType, string[]> = {
  B2C: ['상품·혜택 정보가 정확함', '브랜드 표현과 이미지 품질 확인', '가격·프로모션 문구 검증', '게시 위치와 기간이 적절함'],
  C2C: ['작성자·기본 정보가 정상임', '금지·제한 콘텐츠 포함 여부 확인', '광고·외부 거래 유도 여부 확인', '신고 위험과 커뮤니티 정책 충족'],
  B2B: ['문서 버전과 필수 정보가 정확함', '거래 조건·가격 정보 승인 확인', '대상 거래처와 공개 범위 확인', '첨부 자료와 법적 표현 검증'],
};

export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'rv1', businessType: 'B2C', ctid: 'C10281', title: '여름 특집 기획전 안내', reqType: '신규 등록', requester: 'admin01', reqUtype: '관리자', reqAt: '2026.08.13 13:20', assignee: '미지정', status: '대기', doneAt: '', cat: '이벤트', memo: '', rejectReason: '', checklist: [false, false, false, false], history: [] },
  { id: 'rv2', businessType: 'B2C', ctid: 'C10264', title: '프리미엄 브랜드 스토리', reqType: '수정', requester: 'brand-admin', reqUtype: '관리자', reqAt: '2026.08.11 09:40', assignee: 'admin01', status: '검수중', doneAt: '', cat: '브랜드', memo: '브랜드 가이드 최신본 대조 필요', rejectReason: '', checklist: [true, true, false, false], diff: { 제목: { before: '프리미엄 브랜드 소개', after: '프리미엄 브랜드 스토리' } }, history: [{ at: '2026.08.11 10:10', act: '검수 시작', by: 'admin01' }] },
  { id: 'rv3', businessType: 'B2C', ctid: 'C10284', title: '여름 리빙 기획전', reqType: '재검수', requester: 'admin01', reqUtype: '관리자', reqAt: '2026.08.10 11:00', assignee: 'admin02', status: '승인', doneAt: '2026.08.10 15:40', cat: '기획전', memo: '', rejectReason: '', checklist: [true, true, true, true], history: [{ at: '2026.08.10 15:40', act: '승인', by: 'admin02' }] },
  { id: 'rv4', businessType: 'C2C', ctid: 'C10278', title: '무인도에서 살아남기', reqType: '신규 등록', requester: 'user77', reqUtype: '회원', reqAt: '2026.08.13 08:12', assignee: '미지정', status: '대기', doneAt: '', cat: '액션', memo: '', rejectReason: '', checklist: [false, false, false, false], history: [] },
  { id: 'rv5', businessType: 'C2C', ctid: 'C10275', title: '광고성 문구가 포함된 게시물', reqType: '수정', requester: 'user23', reqUtype: '회원', reqAt: '2026.08.11 09:40', assignee: 'admin01', status: '반려', doneAt: '2026.08.11 16:10', cat: '자유', memo: '반복 반려 이력 있음', rejectReason: '외부 광고 링크 포함으로 정책 위반', checklist: [true, true, false, false], diff: { 제목: { before: '꿀팁 공유합니다', after: '광고성 문구가 포함된 게시물' }, 설명: { before: '일상 꿀팁을 공유하는 글입니다.', after: '외부 링크가 포함된 홍보성 글입니다.' } }, history: [{ at: '2026.08.11 16:10', act: '반려', by: 'admin01', note: '외부 광고 링크 포함으로 정책 위반' }] },
  { id: 'rv6', businessType: 'C2C', ctid: 'C10271', title: '조용한 새벽의 편지', reqType: '재검수', requester: 'user04', reqUtype: '회원', reqAt: '2026.08.09 10:00', assignee: 'admin02', status: '검수중', doneAt: '', cat: '에세이', memo: '', rejectReason: '', checklist: [true, true, false, false], history: [{ at: '2026.08.09 10:20', act: '검수 시작', by: 'admin02' }] },
  { id: 'rv7', businessType: 'B2B', ctid: 'C10283', title: '8월 공급가 변경 안내', reqType: '신규 등록', requester: 'partner-admin', reqUtype: '관리자', reqAt: '2026.08.12 12:12', assignee: '미지정', status: '대기', doneAt: '', cat: '거래처 공지', memo: '', rejectReason: '', checklist: [false, false, false, false], history: [] },
  { id: 'rv8', businessType: 'B2B', ctid: 'C10250', title: '대량 발주 업무 가이드', reqType: '신규 등록', requester: 'b2b-admin', reqUtype: '관리자', reqAt: '2026.08.05 14:00', assignee: 'admin01', status: '검수중', doneAt: '', cat: '업무 자료', memo: '구매 담당자 권한 범위 확인', rejectReason: '', checklist: [true, true, false, false], history: [{ at: '2026.08.05 15:00', act: '검수 시작', by: 'admin01' }] },
  { id: 'rv9', businessType: 'B2B', ctid: 'C10244', title: '전자계약 사용 매뉴얼', reqType: '수정', requester: 'b2b-admin', reqUtype: '관리자', reqAt: '2026.08.02 08:00', assignee: 'admin02', status: '승인', doneAt: '2026.08.02 09:10', cat: '업무 자료', memo: '', rejectReason: '', checklist: [true, true, true, true], diff: { 설명: { before: '계약 사용 안내', after: '전자계약 검토·승인·서명 절차 안내' } }, history: [{ at: '2026.08.02 09:10', act: '승인', by: 'admin02' }] },
];
