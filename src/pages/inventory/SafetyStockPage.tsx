import { useMemo, useState } from "react";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { CommonButton, CommonInput, ExcelDownloadButton } from "../../components/common";
import shared from "../ops/opsShared.module.css";
import { InventoryDetailDrawer } from "./InventoryDetailDrawer";
import styles from "./InventoryFocusedPages.module.css";
import {
  inventoryStatus,
  skuRows,
  type InventoryStatus,
  type InventoryViewRow,
} from "./inventoryData";

type SafetyFilter = "전체" | "재고 부족" | "품절" | "미설정" | "알림 꺼짐";

const QUICK_FILTERS: SafetyFilter[] = [
  "전체",
  "재고 부족",
  "품절",
  "미설정",
  "알림 꺼짐",
];
const COLUMNS: GridColumn[] = [
  { label: "상품" },
  { label: "SKU / 옵션" },
  { label: "현재고", align: "right" },
  { label: "예약", align: "right" },
  { label: "판매 가능", align: "right" },
  { label: "안전재고", align: "right" },
  { label: "여유재고", align: "right" },
  { label: "부족 알림" },
  { label: "재고 상태" },
  { label: "최근 변동" },
];
const STATUS_META: Record<InventoryStatus, { bg: string; fg: string }> = {
  정상: { bg: "#ecfdf5", fg: "#047857" },
  "재고 부족": { bg: "#fff7ed", fg: "#c2410c" },
  품절: { bg: "#fef2f2", fg: "#dc2626" },
  미관리: { bg: "#f4f4f5", fg: "#71717a" },
};

function matchesQuickFilter(row: InventoryViewRow, filter: SafetyFilter) {
  if (filter === "재고 부족") return inventoryStatus(row) === "재고 부족";
  if (filter === "품절") return inventoryStatus(row) === "품절";
  if (filter === "미설정") return row.safety === null;
  if (filter === "알림 꺼짐")
    return !row.sourceSkus.some((sku) => sku.alertEnabled);
  return true;
}

export interface SafetyStockPageProps {
  pageTitle?: string;
  pageSubtitle?: string;
  headerTabs?: React.ReactNode;
}

