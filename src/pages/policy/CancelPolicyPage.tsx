import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import shared from "../ops/opsShared.module.css";
import timeline from "../ops/opsDrawerShared.module.css";
import styles from "./CancelPolicyPage.module.css";
import {
  CommonBadge,
  CommonButton,
  CommonDatePicker,
  CommonInput,
  CommonRadio,
  CommonSelect,
  CommonSwitch,
  showToast,
} from "../../components/common";
import { CancelReasonEditDialog } from "./CancelReasonEditDialog";
import { useOutsideClose } from "../../lib/useOutsideClose";
import {
  CANCEL_QUICK_STAGES,
  INITIAL_HISTORY,
  INITIAL_LAST_MODIFIED,
  INITIAL_POLICY,
  INITIAL_REASONS,
  INITIAL_STAGE_RULES,
  POST_SHIPMENT_STAGES,
  computeWarnings,
  describePolicyChanges,
  describeReasonChanges,
  describeStageChanges,
  type ApprovalNeed,
  type AdminApprovalMode,
  type CancelAvailability,
  type CancelPolicy,
  type CancelReason,
  type CancelTimingBase,
  type CostBearer,
  type ConditionalReviewOwner,
  type ConditionalTimeoutAction,
  type FieldDiff,
  type LastModified,
  type PolicyHistoryEntry,
  type PostShipmentAction,
  type StageCancelRule,
  type WithdrawPolicy,
} from "./cancelPolicyData";

type Tab =
  | "basic"
  | "stage"
  | "partial"
  | "reasons"
  | "preview";
const TABS: [Tab, string][] = [
  ["basic", "기본 정책"],
  ["stage", "단계별 취소"],
  ["partial", "부분 취소 · 후속 처리"],
  ["reasons", "사유 관리"],
  ["preview", "정책 Preview"],
];

function availClass(a: CancelAvailability): string {
  return a === "가능"
    ? styles.availOk
    : a === "조건부"
      ? styles.availCond
      : styles.availNo;
}

