import { useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { EXPOSURE_META, computeIssues, pendingReportCount, productName, type Memo, type Review } from './reviewsData';

const TABS = [
  { key: 'content', label: '리뷰 내용' },
  { key: 'author', label: '작성자 · 주문' },
  { key: 'reports', label: '신고 내역' },
  { key: 'reply', label: '관리자 답변' },
  { key: 'history', label: '메모 · 이력' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  review: Review;
  onClose: () => void;
  onHide: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onSaveReply: (text: string) => void;
  onDeleteReply: () => void;
  onAddMemo: (text: string) => void;
}

function Stars({ rating }: { rating: number }) {
  return <span style={{ color: '#f59e0b', letterSpacing: 1 }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

export function ReviewDetailDrawer({ review: r, onClose, onHide, onRestore, onDelete, onSaveReply, onDeleteReply, onAddMemo }: Props) {
  const [tab, setTab] = useState<Tab>('content');
  const [memoText, setMemoText] = useState('');
  const [replyText, setReplyText] = useState(r.adminReply?.text ?? '');

  const sm = EXPOSURE_META[r.exposure];
  const issues = computeIssues(r);
  const pending = pendingReportCount(r);

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
            <div className={styles.eyebrow}>리뷰 관리 · {r.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{productName(r.productCode)}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{r.exposure}</span>
              {r.moderationStatus === '검토 필요' && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 검토 필요</span>}
            </div>
            <div className={styles.sub}><Stars rating={r.rating} /> · {r.member} · {r.orderId ? '구매 인증' : '비구매'}</div>
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
          {r.exposure === '노출' && <button type="button" className={styles.actionLink} onClick={onHide}>비노출</button>}
          {r.exposure === '비노출' && <button type="button" className={styles.actionLink} onClick={onRestore}>노출 복원</button>}
          <div className={styles.spacer} />
          {r.exposure !== '삭제' && <button type="button" className={styles.dangerBtn} onClick={onDelete}>삭제 처리</button>}
        </div>

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.key} type="button" className={`${styles.tabBtn} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
              {t.label}{t.key === 'reports' && pending > 0 ? ` (${pending})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {tab === 'content' && (
          <div>
            <div className={styles.sectionTitle}>리뷰 내용</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>평점</span><span className={styles.fieldValue}><Stars rating={r.rating} /> ({r.rating}.0)</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>작성일</span><span className={styles.fieldValue}>{r.createdAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>수정일</span><span className={styles.fieldValue}>{r.updatedAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>첨부 이미지</span><span className={styles.fieldValue}>{r.imageCount}개</span></div>
            </div>
            <div className={styles.bodyText}>{r.content}</div>
            {r.exposure === '비노출' && r.hideReason && (
              <>
                <div className={styles.sectionTitleLoose}>비노출 사유</div>
                <div className={styles.fieldBox}>
                  <div className={styles.fieldRow}><span className={styles.fieldLabel}>사유</span><span className={styles.fieldValue}>{r.hideReason}</span></div>
                  {r.hideDetail && <div className={styles.fieldRow}><span className={styles.fieldLabel}>상세</span><span className={styles.fieldValue}>{r.hideDetail}</span></div>}
                </div>
              </>
            )}
            {r.exposure === '삭제' && r.deleteReason && (
              <>
                <div className={styles.sectionTitleLoose}>삭제 사유</div>
                <div className={styles.fieldBox}>
                  <div className={styles.fieldRow}><span className={styles.fieldLabel}>사유</span><span className={styles.fieldValue}>{r.deleteReason}</span></div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'author' && (
          <div>
            <div className={styles.sectionTitle}>작성자 정보</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>회원</span><span className={styles.fieldValue}>{r.member}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>구매 인증</span><span className={styles.fieldValue}>{r.orderId ? '구매자' : '비구매자'}</span></div>
            </div>
            <div className={styles.sectionTitleLoose}>상품 / 주문</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>상품</span><span className={styles.fieldValue}>{productName(r.productCode)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>상품 코드</span><span className={styles.fieldValue}>{r.productCode}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>관련 주문</span><span className={styles.fieldValue}>{r.orderId ?? '연결된 주문 없음'}</span></div>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div>
            <div className={styles.sectionTitle}>신고 현황</div>
            <div className={styles.statGrid}>
              <div className={styles.statCell}><div className={styles.statLabel}>총 신고</div><div className={styles.statValue}>{r.reports.length}건</div></div>
              <div className={styles.statCell}><div className={styles.statLabel}>미처리</div><div className={styles.statValue}>{pending}건</div></div>
              <div className={styles.statCell}><div className={styles.statLabel}>처리 완료</div><div className={styles.statValue}>{r.reports.filter((x) => x.status === '처리 완료' || x.status === '반려').length}건</div></div>
            </div>
            {r.reports.length === 0 ? (
              <div className={styles.emptyInline}>접수된 신고가 없습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {r.reports.map((rep) => (
                  <div className={styles.fieldRow} key={rep.id}>
                    <span className={styles.fieldLabel}>{rep.at.slice(0, 10)} · {rep.type} · {rep.reporter}</span>
                    <span className={styles.fieldValue}>{rep.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reply' && (
          <div>
            <div className={styles.sectionTitle}>관리자 답변</div>
            {r.adminReply && (
              <div className={styles.fieldBox} style={{ marginBottom: 12 }}>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>등록일</span><span className={styles.fieldValue}>{r.adminReply.at}</span></div>
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>작성자</span><span className={styles.fieldValue}>{r.adminReply.by}</span></div>
              </div>
            )}
            <textarea className={styles.formTextarea} style={{ height: 100, marginBottom: 8 }} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="리뷰에 대한 답변을 입력하세요" />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={styles.editConfirm} onClick={() => replyText.trim() && onSaveReply(replyText.trim())}>{r.adminReply ? '답변 수정' : '답변 등록'}</button>
              {r.adminReply && <button type="button" className={styles.editCancel} onClick={() => { onDeleteReply(); setReplyText(''); }}>답변 삭제</button>}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {r.memos.length === 0 ? (
              <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              r.memos.map((m: Memo) => (
                <div key={m.id} className={styles.memoItem}>
                  <div className={styles.memoWhen}>{m.at} · {m.by}</div>
                  <div className={styles.memoText}>{m.text}</div>
                </div>
              ))
            )}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {r.history.slice().reverse().map((h) => (
              <div key={h.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.at}</span>
                  </div>
                  {h.detail && <div className={styles.timelineDetail}>{h.detail}</div>}
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
