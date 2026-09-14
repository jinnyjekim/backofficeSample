import { Blocks, Settings, ChevronDown, Check } from 'lucide-react';
import { Header as M2MHeader } from 'm2m-uiux-react/Header';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { activeKeyForPath, breadcrumbForKey } from '../../lib/nav';
import {
  loadBusinessSettings,
  saveBusinessSettings,
  getVisibleTypesForMode,
  type BusinessSettings,
  type OperationalMode,
  BUSINESS_MODE_CARDS,
  BUSINESS_BADGE_META,
} from '../../lib/business';
import styles from './Header.module.css';

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [root, leaf] = breadcrumbForKey(activeKeyForPath(pathname));

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() =>
    loadBusinessSettings(),
  );
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModeDropdownOpen(false);
      }
    }
    if (modeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [modeDropdownOpen]);

  const handleSelectMode = (mode: OperationalMode) => {
    const updated: BusinessSettings = {
      ...businessSettings,
      activeMode: mode,
      visibleTypes: getVisibleTypesForMode(mode),
    };
    setBusinessSettings(updated);
    saveBusinessSettings(updated);
    setModeDropdownOpen(false);
  };

  const currentModeInfo =
    BUSINESS_MODE_CARDS.find((c) => c.mode === businessSettings.activeMode) ||
    BUSINESS_MODE_CARDS[0];

  const modeBadgeColor =
    businessSettings.activeMode === 'ALL'
      ? { bg: 'var(--common-primary-light)', fg: 'var(--common-primary)' }
      : BUSINESS_BADGE_META[businessSettings.activeMode as keyof typeof BUSINESS_BADGE_META];

  return (
    <M2MHeader classNames={styles.header}>
      <div className={styles.crumb}>
        <span>{root}</span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbLeaf}>{leaf}</span>
      </div>

      <div className={styles.spacer} />

      {/* 비즈니스 모드 퀵 스위처 */}
      <div className={styles.modeSwitcherWrapper} ref={dropdownRef}>
        <button
          type="button"
          className={styles.modeSwitcherBtn}
          onClick={() => setModeDropdownOpen((prev) => !prev)}
          title="작업 비즈니스 모드 변경"
        >
          <span
            className={styles.modeTag}
            style={{ backgroundColor: modeBadgeColor.bg, color: modeBadgeColor.fg }}
          >
            {currentModeInfo.badge}
          </span>
          <span>{currentModeInfo.title.split(' ')[0]}</span>
          <ChevronDown size={14} />
        </button>

        {modeDropdownOpen && (
          <div className={styles.modeDropdown}>
            {BUSINESS_MODE_CARDS.map((card) => {
              const isSelected = businessSettings.activeMode === card.mode;
              const isEnabled =
                card.mode === 'ALL' || businessSettings.enabledModes.includes(card.mode);

              return (
                <button
                  key={card.mode}
                  type="button"
                  className={`${styles.modeOption} ${
                    isSelected ? styles.modeOptionActive : ''
                  }`}
                  onClick={() => isEnabled && handleSelectMode(card.mode)}
                  disabled={!isEnabled}
                  style={{ opacity: isEnabled ? 1 : 0.45 }}
                >
                  <span>{card.title}</span>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}

            <div className={styles.modeDropdownDivider} />
            <button
              type="button"
              className={styles.modeDropdownLink}
              onClick={() => {
                setModeDropdownOpen(false);
                navigate('/system/display');
              }}
            >
              운영 설정 관리 →
            </button>
          </div>
        )}
      </div>

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
        title="환경 설정"
        onClick={() => navigate('/system/display')}
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
