import type { BusinessType } from '../../lib/business';

export type InquiryStatus = '접수' | '처리중' | '답변 완료' | '처리 완료' | '보류' | '고객 답변 대기' | '내부 확인중';
export type InquiryPriority = '높음' | '보통' | '낮음';
export type InquiryCategory = '회원 / 계정' | '주문' | '결제' | '배송' | '취소 / 환불' | '교환 / 반품' | '상품' | '정산' | '서비스 이용' | '오류 / 장애' | '신고' | '기타';
export type MessageRole = 'customer' | 'admin' | 'system';

export interface InquiryCustomer {
  id: string;
  name: string;
  type: '회원' | '거래처 관리자';
  status: '정상' | '제재' | '탈퇴';
  email: string;
  phone: string;
  joinedAt: string;
  recentInquiryCount: number;
}

export interface InquiryAttachment {
  name: string;
  size: string;
  kind: 'image' | 'pdf' | 'document' | 'log';
  scanStatus: '정상' | '검사중' | '오류';
}

export interface InquiryRelatedItem {
  type: '주문' | '결제' | '배송' | '환불' | '상품';
  id: string;
  status: string;
  detail: string;
}

export interface InquiryMessage {
  id: string;
  role: MessageRole;
  author: string;
  sentAt: string;
  body: string;
  attachments?: InquiryAttachment[];
  notificationResult?: string;
}

export interface InquiryMemo {
  id: string;
  author: string;
  createdAt: string;
  body: string;
}

export interface InquiryHistory {
  id: string;
  at: string;
  action: string;
  actor: string;
  detail?: string;
  kind: 'system' | 'admin' | 'customer';
}

export interface InquiryEntry {
  id: string;
  businessType: BusinessType;
  category: InquiryCategory;
  subcategory: string;
  title: string;
  body: string;
  customer: InquiryCustomer;
  attachments: InquiryAttachment[];
  relatedItems: InquiryRelatedItem[];
  receivedAt: string;
  dueAt: string;
  assignee: string | null;
  team: string | null;
  status: InquiryStatus;
  priority: InquiryPriority;
  reopened: boolean;
  tags: string[];
  issues: string[];
  messages: InquiryMessage[];
  replyDraft: string;
  draftSavedAt: string | null;
  internalMemos: InquiryMemo[];
  history: InquiryHistory[];
  completionReason?: string;
  satisfaction?: { score: number; comment: string };
}

const customer = (id: string, name: string, recentInquiryCount: number, type: InquiryCustomer['type'] = '회원'): InquiryCustomer => ({
  id, name, type, status: '정상', email: `${id.slice(0, 1)}***@example.com`, phone: '010-****-1234', joinedAt: '2026-01-10', recentInquiryCount,
});

const receivedMessage = (id: string, author: string, at: string, body: string): InquiryMessage => ({ id, role: 'customer', author, sentAt: at, body });
const autoMessage = (id: string, at: string): InquiryMessage => ({ id, role: 'system', author: '시스템', sentAt: at, body: '문의가 정상적으로 접수되었습니다. 담당자가 확인 후 답변드리겠습니다.', notificationResult: '서비스 알림 발송 완료' });

