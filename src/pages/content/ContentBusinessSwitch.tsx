import styles from './ContentBusinessSwitch.module.css';
import type { ContentBusinessType, ContentTaxonomyScope } from './contentBusiness';

interface Props<T extends ContentTaxonomyScope> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  note?: string;
  label?: string;
}

export function ContentBusinessSwitch<T extends ContentTaxonomyScope>({ value, options, onChange, note, label = '콘텐츠 범위' }: Props<T>) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <div className={styles.toggle}>
        {options.map((option) => (
          <button key={option} type="button" className={`${styles.button} ${value === option ? styles.active : ''}`} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
      {note && <span className={styles.note}>{note}</span>}
    </div>
  );
}

export type { ContentBusinessType };
