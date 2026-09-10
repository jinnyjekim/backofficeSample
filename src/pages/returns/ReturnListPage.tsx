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
  INITIAL_RETURNS,
  STAGE_META,
  PICKUP_META,
  REFUND_META,
  REASON_META,
  type ReturnItem,
  type ReturnStage,
} from "./returnsData";

const STAGE_FILTERS: Array<{ key: string; label: string; stage?: ReturnStage }> = [
  { key: "전체", label: "전체" },
  { key: "요청", label: "요청", stage: "요청" },
  { key: "승인", label: "승인", stage: "승인" },
  { key: "회수 중", label: "회수 중", stage: "회수 중" },
  { key: "회수 완료", label: "회수 완료", stage: "회수 완료" },
  { key: "검수 중", label: "검수 중", stage: "검수 중" },
  { key: "완료", label: "완료", stage: "완료" },
  { key: "반려", label: "반려", stage: "반려" },
  { key: "철회", label: "철회", stage: "철회" },
];

const GRID_TEMPLATE =
  "40px 130px 130px 85px minmax(170px, 1fr) 105px 90px 90px 90px 110px 105px";

const GRID_COLUMNS: GridColumn[] = [
  { label: "" },
  { label: "반품번호" },
  { label: "주문번호" },
  { label: "고객명" },
  { label: "반품 상품/수량" },
  { label: "반품 사유" },
  { label: "반품 상태" },
  { label: "회수 상태" },
  { label: "환불 상태" },
  { label: "귀책 / 배송비" },
  { label: "신청일시" },
];

