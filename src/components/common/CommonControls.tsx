/* oxlint-disable react/only-export-components -- compound CommonInput API is intentional */
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Badge as M2MBadge } from 'm2m-uiux-react/Badge';
import { Button as M2MButton } from 'm2m-uiux-react/Button';
import { ButtonGroup as M2MButtonGroup } from 'm2m-uiux-react/ButtonGroup';
import { Checkbox as M2MCheckbox } from 'm2m-uiux-react/Checkbox';
import { CheckboxGroup as M2MCheckboxGroup } from 'm2m-uiux-react/CheckboxGroup';
import { Divider as M2MDivider } from 'm2m-uiux-react/Divider';
import { Form as M2MForm, FormField as M2MFormField } from 'm2m-uiux-react/Form';
import { Header as M2MHeader } from 'm2m-uiux-react/Header';
import { Input as M2MInput } from 'm2m-uiux-react/Input';
import { Radio as M2MRadio } from 'm2m-uiux-react/Radio';
import { RadioGroup as M2MRadioGroup } from 'm2m-uiux-react/RadioGroup';
import { Select as M2MSelect } from 'm2m-uiux-react/Select';
import { Switch as M2MSwitch } from 'm2m-uiux-react/Switch';
import { Textarea as M2MTextarea } from 'm2m-uiux-react/Textarea';
import styles from './common.module.css';

export type CommonSize = 'sm' | 'md' | 'lg';
export type CommonClassNames = string | { root?: string; control?: string; label?: string; error?: string };

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const classNameOf = (value: CommonClassNames | undefined, key: 'root' | 'control' | 'label' | 'error' = 'root') =>
  typeof value === 'string' ? (key === 'root' ? value : '') : value?.[key] ?? '';

export interface CommonButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  variant?: 'primary' | 'primary-light' | 'secondary' | 'ghost' | 'emphasis' | 'inactive' | 'none' | 'outlined' | 'success' | 'success-light' | 'warning' | 'danger' | 'danger-light';
  size?: CommonSize;
  round?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  classNames?: CommonClassNames;
}

export const CommonButton = forwardRef<HTMLButtonElement, CommonButtonProps>(function CommonButton(
  { variant = 'primary', size = 'md', round = false, disabled = false, loading = false, fullWidth = false, icon, className, classNames, children, onClick, type = 'button', ...props },
  ref,
) {
  const blocked = disabled || loading || variant === 'inactive';
  const packageVariant = ['primary', 'secondary', 'ghost', 'emphasis', 'inactive', 'none'].includes(variant)
    ? variant as 'primary' | 'secondary' | 'ghost' | 'emphasis' | 'inactive' | 'none'
    : variant === 'outlined' ? 'secondary' : 'none';
  return (
    <M2MButton
      {...props}
      ref={ref}
      htmlType={type}
      variant={packageVariant}
      size={size}
      round={round}
      loading={loading}
      fullWidth={fullWidth}
      disabled={blocked}
      aria-busy={loading || undefined}
      classNames={cx(styles.button, styles[`button_${variant}`], styles[`size_${size}`], round && styles.round, fullWidth && styles.fullWidth, classNameOf(classNames), className)}
      onClick={(event) => { if (!blocked) onClick?.(event); }}
    >
      {!loading && icon}
      {children}
    </M2MButton>
  );
});

export interface CommonButtonGroupProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  attached?: boolean;
  size?: CommonSize;
  disabled?: boolean;
  className?: string;
  classNames?: CommonClassNames;
}

export function CommonButtonGroup({ children, direction = 'row', attached = false, size, disabled, className, classNames }: CommonButtonGroupProps) {
  return <M2MButtonGroup direction={direction} attached={attached} size={size} disabled={disabled} classNames={cx(styles.buttonGroup, styles[`direction_${direction}`], attached && styles.attached, classNameOf(classNames), className)}>{children}</M2MButtonGroup>;
}

export interface CommonInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onToggle' | 'prefix'> {
  variant?: 'default' | 'filled' | 'borderless';
  size?: CommonSize;
  clearable?: boolean;
  onClear?: () => void;
  error?: boolean | string;
  showCount?: boolean;
  classNames?: CommonClassNames;
  showToggle?: boolean;
  onToggle?: (visible: boolean) => void;
  onSearch?: (value: string) => void;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

type InputKind = 'text' | 'password' | 'search' | 'number' | 'email' | 'tel';