export function CancelPolicyPage() {
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [stageRules, setStageRules] = useState(INITIAL_STAGE_RULES);
  const [reasons, setReasons] = useState(INITIAL_REASONS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastModified, setLastModified] = useState<LastModified>(
    INITIAL_LAST_MODIFIED,
  );

  const [tab, setTab] = useState<Tab>("basic");
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [draftStageRules, setDraftStageRules] = useState(stageRules);
  const [draftReasons, setDraftReasons] = useState(reasons);
  const [showHistory, setShowHistory] = useState(false);
  const [reasonEditId, setReasonEditId] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState("");
  const [saveError, setSaveError] = useState("");

  const [basicPreviewStage, setBasicPreviewStage] = useState("처리");
  const [basicPreviewReason, setBasicPreviewReason] = useState<
    "고객 변심" | "상품 품절" | "배송 지연"
  >("고객 변심");
  const [basicPreviewAmount, setBasicPreviewAmount] = useState(48000);
  const [stagePreviewActor, setStagePreviewActor] = useState<"고객" | "관리자">("고객");
  const historyRef = useRef<HTMLElement>(null);

  useOutsideClose(historyRef, () => setShowHistory(false));

  const warnings = useMemo(
    () =>
      computeWarnings(
        editing ? draftPolicy : policy,
        editing ? draftStageRules : stageRules,
        editing ? draftReasons : reasons,
      ),
    [
      editing,
      draftPolicy,
      draftStageRules,
      draftReasons,
      policy,
      stageRules,
      reasons,
    ],
  );

  const toastBriefly = (message: string) => {
    showToast({ message, type: "success" });
  };

  const set = <K extends keyof CancelPolicy>(
    key: K,
    value: CancelPolicy[K],
  ) => {
    if (!editing) return;
    setDraftPolicy((current) => ({ ...current, [key]: value }));
  };

  const startEdit = () => {
    setDraftPolicy(policy);
    setDraftStageRules(stageRules);
    setDraftReasons(reasons);
    setEditing(true);
    toastBriefly(
      "취소 정책 수정 모드입니다. 변경 후 상단의 [변경 사항 저장]을 클릭하세요.",
    );
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
    setDraftStageRules(stageRules);
    setDraftReasons(reasons);
    toastBriefly("수정을 취소했습니다.");
  };
  const requestSave = () => {
    const diffs = [
      ...describePolicyChanges(policy, draftPolicy),
      ...describeStageChanges(stageRules, draftStageRules),
      ...describeReasonChanges(reasons, draftReasons),
    ];
    if (diffs.length === 0) {
      setEditing(false);
      toastBriefly("변경된 내용이 없어 수정 모드를 종료합니다.");
      return;
    }
    setReason("");
    setSaveError("");
    setConfirmSave(diffs);
  };
  const commitSave = () => {
    if (!reason.trim()) return setSaveError("변경 사유를 입력해 주세요.");
    if (!confirmSave) return;
    const entries: PolicyHistoryEntry[] = confirmSave.map((d, i) => ({
      id: `H-${Date.now()}-${i}`,
      at: "2026-08-24 14:00",
      by: "admin01",
      field: d.field,
      before: d.before,
      after: d.after,
      reason: reason.trim(),
    }));
    setPolicy(draftPolicy);
    setStageRules(draftStageRules);
    setReasons(draftReasons);
    setHistory((current) => [...entries, ...current]);
    setLastModified({ at: "2026-08-31", by: "운영 관리자" });
    setConfirmSave(null);
    setEditing(false);
    toastBriefly("취소 정책을 저장했습니다.");
  };

  const setStage = (stage: string, patch: Partial<StageCancelRule>) => {
    const currentRules = editing ? draftStageRules : stageRules;
    const updated = currentRules.map((r) =>
      r.stage === stage ? { ...r, ...patch } : r,
    );
    if (!editing) {
      setDraftPolicy(policy);
      setDraftStageRules(updated);
      setDraftReasons(reasons);
      setEditing(true);
      toastBriefly("단계별 취소 규칙이 수정 모드로 전환되었습니다.");
    } else {
      setDraftStageRules(updated);
    }
  };

  const toggleCancelStage = (stage: string) => {
    if (!editing) return;
    const currentList = draftPolicy.cancelAllowedStages;
    const nextList = currentList.includes(stage)
      ? currentList.filter((s) => s !== stage)
      : [...currentList, stage];
    setDraftPolicy((current) => ({
      ...current,
      cancelAllowedStages: nextList,
    }));
  };

  const saveReason = (updated: CancelReason) => {
    const currentReasons = editing ? draftReasons : reasons;
    const nextReasons = currentReasons.find((r) => r.id === updated.id)
      ? currentReasons.map((r) => (r.id === updated.id ? updated : r))
      : [...currentReasons, updated];
    if (!editing) {
      setDraftPolicy(policy);
      setDraftStageRules(stageRules);
      setDraftReasons(nextReasons);
      setEditing(true);
      toastBriefly(
        "취소 사유가 임시 저장되었습니다. 상단의 [변경 사항 저장]을 클릭하세요.",
      );
    } else {
      setDraftReasons(nextReasons);
    }
    setReasonEditId(null);
  };
  const addReason = (audience: "고객" | "관리자") => {
    const currentReasons = editing ? draftReasons : reasons;
    const nextOrder =
      Math.max(
        0,
        ...currentReasons
          .filter((r) => r.audience === audience)
          .map((r) => r.order),
      ) + 1;
    const draft: CancelReason = {
      id: `NEW-${Date.now()}`,
      label: "",
      audience,
      active: true,
      order: nextOrder,
      requiresDetail: false,
    };
    if (!editing) {
      setDraftPolicy(policy);
      setDraftStageRules(stageRules);
      setDraftReasons([...currentReasons, draft]);
      setEditing(true);
    } else {
      setDraftReasons((current) => [...current, draft]);
    }
    setReasonEditId(draft.id);
  };
  const removeReason = (id: string) => {
    const currentReasons = editing ? draftReasons : reasons;
    const nextReasons = currentReasons.filter((r) => r.id !== id);
    if (!editing) {
      setDraftPolicy(policy);
      setDraftStageRules(stageRules);
      setDraftReasons(nextReasons);
      setEditing(true);
      toastBriefly(
        "사유가 삭제되었습니다. 상단의 [변경 사항 저장]을 클릭하세요.",
      );
    } else {
      setDraftReasons(nextReasons);
    }
  };
  const moveReason = (item: CancelReason, direction: -1 | 1) => {
    const currentReasons = editing ? draftReasons : reasons;
    const siblings = currentReasons
      .filter((r) => r.audience === item.audience)
      .sort((a, b) => a.order - b.order);
    const index = siblings.findIndex((r) => r.id === item.id);
    const swap = siblings[index + direction];
    if (!swap) return;
    const updated = currentReasons.map((r) =>
      r.id === item.id
        ? { ...r, order: swap.order }
        : r.id === swap.id
          ? { ...r, order: item.order }
          : r,
    );
    if (!editing) {
      setDraftPolicy(policy);
      setDraftStageRules(stageRules);
      setDraftReasons(updated);
      setEditing(true);
      toastBriefly("사유 노출 순서가 변경되었으며 수정 모드로 전환되었습니다.");
    } else {
      setDraftReasons(updated);
    }
  };

  const activeStageRules = editing ? draftStageRules : stageRules;
  const activeReasons = (editing ? draftReasons : reasons)
    .slice()
    .sort((a, b) => a.order - b.order);
  const customerReasons = activeReasons.filter((r) => r.audience === "고객");
  const adminReasons = activeReasons.filter((r) => r.audience === "관리자");

  const basicPreviewAllowed =
    draftPolicy.cancelAllowedStages.includes(basicPreviewStage);
  const basicPreviewBearer =
    basicPreviewReason === "고객 변심"
      ? draftPolicy.customerChangeBurden
      : basicPreviewReason === "상품 품절"
        ? draftPolicy.outOfStockBurden
        : draftPolicy.deliveryDelayBurden;
  const basicPreviewDeduction =
    basicPreviewAllowed &&
    basicPreviewBearer === "고객" &&
    draftPolicy.rechargeShippingOnFreeThresholdMiss
      ? draftPolicy.baseShippingFee
      : 0;
  const conditionalStageCount = activeStageRules.filter(
    (rule) => rule.customerCancel === "조건부" || rule.adminCancel === "조건부",
  ).length;
  const customerAvailableCount = activeStageRules.filter(
    (rule) => rule.customerCancel === "가능",
  ).length;
  const adminAvailableCount = activeStageRules.filter(
    (rule) => rule.adminCancel === "가능",
  ).length;
  const approvalRequiredCount = activeStageRules.filter(
    (rule) => rule.approval === "필요",
  ).length;
  const lastCustomerCancelStage = [...activeStageRules]
    .reverse()
    .find((rule) => rule.customerCancel !== "불가")?.stage ?? "없음";
  const previewHasUnsavedChanges =
    editing &&
    (describePolicyChanges(policy, draftPolicy).length > 0 ||
      describeStageChanges(stageRules, draftStageRules).length > 0 ||
      describeReasonChanges(reasons, draftReasons).length > 0);
  const stageProcessingRoute = (rule: StageCancelRule) => {
    if (rule.customerCancel === "가능" && rule.approval === "불필요")
      return "즉시 취소 확정";
    if (rule.customerCancel === "조건부")
      return rule.approval === "필요" ? "운영 관리자 승인" : "조건 확인 후 확정";
    if (rule.adminCancel !== "불가") return "운영 관리자 승인";
    return draftPolicy.postShipmentAction;
  };
  const editingReasonDraft = reasonEditId
    ? (editing ? draftReasons : reasons).find((r) => r.id === reasonEditId)
    : null;

  return (
    <div className={`${shared.page} ${styles.pageRoot}`}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <div className={shared.title}>취소 정책</div>
            <div className={shared.subtitle}>
              주문 취소 가능 조건과 취소 처리 규칙을 설정합니다.
            </div>
          </div>
          <div className={styles.headMeta}>
            {!editing && (
              <span className={styles.headMetaText}>
                최종 수정 {lastModified.at} · {lastModified.by}
              </span>
            )}
            <CommonButton type="button" variant="secondary" size="md" onClick={() => setShowHistory(true)}>변경 이력</CommonButton>
            {!editing ? (
              <CommonButton type="button" variant="emphasis" size="md" onClick={startEdit}>수정</CommonButton>
            ) : (
              <>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>취소</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={requestSave}>저장</CommonButton>
              </>
            )}
          </div>
        </div>

        <div className={shared.quickFilters}>
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <CommonButton
                key={key}
                type="button"
                variant={active ? "primary-light" : "secondary"}
                size="md"
                className={`${shared.qfBtn} ${active ? shared.quickActive : ""}`}
                onClick={() => setTab(key)}
              >
                <span className={shared.qfLabel}>{label}</span>
              </CommonButton>
            );
          })}
        </div>
      </header>

      <div className={styles.body}>
        {tab !== "basic" && tab !== "stage" && tab !== "preview" && warnings.length > 0 && (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>!</span>
            <div className={styles.warningBody}>
              <div className={styles.warningTitle}>
                설정 확인 필요 · {warnings.length}건
              </div>
              <div className={styles.warningList}>
                {warnings.map((w) => (
                  <div key={w.id} className={styles.warningItem}>
                    {w.message}
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className={styles.warningActionBtn}
              onClick={() => setTab("stage")}
            >
              단계별 취소에서 확인
            </button>
          </div>
        )}

        {tab === "basic" && (
          <>
            <div className={styles.policyLayout}>
              <div className={styles.policyMain}>
                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>1</span>
                      <span className={styles.sectionHeadTitle}>
                        취소 요청 주체
                      </span>
                      <CommonBadge type="success-light" size="sm">
                        접수 가능
                      </CommonBadge>
                    </div>
                    <p className={styles.sectionDescText}>
                      취소를 직접 요청할 수 있는 주체와, 접수한 요청을 되돌릴 수
                      있는 범위를 정합니다.
                    </p>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.actorOptions}>
                      <CommonButton
                        type="button"
                        variant="option"
                        size="md"
                        selected={draftPolicy.customerCancelEnabled}
                        description="앱·웹에서 고객이 스스로 요청"
                        disabled={!editing}
                        onClick={() =>
                          set(
                            "customerCancelEnabled",
                            !draftPolicy.customerCancelEnabled,
                          )
                        }
                      >
                        고객 직접 취소
                      </CommonButton>
                      <CommonButton
                        type="button"
                        variant="option"
                        size="md"
                        selected={draftPolicy.adminCancelEnabled}
                        description="백오피스에서 운영자가 처리"
                        disabled={!editing}
                        onClick={() =>
                          set(
                            "adminCancelEnabled",
                            !draftPolicy.adminCancelEnabled,
                          )
                        }
                      >
                        관리자 취소
                      </CommonButton>
                    </div>
                    <div className={styles.sectionDividerTop}>
                      <div className={styles.fieldBlockLabel}>
                        취소 요청 철회
                      </div>
                      <div className={styles.compactPills}>
                        {(
                          [
                            "허용",
                            "처리 시작 전까지만 허용",
                            "불가",
                          ] as WithdrawPolicy[]
                        ).map((value) => (
                          <CommonButton
                            key={value}
                            type="button"
                            variant={
                              draftPolicy.withdrawPolicy === value
                                ? "emphasis"
                                : "secondary"
                            }
                            size="md"
                            disabled={!editing}
                            onClick={() => set("withdrawPolicy", value)}
                          >
                            {value}
                          </CommonButton>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>2</span>
                      <span className={styles.sectionHeadTitle}>
                        취소 가능 시점
                      </span>
                    </div>
                    <p className={styles.sectionDescText}>
                      주문 진행 단계에 따라 일반 취소를 언제까지 받을지
                      정합니다.
                    </p>
                    <div className={styles.sectionNote}>
                      이미 물류가 진행된 주문은 상태를 되돌리지 않고 반품·회수 →
                      환불로 넘기는 것을 권장합니다.
                    </div>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.timingOptions}>
                      {(
                        [
                          ["출고 전", "출고 처리 이전까지 허용"],
                          ["주문 처리 시작 전", "확정까지만 허용"],
                          ["단계별 설정", "단계를 직접 체크"],
                        ] as [CancelTimingBase, string][]
                      ).map(([value, description]) => (
                        <CommonButton
                          key={value}
                          type="button"
                          variant="option"
                          size="md"
                          selected={draftPolicy.defaultTimingBase === value}
                          description={description}
                          disabled={!editing}
                          onClick={() => set("defaultTimingBase", value)}
                        >
                          {value}
                        </CommonButton>
                      ))}
                    </div>
                    <div className={styles.sectionDividerTop}>
                      <div className={styles.inlineLabel}>
                        <span className={styles.fieldBlockLabel}>
                          단계별 취소 허용
                        </span>
                        <span className={styles.fieldHint}>
                          체크한 단계까지 일반 취소를 받습니다.
                        </span>
                      </div>
                      <div className={styles.basicStageRow}>
                        {CANCEL_QUICK_STAGES.map((stage) => {
                          const selected =
                            draftPolicy.cancelAllowedStages.includes(stage);
                          return (
                            <CommonButton
                              key={stage}
                              type="button"
                              variant={selected ? "primary-light" : "secondary"}
                              size="md"
                              selected={selected}
                              disabled={!editing}
                              onClick={() => toggleCancelStage(stage)}
                            >
                              <span className={styles.stageButtonContent}>
                                <span className={styles.stageMark}>
                                  {selected ? "✓" : ""}
                                </span>
                                {stage === "출고완료" ? "출고 완료" : stage}
                              </span>
                            </CommonButton>
                          );
                        })}
                      </div>
                    </div>
                    <div className={styles.sectionDividerTop}>
                      <div className={styles.timingBottomRow}>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldBlockLabel}>
                            출고 후 취소 요청
                          </div>
                          <div className={styles.compactPills}>
                            {(
                              [
                                "반품 / 회수 절차로 전환",
                                "관리자 확인",
                                "요청 차단",
                              ] as PostShipmentAction[]
                            ).map((value) => (
                              <CommonButton
                                key={value}
                                type="button"
                                variant={
                                  draftPolicy.postShipmentAction === value
                                    ? "emphasis"
                                    : "secondary"
                                }
                                size="md"
                                disabled={!editing}
                                onClick={() => set("postShipmentAction", value)}
                              >
                                {value}
                              </CommonButton>
                            ))}
                          </div>
                        </div>
                        <div className={styles.fieldGroup}>
                          <div className={styles.fieldBlockLabel}>
                            부분 취소
                          </div>
                          <CommonSwitch
                            size="md"
                            checked={draftPolicy.itemLevelPartialEnabled}
                            label="품목 단위 취소 허용"
                            disabled={!editing}
                            onChange={(checked) => {
                              set("itemLevelPartialEnabled", checked);
                              set("partialCancelEnabled", checked);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>3</span>
                      <span className={styles.sectionHeadTitle}>비용 부담</span>
                    </div>
                    <p className={styles.sectionDescText}>
                      사유 유형별 배송비·수수료를 누가 부담할지 정합니다.
                      무료배송 주문이 취소로 최소금액 미달이 되는 경우도 함께
                      처리합니다.
                    </p>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.costTable}>
                      <div className={`${styles.costRow} ${styles.costHead}`}>
                        <span>취소 사유</span>
                        <span>고객 부담</span>
                        <span>판매자 부담</span>
                      </div>
                      {(
                        [
                          ["고객 변심", "customerChangeBurden"],
                          ["상품 품절", "outOfStockBurden"],
                          ["배송 지연", "deliveryDelayBurden"],
                        ] as [
                          string,
                          (
                            | "customerChangeBurden"
                            | "outOfStockBurden"
                            | "deliveryDelayBurden"
                          ),
                        ][]
                      ).map(([label, key]) => (
                        <div className={styles.costRow} key={key}>
                          <strong>{label}</strong>
                          <CommonRadio
                            value="고객"
                            checked={draftPolicy[key] === "고객"}
                            disabled={!editing}
                            aria-label={`${label} 고객 부담`}
                            onChange={(value) => set(key, value as CostBearer)}
                          />
                          <CommonRadio
                            value="판매자"
                            checked={draftPolicy[key] === "판매자"}
                            disabled={!editing}
                            aria-label={`${label} 판매자 부담`}
                            onChange={(value) => set(key, value as CostBearer)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className={styles.costBottomRow}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>
                          부분 취소로 무료배송 조건 미달 시
                        </div>
                        <div className={styles.compactPills}>
                          <CommonButton
                            type="button"
                            variant={
                              draftPolicy.rechargeShippingOnFreeThresholdMiss
                                ? "emphasis"
                                : "secondary"
                            }
                            size="md"
                            disabled={!editing}
                            onClick={() =>
                              set("rechargeShippingOnFreeThresholdMiss", true)
                            }
                          >
                            배송비 재부과
                          </CommonButton>
                          <CommonButton
                            type="button"
                            variant={
                              !draftPolicy.rechargeShippingOnFreeThresholdMiss
                                ? "emphasis"
                                : "secondary"
                            }
                            size="md"
                            disabled={!editing}
                            onClick={() =>
                              set("rechargeShippingOnFreeThresholdMiss", false)
                            }
                          >
                            재부과 없음
                          </CommonButton>
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>
                          기본 배송비
                        </div>
                        <CommonInput.Number
                          clearable={false}
                          className={styles.moneyControl}
                          min={0}
                          suffix="원"
                          value={draftPolicy.baseShippingFee}
                          disabled={!editing}
                          aria-label="기본 배송비"
                          onChange={(event) =>
                            set(
                              "baseShippingFee",
                              Math.max(0, Number(event.target.value) || 0),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className={styles.policySection}>
                  <div className={styles.sectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>4</span>
                      <span className={styles.sectionHeadTitle}>
                        후속 처리 · 적용
                      </span>
                    </div>
                    <p className={styles.sectionDescText}>
                      취소 확정 후 자동으로 처리할 항목과, 관리자 승인·발효일
                      기준입니다.
                    </p>
                  </div>
                  <div className={styles.sectionControls}>
                    <div className={styles.switchRow}>
                      <CommonSwitch
                        size="md"
                        checked={draftPolicy.restockOnCancel}
                        label="재고 자동 복원"
                        disabled={!editing}
                        onChange={(checked) => set("restockOnCancel", checked)}
                      />
                      <CommonSwitch
                        size="md"
                        checked={draftPolicy.autoRefundRequest}
                        label="환불 자동 요청"
                        disabled={!editing}
                        onChange={(checked) =>
                          set("autoRefundRequest", checked)
                        }
                      />
                      <CommonSwitch
                        size="md"
                        checked={draftPolicy.restoreBenefitsOnCancel}
                        label="사용 포인트 · 쿠폰 복원"
                        disabled={!editing}
                        onChange={(checked) =>
                          set("restoreBenefitsOnCancel", checked)
                        }
                      />
                      <CommonSwitch
                        size="md"
                        checked={draftPolicy.notifyOnCancelEvents}
                        label="고객 알림 발송"
                        disabled={!editing}
                        onChange={(checked) =>
                          set("notifyOnCancelEvents", checked)
                        }
                      />
                    </div>
                    <div
                      className={`${styles.applyRow} ${styles.sectionDividerTop}`}
                    >
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>
                          관리자 승인
                        </div>
                        <div className={styles.compactPills}>
                          {(
                            [
                              "자동 승인",
                              "관리자 승인 필요",
                            ] as AdminApprovalMode[]
                          ).map((value) => (
                            <CommonButton
                              key={value}
                              type="button"
                              variant={
                                draftPolicy.adminApprovalMode === value
                                  ? "emphasis"
                                  : "secondary"
                              }
                              size="md"
                              disabled={!editing}
                              onClick={() => set("adminApprovalMode", value)}
                            >
                              {value}
                            </CommonButton>
                          ))}
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>
                          자동 취소 처리 대기
                        </div>
                        <CommonInput.Number
                          clearable={false}
                          className={styles.shortControl}
                          min={0}
                          suffix="시간"
                          value={draftPolicy.autoCancelWaitHours}
                          disabled={!editing}
                          aria-label="자동 취소 처리 대기"
                          onChange={(event) =>
                            set(
                              "autoCancelWaitHours",
                              Math.max(0, Number(event.target.value) || 0),
                            )
                          }
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>
                          적용 시작일
                        </div>
                        <div className={styles.dateRow}>
                          <CommonDatePicker
                            size="md"
                            clearable={false}
                            className={styles.dateControl}
                            value={draftPolicy.effectiveFrom}
                            disabled={!editing}
                            aria-label="적용 시작일"
                            onChange={(value) => {
                              if (!Array.isArray(value) && value)
                                set("effectiveFrom", value);
                            }}
                          />
                          <span className={styles.fieldHint}>
                            이 날짜 이후 신규 요청부터
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <aside className={styles.policySideOuter}>
                <div className={styles.sideCard}>
                  <div className={styles.sideHead}>
                    <div className={styles.sideTitle}>취소 판정 미리보기</div>
                    <div className={styles.sideSubtitle}>
                      현재 설정으로 요청 가능 여부와 정산을 계산합니다
                    </div>
                  </div>
                  <div className={styles.previewInputs}>
                    <div className={styles.previewInputRow}>
                      <span>주문 단계</span>
                      <div className={styles.segmented}>
                        {CANCEL_QUICK_STAGES.map((stage) => (
                          <button
                            key={stage}
                            type="button"
                            className={
                              basicPreviewStage === stage
                                ? styles.segmentActive
                                : ""
                            }
                            onClick={() => setBasicPreviewStage(stage)}
                          >
                            {stage === "출고완료" ? "출고 완료" : stage}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={styles.previewInputRow}>
                      <span>취소 사유</span>
                      <div className={styles.segmented}>
                        {(["고객 변심", "상품 품절", "배송 지연"] as const).map(
                          (item) => (
                            <button
                              key={item}
                              type="button"
                              className={
                                basicPreviewReason === item
                                  ? styles.segmentActive
                                  : ""
                              }
                              onClick={() => setBasicPreviewReason(item)}
                            >
                              {item}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                    <div className={styles.previewInputRow}>
                      <span>주문금액</span>
                      <CommonInput.Number
                        clearable={false}
                        className={styles.previewAmount}
                        min={0}
                        suffix="원"
                        value={basicPreviewAmount}
                        onChange={(event) =>
                          setBasicPreviewAmount(
                            Math.max(0, Number(event.target.value) || 0),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.calcRows}>
                    <div>
                      <span>처리 단계 취소 허용</span>
                      <strong
                        className={
                          basicPreviewAllowed ? styles.textBlue : styles.textRed
                        }
                      >
                        {basicPreviewAllowed ? "가능" : "불가"}
                      </strong>
                    </div>
                    <div>
                      <span>주문금액</span>
                      <strong>{basicPreviewAmount.toLocaleString()}원</strong>
                    </div>
                    <div>
                      <span>배송비 부담 ({basicPreviewReason})</span>
                      <strong>{basicPreviewBearer}</strong>
                    </div>
                    <div>
                      <span>고객 부담 차감 없음</span>
                      <strong>
                        {basicPreviewDeduction.toLocaleString()}원
                      </strong>
                    </div>
                  </div>
                  <div
                    className={`${styles.resultBand} ${basicPreviewAllowed ? styles.resultBandOk : styles.resultBandNo}`}
                  >
                    <span>취소 요청 결과</span>
                    <strong>
                      {basicPreviewAllowed ? "요청 가능" : "요청 불가"}
                    </strong>
                  </div>
                  <div className={styles.routeBlock}>
                    <div className={styles.sideMutedTitle}>
                      이 요청의 처리 경로
                    </div>
                    <div>
                      <span>처리 경로</span>
                      <strong>
                        {basicPreviewAllowed
                          ? draftPolicy.adminApprovalMode
                          : draftPolicy.postShipmentAction}
                      </strong>
                    </div>
                    <div>
                      <span>후속 자동 처리</span>
                      <strong>
                        {[
                          draftPolicy.restockOnCancel && "재고",
                          draftPolicy.autoRefundRequest && "환불",
                          draftPolicy.restoreBenefitsOnCancel && "쿠폰·포인트",
                        ]
                          .filter(Boolean)
                          .join(" · ") || "없음"}
                      </strong>
                    </div>
                    <div>
                      <span>고객 부담 비용</span>
                      <strong className={styles.textBlue}>
                        {basicPreviewDeduction
                          ? `${basicPreviewDeduction.toLocaleString()}원`
                          : "없음"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className={styles.sideCard}>
                  <div className={styles.sideHead}>
                    <div className={styles.sideTitle}>현재 정책 요약</div>
                  </div>
                  <div className={styles.digestRow}>
                    <span>요청 주체</span>
                    <strong>
                      {[
                        draftPolicy.customerCancelEnabled && "고객",
                        draftPolicy.adminCancelEnabled && "관리자",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "없음"}
                    </strong>
                  </div>
                  <div className={styles.digestRow}>
                    <span>취소 가능 시점</span>
                    <strong>
                      {draftPolicy.defaultTimingBase === "단계별 설정"
                        ? `단계별 · ${draftPolicy.cancelAllowedStages[draftPolicy.cancelAllowedStages.length - 1] ?? "없음"}까지`
                        : draftPolicy.defaultTimingBase}
                    </strong>
                  </div>
                  <div className={styles.digestRow}>
                    <span>부분 취소</span>
                    <strong>
                      {draftPolicy.itemLevelPartialEnabled
                        ? "품목 단위 허용"
                        : "허용 안 함"}
                    </strong>
                  </div>
                  <div className={styles.digestRow}>
                    <span>요청 철회</span>
                    <strong>{draftPolicy.withdrawPolicy}</strong>
                  </div>
                  <div className={styles.digestRow}>
                    <span>출고 이후</span>
                    <strong>{draftPolicy.postShipmentAction}</strong>
                  </div>
                  <div className={styles.digestRow}>
                    <span>배송비 부담</span>
                    <strong>
                      고객 변심 {draftPolicy.customerChangeBurden} · 상품 품절{" "}
                      {draftPolicy.outOfStockBurden} · 배송 지연{" "}
                      {draftPolicy.deliveryDelayBurden}
                    </strong>
                  </div>
                  <div className={styles.digestRow}>
                    <span>무료배송 미달</span>
                    <strong>
                      {draftPolicy.rechargeShippingOnFreeThresholdMiss
                        ? `배송비 재부과 (${draftPolicy.baseShippingFee.toLocaleString()}원)`
                        : "재부과 없음"}
                    </strong>
                  </div>
                  <div className={styles.digestRow}>
                    <span>관리자 승인</span>
                    <strong>{draftPolicy.adminApprovalMode}</strong>
                  </div>
                  <div className={styles.digestRow}>
                    <span>적용 시작</span>
                    <strong>{draftPolicy.effectiveFrom}</strong>
                  </div>
                  <div className={styles.sideFootNote}>
                    환불 금액 산정과 지급 수단은 환불 정책에서, 취소 사유 항목은
                    사유 관리에서 설정합니다.
                  </div>
                </div>
              </aside>
            </div>
            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>
                  저장하면 적용 시작일 이후 신규 취소 요청부터 반영됩니다.
                </span>
                <CommonButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={cancelEdit}
                >
                  취소
                </CommonButton>
                <CommonButton
                  type="button"
                  variant="emphasis"
                  size="md"
                  onClick={requestSave}
                >
                  저장
                </CommonButton>
              </div>
            )}
          </>
        )}
        {tab === "stage" && (
          <>
            <div className={styles.stagePolicyLayout}>
              <div className={styles.stagePolicyMain}>
                <section className={styles.stagePolicySection}>
                  <div className={styles.stageSectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>1</span>
                      <span className={styles.sectionHeadTitle}>Lifecycle 매트릭스</span>
                      <CommonBadge type="secondary" size="sm">9단계 · 조건부 {conditionalStageCount}</CommonBadge>
                    </div>
                    <p className={styles.sectionDescText}>단계별로 고객·관리자 취소 가능 여부와 승인 필요 여부를 정합니다. 처음부터 가능 → 조건부 → 불가 순으로 바뀝니다.</p>
                    <div className={styles.stageLegend}>
                      <div><span className={`${styles.availTag} ${styles.availOk}`}>가능</span><span>즉시 접수</span></div>
                      <div><span className={`${styles.availTag} ${styles.availCond}`}>조건부</span><span>승인·조건 충족 시</span></div>
                      <div><span className={`${styles.availTag} ${styles.availNo}`}>불가</span><span>요청 차단</span></div>
                    </div>
                  </div>
                  <div className={styles.stageMatrixWrap}>
                    <div className={styles.stageMatrix}>
                      <div className={`${styles.stageMatrixRow} ${styles.stageMatrixHead}`}>
                        <span>주문 단계</span><span>고객</span><span>관리자</span><span>승인</span>
                      </div>
                      {activeStageRules.map((rule) => (
                        <div key={rule.stage} className={`${styles.stageMatrixRow} ${POST_SHIPMENT_STAGES.has(rule.stage) ? styles.stageMatrixPost : ""}`}>
                          <span className={styles.stageMatrixName}><i className={POST_SHIPMENT_STAGES.has(rule.stage) ? styles.stageDotPost : ""} />{rule.stage}</span>
                          {editing ? (
                            <CommonSelect className={styles.stageSelect} size="sm" options={(["가능", "조건부", "불가"] as CancelAvailability[]).map((value) => ({ label: value, value }))} value={rule.customerCancel} aria-label={`${rule.stage} 고객 취소`} onChange={(value) => setStage(rule.stage, { customerCancel: String(value) as CancelAvailability })} />
                          ) : <span className={`${styles.availTag} ${availClass(rule.customerCancel)}`}>{rule.customerCancel}</span>}
                          {editing ? (
                            <CommonSelect className={styles.stageSelect} size="sm" options={(["가능", "조건부", "불가"] as CancelAvailability[]).map((value) => ({ label: value, value }))} value={rule.adminCancel} aria-label={`${rule.stage} 관리자 취소`} onChange={(value) => setStage(rule.stage, { adminCancel: String(value) as CancelAvailability })} />
                          ) : <span className={`${styles.availTag} ${availClass(rule.adminCancel)}`}>{rule.adminCancel}</span>}
                          {editing ? (
                            <CommonSelect className={styles.stageSelect} size="sm" options={(["불필요", "조건부", "필요"] as ApprovalNeed[]).map((value) => ({ label: value, value }))} value={rule.approval} aria-label={`${rule.stage} 승인`} onChange={(value) => setStage(rule.stage, { approval: String(value) as ApprovalNeed })} />
                          ) : <span className={styles.approvalText}>{rule.approval}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className={styles.stagePolicySection}>
                  <div className={styles.stageSectionDesc}>
                    <div className={styles.sectionHead}>
                      <span className={styles.sectionNum}>2</span>
                      <span className={styles.sectionHeadTitle}>조건부 처리 규칙</span>
                    </div>
                    <p className={styles.sectionDescText}>‘조건부’로 지정한 단계에서 요청이 들어왔을 때 누가 판단하고, 얼마 안에 처리해야 하는지 정합니다.</p>
                  </div>
                  <div className={styles.conditionControls}>
                    <div className={styles.conditionTopRow}>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>판단 주체</div>
                        <div className={styles.compactPills}>
                          {(["운영 관리자", "CS 담당", "자동 판정"] as ConditionalReviewOwner[]).map((value) => (
                            <CommonButton key={value} type="button" variant={draftPolicy.conditionalReviewOwner === value ? "emphasis" : "secondary"} size="md" disabled={!editing} onClick={() => set("conditionalReviewOwner", value)}>{value}</CommonButton>
                          ))}
                        </div>
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>판단 제한 시간</div>
                        <CommonInput.Number clearable={false} className={styles.shortControl} min={1} suffix="시간" value={draftPolicy.conditionalReviewHours} disabled={!editing} aria-label="판단 제한 시간" onChange={(event) => set("conditionalReviewHours", Math.max(1, Number(event.target.value) || 1))} />
                      </div>
                      <div className={styles.fieldGroup}>
                        <div className={styles.fieldBlockLabel}>제한 시간 초과 시</div>
                        <div className={styles.compactPills}>
                          {(["자동 승인", "자동 반려"] as ConditionalTimeoutAction[]).map((value) => (
                            <CommonButton key={value} type="button" variant={draftPolicy.conditionalTimeoutAction === value ? "emphasis" : "secondary"} size="md" disabled={!editing} onClick={() => set("conditionalTimeoutAction", value)}>{value}</CommonButton>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`${styles.switchRow} ${styles.sectionDividerTop}`}>
                      <CommonSwitch size="md" checked={draftPolicy.conditionalStockCheck} label="재고 반영 여부 확인" disabled={!editing} onChange={(checked) => set("conditionalStockCheck", checked)} />
                      <CommonSwitch size="md" checked={draftPolicy.conditionalCsAlert} label="CS 채널 알림" disabled={!editing} onChange={(checked) => set("conditionalCsAlert", checked)} />
                      <CommonSwitch size="md" checked={draftPolicy.conditionalEvidenceRequired} label="판단 근거 기록 필수" disabled={!editing} onChange={(checked) => set("conditionalEvidenceRequired", checked)} />
                    </div>
                  </div>
                </section>
              </div>

              <aside className={styles.policySideOuter}>
                <div className={styles.sideCard}>
                  <div className={styles.sideHead}><div className={styles.sideTitle}>단계 흐름 미리보기</div><div className={styles.sideSubtitle}>매트릭스 설정이 흐름 위에 그대로 반영됩니다</div></div>
                  <div className={styles.stagePreviewActor}>
                    <span>기준 주체</span>
                    <div className={styles.segmented}>
                      {(["고객", "관리자"] as const).map((actor) => <button key={actor} type="button" className={stagePreviewActor === actor ? styles.segmentActive : ""} onClick={() => setStagePreviewActor(actor)}>{actor}</button>)}
                    </div>
                  </div>
                  <div className={styles.stageFlow}>
                    {activeStageRules.map((rule) => {
                      const availability = stagePreviewActor === "고객" ? rule.customerCancel : rule.adminCancel;
                      return (
                        <div key={rule.stage} className={styles.stageFlowRow}>
                          <span className={`${styles.stageFlowDot} ${availability === "가능" ? styles.flowDotOk : availability === "조건부" ? styles.flowDotCond : styles.flowDotNo}`} />
                          <span>{rule.stage}</span>
                          <span className={`${styles.availTag} ${availClass(availability)}`}>{availability}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.stageResultBand}><span>고객 취소 마지막 단계</span><strong>{lastCustomerCancelStage}</strong></div>
                  <div className={styles.stageFlowSummary}>
                    <div className={styles.sideMutedTitle}>이 설정의 판정 요약</div>
                    <div><span>고객 취소 가능 단계</span><strong>{customerAvailableCount} / {activeStageRules.length}</strong></div>
                    <div><span>관리자 취소 가능 단계</span><strong>{adminAvailableCount} / {activeStageRules.length}</strong></div>
                    <div><span>조건부 단계</span><strong className={styles.textGold}>{conditionalStageCount}개</strong></div>
                    <div><span>승인 필요 단계</span><strong>{approvalRequiredCount}개</strong></div>
                  </div>
                </div>

                <div className={styles.sideCard}>
                  <div className={styles.sideHead}><div className={styles.sideTitle}>조건부 규칙 요약</div></div>
                  <div className={styles.digestRow}><span>판단 주체</span><strong>{draftPolicy.conditionalReviewOwner}</strong></div>
                  <div className={styles.digestRow}><span>판단 제한 시간</span><strong>{draftPolicy.conditionalReviewHours}시간</strong></div>
                  <div className={styles.digestRow}><span>초과 시</span><strong>{draftPolicy.conditionalTimeoutAction}</strong></div>
                  <div className={styles.digestRow}><span>재고 확인</span><strong>{draftPolicy.conditionalStockCheck ? "필요" : "불필요"}</strong></div>
                  <div className={styles.digestRow}><span>판단 근거 기록</span><strong>{draftPolicy.conditionalEvidenceRequired ? "필수" : "선택"}</strong></div>
                  <div className={styles.digestRow}><span>출고 이후 요청</span><strong>{draftPolicy.postShipmentAction}</strong></div>
                  <div className={styles.sideFootNote}>출고 이후 단계의 요청은 {draftPolicy.postShipmentAction}되며, 기본 취소 조건은 기본 설정 탭에서 관리합니다.</div>
                </div>
              </aside>
            </div>
            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 신규 취소 요청부터 적용되며, 이미 접수된 요청에는 영향을 주지 않습니다.</span>
                <CommonButton type="button" variant="secondary" size="md" onClick={cancelEdit}>취소</CommonButton>
                <CommonButton type="button" variant="emphasis" size="md" onClick={requestSave}>저장</CommonButton>
              </div>
            )}
          </>
        )}
        {tab === "partial" && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>부분 취소</div>
                <div className={styles.cardDesc}>
                  주문을 상품·수량 단위로 나눠 취소할 수 있는지 정합니다.
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.switch} ${draftPolicy.partialCancelEnabled ? styles.switchOn : ""}`}
                    onClick={() =>
                      set(
                        "partialCancelEnabled",
                        !draftPolicy.partialCancelEnabled,
                      )
                    }
                  >
                    <i />
                  </button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>부분 취소 허용</div>
                  </div>
                </div>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.switch} ${draftPolicy.fullCancelEnabled ? styles.switchOn : ""}`}
                    onClick={() =>
                      set("fullCancelEnabled", !draftPolicy.fullCancelEnabled)
                    }
                  >
                    <i />
                  </button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>
                      전체 주문 취소 허용
                    </div>
                  </div>
                </div>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.switch} ${draftPolicy.itemLevelPartialEnabled ? styles.switchOn : ""}`}
                    onClick={() =>
                      set(
                        "itemLevelPartialEnabled",
                        !draftPolicy.itemLevelPartialEnabled,
                      )
                    }
                  >
                    <i />
                  </button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>
                      상품 단위 취소 사용
                    </div>
                    <div className={styles.toggleRowDesc}>
                      부분 취소를 상품 단위까지 허용합니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>
              수량 단위 부분취소, MOQ·주문단위 검증은 프로젝트 확장 설정으로
              제공됩니다.
            </div>
          </>
        )}

        {tab === "reasons" && (
          <>
            <div className={styles.infoNote}>
              고객 노출용 사유와 관리자 전용 사유를 분리해서 관리합니다.
              '기타'처럼 자유 서술이 필요한 사유는 상세 입력 필수로 설정하세요.
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>고객 취소 사유</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.reasonList}>
                  <div className={`${styles.reasonRow} ${styles.reasonHead}`}>
                    <span />
                    <span>사유명</span>
                    <span>노출</span>
                    <span />
                    <span />
                  </div>
                  {customerReasons.map((r) => (
                    <div key={r.id} className={styles.reasonRow}>
                      <span className={styles.dragHandle}>☰</span>
                      <span>
                        {r.label}
                        {r.requiresDetail && (
                          <span className={styles.detailTag}>상세필수</span>
                        )}
                      </span>
                      <span style={{ color: r.active ? "#059669" : "#a1a1aa" }}>
                        {r.active ? "노출" : "비노출"}
                      </span>
                      <span style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => moveReason(r, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => moveReason(r, 1)}
                        >
                          ↓
                        </button>
                      </span>
                      <span style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => {
                            if (!editing) {
                              setDraftPolicy(policy);
                              setDraftStageRules(stageRules);
                              setDraftReasons(reasons);
                            }
                            setReasonEditId(r.id);
                          }}
                        >
                          {editing ? "수정" : "상세/수정"}
                        </button>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => removeReason(r.id)}
                        >
                          삭제
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => addReason("고객")}
                >
                  + 고객 사유 추가
                </button>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>관리자 취소 사유</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.reasonList}>
                  <div className={`${styles.reasonRow} ${styles.reasonHead}`}>
                    <span />
                    <span>사유명</span>
                    <span>노출</span>
                    <span />
                    <span />
                  </div>
                  {adminReasons.map((r) => (
                    <div key={r.id} className={styles.reasonRow}>
                      <span className={styles.dragHandle}>☰</span>
                      <span>
                        {r.label}
                        {r.requiresDetail && (
                          <span className={styles.detailTag}>상세필수</span>
                        )}
                      </span>
                      <span style={{ color: r.active ? "#059669" : "#a1a1aa" }}>
                        {r.active ? "노출" : "비노출"}
                      </span>
                      <span style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => moveReason(r, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => moveReason(r, 1)}
                        >
                          ↓
                        </button>
                      </span>
                      <span style={{ display: "flex", gap: 4 }}>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => {
                            if (!editing) {
                              setDraftPolicy(policy);
                              setDraftStageRules(stageRules);
                              setDraftReasons(reasons);
                            }
                            setReasonEditId(r.id);
                          }}
                        >
                          {editing ? "수정" : "상세/수정"}
                        </button>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => removeReason(r.id)}
                        >
                          삭제
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => addReason("관리자")}
                >
                  + 관리자 사유 추가
                </button>
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>
                  저장하면 신규 취소 요청부터 적용되며, 이미 접수된 요청에는
                  영향을 주지 않습니다.
                </span>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={cancelEdit}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.darkBtn}
                  onClick={requestSave}
                >
                  저장
                </button>
              </div>
            )}
          </>
        )}

        {tab === "partial" && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>후속 처리</div>
                <div className={styles.cardDesc}>
                  취소 처리 후 주문 상태 전환, 재고 복원, 알림 여부를 정합니다.
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.switch} ${draftPolicy.autoCancelOrderWhenFullyCancelled ? styles.switchOn : ""}`}
                    onClick={() =>
                      set(
                        "autoCancelOrderWhenFullyCancelled",
                        !draftPolicy.autoCancelOrderWhenFullyCancelled,
                      )
                    }
                  >
                    <i />
                  </button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>
                      전량 취소 시 주문 자동 취소 전환
                    </div>
                    <div className={styles.toggleRowDesc}>
                      모든 상품의 유효 수량이 0이 되면 주문 상태를 자동으로
                      전환합니다.
                    </div>
                  </div>
                </div>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.switch} ${draftPolicy.restockOnCancel ? styles.switchOn : ""}`}
                    onClick={() =>
                      set("restockOnCancel", !draftPolicy.restockOnCancel)
                    }
                  >
                    <i />
                  </button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>
                      취소 시 재고 복원
                    </div>
                    <div className={styles.toggleRowDesc}>
                      출고되지 않은 수량만 가용 재고로 복원합니다.
                    </div>
                  </div>
                </div>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.switch} ${draftPolicy.notifyOnCancelEvents ? styles.switchOn : ""}`}
                    onClick={() =>
                      set(
                        "notifyOnCancelEvents",
                        !draftPolicy.notifyOnCancelEvents,
                      )
                    }
                  >
                    <i />
                  </button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>
                      취소 이벤트 알림
                    </div>
                    <div className={styles.toggleRowDesc}>
                      취소 접수·완료를 고객에게 안내합니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoNote}>
              결제 완료 주문의 환불 금액 계산은{" "}
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() => navigate("/policy/refund")}
              >
                환불 정책
              </button>
              에서 관리합니다. 배송비·할인 재계산, 쿠폰/포인트 복원, 정산 조정
              연계는 프로젝트 확장 설정으로 제공됩니다.
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>
                  저장하면 신규 취소 요청부터 적용되며, 이미 접수된 요청에는
                  영향을 주지 않습니다.
                </span>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={cancelEdit}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.darkBtn}
                  onClick={requestSave}
                >
                  저장
                </button>
              </div>
            )}
          </>
        )}

        {tab === "preview" && (
          <div className={styles.policyPreviewLayout}>
            <div className={styles.policyPreviewMain}>
              <section className={styles.previewDocumentCard}>
                <div className={styles.previewDocumentHead}>
                  <div>
                    <div className={styles.previewDocumentTitle}>적용될 정책 전문</div>
                    <div className={styles.previewDocumentDesc}>현재 설정이 실제 운영에 어떻게 적용되는지 문장으로 확인합니다. 이 탭은 읽기 전용입니다.</div>
                  </div>
                  <span className={previewHasUnsavedChanges ? styles.previewDraftBadge : styles.previewLiveBadge}>{previewHasUnsavedChanges ? "미저장 초안" : "적용 중"}</span>
                </div>
                <div className={styles.policySentenceList}>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>1</span>
                    <div><strong>취소 요청 주체</strong><p>{draftPolicy.customerCancelEnabled ? "고객은 앱·웹에서 직접" : "고객 직접 요청은 불가하며"}, {draftPolicy.adminCancelEnabled ? "운영자는 백오피스에서" : "운영자는"} 취소를 요청할 수 있습니다. 접수된 요청은 {draftPolicy.withdrawPolicy === "불가" ? "철회할 수 없습니다." : draftPolicy.withdrawPolicy + " 범위에서 철회할 수 있습니다."}</p></div>
                    <span className={styles.previewRowTag}>정상</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>2</span>
                    <div><strong>취소 가능 시점</strong><p>체크된 단계까지 일반 취소를 받습니다. 고객 기준 마지막 취소 가능 단계는 ‘{lastCustomerCancelStage}’이며, 출고 이후 요청은 {draftPolicy.postShipmentAction}됩니다.</p></div>
                    <span className={styles.previewRowTag}>단계별</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>3</span>
                    <div><strong>부분 취소</strong><p>{draftPolicy.itemLevelPartialEnabled ? "품목 단위 부분 취소를 허용합니다." : "부분 취소를 허용하지 않습니다."} 부분 취소로 무료배송 조건에 미달하면 {draftPolicy.rechargeShippingOnFreeThresholdMiss ? "배송비 " + draftPolicy.baseShippingFee.toLocaleString() + "원을 재부과합니다." : "배송비를 재부과하지 않습니다."}</p></div>
                    <span className={styles.previewRowTag}>{draftPolicy.itemLevelPartialEnabled ? "허용" : "불가"}</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>4</span>
                    <div><strong>비용 부담</strong><p>고객 변심은 {draftPolicy.customerChangeBurden} 부담, 상품 품절은 {draftPolicy.outOfStockBurden} 부담, 배송 지연은 {draftPolicy.deliveryDelayBurden} 부담으로 처리하며 고객 부담분은 환불금액에서 차감합니다.</p></div>
                    <span className={styles.previewRowTag}>정상</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>5</span>
                    <div><strong>조건부 단계 처리</strong><p>‘조건부’ 단계의 요청은 {draftPolicy.conditionalReviewOwner}가 {draftPolicy.conditionalReviewHours}시간 내 판단하고, 초과하면 {draftPolicy.conditionalTimeoutAction}됩니다.</p></div>
                    <span className={styles.previewRowTagWarn}>조건부</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>6</span>
                    <div><strong>결제 실패 · 재시도</strong><p>결제 실패 시 주문은 유지 상태가 되고, 5분 내 최대 3회까지 재시도할 수 있습니다. 한도를 넘기면 새 주문으로 안내합니다. 재고는 30분간 선점 유지됩니다.</p></div>
                    <span className={styles.previewRowTag}>재시도</span>
                  </div>
                  <div className={styles.policySentenceRow}>
                    <span className={styles.policySentenceNum}>7</span>
                    <div><strong>후속 처리</strong><p>취소 확정 시 {[draftPolicy.restockOnCancel && "재고 복원", draftPolicy.autoRefundRequest && "환불 요청", draftPolicy.restoreBenefitsOnCancel && "쿠폰·포인트 복원"].filter(Boolean).join(", ") || "자동 처리 없음"}이 실행되며, 승인 방식은 {draftPolicy.adminApprovalMode}입니다.</p></div>
                    <span className={styles.previewRowTag}>자동화</span>
                  </div>
                </div>
              </section>

              <section className={styles.previewDecisionCard}>
                <div className={styles.previewDecisionHead}>
                  <div className={styles.previewDocumentTitle}>단계별 판정 결과</div>
                  <div className={styles.previewDocumentDesc}>고객·관리자가 각 단계에서 실제로 보게 되는 결과입니다.</div>
                </div>
                <div className={styles.previewDecisionTable}>
                  <div className={styles.previewDecisionRow + " " + styles.previewDecisionTableHead}><span>주문 단계</span><span>고객</span><span>관리자</span><span>처리 경로</span></div>
                  {activeStageRules.map((rule) => (
                    <div key={rule.stage} className={styles.previewDecisionRow + " " + (POST_SHIPMENT_STAGES.has(rule.stage) ? styles.previewDecisionPost : "")}>
                      <strong>{rule.stage}</strong>
                      <span className={styles.availTag + " " + availClass(rule.customerCancel)}>{rule.customerCancel}</span>
                      <span className={styles.availTag + " " + availClass(rule.adminCancel)}>{rule.adminCancel}</span>
                      <span>{stageProcessingRoute(rule)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className={styles.policyPreviewSide}>
              <div className={styles.sideCard}>
                <div className={styles.sideHead}><div className={styles.sideTitle}>고객 안내 문구</div><div className={styles.sideSubtitle}>설정에 따라 자동 생성되는 안내입니다</div></div>
                <div className={styles.customerMessageList}>
                  <div><span>주문 상세 · 취소 버튼</span><p>{lastCustomerCancelStage} 단계까지 취소를 요청할 수 있습니다.</p></div>
                  <div><span>취소 요청 완료</span><p>취소가 즉시 확정되며, 환불은 환불 정책 기준으로 진행됩니다.</p></div>
                  <div><span>결제 실패 화면</span><p>5분 내 최대 3회까지 다시 시도할 수 있습니다.</p></div>
                </div>
                <div className={previewHasUnsavedChanges ? styles.previewDeployPending : styles.previewDeployReady}><span>배포 가능 여부</span><strong>{previewHasUnsavedChanges ? "저장 필요" : "배포 가능"}</strong></div>
              </div>

              <div className={styles.sideCard}>
                <div className={styles.sideHead}><div className={styles.sideTitle}>전체 설정 요약</div></div>
                <div className={styles.digestRow}><span>요청 주체</span><strong>{[draftPolicy.customerCancelEnabled && "고객", draftPolicy.adminCancelEnabled && "관리자"].filter(Boolean).join(" · ") || "없음"}</strong></div>
                <div className={styles.digestRow}><span>취소 가능 시점</span><strong>{draftPolicy.defaultTimingBase === "단계별 설정" ? "단계별 · " + lastCustomerCancelStage + "까지" : draftPolicy.defaultTimingBase}</strong></div>
                <div className={styles.digestRow}><span>부분 취소</span><strong>{draftPolicy.itemLevelPartialEnabled ? "품목 단위 허용" : "허용 안 함"}</strong></div>
                <div className={styles.digestRow}><span>요청 철회</span><strong>{draftPolicy.withdrawPolicy}</strong></div>
                <div className={styles.digestRow}><span>출고 이후</span><strong>{draftPolicy.postShipmentAction}</strong></div>
                <div className={styles.digestRow}><span>배송비 부담</span><strong>고객 변심 {draftPolicy.customerChangeBurden} · 상품 품절 {draftPolicy.outOfStockBurden} · 배송 지연 {draftPolicy.deliveryDelayBurden}</strong></div>
                <div className={styles.digestRow}><span>무료배송 미달</span><strong>{draftPolicy.rechargeShippingOnFreeThresholdMiss ? "배송비 재부과 (" + draftPolicy.baseShippingFee.toLocaleString() + "원)" : "재부과 없음"}</strong></div>
                <div className={styles.digestRow}><span>관리자 승인</span><strong>{draftPolicy.adminApprovalMode}</strong></div>
                <div className={styles.digestRow}><span>적용 시작</span><strong>{draftPolicy.effectiveFrom}</strong></div>
                <div className={styles.digestRow}><span>조건부 판단</span><strong>{draftPolicy.conditionalReviewOwner} · {draftPolicy.conditionalReviewHours}시간</strong></div>
                <div className={styles.digestRow}><span>결제 재시도</span><strong>3회 · 5분</strong></div>
                <div className={styles.digestRow}><span>상태 재조회</span><strong>5회</strong></div>
                <div className={styles.sideFootNote}>저장 시 이 문서가 변경 이력에 스냅샷으로 함께 기록됩니다.</div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {showHistory && (
        <aside ref={historyRef} className={timeline.aside} aria-label="취소 정책 변경 이력">
          <div className={timeline.head}>
            <div className={timeline.headRow}>
              <div className={timeline.headBody}>
                <div className={timeline.eyebrow}>거래 정책 · 취소 정책</div>
                <div className={timeline.titleRow}><span className={timeline.title}>변경 이력</span></div>
              </div>
              <CommonButton type="button" variant="ghost" size="sm" className={timeline.closeBtn} onClick={() => setShowHistory(false)}>×</CommonButton>
            </div>
          </div>
          <div className={timeline.scroll}>
            {history.length === 0 && <div className={timeline.emptyInline}>변경 이력이 없습니다.</div>}
            {history.map((entry) => (
              <div key={entry.id} className={timeline.timelineItem}>
                <span className={timeline.timelineDot} />
                <div className={timeline.timelineBody}>
                  <div className={timeline.timelineRow}>
                    <strong className={timeline.timelineTitle}>{entry.field}</strong>
                    <span className={timeline.timelineWhen}>{entry.at}</span>
                  </div>
                  <div className={timeline.timelineDetail}>{entry.before} → {entry.after}</div>
                  <div className={timeline.timelineDetail}>{entry.reason} · {entry.by}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {editingReasonDraft && (
        <CancelReasonEditDialog
          initial={editingReasonDraft}
          onClose={() => setReasonEditId(null)}
          onSave={saveReason}
        />
      )}

      {confirmSave && (
        <div
          className={shared.dialogOverlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmSave(null);
          }}
        >
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>취소 정책 변경 확인</h2>
            <p className={shared.dialogBody}>
              변경 사항은 신규 취소 요청부터 적용됩니다. 이미 접수된 취소 요청은
              요청 당시 정책 기준으로 처리됩니다.
            </p>
            <div className={styles.diffTable}>
              {confirmSave.map((d, i) => (
                <div key={i} className={styles.diffRow}>
                  <span className={styles.diffField}>{d.field}</span>
                  <span className={styles.diffBefore}>{d.before}</span>
                  <span className={styles.diffAfter}>{d.after}</span>
                </div>
              ))}
            </div>
            <label className={styles.formField}>
              <span>변경 사유 *</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 출고 Queue 제거 확인 절차 추가"
              />
            </label>
            {saveError && <div className={styles.formError}>{saveError}</div>}
            <div className={shared.dialogActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setConfirmSave(null)}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={commitSave}
              >
                변경 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
