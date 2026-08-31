import { useRef, useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './InquiryTypesPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { CONFIG_SCOPES, type ConfigScope } from '../../lib/business';
import { TYPE_FIELDS, TYPE_TEAMS, inquiryTypeScopes, typeErrors, type InquiryTypeEntry, type FieldMode, type IntakeMode, type TypePriority, type TypeStatus } from './inquiryTypesData';

type Tab = 'settings' | 'fields' | 'preview' | 'usage' | 'history';

interface Props {
  initial: InquiryTypeEntry;
  isNew: boolean;
  startMode?: 'view' | 'edit' | 'preview';
  parentNames: string[];
  onClose: () => void;
  onSave: (item: InquiryTypeEntry) => void;
  onDeactivate: (item: InquiryTypeEntry) => void;
  onDuplicate: (item: InquiryTypeEntry) => void;
}

export function InquiryTypeDrawer({ initial, isNew, startMode = 'view', parentNames, onClose, onSave, onDeactivate, onDuplicate }: Props) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(isNew || startMode === 'edit');
  const [tab, setTab] = useState<Tab>(startMode === 'preview' ? 'preview' : 'settings');
  const [error, setError] = useState('');
  const errors = typeErrors(draft);
  const set = <K extends keyof InquiryTypeEntry>(key: K, value: InquiryTypeEntry[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const toggleScope = (scope: ConfigScope) => setDraft((current) => {
    const scopes = inquiryTypeScopes(current);
    if (scope === '공통') return { ...current, scopes: ['공통'] };
    const businessScopes = scopes.filter((item) => item !== '공통');
    const nextScopes = businessScopes.includes(scope) ? businessScopes.filter((item) => item !== scope) : [...businessScopes, scope];
    return nextScopes.length ? { ...current, scopes: nextScopes } : current;
  });
  const save = () => {
    if (!draft.name.trim() || !draft.code.trim()) return setError('유형명과 유형 코드는 필수입니다.');
    if (!inquiryTypeScopes(draft).length) return setError('적용 범위를 하나 이상 선택해 주세요.');
    if (draft.depth === 2 && !draft.parent) return setError('소분류의 상위 유형을 선택해 주세요.');
    if (draft.attachmentRequired && !draft.attachmentAllowed) return setError('첨부 필수 설정은 첨부파일을 허용해야 사용할 수 있습니다.');
    onSave({ ...draft, name: draft.name.trim(), code: draft.code.trim().toUpperCase().replace(/\s+/g, '_') });
  };

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return <aside ref={asideRef} className={`${drawer.aside} ${styles.typeDrawer}`} aria-label="문의 유형 상세">
    <div className={drawer.head}>
      <div className={drawer.headRow}>
        <div className={drawer.headBody}>
          <div className={drawer.eyebrow}>{isNew ? '신규 문의 유형' : draft.code}</div>
          <div className={drawer.titleRow}><h2 className={drawer.title}>{isNew ? '문의 유형 등록' : `${draft.parent ? `${draft.parent} > ` : ''}${draft.name}`}</h2><span className={drawer.badge} style={{ background: draft.status === '사용' ? '#ecfdf5' : '#f4f4f5', color: draft.status === '사용' ? '#047857' : '#71717a' }}>{draft.status}</span></div>
          {!isNew && <div className={drawer.sub}>최근 수정 {draft.updatedAt} · {draft.updatedBy}</div>}
        </div>
        <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
      </div>
      {!isNew && <div className={drawer.actionRow}>
        <button type="button" className={drawer.actionLink} onClick={() => setEditing((current) => !current)}>{editing ? '수정 취소' : '수정'}</button>
        <button type="button" className={drawer.actionLink} onClick={() => onDuplicate(draft)}>복제</button>
        <span className={drawer.spacer} />
        {draft.status === '사용' && <button type="button" className={drawer.dangerBtn} onClick={() => onDeactivate(draft)}>비활성</button>}
      </div>}
      <div className={drawer.tabs}>{([
        ['settings', '기본·Routing'], ['fields', '입력 항목'], ['preview', 'Preview'], ['usage', '사용 현황'], ['history', '변경 이력'],
      ] as [Tab, string][]).map(([key, label]) => <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>)}</div>
    </div>

    <div className={drawer.scroll}>
      {tab === 'settings' && <>
        {errors.length > 0 && <div className={styles.errorBanner}><strong>설정 확인 필요</strong>{errors.map((item) => <span key={item}>⚠ {item}</span>)}</div>}
        <Section title="기본 정보">
          <FormField label="유형명 *"><input disabled={!editing} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 배송 지연" /></FormField>
          <FormField label="유형 코드 *" hint={!isNew ? '생성 후 변경할 수 없습니다.' : '영문 대문자와 밑줄 사용'}><input disabled={!editing || !isNew} value={draft.code} onChange={(e) => set('code', e.target.value)} placeholder="DELIVERY_DELAY" /></FormField>
          <div className={styles.formGrid}>
            <FormField label="Depth"><select disabled={!editing} value={draft.depth} onChange={(e) => { const depth = Number(e.target.value) as 1 | 2; setDraft((current) => ({ ...current, depth, parent: depth === 1 ? null : current.parent ?? parentNames[0] })); }}><option value={1}>Depth 1 · 대분류</option><option value={2}>Depth 2 · 문의 유형</option></select></FormField>
            <FormField label="상위 유형"><select disabled={!editing || draft.depth === 1} value={draft.parent ?? ''} onChange={(e) => set('parent', e.target.value || null)}><option value="">없음</option>{parentNames.map((name) => <option key={name}>{name}</option>)}</select></FormField>
          </div>
          <FormField label="사용자 설명"><textarea disabled={!editing} value={draft.description} onChange={(e) => set('description', e.target.value)} /></FormField>
          <FormField label="적용 범위 *"><div className={styles.scopeChecks}>{CONFIG_SCOPES.map((scope) => <label key={scope}><input type="checkbox" disabled={!editing} checked={inquiryTypeScopes(draft).includes(scope)} onChange={() => toggleScope(scope)} />{scope}</label>)}</div></FormField>
        </Section>
        <Section title="노출 / 접수 설정">
          <div className={styles.toggleGrid}>
            <Toggle label="사용자 화면 노출" checked={draft.visible} disabled={!editing} onChange={(value) => set('visible', value)} />
            <FormField label="신규 문의 접수"><select disabled={!editing} value={draft.intake} onChange={(e) => set('intake', e.target.value as IntakeMode)}><option>가능</option><option>관리자만</option><option>중지</option></select></FormField>
            <FormField label="상태"><select disabled={!editing} value={draft.status} onChange={(e) => set('status', e.target.value as TypeStatus)}><option>사용</option><option>비활성</option></select></FormField>
            <FormField label="노출 순서"><input disabled={!editing} type="number" min="1" value={draft.displayOrder} onChange={(e) => set('displayOrder', Number(e.target.value))} /></FormField>
          </div>
        </Section>
        <Section title="Routing 및 처리 기준">
          <div className={styles.formGrid}>
            <FormField label="기본 담당팀 *"><select disabled={!editing} value={draft.team ?? ''} onChange={(e) => set('team', e.target.value || null)}><option value="">미설정</option>{TYPE_TEAMS.map((team) => <option key={team}>{team}</option>)}</select></FormField>
            <FormField label="담당자 방식"><select disabled={!editing} value={draft.assignment} onChange={(e) => set('assignment', e.target.value as InquiryTypeEntry['assignment'])}><option>담당팀 Queue</option><option>자동 순환 배정</option><option>담당자 고정</option><option>배정 안 함</option></select></FormField>
            <FormField label="기본 우선순위"><select disabled={!editing} value={draft.priority} onChange={(e) => set('priority', e.target.value as TypePriority)}><option>높음</option><option>보통</option><option>낮음</option></select></FormField>
            <FormField label="SLA 계산"><select disabled={!editing} value={draft.businessHours ? '영업시간' : '24시간'} onChange={(e) => set('businessHours', e.target.value === '영업시간')}><option>영업시간</option><option>24시간</option></select></FormField>
            <FormField label="첫 답변 SLA (시간)"><input disabled={!editing} type="number" min="1" value={draft.firstResponseHours ?? ''} onChange={(e) => set('firstResponseHours', e.target.value ? Number(e.target.value) : null)} /></FormField>
            <FormField label="최종 처리 SLA (시간)"><input disabled={!editing} type="number" min="1" value={draft.resolutionHours ?? ''} onChange={(e) => set('resolutionHours', e.target.value ? Number(e.target.value) : null)} /></FormField>
          </div>
          {editing && <div className={styles.impactNotice}><strong>변경 영향</strong><span>Routing·우선순위·SLA 설정은 새로 접수되는 문의부터 적용됩니다.</span><span>현재 진행 중 {draft.openCount}건의 담당팀과 SLA Snapshot은 변경되지 않습니다.</span></div>}
        </Section>
        <Section title="사전 안내 및 연결">
          <FormField label="문의 작성 안내"><textarea disabled={!editing} value={draft.guide} onChange={(e) => set('guide', e.target.value)} placeholder="유형 선택 직후 사용자에게 보여줄 안내" /></FormField>
          <FormField label="연결 FAQ"><input disabled={!editing} value={draft.faqs.join(', ')} onChange={(e) => set('faqs', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="쉼표로 구분" /></FormField>
          <FormField label="추천 답변 템플릿"><input disabled={!editing} value={draft.templates.join(', ')} onChange={(e) => set('templates', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="쉼표로 구분" /></FormField>
          <FormField label="관리자 메모"><textarea disabled={!editing} value={draft.adminMemo} onChange={(e) => set('adminMemo', e.target.value)} /></FormField>
        </Section>
      </>}

      {tab === 'fields' && <>
        <div className={styles.infoNote}>문의 유형에 따라 사용자 문의 Form의 항목과 필수 여부가 달라집니다.</div>
        <div className={styles.fieldTable}><div className={styles.fieldHead}><span>입력 항목</span><span>설정</span></div>{TYPE_FIELDS.map((field) => <div key={field} className={styles.fieldRow}><strong>{field}</strong><select disabled={!editing} value={draft.fields[field]} onChange={(e) => set('fields', { ...draft.fields, [field]: e.target.value as FieldMode })}><option>필수</option><option>선택</option>{['배송번호', '상품', '주문번호'].includes(field) && <option>자동 연결</option>}<option>사용 안 함</option></select></div>)}</div>
        <Section title="첨부파일 정책">
          <div className={styles.toggleGrid}><Toggle label="첨부파일 허용" checked={draft.attachmentAllowed} disabled={!editing} onChange={(value) => set('attachmentAllowed', value)} /><Toggle label="첨부 필수" checked={draft.attachmentRequired} disabled={!editing || !draft.attachmentAllowed} onChange={(value) => set('attachmentRequired', value)} /><FormField label="최대 개수"><input disabled={!editing || !draft.attachmentAllowed} type="number" min="1" value={draft.attachmentMaxCount} onChange={(e) => set('attachmentMaxCount', Number(e.target.value))} /></FormField><FormField label="최대 용량 (MB)"><input disabled={!editing || !draft.attachmentAllowed} type="number" min="1" value={draft.attachmentMaxMb} onChange={(e) => set('attachmentMaxMb', Number(e.target.value))} /></FormField></div>
        </Section>
      </>}

      {tab === 'preview' && <div className={styles.previewGrid}>
        <div className={styles.previewCard}><div className={styles.previewLabel}>사용자 문의 화면</div><h3>1:1 문의</h3><label>문의 유형 *</label><div className={styles.previewInput}>{draft.parent ? `${draft.parent} > ` : ''}{draft.name || '문의 유형'}</div>{draft.guide && <div className={styles.guideBox}>💡 {draft.guide}</div>}{Object.entries(draft.fields).filter(([, mode]) => mode !== '사용 안 함' && mode !== '자동 연결').map(([field, mode]) => <div key={field}><label>{field} {mode === '필수' && '*'}</label><div className={styles.previewInput}>{field} {mode === '필수' ? '선택/입력' : '(선택)'}</div></div>)}{draft.attachmentAllowed && <button type="button" className={styles.previewAttach}>+ 파일 추가 {draft.attachmentRequired && '(필수)'}</button>}<button type="button" className={styles.previewSubmit}>문의 접수</button></div>
        <div className={styles.previewCard}><div className={styles.previewLabel}>관리자 Routing Preview</div><h3>현재 설정으로 접수되면</h3><PreviewRow label="문의 유형" value={draft.name || '-'} /><PreviewRow label="우선순위" value={draft.priority} /><PreviewRow label="담당팀" value={draft.team ?? '미배정'} warn={!draft.team} /><PreviewRow label="담당자" value={draft.assignment} /><PreviewRow label="첫 답변 SLA" value={draft.firstResponseHours ? `접수 + ${draft.firstResponseHours}시간` : '미설정'} warn={!draft.firstResponseHours} /><PreviewRow label="필수 정보" value={Object.entries(draft.fields).filter(([, mode]) => mode === '필수').map(([field]) => field).join(', ') || '없음'} /><div className={styles.snapshotNote}>접수 시 Routing·우선순위·SLA·Form 조건이 문의에 Snapshot으로 저장됩니다.</div></div>
      </div>}

      {tab === 'usage' && <><div className={styles.usageGrid}><Stat label="전체 문의" value={`${draft.totalCount.toLocaleString()}건`} /><Stat label="진행중 문의" value={`${draft.openCount}건`} /><Stat label="최근 30일" value={`${draft.recentCount}건`} /></div><div className={styles.infoNote}>유형을 비활성화해도 기존 문의와 접수 당시 분류, SLA Snapshot에는 영향을 주지 않습니다.</div><Section title="최근 문의"><div className={styles.recentInquiry}><span>QNA-00182</span><strong>{draft.name} 관련 문의입니다</strong><em>처리중</em></div><div className={styles.recentInquiry}><span>QNA-00172</span><strong>처리 상태를 확인해 주세요</strong><em>처리 완료</em></div></Section></>}

      {tab === 'history' && <>{draft.history.length ? draft.history.slice().reverse().map((item) => <div key={item.id} className={drawer.timelineItem}><span className={drawer.timelineDot} /><div className={drawer.timelineBody}><div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{item.action}</strong><span className={drawer.timelineWhen}>{item.at}</span></div><div className={drawer.timelineDetail}>{item.actor}{item.detail ? ` · ${item.detail}` : ''}</div></div></div>) : <div className={styles.infoNote}>저장 후 변경 이력이 기록됩니다.</div>}</>}
      {error && <div className={styles.formError}>{error}</div>}
    </div>
    {editing && <div className={drawer.footer}><button type="button" className={styles.cancelButton} onClick={isNew ? onClose : () => { setDraft(initial); setEditing(false); }}>취소</button><button type="button" className={styles.primaryButton} onClick={save}>저장</button></div>}
  </aside>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className={styles.formSection}><h3>{title}</h3>{children}</section>; }
function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className={styles.formField}><span>{label}{hint && <small>{hint}</small>}</span>{children}</label>; }
function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) { return <label className={styles.toggleField}><span>{label}</span><button type="button" disabled={disabled} className={`${styles.switch} ${checked ? styles.switchOn : ''}`} onClick={() => onChange(!checked)}><i /></button></label>; }
function PreviewRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) { return <div className={styles.previewRow}><span>{label}</span><strong className={warn ? styles.warnText : ''}>{value}</strong></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
