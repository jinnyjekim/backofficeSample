import styles from './BusinessScopeSwitch.module.css';

interface Props<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label?: string;
  note?: string;
}

export function BusinessScopeSwitch<T extends string>({ value, options, onChange, label = '비즈니스 범위', note }: Props<T>) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <div className={styles.toggle} role="group" aria-label={label}>
        {options.map((option) => (
          <button key={option} type="button" className={`${styles.button} ${value === option ? styles.active : ''}`} aria-pressed={value === option} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
      {note && <span className={styles.note}>{note}</span>}
    </div>
  );
}
