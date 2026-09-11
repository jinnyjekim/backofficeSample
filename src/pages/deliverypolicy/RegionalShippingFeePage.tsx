import { ExcelDownloadButton } from "../../components/common/ExcelDownloadButton";
import { useMemo, useState } from "react";
import { DataGrid } from "../../components/DataGrid/DataGrid";
import type { GridRow } from "../../components/DataGrid/types";
import shared from "../ops/opsShared.module.css";
import styles from "./RegionalShippingFeePage.module.css";
import { RegionalFeeDrawer } from "./RegionalFeeDrawer";
import {
  DELIVERY_METHODS,
  INITIAL_POLICIES,
  QUICK_FILTERS,
  REGION_CATEGORIES,
  TEST_ADDRESSES,
  computeAddressShippingPreview,
  computeStatus,
  computeWarnings,
  fmtPeriod,
  fmtRegion,
  fmtWon,
  matchesQuickFilter,
  newRegionalFeePolicy,
  type DeliveryMethod,
  type DeliveryAvailability,
  type RegionalFeePolicy,
  type QuickFilter,
  type RegionCategory,
  type RegionType,
} from "./regionalShippingFeeData";
import { CommonButton, showToast } from "../../components/common";

const TODAY = "2026-08-25";

type View = "list" | "preview";
type ConfirmState = { kind: "delete" | "end"; item: RegionalFeePolicy } | null;

const COLUMNS = [
  { label: "정책명" },
  { label: "지역 유형" },
  { label: "대상 지역" },
  { label: "배송 여부" },
  { label: "추가 배송비", align: "right" as const },
  { label: "배송 방법" },
  { label: "적용 기간" },
  { label: "우선순위", align: "right" as const },
  { label: "상태" },
];

const STATUS_DOT: Record<string, { dot: string; fg: string }> = {
  적용중: { dot: "#10b981", fg: "#047857" },
  "적용 예정": { dot: "#3b82f6", fg: "#1d4ed8" },
  종료: { dot: "#a1a1aa", fg: "#71717a" },
  비활성: { dot: "#d4d4d8", fg: "#a1a1aa" },
};

function history(
  item: RegionalFeePolicy,
  action: string,
  before?: string,
  after?: string,
): RegionalFeePolicy {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: "admin01",
    history: [
      ...item.history,
      {
        id: `H-${item.id}-${Date.now()}`,
        at: `${TODAY} 14:00`,
        by: "admin01",
        action,
        before,
        after,
      },
    ],
  };
}

