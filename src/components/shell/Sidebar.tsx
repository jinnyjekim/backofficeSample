import { useEffect, useState, useMemo } from 'react';
import { PanelLeftClose, PanelLeftOpen, Check, EyeOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_GROUPS, activeKeyForPath, type NavItem } from '../../lib/nav';
import {
  loadBusinessSettings,
  saveBusinessSettings,
  type BusinessSettings,
  type OperationalMode,
  type BusinessType,
} from '../../lib/business';
import styles from './Sidebar.module.css';

interface Props {
  open: boolean;
  onToggle: () => void;
}

type Row =
  | { kind: 'item'; item: NavItem }
  | { kind: 'section'; header: NavItem; subs: NavItem[] }
  | { kind: 'divider'; label: string };

// Maps every item key (header or sub) to the key of the header that owns it,
// so we can tell which accordion section a given active route belongs to.
const PARENT_KEY: Record<string, string> = {};
NAV_GROUPS.forEach((group) => {
  let currentHeader: string | null = null;
  group.items.forEach((item) => {
    if (item.divider) return;
    if (!item.sub) {
      currentHeader = item.key;
      PARENT_KEY[item.key] = item.key;
    } else if (currentHeader) {
      PARENT_KEY[item.key] = currentHeader;
    }
  });
});

/**
 * 아이템이 현재 운영 모드 및 활성화된 비즈니스 타입, 메뉴 숨기기/보이기 설정에 따라 노출되어야 하는지 검사
 */
function isItemVisibleInMode(
  item: NavItem,
  activeMode: OperationalMode,
  enabledModes: BusinessType[],
  visibleTypes: Record<BusinessType, boolean>,
): boolean {
  // 모드 설정 안된 것은 기본 메뉴이므로 어떤 모드에서든 항상 표시
  if (!item.business) return true;

  // 1. 활성화된 모드에 아예 포함되지 않은 경우 숨김
  if (item.business === 'B2B' && !enabledModes.includes('B2B')) return false;
  if (item.business === 'B' && !enabledModes.includes('B2C')) return false;
  if (item.business === 'C' && !enabledModes.includes('C2C')) return false;
  if (
    item.business === 'BC' &&
    !enabledModes.includes('B2C') &&
    !enabledModes.includes('C2C')
  )
    return false;

  // 2. 통합 모드(ALL) 외 단일 모드일 때: 자동으로 해당 비즈니스 모드에 맞는 메뉴만 표시
  if (activeMode === 'B2B' && item.business !== 'B2B') return false;
  if (activeMode === 'B2C' && item.business !== 'B' && item.business !== 'BC') return false;
  if (activeMode === 'C2C' && item.business !== 'C' && item.business !== 'BC') return false;

  // 3. 비즈니스 타입별 메뉴 숨기기/보이기 설정 확인
  if (item.business === 'B2B' && visibleTypes?.B2B === false) return false;
  if (item.business === 'B' && visibleTypes?.B2C === false) return false;
  if (item.business === 'C' && visibleTypes?.C2C === false) return false;
  if (
    item.business === 'BC' &&
    visibleTypes?.B2C === false &&
    visibleTypes?.C2C === false
  )
    return false;

  return true;
}