export function SafetyStockPage({
  pageTitle,
  pageSubtitle,
  headerTabs,
}: SafetyStockPageProps = {}) {
  const sourceRows = useMemo(
    () => skuRows().filter((row) => row.inventoryManaged),
    [],
  );
  const categories = useMemo(
    () => [...new Set(sourceRows.map((row) => row.category))],
    [sourceRows],
  );
  const brands = useMemo(
    () => [...new Set(sourceRows.map((row) => row.brand))],
    [sourceRows],
  );
  const warehouses = useMemo(
    () => [
      ...new Set(
        sourceRows.flatMap((row) =>
          row.sourceSkus.flatMap((sku) =>
            sku.warehouses.map((item) => item.warehouse),
          ),
        ),
      ),
    ],
    [sourceRows],
  );
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<SafetyFilter>("전체");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [safetyFilter, setSafetyFilter] = useState("");
  const [availableMin, setAvailableMin] = useState("");
  const [availableMax, setAvailableMax] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      sourceRows.filter((row) => {
        if (!matchesQuickFilter(row, quickFilter)) return false;
        const haystack =
          `${row.productName} ${row.productCode} ${row.sku ?? ""} ${row.option} ${row.brand}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (category && row.category !== category) return false;
        if (brand && row.brand !== brand) return false;
        if (
          warehouse &&
          !row.sourceSkus.some((sku) =>
            sku.warehouses.some((item) => item.warehouse === warehouse),
          )
        )
          return false;
        if (safetyFilter === "설정" && row.safety === null) return false;
        if (safetyFilter === "미설정" && row.safety !== null) return false;
        if (availableMin && row.available < Number(availableMin)) return false;
        if (availableMax && row.available > Number(availableMax)) return false;
        return true;
      }),
    [
      brand,
      category,
      quickFilter,
      search,
      sourceRows,
      warehouse,
      safetyFilter,
      availableMin,
      availableMax,
    ],
  );

  const reset = () => {
    setKeyword("");
    setSearch("");
    setQuickFilter("전체");
    setCategory("");
    setBrand("");
    setWarehouse("");
    setSafetyFilter("");
    setAvailableMin("");
    setAvailableMax("");
  };
  const detail = sourceRows.find((row) => row.id === detailId) ?? null;
  const rows: GridRow[] = filtered.map((row): GridRow => {
    const status = inventoryStatus(row);
    const meta = STATUS_META[status];
    const buffer = row.safety === null ? null : row.available - row.safety;
    const latest =
      [row.lastInboundAt, row.lastOutboundAt].filter(Boolean).sort().at(-1) ??
      null;
    const alertEnabled = row.sourceSkus.some((sku) => sku.alertEnabled);
    return {
      id: row.id,
      onClick: () => setDetailId(row.id),
      bg:
        status === "품절"
          ? "#fffafa"
          : status === "재고 부족"
            ? "#fffdf8"
            : undefined,
      cells: [
        {
          kind: "thumbTitle",
          thumb: row.thumbnail,
          title: row.productName,
          id: row.productCode,
          onClick: () => setDetailId(row.id),
        },
        { kind: "stack", title: row.sku ?? "-", subtitle: row.option },
        {
          kind: "text",
          text: row.current.toLocaleString(),
          align: "right",
          numeric: true,
        },
        {
          kind: "text",
          text: row.reserved.toLocaleString(),
          align: "right",
          numeric: true,
          color: "#71717a",
        },
        {
          kind: "text",
          text: row.available.toLocaleString(),
          align: "right",
          numeric: true,
          weight: 700,
          color:
            row.available <= 0
              ? "#dc2626"
              : status === "재고 부족"
                ? "#c2410c"
                : "#18181b",
        },
        {
          kind: "text",
          text: row.safety?.toLocaleString() ?? "미설정",
          align: "right",
          numeric: row.safety !== null,
          color: row.safety === null ? "#a1a1aa" : "#52525b",
        },
        {
          kind: "text",
          text: buffer === null ? "-" : buffer.toLocaleString(),
          align: "right",
          numeric: true,
          weight: buffer !== null && buffer <= 0 ? 700 : 400,
          color: buffer !== null && buffer <= 0 ? "#dc2626" : "#52525b",
        },
        {
          kind: "statusDot",
          text: alertEnabled ? "사용" : "사용 안 함",
          dot: alertEnabled ? "#10b981" : "#a1a1aa",
          fg: alertEnabled ? "#047857" : "#71717a",
        },
        { kind: "badge", text: status, bg: meta.bg, fg: meta.fg },
        {
          kind: "stack",
          title: latest?.slice(0, 10) ?? "변동 없음",
          subtitle: latest?.slice(11) ?? "",
        },
      ],
    };
  });

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>{pageTitle ?? "안전 재고"}</h1>
            <p className={shared.subtitle}>
              {pageSubtitle ??
                "SKU별 안전재고 설정값과 현재 판매 가능 수량의 차이를 확인합니다."}
            </p>
          </div>
        </div>
        {headerTabs}
        <div className={styles.definitionStrip}>
          여유재고 = 판매 가능 재고 − 안전재고 · 여유재고가 0 이하이면 재고
          부족으로 분류합니다.
        </div>
        <div className={shared.filterBox}>
          <form
            className={shared.filterRow1}
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(keyword.trim());
            }}
          >
            <input
              aria-label="안전 재고 검색"
              className={shared.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="상품명 / 상품코드 / SKU 검색"
            />
            <CommonButton
              type="submit"
              variant="emphasis"
              size="sm"
              className={shared.searchBtn}
            >
              조회
            </CommonButton>
            <div className={shared.quickFilters}>
              {QUICK_FILTERS.map((filter) => {
                const active = quickFilter === filter;
                return (
                  <CommonButton
                    key={filter}
                    variant={active ? "primary-light" : "secondary"}
                    size="md"
                    className={`${shared.qfBtn} ${active ? styles.quickActive : ""}`}
                    onClick={() => setQuickFilter(filter)}
                  >
                    <span className={shared.qfLabel}>{filter}</span>
                    <span className={shared.qfCount}>
                      {
                        sourceRows.filter((row) =>
                          matchesQuickFilter(row, filter),
                        ).length
                      }
                    </span>
                  </CommonButton>
                );
              })}
            </div>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField">
              <span>카테고리</span>
              <select
                aria-label="카테고리"
                className={shared.selectSm}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">전체 카테고리</option>
                {categories.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="globalFilterField">
              <span>브랜드</span>
              <select
                aria-label="브랜드"
                className={shared.selectSm}
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
              >
                <option value="">전체 브랜드</option>
                {brands.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="globalFilterField">
              <span>창고</span>
              <select
                aria-label="창고"
                className={shared.selectSm}
                value={warehouse}
                onChange={(event) => setWarehouse(event.target.value)}
              >
                <option value="">전체 창고</option>
                {warehouses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={shared.detailFilterBtn}
              onClick={() => setShowAdvanced((value) => !value)}
            >
              상세 필터
            </button>
            <span className={shared.rowSpacer} />
            <button type="button" className={shared.resetBtn} onClick={reset}>
              초기화
            </button>
            {showAdvanced && (
              <>
                <label className="globalFilterField">
                  <span>안전재고</span>
                  <select
                    aria-label="안전재고"
                    className={shared.selectSm}
                    value={safetyFilter}
                    onChange={(event) => setSafetyFilter(event.target.value)}
                  >
                    <option value="">전체 안전재고</option>
                    <option value="설정">설정</option>
                    <option value="미설정">미설정</option>
                  </select>
                </label>
                <label className={shared.dateFilterField}>
                  <span>판매 가능 수량</span>
                  <span className={shared.dateRange}>
                    <CommonInput.Number
                      size="md"
                      clearable={false}
                      min={0}
                      style={{ width: 88 }}
                      value={availableMin}
                      onChange={(event) => setAvailableMin(event.target.value)}
                      placeholder="최소"
                    />
                    <span className={shared.dateSeparator}>~</span>
                    <CommonInput.Number
                      size="md"
                      clearable={false}
                      min={0}
                      style={{ width: 88 }}
                      value={availableMax}
                      onChange={(event) => setAvailableMax(event.target.value)}
                      placeholder="최대"
                    />
                  </span>
                </label>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length}개 SKU</span>
          <div className={shared.resultActions}>
            <ExcelDownloadButton data-grid-download />
            <select
              aria-label="페이지당 표시 개수"
              className={shared.pageSizeSelect}
            >
              <option>20개씩</option>
              <option>50개씩</option>
            </select>
          </div>
        </div>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="205px 145px 62px 62px 72px 72px 72px 82px 82px 100px"
          minWidth="1050px"
          empty={!filtered.length}
          emptyText="조건에 맞는 안전재고 항목이 없습니다."
          emptySubtext="검색어나 필터 조건을 변경해 주세요."
          emptyActionLabel="초기화"
          emptyActionClick={reset}
          showPagination
          pages={[{ label: "‹" }, { label: "1", active: true }, { label: "›" }]}
          rangeLabel={
            filtered.length
              ? `1–${filtered.length} / ${filtered.length}`
              : "0건"
          }
        />
      </div>
      {detail && (
        <InventoryDetailDrawer row={detail} onClose={() => setDetailId(null)} />
      )}
    </section>
  );
}
