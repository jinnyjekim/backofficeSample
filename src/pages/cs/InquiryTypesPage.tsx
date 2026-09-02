import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import { InquiryTypeDrawer } from './InquiryTypeDrawer';
import styles from './InquiryTypesPage.module.css';
import { CONFIG_SCOPE_FILTERS, matchesConfigScope, type ConfigScopeFilter } from '../../lib/business';
import { INQUIRY_TYPES, TYPE_TEAMS, inquiryTypeScopes, newInquiryType, typeErrors, type InquiryTypeEntry, type TypeStatus } from './inquiryTypesData';

type QuickFilter = '전체' | '사용중' | '비활성' | '설정 오류' | '담당팀 미설정' | '사용자 숨김';
type ConfirmState = { kind: 'deactivate'; item: InquiryTypeEntry } | { kind: 'delete'; item: InquiryTypeEntry } | null;

const QUICK_FILTERS: QuickFilter[] = ['전체', '사용중', '비활성', '설정 오류', '담당팀 미설정', '사용자 숨김'];
const COLUMNS = [{ label: '문의 유형명' }, { label: '적용 범위' }, { label: '상위 유형' }, { label: '유형 코드' }, { label: '기본 담당팀' }, { label: '우선순위' }, { label: 'SLA' }, { label: '신규 접수' }, { label: '사용자 노출' }, { label: '상태' }, { label: '최근 30일' }, { label: '수정일' }, { label: '관리', align: 'right' as const }];

function filterMatch(item: InquiryTypeEntry, filter: QuickFilter, all: InquiryTypeEntry[]) {
  if (filter === '사용중') return item.status === '사용';
  if (filter === '비활성') return item.status === '비활성';
  if (filter === '설정 오류') return typeErrors(item, all).length > 0;
  if (filter === '담당팀 미설정') return !item.team;
  if (filter === '사용자 숨김') return !item.visible;
  return true;
}

function history(item: InquiryTypeEntry, action: string, detail?: string): InquiryTypeEntry {
  return { ...item, updatedAt: '2026-08-24', updatedBy: 'admin01', history: [...item.history, { id: `TH-${Date.now()}-${item.id}`, at: '2026-08-24 14:00', actor: 'admin01', action, detail }] };
}

