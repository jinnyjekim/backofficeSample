import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { AdminDetailDrawer } from './AdminDetailDrawer';
import { AdminEditorDrawer } from './AdminEditorDrawer';
import {
  ADMINS,
  ADMIN_STATUSES,
  ROLES,
  SEARCH_SCOPES,
  STATUS_META,
  TODAY,
  activeSuperAdminCount,
  computeIssues,
  matchesSearch,
  maskEmail,
  nextAdminId,
  roleName,
  type AdminAccount,
  type AdminStatus,
  type SearchScope,
} from './adminData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { DatePicker } from '../../components/forms/DatePicker';

const GRID_TEMPLATE = '72px minmax(90px,1fr) minmax(130px,1.2fr) minmax(120px,1.3fr) 66px 124px 86px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '관리자 ID' },
  { label: '관리자명' },
  { label: '이메일' },
  { label: '역할' },
  { label: '상태' },
  { label: '최근 로그인' },
  { label: '등록일' },
];

type EditorState = { mode: 'create' } | { mode: 'edit'; admin: AdminAccount } | null;
type ConfirmState = { kind: 'resetPassword' | 'deactivate'; admin: AdminAccount } | null;

function history(a: AdminAccount, action: string, detail?: string): AdminAccount {
  return {
    ...a,
    updatedAt: TODAY,
    history: [...a.history, { id: `H-${a.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 15:00`, by: 'admin001', action, detail }],
  };
}

