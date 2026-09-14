export type BusinessType = 'B2C' | 'C2C' | 'B2B';
export type BusinessScope = '통합' | BusinessType;
export type ConfigScope = '공통' | BusinessType;
export type ConfigScopeFilter = '통합' | ConfigScope;

export const BUSINESS_TYPES: BusinessType[] = ['B2C', 'C2C', 'B2B'];
export const BUSINESS_SCOPES: BusinessScope[] = ['통합', ...BUSINESS_TYPES];
export const CONFIG_SCOPES: ConfigScope[] = ['공통', ...BUSINESS_TYPES];
export const CONFIG_SCOPE_FILTERS: ConfigScopeFilter[] = ['통합', ...CONFIG_SCOPES];

export const BUSINESS_BADGE_META: Record<BusinessType, { bg: string; fg: string }> = {
  B2C: { bg: '#eff6ff', fg: '#2563eb' },
  C2C: { bg: '#f5f3ff', fg: '#7c3aed' },
  B2B: { bg: '#fff7ed', fg: '#c2410c' },
};

export const CONFIG_SCOPE_BADGE_META: Record<ConfigScope, { bg: string; fg: string }> = {
  공통: { bg: '#f4f4f5', fg: '#52525b' },
  ...BUSINESS_BADGE_META,
};

export function matchesConfigScope(scopes: readonly ConfigScope[], filter: ConfigScopeFilter): boolean {
  return filter === '통합' || scopes.includes(filter);
}

// ==========================================
// 시스템 설정: 비즈니스 운영 모드 및 메뉴 가시성 관리
// ==========================================
export type OperationalMode = 'ALL' | BusinessType;

export interface BusinessSettings {
  activeMode: OperationalMode; // 'ALL' | 'B2C' | 'C2C' | 'B2B'
  enabledModes: BusinessType[]; // ['B2B', 'B2C', 'C2C']
  visibleTypes: Record<BusinessType, boolean>; // B2B, B2C, C2C 각각 메뉴 숨기기/보이기 설정
}

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  activeMode: 'ALL',
  enabledModes: ['B2B', 'B2C', 'C2C'],
  visibleTypes: {
    B2B: true,
    B2C: true,
    C2C: true,
  },
};

/**
 * 운영 모드(activeMode) 선택 시 자동으로 해당 모드에 맞는 메뉴 가시성(visibleTypes)을 계산합니다.
 * - 통합 모드('ALL'): 모든 비즈니스 타입(B2B, B2C, C2C) 메뉴 활성화
 * - 특정 비즈니스 모드('B2B' | 'B2C' | 'C2C'): 해당 비즈니스 모드만 활성화, 나머지는 비활성화
 */
export function getVisibleTypesForMode(mode: OperationalMode): Record<BusinessType, boolean> {
  if (mode === 'ALL') {
    return { B2B: true, B2C: true, C2C: true };
  }
  return {
    B2B: mode === 'B2B',
    B2C: mode === 'B2C',
    C2C: mode === 'C2C',
  };
}

export interface BusinessModeInfo {
  mode: OperationalMode;
  title: string;
  badge: string;
  summary: string;
  features: string[];
}

export const BUSINESS_MODE_CARDS: BusinessModeInfo[] = [
  {
    mode: 'ALL',
    title: '통합 모드',
    badge: '전체 운영',
    summary: 'B2B · B2C · C2C 전체 기능 및 모든 메뉴 활성화',
    features: ['모든 관리 메뉴 및 LNB 전체 노출', '기업/쇼핑몰/개인간 거래 통합 관리'],
  },
  {
    mode: 'B2B',
    title: 'B2B 모드',
    badge: '기업 간 거래',
    summary: '거래처, 견적, 계약, 수금 중심의 기업간 상거래 특화',
    features: ['거래처별 단가 및 최소 주문수량 관리', '견적서 승인, 계약서 및 세금계산서 발주'],
  },
  {
    mode: 'B2C',
    title: 'B2C 모드',
    badge: '쇼핑몰',
    summary: '주문, 배송, 재고, 쿠폰 중심의 일반 소비자 커머스',
    features: ['주문/배송/송장 및 취소/반품/교환 관리', '프로모션, 쿠폰 발급 및 포인트 정책'],
  },
  {
    mode: 'C2C',
    title: 'C2C 모드',
    badge: '개인 간 거래',
    summary: '판매자/구매자, 거래, 정산 중심의 중고 및 마켓플레이스',
    features: ['판매자/구매자 활동 및 상품 검수', '거래 취소/분쟁 관리 및 판매대금 정산'],
  },
];

const BUSINESS_STORAGE_KEY = 'admin_business_settings';

export function loadBusinessSettings(): BusinessSettings {
  if (typeof window === 'undefined') return DEFAULT_BUSINESS_SETTINGS;
  try {
    const raw = localStorage.getItem(BUSINESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        activeMode: ['ALL', 'B2C', 'C2C', 'B2B'].includes(parsed.activeMode)
          ? parsed.activeMode
          : DEFAULT_BUSINESS_SETTINGS.activeMode,
        enabledModes: Array.isArray(parsed.enabledModes) && parsed.enabledModes.length > 0
          ? parsed.enabledModes
          : DEFAULT_BUSINESS_SETTINGS.enabledModes,
        visibleTypes: {
          B2B: typeof parsed.visibleTypes?.B2B === 'boolean' ? parsed.visibleTypes.B2B : true,
          B2C: typeof parsed.visibleTypes?.B2C === 'boolean' ? parsed.visibleTypes.B2C : true,
          C2C: typeof parsed.visibleTypes?.C2C === 'boolean' ? parsed.visibleTypes.C2C : true,
        },
      };
    }
  } catch {
    // 파싱 에러 무시
  }
  return DEFAULT_BUSINESS_SETTINGS;
}

export function saveBusinessSettings(settings: BusinessSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('admin_business_mode_change', { detail: settings }));
  } catch {
    // 저장 에러 무시
  }
}
