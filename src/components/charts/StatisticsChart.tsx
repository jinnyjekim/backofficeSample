import type { CSSProperties, ReactNode } from 'react';
import styles from './StatisticsChart.module.css';

export interface StatisticsChartDatum {
  label: string;
  value: number;
  /** 막대 길이를 값과 별도로 제어할 때 사용하는 0~100 비율 */
  percent?: number;
}

interface ChartSizeProps {
  width?: CSSProperties['width'];
  height?: number | string;
  aspectRatio?: number;
  className?: string;
}

export interface StatisticsBarChartProps extends ChartSizeProps {
  data: StatisticsChartDatum[];
  metricLabel?: string;
  color?: string;
  negativeColor?: string;
  maxLabelCount?: number;
  minBarPercent?: number;
  emptyText?: string;
  formatValue?: (value: number) => string;
}

export function StatisticsBarChart({
  data,
  metricLabel = '값',
  color = 'var(--common-primary, #2563eb)',
  negativeColor = '#dc2626',
  width = '100%',
  height = 220,
  aspectRatio,
  maxLabelCount = 12,
  minBarPercent = 2,
  emptyText = '선택한 기간에 데이터가 없습니다.',
  formatValue = (value) => value.toLocaleString('ko-KR'),
  className,
}: StatisticsBarChartProps) {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  const labelStep = Math.max(1, Math.ceil(data.length / maxLabelCount));
  const sizeStyle: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : { height }) };

  if (!data.length || data.every((item) => item.value === 0)) {
    return <div className={styles.empty} style={sizeStyle}>{emptyText}</div>;
  }

  return (
    <div className={`${styles.root} ${className ?? ''}`} style={sizeStyle}>
      <div className={styles.barPlot}>
        {data.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className={styles.barSlot}
            title={`${item.label} · ${metricLabel} ${formatValue(item.value)}`}
          >
            <span
              className={styles.bar}
              style={{
                height: `${Math.max(minBarPercent, (Math.abs(item.value) / max) * 100)}%`,
                background: item.value < 0 ? negativeColor : color,
              }}
            />
          </div>
        ))}
      </div>
      <div className={styles.labels}>
        {data.map((item, index) => (
          <span key={`${item.label}-${index}`}>{index % labelStep === 0 || index === data.length - 1 ? item.label : ''}</span>
        ))}
      </div>
    </div>
  );
}

export interface StatisticsHorizontalBarChartProps extends ChartSizeProps {
  data: StatisticsChartDatum[];
  color?: string;
  trackColor?: string;
  rowGap?: number;
  showPercentage?: boolean;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
}

export function StatisticsHorizontalBarChart({
  data,
  color = 'var(--common-primary, #2563eb)',
  trackColor = 'var(--common-bg-disabled, #f4f4f5)',
  width = '100%',
  height = 'auto',
  aspectRatio,
  rowGap = 10,
  showPercentage = true,
  formatValue = (value) => value.toLocaleString('ko-KR'),
  ariaLabel = '가로 막대 통계 차트',
  className,
}: StatisticsHorizontalBarChartProps) {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  const sizeStyle: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : { height }) };

  return (
    <div className={`${styles.horizontalChart} ${className ?? ''}`} style={{ ...sizeStyle, gap: rowGap }} role="img" aria-label={ariaLabel}>
      {data.map((item, index) => {
        const percent = Math.max(0, Math.min(100, item.percent ?? (Math.abs(item.value) / max) * 100));
        return (
          <div className={styles.horizontalRow} key={`${item.label}-${index}`}>
            <span className={styles.horizontalLabel}>{item.label}</span>
            <div className={styles.horizontalTrack} style={{ background: trackColor }}>
              <i style={{ width: `${percent}%`, background: color }} />
            </div>
            <strong>{formatValue(item.value)}</strong>
            {showPercentage && <em>{Math.round(percent)}%</em>}
          </div>
        );
      })}
    </div>
  );
}

export interface StatisticsLineChartProps extends ChartSizeProps {
  values: number[];
  labels: string[];
  comparisonValues?: number[];
  ariaLabel?: string;
  color?: string;
  comparisonColor?: string;
  fill?: boolean;
  showPoints?: boolean;
  maxLabelCount?: number;
}

