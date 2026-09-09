import { useMemo, useState } from "react";
import styles from "../delivery/deliveryShared.module.css";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { DetailDrawer } from "../c2c/sales/SalesActivityShared";
import drawer from "../ops/opsDrawerShared.module.css";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { DatePicker } from "../../components/forms/DatePicker";
import { INITIAL_RETURNS, STAGE_META, type ReturnItem } from "./returnsData";

const GRID_TEMPLATE =
  "140px 140px 90px minmax(180px, 1fr) minmax(200px, 1.2fr) 100px 120px";
const GRID_COLUMNS: GridColumn[] = [
  { label: "반품번호" },
  { label: "주문번호" },
  { label: "고객명" },
  { label: "반품상품" },
  { label: "반려사유" },
  { label: "담당자" },
  { label: "반려일시" },
];

export function ReturnRejectedPage() {
  const [items] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rejectedItems = useMemo(
    () => items.filter((it) => it.stage === "반품 반려"),
    [items],
  );

  const filtered = useMemo(() => {
    return rejectedItems.filter((item) => {
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.rejectReason}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchKey;
    });
  }, [rejectedItems, keyword]);

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
          text: item.rejectReason ?? "반려 사유 미기재",
          color: "#dc2626",
          size: "12px",
        },
        { kind: "text", text: item.assignee, color: "#52525b", size: "12px" },
        {
          kind: "text",
          text: item.rejectedAt ?? "-",
          color: "#71717a",
          size: "11.5px",
          numeric: true,
        },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>반품 반려</div>
            <div className={styles.subtitle}>
              접수 심사 반려 및 실물 검수 불합격(구성품 누락/훼손)으로 반려된
              건을 조회합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="반품번호 / 주문번호 / 고객명 / 반려사유"
            />
            <button type="button" className={styles.searchBtn}>
              검색
            </button>
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
          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>반려일</span>
              <div className={styles.dateRange}>
                <DatePicker defaultValue="2026-08-20" />
                <span className={styles.dateSeparator}>~</span>
                <DatePicker defaultValue="2026-08-27" />
              </div>
            </label>
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
          emptyText="반려된 반품 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`반품 반려 상세 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={STAGE_META[selected.stage]}
          subtitle={`${selected.orderId} · ${selected.member} 님`}
          onClose={() => setSelectedId(null)}
          stats={[
            { label: "반려 일시", value: selected.rejectedAt ?? "-" },
            { label: "처리 담당자", value: selected.assignee },
            {
              label: "검수 판정",
              value: selected.inspectionResult ?? "심사 반려",
            },
          ]}
          fields={[
            {
              label: "고객 신청 사유",
              value: `${selected.reasonCategory} - ${selected.reasonDetail}`,
            },
            { label: "회수 송장번호", value: selected.returnInvoiceNo },
            { label: "연락처", value: selected.phone },
            { label: "반려 사유", value: selected.rejectReason ?? "-" },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>반려 사유 상세 내용</div>
          <div
            style={{
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#b91c1c",
              background: "#fef2f2",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid #fee2e2",
              marginBottom: "16px",
            }}
          >
            {selected.rejectReason}
          </div>

          <div className={drawer.sectionTitleLoose}>운영 메모</div>
          <div
            style={{
              fontSize: "12.5px",
              color: "#3f3f46",
              background: "#f8fafc",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            {selected.memos.length
              ? selected.memos.map((m, idx) => (
                  <p key={idx} style={{ margin: 0 }}>
                    [{m.when} / {m.by}] {m.text}
                  </p>
                ))
              : "등록된 운영 메모가 없습니다."}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
