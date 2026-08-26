import { useRef } from 'react';
import styles from './drawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { ReceivableDetail } from './receivableDetail';

interface Props {
  detail: ReceivableDetail;
  onTabChange: (tab: string) => void;
}

export function ReceivableDetailDrawer({ detail: d, onTabChange }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, d.close);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.titleRow}>
              <span className={styles.titleText}>{d.partner}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
            </div>
            <div className={styles.amountLine}>{d.totalAr}</div>
            <div className={styles.metaLine}>연체 {d.overdueAmount} · 최장 연체 {d.maxOverdueDays}일</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.actionLink}>회사 상세</button>
          <div className={styles.spacer} />
          <button type="button" className={styles.btnGhost} onClick={d.toggleActivityPanel}>수금 활동 등록</button>
          <button type="button" className={styles.btnPrimary} onClick={d.toggleCollectPanel}>수금 등록</button>
        </div>

        {d.showCollectPanel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>수금 등록</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input placeholder="수금액" className={styles.panelInput} style={{ flex: 1 }} />
              <input placeholder="수금일" className={styles.panelInput} style={{ flex: 1 }} />
            </div>
            <select className={styles.panelSelectFull}>
              <option>계좌이체</option>
              <option>무통장입금</option>
              <option>카드</option>
            </select>
            <select className={styles.panelSelectFull}>
              {d.openInvoices.map((iv) => (
                <option key={iv}>{iv}</option>
              ))}
            </select>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelBtnCancel} onClick={d.toggleCollectPanel}>취소</button>
              <button type="button" className={styles.panelBtnSavePrimary}>수금 등록</button>
            </div>
          </div>
        )}

        {d.showActivityPanel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>수금 활동 등록</div>
            <select className={styles.panelSelectFull}>
              <option>전화</option>
              <option>이메일</option>
              <option>공문</option>
              <option>방문</option>
              <option>지급 약속 확인</option>
            </select>
            <input placeholder="다음 조치일" className={styles.panelInputFull} />
            <textarea className={styles.panelTextarea} placeholder="활동 내용" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelBtnCancel} onClick={d.toggleActivityPanel}>취소</button>
              <button type="button" className={styles.panelBtnSave} onClick={d.confirmActivity}>활동 등록</button>
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
        {d.isSummary && (
          <div>
            <div className={styles.sectionLabel}>미수 요약</div>
            <div className={styles.infoBox}>
              {d.summaryFields.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <span className={styles.infoValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isInvoices && (
          <div>
            <div className={styles.sectionLabel}>청구별 미수</div>
            {d.invoices.map((iv) => (
              <div className={styles.card} key={iv.no}>
                <div className={styles.cardHeadRow}>
                  <button type="button" className={styles.cardTitleLink}>{iv.no}</button>
                  <span className={styles.pillSm} style={{ background: iv.bg, color: iv.fg }}>{iv.status}</span>
                </div>
                <div className={styles.gridStatsRow} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div>
                    <div className={styles.gridStatLabel}>청구금액</div>
                    <div className={styles.gridStatValue}>{iv.billed}</div>
                  </div>
                  <div>
                    <div className={styles.gridStatLabel}>수금액</div>
                    <div className={styles.gridStatValue}>{iv.collected}</div>
                  </div>
                  <div>
                    <div className={styles.gridStatLabel}>미수금</div>
                    <div className={styles.gridStatValueStrong}>{iv.remaining}</div>
                  </div>
                </div>
                <div className={styles.cardFootNote}>지급예정 {iv.dueDate}</div>
              </div>
            ))}
          </div>
        )}

        {d.isPlan && (
          <div>
            <div className={styles.sectionLabel}>지급 약속</div>
            {d.hasPromise && (
              <div className={styles.card} style={{ marginBottom: 16 }}>
                <div className={styles.kvRow}>
                  <span className={styles.kvLabel}>약속일</span>
                  <span className={styles.kvValue}>{d.promiseDate}</span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.kvLabel}>약속금액</span>
                  <span className={styles.kvValue} style={{ fontVariantNumeric: 'tabular-nums' }}>{d.promiseAmount}</span>
                </div>
                <div className={styles.kvRow}>
                  <span className={styles.kvLabel}>상태</span>
                  <span className={styles.kvValue} style={{ color: d.promiseFg }}>{d.promiseStatus}</span>
                </div>
              </div>
            )}
            {d.noPromise && <div className={styles.emptyNote}>등록된 지급 약속이 없습니다.</div>}
            <div className={styles.sectionLabel}>수금 내역</div>
            {d.collections.map((c, i) => (
              <div className={styles.listRow} key={i}>
                <span className={styles.listRowText}>{c.when} · <button type="button" className={styles.listRowLink}>{c.pay}</button></span>
                <span className={styles.listRowValue}>{c.amount}</span>
              </div>
            ))}
          </div>
        )}

        {d.isActivity && (
          <div>
            <div className={styles.timelineTitle}>독촉 / 수금 활동</div>
            {d.activities.map((a, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} style={{ background: 'var(--accent)' }} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineActionTitle}>{a.type}</span>
                    <span className={styles.timelineWhen}>{a.when}</span>
                  </div>
                  <div className={styles.timelineBy}>{a.note}</div>
                  <div className={styles.metaLine}>{a.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {d.isCredit && (
          <div>
            <div className={styles.sectionLabel}>신용 영향</div>
            <div className={styles.infoBox} style={{ marginBottom: 16 }}>
              {d.creditFields.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <span className={styles.infoValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>거래 제한</div>
            <div className={styles.plainNote}>{d.tradeRestriction}</div>
          </div>
        )}

        {d.isMemo && (
          <div>
            <div className={styles.sectionLabel}>관리자 메모</div>
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
            <div className={styles.sectionLabel} style={{ margin: '16px 0 14px' }}>처리 이력</div>
            {d.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} style={{ background: '#d4d4d8' }} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineActionTitle}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
