import { forwardRef, type InputHTMLAttributes } from 'react';
import { DatePicker as M2MDatePicker, type DatePickerValue } from 'm2m-uiux-react/DatePicker';
import { TimePicker as M2MTimePicker } from 'm2m-uiux-react/TimePicker';
import { type CommonClassNames, type CommonSize } from './CommonControls';
import styles from './common.module.css';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const classNameOf = (value: CommonClassNames | undefined, key: 'root' | 'control' | 'error' = 'root') =>
  typeof value === 'string' ? (key === 'root' ? value : '') : value?.[key] ?? '';
const pad = (value: number) => String(value).padStart(2, '0');

export type CommonDateValue = string | null;
export type CommonDateRangeValue = [CommonDateValue, CommonDateValue];

function parseDate(value: CommonDateValue) {
  if (!value) return null;
  const normalized = value.includes('T') ? value : `${value}T00:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeDate(date: Date | null, showTime: boolean): CommonDateValue {
  if (!date) return null;
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return showTime ? `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

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
  mode = 'single', value, defaultValue, onChange, format = 'YYYY-MM-DD', placeholder = '날짜를 선택해주세요', minDate, maxDate,
  showTime = false, clearable = true, disabled = false, error = false, size = 'md', showMonthPicker = false, showYearPicker = false,
  showTodayDot = false, showWeekend = true, name, required, className, classNames, 'aria-label': ariaLabel,
}, forwardedRef) {
  const rangeValue = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [null, null];
  const singleValue = Array.isArray(value) ? null : value ?? (Array.isArray(defaultValue) ? null : defaultValue ?? null);
  const parsedSingle = parseDate(singleValue);
  const parsedRange = [parseDate(rangeValue[0]), parseDate(rangeValue[1])] as [Date | null, Date | null];
  // m2m-uiux-react DatePicker는 value=null 시 내부에서 .getFullYear()를 호출해 에러 발생.
  // null이면 undefined로 변환해 비제어 모드로 처리한다.
  // range 모드는 패키지 내부에서 range 배열을 단일 Date로 오인해 항상 .getFullYear()에서 터지므로
  // (value가 배열이면 항상 truthy라 controlled 분기를 못 피함), range는 절대 controlled로 넘기지 않고
  // key로 강제 리마운트해 defaultRange만으로 외부 값 변경(예: 필터 초기화)까지 반영한다.
  const controlled = mode === 'single' && value !== undefined && parsedSingle !== null;
  const packageValue = mode === 'range' ? parsedRange : parsedSingle;
  const hiddenValue = mode === 'range' ? rangeValue.filter(Boolean).join(' – ') : singleValue ?? '';
  const rangeRemountKey = mode === 'range' ? `${rangeValue[0] ?? ''}|${rangeValue[1] ?? ''}` : undefined;

  const handleChange = (next: DatePickerValue) => {
    if (mode === 'range') {
      const range = Array.isArray(next) ? next : [null, null];
      onChange?.([serializeDate(range[0], showTime), serializeDate(range[1], showTime)]);
    } else onChange?.(serializeDate(next instanceof Date ? next : null, showTime));
  };

  return (
    <span className={cx(styles.datePickerWrap, mode === 'range' && styles.dateRangeAdapter, styles[`datePicker_${size}`], classNameOf(classNames), className)} aria-label={ariaLabel}>
      <input ref={forwardedRef} type="hidden" name={name} value={hiddenValue} required={required} disabled={disabled} readOnly />
      <M2MDatePicker
        key={rangeRemountKey}
        mode={mode}
        value={controlled ? (packageValue as Date) : undefined}
        defaultValue={!controlled && mode === 'single' ? (parsedSingle ?? undefined) : undefined}
        defaultRange={mode === 'range' ? parsedRange : undefined}
        onChange={handleChange}
        format={showTime ? 'YYYY-MM-DD HH:mm' : format}
        placeholder={placeholder}
        minDate={parseDate(minDate ?? null) ?? undefined}
        maxDate={parseDate(maxDate ?? null) ?? undefined}
        showTime={showTime}
        clearable={clearable}
        disabled={disabled}
        error={error}
        showMonthPicker={showMonthPicker}
        showYearPicker={showYearPicker}
        showTodayDot={showTodayDot}
        showWeekend={showWeekend}
        classNames={cx(styles.datePickerAdapter, classNameOf(classNames, 'control'))}
      />
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

export const CommonTimePicker = forwardRef<HTMLInputElement, CommonTimePickerProps>(function CommonTimePicker({ value, defaultValue, onChange, format = 'HH:mm', minuteStep = 1, clearable = true, error = false, size = 'md', disabled, className, classNames, name, id, placeholder, 'aria-label': ariaLabel }, forwardedRef) {
  return <span className={cx(styles.datePickerWrap, styles[`datePicker_${size}`], classNameOf(classNames), className)} aria-label={ariaLabel}>
    <input ref={forwardedRef} type="hidden" name={name} value={value ?? String(defaultValue ?? '')} disabled={disabled} readOnly />
    <M2MTimePicker value={value} defaultValue={typeof defaultValue === 'string' ? defaultValue : undefined} onChange={onChange} format={format === 'HH:mm:ss' ? 'HH:mm:ss' : 'HH:mm'} size={size} step={minuteStep} clearable={clearable} disabled={disabled} error={error} id={id} placeholder={placeholder} classNames={cx(styles.timePickerAdapter, classNameOf(classNames, 'control'))} />
    {typeof error === 'string' && <span className={cx(styles.errorText, classNameOf(classNames, 'error'))}>{error}</span>}
  </span>;
});
