import { useMemo, useRef, useState } from 'react';
import styles from './PartnerPricingPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  PARTNER_PRICES,
  QUICK_FILTER_LABELS,
  STATUS_META,
  fmtWon,
  issueOf,
  partnerPricingCount,
  type PartnerPrice,
} from './partnerPricingData';
import { buildPartnerPricingDetail } from './partnerPricingDetail';
import { PartnerPricingDetailDrawer } from './PartnerPricingDetailDrawer';

const GRID_TEMPLATE = '1.1fr 1fr 100px 100px 120px 110px 90px 78px 60px';
const BASIS_FILTERS = ['가격 기준 전체', '개별 가격', '기본가 사용', '계약 적용'];

const BULK_PRODUCTS = [
  { name: '상품명 01', base: '32,000원' },
  { name: '상품명 02', base: '18,000원' },
  { name: '상품명 03', base: '120,000원' },
  { name: '상품명 05', base: '64,000원' },
];

export function PartnerPricingPage() {
  const [data, setData] = useState<PartnerPrice[]>(PARTNER_PRICES);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [basisFilter, setBasisFilter] = useState('가격 기준 전체');
  const [view, setView] = useState<'partner' | 'product'>('partner');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showRegister, setShowRegister] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
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
      if (statusFilter === '가격 이슈') {
        if (issueOf(p).length === 0) return false;
      } else if (statusFilter !== '전체' && p.status !== statusFilter) {
        return false;
      }
      if (basisFilter !== '가격 기준 전체' && p.basis !== basisFilter) return false;
      if (q && !(p.name.includes(q) || p.code.includes(q) || p.partner.includes(q))) return false;
      return true;
    });
  }, [data, statusFilter, basisFilter, q]);

  const quickFilters = QUICK_FILTER_LABELS.map((label) => ({
    label,
    count: partnerPricingCount(label, data),
    active: statusFilter === label,
  }));

  const isPartnerView = view === 'partner';
  const columns: GridColumn[] = [
    { label: isPartnerView ? '거래처' : '상품' },
    { label: isPartnerView ? '상품' : '거래처' },
    { label: '기본 공급가', align: 'right' },
    { label: '거래처 가격', align: 'right' },
    { label: '차이', align: 'right' },
    { label: '적용기간' },
    { label: '가격 근거' },
    { label: '상태' },
    { label: '관리' },
  ];

  function openRow(id: string, price: number) {
    setSelectedId(id);
    setActiveTab('info');
    setShowRegister(false);
    setShowChangePanel(false);
    setShowEndPanel(false);
    setNewPrice(String(price));
  }

  const rows: GridRow[] = filtered.map((p) => {
    const sm = STATUS_META[p.status];
    const diff = p.price - p.basePrice;
    const diffPct = p.basePrice ? (diff / p.basePrice) * 100 : 0;
    const iss = issueOf(p);
    const lead = isPartnerView ? p.partner : p.name;
    const leadCode = isPartnerView ? p.partnerCode : p.code;
    const second = isPartnerView ? p.name : p.partner;
    const diffLabel = `${diff >= 0 ? '+' : ''}${diff.toLocaleString('ko-KR')} (${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%)`;
    const diffFg = diff < 0 ? '#dc2626' : diff > 0 ? '#059669' : '#71717a';
    return {
      id: p.id,
      onClick: () => openRow(p.id, p.price),
      cells: [
        { kind: 'stack', title: lead, subtitle: iss.length > 0 ? `${leadCode} ⚠ ${iss.join(', ')}` : leadCode },
        { kind: 'text', text: second, color: '#3f3f46', size: '12.5px', weight: 500 },
        { kind: 'text', text: fmtWon(p.basePrice), color: '#52525b', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: fmtWon(p.price), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
        { kind: 'text', text: diffLabel, color: diffFg, size: '11.5px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: p.period, color: '#71717a', size: '11px', weight: 500, numeric: true },
        { kind: 'text', text: p.basis, color: '#52525b', size: '11px', weight: 500 },
        { kind: 'badge', text: p.status, bg: sm.bg, fg: sm.fg },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));

  function clearAll() {
    setStatusFilter('전체');
    setBasisFilter('가격 기준 전체');
    setQ('');
  }

  const selected = selectedId ? data.find((p) => p.id === selectedId) ?? null : null;
  const detail = selected ? buildPartnerPricingDetail(selected) : null;

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
            <div className={styles.title}>거래처별 가격</div>
            <div className={styles.subtitle}>거래처와 상품별 개별 적용 가격을 관리합니다.</div>
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
              ＋ 거래처별 가격 등록
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
              className={`${styles.viewToggleBtn} ${isPartnerView ? styles.active : ''}`}
              onClick={() => setView('partner')}
            >
              거래처 기준
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${!isPartnerView ? styles.active : ''}`}
              onClick={() => setView('product')}
            >
              상품 기준
            </button>
          </div>
        </div>

        <div className={styles.filterBox}>
          <div className={styles.searchRow}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectField} defaultValue="전체">
              <option>전체</option>
              <option>거래처명</option>
              <option>거래처코드</option>
              <option>상품명</option>
              <option>상품코드</option>
            </select></label>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="거래처명 또는 상품명"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow}>
            <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.smallSelect} defaultValue="거래처 전체">
              <option>거래처 전체</option>
              <option>회사 01</option>
              <option>회사 02</option>
              <option>㈜한빛물산</option>
              <option>대성유통</option>
            </select></label>
            <label className="globalFilterField"><span>카테고리</span><select aria-label="카테고리" className={styles.smallSelect} defaultValue="카테고리 전체">
              <option>카테고리 전체</option>
              <option>카테고리 01</option>
              <option>카테고리 02</option>
              <option>카테고리 03</option>
            </select></label>
            <label className="globalFilterField"><span>가격 기준</span><select aria-label="가격 기준"
              className={styles.smallSelect}
              value={basisFilter}
              onChange={(e) => setBasisFilter(e.target.value)}
            >
              {BASIS_FILTERS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select></label>
            <button type="button" className={styles.dashedBtn}>상세 필터 ＋</button>
            <div className={styles.spacer} />
            <button type="button" className={styles.resetBtn} onClick={clearAll}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn} data-grid-download>↓ 다운로드</button>
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
          minWidth="1180px"
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="등록된 거래처별 가격이 없습니다"
          emptySubtext="필요한 거래처에 개별 가격을 설정할 수 있습니다."
          emptyActionLabel="＋ 거래처별 가격 등록"
          emptyActionClick={() => {
            setShowRegister(true);
            setSelectedId(null);
          }}
        />
      </div>

      {detail && !showRegister && (
        <PartnerPricingDetailDrawer
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
            <span className={styles.registerTitle}>거래처별 가격 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              거래처 *<input className={styles.formInput} placeholder="거래처 검색" />
            </label>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 8 }}>
              상품 *<input className={styles.formInput} placeholder="상품명 또는 상품코드 검색" />
            </label>

            <div className={styles.baseNoteBox}>
              <span>기본 공급가</span>
              <span style={{ color: '#18181b', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>32,000원</span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div className={styles.radioGroupLabel}>가격 입력 방식</div>
              <div className={styles.radioRow}>
                <label className={styles.radioLabel}><input type="radio" name="priceMode" defaultChecked />금액 지정</label>
                <label className={styles.radioLabel}><input type="radio" name="priceMode" />할인율 지정</label>
              </div>
            </div>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 6 }}>
              거래처 적용 가격 *<input className={styles.formInput} placeholder="원" />
            </label>
            <div className={styles.priceModeNote}>기본가 대비 -3,000원 (-9.4%)</div>

            <div style={{ marginBottom: 14 }}>
              <div className={styles.radioGroupLabel}>가격 방식</div>
              <div className={styles.radioRow}>
                <label className={styles.radioLabel}><input type="radio" name="fixMode" defaultChecked />고정 가격</label>
                <label className={styles.radioLabel}><input type="radio" name="fixMode" />기본 공급가 연동</label>
              </div>
            </div>

            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              최소 주문수량<input className={styles.formInput} />
            </label>

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
                <option>계약 조건 변경</option>
                <option>거래조건 변경</option>
                <option>가격 정책 변경</option>
                <option>프로모션</option>
                <option>기타</option>
              </select>
            </label>

            <div className={styles.formSectionTitle} style={{ margin: '14px 0 6px' }}>관리자 메모</div>
            <textarea className={styles.textarea} style={{ height: 70 }} placeholder="메모를 입력하세요" />
          </div>
          <div className={styles.registerFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowRegister(false)}>취소</button>
            <button type="button" className={styles.submitBtn} onClick={() => setShowRegister(false)}>가격 등록</button>
          </div>
        </aside>
      )}

      {showBulk && (
        <aside ref={bulkAsideRef} className={styles.bulkAside}>
          <div className={styles.registerHead}>
            <span className={styles.registerTitle}>거래처별 가격 대량 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowBulk(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              거래처 *<input className={styles.formInput} defaultValue="회사 01" placeholder="거래처 검색" />
            </label>

            <div className={styles.miniTable} style={{ marginBottom: 14 }}>
              <div className={styles.miniHeadRow} style={{ gridTemplateColumns: '1fr 100px 110px' }}>
                <span>상품</span>
                <span style={{ textAlign: 'right' }}>기본 공급가</span>
                <span style={{ textAlign: 'right' }}>적용 가격</span>
              </div>
              {BULK_PRODUCTS.map((b) => (
                <div className={styles.bulkPartnerRow} key={b.name}>
                  <span style={{ fontSize: '12.5px', color: '#18181b' }}>{b.name}</span>
                  <span style={{ fontSize: '12px', color: '#71717a', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{b.base}</span>
                  <input className={styles.bulkPriceInput} placeholder="가격" />
                </div>
              ))}
            </div>

            <label className={styles.formLabel} style={{ display: 'block', marginBottom: 14 }}>
              적용 시작일<input className={styles.formInput} placeholder="2026.09.01" />
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
