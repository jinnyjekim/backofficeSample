import { useRef } from 'react';
import styles from './quoteShared.module.css';
import type { RequestDetail } from './requestDetail';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface Props {
  detail: RequestDetail;
  onTabChange: (tab: string) => void;
}

export function QuoteRequestDetailDrawer({ detail: d, onTabChange }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, d.close);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.asideTop}>
        <div className={styles.headRowD}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{d.no}</span>
              <span className={styles.badgePill} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
              {d.urgent && <span className={styles.urgentPill}>긴급</span>}
            </div>
            <div className={styles.partnerLine}>{d.partner} · {d.partnerContact}</div>
            <div className={styles.metaLine}>요청일 {d.requestedFull} · 희망납기 {d.dueDate} · 항목 {d.itemCount}건 · 총 수량 {d.totalQty}</div>
            <div className={styles.metaLine}>담당자 <b style={{ color: '#3f3f46' }}>{d.owner}</b></div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        <div className={styles.linksRow}>
          <button type="button" className={styles.linkBtn}>거래처 상세</button>
          <button type="button" className={styles.linkBtn}>담당자 상세</button>
          <div className={styles.rowSpacer} />
          {d.canReview && (
            <button type="button" className={styles.primaryBtn} onClick={d.startReview}>검토 시작</button>
          )}
          {d.canAct && (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={d.toggleSupplement}>보완 요청</button>
              <button type="button" className={styles.dangerOutlineBtn} onClick={d.toggleReject}>반려</button>
              <button type="button" className={styles.primaryBtn} onClick={d.toggleDraft}>견적 작성</button>
            </>
          )}
        </div>

        {d.showSupplementPanel && (
          <div className={styles.panelNeutral}>
            <div className={styles.panelTitle}>견적 요청 보완</div>
            <div className={styles.checkboxRow}>
              <label className={styles.checkboxLabel}><input type="checkbox" />수량</label>
              <label className={styles.checkboxLabel}><input type="checkbox" />규격</label>
              <label className={styles.checkboxLabel}><input type="checkbox" />희망 납기</label>
              <label className={styles.checkboxLabel}><input type="checkbox" />기타</label>
            </div>
            <textarea className={styles.panelTextarea} placeholder="보완 요청 내용을 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={d.toggleSupplement}>취소</button>
              <button type="button" className={styles.panelConfirmDark} onClick={d.confirmSupplement}>보완 요청</button>
            </div>
          </div>
        )}

        {d.showRejectPanel && (
          <div className={styles.panelRed}>
            <div className={styles.panelTitle} style={{ color: '#b91c1c' }}>견적 요청 반려</div>
            <select className={styles.panelSelect}>
              <option>공급 불가</option>
              <option>거래 불가 상품</option>
              <option>요청 조건 충족 불가</option>
              <option>거래 조건 미충족</option>
              <option>중복 요청</option>
              <option>정보 부족</option>
              <option>기타</option>
            </select>
            <textarea className={styles.panelTextarea} placeholder="상세 사유를 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={d.toggleReject}>취소</button>
              <button type="button" className={styles.panelConfirmRed} onClick={d.confirmReject}>반려 확정</button>
            </div>
          </div>
        )}

        {d.showDraftPanel && (
          <div className={styles.panelBlue}>
            <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.6, marginBottom: 9 }}>
              견적서를 작성하시겠습니까?<br />요청번호 {d.no} · 거래처 {d.partner} · 요청 항목 {d.itemCount}건
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={d.toggleDraft}>취소</button>
              <button type="button" className={styles.panelConfirmAccent} onClick={d.confirmDraft}>견적서 작성</button>
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
            <div className={styles.sectionLabel}>요청정보</div>
            <div className={styles.fieldsBox}>
              {d.infoFields.map((f) => (
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
            <div className={styles.sectionLabel}>요청 항목 · 총 {d.itemCount}건</div>
            {d.items.map((it) => (
              <div className={styles.itemCard} key={it.code}>
                <div className={styles.itemHeadRow}>
                  <div>
                    <div className={styles.itemName}>{it.name}</div>
                    <div className={styles.itemCode}>{it.code}</div>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.itemQty}>{it.qty} {it.unit}</div>
                    <div className={styles.itemSub}>희망납기 {it.due}</div>
                  </div>
                </div>
                <div className={styles.itemGrid}>
                  <div>
                    <div className={styles.itemGridCellLabel}>희망 단가</div>
                    <div className={styles.itemGridCellValueBold}>{it.wishPrice}</div>
                  </div>
                  <div>
                    <div className={styles.itemGridCellLabel}>현재 공급가</div>
                    <div className={styles.itemGridCellValue}>{it.currentPrice}</div>
                  </div>
                  <div>
                    <div className={styles.itemGridCellLabel}>최소 주문수량</div>
                    <div className={styles.itemGridCellValue}>{it.moq}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {d.isCond && (
          <div>
            <div className={styles.sectionLabel}>희망 조건 / 요청사항</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 16 }}>
              {d.condFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel} style={{ marginBottom: 6 }}>기타 요청사항</div>
            <div style={{ fontSize: 12.5, color: '#3f3f46', lineHeight: 1.6, background: '#fafafa', borderRadius: 8, padding: '11px 12px' }}>{d.remark}</div>
          </div>
        )}

        {d.isFiles && (
          <div>
            <div className={styles.sectionLabel}>첨부파일</div>
            {d.files.map((f) => (
              <div className={styles.fileRow} key={f.name}>
                <span className={styles.fileName}>📎 {f.name}</span>
                <span className={styles.fileMeta}>{f.meta}</span>
              </div>
            ))}
            {d.noFiles && <div className={styles.emptyNote}>첨부된 파일이 없습니다.</div>}
          </div>
        )}

        {d.isQuoteDoc && (
          <div>
            <div className={styles.sectionLabel}>연결 견적서</div>
            {d.hasQuotes && d.quotes.map((qd) => (
              <div className={styles.linkedCard} key={qd.no}>
                <div>
                  <div className={styles.linkedNo}>{qd.no}</div>
                  <div className={styles.linkedSub}>{qd.round}</div>
                </div>
                <span className={styles.badgePill} style={{ background: qd.bg, color: qd.fg }}>{qd.status}</span>
              </div>
            ))}
            {d.noQuotes && <div className={styles.emptyNote}>아직 생성된 견적서가 없습니다.</div>}
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
