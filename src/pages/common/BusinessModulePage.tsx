import { useLocation } from 'react-router-dom';
import { NAV_GROUPS } from '../../lib/nav';
import { ModulePlaceholderPage } from './ModulePlaceholderPage';

export function BusinessModulePage() {
  const { pathname } = useLocation();
  const items = NAV_GROUPS.flatMap((group) => group.items);
  const item = items.find((navItem) => navItem.sub && navItem.to === pathname) ?? items.find((navItem) => navItem.to === pathname);
  const business = item?.business === 'C' ? 'C2C' : item?.business === 'B2B' ? 'B2B' : item?.business === 'BC' ? 'B2C / C2C' : 'B2C';
  const title = item?.label ?? `${business} 모듈`;
  return <ModulePlaceholderPage title={title} subtitle={`${business} 업무에 필요한 ${title} 기능을 제공하는 통합 메뉴입니다.`} icon={business === 'C2C' ? 'C' : business === 'B2B' ? '2B' : 'B'} kind={pathname.includes('/stats/') ? 'analytics' : 'management'} />;
}
