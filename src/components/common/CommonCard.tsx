import { type CSSProperties, type ReactNode } from 'react';
import styles from './common.module.css';

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

/* ==========================================================================
   1. CommonCard (범용 컨테이너 카드)
   ========================================================================== */
export interface CommonCardProps {
  children?: ReactNode;
  title?: ReactNode;
  extra?: ReactNode;
  variant?: 'default' | 'flat' | 'bordered' | 'active';
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function CommonCard({
  children,
  title,
  extra,
  variant = 'default',
  hoverable = false,
  onClick,
  className,
  style,
}: CommonCardProps) {
  const isClickable = Boolean(onClick);
  return (
    <div
      className={cx(
        styles.card,
        variant !== 'default' && styles[`card_${variant}`],
        (hoverable || isClickable) && styles.card_hoverable,
        isClickable && styles.card_clickable,
        className,
      )}
      onClick={onClick}
      style={style}
    >
      {(title || extra) && (
        <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {title && <div style={{ fontSize: '0.84375rem', fontWeight: 700, color: 'var(--common-text, #18181b)' }}>{title}</div>}
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ==========================================================================
   2. CommonStatCard (지표 / 통계 / KPI 요약 카드)
   ========================================================================== */
export type StatTone = 'up' | 'down' | 'neutral' | 'warn' | 'warning' | 'danger' | 'success';

export interface CommonStatCardProps {
  label: ReactNode;
  value: ReactNode;
  valueColor?: string;
  note?: ReactNode;
  subText?: ReactNode;
  tone?: StatTone;
  dot?: string | boolean;
  icon?: ReactNode;
  badge?: ReactNode;
  variant?: 'default' | 'flat' | 'bordered' | 'active';
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function CommonStatCard({
  label,
  value,
  valueColor,
  note,
  subText,
  tone,
  dot,
  icon,
  badge,
  variant = 'default',
  onClick,
  className,
  style,
}: CommonStatCardProps) {
  const isClickable = Boolean(onClick);
  const displayNote = note ?? subText;

  let dotColor: string | null = null;
  if (typeof dot === 'string') {
    dotColor = dot;
  } else if (dot === true) {
    dotColor = tone === 'up' || tone === 'success'
      ? '#10b981'
      : tone === 'down' || tone === 'danger'
      ? '#ef4444'
      : tone === 'warn' || tone === 'warning'
      ? '#f59e0b'
      : '#3b82f6';
  }

  return (
    <div
      className={cx(
        styles.statCard,
        variant !== 'default' && styles[`card_${variant}`],
        isClickable && styles.card_clickable,
        className,
      )}
      onClick={onClick}
      style={style}
    >
      <div className={styles.statHead}>
        <span className={styles.statLabel}>{label}</span>
        {badge ? (
          badge
        ) : icon ? (
          icon
        ) : dotColor ? (
          <i className={styles.statDot} style={{ background: dotColor }} />
        ) : null}
      </div>
      <strong className={styles.statValue} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </strong>
      {displayNote && (
        <em className={cx(styles.statNote, tone && styles[`statTone_${tone}`])}>
          {displayNote}
        </em>
      )}
    </div>
  );
}

/* ==========================================================================
   3. CommonStatGrid (지표 카드 그리드 컨테이너)
   ========================================================================== */
export interface CommonStatGridProps {
  columns?: number;
  items?: CommonStatCardProps[];
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function CommonStatGrid({
  columns = 4,
  items,
  children,
  className,
  style,
}: CommonStatGridProps) {
  const gridStyle = {
    '--stat-cols': columns,
    ...style,
  } as CSSProperties;

  return (
    <div className={cx(styles.statGrid, className)} style={gridStyle}>
      {items
        ? items.map((item, idx) => (
            <CommonStatCard key={typeof item.label === 'string' ? item.label : idx} {...item} />
          ))
        : children}
    </div>
  );
}

// 하위 호환 및 편의용 별칭
export type Metric = CommonStatCardProps;
export const Metrics = CommonStatGrid;
