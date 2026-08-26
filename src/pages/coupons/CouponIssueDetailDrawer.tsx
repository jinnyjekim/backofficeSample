import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../ops/opsDrawerShared.module.css';
import { fmtWon } from './couponsData';
import { HOLDER_STATUS_META, computeIssues, computeStatus, type CouponIssue, type Memo } from './couponIssuesData';

const TABS = [
  { key: 'summary', label: '기본 정보' },
  { key: 'benefit', label: '혜택 Snapshot' },
  { key: 'usage', label: '사용 정보' },
  { key: 'revoke', label: '회수 정보' },
  { key: 'history', label: '메모 · 이력' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  issue: CouponIssue;
  onClose: () => void;
  onRequestRevoke: () => void;
  onAddMemo: (text: string) => void;
}

export function CouponIssueDetailDrawer({ issue: h, onClose, onRequestRevoke, onAddMemo }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [memoText, setMemoText] = useState('');

  const status = computeStatus(h);
  const sm = HOLDER_STATUS_META[status];
  const issues = computeIssues(h);

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(memoText.trim());
    setMemoText('');
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>쿠폰 관리 · 쿠폰 발급 관리 · {h.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{h.couponNameSnapshot}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{status}</span>
              {issues.length > 0 && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 확인 필요</span>}
            </div>
            <div className={styles.sub}>{h.member} · {h.couponCode} · 만료 {h.expiresAt.slice(0, 10).replaceAll('-', '.')}</div>
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
          <Link to={`/coupons?code=${h.couponCode}`} className={styles.actionLink} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            쿠폰 정책 보기
          </Link>
          <Link to={`/members?q=${h.member}`} className={styles.actionLink} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            회원 보기
          </Link>
          <div className={styles.spacer} />
          {status === '사용 가능' && <button type="button" className={styles.dangerBtn} onClick={onRequestRevoke}>쿠폰 회수</button>}
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
            <div className={styles.sectionTitle}>발급 정보</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발급번호</span><span className={styles.fieldValue}>{h.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>회원</span><span className={styles.fieldValue}>{h.member}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰</span><span className={styles.fieldValue}>{h.couponNameSnapshot}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 코드</span><span className={styles.fieldValue}>{h.couponCode}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 Version</span><span className={styles.fieldValue}>V{h.couponVersion}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발급 방식</span><span className={styles.fieldValue}>{h.issueMethod}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발급 사유</span><span className={styles.fieldValue}>{h.issueReason}</span></div>
              {h.issueDetail && <div className={styles.fieldRow}><span className={styles.fieldLabel}>상세 사유</span><span className={styles.fieldValue}>{h.issueDetail}</span></div>}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발급 처리자</span><span className={styles.fieldValue}>{h.owner}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발급일</span><span className={styles.fieldValue}>{h.issuedAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>만료일</span><span className={styles.fieldValue}>{h.expiresAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>상태</span><span className={styles.fieldValue}>{status}</span></div>
            </div>
          </div>
        )}

        {tab === 'benefit' && (
          <div>
            <div className={styles.sectionTitle}>쿠폰 혜택 Snapshot</div>
            <div className={styles.emptyInline} style={{ marginBottom: 8 }}>현재 쿠폰 정책이 바뀌어도 아래 값은 발급 당시 그대로 유지됩니다.</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>쿠폰 유형</span><span className={styles.fieldValue}>{h.benefitSnapshot.applyUnit} 쿠폰</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인 방식</span><span className={styles.fieldValue}>{h.benefitSnapshot.discountMethod}</span></div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>할인</span>
                <span className={styles.fieldValue}>{h.benefitSnapshot.discountMethod === '정률' ? `${h.benefitSnapshot.discountValue}%` : fmtWon(h.benefitSnapshot.discountValue)}</span>
              </div>
              {h.benefitSnapshot.discountMethod === '정률' && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>최대 할인금액</span><span className={styles.fieldValue}>{h.benefitSnapshot.maxDiscountAmount > 0 ? fmtWon(h.benefitSnapshot.maxDiscountAmount) : '제한 없음'}</span></div>
              )}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최소 구매금액</span><span className={styles.fieldValue}>{h.benefitSnapshot.minPurchaseAmount > 0 ? fmtWon(h.benefitSnapshot.minPurchaseAmount) : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>사용 대상</span><span className={styles.fieldValue}>{h.benefitSnapshot.targetSummary}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>프로모션 중복</span><span className={styles.fieldValue}>{h.benefitSnapshot.stackPromotion}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>다른 쿠폰 중복</span><span className={styles.fieldValue}>{h.benefitSnapshot.stackCoupon}</span></div>
            </div>
          </div>
        )}

        {tab === 'usage' && (
          <div>
            <div className={styles.sectionTitle}>사용 정보</div>
            {h.usedAt ? (
              <div className={styles.fieldBox}>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>사용일</span><span className={styles.fieldValue}>{h.usedAt}</span></div>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>주문번호</span><span className={styles.fieldValue}>{h.orderId}</span></div>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>할인금액</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtWon(h.discountAmount ?? 0)}</span></div>
              </div>
            ) : (
              <div className={styles.emptyInline}>아직 사용되지 않았습니다.</div>
            )}
          </div>
        )}

        {tab === 'revoke' && (
          <div>
            <div className={styles.sectionTitle}>회수 정보</div>
            {h.revokedAt ? (
              <div className={styles.fieldBox}>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>회수일</span><span className={styles.fieldValue}>{h.revokedAt}</span></div>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>회수 처리자</span><span className={styles.fieldValue}>{h.revokedBy}</span></div>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>회수 사유</span><span className={styles.fieldValue}>{h.revokeReason}</span></div>
                {h.revokeDetail && <div className={styles.fieldRow}><span className={styles.fieldLabel}>상세 사유</span><span className={styles.fieldValue}>{h.revokeDetail}</span></div>}
              </div>
            ) : (
              <div className={styles.emptyInline}>회수된 이력이 없습니다.</div>
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
            {h.memos.length === 0 ? (
              <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              h.memos.map((m: Memo) => (
                <div key={m.id} className={styles.memoItem}>
                  <div className={styles.memoWhen}>{m.at} · {m.by}</div>
                  <div className={styles.memoText}>{m.text}</div>
                </div>
              ))
            )}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {h.history.map((entry) => (
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
