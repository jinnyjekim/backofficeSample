import { useMemo, useState } from "react";
import styles from "../delivery/deliveryShared.module.css";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { DetailDrawer } from "../c2c/sales/SalesActivityShared";
import drawer from "../ops/opsDrawerShared.module.css";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { showToast } from "../../components/common";
import { DatePicker } from "../../components/forms/DatePicker";
import { INITIAL_RETURNS, STAGE_META, type ReturnItem } from "./returnsData";

const GRID_TEMPLATE = "140px 140px 90px 100px 130px minmax(180px, 1fr) 110px";
const GRID_COLUMNS: GridColumn[] = [
  { label: "반품번호" },
  { label: "주문번호" },
  { label: "고객명" },
  { label: "회수택배사" },
  { label: "회수송장번호" },
  { label: "반품상품" },
  { label: "담당자" },
];

export function ReturnCollectingPage() {
  const [items, setItems] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [keyword, setKeyword] = useState("");
  const [carrier, setCarrier] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const collectingItems = useMemo(
    () => items.filter((it) => it.stage === "반품 회수"),
    [items],
  );

  const filtered = useMemo(() => {
    return collectingItems.filter((item) => {
      const matchCarrier = !carrier || item.carrier === carrier;
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.returnInvoiceNo} ${item.product}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchCarrier && matchKey;
    });
  }, [collectingItems, carrier, keyword]);

  const selected = selectedId
    ? (items.find((item) => item.id === selectedId) ?? null)
    : null;

  const handleMarkCollected = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: "회수 완료",
              collectedAt: "2026.08.27 15:55",
              history: [
                ...item.history,
                {
                  when: "08.27 15:55",
                  title: "물류센터 반품 상품 입고 완료",
                  by: "admin01",
                },
              ],
            }
          : item,
      ),
    );
    showToast({
      message: "물류센터 입고가 확인되었습니다. (회수 완료 메뉴로 이동)",
      type: "success",
    });
    setSelectedId(null);
  };

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
        { kind: "text", text: item.carrier, color: "#71717a", size: "12px" },
        {
          kind: "text",
          text: item.returnInvoiceNo,
          color: "#1e40af",
          size: "12px",
          numeric: true,
          weight: 600,
        },
        { kind: "text", text: item.product, color: "#18181b", size: "12px" },
        { kind: "text", text: item.assignee, color: "#52525b", size: "12px" },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>반품 회수</div>
            <div className={styles.subtitle}>
              택배사 기사가 고객 주소지로 방문하여 상품을 수거 중인 진행 상황을
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
              placeholder="반품번호 / 주문번호 / 회수송장번호 / 고객명 / 상품명"
            />
            <button type="button" className={styles.searchBtn}>
              검색
            </button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField">
              <span>회수 택배사</span>
              <select
                aria-label="회수 택배사"
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
              <span>회수지시일</span>
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
          minWidth="960px"
          showPagination
          pages={[{ label: "1", active: true }]}
          empty={rows.length === 0}
          emptyText="현재 회수 진행 중인 반품 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`반품 회수 상세 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={STAGE_META[selected.stage]}
          subtitle={`${selected.carrier} · 송장 ${selected.returnInvoiceNo}`}
          onClose={() => setSelectedId(null)}
          actions={
            <button
              type="button"
              className={drawer.primaryBtn}
              onClick={() => handleMarkCollected(selected.id)}
            >
              물류센터 입고 확인
            </button>
          }
          stats={[
            { label: "회수 송장", value: selected.returnInvoiceNo },
            { label: "수거 택배사", value: selected.carrier },
            { label: "고객명", value: selected.member },
          ]}
          fields={[
            { label: "회수지 주소", value: selected.pickupAddress },
            { label: "연락처", value: selected.phone },
            {
              label: "신청 사유",
              value: `${selected.reasonCategory} - ${selected.reasonDetail}`,
            },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>회수 진행 상태</div>
          <div
            style={{
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#334155",
              background: "#f8fafc",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            }}
          >
            택배사 기사가 상품을 수거하여 물류센터로 이송 중입니다. 물류창고
            하역 검수 후 [물류센터 입고 확인]을 진행하세요.
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
