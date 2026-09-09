import { useMemo, useState } from "react";
import styles from "./deliveryShared.module.css";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { DetailDrawer } from "../c2c/sales/SalesActivityShared";
import drawer from "../ops/opsDrawerShared.module.css";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { CommonButton } from "../../components/common";
import { DatePicker } from "../../components/forms/DatePicker";
import { TRACKING_ITEMS, type TrackingItem } from "./deliveryExtraData";

const GRID_TEMPLATE =
  "110px 140px 90px 90px 130px 100px minmax(160px, 1fr) 110px 120px 60px";
const GRID_COLUMNS: GridColumn[] = [
  { label: "추적번호" },
  { label: "주문번호" },
  { label: "수령인" },
  { label: "택배사" },
  { label: "운송장번호" },
  { label: "배송단계" },
  { label: "현재위치" },
  { label: "도착예정" },
  { label: "최근갱신" },
  { label: "관리" },
];

const STEP_META: Record<string, { bg: string; fg: string }> = {
  집하완료: { bg: "#f4f4f5", fg: "#52525b" },
  간선수송: { bg: "#eff6ff", fg: "#2563eb" },
  HUB입출고: { bg: "#eff6ff", fg: "#1d4ed8" },
  배달출발: { bg: "#f5f3ff", fg: "#7c3aed" },
  배달완료: { bg: "#ecfdf5", fg: "#059669" },
  배송지연: { bg: "#fef2f2", fg: "#dc2626" },
};

const QUICK_FILTERS = [
  "전체",
  "집하완료",
  "간선수송",
  "배달출발",
  "배송지연",
] as const;

export function DeliveryTrackingPage() {
  const [items] = useState<TrackingItem[]>(TRACKING_ITEMS);
  const [filter, setFilter] = useState<string>("전체");
  const [keyword, setKeyword] = useState("");
  const [carrier, setCarrier] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuick = filter === "전체" || item.currentStep === filter;
      const matchCarrier = !carrier || item.carrier === carrier;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.receiver} ${item.invoiceNo} ${item.currentLocation} ${item.driverName}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchQuick && matchCarrier && matchKey;
    });
  }, [items, filter, carrier, keyword]);

  const selected = selectedId
    ? (items.find((item) => item.id === selectedId) ?? null)
    : null;

  const rows: GridRow[] = filtered.map((item) => {
    const sm = STEP_META[item.currentStep] ?? { bg: "#f4f4f5", fg: "#52525b" };
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
          text: item.receiver,
          color: "#18181b",
          size: "12.5px",
          weight: 600,
        },
        { kind: "text", text: item.carrier, color: "#71717a", size: "12px" },
        {
          kind: "text",
          text: item.invoiceNo,
          color: "#1e40af",
          size: "12px",
          numeric: true,
          weight: 600,
        },
        { kind: "badge", text: item.currentStep, bg: sm.bg, fg: sm.fg },
        {
          kind: "text",
          text: item.currentLocation,
          color: "#3f3f46",
          size: "12px",
        },
        {
          kind: "text",
          text: item.eta,
          color: "#18181b",
          size: "11.5px",
          weight: 500,
        },
        {
          kind: "text",
          text: item.lastUpdated,
          color: "#71717a",
          size: "11.5px",
          numeric: true,
        },
        { kind: "link", text: "상세", size: "12px" },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>배송 추적</div>
            <div className={styles.subtitle}>
              출고된 화물의 실시간 터미널 입출고, 간선 수송 및 배달원 출발
              현황을 추적합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="주문번호 / 운송장번호 / 수령인 / 배송기사 / 위치"
            />
            <button type="button" className={styles.searchBtn}>
              검색
            </button>
            <div className={styles.quickFilters}>
              {QUICK_FILTERS.map((k) => {
                const active = filter === k;
                const count = items.filter(
                  (item) => k === "전체" || item.currentStep === k,
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
            <label className="globalFilterField">
              <span>택배사</span>
              <select
                aria-label="택배사"
                className={styles.selectXs}
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              >
                <option value="">전체 택배사</option>
                <option>CJ대한통운</option>
                <option>한진택배</option>
                <option>롯데택배</option>
                <option>우체국택배</option>
              </select>
            </label>
            <label className={styles.dateFilterField}>
              <span>출고일</span>
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
                setCarrier("");
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
          minWidth="1160px"
          showPagination
          pages={[{ label: "1", active: true }]}
          empty={rows.length === 0}
          emptyText="조건에 해당하는 배송 추적 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`실시간 배송 추적 · ${selected.id}`}
          title={`${selected.orderId} (${selected.receiver} 님)`}
          status={selected.currentStep}
          statusMeta={
            STEP_META[selected.currentStep] ?? { bg: "#f4f4f5", fg: "#52525b" }
          }
          subtitle={`${selected.carrier} · 송장 ${selected.invoiceNo}`}
          onClose={() => setSelectedId(null)}
          stats={[
            { label: "배송 단계", value: selected.currentStep },
            { label: "도착 예정", value: selected.eta },
            {
              label: "배달 기사",
              value: `${selected.driverName} (${selected.driverPhone})`,
            },
          ]}
          fields={[
            { label: "현재 위치", value: selected.currentLocation },
            { label: "출고 시각", value: selected.shippedAt },
            { label: "최근 갱신", value: selected.lastUpdated },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>
            배송 진행 단계 (타임라인)
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            {selected.timeline.map((t, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "12.5px",
                }}
              >
                <span
                  style={{
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    background: t.dot,
                    marginTop: "4px",
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <strong style={{ color: "#18181b" }}>{t.title}</strong>
                  <span style={{ color: "#71717a", fontSize: "11.5px" }}>
                    {t.when} {t.loc && `· ${t.loc}`} ({t.source})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
