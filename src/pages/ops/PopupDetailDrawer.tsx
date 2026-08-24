import { useState } from 'react';
import styles from './opsDrawerShared.module.css';
import { POPUP_STATUS_META, computeStatus, fmtRange, needsReview, type Popup } from './popupsData';

const TABS: { key: string; label: string }[] = [
  { key: 'summary', label: '기본 정보' },
  { key: 'content', label: '콘텐츠' },
  { key: 'expose', label: '노출 조건' },
  { key: 'stats', label: '노출 현황' },
  { key: 'history', label: '메모 · 이력' },
];

interface Props {
  popup: Popup;
  allPopups: Popup[];
  onClose: () => void;
  onEdit: () => void;
  onPublishNow: () => void;
  onCancelSchedule: () => void;
  onRequestStop: () => void;
  onRequestRepost: () => void;
  onDuplicate: () => void;
  onRequestDelete: () => void;
  onAddMemo: (text: string) => void;
}

export function PopupDetailDrawer({
  popup,
  allPopups,
  onClose,
  onEdit,
  onPublishNow,
  onCancelSchedule,
  onRequestStop,
  onRequestRepost,
  onDuplicate,
  onRequestDelete,
  onAddMemo,
}: Props) {
  const [activeTab, setActiveTab] = useState('summary');
  const [memoText, setMemoText] = useState('');

  const status = computeStatus(popup);
  const sm = POPUP_STATUS_META[status];
  const review = needsReview(popup, allPopups);
  const canDelete = (status === '작성중' || status === '비활성') && !popup.startAt && popup.impressions === 0;
  const ctr = popup.impressions > 0 ? ((popup.clicks / popup.impressions) * 100).toFixed(2) : '0.00';
  const closeRate = popup.impressions > 0 ? ((popup.closes / popup.impressions) * 100).toFixed(1) : '0.0';

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
            <div className={styles.eyebrow}>운영 관리 · 팝업 · {popup.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{popup.title}</span>
            </div>
            <div className={styles.sub}>{popup.screen} · {popup.target} · {fmtRange(popup)}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.thumbPreview} style={{ background: popup.thumbColor, color: '#fff' }}>{popup.title}</div>

        {review.flag && <div className={styles.issueBanner}>⚠ {review.reasons.join(' · ')}</div>}

        <div className={styles.actionRow}>
          <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{status}</span>
          <span className={styles.badge} style={{ background: '#eef2ff', color: '#4338ca' }}>Priority {popup.priority}</span>
          <div className={styles.spacer} />
          {status !== '노출종료' && (
            <button type="button" className={styles.actionLink} onClick={onEdit}>수정</button>
          )}
          {(status === '작성중' || status === '비활성') && (
            <button type="button" className={styles.primaryBtn} onClick={onPublishNow}>노출</button>
          )}
          {status === '노출예정' && (
            <button type="button" className={styles.actionLink} onClick={onCancelSchedule}>예약 취소</button>
          )}
          {status === '노출중' && (
            <button type="button" className={styles.dangerBtn} onClick={onRequestStop}>노출 중지</button>
          )}
          {status === '노출종료' && (
            <button type="button" className={styles.primaryBtn} onClick={onRequestRepost}>재노출</button>
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
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>팝업번호</span><span className={styles.fieldValue}>{popup.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>관리명</span><span className={styles.fieldValue}>{popup.name}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 화면</span><span className={styles.fieldValue}>{popup.screen}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>상태</span><span className={styles.fieldValue}>{status}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>우선순위</span><span className={styles.fieldValue}>{popup.priority}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 대상</span><span className={styles.fieldValue}>{popup.target}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>등록자</span><span className={styles.fieldValue}>{popup.manager} · {popup.createdAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 수정</span><span className={styles.fieldValue}>{popup.updatedBy} · {popup.updatedAt}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className={styles.sectionTitle}>콘텐츠</div>
            <div className={styles.bodyText}>{popup.body}</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>유형</span><span className={styles.fieldValue}>{popup.type}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>PC 이미지</span><span className={styles.fieldValue}>{popup.hasPcImage ? '등록됨' : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>Mobile 이미지</span><span className={styles.fieldValue}>{popup.hasMobileImage ? '등록됨' : popup.useDesktopForMobile ? 'PC 이미지 재사용' : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>버튼명</span><span className={styles.fieldValue}>{popup.primaryLabel}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>클릭 동작</span><span className={styles.fieldValue}>{popup.linkType}{popup.linkUrl ? ` · ${popup.linkUrl}` : ''}</span></div>
            </div>
            <div className={styles.sectionTitle}>연결 콘텐츠</div>
            {!popup.linkedContent && <div className={styles.emptyInline}>연결된 콘텐츠가 없습니다</div>}
            {popup.linkedContent && (
              <div className={styles.linkedItem}>
                <span>{popup.linkedContent.type} · {popup.linkedContent.label}</span>
                <span style={{ color: popup.linkedContent.ended ? '#dc2626' : '#059669', fontSize: 11, fontWeight: 600 }}>
                  {popup.linkedContent.ended ? '종료됨' : '진행중'}
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'expose' && (
          <div>
            <div className={styles.sectionTitle}>노출 조건</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>표시 시점</span><span className={styles.fieldValue}>{popup.timing}{popup.timing === 'N초 후' ? ` (${popup.delaySeconds}초)` : ''}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 빈도</span><span className={styles.fieldValue}>{popup.frequency}{popup.frequency === '사용자당 N회' ? ` (${popup.maxCount}회)` : ''}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>디바이스</span><span className={styles.fieldValue}>{popup.device}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 시작</span><span className={styles.fieldValue}>{popup.startAt ?? '미설정'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 종료</span><span className={styles.fieldValue}>{popup.endAt ?? '종료일 없음'}</span></div>
            </div>
            <div className={styles.sectionTitle}>닫기 설정</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>X 버튼</span><span className={styles.fieldValue}>{popup.close.showCloseButton ? '표시' : '숨김'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>외부 영역 클릭</span><span className={styles.fieldValue}>{popup.close.closeOnOutsideClick ? '닫기 허용' : '허용 안 함'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>ESC</span><span className={styles.fieldValue}>{popup.close.closeOnEsc ? '닫기 허용' : '허용 안 함'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>오늘 하루 보지 않기</span><span className={styles.fieldValue}>{popup.close.hideToday ? '사용' : '미사용'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>다시 보지 않기</span><span className={styles.fieldValue}>{popup.close.hideForever ? '사용' : '미사용'}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <div className={styles.sectionTitle}>노출 현황 (누적)</div>
            <div className={styles.statGrid}>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>노출수</div>
                <div className={styles.statValue}>{popup.impressions.toLocaleString('ko-KR')}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>클릭수</div>
                <div className={styles.statValue}>{popup.clicks.toLocaleString('ko-KR')}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>CTR</div>
                <div className={styles.statValue}>{ctr}%</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>닫기수</div>
                <div className={styles.statValue}>{popup.closes.toLocaleString('ko-KR')}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>닫기율</div>
                <div className={styles.statValue}>{closeRate}%</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>오늘 하루 보지 않기</div>
                <div className={styles.statValue}>{popup.hideTodayCount.toLocaleString('ko-KR')}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {popup.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            {popup.memos.length === 0 && <div className={styles.emptyInline}>등록된 메모가 없습니다</div>}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {popup.history.map((h, i) => (
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
