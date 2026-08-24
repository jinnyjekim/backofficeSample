import { useMemo, useState, type CSSProperties } from 'react';
import styles from './EventsPage.module.css';
import { EventPreviewDialog } from './EventPreviewDialog';
import {
  BENEFIT_TYPES,
  EVENT_MANAGERS,
  EVENT_TARGETS,
  EVENT_TYPES,
  GRANT_METHODS,
  PARTICIPATION_LIMITS,
  PARTICIPATION_METHODS,
  type BenefitType,
  type EventEntry,
  type EventTarget,
  type EventType,
  type GrantMethod,
  type ParticipationLimit,
  type ParticipationMethod,
} from './eventsData';

export interface EventFormValues {
  managementName: string;
  displayName: string;
  type: EventType;
  manager: string;
  summary: string;
  content: string;
  participationGuide: string;
  caution: string;
  hasHeroImage: boolean;
  imageTone: string;
  eventStartAt: string;
  eventEndAt: string;
  displayStartAt: string;
  displayEndAt: string;
  target: EventTarget;
  targetDetail: string;
  exclusions: string[];
  participationMethod: ParticipationMethod;
  participationLimit: ParticipationLimit;
  benefitType: BenefitType;
  benefitName: string;
  grantMethod: GrantMethod;
  benefitTotal: number;
  plannedWinners: number;
  announcementAt: string;
  selectionMethod: '수동' | '랜덤 추첨';
  bannerLinked: boolean;
  popupLinked: boolean;
  noticeLinked: boolean;
  memo: string;
}

interface Props {
  event: EventEntry | null;
  onCancel: () => void;
  onSubmit: (values: EventFormValues, mode: 'draft' | 'publish') => void;
}

function toInput(value: string): string {
  return value ? value.replace(' ', 'T') : '';
}

function initialValues(event: EventEntry | null): EventFormValues {
  if (event) {
    return {
      managementName: event.managementName,
      displayName: event.displayName,
      type: event.type,
      manager: event.manager,
      summary: event.summary,
      content: event.content,
      participationGuide: event.participationGuide,
      caution: event.caution,
      hasHeroImage: event.hasHeroImage,
      imageTone: event.imageTone,
      eventStartAt: toInput(event.eventStartAt),
      eventEndAt: toInput(event.eventEndAt),
      displayStartAt: toInput(event.displayStartAt),
      displayEndAt: toInput(event.displayEndAt),
      target: event.target,
      targetDetail: event.targetDetail ?? '',
      exclusions: event.exclusions,
      participationMethod: event.participationMethod,
      participationLimit: event.participationLimit,
      benefitType: event.benefitType,
      benefitName: event.benefitName,
      grantMethod: event.grantMethod,
      benefitTotal: event.benefitTotal,
      plannedWinners: event.winner?.plannedWinners ?? 0,
      announcementAt: toInput(event.winner?.announcementAt ?? ''),
      selectionMethod: event.winner?.selectionMethod ?? '수동',
      bannerLinked: event.linkedBanners.length > 0,
      popupLinked: event.linkedPopups.length > 0,
      noticeLinked: !!event.linkedNotice,
      memo: '',
    };
  }
  return {
    managementName: '', displayName: '', type: '참여형', manager: 'admin01', summary: '', content: '', participationGuide: '', caution: '',
    hasHeroImage: false, imageTone: '#4f46e5', eventStartAt: '2026-09-01T00:00', eventEndAt: '2026-09-15T23:59',
    displayStartAt: '2026-08-25T09:00', displayEndAt: '2026-09-20T23:59', target: '전체 사용자', targetDetail: '',
    exclusions: ['제재 회원', '탈퇴 회원'], participationMethod: '신청 버튼', participationLimit: '1인 1회', benefitType: '혜택 없음',
    benefitName: '', grantMethod: '참여 즉시', benefitTotal: 0, plannedWinners: 0, announcementAt: '', selectionMethod: '수동',
    bannerLinked: false, popupLinked: false, noticeLinked: false, memo: '',
  };
}

