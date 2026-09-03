import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import styles from './ProductShippingPolicyPage.module.css';
import { ProductShippingPolicyDrawer } from './ProductShippingPolicyDrawer';
import {
  DELIVERY_METHODS,
  INITIAL_OVERRIDES,
  PRODUCTS,
  QUICK_FILTERS,
  computeWarnings,
  fmtFee,
  matchesQuickFilter,
  type DeliveryMethod,
  type ProductShippingOverride,
  type QuickFilter,
} from './productShippingOverrideData';
import { CommonButton, showToast } from '../../components/common';

const TODAY = '2026-08-25';

function history(item: ProductShippingOverride, action: string, before?: string, after?: string): ProductShippingOverride {
  return {
    ...item,
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [...item.history, { id: `H-${item.productCode}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: `${TODAY} 14:00`, by: 'admin01', action, before, after }],
  };
}

export function ProductShippingPolicyPage() {
  const [overrides, setOverrides] = useState(INITIAL_OVERRIDES);

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<DeliveryMethod | ''>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [drawerCode, setDrawerCode] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<'apply' | 'reset' | null>(null);
  const [bulkSource, setBulkSource] = useState('');

  const warnings = useMemo(() => computeWarnings(overrides), [overrides]);

  const filtered = useMemo(
    () =>
      PRODUCTS.filter((product) => {
        const override = overrides[product.code];
        if (!matchesQuickFilter(product, override, quickFilter, warnings)) return false;
        if (search && !`${product.name} ${product.code} ${product.category}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (methodFilter && override.deliveryMethod !== methodFilter) return false;
        return true;
      }),
    [overrides, quickFilter, search, methodFilter, warnings],
  );

  const toastBriefly = (message: string) => {
    showToast({ message, type: 'success' });
  };
  const reset = () => {
    setKeyword('');
    setSearch('');
    setMethodFilter('');
  };

  const save = (item: ProductShippingOverride) => {
    const previous = overrides[item.productCode];
    let saved = item;
    if (previous.usesOverride !== item.usesOverride) {
      saved = history(item, item.usesOverride ? '상품별 정책 사용으로 전환' : '기본 정책 사용으로 전환');
    } else if (JSON.stringify(previous) !== JSON.stringify(item)) {
      saved = history(item, '정책 수정');
    }
    setOverrides((current) => ({ ...current, [item.productCode]: saved }));
    toastBriefly('배송 정책을 저장했습니다.');
  };

  const toggleSelect = (code: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((current) => (current.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.code))));
  };

  const runBulkReset = () => {
    setOverrides((current) => {
      const next = { ...current };
      selected.forEach((code) => { next[code] = history({ ...next[code], usesOverride: false }, '기본 정책으로 변경 (일괄)'); });
      return next;
    });
    toastBriefly(`${selected.size}개 상품을 기본 정책으로 변경했습니다.`);
    setSelected(new Set());
    setBulkModal(null);
  };

  const runBulkApply = () => {
    if (!bulkSource) return;
    const source = overrides[bulkSource];
    setOverrides((current) => {
      const next = { ...current };
      selected.forEach((code) => {
        if (code === bulkSource) return;
        next[code] = history({ ...source, productCode: code, history: next[code].history }, `정책 일괄 적용 (기준: ${PRODUCTS.find((p) => p.code === bulkSource)?.name})`);
      });
      return next;
    });
    toastBriefly(`${selected.size}개 상품에 정책을 일괄 적용했습니다.`);
    setSelected(new Set());
    setBulkModal(null);
    setBulkSource('');
  };

  const rows: GridRow[] = filtered.map((product) => {
    const override = overrides[product.code];
    const issues = warnings[product.code] ?? [];
    return {
      id: product.code,
      onClick: () => setDrawerCode(product.code),
      bg: issues.length ? '#fffdf8' : undefined,
      selected: selected.has(product.code),
      onToggleSelect: () => toggleSelect(product.code),
      cells: [
        { kind: 'titleWarn', title: `${product.name} · ${product.code}`, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
        { kind: 'text', text: product.category, size: '12px', color: '#3f3f46' },
        { kind: 'badge', text: override.usesOverride ? '별도 정책' : '기본 정책', bg: override.usesOverride ? '#eef2ff' : '#f4f4f5', fg: override.usesOverride ? '#4338ca' : '#71717a' },
        { kind: 'text', text: fmtFee(override), size: '12px', weight: 600, color: '#18181b' },
        { kind: 'text', text: override.usesOverride ? override.deliveryMethod : '-', size: '12px', color: '#3f3f46' },
        { kind: 'statusDot', text: !override.usesOverride ? '기본' : override.active ? '적용중' : '비활성', dot: !override.usesOverride ? '#a1a1aa' : override.active ? '#10b981' : '#d4d4d8', fg: !override.usesOverride ? '#71717a' : override.active ? '#047857' : '#a1a1aa' },
      ],
    };
  });

  const drawerProduct = drawerCode ? PRODUCTS.find((p) => p.code === drawerCode) ?? null : null;

  return (
    <div className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={shared.title}>상품별 배송 정책</div>
            <div className={shared.subtitle}>기본 배송 정책과 다르게 적용해야 하는 상품의 배송비·배송 조건을 개별적으로 설정합니다.</div>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((filter) => {
            const active = quickFilter === filter;
            return (
              <CommonButton
                key={filter}
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${shared.qfBtn} ${active ? styles.quickActive : ''}`}
                onClick={() => setQuickFilter(filter)}
              >
                <span className={shared.qfLabel}>{filter}</span>
                <span className={shared.qfCount}>{PRODUCTS.filter((p) => matchesQuickFilter(p, overrides[p.code], filter, warnings)).length}</span>
              </CommonButton>
            );
          })}
        </div>
        <div className={shared.filterBox}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={shared.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="상품명, 상품코드, 카테고리 검색" />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>배송방법</span><select aria-label="배송방법" className={shared.selectSm} value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as DeliveryMethod | '')}>
              <option value="">전체 배송방법</option>
              {DELIVERY_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select></label>
            <span className={shared.rowSpacer} />
            {selected.size > 0 && (
              <>
                <button type="button" className={styles.bulkBtn} onClick={() => setBulkModal('apply')}>정책 일괄 적용 ({selected.size})</button>
                <button type="button" className={styles.bulkBtn} onClick={() => setBulkModal('reset')}>기본 정책으로 변경 ({selected.size})</button>
              </>
            )}
            <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
          </div>
        </div>
      </header>

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length}개 상품</span>
        </div>
        <DataGrid
          columns={[
            { label: '상품' },
            { label: '카테고리' },
            { label: '정책 유형' },
            { label: '배송비' },
            { label: '배송방법' },
            { label: '상태' },
          ]}
          rows={rows}
          gridTemplate="1.4fr 74px 76px 92px 52px 58px"
          minWidth="820px"
          selectable
          allSelected={filtered.length > 0 && selected.size === filtered.length}
          onToggleAll={toggleAll}
          empty={filtered.length === 0}
          emptyText={quickFilter === '설정 확인 필요' ? '현재 확인이 필요한 상품 정책이 없습니다.' : '검색 결과가 없습니다.'}
          emptySubtext="검색어나 필터 조건을 변경해 주세요."
          emptyActionLabel="필터 초기화"
          emptyActionClick={reset}
        />
      </div>

      {drawerProduct && (
        <ProductShippingPolicyDrawer
          key={drawerProduct.code}
          product={drawerProduct}
          initial={overrides[drawerProduct.code]}
          issues={warnings[drawerProduct.code] ?? []}
          onClose={() => setDrawerCode(null)}
          onSave={save}
        />
      )}

      {bulkModal && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) { setBulkModal(null); setBulkSource(''); } }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>{bulkModal === 'apply' ? '정책 일괄 적용' : '기본 정책으로 일괄 변경'}</h2>
            {bulkModal === 'apply' ? (
              <>
                <p className={shared.dialogBody}>선택한 {selected.size}개 상품에 기준 상품의 배송 정책을 그대로 복사해서 적용합니다.</p>
                <label className={styles.formField}>
                  <span>기준 상품 선택 *</span>
                  <select value={bulkSource} onChange={(e) => setBulkSource(e.target.value)}>
                    <option value="">선택 안 함</option>
                    {PRODUCTS.filter((p) => selected.has(p.code)).map((p) => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
                  </select>
                </label>
              </>
            ) : (
              <p className={shared.dialogBody}>선택한 {selected.size}개 상품의 배송 정책을 기본 배송 정책 사용으로 초기화합니다. 개별 설정 값은 사라집니다.</p>
            )}
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => { setBulkModal(null); setBulkSource(''); }}>취소</button>
              {bulkModal === 'apply' ? (
                <button type="button" className={styles.primaryButton} disabled={!bulkSource} onClick={runBulkApply}>적용</button>
              ) : (
                <button type="button" className={styles.dangerButton} onClick={runBulkReset}>변경</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
