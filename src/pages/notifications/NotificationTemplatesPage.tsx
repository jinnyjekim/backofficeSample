import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { DatePicker } from '../../components/forms/DatePicker';
import shared from '../ops/opsShared.module.css';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './NotificationTemplatesPage.module.css';
import {
  MESSAGE_TEMPLATES,
  TEMPLATE_BUSINESSES,
  TEMPLATE_CHANNELS,
  TEMPLATE_MODULES,
  TEMPLATE_PURPOSES,
  TEMPLATE_SEND_TYPES,
  TEMPLATE_STATUSES,
  TEMPLATE_STATUS_META,
  VARIABLE_REGISTRY,
  emptyChannelContent,
  extractVariables,
  validateMessageTemplate,
  type ChannelContent,
  type MessageTemplate,
  type TemplateChannel,
  type TemplateModule,
  type TemplatePurpose,
  type TemplateSendType,
  type TemplateStatus,
} from './notificationTemplatesData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

type Quick = '전체' | TemplateChannel | '비활성' | '변수 오류';
type DetailTab = 'basic' | 'contents' | 'variables' | 'usage' | 'history';
type EditorState = { originalId: string | null; draft: MessageTemplate } | null;
type PreviewState = { template: MessageTemplate; channel: TemplateChannel } | null;

const QUICK_FILTERS: Quick[] = ['전체', ...TEMPLATE_CHANNELS, '비활성', '변수 오류'];
const COLUMNS: GridColumn[] = [
  { label: '템플릿' }, { label: '사용 모듈' }, { label: '채널' }, { label: '목적 / 연결 업무' },
  { label: '발송 유형' }, { label: '상태' }, { label: '최근 수정' }, { label: '수정자' }, { label: '관리', align: 'right' },
];
const SAMPLE_VALUES = Object.fromEntries(VARIABLE_REGISTRY.map((item) => [item.key, item.sample]));

function cloneTemplate(template: MessageTemplate): MessageTemplate {
  return structuredClone(template);
}

function newTemplate(): MessageTemplate {
  return {
    id: `TPL-NEW-${Date.now()}`,
    name: '', code: '', modules: ['공통'], channels: ['서비스 알림'], purpose: '서비스 안내', business: '회원', sendType: '수동 발송', status: '작성중', trigger: '-', eventCode: '-',
    contents: { '서비스 알림': emptyChannelContent('서비스 알림') }, requiredVariables: [], version: 1,
    usage: { '서비스 알림': 0, 이메일: 0, SMS: 0, Push: 0 }, automationCount: 0, scheduledCount: 0, draftCount: 0, lastSentAt: null,
    createdAt: '2026-08-27 15:00', createdBy: 'admin01', updatedAt: '2026-08-27 15:00', updatedBy: 'admin01', memos: [], history: [],
  };
}

function matchesQuick(template: MessageTemplate, quick: Quick, all: MessageTemplate[]) {
  if (quick === '전체') return true;
  if (quick === '비활성') return template.status === '비활성';
  if (quick === '변수 오류') return validateMessageTemplate(template, all).errors.some((error) => error.includes('변수'));
  return template.channels.includes(quick);
}

function resolveVariables(value: string) {
  return value.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, key: string) => SAMPLE_VALUES[key] ?? `{{${key}}}`);
}

function totalUsage(template: MessageTemplate) {
  return Object.values(template.usage).reduce((sum, count) => sum + count, 0);
}