export function AdminsListPage() {
  const [searchParams] = useSearchParams();
  const [admins, setAdmins] = useState<AdminAccount[]>(ADMINS);
  const [scope, setScope] = useState<SearchScope>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const role = searchParams.get('role');
    if (role) setRoleFilter(role);
  }, [searchParams]);

  const [menuId, setMenuId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    admins.forEach((a) => { map[a.id] = computeIssues(a, admins); });
    return map;
  }, [admins]);

  const filtered = useMemo(
    () =>
      admins.filter((a) => {
        if (!matchesSearch(a, scope, search)) return false;
        if (statusFilter && a.status !== statusFilter) return false;
        if (roleFilter && !a.roleIds.includes(roleFilter)) return false;
        if (startDate && a.createdAt < startDate) return false;
        if (endDate && a.createdAt > endDate) return false;
        return true;
      }),
    [admins, scope, search, statusFilter, roleFilter, startDate, endDate],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setScope('전체');
    setKeyword('');
    setSearch('');
    setStatusFilter('');
    setRoleFilter('');
    setStartDate('');
    setEndDate('');
  };

  function openDetail(id: string) {
    setDrawerId(id);
    setMenuId(null);
  }
  const selected = drawerId ? admins.find((a) => a.id === drawerId) ?? null : null;

  function update(id: string, fn: (a: AdminAccount) => AdminAccount) {
    setAdmins((prev) => prev.map((a) => (a.id === id ? fn(a) : a)));
  }

  function saveAdmin(input: { id: string; name: string; email: string; phone: string; roleIds: string[]; status: AdminStatus; memo: string }) {
    const isEdit = admins.some((a) => a.id === input.id);
    if (isEdit) {
      update(input.id, (a) =>
        history(
          { ...a, name: input.name, email: input.email, phone: input.phone || null, roleIds: input.roleIds, status: input.status },
          '정보 수정',
        ),
      );
      toastBriefly('관리자 정보를 수정했습니다.');
    } else {
      const created: AdminAccount = {
        id: input.id,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        roleIds: input.roleIds,
        status: input.status,
        isSuperAdmin: false,
        lastLoginAt: null,
        lastLoginIp: null,
        loginFailCount: 0,
        createdAt: TODAY,
        updatedAt: TODAY,
        memos: input.memo ? [{ id: `M-${input.id}-1`, at: `${TODAY} 15:00`, by: 'admin001', text: input.memo }] : [],
        history: [{ id: `H-${input.id}-1`, at: `${TODAY} 15:00`, by: 'admin001', action: '계정 생성' }],
      };
      setAdmins((prev) => [...prev, created]);
      toastBriefly('관리자를 등록했습니다.');
    }
    setEditor(null);
  }

  function unlock(a: AdminAccount) {
    update(a.id, (x) => history({ ...x, status: '정상', loginFailCount: 0 }, '로그인 잠금 해제'));
    toastBriefly('로그인 잠금을 해제했습니다.');
  }

  function toggleActive(a: AdminAccount) {
    if (a.status === '비활성') {
      update(a.id, (x) => history({ ...x, status: '정상' }, '계정 활성화'));
      toastBriefly('계정을 활성화했습니다.');
    } else {
      setConfirm({ kind: 'deactivate', admin: a });
    }
  }

  function confirmAction() {
    if (!confirm) return;
    if (confirm.kind === 'resetPassword') {
      update(confirm.admin.id, (a) => history(a, '비밀번호 재설정 안내 발송', confirm.admin.email));
      toastBriefly(`${confirm.admin.email} 으로 비밀번호 재설정 안내를 발송했습니다.`);
    } else if (confirm.kind === 'deactivate') {
      update(confirm.admin.id, (a) => history({ ...a, status: '비활성' }, '계정 비활성화'));
      toastBriefly('계정을 비활성화했습니다.');
    }
    setConfirm(null);
  }

  const rows: GridRow[] = filtered.map((a) => {
    const sm = STATUS_META[a.status];
    const issueList = issuesMap[a.id] ?? [];
    const rolesLabel = a.roleIds.length > 1 ? `${roleName(a.roleIds[0])} +${a.roleIds.length - 1}` : a.roleIds.length === 1 ? roleName(a.roleIds[0]) : '없음';
    const cells: Cell[] = [
      { kind: 'text', text: a.id, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
      { kind: 'titleWarn', title: a.name, hasIssue: issueList.length > 0, issueTitle: issueList.join(' · ') },
      { kind: 'text', text: maskEmail(a.email), color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: rolesLabel, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'badge', text: a.status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: a.lastLoginAt ?? '이력 없음', color: a.lastLoginAt ? '#52525b' : '#a1a1aa', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: a.createdAt, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
    ];
    return { id: a.id, cells, onClick: () => openDetail(a.id) };
  });

  const pages = [1, 2, 3].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));
  const nextId = nextAdminId(admins);
  const superAdminActive = activeSuperAdminCount(admins);

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>관리자 목록</div>
            <div className={styles.subtitle}>백오피스에 접근할 수 있는 관리자 계정을 조회하고 관리합니다.</div>
          </div>
          <button type="button" className={styles.registerBtn} onClick={() => setEditor({ mode: 'create' })}>＋ 관리자 등록</button>
        </div>

        <div className={styles.filterBox}>
          <form className={styles.filterRow1} onSubmit={(e) => { e.preventDefault(); setSearch(keyword.trim()); }}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm} value={scope} onChange={(e) => setScope(e.target.value as SearchScope)}>
              {SEARCH_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="검색어를 입력하세요" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>상태</span><select aria-label="상태" className={styles.selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">상태 전체</option>
              {ADMIN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
            <label className="globalFilterField"><span>역할</span><select aria-label="역할" className={styles.selectSm} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">역할 전체</option>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select></label>
            <label className={styles.dateFilterField}>
              <span>등록일</span>
              <span className={styles.dateRange}>
                <DatePicker controlSize="sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className={styles.dateSeparator} aria-hidden="true">~</span>
                <DatePicker controlSize="sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </span>
            </label>
            <span className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}명</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download onClick={() => toastBriefly('관리자 목록을 다운로드했습니다.')} />
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="855px"
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText={admins.length === 0 ? '등록된 관리자가 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext={admins.length === 0 ? '백오피스에 접근할 관리자를 등록해 주세요.' : '검색어나 필터 조건을 변경해 주세요.'}
          emptyActionLabel={admins.length === 0 ? '＋ 관리자 등록' : '필터 초기화'}
          emptyActionClick={admins.length === 0 ? () => setEditor({ mode: 'create' }) : resetFilters}
        />
      </div>

      {selected && (
        <AdminDetailDrawer
          key={selected.id}
          admin={selected}
          all={admins}
          onClose={() => setDrawerId(null)}
          onEdit={() => setEditor({ mode: 'edit', admin: selected })}
          onResetPassword={() => setConfirm({ kind: 'resetPassword', admin: selected })}
          onUnlock={() => unlock(selected)}
          onToggleActive={() => toggleActive(selected)}
          onAddMemo={(text) => update(selected.id, (a) => ({ ...a, memos: [...a.memos, { id: `M-${selected.id}-${Date.now()}`, at: `${TODAY} 15:00`, by: 'admin001', text }] }))}
        />
      )}

      {editor && (
        <AdminEditorDrawer
          admin={editor.mode === 'edit' ? editor.admin : null}
          nextId={nextId}
          lockSuperAdminRole={editor.mode === 'edit' && editor.admin.isSuperAdmin && superAdminActive <= 1}
          onClose={() => setEditor(null)}
          onSave={saveAdmin}
        />
      )}

      {confirm?.kind === 'resetPassword' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>비밀번호 재설정 안내를 발송하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirm.admin.email} 으로 비밀번호 재설정 안내가 발송됩니다.</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmAction}>발송</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'deactivate' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>관리자 계정을 비활성화하시겠습니까?</div>
            <div className={styles.dialogBody}>비활성화 후 해당 관리자는 백오피스에 로그인할 수 없습니다. 기존 작업 이력은 유지됩니다.</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={confirmAction}>비활성화</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
