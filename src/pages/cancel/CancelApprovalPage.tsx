import { useMemo, useState } from "react";
import styles from "../delivery/deliveryShared.module.css";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { DetailDrawer } from "../c2c/sales/SalesActivityShared";
import drawer from "../ops/opsDrawerShared.module.css";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { showToast } from "../../components/common";
import { DatePicker } from "../../components/forms/DatePicker";
import {
  CANCEL_STAGE_META,
  INITIAL_CANCELS,
  type CancelItem,
} from "./cancelData";

const GRID_TEMPLATE =
  "140px 140px 90px 130px minmax(200px, 1fr) 90px 110px 120px";
const GRID_COLUMNS: GridColumn[] = [
  { label: "취소번호" },
  { label: "주문번호" },
  { label: "고객명" },
  { label: "결제수단" },
  { label: "취소상품" },
  { label: "환불예정액", align: "right" },
  { label: "승인담당" },
  { label: "승인일시" },
];

export function CancelApprovalPage() {
  const [items, setItems] = useState<CancelItem[]>(INITIAL_CANCELS);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const approvalItems = useMemo(
    () => items.filter((it) => it.stage === "취소 승인"),
    [items],
  );

  const filtered = useMemo(() => {
    return approvalItems.filter((item) => {
      const matchKey =
        !keyword ||
        `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.paymentMethod}`
          .toLowerCase()
          .includes(keyword.toLowerCase());
      return matchKey;
    });
  }, [approvalItems, keyword]);

  const selected = selectedId
    ? (items.find((item) => item.id === selectedId) ?? null)
    : null;

  const handleExecuteRefund = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stage: "취소 완료",
              completedAt: "2026.08.27 16:15",
              history: [
                ...item.history,
                {
                  when: "08.27 16:15",
                  title: "PG사 결제 취소 및 환불 완료 처리",
                  by: "admin01",
                },
              ],
            }
          : item,
      ),
    );
    showToast({
      message: "환불이 정상 완료되었습니다. (취소 완료 메뉴로 이동)",
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
        {
          kind: "text",
          text: item.paymentMethod,
          color: "#52525b",
          size: "12px",
        },
        { kind: "text", text: item.product, color: "#18181b", size: "12px" },
        {
          kind: "text",
          text: `${item.cancelAmount.toLocaleString()}원`,
          align: "right",
          size: "12px",
          numeric: true,
          weight: 600,
          color: "#059669",
        },
        { kind: "text", text: item.assignee, color: "#52525b", size: "12px" },
        {
          kind: "text",
          text: item.approvedAt ?? "-",
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
            <div className={styles.title}>취소 승인</div>
            <div className={styles.subtitle}>
              승인 완료된 취소 건의 PG 결제 취소 및 계좌 환불 대기 상태를
              관리합니다.
            </div>
          </div>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <input
              className={styles.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="취소번호 / 주문번호 / 고객명 / 결제수단 / 상품명"
            />
            <button type="button" className={styles.searchBtn}>
              검색
            </button>
          </div>
          <div className={styles.filterRow2}>
            <label className={styles.dateFilterField}>
              <span>승인일</span>
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
          emptyText="환불 처리 대기 중인 취소 건이 없습니다."
        />
      </div>

      {selected && (
        <DetailDrawer
          eyebrow={`취소 승인 상세 · ${selected.id}`}
          title={`${selected.product}`}
          status={selected.stage}
          statusMeta={CANCEL_STAGE_META[selected.stage]}
          subtitle={`${selected.orderId} · ${selected.member} 님`}
          onClose={() => setSelectedId(null)}
          actions={
            <button
              type="button"
              className={drawer.primaryBtn}
              onClick={() => handleExecuteRefund(selected.id)}
            >
              환불 실행 (결제 취소)
            </button>
          }
          stats={[
            {
              label: "환불 예정액",
              value: `${selected.cancelAmount.toLocaleString()}원`,
            },
            { label: "결제 수단", value: selected.paymentMethod },
            { label: "승인 일시", value: selected.approvedAt ?? "-" },
          ]}
          fields={[
            { label: "취소 유형", value: selected.cancelType },
            { label: "승인 담당자", value: selected.assignee },
            {
              label: "취소 사유",
              value: `${selected.reasonCategory} - ${selected.reasonDetail}`,
            },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>PG 결제 취소 안내</div>
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
            [환불 실행] 버튼을 클릭하면 {selected.paymentMethod}을(를) 통해 자동
            승인 취소 전문이 전송됩니다.
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
