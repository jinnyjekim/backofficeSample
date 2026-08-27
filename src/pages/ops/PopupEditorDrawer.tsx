import { DatePicker } from '../../components/forms/DatePicker';
import { useMemo, useRef, useState } from 'react';
import styles from './opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { Device } from './bannersData';
import {
  POPUP_SCREENS,
  countOverlappingOnScreen,
  countPriorityConflicts,
  type CloseOptions,
  type LinkType,
  type Popup,
  type PopupFrequency,
  type PopupTarget,
  type PopupTiming,
  type PopupType,
} from './popupsData';

export type PublishMode = '즉시' | '예약' | '비활성';

export interface PopupFormData {
  name: string;
  title: string;
  body: string;
  type: PopupType;
  screen: string;
  device: Device;
  hasPcImage: boolean;
  hasMobileImage: boolean;
  useDesktopForMobile: boolean;
  timing: PopupTiming;
  delaySeconds: number;
  target: PopupTarget;
  frequency: PopupFrequency;
  maxCount: number;
  close: CloseOptions;
  primaryLabel: string;
  linkType: LinkType;
  linkUrl: string;
  priority: number;
  publishMode: PublishMode;
  startDate: string;
  startTime: string;
  endMode: '없음' | '지정';
  endDate: string;
  endTime: string;
  memo: string;
}

interface Props {
  popup: Popup | null;
  allPopups: Popup[];
  todayIso: string;
  onCancel: () => void;
  onSubmit: (form: PopupFormData) => void;
}