export const INQUIRIES: InquiryEntry[] = [
  {
    id: 'QNA-00182', businessType: 'B2C', category: '배송', subcategory: '배송 지연', title: '배송이 아직 도착하지 않았어요',
    body: '주문한 상품이 아직 배송되지 않았습니다. 배송 조회에는 배달 출발로 나오는데 현재 위치를 확인해 주세요.',
    customer: customer('user01', '김민수', 3),
    attachments: [{ name: 'delivery-status.png', size: '284 KB', kind: 'image', scanStatus: '정상' }],
    relatedItems: [
      { type: '주문', id: 'ORD-00582', status: '주문 완료', detail: '2026-08-21 · 428,000원' },
      { type: '결제', id: 'PAY-00182', status: '결제 완료', detail: '법인카드 · 428,000원' },
      { type: '배송', id: 'SHP-00182', status: '배송중', detail: '송장 1234567890 · 08.24 08:20 배달 출발' },
    ],
    receivedAt: '2026-08-24 10:20', dueAt: '2026-08-24 16:00', assignee: 'admin01', team: '배송 CS팀', status: '처리중', priority: '보통', reopened: false,
    tags: ['배송 이슈'], issues: [], replyDraft: '', draftSavedAt: null,
    messages: [receivedMessage('MSG-182-1', 'user01', '2026-08-24 10:20', '주문한 상품이 아직 배송되지 않았습니다. 배송 조회 부탁드립니다.'), autoMessage('MSG-182-2', '2026-08-24 10:21')],
    internalMemos: [{ id: 'MEMO-182-1', author: 'admin01', createdAt: '2026-08-24 10:45', body: '배송사에 현재 위치 확인 요청함.' }],
    history: [
      { id: 'H-182-1', at: '2026-08-24 10:20', action: '문의 접수', actor: 'user01', kind: 'customer' },
      { id: 'H-182-2', at: '2026-08-24 10:21', action: '접수 알림 자동 발송', actor: '시스템', kind: 'system' },
      { id: 'H-182-3', at: '2026-08-24 10:30', action: '담당자 지정', actor: 'admin01', detail: '배송 CS팀', kind: 'admin' },
      { id: 'H-182-4', at: '2026-08-24 10:32', action: '처리 시작', actor: 'admin01', kind: 'admin' },
    ],
  },
  {
    id: 'QNA-00181', businessType: 'B2B', category: '결제', subcategory: '중복 결제', title: '같은 주문이 두 번 결제됐습니다',
    body: '법인카드 승인 문자가 두 번 왔습니다. 중복 결제 여부와 취소 가능 시간을 확인해 주세요.', customer: customer('buyer02', '박서연', 1, '거래처 관리자'),
    attachments: [{ name: 'card-message.jpg', size: '412 KB', kind: 'image', scanStatus: '정상' }],
    relatedItems: [{ type: '주문', id: 'ORD-00581', status: '결제 확인중', detail: '2026-08-24 · 1,284,000원' }, { type: '결제', id: 'PAY-00181', status: '중복 승인 확인중', detail: '법인카드 · 승인 2건' }],
    receivedAt: '2026-08-24 09:45', dueAt: '2026-08-24 14:30', assignee: null, team: null, status: '접수', priority: '높음', reopened: false,
    tags: ['결제 오류'], issues: ['결제 금액 확인 필요'], replyDraft: '', draftSavedAt: null,
    messages: [receivedMessage('MSG-181-1', 'buyer02', '2026-08-24 09:45', '법인카드 승인 문자가 두 번 왔습니다.'), autoMessage('MSG-181-2', '2026-08-24 09:46')], internalMemos: [],
    history: [{ id: 'H-181-1', at: '2026-08-24 09:45', action: '문의 접수', actor: 'buyer02', kind: 'customer' }, { id: 'H-181-2', at: '2026-08-24 09:46', action: '접수 알림 자동 발송', actor: '시스템', kind: 'system' }],
  },
  {
    id: 'QNA-00180', businessType: 'B2B', category: '회원 / 계정', subcategory: '비밀번호', title: '관리자 계정 비밀번호를 재설정하고 싶어요',
    body: '회사 담당자가 변경되어 기존 관리자 계정의 비밀번호를 재설정하려고 합니다.', customer: customer('company03', '이준호', 2, '거래처 관리자'), attachments: [], relatedItems: [],
    receivedAt: '2026-08-24 08:40', dueAt: '2026-08-24 17:00', assignee: 'admin03', team: '일반 CS팀', status: '답변 완료', priority: '보통', reopened: false,
    tags: ['계정'], issues: [], replyDraft: '', draftSavedAt: null,
    messages: [receivedMessage('MSG-180-1', 'company03', '2026-08-24 08:40', '기존 관리자 계정 비밀번호 재설정 방법을 알려주세요.'), autoMessage('MSG-180-2', '2026-08-24 08:41'), { id: 'MSG-180-3', role: 'admin', author: 'admin03', sentAt: '2026-08-24 09:10', body: '관리자 인증 후 비밀번호 재설정 링크를 발송해 드렸습니다.', notificationResult: '서비스 알림 / 이메일 발송 완료' }],
    internalMemos: [], history: [{ id: 'H-180-1', at: '2026-08-24 08:40', action: '문의 접수', actor: 'company03', kind: 'customer' }, { id: 'H-180-2', at: '2026-08-24 08:50', action: '담당자 지정', actor: 'admin03', kind: 'admin' }, { id: 'H-180-3', at: '2026-08-24 09:10', action: '고객 답변 발송', actor: 'admin03', kind: 'admin' }],
  },
  {
    id: 'QNA-00179', businessType: 'C2C', category: '취소 / 환불', subcategory: '환불 지연', title: '환불 처리가 언제 완료되나요?',
    body: '지난주 취소한 주문의 카드 환불이 아직 반영되지 않았습니다.', customer: customer('shop04', '최지우', 4), attachments: [{ name: 'cancel-receipt.pdf', size: '188 KB', kind: 'pdf', scanStatus: '정상' }],
    relatedItems: [{ type: '주문', id: 'ORD-00566', status: '주문 취소', detail: '2026-08-18 · 760,000원' }, { type: '환불', id: 'RFD-00042', status: '환불 요청', detail: '카드사 처리 확인 필요' }],
    receivedAt: '2026-08-23 16:10', dueAt: '2026-08-24 13:00', assignee: 'admin02', team: '결제 CS팀', status: '내부 확인중', priority: '높음', reopened: false,
    tags: ['환불'], issues: ['카드사 확인 대기'], replyDraft: '카드사 승인 취소 상태를 확인 중입니다.', draftSavedAt: '2026-08-24 11:20',
    messages: [receivedMessage('MSG-179-1', 'shop04', '2026-08-23 16:10', '취소 주문의 카드 환불이 아직 반영되지 않았습니다.'), autoMessage('MSG-179-2', '2026-08-23 16:11')],
    internalMemos: [{ id: 'MEMO-179-1', author: 'admin02', createdAt: '2026-08-24 09:15', body: 'PG사 취소 전문 수신 여부 확인 요청.' }],
    history: [{ id: 'H-179-1', at: '2026-08-23 16:10', action: '문의 접수', actor: 'shop04', kind: 'customer' }, { id: 'H-179-2', at: '2026-08-23 16:30', action: '담당자 지정', actor: 'admin02', kind: 'admin' }, { id: 'H-179-3', at: '2026-08-24 09:15', action: '내부 확인 요청', actor: 'admin02', detail: '결제 운영팀', kind: 'admin' }, { id: 'H-179-4', at: '2026-08-24 11:20', action: '답변 임시저장', actor: 'admin02', kind: 'admin' }],
  },
  {
    id: 'QNA-00178', businessType: 'C2C', category: '교환 / 반품', subcategory: '파손 상품', title: '교환 접수 후 회수 일정이 궁금합니다',
    body: '파손 상품 교환 신청 후 기사님 연락을 받지 못했습니다.', customer: customer('market05', '정하늘', 5),
    attachments: [{ name: 'damaged-product-1.jpg', size: '1.2 MB', kind: 'image', scanStatus: '정상' }, { name: 'damaged-product-2.jpg', size: '980 KB', kind: 'image', scanStatus: '정상' }],
    relatedItems: [{ type: '주문', id: 'ORD-00542', status: '교환 접수', detail: '회수 요청 완료' }, { type: '배송', id: 'SHP-00161', status: '회수 대기', detail: '기사 배정 전' }],
    receivedAt: '2026-08-22 13:05', dueAt: '2026-08-24 17:00', assignee: 'admin01', team: '배송 CS팀', status: '처리중', priority: '보통', reopened: true,
    tags: ['고객 재문의', '상품 파손'], issues: ['최근 7일 유사 문의 2건'], replyDraft: '', draftSavedAt: null,
    messages: [receivedMessage('MSG-178-1', 'market05', '2026-08-22 13:05', '파손 상품 교환 신청을 했습니다.'), autoMessage('MSG-178-2', '2026-08-22 13:06'), { id: 'MSG-178-3', role: 'admin', author: 'admin01', sentAt: '2026-08-22 14:10', body: '교환 회수 접수를 완료했습니다. 기사님이 영업일 기준 1~2일 내 방문할 예정입니다.', notificationResult: '서비스 알림 발송 완료' }, receivedMessage('MSG-178-4', 'market05', '2026-08-24 11:15', '아직 기사님 연락이 없는데 회수 일정을 다시 확인해 주세요.')],
    internalMemos: [], history: [{ id: 'H-178-1', at: '2026-08-22 13:05', action: '문의 접수', actor: 'market05', kind: 'customer' }, { id: 'H-178-2', at: '2026-08-22 14:10', action: '고객 답변 발송', actor: 'admin01', kind: 'admin' }, { id: 'H-178-3', at: '2026-08-24 11:15', action: '고객 재문의 · 자동 재오픈', actor: 'market05', kind: 'customer' }],
  },
  {
    id: 'QNA-00177', businessType: 'B2B', category: '서비스 이용', subcategory: '견적서', title: '견적서를 PDF로 받을 수 있나요?', body: '승인된 견적서를 PDF로 내려받는 방법을 문의드립니다.',
    customer: customer('office06', '한소희', 1, '거래처 관리자'), attachments: [], relatedItems: [{ type: '주문', id: 'QOT-00321', status: '견적 승인', detail: '유효기간 2026-08-31' }],
    receivedAt: '2026-08-21 10:00', dueAt: '2026-08-22 10:00', assignee: 'admin03', team: '일반 CS팀', status: '처리 완료', priority: '낮음', reopened: false,
    tags: ['이용 안내'], issues: [], replyDraft: '', draftSavedAt: null, completionReason: '안내 완료', satisfaction: { score: 5, comment: '빠른 답변 감사합니다.' },
    messages: [receivedMessage('MSG-177-1', 'office06', '2026-08-21 10:00', '견적서를 PDF로 받을 수 있나요?'), autoMessage('MSG-177-2', '2026-08-21 10:01'), { id: 'MSG-177-3', role: 'admin', author: 'admin03', sentAt: '2026-08-21 10:35', body: '견적 상세 화면 오른쪽 상단의 PDF 다운로드 버튼을 이용해 주세요.', notificationResult: '서비스 알림 / 이메일 발송 완료' }],
    internalMemos: [], history: [{ id: 'H-177-1', at: '2026-08-21 10:00', action: '문의 접수', actor: 'office06', kind: 'customer' }, { id: 'H-177-2', at: '2026-08-21 10:35', action: '고객 답변 발송', actor: 'admin03', kind: 'admin' }, { id: 'H-177-3', at: '2026-08-21 10:42', action: '처리 완료', actor: 'admin03', detail: '안내 완료', kind: 'admin' }],
  },
  {
    id: 'QNA-00176', businessType: 'B2C', category: '배송', subcategory: '배송지 변경', title: '출고 전 배송지를 변경할 수 있을까요?', body: '주문서의 배송지가 이전 사무실로 되어 있습니다. 변경에 필요한 정보를 알려주세요.',
    customer: customer('store07', '오세훈', 2), attachments: [], relatedItems: [{ type: '주문', id: 'ORD-00580', status: '상품 준비중', detail: '배송지 변경 가능 여부 확인 필요' }],
    receivedAt: '2026-08-24 11:35', dueAt: '2026-08-24 18:00', assignee: 'admin02', team: '배송 CS팀', status: '고객 답변 대기', priority: '보통', reopened: false,
    tags: ['배송지'], issues: [], replyDraft: '', draftSavedAt: null,
    messages: [receivedMessage('MSG-176-1', 'store07', '2026-08-24 11:35', '출고 전 배송지를 변경하고 싶습니다.'), autoMessage('MSG-176-2', '2026-08-24 11:36'), { id: 'MSG-176-3', role: 'admin', author: 'admin02', sentAt: '2026-08-24 12:00', body: '변경할 주소와 수령인 연락처를 남겨주세요.', notificationResult: '서비스 알림 발송 완료' }],
    internalMemos: [], history: [{ id: 'H-176-1', at: '2026-08-24 11:35', action: '문의 접수', actor: 'store07', kind: 'customer' }, { id: 'H-176-2', at: '2026-08-24 12:00', action: '고객 정보 요청', actor: 'admin02', detail: '고객 답변 대기', kind: 'admin' }],
  },
  {
    id: 'QNA-00175', businessType: 'B2B', category: '정산', subcategory: '세금계산서', title: '지난달 세금계산서 발행일을 확인해 주세요', body: '7월 거래분 세금계산서가 아직 이메일로 오지 않았습니다.',
    customer: customer('corp08', '문가영', 2, '거래처 관리자'), attachments: [], relatedItems: [{ type: '결제', id: 'TAX-00118', status: '발행 완료', detail: '2026-08-10 발행 · 이메일 재전송 가능' }],
    receivedAt: '2026-08-23 14:20', dueAt: '2026-08-25 14:20', assignee: 'admin04', team: '정산 CS팀', status: '보류', priority: '낮음', reopened: false,
    tags: ['세금계산서'], issues: ['이메일 주소 확인 필요'], replyDraft: '', draftSavedAt: null,
    messages: [receivedMessage('MSG-175-1', 'corp08', '2026-08-23 14:20', '7월 세금계산서 발행일을 확인해 주세요.'), autoMessage('MSG-175-2', '2026-08-23 14:21')],
    internalMemos: [{ id: 'MEMO-175-1', author: 'admin04', createdAt: '2026-08-24 09:30', body: '사업자 정보의 수신 이메일 확인 요청.' }],
    history: [{ id: 'H-175-1', at: '2026-08-23 14:20', action: '문의 접수', actor: 'corp08', kind: 'customer' }, { id: 'H-175-2', at: '2026-08-24 09:30', action: '문의 보류', actor: 'admin04', detail: '내부 확인 필요', kind: 'admin' }],
  },
];

