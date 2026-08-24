import { useState } from 'react';
import styles from './opsDrawerShared.module.css';
import type { Faq, FaqCategory, FaqTarget, RelatedLink } from './faqData';

export type PublishMode = '즉시' | '예약' | '비공개';

export interface FaqFormData {
  category: FaqCategory;
  question: string;
  answer: string;
  keywords: string[];
  important: boolean;
  order: number;
  target: FaqTarget;
  publishMode: PublishMode;
  startDate: string;
  startTime: string;
  endMode: '없음' | '지정';
  endDate: string;
  endTime: string;
  relatedFaqIds: string[];
  relatedLinks: RelatedLink[];
  memo: string;
}

interface Props {
  faq: Faq | null;
  allFaqs: Faq[];
  categories: FaqCategory[];
  todayIso: string;
  onCancel: () => void;
  onSubmit: (form: FaqFormData) => void;
}

function toIso(dotDate: string): string {
  return dotDate.replaceAll('.', '-');
}
function toDot(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

export function FaqEditorDrawer({ faq, allFaqs, categories, todayIso, onCancel, onSubmit }: Props) {
  const editing = !!faq;

  const [category, setCategory] = useState<FaqCategory>(faq?.category ?? categories[0]);
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const [keywords, setKeywords] = useState<string[]>(faq?.keywords ?? []);
  const [keywordInput, setKeywordInput] = useState('');
  const [important, setImportant] = useState(faq?.important ?? false);
  const [order, setOrder] = useState(faq?.order ?? 1);
  const [target, setTarget] = useState<FaqTarget>(faq?.target ?? '전체 사용자');

  const initialMode: PublishMode = faq?.manualHidden ? '비공개' : faq?.startAt ? '예약' : '즉시';
  const [publishMode, setPublishMode] = useState<PublishMode>(editing ? initialMode : '즉시');
  const [startDate, setStartDate] = useState(faq?.startAt ? toIso(faq.startAt.split(' ')[0]) : todayIso);
  const [startTime, setStartTime] = useState(faq?.startAt?.split(' ')[1] ?? '09:00');
  const [endMode, setEndMode] = useState<'없음' | '지정'>(faq?.endAt ? '지정' : '없음');
  const [endDate, setEndDate] = useState(faq?.endAt ? toIso(faq.endAt.split(' ')[0]) : todayIso);
  const [endTime, setEndTime] = useState(faq?.endAt?.split(' ')[1] ?? '23:59');

  const [relatedFaqIds, setRelatedFaqIds] = useState<string[]>(faq?.relatedFaqIds ?? []);
  const [relatedLinks, setRelatedLinks] = useState<RelatedLink[]>(faq?.relatedLinks ?? []);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [memo, setMemo] = useState('');

  const [showPreview, setShowPreview] = useState(false);

  function addKeyword() {
    const v = keywordInput.trim();
    if (!v || keywords.includes(v)) return;
    setKeywords((prev) => [...prev, v]);
    setKeywordInput('');
  }
  function removeKeyword(idx: number) {
    setKeywords((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleRelated(id: string) {
    setRelatedFaqIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addLink() {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    setRelatedLinks((prev) => [...prev, { label: linkLabel.trim(), url: linkUrl.trim() }]);
    setLinkLabel('');
    setLinkUrl('');
  }
  function removeLink(idx: number) {
    setRelatedLinks((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit() {
    if (!question.trim() || !answer.trim()) return;
    onSubmit({
      category, question: question.trim(), answer, keywords, important, order, target,
      publishMode,
      startDate: toDot(startDate), startTime,
      endMode, endDate: toDot(endDate), endTime,
      relatedFaqIds, relatedLinks, memo: memo.trim(),
    });
  }

  const candidateFaqs = allFaqs.filter((f) => f.id !== faq?.id);

  return (
    <aside className={`${styles.aside} ${styles.wideAside}`}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>운영 관리 · FAQ</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{editing ? `FAQ 수정 · ${faq!.id}` : 'FAQ 등록'}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        {showPreview && (
          <div className={styles.previewCard}>
            <div className={styles.previewMeta}>{category}</div>
            <div className={styles.previewTitle}>Q. {question || '(질문 없음)'}</div>
            <div className={styles.previewBody}>A. {answer || '(답변 없음)'}</div>
            {relatedLinks.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {relatedLinks.map((l, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--accent)' }}>{l.label}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>카테고리 *</label>
          <select className={styles.formSelect} value={category} onChange={(e) => setCategory(e.target.value as FaqCategory)}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>질문 *</label>
          <input className={styles.formInput} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="사용자가 검색/열람할 질문" />
        </div>

        <div className={styles.sectionTitleLoose}>답변</div>
        <div className={styles.formGroup}>
          <textarea className={styles.formTextarea} style={{ height: 140 }} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="답변 내용을 입력하세요" />
        </div>

        <div className={styles.sectionTitleLoose}>검색 설정</div>
        <div className={styles.attachList}>
          {keywords.map((k, i) => (
            <div className={styles.attachItem} key={i}>
              <span className={styles.attachName}>{k}</span>
              <button type="button" className={styles.attachRemove} onClick={() => removeKeyword(i)}>×</button>
            </div>
          ))}
          {keywords.length === 0 && <div className={styles.emptyInline}>등록된 검색 키워드가 없습니다</div>}
        </div>
        <div className={styles.attachAddRow}>
          <input
            className={styles.formInput}
            style={{ flex: 1 }}
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
            placeholder="키워드 입력 후 추가"
          />
          <button type="button" className={styles.editConfirm} style={{ height: 32 }} onClick={addKeyword}>+ 추가</button>
        </div>

        <div className={styles.sectionTitleLoose}>노출 설정</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '즉시'} onChange={() => setPublishMode('즉시')} />공개</label>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '예약'} onChange={() => setPublishMode('예약')} />예약 공개</label>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '비공개'} onChange={() => setPublishMode('비공개')} />비공개</label>
        </div>
        {publishMode === '예약' && (
          <div className={styles.dateTimeRow}>
            <input type="date" className={styles.dateInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="time" className={styles.timeInput} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        )}
        <div className={styles.formLabel} style={{ marginBottom: 6 }}>공개 종료</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={endMode === '없음'} onChange={() => setEndMode('없음')} />종료일 없음</label>
          <label className={styles.radioOption}><input type="radio" checked={endMode === '지정'} onChange={() => setEndMode('지정')} />종료일 지정</label>
        </div>
        {endMode === '지정' && (
          <div className={styles.dateTimeRow}>
            <input type="date" className={styles.dateInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <input type="time" className={styles.timeInput} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        )}
        <div className={styles.formGroup}>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
            중요 FAQ로 지정
          </label>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>노출 순서 (카테고리 내)</label>
          <input type="number" min={1} className={styles.formInput} value={order} onChange={(e) => setOrder(Number(e.target.value) || 1)} />
        </div>
        <div className={styles.formLabel} style={{ marginBottom: 6 }}>노출 대상</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={target === '전체 사용자'} onChange={() => setTarget('전체 사용자')} />전체 사용자</label>
          <label className={styles.radioOption}><input type="radio" checked={target === '특정 회원 그룹'} onChange={() => setTarget('특정 회원 그룹')} />특정 회원 그룹</label>
        </div>

        <div className={styles.sectionTitleLoose}>관련 FAQ</div>
        <div className={styles.attachList}>
          {candidateFaqs.slice(0, 8).map((f) => (
            <label key={f.id} className={styles.checkRow} style={{ padding: '2px 0' }}>
              <input type="checkbox" checked={relatedFaqIds.includes(f.id)} onChange={() => toggleRelated(f.id)} />
              {f.question}
            </label>
          ))}
        </div>

        <div className={styles.sectionTitleLoose}>관련 페이지</div>
        <div className={styles.attachList}>
          {relatedLinks.map((l, i) => (
            <div className={styles.attachItem} key={i}>
              <span><span className={styles.attachName}>{l.label}</span><span className={styles.attachSize}>{l.url}</span></span>
              <button type="button" className={styles.attachRemove} onClick={() => removeLink(i)}>×</button>
            </div>
          ))}
          {relatedLinks.length === 0 && <div className={styles.emptyInline}>등록된 관련 페이지가 없습니다</div>}
        </div>
        <div className={styles.attachAddRow}>
          <input className={styles.formInput} style={{ flex: 1 }} value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="링크명" />
          <input className={styles.formInput} style={{ flex: 1 }} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/path" />
          <button type="button" className={styles.editConfirm} style={{ height: 32 }} onClick={addLink}>+ 추가</button>
        </div>

        <div className={styles.sectionTitleLoose}>내부 관리</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>관리자 메모</label>
          <input className={styles.formInput} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="변경 사유나 참고사항을 남겨보세요" />
        </div>
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.editCancel} onClick={onCancel}>취소</button>
        <button type="button" className={styles.editCancel} onClick={() => setShowPreview((v) => !v)}>{showPreview ? '미리보기 닫기' : '미리보기'}</button>
        <button type="button" className={styles.editConfirm} onClick={submit}>{editing ? '수정 저장' : '등록'}</button>
      </div>
    </aside>
  );
}
