export type TemplateChannel = '서비스 알림' | '이메일' | 'SMS' | 'Push';
export type TemplateModule = '공통' | 'B2C' | 'C2C' | 'B2B';
export type TemplatePurpose = '서비스 안내' | '거래 안내' | '보안' | '광고 / 마케팅';
export type TemplateSendType = '자동 발송' | '수동 발송' | '둘 다';
export type TemplateStatus = '작성중' | '사용중' | '비활성';

export interface ChannelContent {
  title: string;
  body: string;
  preheader: string;
  action: string;
  actionValue: string;
}

export interface TemplateMemo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface TemplateHistory {
  at: string;
  by: string;
  action: string;
  detail: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  code: string;
  modules: TemplateModule[];
  channels: TemplateChannel[];
  purpose: TemplatePurpose;
  business: string;
  sendType: TemplateSendType;
  status: TemplateStatus;
  trigger: string;
  eventCode: string;
  contents: Partial<Record<TemplateChannel, ChannelContent>>;
  requiredVariables: string[];
  version: number;
  usage: Record<TemplateChannel, number>;
  automationCount: number;
  scheduledCount: number;
  draftCount: number;
  lastSentAt: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  memos: TemplateMemo[];
  history: TemplateHistory[];
}

export const TEMPLATE_CHANNELS: TemplateChannel[] = ['서비스 알림', '이메일', 'SMS', 'Push'];
export const TEMPLATE_MODULES: TemplateModule[] = ['공통', 'B2C', 'C2C', 'B2B'];
export const TEMPLATE_PURPOSES: TemplatePurpose[] = ['서비스 안내', '거래 안내', '보안', '광고 / 마케팅'];
export const TEMPLATE_SEND_TYPES: TemplateSendType[] = ['자동 발송', '수동 발송', '둘 다'];
export const TEMPLATE_STATUSES: TemplateStatus[] = ['작성중', '사용중', '비활성'];
export const TEMPLATE_BUSINESSES = ['회원', '주문', '배송', '결제', '클레임', '거래', '분쟁', '계약', '마케팅'];

export const VARIABLE_REGISTRY = [
  { group: '회원', label: '고객명', key: 'customerName', sample: '김지은' },
  { group: '회원', label: '회원번호', key: 'memberId', sample: 'U-00182' },
  { group: '회원', label: '이메일', key: 'email', sample: 'jieun@example.com' },
  { group: '주문', label: '주문번호', key: 'orderNumber', sample: 'O-00182' },
  { group: '주문', label: '상품명', key: 'productName', sample: '프리미엄 상품 01' },
  { group: '주문', label: '결제금액', key: 'paymentAmount', sample: '58,000원' },
  { group: '배송', label: '배송사', key: 'deliveryCompany', sample: '배송사 01' },
  { group: '배송', label: '송장번호', key: 'trackingNumber', sample: '1234567890' },
  { group: '배송', label: '배송조회 URL', key: 'trackingUrl', sample: 'https://service.test/tracking/123' },
  { group: 'C2C', label: '거래번호', key: 'tradeNumber', sample: 'TR-00428' },
  { group: 'C2C', label: '분쟁번호', key: 'disputeNumber', sample: 'DSP-00114' },
  { group: 'B2B', label: '회사명', key: 'companyName', sample: '주식회사 한빛' },
  { group: 'B2B', label: '계약번호', key: 'contractNumber', sample: 'CT-2026-0012' },
] as const;

export const TEMPLATE_STATUS_META: Record<TemplateStatus, { bg: string; fg: string }> = {
  작성중: { bg: '#f4f4f5', fg: '#52525b' },
  사용중: { bg: '#ecfdf5', fg: '#047857' },
  비활성: { bg: '#fef2f2', fg: '#b91c1c' },
};

export function emptyChannelContent(channel: TemplateChannel): ChannelContent {
  return {
    title: channel === 'SMS' ? '' : '',
    body: '',
    preheader: '',
    action: channel === '이메일' ? 'CTA 버튼' : '연결 없음',
    actionValue: '',
  };
}

export function extractVariables(template: MessageTemplate): string[] {
  const values = template.channels.flatMap((channel) => {
    const content = template.contents[channel];
    if (!content) return [];
    return `${content.title} ${content.body} ${content.preheader} ${content.actionValue}`.match(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)?.map((token) => token.replace(/[{}\s]/g, '')) ?? [];
  });
  return [...new Set(values)];
}

