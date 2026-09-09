import { useMemo, useState } from "react";
import { DataGrid } from "../../components/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import {
  CommonButton,
  CommonInput,
  CommonSwitch,
  ExcelDownloadButton,
  showToast,
} from "../../components/common";
import shared from "../ops/opsShared.module.css";
import { BRANDS, type Brand } from "./brandsData";
import styles from "./BrandPages.module.css";

type ExposureFilter = "전체" | "노출" | "비노출";
const FILTERS: ExposureFilter[] = ["전체", "노출", "비노출"];
const COLUMNS: GridColumn[] = [
  { label: "노출 순서" },
  { label: "브랜드" },
  { label: "연결 상품", align: "right" },
  { label: "사용 상태" },
  { label: "노출 상태" },
  { label: "수정일" },
];

export function BrandExposurePage() {
  const [brands, setBrands] = useState<Brand[]>(
    [...BRANDS].sort((a, b) => a.exposureOrder - b.exposureOrder),
  );
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<ExposureFilter>("전체");

  const filtered = useMemo(
    () =>
      brands.filter((brand) => {
        if (filter === "노출" && !brand.exposure) return false;
        if (filter === "비노출" && brand.exposure) return false;
        if (
          keyword &&
          !`${brand.name} ${brand.code}`
            .toLowerCase()
            .includes(keyword.toLowerCase())
        )
          return false;
        return true;
      }),
    [brands, filter, keyword],
  );

  const move = (id: string, direction: -1 | 1) => {
    setBrands((current) => {
      const index = current.findIndex((brand) => brand.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((brand, order) => ({
        ...brand,
        exposureOrder: (order + 1) * 10,
      }));
    });
  };

  const rows: GridRow[] = filtered.map((brand) => ({
    id: brand.id,
    cells: [
      {
        kind: "custom",
        content: (
          <div className={styles.orderControl}>
            <CommonButton
              variant="secondary"
              size="sm"
              aria-label={`${brand.name} 위로 이동`}
              onClick={() => move(brand.id, -1)}
            >
              ↑
            </CommonButton>
            <span className={styles.orderValue}>{brand.exposureOrder}</span>
            <CommonButton
              variant="secondary"
              size="sm"
              aria-label={`${brand.name} 아래로 이동`}
              onClick={() => move(brand.id, 1)}
            >
              ↓
            </CommonButton>
          </div>
        ),
        exportValue: brand.exposureOrder,
      },
      {
        kind: "stack",
        title: brand.name,
        subtitle: brand.code,
      },
      {
        kind: "text",
        text: `${brand.productCodes.length}개`,
        align: "right",
        numeric: true,
        weight: 700,
      },
      {
        kind: "badge",
        text: brand.status,
        bg: brand.status === "사용중" ? "#ecfdf5" : "#f4f4f5",
        fg: brand.status === "사용중" ? "#047857" : "#71717a",
      },
      {
        kind: "custom",
        content: (
          <CommonSwitch
            checked={brand.exposure}
            size="sm"
            label={brand.exposure ? "노출" : "비노출"}
            onChange={(checked) =>
              setBrands((current) =>
                current.map((item) =>
                  item.id === brand.id ? { ...item, exposure: checked } : item,
                ),
              )
            }
          />
        ),
        exportValue: brand.exposure ? "노출" : "비노출",
      },
      {
        kind: "stack",
        title: brand.updatedAt,
        subtitle: brand.updatedBy,
      },
    ],
  }));

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>브랜드 노출 관리</h1>
            <p className={shared.subtitle}>
              사용자 화면의 브랜드 노출 여부와 표시 순서를 관리합니다.
            </p>
          </div>
          <CommonButton
            variant="primary"
            size="md"
            onClick={() =>
              showToast({
                message: "노출 설정을 저장했습니다.",
                type: "success",
              })
            }
          >
            저장
          </CommonButton>
        </div>
        <div className={shared.filterBox}>
          <div className={shared.filterRow1}>
            <CommonInput.Search
              aria-label="브랜드 노출 검색"
              className={shared.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="브랜드명 또는 브랜드 코드 검색"
            />
            <div className={shared.quickFilters}>
              {FILTERS.map((item) => {
                const active = filter === item;
                const count =
                  item === "전체"
                    ? brands.length
                    : brands.filter((brand) =>
                        item === "노출" ? brand.exposure : !brand.exposure,
                      ).length;
                return (
                  <CommonButton
                    key={item}
                    variant={active ? "primary-light" : "secondary"}
                    size="md"
                    className={shared.qfBtn}
                    onClick={() => setFilter(item)}
                  >
                    <span className={shared.qfLabel}>{item}</span>
                    <span className={shared.qfCount}>{count}</span>
                  </CommonButton>
                );
              })}
            </div>
            <span className={shared.rowSpacer} />
            <CommonButton
              variant="ghost"
              size="md"
              className={shared.resetBtn}
              onClick={() => {
                setKeyword("");
                setFilter("전체");
              }}
            >
              초기화
            </CommonButton>
          </div>
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
                  message: "브랜드 노출 목록을 다운로드했습니다.",
                  type: "success",
                })
              }
            />
          </div>
        </div>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="150px 1.4fr 80px 90px 160px 110px"
          minWidth="850px"
          empty={rows.length === 0}
          emptyText="검색 조건에 해당하는 브랜드가 없습니다."
          emptySubtext="검색어나 노출 상태를 변경해 주세요."
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
