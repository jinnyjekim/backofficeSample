import { forwardRef, type InputHTMLAttributes } from 'react';
import { CommonInput } from '../common/CommonControls';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'size' | 'onToggle' | 'prefix'> {
  value: string;
  onValueChange: (value: string) => void;
  shortcutHint?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onValueChange, shortcutHint, className, ...inputProps },
  ref,
) {
  return (
    <CommonInput.Search
      {...inputProps}
      ref={ref}
      className={`${styles.field} ${className ?? ''}`}
      value={value}
      clearable={false}
      suffix={shortcutHint ? <span className={styles.shortcut} aria-hidden="true">{shortcutHint}</span> : undefined}
      onChange={(event) => onValueChange(event.target.value)}
    />
  );
});