export function InquiryTypesPage() {
  const [types, setTypes] = useState(INQUIRY_TYPES);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [scopeFilter, setScopeFilter] = useState<ConfigScopeFilter>('통합');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TypeStatus | ''>('');
  const [team, setTeam] = useState('');
  const [depth, setDepth] = useState('');
  const [intake, setIntake] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerItem, setDrawerItem] = useState<InquiryTypeEntry | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'edit' | 'preview'>('view');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState('');

  const parentNames = types.filter((item) => item.depth === 1).map((item) => item.name);
  const filtered = useMemo(() => types.filter((item) => {
    if (!filterMatch(item, quickFilter, types)) return false;
    if (!matchesConfigScope(inquiryTypeScopes(item), scopeFilter)) return false;
    if (search && !`${item.name} ${item.code} ${item.parent ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (status && item.status !== status) return false;
    if (team === '미설정' ? item.team !== null : team && item.team !== team) return false;
    if (depth && item.depth !== Number(depth)) return false;
    if (intake && item.intake !== intake) return false;
    return true;
  }), [types, quickFilter, scopeFilter, search, status, team, depth, intake]);

  const toastBriefly = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  const reset = () => { setKeyword(''); setSearch(''); setScopeFilter('통합'); setStatus(''); setTeam(''); setDepth(''); setIntake(''); setSelected([]); };
  const openCreate = (seed = newInquiryType()) => { setDrawerItem(seed); setIsNew(true); setDrawerMode('edit'); };

  const save = (item: InquiryTypeEntry) => {
    if (isNew) {
      const saved = history({ ...item, status: item.status, history: [] }, '문의 유형 생성');
      setTypes((current) => [...current, saved]);
      setDrawerItem(saved); setIsNew(false); toastBriefly('문의 유형을 등록했습니다.');
    } else {
      const previous = types.find((value) => value.id === item.id);
      const detail = previous ? `설정 변경 · 새 문의부터 적용` : undefined;
      const saved = history(item, '문의 유형 설정 수정', detail);
      setTypes((current) => current.map((value) => value.id === item.id ? saved : value));
      setDrawerItem(saved); toastBriefly('설정을 저장했습니다.');
    }
  };

  const duplicate = (item: InquiryTypeEntry) => openCreate({ ...item, id: `TYPE-${Date.now()}`, name: `[복사본] ${item.name}`, code: '', status: '비활성', visible: false, intake: '중지', totalCount: 0, openCount: 0, recentCount: 0, exposedBefore: false, history: [], updatedAt: '2026-08-24', updatedBy: 'admin01' });

  const deactivate = (item: InquiryTypeEntry) => {
    const activeChildren = types.filter((child) => child.parent === item.name && child.status === '사용');
    if (item.depth === 1 && activeChildren.length) return toastBriefly(`사용 중인 하위 유형 ${activeChildren.length}개를 먼저 비활성화하거나 이동해 주세요.`);
    setConfirm({ kind: 'deactivate', item });
  };

  const confirmAction = () => {
    if (!confirm) return;
    if (confirm.kind === 'delete') {
      setTypes((current) => current.filter((item) => item.id !== confirm.item.id));
      setDrawerItem(null); toastBriefly('사용 이력이 없는 유형을 삭제했습니다.');
    } else {
      const updated = history({ ...confirm.item, status: '비활성', visible: false, intake: '중지' }, '문의 유형 비활성', '기존 문의와 통계는 유지');
      setTypes((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDrawerItem(null); toastBriefly('신규 접수를 중지하고 유형을 비활성화했습니다.');
    }
    setConfirm(null);
  };

  const move = (item: InquiryTypeEntry, direction: -1 | 1) => {
    const siblings = types.filter((value) => value.parent === item.parent).sort((a, b) => a.displayOrder - b.displayOrder);
    const index = siblings.findIndex((value) => value.id === item.id);
    const swap = siblings[index + direction];
    if (!swap) return;
    setTypes((current) => current.map((value) => value.id === item.id ? { ...value, displayOrder: swap.displayOrder } : value.id === swap.id ? { ...value, displayOrder: item.displayOrder } : value));
  };

  const rows: GridRow[] = filtered.map((item) => {
    const errors = typeErrors(item, types);
    return { id: item.id, selected: selected.includes(item.id), onToggleSelect: () => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]), onClick: () => { setDrawerItem(item); setIsNew(false); setDrawerMode('view'); }, bg: errors.length ? '#fffdf8' : undefined, cells: [
      { kind: 'titleWarn', title: `${item.depth === 2 ? '└ ' : ''}${item.name}`, hasIssue: errors.length > 0, issueTitle: errors.join(' · ') },
      { kind: 'stack', title: inquiryTypeScopes(item).join(' · '), subtitle: inquiryTypeScopes(item).includes('공통') ? '전 서비스' : `${inquiryTypeScopes(item).length}개 서비스` },
      { kind: 'text', text: item.parent ?? '대분류', size: '12px', color: item.parent ? '#52525b' : '#a1a1aa' },
      { kind: 'text', text: item.code, size: '11px', color: '#52525b', weight: 600 },
      { kind: 'text', text: item.team ?? '미설정', size: '12px', color: item.team ? '#3f3f46' : '#dc2626', weight: item.team ? 500 : 700 },
      { kind: 'pillText', text: item.priority, bg: item.priority === '높음' ? '#fff1f2' : item.priority === '낮음' ? '#f0fdf4' : '#f4f4f5', fg: item.priority === '높음' ? '#be123c' : item.priority === '낮음' ? '#15803d' : '#52525b' },
      { kind: 'stack', title: item.firstResponseHours ? `첫 답변 ${item.firstResponseHours}h` : '첫 답변 미설정', subtitle: item.resolutionHours ? `처리 ${item.resolutionHours}h · ${item.businessHours ? '영업시간' : '24시간'}` : '처리 SLA 미설정' },
      { kind: 'badge', text: item.intake, bg: item.intake === '가능' ? '#ecfdf5' : item.intake === '관리자만' ? '#f5f3ff' : '#fef2f2', fg: item.intake === '가능' ? '#047857' : item.intake === '관리자만' ? '#7c3aed' : '#dc2626' },
      { kind: 'badge', text: item.visible ? '노출' : '숨김', bg: item.visible ? '#eff6ff' : '#f4f4f5', fg: item.visible ? '#2563eb' : '#71717a' },
      { kind: 'statusDot', text: item.status, dot: item.status === '사용' ? '#10b981' : '#a1a1aa', fg: item.status === '사용' ? '#047857' : '#71717a' },
      { kind: 'text', text: `${item.recentCount.toLocaleString()}건`, size: '12px', numeric: true },
      { kind: 'stack', title: item.updatedAt, subtitle: item.updatedBy },
      { kind: 'rowMenu', align: 'right', open: openMenu === item.id, onToggle: () => setOpenMenu(openMenu === item.id ? null : item.id), items: [
        { label: '수정', click: () => { setDrawerItem(item); setIsNew(false); setDrawerMode('edit'); } }, { label: '사용자 화면 미리보기', click: () => { setDrawerItem(item); setIsNew(false); setDrawerMode('preview'); } }, { label: '1:1 문의 보기', click: () => window.location.assign('/cs/inquiries') }, { sep: true }, { label: '복제', click: () => duplicate(item) },
        item.status === '사용' ? { label: '비활성', fg: '#dc2626', click: () => deactivate(item) } : { label: '활성화', click: () => { const updated = history({ ...item, status: '사용' }, '문의 유형 활성화'); setTypes((current) => current.map((value) => value.id === item.id ? updated : value)); } },
        ...(item.totalCount === 0 && !item.exposedBefore ? [{ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', item }) }] : []),
      ] },
    ] };
  });

  return <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
    <div className={shared.headTop}>
      <div className={shared.headRow}><div><h1 className={shared.title}>문의 유형 관리</h1><p className={shared.subtitle}>1:1 문의의 분류, 자동 Routing, 우선순위, SLA와 입력 항목을 관리합니다.</p></div><button type="button" className={shared.createBtn} onClick={() => openCreate()}>+ 문의 유형 등록</button></div>
      <div className={shared.quickFilters}>{QUICK_FILTERS.map((filter) => <button key={filter} type="button" className={`${shared.qfBtn} ${quickFilter === filter ? styles.quickActive : ''}`} onClick={() => { setQuickFilter(filter); setSelected([]); }}><span className={shared.qfLabel}>{filter}</span><span className={shared.qfCount}>{types.filter((item) => matchesConfigScope(inquiryTypeScopes(item), scopeFilter) && filterMatch(item, filter, types)).length}</span></button>)}</div>
      <div className={shared.filterBox}>
        <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="유형명 또는 유형 코드 검색" /><button type="submit" className={shared.searchBtn}>검색</button></form>
        <div className={shared.filterRow2}><label className="globalFilterField"><span>적용 범위</span><select aria-label="적용 범위" className={shared.selectSm} value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value as ConfigScopeFilter)}>{CONFIG_SCOPE_FILTERS.map((scope) => <option key={scope}>{scope}</option>)}</select></label><label className="globalFilterField"><span>상태</span><select aria-label="상태" className={shared.selectSm} value={status} onChange={(e) => setStatus(e.target.value as TypeStatus | '')}><option value="">전체 상태</option><option>사용</option><option>비활성</option></select></label><label className="globalFilterField"><span>담당팀</span><select aria-label="담당팀" className={shared.selectSm} value={team} onChange={(e) => setTeam(e.target.value)}><option value="">전체 담당팀</option><option>미설정</option>{TYPE_TEAMS.map((value) => <option key={value}>{value}</option>)}</select></label><label className="globalFilterField"><span>Depth</span><select aria-label="Depth" className={shared.selectSm} value={depth} onChange={(e) => setDepth(e.target.value)}><option value="">전체 Depth</option><option value="1">Depth 1</option><option value="2">Depth 2</option></select></label><label className="globalFilterField"><span>접수 설정</span><select aria-label="접수 설정" className={shared.selectSm} value={intake} onChange={(e) => setIntake(e.target.value)}><option value="">전체 접수 설정</option><option>가능</option><option>관리자만</option><option>중지</option></select></label><span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button></div>
      </div>
    </div>

    {selected.length > 0 && <div className={shared.bulkBar}><span className={shared.bulkLabel}>{selected.length}건 선택</span><select className={shared.selectXs} defaultValue="" onChange={(e) => { const value = e.target.value; if (!value) return; setTypes((current) => current.map((item) => selected.includes(item.id) ? history({ ...item, team: value }, '담당팀 일괄 변경', value) : item)); e.target.value = ''; toastBriefly('담당팀을 일괄 변경했습니다.'); }}><option value="">담당팀 변경</option>{TYPE_TEAMS.map((value) => <option key={value}>{value}</option>)}</select><select className={shared.selectXs} defaultValue="" onChange={(e) => { const value = e.target.value as TypeStatus; if (!value) return; setTypes((current) => current.map((item) => selected.includes(item.id) ? history({ ...item, status: value }, '상태 일괄 변경', value) : item)); e.target.value = ''; }}><option value="">상태 변경</option><option>사용</option><option>비활성</option></select><button type="button" className={shared.bulkBtn} onClick={() => { setTypes((current) => current.map((item) => selected.includes(item.id) ? history({ ...item, visible: true }, '사용자 노출 일괄 변경', '노출') : item)); toastBriefly('선택 유형을 사용자 화면에 노출합니다.'); }}>사용자 노출</button><span className={styles.bulkGuard}>SLA는 영향 범위가 커서 개별 유형에서만 변경할 수 있습니다.</span></div>}

    <div className={shared.gridWrap}><div className={shared.resultRow}><span className={shared.resultLabel}>총 {filtered.length}개 유형</span><div className={shared.resultActions}><button type="button" className={shared.downloadBtn} onClick={() => setOrderOpen(true)}>☰ 순서 관리</button></div></div><DataGrid columns={COLUMNS} rows={rows} gridTemplate="100px 110px 72px 132px 68px 54px 106px 76px 56px 60px 52px 96px 46px" minWidth="1190px" selectable allSelected={filtered.length > 0 && filtered.every((item) => selected.includes(item.id))} onToggleAll={() => setSelected(filtered.every((item) => selected.includes(item.id)) ? [] : filtered.map((item) => item.id))} empty={filtered.length === 0} emptyText={quickFilter === '설정 오류' ? '현재 확인이 필요한 문의 유형 설정이 없습니다.' : '검색 결과가 없습니다.'} emptySubtext="검색어나 필터 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={[{ label: '‹' }, { label: '1', active: true }, { label: '›' }]} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0개'} /></div>

    {drawerItem && <InquiryTypeDrawer key={`${drawerItem.id}-${isNew}-${drawerMode}`} initial={drawerItem} isNew={isNew} startMode={drawerMode} parentNames={parentNames} onClose={() => setDrawerItem(null)} onSave={save} onDeactivate={deactivate} onDuplicate={duplicate} />}

    {orderOpen && <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setOrderOpen(false); }}><div className={`${shared.dialogBox} ${styles.orderDialog}`}><h2 className={shared.dialogTitle}>문의 유형 노출 순서</h2><p className={shared.dialogBody}>검색·필터와 분리된 전체 목록에서 같은 Depth의 순서를 조정합니다.</p><div className={styles.orderList}>{types.filter((item) => item.depth === 1).sort((a, b) => a.displayOrder - b.displayOrder).map((parent) => <div key={parent.id} className={styles.orderGroup}><OrderRow item={parent} onMove={move} /><div>{types.filter((child) => child.parent === parent.name).sort((a, b) => a.displayOrder - b.displayOrder).map((child) => <OrderRow key={child.id} item={child} child onMove={move} />)}</div></div>)}</div><div className={shared.dialogActions}><button type="button" className={styles.cancelButton} onClick={() => setOrderOpen(false)}>취소</button><button type="button" className={styles.primaryButton} onClick={() => { setOrderOpen(false); toastBriefly('노출 순서를 저장했습니다.'); }}>순서 저장</button></div></div></div>}

    {confirm && <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}><div className={shared.dialogBox}><h2 className={shared.dialogTitle}>{confirm.kind === 'delete' ? '문의 유형 삭제' : '문의 유형 비활성'}</h2><p className={shared.dialogBody}>{confirm.kind === 'delete' ? '사용 및 노출 이력이 없는 유형입니다. 삭제하면 복구할 수 없습니다.' : '신규 접수와 사용자 노출이 중지됩니다. 기존 문의 데이터와 접수 당시 분류·SLA는 그대로 유지됩니다.'}</p><div className={shared.dialogSummary}><div className={shared.dialogSummaryRow}><span>문의 유형</span><strong>{confirm.item.parent ? `${confirm.item.parent} > ` : ''}{confirm.item.name}</strong></div><div className={shared.dialogSummaryRow}><span>전체 연결 문의</span><strong>{confirm.item.totalCount.toLocaleString()}건</strong></div><div className={shared.dialogSummaryRow}><span>진행중 문의</span><strong>{confirm.item.openCount}건</strong></div></div><div className={shared.dialogActions}><button type="button" className={styles.cancelButton} onClick={() => setConfirm(null)}>취소</button><button type="button" className={styles.dangerButton} onClick={confirmAction}>{confirm.kind === 'delete' ? '삭제' : '비활성화'}</button></div></div></div>}
    {toast && <div className={styles.toast}>{toast}</div>}
  </section>;
}

function OrderRow({ item, child, onMove }: { item: InquiryTypeEntry; child?: boolean; onMove: (item: InquiryTypeEntry, direction: -1 | 1) => void }) { return <div className={`${styles.orderRow} ${child ? styles.orderChild : ''}`}><span className={styles.dragHandle}>☰</span><strong>{item.name}</strong><span>{item.status}</span><button type="button" onClick={() => onMove(item, -1)}>↑</button><button type="button" onClick={() => onMove(item, 1)}>↓</button></div>; }
