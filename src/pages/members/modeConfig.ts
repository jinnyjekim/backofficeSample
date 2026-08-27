import type { Member, MemberBusinessType } from '../../data/members';
import { formatNumber } from '../../lib/theme';

export type BusinessMode = MemberBusinessType;

export const ST: Record<string, { dot: string; fg: string; bg: string; bfg: string }> = {
  정상: { dot: 'oklch(0.65 0.15 155)', fg: '#3f3f46', bg: '#ecfdf5', bfg: '#047857' },
  휴면: { dot: '#a1a1aa', fg: '#52525b', bg: '#f4f4f5', bfg: '#52525b' },
  정지: { dot: 'oklch(0.58 0.19 25)', fg: '#b91c1c', bg: '#fef2f2', bfg: '#b91c1c' },
  탈퇴: { dot: '#d4d4d8', fg: '#a1a1aa', bg: '#fafafa', bfg: '#a1a1aa' },
  승인대기: { dot: 'oklch(0.72 0.16 70)', fg: '#b45309', bg: '#fffbeb', bfg: '#b45309' },
  사용중지: { dot: 'oklch(0.58 0.19 25)', fg: '#b91c1c', bg: '#fef2f2', bfg: '#b91c1c' },
};

export interface ChipDef {
  hint: string;
  value: string;
  test: (r: Member) => boolean;
}

export interface TabDef {
  key: string;
  label: string;
  test: (r: Member) => boolean;
}

export interface GroupDef {
  label: string;
  items: ChipDef[];
}

export interface WidgetKeyDef {
  label: string;
  color: string;
  test: (r: Member) => boolean;
  chip: { hint: string; value: string } | null;
}

export interface WidgetDef {
  title: string;
  hint: string;
  partition: boolean;
  keys: WidgetKeyDef[];
  note: (rows: Member[]) => string;
}

export interface KpiDef {
  label: string;
  value: string;
  color?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  w: string;
  req?: boolean;
  on?: boolean;
  align?: 'left' | 'right';
}

export interface ModeConfig {
  unit: string;
  unitSuffix: string;
  label: string;
  note: string;
  placeholder: string;
  searchExtra: (r: Member) => string;
  tabs: TabDef[];
  groups: GroupDef[];
  widgets: WidgetDef[];
  kpis: (all: Member[]) => KpiDef[];
  columns: ColumnDef[];
  rowMenu: string[];
  bulk: { label: string }[];
  bulkNote: string;
  tabsDetail: string[];
  badge: (r: Member) => string;
}

const N = formatNumber;

