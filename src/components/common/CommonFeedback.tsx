/* oxlint-disable react/only-export-components -- showToast is the guide-defined public API */
import { type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info, X, XCircle } from 'lucide-react';
import { Loading as M2MLoading } from 'm2m-uiux-react/Loading';
import { ProgressBar as M2MProgressBar } from 'm2m-uiux-react/ProgressBar';
import { Steps as M2MSteps } from 'm2m-uiux-react/Steps';
import { ToastProvider as M2MToastProvider, showToast as showM2MToast } from 'm2m-uiux-react/Toast';
import { CommonButton, type CommonClassNames, type CommonSize } from './CommonControls';
import styles from './common.module.css';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const rootClass = (classNames?: CommonClassNames) => typeof classNames === 'string' ? classNames : classNames?.root;

export type CommonToastType = 'success' | 'error' | 'warning' | 'info' | 'danger';
export type CommonToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export interface CommonToastAction { label: ReactNode; onClick: () => void; }
export interface CommonToastData { id: string; message: ReactNode; description?: ReactNode; type?: CommonToastType; duration?: number; position?: CommonToastPosition; dismissible?: boolean; variant?: 'filled' | 'light'; action?: ReactNode | CommonToastAction; }
export interface CommonToastProps extends Omit<CommonToastData, 'id'> { onClose?: () => void; className?: string; classNames?: CommonClassNames; }

export function showToast(toast: Omit<CommonToastData, 'id'>) {
  const type = toast.type === 'danger' ? 'error' : toast.type;
  return showM2MToast({
    message: toast.description ? <span>{toast.message}<small className={styles.toastLibraryDescription}>{toast.description}</small></span> : toast.message,
    type,
    duration: toast.duration,
    position: toast.position,
    dismissible: toast.dismissible,
    variant: toast.variant,
    action: toast.action && typeof toast.action === 'object' && 'label' in toast.action && 'onClick' in toast.action
      ? { label: String(toast.action.label), onClick: toast.action.onClick }
      : undefined,
  });
}

export function CommonToast({ message, description, type = 'info', action, dismissible = true, variant = 'light', onClose, className, classNames }: CommonToastProps) {
  const icon = type === 'success' ? <CheckCircle2 /> : type === 'error' ? <XCircle /> : type === 'warning' ? <CircleAlert /> : <Info />;
  const actionNode = action && typeof action === 'object' && 'label' in action && 'onClick' in action ? <CommonButton size="sm" variant="none" onClick={action.onClick}>{action.label}</CommonButton> : action;
  return <div role={type === 'error' ? 'alert' : 'status'} className={cx(styles.toast, styles[`toast_${type}`], styles[`toast_${variant}`], rootClass(classNames), className)}><span className={styles.toastIcon}>{icon}</span><span className={styles.toastBody}><strong>{message}</strong>{description && <small>{description}</small>}</span>{actionNode}{dismissible && <button type="button" aria-label="알림 닫기" className={styles.toastClose} onClick={onClose}><X size={15} /></button>}</div>;
}

export interface CommonToastContainerProps { position?: CommonToastPosition; limit?: number; className?: string; }
export function CommonToastContainer({ position = 'top-right', limit = 4, className }: CommonToastContainerProps) {
  return <div className={className} data-toast-container-adapter data-position={position} data-limit={limit} />;
}

export interface ToastProviderProps { children: ReactNode; position?: CommonToastPosition; maxCount?: number; }
export function ToastProvider({ children, position = 'top-right', maxCount = 5 }: ToastProviderProps) {
  return <M2MToastProvider position={position} maxCount={maxCount}>{children}</M2MToastProvider>;
}

export interface CommonLoadingProps { type?: 'spinner' | 'dots' | 'skeleton'; size?: CommonSize; color?: string; text?: ReactNode; overlay?: boolean; rows?: number; className?: string; classNames?: CommonClassNames; }
export function CommonLoading({ type = 'spinner', size = 'md', color, text, overlay = false, rows = 3, className, classNames }: CommonLoadingProps) {
  if (type !== 'skeleton') {
    const packageColor = color === 'white' || color === 'neutral' || color === 'primary' ? color : 'primary';
    return <M2MLoading type={type} size={size} color={packageColor} text={text} overlay={overlay} classNames={cx(styles.loading, styles[`loading_${size}`], overlay && styles.loadingOverlay, styles.loadingAdapter, rootClass(classNames), className)} style={color && !['white', 'neutral', 'primary'].includes(color) ? { color } : undefined} />;
  }
  return <div role="status" aria-live="polite" className={cx(styles.loading, styles[`loading_${size}`], overlay && styles.loadingOverlay, rootClass(classNames), className)} style={{ color }}><span className={styles.skeletonList}>{Array.from({ length: rows }, (_, index) => <i key={index} />)}</span>{text && <span>{text}</span>}<span className={styles.visuallyHidden}>불러오는 중</span></div>;
}