export const INQUIRY_CATEGORIES: InquiryCategory[] = ['회원 / 계정', '주문', '결제', '배송', '취소 / 환불', '교환 / 반품', '상품', '정산', '서비스 이용', '오류 / 장애', '신고', '기타'];
export const INQUIRY_STATUSES: InquiryStatus[] = ['접수', '처리중', '답변 완료', '처리 완료', '보류', '고객 답변 대기', '내부 확인중'];
export const INQUIRY_MANAGERS = ['admin01', 'admin02', 'admin03', 'admin04'];
export const INQUIRY_PRIORITIES: InquiryPriority[] = ['높음', '보통', '낮음'];

export const STATUS_META: Record<InquiryStatus, { bg: string; fg: string }> = {
  접수: { bg: '#fff7ed', fg: '#c2410c' }, 처리중: { bg: '#eff6ff', fg: '#2563eb' }, '답변 완료': { bg: '#ecfdf5', fg: '#047857' },
  '처리 완료': { bg: '#f4f4f5', fg: '#71717a' }, 보류: { bg: '#fefce8', fg: '#a16207' }, '고객 답변 대기': { bg: '#f5f3ff', fg: '#7c3aed' }, '내부 확인중': { bg: '#fdf2f8', fg: '#be185d' },
};

export const PRIORITY_META: Record<InquiryPriority, { bg: string; fg: string }> = {
  높음: { bg: '#fff1f2', fg: '#be123c' }, 보통: { bg: '#f4f4f5', fg: '#52525b' }, 낮음: { bg: '#f0fdf4', fg: '#15803d' },
};

