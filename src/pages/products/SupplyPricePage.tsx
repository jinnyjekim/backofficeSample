import { useMemo, useRef, useState } from 'react';
import styles from './SupplyPricePage.module.css';
import { DataGrid } from '../../components/DataGrid';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { downloadCsvFile } from '../../lib/useGridDownload';
import type { GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  SUPPLY_PRICES,
  QUICK_FILTER_LABELS,
  STATUS_META,
  fmtWon,
  supplyPriceStatusCount,
  type SupplyPrice,
} from './supplyPriceData';
import { buildSupplyPriceDetail } from './supplyPriceDetail';
import { SupplyPriceDetailDrawer } from './SupplyPriceDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = '1.2fr 92px 74px 74px 48px 140px 78px 70px 60px';
const COLUMNS: GridColumn[] = [
  { label: '상품' },
  { label: '가격유형' },
  { label: '적용대상' },
  { label: '공급가', align: 'right' },
  { label: '최소수량', align: 'right' },
  { label: '적용기간' },
  { label: '상태' },
  { label: '수정일' },
  { label: '관리' },
];

const TYPE_FILTERS = ['가격유형 전체', '기본 공급가', '거래처별 공급가', '수량구간 공급가', '계약 공급가'];

export function SupplyPricePage() {
  const [data, setData] = useState<SupplyPrice[]>(SUPPLY_PRICES);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('가격유형 전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [showRegister, setShowRegister] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkValidated, setBulkValidated] = useState(false);
  const [showChangePanel, setShowChangePanel] = useState(false);
  const [showEndPanel, setShowEndPanel] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [page, setPage] = useState(1);

  const registerAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(registerAsideRef, () => setShowRegister(false));
  const bulkAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(bulkAsideRef, () => setShowBulk(false));

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (statusFilter !== '전체' && p.status !== statusFilter) return false;
      if (typeFilter !== '가격유형 전체' && p.priceType !== typeFilter) return false;
      if (q && !(p.name.includes(q) || p.code.includes(q) || p.target.includes(q))) return false;
      return true;
    });
  }, [data, statusFilter, typeFilter, q]);

  const quickFilters = QUICK_FILTER_LABELS.map((label) => ({
    label,
    count: supplyPriceStatusCount(label, data),
    active: statusFilter === label,
  }));

  function openRow(id: string, price: number) {
    setSelectedId(id);
    setActiveTab('basic');
    setShowRegister(false);
    setShowChangePanel(false);
    setShowEndPanel(false);
    setNewPrice(String(price));
  }

  const rows: GridRow[] = filtered.map((p) => {
    const sm = STATUS_META[p.status];
    const hasIssue = p.status === '가격 미설정';
    return {
      id: p.id,
      onClick: () => openRow(p.id, p.price),
      cells: [
        { kind: 'stack', title: p.name, subtitle: hasIssue ? `${p.code} ⚠ 가격 미설정` : p.code },
        { kind: 'text', text: p.priceType, color: '#52525b', size: '11.5px', weight: 500 },
        { kind: 'text', text: p.target, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: hasIssue ? '미설정' : fmtWon(p.price), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
        { kind: 'text', text: p.minQty ? String(p.minQty) : '-', color: '#52525b', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: p.period, color: '#71717a', size: '11px', weight: 500, numeric: true },
        { kind: 'badge', text: p.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: p.updated, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));

  function clearAll() {
    setStatusFilter('전체');
    setTypeFilter('가격유형 전체');
    setQ('');
  }

  const selected = selectedId ? data.find((p) => p.id === selectedId) ?? null : null;
  const detail = selected ? buildSupplyPriceDetail(selected) : null;

  const newP = parseInt(newPrice, 10) || (selected ? selected.price : 0);
  const changeDiff = selected ? newP - selected.price : 0;
  const changePct = selected && selected.price ? (changeDiff / selected.price) * 100 : 0;
  const diffLabel = `${changeDiff >= 0 ? '+' : ''}${changeDiff.toLocaleString('ko-KR')}원 (${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%)`;
  const diffFg = changeDiff < 0 ? '#dc2626' : changeDiff > 0 ? '#059669' : '#71717a';

  function confirmChange() {
    if (!selected) return;
    setData((prev) => prev.map((p) => (p.id === selected.id ? { ...p, price: newP } : p)));
    setShowChangePanel(false);
  }

  function confirmEnd() {
    if (!selected) return;
    setData((prev) => prev.map((p) => (p.id === selected.id ? { ...p, status: '종료' } : p)));
    setShowEndPanel(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.title}>공급가 관리</div>
            <div className={styles.subtitle}>상품별 공급 기준가와 거래처별 적용 단가를 관리합니다.</div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setShowBulk(true);
                setShowRegister(false);
                setBulkValidated(false);
              }}
            >
              대량 등록
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setShowRegister(true);
                setSelectedId(null);
                setShowBulk(false);
              }}
            >
              ＋ 공급가 등록
            </button>
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

        <div className={styles.filterBox}>
          <div className={styles.searchRow}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectField} defaultValue="전체">
              <option>전체</option>
              <option>상품명</option>
              <option>상품코드</option>
              <option>거래처명</option>
              <option>거래처코드</option>
              <option>가격 정책명</option>
            </select></label>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="상품명, 상품코드 또는 거래처명"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow}>
            <label className="globalFilterField"><span>유형</span><select aria-label="유형"
              className={styles.smallSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select></label>
            <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.smallSelect} defaultValue="거래처 전체">
              <option>거래처 전체</option>
              <option>회사 01</option>
              <option>회사 02</option>
              <option>㈜한빛물산</option>
            </select></label>
            <label className="globalFilterField"><span>카테고리</span><select aria-label="카테고리" className={styles.smallSelect} defaultValue="카테고리 전체">
              <option>카테고리 전체</option>
              <option>카테고리 01</option>
              <option>카테고리 02</option>
              <option>카테고리 03</option>
            </select></label>
            <label className="globalFilterField"><span>통화</span><select aria-label="통화" className={styles.smallSelect} defaultValue="통화 전체">
              <option>통화 전체</option>
              <option>KRW</option>
              <option>USD</option>
            </select></label>
            <div className={styles.spacer} />
            <button type="button" className={styles.resetBtn} onClick={clearAll}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
              <option>100개씩 보기</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="960px"
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="등록된 공급가가 없습니다"
          emptySubtext="상품의 공급 가격을 등록해 주세요."
          emptyActionLabel="＋ 공급가 등록"
          emptyActionClick={() => {
            setShowRegister(true);
            setSelectedId(null);
          }}
        />
      </div>

      {detail && !showRegister && (
        <SupplyPriceDetailDrawer
          key={detail.priceId}
          detail={detail}
          tab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          showChangePanel={showChangePanel}
          onToggleChange={() => {
            setShowChangePanel((v) => !v);
            setShowEndPanel(false);
          }}
          newPrice={newPrice}
          onNewPriceChange={setNewPrice}
          diffLabel={diffLabel}
          diffFg={diffFg}
          onConfirmChange={confirmChange}
          showEndPanel={showEndPanel}
          onToggleEnd={() => {
            setShowEndPanel((v) => !v);
            setShowChangePanel(false);
          }}
          onConfirmEnd={confirmEnd}
        />
      )}

      {showRegister && (
        <aside ref={registerAsideRef} className={styles.registerAside}>
          <div className={styles.registerHead}>
            <span className={styles.registerTitle}>공급가 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              가격 유형 *
              <select className={styles.formInput}>
                <option>거래처별 공급가</option>
                <option>기본 공급가</option>
                <option>거래처 그룹 공급가</option>
                <option>수량구간 공급가</option>
                <option>계약 공급가</option>
              </select>
            </label>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              상품 *<input className={styles.formInput} placeholder="상품명 또는 상품코드 검색" />
            </label>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              적용 대상 *<input className={styles.formInput} placeholder="거래처 검색" />
            </label>

            <div className={styles.formRow} style={{ marginBottom: 14 }}>
              <label className={styles.formLabelFlex}>
                공급가 *<input className={styles.formInput} placeholder="원" />
              </label>
              <label className={styles.formLabelFlex}>
                최소 주문수량<input className={styles.formInput} />
              </label>
            </div>

            <div className={styles.formSectionTitle}>적용 기간 *</div>
            <div className={styles.formRow} style={{ alignItems: 'center', marginBottom: 14 }}>
              <input className={styles.formInput} style={{ marginTop: 0, flex: 1 }} placeholder="2026.08.15" />
              <span style={{ color: '#a1a1aa', fontSize: '12px' }}>~</span>
              <input className={styles.formInput} style={{ marginTop: 0, flex: 1 }} placeholder="종료일" />
              <label className={styles.radioLabel} style={{ whiteSpace: 'nowrap' }}>
                <input type="checkbox" defaultChecked />없음
              </label>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div className={styles.radioGroupLabel}>적용 방식</div>
              <div className={styles.radioRow}>
                <label className={styles.radioLabel}><input type="radio" name="applyMode" defaultChecked />즉시</label>
                <label className={styles.radioLabel}><input type="radio" name="applyMode" />예약</label>
              </div>
            </div>

            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 6 }}>
              변경 사유 *
              <select className={styles.formInput}>
                <option>계약 변경</option>
                <option>거래조건 변경</option>
                <option>원가 변경</option>
                <option>가격 정책 변경</option>
                <option>프로모션</option>
                <option>오류 정정</option>
                <option>기타</option>
              </select>
            </label>

            <div className={styles.formSectionTitle} style={{ margin: '14px 0 6px' }}>관리자 메모</div>
            <textarea className={styles.textarea} style={{ height: 70 }} placeholder="메모를 입력하세요" />
          </div>
          <div className={styles.registerFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowRegister(false)}>취소</button>
            <button type="button" className={styles.submitBtn} onClick={() => setShowRegister(false)}>등록</button>
          </div>
        </aside>
      )}

      {showBulk && (
        <aside ref={bulkAsideRef} className={styles.bulkAside}>
          <div className={styles.registerHead}>
            <span className={styles.registerTitle}>공급가 대량 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowBulk(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <div className={styles.bulkSteps}>1. 양식 다운로드 → 2. 공급가 입력 → 3. 파일 업로드 → 4. 검증 → 5. 등록</div>
            <div className={styles.bulkActionsRow}>
              <button type="button" className={styles.bulkDownloadBtn} onClick={() => downloadCsvFile(
                '공급가-대량등록-양식.csv',
                ['상품 ID', '옵션 ID', '가격유형', '적용대상 ID', '공급가', '최소수량', '적용 시작일', '적용 종료일'],
                [['P000001', 'OPT000001', '기본 공급가', '', '', '1', '2026-09-01', '']],
              )}>양식 다운로드</button>
              <button type="button" className={styles.bulkUploadBtn} onClick={() => setBulkValidated(true)}>파일 업로드</button>
            </div>
            {bulkValidated && (
              <div className={styles.bulkResultBox}>
                <div className={styles.bulkResultTitle}>총 500건</div>
                <div className={styles.bulkStatsRow}>
                  <div>
                    <div className={styles.bulkStatLabel}>정상</div>
                    <div className={styles.bulkStatValue} style={{ color: '#059669' }}>482건</div>
                  </div>
                  <div>
                    <div className={styles.bulkStatLabel}>오류</div>
                    <div className={styles.bulkStatValue} style={{ color: '#dc2626' }}>18건</div>
                  </div>
                </div>
                <div className={styles.bulkErrorsTitle}>오류 내역</div>
                <div className={styles.bulkErrorsText}>
                  행 23 · 존재하지 않는 상품코드<br />
                  행 41 · 적용기간 중복<br />
                  행 82 · 공급가 형식 오류
                </div>
              </div>
            )}
          </div>
          <div className={styles.registerFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowBulk(false)}>취소</button>
            <button type="button" className={styles.submitBtn} onClick={() => setShowBulk(false)}>482건 등록</button>
          </div>
        </aside>
      )}
    </div>
  );
}
