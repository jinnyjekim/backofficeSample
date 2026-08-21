export type CalcStatus = '계산완료' | '검토필요' | '조정필요' | '계산대기';
export type IssueStatus = '발행대기' | '발행완료' | '발행대상아님' | '해당없음';
export type TaxType = '과세' | '면세' | '영세율' | '미확정';

export interface TaxItem {
  name: string;
  qty: number;
  unitPrice: string;
  supply: string;
  rate: string;
  vat: string;
  taxType: TaxType;
  bg: string;
  fg: string;
}

export interface Correction {
  from: string;
  to: string;
}

export interface Version {
  label: string;
  note: string;
  total: string;
}

export interface Memo {
  when: string;
  admin: string;
  text: string;
}

export interface HistoryEntry {
  when: string;
  action: string;
  by: string;
}

export interface TaxRecord {
  id: string;
  invoice: string;
  order: string;
  partner: string;
  supply: number;
  vat: number;
  taxType: TaxType;
  rate: string;
  calcStatus: CalcStatus;
  issueStatus: IssueStatus;
  txDate: string;
  items: TaxItem[];
  bizNo: string;
  rep: string;
  biz: string;
  bizType: string;
  item: string;
  taxEmail: string;
  missing: string[];
  basis: string;
  correction: Correction | null;
  adjustment: string | null;
  versions: Version[];
  memos: Memo[];
  history: HistoryEntry[];
}

export const CALC_META: Record<CalcStatus, { bg: string; fg: string }> = {
  계산완료: { bg: '#ecfdf5', fg: '#059669' },
  검토필요: { bg: '#fffbeb', fg: '#d97706' },
  조정필요: { bg: '#fef2f2', fg: '#dc2626' },
  계산대기: { bg: '#eff6ff', fg: '#2563eb' },
};

