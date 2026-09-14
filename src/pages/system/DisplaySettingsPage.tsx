import { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Check,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import {
  useDisplayTheme,
  COLOR_PRESETS,
} from '../../lib/theme';
import {
  loadBusinessSettings,
  saveBusinessSettings,
  getVisibleTypesForMode,
  type BusinessSettings,
  type BusinessType,
  BUSINESS_MODE_CARDS,
  BUSINESS_BADGE_META,
} from '../../lib/business';
import { CommonButton } from '../../components/common';
import styles from './DisplaySettingsPage.module.css';

const FONT_SIZES = [14, 15, 16, 17, 18];

export function DisplaySettingsPage() {
  const {
    settings,
    updateFontSize,
    updateThemeMode,
    updatePrimaryColor,
    resetToDefault: resetDisplayDefault,
    saveSettings: saveDisplaySettings,
  } = useDisplayTheme();

  // 비즈니스 모드 설정 (원래 저장된 값)
  const [savedBusinessSettings, setSavedBusinessSettings] = useState<BusinessSettings>(() =>
    loadBusinessSettings(),
  );

  // 사용자가 화면에서 조작 중인 비즈니스 설정 (저장 버튼 클릭 시 반영)
  const [pendingBusiness, setPendingBusiness] = useState<BusinessSettings>(() =>
    loadBusinessSettings(),
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<BusinessSettings>;
      if (customEvent.detail) {
        setSavedBusinessSettings(customEvent.detail);
        setPendingBusiness(customEvent.detail);
      }
    };
    window.addEventListener('admin_business_mode_change', handler);
    return () => window.removeEventListener('admin_business_mode_change', handler);
  }, []);

  const isBusinessDirty =
    savedBusinessSettings.activeMode !== pendingBusiness.activeMode ||
    savedBusinessSettings.enabledModes.length !== pendingBusiness.enabledModes.length ||
    !savedBusinessSettings.enabledModes.every((m) => pendingBusiness.enabledModes.includes(m)) ||
    (savedBusinessSettings.visibleTypes?.B2B ?? true) !== (pendingBusiness.visibleTypes?.B2B ?? true) ||
    (savedBusinessSettings.visibleTypes?.B2C ?? true) !== (pendingBusiness.visibleTypes?.B2C ?? true) ||
    (savedBusinessSettings.visibleTypes?.C2C ?? true) !== (pendingBusiness.visibleTypes?.C2C ?? true);

  const handleSave = () => {
    // 1. 화면 설정 저장
    saveDisplaySettings();
    // 2. 비즈니스 모드 및 메뉴 가시성 설정 저장
    saveBusinessSettings(pendingBusiness);
    setSavedBusinessSettings(pendingBusiness);

    showToast('비즈니스 운영 모드 및 화면 설정이 저장되었습니다.');
  };

  const handleReset = () => {
    // 화면 설정 초기화
    resetDisplayDefault();
    // 비즈니스 설정 초기화
    const defaultBusiness: BusinessSettings = {
      activeMode: 'ALL',
      enabledModes: ['B2B', 'B2C', 'C2C'],
      visibleTypes: {
        B2B: true,
        B2C: true,
        C2C: true,
      },
    };
    setPendingBusiness(defaultBusiness);
    setSavedBusinessSettings(defaultBusiness);
    saveBusinessSettings(defaultBusiness);

    showToast('기본값으로 복원되었습니다.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 메뉴 숨기기/보이기 토글
  const toggleVisibleType = (type: BusinessType) => {
    setPendingBusiness((prev) => {
      const current = prev.visibleTypes?.[type] !== false;
      return {
        ...prev,
        visibleTypes: {
          ...prev.visibleTypes,
          [type]: !current,
        },
      };
    });
  };

  // 복수 선택 체크박스 토글
  const toggleEnabledMode = (type: BusinessType) => {
    setPendingBusiness((prev) => {
      let nextEnabled: BusinessType[];
      if (prev.enabledModes.includes(type)) {
        if (prev.enabledModes.length === 1) {
          showToast('최소 1개 이상의 비즈니스 모드가 활성화되어 있어야 합니다.');
          return prev;
        }
        nextEnabled = prev.enabledModes.filter((m) => m !== type);
      } else {
        nextEnabled = [...prev.enabledModes, type];
      }

      // 만약 현재 activeMode가 비활성화된 모드라면 가능한 모드로 변경
      let nextActive = prev.activeMode;
      let nextVisible = prev.visibleTypes;
      if (prev.activeMode === type) {
        nextActive = nextEnabled.length > 1 ? 'ALL' : nextEnabled[0];
        nextVisible = getVisibleTypesForMode(nextActive);
      }

      return {
        ...prev,
        enabledModes: nextEnabled,
        activeMode: nextActive,
        visibleTypes: nextVisible,
      };
    });
  };

  const currentRem =
    (settings.fontSize / 16).toFixed(settings.fontSize === 16 ? 0 : 3).replace(/\.?0+$/, '') +
    'rem';

  const isPresetColor = COLOR_PRESETS.some(
    (p) => p.color.toLowerCase() === settings.primaryColor.toLowerCase(),
  );

  // 실시간 미리보기에서 보여줄 모드별 맞춤 목업 데이터
  const getPreviewMockData = () => {
    switch (pendingBusiness.activeMode) {
      case 'B2B':
        return {
          title: 'B2B 기업거래 대시보드',
          badge: '기업 전담',
          kpi1Label: '오늘 견적 요청',
          kpi1Val: '48건',
          kpi1Delta: '+18.2%',
          kpi2Label: '이달 계약 체결액',
          kpi2Val: '1.24억원',
          kpi2Delta: '+9.5%',
          row1Name: '(주)대한통상 [B2B]',
          row1Status: '단가 승인',
          row2Name: '(주)글로벌유통 [B2B]',
          row2Status: '계약 검토',
        };
      case 'B2C':
        return {
          title: 'B2C 쇼핑몰 대시보드',
          badge: '쇼핑몰',
          kpi1Label: '오늘 주문 건수',
          kpi1Val: '1,428건',
          kpi1Delta: '+12.4%',
          kpi2Label: '신규 가입 회원',
          kpi2Val: '384명',
          kpi2Delta: '+8.1%',
          row1Name: '김민준 (일반회원)',
          row1Status: '배송 준비',
          row2Name: '이지은 (VIP회원)',
          row2Status: '결제 완료',
        };
      case 'C2C':
        return {
          title: 'C2C 개인거래 대시보드',
          badge: '마켓플레이스',
          kpi1Label: '성사된 거래 건수',
          kpi1Val: '892건',
          kpi1Delta: '+15.7%',
          kpi2Label: '거래 분쟁 접수',
          kpi2Val: '4건',
          kpi2Delta: '-2.1%',
          row1Name: '판매자 @retro_shop',
          row1Status: '정산 대기',
          row2Name: '구매자 @fast_buyer',
          row2Status: '구매 확정',
        };
      default:
        return {
          title: '통합 운영 대시보드',
          badge: '통합 운영',
          kpi1Label: '전체 거래 건수',
          kpi1Val: '2,368건',
          kpi1Delta: '+14.2%',
          kpi2Label: '활성 사용자(MAU)',
          kpi2Val: '14,280명',
          kpi2Delta: '+11.8%',
          row1Name: '김관리 (admin01)',
          row1Status: '승인 완료',
          row2Name: '이운영 (manager02)',
          row2Status: '검토 대기',
        };
    }
  };

  const mockData = getPreviewMockData();

  return (
    <div className={styles.container}>
      {/* 상단 페이지 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>시스템 설정</h1>
          <p className={styles.subtitle}>
            서비스 운영 방식과 관리자 화면 표시 방식을 설정합니다.
          </p>
        </div>
        <div className={styles.headMeta}>
          {isBusinessDirty && (
            <span className={styles.headMetaText}>저장하지 않은 변경 사항이 있습니다</span>
          )}
          <CommonButton type="button" variant="secondary" size="md" onClick={handleReset}>
            기본값 복원
          </CommonButton>
          <CommonButton type="button" variant="emphasis" size="md" onClick={handleSave}>
            저장
          </CommonButton>
        </div>
      </header>

      {/* 본문 레이아웃: 좌측 설정(비즈니스 + 화면) + 우측 실시간 미리보기 */}
      <div className={styles.mainLayout}>
        <div className={styles.settingsColumn}>
          {/* ============================================================ */}
          {/* 1. 비즈니스 설정 섹션 */}
          {/* ============================================================ */}
          <section className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNum}>1</span>
                비즈니스 설정
                {isBusinessDirty && (
                  <span className={styles.pendingBadge}>저장 대기 중</span>
                )}
              </h2>
              <p className={styles.sectionDesc}>
                현재 운영할 서비스 유형을 선택합니다. 선택한 모드에 따라 노출 메뉴,
                주문/배송/회원 관리 항목 등이 변경됩니다.
              </p>
            </div>

            {/* 비즈니스 모드 카드 선택 UI */}
            <div className={styles.businessCardsGrid}>
              {BUSINESS_MODE_CARDS.map((card) => {
                const isSelected = pendingBusiness.activeMode === card.mode;
                const badgeStyle =
                  card.mode === 'ALL'
                    ? { bg: 'var(--common-primary-light)', fg: 'var(--common-primary)' }
                    : BUSINESS_BADGE_META[card.mode as keyof typeof BUSINESS_BADGE_META];

                return (
                  <div
                    key={card.mode}
                    className={`${styles.businessCard} ${
                      isSelected ? styles.businessCardActive : ''
                    }`}
                    onClick={() =>
                      setPendingBusiness((prev) => ({
                        ...prev,
                        activeMode: card.mode,
                        visibleTypes: getVisibleTypesForMode(card.mode),
                      }))
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.businessCardTop}>
                      <h3 className={styles.businessCardTitle}>{card.title}</h3>
                      <div className={styles.businessCardMeta}>
                        <span
                          className={styles.businessBadge}
                          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.fg }}
                        >
                          {card.badge}
                        </span>
                        <span
                          className={`${styles.cardRadio} ${
                            isSelected ? styles.cardRadioActive : ''
                          }`}
                          aria-hidden="true"
                        >
                          {isSelected && <Check size={11} strokeWidth={3.5} />}
                        </span>
                      </div>
                    </div>

                    <p className={styles.businessCardSummary}>{card.summary}</p>

                    <ul className={styles.businessFeatureList}>
                      {card.features.map((feat, idx) => (
                        <li key={idx} className={styles.businessFeatureItem}>
                          <span className={styles.businessFeatureDot} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* 사용할 비즈니스 모드 복수 선택 */}
            <div className={styles.multiSelectBox}>
              <span className={styles.multiSelectTitle}>
                사용할 비즈니스 모드 (복수 활성화 지원)
              </span>
              <div className={styles.multiSelectRow}>
                {(['B2B', 'B2C', 'C2C'] as BusinessType[]).map((type) => {
                  const isChecked = pendingBusiness.enabledModes.includes(type);
                  return (
                    <label key={type} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEnabledMode(type)}
                        className={styles.checkboxInput}
                      />
                      <span>
                        {type === 'B2B' && 'B2B (기업 간 거래)'}
                        {type === 'B2C' && 'B2C (일반 쇼핑몰)'}
                        {type === 'C2C' && 'C2C (개인 간 거래)'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 비즈니스 타입별 메뉴 숨기기 / 보이기 설정 */}
            <div className={styles.visibilityBox}>
              <div className={styles.visibilityBoxHeader}>
                <div className={styles.visibilityTitleArea}>
                  <div>
                    <h3 className={styles.visibilityTitle}>
                      비즈니스 타입별 메뉴 숨기기 / 보이기 설정
                    </h3>
                    <p className={styles.visibilityDesc}>
                      사이드바(LNB)에서 특정 비즈니스 타입에 속한 관리 메뉴를 숨기거나 표시합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.visibilityList}>
                {[
                  {
                    type: 'B2B' as BusinessType,
                    name: 'B2B 메뉴',
                    badge: '기업 간 거래',
                    badgeBg: '#fff7ed',
                    badgeFg: '#c2410c',
                    menuSummary: '견적서 관리, 계약 관리, 발주 관리, 세금계산서/수금 등',
                  },
                  {
                    type: 'B2C' as BusinessType,
                    name: 'B2C 메뉴',
                    badge: '일반 쇼핑몰',
                    badgeBg: '#eff6ff',
                    badgeFg: '#2563eb',
                    menuSummary: '주문/배송 관리, 취소/반품/교환, 상품/재고, 쿠폰/프로모션 등',
                  },
                  {
                    type: 'C2C' as BusinessType,
                    name: 'C2C 메뉴',
                    badge: '개인 간 거래',
                    badgeBg: '#f5f3ff',
                    badgeFg: '#7c3aed',
                    menuSummary: '개인 거래 관리, 분쟁/조정, 판매자 검수, 판매대금 정산 등',
                  },
                ].map((info) => {
                  const isVisible = pendingBusiness.visibleTypes?.[info.type] !== false;
                  return (
                    <div
                      key={info.type}
                      className={`${styles.visibilityItem} ${
                        isVisible ? styles.visibilityItemVisible : styles.visibilityItemHidden
                      }`}
                    >
                      <div className={styles.visibilityItemInfo}>
                        <div className={styles.visibilityItemTop}>
                          <span className={styles.visibilityItemName}>{info.name}</span>
                          <span
                            className={styles.visibilityBadge}
                            style={{ backgroundColor: info.badgeBg, color: info.badgeFg }}
                          >
                            {info.badge}
                          </span>
                          <span
                            className={`${styles.statusChip} ${
                              isVisible ? styles.statusChipVisible : styles.statusChipHidden
                            }`}
                          >
                            {isVisible ? '메뉴 노출 중' : '메뉴 숨김 처리'}
                          </span>
                        </div>
                        <div className={styles.visibilityItemDetails}>
                          <span className={styles.visibilityItemMenus}>
                            <strong>포함 메뉴:</strong> {info.menuSummary}
                          </span>
                        </div>
                      </div>

                      <div className={styles.visibilityItemAction}>
                        <button
                          type="button"
                          className={`${styles.toggleSwitch} ${
                            isVisible ? styles.toggleSwitchActive : ''
                          }`}
                          onClick={() => toggleVisibleType(info.type)}
                          aria-label={`${info.name} ${isVisible ? '숨기기' : '보이기'}`}
                          title={`${info.name} ${isVisible ? '숨기기' : '보이기'}`}
                        >
                          <span className={styles.toggleThumb} />
                        </button>
                        <span className={styles.toggleLabel}>
                          {isVisible ? '보이기' : '숨기기'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 경고 안내문 */}
            <div className={styles.warningAlert}>
              <AlertCircle size={18} className={styles.warningAlertIcon} />
              <div>
                <strong>비즈니스 모드를 변경하면 일부 메뉴 및 화면 구성이 변경될 수 있습니다.</strong>
                <br />
                모드 변경은 서비스 전반에 미치는 영향이 크므로, 하단의 <strong>[저장]</strong>{' '}
                버튼을 클릭해야 시스템에 최종 반영됩니다.
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 2. 화면 설정 섹션 */}
          {/* ============================================================ */}
          <section className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionNum}>2</span>
                화면 설정
              </h2>
              <p className={styles.sectionDesc}>
                글자 크기, 화면 모드, 테마 색상 등 관리자 개인 환경을 설정합니다.
              </p>
            </div>

            <div className={styles.displayGrid}>
            {/* 1. 화면 크기 카드 */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleArea}>
                  <h3 className={styles.cardTitle}>화면 크기</h3>
                  <p className={styles.cardDesc}>
                    기본 글자 크기를 변경하면 전체 UI의 글자와 여백이 함께 조정됩니다.
                  </p>
                </div>
                <span className={styles.cardBadge}>
                  {settings.fontSize}px / {currentRem}
                </span>
              </div>

              <div className={styles.sliderSection}>
                <div className={styles.sliderTrackArea}>
                  <div className={styles.sliderHintRow}>
                    <span>작게</span>
                    <span>크게</span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="18"
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => updateFontSize(Number(e.target.value))}
                    className={styles.rangeInput}
                    aria-label="기본 글자 크기 조절"
                  />
                  <div className={styles.scaleLabels}>
                    {FONT_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => updateFontSize(size)}
                        className={`${styles.scaleBtn} ${
                          settings.fontSize === size ? styles.scaleBtnActive : ''
                        }`}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.sizeInfoBox}>
                  <span className={styles.sizeInfoText}>현재 크기:</span>
                  <span className={styles.sizeInfoValue}>
                    {settings.fontSize}px / {currentRem}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. 화면 모드 카드 */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleArea}>
                  <h3 className={styles.cardTitle}>화면 모드</h3>
                  <p className={styles.cardDesc}>
                    서비스 기본 화면 모드를 설정합니다.
                  </p>
                </div>
              </div>

              <div className={styles.modeGrid}>
                {/* Light 모드 */}
                <button
                  type="button"
                  className={`${styles.modeOption} ${
                    settings.themeMode === 'light' ? styles.modeOptionActive : ''
                  }`}
                  onClick={() => updateThemeMode('light')}
                >
                  <div className={`${styles.modeIllustration} ${styles.lightIllust}`}>
                    <div
                      className={styles.illustBar}
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                    <div
                      className={styles.illustLine}
                      style={{ backgroundColor: '#e2e4ec' }}
                    />
                    <div
                      className={styles.illustLine}
                      style={{ backgroundColor: '#cbd0df', width: '50%' }}
                    />
                  </div>
                  <span className={styles.modeOptionTitle}>
                    <Sun size={15} /> Light
                  </span>
                </button>

                {/* Dark 모드 */}
                <button
                  type="button"
                  className={`${styles.modeOption} ${
                    settings.themeMode === 'dark' ? styles.modeOptionActive : ''
                  }`}
                  onClick={() => updateThemeMode('dark')}
                >
                  <div className={`${styles.modeIllustration} ${styles.darkIllust}`}>
                    <div
                      className={styles.illustBar}
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                    <div
                      className={styles.illustLine}
                      style={{ backgroundColor: '#2c2e33' }}
                    />
                    <div
                      className={styles.illustLine}
                      style={{ backgroundColor: '#373a40', width: '50%' }}
                    />
                  </div>
                  <span className={styles.modeOptionTitle}>
                    <Moon size={15} /> Dark
                  </span>
                </button>

                {/* System 모드 */}
                <button
                  type="button"
                  className={`${styles.modeOption} ${
                    settings.themeMode === 'system' ? styles.modeOptionActive : ''
                  }`}
                  onClick={() => updateThemeMode('system')}
                >
                  <div className={`${styles.modeIllustration} ${styles.systemIllust}`}>
                    <div
                      className={styles.illustBar}
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                    <div
                      className={styles.illustLine}
                      style={{ backgroundColor: '#909296' }}
                    />
                    <div
                      className={styles.illustLine}
                      style={{ backgroundColor: '#909296', width: '50%' }}
                    />
                  </div>
                  <span className={styles.modeOptionTitle}>
                    <Laptop size={15} /> System
                  </span>
                </button>
              </div>
            </div>

            {/* 3. 테마 색상 카드 */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleArea}>
                  <h3 className={styles.cardTitle}>테마 색상</h3>
                  <p className={styles.cardDesc}>
                    버튼, 선택 상태, 링크 등 주요 UI에 적용되는 색상을 설정합니다.
                  </p>
                </div>
              </div>

              <div className={styles.colorSection}>
                {/* 색상 스와치 목록 */}
                <div className={styles.colorSwatches}>
                  {COLOR_PRESETS.map((preset) => {
                    const isActive =
                      settings.primaryColor.toLowerCase() === preset.color.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`${styles.colorBtn} ${
                          isActive ? styles.colorBtnActive : ''
                        }`}
                        style={{ backgroundColor: preset.color }}
                        onClick={() => updatePrimaryColor(preset.color)}
                        title={preset.name}
                      >
                        {isActive && <Check size={16} strokeWidth={3} />}
                      </button>
                    );
                  })}

                  {/* Custom 색상 선택기 */}
                  <div className={styles.customColorArea}>
                    <button
                      type="button"
                      className={`${styles.customColorBtn} ${
                        !isPresetColor ? styles.customColorBtnActive : ''
                      }`}
                      onClick={() => colorPickerRef.current?.click()}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: !isPresetColor
                            ? settings.primaryColor
                            : '#9ca3af',
                          display: 'inline-block',
                        }}
                      />
                      Custom
                    </button>
                    <input
                      ref={colorPickerRef}
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updatePrimaryColor(e.target.value)}
                      className={styles.colorPickerInput}
                      aria-label="사용자 지정 테마 색상 선택"
                    />
                  </div>
                </div>

                {/* 카드 내부 실제 적용 예시 (미리보기) */}
                <div className={styles.inlinePreviewBox}>
                  <span className={styles.inlinePreviewLabel}>미리보기</span>
                  <div className={styles.inlinePreviewRow}>
                    <button type="button" className={styles.samplePrimaryBtn}>
                      Primary Button
                    </button>
                    <button type="button" className={styles.sampleSecondaryBtn}>
                      Secondary
                    </button>
                    <label className={styles.sampleCheckboxLabel}>
                      <input
                        type="checkbox"
                        defaultChecked
                        className={styles.sampleCheckbox}
                      />
                      체크박스
                    </label>
                    <span className={styles.sampleSelectedMenu}>선택된 메뉴</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </section>

        </div>

        {/* 우측 실시간 미리보기 (Live Dashboard Preview) */}
        <aside className={styles.previewColumn}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>실시간 미리보기</span>
            <span className={styles.liveTag}>
              <span className={styles.liveDot} />
              LIVE
            </span>
          </div>

          <div className={styles.previewCard}>
            {/* 미니 대시보드 상단 */}
            <div className={styles.previewMockTop}>
              <div className={styles.mockBrand}>
                <div className={styles.mockLogo}>
                  {pendingBusiness.activeMode === 'ALL'
                    ? 'All'
                    : pendingBusiness.activeMode}
                </div>
                <span className={styles.mockTitle}>{mockData.title}</span>
              </div>
              <span className={styles.mockBadge}>{mockData.badge}</span>
            </div>

            {/* 미니 KPI 카드 */}
            <div className={styles.mockKpiRow}>
              <div className={styles.mockKpiCard}>
                <span className={styles.mockKpiLabel}>{mockData.kpi1Label}</span>
                <span className={styles.mockKpiValue}>{mockData.kpi1Val}</span>
                <span className={styles.mockKpiDelta}>
                  <TrendingUp size={11} style={{ display: 'inline', marginRight: 2 }} />
                  {mockData.kpi1Delta}
                </span>
              </div>
              <div className={styles.mockKpiCard}>
                <span className={styles.mockKpiLabel}>{mockData.kpi2Label}</span>
                <span className={styles.mockKpiValue}>{mockData.kpi2Val}</span>
                <span className={styles.mockKpiDelta}>
                  <TrendingUp size={11} style={{ display: 'inline', marginRight: 2 }} />
                  {mockData.kpi2Delta}
                </span>
              </div>
            </div>

            {/* 미니 테이블/목록 */}
            <div className={styles.mockTable}>
              <div className={styles.mockTableHeader}>
                <span>구분 / 대상</span>
                <span>상태</span>
              </div>
              <div className={`${styles.mockTableRow} ${styles.mockTableRowSelected}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className={styles.sampleCheckbox}
                  />
                  <span>{mockData.row1Name}</span>
                </div>
                <span
                  className={styles.mockStatusPill}
                  style={{
                    backgroundColor: 'var(--common-primary)',
                    color: '#ffffff',
                  }}
                >
                  {mockData.row1Status}
                </span>
              </div>
              <div className={styles.mockTableRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={false}
                    readOnly
                    className={styles.sampleCheckbox}
                  />
                  <span>{mockData.row2Name}</span>
                </div>
                <span
                  className={styles.mockStatusPill}
                  style={{
                    backgroundColor: 'var(--common-bg-subtle)',
                    color: 'var(--common-text-sub)',
                    border: '1px solid var(--common-border)',
                  }}
                >
                  {mockData.row2Status}
                </span>
              </div>
            </div>

            <div className={styles.previewFooterNote}>
              선택한 비즈니스 모드와 화면 설정(글자 크기, 모드, 테마)이 전체 백오피스에 연동되어 표시됩니다.
            </div>
          </div>
        </aside>
      </div>

      {/* 토스트 알림 메시지 */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
