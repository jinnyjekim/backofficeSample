import type { ConfigScope } from '../../lib/business';

export type TypeStatus = '사용' | '비활성';
export type IntakeMode = '가능' | '관리자만' | '중지';
export type TypePriority = '높음' | '보통' | '낮음';
export type FieldMode = '필수' | '선택' | '사용 안 함' | '자동 연결';

export interface TypeHistory {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface InquiryTypeEntry {
  id: string;
  scopes?: ConfigScope[];
  name: string;
  code: string;
  depth: 1 | 2;
  parent: string | null;
  description: string;
  status: TypeStatus;
  visible: boolean;
  intake: IntakeMode;
  displayOrder: number;
  team: string | null;
  assignment: '담당팀 Queue' | '자동 순환 배정' | '담당자 고정' | '배정 안 함';
  assignee: string | null;
  priority: TypePriority;
  firstResponseHours: number | null;
  resolutionHours: number | null;
  businessHours: boolean;
  fields: Record<string, FieldMode>;
  attachmentAllowed: boolean;
  attachmentRequired: boolean;
  attachmentMaxCount: number;
  attachmentMaxMb: number;
  guide: string;
  faqs: string[];
  templates: string[];
  adminMemo: string;
  totalCount: number;
  openCount: number;
  recentCount: number;
  updatedAt: string;
  updatedBy: string;
  exposedBefore: boolean;
  history: TypeHistory[];
}

export const TYPE_TEAMS = ['일반 CS팀', '주문 CS팀', '결제 CS팀', '배송 CS팀', '정산 CS팀', '전담 CS팀'];
export const TYPE_FIELDS = ['주문번호', '상품', '결제번호', '배송번호', '환불번호', '계약번호', '거래처', '연락처', '첨부파일', '문의 상세내용'];

export function inquiryTypeScopes(item: InquiryTypeEntry): ConfigScope[] {
  if (item.scopes?.length) return item.scopes;
  if (item.code.startsWith('ACCOUNT') || item.code === 'ETC') return ['공통'];
  if (item.code.startsWith('ORDER')) return ['B2C', 'B2B'];
  if (item.code.startsWith('PAYMENT') || item.code.startsWith('DELIVERY')) return ['B2C', 'C2C', 'B2B'];
  return ['공통'];
}

const fields = (required: string[] = [], optional: string[] = [], automatic: string[] = []): Record<string, FieldMode> =>
  Object.fromEntries(TYPE_FIELDS.map((field) => [field, required.includes(field) ? '필수' : automatic.includes(field) ? '자동 연결' : optional.includes(field) ? '선택' : '사용 안 함']));

const history = (code: string, action = '문의 유형 생성'): TypeHistory[] => [
  { id: `${code}-H1`, at: '2026-07-01 09:00', actor: 'admin01', action },
];

export const INQUIRY_TYPES: InquiryTypeEntry[] = [
  { id: 'TYPE-001', name: '회원 / 계정', code: 'ACCOUNT', depth: 1, parent: null, description: '로그인, 회원정보, 탈퇴 관련 문의', status: '사용', visible: true, intake: '중지', displayOrder: 1, team: '일반 CS팀', assignment: '담당팀 Queue', assignee: null, priority: '보통', firstResponseHours: 24, resolutionHours: 72, businessHours: true, fields: fields([], ['연락처'], [],), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '계정 정보 보호를 위해 비밀번호는 입력하지 마세요.', faqs: ['비밀번호를 재설정하고 싶어요'], templates: ['계정 재설정 안내'], adminMemo: '대분류용', totalCount: 620, openCount: 8, recentCount: 54, updatedAt: '2026-08-20', updatedBy: 'admin03', exposedBefore: true, history: history('ACCOUNT') },
  { id: 'TYPE-002', name: '로그인', code: 'ACCOUNT_LOGIN', depth: 2, parent: '회원 / 계정', description: '로그인 실패 및 계정 잠금 문의', status: '사용', visible: true, intake: '가능', displayOrder: 1, team: '일반 CS팀', assignment: '자동 순환 배정', assignee: null, priority: '보통', firstResponseHours: 12, resolutionHours: 48, businessHours: true, fields: fields(['문의 상세내용'], ['첨부파일', '연락처']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 3, attachmentMaxMb: 10, guide: '오류 화면이 있다면 캡처 이미지를 첨부해 주세요.', faqs: ['로그인이 되지 않아요'], templates: ['로그인 오류 확인'], adminMemo: '', totalCount: 311, openCount: 5, recentCount: 32, updatedAt: '2026-08-21', updatedBy: 'admin03', exposedBefore: true, history: history('ACCOUNT_LOGIN') },
  { id: 'TYPE-003', name: '주문', code: 'ORDER', depth: 1, parent: null, description: '주문 확인, 변경, 취소 문의', status: '사용', visible: true, intake: '중지', displayOrder: 2, team: '주문 CS팀', assignment: '담당팀 Queue', assignee: null, priority: '보통', firstResponseHours: 12, resolutionHours: 48, businessHours: true, fields: fields(['주문번호']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '주문번호를 확인해 주세요.', faqs: ['주문 내역은 어디에서 확인하나요?'], templates: ['주문 확인 안내'], adminMemo: '대분류용', totalCount: 1290, openCount: 14, recentCount: 118, updatedAt: '2026-08-18', updatedBy: 'admin01', exposedBefore: true, history: history('ORDER') },
  { id: 'TYPE-004', name: '주문 취소', code: 'ORDER_CANCEL', depth: 2, parent: '주문', description: '출고 전 주문 취소 및 변경 문의', status: '사용', visible: true, intake: '가능', displayOrder: 1, team: '주문 CS팀', assignment: '자동 순환 배정', assignee: null, priority: '보통', firstResponseHours: 8, resolutionHours: 24, businessHours: false, fields: fields(['주문번호', '문의 상세내용'], ['상품']), attachmentAllowed: false, attachmentRequired: false, attachmentMaxCount: 0, attachmentMaxMb: 0, guide: '상품 준비가 시작된 주문은 취소가 제한될 수 있습니다.', faqs: ['주문을 취소하고 싶어요'], templates: ['주문 취소 안내'], adminMemo: '', totalCount: 708, openCount: 9, recentCount: 76, updatedAt: '2026-08-22', updatedBy: 'admin01', exposedBefore: true, history: history('ORDER_CANCEL') },
  { id: 'TYPE-005', name: '결제', code: 'PAYMENT', depth: 1, parent: null, description: '결제 오류 및 결제수단 문의', status: '사용', visible: true, intake: '중지', displayOrder: 3, team: '결제 CS팀', assignment: '담당팀 Queue', assignee: null, priority: '높음', firstResponseHours: 4, resolutionHours: 24, businessHours: false, fields: fields(['주문번호', '결제번호']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '결제 승인번호 또는 결제번호를 준비해 주세요.', faqs: ['결제가 실패했어요'], templates: ['결제 확인 안내'], adminMemo: '', totalCount: 884, openCount: 11, recentCount: 92, updatedAt: '2026-08-20', updatedBy: 'admin02', exposedBefore: true, history: history('PAYMENT') },
  { id: 'TYPE-006', name: '중복 결제', code: 'PAYMENT_DUPLICATE', depth: 2, parent: '결제', description: '동일 주문의 중복 승인 문의', status: '사용', visible: true, intake: '가능', displayOrder: 1, team: '결제 CS팀', assignment: '자동 순환 배정', assignee: null, priority: '높음', firstResponseHours: 2, resolutionHours: 12, businessHours: false, fields: fields(['주문번호', '결제번호', '문의 상세내용'], ['첨부파일']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '카드 승인 문자가 여러 건인 경우 승인 내역을 첨부해 주세요.', faqs: ['결제가 두 번 되었어요'], templates: ['중복 결제 확인'], adminMemo: 'PG 승인 조회 우선', totalCount: 196, openCount: 7, recentCount: 26, updatedAt: '2026-08-24', updatedBy: 'admin02', exposedBefore: true, history: [...history('PAYMENT_DUPLICATE'), { id: 'PAY-H2', at: '2026-08-24 11:20', actor: 'admin02', action: '첫 답변 SLA 변경', detail: '4시간 → 2시간' }] },
  { id: 'TYPE-007', name: '배송', code: 'DELIVERY', depth: 1, parent: null, description: '배송 조회, 지연, 실패 문의', status: '사용', visible: true, intake: '중지', displayOrder: 4, team: '배송 CS팀', assignment: '담당팀 Queue', assignee: null, priority: '보통', firstResponseHours: 8, resolutionHours: 48, businessHours: true, fields: fields(['주문번호'], [], ['배송번호']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '배송 조회에서 현재 상태를 먼저 확인해 주세요.', faqs: ['배송 상태는 어디에서 확인하나요?'], templates: ['배송 조회 안내'], adminMemo: '대분류용', totalCount: 4282, openCount: 18, recentCount: 142, updatedAt: '2026-08-24', updatedBy: 'admin01', exposedBefore: true, history: history('DELIVERY') },
  { id: 'TYPE-008', name: '배송 지연', code: 'DELIVERY_DELAY', depth: 2, parent: '배송', description: '예정일을 지난 배송 건 문의', status: '사용', visible: true, intake: '가능', displayOrder: 2, team: '배송 CS팀', assignment: '자동 순환 배정', assignee: null, priority: '높음', firstResponseHours: 4, resolutionHours: 24, businessHours: true, fields: fields(['주문번호', '문의 상세내용'], ['첨부파일'], ['배송번호']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '배송 예정일이 지난 경우 문의를 접수해 주세요.', faqs: ['배송 상태는 어디에서 확인하나요?', '배송이 지연되고 있습니다'], templates: ['배송 지연 안내', '배송 상태 확인 요청'], adminMemo: '배송팀 요청으로 SLA 4시간 적용', totalCount: 882, openCount: 18, recentCount: 142, updatedAt: '2026-08-24', updatedBy: 'admin01', exposedBefore: true, history: [...history('DELIVERY_DELAY'), { id: 'DEL-H2', at: '2026-08-20 09:10', actor: 'admin02', action: '기본 담당팀 변경', detail: '일반 CS팀 → 배송 CS팀' }, { id: 'DEL-H3', at: '2026-08-24 11:20', actor: 'admin01', action: '첫 답변 SLA 변경', detail: '24시간 → 4시간' }] },
  { id: 'TYPE-009', name: '배송 실패', code: 'DELIVERY_FAILED', depth: 2, parent: '배송', description: '배송 실패 및 반송 문의', status: '사용', visible: true, intake: '가능', displayOrder: 3, team: null, assignment: '배정 안 함', assignee: null, priority: '높음', firstResponseHours: null, resolutionHours: 24, businessHours: true, fields: fields(['주문번호'], ['연락처'], ['배송번호']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '', faqs: [], templates: [], adminMemo: '담당팀 협의 중', totalCount: 54, openCount: 6, recentCount: 18, updatedAt: '2026-08-23', updatedBy: 'admin01', exposedBefore: true, history: history('DELIVERY_FAILED') },
  { id: 'TYPE-010', name: '상품 파손', code: 'DELIVERY_DAMAGED', depth: 2, parent: '배송', description: '배송 중 파손 상품 문의', status: '비활성', visible: false, intake: '중지', displayOrder: 4, team: '배송 CS팀', assignment: '자동 순환 배정', assignee: null, priority: '높음', firstResponseHours: 4, resolutionHours: 24, businessHours: true, fields: fields(['주문번호', '첨부파일', '문의 상세내용'], [], ['배송번호']), attachmentAllowed: true, attachmentRequired: true, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '파손 상태를 확인할 수 있는 사진을 첨부해 주세요.', faqs: [], templates: ['파손 교환 안내'], adminMemo: '신규 분리 예정', totalCount: 0, openCount: 0, recentCount: 0, updatedAt: '2026-08-24', updatedBy: 'admin01', exposedBefore: false, history: history('DELIVERY_DAMAGED', '초안 생성') },
  { id: 'TYPE-011', name: '기타', code: 'ETC', depth: 1, parent: null, description: '분류되지 않은 일반 문의', status: '비활성', visible: false, intake: '관리자만', displayOrder: 5, team: '일반 CS팀', assignment: '담당팀 Queue', assignee: null, priority: '보통', firstResponseHours: 24, resolutionHours: 72, businessHours: true, fields: fields(['문의 상세내용'], ['첨부파일']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '', faqs: [], templates: [], adminMemo: '내부 분류용', totalCount: 432, openCount: 0, recentCount: 0, updatedAt: '2026-08-10', updatedBy: 'admin03', exposedBefore: true, history: history('ETC') },
];

export function typeErrors(item: InquiryTypeEntry, all = INQUIRY_TYPES): string[] {
  const errors: string[] = [];
  if (!item.team) errors.push('담당팀 미설정');
  if (!item.firstResponseHours) errors.push('첫 답변 SLA 없음');
  if (item.visible && item.intake === '중지' && item.depth === 2) errors.push('사용자 노출인데 접수 불가');
  if (item.parent && all.find((parent) => parent.name === item.parent)?.status === '비활성') errors.push('상위 유형 비활성');
  if (item.faqs.some((faq) => faq.includes('[비공개]'))) errors.push('연결 FAQ 비공개');
  return errors;
}

export function newInquiryType(): InquiryTypeEntry {
  return { id: `TYPE-${Date.now()}`, scopes: ['공통'], name: '', code: '', depth: 2, parent: '배송', description: '', status: '비활성', visible: false, intake: '중지', displayOrder: 99, team: null, assignment: '담당팀 Queue', assignee: null, priority: '보통', firstResponseHours: 24, resolutionHours: 72, businessHours: true, fields: fields(['문의 상세내용'], ['첨부파일']), attachmentAllowed: true, attachmentRequired: false, attachmentMaxCount: 5, attachmentMaxMb: 20, guide: '', faqs: [], templates: [], adminMemo: '', totalCount: 0, openCount: 0, recentCount: 0, updatedAt: '2026-08-24', updatedBy: 'admin01', exposedBefore: false, history: [] };
}