export function validateMessageTemplate(template: MessageTemplate, all: MessageTemplate[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!template.name.trim()) errors.push('템플릿명을 입력해 주세요.');
  if (!template.code.trim()) errors.push('템플릿 코드를 입력해 주세요.');
  else if (!/^[A-Z][A-Z0-9_]*$/.test(template.code)) errors.push('템플릿 코드는 영문 대문자, 숫자와 밑줄만 사용할 수 있습니다.');
  if (all.some((item) => item.id !== template.id && item.code === template.code)) errors.push('이미 사용 중인 템플릿 코드입니다.');
  if (template.modules.length === 0) errors.push('사용 모듈을 하나 이상 선택해 주세요.');
  if (template.channels.length === 0) errors.push('발송 채널을 하나 이상 선택해 주세요.');
  template.channels.forEach((channel) => {
    const content = template.contents[channel];
    if (!content?.body.trim()) errors.push(`${channel} 본문을 입력해 주세요.`);
    if (channel !== 'SMS' && !content?.title.trim()) errors.push(`${channel} 제목을 입력해 주세요.`);
    if (channel === 'Push' && (content?.title.length ?? 0) > 50) errors.push('Push 제목은 50자를 초과할 수 없습니다.');
    if (channel === 'SMS' && (content?.body.length ?? 0) > 90) warnings.push('SMS 본문이 90자를 초과해 LMS로 발송될 수 있습니다.');
    if (content?.action !== '연결 없음' && !content?.actionValue.trim()) warnings.push(`${channel} 클릭 Action의 연결 값을 입력해 주세요.`);
  });
  const variables = extractVariables(template);
  const allowed = new Set(VARIABLE_REGISTRY.map((item) => item.key));
  variables.filter((variable) => !allowed.has(variable as never)).forEach((variable) => errors.push(`사용할 수 없는 변수입니다: {{${variable}}}`));
  template.requiredVariables.filter((variable) => !variables.includes(variable)).forEach((variable) => warnings.push(`필수 변수 {{${variable}}}가 콘텐츠에 포함되지 않았습니다.`));
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

const content = (title: string, body: string, action = '연결 없음', actionValue = ''): ChannelContent => ({ title, body, preheader: '', action, actionValue });
const usage = (app = 0, email = 0, sms = 0, push = 0): Record<TemplateChannel, number> => ({ '서비스 알림': app, 이메일: email, SMS: sms, Push: push });
const baseHistory = (at: string, by: string, detail: string): TemplateHistory[] => [{ at, by, action: '템플릿 등록', detail }];

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'TPL-00001', name: '배송 시작 안내', code: 'DELIVERY_STARTED', modules: ['B2C', 'B2B'], channels: ['서비스 알림', 'Push', 'SMS', '이메일'], purpose: '거래 안내', business: '배송', sendType: '자동 발송', status: '사용중', trigger: '배송 상태가 출고 완료로 변경', eventCode: 'DELIVERY_STARTED',
    contents: {
      '서비스 알림': content('상품이 출고되었습니다', '{{customerName}}님의 주문 {{orderNumber}} 상품이 출고되었습니다.', '배송 상세', '{{orderNumber}}'),
      Push: content('배송이 시작됐어요', '주문하신 {{productName}} 상품이 출고되었습니다.', '배송 상세', '{{orderNumber}}'),
      SMS: content('', '{{customerName}}님, 주문 {{orderNumber}} 상품이 출고되었습니다. 배송조회: {{trackingUrl}}'),
      이메일: { ...content('주문하신 상품의 배송이 시작되었습니다', '{{customerName}}님, 주문 {{orderNumber}}의 배송 현황을 확인해 주세요.', 'CTA 버튼', '{{trackingUrl}}'), preheader: '배송 현황을 확인해 주세요.' },
    }, requiredVariables: ['customerName', 'orderNumber', 'trackingUrl'], version: 4, usage: usage(12842, 4218, 1284, 12690), automationCount: 3, scheduledCount: 128, draftCount: 4, lastSentAt: '2026-08-26 14:20', createdAt: '2026-04-12 09:00', createdBy: 'admin01', updatedAt: '2026-08-25 14:20', updatedBy: 'admin01', memos: [{ id: 'M-1', at: '2026-08-25 14:30', by: 'admin01', text: 'Push 제목은 30자 이내로 유지합니다.' }], history: [{ at: '2026-08-25 14:20', by: 'admin01', action: 'V4 적용', detail: 'Push 본문과 이메일 미리보기 문구 변경' }, ...baseHistory('2026-04-12 09:00', 'admin01', '배송 자동화 연결')],
  },
  {
    id: 'TPL-00002', name: '결제 실패 안내', code: 'PAYMENT_FAILED', modules: ['B2C', 'B2B'], channels: ['서비스 알림', 'SMS'], purpose: '거래 안내', business: '결제', sendType: '자동 발송', status: '사용중', trigger: '결제 승인 실패', eventCode: 'PAYMENT_FAILED', contents: { '서비스 알림': content('결제를 완료하지 못했습니다', '주문 {{orderNumber}}의 결제를 확인해 주세요.', '주문 상세', '{{orderNumber}}'), SMS: content('', '{{customerName}}님, 주문 {{orderNumber}} 결제가 완료되지 않았습니다.') }, requiredVariables: ['orderNumber'], version: 2, usage: usage(482, 0, 121, 0), automationCount: 2, scheduledCount: 0, draftCount: 0, lastSentAt: '2026-08-26 13:12', createdAt: '2026-05-01 10:00', createdBy: 'admin02', updatedAt: '2026-08-21 11:05', updatedBy: 'admin02', memos: [], history: baseHistory('2026-05-01 10:00', 'admin02', '결제 실패 이벤트 연결'),
  },
  {
    id: 'TPL-00003', name: '회원가입 완료', code: 'SIGNUP_COMPLETED', modules: ['공통'], channels: ['서비스 알림', '이메일'], purpose: '서비스 안내', business: '회원', sendType: '자동 발송', status: '사용중', trigger: '회원가입 완료', eventCode: 'SIGNUP_COMPLETED', contents: { '서비스 알림': content('가입을 환영합니다', '{{customerName}}님, 서비스 가입이 완료되었습니다.', '연결 없음'), 이메일: { ...content('서비스 가입을 환영합니다', '{{customerName}}님, 지금부터 다양한 서비스를 이용해 보세요.'), preheader: '가입이 정상적으로 완료되었습니다.' } }, requiredVariables: ['customerName'], version: 1, usage: usage(1842, 1804), automationCount: 1, scheduledCount: 0, draftCount: 0, lastSentAt: '2026-08-26 11:30', createdAt: '2026-03-14 09:30', createdBy: 'admin01', updatedAt: '2026-08-20 16:40', updatedBy: 'admin03', memos: [], history: baseHistory('2026-03-14 09:30', 'admin01', '공통 회원 이벤트 연결'),
  },
  {
    id: 'TPL-00004', name: '거래 분쟁 접수', code: 'DISPUTE_RECEIVED', modules: ['C2C'], channels: ['서비스 알림', 'Push'], purpose: '거래 안내', business: '분쟁', sendType: '자동 발송', status: '사용중', trigger: '분쟁 접수 완료', eventCode: 'DISPUTE_RECEIVED', contents: { '서비스 알림': content('분쟁이 접수되었습니다', '거래 {{tradeNumber}}의 분쟁 {{disputeNumber}}가 접수되었습니다.', '분쟁 상세', '{{disputeNumber}}'), Push: content('분쟁 접수 완료', '담당자 검토가 시작되면 다시 알려드리겠습니다.', '분쟁 상세', '{{disputeNumber}}') }, requiredVariables: ['tradeNumber', 'disputeNumber'], version: 3, usage: usage(328, 0, 0, 314), automationCount: 1, scheduledCount: 0, draftCount: 0, lastSentAt: '2026-08-25 18:20', createdAt: '2026-05-22 13:20', createdBy: 'admin03', updatedAt: '2026-08-18 10:10', updatedBy: 'admin03', memos: [], history: baseHistory('2026-05-22 13:20', 'admin03', 'C2C 분쟁 접수 연결'),
  },
  {
    id: 'TPL-00005', name: '계약 만료 예정', code: 'CONTRACT_EXPIRING', modules: ['B2B'], channels: ['이메일'], purpose: '거래 안내', business: '계약', sendType: '자동 발송', status: '사용중', trigger: '계약 만료 30일 전', eventCode: 'CONTRACT_EXPIRING', contents: { 이메일: { ...content('{{companyName}} 계약 만료 예정 안내', '계약 {{contractNumber}}의 만료 예정일을 확인해 주세요.', 'CTA 버튼', '{{contractNumber}}'), preheader: '계약 갱신 검토가 필요합니다.' } }, requiredVariables: ['companyName', 'contractNumber'], version: 2, usage: usage(0, 92), automationCount: 1, scheduledCount: 14, draftCount: 0, lastSentAt: '2026-08-25 09:00', createdAt: '2026-06-10 09:00', createdBy: 'admin02', updatedAt: '2026-08-12 14:00', updatedBy: 'admin02', memos: [], history: baseHistory('2026-06-10 09:00', 'admin02', 'B2B 계약 만료 자동화 연결'),
  },
  {
    id: 'TPL-00006', name: '비밀번호 변경 안내', code: 'PASSWORD_CHANGED', modules: ['공통'], channels: ['이메일', 'SMS'], purpose: '보안', business: '회원', sendType: '자동 발송', status: '사용중', trigger: '비밀번호 변경 완료', eventCode: 'PASSWORD_CHANGED', contents: { 이메일: content('비밀번호가 변경되었습니다', '{{customerName}}님의 계정 비밀번호가 변경되었습니다.'), SMS: content('', '계정 비밀번호가 변경되었습니다. 본인이 아닌 경우 고객센터로 문의해 주세요.') }, requiredVariables: ['customerName'], version: 5, usage: usage(0, 614, 602), automationCount: 1, scheduledCount: 0, draftCount: 0, lastSentAt: '2026-08-26 12:45', createdAt: '2026-02-01 09:00', createdBy: 'security-admin', updatedAt: '2026-08-10 15:30', updatedBy: 'security-admin', memos: [{ id: 'M-1', at: '2026-08-10 15:32', by: 'security-admin', text: '보안 템플릿은 보안 관리자 검토 후 수정합니다.' }], history: baseHistory('2026-02-01 09:00', 'security-admin', '보안 이벤트 연결'),
  },
  {
    id: 'TPL-00007', name: 'VIP 쿠폰 지급 안내', code: 'VIP_COUPON_GRANTED', modules: ['B2C'], channels: ['Push', '이메일'], purpose: '광고 / 마케팅', business: '마케팅', sendType: '수동 발송', status: '비활성', trigger: '-', eventCode: '-', contents: { Push: content('VIP 고객님을 위한 혜택', '새로운 쿠폰이 지급되었습니다.', 'URL', '/coupons'), 이메일: content('VIP 감사 쿠폰이 도착했습니다', '고객님을 위한 기간 한정 혜택을 확인해 주세요.', 'CTA 버튼', '/coupons') }, requiredVariables: [], version: 2, usage: usage(0, 1842, 0, 1804), automationCount: 0, scheduledCount: 0, draftCount: 0, lastSentAt: '2026-07-30 11:00', createdAt: '2026-06-20 10:00', createdBy: 'admin01', updatedAt: '2026-08-05 10:20', updatedBy: 'admin01', memos: [], history: [{ at: '2026-08-05 10:20', by: 'admin01', action: '비활성 처리', detail: '프로모션 종료' }, ...baseHistory('2026-06-20 10:00', 'admin01', 'VIP 캠페인용')],
  },
  {
    id: 'TPL-00008', name: '환불 완료 안내 초안', code: 'REFUND_COMPLETED_V2', modules: ['B2C'], channels: ['Push', 'SMS'], purpose: '거래 안내', business: '클레임', sendType: '둘 다', status: '작성중', trigger: '환불 처리 완료', eventCode: 'REFUND_COMPLETED', contents: { Push: content('환불이 완료되었습니다', '주문 {{orderNumber}}의 환불 처리가 완료되었습니다.', '주문 상세', '{{orderNumber}}'), SMS: content('', '{{customerName}}님, 주문 {{orderNumber}}의 {{paymentAmout}} 환불이 완료되었습니다.') }, requiredVariables: ['orderNumber', 'paymentAmount'], version: 1, usage: usage(), automationCount: 0, scheduledCount: 0, draftCount: 1, lastSentAt: null, createdAt: '2026-08-24 13:00', createdBy: 'admin02', updatedAt: '2026-08-26 09:10', updatedBy: 'admin02', memos: [], history: baseHistory('2026-08-24 13:00', 'admin02', '변수 검토 전 초안'),
  },
];
