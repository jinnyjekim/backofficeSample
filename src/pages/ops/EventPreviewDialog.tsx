import { useState, type CSSProperties } from 'react';
import styles from './EventsPage.module.css';
import { fmtCompactRange, type EventEntry } from './eventsData';

interface Props {
  event: Pick<EventEntry, 'displayName' | 'summary' | 'content' | 'participationGuide' | 'caution' | 'eventStartAt' | 'eventEndAt' | 'participationMethod' | 'benefitName' | 'imageTone'>;
  onClose: () => void;
}

const PREVIEW_MODES = ['참여 전', '참여 완료', '기간 종료', '혜택 소진'] as const;

export function EventPreviewDialog({ event, onClose }: Props) {
  const [device, setDevice] = useState<'Desktop' | 'Mobile'>('Desktop');
  const [mode, setMode] = useState<(typeof PREVIEW_MODES)[number]>('참여 전');
  const disabled = mode === '기간 종료' || mode === '혜택 소진' || event.participationMethod === '참여 기능 없음';
  const cta = event.participationMethod === '참여 기능 없음'
    ? '이벤트 안내'
    : mode === '참여 완료'
      ? '참여 완료'
      : mode === '기간 종료'
        ? '종료된 이벤트입니다'
        : mode === '혜택 소진'
          ? '혜택이 모두 소진되었습니다'
          : event.participationMethod === '응모'
            ? '이벤트 응모하기'
            : '이벤트 참여하기';

  return (
    <div className={styles.previewOverlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.previewDialog}>
        <div className={styles.previewHead}>
          <div className={styles.previewHeadTitle}>사용자 화면 미리보기</div>
          <div className={styles.segmented}>
            {(['Desktop', 'Mobile'] as const).map((item) => (
              <button key={item} type="button" className={`${styles.segmentBtn} ${device === item ? styles.segmentActive : ''}`} onClick={() => setDevice(item)}>{item}</button>
            ))}
          </div>
          <div className={styles.segmented}>
            {PREVIEW_MODES.map((item) => (
              <button key={item} type="button" className={`${styles.segmentBtn} ${mode === item ? styles.segmentActive : ''}`} onClick={() => setMode(item)}>{item}</button>
            ))}
          </div>
          <div className={styles.previewSpacer} />
          <button type="button" className={styles.previewClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.previewCanvas}>
          <div className={`${styles.previewPage} ${device === 'Mobile' ? styles.previewMobile : ''}`}>
            <div className={styles.previewHero} style={{ '--event-tone': event.imageTone } as CSSProperties}>
              <div className={styles.previewEyebrow}>EVENT</div>
              <div className={styles.previewEventTitle}>{event.displayName || '사용자 노출명을 입력해 주세요'}</div>
              <div className={styles.previewEventPeriod}>{fmtCompactRange(event.eventStartAt, event.eventEndAt)}</div>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewSummary}>{event.summary || '이벤트 요약이 여기에 표시됩니다.'}</div>
              {event.benefitName && event.benefitName !== '-' && (
                <>
                  <div className={styles.previewSectionTitle}>혜택</div>
                  <div className={styles.previewText}>{event.benefitName}</div>
                </>
              )}
              <button type="button" className={styles.previewCta} disabled={disabled}>{cta}</button>
              <div className={styles.previewSectionTitle}>이벤트 안내</div>
              <div className={styles.previewText}>{event.content || '이벤트 상세 콘텐츠가 여기에 표시됩니다.'}</div>
              <div className={styles.previewSectionTitle}>참여 방법</div>
              <div className={styles.previewText}>{event.participationGuide || event.participationMethod}</div>
              <div className={styles.previewSectionTitle}>유의사항</div>
              <div className={styles.previewText}>{event.caution || '등록된 유의사항이 없습니다.'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