export interface CommonProgressBarProps { value: number; max?: number; showValue?: boolean; color?: string; thickness?: number; animated?: boolean; label?: ReactNode; className?: string; classNames?: CommonClassNames; }
export function CommonProgressBar({ value, max = 100, showValue = false, color = 'var(--common-primary)', thickness = 8, animated = false, label, className, classNames }: CommonProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, max ? value / max * 100 : 0));
  const packageColor = color.includes('success') ? 'success' : color.includes('warning') ? 'warning' : color.includes('error') ? 'error' : 'primary';
  const packageThickness = thickness <= 4 ? 'sm' : thickness >= 10 ? 'lg' : 'md';
  return <M2MProgressBar value={percentage} showValue={showValue} color={packageColor} thickness={packageThickness} animated={animated} label={label} classNames={cx(styles.progressRoot, styles.progressAdapter, styles[`progressThickness_${packageThickness}`], rootClass(classNames), className)} />;
}

export interface CommonStep { key?: string; title: ReactNode; description?: ReactNode; icon?: ReactNode; disabled?: boolean; }
export interface CommonStepsProps { steps: CommonStep[]; current: number; direction?: 'horizontal' | 'vertical'; status?: 'process' | 'finish' | 'error' | 'wait'; onChange?: (index: number) => void; className?: string; classNames?: CommonClassNames; }
export function CommonSteps({ steps, current, direction = 'horizontal', status = 'process', onChange, className, classNames }: CommonStepsProps) {
  const handleClick = (event: import('react').MouseEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const item = (event.target as HTMLElement).closest('.bsStepsStep');
    if (!item || !event.currentTarget.contains(item)) return;
    const index = Array.from(event.currentTarget.querySelectorAll('.bsStepsStep')).indexOf(item);
    if (index >= 0 && !steps[index]?.disabled) onChange(index);
  };
  return (
    <div className={cx(styles.stepsAdapter, onChange && styles.stepsInteractive, rootClass(classNames), className)} onClick={handleClick}>
      <M2MSteps steps={steps.map(({ title, description }) => ({ title, description }))} current={current} direction={direction} status={status} />
    </div>
  );
}

export interface CommonConfirmActionProps { title: ReactNode; description?: ReactNode; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onConfirm?: () => void; onCancel?: () => void; }
export function CommonConfirmAction({ title, description, confirmLabel = '확인', cancelLabel = '취소', destructive, onConfirm, onCancel }: CommonConfirmActionProps) {
  return <div className={styles.confirmAction}><strong>{title}</strong>{description && <p>{description}</p>}<div><CommonButton variant="secondary" onClick={onCancel}>{cancelLabel}</CommonButton><CommonButton variant={destructive ? 'emphasis' : 'primary'} onClick={onConfirm}>{confirmLabel}</CommonButton></div></div>;
}

export type CommonAlertType = 'warning' | 'info' | 'error' | 'success' | 'neutral';
export type CommonAlertVariant = 'card' | 'strip';

export interface CommonAlertProps {
  type?: CommonAlertType;
  variant?: CommonAlertVariant;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode | boolean;
  action?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  style?: import('react').CSSProperties;
}

export function CommonAlert({
  type = 'warning',
  variant = 'card',
  title,
  description,
  children,
  icon = true,
  action,
  actionText,
  onAction,
  closable = false,
  onClose,
  className,
  style,
}: CommonAlertProps) {
  let iconNode: ReactNode = null;
  if (icon === true) {
    if (variant === 'card') {
      const symbol = type === 'warning' ? '!' : type === 'error' ? '✕' : type === 'success' ? '✓' : 'i';
      iconNode = <span className={styles.alertIconBadge}>{symbol}</span>;
    } else {
      const LucideIcon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : type === 'warning' ? CircleAlert : Info;
      iconNode = <LucideIcon size={14} />;
    }
  } else if (icon) {
    iconNode = icon;
  }

  const renderedAction = action ?? (actionText ? (
    <button type="button" className={styles.alertActionBtn} onClick={onAction}>
      {actionText}
    </button>
  ) : null);

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cx(
        styles.alert,
        styles[`alert_${variant}`],
        styles[`alert_${type}`],
        className
      )}
      style={style}
    >
      {iconNode && <div className={styles.alertIcon}>{iconNode}</div>}
      <div className={styles.alertBody}>
        {title && <div className={styles.alertTitle}>{title}</div>}
        {(description || children) && (
          <div className={styles.alertDesc}>
            {description}
            {children}
          </div>
        )}
      </div>
      {renderedAction && <div className={styles.alertAction}>{renderedAction}</div>}
      {closable && (
        <button
          type="button"
          aria-label="안내 닫기"
          className={styles.alertClose}
          onClick={onClose}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function CommonNotice(props: CommonAlertProps) {
  return <CommonAlert variant="strip" type="info" icon={false} {...props} />;
}
