import { useState } from 'react';
import styles from './opsDrawerShared.module.css';
import { PUBLICATION_STATUS_META, computeStatus, fmtRange, isPinnedNow, type Notice } from './noticesData';

const TABS: { key: string; label: string }[] = [
  { key: 'summary', label: '기본 정보' },
  { key: 'content', label: '공지 내용' },
  { key: 'expose', label: '공개 설정' },
  { key: 'history', label: '메모 · 이력' },
];

interface Props {
  notice: Notice;
  onClose: () => void;
  onEdit: () => void;
  onPublishNow: () => void;
  onCancelSchedule: () => void;
  onRequestEnd: () => void;
  onRequestRepost: () => void;
  onDuplicate: () => void;
  onRequestDelete: () => void;
  onAddMemo: (text: string) => void;
}

export function NoticeDetailDrawer({
  notice,
  onClose,
  onEdit,
  onPublishNow,
  onCancelSchedule,
  onRequestEnd,
  onRequestRepost,
  onDuplicate,
  onRequestDelete,
  onAddMemo,
}: Props) {
  const [activeTab, setActiveTab] = useState('summary');
  const [memoText, setMemoText] = useState('');

  const status = computeStatus(notice);
  const sm = PUBLICATION_STATUS_META[status];
  const pinned = isPinnedNow(notice);

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
            <div className={styles.eyebrow}>운영 관리 · 공지사항 · {notice.id}</div>
            <div className={styles.titleRow}>
              {notice.important && <span className={styles.badge} style={{ background: '#fef2f2', color: '#dc2626' }}>중요</span>}
              {pinned && <span className={styles.badge} style={{ background: '#fef3c7', color: '#b45309' }}>상단고정</span>}
              <span className={styles.title}>{notice.title}</span>
            </div>
            <div className={styles.sub}>{notice.category} · {fmtRange(notice)} · {notice.target}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.actionRow}>
          <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{status}</span>
          <div className={styles.spacer} />
          {status !== '게시종료' && (
            <button type="button" className={styles.actionLink} onClick={onEdit}>수정</button>
          )}
          {(status === '작성중' || status === '비공개') && (
            <button type="button" className={styles.primaryBtn} onClick={onPublishNow}>공개</button>
          )}
          {status === '공개예정' && (
            <button type="button" className={styles.actionLink} onClick={onCancelSchedule}>예약 취소</button>
          )}
          {status === '공개중' && (
            <button type="button" className={styles.dangerBtn} onClick={onRequestEnd}>게시 종료</button>
          )}
          {status === '게시종료' && (
            <button type="button" className={styles.primaryBtn} onClick={onRequestRepost}>재게시</button>
          )}
          <button type="button" className={styles.actionLink} onClick={onDuplicate}>복제</button>
          {status === '작성중' && (
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
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>공지번호</span><span className={styles.fieldValue}>{notice.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>카테고리</span><span className={styles.fieldValue}>{notice.category}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>상태</span><span className={styles.fieldValue}>{status}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>중요공지</span><span className={styles.fieldValue}>{notice.important ? '사용' : '미사용'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>상단고정</span><span className={styles.fieldValue}>{notice.pinStart ? `${notice.pinStart} ~ ${notice.pinEnd ?? '-'}` : '미사용'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 대상</span><span className={styles.fieldValue}>{notice.target}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>조회수</span><span className={styles.fieldValue}>{notice.views.toLocaleString('ko-KR')}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>등록자</span><span className={styles.fieldValue}>{notice.author} · {notice.createdAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 수정</span><span className={styles.fieldValue}>{notice.updatedBy} · {notice.updatedAt}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className={styles.sectionTitle}>본문</div>
            <div className={styles.bodyText}>{notice.body}</div>
            <div className={styles.sectionTitle}>첨부파일</div>
            {notice.attachments.length === 0 && <div className={styles.emptyInline}>첨부된 파일이 없습니다</div>}
            {notice.attachments.map((a, i) => (
              <div className={styles.fieldRow} key={i} style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 8, marginBottom: 6, padding: '8px 10px' }}>
                <span className={styles.fieldLabel}>{a.name}</span>
                <span className={styles.fieldValue}>{a.size}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'expose' && (
          <div>
            <div className={styles.sectionTitle}>공개 설정</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>공개 시작</span><span className={styles.fieldValue}>{notice.startAt ?? '미설정'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>공개 종료</span><span className={styles.fieldValue}>{notice.endAt ?? '종료일 없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>강제 비공개</span><span className={styles.fieldValue}>{notice.manualHidden ? '적용됨' : '아니오'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 대상</span><span className={styles.fieldValue}>{notice.target}</span></div>
            </div>
            <div className={styles.sectionTitle}>연결 노출</div>
            {notice.linkedExposures.length === 0 && <div className={styles.emptyInline}>연결된 팝업/배너가 없습니다</div>}
            {notice.linkedExposures.map((l, i) => (
              <div className={styles.linkedItem} key={i}>
                <span>{l.type} · {l.label}</span>
                <a href="#" onClick={(e) => e.preventDefault()}>{l.id} 보기</a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {notice.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            {notice.memos.length === 0 && <div className={styles.emptyInline}>등록된 메모가 없습니다</div>}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {notice.history.map((h, i) => (
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