const CommonInputBase = forwardRef<HTMLInputElement, CommonInputProps & { kind?: InputKind }>(function CommonInputBase(
  { kind = 'text', variant = 'default', size = 'md', clearable = true, onClear, error = false, showCount = false, className, classNames, showToggle = true, onToggle, onSearch, prefix, suffix, ...props },
  ref,
) {
  return (
    <M2MInput
      {...props}
      ref={ref}
      type={kind}
      size={size}
      clearable={clearable}
      onClear={onClear}
      error={error}
      showCount={showCount}
      showToggle={showToggle}
      onToggle={onToggle}
      onSearch={onSearch}
      prefix={prefix}
      suffix={suffix}
      classNames={cx(styles.inputAdapter, styles[`inputAdapter_${size}`], styles[`input_${variant}`], classNameOf(classNames), classNameOf(classNames, 'control'), className)}
    />
  );
});

const inputOf = (kind: InputKind) => forwardRef<HTMLInputElement, CommonInputProps>(function InputVariant(props, ref) {
  return <CommonInputBase {...props} kind={kind} ref={ref} />;
});

export const CommonInput = Object.assign(inputOf('text'), {
  Text: inputOf('text'),
  Password: inputOf('password'),
  Search: inputOf('search'),
  Number: inputOf('number'),
  Email: inputOf('email'),
  Tel: inputOf('tel'),
});

export interface CommonSelectOption { label: ReactNode; value: string; disabled?: boolean; }
export interface CommonSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'value' | 'onChange'> {
  options: CommonSelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  variant?: 'default' | 'filled' | 'borderless';
  searchable?: boolean;
  multi?: boolean;
  error?: boolean | string;
  size?: CommonSize;
  placeholder?: string;
  classNames?: CommonClassNames;
}

