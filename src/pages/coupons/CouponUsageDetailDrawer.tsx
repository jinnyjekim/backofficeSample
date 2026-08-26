import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { fmtWon } from './couponsData';
import { USAGE_STATUS_META, computeIssues, type CouponUsage, type Memo } from './couponUsageData';

const TABS = [
  { key: 'summary', label: '기본 정보' },
  { key: 'calc', label: '할인 계산' },
  { key: 'restore', label: '취소 · 복원' },
  { key: 'history', label: '메모 · 이력' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  usage: CouponUsage;
  onClose: () => void;
  onAddMemo: (text: string) => void;
}

export function CouponUsageDetailDrawer({ usage: u, onClose, onAddMemo }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [memoText, setMemoText] = useState('');

  const sm = USAGE_STATUS_META[u.status];
  const issues = computeIssues(u);

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
            <div className={styles.eyebrow}>쿠폰 관리 · 쿠폰 사용 내역 · {u.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{u.couponNameSnapshot}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{u.status}</span>
              {issues.length > 0 && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 확인 필요</span>}
            </div>
            <div className={styles.sub}>{u.member} · 주문 {u.orderId} · {u.usedAt}</div>
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
          <Link to={`/coupons?code=${u.couponCode}`} className={styles.actionLink} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            쿠폰 정책 보기
          </Link>
          <Link to={`/coupons/issue?issue=${u.issueId}`} className={styles.actionLink} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            발급 상세 보기
          </Link>
          {u.promotionCode && (
            <Link to={`/promotions/history?code=${u.promotionCode}`} className={styles.actionLink} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              프로모션 적용 이력
            </Link>
          )}
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
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>사용번호</span><span className={styles.fieldValue}>{u.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발급번호</span><span className={styles.fieldValue}>{u.issueId}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰</span><span className={styles.fieldValue}>{u.couponNameSnapshot}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 코드</span><span className={styles.fieldValue}>{u.couponCode}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 Version</span><span className={styles.fieldValue}>V{u.couponVersion}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>회원</span><span className={styles.fieldValue}>{u.member}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>주문</span><span className={styles.fieldValue}>{u.orderId}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>사용일</span><span className={styles.fieldValue}>{u.usedAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>현재 상태</span><span className={styles.fieldValue}>{u.status}</span></div>
            </div>

            <div className={styles.sectionTitleLoose}>쿠폰 Snapshot</div>
            <div className={styles.emptyInline} style={{ marginBottom: 8 }}>현재 쿠폰 정책이 바뀌어도 아래 값은 사용 당시 그대로 유지됩니다.</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 유형</span><span className={styles.fieldValue}>{u.benefitSnapshot.applyUnit} 쿠폰</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인 방식</span><span className={styles.fieldValue}>{u.benefitSnapshot.discountMethod}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최소 구매금액</span><span className={styles.fieldValue}>{u.benefitSnapshot.minPurchaseAmount > 0 ? fmtWon(u.benefitSnapshot.minPurchaseAmount) : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션 중복</span><span className={styles.fieldValue}>{u.benefitSnapshot.stackPromotion}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>다른 쿠폰 중복</span><span className={styles.fieldValue}>{u.benefitSnapshot.stackCoupon}</span></div>
            </div>
          </div>
        )}

        {tab === 'calc' && (
          <div>
            <div className={styles.sectionTitle}>할인 계산</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>주문 상품금액</span><span className={styles.fieldValue}>{fmtWon(u.orderAmount)}</span></div>
              {u.promotionCode && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션 할인</span><span className={styles.fieldValue} style={{ color: '#dc2626' }}>-{fmtWon(u.promotionDiscount)}</span></div>
              )}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 적용 기준금액</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtWon(u.baseAmount)}</span></div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>쿠폰 할인 방식</span>
                <span className={styles.fieldValue}>{u.benefitSnapshot.discountMethod === '정률' ? `정률 ${u.benefitSnapshot.discountValue}%` : `정액 ${fmtWon(u.benefitSnapshot.discountValue)}`}</span>
              </div>
              {u.benefitSnapshot.discountMethod === '정률' && u.benefitSnapshot.maxDiscountAmount > 0 && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>최대 할인금액</span><span className={styles.fieldValue}>{fmtWon(u.benefitSnapshot.maxDiscountAmount)}</span></div>
              )}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최소 구매 조건</span><span className={styles.fieldValue}>{u.baseAmount >= u.benefitSnapshot.minPurchaseAmount ? '충족' : '미충족'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최초 쿠폰 할인</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtWon(u.discountAmount)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>현재 유효 할인</span><span className={styles.fieldValue} style={{ fontWeight: 700, color: u.currentDiscountAmount !== u.discountAmount ? '#dc2626' : undefined }}>{fmtWon(u.currentDiscountAmount)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 적용 후 금액</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtWon(u.baseAmount - u.currentDiscountAmount)}</span></div>
            </div>
          </div>
        )}

        {tab === 'restore' && (
          <div>
            <div className={styles.sectionTitle}>취소 · 환불 반영</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>현재 상태</span><span className={styles.fieldValue}>{u.status}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최초 할인</span><span className={styles.fieldValue}>{fmtWon(u.discountAmount)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>현재 유효 할인</span><span className={styles.fieldValue}>{fmtWon(u.currentDiscountAmount)}</span></div>
            </div>

            <div className={styles.sectionTitleLoose}>쿠폰 복원</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>복원 여부</span><span className={styles.fieldValue}>{u.restored ? '복원 완료' : '미복원'}</span></div>
              {u.restored && u.restoredAt && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>복원일</span><span className={styles.fieldValue}>{u.restoredAt}</span></div>
              )}
            </div>
            {u.restoreNote && <div className={styles.emptyInline}>{u.restoreNote}</div>}
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {u.memos.length === 0 ? (
              <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              u.memos.map((m: Memo) => (
                <div key={m.id} className={styles.memoItem}>
                  <div className={styles.memoWhen}>{m.at} · {m.by}</div>
                  <div className={styles.memoText}>{m.text}</div>
                </div>
              ))
            )}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {u.history.map((entry) => (
              <div key={entry.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{entry.action}</span>
                    <span className={styles.timelineWhen}>{entry.at}</span>
                  </div>
                  {entry.detail && <div className={styles.timelineDetail}>{entry.detail}</div>}
                  <div className={styles.timelineDetail}>{entry.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
