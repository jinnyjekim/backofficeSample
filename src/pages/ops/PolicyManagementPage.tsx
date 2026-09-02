import { DatePicker } from '../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import { CONFIG_SCOPE_BADGE_META, CONFIG_SCOPE_FILTERS, CONFIG_SCOPES, matchesConfigScope, type ConfigScope, type ConfigScopeFilter } from '../../lib/business';
import drawer from './opsDrawerShared.module.css';
import shared from './opsShared.module.css';
import styles from './TermsManagementPage.module.css';
import { PolicyDetailDrawer } from './PolicyDetailDrawer';
import { POLICIES, currentPolicyVersion, policyScopes, type PolicyDefinition, type PolicyStatus, type PolicyVersion, type PolicyVisibility } from './policyData';

type Quick = '전체' | '적용중' | '적용 예정' | '종료';
type EditorMode = 'create' | 'edit' | 'newVersion' | 'clone';
type Editor = { mode: EditorMode; policyId?: string } | null;
type Preview = { name: string; code: string; version: string; visibility: PolicyVisibility; effectiveFrom: string; content: string } | null;
type FormState = { name: string; code: string; type: string; version: string; visibility: PolicyVisibility; scopes: ConfigScope[]; effectiveFrom: string; effectiveTo: string; description: string; content: string; changeReason: string };

const TODAY = '2026-08-26';
const QUICK: Quick[] = ['전체', '적용중', '적용 예정', '종료'];
const DEFAULT_TYPES = ['서비스 운영', '게시 운영', '고객 응대', '콘텐츠 운영', '장애 대응', '파트너 운영', '프로모션 운영'];
const STATUS_META: Record<PolicyStatus, { bg: string; fg: string }> = { 임시저장: { bg: '#f4f4f5', fg: '#52525b' }, '적용 예정': { bg: '#eff6ff', fg: '#2563eb' }, 적용중: { bg: '#ecfdf5', fg: '#047857' }, 종료: { bg: '#f4f4f5', fg: '#71717a' } };
const COLUMNS = [{ label: '정책명 / 코드' }, { label: '적용 범위' }, { label: '정책 유형' }, { label: '버전' }, { label: '공개 여부' }, { label: '상태' }, { label: '적용 시작일' }, { label: '적용 종료일' }, { label: '최근 수정일' }, { label: '관리', align: 'right' as const }];
const emptyForm = (): FormState => ({ name: '', code: '', type: '서비스 운영', version: 'v1.0', visibility: '공개', scopes: ['공통'], effectiveFrom: '', effectiveTo: '', description: '', content: '', changeReason: '' });