export const CommonSelect = forwardRef<HTMLSelectElement, CommonSelectProps>(function CommonSelect(
  { options, value, onChange, variant = 'default', searchable = false, multi = false, error = false, size = 'md', placeholder = '선택해주세요', disabled, className, classNames, name, id, ...props },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const packageCompatible = !multi && options.every((option) => typeof option.label === 'string' || typeof option.label === 'number');
  useEffect(() => {
    if (packageCompatible) return;
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [packageCompatible]);

  if (packageCompatible) {
    const selectedValue = Array.isArray(value) ? value[0] ?? '' : value;
    return (
      <div className={cx(styles.fieldWrap, styles.selectWrap, classNameOf(classNames), className)} aria-label={props['aria-label']}>
        <select {...props} ref={ref} className={styles.nativeSelect} value={selectedValue ?? ''} disabled={disabled} aria-hidden="true" tabIndex={-1} onChange={() => undefined}>
          <option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{String(option.label)}</option>)}
        </select>
        <M2MSelect
          options={options.map((option) => ({ ...option, label: String(option.label) }))}
          value={selectedValue}
          onChange={(next) => onChange?.(next)}
          placeholder={placeholder}
          size={size}
          searchable={searchable}
          disabled={disabled}
          error={error}
          name={name}
          id={id}
          classNames={cx(styles.selectAdapter, styles[`selectAdapter_${size}`], styles[`input_${variant}`], classNameOf(classNames, 'control'))}
        />
      </div>
    );
  }

  const values = Array.isArray(value) ? value : value ? [value] : [];
  const selected = options.filter((option) => values.includes(option.value));
  const visibleOptions = options.filter((option) => String(option.label).toLowerCase().includes(query.toLowerCase()));
  const choose = (next: string) => {
    if (multi) onChange?.(values.includes(next) ? values.filter((item) => item !== next) : [...values, next]);
    else { onChange?.(next); setOpen(false); }
  };
  return (
    <div ref={rootRef} className={cx(styles.fieldWrap, styles.selectWrap, classNameOf(classNames), className)}>
      <select {...props} ref={ref} name={name} id={id} className={styles.nativeSelect} value={multi ? values : values[0] ?? ''} disabled={disabled} multiple={multi} aria-hidden="true" tabIndex={-1} onChange={(event) => choose(event.target.value)}>
        <option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{String(option.label)}</option>)}
      </select>
      <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} className={cx(styles.selectTrigger, styles[`input_${variant}`], styles[`size_${size}`], error && styles.error, disabled && styles.disabled, classNameOf(classNames, 'control'))} onClick={() => setOpen((current) => !current)}>
        <span className={cx(styles.selectValue, !selected.length && styles.placeholder)}>{selected.length ? (multi ? selected.map((item) => item.label).join(', ') : selected[0].label) : placeholder}</span><ChevronDown size={15} />
      </button>
      {open && !disabled && <div className={styles.selectMenu}>{searchable && <input autoFocus className={styles.selectSearch} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색" />}{visibleOptions.map((option) => <button type="button" role="option" aria-selected={values.includes(option.value)} disabled={option.disabled} key={option.value} className={cx(styles.selectOption, values.includes(option.value) && styles.selected)} onClick={() => choose(option.value)}><span>{option.label}</span>{values.includes(option.value) && <Check size={14} />}</button>)}</div>}
      {typeof error === 'string' && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});

export interface CommonCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> { size?: CommonSize; indeterminate?: boolean; label?: ReactNode; onChange?: (checked: boolean) => void; classNames?: CommonClassNames; }
export const CommonCheckbox = forwardRef<HTMLInputElement, CommonCheckboxProps>(function CommonCheckbox({ size = 'md', indeterminate = false, label, children, checked, onChange, className, classNames, ...props }, ref) {
  return <M2MCheckbox {...props} ref={ref} size={size} indeterminate={indeterminate} label={label ?? children} checked={checked} onChange={(event) => onChange?.(event.target.checked)} classNames={cx(classNameOf(classNames), className)} />;
});

export interface CommonCheckboxGroupOption { value: string; label: ReactNode; disabled?: boolean; }
export interface CommonCheckboxGroupProps { options: CommonCheckboxGroupOption[]; value: string[]; onChange?: (value: string[]) => void; direction?: 'horizontal' | 'vertical'; size?: CommonSize; disabled?: boolean; min?: number; max?: number; className?: string; }
export function CommonCheckboxGroup({ options, value, onChange, direction = 'vertical', size = 'md', disabled, min = 0, max = Infinity, className }: CommonCheckboxGroupProps) {
  return <M2MCheckboxGroup options={options} value={value} onChange={(next) => onChange?.(next)} direction={direction} size={size} disabled={disabled} min={min} max={Number.isFinite(max) ? max : undefined} classNames={cx(styles.choiceGroup, className)} />;
}

export interface CommonRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'> { size?: CommonSize; value: string; onChange?: (value: string) => void; classNames?: CommonClassNames; }
export const CommonRadio = forwardRef<HTMLInputElement, CommonRadioProps>(function CommonRadio({ size = 'md', value, checked, onChange, className, classNames, children, ...props }, ref) {
  return <M2MRadio {...props} ref={ref} size={size} value={value} checked={checked} label={children} onChange={() => onChange?.(value)} classNames={cx(classNameOf(classNames), className)} />;
});

export interface CommonRadioGroupProps { options?: CommonCheckboxGroupOption[]; value?: string; onChange?: (value: string) => void; name?: string; direction?: 'horizontal' | 'vertical'; size?: CommonSize; disabled?: boolean; children?: ReactNode; className?: string; }
export function CommonRadioGroup({ options, value, onChange, name, direction = 'vertical', size = 'md', disabled, children, className }: CommonRadioGroupProps) {
  if (options) return <M2MRadioGroup options={options} value={value} onChange={onChange} name={name} direction={direction} size={size} disabled={disabled} classNames={cx(styles.choiceGroup, className)} />;
  return <div className={cx(styles.choiceGroup, styles[`direction_${direction}`], className)}>{children}</div>;
}

export interface CommonSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> { checked?: boolean; size?: CommonSize; label?: ReactNode; onChange?: (checked: boolean) => void; classNames?: CommonClassNames; }
export const CommonSwitch = forwardRef<HTMLInputElement, CommonSwitchProps>(function CommonSwitch({ checked = false, size = 'md', label, children, onChange, className, classNames, ...props }, ref) {
  return <M2MSwitch {...props} ref={ref} checked={checked} size={size} label={label ?? children} onChange={(event) => onChange?.(event.target.checked)} classNames={cx(styles.switchAdapter, styles[`switchAdapter_${size}`], classNameOf(classNames), className)} />;
});

export interface CommonTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> { error?: boolean | string; resize?: 'none' | 'vertical' | 'horizontal' | 'both'; showCount?: boolean; onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void; classNames?: CommonClassNames; }
export const CommonTextarea = forwardRef<HTMLTextAreaElement, CommonTextareaProps>(function CommonTextarea({ rows = 3, error = false, resize = 'vertical', showCount = false, maxLength, value, className, classNames, ...props }, ref) {
  return <M2MTextarea {...props} ref={ref} rows={rows} value={value} maxLength={maxLength} error={error} resize={resize !== 'none'} showCount={showCount} classNames={cx(styles.textareaAdapter, classNameOf(classNames), classNameOf(classNames, 'control'), className)} style={{ ...props.style, resize }} />;
});

export interface CommonDividerProps { direction?: 'horizontal' | 'vertical'; color?: 'default' | 'muted' | 'primary' | string; thickness?: number; label?: ReactNode; labelAlign?: 'left' | 'center' | 'right'; dashed?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonDivider({ direction = 'horizontal', color = 'default', thickness = 1, label, labelAlign = 'center', dashed = false, className, classNames }: CommonDividerProps) {
  const lineColor = color === 'default' ? 'var(--common-border)' : color === 'muted' ? 'var(--common-bg-disabled)' : color === 'primary' ? 'var(--common-primary)' : color;
  if (labelAlign === 'right') {
    return <div role="separator" aria-orientation={direction} className={cx(styles.divider, styles[`divider_${direction}`], Boolean(label) && styles.label_right, classNameOf(classNames), className)} style={{ '--divider-color': lineColor, '--divider-size': `${thickness}px`, '--divider-style': dashed ? 'dashed' : 'solid' } as React.CSSProperties}>{label && <span>{label}</span>}</div>;
  }
  return <M2MDivider direction={direction} color={lineColor} thickness={thickness} label={label} labelAlign={labelAlign} dashed={dashed} classNames={cx(styles.dividerAdapter, classNameOf(classNames), className)} />;
}

export interface CommonBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> { type?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'ghost' | 'primary-light' | 'success-light' | 'error-light' | 'warning-light' | 'info-light'; size?: CommonSize; round?: boolean; dot?: boolean; children: ReactNode; classNames?: CommonClassNames; }
export function CommonBadge({ type = 'primary', size = 'md', round = true, dot = false, children, className, classNames, ...props }: CommonBadgeProps) {
  return <M2MBadge {...props} type={type} size={size} round={round} dot={dot} classNames={cx(styles.badge, styles[`badge_${type}`], styles[`badge_${size}`], round && styles.round, classNameOf(classNames), className)}>{children}</M2MBadge>;
}

export interface CommonHeaderProps { type?: 'default' | 'primary'; title: ReactNode; back?: boolean | (() => void); actions?: ReactNode; logo?: ReactNode; sticky?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonHeader({ type = 'default', title, back, actions, logo, sticky = false, className, classNames }: CommonHeaderProps) {
  return <M2MHeader type={type} sticky={sticky} classNames={cx(styles.commonHeader, styles[`header_${type}`], sticky && styles.sticky, classNameOf(classNames), className)}>{back && <CommonButton variant="none" size="sm" aria-label="뒤로 가기" onClick={typeof back === 'function' ? back : () => history.back()}>←</CommonButton>}{logo}<strong>{title}</strong>{actions && <div className={styles.headerActions}>{actions}</div>}</M2MHeader>;
}

export interface CommonFormProps extends React.FormHTMLAttributes<HTMLFormElement> { layout?: 'vertical' | 'horizontal' | '2column' | 'searchbar' | 'range' | 'inline-multi'; labelWidth?: number | string; classNames?: CommonClassNames; }
export function CommonForm({ layout = 'vertical', labelWidth, className, classNames, style, ...props }: CommonFormProps) {
  if (layout === 'vertical' || layout === 'horizontal') {
    return <M2MForm {...props} layout={layout} labelWidth={labelWidth} classNames={cx(styles.form, styles[`form_${layout}`], styles.formAdapter, classNameOf(classNames), className)} style={style} />;
  }
  return <form {...props} className={cx(styles.form, styles[`form_${layout}`], classNameOf(classNames), className)} style={{ ...style, '--label-width': typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth } as React.CSSProperties} />;
}

export interface CommonFormFieldProps { name?: string; label?: ReactNode; required?: boolean; error?: ReactNode; helper?: ReactNode; children: ReactNode; className?: string; classNames?: CommonClassNames; }
export function CommonFormField({ name, label, required, error, helper, children, className, classNames }: CommonFormFieldProps) {
  return <M2MFormField name={name} htmlFor={name} label={label} required={required} error={typeof error === 'string' ? error : undefined} help={error && typeof error !== 'string' ? error : helper} classNames={cx(styles.formField, styles.formFieldAdapter, classNameOf(classNames), classNameOf(classNames, 'label'), classNameOf(classNames, 'error'), className)}>{children}</M2MFormField>;
}
