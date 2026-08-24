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

export const REJECT_REASONS = ['필수 정보 누락', '형식 오류', '품질 기준 미충족', '운영 정책 미충족', '중복 콘텐츠', '기타'];
export const CHECK_LABELS = ['기본 정보가 정상적으로 입력되어 있음', '콘텐츠 내용 확인', '정책 위반 여부 확인', '기타 운영 기준 충족'];

export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'rv1', ctid: 'C10278', title: '무인도에서 살아남기', reqType: '신규 등록', requester: 'user77', reqUtype: '회원', reqAt: '2026.08.13 13:20', assignee: '미지정', status: '대기', doneAt: '', cat: '액션', memo: '', rejectReason: '', checklist: [false, false, false, false], history: [] },
  { id: 'rv2', ctid: 'C10275', title: '광고성 문구가 포함된 게시물', reqType: '수정', requester: 'user23', reqUtype: '회원', reqAt: '2026.08.11 09:40', assignee: 'admin01', status: '반려', doneAt: '2026.08.11 16:10', cat: '자유', memo: '반복 반려 이력 있음', rejectReason: '외부 광고 링크 포함으로 정책 위반', checklist: [true, true, false, false], diff: { 제목: { before: '꿀팁 공유합니다', after: '광고성 문구가 포함된 게시물' }, 설명: { before: '일상 꿀팁을 공유하는 글입니다.', after: '외부 링크가 포함된 홍보성 글입니다.' } }, history: [{ at: '2026.08.11 16:10', act: '반려', by: 'admin01', note: '외부 광고 링크 포함으로 정책 위반' }] },
  { id: 'rv3', ctid: 'C10250', title: '초보자를 위한 요리 안내서', reqType: '신규 등록', requester: 'user55', reqUtype: '회원', reqAt: '2026.08.13 08:12', assignee: 'admin02', status: '검수중', doneAt: '', cat: '라이프', memo: '', rejectReason: '', checklist: [true, false, false, false], history: [{ at: '2026.08.13 08:30', act: '검수 시작', by: 'admin02' }] },
  { id: 'rv4', ctid: 'C10284', title: '봄날의 이야기', reqType: '수정', requester: 'user01', reqUtype: '회원', reqAt: '2026.08.10 11:00', assignee: 'admin01', status: '승인', doneAt: '2026.08.10 15:40', cat: '로맨스', memo: '', rejectReason: '', checklist: [true, true, true, true], diff: { 제목: { before: '봄날 이야기', after: '봄날의 이야기' } }, history: [{ at: '2026.08.10 15:40', act: '승인', by: 'admin01' }] },
  { id: 'rv5', ctid: 'C10271', title: '조용한 새벽의 편지', reqType: '재검수', requester: 'user04', reqUtype: '회원', reqAt: '2026.08.09 10:00', assignee: '미지정', status: '대기', doneAt: '', cat: '에세이', memo: '', rejectReason: '', checklist: [false, false, false, false], history: [{ at: '2026.08.08 12:00', act: '반려', by: 'admin02', note: '문단 구성 확인 필요' }] },
  { id: 'rv6', ctid: 'C10259', title: '고양이와 함께한 열두 달', reqType: '신규 등록', requester: 'user08', reqUtype: '회원', reqAt: '2026.08.07 09:20', assignee: '미지정', status: '대기', doneAt: '', cat: '에세이', memo: '', rejectReason: '', checklist: [false, false, false, false], history: [] },
  { id: 'rv7', ctid: 'C10264', title: '도시의 밤을 걷다', reqType: '신규 등록', requester: 'user31', reqUtype: '회원', reqAt: '2026.08.05 14:00', assignee: 'admin01', status: '승인', doneAt: '2026.08.05 17:00', cat: '스릴러', memo: '', rejectReason: '', checklist: [true, true, true, false], history: [{ at: '2026.08.05 17:00', act: '승인', by: 'admin01' }] },
  { id: 'rv8', ctid: 'C10244', title: '8월 업데이트 노트', reqType: '수정', requester: 'admin', reqUtype: '관리자', reqAt: '2026.08.02 08:00', assignee: 'admin02', status: '승인', doneAt: '2026.08.02 09:10', cat: '공지', memo: '', rejectReason: '', checklist: [true, true, true, true], diff: { 제목: { before: '8월 업데이트', after: '8월 업데이트 노트' } }, history: [{ at: '2026.08.02 09:10', act: '승인', by: 'admin02' }] },
  { id: 'rv9', ctid: 'C10283', title: '테스트 콘텐츠 - 배포 확인용', reqType: '신규 등록', requester: 'admin', reqUtype: '관리자', reqAt: '2026.08.12 12:12', assignee: '미지정', status: '대기', doneAt: '', cat: '판타지', memo: '', rejectReason: '', checklist: [false, false, false, false], history: [] },
];