function dayBefore(value: string) { const date = new Date(`${value}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - 1); return date.toISOString().slice(0, 10); }
function quickMatch(policy: PolicyDefinition, quick: Quick) { return quick === '전체' || currentPolicyVersion(policy).status === quick; }

export function PolicyManagementPage() {
  const [policies, setPolicies] = useState<PolicyDefinition[]>(POLICIES);
  const [quick, setQuick] = useState<Quick>('전체');
  const [scopeFilter, setScopeFilter] = useState<ConfigScopeFilter>('통합');
  const [searchField, setSearchField] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [preview, setPreview] = useState<Preview>(null);
  const [endId, setEndId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const types = useMemo(() => [...new Set([...DEFAULT_TYPES, ...policies.map((policy) => policy.type)])], [policies]);

  const filtered = useMemo(() => policies.filter((policy) => {
    const version = currentPolicyVersion(policy);
    if (!matchesConfigScope(policyScopes(policy), scopeFilter)) return false;
    if (!quickMatch(policy, quick) || (typeFilter && policy.type !== typeFilter) || (statusFilter && version.status !== statusFilter) || (visibilityFilter && policy.visibility !== visibilityFilter)) return false;
    if (dateFrom && version.effectiveFrom < dateFrom) return false;
    if (dateTo && version.effectiveFrom > dateTo) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    if (searchField === '정책명') return policy.name.toLowerCase().includes(query);
    if (searchField === '정책 코드') return policy.code.toLowerCase().includes(query);
    if (searchField === '정책 내용') return policy.versions.some((item) => item.content.toLowerCase().includes(query));
    return `${policy.name} ${policy.code} ${version.content}`.toLowerCase().includes(query);
  }), [dateFrom, dateTo, policies, quick, scopeFilter, search, searchField, statusFilter, typeFilter, visibilityFilter]);

  const selected = policies.find((policy) => policy.id === detailId) ?? null;
  const ending = policies.find((policy) => policy.id === endId) ?? null;
  const deleting = policies.find((policy) => policy.id === deleteId) ?? null;
  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600); }
  function resetFilters() { setQuick('전체'); setScopeFilter('통합'); setSearchField('전체'); setKeyword(''); setSearch(''); setTypeFilter(''); setStatusFilter(''); setVisibilityFilter(''); setDateFrom(''); setDateTo(''); }

  function openCreate(source?: PolicyDefinition) {
    if (!source) { setForm(emptyForm()); setEditor({ mode: 'create' }); return; }
    const version = currentPolicyVersion(source);
    let code = `${source.code}_COPY`; let index = 2;
    while (policies.some((policy) => policy.code === code)) code = `${source.code}_COPY${index++}`;
    setForm({ name: `[복사본] ${source.name}`, code, type: source.type, version: 'v1.0', visibility: source.visibility, scopes: policyScopes(source), effectiveFrom: '', effectiveTo: '', description: source.description, content: version.content, changeReason: '기존 정책 복제' });
    setEditor({ mode: 'clone' }); setDetailId(null);
  }

  function openEdit(policy: PolicyDefinition) {
    const version = policy.versions.find((item) => item.status === '임시저장');
    if (!version) return notify('임시저장 상태의 정책만 직접 수정할 수 있습니다.');
    setForm({ name: policy.name, code: policy.code, type: policy.type, version: version.version, visibility: policy.visibility, scopes: policyScopes(policy), effectiveFrom: version.effectiveFrom, effectiveTo: version.effectiveTo ?? '', description: policy.description, content: version.content, changeReason: version.changeReason });
    setEditor({ mode: 'edit', policyId: policy.id }); setDetailId(null);
  }

  function openNewVersion(policy: PolicyDefinition) {
    const version = currentPolicyVersion(policy);
    setForm({ name: policy.name, code: policy.code, type: policy.type, version: '', visibility: policy.visibility, scopes: policyScopes(policy), effectiveFrom: '', effectiveTo: '', description: policy.description, content: version.content, changeReason: '' });
    setEditor({ mode: 'newVersion', policyId: policy.id }); setDetailId(null);
  }

  function validate(mode: 'draft' | 'publish') {
    if (!form.name.trim() || !form.code.trim() || !form.type.trim() || !form.version.trim()) return '정책명, 정책 코드, 정책 유형, 버전을 입력해 주세요.';
    if (!form.scopes.length) return '적용 범위를 하나 이상 선택해 주세요.';
    if (!/^[A-Z0-9_]+$/.test(form.code.trim())) return '정책 코드는 영문 대문자, 숫자, 밑줄만 사용할 수 있습니다.';
    if (!form.content.trim()) return '정책 내용을 입력해 주세요.';
    if (mode === 'publish' && !form.effectiveFrom) return '적용 시작일을 입력해 주세요.';
    if (form.effectiveTo && form.effectiveFrom && form.effectiveTo < form.effectiveFrom) return '적용 종료일은 시작일 이후여야 합니다.';
    if (editor?.mode !== 'edit' && editor?.mode !== 'newVersion' && policies.some((policy) => policy.code === form.code.trim())) return '이미 사용 중인 정책 코드입니다.';
    const target = editor?.policyId ? policies.find((policy) => policy.id === editor.policyId) : null;
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
    const error = validate(mode); if (error) return notify(error);
    const status: PolicyStatus = mode === 'draft' ? '임시저장' : form.effectiveFrom > TODAY ? '적용 예정' : '적용중';
    const timestamp = '2026-08-26 15:40';
    if (editor.mode === 'edit' && editor.policyId) {
      setPolicies((items) => items.map((policy) => policy.id !== editor.policyId ? policy : { ...policy, name: form.name.trim(), code: form.code.trim(), type: form.type.trim(), visibility: form.visibility, scopes: form.scopes, description: form.description.trim(), versions: policy.versions.map((version) => version.status !== '임시저장' ? version : { ...version, version: form.version.trim(), status, effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || null, content: form.content, changeReason: form.changeReason.trim(), createdAt: timestamp }), history: [{ at: timestamp, actor: 'admin01', action: status === '임시저장' ? '임시저장 수정' : `${form.version.trim()} 등록`, detail: form.changeReason.trim() || '정책 내용 갱신' }, ...policy.history] }));
      setDetailId(editor.policyId);
    } else if (editor.mode === 'newVersion' && editor.policyId) {
      const version: PolicyVersion = { id: `PV-${Date.now()}`, version: form.version.trim(), status, effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || null, content: form.content, changeReason: form.changeReason.trim(), createdBy: 'admin01', createdAt: timestamp };
      setPolicies((items) => items.map((policy) => policy.id !== editor.policyId ? policy : { ...policy, name: form.name.trim(), type: form.type.trim(), visibility: form.visibility, scopes: form.scopes, description: form.description.trim(), versions: [version, ...policy.versions.map((item) => mode === 'publish' && item.status === '적용중' ? { ...item, status: '종료' as PolicyStatus, effectiveTo: dayBefore(form.effectiveFrom) } : item)], history: [{ at: timestamp, actor: 'admin01', action: status === '임시저장' ? `${form.version.trim()} 임시저장` : `${form.version.trim()} 신규 등록`, detail: mode === 'publish' ? `${form.effectiveFrom} 시행 · 기존 적용 버전 자동 종료` : form.changeReason.trim() }, ...policy.history] }));
      setDetailId(editor.policyId);
    } else {
      const id = `POL-${String(policies.length + 1).padStart(3, '0')}`;
      const version: PolicyVersion = { id: `PV-${Date.now()}`, version: form.version.trim(), status, effectiveFrom: form.effectiveFrom, effectiveTo: form.effectiveTo || null, content: form.content, changeReason: form.changeReason.trim() || '최초 등록', createdBy: 'admin01', createdAt: timestamp };
      setPolicies((items) => [{ id, name: form.name.trim(), code: form.code.trim(), type: form.type.trim(), visibility: form.visibility, scopes: form.scopes, description: form.description.trim(), versions: [version], history: [{ at: timestamp, actor: 'admin01', action: status === '임시저장' ? '임시저장' : `${version.version} 최초 등록`, detail: form.changeReason.trim() || `${form.effectiveFrom || '미정'} 시행` }] }, ...items]);
      setDetailId(id);
    }
    setEditor(null); notify(mode === 'draft' ? '정책을 임시저장했습니다.' : status === '적용 예정' ? '정책 적용을 예약했습니다.' : '정책을 등록하고 적용했습니다.');
  }

  function endApplication() {
    if (!endId) return;
    setPolicies((items) => items.map((policy) => policy.id !== endId ? policy : { ...policy, versions: policy.versions.map((version) => version.status === '적용중' ? { ...version, status: '종료', effectiveTo: TODAY } : version), history: [{ at: '2026-08-26 15:40', actor: 'admin01', action: '적용 종료', detail: '관리자 수동 종료' }, ...policy.history] }));
    setEndId(null); notify('현재 적용 정책을 종료했습니다.');
  }

  function deleteDraft() { if (!deleteId) return; setPolicies((items) => items.filter((policy) => policy.id !== deleteId)); if (detailId === deleteId) setDetailId(null); setDeleteId(null); notify('임시저장 정책을 삭제했습니다.'); }
  function viewVersion(policy: PolicyDefinition, versionId: string) { const version = policy.versions.find((item) => item.id === versionId); if (version) setPreview({ name: policy.name, code: policy.code, version: version.version, visibility: policy.visibility, effectiveFrom: version.effectiveFrom, content: version.content }); }
  function toggleScope(scope: ConfigScope) { setForm((current) => { if (scope === '공통') return { ...current, scopes: ['공통'] }; const scopes = current.scopes.filter((item) => item !== '공통'); return { ...current, scopes: scopes.includes(scope) ? scopes.filter((item) => item !== scope) : [...scopes, scope] }; }); }

  const rows: GridRow[] = filtered.map((policy) => {
    const version = currentPolicyVersion(policy); const meta = STATUS_META[version.status]; const scopes = policyScopes(policy); const scopeMeta = scopes.length === 1 ? CONFIG_SCOPE_BADGE_META[scopes[0]] : CONFIG_SCOPE_BADGE_META.공통; const hasActive = policy.versions.some((item) => item.status === '적용중'); const draftOnly = policy.versions.every((item) => item.status === '임시저장');
    return { id: policy.id, onClick: () => setDetailId(policy.id), cells: [
      { kind: 'stack', title: policy.name, subtitle: policy.code }, { kind: 'pillText', text: scopes.join(' · '), bg: scopeMeta.bg, fg: scopeMeta.fg }, { kind: 'text', text: policy.type, size: '11.5px' }, { kind: 'link', text: version.version },
      { kind: 'pillText', text: policy.visibility, bg: policy.visibility === '공개' ? '#ecfdf5' : '#f4f4f5', fg: policy.visibility === '공개' ? '#047857' : '#52525b' },
      { kind: 'badge', text: version.status, bg: meta.bg, fg: meta.fg }, { kind: 'text', text: version.effectiveFrom || '-', numeric: true }, { kind: 'text', text: version.effectiveTo ?? '-', numeric: true }, { kind: 'stack', title: version.createdAt.slice(0, 10), subtitle: version.createdBy },
      { kind: 'rowMenu', align: 'right', open: menuId === policy.id, onToggle: () => setMenuId(menuId === policy.id ? null : policy.id), items: [...(version.status === '임시저장' ? [{ label: '수정', click: () => openEdit(policy) }] : [{ label: '새 버전 등록', click: () => openNewVersion(policy) }]), { label: '복제', click: () => openCreate(policy) }, { label: '정책 미리보기', click: () => viewVersion(policy, version.id) }, ...(hasActive ? [{ sep: true }, { label: '적용 종료', fg: '#dc2626', click: () => setEndId(policy.id) }] : []), ...(draftOnly ? [{ sep: true }, { label: '삭제', fg: '#dc2626', click: () => setDeleteId(policy.id) }] : [])] },
    ] };
  });

  return <section className={shared.page} onClick={() => menuId && setMenuId(null)}>
    <div className={shared.headTop}>
      <div className={shared.headRow}><div><h1 className={shared.title}>정책 관리</h1><p className={shared.subtitle}>서비스 운영에 필요한 공개·내부 정책 문서를 등록하고 개정 및 적용 이력을 관리합니다.</p></div><button type="button" className={shared.createBtn} onClick={() => openCreate()}>+ 정책 등록</button></div>
      <div className={shared.quickFilters}>{QUICK.map((item) => <button key={item} type="button" className={`${shared.qfBtn} ${quick === item ? styles.quickActive : ''}`} onClick={() => setQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{policies.filter((policy) => matchesConfigScope(policyScopes(policy), scopeFilter) && quickMatch(policy, item)).length}</span></button>)}</div>
      <div className={shared.filterBox}><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm} value={searchField} onChange={(event) => setSearchField(event.target.value)}><option>전체</option><option>정책명</option><option>정책 코드</option><option>정책 내용</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="정책명 / 정책 코드 / 정책 내용"/><button type="submit" className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>적용 범위</span><select className={shared.selectSm} value={scopeFilter} onChange={(event) => setScopeFilter(event.target.value as ConfigScopeFilter)} aria-label="적용 범위">{CONFIG_SCOPE_FILTERS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>정책 유형</span><select aria-label="정책 유형" className={shared.selectSm} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">전체 정책 유형</option>{types.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>상태</span><select aria-label="상태" className={shared.selectSm} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">전체 상태</option>{Object.keys(STATUS_META).map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>공개 범위</span><select aria-label="공개 범위" className={shared.selectSm} value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value)}><option value="">전체 공개 범위</option><option>공개</option><option>내부용</option></select></label><label className={styles.checkRow}>적용일 <DatePicker value={dateFrom} onChange={(event) => setDateFrom(event.target.value)}/><span>–</span><DatePicker value={dateTo} onChange={(event) => setDateTo(event.target.value)}/></label><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={resetFilters}>초기화</button></div></div>
    </div>
    <div className={shared.gridWrap}><div className={shared.resultRow}><span className={shared.resultLabel}>총 {filtered.length}개 정책 · 문서 코드 단위</span><div className={shared.resultActions}><select className={shared.pageSizeSelect}><option>20개씩</option><option>50개씩</option></select></div></div><DataGrid columns={COLUMNS} rows={rows} gridTemplate="minmax(205px,1.7fr) 114px 80px 60px 62px 76px 88px 88px 94px 46px" minWidth="1040px" empty={filtered.length === 0} emptyText="검색 조건에 해당하는 정책이 없습니다." emptySubtext="검색어나 필터 조건을 변경하거나 새 정책을 등록해 주세요." emptyActionLabel="정책 등록" emptyActionClick={() => openCreate()} showPagination pages={[{ label: '‹' }, { label: '1', active: true }, { label: '›' }]} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'}/></div>
    {selected && <PolicyDetailDrawer key={`${selected.id}-${selected.versions.length}-${currentPolicyVersion(selected).status}`} policy={selected} onClose={() => setDetailId(null)} onNewVersion={() => openNewVersion(selected)} onEdit={() => openEdit(selected)} onEnd={() => setEndId(selected.id)} onViewVersion={(id) => viewVersion(selected, id)}/>}
    {editor && <Dialog title={editor.mode === 'newVersion' ? '새 정책 버전 등록' : editor.mode === 'edit' ? '정책 수정' : editor.mode === 'clone' ? '정책 복제 등록' : '정책 등록'} wide onClose={() => setEditor(null)}><p className={shared.dialogBody}>{editor.mode === 'newVersion' ? '현재 정책 내용을 복사해 새 버전으로 등록합니다. 적용 시작일 전날 기존 적용 버전이 자동 종료됩니다.' : '사용자 공개 정책과 관리자 내부 운영 기준을 문서·버전 단위로 관리합니다.'}</p><div className={styles.formGrid}><Field label="정책명 *"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></Field><Field label="정책 코드 *"><input value={form.code} readOnly={editor.mode === 'newVersion'} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="POLICY_SERVICE"/></Field><Field label="정책 유형 *"><input list="policy-types" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} placeholder="정책 유형 입력 또는 선택"/><datalist id="policy-types">{types.map((item) => <option key={item} value={item}/>)}</datalist></Field><Field label="버전 *"><input value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} placeholder="v1.0"/></Field><Field label="적용 시작일 *"><DatePicker value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })}/></Field><Field label="적용 종료일"><DatePicker value={form.effectiveTo} onChange={(event) => setForm({ ...form, effectiveTo: event.target.value })}/></Field></div><div className={styles.radioRow}><span>적용 범위 *</span>{CONFIG_SCOPES.map((item) => <label key={item}><input type="checkbox" checked={form.scopes.includes(item)} onChange={() => toggleScope(item)}/> {item}</label>)}</div><div className={styles.radioRow}><span>공개 범위 *</span>{(['공개', '내부용'] as PolicyVisibility[]).map((item) => <label key={item}><input type="radio" checked={form.visibility === item} onChange={() => setForm({ ...form, visibility: item })}/> {item}</label>)}</div><Field label="설명"><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="정책의 목적과 적용 범위를 입력하세요."/></Field><Field label={editor.mode === 'newVersion' ? '버전 변경 사유 *' : '등록 / 변경 사유'}><input value={form.changeReason} onChange={(event) => setForm({ ...form, changeReason: event.target.value })} placeholder="주요 변경 내용을 입력하세요."/></Field><div className={styles.editor}><div className={styles.toolbar}><button type="button">제목</button><button type="button">문단</button><button type="button"><b>B</b></button><button type="button">1.</button><button type="button">•</button><button type="button">링크</button></div><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="정책 내용을 입력하세요."/></div><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setEditor(null)}>취소</button><button type="button" className={drawer.actionLink} onClick={() => setPreview({ name: form.name || '정책명', code: form.code, version: form.version || '-', visibility: form.visibility, effectiveFrom: form.effectiveFrom || '-', content: form.content })}>미리보기</button><button type="button" className={drawer.editCancel} onClick={() => save('draft')}>임시저장</button><button type="button" className={drawer.editConfirm} onClick={() => save('publish')}>등록</button></div></Dialog>}
    {preview && <Dialog title="정책 미리보기" wide onClose={() => setPreview(null)}><div className={styles.preview}><div className={styles.previewHead}><h3>{preview.name}</h3><p>{preview.code} · {preview.visibility} · {preview.version} · 시행일 {preview.effectiveFrom}</p></div><div className={styles.contentPaper}>{preview.content || '입력된 정책 내용이 없습니다.'}</div></div><div className={shared.dialogActions}><button type="button" className={drawer.editConfirm} onClick={() => setPreview(null)}>확인</button></div></Dialog>}
    {ending && <Dialog title="정책 적용 종료" onClose={() => setEndId(null)}><p className={shared.dialogBody}><strong>{ending.name}</strong>의 현재 적용 버전을 오늘({TODAY}) 종료합니다. 종료 후 정책은 삭제되지 않고 이력으로 보존됩니다.</p><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setEndId(null)}>취소</button><button type="button" className={styles.dangerConfirm} onClick={endApplication}>적용 종료</button></div></Dialog>}
    {deleting && <Dialog title="임시저장 정책 삭제" onClose={() => setDeleteId(null)}><p className={shared.dialogBody}><strong>{deleting.name}</strong>을 삭제합니다. 적용 이력이 있는 정책은 삭제할 수 없습니다.</p><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setDeleteId(null)}>취소</button><button type="button" className={styles.dangerConfirm} onClick={deleteDraft}>삭제</button></div></Dialog>}
    {toast && <div className={styles.toast}>{toast}</div>}
  </section>;
}

function Dialog({ title, wide, onClose, children }: { title: string; wide?: boolean; onClose: () => void; children: React.ReactNode }) { return <div className={shared.dialogOverlay} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`${shared.dialogBox} ${wide ? styles.wideDialog : ''}`}><div className={styles.dialogHead}><h2 className={shared.dialogTitle}>{title}</h2><button type="button" onClick={onClose}>✕</button></div>{children}</div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
