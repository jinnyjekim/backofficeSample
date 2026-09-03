import { CHECK_LABELS_BY_BUSINESS, STATUS_PILL, type ReviewItem } from './reviewData';
import type { ContentItem } from '../../data/content';
import { ACCENT } from '../../lib/theme';
import sh from './contentShared.module.css';
import styles from './ReviewPage.module.css';

interface Props {
  det: ReviewItem;
  detCd: ContentItem | null | undefined;
  onClose: () => void;
  onStartReview: () => void;
  onToggleChecklist: (index: number) => void;
  onMemoChange: (memo: string) => void;
  onOpenApprove: () => void;
  onOpenReject: () => void;
  onOpenHold: () => void;
  hasNext: boolean;
  onGoNext: () => void;
}

export function ReviewDetailPanel({
  det,
  detCd,
  onClose,
  onStartReview,
  onToggleChecklist,
  onMemoChange,
  onOpenApprove,
  onOpenReject,
  onOpenHold,
  hasNext,
  onGoNext,
}: Props) {
  const isModify = det.reqType === '수정' && det.diff;
  const diffEntries = det.diff ? Object.entries(det.diff) : [];
  const stp = STATUS_PILL[det.status];
  const decided = det.status === '승인' || det.status === '반려' || det.status === '보류';

  return (
    <div className={styles.panelRoot}>
      <div className={styles.detailHeader}>
        <button type="button" className={styles.backBtn} onClick={onClose}>닫기</button>
        <div className={styles.detailTitle}>{`검수 상세 · ${det.ctid}`}</div>
        <span className={styles.statusPill} style={{ background: '#eef2ff', color: '#4338ca' }}>{det.businessType}</span>
        <div className={sh.headerSpacer} />
        <span className={styles.assigneeLabel}>{`담당자 ${det.assignee}`}</span>
        <span className={styles.statusPill} style={{ background: stp.bg, color: stp.fg }}>{det.status}</span>
      </div>

      <div className={styles.detailBody}>
        <div className={styles.mainPane}>
          <div className={styles.contentMeta}>{`${det.reqType} · ${det.cat}`}</div>
          <div className={styles.contentTitle}>{det.title}</div>
          <div className={styles.contentSub}>{`요청자 ${det.requester} (${det.reqUtype}) · ${det.reqAt}`}</div>

          {isModify ? (
            <>
              <div className={styles.diffBanner}>{`변경 항목 ${diffEntries.length}개`}</div>
              <div className={styles.diffList}>
                {diffEntries.map(([label, d]) => (
                  <div key={label} className={styles.diffCard}>
                    <div className={styles.diffCardLabel}>{label}</div>
                    <div className={styles.diffBefore}>{d.before}</div>
                    <div className={styles.diffAfter}>{d.after}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.descBox}>{detCd ? detCd.desc : '콘텐츠 본문 정보를 찾을 수 없습니다.'}</div>
          )}
        </div>

        <div className={styles.sidePane}>
          <div className={styles.sideBody}>
            <div className={styles.sideTitle}>검수 처리</div>

            {det.assignee === '미지정' && <button type="button" className={styles.startBtn} onClick={onStartReview}>검수 시작</button>}

            <div>
              <div className={sh.formFieldLabel} style={{ marginBottom: 8 }}>검수 항목</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {det.checklist.map((checked, i) => (
                  <label key={i} className={styles.checklistRow}>
                    <input type="checkbox" checked={checked} onChange={() => onToggleChecklist(i)} style={{ marginTop: 2 }} />
                    <span className={styles.checklistLabel}>{CHECK_LABELS_BY_BUSINESS[det.businessType][i]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className={sh.formFieldLabel} style={{ marginBottom: 6 }}>관리자 메모</div>
              <textarea className={sh.formTextarea} value={det.memo} onChange={(e) => onMemoChange(e.target.value)} placeholder="내부 기록용 메모입니다." />
            </div>

            {det.rejectReason && <div className={styles.rejectNote}>{`반려 사유: ${det.rejectReason}`}</div>}

            {!decided ? (
              <div className={styles.decisionRow}>
                <button type="button" className={styles.decisionBtn} style={{ border: '1px solid rgba(185,28,28,.2)', background: '#fef2f2', color: '#b91c1c' }} onClick={onOpenReject}>반려</button>
                <button type="button" className={styles.decisionBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#3f3f46' }} onClick={onOpenHold}>보류</button>
                <button type="button" className={styles.decisionBtn} style={{ border: 0, background: ACCENT, color: '#fff' }} onClick={onOpenApprove}>승인</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={styles.doneNote}>검수가 완료되었습니다.</div>
                <div className={styles.doneRow}>
                  <button type="button" className={styles.doneBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#3f3f46' }} onClick={onClose}>닫기</button>
                  {hasNext && <button type="button" className={styles.doneBtn} style={{ border: 0, background: '#18181b', color: '#fff' }} onClick={onGoNext}>다음 검수 건</button>}
                </div>
              </div>
            )}

            <div>
              <div className={sh.formFieldLabel} style={{ marginBottom: 8 }}>검수 이력</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {det.history.slice().reverse().map((h, i) => (
                  <div key={i} className={styles.historyCard}>
                    <div className={styles.historyTop}><span>{h.at}</span><span>{h.by}</span></div>
                    <div className={styles.historyAct}>{h.act}</div>
                    {h.note && <div className={styles.historyNote}>{h.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
