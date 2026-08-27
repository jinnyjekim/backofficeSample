import { useRef, useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import styles from './RefundPage.module.css';
import {
  ADJUSTMENT_TYPES,
  STATUS_META,
  computeApprovalChecklist,
  computeCumulativeRefunded,
  computeFinalAmount,
  computeRefundableBalance,
  findDuplicates,
  fmtSigned,
  fmtWon,
  itemsAmount,
  type AdjustmentType,
  type RefundRequest,
} from './refundData';

type Tab = 'request' | 'amount' | 'review' | 'memo' | 'history';

interface Props {
  refund: RefundRequest;
  all: RefundRequest[];
  onClose: () => void;
  onAddAdjustment: (type: AdjustmentType, amount: number, reason: string) => void;
  onRemoveAdjustment: (adjId: string) => void;
  onAddMemo: (text: string) => void;
  onStartReview: () => void;
  onAssignClick: () => void;
  onApproveClick: () => void;
  onRejectClick: () => void;
  onExecute: () => void;
  onPoll: () => void;
  onRetryClick: () => void;
  onReconsiderClick: () => void;
}

export function RefundDrawer({
  refund,
  all,
  onClose,
  onAddAdjustment,
  onRemoveAdjustment,
  onAddMemo,
  onStartReview,
  onAssignClick,
  onApproveClick,
  onRejectClick,
  onExecute,
  onPoll,
  onRetryClick,
  onReconsiderClick,
}: Props) {
  const [tab, setTab] = useState<Tab>('request');
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjType, setAdjType] = useState<AdjustmentType>('기타 차감');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [memoText, setMemoText] = useState('');

  const sm = STATUS_META[refund.status];
  const finalAmount = computeFinalAmount(refund);
  const requestedAmount = itemsAmount(refund.items);
  const prior = computeCumulativeRefunded(refund.orderId, all, refund.id);
  const balance = computeRefundableBalance(refund, all);
  const dup = findDuplicates(refund, all);
  const checklist = computeApprovalChecklist(refund, all);
  const canApproveNow = refund.status === '검토중' && checklist.every((c) => c.pass);

  const submitAdjustment = () => {
    const amount = Number(adjAmount);
    if (!amount || !adjReason.trim()) return;
    const signed = adjType === '추가 환급' ? Math.abs(amount) : -Math.abs(amount);
    onAddAdjustment(adjType, signed, adjReason.trim());
    setAdjAmount('');
    setAdjReason('');
    setShowAdjustForm(false);
  };

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={`${drawer.aside} ${styles.refundDrawer}`} aria-label="환불 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>주문 {refund.orderId} · {refund.customer}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{refund.id}</h2>
              <span className={drawer.badge} style={{ background: sm.bg, color: sm.fg }}>{refund.status}</span>
              <span className={drawer.badge} style={{ background: '#f4f4f5', color: '#71717a' }}>{refund.refundType}</span>
            </div>
            <div className={drawer.sub}>요청금액 {fmtWon(requestedAmount)} · 환불 예정금액 {fmtWon(finalAmount)}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={drawer.actionRow}>
          {refund.status === '요청' && (
            <>
              <button type="button" className={drawer.primaryBtn} onClick={onStartReview}>검토 시작</button>
              <button type="button" className={drawer.actionLink} onClick={onAssignClick}>담당자 지정</button>
            </>
          )}
          {refund.status === '검토중' && (
            <>
              <button type="button" className={styles.approveBtn} onClick={onApproveClick} disabled={!canApproveNow}>환불 승인</button>
              <button type="button" className={styles.rejectBtn} onClick={onRejectClick}>반려</button>
              <button type="button" className={drawer.actionLink} onClick={onAssignClick}>담당자 지정</button>
            </>
          )}
          {refund.status === '승인' && <button type="button" className={styles.executeBtn} onClick={onExecute}>환불 실행</button>}
          {refund.status === '처리중' && <button type="button" className={drawer.actionLink} onClick={onPoll}>상태 재조회</button>}
          {refund.status === '실패' && (
            <>
              <button type="button" className={drawer.actionLink} onClick={onPoll}>상태 재조회</button>
              <button type="button" className={styles.retryBtn} onClick={onRetryClick}>재시도</button>
            </>
          )}
          {refund.status === '반려' && <button type="button" className={drawer.actionLink} onClick={onReconsiderClick}>재검토</button>}
        </div>

        <div className={drawer.tabs}>
          {([['request', '요청 정보'], ['amount', '금액 계산'], ['review', '검토 · 처리'], ['memo', '관리자 메모'], ['history', '처리 이력']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className={drawer.scroll}>
        {tab === 'request' && (
          <>
            {dup.length > 0 && (
              <div className={`${styles.statusBanner} ${styles.bannerWarn}`}>
                <strong>⚠ 중복 환불 확인 필요</strong>
                <span>동일 주문/상품에 처리중인 환불이 있습니다: {dup.map((d) => d.id).join(', ')}</span>
              </div>
            )}
            <div className={drawer.sectionTitle}>환불 요청</div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>요청자</span><span className={styles.summaryValue}>{refund.requesterType} · {refund.requester}</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>요청일</span><span className={styles.summaryValue}>{refund.requestedAt}</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>환불 사유</span><span className={styles.summaryValue}>{refund.reason}</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>담당자</span><span className={styles.summaryValue}>{refund.owner}</span></div>
            </div>
            <div className={drawer.bodyText}>{refund.reasonDetail}</div>

            <div className={drawer.sectionTitleLoose}>{refund.refundType === '전체 환불' ? '환불 대상' : '환불 대상 상품'}</div>
            {refund.refundType === '전체 환불' ? (
              <div className={styles.summaryGrid}>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>대상</span><span className={styles.summaryValue}>주문 전체</span></div>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>상품</span><span className={styles.summaryValue}>{refund.items.length}개 · {fmtWon(requestedAmount)}</span></div>
              </div>
            ) : (
              <div className={styles.itemTable}>
                <div className={styles.itemTableHead}><span>상품</span><span>주문수량</span><span>환불수량</span><span>금액</span></div>
                {refund.items.map((i) => (
                  <div key={i.productCode} className={styles.itemTableRow}>
                    <span className={i.refundQty === 0 ? styles.itemRefundOff : undefined}>{i.productName} · {i.productCode}</span>
                    <span>{i.orderQty}</span>
                    <span>{i.refundQty > 0 ? i.refundQty : '-'}</span>
                    <span>{i.refundQty > 0 ? fmtWon(i.amount) : '-'}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={drawer.sectionTitleLoose}>발생 원인</div>
            <div className={styles.linkedItem}>
              <span>{refund.originType}{refund.originId ? ` · ${refund.originId}` : ''}</span>
              {refund.returnStatus && <span>반품상태 {refund.returnStatus}{refund.inspectionResult ? ` · 검수 ${refund.inspectionResult}` : ''}</span>}
            </div>
          </>
        )}

        {tab === 'amount' && (
          <>
            <div className={drawer.sectionTitle}>환불 금액 계산</div>
            <div className={styles.breakdownTable}>
              <div className={styles.breakdownRow}>
                <div className={styles.breakdownMain}>환불 상품금액</div>
                <div className={styles.breakdownAmount}>{fmtWon(requestedAmount)}</div>
              </div>
              {refund.adjustments.map((a) => (
                <div key={a.id} className={styles.breakdownRow}>
                  <div className={styles.breakdownMain}>
                    <span>{a.type} · {a.reason}</span>
                    {a.basis && <span className={styles.breakdownBasis}>적용 근거: {a.basis}</span>}
                  </div>
                  <div className={`${styles.breakdownAmount} ${a.amount < 0 ? styles.amountNeg : styles.amountPos}`}>
                    {fmtSigned(a.amount)}
                    {refund.status === '요청' || refund.status === '검토중' ? (
                      <button type="button" className={styles.adjustRemove} onClick={() => onRemoveAdjustment(a.id)}>✕</button>
                    ) : null}
                  </div>
                </div>
              ))}
              <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                <span>최종 환불 예정금액</span>
                <span>{fmtWon(finalAmount)}</span>
              </div>
            </div>

            {(refund.status === '요청' || refund.status === '검토중') && (
              showAdjustForm ? (
                <div className={styles.adjustForm}>
                  <div className={styles.adjustFormRow}>
                    <select value={adjType} onChange={(e) => setAdjType(e.target.value as AdjustmentType)}>
                      {ADJUSTMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <input type="number" min={0} placeholder="금액" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} style={{ width: 110 }} />
                  </div>
                  <div className={styles.adjustFormRow}>
                    <input type="text" placeholder="사유 (필수)" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
                  </div>
                  <div className={styles.adjustFormActions}>
                    <button type="button" className={drawer.editCancel} onClick={() => setShowAdjustForm(false)}>취소</button>
                    <button type="button" className={drawer.editConfirm} onClick={submitAdjustment} disabled={!adjAmount || !adjReason.trim()}>추가</button>
                  </div>
                </div>
              ) : (
                <button type="button" className={styles.addAdjustBtn} onClick={() => setShowAdjustForm(true)}>+ 조정 항목</button>
              )
            )}

            <div className={drawer.sectionTitleLoose}>환불 수단</div>
            <div className={styles.balanceGrid}>
              <div className={styles.balanceCell}><div className={styles.balanceLabel}>결제수단</div><div className={styles.balanceValue}>{refund.paymentMethod}</div></div>
              <div className={styles.balanceCell}><div className={styles.balanceLabel}>원 결제금액</div><div className={styles.balanceValue}>{fmtWon(refund.originalPaymentAmount)}</div></div>
              <div className={styles.balanceCell}><div className={styles.balanceLabel}>기존 환불</div><div className={styles.balanceValue}>{fmtWon(prior)}</div></div>
              <div className={styles.balanceCell}><div className={styles.balanceLabel}>환불 가능 잔액</div><div className={styles.balanceValue}>{fmtWon(balance)}</div></div>
              <div className={`${styles.balanceCell} ${styles.highlight}`}><div className={styles.balanceLabel}>이번 환불</div><div className={styles.balanceValue}>{fmtWon(finalAmount)}</div></div>
            </div>
            {finalAmount > balance && (
              <div className={`${styles.statusBanner} ${styles.bannerDanger}`}>
                <strong>⚠ 환불 가능 잔액 초과</strong>
                <span>이번 환불 예정금액이 환불 가능 잔액을 초과합니다. 조정 항목을 확인해 주세요.</span>
              </div>
            )}
          </>
        )}

        {tab === 'review' && (
          <>
            <div className={drawer.sectionTitle}>환불 검토</div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>주문 상태</span><span className={styles.summaryValue}>{refund.orderStatus}</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>반품 상태</span><span className={styles.summaryValue}>{refund.returnStatus ?? '해당 없음'}</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>상품 검수</span><span className={styles.summaryValue}>{refund.inspectionResult ?? '해당 없음'}</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>환불 예정금액</span><span className={styles.summaryValue}>{fmtWon(finalAmount)}</span></div>
            </div>

            {(refund.status === '요청' || refund.status === '검토중') && (
              <>
                <div className={drawer.sectionTitleLoose}>환불 승인 확인</div>
                <div className={styles.checklist}>
                  {checklist.map((c) => (
                    <div key={c.label} className={`${styles.checklistItem} ${c.pass ? styles.checklistPass : styles.checklistFail}`}>
                      <span className={styles.checklistIcon}>{c.pass ? '✓' : '⚠'}</span>
                      <div className={styles.checklistBody}>
                        <span className={styles.checklistLabel}>{c.label}</span>
                        {c.detail && <span className={styles.checklistDetail}>{c.detail}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {refund.status === '승인' && (
              <div className={`${styles.statusBanner} ${styles.bannerInfo}`}>
                <strong>승인 완료</strong>
                <span>{refund.approvedAt} · {refund.approvedBy} 승인. '환불 실행'을 누르면 결제수단으로 실제 환불 요청이 전송됩니다.</span>
                {refund.approvalMemo && <span>메모: {refund.approvalMemo}</span>}
              </div>
            )}

            {(refund.status === '처리중' || refund.status === '완료' || refund.status === '실패') && (
              <>
                <div className={drawer.sectionTitleLoose}>환불 실행</div>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>PG 거래번호</span><span className={styles.summaryValue}>{refund.pgTxId ?? '-'}</span></div>
                  <div className={styles.summaryRow}><span className={styles.summaryLabel}>요청일시</span><span className={styles.summaryValue}>{refund.executedAt ?? '-'}</span></div>
                </div>
              </>
            )}

            {refund.status === '완료' && (
              <div className={`${styles.statusBanner} ${styles.bannerOk}`}>
                <strong>환불 완료</strong>
                <span>처리 완료일 {refund.completedAt} · 외부 환불번호 {refund.externalRefundNo}</span>
              </div>
            )}

            {refund.status === '실패' && (
              <div className={`${styles.statusBanner} ${styles.bannerDanger}`}>
                <strong>환불 실패</strong>
                <span>실패일 {refund.failedAt} · 실패코드 {refund.failCode}</span>
                <span>사유: {refund.failReason}</span>
              </div>
            )}

            {refund.status === '반려' && (
              <div className={`${styles.statusBanner} ${styles.bannerWarn}`}>
                <strong>환불 반려</strong>
                <span>반려일 {refund.rejectedAt} · 처리자 {refund.rejectedBy}</span>
                <span>사유: {refund.rejectReason}{refund.rejectDetail ? ` · ${refund.rejectDetail}` : ''}</span>
                <span>고객 안내: {refund.notifyCustomer ? '알림 발송됨' : '미발송'}</span>
              </div>
            )}
          </>
        )}

        {tab === 'memo' && (
          <>
            <div className={drawer.memoInputRow}>
              <input className={drawer.memoInput} value={memoText} onChange={(e) => setMemoText(e.target.value)} placeholder="관리자 메모 입력 (고객에게 노출되지 않습니다)" />
              <button type="button" className={drawer.memoSubmit} onClick={() => { if (memoText.trim()) { onAddMemo(memoText.trim()); setMemoText(''); } }}>등록</button>
            </div>
            {refund.memos.length === 0 ? (
              <div className={drawer.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              refund.memos.slice().reverse().map((m) => (
                <div key={m.id} className={drawer.memoItem}>
                  <div className={drawer.memoWhen}>{m.at} · {m.by}</div>
                  <div className={drawer.memoText}>{m.text}</div>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'history' && (
          refund.history.length === 0 ? (
            <div className={drawer.emptyInline}>처리 이력이 없습니다.</div>
          ) : (
            refund.history.slice().reverse().map((h) => (
              <div key={h.id} className={drawer.timelineItem}>
                <span className={drawer.timelineDot} />
                <div className={drawer.timelineBody}>
                  <div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{h.action}</strong><span className={drawer.timelineWhen}>{h.at}</span></div>
                  <div className={drawer.timelineDetail}>{h.by}{h.before && h.after ? ` · ${h.before} → ${h.after}` : h.after ? ` · ${h.after}` : ''}</div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </aside>
  );
}
