import styles from './drawerShared.module.css';
import type { PaymentDetail } from './paymentDetail';

interface Props {
  detail: PaymentDetail;
  onTabChange: (tab: string) => void;
}

export function PaymentDetailDrawer({ detail: d, onTabChange }: Props) {
  return (
    <aside className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.titleRow}>
              <span className={styles.titleText}>{d.no}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
              <span className={styles.badge} style={{ background: d.matchBg, color: d.matchFg }}>{d.matchLabel}</span>
            </div>
            <div className={styles.subLine}>{d.partner} · {d.method}</div>
            <div className={styles.amountLine}>{d.amount}</div>
            <div className={styles.metaLine}>결제일 {d.paidAt}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.actionLink}>거래처 상세</button>
          <button type="button" className={styles.actionLink}>주문 보기</button>
          <div className={styles.spacer} />
          {d.canConfirm && (
            <>
              <button type="button" className={styles.btnGhostDanger}>반려</button>
              <button type="button" className={styles.btnPrimary} onClick={d.confirmPayment}>결제 확인</button>
            </>
          )}
          {d.canAllocate && (
            <button type="button" className={styles.btnGhost} onClick={d.toggleAllocatePanel}>배분 수정</button>
          )}
          {d.canCancel && (
            <button type="button" className={styles.btnGhostDanger} onClick={d.toggleCancelPanel}>결제 취소</button>
          )}
        </div>

        {d.showAllocatePanel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>결제 배분</div>
            {d.allocRows.map((ar) => (
              <div className={styles.panelRow} key={ar.invoice}>
                <span style={{ flex: 1, fontSize: 12, color: '#3f3f46' }}>{ar.invoice} · 청구 {ar.invoiceAmount}</span>
                <input defaultValue={ar.allocated} className={styles.panelInput} style={{ width: 120, flex: 'none' }} />
              </div>
            ))}
            <div className={styles.panelSummaryRow}>
              <span>미배분</span>
              <span style={{ fontWeight: 600, color: d.unallocatedColor }}>{d.unallocated}</span>
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelBtnCancel} onClick={d.toggleAllocatePanel}>취소</button>
              <button type="button" className={styles.panelBtnSave}>배분 저장</button>
            </div>
          </div>
        )}

        {d.showCancelPanel && (
          <div className={styles.panelDanger}>
            <div className={styles.panelTitleDanger}>결제 취소</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#3f3f46', marginBottom: 8 }}>
              <span>취소 가능금액</span>
              <span style={{ fontWeight: 600 }}>{d.amount}</span>
            </div>
            <select className={styles.panelSelectFull}>
              <option>전체 취소</option>
              <option>부분 취소</option>
            </select>
            <textarea className={styles.panelTextarea} placeholder="취소 사유를 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelBtnCancel} onClick={d.toggleCancelPanel}>취소</button>
              <button type="button" className={styles.panelBtnDanger} onClick={d.confirmCancel}>결제 취소 요청</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {d.tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tabBtn} ${t.active ? styles.active : ''}`}
              style={{ fontWeight: t.weight, color: t.fg, boxShadow: t.mark }}
              onClick={() => onTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {d.isInfo && (
          <div>
            <div className={styles.sectionLabel}>결제 정보</div>
            <div className={styles.infoBox}>
              {d.infoFields.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <span className={styles.infoValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isAllocation && (
          <div>
            <div className={styles.sectionLabel}>배분 내역</div>
            {d.allocRows.map((ar) => (
              <div className={styles.flexRowCard} key={ar.invoice}>
                <div>
                  <button type="button" className={styles.cardTitleLink}>{ar.invoice}</button>
                  <div className={styles.cardSub}>청구금액 {ar.invoiceAmount}</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#18181b', fontVariantNumeric: 'tabular-nums' }}>{ar.allocated}</span>
              </div>
            ))}
            <div className={styles.rowBetween}>
              <span className={styles.rowBetweenLabel}>미배분</span>
              <span className={styles.rowBetweenValue} style={{ color: d.unallocatedColor }}>{d.unallocated}</span>
            </div>
          </div>
        )}

        {d.isLinks && (
          <div>
            <div className={styles.sectionLabel}>연결 거래</div>
            <div className={styles.infoBox}>
              {d.linkFields.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <button type="button" className={styles.infoValueLink}>{f.value}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isDocs && (
          <div>
            <div className={styles.sectionLabel}>결제 증빙</div>
            {d.docs.map((doc) => (
              <div className={styles.docRow} key={doc}>
                <span className={styles.listRowText}>{doc}</span>
                <button type="button" className={styles.listRowLink}>보기</button>
              </div>
            ))}
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>관리자 메모</div>
            <div className={styles.memoAddRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" />
              <button type="button" className={styles.memoAddBtn}>등록</button>
            </div>
            {d.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.admin}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
          </div>
        )}

        {d.isHistory && (
          <div>
            <div className={styles.timelineTitle}>처리 이력</div>
            {d.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} style={{ background: 'var(--accent)' }} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineActionTitle}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineBy}>{h.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
