import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sh from './contentShared.module.css';
import styles from './CategoriesPage.module.css';
import { CATEGORIES, MAX_DEPTH, type Category } from './categoriesData';
import { ACCENT } from '../../lib/theme';

interface Draft {
  name: string;
  code: string;
  parent: string;
  use: boolean;
  desc: string;
}

interface DialogButton {
  label: string;
  kind: 'ghost' | 'solid' | 'danger';
  act: 'close' | 'go' | 'contents' | 'del' | 'use';
  to?: string;
  name?: string;
}

interface DialogState {
  title: string;
  body: string;
  buttons: DialogButton[];
}

export function CategoriesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Category[]>(CATEGORIES);
  const [selId, setSelId] = useState('c011');
  const [q, setQ] = useState('');
  const [openIds, setOpenIds] = useState<string[]>(['c01', 'c02', 'c03', 'c031']);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'new'>('edit');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toast, setToast] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = (id: string) => items.find((x) => x.id === id);
  const kids = (id: string) => items.filter((x) => x.parent === id);
  const depthOf = (id: string): number => { let d = 1; let p = byId(id); while (p && p.parent) { d++; p = byId(p.parent); } return d; };
  const descend = (id: string): string[] => kids(id).reduce<string[]>((a, c) => a.concat([c.id], descend(c.id)), []);
  const rollCount = (id: string): number => (byId(id)?.count ?? 0) + descend(id).reduce((a, i) => a + (byId(i)?.count ?? 0), 0);
  const pathOf = (id: string): string => { const out: string[] = []; let p = byId(id); while (p) { out.unshift(p.name); p = p.parent ? byId(p.parent) : undefined; } return out.join(' › '); };

  const query = q.trim().toLowerCase();
  const hit = (it: Category) => it.name.toLowerCase().includes(query) || it.code.toLowerCase().includes(query);
  const matched = query ? items.filter(hit).map((x) => x.id) : [];
  const keep = query
    ? matched.reduce<string[]>((a, id) => {
        const out = [id];
        let p = byId(id);
        while (p && p.parent) { out.push(p.parent); p = byId(p.parent); }
        return a.concat(out, descend(id));
      }, [])
    : null;

  const flat: { it: Category; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    items.filter((x) => x.parent === parent).forEach((it) => {
      if (keep && keep.indexOf(it.id) < 0) return;
      const parentOpen = !it.parent || !!query || openIds.indexOf(it.parent) >= 0;
      if (parentOpen) flat.push({ it, depth });
      walk(it.id, depth + 1);
    });
  };
  walk(null, 1);

  const cur = byId(selId);
  const isNew = mode === 'new';
  const effectiveDraft: Draft | null = draft ?? (cur ? { name: cur.name, code: cur.code, parent: cur.parent ?? '', use: cur.use, desc: cur.desc } : null);
  const dirty = isNew
    ? !!(effectiveDraft && (effectiveDraft.name || effectiveDraft.code || effectiveDraft.desc))
    : !!(cur && effectiveDraft && (effectiveDraft.name !== cur.name || effectiveDraft.code !== cur.code || (effectiveDraft.parent || '') !== (cur.parent || '') || effectiveDraft.use !== cur.use || effectiveDraft.desc !== cur.desc));

  function setD(patch: Partial<Draft>) {
    if (!effectiveDraft) return;
    setDraft({ ...effectiveDraft, ...patch });
    setErr('');
  }

  function select(id: string) {
    if (dirty) {
      setDialog({
        title: '저장하지 않은 변경사항이 있습니다.',
        body: '변경사항을 저장하지 않고 이동하시겠습니까?',
        buttons: [
          { label: '계속 수정', kind: 'ghost', act: 'close' },
          { label: '저장하지 않고 이동', kind: 'solid', act: 'go', to: id },
        ],
      });
    } else {
      setSelId(id); setMode('edit'); setDraft(null); setMenuId(null); setErr('');
    }
  }

  const parentOptions = [{ value: '', label: '최상위 카테고리' }].concat(
    items
      .filter((it) => (isNew ? depthOf(it.id) < MAX_DEPTH : it.id !== selId && descend(selId).indexOf(it.id) < 0 && depthOf(it.id) < MAX_DEPTH))
      .map((it) => ({ value: it.id, label: '　'.repeat(depthOf(it.id) - 1) + (depthOf(it.id) > 1 ? '└ ' : '') + it.name })),
  );

  function goContents(name: string) {
    navigate(`/content?cat=${encodeURIComponent(name)}`);
  }

  function doSave() {
    if (!effectiveDraft) return;
    if (!effectiveDraft.name.trim()) { setErr('카테고리명을 입력해 주세요.'); return; }
    if (!effectiveDraft.code.trim()) { setErr('카테고리 코드를 입력해 주세요.'); return; }
    const dup = items.some((it) => it.id !== (isNew ? '' : selId) && (it.parent || '') === (effectiveDraft.parent || '') && it.name.trim() === effectiveDraft.name.trim());
    if (dup) { setErr('같은 상위 카테고리 안에 동일한 이름이 이미 있습니다.'); return; }
    if (isNew) {
      const id = 'n' + Date.now();
      const rec: Category = { id, name: effectiveDraft.name.trim(), code: effectiveDraft.code.trim().toUpperCase(), parent: effectiveDraft.parent || null, use: effectiveDraft.use, desc: effectiveDraft.desc, count: 0, created: '2026.08.13', updated: '2026.08.13', locked: false };
      setItems((prev) => prev.concat([rec]));
      setSelId(id); setMode('edit'); setDraft(null);
      if (effectiveDraft.parent) setOpenIds((prev) => prev.concat([effectiveDraft.parent]));
      setToast('카테고리가 등록되었습니다.');
    } else {
      setItems((prev) => prev.map((it) => (it.id === selId ? { ...it, name: effectiveDraft.name.trim(), code: effectiveDraft.code.trim(), parent: effectiveDraft.parent || null, use: effectiveDraft.use, desc: effectiveDraft.desc, updated: '2026.08.13' } : it)));
      setDraft(null);
      setToast('변경사항이 저장되었습니다.');
    }
  }

  function askDelete(it: Category) {
    if (kids(it.id).length) {
      setDialog({ title: '하위 카테고리가 존재합니다.', body: '하위 카테고리를 먼저 이동하거나 삭제해 주세요.', buttons: [{ label: '닫기', kind: 'solid', act: 'close' }] });
    } else if (it.count > 0) {
      setDialog({ title: '카테고리를 삭제할 수 없습니다.', body: `현재 이 카테고리에 ${it.count}개의 콘텐츠가 연결되어 있습니다. 연결된 콘텐츠의 카테고리를 먼저 변경해 주세요.`, buttons: [{ label: '닫기', kind: 'ghost', act: 'close' }, { label: '콘텐츠 목록 보기', kind: 'solid', act: 'contents', name: it.name }] });
    } else {
      setDialog({ title: '카테고리를 삭제하시겠습니까?', body: `삭제된 카테고리는 복구할 수 없습니다.\n카테고리: ${it.name}`, buttons: [{ label: '취소', kind: 'ghost', act: 'close' }, { label: '삭제', kind: 'danger', act: 'del', to: it.id }] });
    }
    setMenuId(null);
  }

  function askUse(it: Category, next: boolean) {
    if (!next) {
      setDialog({ title: '카테고리를 미사용 처리하시겠습니까?', body: '신규 콘텐츠에서는 해당 카테고리를 선택할 수 없습니다. 기존 콘텐츠의 카테고리 정보는 유지됩니다.', buttons: [{ label: '취소', kind: 'ghost', act: 'close' }, { label: '미사용 처리', kind: 'solid', act: 'use', to: it.id } ] });
    } else {
      setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, use: true } : x)));
    }
    setMenuId(null);
  }

  function dlgRun(b: DialogButton) {
    if (b.act === 'close') setDialog(null);
    if (b.act === 'go' && b.to) { setDialog(null); setSelId(b.to); setMode('edit'); setDraft(null); setErr(''); }
    if (b.act === 'contents' && b.name) { setDialog(null); goContents(b.name); }
    if (b.act === 'del' && b.to) {
      setItems((prev) => {
        const next = prev.filter((x) => x.id !== b.to);
        if (next[0]) setSelId(next[0].id);
        return next;
      });
      setDraft(null); setMode('edit'); setDialog(null);
      setToast('카테고리가 삭제되었습니다.');
    }
    if (b.act === 'use' && b.to) {
      const target = selId === b.to && draft ? null : b.to;
      if (target) setItems((prev) => prev.map((x) => (x.id === b.to ? { ...x, use: false } : x)));
      else setDraft(effectiveDraft ? { ...effectiveDraft, use: false } : null);
      setDialog(null);
    }
  }

  function move(fromId: string, toId: string) {
    const a = byId(fromId);
    const b = byId(toId);
    if (!a || !b || a.id === b.id || (a.parent || '') !== (b.parent || '')) return;
    const block = [a, ...descend(a.id).map(byId).filter((x): x is Category => !!x)];
    const rest = items.filter((x) => x.id !== a.id && descend(a.id).indexOf(x.id) < 0);
    const at = rest.findIndex((x) => x.id === b.id);
    const next = rest.slice();
    next.splice(at, 0, ...block);
    setItems(next);
    setDragId(null);
    setToast('카테고리 순서가 변경되었습니다.');
  }

  const emptySearch = flat.length === 0 && query !== '';
  const emptyAll = items.length === 0;

  return (
    <div className={sh.page} onClick={() => { if (menuId) setMenuId(null); }}>
      {dialog && (
        <div className={sh.dialogOverlay}>
          <div className={sh.dialogBox}>
            <div className={sh.dialogTitle}>{dialog.title}</div>
            <div className={sh.dialogBody}>{dialog.body}</div>
            <div className={sh.dialogActions}>
              {dialog.buttons.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  className={sh.dialogBtn}
                  style={{
                    border: b.kind === 'ghost' ? '1px solid rgba(0,0,0,.12)' : 'none',
                    background: b.kind === 'solid' ? ACCENT : b.kind === 'danger' ? 'oklch(0.58 0.19 25)' : '#fff',
                    color: b.kind === 'ghost' ? '#52525b' : '#fff',
                  }}
                  onClick={() => dlgRun(b)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className={sh.toast}>{toast}</div>}

      <header className={sh.header}>
        <div>
          <div className={sh.headerTitle}>카테고리 관리</div>
          <div className={sh.headerSub}>콘텐츠 분류에 사용되는 카테고리를 등록하고 관리합니다.</div>
        </div>
        <div className={sh.headerSpacer} />
        <button
          type="button"
          className={sh.primaryBtn}
          onClick={() => { setMode('new'); setDraft({ name: '', code: '', parent: '', use: true, desc: '' }); setMenuId(null); setErr(''); }}
        >
          ＋ 카테고리 등록
        </button>
      </header>

      <div className={styles.body}>
        <div className={styles.tree}>
          <div className={styles.treeSearch}>
            <div className={styles.treeSearchBox}>
              <span style={{ color: '#a1a1aa', fontSize: 12.5 }}>⌕</span>
              <input className={styles.treeSearchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="카테고리명 · 코드 검색" />
            </div>
          </div>

          <div className={styles.treeList}>
            {flat.map(({ it, depth }) => {
              const hasKids = kids(it.id).length > 0;
              const open = openIds.indexOf(it.id) >= 0 || !!query;
              return (
                <div key={it.id}>
                  <div
                    draggable
                    onDragStart={() => { setDragId(it.id); setMenuId(null); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, it.id); }}
                    onClick={() => select(it.id)}
                    className={styles.treeRow}
                    style={{ paddingLeft: 8 + (depth - 1) * 18, background: selId === it.id ? '#eef2ff' : 'transparent' }}
                  >
                    <span className={styles.dragHandle}>≡</span>
                    <button
                      type="button"
                      className={styles.caretBtn}
                      onClick={(e) => { e.stopPropagation(); setOpenIds((prev) => (open ? prev.filter((x) => x !== it.id) : prev.concat([it.id]))); }}
                    >
                      {hasKids ? (open ? '▾' : '▸') : ''}
                    </button>
                    <span className={styles.treeName} style={{ fontWeight: selId === it.id ? 700 : 500, color: it.use ? (selId === it.id ? '#18181b' : '#3f3f46') : '#a1a1aa' }}>
                      {it.name}
                    </span>
                    <span className={styles.treeUnused}>{it.use ? '' : '미사용'}</span>
                    <span className={styles.treeCount} style={{ color: rollCount(it.id) ? '#71717a' : '#c4c4c8' }}>{rollCount(it.id).toLocaleString('ko-KR')}건</span>
                    <button type="button" className={styles.treeMoreBtn} onClick={(e) => { e.stopPropagation(); setMenuId(menuId === it.id ? null : it.id); }}>⋯</button>
                    {menuId === it.id && (
                      <div className={sh.moreMenu} style={{ top: 32, right: 4 }}>
                        <button
                          type="button"
                          className={sh.moreMenuItem}
                          style={{ color: depth >= MAX_DEPTH ? '#c4c4c8' : '#3f3f46' }}
                          onClick={(e) => { e.stopPropagation(); if (depth >= MAX_DEPTH) return; setMode('new'); setDraft({ name: '', code: '', parent: it.id, use: true, desc: '' }); setMenuId(null); setOpenIds((prev) => prev.concat([it.id])); setErr(''); }}
                        >
                          하위 카테고리 추가
                        </button>
                        <button type="button" className={sh.moreMenuItem} style={{ color: '#3f3f46' }} onClick={(e) => { e.stopPropagation(); select(it.id); }}>수정</button>
                        <div className={sh.moreMenuSep} />
                        <button type="button" className={sh.moreMenuItem} style={{ color: '#3f3f46' }} onClick={(e) => { e.stopPropagation(); askUse(it, !it.use); }}>{it.use ? '사용 중지' : '사용하기'}</button>
                        <button type="button" className={sh.moreMenuItem} style={{ color: '#b91c1c' }} onClick={(e) => { e.stopPropagation(); askDelete(it); }}>삭제</button>
                      </div>
                    )}
                  </div>
                  {query && <div className={styles.pathHint} style={{ paddingLeft: 8 + (depth - 1) * 18 }}>{pathOf(it.id)}</div>}
                </div>
              );
            })}

            {emptySearch && (
              <div className={sh.emptyBlock}>
                <div className={sh.emptyTitle}>검색 결과가 없습니다.</div>
                <div className={sh.emptySub}>다른 검색어를 입력해 주세요.</div>
                <button type="button" className={sh.emptyActionBtn} onClick={() => setQ('')}>검색 초기화</button>
              </div>
            )}
            {emptyAll && (
              <div className={sh.emptyBlock}>
                <div className={sh.emptyTitle}>등록된 카테고리가 없습니다.</div>
                <div className={sh.emptySub}>콘텐츠 분류를 위한 첫 카테고리를 등록해 주세요.</div>
                <button type="button" className={sh.emptyActionBtnSolid} onClick={() => { setMode('new'); setDraft({ name: '', code: '', parent: '', use: true, desc: '' }); }}>＋ 카테고리 등록</button>
              </div>
            )}
          </div>

          <div className={styles.treeFooter}>≡ 를 끌어 같은 단계 안에서 순서를 변경합니다</div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.panelHeadTitle}>{isNew ? '새 카테고리 등록' : '카테고리 정보'}</div>
            <div className={styles.panelHeadSub}>{isNew ? '카테고리명과 코드를 입력하고 상위 카테고리를 지정합니다.' : (cur ? pathOf(cur.id) : '')}</div>
          </div>

          {effectiveDraft && (
            <>
              <div className={styles.panelBody}>
                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>카테고리명 <span className={sh.required}>*</span></span>
                  <input className={sh.formInput} value={effectiveDraft.name} onChange={(e) => setD({ name: e.target.value })} placeholder="카테고리명을 입력하세요" />
                </div>

                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>카테고리 코드 <span className={sh.required}>*</span></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className={`${sh.formInput} ${sh.mono}`} value={effectiveDraft.code} onChange={(e) => setD({ code: e.target.value })} readOnly={!isNew && !!cur?.locked} placeholder="CATEGORY_001" style={{ flex: 1 }} />
                    {!isNew && cur?.locked && <span style={{ fontSize: 12, color: '#a1a1aa' }}>🔒</span>}
                  </div>
                  <div className={styles.panelCodeHint}>{!isNew && cur?.locked ? '이미 사용 중인 코드는 변경할 수 없습니다' : '영문 대문자와 _ 조합을 권장합니다'}</div>
                </div>

                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>상위 카테고리</span>
                  <select className={sh.formSelect} value={effectiveDraft.parent} onChange={(e) => setD({ parent: e.target.value })}>
                    {parentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <div className={styles.panelDepthHint}>{`최대 ${MAX_DEPTH} Depth까지 등록할 수 있습니다`} · 자신과 하위 카테고리는 선택할 수 없습니다</div>
                </div>

                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>사용 여부 <span className={sh.required}>*</span></span>
                  <div className={sh.useToggleRow}>
                    <button
                      type="button"
                      className={sh.useToggleBtn}
                      style={{ border: `1px solid ${effectiveDraft.use ? ACCENT : 'rgba(0,0,0,.12)'}`, background: effectiveDraft.use ? ACCENT : '#fff', color: effectiveDraft.use ? '#fff' : '#52525b' }}
                      onClick={() => setD({ use: true })}
                    >
                      사용
                    </button>
                    <button
                      type="button"
                      className={sh.useToggleBtn}
                      style={{ border: `1px solid ${!effectiveDraft.use ? '#18181b' : 'rgba(0,0,0,.12)'}`, background: !effectiveDraft.use ? '#18181b' : '#fff', color: !effectiveDraft.use ? '#fff' : '#52525b' }}
                      onClick={() => { if (isNew) setD({ use: false }); else if (cur) askUse(cur, false); }}
                    >
                      미사용
                    </button>
                  </div>
                </div>

                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>설명</span>
                  <textarea className={sh.formTextarea} style={{ height: 70 }} value={effectiveDraft.desc} onChange={(e) => setD({ desc: e.target.value })} placeholder="관리자용 메모입니다. 운영 정책이나 사용 기준을 기록해 두세요." />
                </div>

                {err && <div className={sh.errBox}>{err}</div>}

                {!isNew && cur && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className={sh.linkedCard}>
                      <div className={sh.linkedCardLabel}>
                        연결 콘텐츠
                        <div className={sh.linkedCardSub}>{kids(cur.id).length ? '하위 카테고리 포함' : '이 카테고리에 직접 연결된 콘텐츠'}</div>
                      </div>
                      <span className={sh.linkedCardValue}>{rollCount(cur.id).toLocaleString('ko-KR')}건</span>
                      <button type="button" className={sh.selBtn} onClick={() => goContents(cur.name)}>콘텐츠 목록 보기</button>
                    </div>
                    <div className={sh.metaRow}>
                      {[['등록일', cur.created], ['수정일', cur.updated], ['Depth', `${depthOf(cur.id)} Depth`], ['하위 카테고리', `${kids(cur.id).length}개`]].map(([label, value]) => (
                        <div key={label} className={sh.metaCell}>
                          <div className={sh.metaCellLabel}>{label}</div>
                          <div className={sh.metaCellValue}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.panelFooter}>
                {!isNew && <button type="button" className={sh.dangerBtn} onClick={() => cur && askDelete(cur)}>삭제</button>}
                <div className={sh.modalActionsSpacer} />
                <button type="button" className={sh.ghostBtn} onClick={() => { setMode('edit'); setDraft(null); setErr(''); }}>취소</button>
                <button
                  type="button"
                  className={sh.solidBtn}
                  style={{ background: isNew || dirty ? ACCENT : '#e4e4e7', color: isNew || dirty ? '#fff' : '#a1a1aa' }}
                  onClick={() => { if (isNew || dirty) doSave(); }}
                >
                  {isNew ? '등록' : '변경사항 저장'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
