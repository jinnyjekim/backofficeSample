import { DatePicker } from '../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { AdminHistoryDetailDrawer } from './AdminHistoryDetailDrawer';
import { ADMINS } from './adminData';
import { ACTION_TYPES, ACTION_LOGS, LOGIN_LOGS, MENUS, type ActionLogEntry, type LoginLogEntry } from './adminHistoryData';

type Tab = '로그인 이력' | '작업 이력';
const TABS: Tab[] = ['로그인 이력', '작업 이력'];

const LOGIN_TEMPLATE = '130px 110px 60px minmax(110px,1fr) 150px 130px 60px';
const LOGIN_COLUMNS: GridColumn[] = [
  { label: '로그인 일시' }, { label: '관리자' }, { label: '결과' }, { label: 'IP' }, { label: '접속 환경' }, { label: '로그아웃 일시' }, { label: '상세' },
];

const ACTION_TEMPLATE = '130px 100px 110px 80px minmax(140px,1fr) 60px 60px';
const ACTION_COLUMNS: GridColumn[] = [
  { label: '작업 일시' }, { label: '관리자' }, { label: '메뉴' }, { label: '작업' }, { label: '대상' }, { label: '결과' }, { label: '상세' },
];

function adminName(id: string) {
  return ADMINS.find((a) => a.id === id)?.name ?? id;
}

