import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sh from '../content/contentShared.module.css';
import styles from './RolesPage.module.css';
import { ACCENT } from '../../lib/theme';
import { ADMINS } from './adminData';
import {
  MENU_TREE,
  PERM_KEYS,
  PERM_LABELS,
  ROLES_LIST,
  TODAY,
  assignedCount,
  emptyPerm,
  fullPerm,
  nextRoleId,
  type MenuPermission,
  type PermKey,
  type Role,
  type RoleHistoryEntry,
} from './roleData';

interface Draft {
  name: string;
  code: string;
  description: string;
  active: boolean;
  permissions: Record<string, MenuPermission>;
}

interface DialogButton {
  label: string;
  kind: 'ghost' | 'solid' | 'danger';
  act: 'close' | 'del' | 'deactivate' | 'saveConfirm' | 'goAdmins';
}
interface DialogState {
  title: string;
  body: string;
  buttons: DialogButton[];
}

function cloneRole(r: Role): Draft {
  return { name: r.name, code: r.code, description: r.description, active: r.active, permissions: JSON.parse(JSON.stringify(r.permissions)) };
}

function history(action: string): RoleHistoryEntry {
  return { id: `RH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 15:00`, by: 'admin001', action };
}

export function AdminRolesPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>(ROLES_LIST);
  const [selId, setSelId] = useState(ROLES_LIST[0].id);
  const [q, setQ] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toast, setToast] = useState('');
  const [err, setErr] = useState('');
  const [createModal, setCreateModal] = useState<{ name: string; code: string; mode: 'new' | 'copy'; copyFrom: string } | null>(null);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const cur = roles.find((r) => r.id === selId) ?? null;
  const effectiveDraft: Draft | null = draft ?? (cur ? cloneRole(cur) : null);
  const dirty = !!(cur && effectiveDraft && JSON.stringify(effectiveDraft) !== JSON.stringify(cloneRole(cur)));

  const filteredRoles = useMemo(() => {
    const query = q.trim().toLowerCase();
    return query ? roles.filter((r) => r.name.toLowerCase().includes(query) || r.code.toLowerCase().includes(query)) : roles;
  }, [roles, q]);

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
          { label: '저장하지 않고 이동', kind: 'solid', act: 'close' },
        ],
      });
      // resolve the "이동" branch directly since dialog buttons here are generic close/act;
      // simplest UX: apply navigation immediately on the second button via onClick override below
      setPendingNav(id);
      return;
    }
    setSelId(id);
    setDraft(null);
    setMenuId(null);
    setErr('');
  }

  function groupState(groupId: string, perms: Record<string, MenuPermission>): 'all' | 'none' | 'partial' {
    const group = MENU_TREE.find((g) => g.id === groupId);
    if (!group) return 'none';
    const states = group.children.map((c) => perms[c.id]?.access);
    if (states.every(Boolean)) return 'all';
    if (states.every((s) => !s)) return 'none';
    return 'partial';
  }

  function toggleGroup(groupId: string) {
    if (!effectiveDraft || cur?.isSystem) return;
    const group = MENU_TREE.find((g) => g.id === groupId);
    if (!group) return;
    const turnOn = groupState(groupId, effectiveDraft.permissions) !== 'all';
    const next = { ...effectiveDraft.permissions };
    group.children.forEach((c) => {
      next[c.id] = turnOn ? { ...next[c.id], access: true } : emptyPerm();
    });
    setD({ permissions: next });
  }

  function groupSelectAll(groupId: string) {
    if (!effectiveDraft || cur?.isSystem) return;
    const group = MENU_TREE.find((g) => g.id === groupId);
    if (!group) return;
    const next = { ...effectiveDraft.permissions };
    group.children.forEach((c) => { next[c.id] = fullPerm(); });
    setD({ permissions: next });
  }

  function toggleLeafAccess(leafId: string) {
    if (!effectiveDraft || cur?.isSystem) return;
    const p = effectiveDraft.permissions[leafId];
    const next = { ...effectiveDraft.permissions };
    next[leafId] = p.access ? emptyPerm() : { ...p, access: true };
    setD({ permissions: next });
  }

  function togglePerm(leafId: string, key: PermKey) {
    if (!effectiveDraft || cur?.isSystem) return;
    const p = effectiveDraft.permissions[leafId];
    if (!p.access) return;
    const next = { ...effectiveDraft.permissions };
    const val = !p[key];
    const updated: MenuPermission = { ...p, [key]: val };
    if ((key === 'edit' || key === 'delete') && val) updated.view = true;
    if (key === 'view' && !val) { updated.edit = false; updated.delete = false; }
    next[leafId] = updated;
    setD({ permissions: next });
  }

  function selectAllGlobal(on: boolean) {
    if (!effectiveDraft || cur?.isSystem) return;
    const next: Record<string, MenuPermission> = {};
    Object.keys(effectiveDraft.permissions).forEach((id) => { next[id] = on ? fullPerm() : emptyPerm(); });
    setD({ permissions: next });
  }

  function doSave() {
    if (!effectiveDraft || !cur) return;
    if (!effectiveDraft.name.trim()) { setErr('역할명을 입력해 주세요.'); return; }
    const dup = roles.some((r) => r.id !== cur.id && r.name.trim() === effectiveDraft.name.trim());
    if (dup) { setErr('이미 사용 중인 역할명입니다.'); return; }
    const count = assignedCount(cur.id, ADMINS);
    setDialog({
      title: '역할 권한을 변경하시겠습니까?',
      body: `변경된 권한은 해당 역할을 사용하는\n${count}명의 관리자에게 적용됩니다.`,
      buttons: [
        { label: '취소', kind: 'ghost', act: 'close' },
        { label: '변경', kind: 'solid', act: 'saveConfirm' },
      ],
    });
  }

  function applySave() {
    if (!effectiveDraft || !cur) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === cur.id
          ? { ...r, name: effectiveDraft.name.trim(), description: effectiveDraft.description, active: effectiveDraft.active, permissions: effectiveDraft.permissions, history: [...r.history, history('권한 및 정보 수정')] }
          : r,
      ),
    );
    setDraft(null);
    setDialog(null);
    toastBriefly('변경사항이 저장되었습니다.');
  }

  function askDeactivate(r: Role) {
    const count = assignedCount(r.id, ADMINS);
    if (r.active) {
      setDialog({
        title: '역할을 미사용 처리하시겠습니까?',
        body: count > 0
          ? `현재 ${count}명의 관리자에게 이 역할이 배정되어 있습니다.\n역할을 미사용 처리하면 신규 배정은 제한되지만\n기존 관리자의 역할은 유지됩니다.`
          : '신규 관리자에게 더 이상 배정할 수 없게 됩니다.',
        buttons: [{ label: '취소', kind: 'ghost', act: 'close' }, { label: '미사용 처리', kind: 'solid', act: 'deactivate' }],
      });
    } else {
      setRoles((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: true, history: [...x.history, history('사용 처리')] } : x)));
      toastBriefly('역할을 사용 처리했습니다.');
    }
    setMenuId(null);
  }

  function askDelete(r: Role) {
    const count = assignedCount(r.id, ADMINS);
    if (count > 0) {
      setDialog({
        title: '역할을 삭제할 수 없습니다.',
        body: `현재 ${count}명의 관리자에게 해당 역할이 배정되어 있습니다.\n관리자의 역할을 먼저 변경해 주세요.`,
        buttons: [{ label: '닫기', kind: 'ghost', act: 'close' }, { label: '관리자 목록 보기', kind: 'solid', act: 'goAdmins' }],
      });
    } else {
      setDialog({
        title: '역할을 삭제하시겠습니까?',
        body: `삭제된 역할은 복구할 수 없습니다.\n역할: ${r.name}`,
        buttons: [{ label: '취소', kind: 'ghost', act: 'close' }, { label: '삭제', kind: 'danger', act: 'del' }],
      });
    }
    setMenuId(null);
  }

  function duplicate(r: Role) {
    const id = nextRoleId(roles, r.name);
    const copy: Role = {
      id,
      name: `${r.name} 복사본`,
      code: `${r.code}_COPY`,
      description: r.description,
      active: true,
      isSystem: false,
      permissions: JSON.parse(JSON.stringify(r.permissions)),
      history: [history('역할 복제')],
    };
    setRoles((prev) => [...prev, copy]);
    setSelId(id);
    setDraft(null);
    setMenuId(null);
    toastBriefly('역할을 복제했습니다.');
  }

  function dlgRun(b: DialogButton) {
    if (b.act === 'close') {
      if (pendingNav) {
        setSelId(pendingNav);
        setDraft(null);
        setPendingNav(null);
        setErr('');
      }
      setDialog(null);
      return;
    }
    if (b.act === 'saveConfirm') { applySave(); return; }
    if (b.act === 'deactivate' && cur) {
      setRoles((prev) => prev.map((x) => (x.id === cur.id ? { ...x, active: false, history: [...x.history, history('미사용 처리')] } : x)));
      setDialog(null);
      toastBriefly('역할을 미사용 처리했습니다.');
      return;
    }
    if (b.act === 'del' && cur) {
      setRoles((prev) => {
        const next = prev.filter((x) => x.id !== cur.id);
        if (next[0]) setSelId(next[0].id);
        return next;
      });
      setDraft(null);
      setDialog(null);
      toastBriefly('역할이 삭제되었습니다.');
      return;
    }
    if (b.act === 'goAdmins' && cur) {
      setDialog(null);
      navigate(`/admin?role=${cur.id}`);
    }
  }

  function openCreate() {
    setCreateModal({ name: '', code: '', mode: 'new', copyFrom: roles[0]?.id ?? '' });
  }

  function submitCreate() {
    if (!createModal) return;
    if (!createModal.name.trim()) { setErr('역할명을 입력해 주세요.'); return; }
    const dup = roles.some((r) => r.name.trim() === createModal.name.trim());
    if (dup) { setErr('이미 사용 중인 역할명입니다.'); return; }
    const id = nextRoleId(roles, createModal.name);
    const base = createModal.mode === 'copy' ? roles.find((r) => r.id === createModal.copyFrom) : null;
    const perms: Record<string, MenuPermission> = {};
    MENU_TREE.forEach((g) => g.children.forEach((c) => { perms[c.id] = base ? { ...base.permissions[c.id] } : emptyPerm(); }));
    const created: Role = {
      id,
      name: createModal.name.trim(),
      code: createModal.code.trim() || `ROLE_${id.toUpperCase()}`,
      description: '',
      active: true,
      isSystem: false,
      permissions: perms,
      history: [history(base ? `역할 생성 (${base.name} 권한 복사)` : '역할 생성')],
    };
    setRoles((prev) => [...prev, created]);
    setSelId(id);
    setDraft(null);
    setCreateModal(null);
    setErr('');
    toastBriefly('역할을 추가했습니다.');
  }

  const emptyAll = filteredRoles.length === 0;

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

      {createModal && (
        <div className={sh.modalOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) { setCreateModal(null); setErr(''); } }}>
          <div className={sh.modalBox}>
            <div className={sh.modalTitle}>역할 추가</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
              <div className={sh.formField}>
                <span className={sh.formFieldLabel}>역할명 <span className={sh.required}>*</span></span>
                <input className={sh.formInput} value={createModal.name} onChange={(e) => { setCreateModal({ ...createModal, name: e.target.value }); setErr(''); }} placeholder="역할명을 입력하세요" />
              </div>
              <div className={sh.formField}>
                <span className={sh.formFieldLabel}>역할 코드</span>
                <input className={`${sh.formInput} ${sh.mono}`} value={createModal.code} onChange={(e) => setCreateModal({ ...createModal, code: e.target.value })} placeholder="ROLE_CUSTOM (선택)" />
              </div>
              <div className={sh.formField}>
                <span className={sh.formFieldLabel}>권한 설정 방식</span>
                <div className={sh.useToggleRow}>
                  <button type="button" className={sh.useToggleBtn} style={{ border: `1px solid ${createModal.mode === 'new' ? ACCENT : 'rgba(0,0,0,.12)'}`, background: createModal.mode === 'new' ? ACCENT : '#fff', color: createModal.mode === 'new' ? '#fff' : '#52525b' }} onClick={() => setCreateModal({ ...createModal, mode: 'new' })}>새로 설정</button>
                  <button type="button" className={sh.useToggleBtn} style={{ border: `1px solid ${createModal.mode === 'copy' ? ACCENT : 'rgba(0,0,0,.12)'}`, background: createModal.mode === 'copy' ? ACCENT : '#fff', color: createModal.mode === 'copy' ? '#fff' : '#52525b' }} onClick={() => setCreateModal({ ...createModal, mode: 'copy' })}>기존 역할에서 복사</button>
                </div>
              </div>
              {createModal.mode === 'copy' && (
                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>기존 역할</span>
                  <select className={sh.formSelect} value={createModal.copyFrom} onChange={(e) => setCreateModal({ ...createModal, copyFrom: e.target.value })}>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}
              {err && <div className={sh.errBox}>{err}</div>}
            </div>
            <div className={sh.modalActions}>
              <div className={sh.modalActionsSpacer} />
              <button type="button" className={sh.ghostBtn} onClick={() => { setCreateModal(null); setErr(''); }}>취소</button>
              <button type="button" className={sh.solidBtn} onClick={submitCreate}>추가</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={sh.toast}>{toast}</div>}

      <header className={sh.header}>
        <div>
          <div className={sh.headerTitle}>역할 및 권한 관리</div>
          <div className={sh.headerSub}>관리자 역할을 생성하고 메뉴 및 기능별 접근 권한을 설정합니다.</div>
        </div>
        <div className={sh.headerSpacer} />
        <button type="button" className={sh.primaryBtn} onClick={openCreate}>＋ 역할 추가</button>
      </header>

      <div className={styles.body}>
        <div className={styles.list}>
          <div className={styles.listSearch}>
            <div className={styles.listSearchBox}>
              <span style={{ color: '#a1a1aa', fontSize: 12.5 }}>⌕</span>
              <input className={styles.listSearchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="역할 검색" />
            </div>
          </div>
          <div className={styles.listItems}>
            {filteredRoles.map((r) => {
              const count = assignedCount(r.id, ADMINS);
              return (
                <div key={r.id} className={`${styles.roleRow} ${selId === r.id ? styles.roleRowActive : ''}`} onClick={() => select(r.id)}>
                  <div className={styles.roleNameCol}>
                    <span className={styles.roleName} style={{ fontWeight: selId === r.id ? 700 : 500, color: r.active ? '#18181b' : '#a1a1aa' }}>{r.name}</span>
                    {r.isSystem && <span title="시스템 역할">🔒</span>}
                    {!r.active && <span className={styles.roleInactive}>미사용</span>}
                  </div>
                  <span className={styles.roleCount}>{count}명</span>
                  <button type="button" className={styles.roleMoreBtn} onClick={(e) => { e.stopPropagation(); setMenuId(menuId === r.id ? null : r.id); }}>⋯</button>
                  {menuId === r.id && (
                    <div className={sh.moreMenu} style={{ top: 38, right: 6 }}>
                      <button type="button" className={sh.moreMenuItem} onClick={(e) => { e.stopPropagation(); duplicate(r); }}>역할 복제</button>
                      {!r.isSystem && (
                        <>
                          <div className={sh.moreMenuSep} />
                          <button type="button" className={sh.moreMenuItem} onClick={(e) => { e.stopPropagation(); askDeactivate(r); }}>{r.active ? '미사용 처리' : '사용 처리'}</button>
                          <button type="button" className={sh.moreMenuItem} style={{ color: '#b91c1c' }} onClick={(e) => { e.stopPropagation(); askDelete(r); }}>삭제</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {emptyAll && (
              <div className={sh.emptyBlock}>
                <div className={sh.emptyTitle}>검색 결과가 없습니다.</div>
                <button type="button" className={sh.emptyActionBtn} onClick={() => setQ('')}>검색 초기화</button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          {cur && effectiveDraft && (
            <>
              <div className={styles.panelHead}>
                <div className={styles.panelHeadTitle}>
                  {cur.name}
                  {cur.isSystem && <span className={styles.sysBadge}>SYSTEM ROLE</span>}
                </div>
                <div className={styles.panelHeadSub}>{cur.code}</div>
              </div>

              <div className={styles.panelBody}>
                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>역할명 <span className={sh.required}>*</span></span>
                  <input className={sh.formInput} value={effectiveDraft.name} disabled={cur.isSystem} onChange={(e) => setD({ name: e.target.value })} />
                </div>

                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>설명</span>
                  <textarea className={sh.formTextarea} value={effectiveDraft.description} disabled={cur.isSystem} onChange={(e) => setD({ description: e.target.value })} placeholder="이 역할이 담당하는 업무를 간단히 설명하세요." />
                </div>

                <div className={sh.formField}>
                  <span className={sh.formFieldLabel}>사용 여부</span>
                  <div className={sh.useToggleRow}>
                    <button type="button" className={sh.useToggleBtn} style={{ border: `1px solid ${effectiveDraft.active ? ACCENT : 'rgba(0,0,0,.12)'}`, background: effectiveDraft.active ? ACCENT : '#fff', color: effectiveDraft.active ? '#fff' : '#52525b' }} disabled={cur.isSystem} onClick={() => setD({ active: true })}>사용</button>
                    <button type="button" className={sh.useToggleBtn} style={{ border: `1px solid ${!effectiveDraft.active ? '#18181b' : 'rgba(0,0,0,.12)'}`, background: !effectiveDraft.active ? '#18181b' : '#fff', color: !effectiveDraft.active ? '#fff' : '#52525b' }} disabled={cur.isSystem} onClick={() => { if (!cur.isSystem) askDeactivate(cur); }}>미사용</button>
                  </div>
                </div>

                <div className={sh.linkedCard}>
                  <div className={sh.linkedCardLabel}>배정 관리자</div>
                  <span className={sh.linkedCardValue}>{assignedCount(cur.id, ADMINS)}명</span>
                  <button type="button" className={sh.selBtn} onClick={() => navigate(`/admin?role=${cur.id}`)}>관리자 목록 보기</button>
                </div>

                <div>
                  <div className={styles.permHeadRow}>
                    <span className={styles.permHeadTitle}>권한 설정</span>
                    {cur.isSystem ? (
                      <span className={styles.sysBadge}>모든 권한 🔒</span>
                    ) : (
                      <>
                        <button type="button" className={styles.permMiniBtn} onClick={() => selectAllGlobal(true)}>전체 선택</button>
                        <button type="button" className={styles.permMiniBtn} onClick={() => selectAllGlobal(false)}>전체 해제</button>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                    {MENU_TREE.map((g) => {
                      const gs = groupState(g.id, effectiveDraft.permissions);
                      return (
                        <div key={g.id} className={styles.permGroup}>
                          <div className={styles.permGroupHead}>
                            <label className={`${styles.permCheck} ${cur.isSystem ? styles.permCheckDisabled : ''}`}>
                              <input type="checkbox" checked={gs === 'all'} ref={(el) => { if (el) el.indeterminate = gs === 'partial'; }} disabled={cur.isSystem} onChange={() => toggleGroup(g.id)} />
                            </label>
                            <span className={styles.permGroupLabel}>{g.label}</span>
                            {!cur.isSystem && <button type="button" className={styles.permMiniBtn} onClick={() => groupSelectAll(g.id)}>모두 선택</button>}
                          </div>
                          {g.children.map((c) => {
                            const p = effectiveDraft.permissions[c.id];
                            return (
                              <div key={c.id} className={styles.permLeafRow}>
                                <label className={`${styles.permCheck} ${cur.isSystem ? styles.permCheckDisabled : ''}`}>
                                  <input type="checkbox" checked={p.access} disabled={cur.isSystem} onChange={() => toggleLeafAccess(c.id)} />
                                  메뉴 접근
                                </label>
                                <span className={styles.permLeafLabel}>{c.label}</span>
                                {PERM_KEYS.map((key) => (
                                  <label key={key} className={`${styles.permCheck} ${!p.access || cur.isSystem ? styles.permCheckDisabled : ''}`}>
                                    <input type="checkbox" checked={p[key]} disabled={!p.access || cur.isSystem} onChange={() => togglePerm(c.id, key)} />
                                    {PERM_LABELS[key]}
                                  </label>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {err && <div className={sh.errBox}>{err}</div>}

                <div>
                  <div className={sh.formFieldLabel} style={{ marginBottom: 8 }}>최근 변경</div>
                  <div className={styles.historyList}>
                    {cur.history.slice().reverse().slice(0, 5).map((h) => (
                      <div key={h.id} className={styles.historyItem}>
                        <span className={styles.historyWhen}>{h.at}</span>
                        <span className={styles.historyBy}>{h.by}</span>
                        <div className={styles.historyAction}>{h.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.panelFooter}>
                {!cur.isSystem && <button type="button" className={sh.dangerBtn} onClick={() => askDelete(cur)}>삭제</button>}
                <div className={sh.modalActionsSpacer} />
                <button type="button" className={sh.ghostBtn} onClick={() => { setDraft(null); setErr(''); }} disabled={!dirty}>취소</button>
                <button type="button" className={sh.solidBtn} style={{ background: dirty ? ACCENT : '#e4e4e7', color: dirty ? '#fff' : '#a1a1aa' }} onClick={() => { if (dirty) doSave(); }}>변경사항 저장</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
