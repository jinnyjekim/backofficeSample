import { useMemo, useState } from 'react';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { ApiLogDetailDrawer } from './ApiLogDetailDrawer';
import { ErrorGroupDetailDrawer } from './ErrorGroupDetailDrawer';
import {
  API_LOGS,
  ERROR_GROUPS,
  ERROR_LEVELS,
  HTTP_METHODS,
  LEVEL_META,
  MODULES,
  SLOW_MS,
  TODAY,
  errorFirstAt,
  errorLastAt,
  quickRangeDates,
  type ApiLogEntry,
  type ErrorGroup,
  type HttpMethod,
  type ModuleName,
  type QuickRange,
} from './systemLogData';

type Tab = 'api' | 'error';
const TABS: [Tab, string][] = [['api', 'API 로그'], ['error', '오류 로그']];
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일'];

const API_TEMPLATE = '130px 62px minmax(160px,1.6fr) 66px 70px 80px 110px 60px';
const API_COLUMNS: GridColumn[] = [
  { label: '요청 일시' }, { label: 'Method' }, { label: 'Endpoint' }, { label: 'Status' }, { label: '결과' }, { label: '처리시간' }, { label: '요청자' }, { label: '상세' },
];

const ERROR_TEMPLATE = '150px 80px 80px minmax(180px,1.6fr) 80px 110px 60px';
const ERROR_COLUMNS: GridColumn[] = [
  { label: '오류 코드' }, { label: '수준' }, { label: '모듈' }, { label: '메시지' }, { label: '발생횟수' }, { label: '마지막 발생' }, { label: '상세' },
];

