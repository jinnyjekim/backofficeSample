import { useEffect, useState, useCallback } from 'react';

// ==========================================
// 기존 테마 및 유틸리티 상수 / 함수 (완전 보존)
// ==========================================
export const ACCENT = 'oklch(0.52 0.16 258)';
export const ACCENT_HOVER = 'oklch(0.46 0.16 258)';

export const GREEN = 'oklch(0.65 0.15 155)';
export const GREEN_STRONG = 'oklch(0.55 0.14 155)';
export const RED = 'oklch(0.58 0.19 25)';
export const AMBER = 'oklch(0.78 0.14 70)';

export const AV: Array<[string, string]> = [
  ['#eef2ff', '#4f46e5'],
  ['#ecfdf5', '#059669'],
  ['#fef3c7', '#b45309'],
  ['#fae8ff', '#a21caf'],
  ['#e0f2fe', '#0369a1'],
  ['#fee2e2', '#b91c1c'],
];

export function avatarColors(id: number): [string, string] {
  return AV[id % AV.length];
}

export type MemberStatus = '정상' | '정지' | '휴면' | '탈퇴';

export const STATUS_STYLE: Record<MemberStatus, { fg: string; dot: string }> = {
  정상: { fg: '#3f3f46', dot: GREEN },
  정지: { fg: '#b91c1c', dot: RED },
  휴면: { fg: '#b45309', dot: AMBER },
  탈퇴: { fg: '#a1a1aa', dot: '#d4d4d8' },
};

export function formatNumber(x: number): string {
  return x.toLocaleString('ko-KR');
}

export function formatWon(x: number): string {
  return x.toLocaleString('ko-KR') + '원';
}

// ==========================================
// 시스템 설정 > 화면 설정 (신규 전역 테마 관리)
// ==========================================
export type ThemeMode = 'light' | 'dark' | 'system';

export interface DisplaySettings {
  fontSize: number; // 14, 15, 16, 17, 18
  themeMode: ThemeMode;
  primaryColor: string; // hex
}

export interface ColorPreset {
  id: string;
  name: string;
  color: string;
  hover: string;
  light: string;
  border: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'black',
    name: 'Black',
    color: '#18181b',
    hover: '#000000',
    light: '#f4f4f5',
    border: '#d4d4d8',
  },
  {
    id: 'indigo',
    name: 'Indigo',
    color: '#4f46e5',
    hover: '#4338ca',
    light: '#eef2ff',
    border: '#c7d2fe',
  },
  {
    id: 'purple',
    name: 'Purple',
    color: '#7c3aed',
    hover: '#6d28d9',
    light: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    id: 'green',
    name: 'Green',
    color: '#059669',
    hover: '#047857',
    light: '#ecfdf5',
    border: '#a7f3d0',
  },
  {
    id: 'orange',
    name: 'Orange',
    color: '#ea580c',
    hover: '#c2410c',
    light: '#fff7ed',
    border: '#fed7aa',
  },
  {
    id: 'red',
    name: 'Red',
    color: '#dc2626',
    hover: '#b91c1c',
    light: '#fef2f2',
    border: '#fecaca',
  },
];

export const DEFAULT_SETTINGS: DisplaySettings = {
  fontSize: 16,
  themeMode: 'light',
  primaryColor: '#18181b',
};

const STORAGE_KEY = 'admin_display_settings';

/**
 * 16진수 색상 코드를 RGB 숫자로 변환
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 24, g: 24, b: 27 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * 색상 밝기 조정 (호버, 연한 배경색, 보더 생성용)
 */
