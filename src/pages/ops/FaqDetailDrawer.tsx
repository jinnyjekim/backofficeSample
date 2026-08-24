import { useState } from 'react';
import styles from './opsDrawerShared.module.css';
import { FAQ_STATUS_META, computeStatus, fmtRange, needsReview, type Faq } from './faqData';

const TABS: { key: string; label: string }[] = [
  { key: 'summary', label: '기본 정보' },
  { key: 'content', label: '질문 · 답변' },
  { key: 'expose', label: '노출 설정' },
  { key: 'usage', label: '사용 현황' },
  { key: 'history', label: '메모 · 이력' },
];

interface Props {
  faq: Faq;
  allFaqs: Faq[];
  onClose: () => void;
  onEdit: () => void;
  onPublishNow: () => void;
  onCancelSchedule: () => void;
  onHideNow: () => void;
  onRequestRepost: () => void;
  onDuplicate: () => void;
  onRequestDelete: () => void;
  onAddMemo: (text: string) => void;
}

export function FaqDetailDrawer({
  faq,
  allFaqs,
  onClose,
  onEdit,
  onPublishNow,
  onCancelSchedule,
  onHideNow,
  onRequestRepost,
  onDuplicate,
  onRequestDelete,
  onAddMemo,
}: Props) {
  const [activeTab, setActiveTab] = useState('summary');
  const [memoText, setMemoText] = useState('');

  const status = computeStatus(faq);
  const sm = FAQ_STATUS_META[status];
  const review = needsReview(faq);
  const canDelete = status === '비공개' && !faq.startAt && faq.views === 0;
  const total = faq.helpful + faq.unhelpful;
  const helpfulRate = total > 0 ? ((faq.helpful / total) * 100).toFixed(1) : '-';

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
            <div className={styles.eyebrow}>운영 관리 · FAQ · {faq.id}</div>
            <div className={styles.titleRow}>
              {faq.important && <span className={styles.badge} style={{ background: '#fef3c7', color: '#b45309' }}>중요</span>}
              <span className={styles.title}>Q. {faq.question}</span>
            </div>
            <div className={styles.sub}>{faq.category} · 순서 {faq.order} · {fmtRange(faq)}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {review.flag && <div className={styles.issueBanner}>⚠ 검토 필요 · {review.reasons.join(' · ')}</div>}

        <div className={styles.actionRow}>
          <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{status}</span>
          <div className={styles.spacer} />
          {status !== '게시종료' && (
            <button type="button" className={styles.actionLink} onClick={onEdit}>수정</button>
          )}
          {status === '비공개' && (
            <button type="button" className={styles.primaryBtn} onClick={onPublishNow}>공개</button>
          )}
          {status === '공개예정' && (
            <button type="button" className={styles.actionLink} onClick={onCancelSchedule}>예약 취소</button>
          )}
          {status === '공개중' && (
            <button type="button" className={styles.actionLink} onClick={onHideNow}>비공개</button>
          )}
          {status === '게시종료' && (
            <button type="button" className={styles.primaryBtn} onClick={onRequestRepost}>재게시</button>
          )}
          <button type="button" className={styles.actionLink} onClick={onDuplicate}>복제</button>
          {canDelete && (
            <button type="button" className={styles.dangerBtn} onClick={onRequestDelete}>삭제</button>
          )}
        </div>

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {activeTab === 'summary' && (
          <div>
            <div className={styles.sectionTitle}>기본 정보</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>FAQ 번호</span><span className={styles.fieldValue}>{faq.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>카테고리</span><span className={styles.fieldValue}>{faq.category}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>상태</span><span className={styles.fieldValue}>{status}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>중요 FAQ</span><span className={styles.fieldValue}>{faq.important ? '사용' : '미사용'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 순서</span><span className={styles.fieldValue}>{faq.order}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 대상</span><span className={styles.fieldValue}>{faq.target}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>등록자</span><span className={styles.fieldValue}>{faq.author} · {faq.createdAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 수정</span><span className={styles.fieldValue}>{faq.updatedBy} · {faq.updatedAt}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className={styles.sectionTitle}>질문</div>
            <div className={styles.bodyText}>{faq.question}</div>
            <div className={styles.sectionTitle}>답변</div>
            <div className={styles.bodyText}>{faq.answer}</div>

            <div className={styles.sectionTitle}>관련 FAQ</div>
            {faq.relatedFaqIds.length === 0 && <div className={styles.emptyInline}>연결된 FAQ가 없습니다</div>}
            {faq.relatedFaqIds.map((id) => {
              const r = allFaqs.find((f) => f.id === id);
              return r ? <div className={styles.linkedItem} key={id}><span>{r.question}</span></div> : null;
            })}

            <div className={styles.sectionTitle}>관련 페이지</div>
            {faq.relatedLinks.length === 0 && <div className={styles.emptyInline}>연결된 페이지가 없습니다</div>}
            {faq.relatedLinks.map((l, i) => (
              <div className={styles.linkedItem} key={i}>
                <span>{l.label}</span>
                <a href="#" onClick={(e) => e.preventDefault()}>{l.url}</a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'expose' && (
          <div>
            <div className={styles.sectionTitle}>검색 키워드</div>
            {faq.keywords.length === 0 && <div className={styles.emptyInline}>등록된 검색 키워드가 없습니다</div>}
            {faq.keywords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                {faq.keywords.map((k) => (
                  <span key={k} className={styles.badge} style={{ background: '#f4f4f5', color: '#3f3f46' }}>{k}</span>
                ))}
              </div>
            )}
            <div className={styles.sectionTitle}>공개 설정</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>공개 시작</span><span className={styles.fieldValue}>{faq.startAt ?? '미설정'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>공개 종료</span><span className={styles.fieldValue}>{faq.endAt ?? '종료일 없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 대상</span><span className={styles.fieldValue}>{faq.target}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div>
            <div className={styles.sectionTitle}>사용 현황</div>
            <div className={styles.statGrid}>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>조회수</div>
                <div className={styles.statValue}>{faq.views.toLocaleString('ko-KR')}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>도움됨</div>
                <div className={styles.statValue} style={{ color: '#059669' }}>{faq.helpful.toLocaleString('ko-KR')}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>도움안됨</div>
                <div className={styles.statValue} style={{ color: faq.unhelpful > 0 ? '#dc2626' : undefined }}>{faq.unhelpful.toLocaleString('ko-KR')}</div>
              </div>
            </div>
            <div className={styles.sectionTitle}>도움됨 비율 {helpfulRate}{helpfulRate !== '-' ? '%' : ''}</div>
            {review.flag && (
              <div className={styles.issueBanner}>⚠ 검토 필요 사유 — {review.reasons.join(' · ')}</div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {faq.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            {faq.memos.length === 0 && <div className={styles.emptyInline}>등록된 메모가 없습니다</div>}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {faq.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.title}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
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