export function SystemLogPage() {
  const [tab, setTab] = useState<Tab>('api');
  const [start, setStart] = useState(quickRangeDates('최근 7일')[0]);
  const [end, setEnd] = useState(TODAY);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState<ModuleName | ''>('');
  const [methodFilter, setMethodFilter] = useState<HttpMethod | ''>('');
  const [levelFilter, setLevelFilter] = useState('');

  const [apiDrawer, setApiDrawer] = useState<ApiLogEntry | null>(null);
  const [errorDrawer, setErrorDrawer] = useState<ErrorGroup | null>(null);

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s); setEnd(e);
  };
  const resetFilters = () => {
    setKeyword(''); setSearch(''); setResultFilter(''); setModuleFilter(''); setMethodFilter(''); setLevelFilter('');
    applyQuick('최근 7일');
  };

  const filteredApi = useMemo(
    () =>
      API_LOGS.filter((e) => {
        const date = e.at.slice(0, 10);
        if (date < start || date > end) return false;
        if (resultFilter && e.result !== resultFilter) return false;
        if (moduleFilter && e.module !== moduleFilter) return false;
        if (methodFilter && e.method !== methodFilter) return false;
        if (search) {
          const k = search.toLowerCase();
          if (!(e.endpoint.toLowerCase().includes(k) || e.requester.toLowerCase().includes(k) || e.id.toLowerCase().includes(k))) return false;
        }
        return true;
      }),
    [start, end, resultFilter, moduleFilter, methodFilter, search],
  );

  const filteredErrors = useMemo(
    () =>
      ERROR_GROUPS.filter((g) => {
        const first = errorFirstAt(g).slice(0, 10);
        const last = errorLastAt(g).slice(0, 10);
        if (last < start || first > end) return false;
        if (levelFilter && g.level !== levelFilter) return false;
        if (moduleFilter && g.module !== moduleFilter) return false;
        if (search) {
          const k = search.toLowerCase();
          if (!(g.errorCode.toLowerCase().includes(k) || g.message.toLowerCase().includes(k))) return false;
        }
        return true;
      }),
    [start, end, levelFilter, moduleFilter, search],
  );

  const apiRows: GridRow[] = filteredApi.map((e) => {
    const isSlow = e.durationMs >= SLOW_MS;
    const cells: Cell[] = [
      { kind: 'text', text: e.at.slice(0, 19), color: '#3f3f46', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: e.method, color: '#3f3f46', size: '11.5px', weight: 700 },
      { kind: 'text', text: e.endpoint, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: String(e.statusCode), color: e.result === '성공' ? '#059669' : '#dc2626', size: '12px', weight: 700, numeric: true },
      { kind: 'badge', text: e.result, bg: e.result === '성공' ? '#ecfdf5' : '#fef2f2', fg: e.result === '성공' ? '#059669' : '#b91c1c' },
      { kind: 'text', text: `${e.durationMs}ms${isSlow ? ' 느림' : ''}`, color: isSlow ? '#b45309' : '#71717a', size: '11.5px', weight: isSlow ? 700 : 500, numeric: true },
      { kind: 'text', text: e.requester, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'link', text: '보기', size: '12px' },
    ];
    return { id: e.id, cells, onClick: () => setApiDrawer(e) };
  });

  const errorRows: GridRow[] = filteredErrors.map((g) => {
    const meta = LEVEL_META[g.level];
    const cells: Cell[] = [
      { kind: 'text', text: g.errorCode, color: '#3f3f46', size: '12px', weight: 700 },
      { kind: 'badge', text: g.level, bg: meta.bg, fg: meta.fg },
      { kind: 'text', text: g.module, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: g.message, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: `${g.occurrences.length}회`, color: g.occurrences.length >= 10 ? '#dc2626' : '#3f3f46', size: '12px', weight: 700, align: 'right', numeric: true },
      { kind: 'text', text: errorLastAt(g).slice(0, 16), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'link', text: '보기', size: '12px' },
    ];
    return { id: g.errorCode, cells, onClick: () => setErrorDrawer(g) };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>시스템 로그</div>
            <div className={styles.subtitle}>시스템에서 발생한 API 요청 및 오류 기록을 조회합니다. 조회 전용이며 로그는 수정·삭제할 수 없습니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {TABS.map(([key, label]) => (
            <button key={key} type="button" className={styles.qfBtn} style={{ borderColor: tab === key ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: tab === key ? 'var(--accent)' : '#fff' }} onClick={() => setTab(key)}>
              <span className={styles.qfLabel} style={{ color: tab === key ? '#fff' : '#3f3f46' }}>{label}</span>
            </button>
          ))}
        </div>

        <div className={styles.filterBox}>
          <form className={styles.filterRow1} onSubmit={(e) => { e.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={tab === 'api' ? 'Endpoint, 요청자 또는 Request ID 검색' : '오류 코드 또는 메시지 검색'} />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <input type="date" className={styles.selectSm} value={start} onChange={(e) => setStart(e.target.value)} />
            <span style={{ color: '#a1a1aa', fontSize: 12 }}>~</span>
            <input type="date" className={styles.selectSm} value={end} onChange={(e) => setEnd(e.target.value)} />
            {QUICK_RANGES.map((r) => (
              <button key={r} type="button" className={styles.detailFilterBtn} onClick={() => applyQuick(r)}>{r}</button>
            ))}
            <label className="globalFilterField"><span>서비스 모듈</span><select aria-label="서비스 모듈" className={styles.selectSm} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value as ModuleName | '')}>
              <option value="">서비스/모듈 전체</option>
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select></label>
            {tab === 'api' ? (
              <>
                <label className="globalFilterField"><span>결과</span><select aria-label="결과" className={styles.selectSm} value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
                  <option value="">결과 전체</option>
                  <option value="성공">성공</option>
                  <option value="실패">실패</option>
                </select></label>
                <label className="globalFilterField"><span>요청 방식</span><select aria-label="요청 방식" className={styles.selectSm} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as HttpMethod | '')}>
                  <option value="">Method 전체</option>
                  {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select></label>
              </>
            ) : (
              <label className="globalFilterField"><span>오류 수준</span><select aria-label="오류 수준" className={styles.selectSm} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                <option value="">오류 수준 전체</option>
                {ERROR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select></label>
            )}
            <span className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {(tab === 'api' ? filteredApi.length : filteredErrors.length).toLocaleString('ko-KR')}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn} data-grid-download>↓ 다운로드</button>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        {tab === 'api' ? (
          <DataGrid
            columns={API_COLUMNS}
            rows={apiRows}
            gridTemplate={API_TEMPLATE}
            minWidth="960px"
            empty={apiRows.length === 0}
            emptyText="조회된 로그가 없습니다."
            emptySubtext="기간 또는 검색 조건을 변경해 주세요."
            emptyActionLabel="필터 초기화"
            emptyActionClick={resetFilters}
          />
        ) : (
          <DataGrid
            columns={ERROR_COLUMNS}
            rows={errorRows}
            gridTemplate={ERROR_TEMPLATE}
            minWidth="920px"
            empty={errorRows.length === 0}
            emptyText="조회 기간에 발생한 오류가 없습니다."
            emptySubtext="기간 또는 검색 조건을 변경해 주세요."
            emptyActionLabel="필터 초기화"
            emptyActionClick={resetFilters}
          />
        )}
      </div>

      {apiDrawer && <ApiLogDetailDrawer entry={apiDrawer} onClose={() => setApiDrawer(null)} />}
      {errorDrawer && <ErrorGroupDetailDrawer group={errorDrawer} onClose={() => setErrorDrawer(null)} />}
    </div>
  );
}
