import { forwardRef, useImperativeHandle, useRef, type InputHTMLAttributes } from 'react';
import { CalendarDays, Clock3, X } from 'lucide-react';
import { type CommonClassNames, type CommonSize } from './CommonControls';
import styles from './common.module.css';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const classNameOf = (value: CommonClassNames | undefined, key: 'root' | 'control' | 'error' = 'root') =>
  typeof value === 'string' ? (key === 'root' ? value : '') : value?.[key] ?? '';

export type CommonDateValue = string | null;
export type CommonDateRangeValue = [CommonDateValue, CommonDateValue];

interface DatePickerBaseProps {
  mode?: 'single' | 'range';
  value?: CommonDateValue | CommonDateRangeValue;
  defaultValue?: CommonDateValue | CommonDateRangeValue;
  onChange?: (value: CommonDateValue | CommonDateRangeValue) => void;
  format?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'YYYY년 MM월 DD일' | 'YYYY.MM.DD' | string;
  placeholder?: string | [string, string];
  minDate?: string;
  maxDate?: string;
  showTime?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: boolean | string;
  size?: CommonSize;
  showMonthPicker?: boolean;
  showYearPicker?: boolean;
  showTodayDot?: boolean;
  showWeekend?: boolean;
  name?: string;
  required?: boolean;
  className?: string;
  classNames?: CommonClassNames;
}

export type CommonDatePickerProps = DatePickerBaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'size' | 'type' | 'placeholder' | 'min' | 'max'>;

export const CommonDatePicker = forwardRef<HTMLInputElement, CommonDatePickerProps>(function CommonDatePicker({
  mode = 'single',
  value,
  defaultValue,
  onChange,
  format = 'YYYY-MM-DD',
  placeholder = '날짜를 선택해주세요',
  minDate,
  maxDate,
  showTime = false,
  clearable = true,
  disabled = false,
  error = false,
  size = 'md',
  showMonthPicker = false,
  showYearPicker = false,
  showTodayDot = false,
  showWeekend = true,
  name,
  className,
  classNames,
  ...props
}, forwardedRef) {
  const startRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => startRef.current as HTMLInputElement);
  const rangeValue = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [null, null];
  const singleValue = Array.isArray(value) ? '' : value ?? (Array.isArray(defaultValue) ? '' : defaultValue ?? '');
  const inputType = showTime ? 'datetime-local' : showMonthPicker || showYearPicker ? 'month' : 'date';
  const placeholderOf = (index: number) => Array.isArray(placeholder) ? placeholder[index] : placeholder;
  const open = (ref: { current: HTMLInputElement | null }) => {
    if (disabled) return;
    ref.current?.focus();
    ref.current?.showPicker?.();
  };
  const changeRange = (index: number, next: string) => {
    const current: CommonDateRangeValue = [rangeValue[0] ?? null, rangeValue[1] ?? null];
    current[index] = next || null;
    onChange?.(current);
  };
  const dateInput = (index: 0 | 1, inputRef: React.RefObject<HTMLInputElement | null>) => {
    const current = mode === 'range' ? rangeValue[index] ?? '' : singleValue;
    return (
      <span className={cx(styles.dateInput, styles[`size_${size}`], error && styles.error, disabled && styles.disabled, classNameOf(classNames, 'control'))}>
        <input
          {...props}
          ref={inputRef}
          type={inputType}
          name={mode === 'range' ? `${name ?? 'date'}${index === 0 ? 'From' : 'To'}` : name}
          value={value === undefined ? undefined : current}
          defaultValue={value === undefined ? String(current ?? '') : undefined}
          min={minDate}
          max={maxDate}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-label={placeholderOf(index)}
          onChange={(event) => mode === 'range' ? changeRange(index, event.target.value) : onChange?.(event.target.value || null)}
        />
        {clearable && current && !disabled && <button type="button" aria-label="날짜 지우기" onClick={() => mode === 'range' ? changeRange(index, '') : onChange?.(null)}><X size={13} /></button>}
        <button type="button" aria-label="달력 열기" disabled={disabled} onClick={() => open(inputRef)}><CalendarDays size={15} /></button>
      </span>
    );
  };
  const endRef = useRef<HTMLInputElement>(null);
  return (
    <span className={cx(styles.datePickerWrap, mode === 'range' && styles.dateRange, classNameOf(classNames), className)} data-format={format} data-today-dot={showTodayDot || undefined} data-show-weekend={showWeekend}>
      {dateInput(0, startRef)}
      {mode === 'range' && <><span className={styles.rangeSeparator}>–</span>{dateInput(1, endRef)}</>}
      {typeof error === 'string' && <span className={cx(styles.errorText, classNameOf(classNames, 'error'))}>{error}</span>}
    </span>
  );
});

export interface CommonTimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  format?: 'HH:mm' | 'hh:mm a' | string;
  minuteStep?: number;
  clearable?: boolean;
  error?: boolean | string;
  size?: CommonSize;
  classNames?: CommonClassNames;
}

export const CommonTimePicker = forwardRef<HTMLInputElement, CommonTimePickerProps>(function CommonTimePicker({ value, onChange, minuteStep = 1, clearable = true, error = false, size = 'md', disabled, className, classNames, ...props }, forwardedRef) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);
  return <span className={cx(styles.datePickerWrap, classNameOf(classNames), className)}><span className={cx(styles.dateInput, styles[`size_${size}`], error && styles.error, disabled && styles.disabled, classNameOf(classNames, 'control'))}><input {...props} ref={inputRef} type="time" value={value} step={minuteStep * 60} disabled={disabled} aria-invalid={Boolean(error) || undefined} onChange={(event) => onChange?.(event.target.value)} />{clearable && value && !disabled && <button type="button" aria-label="시간 지우기" onClick={() => onChange?.('')}><X size={13} /></button>}<button type="button" aria-label="시간 선택 열기" disabled={disabled} onClick={() => { inputRef.current?.focus(); inputRef.current?.showPicker?.(); }}><Clock3 size={15} /></button></span>{typeof error === 'string' && <span className={cx(styles.errorText, classNameOf(classNames, 'error'))}>{error}</span>}</span>;
});
