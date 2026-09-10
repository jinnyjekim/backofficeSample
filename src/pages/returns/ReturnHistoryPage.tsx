import { useMemo, useState } from "react";
import shared from "../coupons/shared.module.css";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { DetailDrawer } from "../c2c/sales/SalesActivityShared";
import drawer from "../ops/opsDrawerShared.module.css";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { DatePicker } from "../../components/forms/DatePicker";
import {
  INITIAL_RETURNS,
  STAGE_META,
  type ReturnItem,
} from "./returnsData";

interface FlattenedAuditItem {
  id: string; // 고유 키
  returnId: string;
  orderId: string;
  member: string;
  when: string;
  actor: string;
  action: string;
  prevStage?: string;
  nextStage: string;
  note: string;
  feeInfo?: string;
  rawItem: ReturnItem;
}

const GRID_TEMPLATE =
  "125px 125px 125px 80px 105px 130px minmax(200px, 1fr) 130px";

const GRID_COLUMNS: GridColumn[] = [
  { label: "처리 일시" },
  { label: "반품번호" },
  { label: "주문번호" },
  { label: "고객명" },
  { label: "담당자(작업자)" },
  { label: "상태 변경" },
  { label: "처리 내용 및 사유" },
  { label: "배송비/환불 변경" },
];

