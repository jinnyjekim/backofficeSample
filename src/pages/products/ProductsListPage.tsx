import { useMemo, useState } from 'react';
import styles from './ProductsListPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  PRODUCTS,
  QUICK_FILTER_LABELS,
  STATUS_META,
  SUPPLY_FG,
  fmtWon,
  productStatusCount,
  type Product,
} from './productsData';
import { buildProductDetail } from './productDetail';
import { ProductDetailDrawer } from './ProductDetailDrawer';

const GRID_TEMPLATE = '1.3fr 100px 96px 100px 96px 96px 74px 80px 60px';
const COLUMNS: GridColumn[] = [
  { label: '상품' },
  { label: '카테고리' },
  { label: '기본가격', align: 'right' },
  { label: '주문조건' },
  { label: '공급상태' },
  { label: '판매상태' },
  { label: '거래처', align: 'right' },
  { label: '수정일' },
  { label: '관리' },
];

export function ProductsListPage() {
  const [data, setData] = useState<Product[]>(PRODUCTS);
  const [statusFilter, setStatusFilter] = useState('전체');
  const [q, setQ] = useState('');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [showRegister, setShowRegister] = useState(false);
  const [showSaleConfirm, setShowSaleConfirm] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (statusFilter !== '전체' && p.status !== statusFilter) return false;
      if (q && !(p.name.includes(q) || p.code.includes(q))) return false;
      return true;
    });
  }, [data, statusFilter, q]);

  const quickFilters = QUICK_FILTER_LABELS.map((label) => ({
    label,
    count: productStatusCount(label, data),
    active: statusFilter === label,
  }));

  function openRow(code: string) {
    setSelectedCode(code);
    setActiveTab('basic');
    setShowRegister(false);
    setShowSaleConfirm(false);
  }

  const rows: GridRow[] = filtered.map((p) => {
    const sm = STATUS_META[p.status];
    return {
      id: p.code,
      onClick: () => openRow(p.code),
      cells: [
        {
          kind: 'stack',
          title: p.name,
          subtitle: p.issues.length > 0 ? `${p.code} ⚠ ${p.issues.join(', ')}` : p.code,
        },
        { kind: 'text', text: p.category, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'text', text: p.price ? fmtWon(p.price) : '-', color: '#3f3f46', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: p.minQty ? `최소 ${p.minQty}` : '-', color: '#52525b', size: '11.5px', weight: 500 },
        { kind: 'text', text: p.supply, color: SUPPLY_FG[p.supply], size: '11.5px', weight: 600 },
        { kind: 'badge', text: p.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: String(p.partnerCount), color: '#52525b', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: p.updated, color: '#8b8b93', size: '12px', weight: 500, numeric: true },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));

  function clearAll() {
    setStatusFilter('전체');
    setQ('');
  }

  const selected = selectedCode ? data.find((p) => p.code === selectedCode) ?? null : null;
  const detail = selected ? buildProductDetail(selected) : null;

  function toggleSale() {
    if (!selected) return;
    if (selected.status === '판매중') {
      setShowSaleConfirm((v) => !v);
    } else {
      setData((prev) => prev.map((p) => (p.code === selected.code ? { ...p, status: '판매중' } : p)));
    }
  }

  function confirmSale() {
    if (!selected) return;
    setData((prev) => prev.map((p) => (p.code === selected.code ? { ...p, status: '판매중지' } : p)));
    setShowSaleConfirm(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.title}>상품 관리</div>
            <div className={styles.subtitle}>거래에 사용되는 상품과 판매 조건을 관리합니다.</div>
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setShowRegister(true);
              setSelectedCode(null);
            }}
          >
            ＋ 상품 등록
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

        <div className={styles.filterBox}>
          <div className={styles.searchRow}>
            <select className={styles.selectField} defaultValue="전체">
              <option>전체</option>
              <option>상품명</option>
              <option>상품코드</option>
              <option>카테고리</option>
              <option>담당자</option>
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
            <select className={styles.smallSelect} defaultValue="판매상태 전체">
              <option>판매상태 전체</option>
              <option>등록대기</option>
              <option>판매중</option>
              <option>판매중지</option>
              <option>판매종료</option>
            </select>
            <select className={styles.smallSelect} defaultValue="카테고리 전체">
              <option>카테고리 전체</option>
              <option>카테고리 01</option>
              <option>카테고리 02</option>
              <option>카테고리 03</option>
            </select>
            <select className={styles.smallSelect} defaultValue="상품유형 전체">
              <option>상품유형 전체</option>
              <option>일반</option>
              <option>서비스</option>
              <option>기타</option>
            </select>
            <select className={styles.smallSelect} defaultValue="공급상태 전체">
              <option>공급상태 전체</option>
              <option>공급가능</option>
              <option>일시중지</option>
              <option>공급불가</option>
            </select>
            <select className={styles.smallSelect} defaultValue="담당자 전체">
              <option>담당자 전체</option>
              <option>admin1</option>
              <option>admin2</option>
              <option>admin3</option>
            </select>
            <button type="button" className={styles.dashedBtn}>상세 필터 ＋</button>
            <div className={styles.spacer} />
            <button type="button" className={styles.resetBtn} onClick={clearAll}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}개</span>
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
          columns={COLUMNS}
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

      {detail && !showRegister && (
        <ProductDetailDrawer
          key={detail.code}
          detail={detail}
          tab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedCode(null)}
          showSaleConfirm={showSaleConfirm}
          onToggleSale={toggleSale}
          onConfirmSale={confirmSale}
        />
      )}

      {showRegister && (
        <aside className={styles.registerAside}>
          <div className={styles.registerHead}>
            <span className={styles.registerTitle}>상품 등록</span>
            <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
          </div>
          <div className={styles.registerBody}>
            <div className={styles.formSectionTitle}>기본 정보</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                상품명 *<input className={styles.formInput} />
              </label>
              <label className={styles.formLabel}>
                상품코드 *<input className={styles.formInput} />
              </label>
              <label className={styles.formLabel}>
                카테고리 *
                <select className={styles.formInput}>
                  <option>카테고리 01</option>
                  <option>카테고리 02</option>
                  <option>카테고리 03</option>
                </select>
              </label>
              <div className={styles.formRow}>
                <label className={styles.formLabelFlex}>
                  상품 유형
                  <select className={styles.formInput}>
                    <option>일반</option>
                    <option>서비스</option>
                    <option>기타</option>
                  </select>
                </label>
                <label className={styles.formLabelFlex}>
                  판매 상태
                  <select className={styles.formInput}>
                    <option>판매중</option>
                    <option>등록대기</option>
                  </select>
                </label>
              </div>
            </div>

            <div className={styles.formSectionTitle}>가격</div>
            <div className={styles.formGroup}>
              <div className={styles.formRow}>
                <label className={styles.formLabelFlex}>
                  기본 가격 *<input className={styles.formInput} placeholder="원" />
                </label>
                <label className={styles.formLabelFlex}>
                  세금
                  <select className={styles.formInput}>
                    <option>별도</option>
                    <option>포함</option>
                  </select>
                </label>
              </div>
            </div>

            <div className={styles.formSectionTitle}>주문 조건</div>
            <div className={styles.formGroup}>
              <div className={styles.formRow}>
                <label className={styles.formLabelFlex}>
                  최소 주문수량<input className={styles.formInput} />
                </label>
                <label className={styles.formLabelFlex}>
                  주문 단위<input className={styles.formInput} />
                </label>
                <label className={styles.formLabelFlex}>
                  최소 주문금액<input className={styles.formInput} />
                </label>
              </div>
            </div>

            <div className={styles.formSectionTitle}>공급 정보</div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                공급 상태
                <select className={styles.formInput}>
                  <option>공급가능</option>
                  <option>일시중지</option>
                  <option>공급불가</option>
                </select>
              </label>
              <div>
                <div className={styles.radioGroupLabel}>재고 관리</div>
                <div className={styles.radioRow}>
                  <label className={styles.radioLabel}><input type="radio" name="inv" />사용</label>
                  <label className={styles.radioLabel}><input type="radio" name="inv" defaultChecked />미사용</label>
                </div>
              </div>
            </div>

            <div className={styles.formSectionTitle}>설명</div>
            <textarea className={styles.textarea} placeholder="상품 설명을 입력하세요" />
          </div>
          <div className={styles.registerFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowRegister(false)}>취소</button>
            <button type="button" className={styles.submitBtn} onClick={() => setShowRegister(false)}>상품 등록</button>
          </div>
        </aside>
      )}
    </div>
  );
}
