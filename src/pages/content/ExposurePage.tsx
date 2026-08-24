import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sh from './contentShared.module.css';
import styles from './ExposurePage.module.css';
import { AREAS, EXPOSURE_DATA, type ExposureArea, type ExposureEntry } from './exposureData';
import { CONTENT_ITEMS } from '../../data/content';
import { ACCENT } from '../../lib/theme';

interface RowDraft {
  on: boolean;
  pinned: boolean;
  start: string;
  end: string;
  noEnd: boolean;
}

interface AddModalState {
  q: string;
  status: string;
  cat: string;
  checked: string[];
}

interface NavDialogButton {
  label: string;
  kind: 'ghost' | 'solid';
  act: 'close' | 'gonosave' | 'gosave';
}

function statusOf(entry: ExposureEntry, base: string) {
  if (!entry.on) return { label: '미노출', bg: '#f4f4f5', fg: '#71717a' };
  const baseT = `${base}T12:00`;
  if (entry.start && baseT < entry.start) return { label: '예약', bg: '#eef2ff', fg: '#4338ca' };
  if (entry.end && baseT >= entry.end) return { label: '종료', bg: '#f4f4f5', fg: '#a1a1aa' };
  return { label: '노출중', bg: '#ecfdf5', fg: '#059669' };
}

