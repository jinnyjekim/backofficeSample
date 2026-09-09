import { useMemo, useState } from "react";
import { DataGrid } from "../../components/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { CommonButton, showToast } from "../../components/common";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { DatePicker } from "../../components/forms/DatePicker";
import styles from "../delivery/deliveryShared.module.css";
import drawer from "../ops/opsDrawerShared.module.css";
import { ExchangeDetailDrawer } from "./ExchangeDetailDrawer";
import {
  formatWon,
  INITIAL_EXCHANGES,
  matchesExchangeKeyword,
  type ExchangeItem,
} from "./exchangeData";

const COLUMNS: GridColumn[] = [
  { label: "교환번호" },
  { label: "주문번호" },
  { label: "신청고객" },
  { label: "교환사유" },
  { label: "상품 / 옵션 변경" },
  { label: "교환금액", align: "right" },
  { label: "신청일시" },
];

export function ExchangeRequestsPage() {
  const [items, setItems] = useState<ExchangeItem[]>(INITIAL_EXCHANGES);
  const [reason, setReason] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requests = useMemo(
    () => items.filter((item) => item.stage === "교환 요청"),
    [items],
  );
  const filtered = useMemo(
    () =>
      requests.filter(
        (item) =>
          (reason === "전체" || item.reason.includes(reason)) &&
          matchesExchangeKeyword(item, keyword),
      ),
    [keyword, reason, requests],
  );
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const updateStage = (stage: "교환 승인" | "교환 반려") => {
    if (!selected) return;
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              stage,
              assignee: "admin01",
              updatedAt: "2026-09-07 15:20",
            }
          : item,
      ),
    );
    showToast({
      message: `${selected.id} 건을 ${stage} 처리했습니다.`,
      type: "success",
    });
    setSelectedId(null);
  };
  const rows: GridRow[] = filtered.map((item) => ({
    id: item.id,
    onClick: () => setSelectedId(item.id),
    cells: [
      { kind: "text", text: item.id, weight: 600 },
      { kind: "text", text: item.orderId },
      { kind: "text", text: item.member, weight: 600 },
      { kind: "text", text: item.reason },
      {
        kind: "stack",
        title: item.product,
        subtitle: `${item.optionBefore} → ${item.optionAfter}`,
      },
      {
        kind: "text",
        text: formatWon(item.amount),
        align: "right",
        numeric: true,
        weight: 600,
      },
      { kind: "text", text: item.requestedAt, numeric: true },
    ],
  }));
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>교환 요청</div>
            <div className={styles.subtitle}>
              고객이 신청한 신규 교환 건의 재고와 교환 가능 조건을 심사합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="교환번호 / 주문번호 / 고객명 / 상품명"
            />
            <button className={styles.searchBtn}>검색</button>
            <div className={styles.quickFilters}>
              {["전체", "사이즈", "색상", "불량"].map((value) => (
                <CommonButton
                  key={value}
                  variant={reason === value ? "primary-light" : "secondary"}
                  size="md"
                  className={`${styles.qfBtn} ${reason === value ? styles.active : ""}`}
                  onClick={() => setReason(value)}
                >
                  <span className={styles.qfLabel}>{value}</span>
                  <span className={styles.qfCount}>
                    {
                      requests.filter(
                        (item) =>
                          value === "전체" || item.reason.includes(value),
                      ).length
                    }
                  </span>
                </CommonButton>
              ))}
            </div>
          </div>
          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>신청일</span>
              <span className={styles.dateRange}>
                <DatePicker defaultValue="2026-09-01" />
                <span className={styles.dateSeparator}>~</span>
                <DatePicker defaultValue="2026-09-07" />
              </span>
            </label>
            <span className={styles.rowSpacer} />
            <button type="button" className="detailFilterBtn">
              상세 필터
            </button>
            <button
              className={styles.resetBtn}
              onClick={() => {
                setReason("전체");
                setKeyword("");
              }}
            >
              초기화
            </button>
          </div>
        </div>
        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건 </span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton data-grid-download />
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
          columns={COLUMNS}
          rows={rows}
          gridTemplate="140px 140px 90px 110px minmax(220px,1fr) 100px 130px"
          minWidth="990px"
          empty={!rows.length}
          emptyText="접수된 교환 요청이 없습니다."
          showPagination
          pages={[{ label: "1", active: true }]}
        />
      </div>
      {selected && (
        <ExchangeDetailDrawer
          item={selected}
          eyebrow="교환 요청 심사"
          onClose={() => setSelectedId(null)}
          actions={
            <>
              <button
                className={drawer.primaryBtn}
                onClick={() => updateStage("교환 승인")}
              >
                교환 승인
              </button>
              <button
                className={drawer.dangerBtn}
                onClick={() => updateStage("교환 반려")}
              >
                교환 반려
              </button>
            </>
          }
        />
      )}
    </div>
  );
}
