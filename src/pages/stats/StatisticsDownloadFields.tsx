import type { ReactNode } from 'react';
import { CommonCheckbox } from '../../components/common';

export interface StatisticsDownloadField {
  key: string;
  label: ReactNode;
}

interface StatisticsDownloadFieldsProps {
  className?: string;
  fields: readonly StatisticsDownloadField[];
  selected: ReadonlySet<string>;
  onChange: (selected: Set<string>) => void;
}

export function StatisticsDownloadFields({ className, fields, selected, onChange }: StatisticsDownloadFieldsProps) {
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  return (
    <div className={className}>
      <strong>포함 항목</strong>
      {fields.map((field) => (
        <CommonCheckbox key={field.key} size="sm" checked={selected.has(field.key)} onChange={() => toggle(field.key)}>
          {field.label}
        </CommonCheckbox>
      ))}
    </div>
  );
}
