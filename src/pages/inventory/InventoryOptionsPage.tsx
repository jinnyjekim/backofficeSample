import { useMemo, useState } from "react";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridRow } from "../../components/DataGrid/types";
import { CommonButton, ExcelDownloadButton } from "../../components/common";
import shared from "../ops/opsShared.module.css";
import drawer from "../ops/opsDrawerShared.module.css";
import { InventoryDetailDrawer } from "./InventoryDetailDrawer";
import styles from "./InventoryStatusPage.module.css";
import {
  INVENTORY_PRODUCTS,
  inventoryStatus,
  skuRows,
  type InventoryProduct,
  type InventorySku,
  type InventoryStatus,
  type InventoryViewRow,
  type SaleStatus,
  type StockMovement,
} from "./inventoryData";

type QuickFilter =
  | "전체"
  | "정상"
  | "재고 부족"
  | "품절"
  | "확인 필요"
  | "입고 예정"
  | "출고 예정";
type Modal = "adjust" | "safety" | null;

const QUICK_FILTERS: QuickFilter[] = [
  "전체",
  "정상",
  "재고 부족",
  "품절",
  "확인 필요",
  "입고 예정",
  "출고 예정",
];

const COLUMNS = [
  { label: "상품" },
  { label: "SKU / 옵션" },
  { label: "현재고", align: "right" as const },
  { label: "예약", align: "right" as const },
  { label: "판매 가능", align: "right" as const },
  { label: "입고 예정", align: "right" as const },
  { label: "출고 예정", align: "right" as const },
  { label: "안전재고", align: "right" as const },
  { label: "판매 상태" },
  { label: "재고 상태" },
  { label: "최근 변동" },
  { label: "관리", align: "right" as const },
];

const STATUS_META: Record<InventoryStatus, { bg: string; fg: string }> = {
  정상: { bg: "#ecfdf5", fg: "#047857" },
  "재고 부족": { bg: "#fff7ed", fg: "#c2410c" },
  품절: { bg: "#fef2f2", fg: "#dc2626" },
  미관리: { bg: "#f4f4f5", fg: "#71717a" },
};

function matchesQuickFilter(row: InventoryViewRow, filter: QuickFilter) {
  const status = inventoryStatus(row);
  if (filter === "정상") return status === "정상";
  if (filter === "재고 부족") return status === "재고 부족";
  if (filter === "품절") return status === "품절";
  if (filter === "확인 필요") return row.issues.length > 0;
  if (filter === "입고 예정") return row.inboundExpected > 0;
  if (filter === "출고 예정") return row.outboundExpected > 0;
  return true;
}

function adjustedWarehouses(sku: InventorySku, delta: number) {
  if (!sku.warehouses.length) return sku.warehouses;
  if (delta >= 0)
    return sku.warehouses.map((item, index) =>
      index === 0 ? { ...item, current: item.current + delta } : item,
    );
  let remaining = Math.abs(delta);
  return sku.warehouses.map((item) => {
    const decrease = Math.min(item.current, remaining);
    remaining -= decrease;
    return { ...item, current: item.current - decrease };
  });
}

