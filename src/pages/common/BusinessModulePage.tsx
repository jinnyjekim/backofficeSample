import { useLocation } from 'react-router-dom';
import { NAV_GROUPS } from '../../lib/nav';
import { ModulePlaceholderPage } from './ModulePlaceholderPage';

export function BusinessModulePage() {
  const { pathname } = useLocation();
  const items = NAV_GROUPS.flatMap((group) => group.items);
  const item = items.find((navItem) => navItem.sub && navItem.to === pathname) ?? items.find((navItem) => navItem.to === pathname);
  const business = item?.business === 'C' ? 'C2C' : 'B2C';
  const title = item?.label ?? `${business} 모듈`;
  return <ModulePlaceholderPage title={title} subtitle={`${business} 업무에 필요한 ${title} 기능을 제공하는 통합 메뉴입니다.`} icon={business === 'B2C' ? 'B' : 'C'} kind={pathname.includes('/stats/') ? 'analytics' : 'management'} />;
}
