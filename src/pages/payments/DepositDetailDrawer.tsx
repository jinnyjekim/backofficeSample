import styles from './drawerShared.module.css';
import type { DepositDetail } from './depositDetail';

interface Props {
  detail: DepositDetail;
  onTabChange: (tab: string) => void;
}

export function DepositDetailDrawer({ detail: d, onTabChange }: Props) {
  return (
    <aside className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.titleRow}>
              <span className={styles.titleText}>{d.depositor}</span>
              <span className={styles.badge} style={{ background: d.confirmBg, color: d.confirmFg }}>{d.confirmLabel}</span>
              <span className={styles.badge} style={{ background: d.matchBg, color: d.matchFg }}>{d.matchLabel}</span>
            </div>
            <div className={styles.amountLine}>{d.amount}</div>
            <div className={styles.metaLine}>입금 {d.depositedAt}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        {d.hasCandidate && (
          <div className={styles.candidateBanner}>
            <div className={styles.candidateTitle}>자동 매칭 후보</div>
            <div className={styles.candidateBody}>{d.candidatePartner} · {d.candidateInvoice} · 미수 {d.candidateAmount}</div>
          </div>
        )}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.actionLink}>거래처 찾기</button>
          <div className={styles.spacer} />
          {d.canConfirm && (
            <>
              <button type="button" className={styles.btnGhost} onClick={d.toggleHoldPanel}>보류</button>
              <button type="button" className={styles.btnPrimary} onClick={d.confirmDeposit}>입금 확인</button>
            </>
          )}
          {d.canResume && (
            <button type="button" className={styles.btnPrimary} onClick={d.resume}>확인 재개</button>
          )}
        </div>

        {d.showHoldPanel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>입금 확인 보류</div>
            <select className={styles.panelSelectFull}>
              <option>거래처 확인 필요</option>
              <option>청구 대상 확인 필요</option>
              <option>입금액 불일치</option>
              <option>중복 입금 의심</option>
              <option>증빙 확인 필요</option>
              <option>기타</option>
            </select>
            <input placeholder="재확인 예정일" className={styles.panelInputFull} />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelBtnCancel} onClick={d.toggleHoldPanel}>취소</button>
              <button type="button" className={styles.panelBtnSave} onClick={d.confirmHold}>보류</button>
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
            <div className={styles.sectionLabel}>원본 입금 정보</div>
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

        {d.isMatch && (
          <div>
            <div className={styles.sectionLabel}>거래처 매칭</div>
            <div className={styles.card} style={{ marginBottom: 16 }}>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>입금자명</span>
                <span className={styles.kvValue}>{d.depositor}</span>
              </div>
              <div className={styles.kvRow}>
                <span className={styles.kvLabel}>추정 거래처</span>
                <span className={styles.kvValue}>{d.candidatePartner}</span>
              </div>
            </div>
            <div className={styles.sectionLabel}>청구 매칭 후보</div>
            {d.invoiceCandidates.map((ic) => (
              <div className={styles.flexRowCard} key={ic.no}>
                <div>
                  <button type="button" className={styles.cardTitleLink}>{ic.no}</button>
                  <div className={styles.cardSub}>미수 {ic.remaining} · 지급예정 {ic.due}</div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: ic.fg }}>{ic.matchLabel}</span>
              </div>
            ))}
          </div>
        )}

        {d.isVerify && (
          <div>
            <div className={styles.sectionLabel}>금액 검증</div>
            <div className={styles.infoBox}>
              {d.verifyFields.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <span className={styles.infoValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel} style={{ marginTop: 14 }}>검증 결과</div>
            {d.checks.map((c, i) => (
              <div key={i} className={styles.checkRow} style={{ color: c.color }}>{c.icon} {c.label}</div>
            ))}
          </div>
        )}

        {d.isResult && (
          <div>
            <div className={styles.sectionLabel}>수금 반영 결과</div>
            {d.isConfirmed && (
              <div className={styles.infoBox}>
                {d.resultFields.map((f) => (
                  <div className={styles.infoRow} key={f.label}>
                    <span className={styles.infoLabel}>{f.label}</span>
                    <button type="button" className={styles.infoValueLink}>{f.value}</button>
                  </div>
                ))}
              </div>
            )}
            {d.notConfirmed && <div className={styles.plainNote}>입금 확인이 완료되면 결제·수금·미수금에 자동 반영됩니다.</div>}
          </div>
        )}

        {d.isDocs && (
          <div>
            <div className={styles.sectionLabel}>증빙</div>
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