export const ISSUE_META: Record<IssueStatus, { bg: string; fg: string }> = {
  발행대기: { bg: '#fffbeb', fg: '#d97706' },
  발행완료: { bg: '#ecfdf5', fg: '#059669' },
  발행대상아님: { bg: '#f4f4f5', fg: '#71717a' },
  해당없음: { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export const FILTER_KEYS = ['전체', '계산 대기', '검토 필요', '계산 완료', '발행 대기', '조정 필요'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export const TAX_RECORDS: TaxRecord[] = [
  {
    id: 'TAX-00182', invoice: 'INV-00182', order: 'O-00582', partner: '회사 01', supply: 10000000, vat: 1000000, taxType: '과세', rate: '10%', calcStatus: '계산완료', issueStatus: '발행대기', txDate: '2026.08.19',
    items: [
      { name: '상품명 01', qty: 100, unitPrice: '50,000원', supply: '5,000,000원', rate: '10%', vat: '500,000원', taxType: '과세', bg: '#eef2ff', fg: '#4f46e5' },
      { name: '상품명 02', qty: 100, unitPrice: '50,000원', supply: '5,000,000원', rate: '10%', vat: '500,000원', taxType: '과세', bg: '#eef2ff', fg: '#4f46e5' },
    ],
    bizNo: '123-45-67890', rep: '홍OO', biz: '사업장 01', bizType: '도소매', item: '전자상거래', taxEmail: 'acc01@example.com', missing: [],
    basis: 'CT-00182 거래조건 V2 (VAT 별도 · 건별 발행)',
    correction: null, adjustment: null,
    versions: [{ label: 'V1 현재', note: '최초 계산', total: '11,000,000원' }],
    memos: [{ when: '08.19', admin: 'admin01', text: '상품02 과세 확인 완료.' }],
    history: [
      { when: '08.19 10:20', action: '청구 INV-00182 확정', by: 'system' },
      { when: '08.19 10:21', action: '세금 자동 계산 (공급가액 10,000,000 · VAT 1,000,000)', by: 'system' },
      { when: '08.19 10:30', action: '계산 확정', by: 'admin01' },
    ],
  },
  {
    id: 'TAX-00181', invoice: 'INV-00181', order: 'O-00581', partner: '회사 02', supply: 5000000, vat: 0, taxType: '면세', rate: '-', calcStatus: '계산완료', issueStatus: '발행대상아님', txDate: '2026.08.19',
    items: [{ name: '상품명 03', qty: 80, unitPrice: '62,500원', supply: '5,000,000원', rate: '-', vat: '0원', taxType: '면세', bg: '#f4f4f5', fg: '#71717a' }],
    bizNo: '234-56-78901', rep: '김OO', biz: '사업장 02', bizType: '제조', item: '식품', taxEmail: 'acc02@example.com', missing: [],
    basis: '회사 02 기본 세금조건 (면세 · 건별 발행)',
    correction: null, adjustment: null,
    versions: [{ label: 'V1 현재', note: '최초 계산', total: '5,000,000원' }],
    memos: [],
    history: [
      { when: '08.19 09:00', action: '청구 INV-00181 확정', by: 'system' },
      { when: '08.19 09:01', action: '세금 자동 계산 (면세)', by: 'system' },
      { when: '08.19 09:10', action: '계산 확정', by: 'admin02' },
    ],
  },
  {
    id: 'TAX-00170', invoice: 'INV-00170', order: 'O-00570', partner: '㈜한빛물산', supply: 0, vat: 0, taxType: '미확정', rate: '-', calcStatus: '검토필요', issueStatus: '해당없음', txDate: '2026.08.18',
    items: [{ name: '상품명 05', qty: 25, unitPrice: '60,000원', supply: '1,500,000원', rate: '미확정', vat: '-', taxType: '미확정', bg: '#fffbeb', fg: '#d97706' }],
    bizNo: '', rep: '', biz: '', bizType: '', item: '', taxEmail: '', missing: ['사업자등록번호', '대표자', '세금계산서 수신 이메일'],
    basis: '적용 가능한 계약 세금조건 없음',
    correction: null, adjustment: null,
    versions: [],
    memos: [{ when: '08.18', admin: 'admin03', text: '거래처 사업자정보 요청함.' }],
    history: [
      { when: '08.18 15:00', action: '청구 INV-00170 확정', by: 'system' },
      { when: '08.18 15:01', action: '세금 계산 보류 (사업자정보 누락)', by: 'system' },
    ],
  },
  {
    id: 'TAX-00176', invoice: 'INV-00181B', order: 'O-00581', partner: '회사 02', supply: 6363636, vat: 636364, taxType: '과세', rate: '10%', calcStatus: '조정필요', issueStatus: '발행완료', txDate: '2026.08.17',
    items: [{ name: '상품명 03', qty: 80, unitPrice: '95,000원', supply: '7,000,000원', rate: '10%', vat: '700,000원', taxType: '과세', bg: '#eef2ff', fg: '#4f46e5' }],
    bizNo: '234-56-78901', rep: '김OO', biz: '사업장 02', bizType: '제조', item: '식품', taxEmail: 'acc02@example.com', missing: [],
    basis: 'CT-00181 거래조건 V1 (VAT 별도)',
    correction: { from: '7,700,000원', to: '7,000,000원' },
    adjustment: '주문 일부 취소로 공급가액 -636,364원, 세액 -63,636원 조정 필요. 수정세금계산서 처리 대기중.',
    versions: [{ label: 'V2 현재', note: '취소 반영 재계산', total: '7,000,000원' }, { label: 'V1', note: '최초 계산', total: '7,700,000원' }],
    memos: [{ when: '08.20', admin: 'admin02', text: '부분 취소 반영하여 세금 재계산 필요.' }],
    history: [
      { when: '08.17 11:00', action: '청구 INV-00181B 확정', by: 'system' },
      { when: '08.17 11:10', action: '세금 자동 계산', by: 'system' },
      { when: '08.17 11:15', action: '세금계산서 발행 완료', by: 'admin02' },
      { when: '08.20 09:20', action: '주문 부분 취소로 재계산 필요 상태 전환', by: 'system' },
    ],
  },
  {
    id: 'TAX-00160', invoice: 'INV-00160', order: 'O-00560', partner: '대성유통', supply: 900000, vat: 90000, taxType: '과세', rate: '10%', calcStatus: '계산완료', issueStatus: '발행완료', txDate: '2026.05.20',
    items: [{ name: '상품명 01', qty: 30, unitPrice: '30,000원', supply: '900,000원', rate: '10%', vat: '90,000원', taxType: '과세', bg: '#eef2ff', fg: '#4f46e5' }],
    bizNo: '345-67-89012', rep: '박OO', biz: '사업장 03', bizType: '유통', item: '생활용품', taxEmail: 'acc03@example.com', missing: [],
    basis: '거래처 기본 세금조건 (과세 10%)',
    correction: null, adjustment: null,
    versions: [{ label: 'V1 현재', note: '최초 계산', total: '990,000원' }],
    memos: [],
    history: [
      { when: '05.20 09:00', action: '청구 확정 및 계산', by: 'system' },
      { when: '05.20 10:00', action: '세금계산서 발행 완료', by: 'admin01' },
    ],
  },
];