export function InventoryOptionsPage() {
  const [products, setProducts] =
    useState<InventoryProduct[]>(INVENTORY_PRODUCTS);
  const sourceRows = useMemo(() => skuRows(products), [products]);
  const allSkus = useMemo(
    () =>
      products.flatMap((product) =>
        product.skus.map((sku) => ({ product, sku })),
      ),
    [products],
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
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("전체");
  const [stockStatus, setStockStatus] = useState("");
  const [saleStatus, setSaleStatus] = useState<SaleStatus | "">("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [safetyFilter, setSafetyFilter] = useState("");
  const [availableMin, setAvailableMin] = useState("");
  const [availableMax, setAvailableMax] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [adjustSkuId, setAdjustSkuId] = useState("");
  const [adjustMode, setAdjustMode] = useState<"증감" | "최종 수량 지정">(
    "증감",
  );
  const [adjustValue, setAdjustValue] = useState("");
  const [adjustReason, setAdjustReason] = useState("재고 실사 차이");
  const [adjustDetail, setAdjustDetail] = useState("");
  const [safetyIds, setSafetyIds] = useState<string[]>([]);
  const [safetyValue, setSafetyValue] = useState("10");
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [toast, setToast] = useState("");

  const filtered = useMemo(
    () =>
      sourceRows.filter((row) => {
        if (!matchesQuickFilter(row, quickFilter)) return false;
        const haystack =
          `${row.productName} ${row.productCode} ${row.sku ?? ""} ${row.option} ${row.brand}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (
          stockStatus === "확인 필요"
            ? row.issues.length === 0
            : stockStatus && inventoryStatus(row) !== stockStatus
        )
          return false;
        if (saleStatus && row.saleStatus !== saleStatus) return false;
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
      availableMax,
      availableMin,
      brand,
      category,
      quickFilter,
      safetyFilter,
      saleStatus,
      search,
      sourceRows,
      stockStatus,
      warehouse,
    ],
  );

  const detail = sourceRows.find((row) => row.id === detailId) ?? null;
  const selectedSku =
    allSkus.find((item) => item.sku.id === adjustSkuId)?.sku ?? null;
  const adjustmentDelta =
    selectedSku && adjustValue !== ""
      ? adjustMode === "증감"
        ? Number(adjustValue)
        : Number(adjustValue) - selectedSku.current
      : null;
  const adjustmentAfter =
    selectedSku && adjustmentDelta !== null
      ? selectedSku.current + adjustmentDelta
      : null;

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const openAdjust = (row?: InventoryViewRow) => {
    const first =
      row?.sourceSkus.find((sku) => sku.inventoryManaged) ??
      allSkus.find((item) => item.sku.inventoryManaged)?.sku;
    setAdjustSkuId(first?.id ?? "");
    setAdjustMode("증감");
    setAdjustValue("");
    setAdjustReason("재고 실사 차이");
    setAdjustDetail("");
    setModal("adjust");
  };

  const openSafety = (ids: string[]) => {
    setSafetyIds(ids);
    const first = allSkus.find((item) => ids.includes(item.sku.id))?.sku;
    setSafetyValue(String(first?.safety ?? 10));
    setAlertEnabled(first?.alertEnabled ?? true);
    setModal("safety");
  };

  const updateSku = (
    id: string,
    updater: (sku: InventorySku) => InventorySku,
  ) =>
    setProducts((current) =>
      current.map((product) => ({
        ...product,
        skus: product.skus.map((sku) => (sku.id === id ? updater(sku) : sku)),
      })),
    );

  const applyAdjustment = () => {
    if (!selectedSku || adjustValue === "")
      return toastBriefly("조정 대상과 수량을 입력해 주세요.");
    const input = Number(adjustValue);
    if (!Number.isFinite(input)) return;
    const delta = adjustMode === "증감" ? input : input - selectedSku.current;
    const after = selectedSku.current + delta;
    if (after < 0)
      return toastBriefly(
        "음수재고는 허용되지 않습니다. 조정 후 수량을 확인해 주세요.",
      );
    if (delta === 0)
      return toastBriefly("재고 변동이 없어 조정 기록을 생성하지 않았습니다.");
    updateSku(selectedSku.id, (sku) => {
      const movement: StockMovement = {
        id: `MOV-${Date.now()}`,
        at: "2026-08-26 14:00",
        type: "재고 조정",
        quantity: delta,
        before: sku.current,
        after,
        reference: `ADJ-${Date.now()}`,
        actor: "admin01",
        reason: `${adjustReason}${adjustDetail ? ` · ${adjustDetail}` : ""}`,
      };
      return {
        ...sku,
        current: after,
        warehouses: adjustedWarehouses(sku, delta),
        movements: [movement, ...sku.movements],
        issues:
          after - sku.reserved - sku.locked < 0
            ? [
                ...new Set([
                  ...sku.issues,
                  "판매가능재고 음수",
                  "예약재고 > 현재고",
                ]),
              ]
            : sku.issues.filter(
                (issue) =>
                  ![
                    "판매가능재고 음수",
                    "예약재고 > 현재고",
                    "초과 예약",
                  ].includes(issue),
              ),
      };
    });
    setModal(null);
    toastBriefly(
      `${delta > 0 ? "+" : ""}${delta}개 재고 조정 기록을 생성했습니다.`,
    );
  };

  const applySafety = () => {
    const value = Number(safetyValue);
    if (!Number.isFinite(value) || value < 0)
      return toastBriefly("0 이상의 안전재고를 입력해 주세요.");
    setProducts((current) =>
      current.map((product) => ({
        ...product,
        skus: product.skus.map((sku) =>
          safetyIds.includes(sku.id)
            ? { ...sku, safety: value, alertEnabled }
            : sku,
        ),
      })),
    );
    setModal(null);
    setSelected([]);
    toastBriefly(`${safetyIds.length}개 SKU의 안전재고를 설정했습니다.`);
  };

  const reset = () => {
    setKeyword("");
    setSearch("");
    setQuickFilter("전체");
    setStockStatus("");
    setSaleStatus("");
    setCategory("");
    setBrand("");
    setWarehouse("");
    setSafetyFilter("");
    setAvailableMin("");
    setAvailableMax("");
    setSelected([]);
  };

  const download = (targets: InventoryViewRow[]) => {
    const csv = [
      [
        "상품코드",
        "상품명",
        "SKU",
        "옵션",
        "카테고리",
        "브랜드",
        "창고",
        "현재고",
        "예약재고",
        "기타잠금",
        "판매가능재고",
        "입고예정",
        "출고예정",
        "안전재고",
        "재고상태",
        "판매상태",
      ],
      ...targets.map((row) => [
        row.productCode,
        row.productName,
        row.sku ?? "",
        row.option,
        row.category,
        row.brand,
        row.warehouse,
        row.inventoryManaged ? row.current : "",
        row.inventoryManaged ? row.reserved : "",
        row.inventoryManaged ? row.locked : "",
        row.inventoryManaged ? row.available : "무제한",
        row.inboundExpected,
        row.outboundExpected,
        row.safety ?? "",
        inventoryStatus(row),
        row.saleStatus,
      ]),
    ]
      .map((values) =>
        values
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "inventory-options.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const rows: GridRow[] = filtered.map((row) => {
    const status = inventoryStatus(row);
    const meta = STATUS_META[status];
    const latest =
      [row.lastInboundAt, row.lastOutboundAt].filter(Boolean).sort().at(-1) ??
      null;
    return {
      id: row.id,
      selected: selected.includes(row.id),
      onToggleSelect: () =>
        setSelected((current) =>
          current.includes(row.id)
            ? current.filter((id) => id !== row.id)
            : [...current, row.id],
        ),
      onClick: () => setDetailId(row.id),
      bg: row.issues.length
        ? "#fffafa"
        : status === "품절"
          ? "#fffdfd"
          : undefined,
      mark: row.issues.length ? "inset 3px 0 #ef4444" : undefined,
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
          text: row.inventoryManaged ? row.current.toLocaleString() : "-",
          align: "right",
          numeric: true,
          color: "#52525b",
        },
        {
          kind: "text",
          text: row.inventoryManaged ? row.reserved.toLocaleString() : "-",
          align: "right",
          numeric: true,
          color: "#71717a",
        },
        {
          kind: "text",
          text: row.inventoryManaged
            ? row.available.toLocaleString()
            : "무제한",
          align: "right",
          numeric: true,
          weight: 700,
          color:
            status === "품절"
              ? "#dc2626"
              : status === "재고 부족"
                ? "#c2410c"
                : "#18181b",
        },
        {
          kind: "badgeSub",
          text: row.inboundExpected
            ? `${row.inboundExpected.toLocaleString()}개`
            : "-",
          subText: row.inboundDate ?? "",
          bg: row.inboundExpected ? "#eff6ff" : "#f4f4f5",
          fg: row.inboundExpected ? "#2563eb" : "#a1a1aa",
          align: "right",
        },
        {
          kind: "text",
          text: row.outboundExpected
            ? `${row.outboundExpected.toLocaleString()}개`
            : "-",
          align: "right",
          numeric: true,
        },
        {
          kind: "text",
          text: row.safety?.toLocaleString() ?? "-",
          align: "right",
          numeric: true,
          color: row.safety === null ? "#a1a1aa" : "#52525b",
        },
        {
          kind: "statusDot",
          text: row.saleStatus,
          dot:
            row.saleStatus === "판매중"
              ? "#10b981"
              : row.saleStatus === "판매예정"
                ? "#3b82f6"
                : "#a1a1aa",
          fg: row.saleStatus === "판매중" ? "#047857" : "#71717a",
        },
        { kind: "badge", text: status, bg: meta.bg, fg: meta.fg },
        {
          kind: "stack",
          title: latest?.slice(0, 10) ?? "변동 없음",
          subtitle: latest?.slice(11) ?? "",
        },
        {
          kind: "rowMenu",
          align: "right",
          detailLabel: "상세",
          onDetail: () => setDetailId(row.id),
          open: openMenu === row.id,
          onToggle: () => setOpenMenu(openMenu === row.id ? null : row.id),
          items: [
            { label: "재고 상세", click: () => setDetailId(row.id) },
            ...(row.inventoryManaged
              ? [
                  {
                    label: "재고 조정",
                    click: () => openAdjust(row),
                  },
                  {
                    label: "안전재고 설정",
                    click: () => openSafety([row.id]),
                  },
                ]
              : []),
            { sep: true },
            {
              label: "전체 변동 이력",
              click: () => window.location.assign("/inventory/history"),
            },
          ],
        },
      ],
    };
  });

  return (
    <section
      className={shared.page}
      onClick={() => openMenu && setOpenMenu(null)}
    >
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>옵션별 재고</h1>
            <p className={shared.subtitle}>
              상품 옵션과 SKU별 현재고·예약재고·판매 가능 재고를 확인합니다.
            </p>
          </div>
          <CommonButton
            variant="primary"
            size="md"
            onClick={() => openAdjust()}
          >
            재고 조정
          </CommonButton>
        </div>
        <div className={styles.definitionStrip}>
          판매 가능 재고 = 현재고 − 예약재고 − 기타 잠금 · 재고 운영과 조정은
          SKU 단위입니다.
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
              aria-label="옵션별 재고 검색"
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
                    className={`${shared.qfBtn} ${active ? shared.active : ""}`}
                    onClick={() => {
                      setQuickFilter(filter);
                      setSelected([]);
                    }}
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
              <span>재고 상태</span>
              <select
                aria-label="재고 상태"
                className={shared.selectSm}
                value={stockStatus}
                onChange={(event) => setStockStatus(event.target.value)}
              >
                <option value="">전체 재고 상태</option>
                <option>정상</option>
                <option>재고 부족</option>
                <option>품절</option>
                <option>미관리</option>
                <option>확인 필요</option>
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
            <CommonButton
              variant="secondary"
              size="md"
              className={shared.detailFilterBtn}
              onClick={() => setShowAdvanced((current) => !current)}
            >
              상세 필터
            </CommonButton>
            <span className={shared.rowSpacer} />
            <CommonButton
              variant="ghost"
              size="md"
              className={shared.resetBtn}
              onClick={reset}
            >
              초기화
            </CommonButton>
          </div>
          {showAdvanced && (
            <div className={styles.advancedFilters}>
              <label>
                안전재고
                <select
                  value={safetyFilter}
                  onChange={(event) => setSafetyFilter(event.target.value)}
                >
                  <option value="">전체</option>
                  <option>설정</option>
                  <option>미설정</option>
                </select>
              </label>
              <label>
                판매 가능 최소
                <input
                  type="number"
                  value={availableMin}
                  onChange={(event) => setAvailableMin(event.target.value)}
                  placeholder="0"
                />
              </label>
              <label>
                판매 가능 최대
                <input
                  type="number"
                  value={availableMax}
                  onChange={(event) => setAvailableMax(event.target.value)}
                  placeholder="100"
                />
              </label>
            </div>
          )}
        </div>
      </div>
      {selected.length > 0 && (
        <div className={shared.bulkBar}>
          <span className={shared.bulkLabel}>{selected.length}건 선택</span>
          <CommonButton
            variant="secondary"
            size="sm"
            className={shared.bulkBtn}
            onClick={() => openSafety(selected)}
          >
            안전재고 설정
          </CommonButton>
          <ExcelDownloadButton
            data-grid-download
            onClick={() =>
              download(filtered.filter((row) => selected.includes(row.id)))
            }
          />
        </div>
      )}
      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>
            총 {filtered.length}건 · SKU 기준
          </span>
          <div className={shared.resultActions}>
            <ExcelDownloadButton
              data-grid-download
              onClick={() => download(filtered)}
            />
            <select className={shared.pageSizeSelect} aria-label="페이지 크기">
              <option>20개씩</option>
              <option>50개씩</option>
            </select>
          </div>
        </div>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="190px 74px 50px 38px 56px 74px 56px 52px 68px 84px 90px 40px"
          minWidth="1000px"
          selectable
          allSelected={
            filtered.length > 0 &&
            filtered.every((row) => selected.includes(row.id))
          }
          onToggleAll={() =>
            setSelected(
              filtered.every((row) => selected.includes(row.id))
                ? []
                : filtered.map((row) => row.id),
            )
          }
          empty={filtered.length === 0}
          emptyText="검색 조건에 해당하는 옵션별 재고가 없습니다."
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
        <InventoryDetailDrawer
          key={`${detail.id}-${detail.current}-${detail.safety}`}
          row={detail}
          onClose={() => setDetailId(null)}
          onAdjust={() => openAdjust(detail)}
          onSafety={() => openSafety([detail.id])}
        />
      )}
      {modal === "adjust" && (
        <div
          className={shared.dialogOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <div className={`${shared.dialogBox} ${styles.adjustDialog}`}>
            <h2 className={shared.dialogTitle}>재고 조정</h2>
            <p className={shared.dialogBody}>
              현재고를 직접 덮어쓰지 않고 증감 조정 기록을 생성합니다.
              예약재고는 변경되지 않습니다.
            </p>
            <label className={styles.dialogField}>
              상품 / SKU *
              <select
                value={adjustSkuId}
                onChange={(event) => setAdjustSkuId(event.target.value)}
              >
                <option value="">조정 대상 선택</option>
                {allSkus
                  .filter((item) => item.sku.inventoryManaged)
                  .map(({ product, sku }) => (
                    <option key={sku.id} value={sku.id}>
                      {product.name} · {sku.sku} · {sku.option}
                    </option>
                  ))}
              </select>
            </label>
            {selectedSku && (
              <div className={shared.dialogSummary}>
                <div className={shared.dialogSummaryRow}>
                  <span>현재고</span>
                  <strong>{selectedSku.current}개</strong>
                </div>
                <div className={shared.dialogSummaryRow}>
                  <span>예약재고</span>
                  <strong>{selectedSku.reserved}개 · 직접 조정 불가</strong>
                </div>
                <div className={shared.dialogSummaryRow}>
                  <span>현재 판매 가능</span>
                  <strong>
                    {selectedSku.current -
                      selectedSku.reserved -
                      selectedSku.locked}
                    개
                  </strong>
                </div>
              </div>
            )}
            <div className={styles.radioRow}>
              <label>
                <input
                  type="radio"
                  checked={adjustMode === "증감"}
                  onChange={() => setAdjustMode("증감")}
                />{" "}
                증감
              </label>
              <label>
                <input
                  type="radio"
                  checked={adjustMode === "최종 수량 지정"}
                  onChange={() => setAdjustMode("최종 수량 지정")}
                />{" "}
                최종 수량 지정
              </label>
            </div>
            <label className={styles.dialogField}>
              {adjustMode === "증감" ? "조정 수량 *" : "최종 현재고 *"}
              <input
                type="number"
                value={adjustValue}
                onChange={(event) => setAdjustValue(event.target.value)}
                placeholder={adjustMode === "증감" ? "-20" : "80"}
              />
            </label>
            {selectedSku && adjustmentDelta !== null && (
              <div className={styles.adjustPreview}>
                <span>조정 후 현재고</span>
                <strong>{adjustmentAfter}개</strong>
                <em>
                  내부 기록: {adjustmentDelta > 0 ? "+" : ""}
                  {adjustmentDelta}개
                </em>
              </div>
            )}
            <label className={styles.dialogField}>
              조정 사유 *
              <select
                value={adjustReason}
                onChange={(event) => setAdjustReason(event.target.value)}
              >
                <option>재고 실사 차이</option>
                <option>파손</option>
                <option>분실</option>
                <option>폐기</option>
                <option>반품 복원</option>
                <option>오입고 수정</option>
                <option>오출고 수정</option>
                <option>샘플 사용</option>
                <option>기타</option>
              </select>
            </label>
            <label className={styles.dialogField}>
              상세 사유
              <textarea
                value={adjustDetail}
                onChange={(event) => setAdjustDetail(event.target.value)}
                placeholder="수량 변동 근거를 입력하세요."
              />
            </label>
            <div className={shared.dialogActions}>
              <CommonButton
                variant="secondary"
                size="md"
                className={drawer.editCancel}
                onClick={() => setModal(null)}
              >
                취소
              </CommonButton>
              <CommonButton
                variant="primary"
                size="md"
                className={drawer.editConfirm}
                onClick={applyAdjustment}
              >
                조정 기록 생성
              </CommonButton>
            </div>
          </div>
        </div>
      )}
      {modal === "safety" && (
        <div
          className={shared.dialogOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(null);
          }}
        >
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>안전재고 설정</h2>
            <p className={shared.dialogBody}>
              {safetyIds.length}개 SKU에 동일한 안전재고 기준을 적용합니다.
              상태는 판매 가능 재고를 기준으로 다시 계산됩니다.
            </p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}>
                <span>적용 대상</span>
                <strong>{safetyIds.length}개 SKU</strong>
              </div>
            </div>
            <label className={styles.dialogField}>
              안전재고 *
              <input
                type="number"
                min="0"
                value={safetyValue}
                onChange={(event) => setSafetyValue(event.target.value)}
              />
            </label>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={(event) => setAlertEnabled(event.target.checked)}
              />{" "}
              안전재고 이하 최초 진입 시 시스템 알림
            </label>
            <div className={shared.dialogActions}>
              <CommonButton
                variant="secondary"
                size="md"
                className={drawer.editCancel}
                onClick={() => setModal(null)}
              >
                취소
              </CommonButton>
              <CommonButton
                variant="primary"
                size="md"
                className={drawer.editConfirm}
                onClick={applySafety}
              >
                저장
              </CommonButton>
            </div>
          </div>
        </div>
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
