import { useMemo, useState } from "react";
import styles from "../delivery/deliveryShared.module.css";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { DetailDrawer } from "../c2c/sales/SalesActivityShared";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { DatePicker } from "../../components/forms/DatePicker";
import { INITIAL_RETURNS, STAGE_META, type ReturnItem } from "./returnsData";

const GRID_TEMPLATE =
  "140px 140px 90px minmax(200px, 1fr) 90px 90px 90px 120px";
const GRID_COLUMNS: GridColumn[] = [
  { label: "반품번호" },
  { label: "주문번호" },
  { label: "고객명" },
  { label: "반품상품" },
  { label: "결제금액", align: "right" },
  { label: "차감배송비", align: "right" },
  { label: "환불완료금액", align: "right" },
  { label: "완료일시" },
];

export function ReturnCompletedPage() {
  const [items] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const completedItems = useMemo(
    () => items.filter((it) => it.stage === "반품 완료"),
    [items],
  );

  const filtered = useMemo(() => {
    return completedItems.filter((item) => {
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchKey;
    });
  }, [completedItems, keyword]);

  const selected = selectedId
    ? (items.find((item) => item.id === selectedId) ?? null)
    : null;

  const rows: GridRow[] = filtered.map((item) => {
    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      cells: [
        {
          kind: "text",
          text: item.id,
          color: "#18181b",
          size: "12px",
          weight: 600,
        },
        {
          kind: "text",
          text: item.orderId,
          color: "#3f3f46",
          size: "12px",
          weight: 500,
        },
        {
          kind: "text",
          text: item.member,
          color: "#18181b",
          size: "12.5px",
          weight: 600,
        },
        { kind: "text", text: item.product, color: "#18181b", size: "12px" },
        {
          kind: "text",
          text: `${item.amount.toLocaleString()}원`,
          align: "right",
          size: "12px",
          numeric: true,
        },
        {
          kind: "text",
          text:
            item.deductFee > 0
              ? `-${item.deductFee.toLocaleString()}원`
              : "0원",
          align: "right",
          size: "12px",
          color: "#b45309",
          numeric: true,
        },
        {
          kind: "text",
          text: `${item.refundAmount.toLocaleString()}원`,
          align: "right",
          size: "12px",
          numeric: true,
          weight: 700,
          color: "#059669",
        },
        {
          kind: "text",
          text: item.completedAt ?? "-",
          color: "#18181b",
          size: "11.5px",
          numeric: true,
          weight: 500,
        },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>반품 완료</div>
            <div className={styles.subtitle}>
              검수가 통과되어 결제 취소 및 환불 처리가 정상 완료된 반품 목록을
              조회합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="반품번호 / 주문번호 / 고객명 / 상품명"
            />
            <button type="button" className={styles.searchBtn}>
              검색
            </button>
          </div>
          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>완료일</span>
              <div className={styles.dateRange}>
                <DatePicker defaultValue="2026-08-20" />
                <span className={styles.dateSeparator}>~</span>
                <DatePicker defaultValue="2026-08-27" />
              </div>
            </label>
            <div className={styles.rowSpacer} />
            <button type="button" className="detailFilterBtn">
              상세 필터
            </button>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => setKeyword("")}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span
            className={styles.resultLabel}
          >{`총 ${filtered.length}건`}</span>
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
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="990px"
          showPagination
          pages={[{ label: "1", active: true }]}
          empty={rows.length === 0}
          emptyText="완료된 반품 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`반품 완료 상세 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={STAGE_META[selected.stage]}
          subtitle={`${selected.orderId} · ${selected.member} 님`}
          onClose={() => setSelectedId(null)}
          stats={[
            { label: "완료 일시", value: selected.completedAt ?? "-" },
            {
              label: "실제 환불액",
              value: `${selected.refundAmount.toLocaleString()}원`,
            },
            {
              label: "검수 판정",
              value: selected.inspectionResult ?? "정상 양품",
            },
          ]}
          fields={[
            {
              label: "원 결제 금액",
              value: `${selected.amount.toLocaleString()}원`,
            },
            {
              label: "차감 배송비",
              value:
                selected.deductFee > 0
                  ? `${selected.deductFee.toLocaleString()}원`
                  : "0원 (면제)",
            },
            {
              label: "반품 사유",
              value: `${selected.reasonCategory} - ${selected.reasonDetail}`,
            },
            {
              label: "환불 수단",
              value: "원결제 수단 부분 취소 (PG 자동 연동)",
            },
          ]}
        />
      )}
    </div>
  );
}
