export interface NavItem {
  key: string;
  label: string;
  icon?: string;
  badge?: string;
  sub?: boolean;
  to?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '일반',
    items: [{ key: 'dash', icon: '▤', label: '대시보드', to: '/dashboard' }],
  },
  {
    label: '서비스 관리',
    items: [
      { key: 'members', icon: '☰', label: '회원 관리', badge: '128,430', to: '/members' },
      { key: 'members_sub1', sub: true, label: '회원 목록', to: '/members' },
      { key: 'left', sub: true, label: '탈퇴 회원', badge: '3,921', to: '/members/left' },
      { key: 'ban', sub: true, label: '제재 회원', badge: '421', to: '/members/ban' },
      { key: 'content', icon: '▣', label: '콘텐츠 관리' },
      { key: 'order', icon: '▧', label: '거래 관리' },
      { key: 'ops', icon: '▨', label: '운영 관리' },
      { key: 'cs', icon: '✉', label: '고객센터', badge: '28' },
    ],
  },
  {
    label: '분석 · 시스템',
    items: [
      { key: 'stats', icon: '▥', label: '통계' },
      { key: 'admin', icon: '⚙', label: '시스템 설정' },
      { key: 'log', icon: '▤', label: '로그' },
    ],
  },
];

export const BREADCRUMB: Record<string, [string, string]> = {
  dash: ['일반', '대시보드'],
  members: ['서비스 관리 · 회원 관리', '회원 목록'],
  left: ['서비스 관리 · 회원 관리', '탈퇴 회원'],
  ban: ['서비스 관리 · 회원 관리', '제재 회원'],
};

export function activeKeyForPath(pathname: string): string {
  if (pathname.startsWith('/dashboard')) return 'dash';
  if (pathname.startsWith('/members/left')) return 'left';
  if (pathname.startsWith('/members/ban')) return 'ban';
  return 'members_sub1';
}
