import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { fmtWon } from './promotionsData';
import { APPLY_STATUS_META, computeIssues, type Memo, type PromotionApplication } from './applicationsData';

const TABS = [
  { key: 'summary', label: '기본 정보' },
  { key: 'products', label: '적용 상품 · 계산' },
  { key: 'stack', label: '중복 · 쿠폰' },
  { key: 'refund', label: '취소 · 환불' },
  { key: 'history', label: '메모 · 이력' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  app: PromotionApplication;
  onClose: () => void;
  onAddMemo: (text: string) => void;
}

export function ApplicationDetailDrawer({ app: a, onClose, onAddMemo }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [memoText, setMemoText] = useState('');

  const sm = APPLY_STATUS_META[a.status];
  const issues = computeIssues(a);

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(memoText.trim());
    setMemoText('');
  }

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>프로모션 관리 · 적용 이력 · {a.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{a.promotionNameSnapshot}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{a.status}</span>
              {issues.length > 0 && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 확인 필요</span>}
            </div>
            <div className={styles.sub}>주문 {a.orderId} · {a.member} · {a.appliedAt}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {issues.length > 0 && (
          <div className={styles.editPanel} style={{ marginTop: 12, background: '#fffbeb', borderColor: '#fde68a' }}>
            <div className={styles.editTitle} style={{ color: '#b45309' }}>확인이 필요합니다</div>
            {issues.map((issue) => (
              <div key={issue} style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>⚠ {issue}</div>
            ))}
          </div>
        )}

        <div className={styles.actionRow}>
          <Link to={`/promotions?code=${a.promotionCode}`} className={styles.actionLink} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            프로모션 보기
          </Link>
          <div className={styles.spacer} />
        </div>

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.key} type="button" className={`${styles.tabBtn} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {tab === 'summary' && (
          <div>
            <div className={styles.sectionTitle}>기본 정보</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>적용번호</span><span className={styles.fieldValue}>{a.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션</span><span className={styles.fieldValue}>{a.promotionNameSnapshot}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션 코드</span><span className={styles.fieldValue}>{a.promotionCode}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션 Version</span><span className={styles.fieldValue}>V{a.promotionVersion}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>주문번호</span><span className={styles.fieldValue}>{a.orderId}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>회원</span><span className={styles.fieldValue}>{a.member}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>적용일</span><span className={styles.fieldValue}>{a.appliedAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>적용 상태</span><span className={styles.fieldValue}>{a.status}</span></div>
            </div>

            <div className={styles.sectionTitleLoose}>적용 조건 Snapshot</div>
            <div className={styles.emptyInline} style={{ marginBottom: 8 }}>현재 프로모션 설정이 바뀌어도 아래 값은 적용 당시 그대로 유지됩니다.</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>적용 단위</span><span className={styles.fieldValue}>{a.conditionSnapshot.applyUnit}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인 방식</span><span className={styles.fieldValue}>{a.conditionSnapshot.discountMethod}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인 값</span><span className={styles.fieldValue}>{a.conditionSnapshot.discountMethod === '정률' ? `${a.conditionSnapshot.discountValue}%` : fmtWon(a.conditionSnapshot.discountValue)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최대 할인금액</span><span className={styles.fieldValue}>{a.conditionSnapshot.maxDiscountAmount > 0 ? fmtWon(a.conditionSnapshot.maxDiscountAmount) : '제한 없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최소 구매금액</span><span className={styles.fieldValue}>{a.conditionSnapshot.minPurchaseAmount > 0 ? fmtWon(a.conditionSnapshot.minPurchaseAmount) : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션 중복</span><span className={styles.fieldValue}>{a.conditionSnapshot.stackPromotion}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 중복</span><span className={styles.fieldValue}>{a.conditionSnapshot.stackCoupon}</span></div>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div>
            <div className={styles.sectionTitle}>적용 대상</div>
            {a.appliedProducts.length === 0 ? (
              <div className={styles.emptyInline}>주문 전체에 적용되었습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {a.appliedProducts.map((row) => (
                  <div className={styles.fieldRow} key={row.productCode}>
                    <span className={styles.fieldLabel}>{row.productName} × {row.qty}</span>
                    <span className={styles.fieldValue}>{fmtWon(row.baseAmount)} · -{fmtWon(row.discountAmount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.sectionTitleLoose}>할인 계산 근거</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>주문 총 상품금액</span><span className={styles.fieldValue}>{fmtWon(a.orderTotalAmount)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인 계산 기준금액</span><span className={styles.fieldValue}>{fmtWon(a.baseAmount)}</span></div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>할인 방식</span>
                <span className={styles.fieldValue}>
                  {a.conditionSnapshot.discountMethod === '정률' ? `정률 ${a.conditionSnapshot.discountValue}%` : `정액 ${fmtWon(a.conditionSnapshot.discountValue)}`}
                </span>
              </div>
              {a.conditionSnapshot.discountMethod === '정률' && a.conditionSnapshot.maxDiscountAmount > 0 && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>최대 할인금액 적용</span><span className={styles.fieldValue}>{fmtWon(a.conditionSnapshot.maxDiscountAmount)}</span></div>
              )}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최초 할인금액</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtWon(a.discountAmount)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>현재 유효 할인금액</span><span className={styles.fieldValue} style={{ fontWeight: 700, color: a.currentDiscountAmount !== a.discountAmount ? '#dc2626' : undefined }}>{fmtWon(a.currentDiscountAmount)}</span></div>
            </div>
          </div>
        )}

        {tab === 'stack' && (
          <div>
            <div className={styles.sectionTitle}>중복 적용된 다른 프로모션</div>
            {a.stackedWith.length === 0 ? (
              <div className={styles.emptyInline}>중복 적용된 다른 프로모션이 없습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {a.stackedWith.map((s) => (
                  <div className={styles.fieldRow} key={s.promotionCode}>
                    <span className={styles.fieldLabel}>{s.promotionName} · {s.promotionCode}</span>
                    <span className={styles.fieldValue}>-{fmtWon(s.discountAmount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.sectionTitleLoose}>쿠폰</div>
            {a.couponCode ? (
              <div className={styles.fieldBox}>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰</span><span className={styles.fieldValue}>{a.couponCode}</span></div>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 할인</span><span className={styles.fieldValue}>-{fmtWon(a.couponDiscountAmount)}</span></div>
              </div>
            ) : (
              <div className={styles.emptyInline}>함께 사용된 쿠폰이 없습니다.</div>
            )}
          </div>
        )}

        {tab === 'refund' && (
          <div>
            <div className={styles.sectionTitle}>취소 · 환불 연계</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최초 할인</span><span className={styles.fieldValue}>{fmtWon(a.discountAmount)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>현재 유효 할인</span><span className={styles.fieldValue}>{fmtWon(a.currentDiscountAmount)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>적용 상태</span><span className={styles.fieldValue}>{a.status}</span></div>
            </div>
            {a.refundId ? (
              <div className={styles.linkedItem}>
                <span>{a.refundId} · 환불금액 {fmtWon(a.refundAmount ?? 0)}</span>
                <span style={{ color: '#a1a1aa' }}>주문/환불 상세는 별도 메뉴에서 확인</span>
              </div>
            ) : (
              <div className={styles.emptyInline}>연결된 환불이 없습니다.</div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {a.memos.length === 0 ? (
              <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              a.memos.map((m: Memo) => (
                <div key={m.id} className={styles.memoItem}>
                  <div className={styles.memoWhen}>{m.at} · {m.by}</div>
                  <div className={styles.memoText}>{m.text}</div>
                </div>
              ))
            )}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {a.history.map((h) => (
              <div key={h.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.at}</span>
                  </div>
                  {h.before && h.after && <div className={styles.timelineDetail}>{h.before} → {h.after}</div>}
                  <div className={styles.timelineDetail}>{h.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
