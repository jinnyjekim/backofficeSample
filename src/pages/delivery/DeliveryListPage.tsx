import { useMemo, useState } from "react";
import shared from "../coupons/shared.module.css";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridColumn, GridRow } from "../../components/DataGrid/types";
import { DetailDrawer } from "../c2c/sales/SalesActivityShared";
import drawer from "../ops/opsDrawerShared.module.css";
import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { CommonButton, showToast } from "../../components/common";
import { DatePicker } from "../../components/forms/DatePicker";
import {
  INITIAL_DELIVERIES,
  DELIVERY_STAGE_META,
  type DeliveryItem,
  type DeliveryStage,
} from "./deliveryData";

const STAGE_FILTERS: Array<{ key: string; label: string; stage?: DeliveryStage }> = [
  { key: "전체", label: "전체" },
  { key: "배송 준비", label: "배송 준비", stage: "배송 준비" },
  { key: "출고 대기", label: "출고 대기", stage: "출고 대기" },
  { key: "출고 완료", label: "출고 완료", stage: "출고 완료" },
  { key: "배송 중", label: "배송 중", stage: "배송 중" },
  { key: "배송 완료", label: "배송 완료", stage: "배송 완료" },
  { key: "배송 실패", label: "배송 실패", stage: "배송 실패" },
];

const GRID_TEMPLATE =
  "40px 130px 130px 85px minmax(180px, 1fr) 95px 120px 130px 80px 105px";

const GRID_COLUMNS: GridColumn[] = [
  { label: "" },
  { label: "배송번호" },
  { label: "주문번호" },
  { label: "수취인" },
  { label: "배송 상품/수량" },
  { label: "배송 상태" },
  { label: "배송사 / 송장번호" },
  { label: "배송유형 / 주소" },
  { label: "배송추적", align: "center" },
  { label: "주문/접수일시" },
];

