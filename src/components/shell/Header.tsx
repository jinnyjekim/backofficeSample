import { useLocation } from 'react-router-dom';
import { activeKeyForPath, breadcrumbForKey } from '../../lib/nav';
import styles from './Header.module.css';

export function Header() {
  const { pathname } = useLocation();
  const [root, leaf] = breadcrumbForKey(activeKeyForPath(pathname));

  return (
    <div className={styles.header}>
      <div className={styles.crumb}>
        <span>{root}</span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbLeaf}>{leaf}</span>
      </div>

      <div className={styles.spacer} />

      <button type="button" className={styles.search}>
        <span>⌕</span>
        <span>회원 · 주문 · 메뉴 검색</span>
        <span className={styles.kbd}>⌘K</span>
      </button>

      <button type="button" className={styles.bell}>
        ⚑
        <span className={styles.bellBadge}>3</span>
      </button>

      <div className={styles.account}>
        <div className={styles.accountAvatar}>관</div>
        <span className={styles.accountName}>관리자</span>
      </div>
    </div>
  );
}
