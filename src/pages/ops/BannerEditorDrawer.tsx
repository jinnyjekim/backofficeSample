import { DatePicker } from '../../components/forms/DatePicker';
import { useMemo, useRef, useState } from 'react';
import styles from './opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  BANNER_POSITIONS,
  countOverlapping,
  positionMeta,
  type Banner,
  type BannerTarget,
  type Device,
  type LinkType,
} from './bannersData';

export type PublishMode = '즉시' | '예약' | '비활성';

export interface BannerFormData {
  name: string;
  positionCode: string;
  device: Device;
  hasPcImage: boolean;
  hasMobileImage: boolean;
  useDesktopForMobile: boolean;
  altText: string;
  title: string;
  description: string;
  buttonLabel: string;
  linkType: LinkType;
  linkUrl: string;
  target: BannerTarget;
  order: number;
  publishMode: PublishMode;
  startDate: string;
  startTime: string;
  endMode: '없음' | '지정';
  endDate: string;
  endTime: string;
  memo: string;
}

interface Props {
  banner: Banner | null;
  allBanners: Banner[];
  todayIso: string;
  onCancel: () => void;
  onSubmit: (form: BannerFormData) => void;
}

function toIso(dotDate: string): string {
  return dotDate.replaceAll('.', '-');
}
function toDot(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

export function BannerEditorDrawer({ banner, allBanners, todayIso, onCancel, onSubmit }: Props) {
  const editing = !!banner;

  const [name, setName] = useState(banner?.name ?? '');
  const [positionCode, setPositionCode] = useState(banner?.positionCode ?? BANNER_POSITIONS[0].code);
  const [device, setDevice] = useState<Device>(banner?.device ?? '전체');
  const [hasPcImage, setHasPcImage] = useState(banner?.hasPcImage ?? false);
  const [hasMobileImage, setHasMobileImage] = useState(banner?.hasMobileImage ?? false);
  const [useDesktopForMobile, setUseDesktopForMobile] = useState(banner?.useDesktopForMobile ?? false);
  const [altText, setAltText] = useState(banner?.altText ?? '');
  const [title, setTitle] = useState(banner?.title ?? '');
  const [description, setDescription] = useState(banner?.description ?? '');
  const [buttonLabel, setButtonLabel] = useState(banner?.buttonLabel ?? '자세히 보기');
  const [linkType, setLinkType] = useState<LinkType>(banner?.linkType ?? '내부 페이지');
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? '');
  const [target, setTarget] = useState<BannerTarget>(banner?.target ?? '전체 사용자');
  const [order, setOrder] = useState(banner?.order ?? 1);

  const initialMode: PublishMode = banner?.manualHidden ? '비활성' : banner?.startAt ? '예약' : '즉시';
  const [publishMode, setPublishMode] = useState<PublishMode>(editing ? initialMode : '즉시');
  const [startDate, setStartDate] = useState(banner?.startAt ? toIso(banner.startAt.split(' ')[0]) : todayIso);
  const [startTime, setStartTime] = useState(banner?.startAt?.split(' ')[1] ?? '09:00');
  const [endMode, setEndMode] = useState<'없음' | '지정'>(banner?.endAt ? '지정' : '없음');
  const [endDate, setEndDate] = useState(banner?.endAt ? toIso(banner.endAt.split(' ')[0]) : todayIso);
  const [endTime, setEndTime] = useState(banner?.endAt?.split(' ')[1] ?? '23:59');
  const [memo, setMemo] = useState('');

  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'Desktop' | 'Mobile'>('Desktop');

  const pos = positionMeta(positionCode);

  const overlapCount = useMemo(() => {
    if (publishMode === '비활성') return 0;
    const s = publishMode === '즉시' ? `${todayIso.replaceAll('-', '.')} ${startTime}` : `${toDot(startDate)} ${startTime}`;
    const e = endMode === '없음' ? null : `${toDot(endDate)} ${endTime}`;
    return countOverlapping(allBanners, positionCode, s, e, banner?.id);
  }, [allBanners, positionCode, publishMode, startDate, startTime, endMode, endDate, endTime, todayIso, banner?.id]);

  const overCapacity = overlapCount + 1 > pos.maxCount;

  function submit() {
    if (!name.trim() || !altText.trim()) return;
    onSubmit({
      name: name.trim(), positionCode, device, hasPcImage, hasMobileImage, useDesktopForMobile,
      altText: altText.trim(), title, description, buttonLabel, linkType, linkUrl, target, order,
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
            <div className={styles.eyebrow}>운영 관리 · 배너</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{editing ? `배너 수정 · ${banner!.id}` : '배너 등록'}</span>
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
            <div className={previewDevice === 'Mobile' ? styles.previewMobileFrame : undefined}>
              <div style={{ height: 90, borderRadius: 10, background: '#818cf8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginBottom: 10 }}>
                {pos.label} · {previewDevice === 'Mobile' ? pos.mobileSpec : pos.pcSpec}
              </div>
              <div className={styles.previewTitle}>{title || name || '(제목 없음)'}</div>
              <div className={styles.previewMeta}>{description}</div>
              {buttonLabel && <span className={styles.badge} style={{ background: '#18181b', color: '#fff' }}>{buttonLabel}</span>}
            </div>
          </div>
        )}

        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>배너 관리명 *</label>
          <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="내부에서 구분할 배너명" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>노출 위치 *</label>
          <select className={styles.formSelect} value={positionCode} onChange={(e) => setPositionCode(e.target.value)}>
            {BANNER_POSITIONS.map((p) => (
              <option key={p.code} value={p.code}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.fieldBox} style={{ marginTop: 8 }}>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>권장 PC 규격</span><span className={styles.fieldValue}>{pos.pcSpec}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>권장 Mobile 규격</span><span className={styles.fieldValue}>{pos.mobileSpec}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>최대 동시 노출</span><span className={styles.fieldValue}>{pos.maxCount}개 · {pos.mode}</span></div>
        </div>
        {overCapacity && (
          <div className={styles.issueBanner} style={{ marginTop: 10 }}>
            ⚠ 같은 기간에 &apos;{pos.label}&apos; 위치의 최대 노출 개수({pos.maxCount}개)를 초과합니다. (현재 겹치는 배너 {overlapCount}건)
          </div>
        )}

        <div className={styles.sectionTitleLoose}>배너 소재</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>노출 디바이스</label>
          <select className={styles.formSelect} value={device} onChange={(e) => setDevice(e.target.value as Device)}>
            <option value="전체">전체</option>
            <option value="PC">PC</option>
            <option value="Mobile">Mobile</option>
          </select>
        </div>
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
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>대체텍스트 *</label>
          <input className={styles.formInput} value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="스크린리더용 이미지 설명" />
        </div>

        <div className={styles.sectionTitleLoose}>텍스트 설정</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>제목</label>
          <input className={styles.formInput} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>설명</label>
          <input className={styles.formInput} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>버튼명</label>
          <input className={styles.formInput} value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} />
        </div>

        <div className={styles.sectionTitleLoose}>클릭 동작</div>
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

        <div className={styles.sectionTitleLoose}>노출 설정</div>
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
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>노출 순서 (위치 내)</label>
          <input type="number" min={1} className={styles.formInput} value={order} onChange={(e) => setOrder(Number(e.target.value) || 1)} />
        </div>

        <div className={styles.formLabel} style={{ marginBottom: 6 }}>노출 대상</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={target === '전체 사용자'} onChange={() => setTarget('전체 사용자')} />전체 사용자</label>
          <label className={styles.radioOption}><input type="radio" checked={target === '로그인 사용자'} onChange={() => setTarget('로그인 사용자')} />로그인 사용자</label>
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
