import { forwardRef, type InputHTMLAttributes } from 'react';
import { SearchField as M2MSearchField } from 'm2m-uiux-react/SearchField';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'size' | 'onToggle' | 'prefix'> {
  value: string;
  onValueChange: (value: string) => void;
  shortcutHint?: string;
  size?: 'sm' | 'md' | 'lg';
  onSearch?: (value: string) => void;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onValueChange, shortcutHint, className, size = 'md', onSearch, ...inputProps },
  ref,
) {
  return (
    <span className={`${styles.field} ${className ?? ''}`}>
      <M2MSearchField
        {...inputProps}
        ref={ref}
        size={size}
        value={value}
        clearable={false}
        onSearch={onSearch}
        classNames={styles.control}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {shortcutHint && <span className={styles.shortcut} aria-hidden="true">{shortcutHint}</span>}
    </span>
  );
});