export function ReturnListPage() {
  const [items, setItems] = useState<ReturnItem[]>(INITIAL_RETURNS);
  const [currentStage, setCurrentStage] = useState<string>("전체");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");

  // 상세 필터 열림 여부
  const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false);

  // 상세 필터 항목들
  const [faultFilter, setFaultFilter] = useState<string>("");
  const [refundFilter, setRefundFilter] = useState<string>("");
  const [pickupFilter, setPickupFilter] = useState<string>("");
  const [reasonCategoryFilter, setReasonCategoryFilter] = useState<string>("");
  const [pickupMethodFilter, setPickupMethodFilter] = useState<string>("");
  const [carrierFilter, setCarrierFilter] = useState<string>("");
  const [holdFilter, setHoldFilter] = useState<string>("");
  const [inspectionFilter, setInspectionFilter] = useState<string>("");

  // 선택 상태
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 모달/입력 상태
  const [memoInput, setMemoInput] = useState("");
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [holdReasonInput, setHoldReasonInput] = useState("");
  const [isHolding, setIsHolding] = useState(false);

  // 탭별 카운트 계산
  const counts = useMemo(() => {
    const map: Record<string, number> = { 전체: items.length };
    STAGE_FILTERS.forEach((t) => {
      if (t.stage) {
        map[t.key] = items.filter(
          (it) =>
            it.stage === t.stage ||
            (t.stage === "요청" && it.stage === "반품 요청") ||
            (t.stage === "검수 중" && it.stage === "상품 확인")
        ).length;
      }
    });
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      // 1. 상태 탭 필터
      if (currentStage !== "전체") {
        if (currentStage === "요청" && (item.stage === "요청" || item.stage === "반품 요청")) {
          // 일치
        } else if (currentStage === "검수 중" && (item.stage === "검수 중" || item.stage === "상품 확인")) {
          // 일치
        } else if (item.stage !== currentStage) {
          return false;
        }
      }

      // 2. 검색어 (엔터 또는 검색 버튼 클릭 시 적용된 search)
      if (search) {
        const query = search.toLowerCase();
        const fullText =
          `${item.id} ${item.orderId} ${item.member} ${item.product} ${item.returnInvoiceNo} ${item.reasonDetail} ${item.carrier}`.toLowerCase();
        if (!fullText.includes(query)) return false;
      }

      // 3. 상세 필터 조건들
      if (faultFilter && item.faultParty !== faultFilter) return false;
      if (refundFilter && item.refundStatus !== refundFilter) return false;
      if (pickupFilter && item.pickupStatus !== pickupFilter) return false;
      if (reasonCategoryFilter && item.reasonCategory !== reasonCategoryFilter) return false;
      if (pickupMethodFilter && item.pickupMethod !== pickupMethodFilter) return false;
      if (carrierFilter && item.carrier !== carrierFilter) return false;
      if (inspectionFilter && item.inspectionResult !== inspectionFilter) return false;
      if (holdFilter === "보류" && !item.isHold) return false;
      if (holdFilter === "정상" && item.isHold) return false;

      return true;
    });
  }, [
    items,
    currentStage,
    search,
    faultFilter,
    refundFilter,
    pickupFilter,
    reasonCategoryFilter,
    pickupMethodFilter,
    carrierFilter,
    inspectionFilter,
    holdFilter,
  ]);

  const selected = selectedId
    ? (items.find((item) => item.id === selectedId) ?? null)
    : null;

  const resetFilters = () => {
    setKeyword("");
    setSearch("");
    setCurrentStage("전체");
    setFaultFilter("");
    setRefundFilter("");
    setPickupFilter("");
    setReasonCategoryFilter("");
    setPickupMethodFilter("");
    setCarrierFilter("");
    setHoldFilter("");
    setInspectionFilter("");
    showToast({ message: "필터가 초기화되었습니다.", type: "info" });
  };

  function toggleSel(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // 일괄 승인 처리
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    setItems((prev) =>
      prev.map((it) => {
        if (!selectedIds.includes(it.id) || it.stage !== "요청") return it;
        return {
          ...it,
          stage: "승인",
          approvedAt: "2026.08.27 15:50",
          pickupStatus: "수거 지시",
          assignee: "운영담당자",
          auditLogs: [
            ...it.auditLogs,
            {
              when: "2026.08.27 15:50",
              actor: "운영담당자",
              action: "일괄 반품 승인",
              prevStage: it.stage,
              nextStage: "승인",
              note: "일괄 처리 기능을 통한 반품 승인 및 수거 지시",
            },
          ],
        };
      })
    );
    showToast({ message: `${selectedIds.length}건이 일괄 승인 처리되었습니다.`, type: "success" });
    setSelectedIds([]);
  };

  // 단건 상태 변경 액션들
  const handleApprove = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 15:50";
        return {
          ...it,
          stage: "승인",
          approvedAt: now,
          pickupStatus: "수거 지시",
          assignee: "운영담당자",
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "운영담당자",
              action: "반품 승인",
              prevStage: it.stage,
              nextStage: "승인",
              note: "관리자 검토 후 반품 승인 및 회수 수거 지시 완료",
            },
          ],
          history: [
            ...it.history,
            { when: "08.27 15:50", title: "관리자 반품 승인 (회수 지시)", by: "운영담당자" },
          ],
        };
      })
    );
    showToast({ message: "반품 요청이 승인되었습니다. (수거 지시 완료)", type: "success" });
  };

  const handleStartPickup = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 16:10";
        return {
          ...it,
          stage: "회수 중",
          pickupStatus: "회수 중",
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "택배사(연동)",
              action: "회수 집하 출발",
              prevStage: it.stage,
              nextStage: "회수 중",
              note: "택배 기사 배정 및 방문 수거 진행 중",
            },
          ],
          history: [
            ...it.history,
            { when: "08.27 16:10", title: "택배사 회수 수거 진행 중" },
          ],
        };
      })
    );
    showToast({ message: "회수 진행 중(수거 출발)으로 변경되었습니다.", type: "info" });
  };

  const handleCompletePickup = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 16:30";
        return {
          ...it,
          stage: "회수 완료",
          pickupStatus: "회수 완료",
          collectedAt: now,
          inspectionResult: "검수 대기",
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "물류센터",
              action: "물류센터 회수 입고 완료",
              prevStage: it.stage,
              nextStage: "회수 완료",
              note: "반품 물품 물류센터 입고 완료 및 검수 대기",
            },
          ],
          history: [
            ...it.history,
            { when: "08.27 16:30", title: "물류센터 회수 입고 완료" },
          ],
        };
      })
    );
    showToast({ message: "회수 입고가 완료되었습니다. 검수를 진행해주세요.", type: "success" });
  };

  const handleStartInspection = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 16:40";
        return {
          ...it,
          stage: "검수 중",
          inspectedAt: now,
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "검수팀",
              action: "상품 실물 검수 착수",
              prevStage: it.stage,
              nextStage: "검수 중",
              note: "제품 외관, 부속품, 기능 테스트 검수 진행 중",
            },
          ],
          history: [
            ...it.history,
            { when: "08.27 16:40", title: "실물 검수 착수 (검수 중)", by: "검수팀" },
          ],
        };
      })
    );
    showToast({ message: "검수 중 상태로 변경되었습니다.", type: "info" });
  };

  const handlePassInspectionAndComplete = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 17:00";
        return {
          ...it,
          stage: "완료",
          inspectionResult: "정상 양품",
          completedAt: now,
          refundStatus: "환불 완료",
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "검수팀 / PG연동",
              action: "검수 양품 판정 및 반품/환불 완료",
              prevStage: it.stage,
              nextStage: "완료",
              note: "정상 양품 확인, 재고 환입 및 환불 승인 처리 완료",
              feeInfo: `최종 환불금액: ${it.refundAmount.toLocaleString()}원 (배송비 차감: ${it.deductFee.toLocaleString()}원)`,
            },
          ],
          history: [
            ...it.history,
            { when: "08.27 17:00", title: "검수 양품 완료 및 환불 처리 종료" },
          ],
        };
      })
    );
    showToast({ message: "검수가 완료되어 반품 및 환불 처리가 완료되었습니다.", type: "success" });
  };

  const handleRejectConfirm = (id: string) => {
    if (!rejectReasonInput.trim()) {
      showToast({ message: "반려 사유를 입력해주세요.", type: "error" });
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const now = "2026.08.27 17:15";
        return {
          ...it,
          stage: "반려",
          rejectedAt: now,
          rejectReason: rejectReasonInput,
          refundStatus: "해당 없음",
          auditLogs: [
            ...it.auditLogs,
            {
              when: now,
              actor: "운영담당자",
              action: "반품 반려 처리",
              prevStage: it.stage,
              nextStage: "반려",
              note: `반려 사유: ${rejectReasonInput}`,
            },
          ],
          history: [
            ...it.history,
            { when: "08.27 17:15", title: `반품 반려 처리 (${rejectReasonInput})`, by: "운영담당자" },
          ],
        };
      })
    );
    showToast({ message: "반품이 반려 처리되었습니다.", type: "info" });
    setIsRejecting(false);
    setRejectReasonInput("");
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
                action: "처리 보류 해제",
                nextStage: it.stage,
                note: "보류 해제 후 정상 처리 재개",
              },
            ],
            history: [
              ...it.history,
              { when: "08.27 17:20", title: "보류 해제 (정상 처리 재개)", by: "운영담당자" },
            ],
          };
        })
      );
      showToast({ message: "보류가 해제되었습니다.", type: "success" });
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
              action: "처리 보류 지정",
              nextStage: it.stage,
              note: `보류 사유: ${holdReasonInput}`,
            },
          ],
          history: [
            ...it.history,
            { when: "08.27 17:25", title: `처리 보류 지정 (${holdReasonInput})`, by: "운영담당자" },
          ],
        };
      })
    );
    showToast({ message: "해당 건이 보류 상태로 지정되었습니다.", type: "warning" });
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
    const sm = STAGE_META[item.stage] || { bg: "#f4f4f5", fg: "#52525b" };
    const pm = PICKUP_META[item.pickupStatus] || { bg: "#f4f4f5", fg: "#52525b" };
    const rm = REFUND_META[item.refundStatus] || { bg: "#f4f4f5", fg: "#52525b" };
    const rzm = REASON_META[item.reasonCategory] || { bg: "#f4f4f5", fg: "#52525b" };

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
          text: item.member,
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
          text: item.reasonCategory,
          bg: rzm.bg,
          fg: rzm.fg,
        },
        {
          kind: "badge",
          text: item.isHold ? `${item.stage} [보류]` : item.stage,
          bg: item.isHold ? "#fef2f2" : sm.bg,
          fg: item.isHold ? "#dc2626" : sm.fg,
        },
        {
          kind: "badge",
          text: item.pickupStatus,
          bg: pm.bg,
          fg: pm.fg,
        },
        {
          kind: "badge",
          text: item.refundStatus,
          bg: rm.bg,
          fg: rm.fg,
        },
        {
          kind: "text",
          text: `${item.faultParty.replace('(고객)', '')} / ${item.deductFee > 0 ? `${item.deductFee.toLocaleString()}원` : '무료'}`,
          color: "#52525b",
          size: "11.5px",
        },
        {
          kind: "text",
          text: item.requestedAt,
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
            <div className={shared.title}>반품 목록</div>
            <div className={shared.subtitle}>
              전체 반품 건의 단계별(요청/승인/회수/검수/완료/반려/철회) 현황을 조회하고 처리합니다.
            </div>
          </div>
        </div>

        {/* 쿠폰 목록 표준 필터 카드 (data-filter-expanded 연동) */}
        <div
          className={shared.filterCard}
          data-filter-expanded={isDetailFilterOpen ? "true" : "false"}
        >
          {/* 1행: 검색창 + 상태 퀵 필터 버튼 그룹 */}
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
              placeholder="반품번호 / 주문번호 / 고객명 / 상품명 / 송장번호"
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
              <span>귀책</span>
              <select
                aria-label="귀책"
                className={shared.selectSm}
                value={faultFilter}
                onChange={(e) => setFaultFilter(e.target.value)}
              >
                <option value="">귀책 전체</option>
                <option value="구매자(고객)">구매자(고객)</option>
                <option value="판매자">판매자</option>
                <option value="택배사/물류">택배사/물류</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>환불상태</span>
              <select
                aria-label="환불상태"
                className={shared.selectSm}
                value={refundFilter}
                onChange={(e) => setRefundFilter(e.target.value)}
              >
                <option value="">환불상태 전체</option>
                <option value="환불 대기">환불 대기</option>
                <option value="환불 승인">환불 승인</option>
                <option value="환불 완료">환불 완료</option>
                <option value="환불 실패">환불 실패</option>
                <option value="해당 없음">해당 없음</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>회수상태</span>
              <select
                aria-label="회수상태"
                className={shared.selectSm}
                value={pickupFilter}
                onChange={(e) => setPickupFilter(e.target.value)}
              >
                <option value="">회수상태 전체</option>
                <option value="회수 대기">회수 대기</option>
                <option value="수거 지시">수거 지시</option>
                <option value="회수 중">회수 중</option>
                <option value="회수 완료">회수 완료</option>
                <option value="해당 없음">해당 없음</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>반품 사유</span>
              <select
                aria-label="반품 사유"
                className={shared.selectSm}
                value={reasonCategoryFilter}
                onChange={(e) => setReasonCategoryFilter(e.target.value)}
              >
                <option value="">사유 전체</option>
                <option value="단순 변심">단순 변심</option>
                <option value="상품 불량">상품 불량</option>
                <option value="오배송">오배송</option>
                <option value="파손/오염">파손/오염</option>
                <option value="사이즈/색상 불일치">사이즈/색상 불일치</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>수거 방식</span>
              <select
                aria-label="수거 방식"
                className={shared.selectSm}
                value={pickupMethodFilter}
                onChange={(e) => setPickupMethodFilter(e.target.value)}
              >
                <option value="">수거방식 전체</option>
                <option value="택배사 자동수거">택배사 자동수거</option>
                <option value="고객 직접발송">고객 직접발송</option>
                <option value="현장 수거">현장 수거</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>회수 택배사</span>
              <select
                aria-label="회수 택배사"
                className={shared.selectSm}
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
              >
                <option value="">택배사 전체</option>
                <option value="CJ대한통운">CJ대한통운</option>
                <option value="한진택배">한진택배</option>
                <option value="롯데택배">롯데택배</option>
                <option value="우체국택배">우체국택배</option>
              </select>
            </label>

            <label className="globalFilterField">
              <span>검수 결과</span>
              <select
                aria-label="검수 결과"
                className={shared.selectSm}
                value={inspectionFilter}
                onChange={(e) => setInspectionFilter(e.target.value)}
              >
                <option value="">검수결과 전체</option>
                <option value="정상 양품">정상 양품</option>
                <option value="재포장 필요">재포장 필요</option>
                <option value="상품 훼손">상품 훼손</option>
                <option value="부속품 누락">부속품 누락</option>
                <option value="검수 대기">검수 대기</option>
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
                <option value="정상">정상 처리 건</option>
                <option value="보류">⚠️ 보류/지연 건만</option>
              </select>
            </label>

            <label className={shared.dateFilterField}>
              <span>신청일</span>
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
              onClick={handleBulkApprove}
            >
              선택 건 일괄 승인 (수거 지시)
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
          emptyText="조건에 일치하는 반품 건이 없습니다."
        />
      </div>

      {/* 상세 드로어 */}
      {selected && (
        <DetailDrawer
          eyebrow={`반품 상세 · ${selected.id}`}
          title={`${selected.product} (${selected.quantity}개)`}
          status={selected.isHold ? `${selected.stage} [보류]` : selected.stage}
          statusMeta={STAGE_META[selected.stage] || { bg: "#f4f4f5", fg: "#52525b" }}
          subtitle={`원주문: ${selected.orderId} · 신청고객: ${selected.member} (${selected.phone})`}
          onClose={() => {
            setSelectedId(null);
            setIsRejecting(false);
            setIsHolding(false);
          }}
          stats={[
            { label: "원결제액", value: `${selected.amount.toLocaleString()}원` },
            { label: "환불예정액", value: `${selected.refundAmount.toLocaleString()}원` },
            { label: "반품 배송비", value: `${selected.deductFee.toLocaleString()}원 (${selected.feePayer})` },
            { label: "환불 상태", value: selected.refundStatus },
          ]}
          fields={[
            { label: "반품번호", value: selected.id },
            { label: "주문번호", value: selected.orderId },
            { label: "반품사유", value: `${selected.reasonCategory} - ${selected.reasonDetail}` },
            { label: "귀책 주체", value: selected.faultParty },
            { label: "회수 상태", value: selected.pickupStatus },
            { label: "회수 방식 / 송장", value: `${selected.pickupMethod} / ${selected.carrier} (${selected.returnInvoiceNo || "미발급"})` },
            { label: "회수지 주소", value: selected.pickupAddress },
            { label: "검수 판정", value: selected.inspectionResult || "검수 대기" },
            { label: "신청 일시", value: selected.requestedAt },
          ]}
          actions={
            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
              {selected.stage === "요청" && (
                <>
                  <button
                    type="button"
                    className={drawer.primaryBtn}
                    onClick={() => handleApprove(selected.id)}
                  >
                    반품 승인 (수거 지시)
                  </button>
                  <button
                    type="button"
                    className={drawer.dangerBtn}
                    onClick={() => setIsRejecting(true)}
                  >
                    반품 반려
                  </button>
                </>
              )}

              {selected.stage === "승인" && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handleStartPickup(selected.id)}
                >
                  수거 출발 (회수 중으로 전환)
                </button>
              )}

              {selected.stage === "회수 중" && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handleCompletePickup(selected.id)}
                >
                  물류센터 입고 (회수 완료)
                </button>
              )}

              {selected.stage === "회수 완료" && (
                <button
                  type="button"
                  className={drawer.primaryBtn}
                  onClick={() => handleStartInspection(selected.id)}
                >
                  실물 검수 시작 (검수 중으로 전환)
                </button>
              )}

              {selected.stage === "검수 중" && (
                <>
                  <button
                    type="button"
                    className={drawer.primaryBtn}
                    onClick={() => handlePassInspectionAndComplete(selected.id)}
                  >
                    검수 합격 (반품/환불 완료)
                  </button>
                  <button
                    type="button"
                    className={drawer.dangerBtn}
                    onClick={() => setIsRejecting(true)}
                  >
                    검수 불합격 (반려)
                  </button>
                </>
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

          {/* 반려/보류 입력 양식 */}
          {isRejecting && (
            <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "6px", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#991b1b", marginBottom: "6px" }}>반품 반려 사유 작성</div>
              <textarea
                rows={2}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="고객 안내 및 반려 사유를 입력하세요."
                style={{ width: "100%", padding: "6px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #fca5a5" }}
              />
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "6px" }}>
                <CommonButton size="sm" variant="secondary" onClick={() => setIsRejecting(false)}>
                  취소
                </CommonButton>
                <CommonButton size="sm" variant="danger" onClick={() => handleRejectConfirm(selected.id)}>
                  반려 확정
                </CommonButton>
              </div>
            </div>
          )}

          {isHolding && (
            <div style={{ padding: "12px", background: "#fffbeb", border: "1px solid #fef3c7", borderRadius: "6px", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", marginBottom: "6px" }}>처리 보류 사유 작성</div>
              <textarea
                rows={2}
                value={holdReasonInput}
                onChange={(e) => setHoldReasonInput(e.target.value)}
                placeholder="고객 부재, 실물 불일치 등 보류 사유를 입력하세요."
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
          {selected.stage !== "완료" && selected.stage !== "반려" && selected.stage !== "철회" && (
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
                {selected.isHold ? "✓ 보류 해제하고 정상 처리 재개" : "⚠️ 이 건을 처리 보류로 지정"}
              </button>
            </div>
          )}

          {/* 관리자 메모 */}
          <div className={drawer.sectionTitleLoose}>관리자 메모 ({selected.memos.length})</div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            <input
              type="text"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              placeholder="특이사항 및 유선상담 메모를 입력하세요."
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

          {/* 해당 건 처리 이력 타임라인 */}
          <div className={drawer.sectionTitleLoose}>해당 건 처리 이력 ({selected.auditLogs.length})</div>
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
                  작업자: {log.actor} {log.feeInfo ? `· ${log.feeInfo}` : ""}
                </div>
              </div>
            ))}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