function toIso(dotDate: string): string {
  return dotDate.replaceAll('.', '-');
}
function toDot(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

export function PopupEditorDrawer({ popup, allPopups, todayIso, onCancel, onSubmit }: Props) {
  const editing = !!popup;

  const [name, setName] = useState(popup?.name ?? '');
  const [title, setTitle] = useState(popup?.title ?? '');
  const [body, setBody] = useState(popup?.body ?? '');
  const [type, setType] = useState<PopupType>(popup?.type ?? '이미지 + 텍스트');
  const [screen, setScreen] = useState(popup?.screen ?? POPUP_SCREENS[0]);
  const [device, setDevice] = useState<Device>(popup?.device ?? '전체');
  const [hasPcImage, setHasPcImage] = useState(popup?.hasPcImage ?? false);
  const [hasMobileImage, setHasMobileImage] = useState(popup?.hasMobileImage ?? false);
  const [useDesktopForMobile, setUseDesktopForMobile] = useState(popup?.useDesktopForMobile ?? false);
  const [timing, setTiming] = useState<PopupTiming>(popup?.timing ?? '페이지 진입 즉시');
  const [delaySeconds, setDelaySeconds] = useState(popup?.delaySeconds ?? 3);
  const [target, setTarget] = useState<PopupTarget>(popup?.target ?? '전체 사용자');
  const [frequency, setFrequency] = useState<PopupFrequency>(popup?.frequency ?? '세션당 1회');
  const [maxCount, setMaxCount] = useState(popup?.maxCount ?? 3);
  const [close, setClose] = useState<CloseOptions>(popup?.close ?? { showCloseButton: true, closeOnOutsideClick: true, closeOnEsc: true, hideToday: true, hideForever: false });
  const [primaryLabel, setPrimaryLabel] = useState(popup?.primaryLabel ?? '자세히 보기');
  const [linkType, setLinkType] = useState<LinkType>(popup?.linkType ?? '내부 페이지');
  const [linkUrl, setLinkUrl] = useState(popup?.linkUrl ?? '');
  const [priority, setPriority] = useState(popup?.priority ?? 1);

  const initialMode: PublishMode = popup?.manualHidden ? '비활성' : popup?.startAt ? '예약' : '즉시';
  const [publishMode, setPublishMode] = useState<PublishMode>(editing ? initialMode : '즉시');
  const [startDate, setStartDate] = useState(popup?.startAt ? toIso(popup.startAt.split(' ')[0]) : todayIso);
  const [startTime, setStartTime] = useState(popup?.startAt?.split(' ')[1] ?? '09:00');
  const [endMode, setEndMode] = useState<'없음' | '지정'>(popup?.endAt ? '지정' : '없음');
  const [endDate, setEndDate] = useState(popup?.endAt ? toIso(popup.endAt.split(' ')[0]) : todayIso);
  const [endTime, setEndTime] = useState(popup?.endAt?.split(' ')[1] ?? '23:59');
  const [memo, setMemo] = useState('');

  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'Desktop' | 'Mobile'>('Desktop');

  const { overlapCount, conflictCount } = useMemo(() => {
    if (publishMode === '비활성') return { overlapCount: 0, conflictCount: 0 };
    const s = publishMode === '즉시' ? `${todayIso.replaceAll('-', '.')} ${startTime}` : `${toDot(startDate)} ${startTime}`;
    const e = endMode === '없음' ? null : `${toDot(endDate)} ${endTime}`;
    return {
      overlapCount: countOverlappingOnScreen(allPopups, screen, s, e, popup?.id),
      conflictCount: countPriorityConflicts(allPopups, screen, priority, s, e, popup?.id),
    };
  }, [allPopups, screen, priority, publishMode, startDate, startTime, endMode, endDate, endTime, todayIso, popup?.id]);

  function toggleClose(key: keyof CloseOptions) {
    setClose((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function submit() {
    if (!name.trim() || !title.trim()) return;
    onSubmit({
      name: name.trim(), title: title.trim(), body, type, screen, device, hasPcImage, hasMobileImage, useDesktopForMobile,
      timing, delaySeconds, target, frequency, maxCount, close, primaryLabel, linkType, linkUrl, priority,
      publishMode,
      startDate: toDot(startDate), startTime,
      endMode, endDate: toDot(endDate), endTime,
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
            <div className={styles.eyebrow}>운영 관리 · 팝업</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{editing ? `팝업 수정 · ${popup!.id}` : '팝업 등록'}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        {showPreview && (
          <div className={styles.previewCard}>
            <div className={styles.previewToggleRow}>
              <button type="button" className={`${styles.previewToggleBtn} ${previewDevice === 'Desktop' ? styles.previewActive : ''}`} onClick={() => setPreviewDevice('Desktop')}>Desktop</button>
              <button type="button" className={`${styles.previewToggleBtn} ${previewDevice === 'Mobile' ? styles.previewActive : ''}`} onClick={() => setPreviewDevice('Mobile')}>Mobile</button>
            </div>
            <div style={{ background: '#e4e4e7', borderRadius: 10, padding: 20 }}>
              <div className={previewDevice === 'Mobile' ? styles.previewMobileFrame : undefined} style={{ maxWidth: previewDevice === 'Mobile' ? 280 : 360, margin: '0 auto', boxShadow: '0 12px 30px rgba(0,0,0,.18)' }}>
                <div className={styles.previewTitle}>{title || '(제목 없음)'}</div>
                <div className={styles.previewMeta}>{screen} · {timing}</div>
                <div className={styles.previewBody}>{body || '(본문 없음)'}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <span className={styles.badge} style={{ background: '#18181b', color: '#fff' }}>{primaryLabel}</span>
                  {close.showCloseButton && <span className={styles.badge} style={{ background: '#f4f4f5', color: '#52525b' }}>닫기</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>팝업 관리명 *</label>
          <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="내부에서 구분할 관리명" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>팝업 유형</label>
          <select className={styles.formSelect} value={type} onChange={(e) => setType(e.target.value as PopupType)}>
            <option>이미지</option>
            <option>텍스트</option>
            <option>이미지 + 텍스트</option>
          </select>
        </div>

        <div className={styles.sectionTitleLoose}>콘텐츠</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>사용자 제목 *</label>
          <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>본문</label>
          <textarea className={styles.formTextarea} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>노출 디바이스</label>
          <select className={styles.formSelect} value={device} onChange={(e) => setDevice(e.target.value as Device)}>
            <option value="전체">전체</option>
            <option value="PC">PC</option>
            <option value="Mobile">Mobile</option>
          </select>
        </div>
        {type !== '텍스트' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.checkRow}><input type="checkbox" checked={hasPcImage} onChange={(e) => setHasPcImage(e.target.checked)} />PC 이미지 등록됨</label>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkRow}><input type="checkbox" checked={hasMobileImage} onChange={(e) => setHasMobileImage(e.target.checked)} />Mobile 이미지 등록됨</label>
            </div>
            {!hasMobileImage && (
              <div className={styles.formGroup}>
                <label className={styles.checkRow}><input type="checkbox" checked={useDesktopForMobile} onChange={(e) => setUseDesktopForMobile(e.target.checked)} />PC 이미지를 모바일에도 사용</label>
              </div>
            )}
          </>
        )}

        <div className={styles.sectionTitleLoose}>버튼 / 링크</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>버튼명</label>
          <input className={styles.formInput} value={primaryLabel} onChange={(e) => setPrimaryLabel(e.target.value)} />
        </div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={linkType === '없음'} onChange={() => setLinkType('없음')} />없음</label>
          <label className={styles.radioOption}><input type="radio" checked={linkType === '내부 페이지'} onChange={() => setLinkType('내부 페이지')} />내부 페이지</label>
          <label className={styles.radioOption}><input type="radio" checked={linkType === '외부 URL'} onChange={() => setLinkType('외부 URL')} />외부 URL</label>
        </div>
        {linkType !== '없음' && (
          <div className={styles.formGroup}>
            <input className={styles.formInput} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder={linkType === '외부 URL' ? 'https://...' : '/path'} />
          </div>
        )}

        <div className={styles.sectionTitleLoose}>노출 위치</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>노출 화면 *</label>
          <select className={styles.formSelect} value={screen} onChange={(e) => setScreen(e.target.value)}>
            {POPUP_SCREENS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {screen === '전체 서비스' && (
          <div className={styles.issueBanner}>⚠ 모든 주요 화면에서 팝업이 노출될 수 있습니다. 노출 빈도 설정을 확인해 주세요.</div>
        )}
        <div className={styles.formGroup} style={{ marginTop: 10 }}>
          <label className={styles.formLabel}>표시 시점</label>
          <select className={styles.formSelect} value={timing} onChange={(e) => setTiming(e.target.value as PopupTiming)}>
            <option>페이지 진입 즉시</option>
            <option>로그인 완료 후</option>
            <option>N초 후</option>
          </select>
        </div>
        {timing === 'N초 후' && (
          <div className={styles.formGroup}>
            <input type="number" min={0} max={30} className={styles.formInput} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value) || 0)} />
          </div>
        )}

        {(overlapCount > 0 || conflictCount > 0) && (
          <div className={styles.issueBanner} style={{ marginTop: 10 }}>
            ⚠ 같은 화면·기간에 노출 예정인 팝업이 {overlapCount}건 있습니다.
            {conflictCount > 0 && <> 이 중 우선순위가 동일한 팝업이 {conflictCount}건입니다.</>}
          </div>
        )}

        <div className={styles.sectionTitleLoose}>노출 일정</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '즉시'} onChange={() => setPublishMode('즉시')} />즉시 노출</label>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '예약'} onChange={() => setPublishMode('예약')} />예약 노출</label>
          <label className={styles.radioOption}><input type="radio" checked={publishMode === '비활성'} onChange={() => setPublishMode('비활성')} />비활성</label>
        </div>
        {publishMode === '예약' && (
          <div className={styles.dateTimeRow}>
            <DatePicker className={styles.dateInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="time" className={styles.timeInput} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        )}
        <div className={styles.formLabel} style={{ marginBottom: 6 }}>노출 종료</div>
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
          <label className={styles.radioOption}><input type="radio" checked={target === '로그인 사용자'} onChange={() => setTarget('로그인 사용자')} />로그인 사용자</label>
          <label className={styles.radioOption}><input type="radio" checked={target === '비로그인 사용자'} onChange={() => setTarget('비로그인 사용자')} />비로그인 사용자</label>
          <label className={styles.radioOption}><input type="radio" checked={target === '특정 회원 그룹'} onChange={() => setTarget('특정 회원 그룹')} />특정 회원 그룹</label>
        </div>

        <div className={styles.sectionTitleLoose}>노출 빈도</div>
        <div className={styles.radioRow} style={{ flexWrap: 'wrap' }}>
          <label className={styles.radioOption}><input type="radio" checked={frequency === '세션당 1회'} onChange={() => setFrequency('세션당 1회')} />세션당 1회</label>
          <label className={styles.radioOption}><input type="radio" checked={frequency === '하루 1회'} onChange={() => setFrequency('하루 1회')} />하루 1회</label>
          <label className={styles.radioOption}><input type="radio" checked={frequency === '최초 1회'} onChange={() => setFrequency('최초 1회')} />최초 1회</label>
          <label className={styles.radioOption}><input type="radio" checked={frequency === '사용자당 N회'} onChange={() => setFrequency('사용자당 N회')} />사용자당 N회</label>
          <label className={styles.radioOption}><input type="radio" checked={frequency === '매 방문마다'} onChange={() => setFrequency('매 방문마다')} />매 방문마다</label>
        </div>
        {frequency === '매 방문마다' && (
          <div className={styles.issueBanner}>⚠ 사용자가 화면을 방문할 때마다 노출됩니다. 사용자 경험에 큰 영향을 줄 수 있습니다.</div>
        )}
        {frequency === '사용자당 N회' && (
          <div className={styles.formGroup} style={{ marginTop: 8 }}>
            <input type="number" min={1} className={styles.formInput} value={maxCount} onChange={(e) => setMaxCount(Number(e.target.value) || 1)} />
          </div>
        )}

        <div className={styles.sectionTitleLoose}>닫기 옵션</div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}><input type="checkbox" checked={close.showCloseButton} onChange={() => toggleClose('showCloseButton')} />X 버튼 표시</label>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}><input type="checkbox" checked={close.closeOnOutsideClick} onChange={() => toggleClose('closeOnOutsideClick')} />외부 영역 클릭 시 닫기</label>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}><input type="checkbox" checked={close.closeOnEsc} onChange={() => toggleClose('closeOnEsc')} />ESC로 닫기</label>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}><input type="checkbox" checked={close.hideToday} onChange={() => toggleClose('hideToday')} />오늘 하루 보지 않기</label>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}><input type="checkbox" checked={close.hideForever} onChange={() => toggleClose('hideForever')} />다시 보지 않기</label>
        </div>
        {close.hideForever && (
          <div className={styles.issueBanner}>⚠ 사용자가 선택하면 해당 팝업이 다시 표시되지 않습니다. 중요 공지에는 신중히 설정하세요.</div>
        )}
        {!close.showCloseButton && !close.closeOnOutsideClick && !close.closeOnEsc && (
          <div className={styles.issueBanner}>⚠ 닫기 수단이 없는 팝업은 사용자 진행을 차단합니다.</div>
        )}

        <div className={styles.sectionTitleLoose}>우선순위</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>숫자가 작을수록 우선 노출됩니다</label>
          <input type="number" min={1} className={styles.formInput} value={priority} onChange={(e) => setPriority(Number(e.target.value) || 1)} />
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
