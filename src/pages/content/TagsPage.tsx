import { DatePicker } from '../../components/forms/DatePicker';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sh from './contentShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { TAGS, type Tag } from './tagsData';
import { ACCENT } from '../../lib/theme';
import { ContentBusinessSwitch } from './ContentBusinessSwitch';
import { CONTENT_TAXONOMY_SCOPES, type ContentTaxonomyScope } from './contentBusiness';

type SortKey = 'name' | 'count' | 'created' | 'updated';

interface TagModal {
  mode: 'new' | 'edit';
  id: string | null;
  name: string;
  code: string;
  use: boolean;
  desc: string;
}

interface MergeState {
  source: string[];
  keep: string;
}

interface DialogButton {
  label: string;
  kind: 'ghost' | 'solid' | 'danger';
  act: 'close' | 'del' | 'contents' | 'gomerge' | 'unuse';
  to?: string;
  name?: string;
}

interface DialogState {
  title: string;
  body: string;
  buttons: DialogButton[];
}

const d2 = (v: string) => v.replace(/\./g, '-');

export function TagsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Tag[]>(TAGS);
  const [scope, setScope] = useState<ContentTaxonomyScope>('공통');
  const [q, setQ] = useState('');
  const [field, setField] = useState('전체');
  const [useF, setUseF] = useState('전체');
  const [linkF, setLinkF] = useState('전체');
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-08-13');
  const [sel, setSel] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDesc, setSortDesc] = useState(true);
  const [modal, setModal] = useState<TagModal | null>(null);
  const [merge, setMerge] = useState<MergeState | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = (id: string) => items.find((x) => x.id === id);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    let out = items.filter((it) => {
      if (it.scope !== scope) return false;
      if (query) {
        const hay = field === '태그명' ? it.name : field === '태그 코드' ? it.code : it.name + it.code;
        if (!hay.toLowerCase().includes(query)) return false;
      }
      if (useF !== '전체' && (useF === '사용' ? !it.use : it.use)) return false;
      if (linkF !== '전체' && (linkF === '연결 있음' ? it.count === 0 : it.count > 0)) return false;
      if (!(d2(it.created) >= from && d2(it.created) <= to)) return false;
      return true;
    });
    const cmp: Record<SortKey, (a: Tag, b: Tag) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      count: (a, b) => a.count - b.count,
      created: (a, b) => (a.created < b.created ? -1 : 1),
      updated: (a, b) => (a.updated < b.updated ? -1 : 1),
    };
    out = out.slice().sort((a, b) => (sortDesc ? -cmp[sortKey](a, b) : cmp[sortKey](a, b)));
    return out;
  }, [items, scope, q, field, useF, linkF, from, to, sortKey, sortDesc]);

  const sel_ = sel.filter((id) => list.some((it) => it.id === id));

  const chips = [] as { key: string; label: string; clear: () => void }[];
  if (q.trim()) chips.push({ key: 'q', label: `검색: ${field} “${q.trim()}”`, clear: () => setQ('') });
  if (useF !== '전체') chips.push({ key: 'use', label: `사용 상태: ${useF}`, clear: () => setUseF('전체') });
  if (linkF !== '전체') chips.push({ key: 'link', label: `연결 상태: ${linkF}`, clear: () => setLinkF('전체') });
  if (from !== '2026-01-01' || to !== '2026-08-13') chips.push({ key: 'date', label: `등록일: ${from.replace(/-/g, '.')} ~ ${to.replace(/-/g, '.')}`, clear: () => { setFrom('2026-01-01'); setTo('2026-08-13'); } });

  function resetAll() {
    setQ(''); setField('전체'); setUseF('전체'); setLinkF('전체'); setFrom('2026-01-01'); setTo('2026-08-13'); setSel([]);
  }

  function switchScope(next: ContentTaxonomyScope) {
    if (next === scope) return;
    setScope(next);
    resetAll();
    setModal(null);
    setMerge(null);
    setDialog(null);
    setMenuId(null);
  }

  function sortHead(key: SortKey) {
    return { arrow: sortKey === key ? (sortDesc ? '↓' : '↑') : '', click: () => setSortKey((k) => { setSortDesc(k === key ? !sortDesc : true); return key; }) };
  }

  function goContents(name: string) {
    const businessQuery = scope === '공통' ? '' : `&business=${scope}`;
    navigate(`/content?q=${encodeURIComponent(name)}${businessQuery}`);
  }

  function openEdit(it: Tag) {
    setModal({ mode: 'edit', id: it.id, name: it.name, code: it.code, use: it.use, desc: it.desc });
    setMenuId(null);
  }

  const dupTag = modal && modal.name.trim() ? items.find((it) => it.scope === scope && it.id !== modal.id && it.name.trim().toLowerCase() === modal.name.trim().toLowerCase()) : null;
  const modalCur = modal && modal.mode === 'edit' ? byId(modal.id ?? '') : null;

  function saveModal() {
    if (!modal || !modal.name.trim() || !modal.code.trim() || dupTag) return;
    if (modal.mode === 'new') {
      const id = 'tn' + Date.now();
      setItems((prev) => prev.concat([{ id, scope, name: modal.name.trim(), code: modal.code.trim().toUpperCase(), count: 0, use: modal.use, desc: modal.desc, created: '2026.08.13', updated: '2026.08.13' }]));
      setToast('태그가 등록되었습니다.');
    } else {
      setItems((prev) => prev.map((it) => (it.id === modal.id ? { ...it, name: modal.name.trim(), code: modal.code.trim(), use: modal.use, desc: modal.desc, updated: '2026.08.13' } : it)));
      setToast('변경사항이 저장되었습니다.');
    }
    setModal(null);
  }

  function askUse(it: Tag, next: boolean) {
    if (!next) {
      setDialog({ title: '태그를 미사용 처리하시겠습니까?', body: '신규 콘텐츠에서는 해당 태그를 선택할 수 없습니다. 기존 콘텐츠에 연결된 태그 정보는 유지됩니다.', buttons: [{ label: '취소', kind: 'ghost', act: 'close' }, { label: '미사용 처리', kind: 'solid', act: 'unuse', to: it.id }] });
    } else {
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, use: true } : x)));
    }
    setMenuId(null);
  }

  function askDelete(it: Tag) {
    if (it.count > 0) {
      setDialog({ title: '태그를 삭제할 수 없습니다.', body: `현재 ${it.count}개의 콘텐츠가 이 태그를 사용하고 있습니다.\n연결된 콘텐츠에서 태그를 제거하거나 다른 태그로 병합해 주세요.`, buttons: [{ label: '닫기', kind: 'ghost', act: 'close' }, { label: '연결 콘텐츠 보기', kind: 'ghost', act: 'contents', name: it.name }, { label: '태그 병합', kind: 'solid', act: 'gomerge', to: it.id }] });
    } else {
      setDialog({ title: '태그를 삭제하시겠습니까?', body: `태그명: ${it.name}\n삭제된 태그는 복구할 수 없습니다.`, buttons: [{ label: '취소', kind: 'ghost', act: 'close' }, { label: '삭제', kind: 'danger', act: 'del', to: it.id }] });
    }
    setMenuId(null);
  }

  function dlgRun(b: DialogButton) {
    if (b.act === 'close') setDialog(null);
    if (b.act === 'contents' && b.name) { setDialog(null); goContents(b.name); }
    if (b.act === 'gomerge' && b.to) { setDialog(null); setMerge({ source: [b.to], keep: '' }); }
    if (b.act === 'del' && b.to) {
      setItems((prev) => prev.filter((x) => x.id !== b.to));
      setSel((prev) => prev.filter((x) => x !== b.to));
      setModal(null);
      setDialog(null);
      setToast('태그가 삭제되었습니다.');
    }
    if (b.act === 'unuse' && b.to) {
      setItems((prev) => prev.map((x) => (x.id === b.to ? { ...x, use: false } : x)));
      setDialog(null);
    }
  }

  const mgKeepOptions = merge ? (merge.source.length > 1 ? items.filter((it) => it.scope === scope && merge.source.indexOf(it.id) >= 0) : items.filter((it) => it.scope === scope && merge.source.indexOf(it.id) < 0)) : [];
  const mgMergeList = merge ? (merge.source.length > 1 ? merge.source.filter((id) => id !== merge.keep).map(byId) : merge.source.map(byId)) : [];
  const mgKeepTag = merge && merge.keep ? byId(merge.keep) : null;
  const mgTotal = merge ? mgMergeList.filter((x): x is Tag => !!x).reduce((a, it) => a + it.count, 0) + (mgKeepTag ? mgKeepTag.count : 0) : 0;

  function doMerge() {
    if (!merge || !merge.keep) return;
    const removeIds = mgMergeList.filter((x): x is Tag => !!x).map((it) => it.id);
    const addCount = mgMergeList.filter((x): x is Tag => !!x).reduce((a, it) => a + it.count, 0);
    setItems((prev) => prev.filter((it) => removeIds.indexOf(it.id) < 0).map((it) => (it.id === merge.keep ? { ...it, count: it.count + addCount, updated: '2026.08.13' } : it)));
    setSel((prev) => prev.filter((id) => removeIds.indexOf(id) < 0));
    setMerge(null);
    setToast('태그가 병합되었습니다.');
  }

  function bulkUse(val: boolean) {
    setItems((prev) => prev.map((it) => (sel_.indexOf(it.id) >= 0 ? { ...it, use: val } : it)));
  }

  function bulkDelete() {
    const linked = list.filter((it) => sel_.indexOf(it.id) >= 0 && it.count > 0);
    const removable = sel_.filter((id) => !linked.some((it) => it.id === id));
    if (linked.length) {
      setItems((prev) => prev.filter((it) => removable.indexOf(it.id) < 0));
      setSel([]);
      setDialog({ title: '일부 태그를 삭제할 수 없습니다.', body: `${linked.length}개 태그에 연결된 콘텐츠가 있어 삭제되지 않았습니다. 연결이 없는 ${removable.length}개 태그만 삭제되었습니다.`, buttons: [{ label: '닫기', kind: 'ghost', act: 'close' }] });
    } else {
      setItems((prev) => prev.filter((it) => sel_.indexOf(it.id) < 0));
      setSel([]);
      setToast('선택한 태그가 삭제되었습니다.');
    }
  }

  const columns: GridColumn[] = [
    { label: `태그명 ${sortHead('name').arrow}`, onClick: sortHead('name').click },
    { label: '태그 코드' },
    { label: `연결 콘텐츠 ${sortHead('count').arrow}`, onClick: sortHead('count').click },
    { label: '상태' },
    { label: `등록일 ${sortHead('created').arrow}`, onClick: sortHead('created').click },
    { label: `수정일 ${sortHead('updated').arrow}`, onClick: sortHead('updated').click },
    { label: '관리', align: 'right' },
  ];

  const rows: GridRow[] = list.map((it) => {
    const isSel = sel_.indexOf(it.id) >= 0;
    const stBg = it.use ? '#ecfdf5' : '#f4f4f5';
    const stFg = it.use ? '#059669' : '#71717a';
    const stLabel = it.use ? '사용' : '미사용';
    const moreItems = [
      { label: '수정', click: () => openEdit(it) },
      { label: '연결 콘텐츠 보기', click: () => goContents(it.name) },
      { sep: true },
      it.use ? { label: '사용 중지', click: () => askUse(it, false) } : { label: '사용하기', click: () => askUse(it, true) },
      { label: '태그 병합', click: () => { setMerge({ source: [it.id], keep: '' }); setMenuId(null); } },
      { label: '삭제', fg: '#b91c1c', click: () => askDelete(it) },
    ];
    const cells: Cell[] = [
      { kind: 'text', text: it.name, color: '#18181b', size: '13px', weight: 600 },
      { kind: 'text', text: it.code, color: '#71717a', size: '12px' },
      { kind: 'text', text: `${it.count.toLocaleString('ko-KR')}건`, color: '#3f3f46', size: '12.5px', numeric: true },
      { kind: 'badge', text: stLabel, bg: stBg, fg: stFg },
      { kind: 'text', text: it.created.slice(5), color: '#8b8b93', size: '12px', numeric: true },
      { kind: 'text', text: it.updated.slice(5), color: '#52525b', size: '12.5px', numeric: true },
      { kind: 'rowMenu', open: menuId === it.id, onToggle: () => setMenuId(menuId === it.id ? null : it.id), items: moreItems },
    ];
    return { id: it.id, cells, selected: isSel, onToggleSelect: () => setSel((prev) => (isSel ? prev.filter((x) => x !== it.id) : prev.concat([it.id]))), onClick: () => openEdit(it), bg: isSel ? '#f7f8ff' : 'transparent' };
  });

  const emptyAll = !items.some((item) => item.scope === scope);

  return (
    <div className={sh.page} onClick={() => { if (menuId) setMenuId(null); }}>
      {dialog && (
        <div className={sh.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setDialog(null); }}>
          <div className={sh.dialogBox}>
            <div className={sh.dialogTitle}>{dialog.title}</div>
            <div className={sh.dialogBody}>{dialog.body}</div>
            <div className={sh.dialogActions}>
              {dialog.buttons.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  className={sh.dialogBtn}
                  style={{ border: b.kind === 'ghost' ? '1px solid rgba(0,0,0,.12)' : 'none', background: b.kind === 'solid' ? ACCENT : b.kind === 'danger' ? 'oklch(0.58 0.19 25)' : '#fff', color: b.kind === 'ghost' ? '#52525b' : '#fff' }}
                  onClick={() => dlgRun(b)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {merge && (
        <div className={sh.modalOverlay} style={{ zIndex: 72 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setMerge(null); }}>
          <div className={sh.modalBox} style={{ width: 'min(440px,100%)' }}>
            <div className={sh.modalTitle}>태그 병합</div>
            <div className={sh.modalSub} style={{ fontVariantNumeric: 'normal' }}>병합 대상 태그에 연결된 콘텐츠는 유지할 태그로 자동 이전됩니다.</div>

            <div style={{ marginTop: 14 }}>
              <div className={sh.formFieldLabel} style={{ marginBottom: 6 }}>유지할 태그 <span className={sh.required}>*</span></div>
              <select className={sh.formSelect} value={merge.keep} onChange={(e) => setMerge({ ...merge, keep: e.target.value })}>
                <option value="">선택해 주세요</option>
                {mgKeepOptions.map((it) => <option key={it.id} value={it.id}>{`${it.name} (${it.count.toLocaleString('ko-KR')}건)`}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className={sh.formFieldLabel} style={{ marginBottom: 6 }}>병합 대상 (삭제됨)</div>
              <div style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 9, overflow: 'hidden' }}>
                {mgMergeList.filter((x): x is Tag => !!x).map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 11px', borderBottom: '1px solid rgba(0,0,0,.05)', fontSize: 12.5, color: '#3f3f46' }}>
                    <span>{m.name}</span>
                    <span style={{ color: '#8b8b93', fontVariantNumeric: 'tabular-nums' }}>{m.count.toLocaleString('ko-KR')}건</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '10px 12px', background: '#fafafa', borderRadius: 9 }}>
              <span style={{ fontSize: 12, color: '#71717a' }}>병합 후 총 연결 콘텐츠</span>
              <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{mgTotal.toLocaleString('ko-KR')}건</span>
            </div>

            <div className={sh.dialogActions}>
              <button type="button" className={sh.ghostBtn} onClick={() => setMerge(null)}>취소</button>
              <button type="button" className={sh.solidBtn} disabled={!merge.keep} onClick={doMerge}>병합</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className={sh.modalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={sh.modalBox}>
            <div className={sh.modalTitle}>{modal.mode === 'new' ? '태그 등록' : '태그 수정'}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <div className={sh.formField}>
                <span className={sh.formFieldLabel}>태그명 <span className={sh.required}>*</span></span>
                <input className={sh.formInput} value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="태그명을 입력하세요" />
                {dupTag && (
                  <div className={sh.warnBox}>
                    <div className={sh.warnBoxTitle}>⚠ 동일한 이름의 태그가 이미 존재합니다.</div>
                    <div className={sh.warnBoxBody}>{`${dupTag.name} · ${dupTag.code} · 연결 콘텐츠 ${dupTag.count.toLocaleString('ko-KR')}건`}</div>
                    <button type="button" className={sh.warnBoxLink} onClick={() => setModal({ mode: 'edit', id: dupTag.id, name: dupTag.name, code: dupTag.code, use: dupTag.use, desc: dupTag.desc })}>기존 태그 보기</button>
                  </div>
                )}
              </div>

              <div className={sh.formField}>
                <span className={sh.formFieldLabel}>태그 코드 <span className={sh.required}>*</span></span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className={`${sh.formInput} ${sh.mono}`} style={{ flex: 1 }} value={modal.code} onChange={(e) => setModal({ ...modal, code: e.target.value })} readOnly={modal.mode === 'edit' && !!modalCur && modalCur.count > 0} placeholder="TAG_001" />
                  {modal.mode === 'edit' && modalCur && modalCur.count > 0 && <span style={{ fontSize: 12, color: '#a1a1aa' }}>🔒</span>}
                </div>
              </div>

              <div className={sh.formField}>
                <span className={sh.formFieldLabel}>사용 여부 <span className={sh.required}>*</span></span>
                <div className={sh.useToggleRow}>
                  <button type="button" className={sh.useToggleBtn} style={{ border: `1px solid ${modal.use ? ACCENT : 'rgba(0,0,0,.12)'}`, background: modal.use ? ACCENT : '#fff', color: modal.use ? '#fff' : '#52525b' }} onClick={() => setModal({ ...modal, use: true })}>사용</button>
                  <button type="button" className={sh.useToggleBtn} style={{ border: `1px solid ${!modal.use ? '#18181b' : 'rgba(0,0,0,.12)'}`, background: !modal.use ? '#18181b' : '#fff', color: !modal.use ? '#fff' : '#52525b' }} onClick={() => setModal({ ...modal, use: false })}>미사용</button>
                </div>
              </div>

              <div className={sh.formField}>
                <span className={sh.formFieldLabel}>설명</span>
                <textarea className={sh.formTextarea} value={modal.desc} onChange={(e) => setModal({ ...modal, desc: e.target.value })} placeholder="관리자용 메모입니다." />
              </div>

              {modal.mode === 'edit' && modalCur && (
                <>
                  <div className={sh.linkedCard}>
                    <div className={sh.linkedCardLabel}>연결 콘텐츠</div>
                    <span className={sh.linkedCardValue}>{modalCur.count.toLocaleString('ko-KR')}건</span>
                    <button type="button" className={sh.selBtn} onClick={() => goContents(modalCur.name)}>콘텐츠 목록 보기</button>
                  </div>
                  <div className={sh.metaRow}>
                    {[['등록일', modalCur.created], ['수정일', modalCur.updated]].map(([label, value]) => (
                      <div key={label} className={sh.metaCell}>
                        <div className={sh.metaCellLabel}>{label}</div>
                        <div className={sh.metaCellValue}>{value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={sh.modalActions}>
              {modal.mode === 'edit' && <button type="button" className={sh.dangerBtn} onClick={() => modalCur && askDelete(modalCur)}>삭제</button>}
              <div className={sh.modalActionsSpacer} />
              <button type="button" className={sh.ghostBtn} onClick={() => setModal(null)}>취소</button>
              <button type="button" className={sh.solidBtn} disabled={!modal.name.trim() || !modal.code.trim() || !!dupTag} onClick={saveModal}>{modal.mode === 'new' ? '등록' : '변경사항 저장'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={sh.toast}>{toast}</div>}

      <header className={sh.header}>
        <div>
          <div className={sh.headerTitle}>태그 관리</div>
          <div className={sh.headerSub}>콘텐츠 분류 및 검색에 사용되는 태그를 등록하고 관리합니다.</div>
        </div>
        <ContentBusinessSwitch
          value={scope}
          options={CONTENT_TAXONOMY_SCOPES}
          onChange={switchScope}
          note={scope === '공통' ? '여러 비즈니스에서 공유' : `${scope} 전용 검색 태그`}
          label="태그 범위"
        />
        <div className={sh.headerSpacer} />
        <button type="button" className={sh.primaryBtn} onClick={() => setModal({ mode: 'new', id: null, name: '', code: '', use: true, desc: '' })}>＋ 태그 등록</button>
      </header>

      <div className={sh.body}>
        <div className={sh.topPad}>
          <div className={sh.filterBox}>
            <div className={sh.searchRow}>
              <select className={sh.selectField} value={field} onChange={(e) => setField(e.target.value)}>
                {['전체', '태그명', '태그 코드'].map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <input className={sh.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="태그명 또는 태그 코드로 검색" />
              <button type="button" className={sh.searchBtn}>검색</button>
            </div>

            <div className={sh.filterRow}>
              <div className={sh.filterField}>
                <span className={sh.filterFieldLabel}>사용 상태</span>
                <select className={sh.smallSelect} value={useF} onChange={(e) => { setUseF(e.target.value); setSel([]); }}>
                  {['전체', '사용', '미사용'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className={sh.filterField}>
                <span className={sh.filterFieldLabel}>연결 상태</span>
                <select className={sh.smallSelect} value={linkF} onChange={(e) => { setLinkF(e.target.value); setSel([]); }}>
                  {['전체', '연결 있음', '연결 없음'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className={sh.filterField}>
                <span className={sh.filterFieldLabel}>등록일</span>
                <DatePicker className={sh.dateInput} value={from} onChange={(e) => setFrom(e.target.value)} />
                <span className={sh.dateSep}>~</span>
                <DatePicker className={sh.dateInput} value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className={sh.rowSpacer} />
              <button type="button" className={sh.resetBtn} onClick={resetAll}>초기화</button>
            </div>
          </div>

          {chips.length > 0 && (
            <div className={sh.chipsRow}>
              <span className={sh.chipsLabel}>적용된 조건</span>
              {chips.map((c) => (
                <button key={c.key} type="button" className={sh.chip} onClick={c.clear}>{c.label}<span className={sh.chipX}>×</span></button>
              ))}
              <button type="button" className={sh.clearAllBtn} onClick={resetAll}>전체 초기화</button>
            </div>
          )}
        </div>

        <div className={sh.listArea}>
          <div className={sh.toolbarRow}>
            {sel_.length > 0 ? (
              <div className={sh.selBar}>
                <span className={sh.selCount}>✓ {sel_.length}개 선택됨</span>
                <button type="button" className={sh.selBtn} onClick={() => bulkUse(true)}>사용으로 변경</button>
                <button type="button" className={sh.selBtn} onClick={() => bulkUse(false)}>미사용으로 변경</button>
                {sel_.length > 1 && <button type="button" className={sh.selBtn} onClick={() => setMerge({ source: sel_.slice(), keep: '' })}>태그 병합</button>}
                <button type="button" className={sh.selBtnDanger} onClick={bulkDelete}>삭제</button>
                <div className={sh.rowSpacer} />
                <button type="button" className={sh.clearSelBtn} onClick={() => setSel([])}>선택 해제</button>
              </div>
            ) : (
              <div className={sh.noSelBar}>
                <span className={sh.totalLabel}>{`총 ${list.length.toLocaleString('ko-KR')}개`}</span>
                <div className={sh.rowSpacer} />
                <button type="button" className={sh.resetBtn}>다운로드</button>
                <select className={sh.pageSizeSelect} defaultValue="20개씩 보기">
                  <option>20개씩 보기</option>
                  <option>50개씩 보기</option>
                  <option>100개씩 보기</option>
                </select>
              </div>
            )}
          </div>

          <div className={sh.gridArea}>
            <DataGrid
              columns={columns}
              rows={rows}
              gridTemplate="minmax(200px,2fr) 120px 96px 70px 74px 74px 34px"
              minWidth="780px"
              selectable
              allSelected={list.length > 0 && sel_.length === list.length}
              onToggleAll={() => setSel(sel_.length === list.length ? [] : list.map((it) => it.id))}
              empty={list.length === 0}
              emptyText={emptyAll ? '등록된 태그가 없습니다.' : '검색 결과가 없습니다.'}
              emptySubtext={emptyAll ? '콘텐츠 분류에 사용할 태그를 등록해 주세요.' : '다른 검색어나 필터 조건을 사용해 주세요.'}
              emptyActionLabel={emptyAll ? '＋ 태그 등록' : '필터 초기화'}
              emptyActionClick={emptyAll ? () => setModal({ mode: 'new', id: null, name: '', code: '', use: true, desc: '' }) : resetAll}
              fillHeight
              stickyHeader
            />
          </div>
        </div>
      </div>
    </div>
  );
}
