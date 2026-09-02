import { useMemo, useRef, useState } from 'react';
import styles from './ContactsPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { CONTACTS, CONTACT_FILTERS, CONTACT_STATUS_META, type Contact, type ContactStatus } from './contactsData';
import { ContactDetailDrawer } from './ContactDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = 'minmax(150px,1.1fr) 82px 82px 66px 106px 134px 60px 46px 80px 60px';
const COLUMN_LABELS = ['담당자', '회사', '부서/직책', '역할', '연락처', '이메일', '상태', '주담당', '수정일', '관리'];
const SEARCH_SCOPES = ['전체', '담당자명', '회사명', '회사코드', '부서명', '이메일', '연락처'];

export function ContactsPage() {
  const [data, setData] = useState<Contact[]>(CONTACTS);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showRegister, setShowRegister] = useState(false);

  const registerAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(registerAsideRef, () => setShowRegister(false));

  const counts = useMemo(
    () => CONTACT_FILTERS.map((f) => (f.match ? data.filter(f.match).length : data.length)),
    [data],
  );

  const filtered = useMemo(() => {
    return data.filter((c) => {
      if (statusFilter !== '전체') {
        const f = CONTACT_FILTERS.find((x) => x.key === statusFilter);
        if (f && f.match && !f.match(c)) return false;
      }
      if (q && !(c.name.includes(q) || c.company.includes(q) || c.companyCode.includes(q) || c.dept.includes(q))) return false;
      return true;
    });
  }, [data, statusFilter, q]);

  const quickFilters = CONTACT_FILTERS.map((f, i) => ({
    label: f.key,
    count: counts[i],
    active: statusFilter === f.key,
  }));

  const gridColumns: GridColumn[] = COLUMN_LABELS.map((label) => ({ label }));

  const rows: GridRow[] = filtered.map((c) => {
    const sm = CONTACT_STATUS_META[c.status];
    return {
      id: c.id,
      onClick: () => setOpenId(c.id),
      cells: [
        { kind: 'stack', title: c.name, subtitle: c.id },
        { kind: 'stack', title: c.company, subtitle: c.companyCode },
        { kind: 'text', text: `${c.dept} / ${c.title}`, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'text', text: c.roles.join(', ') || '-', color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: c.phone, color: '#52525b', size: '12px', weight: 500, numeric: true },
        { kind: 'text', text: c.email, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'statusDot', text: c.status, fg: sm.fg, dot: sm.dot },
        { kind: 'text', text: c.isPrimary ? '주담당' : '-', color: c.isPrimary ? 'oklch(0.52 0.16 258)' : '#c4c4c9', size: '11px', weight: 700 },
        { kind: 'text', text: c.updated, color: '#8b8b93', size: '12px', weight: 500, numeric: true },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));

  function clearAll() {
    setStatusFilter('전체');
    setQ('');
  }

  function togglePrimaryDirect(id: string) {
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, isPrimary: !c.isPrimary } : c)));
  }

  function confirmPrimary(id: string) {
    setData((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target) return prev;
      return prev.map((c) => {
        if (c.id === id) return { ...c, isPrimary: true };
        if (c.company === target.company && c.isPrimary) return { ...c, isPrimary: false };
        return c;
      });
    });
  }

  function setStatus(id: string, status: ContactStatus) {
    setData((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  function addMemo(id: string, text: string) {
    setData((prev) =>
      prev.map((c) => (c.id === id ? { ...c, memos: [{ when: '방금 전', admin: '관리자', text }, ...c.memos] } : c)),
    );
  }

  const selected = openId ? data.find((c) => c.id === openId) ?? null : null;

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.head}>
          <div>
            <div className={styles.title}>담당자 관리</div>
            <div className={styles.subtitle}>거래처 소속 담당자와 연락처 및 담당 역할을 관리합니다.</div>
          </div>
          <button type="button" className={styles.registerBtn} onClick={() => setShowRegister(true)}>
            ＋ 담당자 등록
          </button>
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
              placeholder="검색어를 입력하세요"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow}>
            <label className="globalFilterField"><span>회사</span><select aria-label="회사" className={styles.smallSelect} defaultValue="회사 전체">
              <option>회사 전체</option>
              <option>회사 01</option>
              <option>회사 02</option>
              <option>㈜한빛물산</option>
              <option>원일테크</option>
            </select></label>
            <label className="globalFilterField"><span>담당 역할</span><select aria-label="담당 역할" className={styles.smallSelect} defaultValue="담당 역할 전체">
              <option>담당 역할 전체</option>
              <option>구매</option>
              <option>계약</option>
              <option>회계</option>
              <option>정산</option>
              <option>발주</option>
              <option>납품</option>
            </select></label>
            <label className="globalFilterField"><span>상태</span><select aria-label="상태" className={styles.smallSelect} defaultValue="상태 전체">
              <option>상태 전체</option>
              <option>사용</option>
              <option>미사용</option>
            </select></label>
            <label className="globalFilterField"><span>주담당 여부</span><select aria-label="주담당 여부" className={styles.smallSelect} defaultValue="주담당 여부 전체">
              <option>주담당 여부 전체</option>
              <option>주담당</option>
              <option>일반</option>
            </select></label>
            <div className={styles.spacer} />
            <button type="button" className={styles.clearBtn} onClick={clearAll}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}명</span>
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
            minWidth="850px"
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
        <ContactDetailDrawer
          key={selected.id}
          contact={selected}
          allContacts={data}
          onClose={() => setOpenId(null)}
          onTogglePrimaryDirect={togglePrimaryDirect}
          onConfirmPrimary={confirmPrimary}
          onSetStatus={setStatus}
          onAddMemo={addMemo}
        />
      )}

      {showRegister && (
        <aside ref={registerAsideRef} className={styles.registerAside}>
          <div className={styles.registerHead}>
            <span className={styles.registerTitle}>담당자 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                소속 회사 *
                <input className={styles.formInput} placeholder="회사명 또는 회사코드 검색" />
              </label>
              <label className={styles.formLabel}>
                이름 *<input className={styles.formInput} />
              </label>
              <div className={styles.formRow}>
                <label className={styles.formLabelFlex}>
                  부서<input className={styles.formInput} />
                </label>
                <label className={styles.formLabelFlex}>
                  직책<input className={styles.formInput} />
                </label>
              </div>
              <label className={styles.formLabel}>
                담당 역할 *
                <select className={styles.formInput}>
                  <option>구매</option>
                  <option>계약</option>
                  <option>회계</option>
                  <option>정산</option>
                  <option>발주</option>
                  <option>납품</option>
                  <option>관리</option>
                  <option>기타</option>
                </select>
              </label>
              <label className={styles.formLabel}>
                이메일<input className={styles.formInput} />
              </label>
              <label className={styles.formLabel}>
                연락처<input className={styles.formInput} />
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" />주 담당자로 지정
              </label>
              <div>
                <div className={styles.radioTitle}>사용 상태</div>
                <div className={styles.radioRow}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="usestate" defaultChecked />사용
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="usestate" />미사용
                  </label>
                </div>
              </div>
              <label className={styles.formLabel}>
                관리자 메모<input className={styles.formInput} />
              </label>
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
