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
