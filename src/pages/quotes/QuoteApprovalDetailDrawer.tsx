import styles from './quoteShared.module.css';
import type { ApprovalDetail } from './quoteApprovalDetail';

interface Props {
  detail: ApprovalDetail;
  onTabChange: (tab: string) => void;
}

export function QuoteApprovalDetailDrawer({ detail: d, onTabChange }: Props) {
  return (
    <div className={styles.panelRoot}>
      <div className={styles.asideTop}>
        <div className={styles.headRowD}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{d.no}</span>
              <span className={styles.badgePill} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
              <span style={{ fontSize: 11, color: '#71717a' }}>{d.stageLabel}</span>
            </div>
            <div className={styles.partnerLine}>{d.partner} · 견적금액 {d.amount}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        <div style={{ marginTop: 12, border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: 12, background: '#fafafa' }}>
          <div style={{ fontSize: 11, color: '#71717a', fontWeight: 600, marginBottom: 8 }}>승인 검토 요약</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {d.summary.map((sm) => (
              <div key={sm.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#71717a' }}>{sm.label}</span>
                <span style={{ fontWeight: 600, color: sm.color }}>{sm.value}</span>
              </div>
            ))}
          </div>
        </div>

        {d.hasReasons && (
          <div style={{ marginTop: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 11.5, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>승인 필요 사유</div>
            {d.reasons.map((rs) => (
              <div key={rs} style={{ fontSize: 12, color: '#78350f', lineHeight: 1.7 }}>• {rs}</div>
            ))}
          </div>
        )}

        <div className={styles.linksRow}>
          <button type="button" className={styles.linkBtn}>견적서 전체 보기</button>
          <div className={styles.rowSpacer} />
          {d.canAct && (
            <>
              <button type="button" className={styles.dangerOutlineBtn} onClick={d.toggleRejectPanel}>반려</button>
              <button type="button" className={styles.primaryBtn} onClick={d.toggleApprovePanel}>승인</button>
            </>
          )}
          {d.canWithdraw && (
            <button type="button" className={styles.secondaryBtn}>승인 요청 철회</button>
          )}
        </div>

        {d.showApprovePanel && (
          <div className={styles.panelNeutral}>
            <div className={styles.panelTitle}>견적을 승인하시겠습니까?</div>
            <textarea className={styles.panelTextarea} placeholder="승인 의견을 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={d.toggleApprovePanel}>취소</button>
              <button type="button" className={styles.panelConfirmAccent} onClick={d.approve}>견적 승인</button>
            </div>
          </div>
        )}

        {d.showRejectPanel && (
          <div className={styles.panelRed}>
            <div className={styles.panelTitle} style={{ color: '#b91c1c' }}>견적 반려</div>
            <select className={styles.panelSelect}>
              <option>가격 재검토 필요</option>
              <option>할인율 과다</option>
              <option>마진 기준 미달</option>
              <option>납기 재검토</option>
              <option>거래 조건 재검토</option>
              <option>신용조건 확인 필요</option>
              <option>정보 부족</option>
              <option>기타</option>
            </select>
            <textarea className={styles.panelTextarea} placeholder="상세 사유를 입력하세요" />
            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}><input type="checkbox" />견적 단가</label>
              <label className={styles.checkboxLabel}><input type="checkbox" />납기</label>
              <label className={styles.checkboxLabel}><input type="checkbox" />결제 조건</label>
              <label className={styles.checkboxLabel}><input type="checkbox" />수량</label>
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={d.toggleRejectPanel}>취소</button>
              <button type="button" className={styles.panelConfirmRed} onClick={d.reject}>견적 반려</button>
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
        {d.isItems && (
          <div>
            <div className={styles.sectionLabel}>견적 항목</div>
            {d.items.map((it) => (
              <div className={styles.itemCard} key={it.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{it.amount}</span>
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

        {d.isMargin && (
          <div>
            <div className={styles.sectionLabel}>가격 검토</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 16 }}>
              {d.priceFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>마진 기준</div>
            <div style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#71717a' }}>최소 마진 기준</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{d.minMargin}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#71717a' }}>현재 마진</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3, color: d.marginFg }}>{d.marginLabel}</div>
              </div>
            </div>
            <div className={styles.sectionLabel}>최소수량 검토</div>
            {d.moqChecks.map((mc) => (
              <div key={mc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 11px', background: '#fafafa', borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: '#3f3f46' }}>{mc.name} · 견적 {mc.qty} / MOQ {mc.moq}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: mc.fg }}>{mc.label}</span>
              </div>
            ))}
          </div>
        )}

        {d.isCond && (
          <div>
            <div className={styles.sectionLabel}>거래 조건 비교</div>
            <div style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '8px 12px', background: '#fbfbfc', borderBottom: '1px solid rgba(0,0,0,.07)', fontSize: 11, color: '#71717a', fontWeight: 600 }}>
                <span>항목</span><span>거래처 기본</span><span>이번 견적</span>
              </div>
              {d.condCompare.map((cc) => (
                <div key={cc.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                  <span style={{ fontSize: 12, color: '#71717a' }}>{cc.label}</span>
                  <span style={{ fontSize: 12.5, color: '#3f3f46' }}>{cc.base}</span>
                  <span style={{ fontSize: 12.5, fontWeight: cc.weight, color: cc.fg }}>{cc.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>거래처 신용 현황</div>
            <div className={styles.fieldsBox}>
              {d.creditFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isChain && (
          <div>
            <div className={styles.sectionLabel}>승인선</div>
            {d.chain.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#18181b' }}>{c.stage} · {c.admin}</div>
                  <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>{c.when}</div>
                </div>
                <span className={styles.badgePill} style={{ background: c.bg, color: c.fg }}>{c.status}</span>
              </div>
            ))}
          </div>
        )}

        {d.isOpinion && (
          <div>
            <div className={styles.sectionLabel}>승인 요청 의견</div>
            <div style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12.5, color: '#3f3f46', lineHeight: 1.6, marginBottom: 8 }}>{d.opinion}</div>
              <div style={{ fontSize: 11.5, color: '#a1a1aa' }}>{d.requester} · {d.requestedAt}</div>
            </div>
          </div>
        )}

        {d.isHistory && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>승인 이력</div>
            {d.history.map((h, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} />
                <div className={styles.historyBody}>
                  <div className={styles.historyTopRow}>
                    <span className={styles.historyAction}>{h.action}</span>
                    <span className={styles.historyWhen}>{h.when}</span>
                  </div>
                  <div className={styles.historyBy}>{h.by}</div>
                  {h.note && <div style={{ fontSize: 12, color: '#3f3f46', marginTop: 3 }}>"{h.note}"</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
