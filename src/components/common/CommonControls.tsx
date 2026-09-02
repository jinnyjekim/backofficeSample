/* oxlint-disable react/only-export-components -- compound CommonInput API is intentional */
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
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
import { Check, ChevronDown, Eye, EyeOff, Search, X } from 'lucide-react';
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
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={blocked}
      aria-busy={loading || undefined}
      className={cx(styles.button, styles[`button_${variant}`], styles[`size_${size}`], round && styles.round, fullWidth && styles.fullWidth, classNameOf(classNames), className)}
      onClick={(event) => { if (!blocked) onClick?.(event); }}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon}
      {children}
    </button>
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
  const content = Children.map(children, (child) => {
    if (!isValidElement<CommonButtonProps>(child)) return child;
    return cloneElement(child, { size: child.props.size ?? size, disabled: child.props.disabled ?? disabled });
  });
  return <div className={cx(styles.buttonGroup, styles[`direction_${direction}`], attached && styles.attached, classNameOf(classNames), className)}>{content}</div>;
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

function clearInput(onChange: CommonInputProps['onChange'], onClear: CommonInputProps['onClear']) {
  onChange?.({ target: { value: '' }, currentTarget: { value: '' } } as ChangeEvent<HTMLInputElement>);
  onClear?.();
}

const CommonInputBase = forwardRef<HTMLInputElement, CommonInputProps & { kind?: InputKind }>(function CommonInputBase(
  { kind = 'text', variant = 'default', size = 'md', clearable = true, onClear, error = false, showCount = false, className, classNames, value, disabled, readOnly, maxLength, showToggle = true, onToggle, onSearch, onKeyDown, prefix, suffix, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const inputType = kind === 'password' ? (visible ? 'text' : 'password') : kind;
  const text = value == null ? '' : String(value);
  const canClear = clearable && text.length > 0 && !disabled && !readOnly;
  const toggle = () => { const next = !visible; setVisible(next); onToggle?.(next); };
  return (
    <div className={cx(styles.fieldWrap, classNameOf(classNames), className)}>
      <div className={cx(styles.inputRoot, styles[`input_${variant}`], styles[`size_${size}`], error && styles.error, disabled && styles.disabled, classNameOf(classNames, 'control'))}>
        {prefix && <span className={styles.fieldAddon}>{prefix}</span>}
        <input
          {...props}
          ref={ref}
          type={inputType}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          aria-invalid={Boolean(error) || undefined}
          className={styles.input}
          onKeyDown={(event) => { if (kind === 'search' && event.key === 'Enter') onSearch?.(text); onKeyDown?.(event); }}
        />
        {suffix && <span className={styles.fieldAddon}>{suffix}</span>}
        {canClear && <button type="button" className={styles.fieldAction} aria-label="입력 내용 지우기" onClick={() => clearInput(props.onChange, onClear)}><X size={14} /></button>}
        {kind === 'password' && showToggle && <button type="button" className={styles.fieldAction} aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={toggle}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>}
        {kind === 'search' && <button type="button" className={styles.fieldAction} aria-label="검색" onClick={() => onSearch?.(text)}><Search size={15} /></button>}
      </div>
      {(showCount || typeof error === 'string') && <div className={styles.fieldMeta}>{typeof error === 'string' && <span className={cx(styles.errorText, classNameOf(classNames, 'error'))}>{error}</span>}{showCount && <span className={styles.count}>{text.length}{maxLength ? ` / ${maxLength}` : ''}</span>}</div>}
    </div>
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
  { options, value, onChange, variant = 'default', searchable = false, multi = false, error = false, size = 'md', placeholder = '선택해주세요', disabled, className, classNames, ...props },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const values = Array.isArray(value) ? value : value ? [value] : [];
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const selected = options.filter((option) => values.includes(option.value));
  const visibleOptions = options.filter((option) => String(option.label).toLowerCase().includes(query.toLowerCase()));
  const choose = (next: string) => {
    if (multi) onChange?.(values.includes(next) ? values.filter((item) => item !== next) : [...values, next]);
    else { onChange?.(next); setOpen(false); }
  };
  return (
    <div ref={rootRef} className={cx(styles.fieldWrap, styles.selectWrap, classNameOf(classNames), className)}>
      <select {...props} ref={ref} className={styles.nativeSelect} value={multi ? values : values[0] ?? ''} disabled={disabled} multiple={multi} aria-hidden="true" tabIndex={-1} onChange={(event) => choose(event.target.value)}>
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
  return <label className={cx(styles.choice, styles[`choice_${size}`], props.disabled && styles.disabled, classNameOf(classNames), className)}><input {...props} ref={ref} type="checkbox" checked={checked} onChange={(event) => onChange?.(event.target.checked)} /><span className={styles.checkbox} aria-hidden="true">{indeterminate ? '−' : checked ? '✓' : ''}</span>{label ?? children}</label>;
});

export interface CommonCheckboxGroupOption { value: string; label: ReactNode; disabled?: boolean; }
export interface CommonCheckboxGroupProps { options: CommonCheckboxGroupOption[]; value: string[]; onChange?: (value: string[]) => void; direction?: 'horizontal' | 'vertical'; size?: CommonSize; disabled?: boolean; min?: number; max?: number; className?: string; }
export function CommonCheckboxGroup({ options, value, onChange, direction = 'vertical', size = 'md', disabled, min = 0, max = Infinity, className }: CommonCheckboxGroupProps) {
  const toggle = (item: string) => { const exists = value.includes(item); if (exists && value.length <= min) return; if (!exists && value.length >= max) return; onChange?.(exists ? value.filter((entry) => entry !== item) : [...value, item]); };
  return <div className={cx(styles.choiceGroup, styles[`direction_${direction}`], className)}>{options.map((option) => <CommonCheckbox key={option.value} size={size} checked={value.includes(option.value)} disabled={disabled || option.disabled} onChange={() => toggle(option.value)}>{option.label}</CommonCheckbox>)}</div>;
}

export interface CommonRadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'onChange'> { size?: CommonSize; value: string; onChange?: (value: string) => void; classNames?: CommonClassNames; }
export const CommonRadio = forwardRef<HTMLInputElement, CommonRadioProps>(function CommonRadio({ size = 'md', value, checked, onChange, className, classNames, children, ...props }, ref) {
  return <label className={cx(styles.choice, styles[`choice_${size}`], props.disabled && styles.disabled, classNameOf(classNames), className)}><input {...props} ref={ref} type="radio" value={value} checked={checked} onChange={() => onChange?.(value)} /><span className={styles.radio} aria-hidden="true"><i /></span>{children}</label>;
});

export interface CommonRadioGroupProps { options?: CommonCheckboxGroupOption[]; value?: string; onChange?: (value: string) => void; name?: string; direction?: 'horizontal' | 'vertical'; size?: CommonSize; disabled?: boolean; children?: ReactNode; className?: string; }
export function CommonRadioGroup({ options, value, onChange, name, direction = 'vertical', size = 'md', disabled, children, className }: CommonRadioGroupProps) {
  const content = options ? options.map((option) => <CommonRadio key={option.value} name={name} value={option.value} checked={value === option.value} disabled={disabled || option.disabled} size={size} onChange={onChange}>{option.label}</CommonRadio>) : Children.map(children, (child) => isValidElement<CommonRadioProps>(child) ? cloneElement(child, { name: child.props.name ?? name, checked: value === child.props.value, disabled: child.props.disabled ?? disabled, size: child.props.size ?? size, onChange }) : child);
  return <div className={cx(styles.choiceGroup, styles[`direction_${direction}`], className)}>{content}</div>;
}

export interface CommonSwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> { checked?: boolean; size?: CommonSize; label?: ReactNode; onChange?: (checked: boolean) => void; classNames?: CommonClassNames; }
export const CommonSwitch = forwardRef<HTMLButtonElement, CommonSwitchProps>(function CommonSwitch({ checked = false, size = 'md', label, children, onChange, disabled, className, classNames, ...props }, ref) {
  return <span className={cx(styles.switchLabel, disabled && styles.disabled, classNameOf(classNames), className)}><button {...props} ref={ref} type="button" role="switch" aria-checked={checked} disabled={disabled} className={cx(styles.switch, styles[`switch_${size}`], checked && styles.switchOn)} onClick={() => onChange?.(!checked)}><i /></button>{label ?? children}</span>;
});

export interface CommonTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> { error?: boolean | string; resize?: 'none' | 'vertical' | 'horizontal' | 'both'; showCount?: boolean; onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void; classNames?: CommonClassNames; }
export const CommonTextarea = forwardRef<HTMLTextAreaElement, CommonTextareaProps>(function CommonTextarea({ rows = 3, error = false, resize = 'vertical', showCount = false, maxLength, value, className, classNames, ...props }, ref) {
  const length = value == null ? 0 : String(value).length;
  return <div className={cx(styles.fieldWrap, classNameOf(classNames), className)}><textarea {...props} ref={ref} rows={rows} value={value} maxLength={maxLength} aria-invalid={Boolean(error) || undefined} className={cx(styles.textarea, error && styles.error, classNameOf(classNames, 'control'))} style={{ resize }} />{(showCount || typeof error === 'string') && <div className={styles.fieldMeta}>{typeof error === 'string' && <span className={styles.errorText}>{error}</span>}{showCount && <span className={styles.count}>{length}{maxLength ? ` / ${maxLength}` : ''}</span>}</div>}</div>;
});

export interface CommonDividerProps { direction?: 'horizontal' | 'vertical'; color?: 'default' | 'muted' | 'primary' | string; thickness?: number; label?: ReactNode; labelAlign?: 'left' | 'center' | 'right'; dashed?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonDivider({ direction = 'horizontal', color = 'default', thickness = 1, label, labelAlign = 'center', dashed = false, className, classNames }: CommonDividerProps) {
  const lineColor = color === 'default' ? 'var(--common-border)' : color === 'muted' ? 'var(--common-bg-disabled)' : color === 'primary' ? 'var(--common-primary)' : color;
  return <div role="separator" aria-orientation={direction} className={cx(styles.divider, styles[`divider_${direction}`], Boolean(label) && styles[`label_${labelAlign}`], classNameOf(classNames), className)} style={{ '--divider-color': lineColor, '--divider-size': `${thickness}px`, '--divider-style': dashed ? 'dashed' : 'solid' } as React.CSSProperties}>{label && <span>{label}</span>}</div>;
}

export interface CommonBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> { type?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'ghost' | 'primary-light' | 'success-light' | 'error-light' | 'warning-light' | 'info-light'; size?: CommonSize; round?: boolean; dot?: boolean; children: ReactNode; classNames?: CommonClassNames; }
export function CommonBadge({ type = 'primary', size = 'md', round = true, dot = false, children, className, classNames, ...props }: CommonBadgeProps) {
  return <span {...props} className={cx(styles.badge, styles[`badge_${type}`], styles[`badge_${size}`], round && styles.round, classNameOf(classNames), className)}>{dot && <i />}{children}</span>;
}

export interface CommonHeaderProps { type?: 'default' | 'primary'; title: ReactNode; back?: boolean | (() => void); actions?: ReactNode; logo?: ReactNode; sticky?: boolean; className?: string; classNames?: CommonClassNames; }
export function CommonHeader({ type = 'default', title, back, actions, logo, sticky = false, className, classNames }: CommonHeaderProps) {
  return <header className={cx(styles.commonHeader, styles[`header_${type}`], sticky && styles.sticky, classNameOf(classNames), className)}>{back && <CommonButton variant="none" size="sm" aria-label="뒤로 가기" onClick={typeof back === 'function' ? back : () => history.back()}>←</CommonButton>}{logo}<strong>{title}</strong>{actions && <div className={styles.headerActions}>{actions}</div>}</header>;
}

export interface CommonFormProps extends React.FormHTMLAttributes<HTMLFormElement> { layout?: 'vertical' | 'horizontal' | '2column' | 'searchbar' | 'range' | 'inline-multi'; labelWidth?: number | string; classNames?: CommonClassNames; }
export function CommonForm({ layout = 'vertical', labelWidth, className, classNames, style, ...props }: CommonFormProps) {
  return <form {...props} className={cx(styles.form, styles[`form_${layout}`], classNameOf(classNames), className)} style={{ ...style, '--label-width': typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth } as React.CSSProperties} />;
}

export interface CommonFormFieldProps { name?: string; label?: ReactNode; required?: boolean; error?: ReactNode; helper?: ReactNode; children: ReactNode; className?: string; classNames?: CommonClassNames; }
export function CommonFormField({ name, label, required, error, helper, children, className, classNames }: CommonFormFieldProps) {
  return <label className={cx(styles.formField, classNameOf(classNames), className)} htmlFor={name}>{label && <span className={cx(styles.formLabel, classNameOf(classNames, 'label'))}>{label}{required && <b aria-hidden="true">*</b>}</span>}<span className={styles.formControl}>{children}</span>{error ? <span className={cx(styles.errorText, classNameOf(classNames, 'error'))}>{error}</span> : helper ? <span className={styles.helper}>{helper}</span> : null}</label>;
}
