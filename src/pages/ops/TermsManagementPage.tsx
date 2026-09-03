import { DatePicker } from '../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import { CONFIG_SCOPE_BADGE_META, CONFIG_SCOPE_FILTERS, CONFIG_SCOPES, matchesConfigScope, type ConfigScope, type ConfigScopeFilter } from '../../lib/business';
import drawer from './opsDrawerShared.module.css';
import shared from './opsShared.module.css';
import styles from './TermsManagementPage.module.css';
import { TermsDetailDrawer } from './TermsDetailDrawer';
import { CommonButton, showToast } from '../../components/common';
import { TERMS, currentVersion, termsScopes, type ConsentType, type TermsDefinition, type TermsStatus, type TermsVersion } from './termsData';

type Quick = '전체' | '적용중' | '적용 예정' | '종료';
type EditorMode = 'create' | 'edit' | 'newVersion' | 'clone';
type Editor = { mode: EditorMode; termId?: string } | null;
type Preview = { name: string; code: string; version: string; effectiveFrom: string; content: string } | null;
type FormState = { name: string; code: string; type: string; version: string; consent: ConsentType; scopes: ConfigScope[]; effectiveFrom: string; effectiveTo: string; description: string; content: string; changeReason: string; reConsent: boolean };

const TODAY = '2026-08-26';
const QUICK: Quick[] = ['전체', '적용중', '적용 예정', '종료'];
const TYPES = ['이용약관', '개인정보', '마케팅', '위치정보', '결제'];
const STATUS_META: Record<TermsStatus, { bg: string; fg: string }> = {
  임시저장: { bg: '#f4f4f5', fg: '#52525b' },
  '적용 예정': { bg: '#eff6ff', fg: '#2563eb' },
  적용중: { bg: '#ecfdf5', fg: '#047857' },
  종료: { bg: '#f4f4f5', fg: '#71717a' },
};
const COLUMNS = [
  { label: '약관명 / 코드' }, { label: '적용 범위' }, { label: '유형' }, { label: '버전' }, { label: '동의 구분' }, { label: '상태' },
  { label: '적용 시작일' }, { label: '적용 종료일' }, { label: '최종 수정' },
];

const emptyForm = (): FormState => ({
  name: '', code: '', type: '이용약관', version: 'v1.0', consent: '필수', scopes: ['공통'], effectiveFrom: '', effectiveTo: '',
  description: '', content: '', changeReason: '', reConsent: false,
});