export function getModeConfig(mode: BusinessMode): ModeConfig {
  const has = (r: Member) => !!r.company;

  if (mode === 'C2C') {
    return {
      unit: '회원', unitSuffix: '명', label: 'C2C',
      note: '구매·판매 역할과 제재를 축으로 분기됩니다',
      placeholder: '이름 · 아이디 · 상점명 · 회원번호 — 무엇이든 입력',
      searchExtra: (r) => (r.shop || '') + r.handle,
      tabs: [
        { key: 'all', label: '전체', test: () => true },
        { key: 'new', label: '신규 가입', test: (r) => r.joinedDays <= 7 },
        { key: 'buy', label: '구매 이용', test: (r) => r.buyer },
        { key: 'sell', label: '판매 이용', test: (r) => r.seller },
        { key: 'trade', label: '거래중', test: (r) => (r.tradesBuy + r.tradesSell) > 0 && r.seenDays !== null && r.seenDays <= 14 },
        { key: 'ban', label: '정지·제재', test: (r) => r.status === '정지' || !!r.restriction },
      ],
      groups: [
        { label: '회원 기본', items: [
          { hint: '상태', value: '정상', test: (r) => r.status === '정상' },
          { hint: '상태', value: '정지', test: (r) => r.status === '정지' },
          { hint: '본인인증', value: '미완료', test: (r) => !r.verified },
        ] },
        { label: '이용 역할', items: [
          { hint: '역할', value: '구매만', test: (r) => r.buyer && !r.seller },
          { hint: '역할', value: '판매만', test: (r) => !r.buyer && r.seller },
          { hint: '역할', value: '구매+판매', test: (r) => r.buyer && r.seller },
        ] },
        { label: '판매', items: [
          { hint: '판매자', value: '승인', test: (r) => r.sellerStatus === '승인' },
          { hint: '판매자', value: '승인대기', test: (r) => r.sellerStatus === '승인대기' },
          { hint: '등록상품', value: '10개 이상', test: (r) => r.listings >= 10 },
        ] },
        { label: '운영', items: [
          { hint: '신고', value: '1건 이상', test: (r) => r.reports > 0 },
          { hint: '분쟁', value: '있음', test: (r) => r.disputes > 0 },
          { hint: '제재', value: '있음', test: (r) => !!r.restriction },
        ] },
      ],
      widgets: [
        { title: '이용 역할', hint: '클릭해 조건 추가', partition: true, keys: [
          { label: '구매만', color: 'oklch(0.62 0.13 258)', test: (r) => r.buyer && !r.seller, chip: { hint: '역할', value: '구매만' } },
          { label: '판매만', color: 'oklch(0.68 0.13 190)', test: (r) => !r.buyer && r.seller, chip: { hint: '역할', value: '판매만' } },
          { label: '구매+판매', color: 'oklch(0.58 0.14 300)', test: (r) => r.buyer && r.seller, chip: { hint: '역할', value: '구매+판매' } },
          { label: '미활동', color: '#d4d4d8', test: (r) => !r.buyer && !r.seller, chip: null },
        ], note: (rs) => { const c = rs.filter((r) => !r.buyer && !r.seller).length; return c ? `미활동 ${c}명 — 온보딩 대상` : '전원 구매 또는 판매 활동 있음'; } },
        { title: '거래 · 제재 지표', hint: '중복 집계', partition: false, keys: [
          { label: '최근 거래', color: 'oklch(0.65 0.15 155)', test: (r) => r.seenDays !== null && r.seenDays <= 14 && (r.tradesBuy + r.tradesSell) > 0, chip: null },
          { label: '분쟁 있음', color: 'oklch(0.72 0.16 70)', test: (r) => r.disputes > 0, chip: { hint: '분쟁', value: '있음' } },
          { label: '제재 대상', color: 'oklch(0.58 0.19 25)', test: (r) => !!r.restriction, chip: { hint: '제재', value: '있음' } },
          { label: '신고 누적', color: 'oklch(0.7 0.1 40)', test: (r) => r.reports >= 2, chip: { hint: '신고', value: '1건 이상' } },
        ], note: (rs) => { const d = rs.filter((r) => r.disputes > 0).length; return d ? `분쟁 ${d}건 — 개별 확인 필요` : '진행중 분쟁 없음'; } },
      ],
      kpis: (all) => [
        { label: '전체 회원', value: N(all.length) },
        { label: '오늘 가입', value: N(all.filter((r) => r.joinedDays === 0).length) },
        { label: '14일 거래 회원', value: N(all.filter((r) => r.seenDays !== null && r.seenDays <= 14 && (r.tradesBuy + r.tradesSell) > 0).length) },
        { label: '제재·정지', value: N(all.filter((r) => r.status === '정지' || !!r.restriction).length), color: '#b91c1c' },
      ],
      columns: [
        { key: 'no', label: '회원번호', w: '78px', req: true },
        { key: 'member', label: '회원', w: 'minmax(148px,1.2fr)', req: true },
        { key: 'role', label: '역할', w: '92px', on: true },
        { key: 'seller', label: '판매자', w: '84px', on: true },
        { key: 'trade', label: '거래', w: 'minmax(96px,.9fr)', on: true },
        { key: 'listings', label: '등록상품', w: '72px', on: true, align: 'right' },
        { key: 'risk', label: '신고/분쟁', w: '78px', on: true, align: 'right' },
        { key: 'status', label: '상태', w: '80px', req: true },
        { key: 'sanction', label: '제재', w: '84px', on: true },
        { key: 'seen', label: '최근 활동', w: '80px', on: true },
        { key: 'email', label: '이메일', w: 'minmax(130px,1fr)', on: false },
      ],
      rowMenu: ['회원 상세', '판매자 정보', '거래 내역', '제재 관리', '신고/분쟁 보기'],
      bulk: [{ label: '그룹 지정' }, { label: '담당자 지정' }, { label: '다운로드' }],
      bulkNote: '제재는 사유·근거가 필요해 일괄 처리에서 제외됩니다',
      tabsDetail: ['기본 정보', '판매 · 거래', '활동 이력', '관리자 메모'],
      badge: (r) => (r.buyer && r.seller ? '구매·판매' : r.seller ? '판매' : '구매'),
    };
  }

  if (mode === 'B2B') {
    return {
      unit: '계정', unitSuffix: '명', label: 'B2B',
      note: '회원 = 회사에 소속된 로그인 계정. 회사 정보는 거래처 관리에서 관리',
      placeholder: '이름 · 이메일 · 회사명 · 회사코드 — 무엇이든 입력',
      searchExtra: (r) => r.company + r.companyCode + r.dept,
      tabs: [
        { key: 'all', label: '전체', test: () => true },
        { key: 'new', label: '신규 가입', test: (r) => r.joinedDays <= 7 },
        { key: 'wait', label: '가입 승인 대기', test: (r) => r.approval === '승인대기' },
        { key: 'ok', label: '정상', test: (r) => r.account === '정상' },
        { key: 'stop', label: '사용 중지', test: (r) => r.account === '사용중지' },
        { key: 'nocom', label: '미소속 계정', test: (r) => !has(r) },
      ],
      groups: [
        { label: '계정', items: [
          { hint: '계정', value: '정상', test: (r) => r.account === '정상' },
          { hint: '계정', value: '승인대기', test: (r) => r.account === '승인대기' },
          { hint: '계정', value: '사용중지', test: (r) => r.account === '사용중지' },
          { hint: '본인인증', value: '미완료', test: (r) => !r.verified },
        ] },
        { label: '소속', items: [
          { hint: '회사', value: '대성상사', test: (r) => r.company === '대성상사' },
          { hint: '회사', value: '한빛물산', test: (r) => r.company === '한빛물산' },
          { hint: '소속', value: '미연결', test: (r) => !has(r) },
        ] },
        { label: '권한', items: [
          { hint: '역할', value: '구매 담당자', test: (r) => r.role === '구매 담당자' },
          { hint: '역할', value: '승인 담당자', test: (r) => r.role === '승인 담당자' },
          { hint: '역할', value: '관리자', test: (r) => r.role === '관리자' },
        ] },
        { label: '거래처', items: [
          { hint: '회사 거래', value: '거래중', test: (r) => r.companyTrade === '거래중' },
          { hint: '회사 거래', value: '거래중지', test: (r) => r.companyTrade === '거래중지' },
          { hint: '회사 거래', value: '거래대기', test: (r) => r.companyTrade === '거래대기' },
        ] },
      ],
      widgets: [
        { title: '계정 상태', hint: '클릭해 조건 추가', partition: true, keys: [
          { label: '정상', color: 'oklch(0.65 0.15 155)', test: (r) => r.account === '정상', chip: { hint: '계정', value: '정상' } },
          { label: '계정 승인대기', color: 'oklch(0.72 0.16 70)', test: (r) => r.account === '승인대기', chip: { hint: '계정', value: '승인대기' } },
          { label: '사용중지', color: 'oklch(0.58 0.19 25)', test: (r) => r.account === '사용중지', chip: { hint: '계정', value: '사용중지' } },
        ], note: (rs) => {
          const w = rs.filter((r) => r.approval === '승인대기').length;
          const nc = rs.filter((r) => !has(r)).length;
          if (w) return `가입 승인 대기 ${w}건 · 회사 미소속 ${nc}건`;
          return nc ? `회사 미소속 ${nc}건 — 소속 연결 필요` : '승인 대기·미소속 없음';
        } },
        { title: '역할 구성', hint: '', partition: true, keys: [
          { label: '구매 담당', color: 'oklch(0.62 0.13 258)', test: (r) => r.role === '구매 담당자', chip: { hint: '역할', value: '구매 담당자' } },
          { label: '승인 담당', color: 'oklch(0.68 0.13 190)', test: (r) => r.role === '승인 담당자', chip: { hint: '역할', value: '승인 담당자' } },
          { label: '관리자', color: 'oklch(0.58 0.14 300)', test: (r) => r.role === '관리자', chip: { hint: '역할', value: '관리자' } },
          { label: '일반', color: '#c4c4c8', test: (r) => r.role === '일반 사용자', chip: null },
        ], note: (rs) => { const c = rs.filter((r) => r.companyTrade === '거래중지').length; return c ? `거래중지 회사 소속 ${c}명 — 발주 불가` : '소속 회사 모두 거래 가능 상태'; } },
      ],
      kpis: (all) => [
        { label: '전체 계정', value: N(all.length) },
        { label: '오늘 가입', value: N(all.filter((r) => r.joinedDays === 0).length) },
        { label: '승인 대기', value: N(all.filter((r) => r.approval === '승인대기').length), color: '#b45309' },
        { label: '활성 회사 소속', value: N(all.filter((r) => !!r.company && r.companyTrade === '거래중').length) },
      ],
      columns: [
        { key: 'no', label: '계정번호', w: '82px', req: true },
        { key: 'member', label: '회원', w: 'minmax(144px,1.1fr)', req: true },
        { key: 'company', label: '소속 회사', w: 'minmax(118px,1fr)', on: true },
        { key: 'dept', label: '부서 / 직책', w: 'minmax(104px,.9fr)', on: true },
        { key: 'role', label: '역할', w: '96px', on: true },
        { key: 'approval', label: '승인', w: '86px', on: true },
        { key: 'trade', label: '회사 거래', w: '82px', on: true },
        { key: 'status', label: '계정상태', w: '84px', req: true },
        { key: 'seen', label: '최근 로그인', w: '86px', on: true },
        { key: 'email', label: '이메일', w: 'minmax(130px,1fr)', on: false },
      ],
      rowMenu: ['회원 상세', '회사 보기', '소속 변경', '역할/권한 보기', '가입 승인/반려', '계정 상태 변경'],
      bulk: [{ label: '소속 그룹 지정' }, { label: '권한 템플릿 적용' }, { label: '다운로드' }],
      bulkNote: '일괄 회사 변경·일괄 승인은 권한 정책상 제공하지 않습니다',
      tabsDetail: ['기본 정보', '소속 · 권한', '활동 이력', '관리자 메모'],
      badge: (r) => r.role,
    };
  }

  return {
    unit: '회원', unitSuffix: '명', label: 'B2C',
    note: '등급·구매 이력을 축으로 분기됩니다',
    placeholder: '이름 · 이메일 · 회원번호 · 휴대폰 — 무엇이든 입력',
    searchExtra: (r) => r.handle,
    tabs: [
      { key: 'all', label: '전체', test: () => true },
      { key: 'new', label: '신규 가입', test: (r) => r.joinedDays <= 7 },
      { key: 'ok', label: '정상', test: (r) => r.status === '정상' },
      { key: 'dorm', label: '휴면', test: (r) => r.status === '휴면' },
      { key: 'ban', label: '정지', test: (r) => r.status === '정지' },
      { key: 'mkt', label: '마케팅 동의', test: (r) => r.marketing },
    ],
    groups: [
      { label: '회원 기본', items: [
        { hint: '상태', value: '정상', test: (r) => r.status === '정상' },
        { hint: '상태', value: '휴면', test: (r) => r.status === '휴면' },
        { hint: '상태', value: '정지', test: (r) => r.status === '정지' },
        { hint: '등급', value: 'VIP', test: (r) => r.grade === 'VIP' },
        { hint: '등급', value: 'Gold', test: (r) => r.grade === 'Gold' },
      ] },
      { label: '활동', items: [
        { hint: '최근 접속', value: '7일 이내', test: (r) => r.seenDays !== null && r.seenDays <= 7 },
        { hint: '최근 구매', value: '30일 이내', test: (r) => r.lastBuyDays !== null && r.lastBuyDays <= 30 },
        { hint: '누적 구매', value: '100만원 이상', test: (r) => r.spend >= 1000000 },
        { hint: '주문', value: '10건 이상', test: (r) => r.orders >= 10 },
      ] },
      { label: '동의', items: [
        { hint: '마케팅', value: '동의', test: (r) => r.marketing },
        { hint: '마케팅', value: '미동의', test: (r) => !r.marketing },
        { hint: '가입 경로', value: 'Google', test: (r) => r.provider === 'Google' },
        { hint: '가입 경로', value: 'Kakao', test: (r) => r.provider === 'Kakao' },
      ] },
    ],
    widgets: [
      { title: '상태 구성', hint: '클릭해 조건 추가', partition: true, keys: [
        { label: '정상', color: ST['정상'].dot, test: (r) => r.status === '정상', chip: { hint: '상태', value: '정상' } },
        { label: '휴면', color: ST['휴면'].dot, test: (r) => r.status === '휴면', chip: { hint: '상태', value: '휴면' } },
        { label: '정지', color: ST['정지'].dot, test: (r) => r.status === '정지', chip: { hint: '상태', value: '정지' } },
        { label: '탈퇴', color: ST['탈퇴'].dot, test: (r) => r.status === '탈퇴', chip: null },
      ], note: (rs) => { const c = rs.filter((r) => r.status === '정지' || r.status === '휴면').length; return c ? `주의 상태 ${c}명 (정지·휴면)` : '전원 정상 이용 중'; } },
      { title: '구매 활동', hint: '중복 집계', partition: false, keys: [
        { label: '구매 회원', color: 'oklch(0.62 0.13 258)', test: (r) => r.orders > 0, chip: { hint: '주문', value: '10건 이상' } },
        { label: '미구매', color: '#d4d4d8', test: (r) => r.orders === 0, chip: null },
        { label: '30일 구매', color: 'oklch(0.68 0.13 190)', test: (r) => r.lastBuyDays !== null && r.lastBuyDays <= 30, chip: { hint: '최근 구매', value: '30일 이내' } },
        { label: 'VIP', color: 'oklch(0.58 0.14 300)', test: (r) => r.grade === 'VIP', chip: { hint: '등급', value: 'VIP' } },
      ], note: (rs) => { const c = rs.filter((r) => r.orders === 0).length; return c ? `미구매 ${c}명 — 첫 구매 유도 대상` : '전원 구매 이력 보유'; } },
    ],
    kpis: (all) => [
      { label: '전체 회원', value: N(all.length) },
      { label: '오늘 가입', value: N(all.filter((r) => r.joinedDays === 0).length) },
      { label: '7일 활성', value: N(all.filter((r) => r.seenDays !== null && r.seenDays <= 7).length) },
      { label: '휴면·정지', value: N(all.filter((r) => r.status === '휴면' || r.status === '정지').length), color: '#b45309' },
    ],
    columns: [
      { key: 'no', label: '회원번호', w: '78px', req: true },
      { key: 'member', label: '회원', w: 'minmax(150px,1.2fr)', req: true },
      { key: 'contact', label: '이메일 / 휴대폰', w: 'minmax(146px,1.2fr)', on: true },
      { key: 'grade', label: '등급', w: '70px', on: true },
      { key: 'group', label: '그룹', w: '86px', on: false },
      { key: 'buy', label: '주문 / 구매', w: 'minmax(104px,.9fr)', on: true },
      { key: 'status', label: '상태', w: '80px', req: true },
      { key: 'joined', label: '가입일', w: '86px', on: true },
      { key: 'seen', label: '최근 접속', w: '82px', on: true },
      { key: 'channel', label: '가입 경로', w: '86px', on: false },
      { key: 'mkt', label: '마케팅', w: '70px', on: false },
    ],
    rowMenu: ['회원 상세', '등급 변경', '그룹 변경', '회원 상태 변경', 'CS 보기'],
    bulk: [{ label: '회원 그룹 지정' }, { label: '등급 변경' }, { label: '마케팅 태그' }, { label: '다운로드' }],
    bulkNote: '일괄 정지는 상위 권한 계정에서만 가능합니다',
    tabsDetail: ['기본 정보', '주문 · 구매', '활동 이력', '관리자 메모'],
    badge: (r) => r.grade,
  };
}
