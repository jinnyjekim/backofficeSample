import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { BusinessScopeSwitch } from "../../components/business/BusinessScopeSwitch";
import { CommonButton, CommonSelect } from "../../components/common";
import styles from "../cartconversion/cartConversionExtra.module.css";
import summaryStyles from "./TransactionStatsPage.module.css";

interface StatisticsFilterToolbarProps {
  range: string;
  ranges: readonly string[];
  onRangeChange: (value: string) => void;
  compare?: string;
  compareOptions?: readonly string[];
  onCompareChange?: (value: string) => void;
  details?: ReactNode;
  onReset: () => void;
  onApply?: () => void;
  summary?: ReactNode;
}

export function StatisticsFilterToolbar({
  range,
  ranges,
  onRangeChange,
  compare,
  compareOptions,
  onCompareChange,
  details,
  onReset,
  onApply,
  summary,
}: StatisticsFilterToolbarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={styles.filterPanel}
      data-filter-expanded={expanded || undefined}
    >
      <div className={styles.filterMainRow}>
        <BusinessScopeSwitch
          value={range}
          options={[...ranges]}
          onChange={onRangeChange}
          label=""
          size="md"
        />
        {compare !== undefined && compareOptions && onCompareChange && (
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
        {onApply && (
          <CommonButton variant="emphasis" size="md" onClick={onApply}>
            조회
          </CommonButton>
        )}
      </div>
      {expanded && details && (
        <div className={styles.detailFilters}>{details}</div>
      )}
      {summary && <div className={summaryStyles.periodInfo}>{summary}</div>}
    </div>
  );
}
