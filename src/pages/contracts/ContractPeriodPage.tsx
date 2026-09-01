import { useMemo, useState } from 'react';
import styles from './ContractPeriodPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  FILTER_KEYS,
  PERIOD_COLUMNS,
  PERIOD_CONTRACTS,
  PERIOD_GRID_MIN_WIDTH,
  PERIOD_GRID_TEMPLATE,
  buildPeriodRowCells,
  computeCounts,
  filterList,
  withCalc,
  type PeriodContract,
  type PeriodFilterKey,
} from './contractPeriodData';
import { buildContractPeriodDetail } from './contractPeriodDetail';
import { ContractPeriodDetailDrawer } from './ContractPeriodDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

export function ContractPeriodPage() {
  const [data, setData] = useState<PeriodContract[]>(PERIOD_CONTRACTS);
  const [filter, setFilter] = useState<PeriodFilterKey>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showExtendPanel, setShowExtendPanel] = useState(false);
  const [showRenewPanel, setShowRenewPanel] = useState(false);

  const calc = useMemo(() => withCalc(data), [data]);
  const counts = useMemo(() => computeCounts(calc), [calc]);
  const filtered = useMemo(() => filterList(calc, filter, q), [calc, filter, q]);

  const selected = selectedId ? calc.find((c) => c.id === selectedId) ?? null : null;
  const detail = selected ? buildContractPeriodDetail(selected) : null;

  function openContract(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowExtendPanel(false);
    setShowRenewPanel(false);
  }

  function toggleExtendPanel() {
    setShowExtendPanel((v) => !v);
    setShowRenewPanel(false);
  }

  function toggleRenewPanel() {
    setShowRenewPanel((v) => !v);
    setShowExtendPanel(false);
  }

  function confirmExtend() {
    if (!selected) return;
    const id = selected.id;
    setData((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, history: [...c.history, { when: '방금', action: '계약기간 변경 요청', by: 'admin01' }] }
          : c,
      ),
    );
    setShowExtendPanel(false);
  }

  function confirmRenew() {
    if (!selected) return;
    const id = selected.id;
    setData((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, renewal: '검토중', history: [...c.history, { when: '방금', action: '갱신 검토 시작', by: 'admin01' }] }
          : c,
      ),
    );
    setShowRenewPanel(false);
  }

  const rows: GridRow[] = filtered.map((c) => ({
    id: c.id,
    cells: buildPeriodRowCells(c),
    onClick: () => openContract(c.id),
  }));

  const pages: PageBtn[] = [1, 2].map((n) => ({ label: String(n), active: n === 1 }));

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.title}>계약기간 관리</div>
          <div className={styles.subtitle}>계약의 시작, 종료, 만료 및 갱신 일정을 관리합니다.</div>
        </div>
      </div>

      <div className={styles.quickFilters}>
        {FILTER_KEYS.map((k) => {
          const active = filter === k;
          return (
            <button
              key={k}
              type="button"
              className={`${styles.quickFilter} ${active ? styles.quickFilterActive : ''}`}
              onClick={() => setFilter(k)}
            >
              <span className={styles.quickFilterLabel}>{k}</span>
              <span className={styles.quickFilterCount}>{counts[k]}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchRow}>
          <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.select}>
            <option>전체</option>
            <option>계약번호</option>
            <option>계약명</option>
            <option>거래처명</option>
          </select></label>
          <input
            className={styles.searchInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="계약번호 또는 거래처명"
          />
          <button type="button" className={styles.searchBtn}>검색</button>
        </div>
        <div className={styles.filterRow}>
          <label className="globalFilterField"><span>기간상태</span><select aria-label="기간상태" className={styles.selectSm}>
            <option>기간상태 전체</option>
            <option>시작 예정</option>
            <option>유효</option>
            <option>만료 임박</option>
            <option>만료</option>
          </select></label>
          <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectSm}>
            <option>거래처 전체</option>
            <option>회사 01</option>
            <option>회사 02</option>
          </select></label>
          <label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={styles.selectSm}>
            <option>담당자 전체</option>
            <option>admin01</option>
            <option>admin02</option>
          </select></label>
          <label className="globalFilterField"><span>갱신상태</span><select aria-label="갱신상태" className={styles.selectSm}>
            <option>갱신상태 전체</option>
            <option>검토전</option>
            <option>검토중</option>
            <option>갱신완료</option>
            <option>갱신안함</option>
          </select></label>
          <div className={styles.spacer} />
          <button type="button" className={styles.clearBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
        </div>
      </div>

      <div className={styles.resultRow}>
        <span className={styles.resultLabel}>총 {filtered.length}건</span>
        <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
          <select className={styles.selectSm}>
            <option>20개씩 보기</option>
            <option>50개씩 보기</option>
          </select>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={PERIOD_COLUMNS}
          rows={rows}
          gridTemplate={PERIOD_GRID_TEMPLATE}
          minWidth={PERIOD_GRID_MIN_WIDTH}
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="등록된 계약기간 정보가 없습니다. 계약이 등록되면 시작일과 종료일을 기준으로 계약 일정을 관리할 수 있습니다."
        />
      </div>

      {detail && (
        <ContractPeriodDetailDrawer
          detail={detail}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          showExtendPanel={showExtendPanel}
          showRenewPanel={showRenewPanel}
          onToggleExtendPanel={toggleExtendPanel}
          onToggleRenewPanel={toggleRenewPanel}
          onConfirmExtend={confirmExtend}
          onConfirmRenew={confirmRenew}
        />
      )}
    </div>
  );
}
