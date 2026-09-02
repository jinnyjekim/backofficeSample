import { useMemo, useState } from 'react';
import styles from './CompaniesPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  CREDIT_COMPANIES,
  CREDIT_FILTERS,
  CREDIT_STATUS_META,
  fmtWon,
  statusOf,
  type CreditCompany,
} from './creditTermsData';
import { CreditTermsDetailDrawer } from './CreditTermsDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = '1.2fr 50px 96px 96px 98px 130px 100px 58px 60px';
const COLUMN_LABELS = ['회사', '신용거래', '신용한도', '사용액', '잔여한도', '결제조건', '미수금', '상태', '관리'];
const RIGHT_ALIGN_INDICES = new Set([2, 3, 4, 6]);
const SEARCH_SCOPES = ['전체', '회사명', '회사코드', '사업자등록번호', '내부 담당자'];

export function CreditTermsPage() {
  const [data, setData] = useState<CreditCompany[]>(CREDIT_COMPANIES);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [q, setQ] = useState('');
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const counts = useMemo(() => CREDIT_FILTERS.map((f) => data.filter(f.match).length), [data]);

  const filtered = useMemo(() => {
    return data.filter((c) => {
      if (statusFilter !== '전체') {
        const f = CREDIT_FILTERS.find((x) => x.key === statusFilter);
        if (f && !f.match(c)) return false;
      }
      if (q && !(c.name.includes(q) || c.code.includes(q))) return false;
      return true;
    });
  }, [data, statusFilter, q]);

  const quickFilters = CREDIT_FILTERS.map((f, i) => ({
    label: f.key,
    count: counts[i],
    active: statusFilter === f.key,
  }));

  const gridColumns: GridColumn[] = COLUMN_LABELS.map((label, i) => ({
    label,
    align: RIGHT_ALIGN_INDICES.has(i) ? 'right' : undefined,
  }));

  const rows: GridRow[] = filtered.map((c) => {
    const st = statusOf(c);
    const sm = CREDIT_STATUS_META[st];
    const remain = c.limit - c.used;
    return {
      id: c.code,
      onClick: () => setOpenCode(c.code),
      cells: [
        { kind: 'stack', title: c.name, subtitle: c.code },
        { kind: 'text', text: c.credit ? '허용' : '미사용', color: c.credit ? '#059669' : '#a1a1aa', size: '12px', weight: 600 },
        { kind: 'text', text: c.credit ? fmtWon(c.limit) : '-', color: '#3f3f46', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: c.credit ? fmtWon(c.used) : '-', color: '#3f3f46', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: c.credit ? fmtWon(remain) : '-', color: remain < 0 ? '#dc2626' : '#18181b', size: '12px', weight: 600, align: 'right', numeric: true },
        { kind: 'text', text: `${c.method}${c.dueDays !== '-' ? ' · ' + c.cutoff + ' · ' + c.collectDay : ''}`, color: '#52525b', size: '11.5px', weight: 500 },
        { kind: 'text', text: fmtWon(c.receivable), color: c.receivable > 0 ? '#dc2626' : '#71717a', size: '12px', weight: 600, align: 'right', numeric: true },
        { kind: 'badge', text: st, bg: sm.bg, fg: sm.fg },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));

  function clearAll() {
    setStatusFilter('전체');
    setQ('');
  }

  function handleChangeLimit(code: string, newLimit: number, reason: string) {
    setData((prev) =>
      prev.map((c) => {
        if (c.code !== code) return c;
        const entry = {
          when: '방금 전',
          field: '신용한도',
          from: fmtWon(c.limit),
          to: fmtWon(newLimit),
          reason: reason || '기타',
          admin: '관리자',
        };
        return { ...c, limit: newLimit, history: [entry, ...c.history] };
      }),
    );
  }

  function handleAddMemo(code: string, text: string) {
    setData((prev) =>
      prev.map((c) =>
        c.code === code ? { ...c, memos: [{ when: '방금 전', admin: '관리자', text }, ...c.memos] } : c,
      ),
    );
  }

  const selected = openCode ? data.find((c) => c.code === openCode) ?? null : null;

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.head}>
          <div>
            <div className={styles.title}>신용 / 거래 조건</div>
            <div className={styles.subtitle}>거래처별 신용 한도와 결제·거래 조건을 관리합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {quickFilters.map((qf) => (
            <CommonButton
              key={qf.label}
              variant={qf.active ? 'primary-light' : 'secondary'}
              size="md"
              className={`${styles.quickFilterBtn} ${qf.active ? styles.active : ''}`}
              onClick={() => setStatusFilter(qf.label)}
            >
              <span className={styles.quickFilterLabel}>{qf.label}</span>
              <span className={styles.quickFilterCount}>{qf.count}</span>
            </CommonButton>
          ))}
        </div>

        <div className={styles.filterCard}>
          <div className={styles.searchRow}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.scopeSelect} defaultValue={SEARCH_SCOPES[0]}>
              {SEARCH_SCOPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select></label>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="회사명 또는 코드"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow}>
            <label className="globalFilterField"><span>신용거래</span><select aria-label="신용거래" className={styles.smallSelect} defaultValue="신용거래 전체">
              <option>신용거래 전체</option>
              <option>허용</option>
              <option>미허용</option>
            </select></label>
            <label className="globalFilterField"><span>결제방식</span><select aria-label="결제방식" className={styles.smallSelect} defaultValue="결제방식 전체">
              <option>결제방식 전체</option>
              <option>선결제</option>
              <option>후불</option>
              <option>혼합</option>
            </select></label>
            <label className="globalFilterField"><span>한도상태</span><select aria-label="한도상태" className={styles.smallSelect} defaultValue="한도상태 전체">
              <option>한도상태 전체</option>
              <option>정상</option>
              <option>임박</option>
              <option>초과</option>
            </select></label>
            <label className="globalFilterField"><span>거래상태</span><select aria-label="거래상태" className={styles.smallSelect} defaultValue="거래상태 전체">
              <option>거래상태 전체</option>
              <option>거래중</option>
              <option>거래중지</option>
              <option>거래종료</option>
            </select></label>
            <label className="globalFilterField"><span>내부담당자</span><select aria-label="내부담당자" className={styles.smallSelect} defaultValue="내부담당자 전체">
              <option>내부담당자 전체</option>
              <option>admin1</option>
              <option>admin2</option>
              <option>admin3</option>
            </select></label>
            <div className={styles.spacer} />
            <button type="button" className={styles.clearBtn} onClick={clearAll}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}개 거래처</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
              <option>100개씩 보기</option>
            </select>
          </div>
        </div>

        <div className={styles.gridWrap}>
          <DataGrid
            columns={gridColumns}
            rows={rows}
            gridTemplate={GRID_TEMPLATE}
            minWidth="990px"
            showPagination
            pages={pages}
            empty={rows.length === 0}
            emptyText="검색 결과가 없습니다"
            emptyActionLabel="필터 초기화"
            emptyActionClick={clearAll}
          />
        </div>
      </div>

      {selected && (
        <CreditTermsDetailDrawer
          key={selected.code}
          company={selected}
          onClose={() => setOpenCode(null)}
          onChangeLimit={handleChangeLimit}
          onAddMemo={handleAddMemo}
        />
      )}
    </div>
  );
}
