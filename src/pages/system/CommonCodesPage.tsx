import { useMemo, useState } from "react";
import { DataGrid } from "../../components/DataGrid";
import type { GridRow } from "../../components/DataGrid/types";
import shared from "../ops/opsShared.module.css";
import drawer from "../ops/opsDrawerShared.module.css";
import {
  DetailDrawer,
  GridArea,
  Metrics,
  PageHeading,
  ResultBar,
} from "../c2c/sales/SalesActivityShared";
import styles from "./SystemManagement.module.css";
import { CommonButton } from "../../components/common";
import {
  CODE_ITEMS,
  STATUS_META,
  CONFIG,
  type SystemItem,
} from "./systemData";

export function CommonCodesPage() {
  const config = CONFIG.codes;
  const [items, setItems] = useState<SystemItem[]>(CODE_ITEMS);
  const [quick, setQuick] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [environment, setEnvironment] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (quick === "전체" || item.status === quick) &&
          (!environment || item.environment === environment) &&
          (!search ||
            `${item.id} ${item.name} ${item.category} ${item.owner}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [environment, items, quick, search],
  );

  const selected = items.find((item) => item.id === selectedId) ?? null;

  const reset = () => {
    setQuick("전체");
    setKeyword("");
    setSearch("");
    setEnvironment("");
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const rows: GridRow[] = filtered.map((item) => ({
    id: item.id,
    onClick: () => setSelectedId(item.id),
    cells: [
      { kind: "stack", title: item.name, subtitle: item.id },
      { kind: "text", text: item.category },
      { kind: "text", text: item.value, weight: 600 },
      { kind: "text", text: item.environment },
      {
        kind: "badge",
        text: item.status,
        bg: STATUS_META[item.status].bg,
        fg: STATUS_META[item.status].fg,
      },
      { kind: "stack", title: item.owner, subtitle: item.updatedAt },
    ],
  }));

  return (
    <section className={shared.page}>
      <PageHeading title={config.title} subtitle={config.subtitle} />
      <Metrics
        items={[
          {
            label: "전체",
            value: `${items.length}${config.unit}`,
            note: "등록된 코드 그룹",
          },
          {
            label: "정상",
            value: `${items.filter((item) => item.status === "정상").length}개`,
            note: "정상 사용 중",
            dot: "#10b981",
          },
          {
            label: "점검 필요",
            value: `${items.filter((item) => item.status === "점검 필요").length}개`,
            note: "담당자 확인 필요",
            dot: "#f59e0b",
          },
          {
            label: "중지",
            value: `${items.filter((item) => item.status === "중지").length}개`,
            note: "사용 중지",
            dot: "#a1a1aa",
          },
        ]}
      />
      <div className={shared.filterBox} style={{ margin: "0 24px 16px" }}>
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
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="코드 그룹 ID / 코드명 / 분류 / 담당 조직"
          />
          <button type="submit" className={shared.searchBtn}>
            조회
          </button>
          <div className={shared.quickFilters}>
            {["전체", "정상", "점검 필요", "중지"].map((status) => {
              const active = quick === status;
              return (
                <CommonButton
                  type="button"
                  key={status}
                  variant={active ? "primary-light" : "secondary"}
                  size="md"
                  className={`${shared.qfBtn} ${active ? shared.quickActive : ""}`}
                  onClick={() => setQuick(status)}
                >
                  <span className={shared.qfLabel}>{status}</span>
                  <span className={shared.qfCount}>
                    {
                      items.filter(
                        (item) => status === "전체" || item.status === status,
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
            <span>환경</span>
            <select
              aria-label="환경"
              className={shared.selectSm}
              value={environment}
              onChange={(event) => setEnvironment(event.target.value)}
            >
              <option value="">전체 환경</option>
              <option>Production</option>
              <option>Staging</option>
              <option>전체</option>
            </select>
          </label>
          <span className={shared.rowSpacer} />
          <button type="button" className="detailFilterBtn">
            상세 필터
          </button>
          <button type="button" className={shared.resetBtn} onClick={reset}>
            초기화
          </button>
        </div>
      </div>
      <GridArea>
        <ResultBar count={filtered.length} unit={config.unit} />
        <DataGrid
          columns={[
            { label: "항목 / 관리 ID" },
            { label: "분류" },
            { label: config.valueLabel },
            { label: "환경" },
            { label: "상태" },
            { label: "담당 / 최근 변경" },
          ]}
          rows={rows}
          gridTemplate="minmax(210px,1.4fr) 64px 90px 78px 80px 112px"
          minWidth="685px"
          empty={!filtered.length}
          emptyText="조건에 맞는 공통 코드가 없습니다."
          emptyActionLabel="초기화"
          emptyActionClick={reset}
          showPagination
          pages={[{ label: "‹" }, { label: "1", active: true }, { label: "›" }]}
          rangeLabel={
            filtered.length
              ? `1–${filtered.length} / ${filtered.length}`
              : "0개"
          }
        />
      </GridArea>
      {selected && (
        <DetailDrawer
          eyebrow={`${config.title} · ${selected.id}`}
          title={selected.name}
          status={selected.status}
          statusMeta={STATUS_META[selected.status]}
          subtitle={`${selected.category} · ${selected.environment}`}
          onClose={() => setSelectedId(null)}
          actions={
            <button
              type="button"
              className={
                selected.status === "중지"
                  ? drawer.primaryBtn
                  : drawer.dangerBtn
              }
              onClick={() => {
                setItems((current) =>
                  current.map((item) =>
                    item.id === selected.id
                      ? {
                          ...item,
                          status: item.status === "중지" ? "정상" : "중지",
                          updatedAt: "2026-08-27 15:20",
                        }
                      : item,
                  ),
                );
                notify(`${selected.name} 상태를 변경했습니다.`);
              }}
            >
              {selected.status === "중지" ? "사용 재개" : "사용 중지"}
            </button>
          }
          stats={[
            { label: "코드 수", value: selected.value },
            { label: "운영 환경", value: selected.environment },
            { label: "담당 조직", value: selected.owner },
          ]}
          fields={[
            { label: "관리 ID", value: selected.id },
            { label: "분류", value: selected.category },
            { label: "최근 변경", value: selected.updatedAt },
            { label: "설명", value: selected.description },
          ]}
        >
          <div className={drawer.sectionTitleLoose}>관리 원칙</div>
          <div className={styles.boundaryNote}>
            공통 코드는 주문, 배송, 클레임 등 전사 서비스 데이터의 일관성을
            보장합니다. 코드 추가·변경 시 다른 시스템 및 데이터 파이프라인에
            미치는 영향을 사전에 검토해야 합니다.
          </div>
        </DetailDrawer>
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
