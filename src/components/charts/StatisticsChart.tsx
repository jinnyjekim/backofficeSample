import type { CSSProperties, ReactNode } from 'react';
import { Chart as M2MChart, type ChartSeries } from 'm2m-uiux-react/Chart';
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
  const sizeStyle: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : { height }) };

  if (!data.length || data.every((item) => item.value === 0)) {
    return <div className={styles.empty} style={sizeStyle}>{emptyText}</div>;
  }

  const hasNegative = data.some((item) => item.value < 0);
  const chartData = data.map((item) => ({
    label: item.label,
    value: item.value >= 0 ? item.value : 0,
    negative: item.value < 0 ? item.value : 0,
  }));
  const series: ChartSeries[] = [
    { key: 'value', label: metricLabel, color },
    ...(hasNegative ? [{ key: 'negative', label: `${metricLabel} 감소`, color: negativeColor }] : []),
  ];

  return (
    <div className={`${styles.root} ${styles.chartAdapter} ${className ?? ''}`} style={sizeStyle} data-min-bar-percent={minBarPercent} data-max-label-count={maxLabelCount}>
      <M2MChart type="bar" data={chartData} xKey="label" series={series} height={typeof height === 'number' ? height : 220} showLegend={hasNegative} valueFormatter={formatValue} />
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
  const sizeStyle: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : { height }) };

  return (
    <div className={`${styles.horizontalChart} ${styles.chartAdapter} ${className ?? ''}`} style={{ ...sizeStyle, gap: rowGap, background: trackColor }} role="img" aria-label={ariaLabel}>
      <M2MChart
        type="bar"
        layout="vertical"
        data={data.map((item) => ({ label: item.label, value: item.percent ?? item.value }))}
        xKey="label"
        series={[{ key: 'value', label: '구성비', color }]}
        height={typeof height === 'number' ? height : Math.max(150, data.length * 34)}
        showLegend={false}
        valueFormatter={(value) => showPercentage ? `${Math.round(value)}%` : formatValue(value)}
      />
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
  const sizeStyle: CSSProperties = { width, ...(aspectRatio ? { aspectRatio } : { height }) };
  const chartData = labels.map((label, index) => ({ label, current: values[index] ?? 0, comparison: comparisonValues?.[index] ?? 0 }));
  const series: ChartSeries[] = [
    { key: 'current', label: '현재 기간', color },
    ...(comparisonValues ? [{ key: 'comparison', label: '이전 기간', color: comparisonColor, dashed: true }] : []),
  ];

  return (
    <div className={`${styles.root} ${styles.chartAdapter} ${className ?? ''}`} style={sizeStyle} role="img" aria-label={ariaLabel} data-show-points={showPoints} data-max-label-count={maxLabelCount}>
      <M2MChart type={fill ? 'area' : 'line'} data={chartData} xKey="label" series={series} height={typeof height === 'number' ? height : 240} showLegend={Boolean(comparisonValues)} />
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

  return (
    <div
      className={`${styles.donutWrap} ${direction === 'column' ? styles.donutWrapColumn : ''} ${className ?? ''}`}
      style={sizeStyle}
      role="img"
      aria-label={ariaLabel}
    >
      <div className={styles.donutCanvas} style={{ width: size, height: size }}>
        <M2MChart type="donut" data={slices.map((item) => ({ label: item.label, value: item.value }))} xKey="label" series={[{ key: 'value', label: ariaLabel }]} colors={colors} height={size} showAxis={false} showGrid={false} showLegend={false} valueFormatter={(value) => formatValue(value, value / total * 100)} />
        {(centerValue !== undefined || centerLabel !== undefined) && (
          <div className={styles.donutCenter} style={{ width: size - thickness * 2, height: size - thickness * 2 }}>
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
