import { CommonButton, CommonButtonGroup } from '../common';
import styles from './BusinessScopeSwitch.module.css';

interface Props<T extends string> {
  value?: T;
  options: readonly T[];
  onChange: (value: T) => void;
  label?: string;
  note?: string;
  size?: 'sm' | 'md';
}

export function BusinessScopeSwitch<T extends string>({ value, options, onChange, label = '비즈니스 범위', note, size = 'sm' }: Props<T>) {
  return (
    <div className={`${styles.wrap} ${size === 'md' ? styles.sizeMd : ''}`}>
      {label && <span className={styles.label}>{label}</span>}
      <CommonButtonGroup attached size={size} className={styles.toggle}>
        {options.map((option) => (
          <CommonButton key={option} variant="none" size={size} className={`${styles.button} ${value === option ? styles.active : ''}`} aria-pressed={value === option} onClick={() => onChange(option)}>
            {option}
          </CommonButton>
        ))}
      </CommonButtonGroup>
      {note && <span className={styles.note}>{note}</span>}
    </div>
  );
}
