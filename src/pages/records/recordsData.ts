import type { BanMember, LeftMember, MemberBusinessType } from '../../data/members';

export interface Pill {
  bg: string;
  fg: string;
}

export interface Cell {
  text: string;
  sub?: string;
  align: 'left' | 'right';
  pill?: Pill;
  color?: string;
  weight?: number;
  size?: string;
}

export function cell(text: string, o: Partial<Cell> = {}): Cell {
  return { text, align: 'left', color: '#3f3f46', weight: 500, size: '12.5px', ...o };
}

export interface FilterDef {
  label: string;
  count: number;
  active: boolean;
}

export interface ColDef {
  label: string;
  align: 'left' | 'right';
}

export interface TabDef {
  label: string;
  count: number;
  active: boolean;
}

export interface StatDef {
  label: string;
  value: string;
  unit: string;
  sub: string;
  color: string;
}

export interface RecRow<T> {
  raw: T;
  cells: Cell[];
}

export interface RecView<T> {
  title: string;
  total: string;
  placeholder: string;
  filterHint: string;
  summaryTitle: string;
  summaryHint: string;
  listTitle: string;
  listHint: string;
  views: TabDef[];
  stats: StatDef[];
  ctaLabel: string;
  ctaHint: string;
  ctaButton: string;
  filters: FilterDef[];
  minWidth: string;
  grid: string;
  cols: ColDef[];
  rows: RecRow<T>[];
  resultLabel: string;
  rangeLabel: string;
}

const dataPill = (d: LeftMember['data']): Pill =>
  d === '보관중' ? { bg: '#fffbeb', fg: '#b45309' } : { bg: '#f4f4f5', fg: '#52525b' };

const typePillLeft = (t: LeftMember['type']): Pill =>
  t === '관리자처리' ? { bg: '#fffbeb', fg: '#b45309' } : { bg: '#f4f4f5', fg: '#52525b' };

const followUpPill = (state: LeftMember['followUp']): Pill =>
  state === '확인필요' ? { bg: '#fef2f2', fg: '#b91c1c' } : { bg: '#ecfdf5', fg: '#047857' };

const LEFT_TOTALS: Record<MemberBusinessType, number> = { B2C: 2184, C2C: 1214, B2B: 523 };
const money = (value: number) => `${new Intl.NumberFormat('ko-KR').format(value)}원`;

