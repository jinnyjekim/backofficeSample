import { useCallback } from 'react';
import { DatePicker } from '../../../components/forms/DatePicker';
import shared from '../shared.module.css';
import styles from './ExpirationDateFilter.module.css';

export type ExpirationPreset = 'all' | '7d' | '30d' | '90d' | 'expired' | 'custom';

export interface ExpirationFilterValue {
  preset: ExpirationPreset;
  startDate: string;
  endDate: string;
}

export interface ExpirationDateFilterProps {
  value: ExpirationFilterValue;
  onChange: (value: ExpirationFilterValue) => void;
  className?: string;
  /** 기준일자 (기본값: 오늘 '2026-09-09') */
  baseDate?: string;
}

const DEFAULT_BASE_DATE = '2026-09-09';

function pad(num: number): string {
  return String(num).padStart(2, '0');
}

function formatDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(baseStr: string, days: number): string {
  const [y, m, d] = baseStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDateString(date);
}

export function ExpirationDateFilter({
  value,
  onChange,
  className = '',
  baseDate = DEFAULT_BASE_DATE,
}: ExpirationDateFilterProps) {
  const handlePresetChange = useCallback(
    (preset: ExpirationPreset) => {
      if (preset === 'all') {
        onChange({ preset: 'all', startDate: '', endDate: '' });
      } else if (preset === '7d') {
        onChange({
          preset: '7d',
          startDate: baseDate,
          endDate: addDays(baseDate, 7),
        });
      } else if (preset === '30d') {
        onChange({
          preset: '30d',
          startDate: baseDate,
          endDate: addDays(baseDate, 30),
        });
      } else if (preset === '90d') {
        onChange({
          preset: '90d',
          startDate: baseDate,
          endDate: addDays(baseDate, 90),
        });
      } else if (preset === 'expired') {
        onChange({
          preset: 'expired',
          startDate: '',
          endDate: addDays(baseDate, -1),
        });
      } else {
        onChange({ ...value, preset: 'custom' });
      }
    },
    [baseDate, onChange, value],
  );

  const handleStartDateChange = useCallback(
    (startDate: string) => {
      onChange({
        ...value,
        preset: 'custom',
        startDate,
      });
    },
    [onChange, value],
  );

  const handleEndDateChange = useCallback(
    (endDate: string) => {
      onChange({
        ...value,
        preset: 'custom',
        endDate,
      });
    },
    [onChange, value],
  );

  return (
    <div className={`${shared.dateFilterField} ${styles.filterRoot} ${className}`}>
      <span>사용 기한</span>
      <div className={styles.filterControls}>
        <select
          aria-label="사용 기한 프리셋"
          className={styles.presetSelect}
          value={value.preset}
          onChange={(e) => handlePresetChange(e.target.value as ExpirationPreset)}
        >
          <option value="all">기한 전체</option>
          <option value="7d">7일 이내 (만료 임박)</option>
          <option value="30d">30일 이내</option>
          <option value="90d">90일 이내</option>
          <option value="expired">기한 만료</option>
          <option value="custom">직접 설정</option>
        </select>
        <div className={shared.dateRange}>
          <DatePicker
            aria-label="사용 기한 시작일"
            placeholder="시작일"
            controlSize="sm"
            style={{ width: 110 }}
            value={value.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
          />
          <span className={shared.dateSeparator}>~</span>
          <DatePicker
            aria-label="사용 기한 종료일"
            placeholder="종료일"
            controlSize="sm"
            style={{ width: 110 }}
            value={value.endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
