import { useMemo, useState } from "react";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { CommonButton, ExcelDownloadButton } from "../../components/common";
import shared from "../ops/opsShared.module.css";
import { InventoryDetailDrawer } from "./InventoryDetailDrawer";
import styles from "./InventoryFocusedPages.module.css";
import {
  skuRows,
  type InventoryViewRow,
  type SaleStatus,
} from "./inventoryData";

type SoldOutFilter = "전체" | "입고 예정" | "입고 미정" | "예약 초과";

const QUICK_FILTERS: SoldOutFilter[] = [
  "전체",
  "입고 예정",
  "입고 미정",
  "예약 초과",
];
const COLUMNS: GridColumn[] = [
  { label: "상품" },
  { label: "SKU / 옵션" },
  { label: "판매 상태" },
  { label: "현재고", align: "right" },
  { label: "예약", align: "right" },
  { label: "판매 가능", align: "right" },
  { label: "입고 예정", align: "right" },
  { label: "품절 원인" },
  { label: "최근 출고" },
];

function matchesQuickFilter(row: InventoryViewRow, filter: SoldOutFilter) {
  if (filter === "입고 예정") return row.inboundExpected > 0;
  if (filter === "입고 미정") return row.inboundExpected === 0;
  if (filter === "예약 초과")
    return row.reserved > row.current || row.available < 0;
  return true;
}

function soldOutReason(row: InventoryViewRow) {
  if (row.available < 0 || row.reserved > row.current)
    return "예약 수량이 현재고를 초과했습니다.";
  if (row.issues.length) return row.issues.join(" · ");
  return row.current === 0
    ? "현재고가 없습니다."
    : "판매 가능 재고가 없습니다.";
}

function saleStatusMeta(status: SaleStatus) {
  if (status === "판매중") return { dot: "#10b981", fg: "#047857" };
  if (status === "판매예정") return { dot: "#3b82f6", fg: "#2563eb" };
  return { dot: "#a1a1aa", fg: "#71717a" };
}

export function SoldOutProductsPage() {
  const sourceRows = useMemo(
    () => skuRows().filter((row) => row.inventoryManaged && row.available <= 0),
    [],
  );
  const categories = useMemo(
    () => [...new Set(sourceRows.map((row) => row.category))],
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
  const [quickFilter, setQuickFilter] = useState<SoldOutFilter>("전체");
  const [category, setCategory] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [saleStatus, setSaleStatus] = useState<SaleStatus | "">("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      sourceRows.filter((row) => {
        if (!matchesQuickFilter(row, quickFilter)) return false;
        const haystack =
          `${row.productName} ${row.productCode} ${row.sku ?? ""} ${row.option} ${row.brand}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (category && row.category !== category) return false;
        if (saleStatus && row.saleStatus !== saleStatus) return false;
        if (
          warehouse &&
          !row.sourceSkus.some((sku) =>
            sku.warehouses.some((item) => item.warehouse === warehouse),
          )
        )
          return false;
        return true;
      }),
    [category, quickFilter, saleStatus, search, sourceRows, warehouse],
  );

  const reset = () => {
    setKeyword("");
    setSearch("");
    setQuickFilter("전체");
    setCategory("");
    setWarehouse("");
    setSaleStatus("");
  };
  const detail = sourceRows.find((row) => row.id === detailId) ?? null;
  const rows: GridRow[] = filtered.map((row): GridRow => {
    const saleMeta = saleStatusMeta(row.saleStatus);
    return {
      id: row.id,
      onClick: () => setDetailId(row.id),
      bg: row.available < 0 ? "#fffafa" : "#fffdfd",
      mark: row.available < 0 ? "inset 3px 0 #ef4444" : undefined,
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
          kind: "statusDot",
          text: row.saleStatus,
          dot: saleMeta.dot,
          fg: saleMeta.fg,
        },
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
          color: row.reserved > row.current ? "#dc2626" : "#71717a",
        },
        {
          kind: "text",
          text: row.available.toLocaleString(),
          align: "right",
          numeric: true,
          weight: 700,
          color: "#dc2626",
        },
        {
          kind: "badgeSub",
          text: row.inboundExpected
            ? `${row.inboundExpected.toLocaleString()}개`
            : "-",
          subText: row.inboundDate ?? "일정 미정",
          bg: row.inboundExpected ? "#eff6ff" : "#f4f4f5",
          fg: row.inboundExpected ? "#2563eb" : "#a1a1aa",
          align: "right",
        },
        {
          kind: "custom",
          content: (
            <span className={styles.issueText}>{soldOutReason(row)}</span>
          ),
          exportValue: soldOutReason(row),
        },
        {
          kind: "stack",
          title: row.lastOutboundAt?.slice(0, 10) ?? "변동 없음",
          subtitle: row.lastOutboundAt?.slice(11) ?? "",
        },
      ],
    };
  });

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>품절 상품</h1>
            <p className={shared.subtitle}>
              판매 가능 재고가 없거나 예약 수량이 현재고를 초과한 SKU를
              확인합니다.
            </p>
          </div>
        </div>
        <div className={styles.definitionStrip}>
          품절 기준 = 판매 가능 재고(현재고 − 예약재고 − 기타 잠금)가 0 이하인
          SKU
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
              aria-label="품절 상품 검색"
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
              <span>판매 상태</span>
              <select
                aria-label="판매 상태"
                className={shared.selectSm}
                value={saleStatus}
                onChange={(event) =>
                  setSaleStatus(event.target.value as SaleStatus | "")
                }
              >
                <option value="">전체 판매 상태</option>
                <option>판매중</option>
                <option>판매중지</option>
                <option>판매예정</option>
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
            <span className={shared.rowSpacer} />
            <CommonButton
              type="button"
              variant="secondary"
              size="sm"
              className={shared.detailFilterBtn}
            >
              상세 필터
            </CommonButton>
            <CommonButton
              type="button"
              variant="ghost"
              size="sm"
              className={shared.resetBtn}
              onClick={reset}
            >
              초기화
            </CommonButton>
          </div>
        </div>
      </div>
      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>
            총 {filtered.length}개 품절 SKU
          </span>
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
          gridTemplate="210px 145px 80px 65px 65px 75px 95px minmax(160px,1fr) 100px"
          minWidth="1100px"
          empty={!filtered.length}
          emptyText="조건에 맞는 품절 상품이 없습니다."
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
