import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { SearchField as M2MSearchField } from 'm2m-uiux-react/SearchField';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onToggle' | 'prefix'> {
  value?: string;
  onValueChange?: (value: string) => void;
  shortcutHint?: string;
  size?: 'sm' | 'md' | 'lg';
  onSearch?: (value: string) => void;
  clearable?: boolean;
  fullWidth?: boolean;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    value,
    defaultValue,
    onChange,
    onValueChange,
    shortcutHint,
    className,
    size = 'md',
    onSearch,
    clearable = false,
    fullWidth = false,
    ...inputProps
  },
  ref,
) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  return (
    <span className={`${styles.field} ${fullWidth ? styles.fullWidth : ''} ${className ?? ''}`}>
      <M2MSearchField
        {...inputProps}
        ref={ref}
        size={size}
        value={value}
        defaultValue={defaultValue}
        clearable={clearable}
        onSearch={onSearch}
        classNames={styles.control}
        onChange={handleChange}
      />
      {shortcutHint && <span className={styles.shortcut} aria-hidden="true">{shortcutHint}</span>}
    </span>
  );
});

export const CommonSearchField = SearchField;
export const SearchFilter = SearchField;
export const CommonSearchFilter = SearchField;
export type SearchFilterProps = SearchFieldProps;
export type CommonSearchFilterProps = SearchFieldProps;

export type CommonSearchFieldProps = SearchFieldProps;