export function StatisticsLineChart({
  values,
  labels,
  comparisonValues,
  ariaLabel = '통계 추이 차트',
  color = 'var(--common-primary, #2563eb)',
  comparisonColor = '#a1a1aa',
  width = '100%',
  height = 240,
  aspectRatio,
  fill = false,
  showPoints = false,
  maxLabelCount = 7,
  className,
}: StatisticsLineChartProps) {
  const viewWidth = 860;
  const viewHeight = 220;
  const paddingX = 38;
  const paddingY = 18;
  const allValues = [...values, ...(comparisonValues ?? [])];
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = Math.max(max - min, 1);
  const coordinates = (series: number[]) => series.map((value, index) => ({
    x: series.length <= 1 ? viewWidth / 2 : paddingX + (index / (series.length - 1)) * (viewWidth - paddingX * 2),
    y: viewHeight - paddingY - ((value - min) / range) * (viewHeight - paddingY * 2),
  }));
  const points = (series: number[]) => coordinates(series).map((point) => `${point.x},${point.y}`).join(' ');
  const currentPoints = coordinates(values);
  const areaPoints = `${paddingX},${viewHeight - paddingY} ${points(values)} ${viewWidth - paddingX},${viewHeight - paddingY}`;
  const labelStep = Math.max(1, Math.ceil(labels.length / maxLabelCount));
  const sizeStyle: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : { height }) };

  return (
    <div className={`${styles.root} ${className ?? ''}`} style={sizeStyle}>
      <div className={styles.linePlot}>
        <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <line key={ratio} x1={paddingX} x2={viewWidth - paddingX} y1={viewHeight - paddingY - ratio * (viewHeight - paddingY * 2)} y2={viewHeight - paddingY - ratio * (viewHeight - paddingY * 2)} className={styles.gridLine} />
          ))}
          {fill && values.length > 0 && <polygon points={areaPoints} fill={color} className={styles.area} />}
          {comparisonValues && <polyline points={points(comparisonValues)} fill="none" stroke={comparisonColor} className={styles.comparisonLine} />}
          <polyline points={points(values)} fill="none" stroke={color} className={styles.line} />
          {showPoints && currentPoints.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3.5" fill={color} className={styles.point} />)}
        </svg>
      </div>
      <div className={styles.labels}>
        {labels.map((label, index) => <span key={`${label}-${index}`}>{index % labelStep === 0 || index === labels.length - 1 ? label : ''}</span>)}
      </div>
    </div>
  );
}

/** 도넛(원형) 구성비 차트에서 순서대로 사용하는 기본 색상입니다. */
export const STATISTICS_DONUT_COLORS = ['#4f7bd9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#64748b'];

export interface StatisticsDonutChartProps extends ChartSizeProps {
  data: StatisticsChartDatum[];
  /** 도넛 지름(px) */
  size?: number;
  /** 링 두께(px) */
  thickness?: number;
  /** 가운데에 크게 표시할 값 */
  centerValue?: ReactNode;
  /** 가운데 값 아래 설명 */
  centerLabel?: ReactNode;
  /** 범례 표시 여부 */
  legend?: boolean;
  /** 범례에 표시할 최대 항목 수. 나머지는 '기타'로 합칩니다. */
  maxLegendItems?: number;
  /** 범례 배치 방향 */
  direction?: 'row' | 'column';
  colors?: string[];
  emptyText?: string;
  formatValue?: (value: number, percent: number) => string;
  ariaLabel?: string;
}

export function StatisticsDonutChart({
  data,
  size = 142,
  thickness = 26,
  centerValue,
  centerLabel,
  legend = true,
  maxLegendItems = 4,
  direction = 'row',
  colors = STATISTICS_DONUT_COLORS,
  width = '100%',
  height = 'auto',
  aspectRatio,
  emptyText = '표시할 구성비 데이터가 없습니다.',
  formatValue = (_value, percent) => `${percent.toFixed(1)}%`,
  ariaLabel = '구성비 도넛 차트',
  className,
}: StatisticsDonutChartProps) {
  const sizeStyle: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : { height }) };
  const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0);

  if (!data.length || total <= 0) {
    return <div className={styles.empty} style={sizeStyle}>{emptyText}</div>;
  }

  // 상위 maxLegendItems개만 개별 표시하고 나머지는 '기타'로 합칩니다.
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, maxLegendItems);
  const restValue = sorted.slice(maxLegendItems).reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const slices = restValue > 0 ? [...head, { label: '기타', value: restValue }] : head;

  // conic-gradient 는 누적 각도로 그리므로 구간 경계를 직접 계산합니다.
  let cursor = 0;
  const stops = slices.map((item, index) => {
    const start = cursor;
    cursor += (Math.max(0, item.value) / total) * 100;
    const end = index === slices.length - 1 ? 100 : cursor;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  });

  return (
    <div
      className={`${styles.donutWrap} ${direction === 'column' ? styles.donutWrapColumn : ''} ${className ?? ''}`}
      style={sizeStyle}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className={styles.donutRing}
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${stops.join(',')})`,
          ['--donut-thickness' as string]: `${thickness}px`,
        }}
      >
        {(centerValue !== undefined || centerLabel !== undefined) && (
          <div className={styles.donutCenter}>
            {centerValue !== undefined && <strong>{centerValue}</strong>}
            {centerLabel !== undefined && <span>{centerLabel}</span>}
          </div>
        )}
      </div>

      {legend && (
        <div className={styles.donutLegend}>
          {slices.map((item, index) => {
            const percent = (Math.max(0, item.value) / total) * 100;
            return (
              <div key={`${item.label}-${index}`}>
                <i style={{ background: colors[index % colors.length] }} />
                <span>{item.label}</span>
                <strong>{formatValue(item.value, percent)}</strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