export function EventEditorPage({ event, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState<EventFormValues>(() => initialValues(event));
  const [showPreview, setShowPreview] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const errors = useMemo(() => {
    const items: string[] = [];
    if (!form.managementName.trim()) items.push('이벤트 관리명을 입력해 주세요.');
    if (!form.displayName.trim()) items.push('사용자 노출명을 입력해 주세요.');
    if (!form.eventStartAt || !form.eventEndAt) items.push('이벤트 참여기간을 입력해 주세요.');
    if (form.eventStartAt && form.eventEndAt && form.eventStartAt >= form.eventEndAt) items.push('이벤트 종료는 시작보다 늦어야 합니다.');
    if (form.displayStartAt && form.displayEndAt && form.displayStartAt >= form.displayEndAt) items.push('페이지 노출 종료는 시작보다 늦어야 합니다.');
    if (form.benefitType !== '혜택 없음' && !form.benefitName.trim()) items.push('연결할 혜택을 입력해 주세요.');
    if (form.type === '응모형' && form.plannedWinners < 1) items.push('응모형 이벤트의 당첨 인원을 입력해 주세요.');
    return items;
  }, [form]);

  const displayWarning = form.displayEndAt && form.eventEndAt && form.displayEndAt < form.eventEndAt;

  function setField<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setType(value: EventType) {
    setForm((prev) => value === '안내형'
      ? { ...prev, type: value, participationMethod: '참여 기능 없음', benefitType: '혜택 없음', benefitName: '', benefitTotal: 0 }
      : value === '응모형'
        ? { ...prev, type: value, participationMethod: '응모', grantMethod: '당첨 후' }
        : { ...prev, type: value });
  }

  function toggleExclusion(value: string) {
    setForm((prev) => ({
      ...prev,
      exclusions: prev.exclusions.includes(value) ? prev.exclusions.filter((item) => item !== value) : [...prev.exclusions, value],
    }));
  }

  function save(mode: 'draft' | 'publish') {
    if (mode === 'publish' && errors.length) {
      setShowErrors(true);
      return;
    }
    onSubmit(form, mode);
  }

  const previewEvent = {
    displayName: form.displayName,
    summary: form.summary,
    content: form.content,
    participationGuide: form.participationGuide,
    caution: form.caution,
    eventStartAt: form.eventStartAt.replace('T', ' '),
    eventEndAt: form.eventEndAt.replace('T', ' '),
    participationMethod: form.participationMethod,
    benefitName: form.benefitName,
    imageTone: form.imageTone,
  };

  return (
    <div className={styles.editorPage}>
      <div className={styles.editorHead}>
        <button type="button" className={styles.backBtn} onClick={onCancel}>←</button>
        <div className={styles.editorTitleWrap}>
          <div className={styles.editorEyebrow}>운영 관리 · 이벤트</div>
          <div className={styles.editorTitle}>{event ? '이벤트 수정' : '이벤트 등록'}</div>
        </div>
        <div className={styles.editorActions}>
          <button type="button" className={styles.secondaryBtn} onClick={onCancel}>취소</button>
          <button type="button" className={styles.secondaryBtn} onClick={() => save('draft')}>임시저장</button>
          <button type="button" className={styles.secondaryBtn} onClick={() => setShowPreview(true)}>미리보기</button>
          <button type="button" className={styles.primaryBtn} onClick={() => save('publish')}>{event ? '저장' : '등록'}</button>
        </div>
      </div>

      <div className={styles.editorLayout}>
        <div className={styles.editorMain}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>기본 정보</div><div className={styles.sectionDesc}>관리 검색용 이름과 사용자에게 보이는 이름을 분리합니다.</div></div></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span className={styles.label}>이벤트 관리명 <span className={styles.required}>*</span></span><input className={styles.input} value={form.managementName} onChange={(e) => setField('managementName', e.target.value)} placeholder="예: 2026_09_신규회원_프로모션" /><div className={styles.help}>관리자 목록과 검색에 사용하는 내부 명칭입니다.</div></label>
              <label className={styles.field}><span className={styles.label}>사용자 노출명 <span className={styles.required}>*</span></span><input className={styles.input} value={form.displayName} onChange={(e) => setField('displayName', e.target.value)} placeholder="예: 신규 회원 특별 이벤트" /></label>
              <label className={styles.field}><span className={styles.label}>이벤트 유형 <span className={styles.required}>*</span></span><select className={styles.select} value={form.type} onChange={(e) => setType(e.target.value as EventType)}>{EVENT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className={styles.field}><span className={styles.label}>담당자</span><select className={styles.select} value={form.manager} onChange={(e) => setField('manager', e.target.value)}>{EVENT_MANAGERS.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className={`${styles.field} ${styles.span2}`}><span className={styles.label}>이벤트 요약</span><input className={styles.input} value={form.summary} onChange={(e) => setField('summary', e.target.value)} placeholder="목록과 상세 상단에 표시할 한 줄 설명" /></label>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>이벤트 콘텐츠</div><div className={styles.sectionDesc}>대표 이미지는 이벤트 상세 전용이며 배너·팝업 소재와 분리됩니다.</div></div></div>
            <div className={styles.formGrid}>
              <div className={`${styles.field} ${styles.span2}`}>
                <span className={styles.label}>대표 이미지</span>
                <div className={styles.imageDrop}>
                  {form.hasHeroImage && <div className={styles.imagePreview} style={{ '--event-tone': form.imageTone } as CSSProperties} />}
                  <div><div style={{ fontSize: 12, marginBottom: 7 }}>{form.hasHeroImage ? '대표 이미지가 등록되었습니다.' : '이벤트 대표 이미지를 등록해 주세요.'}</div><button type="button" className={styles.smallAction} onClick={() => setField('hasHeroImage', !form.hasHeroImage)}>{form.hasHeroImage ? '이미지 제거' : '이미지 업로드'}</button></div>
                </div>
              </div>
              <label className={`${styles.field} ${styles.span2}`}><span className={styles.label}>이벤트 설명</span><textarea className={styles.textarea} value={form.content} onChange={(e) => setField('content', e.target.value)} placeholder="이벤트 상세 내용을 입력하세요" /></label>
              <label className={styles.field}><span className={styles.label}>참여 방법 안내</span><textarea className={styles.textarea} value={form.participationGuide} onChange={(e) => setField('participationGuide', e.target.value)} placeholder="사용자가 따라야 할 참여 순서" /></label>
              <label className={styles.field}><span className={styles.label}>유의사항</span><textarea className={styles.textarea} value={form.caution} onChange={(e) => setField('caution', e.target.value)} placeholder="중복 참여, 취소·반품 등 유의사항" /></label>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>기간 설정</div><div className={styles.sectionDesc}>참여기간과 페이지 노출기간을 독립적으로 관리합니다.</div></div></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span className={styles.label}>이벤트 시작 <span className={styles.required}>*</span></span><input type="datetime-local" className={styles.input} value={form.eventStartAt} onChange={(e) => setField('eventStartAt', e.target.value)} /></label>
              <label className={styles.field}><span className={styles.label}>이벤트 종료 <span className={styles.required}>*</span></span><input type="datetime-local" className={styles.input} value={form.eventEndAt} onChange={(e) => setField('eventEndAt', e.target.value)} /></label>
              <label className={styles.field}><span className={styles.label}>페이지 노출 시작</span><input type="datetime-local" className={styles.input} value={form.displayStartAt} onChange={(e) => setField('displayStartAt', e.target.value)} /></label>
              <label className={styles.field}><span className={styles.label}>페이지 노출 종료</span><input type="datetime-local" className={styles.input} value={form.displayEndAt} onChange={(e) => setField('displayEndAt', e.target.value)} /></label>
            </div>
            {displayWarning && <div className={styles.warning}>⚠ 이벤트 종료 전에 페이지 노출이 종료됩니다. 참여 중인 사용자가 이벤트 페이지를 확인할 수 없는 기간이 생깁니다.</div>}
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>참여 대상</div><div className={styles.sectionDesc}>대상 조건과 시스템상 참여 불가 대상을 함께 설정합니다.</div></div></div>
            <div className={styles.choiceGrid}>
              {EVENT_TARGETS.map((item) => <label key={item} className={styles.choice}><input type="radio" name="event-target" checked={form.target === item} onChange={() => setField('target', item)} /><span><div className={styles.choiceTitle}>{item}</div><div className={styles.choiceSub}>{item === '전체 사용자' ? '로그인 여부와 관계없이 노출' : item === '로그인 사용자' ? '회원 식별이 가능한 사용자' : '조건에 맞는 대상만 참여'}</div></span></label>)}
            </div>
            {form.target !== '전체 사용자' && <label className={styles.field} style={{ display: 'block', marginTop: 12 }}><span className={styles.label}>대상 조건</span><input className={styles.input} value={form.targetDetail} onChange={(e) => setField('targetDetail', e.target.value)} placeholder="예: 2026-09-01 이후 가입한 거래처" /></label>}
            <div className={styles.label} style={{ marginTop: 14 }}>참여 제외 대상</div>
            <div className={styles.checkGrid}>{['이미 참여 완료', '제재 회원', '탈퇴 회원'].map((item) => <label key={item} className={styles.checkItem}><input type="checkbox" checked={form.exclusions.includes(item)} onChange={() => toggleExclusion(item)} />{item}</label>)}</div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>참여 조건</div><div className={styles.sectionDesc}>공통 템플릿에서는 선택형 참여 방식과 횟수 제한을 제공합니다.</div></div></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span className={styles.label}>참여 방식</span><select className={styles.select} value={form.participationMethod} onChange={(e) => setField('participationMethod', e.target.value as ParticipationMethod)}>{PARTICIPATION_METHODS.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className={styles.field}><span className={styles.label}>참여 횟수</span><select className={styles.select} value={form.participationLimit} onChange={(e) => setField('participationLimit', e.target.value as ParticipationLimit)}>{PARTICIPATION_LIMITS.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>혜택 / 지급</div><div className={styles.sectionDesc}>혜택은 쿠폰·포인트 모듈에서 생성한 정책을 연결하는 구조입니다.</div></div></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span className={styles.label}>혜택 유형</span><select className={styles.select} value={form.benefitType} onChange={(e) => setField('benefitType', e.target.value as BenefitType)}>{BENEFIT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className={styles.field}><span className={styles.label}>지급 방식</span><select className={styles.select} value={form.grantMethod} disabled={form.benefitType === '혜택 없음'} onChange={(e) => setField('grantMethod', e.target.value as GrantMethod)}>{GRANT_METHODS.map((item) => <option key={item}>{item}</option>)}</select></label>
              {form.benefitType !== '혜택 없음' && <><label className={styles.field}><span className={styles.label}>연결 혜택 <span className={styles.required}>*</span></span><input className={styles.input} value={form.benefitName} onChange={(e) => setField('benefitName', e.target.value)} placeholder="쿠폰/포인트/경품 정책 선택" /></label><label className={styles.field}><span className={styles.label}>총 지급 가능 수량</span><input type="number" min="0" className={styles.input} value={form.benefitTotal} onChange={(e) => setField('benefitTotal', Number(e.target.value))} /></label></>}
            </div>
          </section>

          {form.type === '응모형' && <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>응모 / 당첨 설정</div><div className={styles.sectionDesc}>이벤트 상태와 당첨 처리 상태는 별도로 관리됩니다.</div></div></div>
            <div className={styles.formGrid}>
              <label className={styles.field}><span className={styles.label}>당첨 인원</span><input type="number" min="1" className={styles.input} value={form.plannedWinners} onChange={(e) => setField('plannedWinners', Number(e.target.value))} /></label>
              <label className={styles.field}><span className={styles.label}>당첨 발표일</span><input type="datetime-local" className={styles.input} value={form.announcementAt} onChange={(e) => setField('announcementAt', e.target.value)} /></label>
              <label className={styles.field}><span className={styles.label}>당첨 방식</span><select className={styles.select} value={form.selectionMethod} onChange={(e) => setField('selectionMethod', e.target.value as '수동' | '랜덤 추첨')}><option>수동</option><option>랜덤 추첨</option></select></label>
            </div>
          </section>}

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>노출 연결</div><div className={styles.sectionDesc}>이벤트는 원본 콘텐츠이고 배너·팝업은 별도 노출 채널입니다.</div></div></div>
            <div className={styles.formGrid}>
              {([['bannerLinked', '배너', '메인·마이페이지 배너 연결'], ['popupLinked', '팝업', '첫 접속·조건형 팝업 연결'], ['noticeLinked', '공지사항', '관련 공지 또는 결과 안내 연결']] as const).map(([key, label, text]) => <div className={styles.linkPlaceholder} key={key}><div><b>{label}</b><div className={styles.help}>{text}</div></div><button type="button" className={styles.smallAction} onClick={() => setField(key, !form[key])}>{form[key] ? '연결됨 ✓' : '＋ 연결'}</button></div>)}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeading}><div><div className={styles.sectionTitle}>내부 관리</div><div className={styles.sectionDesc}>사용자에게 노출되지 않는 운영 메모입니다.</div></div></div>
            <label className={styles.field}><span className={styles.label}>관리자 메모</span><textarea className={styles.textarea} value={form.memo} onChange={(e) => setField('memo', e.target.value)} placeholder="인수인계 또는 운영 참고사항을 입력하세요" /></label>
          </section>

          {showErrors && errors.length > 0 && <div className={styles.error}>{errors.map((item) => <div key={item}>• {item}</div>)}</div>}
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>등록 요약</div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>유형</span><span className={styles.summaryValue}>{form.type}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>참여 대상</span><span className={styles.summaryValue}>{form.target}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>참여 방식</span><span className={styles.summaryValue}>{form.participationMethod}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>혜택</span><span className={styles.summaryValue}>{form.benefitType}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>연결 노출</span><span className={styles.summaryValue}>{[form.bannerLinked && '배너', form.popupLinked && '팝업', form.noticeLinked && '공지'].filter(Boolean).join(' · ') || '-'}</span></div>
          </div>
          <div className={styles.sideCard}><div className={styles.sideTitle}>운영 원칙</div><div className={styles.sideHint}>• 참여기간과 노출기간은 독립적으로 설정합니다.<br />• 진행 중에는 기간·대상·혜택 같은 핵심 조건 변경이 제한됩니다.<br />• 이벤트 종료 후에도 지급·당첨·CS 업무는 계속 처리할 수 있습니다.</div></div>
        </aside>
      </div>

      {showPreview && <EventPreviewDialog event={previewEvent} onClose={() => setShowPreview(false)} />}
    </div>
  );
}
