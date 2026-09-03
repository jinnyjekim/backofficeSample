import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from 'react';
import { DatePicker as M2MDatePicker, type DatePickerValue } from 'm2m-uiux-react/DatePicker';
import styles from './DatePicker.module.css';

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  controlSize?: 'sm' | 'md';
  mode?: 'date' | 'datetime-local';
  invalid?: boolean;
}

const pad = (value: number) => String(value).padStart(2, '0');

function parseDate(value: string | number | readonly string[] | undefined) {
  if (typeof value !== 'string' || !value) return null;
  const normalized = value.includes('T') ? value : `${value}T00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date | null, mode: DatePickerProps['mode']) {
  if (!date) return '';
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return mode === 'datetime-local' ? `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

function changeEvent(value: string) {
  return { target: { value }, currentTarget: { value } } as ChangeEvent<HTMLInputElement>;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    className = '',
    controlSize = 'md',
    mode = 'date',
    disabled,
    invalid = false,
    style,
    value,
    defaultValue,
    onChange,
    min,
    max,
    name,
    id,
    placeholder,
    required,
    'aria-label': ariaLabel,
  },
  forwardedRef,
) {
  const controlled = value !== undefined;
  const current = parseDate(controlled ? value : defaultValue);
  const serialized = typeof value === 'string' ? value : formatDate(current, mode);

  const handleChange = (next: DatePickerValue) => {
    const date = next instanceof Date ? next : null;
    onChange?.(changeEvent(formatDate(date, mode)));
  };

  return (
    <span
      className={`${styles.root} ${controlSize === 'sm' ? styles.small : ''} ${mode === 'datetime-local' ? styles.dateTime : ''} ${invalid ? styles.invalid : ''} ${disabled ? styles.disabled : ''} ${className}`}
      style={style}
      aria-label={ariaLabel}
    >
      <input ref={forwardedRef} type="hidden" name={name} value={serialized} required={required} disabled={disabled} readOnly />
      <M2MDatePicker
        mode="single"
        value={controlled ? current : undefined}
        defaultValue={controlled ? undefined : current}
        onChange={handleChange}
        format="YYYY-MM-DD"
        placeholder={placeholder}
        minDate={parseDate(min) ?? undefined}
        maxDate={parseDate(max) ?? undefined}
        showTime={mode === 'datetime-local'}
        clearable={false}
        disabled={disabled}
        error={invalid}
        id={id}
        classNames={styles.packagePicker}
      />
    </span>
  );
});
