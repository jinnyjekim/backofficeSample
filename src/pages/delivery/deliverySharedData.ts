export interface Memo {
  when: string;
  by: string;
  text: string;
}

export interface HistoryEntry {
  when: string;
  title: string;
  by?: string;
}

export interface TrackingEntry {
  title: string;
  when: string;
  loc?: string | null;
  source: string;
  dot: string;
}

export interface FieldRow {
  label: string;
  value: string;
  weight?: number;
  color?: string;
}

export interface Sibling {
  id: string;
  item: string;
  status: string;
  fg: string;
}

export interface TabDef {
  key: string;
  label: string;
  weight: number;
  fg: string;
  mark: string;
  pick: () => void;
}

export function buildTabs(defs: [string, string][], activeTab: string, setActiveTab: (tab: string) => void): TabDef[] {
  return defs.map(([key, label]) => {
    const active = activeTab === key;
    return {
      key,
      label,
      weight: active ? 700 : 500,
      fg: active ? '#18181b' : '#8b8b93',
      mark: active ? 'inset 0 -2px 0 var(--accent)' : 'none',
      pick: () => setActiveTab(key),
    };
  });
}

export function quickFilterStyle(active: boolean): { bg: string; fg: string; border: string } {
  return {
    bg: active ? 'var(--accent)' : '#fff',
    fg: active ? '#fff' : '#3f3f46',
    border: active ? 'var(--accent)' : 'rgba(0,0,0,.1)',
  };
}
