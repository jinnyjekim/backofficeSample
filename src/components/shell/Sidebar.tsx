import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_GROUPS, activeKeyForPath, type NavItem } from '../../lib/nav';
import styles from './Sidebar.module.css';

interface Props {
  open: boolean;
  onToggle: () => void;
}

type Row = { kind: 'item'; item: NavItem } | { kind: 'section'; header: NavItem; subs: NavItem[] };

// Maps every item key (header or sub) to the key of the header that owns it,
// so we can tell which accordion section a given active route belongs to.
const PARENT_KEY: Record<string, string> = {};
NAV_GROUPS.forEach((group) => {
  let currentHeader: string | null = null;
  group.items.forEach((item) => {
    if (!item.sub) {
      currentHeader = item.key;
      PARENT_KEY[item.key] = item.key;
    } else if (currentHeader) {
      PARENT_KEY[item.key] = currentHeader;
    }
  });
});

function buildRows(items: NavItem[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.sub) continue;
    const subs: NavItem[] = [];
    let j = i + 1;
    while (j < items.length && items[j].sub) {
      subs.push(items[j]);
      j++;
    }
    rows.push(subs.length > 0 ? { kind: 'section', header: item, subs } : { kind: 'item', item });
  }
  return rows;
}

export function Sidebar({ open, onToggle }: Props) {
  const { pathname } = useLocation();
  const activeKey = activeKeyForPath(pathname);
  const activeHeaderKey = PARENT_KEY[activeKey] ?? null;

  const [openKey, setOpenKey] = useState<string | null>(activeHeaderKey);

  // Keep the accordion in sync with the current route, however navigation happened.
  useEffect(() => {
    setOpenKey(activeHeaderKey);
  }, [activeHeaderKey]);

  function renderLeaf(item: NavItem, isSub: boolean) {
    const isActive = activeKey === item.key;
    const content = (
      <>
        <span className={`${styles.icon} ${isSub ? styles.subIcon : ''}`}>{isSub ? '·' : item.icon}</span>
        <span className={styles.text}>{open ? item.label : ''}</span>
        <span className={styles.badge}>{open && item.badge ? item.badge : ''}</span>
      </>
    );
    const cls = [styles.item, isSub ? styles.itemSub : styles.itemMain, isActive ? styles.active : '', item.to ? '' : styles.disabled]
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
  }

  function renderHeader(header: NavItem, isOpen: boolean) {
    const isActiveGroup = activeHeaderKey === header.key;
    const cls = [styles.item, styles.itemMain, isActiveGroup ? styles.active : '']
      .filter(Boolean)
      .join(' ');

    return (
      <button
        key={header.key}
        type="button"
        title={header.label}
        className={cls}
        onClick={() => setOpenKey((prev) => (prev === header.key ? null : header.key))}
      >
        <span className={styles.icon}>{header.icon}</span>
        <span className={styles.text}>{open ? header.label : ''}</span>
        <span className={styles.badge}>{open && header.badge ? header.badge : ''}</span>
        {open && <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>›</span>}
      </button>
    );
  }

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
            {buildRows(group.items).map((row) => {
              if (row.kind === 'item') return renderLeaf(row.item, false);
              const isOpen = openKey === row.header.key;
              return (
                <div key={row.header.key}>
                  {renderHeader(row.header, isOpen)}
                  {open && isOpen && row.subs.map((s) => renderLeaf(s, true))}
                </div>
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