function adjustColor(r: number, g: number, b: number, percent: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const nr = clamp(r + (255 - r) * percent);
  const ng = clamp(g + (255 - g) * percent);
  const nb = clamp(b + (255 - b) * percent);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

function darkenColor(r: number, g: number, b: number, factor: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}

/**
 * 전역 HTML 루트 및 CSS 변수에 화면 설정 적용
 */
export function applyDisplaySettings(settings: DisplaySettings) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 브라우저 바깥 영역은 고정하고 각 페이지의 내부 컨테이너에서만 스크롤합니다.
  root.style.overflow = 'hidden';

  // 1. 글자 크기 (기본 rem 단위 스케일링)
  root.style.fontSize = `${settings.fontSize}px`;

  // 2. 화면 모드 (Light / Dark / System)
  let resolvedTheme = settings.themeMode;
  if (settings.themeMode === 'system') {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    resolvedTheme = prefersDark ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', resolvedTheme);

  // 3. 테마 색상 (프리셋 또는 Custom 색상)
  const preset = COLOR_PRESETS.find((p) => p.color.toLowerCase() === settings.primaryColor.toLowerCase());

  let mainColor = settings.primaryColor;
  let hoverColor = '';
  let lightColor = '';
  let borderColor = '';

  if (preset) {
    mainColor = preset.color;
    hoverColor = preset.hover;
    lightColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : preset.light;
    borderColor = resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : preset.border;
  } else {
    const { r, g, b } = hexToRgb(settings.primaryColor);
    hoverColor = darkenColor(r, g, b, 0.85);
    lightColor = resolvedTheme === 'dark' ? `rgba(${r}, ${g}, ${b}, 0.18)` : adjustColor(r, g, b, 0.9);
    borderColor = resolvedTheme === 'dark' ? `rgba(${r}, ${g}, ${b}, 0.35)` : adjustColor(r, g, b, 0.7);
  }

  root.style.setProperty('--accent', mainColor);
  root.style.setProperty('--accent-hover', hoverColor);
  root.style.setProperty('--common-primary', mainColor);
  root.style.setProperty('--common-primary-hover', hoverColor);
  root.style.setProperty('--common-primary-light', lightColor);
  root.style.setProperty('--common-primary-border', borderColor);

  root.style.setProperty('--m2m-pg-brand', mainColor);
  root.style.setProperty('--m2m-pg-brand-hover', hoverColor);
  root.style.setProperty('--m2m-pg-brand-active', hoverColor);
  root.style.setProperty('--m2m-pg-brand-light', lightColor);
  root.style.setProperty('--m2m-pg-brand-border', borderColor);
  root.style.setProperty('--m2m-pg-badge-bg', lightColor);
  root.style.setProperty('--m2m-pg-badge-color', mainColor);
  root.style.setProperty('--m2m-pg-badge-border', borderColor);
}

/**
 * 로컬 스토리지에서 저장된 설정 로드
 */
export function loadDisplaySettings(): DisplaySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : DEFAULT_SETTINGS.fontSize,
        themeMode: ['light', 'dark', 'system'].includes(parsed.themeMode) ? parsed.themeMode : DEFAULT_SETTINGS.themeMode,
        primaryColor: parsed.primaryColor || DEFAULT_SETTINGS.primaryColor,
      };
    }
  } catch {
    // 파싱 오류 무시
  }
  return DEFAULT_SETTINGS;
}

/**
 * 설정을 로컬 스토리지에 저장
 */
export function saveDisplaySettings(settings: DisplaySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장 오류 무시
  }
}

/**
 * 화면 설정 상태를 관리하는 React 훅
 */
export function useDisplayTheme() {
  const [settings, setSettings] = useState<DisplaySettings>(() => loadDisplaySettings());

  // 설정 변경 시 실시간 반영
  useEffect(() => {
    applyDisplaySettings(settings);

    // system 모드일 때 OS 다크모드 변경 리스너
    if (settings.themeMode === 'system' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyDisplaySettings(settings);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [settings]);

  const updateFontSize = useCallback((fontSize: number) => {
    setSettings((prev) => {
      const next = { ...prev, fontSize };
      saveDisplaySettings(next);
      return next;
    });
  }, []);

  const updateThemeMode = useCallback((themeMode: ThemeMode) => {
    setSettings((prev) => {
      const next = { ...prev, themeMode };
      saveDisplaySettings(next);
      return next;
    });
  }, []);

  const updatePrimaryColor = useCallback((primaryColor: string) => {
    setSettings((prev) => {
      const next = { ...prev, primaryColor };
      saveDisplaySettings(next);
      return next;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveDisplaySettings(DEFAULT_SETTINGS);
    applyDisplaySettings(DEFAULT_SETTINGS);
  }, []);

  const saveSettings = useCallback(() => {
    saveDisplaySettings(settings);
  }, [settings]);

  return {
    settings,
    updateFontSize,
    updateThemeMode,
    updatePrimaryColor,
    resetToDefault,
    saveSettings,
  };
}
