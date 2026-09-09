import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { BusinessScopeSwitch } from "../../components/business/BusinessScopeSwitch";
import {
  CommonButton,
  CommonCheckbox,
  CommonDatePicker,
  CommonSelect,
} from "../../components/common";
import styles from "../cartconversion/cartConversionExtra.module.css";
import summaryStyles from "./TransactionStatsPage.module.css";

interface StatisticsFilterToolbarProps {
  range?: string;
  ranges?: readonly string[];
  onRangeChange?: (value: string) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  dateAriaLabel?: string;
  compare?: string;
  compareOptions?: readonly string[];
  onCompareChange?: (value: string) => void;
  compareChecked?: boolean;
  onCompareCheckedChange?: (checked: boolean) => void;
  details?: ReactNode;
  onReset: () => void;
  onApply?: () => void;
  summary?: ReactNode;
}

export function StatisticsFilterToolbar({
  range,
  ranges,
  onRangeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  dateAriaLabel = "통계 조회",
  compare,
  compareOptions,
  onCompareChange,
  compareChecked,
  onCompareCheckedChange,
  details,
  onReset,
  onApply,
  summary,
}: StatisticsFilterToolbarProps) {
  const [expanded, setExpanded] = useState(false);
  const compactCompare =
    compare !== undefined &&
    compareOptions?.length === 2 &&
    compareOptions.includes("비교 없음") &&
    onCompareChange;

  return (
    <div
      className={styles.filterPanel}
      data-filter-expanded={expanded || undefined}
    >
      <div className={styles.filterMainRow}>
        {startDate !== undefined && onStartDateChange && (
          <div className={styles.dateRangeFields}>
            <CommonDatePicker
              size="md"
              clearable={false}
              value={startDate}
              aria-label={endDate === undefined ? `${dateAriaLabel} 기준일` : `${dateAriaLabel} 시작일`}
              onChange={(value) => {
                if (!Array.isArray(value) && value) onStartDateChange(value);
              }}
            />
            {endDate !== undefined && onEndDateChange && (
              <>
                <span className={styles.dateSeparator} aria-hidden="true">~</span>
                <CommonDatePicker
                  size="md"
                  clearable={false}
                  value={endDate}
                  aria-label={`${dateAriaLabel} 종료일`}
                  onChange={(value) => {
                    if (!Array.isArray(value) && value) onEndDateChange(value);
                  }}
                />
              </>
            )}
          </div>
        )}
        {onApply && (
          <CommonButton variant="emphasis" size="md" onClick={onApply}>
            조회
          </CommonButton>
        )}
        {compareChecked !== undefined && onCompareCheckedChange && (
          <CommonCheckbox
            className={styles.compareCheck}
            size="sm"
            checked={compareChecked}
            onChange={onCompareCheckedChange}
          >
            이전 기간과 비교
          </CommonCheckbox>
        )}
        {compactCompare && (
          <CommonCheckbox
            className={styles.compareCheck}
            size="sm"
            checked={compare !== "비교 없음"}
            onChange={(checked) => {
              const enabledValue = compareOptions.find((value) => value !== "비교 없음");
              onCompareChange(checked ? (enabledValue ?? "이전 기간") : "비교 없음");
            }}
          >
            이전 기간과 비교
          </CommonCheckbox>
        )}
        {compare !== undefined && compareOptions && onCompareChange && !compactCompare && (
          <CommonSelect
            className={styles.filterSelect}
            size="md"
            aria-label="비교 기간"
            value={compare}
            options={compareOptions.map((value) => ({ label: value, value }))}
            onChange={(value) => onCompareChange(String(value))}
          />
        )}
        <span className={styles.filterSpacer} />
        {details && (
          <CommonButton
            variant="secondary"
            size="md"
            icon={<SlidersHorizontal size={14} aria-hidden="true" />}
            aria-expanded={expanded}
            onClick={() => setExpanded((visible) => !visible)}
          >
            상세 필터
            {expanded ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </CommonButton>
        )}
        <CommonButton
          variant="secondary"
          size="md"
          icon={<RotateCcw size={13} aria-hidden="true" />}
          onClick={onReset}
        >
          초기화
        </CommonButton>
      </div>
      {range !== undefined && ranges?.length && onRangeChange && (
        <div className={styles.quickRangeRow}>
          <BusinessScopeSwitch
            value={range}
            options={[...ranges]}
            onChange={onRangeChange}
            label=""
            size="sm"
          />
        </div>
      )}
      {expanded && details && (
        <div className={styles.detailFilters}>{details}</div>
      )}
      {summary && <div className={summaryStyles.periodInfo}>{summary}</div>}
    </div>
  );
}
