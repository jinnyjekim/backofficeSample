/* oxlint-disable react/only-export-components -- showToast is the guide-defined public API */
import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, Info, X, XCircle } from 'lucide-react';
import { CommonButton, type CommonClassNames, type CommonSize } from './CommonControls';
import styles from './common.module.css';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');
const rootClass = (classNames?: CommonClassNames) => typeof classNames === 'string' ? classNames : classNames?.root;

export type CommonToastType = 'success' | 'error' | 'warning' | 'info';
export type CommonToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export interface CommonToastAction { label: ReactNode; onClick: () => void; }
export interface CommonToastData { id: string; message: ReactNode; description?: ReactNode; type?: CommonToastType; duration?: number; position?: CommonToastPosition; dismissible?: boolean; variant?: 'filled' | 'light'; action?: ReactNode | CommonToastAction; }
export interface CommonToastProps extends Omit<CommonToastData, 'id'> { onClose?: () => void; className?: string; classNames?: CommonClassNames; }

const toastEvent = 'common-toast';
export function showToast(toast: Omit<CommonToastData, 'id'>) {
  const detail: CommonToastData = { ...toast, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` };
  window.dispatchEvent(new CustomEvent<CommonToastData>(toastEvent, { detail }));
  return detail.id;
}

export function CommonToast({ message, description, type = 'info', action, dismissible = true, variant = 'light', onClose, className, classNames }: CommonToastProps) {
  const icon = type === 'success' ? <CheckCircle2 /> : type === 'error' ? <XCircle /> : type === 'warning' ? <CircleAlert /> : <Info />;
  const actionNode = action && typeof action === 'object' && 'label' in action && 'onClick' in action ? <CommonButton size="sm" variant="none" onClick={action.onClick}>{action.label}</CommonButton> : action;
  return <div role={type === 'error' ? 'alert' : 'status'} className={cx(styles.toast, styles[`toast_${type}`], styles[`toast_${variant}`], rootClass(classNames), className)}><span className={styles.toastIcon}>{icon}</span><span className={styles.toastBody}><strong>{message}</strong>{description && <small>{description}</small>}</span>{actionNode}{dismissible && <button type="button" aria-label="알림 닫기" className={styles.toastClose} onClick={onClose}><X size={15} /></button>}</div>;
}

export interface CommonToastContainerProps { position?: CommonToastPosition; limit?: number; className?: string; }
export function CommonToastContainer({ position = 'top-right', limit = 4, className }: CommonToastContainerProps) {
  const [toasts, setToasts] = useState<CommonToastData[]>([]);
  useEffect(() => {
    const receive = (event: Event) => {
      const toast = (event as CustomEvent<CommonToastData>).detail;
      setToasts((current) => [...current, toast].slice(-limit));
      if (toast.duration !== 0 && toast.duration !== Infinity) window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), toast.duration ?? 3000);
    };
    window.addEventListener(toastEvent, receive);
    return () => window.removeEventListener(toastEvent, receive);
  }, [limit]);
  return <div className={cx(styles.toastContainer, styles[`toastPosition_${position}`], className)}>{toasts.map((toast) => <CommonToast key={toast.id} {...toast} onClose={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} />)}</div>;
}

export interface ToastProviderProps { children: ReactNode; position?: CommonToastPosition; maxCount?: number; }
export function ToastProvider({ children, position = 'top-right', maxCount = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<CommonToastData[]>([]);
  useEffect(() => {
    const receive = (event: Event) => {
      const toast = (event as CustomEvent<CommonToastData>).detail;
      setToasts((current) => [...current, toast].slice(-maxCount));
      if (toast.duration !== 0 && toast.duration !== Infinity) window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), toast.duration ?? 3000);
    };
    window.addEventListener(toastEvent, receive);
    return () => window.removeEventListener(toastEvent, receive);
  }, [maxCount]);
  const positions: CommonToastPosition[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  return <>{children}{positions.map((currentPosition) => { const current = toasts.filter((toast) => (toast.position ?? position) === currentPosition); return current.length ? <div key={currentPosition} className={cx(styles.toastContainer, styles[`toastPosition_${currentPosition}`])}>{current.map((toast) => <CommonToast key={toast.id} {...toast} onClose={() => setToasts((items) => items.filter((item) => item.id !== toast.id))} />)}</div> : null; })}</>;
}

export interface CommonLoadingProps { type?: 'spinner' | 'dots' | 'skeleton'; size?: CommonSize; color?: string; text?: ReactNode; overlay?: boolean; rows?: number; className?: string; classNames?: CommonClassNames; }
export function CommonLoading({ type = 'spinner', size = 'md', color, text, overlay = false, rows = 3, className, classNames }: CommonLoadingProps) {
  const indicator = type === 'dots' ? <span className={styles.loadingDots}><i /><i /><i /></span> : type === 'skeleton' ? <span className={styles.skeletonList}>{Array.from({ length: rows }, (_, index) => <i key={index} />)}</span> : <span className={styles.loadingSpinner} />;
  return <div role="status" aria-live="polite" className={cx(styles.loading, styles[`loading_${size}`], overlay && styles.loadingOverlay, rootClass(classNames), className)} style={{ color }}>{indicator}{text && <span>{text}</span>}<span className={styles.visuallyHidden}>불러오는 중</span></div>;
}

export interface CommonProgressBarProps { value: number; max?: number; showValue?: boolean; color?: string; thickness?: number; animated?: boolean; label?: ReactNode; className?: string; classNames?: CommonClassNames; }
export function CommonProgressBar({ value, max = 100, showValue = false, color = 'var(--common-primary)', thickness = 8, animated = false, label, className, classNames }: CommonProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, max ? value / max * 100 : 0));
  return <div className={cx(styles.progressRoot, rootClass(classNames), className)}>{(label || showValue) && <div className={styles.progressMeta}>{label && <span>{label}</span>}{showValue && <b>{Math.round(percentage)}%</b>}</div>}<div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className={styles.progressTrack} style={{ height: thickness }}><span className={cx(styles.progressFill, animated && styles.progressAnimated)} style={{ width: `${percentage}%`, backgroundColor: color }} /></div></div>;
}

export interface CommonStep { key?: string; title: ReactNode; description?: ReactNode; icon?: ReactNode; disabled?: boolean; }
export interface CommonStepsProps { steps: CommonStep[]; current: number; direction?: 'horizontal' | 'vertical'; status?: 'process' | 'finish' | 'error' | 'wait'; onChange?: (index: number) => void; className?: string; classNames?: CommonClassNames; }
export function CommonSteps({ steps, current, direction = 'horizontal', status = 'process', onChange, className, classNames }: CommonStepsProps) {
  return <ol className={cx(styles.steps, styles[`steps_${direction}`], rootClass(classNames), className)}>{steps.map((step, index) => { const state = index < current ? 'finish' : index > current ? 'wait' : status; return <li key={step.key ?? index} className={styles[`step_${state}`]}><button type="button" disabled={step.disabled || !onChange} onClick={() => onChange?.(index)}><span className={styles.stepIcon}>{step.icon ?? (state === 'finish' ? '✓' : index + 1)}</span><span className={styles.stepBody}><strong>{step.title}</strong>{step.description && <small>{step.description}</small>}</span></button></li>; })}</ol>;
}

export interface CommonConfirmActionProps { title: ReactNode; description?: ReactNode; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onConfirm?: () => void; onCancel?: () => void; }
export function CommonConfirmAction({ title, description, confirmLabel = '확인', cancelLabel = '취소', destructive, onConfirm, onCancel }: CommonConfirmActionProps) {
  return <div className={styles.confirmAction}><strong>{title}</strong>{description && <p>{description}</p>}<div><CommonButton variant="secondary" onClick={onCancel}>{cancelLabel}</CommonButton><CommonButton variant={destructive ? 'emphasis' : 'primary'} onClick={onConfirm}>{confirmLabel}</CommonButton></div></div>;
}