export function ExposurePage() {
  const navigate = useNavigate();
  const [areas] = useState<ExposureArea[]>(AREAS);
  const [data, setData] = useState<Record<string, ExposureEntry[]>>(EXPOSURE_DATA);
  const [area, setArea] = useState('ar011');
  const [openAreas, setOpenAreas] = useState<string[]>(['ar01', 'ar02']);
  const [aq, setAq] = useState('');
  const [selRowId, setSelRowId] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<RowDraft | null>(null);
  const [addModal, setAddModal] = useState<AddModalState | null>(null);
  const [navDialog, setNavDialog] = useState<{ toId: string; buttons: NavDialogButton[] } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [changes, setChanges] = useState(0);
  const [base, setBase] = useState('2026-08-13');
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const byIdArea = (id: string) => areas.find((a) => a.id === id);
  const kidsA = (id: string) => areas.filter((a) => a.parent === id);
  const findContent = (ctid: string) => CONTENT_ITEMS.find((c) => c.id === ctid);

  const cur = byIdArea(area);
  const curList = data[area] ?? [];

  function setEntries(areaId: string, list: ExposureEntry[]) {
    setData((prev) => ({ ...prev, [areaId]: list }));
    setChanges((c) => c + 1);
  }

  const query = aq.trim().toLowerCase();
  const areaFlat: { a: ExposureArea; depth: number }[] = [];
  const walkA = (parent: string | null, depth: number) => {
    areas.filter((a) => a.parent === parent).forEach((a) => {
      if (query && !a.name.toLowerCase().includes(query)) { walkA(a.id, depth + 1); return; }
      areaFlat.push({ a, depth });
      if (openAreas.indexOf(a.id) >= 0 || query) walkA(a.id, depth + 1);
    });
  };
  walkA(null, 1);

  function goSelectArea(id: string) {
    if (changes > 0) {
      setNavDialog({
        toId: id,
        buttons: [
          { label: '계속 편집', kind: 'ghost', act: 'close' },
          { label: '저장하지 않고 이동', kind: 'ghost', act: 'gonosave' },
          { label: '저장 후 이동', kind: 'solid', act: 'gosave' },
        ],
      });
    } else {
      setArea(id); setSelRowId(null); setRowDraft(null); setMenuId(null);
    }
  }

  function runNavDialog(b: NavDialogButton) {
    if (!navDialog) return;
    if (b.act === 'close') { setNavDialog(null); return; }
    if (b.act === 'gonosave') { setChanges(0); setArea(navDialog.toId); setSelRowId(null); setRowDraft(null); setNavDialog(null); }
    if (b.act === 'gosave') { setChanges(0); setArea(navDialog.toId); setSelRowId(null); setRowDraft(null); setNavDialog(null); setToast('노출 설정이 저장되었습니다.'); }
  }

  function openRow(entry: ExposureEntry) {
    setSelRowId(entry.id);
    setRowDraft({ on: entry.on, pinned: entry.pinned, start: entry.start, end: entry.end, noEnd: !entry.end });
    setMenuId(null);
  }

  function applyRow() {
    if (!selRowId || !rowDraft) return;
    setEntries(area, curList.map((it) => (it.id === selRowId ? { ...it, on: rowDraft.on, pinned: rowDraft.pinned, start: rowDraft.start, end: rowDraft.noEnd ? '' : rowDraft.end, updated: `2026.08.13 ${new Date().toTimeString().slice(0, 5)}` } : it)));
    setToast('노출 설정이 적용되었습니다.');
  }

  function removeRow(id: string) {
    setEntries(area, curList.filter((it) => it.id !== id));
    if (selRowId === id) { setSelRowId(null); setRowDraft(null); }
    setToast('영역에서 제거되었습니다.');
  }

  function moveRow(id: string, dir: 'top' | 'bottom') {
    const list = curList.slice();
    const i = list.findIndex((it) => it.id === id);
    if (dir === 'top' && i > 0) { const [x] = list.splice(i, 1); list.unshift(x); }
    if (dir === 'bottom' && i >= 0 && i < list.length - 1) { const [x] = list.splice(i, 1); list.push(x); }
    setEntries(area, list);
  }

  function dragMove(fromId: string, toId: string) {
    const list = curList.slice();
    const fi = list.findIndex((it) => it.id === fromId);
    const ti = list.findIndex((it) => it.id === toId);
    if (fi < 0 || ti < 0 || fi === ti) return;
    const [x] = list.splice(fi, 1);
    list.splice(ti, 0, x);
    setEntries(area, list);
  }

  const addCandidates = useMemo(() => {
    if (!addModal) return [];
    const aq2 = addModal.q.trim().toLowerCase();
    return CONTENT_ITEMS.filter((c) => c.status !== '삭제'
      && (c.title + c.id).toLowerCase().includes(aq2)
      && (addModal.status === '전체' || c.status === addModal.status)
      && (addModal.cat === '전체' || c.cat === addModal.cat));
  }, [addModal]);

  function confirmAdd() {
    if (!addModal) return;
    const now = `2026.08.13 ${new Date().toTimeString().slice(0, 5)}`;
    const list = curList.concat(addModal.checked.map((ctid, i) => ({ id: `e${Date.now()}${i}`, ctid, on: true, pinned: false, start: `${base}T00:00`, end: '', author: 'admin(현재 관리자)', updated: now })));
    setEntries(area, list);
    const count = addModal.checked.length;
    setAddModal(null);
    setToast(`${count}개 콘텐츠가 추가되었습니다.`);
  }

  function goContentDetail(ctid: string) {
    navigate(`/content?id=${encodeURIComponent(ctid)}`);
  }

  const categories = Array.from(new Set(CONTENT_ITEMS.map((c) => c.cat)));

  const selEntry = selRowId ? curList.find((x) => x.id === selRowId) : null;
  const previewRows = curList
    .map((it, i) => {
      const cd = findContent(it.ctid);
      const st = statusOf(it, base);
      return { order: i + 1, title: cd ? cd.title : it.ctid, ...st, pinned: it.pinned };
    })
    .filter((r) => r.label !== '미노출' && r.label !== '종료');

  const atMax = cur ? curList.length >= cur.max : false;

  return (
    <div className={sh.page} onClick={() => { if (menuId) setMenuId(null); }}>
      {navDialog && (
        <div className={sh.dialogOverlay}>
          <div className={sh.dialogBox}>
            <div className={sh.dialogTitle}>저장하지 않은 변경사항이 있습니다.</div>
            <div className={sh.dialogBody}>변경사항을 저장하지 않고 이동하시겠습니까?</div>
            <div className={sh.dialogActions}>
              {navDialog.buttons.map((b) => (
                <button key={b.label} type="button" className={sh.dialogBtn} style={{ border: b.kind === 'ghost' ? '1px solid rgba(0,0,0,.12)' : 'none', background: b.kind === 'solid' ? ACCENT : '#fff', color: b.kind === 'ghost' ? '#52525b' : '#fff' }} onClick={() => runNavDialog(b)}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {addModal && (
        <div className={sh.modalOverlay}>
          <div className={styles.addModalBox}>
            <div className={styles.addModalHead}>
              <div className={sh.modalTitle}>콘텐츠 추가</div>
              <input className={sh.formInput} style={{ marginTop: 12 }} value={addModal.q} onChange={(e) => setAddModal({ ...addModal, q: e.target.value })} placeholder="콘텐츠 ID/제목 검색" />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <select className={sh.smallSelect} value={addModal.status} onChange={(e) => setAddModal({ ...addModal, status: e.target.value })}>
                  {['전체', '공개', '비공개', '예약', '임시저장'].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className={sh.smallSelect} value={addModal.cat} onChange={(e) => setAddModal({ ...addModal, cat: e.target.value })}>
                  {['전체', ...categories].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.addModalList}>
              {addCandidates.map((c) => {
                const already = curList.some((it) => it.ctid === c.id);
                const checked = addModal.checked.indexOf(c.id) >= 0 || already;
                return (
                  <label key={c.id} className={styles.addModalItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={already}
                      onChange={() => setAddModal({ ...addModal, checked: addModal.checked.indexOf(c.id) >= 0 ? addModal.checked.filter((x) => x !== c.id) : addModal.checked.concat([c.id]) })}
                    />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: already ? '#c4c4c8' : '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                    <span style={{ fontSize: 11, color: '#a1a1aa' }}>{c.id}</span>
                    {already && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#a1a1aa', flex: 'none' }}>추가됨</span>}
                  </label>
                );
              })}
            </div>
            <div className={styles.addModalFooter}>
              <span style={{ fontSize: 12, color: '#52525b' }}>{addModal.checked.length}개 선택</span>
              <div className={sh.modalActionsSpacer} />
              <button type="button" className={sh.ghostBtn} onClick={() => setAddModal(null)}>취소</button>
              <button type="button" className={sh.solidBtn} disabled={addModal.checked.length === 0} onClick={confirmAdd}>추가</button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className={sh.modalOverlay} style={{ zIndex: 72 }}>
          <div className={styles.previewModalBox}>
            <div className={styles.previewModalHead}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{`미리보기 · ${cur ? cur.name : ''}`}</div>
                <div style={{ fontSize: 11, color: '#8b8b93', marginTop: 2 }}>실제 노출 화면에 표시될 순서입니다</div>
              </div>
              <button type="button" style={{ width: 26, height: 26, border: 0, background: 'transparent', color: '#a1a1aa', fontSize: 15, cursor: 'pointer' }} onClick={() => setPreviewOpen(false)}>×</button>
            </div>
            <div className={styles.previewModalList}>
              {previewRows.map((r) => (
                <div key={r.order} className={styles.previewModalRow}>
                  <span style={{ fontSize: 11.5, color: '#a1a1aa', width: 16, flex: 'none' }}>{r.order}</span>
                  {r.pinned && <span style={{ flex: 'none' }}>📌</span>}
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                  <span style={{ background: r.bg, color: r.fg, padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, flex: 'none' }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div className={sh.toast}>{toast}</div>}

      <header className={sh.header} style={{ gap: 14 }}>
        <div>
          <div className={sh.headerTitle}>노출 관리</div>
          <div className={sh.headerSub}>서비스 내 콘텐츠 노출 위치와 순서를 관리합니다.</div>
        </div>
        <div className={sh.headerSpacer} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className={styles.headerDateLabel}>노출 기준일</span>
          <input type="date" className={styles.headerDateInput} value={base} onChange={(e) => setBase(e.target.value)} />
        </div>
        <button type="button" className={sh.secondaryBtn} onClick={() => setPreviewOpen(true)}>미리보기</button>
        <button
          type="button"
          className={sh.primaryBtn}
          disabled={changes === 0}
          style={{ background: changes > 0 ? ACCENT : '#e4e4e7', color: changes > 0 ? '#fff' : '#a1a1aa' }}
          onClick={() => { if (changes > 0) { setChanges(0); setToast('노출 설정이 저장되었습니다.'); } }}
        >
          {changes > 0 ? `변경사항 저장 (${changes}건)` : '변경사항 저장'}
        </button>
      </header>

      <div className={styles.body}>
        <div className={styles.areaCol}>
          <div className={styles.areaColHead}>
            <div className={styles.areaColTitle}>노출 영역</div>
            <input className={styles.areaSearch} value={aq} onChange={(e) => setAq(e.target.value)} placeholder="영역 검색" />
          </div>
          <div className={styles.areaList}>
            {areaFlat.map(({ a, depth }) => {
              const list = data[a.id] ?? [];
              const hasKids = kidsA(a.id).length > 0;
              const open = openAreas.indexOf(a.id) >= 0 || !!query;
              return (
                <div key={a.id} className={styles.areaRow} style={{ paddingLeft: 8 + (depth - 1) * 16, background: area === a.id ? '#eef2ff' : 'transparent' }} onClick={() => goSelectArea(a.id)}>
                  <button type="button" className={styles.areaCaret} onClick={(e) => { e.stopPropagation(); setOpenAreas((prev) => (open ? prev.filter((x) => x !== a.id) : prev.concat([a.id]))); }}>
                    {hasKids ? (open ? '▾' : '▸') : ''}
                  </button>
                  <span className={styles.areaName} style={{ fontWeight: area === a.id ? 700 : 500, color: a.use ? (area === a.id ? '#18181b' : '#3f3f46') : '#a1a1aa' }}>{a.name}</span>
                  <span className={styles.areaUnused}>{a.use ? '' : '미사용'}</span>
                  <span className={styles.areaCount}>{`${list.length}/${a.max}`}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.listCol}>
          <div className={styles.listColHead}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={styles.listColTitle}>{cur ? cur.name : ''}</div>
              <div className={styles.listColSub}>{cur ? `현재 노출 ${curList.length}개 · 최대 ${cur.max}개` : ''}</div>
            </div>
            <button type="button" className={sh.selBtn} disabled={atMax} style={atMax ? { background: '#f4f4f5', color: '#c4c4c8' } : undefined} onClick={() => setAddModal({ q: '', status: '전체', cat: '전체', checked: [] })}>＋ 콘텐츠 추가</button>
          </div>

          <div className={styles.listBody}>
            {curList.map((it, i) => {
              const cd = findContent(it.ctid);
              const st = statusOf(it, base);
              const unavailable = !cd || cd.status === '삭제';
              const moreItems: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
                { label: '상세 보기', click: () => goContentDetail(it.ctid) },
                { sep: true },
                { label: '노출 설정', click: () => openRow(it) },
                { label: '순서 맨 위로', click: () => moveRow(it.id, 'top') },
                { label: '순서 맨 아래로', click: () => moveRow(it.id, 'bottom') },
                { sep: true },
                { label: '이 영역에서 제거', fg: '#b91c1c', click: () => removeRow(it.id) },
              ];
              return (
                <div
                  key={it.id}
                  draggable
                  onDragStart={() => { setDragId(it.id); setMenuId(null); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragId) dragMove(dragId, it.id); }}
                  onClick={() => openRow(it)}
                  className={styles.itemRow}
                  style={{ background: selRowId === it.id ? '#f8fafc' : 'transparent' }}
                >
                  <span className={styles.itemDrag}>≡</span>
                  <span className={styles.itemOrder}>{i + 1}</span>
                  {it.pinned && <span style={{ flex: 'none' }}>📌</span>}
                  <div className={styles.itemBody}>
                    <div className={styles.itemTitle} style={{ color: unavailable ? '#b91c1c' : '#18181b' }}>{cd ? cd.title : '(콘텐츠를 찾을 수 없음)'}</div>
                    {unavailable && <div className={styles.itemWarn}>⚠ 현재 사용할 수 없는 콘텐츠입니다</div>}
                  </div>
                  <span className={styles.itemStatus} style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                  <div style={{ position: 'relative', flex: 'none' }}>
                    <button type="button" className={sh.moreBtn} onClick={(e) => { e.stopPropagation(); setMenuId(menuId === it.id ? null : it.id); }}>⋯</button>
                    {menuId === it.id && (
                      <div className={sh.moreMenu} style={{ top: 30, right: 0, width: 150 }}>
                        {moreItems.map((m, idx) => (m.sep ? (
                          <div key={idx} className={sh.moreMenuSep} />
                        ) : (
                          <button key={idx} type="button" className={sh.moreMenuItem} style={{ color: m.fg ?? '#3f3f46' }} onClick={(e) => { e.stopPropagation(); setMenuId(null); m.click?.(); }}>{m.label}</button>
                        )))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {curList.length === 0 && (
              <div className={sh.emptyBlock}>
                <div className={sh.emptyTitle}>이 영역에 등록된 콘텐츠가 없습니다.</div>
                <div className={sh.emptySub}>노출할 콘텐츠를 추가해 주세요.</div>
                <button type="button" className={sh.emptyActionBtnSolid} onClick={() => setAddModal({ q: '', status: '전체', cat: '전체', checked: [] })}>＋ 콘텐츠 추가</button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.settingsCol}>
          <div className={styles.settingsHead}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>노출 설정</div>
          </div>
          {selEntry && rowDraft ? (
            <>
              <div className={styles.settingsBody}>
                <div>
                  <div style={{ fontSize: 11, color: '#8b8b93', fontWeight: 600 }}>콘텐츠</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#18181b', marginTop: 4 }}>{findContent(selEntry.ctid)?.title ?? selEntry.ctid}</div>
                  <button type="button" style={{ border: 0, background: 'transparent', padding: 0, marginTop: 4, fontSize: 11.5, color: ACCENT, cursor: 'pointer' }} onClick={() => goContentDetail(selEntry.ctid)}>콘텐츠 상세 보기 →</button>
                </div>

                <div>
                  <div className={sh.formFieldLabel} style={{ marginBottom: 6 }}>노출 여부</div>
                  <button type="button" className={styles.toggleTrack} style={{ background: rowDraft.on ? ACCENT : '#e4e4e7' }} onClick={() => setRowDraft({ ...rowDraft, on: !rowDraft.on })}>
                    <span className={styles.toggleThumb} style={{ left: rowDraft.on ? 25 : 3 }} />
                  </button>
                </div>

                <div>
                  <div className={sh.formFieldLabel} style={{ marginBottom: 6 }}>노출 시작</div>
                  <input type="datetime-local" className={sh.formInput} value={rowDraft.start} onChange={(e) => setRowDraft({ ...rowDraft, start: e.target.value })} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className={sh.formFieldLabel}>노출 종료</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#71717a', cursor: 'pointer' }}>
                      <input type="checkbox" checked={rowDraft.noEnd} onChange={() => setRowDraft({ ...rowDraft, noEnd: !rowDraft.noEnd })} />종료일 없음
                    </label>
                  </div>
                  {rowDraft.noEnd ? <div className={styles.noEndBox}>계속 노출</div> : <input type="datetime-local" className={sh.formInput} value={rowDraft.end} onChange={(e) => setRowDraft({ ...rowDraft, end: e.target.value })} />}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={rowDraft.pinned} onChange={() => setRowDraft({ ...rowDraft, pinned: !rowDraft.pinned })} />
                  <span style={{ fontSize: 12.5, color: '#3f3f46', fontWeight: 600 }}>상단 고정</span>
                </label>

                <div className={sh.metaRow}>
                  <div className={sh.metaCell}>
                    <div className={sh.metaCellLabel}>현재 순서</div>
                    <div className={sh.metaCellValue}>{curList.findIndex((x) => x.id === selEntry.id) + 1}</div>
                  </div>
                  <div className={sh.metaCell}>
                    <div className={sh.metaCellLabel}>등록 관리자</div>
                    <div className={sh.metaCellValue}>{selEntry.author}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>{`최근 수정 ${selEntry.updated}`}</div>
              </div>
              <div className={styles.settingsFooter}>
                <button type="button" className={sh.dangerBtn} onClick={() => removeRow(selEntry.id)}>영역에서 제거</button>
                <div className={sh.modalActionsSpacer} />
                <button type="button" className={sh.solidBtn} onClick={applyRow}>적용</button>
              </div>
            </>
          ) : (
            <div className={styles.settingsEmpty}>
              <div className={styles.settingsEmptyText}>콘텐츠를 선택하면<br />노출 설정을 확인할 수 있습니다.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
