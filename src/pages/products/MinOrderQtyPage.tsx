import { useMemo, useState } from 'react';
import styles from './MinOrderQtyPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  MOQ_ITEMS,
  QUICK_FILTER_LABELS,
  STATUS_META,
  issueOf,
  moqFilterCount,
  type MoqItem,
} from './minOrderQtyData';
import { buildMoqDetail } from './minOrderQtyDetail';
import { MinOrderQtyDetailDrawer } from './MinOrderQtyDetailDrawer';

const GRID_TEMPLATE = '1.1fr 1fr 100px 90px 90px 90px 110px 78px 60px';
const TYPE_FILTERS = ['조건유형 전체', '기본 MOQ', '거래처별 MOQ', '계약 MOQ'];

const BULK_PRODUCTS = [
  { name: '상품명 01', base: '10개' },
  { name: '상품명 02', base: '100개' },
  { name: '상품명 03', base: '100개' },
  { name: '상품명 05', base: '20개' },
];

export function MinOrderQtyPage() {
  const [data, setData] = useState<MoqItem[]>(MOQ_ITEMS);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [typeFilter, setTypeFilter] = useState('조건유형 전체');
  const [view, setView] = useState<'product' | 'partner'>('product');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [showRegister, setShowRegister] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showChangePanel, setShowChangePanel] = useState(false);
  const [showEndPanel, setShowEndPanel] = useState(false);
  const [newMoq, setNewMoq] = useState('');
  const [newMultiple, setNewMultiple] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return data.filter((it) => {
      if (statusFilter === '기본조건' && it.type !== '기본 MOQ') return false;
      if (statusFilter === '개별조건' && it.type === '기본 MOQ') return false;
      if (statusFilter === '변경예정' && !it.scheduled) return false;
      if (statusFilter === '이슈' && issueOf(it).length === 0) return false;
      if (typeFilter !== '조건유형 전체' && it.type !== typeFilter) return false;
      if (q && !(it.name.includes(q) || it.code.includes(q) || it.partner.includes(q))) return false;
      return true;
    });
  }, [data, statusFilter, typeFilter, q]);

  const quickFilters = QUICK_FILTER_LABELS.map((label) => ({
    label,
    count: moqFilterCount(label, data),
    active: statusFilter === label,
  }));

  const isProductView = view === 'product';
  const columns: GridColumn[] = [
    { label: isProductView ? '상품' : '거래처' },
    { label: isProductView ? '적용대상' : '상품' },
    { label: '조건유형' },
    { label: '최소수량', align: 'right' },
    { label: '주문단위', align: 'right' },
    { label: '최대수량', align: 'right' },
    { label: '적용기간' },
    { label: '상태' },
    { label: '관리' },
  ];

  function openRow(it: MoqItem) {
    setSelectedId(it.id);
    setActiveTab('basic');
    setShowRegister(false);
    setShowChangePanel(false);
    setShowEndPanel(false);
    setNewMoq(String(it.moq));
    setNewMultiple(String(it.multiple));
  }

  const rows: GridRow[] = filtered.map((it) => {
    const sm = STATUS_META[it.status];
    const iss = issueOf(it);
    const lead = isProductView ? it.name : it.partner;
    const leadCode = isProductView ? it.code : it.partnerCode;
    const second = isProductView ? it.partner : it.name;
    return {
      id: it.id,
      onClick: () => openRow(it),
      cells: [
        { kind: 'stack', title: lead, subtitle: iss.length > 0 ? `${leadCode} ⚠ ${iss.join(', ')}` : leadCode },
        { kind: 'text', text: second, color: '#3f3f46', size: '12.5px', weight: 500 },
        { kind: 'text', text: it.type, color: '#52525b', size: '11.5px', weight: 500 },
        { kind: 'text', text: `${it.moq}개`, color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
        { kind: 'text', text: `${it.multiple}개`, color: '#52525b', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: it.max ? `${it.max}개` : '제한없음', color: '#52525b', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: it.period, color: '#71717a', size: '11px', weight: 500, numeric: true },
        { kind: 'badge', text: it.status, bg: sm.bg, fg: sm.fg },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));

  function clearAll() {
    setStatusFilter('전체');
    setTypeFilter('조건유형 전체');
    setQ('');
  }

  const selected = selectedId ? data.find((it) => it.id === selectedId) ?? null : null;
  const baseline = selected ? data.find((it) => it.code === selected.code && it.type === '기본 MOQ') : undefined;
  const detail = selected ? buildMoqDetail(selected, baseline) : null;

  const newMoqNum = parseInt(newMoq, 10) || (selected ? selected.moq : 0);
  const newMultipleNum = parseInt(newMultiple, 10) || (selected ? selected.multiple : 0);
  const showMultipleWarning = newMultipleNum > 0 && newMoqNum % newMultipleNum !== 0;

  function confirmChange() {
    if (!selected) return;
    setData((prev) => prev.map((it) => (it.id === selected.id ? { ...it, moq: newMoqNum, multiple: newMultipleNum } : it)));
    setShowChangePanel(false);
  }

  function confirmEnd() {
    if (!selected) return;
    setData((prev) => prev.map((it) => (it.id === selected.id ? { ...it, status: '종료' } : it)));
    setShowEndPanel(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.title}>최소수량 관리</div>
            <div className={styles.subtitle}>상품 및 거래처별 최소 주문수량과 주문 단위를 관리합니다.</div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setShowBulk(true);
                setShowRegister(false);
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
              ＋ 최소수량 등록
            </button>
          </div>
        </div>

        <div className={styles.viewToggleRow}>
          <div className={styles.quickFilters} style={{ marginBottom: 0 }}>
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
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${isProductView ? styles.active : ''}`}
              onClick={() => setView('product')}
            >
              상품 기준
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${!isProductView ? styles.active : ''}`}
              onClick={() => setView('partner')}
            >
              거래처 기준
            </button>
          </div>
        </div>

        <div className={styles.filterBox}>
          <div className={styles.searchRow}>
            <select className={styles.selectField} defaultValue="전체">
              <option>전체</option>
              <option>상품명</option>
              <option>상품코드</option>
              <option>거래처명</option>
              <option>거래처코드</option>
            </select>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="상품명 또는 상품코드"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow}>
            <select
              className={styles.smallSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_FILTERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select className={styles.smallSelect} defaultValue="거래처 전체">
              <option>거래처 전체</option>
              <option>회사 01</option>
              <option>회사 02</option>
              <option>㈜한빛물산</option>
            </select>
            <select className={styles.smallSelect} defaultValue="카테고리 전체">
              <option>카테고리 전체</option>
              <option>카테고리 01</option>
              <option>카테고리 02</option>
              <option>카테고리 03</option>
            </select>
            <button type="button" className={styles.dashedBtn}>상세 필터 ＋</button>
            <div className={styles.spacer} />
            <button type="button" className={styles.resetBtn} onClick={clearAll}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
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
          columns={columns}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1140px"
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="등록된 최소수량 조건이 없습니다"
          emptySubtext="상품별 최소 주문 조건을 설정할 수 있습니다."
          emptyActionLabel="＋ 최소수량 등록"
          emptyActionClick={() => {
            setShowRegister(true);
            setSelectedId(null);
          }}
        />
      </div>

      {detail && !showRegister && (
        <MinOrderQtyDetailDrawer
          key={detail.id}
          detail={detail}
          tab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedId(null)}
          showChangePanel={showChangePanel}
          onToggleChange={() => {
            setShowChangePanel((v) => !v);
            setShowEndPanel(false);
          }}
          newMoq={newMoq}
          onNewMoqChange={setNewMoq}
          newMultiple={newMultiple}
          onNewMultipleChange={setNewMultiple}
          showMultipleWarning={showMultipleWarning}
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
        <aside className={styles.registerAside}>
          <div className={styles.registerHead}>
            <span className={styles.registerTitle}>최소수량 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              조건 유형 *
              <select className={styles.formInput}>
                <option>기본 최소수량</option>
                <option>거래처별 최소수량</option>
                <option>거래처 그룹 최소수량</option>
                <option>계약 최소수량</option>
              </select>
            </label>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              상품 *<input className={styles.formInput} placeholder="상품명 또는 상품코드 검색" />
            </label>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              적용 대상<input className={styles.formInput} placeholder="전체 거래처" />
            </label>

            <div className={styles.formRow} style={{ marginBottom: 6 }}>
              <label className={styles.formLabelFlex}>
                최소 주문수량 *<input className={styles.formInput} placeholder="개" />
              </label>
              <label className={styles.formLabelFlex}>
                주문 단위 *<input className={styles.formInput} placeholder="개" />
              </label>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className={styles.radioLabel}>
                <input type="checkbox" />최대 주문수량 제한 없음
              </label>
              <input className={styles.formInput} style={{ marginTop: 8 }} placeholder="최대 주문수량(개)" />
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

            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 6 }}>
              변경 사유 *
              <select className={styles.formInput}>
                <option>거래 조건 변경</option>
                <option>가격 정책 변경</option>
                <option>포장 단위 변경</option>
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
        <aside className={styles.bulkAside}>
          <div className={styles.registerHead}>
            <span className={styles.registerTitle}>최소수량 대량 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowBulk(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              적용 대상 거래처 *<input className={styles.formInput} defaultValue="회사 01" placeholder="거래처 검색" />
            </label>

            <div className={styles.miniTable} style={{ marginBottom: 14 }}>
              <div className={styles.miniHeadRow} style={{ gridTemplateColumns: '1fr 80px 90px 90px' }}>
                <span>상품</span>
                <span style={{ textAlign: 'right' }}>기본 MOQ</span>
                <span style={{ textAlign: 'right' }}>개별 MOQ</span>
                <span style={{ textAlign: 'right' }}>주문단위</span>
              </div>
              {BULK_PRODUCTS.map((b) => (
                <div className={styles.bulkMoqRow} key={b.name}>
                  <span style={{ fontSize: '12.5px', color: '#18181b' }}>{b.name}</span>
                  <span style={{ fontSize: '12px', color: '#71717a', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.base}</span>
                  <input className={styles.bulkPriceInput} placeholder="MOQ" />
                  <input className={styles.bulkPriceInput} placeholder="단위" />
                </div>
              ))}
            </div>

            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              적용일<input className={styles.formInput} placeholder="2026.09.01" />
            </label>
          </div>
          <div className={styles.registerFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowBulk(false)}>취소</button>
            <button type="button" className={styles.submitBtn} onClick={() => setShowBulk(false)}>등록 검토</button>
          </div>
        </aside>
      )}
    </div>
  );
}
