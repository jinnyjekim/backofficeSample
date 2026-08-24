import { useState, type CSSProperties } from 'react';
import drawer from './opsDrawerShared.module.css';
import styles from './EventsPage.module.css';
import {
  EVENT_STATUS_META,
  computeEventStatus,
  eventIssues,
  fmtCompactRange,
  fmtDateTime,
  linkedExposureSummary,
  type EventEntry,
  type EventLink,
} from './eventsData';

const TABS = [
  { key: 'summary', label: '이벤트 요약' },
  { key: 'content', label: '콘텐츠' },
  { key: 'participation', label: '참여 · 혜택' },
  { key: 'links', label: '연결 노출' },
  { key: 'history', label: '메모 · 이력' },
] as const;

interface Props {
  event: EventEntry;
  onClose: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onStart: () => void;
  onEnd: () => void;
  onToggleActive: () => void;
  onAddMemo: (text: string) => void;
}

function LinkGroup({ title, links }: { title: string; links: EventLink[] }) {
  return (
    <div>
      <div className={styles.linkGroupTitle}>{title}</div>
      {links.length === 0 && <div className={drawer.emptyInline}>연결된 항목이 없습니다.</div>}
      {links.map((link) => <div className={styles.linkItem} key={link.id}><span className={styles.linkId}>{link.id}</span><span className={styles.linkName}>{link.name}</span><span className={styles.linkStatus}>{link.status}</span></div>)}
    </div>
  );
}

