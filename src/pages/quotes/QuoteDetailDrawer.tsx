import { useRef } from 'react';
import styles from './quoteShared.module.css';
import type { QuoteDetail } from './quoteDetail';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface Props {
  detail: QuoteDetail;
  onTabChange: (tab: string) => void;
}

export function QuoteDetailDrawer({ detail: d, onTabChange }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, d.close);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.asideTop}>
        <div className={styles.headRowD}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{d.no}</span>
              <span className={styles.versionTag}>{d.version}</span>
              <span className={styles.badgePill} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
            </div>
            <div className={styles.partnerLine}>{d.partner} · {d.contact}</div>
            <div className={styles.metaLine}>견적금액 <b style={{ color: '#18181b' }}>{d.amount}</b> · 유효기간 {d.validUntil} · 담당자 {d.owner}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        <div className={styles.linksRow}>
          <button type="button" className={styles.linkBtn}>거래처 상세</button>
          <button type="button" className={styles.linkBtn}>RFQ 보기</button>
          <button type="button" className={styles.pdfBtn}>PDF</button>
          <div className={styles.rowSpacer} />
          {d.canRequestApproval && (
            <button type="button" className={styles.primaryBtn} onClick={d.requestApproval}>승인 요청</button>
          )}
          {d.canApprove && (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={d.toggleApprovePanel}>반려</button>
              <button type="button" className={styles.primaryBtn} onClick={d.approve}>승인</button>
            </>
          )}
          {d.canSend && (
            <button type="button" className={styles.primaryBtn} onClick={d.send}>견적서 발송</button>
          )}
          {d.canMarkOutcome && (
            <>
              <button type="button" className={styles.dangerOutlineBtn} onClick={d.markReject}>거절 처리</button>
              <button type="button" className={styles.greenBtn} onClick={d.markAccept}>수락 처리</button>
            </>
          )}
          {d.canReQuote && (
            <button type="button" className={styles.secondaryBtn} onClick={d.reQuote}>재견적 작성</button>
          )}
        </div>

        {d.showApprovePanel && (
          <div className={styles.panelRed}>
            <div className={styles.panelTitle} style={{ color: '#b91c1c' }}>견적 반려</div>
            <select className={styles.panelSelect}>
              <option>가격 재검토</option>
              <option>할인율 초과</option>
              <option>거래조건 재확인</option>
              <option>기타</option>
            </select>
            <textarea className={styles.panelTextarea} placeholder="상세 사유를 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={d.toggleApprovePanel}>취소</button>
              <button type="button" className={styles.panelConfirmRed} onClick={d.reject}>반려 확정</button>
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

      <div className={styles.scrollBody}>
        {d.isInfo && (
          <div>
            <div className={styles.sectionLabel}>견적 정보</div>
            <div className={styles.fieldsBox}>
              {d.infoFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>연결 정보</div>
            <div className={styles.fieldsBox}>
              {d.linkFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isItems && (
          <div>
            <div className={styles.sectionLabel}>견적 항목 · 총 {d.itemCount}건</div>
            {d.items.map((it) => (
              <div className={styles.itemCard} key={it.code}>
                <div className={styles.itemHeadRow}>
                  <div>
                    <div className={styles.itemName}>{it.name}</div>
                    <div className={styles.itemCode}>{it.code}</div>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.itemQty}>{it.amount}</div>
                    <div className={styles.itemSub}>{it.qty} × {it.unitPrice}</div>
                  </div>
                </div>
                <div className={styles.itemGrid}>
                  <div>
                    <div className={styles.itemGridCellLabel}>기준단가</div>
                    <div className={styles.itemGridCellValue}>{it.basePrice}</div>
                  </div>
                  <div>
                    <div className={styles.itemGridCellLabel}>견적단가</div>
                    <div className={styles.itemGridCellValueBold}>{it.unitPrice}</div>
                  </div>
                  <div>
                    <div className={styles.itemGridCellLabel}>차이</div>
                    <div className={styles.itemGridCellValueBold} style={{ color: it.diffFg }}>{it.diffLabel}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {d.isAmount && (
          <div>
            <div className={styles.sectionLabel}>금액 계산</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 20 }}>
              {d.amountFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel} style={{ fontWeight: f.labelWeight }}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {d.showDiscountWarning && (
              <div className={styles.panelAmber} style={{ marginBottom: 16 }}>
                ⚠ 기준 단가보다 10% 이상 낮습니다. 승인이 필요할 수 있습니다.
              </div>
            )}
            <div className={styles.sectionLabel}>거래 조건</div>
            <div className={styles.fieldsBox}>
              {d.condFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isApproval && (
          <div>
            <div className={styles.sectionLabel}>승인 정보</div>
            <div className={styles.fieldsBox}>
              {d.approvalFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isSend && (
          <div>
            <div className={styles.sectionLabel}>발송 이력</div>
            {d.hasSendLogs && d.sendLogs.map((sl, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} />
                <div className={styles.historyBody}>
                  <div className={styles.historyTopRow}>
                    <span className={styles.historyAction}>{sl.title}</span>
                    <span className={styles.historyWhen}>{sl.when}</span>
                  </div>
                  <div className={styles.historyBy}>{sl.to} · {sl.by}</div>
                </div>
              </div>
            ))}
            {d.noSendLogs && <div className={styles.emptyNote}>아직 발송되지 않았습니다.</div>}
          </div>
        )}

        {d.isVersion && (
          <div>
            <div className={styles.sectionLabel}>견적 Version</div>
            {d.versions.map((v) => (
              <div className={styles.versionCard} key={v.label} style={{ background: v.bg }}>
                <div className={styles.versionHeadRow}>
                  <div>
                    <span className={styles.versionLabel}>{v.label}</span>
                    <span className={styles.versionTagSmall}>{v.date}</span>
                  </div>
                  <span className={styles.versionAmount}>{v.amount}</span>
                </div>
                <div className={styles.versionStatus}>{v.status}</div>
              </div>
            ))}
          </div>
        )}

        {d.isActivity && (
          <div>
            <div className={styles.sectionLabel}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" />
              <button type="button" className={styles.memoSubmitBtn}>등록</button>
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
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>처리 이력</div>
            {d.history.map((h, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} />
                <div className={styles.historyBody}>
                  <div className={styles.historyTopRow}>
                    <span className={styles.historyAction}>{h.action}</span>
                    <span className={styles.historyWhen}>{h.when}</span>
                  </div>
                  <div className={styles.historyBy}>{h.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
