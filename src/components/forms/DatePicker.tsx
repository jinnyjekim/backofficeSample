import { forwardRef, useImperativeHandle, useRef, type InputHTMLAttributes } from 'react';
import { CalendarDays } from 'lucide-react';
import styles from './DatePicker.module.css';

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  controlSize?: 'sm' | 'md';
  mode?: 'date' | 'datetime-local';
  invalid?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { className = '', controlSize = 'md', mode = 'date', disabled, invalid = false, style, ...inputProps },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  const openPicker = () => {
    if (disabled) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if ('showPicker' in input) input.showPicker();
  };

  return (
    <span
      className={`${styles.root} ${controlSize === 'sm' ? styles.small : ''} ${mode === 'datetime-local' ? styles.dateTime : ''} ${invalid ? styles.invalid : ''} ${disabled ? styles.disabled : ''} ${className}`}
      style={style}
    >
      <input ref={inputRef} type={mode} className={styles.input} disabled={disabled} aria-invalid={invalid || undefined} {...inputProps} />
      <button
        type="button"
        className={styles.iconButton}
        onClick={openPicker}
        disabled={disabled}
        tabIndex={-1}
        aria-label="날짜 선택 달력 열기"
      >
        <CalendarDays size={15} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </span>
  );
});