export function RegionalShippingFeePage() {
  const [policies, setPolicies] = useState(INITIAL_POLICIES);
  const [view, setView] = useState<View>("list");

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("전체");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [regionTypeFilter, setRegionTypeFilter] = useState<RegionType | "">("");
  const [regionCategoryFilter, setRegionCategoryFilter] = useState<RegionCategory | "">("");
  const [availabilityFilter, setAvailabilityFilter] = useState<DeliveryAvailability | "">("");
  const [methodFilter, setMethodFilter] = useState<DeliveryMethod | "">("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerItem, setDrawerItem] = useState<RegionalFeePolicy | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const [previewAddrId, setPreviewAddrId] = useState(TEST_ADDRESSES[0].id);

  const warnings = useMemo(() => computeWarnings(policies), [policies]);

  const filtered = useMemo(
    () =>
      policies.filter((p) => {
        if (!matchesQuickFilter(p, quickFilter, warnings)) return false;
        if (
          search &&
          !`${p.name} ${p.code} ${p.sido} ${p.sigungu}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        if (regionTypeFilter && p.regionType !== regionTypeFilter) return false;
        if (regionCategoryFilter && p.regionCategory !== regionCategoryFilter) return false;
        if (availabilityFilter && p.deliveryAvailability !== availabilityFilter) return false;
        if (methodFilter && p.deliveryMethod !== methodFilter) return false;
        return true;
      }),
    [policies, quickFilter, search, regionTypeFilter, regionCategoryFilter, availabilityFilter, methodFilter, warnings],
  );

  const toastBriefly = (message: string) => {
    showToast({ message, type: "success" });
  };
  const reset = () => {
    setKeyword("");
    setSearch("");
    setRegionTypeFilter("");
    setRegionCategoryFilter("");
    setAvailabilityFilter("");
    setMethodFilter("");
  };
  const openCreate = () => {
    setDrawerItem(newRegionalFeePolicy());
    setIsNew(true);
  };
  const openDetail = (item: RegionalFeePolicy) => {
    setDrawerItem(item);
    setIsNew(false);
  };

  const save = (item: RegionalFeePolicy) => {
    if (isNew) {
      const saved = history({ ...item, history: [] }, "정책 등록");
      setPolicies((current) => [saved, ...current]);
      setDrawerItem(null);
      setIsNew(false);
      toastBriefly("지역 배송 정책을 등록했습니다.");
    } else {
      const previous = policies.find((p) => p.id === item.id);
      const saved =
        previous && previous.extraFee !== item.extraFee
          ? history(
              item,
              "추가 배송비 변경",
              fmtWon(previous.extraFee),
              fmtWon(item.extraFee),
            )
          : history(item, "정책 수정");
      setPolicies((current) =>
        current.map((p) => (p.id === item.id ? saved : p)),
      );
      setDrawerItem(saved);
      toastBriefly("정책을 저장했습니다.");
    }
  };

  const toggleActive = (item: RegionalFeePolicy) => {
    const updated = history(
      { ...item, active: !item.active },
      item.active ? "정책 비활성화" : "정책 활성화",
    );
    setPolicies((current) =>
      current.map((p) => (p.id === updated.id ? updated : p)),
    );
    setDrawerItem((current) =>
      current && current.id === updated.id ? updated : current,
    );
    toastBriefly(
      item.active ? "정책을 비활성화했습니다." : "정책을 활성화했습니다.",
    );
  };

  const confirmAction = () => {
    if (!confirm) return;
    if (confirm.kind === "delete") {
      setPolicies((current) => current.filter((p) => p.id !== confirm.item.id));
      setDrawerItem(null);
      toastBriefly("사용 이력이 없는 정책을 삭제했습니다.");
    } else {
      const updated = history(
        { ...confirm.item, endDate: TODAY },
        "정책 종료",
        "상시",
        `${TODAY} 종료`,
      );
      setPolicies((current) =>
        current.map((p) => (p.id === updated.id ? updated : p)),
      );
      setDrawerItem((current) =>
        current && current.id === updated.id ? updated : current,
      );
      toastBriefly("정책을 종료했습니다. 신규 주문부터 적용되지 않습니다.");
    }
    setConfirm(null);
  };

  const rows: GridRow[] = filtered.map((p) => {
    const issues = warnings[p.id] ?? [];
    const status = computeStatus(p);
    const dotColor = STATUS_DOT[status];
    return {
      id: p.id,
      onClick: () => openDetail(p),
      bg: issues.length ? "#fffdf8" : undefined,
      cells: [
        {
          kind: "titleWarn",
          title: p.name,
          hasIssue: issues.length > 0,
          issueTitle: issues.join(" · "),
        },
        {
          kind: "badge",
          text: p.regionCategory,
          bg: p.regionCategory === "제주" ? "#eef2ff" : p.regionCategory === "일반" ? "#f4f4f5" : "#fff7ed",
          fg: p.regionCategory === "제주" ? "#4338ca" : p.regionCategory === "일반" ? "#71717a" : "#c2410c",
        },
        { kind: "text", text: `${fmtRegion(p)} · ${p.regionType}`, size: "12px", color: "#3f3f46" },
        {
          kind: "badge",
          text: p.deliveryAvailability,
          bg: p.deliveryAvailability === "가능" ? "#ecfdf5" : "#fef2f2",
          fg: p.deliveryAvailability === "가능" ? "#047857" : "#dc2626",
        },
        {
          kind: "text",
          text: p.deliveryAvailability === "가능" ? `+${fmtWon(p.extraFee)}` : "-",
          size: "12px",
          weight: 600,
          align: "right",
          numeric: true,
        },
        {
          kind: "text",
          text: p.deliveryMethod,
          size: "12px",
          color: "#3f3f46",
        },
        { kind: "text", text: fmtPeriod(p), size: "11px", color: "#71717a" },
        { kind: "text", text: `${p.priority}`, size: "12px", align: "right", numeric: true },
        { kind: "statusDot", text: status, dot: dotColor.dot, fg: dotColor.fg },
      ],
    };
  });

  const previewAddr = TEST_ADDRESSES.find((a) => a.id === previewAddrId)!;
  const previewResult = computeAddressShippingPreview(previewAddr, policies);

  return (
    <div className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={shared.title}>지역별 추가 배송비</div>
            <div className={shared.subtitle}>
              행정구역·우편번호별 추가 배송비와 배송 가능 여부를 한 곳에서 관리합니다.
            </div>
          </div>
          {view === "list" && (
            <button
              type="button"
              className={shared.createBtn}
              onClick={openCreate}
            >
              + 지역 정책 등록
            </button>
          )}
        </div>

        <div className={shared.quickFilters}>
          <CommonButton
            type="button"
            variant={view === "list" ? "primary-light" : "secondary"}
            size="md"
            className={`${shared.qfBtn} ${view === "list" ? styles.quickActive : ""}`}
            onClick={() => setView("list")}
          >
            <span className={shared.qfLabel}>지역 정책 목록</span>
          </CommonButton>
          <CommonButton
            type="button"
            variant={view === "preview" ? "primary-light" : "secondary"}
            size="md"
            className={`${shared.qfBtn} ${view === "preview" ? styles.quickActive : ""}`}
            onClick={() => setView("preview")}
          >
            <span className={shared.qfLabel}>지역 판정 테스트</span>
          </CommonButton>
        </div>

        {view === "list" && (
          <>
            <div className={shared.filterBox}>
              <form
                className={shared.filterRow1}
                onSubmit={(event) => {
                  event.preventDefault();
                  setSearch(keyword.trim());
                }}
              >
                <input
                  className={shared.searchInput}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="정책명, 정책 코드, 지역명 검색"
                />
                <button type="submit" className={shared.searchBtn}>
                  검색
                </button>
                <div className={shared.quickFilters}>
                  {QUICK_FILTERS.map((filter) => {
                    const active = quickFilter === filter;
                    return (
                      <CommonButton
                        key={filter}
                        variant={active ? "primary-light" : "secondary"}
                        size="md"
                        className={`${shared.qfBtn} ${active ? styles.quickActive : ""}`}
                        onClick={() => setQuickFilter(filter)}
                      >
                        <span className={shared.qfLabel}>{filter}</span>
                        <span className={shared.qfCount}>
                          {
                            policies.filter((p) =>
                              matchesQuickFilter(p, filter, warnings),
                            ).length
                          }
                        </span>
                      </CommonButton>
                    );
                  })}
                </div>
              </form>
              <div className={shared.filterRow2}>
                <label className="globalFilterField">
                  <span>지역 유형</span>
                  <select
                    aria-label="지역 유형"
                    className={shared.selectSm}
                    value={regionCategoryFilter}
                    onChange={(e) => setRegionCategoryFilter(e.target.value as RegionCategory | "")}
                  >
                    <option value="">전체 지역 유형</option>
                    {REGION_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
                <label className="globalFilterField">
                  <span>지역 지정 방식</span>
                  <select
                    aria-label="지역유형"
                    className={shared.selectSm}
                    value={regionTypeFilter}
                    onChange={(e) =>
                      setRegionTypeFilter(e.target.value as RegionType | "")
                    }
                  >
                    <option value="">전체 지역유형</option>
                    <option>행정구역</option>
                    <option>우편번호</option>
                  </select>
                </label>
                <label className="globalFilterField">
                  <span>배송 여부</span>
                  <select
                    aria-label="배송 여부"
                    className={shared.selectSm}
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value as DeliveryAvailability | "")}
                  >
                    <option value="">전체 배송 여부</option>
                    <option>가능</option>
                    <option>불가</option>
                  </select>
                </label>
                <label className="globalFilterField">
                  <span>배송방법</span>
                  <select
                    aria-label="배송방법"
                    className={shared.selectSm}
                    value={methodFilter}
                    onChange={(e) =>
                      setMethodFilter(e.target.value as DeliveryMethod | "")
                    }
                  >
                    <option value="">전체 배송방법</option>
                    {DELIVERY_METHODS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <span className={shared.rowSpacer} />
                <button type="button" className="detailFilterBtn">
                  상세 필터
                </button>
                <button
                  type="button"
                  className={shared.resetBtn}
                  onClick={reset}
                >
                  초기화
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      {view === "list" && (
        <div className={shared.gridWrap}>
          <div className={shared.resultRow}>
            <span className={shared.resultLabel}>
              총 {filtered.length}개 정책
            </span>
          
          <div className={shared.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={shared.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div></div>
          <DataGrid
            columns={COLUMNS}
            rows={rows}
            gridTemplate="minmax(180px,1fr) 62px 154px 62px 78px 72px 145px 52px 68px"
            minWidth="1040px"
            empty={filtered.length === 0}
            emptyText={
              quickFilter === "확인 필요"
                ? "현재 확인이 필요한 지역 배송비 정책이 없습니다."
                : "검색 결과가 없습니다."
            }
            emptySubtext="검색어나 필터 조건을 변경해 주세요."
            emptyActionLabel="초기화"
            emptyActionClick={reset}
          />
        </div>
      )}

      {view === "preview" && (
        <div className={shared.gridWrap} style={{ marginTop: 0 }}>
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>테스트 배송지 선택</h3>
              <div className={styles.orderPick}>
                {TEST_ADDRESSES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`${styles.orderOption} ${previewAddrId === a.id ? styles.orderOptionActive : ""}`}
                    onClick={() => setPreviewAddrId(a.id)}
                  >
                    <span>
                      <strong>{a.label}</strong> · {a.deliveryMethod}
                    </span>
                    <span>{a.postalCode}</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>
                현재 저장된(적용중인) 정책 기준으로 판정합니다. 기본 배송비는
                배송 정책 &gt; 배송비 설정 &gt; 기본 배송비를 따릅니다.
              </div>
            </div>
            <div className={styles.previewCard}>
              <h3>배송비 계산 테스트 결과</h3>
              <div
                className={`${styles.resultHero} ${previewResult.match.tie || !previewResult.deliveryAvailable ? styles.resultHeroWarn : ""}`}
              >
                <span>
                  {previewAddr.label} ({previewAddr.sido} {previewAddr.sigungu})
                  · {previewAddr.deliveryMethod}
                </span>
                <strong>{previewResult.deliveryAvailable ? fmtWon(previewResult.finalFee) : "배송 불가"}</strong>
              </div>
              <div className={styles.breakdownTable}>
                <div className={styles.breakdownRow}>
                  <span>기본 배송비</span>
                  <span>{fmtWon(previewResult.finalBaseFee)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>
                    지역 추가배송비
                    {previewResult.match.matched
                      ? ` (${previewResult.match.matched.name})`
                      : ""}
                  </span>
                  <span>{fmtWon(previewResult.finalRegionFee)}</span>
                </div>
                <div
                  className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}
                >
                  <span>최종 배송비</span>
                  <span>{fmtWon(previewResult.finalFee)}</span>
                </div>
              </div>
              {previewResult.match.tie && (
                <div className={styles.noteList}>
                  <div>
                    ⚠ 동일 우선순위로 매칭되는 정책이{" "}
                    {previewResult.match.candidates.length}건 있습니다:{" "}
                    {previewResult.match.candidates
                      .map((c) => c.name)
                      .join(", ")}
                    . 정책 목록에서 우선순위를 조정해 주세요.
                  </div>
                </div>
              )}
              <div className={styles.resultRow}>
                <span>매칭 정책</span>
                <strong>
                  {previewResult.match.matched?.name ?? "매칭된 정책 없음"}
                </strong>
              </div>
              <div className={styles.resultRow}>
                <span>배송 가능 여부</span>
                <strong>{previewResult.deliveryAvailable ? "가능" : "불가"}</strong>
              </div>
              <div className={styles.resultRow}>
                <span>판정 근거</span>
                <strong>{previewResult.match.matched ? `${previewResult.match.matched.regionType} · ${fmtRegion(previewResult.match.matched)}` : "일치하는 지역 정책 없음"}</strong>
              </div>
              <div className={styles.resultRow}>
                <span>무료배송 적용</span>
                <strong>
                  {previewResult.freeShippingApplied ? "적용" : "미적용"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {drawerItem && (
        <RegionalFeeDrawer
          key={`${drawerItem.id}-${isNew}`}
          initial={drawerItem}
          isNew={isNew}
          startEditing={isNew}
          issues={warnings[drawerItem.id] ?? []}
          onClose={() => {
            setDrawerItem(null);
            setIsNew(false);
          }}
          onSave={save}
          onToggleActive={toggleActive}
        />
      )}

      {confirm && (
        <div
          className={shared.dialogOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirm(null);
          }}
        >
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>
              {confirm.kind === "delete"
                ? "지역 배송비 정책 삭제"
                : "지역 배송비 정책 종료"}
            </h2>
            <p className={shared.dialogBody}>
              {confirm.kind === "delete"
                ? "사용 이력이 없는 정책입니다. 삭제하면 복구할 수 없습니다."
                : "오늘 날짜로 적용 종료일을 설정합니다. 신규 주문에는 더 이상 적용되지 않습니다."}
            </p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}>
                <span>정책명</span>
                <strong>{confirm.item.name}</strong>
              </div>
              <div className={shared.dialogSummaryRow}>
                <span>사용 이력</span>
                <strong>{confirm.item.usageCount.toLocaleString()}건</strong>
              </div>
            </div>
            <div className={shared.dialogActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setConfirm(null)}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={confirmAction}
              >
                {confirm.kind === "delete" ? "삭제" : "종료"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
