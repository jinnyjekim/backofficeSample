export type ContactStatus = '사용' | '미사용';

export interface LinkedRow {
  type: string;
  no: string;
  status: string;
  statusFg: string;
  when: string;
}
export interface ContactMemo {
  when: string;
  admin: string;
  text: string;
}
export interface ContactHistory {
  when: string;
  admin: string;
  change: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  companyCode: string;
  dept: string;
  title: string;
  roles: string[];
  phone: string;
  email: string;
  officePhone: string;
  ext: string;
  status: ContactStatus;
  isPrimary: boolean;
  registered: string;
  updated: string;
  scope: string[];
  linked: { contract: number; quote: number; order: number };
  linkedRows: LinkedRow[];
  memos: ContactMemo[];
  history: ContactHistory[];
}

export const CONTACTS: Contact[] = [
  {
    id: 'CT-001284', name: '김OO', company: '회사 01', companyCode: 'C-00123', dept: '구매팀', title: '과장', roles: ['구매'],
    phone: '010-****-1234', email: 'ki***@example.com', officePhone: '02-****-1234', ext: '123', status: '사용', isPrimary: true,
    registered: '2026.08.01', updated: '2026.08.13',
    scope: ['구매 요청', '견적 확인', '계약 협의'],
    linked: { contract: 2, quote: 3, order: 5 },
    linkedRows: [
      { type: '견적', no: 'Q-00128', status: '검토중', statusFg: '#d97706', when: '08.13' },
      { type: '계약', no: 'CT-00291', status: '진행중', statusFg: '#059669', when: '08.10' },
      { type: '주문', no: 'O-00912', status: '처리중', statusFg: '#d97706', when: '08.09' },
    ],
    memos: [
      { when: '2026.08.13', admin: 'admin01', text: '향후 견적 요청은 해당 담당자에게 전달.' },
      { when: '2026.08.01', admin: 'admin02', text: '신규 구매 담당자로 등록.' },
    ],
    history: [
      { when: '2026.08.13 11:30', admin: 'admin01', change: '담당 역할 구매 → 구매, 계약' },
      { when: '2026.08.01 15:10', admin: 'admin01', change: '담당자 등록' },
    ],
  },
  {
    id: 'CT-001291', name: '이OO', company: '회사 02', companyCode: 'C-00122', dept: '재무팀', title: '대리', roles: ['회계'],
    phone: '010-****-5678', email: 'le***@example.com', officePhone: '02-****-5678', ext: '-', status: '사용', isPrimary: false,
    registered: '2026.07.28', updated: '2026.08.11',
    scope: ['세금계산서 확인', '정산 대사'],
    linked: { contract: 0, quote: 1, order: 2 },
    linkedRows: [
      { type: '견적', no: 'Q-00119', status: '승인', statusFg: '#059669', when: '08.05' },
      { type: '주문', no: 'O-00880', status: '완료', statusFg: '#71717a', when: '07.30' },
    ],
    memos: [],
    history: [{ when: '2026.07.28 10:00', admin: 'admin02', change: '담당자 등록' }],
  },
  {
    id: 'CT-001233', name: '최OO', company: '㈜한빛물산', companyCode: 'C-00119', dept: '영업팀', title: '팀장', roles: ['계약', '구매'],
    phone: '010-****-9012', email: 'ch***@example.com', officePhone: '02-****-9012', ext: '201', status: '사용', isPrimary: true,
    registered: '2026.03.12', updated: '2026.08.10',
    scope: ['계약 협의', '발주 승인'],
    linked: { contract: 1, quote: 2, order: 64 },
    linkedRows: [
      { type: '계약', no: 'CT-0009', status: '만료임박', statusFg: '#d97706', when: '08.10' },
      { type: '주문', no: 'O-10190', status: '완료', statusFg: '#71717a', when: '08.10' },
    ],
    memos: [{ when: '2026.03.12', admin: 'admin01', text: '계약 갱신 시 우선 연락.' }],
    history: [{ when: '2026.03.12 09:00', admin: 'admin01', change: '담당자 등록' }],
  },
  {
    id: 'CT-001198', name: '윤OO', company: '대성유통', companyCode: 'C-00107', dept: '대표', title: '대표', roles: ['관리'],
    phone: '010-****-3344', email: 'yo***@example.com', officePhone: '031-****-3344', ext: '-', status: '미사용', isPrimary: false,
    registered: '2025.11.05', updated: '2026.07.01',
    scope: [],
    linked: { contract: 0, quote: 0, order: 22 },
    linkedRows: [{ type: '주문', no: 'O-09811', status: '완료', statusFg: '#71717a', when: '06.02' }],
    memos: [{ when: '2026.07.01', admin: 'admin03', text: '거래 중지에 따라 미사용 처리.' }],
    history: [{ when: '2026.07.01 15:40', admin: 'admin03', change: '사용 상태 사용 → 미사용' }],
  },
  {
    id: 'CT-001301', name: '조OO', company: '원일테크', companyCode: 'C-00098', dept: '구매팀', title: '과장', roles: ['구매', '정산'],
    phone: '010-****-7788', email: 'jo***@example.com', officePhone: '02-****-7788', ext: '305', status: '사용', isPrimary: true,
    registered: '2025.05.20', updated: '2026.08.05',
    scope: ['구매 요청', '정산 확인'],
    linked: { contract: 1, quote: 1, order: 95 },
    linkedRows: [
      { type: '계약', no: 'CT-0021', status: '진행중', statusFg: '#059669', when: '08.05' },
      { type: '주문', no: 'O-10201', status: '처리중', statusFg: '#d97706', when: '08.05' },
    ],
    memos: [],
    history: [{ when: '2026.08.05 10:15', admin: 'admin02', change: '주 담당자 지정' }],
  },
  {
    id: 'CT-001177', name: '남OO', company: '케이스퀘어', companyCode: 'C-00076', dept: '구매팀', title: '차장', roles: ['구매'],
    phone: '010-****-6600', email: 'na***@example.com', officePhone: '02-****-6600', ext: '112', status: '사용', isPrimary: true,
    registered: '2025.01.15', updated: '2026.08.12',
    scope: ['구매 요청', '라이선스 갱신'],
    linked: { contract: 1, quote: 0, order: 140 },
    linkedRows: [{ type: '계약', no: 'CT-0030', status: '진행중', statusFg: '#059669', when: '08.12' }],
    memos: [],
    history: [{ when: '2025.01.15 09:00', admin: 'admin03', change: '담당자 등록' }],
  },
  {
    id: 'CT-001178', name: '유OO', company: '케이스퀘어', companyCode: 'C-00076', dept: '재무팀', title: '대리', roles: ['회계'],
    phone: '010-****-6601', email: 'yu***@example.com', officePhone: '02-****-6601', ext: '113', status: '사용', isPrimary: false,
    registered: '2025.02.20', updated: '2026.08.01',
    scope: ['세금계산서 확인'],
    linked: { contract: 0, quote: 0, order: 12 },
    linkedRows: [],
    memos: [],
    history: [{ when: '2025.02.20 09:00', admin: 'admin03', change: '담당자 등록' }],
  },
  {
    id: 'CT-001340', name: '박OO', company: '정성무역', companyCode: 'C-00061', dept: '구매팀', title: '대리', roles: ['구매'],
    phone: '010-****-4321', email: '-', officePhone: '-', ext: '-', status: '사용', isPrimary: false,
    registered: '2026.08.10', updated: '2026.08.10',
    scope: [],
    linked: { contract: 0, quote: 0, order: 0 },
    linkedRows: [],
    memos: [],
    history: [{ when: '2026.08.10 16:30', admin: 'admin02', change: '담당자 등록' }],
  },
];

export const CONTACT_STATUS_META: Record<ContactStatus, { bg: string; fg: string; dot: string }> = {
  사용: { bg: '#ecfdf5', fg: '#059669', dot: '#10b981' },
  미사용: { bg: '#f4f4f5', fg: '#71717a', dot: '#a1a1aa' },
};

export interface ContactFilterDef {
  key: string;
  match?: (c: Contact) => boolean;
}

export const CONTACT_FILTERS: ContactFilterDef[] = [
  { key: '전체' },
  { key: '사용중', match: (c) => c.status === '사용' },
  { key: '미사용', match: (c) => c.status === '미사용' },
  { key: '주 담당자', match: (c) => c.isPrimary },
];
