import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import styles from './SearchField.module.css';

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
  shortcutHint?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onValueChange, shortcutHint, className, ...inputProps },
  ref,
) {
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <Search className={styles.icon} size={15} strokeWidth={1.8} aria-hidden="true" />
      <input
        {...inputProps}
        ref={ref}
        type="search"
        className={styles.input}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {shortcutHint && <span className={styles.shortcut} aria-hidden="true">{shortcutHint}</span>}
    </div>
  );
});
