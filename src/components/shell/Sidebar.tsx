import { Link, useLocation } from 'react-router-dom';
import { NAV_GROUPS, activeKeyForPath } from '../../lib/nav';
import styles from './Sidebar.module.css';

interface Props {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: Props) {
  const { pathname } = useLocation();
  const activeKey = activeKeyForPath(pathname);

  return (
    <aside className={styles.aside} style={{ width: open ? '212px' : '58px' }}>
      <div className={styles.top}>
        <div className={styles.logo}>A</div>
        {open && <span className={styles.brand}>백오피스</span>}
        <div className={styles.spacer} />
        <button className={styles.toggleBtn} onClick={onToggle} title="사이드바 접기/펼치기">
          {open ? '«' : '»'}
        </button>
      </div>

      <nav className={styles.navScroll}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {open && <div className={styles.groupLabel}>{group.label}</div>}
            {group.items.map((item) => {
              const isActive = activeKey === item.key;
              const content = (
                <>
                  <span className={`${styles.icon} ${item.sub ? styles.subIcon : ''}`}>
                    {item.sub ? '·' : item.icon}
                  </span>
                  <span className={styles.text}>{open ? item.label : ''}</span>
                  <span className={styles.badge}>{open && item.badge ? item.badge : ''}</span>
                </>
              );
              const cls = [
                styles.item,
                item.sub ? styles.itemSub : styles.itemMain,
                isActive ? styles.active : '',
                item.to ? '' : styles.disabled,
              ]
                .filter(Boolean)
                .join(' ');

              return item.to ? (
                <Link key={item.key} to={item.to} title={item.label} className={cls}>
                  {content}
                </Link>
              ) : (
                <button key={item.key} type="button" title={item.label} className={cls} disabled>
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.avatar}>관</div>
        {open && (
          <div className={styles.who}>
            <div className={styles.whoName}>운영 관리자</div>
            <div className={styles.whoRole}>전체 권한</div>
          </div>
        )}
      </div>
    </aside>
  );
}
