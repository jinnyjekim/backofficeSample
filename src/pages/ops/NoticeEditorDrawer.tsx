import { DatePicker } from '../../components/forms/DatePicker';
import { useRef, useState } from 'react';
import styles from './opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  NOTICE_CATEGORIES,
  type Attachment,
  type Notice,
  type NoticeCategory,
  type NoticeTarget,
} from './noticesData';

export type PublishMode = '즉시' | '예약' | '비공개';

export interface NoticeFormData {
  title: string;
  category: NoticeCategory;
  important: boolean;
  pinEnabled: boolean;
  pinStart: string;
  pinEnd: string;
  body: string;
  attachments: Attachment[];
  publishMode: PublishMode;
  startDate: string;
  startTime: string;
  endMode: '없음' | '지정';
  endDate: string;
  endTime: string;
  target: NoticeTarget;
  memo: string;
}

interface Props {
  notice: Notice | null;
  todayIso: string;
  onCancel: () => void;
  onSubmit: (form: NoticeFormData) => void;
}

function toIso(dotDate: string): string {
  return dotDate.replaceAll('.', '-');
}
function toDot(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

export function NoticeEditorDrawer({ notice, todayIso, onCancel, onSubmit }: Props) {
  const editing = !!notice;

  const [title, setTitle] = useState(notice?.title ?? '');
  const [category, setCategory] = useState<NoticeCategory>(notice?.category ?? '서비스 안내');
  const [important, setImportant] = useState(notice?.important ?? false);
  const [pinEnabled, setPinEnabled] = useState(!!notice?.pinStart);
  const [pinStart, setPinStart] = useState(notice?.pinStart ? toIso(notice.pinStart) : todayIso);
  const [pinEnd, setPinEnd] = useState(notice?.pinEnd ? toIso(notice.pinEnd) : todayIso);
  const [body, setBody] = useState(notice?.body ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(notice?.attachments ?? []);
  const [attachName, setAttachName] = useState('');

  const initialMode: PublishMode = notice?.manualHidden ? '비공개' : notice?.startAt ? '예약' : '즉시';
  const [publishMode, setPublishMode] = useState<PublishMode>(editing ? initialMode : '즉시');
  const [startDate, setStartDate] = useState(notice?.startAt ? toIso(notice.startAt.split(' ')[0]) : todayIso);
  const [startTime, setStartTime] = useState(notice?.startAt?.split(' ')[1] ?? '09:00');
  const [endMode, setEndMode] = useState<'없음' | '지정'>(notice?.endAt ? '지정' : '없음');
  const [endDate, setEndDate] = useState(notice?.endAt ? toIso(notice.endAt.split(' ')[0]) : todayIso);
  const [endTime, setEndTime] = useState(notice?.endAt?.split(' ')[1] ?? '23:59');
  const [target, setTarget] = useState<NoticeTarget>(notice?.target ?? '전체 사용자');
  const [memo, setMemo] = useState('');

  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'Desktop' | 'Mobile'>('Desktop');

  function addAttachment() {
    if (!attachName.trim()) return;
    setAttachments((prev) => [...prev, { name: attachName.trim(), size: '-' }]);
    setAttachName('');
  }
  function removeAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit() {
    if (!title.trim() || !body.trim()) return;
    onSubmit({
      title: title.trim(),
      category,
      important,
      pinEnabled,
      pinStart: toDot(pinStart),
      pinEnd: toDot(pinEnd),
      body,
      attachments,
      publishMode,
      startDate: toDot(startDate),
      startTime,
      endMode,
      endDate: toDot(endDate),
      endTime,
      target,
      memo: memo.trim(),
    });
  }

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onCancel);

  return (
    <aside ref={asideRef} className={`${styles.aside} ${styles.wideAside}`}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>운영 관리 · 공지사항</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{editing ? `공지 수정 · ${notice!.id}` : '공지사항 등록'}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        {showPreview && (
          <div className={styles.previewCard}>
            <div className={styles.previewToggleRow}>
              <button type="button" className={`${styles.previewToggleBtn} ${previewMode === 'Desktop' ? styles.previewActive : ''}`} onClick={() => setPreviewMode('Desktop')}>Desktop</button>
              <button type="button" className={`${styles.previewToggleBtn} ${previewMode === 'Mobile' ? styles.previewActive : ''}`} onClick={() => setPreviewMode('Mobile')}>Mobile</button>
            </div>
            <div className={previewMode === 'Mobile' ? styles.previewMobileFrame : undefined}>
              {important && <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 700 }}>[중요] </span>}
              <span className={styles.previewTitle}>{title || '(제목 없음)'}</span>
              <div className={styles.previewMeta}>{category} · {publishMode === '비공개' ? '비공개' : publishMode === '예약' ? `${toDot(startDate)} 공개 예정` : '즉시 공개'}</div>
              <div className={styles.previewBody}>{body || '(본문 없음)'}</div>
            </div>
          </div>
        )}

        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>제목 *</label>
          <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목을 입력하세요" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>카테고리 *</label>
          <select className={styles.formSelect} value={category} onChange={(e) => setCategory(e.target.value as NoticeCategory)}>
            {NOTICE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
            중요 공지로 설정
          </label>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={pinEnabled} onChange={(e) => setPinEnabled(e.target.checked)} />
            목록 상단 고정
          </label>
          {pinEnabled && (
            <div className={styles.dateTimeRow} style={{ marginTop: 8 }}>
              <DatePicker className={styles.dateInput} value={pinStart} onChange={(e) => setPinStart(e.target.value)} />
              <span style={{ alignSelf: 'center', color: '#a1a1aa', fontSize: 12 }}>~</span>
              <DatePicker className={styles.dateInput} value={pinEnd} onChange={(e) => setPinEnd(e.target.value)} />
            </div>
          )}
        </div>

        <div className={styles.sectionTitleLoose}>공지 내용</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>본문 *</label>
          <textarea className={styles.formTextarea} style={{ height: 160 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="공지 본문을 입력하세요" />
        </div>

        <div className={styles.sectionTitleLoose}>첨부파일</div>
        <div className={styles.attachList}>
          {attachments.map((a, i) => (
            <div className={styles.attachItem} key={i}>
              <span>
                <span className={styles.attachName}>{a.name}</span>
                <span className={styles.attachSize}>{a.size}</span>
              </span>
              <button type="button" className={styles.attachRemove} onClick={() => removeAttachment(i)}>×</button>
            </div>
          ))}
          {attachments.length === 0 && <div className={styles.emptyInline}>첨부된 파일이 없습니다</div>}
        </div>
        <div className={styles.attachAddRow}>
          <input className={styles.formInput} style={{ flex: 1 }} value={attachName} onChange={(e) => setAttachName(e.target.value)} placeholder="파일명을 입력 후 추가" />
          <button type="button" className={styles.editConfirm} style={{ height: 32 }} onClick={addAttachment}>+ 파일 추가</button>
        </div>

        <div className={styles.sectionTitleLoose}>공개 설정</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '즉시'} onChange={() => setPublishMode('즉시')} />즉시 공개</label>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '예약'} onChange={() => setPublishMode('예약')} />예약 공개</label>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '비공개'} onChange={() => setPublishMode('비공개')} />비공개</label>
        </div>
        {publishMode === '예약' && (
          <div className={styles.dateTimeRow}>
            <DatePicker className={styles.dateInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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
            <DatePicker className={styles.dateInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <input type="time" className={styles.timeInput} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        )}

        <div className={styles.sectionTitleLoose}>노출 대상</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={target === '전체 사용자'} onChange={() => setTarget('전체 사용자')} />전체 사용자</label>
          <label className={styles.radioOption}><input type="radio" checked={target === '특정 회원 그룹'} onChange={() => setTarget('특정 회원 그룹')} />특정 회원 그룹</label>
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