export function buildLeftView(source: LeftMember[], filter: string, query: string, mode: MemberBusinessType): RecView<LeftMember> {
  const modeSource = source.filter((r) => r.businessType === mode);
  const filterDefs: { label: string; test: (row: LeftMember) => boolean }[] = mode === 'B2C'
    ? [
        { label: '전체', test: () => true },
        { label: '직접탈퇴', test: (r) => r.type === '직접탈퇴' },
        { label: '관리자처리', test: (r) => r.type === '관리자처리' },
        { label: '후속 확인', test: (r) => r.followUp === '확인필요' },
      ]
    : mode === 'C2C'
      ? [
          { label: '전체', test: () => true },
          { label: '구매 이용', test: (r) => r.buyer },
          { label: '판매 이용', test: (r) => r.seller },
          { label: '후속 확인', test: (r) => r.followUp === '확인필요' },
        ]
      : [
          { label: '전체', test: () => true },
          { label: '회사 소속', test: (r) => !!r.company },
          { label: '관리자·승인자', test: (r) => r.role === '관리자' || r.role === '승인 담당자' },
          { label: '후속 확인', test: (r) => r.followUp === '확인필요' },
        ];
  const filters: FilterDef[] = filterDefs.map((def) => ({
    label: def.label,
    count: modeSource.filter(def.test).length,
    active: filter === def.label,
  }));
  const activeFilter = filterDefs.find((def) => def.label === filter) ?? filterDefs[0];
  let list = modeSource.filter(activeFilter.test);
  const rq = query.trim().toLowerCase();
  if (rq) list = list.filter((r) => `${r.name} ${r.handle} ${r.email} ${r.phone} ${r.id} ${r.company} ${r.companyCode}`.toLowerCase().includes(rq));

  const total = LEFT_TOTALS[mode];
  const common = {
    total: `${new Intl.NumberFormat('ko-KR').format(total)}명`,
    filterHint: '탈퇴 당시의 회원 유형별 정보와 후속 처리 상태를 함께 확인합니다',
    summaryTitle: `${mode} 탈퇴 현황`,
    listTitle: `${mode} 탈퇴 회원 목록`,
    ctaLabel: '데이터 파기',
    ctaButton: '파기 대상 검토',
    minWidth: '1120px',
    grid: '70px minmax(150px,1.2fr) minmax(94px,.8fr) minmax(118px,1fr) 116px 82px minmax(150px,1.2fr) minmax(150px,1.2fr) 76px',
  };

  const modeView = mode === 'B2C'
    ? {
        placeholder: '이름 · 이메일 · 회원번호 · 휴대폰',
        summaryHint: '잔여 포인트와 주문·환불 처리를 우선 확인하세요',
        listHint: '등급·구매 이력·잔여 포인트를 탈퇴 시점 기준으로 보존',
        views: [
          { label: '전체', count: 2184, active: true },
          { label: '최근 30일', count: 102, active: false },
          { label: '후속 확인', count: 37, active: false },
        ],
        stats: [
          { label: 'B2C 탈퇴 회원', value: '2,184', unit: '명', sub: '전체 탈퇴의 55.7%', color: '#18181b' },
          { label: '최근 30일', value: '102', unit: '명', sub: '직전 30일 대비 ▼ 4%', color: '#18181b' },
          { label: '잔여 포인트 확인', value: '24', unit: '명', sub: '소멸·환급 정책 확인 필요', color: '#b45309' },
          { label: '주문·환불 확인', value: '13', unit: '명', sub: '처리중 주문 기준', color: '#b91c1c' },
        ],
        ctaHint: '법정 보관 기간과 주문·결제 보존 의무를 확인한 뒤 파기합니다',
        cols: ['회원번호', '회원정보', '등급', '주문 / 누적 구매', '탈퇴일', '유형', '탈퇴 사유', '후속 처리', '데이터'],
      }
    : mode === 'C2C'
      ? {
          placeholder: '이름 · 아이디 · 상점명 · 회원번호',
          summaryHint: '진행 거래·등록 상품·판매대금 정리가 끝났는지 확인하세요',
          listHint: '구매·판매 역할과 거래 종료 상태를 탈퇴 시점 기준으로 보존',
          views: [
            { label: '전체', count: 1214, active: true },
            { label: '판매 이력', count: 486, active: false },
            { label: '정산 확인', count: 12, active: false },
          ],
          stats: [
            { label: 'C2C 탈퇴 회원', value: '1,214', unit: '명', sub: '전체 탈퇴의 31.0%', color: '#18181b' },
            { label: '최근 30일', value: '56', unit: '명', sub: '판매 이용 회원 21명', color: '#18181b' },
            { label: '거래 종료 확인', value: '18', unit: '명', sub: '분쟁·배송중 거래 포함', color: '#b45309' },
            { label: '판매대금 확인', value: '12', unit: '명', sub: '지급·보류 잔액 확인 필요', color: '#b91c1c' },
          ],
          ctaHint: '거래·분쟁·판매대금 보존 의무를 확인한 뒤 개인정보를 파기합니다',
          cols: ['회원번호', '회원정보', '이용 역할', '거래 / 등록상품', '탈퇴일', '유형', '탈퇴 사유', '후속 처리', '데이터'],
        }
      : {
          placeholder: '이름 · 이메일 · 회사명 · 회사코드',
          summaryHint: '회사 소속과 발주·승인 권한이 모두 회수되었는지 확인하세요',
          listHint: '소속 회사·부서·역할과 권한 회수 결과를 탈퇴 시점 기준으로 보존',
          views: [
            { label: '전체', count: 523, active: true },
            { label: '관리자·승인자', count: 84, active: false },
            { label: '권한 확인', count: 13, active: false },
          ],
          stats: [
            { label: 'B2B 탈퇴 계정', value: '523', unit: '명', sub: '전체 탈퇴의 13.3%', color: '#18181b' },
            { label: '최근 30일', value: '26', unit: '명', sub: '관리자 처리 18명', color: '#18181b' },
            { label: '관리자·승인자', value: '84', unit: '명', sub: '권한 회수 감사 대상', color: '#b45309' },
            { label: '후속 확인', value: '13', unit: '명', sub: '승인선·담당자 대체 필요', color: '#b91c1c' },
          ],
          ctaHint: '계약·발주 감사 이력과 회사 계정 보존 정책을 확인한 뒤 파기합니다',
          cols: ['계정번호', '계정정보', '소속 회사', '부서 / 역할', '탈퇴일', '유형', '탈퇴 사유', '후속 처리', '데이터'],
        };

  const rows = list.map((r): RecRow<LeftMember> => {
    const memberCell = cell(r.name + (r.rejoin ? '  ↩재가입' : ''), { color: '#18181b', weight: 600, size: '13px', sub: mode === 'C2C' ? `${r.handle} · ${r.email}` : r.email });
    const shared = [
      cell(String(r.id), { color: '#8b8b93', size: '11.5px' }),
      memberCell,
    ];
    const typed = mode === 'B2C'
      ? [
          cell(r.grade, { pill: r.grade === 'Gold' ? { bg: '#fffbeb', fg: '#b45309' } : { bg: '#f4f4f5', fg: '#52525b' } }),
          cell(`주문 ${r.orders}건`, { sub: `누적 ${money(r.spend)}` }),
        ]
      : mode === 'C2C'
        ? [
            cell(r.buyer && r.seller ? '구매·판매' : r.seller ? '판매' : '구매', { pill: { bg: '#eef2ff', fg: '#4338ca' } }),
            cell(`거래 ${r.tradesBuy + r.tradesSell}건`, { sub: `등록상품 ${r.listings}개` }),
          ]
        : [
            cell(r.company || '미소속', { sub: r.companyCode || '회사 연결 없음' }),
            cell(r.dept || '—', { sub: `${r.title || '—'} · ${r.role}` }),
          ];
    return {
      raw: r,
      cells: [
        ...shared,
        ...typed,
        cell(r.left, { color: '#18181b' }),
        cell(r.type, { pill: typePillLeft(r.type) }),
        cell(r.reason),
        cell(r.followUpDetail, { pill: followUpPill(r.followUp), sub: r.followUp }),
        cell(r.data, { align: 'right', pill: dataPill(r.data) }),
      ],
    };
  });

  return {
    title: '탈퇴 회원',
    ...common,
    ...modeView,
    filters,
    cols: modeView.cols.map((label, index) => ({ label, align: index === modeView.cols.length - 1 ? 'right' : 'left' })),
    rows,
    resultLabel: '조건 결과 ' + list.length + '명',
    rangeLabel: `1–${list.length} / ${new Intl.NumberFormat('ko-KR').format(total)}`,
  };
}

