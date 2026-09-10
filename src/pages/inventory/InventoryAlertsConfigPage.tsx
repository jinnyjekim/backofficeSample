import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SafetyStockPage } from "./SafetyStockPage";
import { InventoryAlertsPage } from "./InventoryAlertsPage";
import shared from "../ops/opsShared.module.css";
import styles from "./InventoryStatusPage.module.css";
import { CommonButton } from "../../components/common";

export function InventoryAlertsConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab =
    rawTab === "history" || rawTab === "config" ? rawTab : "safety";

  // 알림 설정 탭을 위한 로컬 상태
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [soldOutAlert, setSoldOutAlert] = useState(true);
  const [imminentAlert, setImminentAlert] = useState(true);
  const [alertChannels, setAlertChannels] = useState<string[]>([
    "시스템 알림",
    "이메일",
    "슬랙",
  ]);
  const [repeatInterval, setRepeatInterval] = useState("매일 09:00");
  const [managerEmails, setManagerEmails] = useState(
    "inventory@example.com, ops@example.com",
  );
  const [slackWebhook, setSlackWebhook] = useState(
    "https://hooks.slack.com/services/T00/B00/XXXXX",
  );
  const [toast, setToast] = useState("");

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setToast("알림 설정이 성공적으로 저장되었습니다.");
    setTimeout(() => setToast(""), 3000);
  };

  const headerTabs = (
    <div
      className={styles.viewToggleRow}
      style={{ marginTop: "12px", marginBottom: "4px" }}
    >
      <div className={styles.viewToggle}>
        <button
          type="button"
          className={`${styles.viewToggleBtn} ${tab === "safety" ? styles.active : ""}`}
          onClick={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("tab", "safety");
              return next;
            });
          }}
        >
          안전재고 기준
        </button>
        <button
          type="button"
          className={`${styles.viewToggleBtn} ${tab === "config" ? styles.active : ""}`}
          onClick={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("tab", "config");
              return next;
            });
          }}
        >
          알림 설정
        </button>
        <button
          type="button"
          className={`${styles.viewToggleBtn} ${tab === "history" ? styles.active : ""}`}
          onClick={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("tab", "history");
              return next;
            });
          }}
        >
          알림 내역
        </button>
      </div>
    </div>
  );

  if (tab === "safety") {
    return (
      <SafetyStockPage
        pageTitle="재고 알림·설정"
        pageSubtitle="SKU·창고별 안전재고 기준과 부족 알림 조건, 발생 내역을 종합 관리합니다."
        headerTabs={headerTabs}
      />
    );
  }

  if (tab === "history") {
    return (
      <InventoryAlertsPage
        pageTitle="재고 알림·설정"
        pageSubtitle="SKU·창고별 안전재고 기준과 부족 알림 조건, 발생 내역을 종합 관리합니다."
        headerTabs={headerTabs}
      />
    );
  }

  // tab === "config"
  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>재고 알림·설정</h1>
            <p className={shared.subtitle}>
              SKU·창고별 안전재고 기준과 부족 알림 조건, 발생 내역을 종합 관리합니다.
            </p>
          </div>
        </div>
        {headerTabs}
        <div className={styles.definitionStrip}>
          알림 발송 기준 및 수신 채널을 정의합니다. 품절 또는 안전재고 미달 시 지정된 담당자에게 실시간 알림이 발송됩니다.
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "880px",
          marginTop: "16px",
        }}
      >
        <form onSubmit={handleSaveConfig}>
          <div style={{ marginBottom: "28px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#18181b",
                marginBottom: "8px",
              }}
            >
              1. 알림 발생 조건
            </h3>
            <p style={{ fontSize: "12.5px", color: "#71717a", marginBottom: "14px" }}>
              어떤 재고 상태 변동 시 알림을 트리거할지 선택합니다.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#27272a",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={soldOutAlert}
                  onChange={(e) => setSoldOutAlert(e.target.checked)}
                />
                <strong>품절 발생 시 알림</strong> (판매 가능 수량이 0 이하로 떨어질 때 즉시 발송)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#27272a",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={lowStockAlert}
                  onChange={(e) => setLowStockAlert(e.target.checked)}
                />
                <strong>안전재고 미달 알림</strong> (판매 가능 수량이 SKU별 안전재고 이하로 떨어질 때)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "#27272a",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={imminentAlert}
                  onChange={(e) => setImminentAlert(e.target.checked)}
                />
                <strong>임계 접근 사전 알림</strong> (판매 가능 수량이 안전재고의 120% 이내에 도달할 때)
              </label>
            </div>
          </div>

          <div style={{ marginBottom: "28px", borderTop: "1px solid #f4f4f5", paddingTop: "20px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#18181b",
                marginBottom: "8px",
              }}
            >
              2. 수신 채널 및 주기
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#3f3f46", marginBottom: "6px" }}>
                  수신 채널 선택
                </label>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "6px" }}>
                  {["시스템 알림", "이메일", "슬랙", "SMS"].map((ch) => {
                    const checked = alertChannels.includes(ch);
                    return (
                      <label key={ch} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setAlertChannels((prev) =>
                              checked ? prev.filter((c) => c !== ch) : [...prev, ch],
                            );
                          }}
                        />
                        {ch}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#3f3f46", marginBottom: "6px" }}>
                  미해결 건 재알림 주기
                </label>
                <select
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    background: "#fff",
                  }}
                >
                  <option>즉시 1회만 발송</option>
                  <option>매일 09:00</option>
                  <option>매일 09:00, 15:00 (1일 2회)</option>
                  <option>4시간 주기</option>
                  <option>주 1회 (매주 월요일)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "28px", borderTop: "1px solid #f4f4f5", paddingTop: "20px" }}>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#18181b",
                marginBottom: "8px",
              }}
            >
              3. 수신 대상자 정보
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "4px" }}>
                  수신 이메일 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={managerEmails}
                  onChange={(e) => setManagerEmails(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#3f3f46", marginBottom: "4px" }}>
                  Slack Webhook URL
                </label>
                <input
                  type="text"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 10px",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid #f4f4f5", paddingTop: "16px" }}>
            <CommonButton type="submit" variant="primary" size="md">
              설정 저장
            </CommonButton>
          </div>
        </form>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#18181b",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      )}
    </section>
  );
}
