import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import styles from "../ops/opsShared.module.css";
import pageStyles from "./SystemLogPage.module.css";
import { DataGrid } from "../../components/DataGrid";
import type {
  Cell,
  GridColumn,
  GridRow,
} from "../../components/DataGrid/types";
import { ApiLogDetailDrawer } from "./ApiLogDetailDrawer";
import { ErrorGroupDetailDrawer } from "./ErrorGroupDetailDrawer";
import {
  API_LOGS,
  ERROR_GROUPS,
  ERROR_LEVELS,
  HTTP_METHODS,
  LEVEL_META,
  MODULES,
  SLOW_MS,
  TODAY,
  errorFirstAt,
  errorLastAt,
  quickRangeDates,
  type ApiLogEntry,
  type ErrorGroup,
  type HttpMethod,
  type ModuleName,
  type QuickRange,
} from "./systemLogData";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import {
  CommonButton,
  CommonDatePicker,
  CommonInput,
  CommonSelect,
} from "../../components/common";
import { BusinessScopeSwitch } from "../../components/business/BusinessScopeSwitch";

type Tab = "api" | "error";
const TABS: [Tab, string][] = [
  ["api", "API 로그"],
  ["error", "오류 로그"],
];
const QUICK_RANGES: QuickRange[] = ["오늘", "어제", "최근 7일", "최근 30일"];

const API_TEMPLATE = "130px 50px minmax(160px,1.6fr) 40px 54px 80px 68px";
const API_COLUMNS: GridColumn[] = [
  { label: "요청 일시" },
  { label: "Method" },
  { label: "Endpoint" },
  { label: "Status" },
  { label: "결과" },
  { label: "처리시간" },
  { label: "요청자" },
];

const ERROR_TEMPLATE = "118px 80px 40px minmax(180px,1.6fr) 38px 114px";
const ERROR_COLUMNS: GridColumn[] = [
  { label: "오류 코드" },
  { label: "수준" },
  { label: "모듈" },
  { label: "메시지" },
  { label: "발생횟수" },
  { label: "마지막 발생" },
];