export function banCategory(type: string): string {
  if (type === '경고') return '경고';
  if (type === '기능 제한') return '기능 제한';
  if (type === '영구정지') return '영구정지';
  if (/정지$/.test(type)) return '기간 정지';
  return type;
}

const banPill = (t: string): Pill =>
  t === '영구정지' ? { bg: '#fef2f2', fg: '#b91c1c' } : banCategory(t) === '기간 정지' ? { bg: '#fffbeb', fg: '#b45309' } : { bg: '#f4f4f5', fg: '#52525b' };

const statePill = (state: BanMember['state']): Pill =>
  state === '제재중' ? { bg: '#fef2f2', fg: '#b91c1c' } : state === '만료' ? { bg: '#f4f4f5', fg: '#52525b' } : { bg: '#ecfdf5', fg: '#059669' };

export function buildBanView(source: BanMember[], filter: string, query: string, mode: MemberBusinessType): RecView<BanMember> {
  const modeSource = source.filter((r) => r.businessType === mode);
  const catCount = (t: string) => modeSource.filter((r) => banCategory(r.type) === t).length;
  const filterLabels = ['전체', '경고', '기능 제한', '기간 정지', '영구정지'];
  const filters: FilterDef[] = filterLabels.map((t) => ({
    label: t,
    count: t === '전체' ? modeSource.length : catCount(t),
    active: filter === t,
  }));

  let list = modeSource.filter((r) => filter === '전체' || banCategory(r.type) === filter);
  const rq = query.trim().toLowerCase();
  if (rq) list = list.filter((r) => `${r.name} ${r.handle} ${r.email} ${r.phone} ${r.id} ${r.company} ${r.companyCode}`.toLowerCase().includes(rq));

  const modeView = mode === 'B2C'
    ? {
        total: 238,
        placeholder: '이름 · 이메일 · 회원번호 · 휴대폰',
        summaryHint: '구매·결제 이용 범위와 고객 등급 영향을 함께 확인하세요',
        listHint: '고객 등급·구매 이력과 제재 범위·근거를 함께 확인',
        views: [
          { label: '전체', count: 238, active: true },
          { label: '제재중', count: 221, active: false },
          { label: '만료·해제', count: 17, active: false },
        ],
        stats: [
          { label: 'B2C 제재 회원', value: '238', unit: '명', sub: '전체 제재의 56.5%', color: '#18181b' },
          { label: '구매 제한', value: '126', unit: '명', sub: '결제·쿠폰 사용 포함', color: '#b45309' },
          { label: '영구 정지', value: '58', unit: '명', sub: '결제 부정 사용 31명', color: '#b91c1c' },
          { label: '오늘 제재', value: '3', unit: '건', sub: '신고 처리 2 · 직접 1', color: '#18181b' },
        ],
        cols: ['회원번호', '회원정보', '등급', '주문 / 누적 구매', '제재 유형', '사유 / 처리 방식', '적용 기간', '상태', '누적', '처리자'],
      }
    : mode === 'C2C'
      ? {
          total: 137,
          placeholder: '이름 · 아이디 · 상점명 · 회원번호',
          summaryHint: '거래·판매·채팅 제한과 신고·분쟁 연계를 함께 확인하세요',
          listHint: '구매·판매 역할과 거래 위험, 제재 범위·근거를 함께 확인',
          views: [
            { label: '전체', count: 137, active: true },
            { label: '제재중', count: 125, active: false },
            { label: '만료·해제', count: 12, active: false },
          ],
          stats: [
            { label: 'C2C 제재 회원', value: '137', unit: '명', sub: '전체 제재의 32.5%', color: '#18181b' },
            { label: '판매 제한', value: '93', unit: '명', sub: '상품 노출·등록 포함', color: '#b45309' },
            { label: '신고·분쟁 연계', value: '42', unit: '명', sub: '근거 건 연결 완료', color: '#b91c1c' },
            { label: '오늘 제재', value: '2', unit: '건', sub: '자동 탐지 1 · 신고 1', color: '#18181b' },
          ],
          cols: ['회원번호', '회원정보', '이용 역할', '거래 / 위험', '제재 유형', '사유 / 처리 방식', '적용 기간', '상태', '누적', '처리자'],
        }
      : {
          total: 46,
          placeholder: '이름 · 이메일 · 회사명 · 회사코드',
          summaryHint: '회사 계정의 발주·승인 권한 제한과 보안 근거를 확인하세요',
          listHint: '소속 회사·역할과 계정 권한 제재·감사 근거를 함께 확인',
          views: [
            { label: '전체', count: 46, active: true },
            { label: '제재중', count: 38, active: false },
            { label: '만료·해제', count: 8, active: false },
          ],
          stats: [
            { label: 'B2B 제재 계정', value: '46', unit: '명', sub: '전체 제재의 10.9%', color: '#18181b' },
            { label: '발주·승인 제한', value: '28', unit: '명', sub: '회사 업무 영향 확인', color: '#b45309' },
            { label: '사용 중지', value: '10', unit: '명', sub: '보안 정책 위반 7명', color: '#b91c1c' },
            { label: '오늘 제재', value: '1', unit: '건', sub: '보안 로그 연계', color: '#18181b' },
          ],
          cols: ['계정번호', '계정정보', '소속 회사', '부서 / 역할', '제재 유형', '사유 / 처리 방식', '적용 기간', '상태', '누적', '처리자'],
        };

  const rows = list.map((r): RecRow<BanMember> => {
    const typed = mode === 'B2C'
      ? [
          cell(r.grade || 'Normal', { pill: r.grade === 'Gold' ? { bg: '#fffbeb', fg: '#b45309' } : { bg: '#f4f4f5', fg: '#52525b' } }),
          cell(`주문 ${r.orders}건`, { sub: `누적 ${money(r.spend)}` }),
        ]
      : mode === 'C2C'
        ? [
            cell(r.buyer && r.seller ? '구매·판매' : r.seller ? '판매' : '구매', { pill: { bg: '#eef2ff', fg: '#4338ca' } }),
            cell(`거래 ${r.tradesBuy + r.tradesSell}건`, { sub: `신고 ${r.reports} · 분쟁 ${r.disputes}` }),
          ]
        : [
            cell(r.company || '미소속', { sub: r.companyCode || '회사 연결 없음' }),
            cell(r.dept || '—', { sub: `${r.title || '—'} · ${r.role}` }),
          ];
    return {
      raw: r,
      cells: [
        cell(String(r.id), { color: '#8b8b93', size: '11.5px' }),
        cell(r.name, { color: '#18181b', weight: 600, size: '13px', sub: mode === 'C2C' ? `${r.handle} · ${r.email}` : r.email }),
        ...typed,
        cell(r.type, { pill: banPill(r.type) }),
        cell(r.reason, { sub: r.how }),
        cell(r.start, { color: '#18181b', sub: r.end === '—' ? '종료 없음' : `~ ${r.end}` }),
        cell(r.state, { pill: statePill(r.state) }),
        cell(`${r.count}회`, { align: 'right', color: r.count >= 3 ? '#b91c1c' : '#52525b', weight: r.count >= 3 ? 600 : 500 }),
        cell(r.by, { align: 'right', color: '#52525b' }),
      ],
    };
  });

  return {
    title: '제재 회원',
    total: `${modeView.total}명`,
    placeholder: modeView.placeholder,
    filterHint: '비즈니스 유형별 회원 맥락과 제재 유형·현재 적용 상태를 함께 확인합니다',
    summaryTitle: `${mode} 제재 현황`,
    summaryHint: modeView.summaryHint,
    listTitle: `${mode} 제재 회원 목록`,
    listHint: modeView.listHint,
    views: modeView.views,
    stats: modeView.stats,
    ctaLabel: '제재 처리',
    ctaHint: `${mode} 회원을 지정해 제재를 적용하거나 기존 제재를 조정합니다`,
    ctaButton: '제재 추가',
    filters,
    minWidth: '1180px',
    grid: '70px minmax(150px,1.2fr) minmax(100px,.8fr) minmax(120px,1fr) 86px minmax(130px,1fr) minmax(128px,1fr) 68px 52px 70px',
    cols: modeView.cols.map((label, index) => ({ label, align: index >= modeView.cols.length - 2 ? 'right' : 'left' })),
    rows,
    resultLabel: '조건 결과 ' + list.length + '명',
    rangeLabel: `1–${list.length} / ${modeView.total}`,
  };
}