function dayBefore(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function quickMatch(term: TermsDefinition, quick: Quick) {
  if (quick === '전체') return true;
  return currentVersion(term).status === quick;
}

export function TermsManagementPage() {
  const [terms, setTerms] = useState<TermsDefinition[]>(TERMS);
  const [quick, setQuick] = useState<Quick>('전체');
  const [scopeFilter, setScopeFilter] = useState<ConfigScopeFilter>('통합');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [consentFilter, setConsentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [preview, setPreview] = useState<Preview>(null);
  const [endId, setEndId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => terms.filter((term) => {
    const version = currentVersion(term);
    if (!quickMatch(term, quick)) return false;
    if (!matchesConfigScope(termsScopes(term), scopeFilter)) return false;
    if (typeFilter && term.type !== typeFilter) return false;
    if (statusFilter && version.status !== statusFilter) return false;
    if (consentFilter && term.consent !== consentFilter) return false;
    if (dateFrom && version.effectiveFrom < dateFrom) return false;
    if (dateTo && version.effectiveFrom > dateTo) return false;
    const haystack = `${term.name} ${term.code} ${version.version}`.toLowerCase();
    return !search || haystack.includes(search.toLowerCase());
  }), [consentFilter, dateFrom, dateTo, quick, scopeFilter, search, statusFilter, terms, typeFilter]);

  const selected = terms.find((term) => term.id === detailId) ?? null;
  const ending = terms.find((term) => term.id === endId) ?? null;
  const deleting = terms.find((term) => term.id === deleteId) ?? null;

  function notify(message: string) {
    showToast({ message, type: 'success' });
  }

  function resetFilters() {
    setQuick('전체'); setScopeFilter('통합'); setKeyword(''); setSearch(''); setTypeFilter(''); setStatusFilter(''); setConsentFilter(''); setDateFrom(''); setDateTo('');
  }

  function openCreate(source?: TermsDefinition) {
    if (!source) {
      setForm(emptyForm());
      setEditor({ mode: 'create' });
      return;
    }
    const version = currentVersion(source);
    let code = `${source.code}_COPY`;
    let index = 2;
    while (terms.some((term) => term.code === code)) code = `${source.code}_COPY${index++}`;
    setForm({ name: `[복사본] ${source.name}`, code, type: source.type, version: 'v1.0', consent: source.consent, scopes: termsScopes(source), effectiveFrom: '', effectiveTo: '', description: source.description, content: version.content, changeReason: '기존 약관 복제', reConsent: false });
    setEditor({ mode: 'clone' });
    setDetailId(null);
  }

  function openEdit(term: TermsDefinition) {
    const version = term.versions.find((item) => item.status === '임시저장');
    if (!version) return notify('임시저장 상태의 버전만 직접 수정할 수 있습니다.');
    setForm({ name: term.name, code: term.code, type: term.type, version: version.version, consent: term.consent, scopes: termsScopes(term), effectiveFrom: version.effectiveFrom, effectiveTo: version.effectiveTo ?? '', description: term.description, content: version.content, changeReason: version.changeReason, reConsent: version.reConsent });
    setEditor({ mode: 'edit', termId: term.id });
    setDetailId(null);
  }

  function openNewVersion(term: TermsDefinition) {
    const version = currentVersion(term);
    setForm({ name: term.name, code: term.code, type: term.type, version: '', consent: term.consent, scopes: termsScopes(term), effectiveFrom: '', effectiveTo: '', description: term.description, content: version.content, changeReason: '', reConsent: false });
    setEditor({ mode: 'newVersion', termId: term.id });
    setDetailId(null);
  }

  function validate(mode: 'draft' | 'publish') {
    if (!form.name.trim() || !form.code.trim() || !form.version.trim()) return '약관명, 약관 코드, 버전을 입력해 주세요.';
    if (!form.scopes.length) return '적용 범위를 하나 이상 선택해 주세요.';
    if (!/^[A-Z0-9_]+$/.test(form.code.trim())) return '약관 코드는 영문 대문자, 숫자, 밑줄만 사용할 수 있습니다.';
    if (!form.content.trim()) return '약관 내용을 입력해 주세요.';
    if (mode === 'publish' && !form.effectiveFrom) return '적용 시작일을 입력해 주세요.';
    if (form.effectiveTo && form.effectiveFrom && form.effectiveTo < form.effectiveFrom) return '적용 종료일은 시작일 이후여야 합니다.';
    if (editor?.mode !== 'edit' && terms.some((term) => term.code === form.code.trim()) && editor?.mode !== 'newVersion') return '이미 사용 중인 약관 코드입니다.';
    const target = editor?.termId ? terms.find((term) => term.id === editor.termId) : null;
    if (target && editor?.mode === 'newVersion') {
      if (target.versions.some((version) => version.version.toLowerCase() === form.version.trim().toLowerCase())) return '이미 등록된 버전입니다.';
      if (mode === 'publish' && target.versions.some((version) => version.status === '적용 예정')) return '이미 적용 예정 버전이 있어 적용 기간이 겹칩니다.';
      const active = target.versions.find((version) => version.status === '적용중');
      if (mode === 'publish' && active && form.effectiveFrom <= active.effectiveFrom) return '새 버전의 적용일은 현재 버전 시작일 이후여야 합니다.';
      if (!form.changeReason.trim()) return '버전 변경 사유를 입력해 주세요.';
    }
    return '';
  }

  function save(mode: 'draft' | 'publish') {
    if (!editor) return;
    const error = validate(mode);
    if (error) return notify(error);
    const status: TermsStatus = mode === 'draft' ? '임시저장' : form.effectiveFrom > TODAY ? '적용 예정' : '적용중';
    const timestamp = '2026-08-26 15:40';
    if (editor.mode === 'edit' && editor.termId) {
      setTerms((items) => items.map((term) => term.id !== editor.termId ? term : {
        ...term, name: form.name.trim(), code: form.code.trim(), type: form.type, consent: form.consent, scopes: form.scopes, description: form.description.trim(),
        versions: term.versions.map((version) => version.status !== '임시저장' ? version : { ...version, version: form.version.trim(), status, effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || null, content: form.content, changeReason: form.changeReason.trim(), reConsent: form.reConsent, createdAt: timestamp }),
        history: [{ at: timestamp, actor: 'admin01', action: status === '임시저장' ? '임시저장 수정' : `${form.version.trim()} 등록`, detail: form.changeReason.trim() || '약관 내용 갱신' }, ...term.history],
      }));
      setDetailId(editor.termId);
    } else if (editor.mode === 'newVersion' && editor.termId) {
      const newVersion: TermsVersion = { id: `TV-${Date.now()}`, version: form.version.trim(), status, effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || null, content: form.content, changeReason: form.changeReason.trim(), createdBy: 'admin01', createdAt: timestamp, reConsent: form.reConsent };
      setTerms((items) => items.map((term) => term.id !== editor.termId ? term : {
        ...term, name: form.name.trim(), type: form.type, consent: form.consent, scopes: form.scopes, description: form.description.trim(),
        versions: [newVersion, ...term.versions.map((version) => mode === 'publish' && version.status === '적용중' ? { ...version, status: '종료' as TermsStatus, effectiveTo: dayBefore(form.effectiveFrom) } : version)],
        history: [{ at: timestamp, actor: 'admin01', action: status === '임시저장' ? `${form.version.trim()} 임시저장` : `${form.version.trim()} 신규 등록`, detail: mode === 'publish' ? `${form.effectiveFrom} 시행 · 기존 적용 버전 자동 종료` : form.changeReason.trim() }, ...term.history],
      }));
      setDetailId(editor.termId);
    } else {
      const id = `TERM-${String(terms.length + 1).padStart(3, '0')}`;
      const version: TermsVersion = { id: `TV-${Date.now()}`, version: form.version.trim(), status, effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || null, content: form.content, changeReason: form.changeReason.trim() || '최초 등록', createdBy: 'admin01', createdAt: timestamp, reConsent: form.reConsent };
      const term: TermsDefinition = { id, name: form.name.trim(), code: form.code.trim(), type: form.type, consent: form.consent, scopes: form.scopes, description: form.description.trim(), versions: [version], agreement: { target: 0, agreed: 0 }, history: [{ at: timestamp, actor: 'admin01', action: status === '임시저장' ? '임시저장' : `${version.version} 최초 등록`, detail: form.changeReason.trim() || `${form.effectiveFrom || '미정'} 시행` }] };
      setTerms((items) => [term, ...items]);
      setDetailId(id);
    }
    setEditor(null);
    notify(mode === 'draft' ? '약관을 임시저장했습니다.' : status === '적용 예정' ? '약관 적용을 예약했습니다.' : '약관을 등록하고 적용했습니다.');
  }

  function endApplication() {
    if (!endId) return;
    setTerms((items) => items.map((term) => term.id !== endId ? term : {
      ...term,
      versions: term.versions.map((version) => version.status === '적용중' ? { ...version, status: '종료', effectiveTo: TODAY } : version),
      history: [{ at: '2026-08-26 15:40', actor: 'admin01', action: '적용 종료', detail: '관리자 수동 종료' }, ...term.history],
    }));
    setEndId(null);
    notify('현재 적용 버전을 종료했습니다.');
  }

  function deleteDraft() {
    if (!deleteId) return;
    setTerms((items) => items.filter((term) => term.id !== deleteId));
    if (detailId === deleteId) setDetailId(null);
    setDeleteId(null);
    notify('임시저장 약관을 삭제했습니다.');
  }

  function viewVersion(term: TermsDefinition, versionId: string) {
    const version = term.versions.find((item) => item.id === versionId);
    if (!version) return;
    setPreview({ name: term.name, code: term.code, version: version.version, effectiveFrom: version.effectiveFrom, content: version.content });
  }

  function toggleScope(scope: ConfigScope) {
    setForm((current) => {
      if (scope === '공통') return { ...current, scopes: ['공통'] };
      const scopes = current.scopes.filter((item) => item !== '공통');
      return { ...current, scopes: scopes.includes(scope) ? scopes.filter((item) => item !== scope) : [...scopes, scope] };
    });
  }

  const rows: GridRow[] = filtered.map((term) => {
    const version = currentVersion(term);
    const scopes = termsScopes(term);
    const scopeMeta = scopes.length === 1 ? CONFIG_SCOPE_BADGE_META[scopes[0]] : CONFIG_SCOPE_BADGE_META.공통;
    const meta = STATUS_META[version.status];
    return { id: term.id, onClick: () => setDetailId(term.id), cells: [
      { kind: 'stack', title: term.name, subtitle: term.code },
      { kind: 'pillText', text: scopes.join(' · '), bg: scopeMeta.bg, fg: scopeMeta.fg },
      { kind: 'text', text: term.type, size: '11.5px' },
      { kind: 'link', text: version.version },
      { kind: 'pillText', text: term.consent, bg: term.consent === '필수' ? '#fff7ed' : term.consent === '선택' ? '#eff6ff' : '#f4f4f5', fg: term.consent === '필수' ? '#c2410c' : term.consent === '선택' ? '#2563eb' : '#71717a' },
      { kind: 'badge', text: version.status, bg: meta.bg, fg: meta.fg },
      { kind: 'text', text: version.effectiveFrom || '-', numeric: true },
      { kind: 'text', text: version.effectiveTo ?? '-', numeric: true },
      { kind: 'stack', title: version.createdAt.slice(0, 10), subtitle: version.createdBy },
    ] };
  });

  return <div className={shared.page} onClick={() => menuId && setMenuId(null)}>
    <header className={shared.header}>
      <div className={shared.headerTop}><div><div className={shared.title}>약관 관리</div><div className={shared.subtitle}>서비스 약관과 동의 문서를 코드·버전 단위로 등록하고 적용 이력을 관리합니다.</div></div><button type="button" className={shared.createBtn} onClick={() => openCreate()}>+ 약관 등록</button></div>
      <div className={shared.quickFilters}>
        {QUICK.map((item) => {
          const active = quick === item;
          return (
            <CommonButton
              key={item}
              variant={active ? 'primary-light' : 'secondary'}
              size="md"
              className={`${shared.qfBtn} ${active ? styles.quickActive : ''}`}
              onClick={() => setQuick(item)}
            >
              <span className={shared.qfLabel}>{item}</span>
              <span className={shared.qfCount}>{terms.filter((term) => matchesConfigScope(termsScopes(term), scopeFilter) && quickMatch(term, item)).length}</span>
            </CommonButton>
          );
        })}
      </div>
      <div className={shared.filterBox}>
        <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>전체 검색</option><option>약관명</option><option>약관 코드</option><option>버전</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="약관명 / 약관 코드 / 버전"/><button type="submit" className={shared.searchBtn}>조회</button></form>
        <div className={shared.filterRow2}><label className="globalFilterField"><span>적용 범위</span><select className={shared.selectSm} value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value as ConfigScopeFilter)} aria-label="적용 범위">{CONFIG_SCOPE_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>유형</span><select aria-label="유형" className={shared.selectSm} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">전체 유형</option>{TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>상태</span><select aria-label="상태" className={shared.selectSm} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">전체 상태</option>{Object.keys(STATUS_META).map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>동의 구분</span><select aria-label="동의 구분" className={shared.selectSm} value={consentFilter} onChange={(event) => setConsentFilter(event.target.value)}><option value="">전체 동의 구분</option><option>필수</option><option>선택</option><option>동의 불필요</option></select></label><label className={shared.dateFilterField}><span>시행일</span><span className={shared.dateRange}><DatePicker value={dateFrom} onChange={(event) => setDateFrom(event.target.value)}/><span className={shared.dateSeparator} aria-hidden="true">~</span><DatePicker value={dateTo} onChange={(event) => setDateTo(event.target.value)}/></span></label><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={resetFilters}>초기화</button></div>
      </div>
    </header>
    <div className={shared.gridWrap}><div className={shared.resultRow}><span className={shared.resultLabel}>총 {filtered.length}개 약관 · 코드 단위</span><div className={shared.resultActions}><select className={shared.pageSizeSelect}><option>20개씩</option><option>50개씩</option></select></div></div><DataGrid columns={COLUMNS} rows={rows} gridTemplate="minmax(205px,1.7fr) 114px 56px 60px 84px 76px 88px 88px 94px" minWidth="995px" empty={filtered.length === 0} emptyText="검색 조건에 해당하는 약관이 없습니다." emptySubtext="검색어나 필터 조건을 변경하거나 새 약관을 등록해 주세요." emptyActionLabel="약관 등록" emptyActionClick={() => openCreate()} showPagination pages={[{ label: '‹' }, { label: '1', active: true }, { label: '›' }]} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'}/></div>
    {selected && <TermsDetailDrawer key={`${selected.id}-${selected.versions.length}-${currentVersion(selected).status}`} term={selected} onClose={() => setDetailId(null)} onNewVersion={() => openNewVersion(selected)} onEdit={() => openEdit(selected)} onEnd={() => setEndId(selected.id)} onViewVersion={(id) => viewVersion(selected, id)}/>}
    {editor && <Dialog title={editor.mode === 'newVersion' ? '새 버전 등록' : editor.mode === 'edit' ? '약관 수정' : editor.mode === 'clone' ? '약관 복제 등록' : '약관 등록'} wide onClose={() => setEditor(null)}>
      <p className={shared.dialogBody}>{editor.mode === 'newVersion' ? '현재 약관 내용을 복사해 새 버전으로 등록합니다. 적용 시작일 전날 기존 적용 버전이 자동 종료됩니다.' : '약관 코드와 버전별로 내용 및 적용 기간을 관리합니다.'}</p>
      <div className={styles.formGrid}><Field label="약관명 *"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></Field><Field label="약관 코드 *"><input value={form.code} readOnly={editor.mode === 'newVersion'} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="TERMS_SERVICE"/></Field><Field label="약관 유형 *"><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{TYPES.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="버전 *"><input value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} placeholder="v1.0"/></Field><Field label="적용 시작일"><DatePicker value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })}/></Field><Field label="적용 종료일"><DatePicker value={form.effectiveTo} onChange={(event) => setForm({ ...form, effectiveTo: event.target.value })}/></Field></div>
      <div className={styles.radioRow}><span>적용 범위 *</span>{CONFIG_SCOPES.map((item) => <label key={item}><input type="checkbox" checked={form.scopes.includes(item)} onChange={() => toggleScope(item)}/> {item}</label>)}</div>
      <div className={styles.radioRow}><span>동의 구분</span>{(['필수', '선택', '동의 불필요'] as ConsentType[]).map((item) => <label key={item}><input type="radio" checked={form.consent === item} onChange={() => setForm({ ...form, consent: item })}/> {item}</label>)}</div>
      <Field label="설명"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="운영자가 문서 용도를 알아볼 수 있는 설명"/></Field>
      <Field label={editor.mode === 'newVersion' ? '버전 변경 사유 *' : '등록 / 변경 사유'}><input value={form.changeReason} onChange={(event) => setForm({ ...form, changeReason: event.target.value })} placeholder="주요 변경 내용을 입력하세요."/></Field>
      {form.consent !== '동의 불필요' && <label className={styles.checkRow}><input type="checkbox" checked={form.reConsent} onChange={(event) => setForm({ ...form, reConsent: event.target.checked })}/> 새 버전 적용 시 기존 동의 회원에게 재동의 요청</label>}
      <div className={styles.editor}><div className={styles.toolbar}><button type="button">제목</button><button type="button"><b>B</b></button><button type="button">목록</button><button type="button">링크</button></div><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="약관 본문을 입력하세요."/></div>
      <div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setEditor(null)}>취소</button><button type="button" className={drawer.actionLink} onClick={() => setPreview({ name: form.name || '약관명', code: form.code, version: form.version || '-', effectiveFrom: form.effectiveFrom || '-', content: form.content })}>미리보기</button><button type="button" className={drawer.editCancel} onClick={() => save('draft')}>임시저장</button><button type="button" className={drawer.editConfirm} onClick={() => save('publish')}>등록</button></div>
    </Dialog>}
    {preview && <Dialog title="약관 미리보기" wide onClose={() => setPreview(null)}><div className={styles.preview}><div className={styles.previewHead}><h3>{preview.name}</h3><p>{preview.code} · {preview.version} · 시행일 {preview.effectiveFrom}</p></div><div className={styles.contentPaper}>{preview.content || '입력된 약관 내용이 없습니다.'}</div></div><div className={shared.dialogActions}><button type="button" className={drawer.editConfirm} onClick={() => setPreview(null)}>확인</button></div></Dialog>}
    {ending && <Dialog title="약관 적용 종료" onClose={() => setEndId(null)}><p className={shared.dialogBody}><strong>{ending.name}</strong>의 현재 적용 버전을 오늘({TODAY}) 종료합니다. 종료 후 내용은 수정할 수 없으며 변경 이력에 기록됩니다.</p><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setEndId(null)}>취소</button><button type="button" className={styles.dangerConfirm} onClick={endApplication}>적용 종료</button></div></Dialog>}
    {deleting && <Dialog title="임시저장 약관 삭제" onClose={() => setDeleteId(null)}><p className={shared.dialogBody}><strong>{deleting.name}</strong>을 삭제합니다. 적용 이력이 있는 약관은 삭제할 수 없습니다.</p><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setDeleteId(null)}>취소</button><button type="button" className={styles.dangerConfirm} onClick={deleteDraft}>삭제</button></div></Dialog>}
  </div>;
}

function Dialog({ title, wide, onClose, children }: { title: string; wide?: boolean; onClose: () => void; children: React.ReactNode }) {
  return <div className={shared.dialogOverlay} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`${shared.dialogBox} ${wide ? styles.wideDialog : ''}`}><div className={styles.dialogHead}><h2 className={shared.dialogTitle}>{title}</h2><button type="button" onClick={onClose}>✕</button></div>{children}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}
