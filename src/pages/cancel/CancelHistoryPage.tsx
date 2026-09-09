import { useMemo, useState } from "react";
import styles from "../delivery/deliveryShared.module.css";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { DetailDrawer } from "../c2c/sales/SalesActivityShared";
import drawer from "../ops/opsDrawerShared.module.css";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { CommonButton } from "../../components/common";
import { DatePicker } from "../../components/forms/DatePicker";
import {
  CANCEL_STAGE_META,
  INITIAL_CANCELS,
  type CancelItem,
} from "./cancelData";

const GRID_TEMPLATE = "140px 140px 90px minmax(180px, 1fr) 100px 110px 120px";
const GRID_COLUMNS: GridColumn[] = [
  { label: "취소번호" },
  { label: "주문번호" },
  { label: "고객명" },
  { label: "취소상품" },
  { label: "진행상태" },
  { label: "담당자" },
  { label: "최근갱신" },
];

const QUICK_FILTERS = [
  "전체",
  "취소 요청",
  "취소 승인",
  "취소 반려",
  "취소 완료",
] as const;

export function CancelHistoryPage() {
  const [items] = useState<CancelItem[]>(INITIAL_CANCELS);
  const [filter, setFilter] = useState<string>("전체");
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuick = filter === "전체" || item.stage === filter;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.assignee}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchKey;
    });
  }, [items, filter, keyword]);

  const selected = selectedId
    ? (items.find((item) => item.id === selectedId) ?? null)
    : null;

  const rows: GridRow[] = filtered.map((item) => {
    const sm = CANCEL_STAGE_META[item.stage] ?? {
      bg: "#f4f4f5",
      fg: "#52525b",
    };
    const latestDate =
      item.completedAt ||
      item.rejectedAt ||
      item.approvedAt ||
      item.requestedAt;
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
        { kind: "badge", text: item.stage, bg: sm.bg, fg: sm.fg },
        { kind: "text", text: item.assignee, color: "#52525b", size: "12px" },
        {
          kind: "text",
          text: latestDate,
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
            <div className={styles.title}>취소 이력</div>
            <div className={styles.subtitle}>
              주문 취소 신청 접수부터 승인, 반려 및 최종 환불 처리까지의 전체
              감사 로그를 조회합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="취소번호 / 주문번호 / 고객명 / 상품명 / 담당자"
            />
            <button type="button" className={styles.searchBtn}>
              검색
            </button>
            <div className={styles.quickFilters}>
              {QUICK_FILTERS.map((k) => {
                const active = filter === k;
                const count = items.filter(
                  (item) => k === "전체" || item.stage === k,
                ).length;
                return (
                  <CommonButton
                    key={k}
                    variant={active ? "primary-light" : "secondary"}
                    size="md"
                    className={`${styles.qfBtn} ${active ? styles.active : ""}`}
                    onClick={() => setFilter(k)}
                  >
                    <span className={styles.qfLabel}>{k}</span>
                    <span className={styles.qfCount}>{count}</span>
                  </CommonButton>
                );
              })}
            </div>
          </div>
          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>조회기간</span>
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
              onClick={() => {
                setFilter("전체");
                setKeyword("");
              }}
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
          emptyText="조건에 해당하는 취소 이력이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`취소 감사 이력 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={CANCEL_STAGE_META[selected.stage]}
          subtitle={`${selected.orderId} · ${selected.member} 님`}
          onClose={() => setSelectedId(null)}
          stats={[
            { label: "진행 단계", value: selected.stage },
            { label: "담당자", value: selected.assignee },
            {
              label: "환불 금액",
              value: `${selected.cancelAmount.toLocaleString()}원`,
            },
          ]}
          fields={[
            { label: "취소 유형", value: selected.cancelType },
            {
              label: "취소 사유",
              value: `${selected.reasonCategory} - ${selected.reasonDetail}`,
            },
            { label: "결제 수단", value: selected.paymentMethod },
            { label: "신청 일시", value: selected.requestedAt },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>
            상태 변경 감사 타임라인
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {selected.history.map((h, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
                <strong style={{ minWidth: "150px" }}>{h.title}</strong>
                <span style={{ color: "#71717a" }}>{h.when}</span>
                {h.by && <span style={{ color: "#a1a1aa" }}>({h.by})</span>}
              </div>
            ))}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
