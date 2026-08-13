import type { BanMember, LeftMember } from '../../data/members';

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

export function buildLeftView(source: LeftMember[], filter: string, query: string): RecView<LeftMember> {
  const typeCount = (t: string) => source.filter((r) => r.type === t).length;
  const filterLabels = ['전체', '직접탈퇴', '관리자처리'];
  const filters: FilterDef[] = filterLabels.map((t) => ({
    label: t,
    count: t === '전체' ? source.length : typeCount(t),
    active: filter === t,
  }));

  let list = source.filter((r) => filter === '전체' || r.type === filter);
  const rq = query.trim().toLowerCase();
  if (rq) list = list.filter((r) => (r.name + r.email + r.id).toLowerCase().includes(rq));

  return {
    title: '탈퇴 회원',
    total: '3,921명',
    placeholder: '회원번호 · 이메일 · 이름',
    filterHint: '탈퇴 유형과 기간으로 좁힙니다',
    summaryTitle: '탈퇴 현황 · 데이터 파기',
    summaryHint: '보관 기한이 지난 계정은 즉시 파기해야 합니다',
    listTitle: '탈퇴 회원 목록',
    listHint: '탈퇴 사유와 데이터 보관 상태를 함께 확인',
    views: [
      { label: '전체', count: 3921, active: true },
      { label: '최근 30일', count: 184, active: false },
      { label: '파기 대기', count: 826, active: false },
    ],
    stats: [
      { label: '전체 탈퇴', value: '3,921', unit: '명', sub: '전체 회원의 3.0%', color: '#18181b' },
      { label: '최근 30일', value: '184', unit: '명', sub: '직전 30일 대비 ▼ 6%', color: '#18181b' },
      { label: '오늘 탈퇴', value: '7', unit: '명', sub: '직접탈퇴 6 · 관리자 1', color: '#b91c1c' },
      { label: '파기 대기', value: '826', unit: '명', sub: '보관 기한 만료 122명 포함', color: '#b45309' },
    ],
    ctaLabel: '데이터 파기',
    ctaHint: '보관 기한이 지난 122명의 개인정보를 일괄 파기합니다',
    ctaButton: '122명 파기 실행',
    filters,
    minWidth: '980px',
    grid: '62px minmax(150px,1.4fr) 84px 116px 84px 78px minmax(140px,1.3fr) 74px',
    cols: [
      { label: '회원번호', align: 'left' },
      { label: '회원정보', align: 'left' },
      { label: '가입일', align: 'left' },
      { label: '탈퇴일', align: 'left' },
      { label: '이용기간', align: 'left' },
      { label: '유형', align: 'left' },
      { label: '탈퇴 사유', align: 'left' },
      { label: '데이터', align: 'right' },
    ],
    rows: list.map((r) => ({
      raw: r,
      cells: [
        cell(String(r.id), { color: '#8b8b93', size: '11.5px' }),
        cell(r.name + (r.rejoin ? '  ↩재가입' : ''), { color: '#18181b', weight: 600, size: '13px', sub: r.email }),
        cell(r.joined, { color: '#52525b' }),
        cell(r.left, { color: '#18181b' }),
        cell(r.dur, { color: '#52525b' }),
        cell(r.type, { pill: typePillLeft(r.type) }),
        cell(r.reason),
        cell(r.data, { align: 'right', pill: dataPill(r.data) }),
      ],
    })),
    resultLabel: '조건 결과 ' + list.length + '명',
    rangeLabel: '1–' + list.length + ' / 3,921',
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

export function buildBanView(source: BanMember[], filter: string, query: string): RecView<BanMember> {
  const catCount = (t: string) => source.filter((r) => banCategory(r.type) === t).length;
  const filterLabels = ['전체', '경고', '기능 제한', '기간 정지', '영구정지'];
  const filters: FilterDef[] = filterLabels.map((t) => ({
    label: t,
    count: t === '전체' ? source.length : catCount(t),
    active: filter === t,
  }));

  let list = source.filter((r) => filter === '전체' || banCategory(r.type) === filter);
  const rq = query.trim().toLowerCase();
  if (rq) list = list.filter((r) => (r.name + r.email + r.id).toLowerCase().includes(rq));

  return {
    title: '제재 회원',
    total: '421명',
    placeholder: '회원번호 · 닉네임 · 이메일',
    filterHint: '제재 유형과 상태는 별개입니다 — 유형은 처분, 상태는 현재 적용 여부',
    summaryTitle: '제재 현황',
    summaryHint: '오늘 처리된 건과 해제 예정 건을 먼저 확인하세요',
    listTitle: '제재 회원 목록',
    listHint: '유형 · 사유 · 기간 · 누적 횟수 · 처리자',
    views: [
      { label: '전체', count: 421, active: true },
      { label: '제재중', count: 384, active: false },
      { label: '만료·해제', count: 37, active: false },
    ],
    stats: [
      { label: '현재 제재 회원', value: '421', unit: '명', sub: '전체 회원의 0.3%', color: '#18181b' },
      { label: '영구 정지', value: '96', unit: '명', sub: '최근 30일 +11명', color: '#b91c1c' },
      { label: '기간 정지', value: '238', unit: '명', sub: '7일 내 만료 37명', color: '#b45309' },
      { label: '오늘 제재', value: '6', unit: '건', sub: '신고 처리 4 · 자동 2', color: '#18181b' },
    ],
    ctaLabel: '제재 처리',
    ctaHint: '회원을 지정해 새 제재를 적용하거나 기존 제재를 조정합니다',
    ctaButton: '제재 추가',
    filters,
    minWidth: '1010px',
    grid: '62px minmax(140px,1.3fr) 82px minmax(120px,1fr) 108px 88px 66px 54px 66px',
    cols: [
      { label: '회원번호', align: 'left' },
      { label: '회원정보', align: 'left' },
      { label: '제재 유형', align: 'left' },
      { label: '제재 사유', align: 'left' },
      { label: '제재 시작', align: 'left' },
      { label: '종료 예정', align: 'left' },
      { label: '상태', align: 'left' },
      { label: '누적', align: 'right' },
      { label: '처리자', align: 'right' },
    ],
    rows: list.map((r) => ({
      raw: r,
      cells: [
        cell(String(r.id), { color: '#8b8b93', size: '11.5px' }),
        cell(r.name, { color: '#18181b', weight: 600, size: '13px', sub: r.email }),
        cell(r.type, { pill: banPill(r.type) }),
        cell(r.reason, { sub: r.how }),
        cell(r.start, { color: '#18181b' }),
        cell(r.end, { color: r.end === '—' ? '#b91c1c' : '#52525b' }),
        cell(r.state, { pill: statePill(r.state) }),
        cell(r.count + '회', { align: 'right', color: r.count >= 3 ? '#b91c1c' : '#52525b', weight: r.count >= 3 ? 600 : 500 }),
        cell(r.by, { align: 'right', color: '#52525b' }),
      ],
    })),
    resultLabel: '조건 결과 ' + list.length + '명',
    rangeLabel: '1–' + list.length + ' / 421',
  };
}