export function DeliveryListPage() {
  const [items, setItems] = useState<DeliveryItem[]>(INITIAL_DELIVERIES);
  const [currentStage, setCurrentStage] = useState<string>("전체");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");

  // 상세 필터 토글
  const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false);

  // 필터 항목들
  const [carrierFilter, setCarrierFilter] = useState<string>("");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>("");
  const [holdFilter, setHoldFilter] = useState<string>("");
  const [failReasonFilter, setFailReasonFilter] = useState<string>("");

  // 선택 상태
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 메모 및 보류 모달/입력 상태
  const [memoInput, setMemoInput] = useState("");
  const [holdReasonInput, setHoldReasonInput] = useState("");
  const [isHolding, setIsHolding] = useState(false);

  // 탭별 카운트 계산
  const counts = useMemo(() => {
    const map: Record<string, number> = { 전체: items.length };
    STAGE_FILTERS.forEach((t) => {
      if (t.stage) {
        map[t.key] = items.filter((it) => it.stage === t.stage).length;
      }
    });
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // 1. 탭 필터
      if (currentStage !== "전체" && item.stage !== currentStage) {
        return false;
      }

      // 2. 검색어 (엔터 또는 검색 버튼 클릭 시 적용된 search)
      if (search) {
        const query = search.toLowerCase();
        const fullText =
          `${item.id} ${item.orderId} ${item.receiver} ${item.product} ${item.invoiceNo} ${item.address} ${item.carrier}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      // 3. 상세 필터 조건들
      if (carrierFilter && item.carrier !== carrierFilter) return false;
      if (deliveryTypeFilter && item.deliveryType !== deliveryTypeFilter) return false;
      if (failReasonFilter && (!item.failReason || !item.failReason.includes(failReasonFilter))) return false;
      if (holdFilter === "보류" && !item.isHold) return false;
      if (holdFilter === "정상" && item.isHold) return false;

      return true;
    });
  }, [
    items,
    currentStage,
    search,
    carrierFilter,
    deliveryTypeFilter,
    failReasonFilter,
    holdFilter,
  ]);

  const selected = selectedId
    ? (items.find((item) => item.id === selectedId) ?? null)
    : null;

  const resetFilters = () => {
    setKeyword("");
    setSearch("");
    setCurrentStage("전체");
    setCarrierFilter("");
    setDeliveryTypeFilter("");
    setHoldFilter("");
    setFailReasonFilter("");
    showToast({ message: "필터가 초기화되었습니다.", type: "info" });
  };

  function toggleSel(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // 일괄 출고 완료 처리
  const handleBulkOutbound = () => {
    if (selectedIds.length === 0) return;
    setItems((prev) =>
      prev.map((it) => {
        if (!selectedIds.includes(it.id) || (it.stage !== "배송 준비" && it.stage !== "출고 대기")) return it;
        return {
          ...it,
          stage: "출고 완료",
          outboundCompletedAt: "2026.08.27 16:30",
          auditLogs: [
            ...it.auditLogs,
            {
              when: "2026.08.27 16:30",
              actor: "물류운영자",
              action: "일괄 출고 완료",
              prevStage: it.stage,
              nextStage: "출고 완료",
              note: "일괄 처리 기능을 통한 출고 완료 처리",
            },
          ],
          tracking: [
            ...it.tracking,
            { title: "일괄 창고 출고 완료", when: "08.27 16:30", source: "시스템", dot: "#06b6d4" },
          ],
        };
      })
    );
    showToast({ message: `${selectedIds.length}건이 일괄 출고 완료되었습니다.`, type: "success" });
    setSelectedIds([]);
  };

  // 단계별 단건 상태 변경 액션들
  const handlePackComplete = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 16:00";
        return {
          ...it,
          stage: "출고 대기",
          outboundWaitingAt: now,
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "포장/검수팀",
              action: "포장 완료 (출고 대기)",
              prevStage: it.stage,
              nextStage: "출고 대기",
              note: "피킹 검수 및 완충 포장 완료",
            },
          ],
          tracking: [
            ...it.tracking,
            { title: "포장 완료 (출고 대기)", when: "08.27 16:00", source: "WMS", dot: "#eab308" },
          ],
        };
      })
    );
    showToast({ message: "포장이 완료되어 출고 대기 상태로 변경되었습니다.", type: "success" });
  };

  const handleOutboundComplete = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 16:30";
        return {
          ...it,
          stage: "출고 완료",
          outboundCompletedAt: now,
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "출고담당자",
              action: "출고 완료 처리",
              prevStage: it.stage,
              nextStage: "출고 완료",
              note: "창고 출고 도크 인계 완료 (배송사 집하 대기)",
            },
          ],
          tracking: [
            ...it.tracking,
            { title: "창고 출고 완료 (집하 대기)", when: "08.27 16:30", source: "시스템", dot: "#06b6d4" },
          ],
        };
      })
    );
    showToast({ message: "창고 출고 처리가 완료되었습니다.", type: "success" });
  };

  const handleInTransit = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 18:00";
        return {
          ...it,
          stage: "배송 중",
          inTransitAt: now,
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "택배사(연동)",
              action: "택배사 집하 확인 (배송 중 전환)",
              prevStage: it.stage,
              nextStage: "배송 중",
              note: "택배 기사 집하 스캔 연동",
            },
          ],
          tracking: [
            ...it.tracking,
            { title: "택배사 집하 완료 (배송 출발)", when: "08.27 18:00", source: "택배사 API", dot: "#3b82f6" },
          ],
        };
      })
    );
    showToast({ message: "택배사 집하가 확인되어 배송 중 상태로 변경되었습니다.", type: "info" });
  };

  const handleDeliveryComplete = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 19:30";
        return {
          ...it,
          stage: "배송 완료",
          deliveredAt: now,
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "택배사(연동)",
              action: "배송 완료 처리",
              prevStage: it.stage,
              nextStage: "배송 완료",
              note: "수취인 전달 완료 확인",
            },
          ],
          tracking: [
            ...it.tracking,
            { title: "최종 배송 완료", when: "08.27 19:30", source: "택배사 API", dot: "#10b981" },
          ],
        };
      })
    );
    showToast({ message: "배송이 완료 처리되었습니다.", type: "success" });
  };

  const handleReship = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 17:00";
        return {
          ...it,
          stage: "배송 준비",
          failReason: undefined,
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "CS운영자",
              action: "재배송 지시 (배송 준비로 복귀)",
              prevStage: it.stage,
              nextStage: "배송 준비",
              note: "고객 주소/연락처 재확인 후 재배송 접수",
            },
          ],
          tracking: [
            ...it.tracking,
            { title: "재배송 준비 접수", when: "08.27 17:00", source: "CS센터", dot: "#ea580c" },
          ],
        };
      })
    );
    showToast({ message: "재배송이 접수되어 배송 준비 단계로 복귀했습니다.", type: "success" });
  };

  const handleToggleHold = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    if (target.isHold) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const now = "2026.08.27 17:20";
          return {
            ...it,
            isHold: false,
            holdReason: undefined,
            auditLogs: [
              ...it.auditLogs,
              {
                when: now,
                actor: "운영담당자",
                action: "배송 보류 해제",
                nextStage: it.stage,
                note: "보류 사유 해소로 정상 배송 프로세스 재개",
              },
            ],
            history: [
              ...it.history,
              { when: "08.27 17:20", title: "보류 해제 (정상 처리 재개)", by: "운영담당자" },
            ],
          };
        })
      );
      showToast({ message: "배송 보류가 해제되었습니다.", type: "success" });
    } else {
      setIsHolding(true);
    }
  };

  const handleConfirmHold = (id: string) => {
    if (!holdReasonInput.trim()) {
      showToast({ message: "보류 사유를 입력해주세요.", type: "error" });
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 17:25";
        return {
          ...it,
          isHold: true,
          holdReason: holdReasonInput,
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "운영담당자",
              action: "배송 보류 지정",
              nextStage: it.stage,
              note: `보류 사유: ${holdReasonInput}`,
            },
          ],
          history: [
            ...it.history,
            { when: "08.27 17:25", title: `배송 보류 지정 (${holdReasonInput})`, by: "운영담당자" },
          ],
        };
      })
    );
    showToast({ message: "해당 배송 건이 보류 상태로 지정되었습니다.", type: "warning" });
    setIsHolding(false);
    setHoldReasonInput("");
  };

  const handleAddMemo = (id: string) => {
    if (!memoInput.trim()) return;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return {
          ...it,
          memos: [
            ...it.memos,
            { when: "08.27 17:30", by: "운영자", text: memoInput.trim() },
          ],
        };
      })
    );
    setMemoInput("");
    showToast({ message: "메모가 저장되었습니다.", type: "success" });
  };

  const rows: GridRow[] = filtered.map((item) => {
    const sm = DELIVERY_STAGE_META[item.stage] || { bg: "#f4f4f5", fg: "#52525b" };

    return {
      id: item.id,
      onClick: () => setSelectedId(item.id),
      selected: selectedIds.includes(item.id),
      onToggleSelect: () => toggleSel(item.id),
      cells: [
        {
          kind: "text",
          text: "",
        },
        {
          kind: "text",
          text: item.id,
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
          text: item.receiver,
          color: "#18181b",
          size: "12.5px",
          weight: 600,
        },
        {
          kind: "text",
          text: `${item.product} (${item.quantity}개)`,
          color: "#18181b",
          size: "12px",
        },
        {
          kind: "badge",
          text: item.isHold ? `${item.stage} · 보류` : item.stage,
          bg: item.isHold ? "#fef2f2" : sm.bg,
          fg: item.isHold ? "#dc2626" : sm.fg,
        },
        {
          kind: "text",
          text: `${item.carrier} / ${item.invoiceNo || "미발급"}`,
          color: "#3f3f46",
          size: "12px",
        },
        {
          kind: "text",
          text: `[${item.deliveryType}] ${item.address}`,
          color: "#71717a",
          size: "11.5px",
        },
        {
          kind: "badge",
          text: "추적조회",
          bg: "#f4f4f5",
          fg: "#0284c7",
        },
        {
          kind: "text",
          text: item.orderedAt,
          color: "#71717a",
          size: "11.5px",
          numeric: true,
        },
      ],
    };
  });

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        {/* 상단 타이틀 */}
        <div className={shared.headerTop}>
          <div>
            <div className={shared.title}>배송 목록</div>
            <div className={shared.subtitle}>
              전체 배송 건(배송 준비/출고 대기/출고 완료/배송 중/배송 완료/배송 실패)을 배송번호 기준으로 통합 조회하고 처리합니다.
            </div>
          </div>
        </div>

        {/* 쿠폰 목록 표준 필터 카드 (data-filter-expanded 연동) */}
        <div
          className={shared.filterCard}
          data-filter-expanded={isDetailFilterOpen ? "true" : "false"}
        >
          {/* 1행: 검색창 + 배송 상태 퀵 필터 버튼 그룹 */}
          <form
            className={shared.filterRow1}
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(keyword.trim());
            }}
          >
            <input
              className={shared.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="배송번호 / 주문번호 / 수취인명 / 상품명 / 송장번호"
            />
            <button type="submit" className={shared.searchBtn}>
              검색
            </button>
            <div className={shared.quickFilters}>
              {STAGE_FILTERS.map((tab) => {
                const active = currentStage === tab.key;
                return (
                  <CommonButton
                    key={tab.key}
                    variant={active ? "primary-light" : "secondary"}
                    size="md"
                    className={`${shared.quickFilterBtn} ${active ? shared.active : ""}`}
                    onClick={() => setCurrentStage(tab.key)}
                  >
                    <span className={shared.quickFilterLabel}>{tab.label}</span>
                    <span className={shared.quickFilterCount}>
                      {counts[tab.key] ?? 0}
                    </span>
                  </CommonButton>
                );
              })}
            </div>
          </form>

          {/* 2행: 상세 필터 항목들 (상세 필터 클릭 시 펼쳐짐) */}
          <div className={shared.filterRow2}>
            <label className="globalFilterField">
              <span>배송사</span>
              <select
                aria-label="배송사"
                className={shared.selectSm}
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
              >
                <option value="">배송사 전체</option>
                <option value="CJ대한통운">CJ대한통운</option>
                <option value="한진택배">한진택배</option>
                <option value="롯데택배">롯데택배</option>
                <option value="우체국택배">우체국택배</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>배송유형</span>
              <select
                aria-label="배송유형"
                className={shared.selectSm}
                value={deliveryTypeFilter}
                onChange={(e) => setDeliveryTypeFilter(e.target.value)}
              >
                <option value="">배송유형 전체</option>
                <option value="일반택배">일반택배</option>
                <option value="당일배송">당일배송</option>
                <option value="새벽배송">새벽배송</option>
                <option value="화물배송">화물배송</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>보류 여부</span>
              <select
                aria-label="보류 여부"
                className={shared.selectSm}
                value={holdFilter}
                onChange={(e) => setHoldFilter(e.target.value)}
              >
                <option value="">보류 구분 전체</option>
                <option value="정상">정상 진행 건</option>
                <option value="보류">⚠️ 보류 건만 보기</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>실패 사유</span>
              <select
                aria-label="실패 사유"
                className={shared.selectSm}
                value={failReasonFilter}
                onChange={(e) => setFailReasonFilter(e.target.value)}
              >
                <option value="">실패사유 전체</option>
                <option value="부재">수취인 부재</option>
                <option value="주소">주소 불명</option>
                <option value="연락">연락 불가</option>
                <option value="거절">수취 거절</option>
              </select>
            </label>

            <label className={shared.dateFilterField}>
              <span>주문/접수일</span>
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

        {/* 선택 일괄 액션 바 */}
        {selectedIds.length > 0 && (
          <div className={shared.bulkBar}>
            <span className={shared.bulkLabel}>
              {selectedIds.length}건 선택됨
            </span>
            <button
              type="button"
              className={shared.bulkBtn}
              onClick={handleBulkOutbound}
            >
              선택 건 일괄 출고 완료
            </button>
            <button
              type="button"
              className={shared.bulkBtn}
              onClick={() => setSelectedIds([])}
            >
              선택 해제
            </button>
          </div>
        )}

        {/* 결과 바 */}
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

      {/* 목록 그리드 */}
      <div className={shared.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1050px"
          showPagination
          pages={[{ label: "1", active: true }]}
          empty={rows.length === 0}
          emptyText="조건에 일치하는 배송 건이 없습니다."
        />
      </div>

      {/* 배송 상세 드로어 */}
      {selected && (
        <DetailDrawer
          eyebrow={`배송 상세 · ${selected.id}`}
          title={`${selected.product} (${selected.quantity}개)`}
          status={selected.isHold ? `${selected.stage} · 보류` : selected.stage}
          statusMeta={DELIVERY_STAGE_META[selected.stage] || { bg: "#f4f4f5", fg: "#52525b" }}
          subtitle={`원주문: ${selected.orderId} · 수취인: ${selected.receiver} (${selected.phone})`}
          onClose={() => {
            setSelectedId(null);
            setIsHolding(false);
          }}
          stats={[
            { label: "배송사", value: selected.carrier },
            { label: "송장번호", value: selected.invoiceNo || "미발급" },
            { label: "배송유형", value: selected.deliveryType },
            { label: "담당자", value: selected.assignee },
          ]}
          fields={[
            { label: "배송번호", value: selected.id },
            { label: "원주문번호", value: selected.orderId },
            { label: "수취인 / 연락처", value: `${selected.receiver} (${selected.phone})` },
            { label: "배송지 주소", value: selected.address },
            { label: "배송 진행 단계", value: selected.isHold ? `${selected.stage} (⚠️ 보류 상태)` : selected.stage },
            { label: "실패 사유", value: selected.failReason || "해당 없음" },
            { label: "주문 접수일시", value: selected.orderedAt },
            { label: "출고 완료일시", value: selected.outboundCompletedAt || "-" },
          ]}
          actions={
            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
              {selected.stage === "배송 준비" && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handlePackComplete(selected.id)}
                >
                  포장 완료 (출고 대기 전환)
                </button>
              )}

              {selected.stage === "출고 대기" && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handleOutboundComplete(selected.id)}
                >
                  창고 출고 완료
                </button>
              )}

              {selected.stage === "출고 완료" && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handleInTransit(selected.id)}
                >
                  택배사 집하 확인 (배송 중 전환)
                </button>
              )}

              {selected.stage === "배송 중" && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handleDeliveryComplete(selected.id)}
                >
                  최종 배송 완료 처리
                </button>
              )}

              {selected.stage === "배송 실패" && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handleReship(selected.id)}
                >
                  주소 확인 및 재배송 접수
                </button>
              )}
            </div>
          }
        >
          {/* 보류 알림 */}
          {selected.isHold && selected.holdReason && (
            <div style={{ padding: "10px 12px", background: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: "6px", color: "#9f1239", fontSize: "12.5px", marginBottom: "14px" }}>
              <strong>⚠️ 보류 사유:</strong> {selected.holdReason}
            </div>
          )}

          {/* 실패 사유 알림 */}
          {selected.stage === "배송 실패" && selected.failReason && (
            <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#dc2626", fontSize: "12.5px", marginBottom: "14px" }}>
              <strong>배송 실패 사유:</strong> {selected.failReason}
            </div>
          )}

          {/* 보류 지정 입력 양식 */}
          {isHolding && (
            <div style={{ padding: "12px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "6px", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", marginBottom: "6px" }}>배송 보류 사유 작성</div>
              <textarea
                rows={2}
                value={holdReasonInput}
                onChange={(e) => setHoldReasonInput(e.target.value)}
                placeholder="고객 요청, 기상 악화, 재고 검수 등 보류 사유를 입력하세요."
                style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #fcd34d" }}
              />
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "6px" }}>
                <CommonButton size="sm" variant="secondary" onClick={() => setIsHolding(false)}>
                  취소
                </CommonButton>
                <CommonButton size="sm" variant="primary" onClick={() => handleConfirmHold(selected.id)}>
                  보류 지정
                </CommonButton>
              </div>
            </div>
          )}

          {/* 보류 토글 버튼 */}
          {selected.stage !== "배송 완료" && (
            <div style={{ marginBottom: "14px" }}>
              <button
                type="button"
                onClick={() => handleToggleHold(selected.id)}
                style={{
                  background: "transparent",
                  border: "1px solid #d4d4d8",
                  borderRadius: "5px",
                  padding: "5px 10px",
                  fontSize: "12px",
                  color: selected.isHold ? "#0284c7" : "#dc2626",
                  cursor: "pointer",
                }}
              >
                {selected.isHold ? "✓ 보류 해제하고 정상 배송 재개" : "⚠️ 이 건을 배송 보류로 지정"}
              </button>
            </div>
          )}

          {/* 실시간 배송 추적 내역 (타임라인) */}
          <div className={drawer.sectionTitleLoose}>실시간 배송 추적 내역 ({selected.tracking.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
            {selected.tracking.map((tr, idx) => (
              <div key={idx} style={{ position: "relative", paddingLeft: "14px", borderLeft: "2px solid #e4e4e7" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "-5px",
                    top: "3px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: tr.dot || "#0284c7",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#71717a" }}>
                  <span style={{ fontWeight: 600, color: "#18181b" }}>{tr.title}</span>
                  <span>{tr.when}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#71717a", marginTop: "1px" }}>
                  출처: {tr.source} {tr.loc ? `(${tr.loc})` : ""}
                </div>
              </div>
            ))}
          </div>

          {/* 관리자 메모 */}
          <div className={drawer.sectionTitleLoose}>관리자 메모 ({selected.memos.length})</div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            <input
              type="text"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              placeholder="특이사항 및 배송 메모를 입력하세요."
              style={{ flex: 1, padding: "6px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #d4d4d8" }}
              onKeyDown={(e) => e.key === "Enter" && handleAddMemo(selected.id)}
            />
            <CommonButton size="sm" variant="secondary" onClick={() => handleAddMemo(selected.id)}>
              등록
            </CommonButton>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            {selected.memos.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#a1a1aa" }}>등록된 메모가 없습니다.</div>
            ) : (
              selected.memos.map((m, idx) => (
                <div key={idx} style={{ padding: "6px 8px", background: "#f4f4f5", borderRadius: "4px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#71717a", fontSize: "11px", marginBottom: "2px" }}>
                    <span>{m.by}</span>
                    <span>{m.when}</span>
                  </div>
                  <div style={{ color: "#18181b" }}>{m.text}</div>
                </div>
              ))
            )}
          </div>

          {/* 처리 이력 */}
          <div className={drawer.sectionTitleLoose}>배송 처리 이력 ({selected.auditLogs.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {selected.auditLogs.map((log, idx) => (
              <div key={idx} style={{ position: "relative", paddingLeft: "14px", borderLeft: "2px solid #e4e4e7" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "-5px",
                    top: "3px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#0284c7",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#71717a" }}>
                  <span style={{ fontWeight: 600, color: "#18181b" }}>{log.action}</span>
                  <span>{log.when}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#3f3f46", marginTop: "2px" }}>
                  {log.note}
                </div>
                <div style={{ fontSize: "11px", color: "#a1a1aa", marginTop: "1px" }}>
                  작업자: {log.actor} {log.invoiceChange ? `· ${log.invoiceChange}` : ""}
                </div>
              </div>
            ))}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
