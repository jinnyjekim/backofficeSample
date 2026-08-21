export type CompanyStatus = '거래중' | '거래대기' | '거래중지' | '거래종료';
export type CompanyGrade = 'A' | 'B' | 'C';

export interface CompanyTerms {
  method: string;
  condition: string;
  limit: number;
  used: number;
  minOrder: number;
  tax: string;
}
export interface CompanyContact {
  name: string;
  dept: string;
  title: string;
  email: string;
  phone: string;
  role: string;
  roleFg: string;
}
export interface InternalManager {
  role: string;
  name: string;
}
export interface CompanyContract {
  no: string;
  name: string;
  period: string;
  status: string;
  statusFg: string;
}
export interface CompanyOrderSummary {
  count: number;
  total: number;
  last: string;
}
export interface CompanyOrder {
  no: string;
  date: string;
  amount: number;
  status: string;
  statusFg: string;
}
export interface CompanyCollection {
  billed: number;
  collected: number;
  receivable: number;
  overdue: number;
}
export interface CompanyCollectionRow {
  date: string;
  amount: number;
  status: string;
  statusFg: string;
}
export interface CompanySettlement {
  no: string;
  period: string;
  amount: number;
  status: string;
  statusFg: string;
}
export interface CompanyHistory {
  when: string;
  admin: string;
  change: string;
}
export interface CompanyMemo {
  when: string;
  admin: string;
  text: string;
}

export interface Company {
  code: string;
  name: string;
  bizNo: string;
  type: string;
  status: CompanyStatus;
  grade: CompanyGrade;
  manager: string;
  lastDeal: string;
  receivable: number;
  registered: string;
  updated: string;
  rep: string;
  bizType: string;
  upTae: string;
  jongMok: string;
  phone: string;
  email: string;
  homepage: string;
  address: string;
  issues: string[];
  terms: CompanyTerms;
  contacts: CompanyContact[];
  internalManagers: InternalManager[];
  contracts: CompanyContract[];
  orderSummary: CompanyOrderSummary;
  orders: CompanyOrder[];
  collection: CompanyCollection;
  collectionRows: CompanyCollectionRow[];
  settlements: CompanySettlement[];
  history: CompanyHistory[];
  memos: CompanyMemo[];
}