export function NotificationTemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<MessageTemplate[]>(MESSAGE_TEMPLATES);
  const [quick, setQuick] = useState<Quick>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');
  const [sendTypeFilter, setSendTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('basic');
  const [editor, setEditor] = useState<EditorState>(null);
  const [editorChannel, setEditorChannel] = useState<TemplateChannel>('서비스 알림');
  const [validation, setValidation] = useState<{ errors: string[]; warnings: string[] }>({ errors: [], warnings: [] });
  const [preview, setPreview] = useState<PreviewState>(null);
  const [testSend, setTestSend] = useState<PreviewState>(null);
  const [testRecipient, setTestRecipient] = useState('admin01');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState('');
  const [toast, setToast] = useState('');

  const selected = templates.find((template) => template.id === detailId) ?? null;
  const deactivateTarget = templates.find((template) => template.id === deactivateId) ?? null;

  const counts = useMemo(() => Object.fromEntries(QUICK_FILTERS.map((item) => [item, templates.filter((template) => matchesQuick(template, item, templates)).length])), [templates]);
  const filtered = useMemo(() => templates.filter((template) => {
    if (!matchesQuick(template, quick, templates)) return false;
    if (moduleFilter && !template.modules.includes(moduleFilter as TemplateModule)) return false;
    if (purposeFilter && template.purpose !== purposeFilter) return false;
    if (businessFilter && template.business !== businessFilter) return false;
    if (sendTypeFilter && template.sendType !== sendTypeFilter) return false;
    if (statusFilter && template.status !== statusFilter) return false;
    const date = template.updatedAt.slice(0, 10);
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    if (search && !`${template.name} ${template.code} ${template.business} ${template.channels.join(' ')} ${Object.values(template.contents).map((item) => `${item?.title} ${item?.body}`).join(' ')}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [businessFilter, dateFrom, dateTo, moduleFilter, purposeFilter, quick, search, sendTypeFilter, statusFilter, templates]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  }

  function resetFilters() {
    setQuick('전체'); setKeyword(''); setSearch(''); setModuleFilter(''); setPurposeFilter(''); setBusinessFilter(''); setSendTypeFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo('');
  }

  function openDetail(id: string) {
    setDetailId(id); setDetailTab('basic'); setMenuId(null); setEditor(null);
  }

  function startCreate() {
    const draft = newTemplate();
    setEditor({ originalId: null, draft }); setEditorChannel('서비스 알림'); setDetailId(null); setValidation({ errors: [], warnings: [] });
  }

  function startEdit(template: MessageTemplate) {
    setEditor({ originalId: template.id, draft: cloneTemplate(template) }); setEditorChannel(template.channels[0] ?? '서비스 알림'); setDetailId(null); setValidation({ errors: [], warnings: [] });
  }

  function startClone(template: MessageTemplate) {
    const draft = cloneTemplate(template);
    draft.id = `TPL-NEW-${Date.now()}`; draft.name = `[복사본] ${template.name}`; draft.code = ''; draft.status = '작성중'; draft.version = 1;
    draft.usage = { '서비스 알림': 0, 이메일: 0, SMS: 0, Push: 0 }; draft.automationCount = 0; draft.scheduledCount = 0; draft.draftCount = 0; draft.lastSentAt = null; draft.memos = []; draft.history = [];
    setEditor({ originalId: null, draft }); setEditorChannel(draft.channels[0]); setDetailId(null); setValidation({ errors: [], warnings: [] });
  }

  function updateDraft(patch: Partial<MessageTemplate>) {
    setEditor((current) => current ? { ...current, draft: { ...current.draft, ...patch } } : current);
  }

  function toggleModule(module: TemplateModule) {
    if (!editor) return;
    const current = editor.draft.modules;
    const modules = module === '공통' ? ['공통'] as TemplateModule[] : current.includes(module) ? current.filter((item) => item !== module && item !== '공통') : [...current.filter((item) => item !== '공통'), module];
    updateDraft({ modules });
  }

  function toggleChannel(channel: TemplateChannel) {
    if (!editor) return;
    const selected = editor.draft.channels.includes(channel);
    if (selected && editor.draft.channels.length === 1) return notify('채널을 하나 이상 선택해야 합니다.');
    const channels = selected ? editor.draft.channels.filter((item) => item !== channel) : [...editor.draft.channels, channel];
    const contents = { ...editor.draft.contents };
    if (!selected && !contents[channel]) contents[channel] = emptyChannelContent(channel);
    updateDraft({ channels, contents });
    if (selected && editorChannel === channel) setEditorChannel(channels[0]);
    if (!selected) setEditorChannel(channel);
  }

  function updateChannel(patch: Partial<ChannelContent>) {
    if (!editor) return;
    const current = editor.draft.contents[editorChannel] ?? emptyChannelContent(editorChannel);
    updateDraft({ contents: { ...editor.draft.contents, [editorChannel]: { ...current, ...patch } } });
  }

  function insertVariable(key: string) {
    if (!editor) return;
    const content = editor.draft.contents[editorChannel] ?? emptyChannelContent(editorChannel);
    updateChannel({ body: `${content.body}${content.body ? ' ' : ''}{{${key}}}` });
  }

  function toggleRequiredVariable(key: string) {
    if (!editor) return;
    updateDraft({ requiredVariables: editor.draft.requiredVariables.includes(key) ? editor.draft.requiredVariables.filter((item) => item !== key) : [...editor.draft.requiredVariables, key] });
  }

  function saveEditor(status: TemplateStatus) {
    if (!editor) return;
    const checked = validateMessageTemplate(editor.draft, templates);
    setValidation(checked);
    if (checked.errors.length > 0) return notify('저장할 수 없는 항목을 확인해 주세요.');
    const existing = editor.originalId ? templates.find((template) => template.id === editor.originalId) : null;
    const id = existing?.id ?? `TPL-${String(Math.max(...templates.map((template) => Number(template.id.replace(/\D/g, '')) || 0)) + 1).padStart(5, '0')}`;
    const next: MessageTemplate = {
      ...editor.draft,
      id,
      status,
      version: existing ? existing.version + 1 : 1,
      code: editor.draft.code.toUpperCase(),
      updatedAt: '2026-08-27 15:00',
      updatedBy: 'admin01',
      createdAt: existing?.createdAt ?? '2026-08-27 15:00',
      createdBy: existing?.createdBy ?? 'admin01',
      history: [{ at: '2026-08-27 15:00', by: 'admin01', action: status === '작성중' ? '초안 저장' : existing ? `V${existing.version + 1} 적용` : '템플릿 등록', detail: editor.draft.channels.join(', ') }, ...(existing?.history ?? [])],
    };
    setTemplates((current) => existing ? current.map((template) => template.id === existing.id ? next : template) : [next, ...current]);
    setEditor(null); setDetailId(id); setDetailTab('basic'); notify(status === '작성중' ? '템플릿을 초안으로 저장했습니다.' : '템플릿을 사용 상태로 저장했습니다.');
  }

  function requestStatusChange(template: MessageTemplate) {
    if (template.status === '사용중') setDeactivateId(template.id);
    else {
      setTemplates((current) => current.map((item) => item.id === template.id ? { ...item, status: '사용중', updatedAt: '2026-08-27 15:00', updatedBy: 'admin01', history: [{ at: '2026-08-27 15:00', by: 'admin01', action: '사용 재개', detail: '신규 발송 선택 가능' }, ...item.history] } : item));
      notify('템플릿 사용을 재개했습니다.');
    }
  }

  function confirmDeactivate() {
    if (!deactivateTarget) return;
    setTemplates((current) => current.map((item) => item.id === deactivateTarget.id ? { ...item, status: '비활성', updatedAt: '2026-08-27 15:00', updatedBy: 'admin01', history: [{ at: '2026-08-27 15:00', by: 'admin01', action: '비활성 처리', detail: `자동화 ${item.automationCount}건 · 예약 ${item.scheduledCount}건 영향` }, ...item.history] } : item));
    setDeactivateId(null); notify('템플릿을 비활성 처리했습니다.');
  }

  function deleteDraft(template: MessageTemplate) {
    if (template.status !== '작성중' || totalUsage(template) > 0) return notify('사용 이력이 없는 작성중 템플릿만 삭제할 수 있습니다.');
    setTemplates((current) => current.filter((item) => item.id !== template.id)); setDetailId(null); notify('작성중 템플릿을 삭제했습니다.');
  }

  function addMemo(template: MessageTemplate) {
    if (!memoText.trim()) return;
    setTemplates((current) => current.map((item) => item.id === template.id ? { ...item, memos: [{ id: `M-${Date.now()}`, at: '2026-08-27 15:00', by: 'admin01', text: memoText.trim() }, ...item.memos] } : item));
    setMemoText('');
  }

  function download() {
    const csv = [['템플릿명', '코드', '사용 모듈', '채널', '목적', '연결 업무', '발송 유형', '상태', '수정일'], ...filtered.map((template) => [template.name, template.code, template.modules.join('/'), template.channels.join('/'), template.purpose, template.business, template.sendType, template.status, template.updatedAt])].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'message-templates.csv'; anchor.click(); URL.revokeObjectURL(url);
  }

  const rows: GridRow[] = filtered.map((template) => {
    const meta = TEMPLATE_STATUS_META[template.status];
    const check = validateMessageTemplate(template, templates);
    return {
      id: template.id,
      onClick: () => openDetail(template.id),
      cells: [
        { kind: 'stack', title: template.name, subtitle: `${template.code} · V${template.version}${check.errors.length ? ` · ⚠ 오류 ${check.errors.length}` : ''}` },
        { kind: 'text', text: template.modules.join(' · '), color: '#52525b', size: '11px', weight: 600 },
        { kind: 'text', text: template.channels.join(' · '), color: '#4338ca', size: '11px', weight: 600 },
        { kind: 'stack', title: template.purpose, subtitle: template.business },
        { kind: 'pillText', text: template.sendType.replace(' 발송', ''), bg: template.sendType === '자동 발송' ? '#eff6ff' : '#f4f4f5', fg: template.sendType === '자동 발송' ? '#2563eb' : '#52525b' },
        { kind: 'badge', text: template.status, bg: meta.bg, fg: meta.fg },
        { kind: 'text', text: template.updatedAt.slice(0, 10).replaceAll('-', '.'), color: '#71717a', size: '11px', numeric: true },
        { kind: 'text', text: template.updatedBy, color: '#52525b', size: '11px' },
        { kind: 'rowMenu', align: 'right', detailLabel: '상세', onDetail: () => openDetail(template.id), open: menuId === template.id, onToggle: () => setMenuId(menuId === template.id ? null : template.id), items: [
          { label: '상세 보기', click: () => openDetail(template.id) }, { label: '수정', click: () => startEdit(template) }, { label: '미리보기', click: () => setPreview({ template, channel: template.channels[0] }) }, { label: '테스트 발송', click: () => setTestSend({ template, channel: template.channels[0] }) }, { label: '복제', click: () => startClone(template) }, { label: '발송 이력', click: () => navigate(`/notifications/dispatch?template=${encodeURIComponent(template.code)}`) }, { sep: true }, { label: template.status === '사용중' ? '비활성 처리' : '사용 재개', fg: template.status === '사용중' ? '#dc2626' : undefined, click: () => requestStatusChange(template) }, ...(template.status === '작성중' && totalUsage(template) === 0 ? [{ label: '삭제', fg: '#dc2626', click: () => deleteDraft(template) }] : []),
        ] },
      ],
    };
  });

  if (editor) return (
    <TemplateEditor
      editor={editor}
      channel={editorChannel}
      validation={validation}
      onBack={() => setEditor(null)}
      onChange={updateDraft}
      onModule={toggleModule}
      onChannel={toggleChannel}
      onSelectChannel={setEditorChannel}
      onChannelChange={updateChannel}
      onVariable={insertVariable}
      onRequiredVariable={toggleRequiredVariable}
      onPreview={() => setPreview({ template: editor.draft, channel: editorChannel })}
      onSave={saveEditor}
    />
  );

  return (
    <section className={shared.page} onClick={() => menuId && setMenuId(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div><h1 className={shared.title}>템플릿 관리</h1><p className={shared.subtitle}>서비스 알림·이메일·SMS·Push 콘텐츠와 변수를 업무 템플릿 단위로 통합 관리합니다.</p></div>
          <button type="button" className={shared.createBtn} onClick={startCreate}>+ 템플릿 등록</button>
        </div>
        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((item) => <button key={item} type="button" className={`${shared.qfBtn} ${quick === item ? styles.quickActive : ''}`} onClick={() => setQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{counts[item] ?? 0}</span></button>)}
        </div>
        <div className={shared.filterBox}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="템플릿명 / 코드 / 제목 / 내용 검색" />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>사용 모듈</span><select aria-label="사용 모듈" className={shared.selectSm} value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}><option value="">사용 모듈 전체</option>{TEMPLATE_MODULES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="globalFilterField"><span>사용 목적</span><select aria-label="사용 목적" className={shared.selectSm} value={purposeFilter} onChange={(event) => setPurposeFilter(event.target.value)}><option value="">사용 목적 전체</option>{TEMPLATE_PURPOSES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="globalFilterField"><span>연결 업무</span><select aria-label="연결 업무" className={shared.selectSm} value={businessFilter} onChange={(event) => setBusinessFilter(event.target.value)}><option value="">연결 업무 전체</option>{TEMPLATE_BUSINESSES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="globalFilterField"><span>발송 유형</span><select aria-label="발송 유형" className={shared.selectSm} value={sendTypeFilter} onChange={(event) => setSendTypeFilter(event.target.value)}><option value="">발송 유형 전체</option>{TEMPLATE_SEND_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="globalFilterField"><span>사용 상태</span><select aria-label="사용 상태" className={shared.selectSm} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">사용 상태 전체</option>{TEMPLATE_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <span className={styles.dateLabel}>수정일</span><DatePicker value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /><span className={styles.dateDash}>–</span><DatePicker value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            <span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>
        <div className={shared.resultRow}><span className={shared.resultLabel}>총 {filtered.length}건</span><div className={shared.resultActions}><ExcelDownloadButton type="button" onClick={download} /><select className={shared.pageSizeSelect}><option>20개씩 보기</option><option>50개씩 보기</option></select></div></div>
      </div>
      <div className={shared.gridWrap}>
        <DataGrid columns={COLUMNS} rows={rows} gridTemplate="minmax(190px,1.5fr) 100px minmax(150px,1.2fr) 130px 82px 72px 92px 76px 54px" minWidth="1120px" empty={rows.length === 0} emptyText={templates.length === 0 ? '등록된 메시지 템플릿이 없습니다.' : '해당 조건의 템플릿이 없습니다.'} emptySubtext={templates.length === 0 ? '반복해서 사용하는 알림·이메일·SMS·Push 내용을 템플릿으로 등록해 주세요.' : '검색어나 필터 조건을 변경해 주세요.'} emptyActionLabel={templates.length === 0 ? '+ 템플릿 등록' : '필터 초기화'} emptyActionClick={templates.length === 0 ? startCreate : resetFilters} showPagination pages={[{ label: '‹' }, { label: '1', active: true }, { label: '›' }]} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} />
      </div>

      {selected && <TemplateDetail template={selected} tab={detailTab} onTab={setDetailTab} memoText={memoText} onMemoText={setMemoText} onAddMemo={() => addMemo(selected)} onClose={() => setDetailId(null)} onEdit={() => startEdit(selected)} onClone={() => startClone(selected)} onPreview={(channel) => setPreview({ template: selected, channel })} onTest={(channel) => setTestSend({ template: selected, channel })} onHistory={() => navigate(`/notifications/dispatch?template=${encodeURIComponent(selected.code)}`)} onStatus={() => requestStatusChange(selected)} onDelete={() => deleteDraft(selected)} />}
      {preview && <PreviewDialog state={preview} onChannel={(channel) => setPreview({ ...preview, channel })} onClose={() => setPreview(null)} />}
      {testSend && <TestSendDialog state={testSend} recipient={testRecipient} onRecipient={setTestRecipient} onChannel={(channel) => setTestSend({ ...testSend, channel })} onClose={() => setTestSend(null)} onSend={() => { setTestSend(null); notify(`${testRecipient}에게 테스트 발송을 요청했습니다.`); }} />}
      {deactivateTarget && <DeactivateDialog template={deactivateTarget} onClose={() => setDeactivateId(null)} onConfirm={confirmDeactivate} />}
      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}

interface EditorProps {
  editor: NonNullable<EditorState>; channel: TemplateChannel; validation: { errors: string[]; warnings: string[] };
  onBack: () => void; onChange: (patch: Partial<MessageTemplate>) => void; onModule: (module: TemplateModule) => void; onChannel: (channel: TemplateChannel) => void; onSelectChannel: (channel: TemplateChannel) => void; onChannelChange: (patch: Partial<ChannelContent>) => void; onVariable: (key: string) => void; onRequiredVariable: (key: string) => void; onPreview: () => void; onSave: (status: TemplateStatus) => void;
}

function TemplateEditor({ editor, channel, validation, onBack, onChange, onModule, onChannel, onSelectChannel, onChannelChange, onVariable, onRequiredVariable, onPreview, onSave }: EditorProps) {
  const template = editor.draft;
  const activeContent = template.contents[channel] ?? emptyChannelContent(channel);
  const currentValidation = validateMessageTemplate(template, MESSAGE_TEMPLATES);
  return (
    <section className={styles.editorPage}>
      <div className={styles.editorTop}><div className={styles.editorTitleRow}><button type="button" className={styles.backBtn} onClick={onBack}>←</button><div><h1>{editor.originalId ? '템플릿 수정' : '템플릿 등록'}</h1><p>업무 템플릿의 기본 정보와 채널별 콘텐츠, 허용 변수를 설정합니다.</p></div></div></div>
      <div className={styles.editorBody}>
        <main className={styles.editorMain}>
          <EditorCard title="기본 정보">
            <div className={styles.formGrid}><Field label="템플릿명 *"><input value={template.name} onChange={(event) => onChange({ name: event.target.value })} /></Field><Field label="템플릿 코드 *"><input value={template.code} readOnly={Boolean(editor.originalId)} onChange={(event) => onChange({ code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })} placeholder="DELIVERY_STARTED" /><small>등록 후 이벤트 연결 보호를 위해 변경할 수 없습니다.</small></Field><Field label="사용 목적 *"><select value={template.purpose} onChange={(event) => onChange({ purpose: event.target.value as TemplatePurpose })}>{TEMPLATE_PURPOSES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="연결 업무"><select value={template.business} onChange={(event) => onChange({ business: event.target.value })}>{TEMPLATE_BUSINESSES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="발송 유형"><select value={template.sendType} onChange={(event) => onChange({ sendType: event.target.value as TemplateSendType })}>{TEMPLATE_SEND_TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Event Code"><input value={template.eventCode} onChange={(event) => onChange({ eventCode: event.target.value.toUpperCase() })} disabled={template.sendType === '수동 발송'} /></Field></div>
            <div className={styles.sectionLabel}>사용 모듈 *</div><div className={styles.checkRow}>{TEMPLATE_MODULES.map((item) => <label key={item}><input type="checkbox" checked={template.modules.includes(item)} onChange={() => onModule(item)} /> {item}</label>)}</div>
            {template.sendType !== '수동 발송' && <Field label="자동 발송 Trigger"><input value={template.trigger} onChange={(event) => onChange({ trigger: event.target.value })} placeholder="Trigger 자체의 상세 조건은 발송 정책에서 관리합니다." /></Field>}
          </EditorCard>

          <EditorCard title="채널별 콘텐츠">
            <div className={styles.checkRow}>{TEMPLATE_CHANNELS.map((item) => <label key={item}><input type="checkbox" checked={template.channels.includes(item)} onChange={() => onChannel(item)} /> {item}</label>)}</div>
            <div className={styles.channelTabs}>{template.channels.map((item) => <button key={item} type="button" className={channel === item ? styles.channelActive : ''} onClick={() => onSelectChannel(item)}>{item}</button>)}</div>
            <div className={styles.channelEditor}>
              <div className={styles.channelHead}><strong>{channel}</strong><span>{activeContent.title.length}자 / 본문 {activeContent.body.length}자</span></div>
              {channel !== 'SMS' && <Field label={channel === '이메일' ? '이메일 제목 *' : '제목 *'}><input value={activeContent.title} maxLength={channel === 'Push' ? 50 : 120} onChange={(event) => onChannelChange({ title: event.target.value })} /></Field>}
              {channel === '이메일' && <Field label="미리보기 텍스트"><input value={activeContent.preheader} onChange={(event) => onChannelChange({ preheader: event.target.value })} /></Field>}
              <Field label="본문 *"><textarea value={activeContent.body} rows={channel === '이메일' ? 9 : 5} onChange={(event) => onChannelChange({ body: event.target.value })} /><span className={styles.contentMeta}>{channel === 'SMS' ? `${activeContent.body.length}자 · 예상 ${activeContent.body.length > 90 ? 'LMS' : 'SMS'} 1건` : `${activeContent.body.length}자`}</span></Field>
              {channel !== 'SMS' && <div className={styles.formGrid}><Field label={channel === '이메일' ? 'CTA / Action' : '클릭 Action'}><select value={activeContent.action} onChange={(event) => onChannelChange({ action: event.target.value })}><option>연결 없음</option><option>주문 상세</option><option>배송 상세</option><option>분쟁 상세</option><option>URL</option>{channel === '이메일' && <option>CTA 버튼</option>}</select></Field><Field label="연결 값"><input value={activeContent.actionValue} disabled={activeContent.action === '연결 없음'} onChange={(event) => onChannelChange({ actionValue: event.target.value })} placeholder="{{orderNumber}} 또는 URL" /></Field></div>}
            </div>
          </EditorCard>

          <EditorCard title="변수 레지스트리">
            <p className={styles.helpText}>등록된 변수만 삽입할 수 있습니다. 버튼을 누르면 현재 채널 본문 끝에 추가됩니다.</p>
            <div className={styles.variableGroups}>{[...new Set(VARIABLE_REGISTRY.map((item) => item.group))].map((group) => <div key={group}><strong>{group}</strong><div>{VARIABLE_REGISTRY.filter((item) => item.group === group).map((item) => <button key={item.key} type="button" onClick={() => onVariable(item.key)}>+ {item.label} <code>{`{{${item.key}}}`}</code></button>)}</div></div>)}</div>
            <div className={styles.sectionLabel}>필수 변수</div><div className={styles.requiredVariables}>{VARIABLE_REGISTRY.map((item) => <label key={item.key}><input type="checkbox" checked={template.requiredVariables.includes(item.key)} onChange={() => onRequiredVariable(item.key)} /> {item.label}</label>)}</div>
          </EditorCard>

          {(validation.errors.length > 0 || validation.warnings.length > 0) && <div className={styles.validationBox}>{validation.errors.map((item) => <div className={styles.errorText} key={item}>✕ {item}</div>)}{validation.warnings.map((item) => <div className={styles.warningText} key={item}>⚠ {item}</div>)}</div>}
        </main>
        <aside className={styles.editorSummary}><h2>템플릿 요약</h2><Summary label="상태" value={template.status} /><Summary label="모듈" value={template.modules.join(', ') || '-'} /><Summary label="채널" value={template.channels.join(', ') || '-'} /><Summary label="목적" value={template.purpose} /><Summary label="연결 업무" value={template.business} /><Summary label="발송 유형" value={template.sendType} /><Summary label="사용 변수" value={`${extractVariables(template).length}개`} /><div className={styles.liveValidation}><span>현재 점검</span><strong className={currentValidation.errors.length ? styles.badCount : ''}>{currentValidation.errors.length ? `오류 ${currentValidation.errors.length}건` : '저장 가능'}</strong></div></aside>
      </div>
      <div className={styles.editorActions}><button type="button" className={drawer.editCancel} onClick={onBack}>취소</button><button type="button" className={drawer.actionLink} onClick={onPreview}>미리보기</button><button type="button" className={drawer.editCancel} onClick={() => onSave('작성중')}>초안 저장</button><button type="button" className={drawer.editConfirm} onClick={() => onSave('사용중')}>저장 및 사용</button></div>
    </section>
  );
}

function TemplateDetail({ template, tab, onTab, memoText, onMemoText, onAddMemo, onClose, onEdit, onClone, onPreview, onTest, onHistory, onStatus, onDelete }: { template: MessageTemplate; tab: DetailTab; onTab: (tab: DetailTab) => void; memoText: string; onMemoText: (value: string) => void; onAddMemo: () => void; onClose: () => void; onEdit: () => void; onClone: () => void; onPreview: (channel: TemplateChannel) => void; onTest: (channel: TemplateChannel) => void; onHistory: () => void; onStatus: () => void; onDelete: () => void }) {
  const meta = TEMPLATE_STATUS_META[template.status]; const check = validateMessageTemplate(template, MESSAGE_TEMPLATES);
  return <div className={styles.drawerDim} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className={`${drawer.aside} ${styles.detailDrawer}`}><div className={drawer.head}><div className={drawer.headRow}><div className={drawer.headBody}><div className={drawer.eyebrow}>템플릿 관리 · {template.id} · V{template.version}</div><div className={drawer.titleRow}><span className={drawer.title}>{template.name}</span><span className={drawer.badge} style={{ background: meta.bg, color: meta.fg }}>{template.status}</span>{check.errors.length > 0 && <span className={drawer.badge} style={{ background: '#fff7ed', color: '#c2410c' }}>⚠ 변수 오류</span>}</div><div className={drawer.sub}>{template.code} · {template.modules.join(' · ')}</div></div><button type="button" className={drawer.closeBtn} onClick={onClose}>×</button></div><div className={drawer.actionRow}><button type="button" className={drawer.actionLink} onClick={onEdit}>수정</button><button type="button" className={drawer.actionLink} onClick={onClone}>복제</button><button type="button" className={drawer.actionLink} onClick={() => onPreview(template.channels[0])}>미리보기</button><button type="button" className={drawer.actionLink} onClick={() => onTest(template.channels[0])}>테스트 발송</button><div className={drawer.spacer} /><button type="button" className={template.status === '사용중' ? drawer.dangerBtn : drawer.primaryBtn} onClick={onStatus}>{template.status === '사용중' ? '비활성' : '사용 재개'}</button>{template.status === '작성중' && totalUsage(template) === 0 && <button type="button" className={drawer.dangerBtn} onClick={onDelete}>삭제</button>}</div><div className={drawer.tabs}>{([['basic', '기본 정보'], ['contents', '채널 콘텐츠'], ['variables', '변수 · 연결'], ['usage', '사용 현황'], ['history', '메모 · 이력']] as [DetailTab, string][]).map(([key, label]) => <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => onTab(key)}>{label}</button>)}</div></div><div className={drawer.scroll}>{tab === 'basic' && <><SectionTitle>기본 정보</SectionTitle><FieldBox rows={[['템플릿 코드', template.code], ['사용 모듈', template.modules.join(' · ')], ['사용 목적', template.purpose], ['연결 업무', template.business], ['발송 유형', template.sendType], ['상태', template.status], ['현재 버전', `V${template.version}`], ['최근 수정', `${template.updatedAt} · ${template.updatedBy}`]]} /></>}{tab === 'contents' && <><div className={styles.detailChannelTabs}>{template.channels.map((channel) => <button key={channel} type="button" onClick={() => onPreview(channel)}>{channel}<span>미리보기</span></button>)}</div>{template.channels.map((channel) => { const item = template.contents[channel]; return <div className={styles.contentCard} key={channel}><div><strong>{channel}</strong><span>{item?.body.length ?? 0}자</span></div>{item?.title && <h3>{item.title}</h3>}<p>{item?.body}</p>{item?.action !== '연결 없음' && <small>{item?.action} · {item?.actionValue}</small>}</div>; })}</>}{tab === 'variables' && <><SectionTitle>사용 변수</SectionTitle><div className={styles.tagList}>{extractVariables(template).map((item) => <code key={item}>{`{{${item}}}`}</code>)}</div><SectionTitle>필수 변수</SectionTitle><div className={styles.tagList}>{template.requiredVariables.map((item) => <code key={item}>{`{{${item}}}`}</code>)}</div>{check.errors.concat(check.warnings).map((item) => <div key={item} className={styles.issueLine}>⚠ {item}</div>)}<SectionTitle>자동 발송 연결</SectionTitle><FieldBox rows={[['Trigger', template.trigger], ['Event Code', template.eventCode], ['연결 자동화', `${template.automationCount}건`]]} /></>}{tab === 'usage' && <><SectionTitle>최근 30일 채널별 사용</SectionTitle><div className={styles.usageGrid}>{template.channels.map((channel) => <div key={channel}><span>{channel}</span><strong>{template.usage[channel].toLocaleString()}건</strong></div>)}</div><FieldBox rows={[['전체 사용', `${totalUsage(template).toLocaleString()}건`], ['마지막 발송', template.lastSentAt ?? '-'], ['예약 발송 영향', `${template.scheduledCount}건`], ['작성중 발송', `${template.draftCount}건`]]} /><button type="button" className={styles.fullLink} onClick={onHistory}>발송 이력에서 보기 →</button></>}{tab === 'history' && <><SectionTitle>관리자 메모</SectionTitle><div className={styles.memoRow}><input value={memoText} onChange={(event) => onMemoText(event.target.value)} placeholder="운영 메모를 입력하세요" /><button type="button" onClick={onAddMemo}>등록</button></div>{template.memos.map((memo) => <div className={styles.memoItem} key={memo.id}><span>{memo.at} · {memo.by}</span><p>{memo.text}</p></div>)}<SectionTitle>변경 이력</SectionTitle>{template.history.map((item, index) => <div className={styles.historyItem} key={`${item.at}-${index}`}><i /><div><strong>{item.action}</strong><span>{item.at} · {item.by}</span><p>{item.detail}</p></div></div>)}</>}</div></aside></div>;
}

function PreviewDialog({ state, onChannel, onClose }: { state: NonNullable<PreviewState>; onChannel: (channel: TemplateChannel) => void; onClose: () => void }) {
  const content = state.template.contents[state.channel] ?? emptyChannelContent(state.channel);
  return <div className={shared.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`${shared.dialogBox} ${styles.previewDialog}`}><div className={styles.dialogHead}><div><h2 className={shared.dialogTitle}>템플릿 미리보기</h2><p>{state.template.name} · V{state.template.version}</p></div><button type="button" onClick={onClose}>×</button></div><div className={styles.previewTabs}>{state.template.channels.map((channel) => <button key={channel} type="button" className={state.channel === channel ? styles.previewActive : ''} onClick={() => onChannel(channel)}>{channel}</button>)}</div><div className={state.channel === '이메일' ? styles.emailPreview : styles.devicePreview}><small>{state.channel === '이메일' ? '서비스 운영팀' : state.channel === 'SMS' ? 'Web 발신' : '서비스명 · 지금'}</small>{content.title && <strong>{resolveVariables(content.title)}</strong>}{content.preheader && <em>{resolveVariables(content.preheader)}</em>}<p>{resolveVariables(content.body)}</p>{content.action !== '연결 없음' && <button type="button">{content.action === 'CTA 버튼' ? '확인하기' : content.action}</button>}</div><div className={styles.sampleData}><strong>적용된 테스트 데이터</strong>{extractVariables(state.template).map((key) => <span key={key}><code>{`{{${key}}}`}</code>{SAMPLE_VALUES[key] ?? '-'}</span>)}</div><div className={shared.dialogActions}><button type="button" className={drawer.editConfirm} onClick={onClose}>확인</button></div></div></div>;
}

function TestSendDialog({ state, recipient, onRecipient, onChannel, onClose, onSend }: { state: NonNullable<PreviewState>; recipient: string; onRecipient: (value: string) => void; onChannel: (channel: TemplateChannel) => void; onClose: () => void; onSend: () => void }) {
  return <div className={shared.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={shared.dialogBox}><div className={styles.dialogHead}><div><h2 className={shared.dialogTitle}>테스트 발송</h2><p>실제 고객이 아닌 관리자 테스트 수신처로만 발송합니다.</p></div><button type="button" onClick={onClose}>×</button></div><Field label="채널"><select value={state.channel} onChange={(event) => onChannel(event.target.value as TemplateChannel)}>{state.template.channels.map((channel) => <option key={channel}>{channel}</option>)}</select></Field><Field label={state.channel === '이메일' ? '테스트 이메일' : state.channel === 'SMS' ? '테스트 휴대폰' : '관리자 ID'}><input value={recipient} onChange={(event) => onRecipient(event.target.value)} /></Field><div className={styles.testNotice}>TEST 발송으로 기록되며 운영 발송 통계와 고객 발송 이력에는 포함되지 않습니다.</div><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={onClose}>취소</button><button type="button" className={drawer.editConfirm} disabled={!recipient.trim()} onClick={onSend}>테스트 발송</button></div></div></div>;
}

function DeactivateDialog({ template, onClose, onConfirm }: { template: MessageTemplate; onClose: () => void; onConfirm: () => void }) {
  return <div className={shared.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={shared.dialogBox}><h2 className={shared.dialogTitle}>템플릿을 비활성화하시겠습니까?</h2><p className={shared.dialogBody}><strong>{template.name}</strong>은 신규 수동 발송과 자동 발송에서 선택할 수 없게 됩니다.</p><div className={styles.impactGrid}><div><span>자동 발송 Rule</span><strong>{template.automationCount}건</strong></div><div><span>예약 발송</span><strong>{template.scheduledCount}건</strong></div><div><span>작성중 Draft</span><strong>{template.draftCount}건</strong></div></div>{template.automationCount > 0 && <div className={styles.dangerNotice}>연결된 자동 발송이 중단될 수 있습니다. 발송 정책의 대체 템플릿을 먼저 확인해 주세요.</div>}<div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={onClose}>취소</button><button type="button" className={styles.dangerButton} onClick={onConfirm}>비활성 처리</button></div></div></div>;
}

function EditorCard({ title, children }: { title: string; children: ReactNode }) { return <section className={styles.editorCard}><h2>{title}</h2>{children}</section>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className={styles.summaryRow}><span>{label}</span><strong>{value}</strong></div>; }
function SectionTitle({ children }: { children: ReactNode }) { return <div className={drawer.sectionTitleLoose}>{children}</div>; }
function FieldBox({ rows }: { rows: [string, string][] }) { return <div className={drawer.fieldBox}>{rows.map(([label, value]) => <div className={drawer.fieldRow} key={label}><span className={drawer.fieldLabel}>{label}</span><span className={drawer.fieldValue}>{value}</span></div>)}</div>; }