export function EventDetailDrawer({ event, onClose, onEdit, onPreview, onDuplicate, onStart, onEnd, onToggleActive, onAddMemo }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('summary');
  const [memoText, setMemoText] = useState('');
  const status = computeEventStatus(event);
  const statusMeta = EVENT_STATUS_META[status];
  const issues = eventIssues(event);
  const benefitPct = event.benefitTotal > 0 ? Math.min(100, Math.round((event.benefitGranted / event.benefitTotal) * 100)) : 0;
  const participationRate = event.targetCount ? ((event.participants / event.targetCount) * 100).toFixed(1) : '-';

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(memoText.trim());
    setMemoText('');
  }

  return (
    <aside className={`${drawer.aside} ${drawer.wideAside}`}>
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>운영 관리 · 이벤트 · {event.id}</div>
            <div className={drawer.titleRow}><span className={drawer.title}>{event.displayName}</span><span className={drawer.badge} style={{ background: statusMeta.bg, color: statusMeta.fg }}>{status}</span></div>
            <div className={drawer.sub}>{event.type} · {fmtCompactRange(event.eventStartAt, event.eventEndAt)} · {event.manager}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={drawer.actionRow}>
          <button type="button" className={drawer.actionLink} onClick={onPreview}>사용자 화면 미리보기</button>
          <button type="button" className={drawer.actionLink} onClick={onEdit}>수정</button>
          <button type="button" className={drawer.actionLink} onClick={onDuplicate}>복제</button>
          <div className={drawer.spacer} />
          {status === '작성중' && <button type="button" className={drawer.primaryBtn} onClick={onStart}>진행 설정</button>}
          {status === '진행중' && <button type="button" className={drawer.dangerBtn} onClick={onEnd}>조기 종료</button>}
          {status === '비활성' && <button type="button" className={drawer.primaryBtn} onClick={onToggleActive}>활성화</button>}
          {(status === '진행 예정' || status === '진행중') && <button type="button" className={drawer.actionLink} onClick={onToggleActive}>비활성</button>}
        </div>

        <div className={drawer.tabs}>
          {TABS.map((tab) => <button key={tab.key} type="button" className={`${drawer.tabBtn} ${activeTab === tab.key ? drawer.tabActive : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}
        </div>
      </div>

      <div className={drawer.scroll}>
        {activeTab === 'summary' && <>
          <div className={styles.detailHero} style={{ '--event-tone': event.imageTone } as CSSProperties}><div className={styles.detailHeroTitle}>{event.displayName}</div><div className={styles.detailHeroSub}>{event.summary}</div></div>
          {issues.length > 0 && <><div className={drawer.sectionTitle}>운영 확인 필요</div><div className={styles.issueList}>{issues.map((issue) => <div key={issue} className={styles.issueItem}>⚠ {issue}</div>)}</div></>}
          <div className={drawer.sectionTitle}>이벤트 Summary</div>
          <div className={drawer.fieldBox}>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>이벤트번호</span><span className={drawer.fieldValue}>{event.id}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>관리명</span><span className={drawer.fieldValue}>{event.managementName}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>노출명</span><span className={drawer.fieldValue}>{event.displayName}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>유형 / 상태</span><span className={drawer.fieldValue}>{event.type} · {status}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>참여기간</span><span className={drawer.fieldValue}>{fmtDateTime(event.eventStartAt)} ~ {fmtDateTime(event.eventEndAt)}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>노출기간</span><span className={drawer.fieldValue}>{fmtDateTime(event.displayStartAt)} ~ {fmtDateTime(event.displayEndAt)}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>참여대상</span><span className={drawer.fieldValue}>{event.target}{event.targetDetail ? ` · ${event.targetDetail}` : ''}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>참여방식</span><span className={drawer.fieldValue}>{event.participationMethod} · {event.participationLimit}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>혜택</span><span className={drawer.fieldValue}>{event.benefitType === '혜택 없음' ? '없음' : `${event.benefitType} · ${event.benefitName}`}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>연결 노출</span><span className={drawer.fieldValue}>{linkedExposureSummary(event)}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>담당자 / 수정일</span><span className={drawer.fieldValue}>{event.manager} · {fmtDateTime(event.updatedAt)}</span></div>
          </div>
        </>}

        {activeTab === 'content' && <>
          <div className={styles.detailHero} style={{ '--event-tone': event.imageTone } as CSSProperties}><div className={styles.detailHeroTitle}>{event.displayName}</div><div className={styles.detailHeroSub}>{fmtCompactRange(event.eventStartAt, event.eventEndAt)}</div></div>
          <div className={styles.contentSection}><div className={styles.contentTitle}>이벤트 설명</div><div className={styles.contentText}>{event.content || '등록된 설명이 없습니다.'}</div></div>
          <div className={styles.contentSection}><div className={styles.contentTitle}>참여 방법</div><div className={styles.contentText}>{event.participationGuide || '등록된 참여 방법이 없습니다.'}</div></div>
          <div className={styles.contentSection}><div className={styles.contentTitle}>유의사항</div><div className={styles.contentText}>{event.caution || '등록된 유의사항이 없습니다.'}</div></div>
        </>}

        {activeTab === 'participation' && <>
          <div className={drawer.sectionTitle}>운영 현황</div>
          <div className={styles.metricGrid}>
            <div className={styles.metric}><div className={styles.metricLabel}>참여</div><div className={styles.metricValue}>{event.participants.toLocaleString('ko-KR')}</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>오늘 참여</div><div className={styles.metricValue}>{event.todayParticipants.toLocaleString('ko-KR')}</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>참여율</div><div className={styles.metricValue}>{participationRate}{participationRate !== '-' ? '%' : ''}</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>페이지 조회</div><div className={styles.metricValue}>{event.pageViews.toLocaleString('ko-KR')}</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>지급 대기</div><div className={styles.metricValue}>{event.benefitPending.toLocaleString('ko-KR')}</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>지급 오류</div><div className={styles.metricValue}>{event.benefitFailed.toLocaleString('ko-KR')}</div></div>
          </div>
          <div className={drawer.sectionTitle}>참여 조건</div>
          <div className={drawer.fieldBox}>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>대상</span><span className={drawer.fieldValue}>{event.target}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>방식</span><span className={drawer.fieldValue}>{event.participationMethod}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>횟수</span><span className={drawer.fieldValue}>{event.participationLimit}</span></div>
            <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>제외</span><span className={drawer.fieldValue}>{event.exclusions.join(' · ') || '-'}</span></div>
          </div>
          {event.benefitType !== '혜택 없음' && <>
            <div className={drawer.sectionTitle}>혜택 / 지급</div>
            <div className={drawer.fieldBox}>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>혜택</span><span className={drawer.fieldValue}>{event.benefitType} · {event.benefitName}</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>지급 방식</span><span className={drawer.fieldValue}>{event.grantMethod}</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>지급 현황</span><span className={drawer.fieldValue}>{event.benefitGranted.toLocaleString('ko-KR')} / {event.benefitTotal.toLocaleString('ko-KR')}</span></div>
            </div>
            <div className={styles.progressBlock}><div className={styles.progressHead}><span>혜택 지급률</span><b>{benefitPct}%</b></div><div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${benefitPct}%` }} /></div></div>
          </>}
          {event.winner && <>
            <div className={drawer.sectionTitle}>당첨 처리</div>
            <div className={drawer.fieldBox}>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>처리 상태</span><span className={drawer.fieldValue}>{event.winner.status}</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>총 응모</span><span className={drawer.fieldValue}>{event.winner.totalEntries.toLocaleString('ko-KR')}명</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>당첨 예정 / 확정</span><span className={drawer.fieldValue}>{event.winner.plannedWinners} / {event.winner.confirmedWinners}명</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>발표일 / 방식</span><span className={drawer.fieldValue}>{fmtDateTime(event.winner.announcementAt)} · {event.winner.selectionMethod}</span></div>
            </div>
          </>}
        </>}

        {activeTab === 'links' && <>
          <LinkGroup title="배너" links={event.linkedBanners} />
          <LinkGroup title="팝업" links={event.linkedPopups} />
          <LinkGroup title="관련 공지" links={event.linkedNotice ? [event.linkedNotice] : []} />
          <div className={styles.warning}>이벤트와 연결 노출의 기간이 다를 수 있습니다. 배너·팝업의 노출기간은 각 메뉴에서 별도로 검증해 주세요.</div>
        </>}

        {activeTab === 'history' && <>
          <div className={drawer.sectionTitle}>관리자 메모</div>
          <div className={drawer.memoInputRow}><input className={drawer.memoInput} value={memoText} onChange={(e) => setMemoText(e.target.value)} placeholder="운영 메모를 입력하세요" /><button type="button" className={drawer.memoSubmit} onClick={submitMemo}>등록</button></div>
          {event.memos.map((memo, index) => <div className={drawer.memoItem} key={`${memo.when}-${index}`}><div className={drawer.memoWhen}>{memo.when} · {memo.by}</div><div className={drawer.memoText}>{memo.text}</div></div>)}
          {event.memos.length === 0 && <div className={drawer.emptyInline}>등록된 메모가 없습니다.</div>}
          <div className={drawer.sectionTitleLoose}>이벤트 변경 이력</div>
          {event.history.map((item, index) => <div className={drawer.timelineItem} key={`${item.when}-${index}`}><div className={drawer.timelineDot} /><div className={drawer.timelineBody}><div className={drawer.timelineRow}><span className={drawer.timelineTitle}>{item.title}</span><span className={drawer.timelineWhen}>{item.when}</span></div><div className={drawer.timelineDetail}>{item.by}{item.detail ? ` · ${item.detail}` : ''}</div></div></div>)}
        </>}
      </div>
    </aside>
  );
}
