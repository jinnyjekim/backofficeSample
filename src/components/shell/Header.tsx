import { Blocks, Settings } from 'lucide-react';
import { Header as M2MHeader } from 'm2m-uiux-react/Header';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { activeKeyForPath, breadcrumbForKey } from '../../lib/nav';
import { SearchField } from '../SearchField';
import styles from './Header.module.css';

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [root, leaf] = breadcrumbForKey(activeKeyForPath(pathname));
  const [headerSearch, setHeaderSearch] = useState('');

  return (
    <M2MHeader classNames={styles.header}>
      <div className={styles.crumb}>
        <span>{root}</span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbLeaf}>{leaf}</span>
      </div>

      <div className={styles.spacer} />

      <SearchField
        id="header-global-search"
        className={styles.headerSearch}
        value={headerSearch}
        onValueChange={setHeaderSearch}
        placeholder="회원 · 주문 · 메뉴 검색"
        shortcutHint="⌘K"
        size="md"
      />

      <button
        type="button"
        className={`${styles.iconBtn} ${pathname === '/components' ? styles.iconBtnActive : ''}`}
        title="컴포넌트"
        onClick={() => navigate('/components')}
      >
        <Blocks size={15} strokeWidth={1.8} />
      </button>

      <button
        type="button"
        className={`${styles.iconBtn} ${pathname.startsWith('/system') ? styles.iconBtnActive : ''}`}
        title="시스템 설정"
        onClick={() => navigate('/system/service')}
      >
        <Settings size={15} strokeWidth={1.8} />
      </button>

      <div className={styles.account}>
        <div className={styles.accountAvatar}>관</div>
        <span className={styles.accountName}>관리자</span>
      </div>
    </M2MHeader>
  );
}
