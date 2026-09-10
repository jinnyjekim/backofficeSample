import { useSearchParams } from "react-router-dom";
import { InboundManagementPage } from "./InboundManagementPage";
import { StockOutboundManagementPage } from "./StockOutboundManagementPage";
import styles from "./InventoryStatusPage.module.css";

export function StockMovementManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "outbound" ? "outbound" : "inbound";

  const headerTabs = (
    <div
      className={styles.viewToggleRow}
      style={{ marginTop: "12px", marginBottom: "4px" }}
    >
      <div className={styles.viewToggle}>
        <button
          type="button"
          className={`${styles.viewToggleBtn} ${tab === "inbound" ? styles.active : ""}`}
          onClick={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("tab", "inbound");
              return next;
            });
          }}
        >
          입고 관리
        </button>
        <button
          type="button"
          className={`${styles.viewToggleBtn} ${tab === "outbound" ? styles.active : ""}`}
          onClick={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("tab", "outbound");
              return next;
            });
          }}
        >
          출고 관리
        </button>
      </div>
    </div>
  );

  if (tab === "outbound") {
    return (
      <StockOutboundManagementPage
        pageTitle="입출고 관리"
        pageSubtitle="상품의 입고 및 출고 일정을 등록하고 실물 재고 변동을 확정 처리합니다."
        headerTabs={headerTabs}
      />
    );
  }

  return (
    <InboundManagementPage
      pageTitle="입출고 관리"
      pageSubtitle="상품의 입고 및 출고 일정을 등록하고 실물 재고 변동을 확정 처리합니다."
      headerTabs={headerTabs}
    />
  );
}
