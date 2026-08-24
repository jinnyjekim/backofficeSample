import { useState } from 'react';
import styles from './opsDrawerShared.module.css';
import { BANNER_STATUS_META, computeStatus, fmtRange, needsReview, positionMeta, type Banner } from './bannersData';

const TABS: { key: string; label: string }[] = [
  { key: 'summary', label: '기본 정보' },
  { key: 'creative', label: '소재 · 위치' },
  { key: 'link', label: '클릭 · 대상' },
  { key: 'stats', label: '노출 · 클릭 현황' },
  { key: 'history', label: '메모 · 이력' },
];

interface Props {
  banner: Banner;
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

export function BannerDetailDrawer({
  banner,
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

  const status = computeStatus(banner);
  const sm = BANNER_STATUS_META[status];
  const review = needsReview(banner);
  const pos = positionMeta(banner.positionCode);
  const canDelete = (status === '작성중' || status === '비활성') && !banner.startAt && banner.impressions === 0;
  const ctr = banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(2) : '0.00';

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
            <div className={styles.eyebrow}>운영 관리 · 배너 · {banner.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{banner.name}</span>
            </div>
            <div className={styles.sub}>{pos.label} · {banner.device} · {fmtRange(banner)}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.thumbPreview} style={{ background: banner.thumbColor, color: '#fff' }}>{banner.title || banner.name}</div>

        {review.flag && <div className={styles.issueBanner}>⚠ {review.reasons.join(' · ')}</div>}

        <div className={styles.actionRow}>
          <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{status}</span>
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
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>배너번호</span><span className={styles.fieldValue}>{banner.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 위치</span><span className={styles.fieldValue}>{pos.label}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 순서</span><span className={styles.fieldValue}>{banner.order}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>상태</span><span className={styles.fieldValue}>{status}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 대상</span><span className={styles.fieldValue}>{banner.target}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>등록자</span><span className={styles.fieldValue}>{banner.manager} · {banner.createdAt}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최종 수정</span><span className={styles.fieldValue}>{banner.updatedBy} · {banner.updatedAt}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'creative' && (
          <div>
            <div className={styles.sectionTitle}>배너 소재</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 디바이스</span><span className={styles.fieldValue}>{banner.device}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>PC 이미지</span><span className={styles.fieldValue}>{banner.hasPcImage ? `등록됨 · 권장 ${pos.pcSpec}` : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>Mobile 이미지</span><span className={styles.fieldValue}>{banner.hasMobileImage ? `등록됨 · 권장 ${pos.mobileSpec}` : banner.useDesktopForMobile ? 'PC 이미지 재사용' : '없음'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>대체텍스트</span><span className={styles.fieldValue}>{banner.altText || '미설정'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>제목</span><span className={styles.fieldValue}>{banner.title || '-'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>설명</span><span className={styles.fieldValue}>{banner.description || '-'}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>버튼명</span><span className={styles.fieldValue}>{banner.buttonLabel || '-'}</span></div>
            </div>
            <div className={styles.sectionTitle}>노출 위치 정보</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최대 동시 노출</span><span className={styles.fieldValue}>{pos.maxCount}개</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 방식</span><span className={styles.fieldValue}>{pos.mode}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'link' && (
          <div>
            <div className={styles.sectionTitle}>클릭 동작</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>클릭 유형</span><span className={styles.fieldValue}>{banner.linkType}</span></div>
              {banner.linkType !== '없음' && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>연결 대상</span><span className={styles.fieldValue}>{banner.linkUrl || '미설정'}</span></div>
              )}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>노출 대상</span><span className={styles.fieldValue}>{banner.target}</span></div>
            </div>
            <div className={styles.sectionTitle}>연결 콘텐츠</div>
            {!banner.linkedContent && <div className={styles.emptyInline}>연결된 콘텐츠가 없습니다</div>}
            {banner.linkedContent && (
              <div className={styles.linkedItem}>
                <span>{banner.linkedContent.type} · {banner.linkedContent.label}</span>
                <span style={{ color: banner.linkedContent.ended ? '#dc2626' : '#059669', fontSize: 11, fontWeight: 600 }}>
                  {banner.linkedContent.ended ? '종료됨' : '진행중'}
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <div className={styles.sectionTitle}>노출 · 클릭 현황 (누적)</div>
            <div className={styles.statGrid}>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>노출수</div>
                <div className={styles.statValue}>{banner.impressions.toLocaleString('ko-KR')}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>클릭수</div>
                <div className={styles.statValue}>{banner.clicks.toLocaleString('ko-KR')}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>CTR</div>
                <div className={styles.statValue}>{ctr}%</div>
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
            {banner.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            {banner.memos.length === 0 && <div className={styles.emptyInline}>등록된 메모가 없습니다</div>}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {banner.history.map((h, i) => (
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