export function AdminHistoryPage() {
  const [tab, setTab] = useState<Tab>('로그인 이력');
  const [adminFilter, setAdminFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [menuFilter, setMenuFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loginDrawer, setLoginDrawer] = useState<LoginLogEntry | null>(null);
  const [actionDrawer, setActionDrawer] = useState<ActionLogEntry | null>(null);
  const [toast, setToast] = useState('');

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const resetFilters = () => {
    setAdminFilter('');
    setKeyword('');
    setSearch('');
    setResultFilter('');
    setMenuFilter('');
    setActionTypeFilter('');
    setStartDate('');
    setEndDate('');
  };

  const filteredLogins = useMemo(
    () =>
      LOGIN_LOGS.filter((l) => {
        if (adminFilter && l.adminId !== adminFilter) return false;
        if (resultFilter && l.result !== resultFilter) return false;
        if (startDate && l.at.slice(0, 10) < startDate) return false;
        if (endDate && l.at.slice(0, 10) > endDate) return false;
        if (search) {
          const k = search.toLowerCase();
          if (!(l.adminId.toLowerCase().includes(k) || adminName(l.adminId).toLowerCase().includes(k) || l.ip.includes(k))) return false;
        }
        return true;
      }),
    [adminFilter, resultFilter, startDate, endDate, search],
  );

  const filteredActions = useMemo(
    () =>
      ACTION_LOGS.filter((a) => {
        if (adminFilter && a.adminId !== adminFilter) return false;
        if (resultFilter && a.result !== resultFilter) return false;
        if (menuFilter && a.menu !== menuFilter) return false;
        if (actionTypeFilter && a.actionType !== actionTypeFilter) return false;
        if (startDate && a.at.slice(0, 10) < startDate) return false;
        if (endDate && a.at.slice(0, 10) > endDate) return false;
        if (search) {
          const k = search.toLowerCase();
          if (!(a.adminId.toLowerCase().includes(k) || adminName(a.adminId).toLowerCase().includes(k) || a.targetId.toLowerCase().includes(k) || a.ip.includes(k))) return false;
        }
        return true;
      }),
    [adminFilter, resultFilter, menuFilter, actionTypeFilter, startDate, endDate, search],
  );

  const loginRows: GridRow[] = filteredLogins.map((l) => {
    const cells: Cell[] = [
      { kind: 'text', text: l.at, color: '#3f3f46', size: '12px', weight: 500, numeric: true },
      { kind: 'text', text: `${l.adminId} · ${adminName(l.adminId)}`, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'badge', text: l.result, bg: l.result === '성공' ? '#ecfdf5' : '#fef2f2', fg: l.result === '성공' ? '#059669' : '#b91c1c' },
      { kind: 'text', text: l.ip, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: l.device, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: l.logoutAt ?? '-', color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
      { kind: 'link', text: '보기', size: '12px' },
    ];
    return { id: l.id, cells, onClick: () => setLoginDrawer(l) };
  });

  const actionRows: GridRow[] = filteredActions.map((a) => {
    const issues = a.result === '실패' ? [a.failReason ?? '실패'] : [];
    const cells: Cell[] = [
      { kind: 'text', text: a.at, color: '#3f3f46', size: '12px', weight: 500, numeric: true },
      { kind: 'text', text: `${a.adminId} · ${adminName(a.adminId)}`, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: a.menu, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'titleWarn', title: a.actionType, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
      { kind: 'text', text: `${a.targetType} · ${a.targetId}`, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'badge', text: a.result, bg: a.result === '성공' ? '#ecfdf5' : '#fef2f2', fg: a.result === '성공' ? '#059669' : '#b91c1c' },
      { kind: 'link', text: '보기', size: '12px' },
    ];
    return { id: a.id, cells, onClick: () => setActionDrawer(a) };
  });

  const total = tab === '로그인 이력' ? filteredLogins.length : filteredActions.length;

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>관리자 이력</div>
            <div className={styles.subtitle}>관리자의 로그인 및 백오피스 작업 기록을 조회합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={styles.qfBtn}
              style={{ borderColor: tab === t ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: tab === t ? 'var(--accent)' : '#fff' }}
              onClick={() => { setTab(t); resetFilters(); }}
            >
              <span className={styles.qfLabel} style={{ color: tab === t ? '#fff' : '#3f3f46' }}>{t}</span>
            </button>
          ))}
        </div>

        <div className={styles.filterBox}>
          <form className={styles.filterRow1} onSubmit={(e) => { e.preventDefault(); setSearch(keyword.trim()); }}>
            <select className={styles.selectSm} value={adminFilter} onChange={(e) => setAdminFilter(e.target.value)}>
              <option value="">관리자 전체</option>
              {ADMINS.map((a) => <option key={a.id} value={a.id}>{a.id} · {a.name}</option>)}
            </select>
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={tab === '로그인 이력' ? '관리자 ID, 이름 또는 IP 검색' : '관리자 ID, 이름 또는 대상 ID 검색'} />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <select className={styles.selectSm} value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
              <option value="">결과 전체</option>
              <option value="성공">성공</option>
              <option value="실패">실패</option>
            </select>
            {tab === '작업 이력' && (
              <>
                <select className={styles.selectSm} value={menuFilter} onChange={(e) => setMenuFilter(e.target.value)}>
                  <option value="">메뉴 전체</option>
                  {MENUS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className={styles.selectSm} value={actionTypeFilter} onChange={(e) => setActionTypeFilter(e.target.value)}>
                  <option value="">작업 유형 전체</option>
                  {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </>
            )}
            <DatePicker className={styles.selectSm} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span style={{ color: '#a1a1aa', fontSize: 12 }}>~</span>
            <DatePicker className={styles.selectSm} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <span className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {total.toLocaleString('ko-KR')}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn} onClick={() => toastBriefly('현재 조건으로 이력을 다운로드했습니다.')}>↓ 다운로드</button>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        {tab === '로그인 이력' ? (
          <DataGrid
            columns={LOGIN_COLUMNS}
            rows={loginRows}
            gridTemplate={LOGIN_TEMPLATE}
            minWidth="920px"
            empty={loginRows.length === 0}
            emptyText="조회된 이력이 없습니다."
            emptySubtext="검색 조건이나 조회 기간을 변경해 주세요."
            emptyActionLabel="필터 초기화"
            emptyActionClick={resetFilters}
          />
        ) : (
          <DataGrid
            columns={ACTION_COLUMNS}
            rows={actionRows}
            gridTemplate={ACTION_TEMPLATE}
            minWidth="960px"
            empty={actionRows.length === 0}
            emptyText="조회된 이력이 없습니다."
            emptySubtext="검색 조건이나 조회 기간을 변경해 주세요."
            emptyActionLabel="필터 초기화"
            emptyActionClick={resetFilters}
          />
        )}
      </div>

      {loginDrawer && <AdminHistoryDetailDrawer kind="login" item={loginDrawer} onClose={() => setLoginDrawer(null)} />}
      {actionDrawer && <AdminHistoryDetailDrawer kind="action" item={actionDrawer} onClose={() => setActionDrawer(null)} />}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
