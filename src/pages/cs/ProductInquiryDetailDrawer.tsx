import { useRef, useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import pageStyles from '../ops/opsShared.module.css';
import { showToast } from '../../components/common';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  STATUS_META,
  TODAY,
  computeIssues,
  productName,
  type Answer,
  type ProductInquiry,
} from './productInquiriesData';

interface Props {
  inquiry: ProductInquiry;
  onClose: () => void;
  onChange: () => void;
}

export function ProductInquiryDetailDrawer({ inquiry: q, onClose, onChange }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  const [answerText, setAnswerText] = useState(q.answer?.content ?? '');
  const [editingAnswer, setEditingAnswer] = useState(!q.answer);
  const [memoText, setMemoText] = useState('');
  const [confirmSend, setConfirmSend] = useState(false);
  useOutsideClose(asideRef, onClose);

  const sm = STATUS_META[q.status];
  const issues = computeIssues(q);
  const notify = (message: string) => showToast({ message, type: 'success' });

  function update(patch: Partial<ProductInquiry>) {
    Object.assign(q, patch);
    onChange();
  }

  function confirmSendAnswer() {
    const now = `${TODAY} 15:00`;
    const isEdit = Boolean(q.answer);
    const before = q.answer?.content ?? null;
    const answer: Answer = { content: answerText.trim(), by: 'admin01', at: now };
    update({
      answer,
      status: '답변 완료',
      answerHistory: [...q.answerHistory, { id: `AH-${Date.now()}`, at: now, by: 'admin01', action: isEdit ? '답변 수정' : '답변 등록', before, after: answer.content }],
    });
    setEditingAnswer(false);
    setConfirmSend(false);
    notify(isEdit ? '답변을 수정했습니다.' : '답변을 등록했습니다.');
  }

  function addMemo() {
    if (!memoText.trim()) return;
    update({ memos: [...q.memos, { id: `M-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin01', text: memoText.trim() }] });
    setMemoText('');
    notify('관리자 메모를 등록했습니다.');
  }

  function toggleHidden() {
    const nextHidden = !q.hidden;
    update({ hidden: nextHidden });
    notify(nextHidden ? '문의를 숨김 처리했습니다.' : '문의를 복원했습니다.');
  }

  return (
    <aside ref={asideRef} className={drawer.aside} aria-label="상품 문의 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>상품 문의 · {q.id}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{q.title}</h2>
              <span className={drawer.badge} style={{ background: sm.bg, color: sm.fg }}>{q.status}</span>
              {q.visibility === '비공개' && <span className={drawer.badge} style={{ background: '#f4f4f5', color: '#71717a' }}>비공개</span>}
            </div>
            <div className={drawer.sub}>{q.member} · {q.createdAt}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className={drawer.actionRow}>
          <button type="button" className={q.hidden ? drawer.actionLink : drawer.dangerBtn} onClick={toggleHidden}>{q.hidden ? '숨김 해제' : '문의 숨김'}</button>
        </div>
      </div>

      <div className={drawer.scroll}>
        {issues.length > 0 && <div className={drawer.editPanel} style={{ background: '#fffbeb', borderColor: '#fde68a' }}>{issues.map((issue) => <div key={issue} style={{ fontSize: 11, color: '#92400e' }}>⚠ {issue}</div>)}</div>}

        <div className={drawer.sectionTitle}>문의 정보</div>
        <div className={drawer.fieldBox}>
          <Info label="문의번호" value={q.id} />
          <Info label="답변 상태" value={q.status} />
          <Info label="문의 유형" value={q.inquiryType} />
          <Info label="등록일" value={q.createdAt} />
          <Info label="공개 여부" value={q.visibility} />
        </div>

        <div className={drawer.sectionTitleLoose}>상품 정보</div>
        <div className={drawer.linkedItem}><div><strong>{productName(q.productCode)}</strong><div className={drawer.sub}>{q.productCode}</div></div><button type="button" className={drawer.actionLink} onClick={() => window.location.assign('/products')}>상품 상세 보기</button></div>

        <div className={drawer.sectionTitleLoose}>작성자 정보</div>
        <div className={drawer.linkedItem}><strong>{q.member}</strong><button type="button" className={drawer.actionLink} onClick={() => window.location.assign('/members')}>회원 상세 보기</button></div>

        <div className={drawer.sectionTitleLoose}>문의 내용</div>
        <div className={drawer.bodyText}>{q.content}</div>
        {q.attachments.length > 0 && <div className={drawer.attachList}>{q.attachments.map((file) => <div key={file.id} className={drawer.attachItem}><span className={drawer.attachName}>📎 {file.name}</span></div>)}</div>}

        <div className={drawer.sectionTitleLoose}>답변</div>
        {q.answer && !editingAnswer && <div className={drawer.fieldBox}><Info label="답변 관리자" value={q.answer.by} /><Info label="답변일" value={q.answer.at} /><div className={drawer.bodyText}>{q.answer.content}</div></div>}
        {(!q.answer || editingAnswer) && <><textarea className={drawer.formTextarea} style={{ height: 110 }} value={answerText} onChange={(event) => setAnswerText(event.target.value)} placeholder="답변 내용을 입력해 주세요." /><div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button type="button" className={drawer.editConfirm} disabled={!answerText.trim()} onClick={() => setConfirmSend(true)}>{q.answer ? '답변 수정' : '답변 등록'}</button>{q.answer && <button type="button" className={drawer.editCancel} onClick={() => { setEditingAnswer(false); setAnswerText(q.answer?.content ?? ''); }}>취소</button>}</div></>}
        {q.answer && !editingAnswer && <button type="button" className={drawer.actionLink} style={{ marginTop: 10 }} onClick={() => setEditingAnswer(true)}>답변 수정</button>}

        <div className={drawer.sectionTitleLoose}>관리자 메모</div>
        <div className={drawer.memoInputRow}><input className={drawer.memoInput} placeholder="내부 메모를 입력해 주세요" value={memoText} onChange={(event) => setMemoText(event.target.value)} /><button type="button" className={drawer.memoSubmit} onClick={addMemo}>등록</button></div>
        {q.memos.length === 0 ? <div className={drawer.emptyInline}>등록된 메모가 없습니다.</div> : q.memos.slice().reverse().map((memo) => <div key={memo.id} className={drawer.memoItem}><div className={drawer.memoWhen}>{memo.at} · {memo.by}</div><div className={drawer.memoText}>{memo.text}</div></div>)}

        <div className={drawer.sectionTitleLoose}>답변 이력</div>
        {q.answerHistory.length === 0 ? <div className={drawer.emptyInline}>답변 이력이 없습니다.</div> : q.answerHistory.slice().reverse().map((history) => <div key={history.id} className={drawer.timelineItem}><span className={drawer.timelineDot} /><div className={drawer.timelineBody}><div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{history.action}</strong><span className={drawer.timelineWhen}>{history.at}</span></div><div className={drawer.timelineDetail}>{history.by}</div>{history.before && <div className={drawer.timelineDetail}>변경 전: {history.before}</div>}<div className={drawer.timelineDetail}>{history.before ? '변경 후: ' : ''}{history.after}</div></div></div>)}
      </div>

      {confirmSend && <div className={pageStyles.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmSend(false); }}><div className={pageStyles.dialogBox}><div className={pageStyles.dialogTitle}>답변을 {q.answer ? '수정' : '등록'}하시겠습니까?</div><div className={pageStyles.dialogBody}>{q.answer ? '수정한' : '등록한'} 답변이 사용자에게 노출됩니다.</div><div className={pageStyles.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setConfirmSend(false)}>취소</button><button type="button" className={drawer.editConfirm} onClick={confirmSendAnswer}>{q.answer ? '답변 수정' : '답변 등록'}</button></div></div></div>}
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>{label}</span><strong className={drawer.fieldValue}>{value}</strong></div>;
}
