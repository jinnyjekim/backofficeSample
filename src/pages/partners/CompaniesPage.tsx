import { useMemo, useRef, useState } from 'react';
import styles from './CompaniesPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  COMPANIES,
  COMPANY_STATUSES,
  GRADE_META,
  QUICK_FILTER_LABELS,
  STATUS_META,
  fmtWon,
  type Company,
  type CompanyStatus,
} from './companiesData';
import { CompanyDetailDrawer } from './CompanyDetailDrawer';

const GRID_TEMPLATE = '88px minmax(160px,1.3fr) 120px 88px 92px 60px 84px 92px 104px 88px 60px';
const COLUMN_LABELS = ['회사코드', '회사명', '사업자번호', '회사유형', '거래상태', '등급', '담당자', '최근거래일', '미수금', '등록일', '관리'];
const SEARCH_SCOPES = ['전체', '회사명', '회사코드', '사업자등록번호', '대표자명', '담당자명'];

export function CompaniesPage() {
  const [data, setData] = useState<Company[]>(COMPANIES);
  const [statusFilter, setStatusFilter] = useState<string>('전체');
  const [q, setQ] = useState('');
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showRegister, setShowRegister] = useState(false);

  const registerAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(registerAsideRef, () => setShowRegister(false));

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: data.length };
    COMPANY_STATUSES.forEach((st) => {
      c[st] = data.filter((r) => r.status === st).length;
    });
    return c;
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((c) => {
      if (statusFilter !== '전체' && c.status !== statusFilter) return false;
      if (q && !(c.name.includes(q) || c.code.includes(q))) return false;
      return true;
    });
  }, [data, statusFilter, q]);

  const quickFilters = QUICK_FILTER_LABELS.map((label) => ({
    label,
    count: counts[label] ?? 0,
    active: statusFilter === label,
  }));

  const gridColumns: GridColumn[] = COLUMN_LABELS.map((label) => ({ label }));

  const rows: GridRow[] = filtered.map((c) => {
    const sm = STATUS_META[c.status];
    const gm = GRADE_META[c.grade];
    return {
      id: c.code,
      onClick: () => setOpenCode(c.code),
      cells: [
        { kind: 'text', text: c.code, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
        { kind: 'titleWarn', title: c.name, hasIssue: c.issues.length > 0, issueTitle: c.issues.join(', ') },
        { kind: 'text', text: c.bizNo, color: '#8b8b93', size: '12px', weight: 500, numeric: true },
        { kind: 'text', text: c.type, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'badge', text: c.status, bg: sm.bg, fg: sm.fg },
        { kind: 'badgeSquare', text: c.grade, bg: gm.bg, fg: gm.fg },
        { kind: 'text', text: c.manager, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'text', text: c.lastDeal, color: '#52525b', size: '12px', weight: 500, numeric: true },
        {
          kind: 'text',
          text: c.receivable > 0 ? fmtWon(c.receivable) : '0원',
          color: c.receivable > 0 ? '#dc2626' : '#71717a',
          size: '12px',
          weight: 600,
          numeric: true,
        },
        { kind: 'text', text: c.registered, color: '#8b8b93', size: '12px', weight: 500, numeric: true },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));

  function clearAll() {
    setStatusFilter('전체');
    setQ('');
  }

  function handleStatusChange(code: string, status: CompanyStatus) {
    setData((prev) => prev.map((c) => (c.code === code ? { ...c, ...({ status } as Partial<Company>) } : c)));
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
            <div className={styles.title}>회사 관리</div>
            <div className={styles.subtitle}>등록된 거래처 회사와 거래 상태를 관리합니다.</div>
          </div>
          <button type="button" className={styles.registerBtn} onClick={() => setShowRegister(true)}>
            ＋ 회사 등록
          </button>
        </div>

        <div className={styles.quickFilters}>
          {quickFilters.map((qf) => (
            <button
              key={qf.label}
              type="button"
              className={`${styles.quickFilterBtn} ${qf.active ? styles.active : ''}`}
              onClick={() => setStatusFilter(qf.label)}
            >
              <span className={styles.quickFilterLabel}>{qf.label}</span>
              <span className={styles.quickFilterCount}>{qf.count}</span>
            </button>
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
              placeholder="검색어를 입력하세요"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow}>
            <label className="globalFilterField"><span>거래상태</span><select aria-label="거래상태" className={styles.smallSelect} defaultValue="거래상태 전체">
              <option>거래상태 전체</option>
              <option>거래중</option>
              <option>거래대기</option>
              <option>거래중지</option>
              <option>거래종료</option>
            </select></label>
            <label className="globalFilterField"><span>회사유형</span><select aria-label="회사유형" className={styles.smallSelect} defaultValue="회사유형 전체">
              <option>회사유형 전체</option>
              <option>법인</option>
              <option>개인사업자</option>
            </select></label>
            <label className="globalFilterField"><span>거래등급</span><select aria-label="거래등급" className={styles.smallSelect} defaultValue="거래등급 전체">
              <option>거래등급 전체</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select></label>
            <label className="globalFilterField"><span>내부담당자</span><select aria-label="내부담당자" className={styles.smallSelect} defaultValue="내부담당자 전체">
              <option>내부담당자 전체</option>
              <option>admin1</option>
              <option>admin2</option>
              <option>admin3</option>
            </select></label>
            <button type="button" className={styles.moreFilterBtn}>상세 필터 ＋</button>
            <div className={styles.spacer} />
            <button type="button" className={styles.clearBtn} onClick={clearAll}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}개 회사</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn} data-grid-download>↓ 다운로드</button>
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
            minWidth="1080px"
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
        <CompanyDetailDrawer
          key={selected.code}
          company={selected}
          onClose={() => setOpenCode(null)}
          onStatusChange={handleStatusChange}
          onAddMemo={handleAddMemo}
        />
      )}

      {showRegister && (
        <aside ref={registerAsideRef} className={styles.registerAside}>
          <div className={styles.registerHead}>
            <span className={styles.registerTitle}>회사 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <div className={styles.formSectionTitle}>기본 정보</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                회사명 *<input className={styles.formInput} />
              </label>
              <label className={styles.formLabel}>
                회사코드 *<input className={styles.formInput} />
              </label>
              <label className={styles.formLabel}>
                회사 유형 *
                <select className={styles.formInput}>
                  <option>법인</option>
                  <option>개인사업자</option>
                </select>
              </label>
              <label className={styles.formLabel}>
                거래 상태
                <select className={styles.formInput}>
                  <option>거래대기</option>
                  <option>거래중</option>
                </select>
              </label>
            </div>

            <div className={styles.formSectionTitle}>사업자 정보</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                사업자등록번호 *<input className={styles.formInput} />
              </label>
              <label className={styles.formLabel}>
                대표자명<input className={styles.formInput} />
              </label>
              <div className={styles.formRow}>
                <label className={styles.formLabelFlex}>
                  업태<input className={styles.formInput} />
                </label>
                <label className={styles.formLabelFlex}>
                  종목<input className={styles.formInput} />
                </label>
              </div>
            </div>

            <div className={styles.formSectionTitle}>연락처</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                대표 전화<input className={styles.formInput} />
              </label>
              <label className={styles.formLabel}>
                대표 이메일<input className={styles.formInput} />
              </label>
            </div>

            <div className={styles.formSectionTitle}>주소</div>
            <div className={styles.formGroup}>
              <div className={styles.formRow}>
                <input className={styles.zipInput} placeholder="우편번호" />
                <button type="button" className={styles.addrSearchBtn}>주소검색</button>
              </div>
              <input className={styles.formInput} placeholder="기본주소" />
              <input className={styles.formInput} placeholder="상세주소" />
            </div>
          </div>
          <div className={styles.registerFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowRegister(false)}>취소</button>
            <button type="button" className={styles.submitBtn} onClick={() => setShowRegister(false)}>등록</button>
          </div>
        </aside>
      )}
    </div>
  );
}