export const COMPANIES: Company[] = [
  {
    code: 'C-00123', name: '회사 01', bizNo: '***-**-***', type: '법인', status: '거래중', grade: 'A', manager: 'admin1',
    lastDeal: '08.13', receivable: 0, registered: '2026.08.01', updated: '2026.08.13', rep: '홍**', bizType: '법인', upTae: '도소매', jongMok: '전자부품',
    phone: '02-****-1234', email: 'co***@example.com', homepage: '-', address: '서울특별시 강남구 ...', issues: [],
    terms: { method: '후불', condition: '월말 마감 / 익월 15일', limit: 50000000, used: 32000000, minOrder: 500000, tax: '별도' },
    contacts: [
      { name: '김OO', dept: '구매팀', title: '과장', email: 'ki***@example.com', phone: '010-****', role: '주담당', roleFg: 'oklch(0.52 0.16 258)' },
      { name: '이OO', dept: '회계팀', title: '대리', email: 'le***@example.com', phone: '010-****', role: '일반', roleFg: '#8b8b93' },
    ],
    internalManagers: [{ role: '영업 담당', name: 'admin1' }, { role: 'CS 담당', name: 'admin2' }, { role: '정산 담당', name: 'admin3' }],
    contracts: [
      { no: 'CT-0012', name: '계약 01', period: '26.01.01~26.12.31', status: '진행중', statusFg: '#059669' },
      { no: 'CT-0017', name: '계약 02', period: '26.03.01~26.09.30', status: '진행중', statusFg: '#059669' },
    ],
    orderSummary: { count: 182, total: 128400000, last: '2026.08.13' },
    orders: [
      { no: 'O-10231', date: '08.13', amount: 2500000, status: '처리중', statusFg: '#d97706' },
      { no: 'O-10192', date: '08.08', amount: 1200000, status: '완료', statusFg: '#71717a' },
      { no: 'O-10131', date: '07.29', amount: 820000, status: '완료', statusFg: '#71717a' },
    ],
    collection: { billed: 42000000, collected: 32000000, receivable: 10000000, overdue: 0 },
    collectionRows: [{ date: '08.15', amount: 5000000, status: '예정', statusFg: '#71717a' }, { date: '08.31', amount: 3000000, status: '예정', statusFg: '#71717a' }],
    settlements: [
      { no: 'S-00192', period: '07.01~07.31', amount: 12000000, status: '지급완료', statusFg: '#059669' },
      { no: 'S-00218', period: '08.01~08.15', amount: 8200000, status: '정산대기', statusFg: '#d97706' },
    ],
    history: [
      { when: '2026.08.13 14:20', admin: 'admin01', change: '거래등급 B → A' },
      { when: '2026.08.10 11:30', admin: 'admin02', change: '신용한도 30,000,000 → 50,000,000' },
      { when: '2026.08.01 09:10', admin: 'admin01', change: '회사 등록' },
    ],
    memos: [{ when: '2026.08.13', admin: 'admin01', text: '하반기 단가 재협의 예정.' }, { when: '2026.08.01', admin: 'admin02', text: '거래 개시 승인 완료.' }],
  },
  {
    code: 'C-00122', name: '회사 02', bizNo: '***-**-***', type: '법인', status: '거래대기', grade: 'B', manager: 'admin2',
    lastDeal: '-', receivable: 1200000, registered: '2026.07.28', updated: '2026.07.28', rep: '김**', bizType: '법인', upTae: '제조', jongMok: '포장재',
    phone: '02-****-5678', email: 'bz***@example.com', homepage: '-', address: '경기도 성남시 ...', issues: ['필수 회사정보 미등록'],
    terms: { method: '선불', condition: '즉시 결제', limit: 10000000, used: 0, minOrder: 300000, tax: '포함' },
    contacts: [{ name: '박OO', dept: '구매팀', title: '대리', email: 'pa***@example.com', phone: '010-****', role: '주담당', roleFg: 'oklch(0.52 0.16 258)' }],
    internalManagers: [{ role: '영업 담당', name: 'admin2' }],
    contracts: [], orderSummary: { count: 0, total: 0, last: '-' }, orders: [],
    collection: { billed: 1200000, collected: 0, receivable: 1200000, overdue: 0 },
    collectionRows: [{ date: '08.31', amount: 1200000, status: '예정', statusFg: '#71717a' }],
    settlements: [], history: [{ when: '2026.07.28 10:00', admin: 'admin02', change: '회사 등록' }],
    memos: [],
  },
  {
    code: 'C-00119', name: '㈜한빛물산', bizNo: '***-**-***', type: '법인', status: '거래중', grade: 'A', manager: 'admin1',
    lastDeal: '08.10', receivable: 0, registered: '2026.03.12', updated: '2026.08.10', rep: '이**', bizType: '법인', upTae: '유통', jongMok: '생활용품',
    phone: '02-****-9012', email: 'hb***@example.com', homepage: 'hanbit.example.com', address: '서울특별시 종로구 ...', issues: ['계약 만료 예정'],
    terms: { method: '후불', condition: '월말 마감 / 익월 10일', limit: 30000000, used: 18000000, minOrder: 500000, tax: '별도' },
    contacts: [{ name: '최OO', dept: '영업팀', title: '팀장', email: 'ch***@example.com', phone: '010-****', role: '주담당', roleFg: 'oklch(0.52 0.16 258)' }],
    internalManagers: [{ role: '영업 담당', name: 'admin1' }],
    contracts: [{ no: 'CT-0009', name: '유통 계약', period: '25.09.01~26.08.31', status: '만료임박', statusFg: '#d97706' }],
    orderSummary: { count: 64, total: 41200000, last: '2026.08.10' },
    orders: [{ no: 'O-10190', date: '08.10', amount: 900000, status: '완료', statusFg: '#71717a' }],
    collection: { billed: 41200000, collected: 41200000, receivable: 0, overdue: 0 }, collectionRows: [],
    settlements: [{ no: 'S-00201', period: '07.16~07.31', amount: 3400000, status: '지급완료', statusFg: '#059669' }],
    history: [{ when: '2026.08.10 09:00', admin: 'admin01', change: '주문 처리' }], memos: [],
  },
  {
    code: 'C-00107', name: '대성유통', bizNo: '***-**-***', type: '개인사업자', status: '거래중지', grade: 'C', manager: 'admin3',
    lastDeal: '06.02', receivable: 3400000, registered: '2025.11.05', updated: '2026.07.01', rep: '정**', bizType: '개인사업자', upTae: '도매', jongMok: '식자재',
    phone: '031-****-3344', email: 'ds***@example.com', homepage: '-', address: '인천광역시 남동구 ...', issues: ['거래 중지', '미수금 발생'],
    terms: { method: '후불', condition: '익월 말 결제', limit: 5000000, used: 3400000, minOrder: 200000, tax: '별도' },
    contacts: [{ name: '윤OO', dept: '대표', title: '대표', email: 'yo***@example.com', phone: '010-****', role: '주담당', roleFg: 'oklch(0.52 0.16 258)' }],
    internalManagers: [{ role: '영업 담당', name: 'admin3' }],
    contracts: [], orderSummary: { count: 22, total: 9800000, last: '2026.06.02' },
    orders: [{ no: 'O-09811', date: '06.02', amount: 600000, status: '완료', statusFg: '#71717a' }],
    collection: { billed: 9800000, collected: 6400000, receivable: 3400000, overdue: 2000000 },
    collectionRows: [{ date: '07.31', amount: 2000000, status: '연체', statusFg: '#dc2626' }],
    settlements: [], history: [{ when: '2026.07.01 15:40', admin: 'admin03', change: '거래상태 거래중 → 거래중지' }],
    memos: [{ when: '2026.07.01', admin: 'admin03', text: '미수금 장기 연체로 거래 중지 처리.' }],
  },
  {
    code: 'C-00098', name: '원일테크', bizNo: '***-**-***', type: '법인', status: '거래중', grade: 'B', manager: 'admin2',
    lastDeal: '08.05', receivable: 10000000, registered: '2025.05.20', updated: '2026.08.05', rep: '서**', bizType: '법인', upTae: '제조', jongMok: '전자기기',
    phone: '02-****-7788', email: 'wt***@example.com', homepage: 'wonil.example.com', address: '대전광역시 유성구 ...', issues: ['신용한도 초과'],
    terms: { method: '후불', condition: '월말 마감 / 익월 15일', limit: 20000000, used: 22000000, minOrder: 1000000, tax: '별도' },
    contacts: [{ name: '조OO', dept: '구매팀', title: '과장', email: 'jo***@example.com', phone: '010-****', role: '주담당', roleFg: 'oklch(0.52 0.16 258)' }],
    internalManagers: [{ role: '영업 담당', name: 'admin2' }, { role: '정산 담당', name: 'admin3' }],
    contracts: [{ no: 'CT-0021', name: '공급 계약', period: '26.01.01~26.12.31', status: '진행중', statusFg: '#059669' }],
    orderSummary: { count: 95, total: 76300000, last: '2026.08.05' },
    orders: [
      { no: 'O-10201', date: '08.05', amount: 4200000, status: '처리중', statusFg: '#d97706' },
      { no: 'O-10150', date: '07.20', amount: 3100000, status: '완료', statusFg: '#71717a' },
    ],
    collection: { billed: 76300000, collected: 66300000, receivable: 10000000, overdue: 0 },
    collectionRows: [{ date: '08.20', amount: 10000000, status: '예정', statusFg: '#71717a' }],
    settlements: [{ no: 'S-00210', period: '07.16~07.31', amount: 5100000, status: '정산대기', statusFg: '#d97706' }],
    history: [{ when: '2026.08.05 10:15', admin: 'admin02', change: '신용한도 초과 경고' }], memos: [],
  },
  {
    code: 'C-00081', name: '늘푸른상사', bizNo: '***-**-***', type: '개인사업자', status: '거래종료', grade: 'C', manager: 'admin1',
    lastDeal: '02.14', receivable: 0, registered: '2024.09.01', updated: '2026.02.14', rep: '한**', bizType: '개인사업자', upTae: '소매', jongMok: '잡화',
    phone: '02-****-2211', email: 'np***@example.com', homepage: '-', address: '서울특별시 마포구 ...', issues: [],
    terms: { method: '선불', condition: '즉시 결제', limit: 5000000, used: 0, minOrder: 100000, tax: '포함' },
    contacts: [{ name: '백OO', dept: '대표', title: '대표', email: 'ba***@example.com', phone: '010-****', role: '주담당', roleFg: 'oklch(0.52 0.16 258)' }],
    internalManagers: [{ role: '영업 담당', name: 'admin1' }],
    contracts: [], orderSummary: { count: 11, total: 3200000, last: '2026.02.14' }, orders: [],
    collection: { billed: 3200000, collected: 3200000, receivable: 0, overdue: 0 }, collectionRows: [],
    settlements: [], history: [{ when: '2026.02.14 09:00', admin: 'admin01', change: '거래상태 거래중 → 거래종료' }], memos: [],
  },
  {
    code: 'C-00076', name: '케이스퀘어', bizNo: '***-**-***', type: '법인', status: '거래중', grade: 'A', manager: 'admin3',
    lastDeal: '08.12', receivable: 0, registered: '2025.01.15', updated: '2026.08.12', rep: '문**', bizType: '법인', upTae: 'IT', jongMok: '소프트웨어',
    phone: '02-****-6600', email: 'ks***@example.com', homepage: 'ksquare.example.com', address: '서울특별시 서초구 ...', issues: [],
    terms: { method: '후불', condition: '월말 마감 / 익월 10일', limit: 80000000, used: 21000000, minOrder: 1000000, tax: '별도' },
    contacts: [
      { name: '남OO', dept: '구매팀', title: '차장', email: 'na***@example.com', phone: '010-****', role: '주담당', roleFg: 'oklch(0.52 0.16 258)' },
      { name: '유OO', dept: '재무팀', title: '대리', email: 'yu***@example.com', phone: '010-****', role: '일반', roleFg: '#8b8b93' },
    ],
    internalManagers: [{ role: '영업 담당', name: 'admin3' }],
    contracts: [{ no: 'CT-0030', name: '라이선스 계약', period: '26.02.01~27.01.31', status: '진행중', statusFg: '#059669' }],
    orderSummary: { count: 140, total: 210500000, last: '2026.08.12' },
    orders: [{ no: 'O-10220', date: '08.12', amount: 5200000, status: '완료', statusFg: '#71717a' }],
    collection: { billed: 210500000, collected: 210500000, receivable: 0, overdue: 0 }, collectionRows: [],
    settlements: [{ no: 'S-00220', period: '08.01~08.15', amount: 9100000, status: '지급완료', statusFg: '#059669' }],
    history: [{ when: '2026.08.12 11:00', admin: 'admin03', change: '주문 처리' }], memos: [],
  },
  {
    code: 'C-00061', name: '정성무역', bizNo: '***-**-***', type: '법인', status: '거래대기', grade: 'B', manager: 'admin2',
    lastDeal: '-', receivable: 0, registered: '2026.08.10', updated: '2026.08.10', rep: '-', bizType: '법인', upTae: '-', jongMok: '-',
    phone: '-', email: '-', homepage: '-', address: '-', issues: ['필수 회사정보 미등록'],
    terms: { method: '-', condition: '-', limit: 0, used: 0, minOrder: 0, tax: '-' },
    contacts: [], internalManagers: [{ role: '영업 담당', name: 'admin2' }],
    contracts: [], orderSummary: { count: 0, total: 0, last: '-' }, orders: [],
    collection: { billed: 0, collected: 0, receivable: 0, overdue: 0 }, collectionRows: [],
    settlements: [], history: [{ when: '2026.08.10 16:20', admin: 'admin02', change: '회사 등록' }], memos: [],
  },
];

export const STATUS_META: Record<CompanyStatus, { bg: string; fg: string }> = {
  거래중: { bg: '#ecfdf5', fg: '#059669' },
  거래대기: { bg: '#fffbeb', fg: '#d97706' },
  거래중지: { bg: '#fef2f2', fg: '#dc2626' },
  거래종료: { bg: '#f4f4f5', fg: '#71717a' },
};

export const GRADE_META: Record<CompanyGrade, { bg: string; fg: string }> = {
  A: { bg: '#eef2ff', fg: '#4338ca' },
  B: { bg: '#eff6ff', fg: '#0369a1' },
  C: { bg: '#f4f4f5', fg: '#52525b' },
};

export const COMPANY_STATUSES: CompanyStatus[] = ['거래중', '거래대기', '거래중지', '거래종료'];
export const QUICK_FILTER_LABELS = ['전체', ...COMPANY_STATUSES] as const;

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}