export function SystemLogPage() {
  const [tab, setTab] = useState<Tab>("api");
  const [start, setStart] = useState(quickRangeDates("최근 7일")[0]);
  const [end, setEnd] = useState(TODAY);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleName | "">("");
  const [methodFilter, setMethodFilter] = useState<HttpMethod | "">("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [minOccurrencesFilter, setMinOccurrencesFilter] = useState("");

  const [apiDrawer, setApiDrawer] = useState<ApiLogEntry | null>(null);
  const [errorDrawer, setErrorDrawer] = useState<ErrorGroup | null>(null);

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s);
    setEnd(e);
  };

  const resetFilters = () => {
    setKeyword("");
    setSearch("");
    setResultFilter("");
    setModuleFilter("");
    setMethodFilter("");
    setLevelFilter("");
    setStatusFilter("");
    setDurationFilter("");
    setMinOccurrencesFilter("");
    applyQuick("최근 7일");
  };

  const activeQuickRange = QUICK_RANGES.find((range) => {
    const [rangeStart, rangeEnd] = quickRangeDates(range);
    return rangeStart === start && rangeEnd === end;
  });

  const filteredApi = useMemo(
    () =>
      API_LOGS.filter((e) => {
        const date = e.at.slice(0, 10);
        if (date < start || date > end) return false;
        if (resultFilter && e.result !== resultFilter) return false;
        if (moduleFilter && e.module !== moduleFilter) return false;
        if (methodFilter && e.method !== methodFilter) return false;
        if (statusFilter) {
          if (
            statusFilter === "2xx" &&
            (e.statusCode < 200 || e.statusCode >= 300)
          )
            return false;
          if (
            statusFilter === "4xx" &&
            (e.statusCode < 400 || e.statusCode >= 500)
          )
            return false;
          if (
            statusFilter === "5xx" &&
            (e.statusCode < 500 || e.statusCode >= 600)
          )
            return false;
        }
        if (durationFilter) {
          if (durationFilter === "slow" && e.durationMs < SLOW_MS) return false;
          if (durationFilter === "verySlow" && e.durationMs < 2000)
            return false;
          if (durationFilter === "normal" && e.durationMs >= SLOW_MS)
            return false;
        }
        if (search) {
          const k = search.toLowerCase();
          if (
            !(
              e.endpoint.toLowerCase().includes(k) ||
              e.requester.toLowerCase().includes(k) ||
              e.id.toLowerCase().includes(k)
            )
          )
            return false;
        }
        return true;
      }),
    [
      start,
      end,
      resultFilter,
      moduleFilter,
      methodFilter,
      statusFilter,
      durationFilter,
      search,
    ],
  );

  const filteredErrors = useMemo(
    () =>
      ERROR_GROUPS.filter((g) => {
        const first = errorFirstAt(g).slice(0, 10);
        const last = errorLastAt(g).slice(0, 10);
        if (last < start || first > end) return false;
        if (levelFilter && g.level !== levelFilter) return false;
        if (moduleFilter && g.module !== moduleFilter) return false;
        if (
          minOccurrencesFilter &&
          g.occurrences.length < Number(minOccurrencesFilter)
        )
          return false;
        if (search) {
          const k = search.toLowerCase();
          if (
            !(
              g.errorCode.toLowerCase().includes(k) ||
              g.message.toLowerCase().includes(k)
            )
          )
            return false;
        }
        return true;
      }),
    [start, end, levelFilter, moduleFilter, minOccurrencesFilter, search],
  );

  const apiRows: GridRow[] = filteredApi.map((e) => {
    const isSlow = e.durationMs >= SLOW_MS;
    const cells: Cell[] = [
      {
        kind: "text",
        text: e.at.slice(0, 19),
        color: "#3f3f46",
        size: "11.5px",
        weight: 500,
        numeric: true,
      },
      {
        kind: "text",
        text: e.method,
        color: "#3f3f46",
        size: "11.5px",
        weight: 700,
      },
      {
        kind: "text",
        text: e.endpoint,
        color: "#3f3f46",
        size: "12px",
        weight: 500,
      },
      {
        kind: "text",
        text: String(e.statusCode),
        color: e.result === "성공" ? "#059669" : "#dc2626",
        size: "12px",
        weight: 700,
        numeric: true,
      },
      {
        kind: "badge",
        text: e.result,
        bg: e.result === "성공" ? "#ecfdf5" : "#fef2f2",
        fg: e.result === "성공" ? "#059669" : "#b91c1c",
      },
      {
        kind: "text",
        text: `${e.durationMs}ms${isSlow ? " 느림" : ""}`,
        color: isSlow ? "#b45309" : "#71717a",
        size: "11.5px",
        weight: isSlow ? 700 : 500,
        numeric: true,
      },
      {
        kind: "text",
        text: e.requester,
        color: "#52525b",
        size: "12px",
        weight: 500,
      },
    ];
    return { id: e.id, cells, onClick: () => setApiDrawer(e) };
  });

  const errorRows: GridRow[] = filteredErrors.map((g) => {
    const meta = LEVEL_META[g.level];
    const cells: Cell[] = [
      {
        kind: "text",
        text: g.errorCode,
        color: "#3f3f46",
        size: "12px",
        weight: 700,
      },
      { kind: "badge", text: g.level, bg: meta.bg, fg: meta.fg },
      {
        kind: "text",
        text: g.module,
        color: "#52525b",
        size: "12px",
        weight: 500,
      },
      {
        kind: "text",
        text: g.message,
        color: "#52525b",
        size: "12px",
        weight: 500,
      },
      {
        kind: "text",
        text: `${g.occurrences.length}회`,
        color: g.occurrences.length >= 10 ? "#dc2626" : "#3f3f46",
        size: "12px",
        weight: 700,
        align: "right",
        numeric: true,
      },
      {
        kind: "text",
        text: errorLastAt(g).slice(0, 16),
        color: "#71717a",
        size: "11.5px",
        weight: 500,
        numeric: true,
      },
    ];
    return { id: g.errorCode, cells, onClick: () => setErrorDrawer(g) };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>시스템 로그</div>
            <div className={styles.subtitle}>
              시스템에서 발생한 API 요청 및 오류 기록을 조회합니다. 조회
              전용이며 로그는 수정·삭제할 수 없습니다.
            </div>
          </div>
        </div>
      </div>

      <div className={pageStyles.viewTabs}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`${pageStyles.viewTabBtn} ${tab === key ? pageStyles.viewTabActive : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        className={pageStyles.filterPanel}
        data-filter-expanded={showAdvanced || undefined}
      >
        <form
          className={pageStyles.filterMainRow}
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(keyword.trim());
          }}
        >
          <div className={pageStyles.dateRangeFields}>
            <CommonDatePicker
              size="md"
              clearable={false}
              value={start}
              aria-label="조회 시작일"
              onChange={(value) => {
                if (!Array.isArray(value) && value) setStart(value);
              }}
            />
            <span className={pageStyles.dateSeparator} aria-hidden="true">
              -
            </span>
            <CommonDatePicker
              size="md"
              clearable={false}
              value={end}
              aria-label="조회 종료일"
              onChange={(value) => {
                if (!Array.isArray(value) && value) setEnd(value);
              }}
            />
          </div>
          <BusinessScopeSwitch
            value={activeQuickRange}
            options={QUICK_RANGES}
            onChange={applyQuick}
            label=""
            size="md"
          />
          <CommonInput.Search
            className={pageStyles.searchInput}
            size="md"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(value) => setSearch(value.trim())}
            onClear={() => {
              setKeyword("");
              setSearch("");
            }}
            placeholder={
              tab === "api"
                ? "Endpoint, 요청자 또는 Request ID 검색"
                : "오류 코드 또는 메시지 검색"
            }
            aria-label={tab === "api" ? "API 로그 검색" : "오류 로그 검색"}
          />
          <span className={pageStyles.filterSpacer} />
          <CommonButton
            type="button"
            variant="secondary"
            size="md"
            icon={<SlidersHorizontal size={14} aria-hidden="true" />}
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((visible) => !visible)}
          >
            상세 필터
            {showAdvanced ? (
              <ChevronUp size={14} aria-hidden="true" />
            ) : (
              <ChevronDown size={14} aria-hidden="true" />
            )}
          </CommonButton>
          <CommonButton
            type="button"
            variant="secondary"
            size="md"
            icon={<RotateCcw size={13} aria-hidden="true" />}
            onClick={resetFilters}
          >
            초기화
          </CommonButton>
        </form>

        {showAdvanced && (
          <div className={pageStyles.detailFilters}>
            <label className={pageStyles.filterField}>
              <span>서비스 모듈</span>
              <CommonSelect
                className={pageStyles.filterSelect}
                size="md"
                aria-label="서비스 모듈"
                options={[
                  { value: "", label: "서비스/모듈 전체" },
                  ...MODULES.map((m) => ({ value: m, label: m })),
                ]}
                value={moduleFilter}
                onChange={(val) => setModuleFilter(val as ModuleName | "")}
              />
            </label>
            {tab === "api" ? (
              <>
                <label className={pageStyles.filterField}>
                  <span>결과</span>
                  <CommonSelect
                    className={pageStyles.filterSelect}
                    size="md"
                    aria-label="결과"
                    options={[
                      { value: "", label: "결과 전체" },
                      { value: "성공", label: "성공" },
                      { value: "실패", label: "실패" },
                    ]}
                    value={resultFilter}
                    onChange={(val) => setResultFilter(val)}
                  />
                </label>
                <label className={pageStyles.filterField}>
                  <span>요청 방식</span>
                  <CommonSelect
                    className={pageStyles.filterSelect}
                    size="md"
                    aria-label="요청 방식"
                    options={[
                      { value: "", label: "Method 전체" },
                      ...HTTP_METHODS.map((m) => ({ value: m, label: m })),
                    ]}
                    value={methodFilter}
                    onChange={(val) => setMethodFilter(val as HttpMethod | "")}
                  />
                </label>
                <label className={pageStyles.filterField}>
                  <span>상태 코드</span>
                  <CommonSelect
                    className={pageStyles.filterSelect}
                    size="md"
                    aria-label="상태 코드"
                    options={[
                      { value: "", label: "상태 코드 전체" },
                      { value: "2xx", label: "2xx 정상" },
                      { value: "4xx", label: "4xx 클라이언트 오류" },
                      { value: "5xx", label: "5xx 서버 오류" },
                    ]}
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                  />
                </label>
                <label className={pageStyles.filterField}>
                  <span>처리 시간</span>
                  <CommonSelect
                    className={pageStyles.filterSelect}
                    size="md"
                    aria-label="처리 시간"
                    options={[
                      { value: "", label: "처리 시간 전체" },
                      { value: "slow", label: "지연 로그 (800ms 이상)" },
                      { value: "verySlow", label: "심각 지연 (2,000ms 이상)" },
                      { value: "normal", label: "정상 (800ms 미만)" },
                    ]}
                    value={durationFilter}
                    onChange={(val) => setDurationFilter(val)}
                  />
                </label>
              </>
            ) : (
              <>
                <label className={pageStyles.filterField}>
                  <span>오류 수준</span>
                  <CommonSelect
                    className={pageStyles.filterSelect}
                    size="md"
                    aria-label="오류 수준"
                    options={[
                      { value: "", label: "오류 수준 전체" },
                      ...ERROR_LEVELS.map((l) => ({ value: l, label: l })),
                    ]}
                    value={levelFilter}
                    onChange={(val) => setLevelFilter(val)}
                  />
                </label>
                <label className={pageStyles.filterField}>
                  <span>발생 횟수</span>
                  <CommonSelect
                    className={pageStyles.filterSelect}
                    size="md"
                    aria-label="발생 횟수"
                    options={[
                      { value: "", label: "발생 횟수 전체" },
                      { value: "2", label: "2회 이상" },
                      { value: "3", label: "3회 이상" },
                      { value: "5", label: "5회 이상" },
                    ]}
                    value={minOccurrencesFilter}
                    onChange={(val) => setMinOccurrencesFilter(val)}
                  />
                </label>
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.headTop} style={{ padding: "0 24px" }}>
        <div className={styles.resultRow} style={{ marginTop: 0 }}>
          <span className={styles.resultLabel}>
            총{" "}
            {(tab === "api"
              ? filteredApi.length
              : filteredErrors.length
            ).toLocaleString("ko-KR")}
            건
          </span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select
              className={styles.pageSizeSelect}
              defaultValue="20개씩 보기"
            >
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        {tab === "api" ? (
          <DataGrid
            columns={API_COLUMNS}
            rows={apiRows}
            gridTemplate={API_TEMPLATE}
            minWidth="800px"
            empty={apiRows.length === 0}
            emptyText="조회된 로그가 없습니다."
            emptySubtext="기간 또는 검색 조건을 변경해 주세요."
            emptyActionLabel="초기화"
            emptyActionClick={resetFilters}
          />
        ) : (
          <DataGrid
            columns={ERROR_COLUMNS}
            rows={errorRows}
            gridTemplate={ERROR_TEMPLATE}
            minWidth="750px"
            empty={errorRows.length === 0}
            emptyText="조회 기간에 발생한 오류가 없습니다."
            emptySubtext="기간 또는 검색 조건을 변경해 주세요."
            emptyActionLabel="초기화"
            emptyActionClick={resetFilters}
          />
        )}
      </div>

      {apiDrawer && (
        <ApiLogDetailDrawer
          entry={apiDrawer}
          onClose={() => setApiDrawer(null)}
        />
      )}
      {errorDrawer && (
        <ErrorGroupDetailDrawer
          group={errorDrawer}
          onClose={() => setErrorDrawer(null)}
        />
      )}
    </div>
  );
}