export const QUICK_FILTERS = ['처리 필요', '답변 대기', '처리중', '오늘 접수', 'SLA 임박', 'SLA 초과', '처리 완료', '내 담당', '미배정', '고객 재문의'] as const;
export type InquiryQuickFilter = (typeof QUICK_FILTERS)[number];

const DEMO_NOW = new Date('2026-08-24T14:00:00').getTime();

function dateTime(value: string): number {
  return new Date(value.replace(' ', 'T')).getTime();
}

export function needsReply(inquiry: InquiryEntry): boolean {
  if (inquiry.status === '처리 완료') return false;
  const customerIndex = inquiry.messages.map((message) => message.role).lastIndexOf('customer');
  const adminIndex = inquiry.messages.map((message) => message.role).lastIndexOf('admin');
  return customerIndex > adminIndex;
}

export function getSlaInfo(inquiry: InquiryEntry): { state: 'normal' | 'imminent' | 'overdue' | 'done'; label: string; color: string } {
  if (!needsReply(inquiry)) return { state: 'done', label: '응답 완료', color: '#047857' };
  const diff = dateTime(inquiry.dueAt) - DEMO_NOW;
  if (diff < 0) {
    const minutes = Math.max(1, Math.round(Math.abs(diff) / 60000));
    return { state: 'overdue', label: minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분 초과` : `${minutes}분 초과`, color: '#dc2626' };
  }
  const minutes = Math.max(1, Math.round(diff / 60000));
  const label = minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60 ? `${minutes % 60}분 ` : ''}남음` : `${minutes}분 남음`;
  return { state: minutes <= 60 ? 'imminent' : 'normal', label, color: minutes <= 60 ? '#d97706' : '#52525b' };
}

export function inquiryIssues(inquiry: InquiryEntry): string[] {
  const issues = new Set(inquiry.issues);
  const sla = getSlaInfo(inquiry);
  if (!inquiry.assignee) issues.add('미배정');
  if (sla.state === 'imminent') issues.add('SLA 임박');
  if (sla.state === 'overdue') issues.add('SLA 초과');
  if (inquiry.reopened) issues.add('고객 재문의');
  if (inquiry.replyDraft) issues.add('답변 Draft 미발송');
  if (inquiry.status === '내부 확인중') issues.add('내부 확인 대기');
  if (inquiry.attachments.some((file) => file.scanStatus === '오류')) issues.add('첨부파일 오류');
  return [...issues];
}

export function matchesQuickFilter(inquiry: InquiryEntry, filter: InquiryQuickFilter): boolean {
  const sla = getSlaInfo(inquiry);
  if (filter === '처리 필요') return inquiry.status === '접수' || inquiry.status === '처리중' || inquiry.status === '내부 확인중' || inquiry.status === '보류';
  if (filter === '답변 대기') return needsReply(inquiry);
  if (filter === '처리중') return inquiry.status === '처리중';
  if (filter === '오늘 접수') return inquiry.receivedAt.startsWith('2026-08-24');
  if (filter === 'SLA 임박') return sla.state === 'imminent';
  if (filter === 'SLA 초과') return sla.state === 'overdue';
  if (filter === '처리 완료') return inquiry.status === '처리 완료';
  if (filter === '내 담당') return inquiry.assignee === 'admin01' && inquiry.status !== '처리 완료';
  if (filter === '미배정') return !inquiry.assignee;
  return inquiry.reopened;
}

export function fmtDateTime(value: string): string {
  return value.replace(/-/g, '.');
}

export function nextMessageId(inquiry: InquiryEntry): string {
  return `MSG-${inquiry.id.replace(/\D/g, '')}-${inquiry.messages.length + 1}`;
}
