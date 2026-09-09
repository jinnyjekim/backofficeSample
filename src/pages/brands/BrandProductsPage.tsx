import { useMemo, useState } from "react";
import { DataGrid } from "../../components/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import {
  CommonButton,
  CommonInput,
  ExcelDownloadButton,
  showToast,
} from "../../components/common";
import shared from "../ops/opsShared.module.css";
import {
  PRODUCTS,
  STATUS_META,
  fmtWon,
  type ProductStatus,
} from "../products/productsData";
import { BRANDS } from "./brandsData";

type StatusFilter = "전체" | ProductStatus;
const STATUS_FILTERS: StatusFilter[] = [
  "전체",
  "판매중",
  "판매중지",
  "등록대기",
  "판매종료",
];
const COLUMNS: GridColumn[] = [
  { label: "상품" },
  { label: "브랜드" },
  { label: "카테고리" },
  { label: "판매가", align: "right" },
  { label: "판매 상태" },
  { label: "재고", align: "right" },
  { label: "수정일" },
];

export function BrandProductsPage() {
  const sourceRows = useMemo(
    () =>
      PRODUCTS.filter((product) =>
        BRANDS.some((brand) => brand.code === product.brandCode),
      ),
    [],
  );
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("전체");
  const [brandCode, setBrandCode] = useState("");
  const [category, setCategory] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const categories = useMemo(
    () => [...new Set(sourceRows.map((product) => product.category))],
    [sourceRows],
  );

  const filtered = useMemo(
    () =>
      sourceRows.filter((product) => {
        if (status !== "전체" && product.status !== status) return false;
        if (brandCode && product.brandCode !== brandCode) return false;
        if (category && product.category !== category) return false;
        if (
          search &&
          !`${product.name} ${product.code} ${product.brandName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [brandCode, category, search, sourceRows, status],
  );

  const reset = () => {
    setKeyword("");
    setSearch("");
    setStatus("전체");
    setBrandCode("");
    setCategory("");
  };

  const rows: GridRow[] = filtered.map((product) => ({
    id: product.code,
    cells: [
      {
        kind: "stack",
        title: product.name,
        subtitle: product.code,
      },
      {
        kind: "stack",
        title: product.brandName,
        subtitle: product.brandCode,
      },
      { kind: "text", text: product.category },
      {
        kind: "text",
        text: fmtWon(product.price),
        align: "right",
        numeric: true,
        weight: 700,
      },
      {
        kind: "badge",
        text: product.status,
        bg: STATUS_META[product.status].bg,
        fg: STATUS_META[product.status].fg,
      },
      {
        kind: "text",
        text: product.inventoryManaged
          ? `${(product.available ?? 0).toLocaleString()}개`
          : "미관리",
        align: "right",
        numeric: true,
      },
      {
        kind: "stack",
        title: product.updated,
        subtitle: product.admin,
      },
    ],
  }));

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>브랜드별 상품</h1>
            <p className={shared.subtitle}>
              브랜드에 연결된 상품과 판매·재고 상태를 확인합니다.
            </p>
          </div>
        </div>
        <div className={shared.filterBox} data-filter-expanded={showAdvanced}>
          <form
            className={shared.filterRow1}
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(keyword.trim());
            }}
          >
            <CommonInput.Search
              aria-label="브랜드별 상품 검색"
              className={shared.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="상품명 / 상품코드 / 브랜드 검색"
            />
            <CommonButton type="submit" variant="emphasis" size="sm">
              검색
            </CommonButton>
            <div className={shared.quickFilters}>
              {STATUS_FILTERS.map((item) => {
                const active = status === item;
                const count =
                  item === "전체"
                    ? sourceRows.length
                    : sourceRows.filter((product) => product.status === item)
                        .length;
                return (
                  <CommonButton
                    key={item}
                    variant={active ? "primary-light" : "secondary"}
                    size="md"
                    className={shared.qfBtn}
                    onClick={() => setStatus(item)}
                  >
                    <span className={shared.qfLabel}>{item}</span>
                    <span className={shared.qfCount}>{count}</span>
                  </CommonButton>
                );
              })}
            </div>
            <span className={shared.rowSpacer} />
            <CommonButton
              variant="secondary"
              size="md"
              className={shared.detailFilterBtn}
              onClick={() => setShowAdvanced((current) => !current)}
            >
              상세 필터 {showAdvanced ? "−" : "+"}
            </CommonButton>
            <CommonButton
              variant="ghost"
              size="md"
              className={shared.resetBtn}
              onClick={reset}
            >
              초기화
            </CommonButton>
          </form>
          {showAdvanced && (
            <div className={shared.filterRow2}>
              <label className="globalFilterField">
                <span>브랜드</span>
                <select
                  aria-label="브랜드"
                  className={shared.selectSm}
                  value={brandCode}
                  onChange={(event) => setBrandCode(event.target.value)}
                >
                  <option value="">전체 브랜드</option>
                  {BRANDS.map((brand) => (
                    <option key={brand.id} value={brand.code}>
                      {brand.name}
                    </option>
                  ))}
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
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      </div>
      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length}건</span>
          <div className={shared.resultActions}>
            <ExcelDownloadButton
              data-grid-download
              onClick={() =>
                showToast({
                  message: "브랜드별 상품을 다운로드했습니다.",
                  type: "success",
                })
              }
            />
            <select className={shared.pageSizeSelect} aria-label="페이지 크기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="1.5fr 1fr 110px 90px 82px 70px 105px"
          minWidth="880px"
          empty={rows.length === 0}
          emptyText="검색 조건에 해당하는 브랜드 상품이 없습니다."
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
    </section>
  );
}
