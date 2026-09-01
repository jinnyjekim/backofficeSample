import { useMemo, useState } from 'react';
import styles from './ContractsPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  CONTRACTS,
  CONTRACT_COLUMNS,
  CONTRACT_GRID_MIN_WIDTH,
  CONTRACT_GRID_TEMPLATE,
  FILTER_KEYS,
  buildContractRowCells,
  computeCounts,
  filterContracts,
  type Contract,
  type ContractFilterKey,
} from './contractsData';
import { buildContractDetail } from './contractDetail';
import { ContractDetailDrawer } from './ContractDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

export function ContractsPage() {
  const [data, setData] = useState<Contract[]>(CONTRACTS);
  const [filter, setFilter] = useState<ContractFilterKey>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showTerminatePanel, setShowTerminatePanel] = useState(false);

  const counts = useMemo(() => computeCounts(data), [data]);
  const filtered = useMemo(() => filterContracts(data, filter, q), [data, filter, q]);

  const selected = selectedId ? data.find((c) => c.id === selectedId) ?? null : null;
  const detail = selected ? buildContractDetail(selected) : null;

  function openContract(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowTerminatePanel(false);
  }

  function confirmTerminate() {
    if (!selected) return;
    const id = selected.id;
    setData((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: '해지', history: [...c.history, { when: '방금', action: '계약 해지', by: 'admin03' }] }
          : c,
      ),
    );
    setShowTerminatePanel(false);
  }

  const rows: GridRow[] = filtered.map((c) => ({
    id: c.id,
    cells: buildContractRowCells(c),
    onClick: () => openContract(c.id),
  }));

  const pages: PageBtn[] = [1, 2].map((n) => ({ label: String(n), active: n === 1 }));

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.title}>계약 관리</div>
          <div className={styles.subtitle}>거래처와 체결한 계약 및 거래 조건을 관리합니다.</div>
        </div>
        <button type="button" className={styles.registerBtn}>+ 계약 등록</button>
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
            <option>상품명</option>
            <option>견적번호</option>
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
          <label className="globalFilterField"><span>계약유형</span><select aria-label="계약유형" className={styles.selectSm}>
            <option>계약유형 전체</option>
            <option>공급 계약</option>
            <option>단가 계약</option>
            <option>기간 계약</option>
            <option>프레임 계약</option>
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
          columns={CONTRACT_COLUMNS}
          rows={rows}
          gridTemplate={CONTRACT_GRID_TEMPLATE}
          minWidth={CONTRACT_GRID_MIN_WIDTH}
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="등록된 계약이 없습니다. 거래처와 체결한 계약을 등록하고 거래 조건을 관리할 수 있습니다."
        />
      </div>

      {detail && (
        <ContractDetailDrawer
          detail={detail}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          showTerminatePanel={showTerminatePanel}
          onToggleTerminatePanel={() => setShowTerminatePanel((v) => !v)}
          onConfirmTerminate={confirmTerminate}
        />
      )}
    </div>
  );
}