function buildRows(items: NavItem[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.sub) continue;
    if (item.divider) {
      rows.push({ kind: 'divider', label: item.label });
      continue;
    }
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

function businessTagClass(business: NonNullable<NavItem['business']>) {
  if (business === 'B') return styles.businessB;
  if (business === 'C') return styles.businessC;
  if (business === 'B2B') return styles.businessB2B;
  return styles.businessBC;
}

function businessTagLabel(business: NonNullable<NavItem['business']>) {
  return business === 'BC' ? 'B·C' : business;
}

export function Sidebar({ open, onToggle }: Props) {
  const { pathname } = useLocation();
  const activeKey = activeKeyForPath(pathname);
  const activeHeaderKey = PARENT_KEY[activeKey] ?? null;

  const [openKey, setOpenKey] = useState<string | null>(activeHeaderKey);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() =>
    loadBusinessSettings(),
  );

  // 비즈니스 모드 변경 이벤트 청취
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<BusinessSettings>;
      if (customEvent.detail) {
        setBusinessSettings(customEvent.detail);
      } else {
        setBusinessSettings(loadBusinessSettings());
      }
    };
    window.addEventListener('admin_business_mode_change', handler);
    return () => window.removeEventListener('admin_business_mode_change', handler);
  }, []);

  // 현재 라우트에 맞추어 아코디언 동기화
  useEffect(() => {
    setOpenKey(activeHeaderKey);
  }, [activeHeaderKey]);

  // 비즈니스 타입별 숨기기/보이기 토글
  const handleToggleVisibleType = (type: BusinessType) => {
    const isCurrentlyVisible =
      businessSettings.activeMode === 'ALL'
        ? businessSettings.visibleTypes?.[type] !== false
        : businessSettings.activeMode === type;

    const nextVal = !isCurrentlyVisible;
    const nextVisible: Record<BusinessType, boolean> = {
      B2B:
        businessSettings.activeMode === 'ALL'
          ? businessSettings.visibleTypes?.B2B !== false
          : businessSettings.activeMode === 'B2B',
      B2C:
        businessSettings.activeMode === 'ALL'
          ? businessSettings.visibleTypes?.B2C !== false
          : businessSettings.activeMode === 'B2C',
      C2C:
        businessSettings.activeMode === 'ALL'
          ? businessSettings.visibleTypes?.C2C !== false
          : businessSettings.activeMode === 'C2C',
      [type]: nextVal,
    };

    const activeTypes = (['B2B', 'B2C', 'C2C'] as BusinessType[]).filter(
      (t) => nextVisible[t],
    );

    let nextMode: OperationalMode;
    if (activeTypes.length === 1) {
      nextMode = activeTypes[0];
    } else {
      nextMode = 'ALL';
      if (activeTypes.length === 0) {
        nextVisible.B2B = true;
        nextVisible.B2C = true;
        nextVisible.C2C = true;
      }
    }

    const updated: BusinessSettings = {
      ...businessSettings,
      activeMode: nextMode,
      visibleTypes: nextVisible,
    };
    setBusinessSettings(updated);
    saveBusinessSettings(updated);
  };

  // 비즈니스 모드 및 숨기기 설정에 따라 필터링된 그룹 목록 생성
  const filteredGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => {
      // 1. 개별 아이템 필터링
      const visibleItems = group.items.filter((item) =>
        isItemVisibleInMode(
          item,
          businessSettings.activeMode,
          businessSettings.enabledModes,
          businessSettings.visibleTypes,
        ),
      );

      // 2. 만약 아코디언 헤더인데 하위 subs가 모두 필터링되어 사라졌다면 헤더도 숨김
      const validItems: NavItem[] = [];
      for (let i = 0; i < visibleItems.length; i++) {
        const item = visibleItems[i];
        if (item.sub) {
          validItems.push(item);
          continue;
        }
        if (item.divider) {
          validItems.push(item);
          continue;
        }
        // 원본 그룹에서 item 바로 뒤에 오던 sub 아이템들이 있었는지 확인
        const origIndex = group.items.indexOf(item);
        const origSubs: NavItem[] = [];
        let k = origIndex + 1;
        while (k < group.items.length && group.items[k].sub) {
          origSubs.push(group.items[k]);
          k++;
        }

        if (origSubs.length > 0) {
          // 원본에 subs가 있었던 경우, 필터링 후에도 남은 sub가 있는지 확인
          const remainingSubs = origSubs.filter((s) =>
            isItemVisibleInMode(
              s,
              businessSettings.activeMode,
              businessSettings.enabledModes,
              businessSettings.visibleTypes,
            ),
          );
          if (remainingSubs.length > 0) {
            validItems.push(item);
          }
        } else {
          validItems.push(item);
        }
      }

      return {
        ...group,
        items: validItems,
      };
    }).filter((g) => g.items.length > 0);
  }, [businessSettings]);

  function renderLeaf(item: NavItem, isSub: boolean) {
    const isActive = activeKey === item.key;
    const Icon = item.icon;
    const content = (
      <>
        <span className={`${styles.icon} ${isSub ? styles.subIcon : ''}`}>
          {isSub ? <span className={styles.dot} /> : Icon ? <Icon size={16} strokeWidth={2} /> : null}
        </span>
        <span className={styles.text}>{open ? item.label : ''}</span>
        {open && item.business && (
          <span className={`${styles.businessTag} ${businessTagClass(item.business)}`}>
            {businessTagLabel(item.business)}
          </span>
        )}
        <span className={styles.badge}>{open && (isSub || item.key === 'members') && item.badge ? item.badge : ''}</span>
      </>
    );
    const cls = [
      styles.item,
      isSub ? styles.itemSub : styles.itemMain,
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
  }

  function renderHeader(header: NavItem, isOpen: boolean) {
    const isActiveGroup = activeHeaderKey === header.key;
    const cls = [styles.item, styles.itemMain, isActiveGroup ? styles.active : '']
      .filter(Boolean)
      .join(' ');

    const Icon = header.icon;
    return (
      <button
        key={header.key}
        type="button"
        title={header.label}
        className={cls}
        onClick={() => setOpenKey((prev) => (prev === header.key ? null : header.key))}
      >
        <span className={styles.icon}>{Icon ? <Icon size={16} strokeWidth={2} /> : null}</span>
        <span className={styles.text}>{open ? header.label : ''}</span>
        {open && header.business && (
          <span className={`${styles.businessTag} ${businessTagClass(header.business)}`}>
            {businessTagLabel(header.business)}
          </span>
        )}
        <span className={styles.badge}>{open && header.key === 'members' && header.badge ? header.badge : ''}</span>
        {open && <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>›</span>}
      </button>
    );
  }

  // 메뉴 넓이 10% 증가: 기존 212px -> 234px
  return (
    <aside className={styles.aside} style={{ width: open ? '14.625rem' : '58px' }}>
      <div className={`${styles.top} ${open ? '' : styles.topCollapsed}`}>
        {open && <div className={styles.logo}>A</div>}
        {open && <span className={styles.brand}>백오피스</span>}
        <div className={styles.spacer} />
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={onToggle}
          title={open ? '사이드바 접기' : '사이드바 펼치기'}
          aria-label={open ? '사이드바 접기' : '사이드바 펼치기'}
          aria-expanded={open}
        >
          {open ? <PanelLeftClose size={19} strokeWidth={2} /> : <PanelLeftOpen size={19} strokeWidth={2} />}
        </button>
      </div>

      {/* 사이드바가 펼쳐져 있을 때 비즈니스 타입별 메뉴 숨기기/보이기 퀵 칩 */}
      {open && (
        <div className={styles.typeFilterBar}>
          <span className={styles.typeFilterTitle}>메뉴 필터</span>
          <div className={styles.typeFilterChips}>
            {(['B2B', 'B2C', 'C2C'] as BusinessType[]).map((t) => {
              const isVisible =
                businessSettings.activeMode === 'ALL'
                  ? businessSettings.visibleTypes?.[t] !== false
                  : businessSettings.activeMode === t;
              let activeCls = styles.typeChipActiveB2C;
              if (t === 'B2B') activeCls = styles.typeChipActiveB2B;
              if (t === 'C2C') activeCls = styles.typeChipActiveC2C;

              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleToggleVisibleType(t)}
                  className={`${styles.typeChip} ${isVisible ? activeCls : styles.typeChipDisabled}`}
                  title={`${t} 메뉴 ${isVisible ? '숨기기' : '보이기'}`}
                >
                  {isVisible ? <Check size={10} strokeWidth={3} /> : <EyeOff size={10} />}
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <nav className={styles.navScroll}>
        {filteredGroups.map((group) => (
          <div key={group.label}>
            {open && <div className={styles.groupLabel}>{group.label}</div>}
            {buildRows(group.items).map((row, index) => {
              if (row.kind === 'item') return renderLeaf(row.item, false);
              if (row.kind === 'divider') {
                return open ? (
                  <div key={`div-${index}`} className={styles.groupLabel}>
                    {row.label}
                  </div>
                ) : null;
              }
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
            <div className={styles.whoRole}>
              {businessSettings.activeMode === 'ALL' ? '통합 운영' : `${businessSettings.activeMode} 전담`}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
