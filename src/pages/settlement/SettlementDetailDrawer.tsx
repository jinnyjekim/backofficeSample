import styles from './SettlementDetailDrawer.module.css';
import { buildSettlementDetail } from './settlementDetail';
import type { Settlement } from './settlementData';

interface Props {
  settlement: Settlement;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showHoldPanel: boolean;
  onToggleHoldPanel: () => void;
  onConfirmSettle: () => void;
  onRequestPay: () => void;
  onRetryPay: () => void;
  onResume: () => void;
  onConfirmHold: () => void;
}

export function SettlementDetailDrawer({
  settlement,
  activeTab,
  onTabChange,
  onClose,
  showHoldPanel,
  onToggleHoldPanel,
  onConfirmSettle,
  onRequestPay,
  onRetryPay,
  onResume,
  onConfirmHold,
}: Props) {
  const d = buildSettlementDetail(settlement, activeTab, showHoldPanel, {
    close: onClose,
    setActiveTab: onTabChange,
    toggleHoldPanel: onToggleHoldPanel,
    confirmSettle: onConfirmSettle,
    requestPay: onRequestPay,
    retryPay: onRetryPay,
    resume: onResume,
    confirmHold: onConfirmHold,
  });

  return (
    <aside className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{d.no}</span>
              <span className={styles.badgePill} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
            </div>
            <div className={styles.subLine}>{d.target} · {d.period}</div>
            <div className={styles.amountLine}>{d.finalAmount}</div>
            <div className={styles.dueLine}>지급예정 {d.due}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.linkBtn}>대상 상세</button>
          <div className={styles.rowSpacer} />
          {d.canConfirm && (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={d.toggleHoldPanel}>정산 보류</button>
              <button type="button" className={styles.primaryBtn} onClick={d.confirmSettle}>정산 확정</button>
            </>
          )}
          {d.canPay && (
            <button type="button" className={styles.primaryBtn} onClick={d.requestPay}>지급 요청</button>
          )}
          {d.canRetry && (
            <button type="button" className={styles.primaryBtn} onClick={d.retryPay}>지급 재시도</button>
          )}
          {d.canResume && (
            <button type="button" className={styles.primaryBtn} onClick={d.resume}>보류 해제</button>
          )}
        </div>

        {d.showHoldPanel && (
          <div className={styles.holdPanel}>
            <div className={styles.holdPanelTitle}>정산 보류</div>
            <select className={styles.holdSelect} defaultValue="거래 데이터 확인 필요">
              <option>거래 데이터 확인 필요</option>
              <option>정산금액 불일치</option>
              <option>지급계좌 확인 필요</option>
              <option>대상 상태 확인 필요</option>
              <option>기타</option>
            </select>
            <div className={styles.holdActions}>
              <button type="button" className={styles.cancelBtn} onClick={d.toggleHoldPanel}>취소</button>
              <button type="button" className={styles.confirmDarkBtn} onClick={d.confirmHold}>보류</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {d.tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={styles.tabBtn}
              style={{ fontWeight: t.weight, color: t.fg, boxShadow: t.mark }}
              onClick={t.pick}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {d.activeTab === 'summary' && (
          <div>
            <div className={styles.sectionLabel}>정산 요약</div>
            <div className={styles.fieldsBox}>
              {d.summaryFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>지급 정보</div>
            <div className={styles.fieldsBox}>
              {d.payFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.activeTab === 'tx' && (
          <div>
            <div className={styles.sectionLabel}>정산 거래 내역</div>
            {d.tx.map((t) => (
              <div className={styles.txCard} key={t.orderId}>
                <div>
                  <button type="button" className={styles.txOrderLink}>{t.orderId}</button>
                  <div className={styles.txMeta}>{t.date} · 거래액 {t.amount}</div>
                </div>
                <div className={styles.txRight}>
                  <div className={styles.txReflected}>{t.reflected}</div>
                  <div className={styles.txStatus} style={{ color: t.fg }}>{t.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {d.activeTab === 'adjust' && (
          <div>
            <div className={styles.sectionLabel}>조정 내역</div>
            {d.hasAdjust &&
              d.adjustments.map((a, i) => (
                <div className={styles.adjustCard} key={i}>
                  <div className={styles.adjustTopRow}>
                    <span className={styles.adjustAmount} style={{ color: a.fg }}>{a.amountLabel}</span>
                    <span className={styles.adjustWhen}>{a.when}</span>
                  </div>
                  <div className={styles.adjustReason}>{a.reason} · {a.by}</div>
                </div>
              ))}
            {d.noAdjust && <div className={styles.emptyNote}>등록된 조정 내역이 없습니다.</div>}
            <div className={styles.formRow}>
              <input className={styles.formInputSm} placeholder="조정 금액 (+/-)" />
              <input className={styles.formInputWide} placeholder="조정 사유" />
              <button type="button" className={styles.formAddBtn}>추가</button>
            </div>
          </div>
        )}

        {d.activeTab === 'history' && (
          <div>
            <div className={styles.sectionLabel}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" />
              <button type="button" className={styles.memoSubmitBtn}>등록</button>
            </div>
            {d.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            <div className={styles.historyLabel}>정산 이력</div>
            {d.history.map((h, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} />
                <div className={styles.historyBody}>
                  <div className={styles.historyTopRow}>
                    <span className={styles.historyTitle}>{h.title}</span>
                    <span className={styles.historyWhen}>{h.when}</span>
                  </div>
                  {h.detail && <div className={styles.historyDetail}>{h.detail}</div>}
                  {h.by && <div className={styles.historyBy}>{h.by}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