export function ReturnHistoryPage() {
  const [items] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState("");
  const [selectedNextStage, setSelectedNextStage] = useState("");
  const [selectedLog, setSelectedLog] = useState<FlattenedAuditItem | null>(null);

  // 모든 반품 건의 감사 로그를 플랫 리스트로 변환
  const allLogs: FlattenedAuditItem[] = useMemo(() => {
    const list: FlattenedAuditItem[] = [];
    items.forEach((item) => {
      item.auditLogs.forEach((log, index) => {
        list.push({
          id: `${item.id}-${index}`,
          returnId: item.id,
          orderId: item.orderId,
          member: item.member,
          when: log.when,
          actor: log.actor,
          action: log.action,
          prevStage: log.prevStage,
          nextStage: log.nextStage,
          note: log.note,
          feeInfo: log.feeInfo,
          rawItem: item,
        });
      });
    });
    // 최신 일시 순 정렬
    return list.sort((a, b) => b.when.localeCompare(a.when));
  }, [items]);

  const filtered = useMemo(() => {
    return allLogs.filter((log) => {
      if (selectedActor && !log.actor.includes(selectedActor)) {
        return false;
      }
      if (selectedNextStage && log.nextStage !== selectedNextStage) {
        return false;
      }
      if (search) {
        const query = search.toLowerCase();
        const text =
          `${log.returnId} ${log.orderId} ${log.member} ${log.actor} ${log.action} ${log.note} ${log.feeInfo || ""}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [allLogs, selectedActor, selectedNextStage, search]);

  const resetFilters = () => {
    setKeyword("");
    setSearch("");
    setSelectedActor("");
    setSelectedNextStage("");
  };

  const rows: GridRow[] = filtered.map((item) => {
    const smNext = STAGE_META[item.nextStage as keyof typeof STAGE_META] || {
      bg: "#f4f4f5",
      fg: "#52525b",
    };

    const stageChangeText = item.prevStage
      ? `${item.prevStage} → ${item.nextStage}`
      : item.nextStage;

    return {
      id: item.id,
      onClick: () => setSelectedLog(item),
      cells: [
        {
          kind: "text",
          text: item.when,
          color: "#71717a",
          size: "11.5px",
          numeric: true,
        },
        {
          kind: "text",
          text: item.returnId,
          color: "#0284c7",
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
          text: item.actor,
          color: "#52525b",
          size: "12px",
        },
        {
          kind: "badge",
          text: stageChangeText,
          bg: smNext.bg,
          fg: smNext.fg,
        },
        {
          kind: "text",
          text: item.note,
          color: "#18181b",
          size: "12px",
        },
        {
          kind: "text",
          text: item.feeInfo || "-",
          color: item.feeInfo ? "#059669" : "#a1a1aa",
          size: "11.5px",
        },
      ],
    };
  });

  return (
    <div className={shared.page}>
      {/* 상단 헤더 */}
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={shared.title}>반품 처리 이력</div>
            <div className={shared.subtitle}>
              누가 언제 어떤 반품 건의 상태, 사유, 배송비를 변경했는지 전체 처리 감사 로그를 조회합니다.
            </div>
          </div>
        </div>

        {/* 쿠폰 목록 표준 필터 카드 */}
        <div
          className={shared.filterCard}
          data-filter-expanded={isDetailFilterOpen ? "true" : "false"}
        >
          <form
            className={shared.filterRow1}
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(keyword.trim());
            }}
          >
            <input
              className={shared.searchInput}
              placeholder="반품번호 / 주문번호 / 고객명 / 작업자 / 처리사유 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className={shared.searchBtn}>
              검색
            </button>
          </form>

          <div className={shared.filterRow2}>
            <label className="globalFilterField">
              <span>작업자</span>
              <select
                aria-label="작업자"
                className={shared.selectSm}
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value)}
              >
                <option value="">작업자 전체</option>
                <option value="운영">운영담당자</option>
                <option value="검수">검수팀</option>
                <option value="고객">고객(신청/철회)</option>
                <option value="택배사">택배사 / 물류센터</option>
                <option value="시스템">시스템 / PG</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>변경 후 상태</span>
              <select
                aria-label="변경 후 상태"
                className={shared.selectSm}
                value={selectedNextStage}
                onChange={(e) => setSelectedNextStage(e.target.value)}
              >
                <option value="">상태 전체</option>
                <option value="요청">요청</option>
                <option value="승인">승인</option>
                <option value="회수 중">회수 중</option>
                <option value="회수 완료">회수 완료</option>
                <option value="검수 중">검수 중</option>
                <option value="완료">완료</option>
                <option value="반려">반려</option>
                <option value="철회">철회</option>
              </select>
            </label>

            <label className={shared.dateFilterField}>
              <span>처리일</span>
              <span className={shared.dateRange}>
                <DatePicker defaultValue="2026-08-01" />
                <span className={shared.dateSeparator}>~</span>
                <DatePicker defaultValue="2026-08-31" />
              </span>
            </label>

            <span className={shared.spacer} />

            <button
              type="button"
              className="detailFilterBtn"
              aria-expanded={isDetailFilterOpen}
              onClick={() => setIsDetailFilterOpen(!isDetailFilterOpen)}
            >
              상세 필터
            </button>
            <button
              type="button"
              className={shared.clearBtn}
              onClick={resetFilters}
            >
              초기화
            </button>
          </div>
        </div>

        <div className={shared.resultBar}>
          <span className={shared.resultLabel}>{`총 ${filtered.length}건 `}</span>
          <div className={shared.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={shared.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </header>

      {/* 그리드 */}
      <div className={shared.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1050px"
          showPagination
          pages={[{ label: "1", active: true }]}
          empty={rows.length === 0}
          emptyText="조회된 처리 이력이 없습니다."
        />
      </div>

      {/* 이력 상세 드로어 */}
      {selectedLog && (
        <DetailDrawer
          eyebrow={`이력 상세 · ${selectedLog.returnId}`}
          title={`${selectedLog.action} (${selectedLog.when})`}
          status={selectedLog.nextStage}
          statusMeta={STAGE_META[selectedLog.nextStage] || { bg: "#f4f4f5", fg: "#52525b" }}
          subtitle={`작업자: ${selectedLog.actor} · 주문번호: ${selectedLog.orderId}`}
          onClose={() => setSelectedLog(null)}
          stats={[
            { label: "처리 일시", value: selectedLog.when },
            { label: "작업자", value: selectedLog.actor },
            { label: "상태 변동", value: selectedLog.prevStage ? `${selectedLog.prevStage} → ${selectedLog.nextStage}` : selectedLog.nextStage },
            { label: "배송비/환불", value: selectedLog.feeInfo || "변동 없음" },
          ]}
          fields={[
            { label: "반품번호", value: selectedLog.returnId },
            { label: "주문번호", value: selectedLog.orderId },
            { label: "신청고객", value: `${selectedLog.member} (${selectedLog.rawItem.phone})` },
            { label: "반품상품", value: `${selectedLog.rawItem.product} (${selectedLog.rawItem.quantity}개)` },
            { label: "현재 반품상태", value: selectedLog.rawItem.stage },
            { label: "처리 사유 및 내용", value: selectedLog.note },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>상세 처리 내용 및 비고</div>
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
            {selectedLog.note}
            {selectedLog.feeInfo && (
              <div style={{ marginTop: "8px", color: "#059669", fontWeight: 600 }}>
                • {selectedLog.feeInfo}
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
