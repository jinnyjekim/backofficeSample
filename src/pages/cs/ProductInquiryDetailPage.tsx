import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pageStyles from '../ops/opsShared.module.css';
import styles from '../ops/opsDrawerShared.module.css';
import {
  PRODUCT_INQUIRIES,
  STATUS_META,
  TODAY,
  computeIssues,
  productName,
  type Answer,
  type ProductInquiry,
} from './productInquiriesData';

// PRODUCT_INQUIRIES is mutated in place (not spread into new objects) so that
// navigating back to the list page — a separate route/mount, per spec's own
// recommendation to use a page rather than a Drawer here — still reflects
// answer/hide changes made on this page, without needing a shared store.
function persist(q: ProductInquiry, patch: Partial<ProductInquiry>) {
  Object.assign(q, patch);
}

export function ProductInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const found = PRODUCT_INQUIRIES.find((q) => q.id === id) ?? null;
  const [, setVersion] = useState(0);
  const [answerText, setAnswerText] = useState(found?.answer?.content ?? '');
  const [editingAnswer, setEditingAnswer] = useState(!found?.answer);
  const [memoText, setMemoText] = useState('');
  const [confirmSend, setConfirmSend] = useState(false);
  const [toast, setToast] = useState('');

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  if (!found) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.headTop}>
          <div className={pageStyles.title}>상품 문의</div>
          <div className={pageStyles.subtitle}>존재하지 않는 문의입니다.</div>
          <button type="button" className={styles.actionLink} style={{ marginTop: 12 }} onClick={() => navigate('/cs/product-inquiries')}>목록으로</button>
        </div>
      </div>
    );
  }

  const q = found;
  const sm = STATUS_META[q.status];
  const issues = computeIssues(q);

  function refresh() {
    setVersion((v) => v + 1);
  }

  function submitAnswer() {
    if (!answerText.trim()) return;
    setConfirmSend(true);
  }

  function confirmSendAnswer() {
    const now = `${TODAY} 15:00`;
    const isEdit = !!q.answer;
    const before = q.answer?.content ?? null;
    const answer: Answer = { content: answerText.trim(), by: 'admin01', at: now };
    persist(q, {
      answer,
      status: '답변 완료',
      answerHistory: [...q.answerHistory, { id: `AH-${Date.now()}`, at: now, by: 'admin01', action: isEdit ? '답변 수정' : '답변 등록', before, after: answer.content }],
    });
    setEditingAnswer(false);
    setConfirmSend(false);
    toastBriefly(isEdit ? '답변을 수정했습니다.' : '답변을 등록했습니다.');
    refresh();
  }

  function addMemo() {
    if (!memoText.trim()) return;
    persist(q, { memos: [...q.memos, { id: `M-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', text: memoText.trim() }] });
    setMemoText('');
    refresh();
  }

  function toggleHidden() {
    persist(q, { hidden: !q.hidden });
    toastBriefly(q.hidden ? '문의를 복원했습니다.' : '문의를 숨김 처리했습니다.');
    refresh();
  }

  return (
    <div className={pageStyles.page}>
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', padding: '22px 24px 40px' }}>
        <button type="button" className={styles.actionLink} onClick={() => navigate('/cs/product-inquiries')}>← 목록으로</button>

        <div style={{ marginTop: 16 }}>
          <div className={styles.eyebrow}>상품 문의 · {q.id}</div>
          <div className={styles.titleRow}>
            <span className={styles.title} style={{ fontSize: 19 }}>{q.title}</span>
            <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{q.status}</span>
            {q.visibility === '비공개' && <span className={styles.badge} style={{ background: '#f4f4f5', color: '#71717a' }}>🔒 비공개</span>}
            {q.hidden && <span className={styles.badge} style={{ background: '#fef2f2', color: '#b91c1c' }}>숨김 처리됨</span>}
          </div>
          <div className={styles.sub}>{q.member} · {q.createdAt}</div>
        </div>

        {issues.length > 0 && (
          <div className={styles.editPanel} style={{ marginTop: 12, background: '#fffbeb', borderColor: '#fde68a' }}>
            {issues.map((issue) => (
              <div key={issue} style={{ fontSize: 12, color: '#92400e' }}>⚠ {issue}</div>
            ))}
          </div>
        )}

        <div className={styles.actionRow}>
          <button type="button" className={styles.actionLink} onClick={() => window.scrollTo({ top: 99999, behavior: 'smooth' })}>답변 이력 보기</button>
          <div className={styles.spacer} />
          <button type="button" className={q.hidden ? styles.actionLink : styles.dangerBtn} onClick={toggleHidden}>{q.hidden ? '숨김 해제' : '문의 숨김'}</button>
        </div>

        <div style={{ marginTop: 20 }}>
          <div className={styles.sectionTitle}>문의 정보</div>
          <div className={styles.fieldBox}>
            <div className={styles.fieldRow}><span className={styles.fieldLabel}>문의번호</span><span className={styles.fieldValue}>{q.id}</span></div>
            <div className={styles.fieldRow}><span className={styles.fieldLabel}>답변 상태</span><span className={styles.fieldValue}>{q.status}</span></div>
            <div className={styles.fieldRow}><span className={styles.fieldLabel}>문의 유형</span><span className={styles.fieldValue}>{q.inquiryType}</span></div>
            <div className={styles.fieldRow}><span className={styles.fieldLabel}>등록일</span><span className={styles.fieldValue}>{q.createdAt}</span></div>
            <div className={styles.fieldRow}><span className={styles.fieldLabel}>공개 여부</span><span className={styles.fieldValue}>{q.visibility}</span></div>
          </div>

          <div className={styles.sectionTitleLoose}>상품 정보</div>
          <div className={styles.linkedItem}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{productName(q.productCode)}</div>
              <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>{q.productCode}</div>
            </div>
            <button type="button" className={styles.actionLink} onClick={() => navigate('/products')}>상품 상세 보기</button>
          </div>

          <div className={styles.sectionTitleLoose}>작성자 정보</div>
          <div className={styles.linkedItem}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{q.member}</div>
            <button type="button" className={styles.actionLink} onClick={() => navigate('/members')}>회원 상세 보기</button>
          </div>

          <div className={styles.sectionTitleLoose}>문의 내용</div>
          <div className={styles.bodyText}>{q.content}</div>
          {q.attachments.length > 0 && (
            <div className={styles.attachList}>
              {q.attachments.map((a) => (
                <div key={a.id} className={styles.attachItem}>
                  <span className={styles.attachName}>📎 {a.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.sectionTitleLoose}>답변</div>
          {q.answer && !editingAnswer ? (
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>답변 관리자</span><span className={styles.fieldValue}>{q.answer.by}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>답변일</span><span className={styles.fieldValue}>{q.answer.at}</span></div>
              <div style={{ padding: '12px', fontSize: 12.5, color: '#3f3f46', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{q.answer.content}</div>
            </div>
          ) : null}
          {(!q.answer || editingAnswer) && (
            <>
              <textarea className={styles.formTextarea} style={{ height: 110 }} value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="답변 내용을 입력해 주세요." />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="button" className={styles.editConfirm} onClick={submitAnswer}>{q.answer ? '답변 수정' : '답변 등록'}</button>
                {q.answer && <button type="button" className={styles.editCancel} onClick={() => { setEditingAnswer(false); setAnswerText(q.answer!.content); }}>취소</button>}
              </div>
            </>
          )}
          {q.answer && !editingAnswer && (
            <button type="button" className={styles.actionLink} style={{ marginTop: 10 }} onClick={() => setEditingAnswer(true)}>답변 수정</button>
          )}

          <div className={styles.sectionTitleLoose}>관리자 메모</div>
          <div className={styles.memoInputRow}>
            <input className={styles.memoInput} placeholder="내부 메모를 입력해 주세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
            <button type="button" className={styles.memoSubmit} onClick={addMemo}>등록</button>
          </div>
          {q.memos.length === 0 ? (
            <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
          ) : (
            q.memos.map((m) => (
              <div key={m.id} className={styles.memoItem}>
                <div className={styles.memoWhen}>{m.at} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))
          )}

          <div className={styles.sectionTitleLoose}>답변 이력</div>
          {q.answerHistory.length === 0 ? (
            <div className={styles.emptyInline}>답변 이력이 없습니다.</div>
          ) : (
            q.answerHistory.slice().reverse().map((h) => (
              <div key={h.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.at}</span>
                  </div>
                  <div className={styles.timelineDetail}>{h.by}</div>
                  {h.before && <div className={styles.timelineDetail}>변경 전: {h.before}</div>}
                  <div className={styles.timelineDetail}>{h.before ? '변경 후: ' : ''}{h.after}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmSend && (
        <div className={pageStyles.dialogOverlay}>
          <div className={pageStyles.dialogBox}>
            <div className={pageStyles.dialogTitle}>답변을 {q.answer ? '수정' : '등록'}하시겠습니까?</div>
            <div className={pageStyles.dialogBody}>{q.answer ? '수정한' : '등록한'} 답변이 사용자에게 노출됩니다.</div>
            <div className={pageStyles.dialogActions}>
              <button type="button" className={pageStyles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirmSend(false)}>취소</button>
              <button type="button" className={pageStyles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmSendAnswer}>{q.answer ? '답변 수정' : '답변 등록'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
