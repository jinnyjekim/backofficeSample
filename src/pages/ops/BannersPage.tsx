import { useMemo, useState } from 'react';
import styles from './opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { fmtNow, todayIso } from './noticesData';
import { BannerDetailDrawer } from './BannerDetailDrawer';
import { BannerEditorDrawer, type BannerFormData } from './BannerEditorDrawer';
import {
  BANNERS,
  BANNER_POSITIONS,
  BANNER_STATUS_META,
  QUICK_FILTER_LABELS,
  computeStatus,
  fmtRange,
  matchesQuickFilter,
  needsReview,
  positionMeta,
  type Banner,
  type BannerQuickFilter,
} from './bannersData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '76px 1.4fr 108px 76px 108px 84px 56px 92px 76px 56px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '미리보기' },
  { label: '배너명' },
  { label: '노출위치' },
  { label: '디바이스' },
  { label: '노출기간' },
  { label: '노출대상' },
  { label: '순서', align: 'right' },
  { label: '상태' },
  { label: '클릭', align: 'right' },
  { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

type ConfirmState =
  | { kind: 'stop'; id: string }
  | { kind: 'delete'; id: string }
  | { kind: 'repost'; id: string }
  | { kind: 'bulkStop' }
  | { kind: 'bulkPosition' }
  | { kind: 'positionInfo' }
  | { kind: 'orderManage' }
  | null;

function nextId(list: Banner[]): string {
  const max = list.reduce((m, b) => {
    const n = parseInt(b.id.replace('BNR-', ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `BNR-${String(max + 1).padStart(3, '0')}`;
}

export function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>(BANNERS);
  const [filter, setFilter] = useState<BannerQuickFilter>('전체');
  const [positionFilter, setPositionFilter] = useState('전체');
  const [deviceFilter, setDeviceFilter] = useState('전체');
  const [q, setQ] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<'new' | Banner | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [stopReason, setStopReason] = useState('');
  const [bulkPosition, setBulkPosition] = useState(BANNER_POSITIONS[0].code);
  const [orderPosition, setOrderPosition] = useState(BANNER_POSITIONS[0].code);
  const [orderDraft, setOrderDraft] = useState<string[]>([]);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTER_LABELS.forEach((k) => { c[k] = banners.filter((b) => matchesQuickFilter(b, k)).length; });
    return c;
  }, [banners]);

  const filtered = useMemo(
    () =>
      banners.filter((b) => {
        if (!matchesQuickFilter(b, filter)) return false;
        if (positionFilter !== '전체' && b.positionCode !== positionFilter) return false;
        if (deviceFilter !== '전체' && b.device !== deviceFilter && b.device !== '전체') return false;
        if (q && !(b.name.includes(q) || b.id.includes(q))) return false;
        return true;
      }),
    [banners, filter, positionFilter, deviceFilter, q],
  );

  const selected = openId ? banners.find((b) => b.id === openId) ?? null : null;

  function updateBanner(id: string, updater: (b: Banner) => Banner) {
    setBanners((prev) => prev.map((b) => (b.id === id ? updater(b) : b)));
  }
  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((b) => b.id)));
  }
  function openDetail(id: string) {
    setOpenId(id);
    setEditorTarget(null);
    setMenuId(null);
  }
  function openEditor(target: 'new' | Banner) {
    setEditorTarget(target);
    setOpenId(null);
    setMenuId(null);
  }
  function closePanels() {
    setOpenId(null);
    setEditorTarget(null);
  }

  function publishNow(id: string) {
    updateBanner(id, (b) => ({
      ...b,
      manualHidden: false,
      startAt: b.startAt ?? fmtNow(),
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...b.history, { when: '방금', title: '노출 전환', by: '관리자' }],
    }));
  }
  function cancelSchedule(id: string) {
    updateBanner(id, (b) => ({
      ...b,
      manualHidden: true,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...b.history, { when: '방금', title: '예약 취소', detail: '비활성으로 전환', by: '관리자' }],
    }));
  }
  function duplicate(id: string) {
    const src = banners.find((b) => b.id === id);
    if (!src) return;
    const id2 = nextId(banners);
    const copy: Banner = {
      ...src,
      id: id2,
      name: `[복사본] ${src.name}`,
      startAt: null,
      endAt: null,
      manualHidden: false,
      impressions: 0,
      clicks: 0,
      createdAt: '방금',
      updatedAt: '방금',
      updatedBy: '관리자',
      history: [{ when: '방금', title: '배너 복제', detail: `원본 ${src.id}`, by: '관리자' }],
      memos: [],
    };
    setBanners((prev) => [copy, ...prev]);
    openDetail(id2);
  }
  function addMemo(id: string, text: string) {
    updateBanner(id, (b) => ({ ...b, memos: [...b.memos, { when: '방금', by: '관리자', text }] }));
  }

  function confirmStop(id: string) {
    updateBanner(id, (b) => ({
      ...b,
      manualHidden: true,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...b.history, { when: '방금', title: '노출 중지', detail: stopReason || undefined, by: '관리자' }],
    }));
    setStopReason('');
    setConfirm(null);
  }
  function confirmRepostAction(id: string) {
    updateBanner(id, (b) => ({
      ...b,
      startAt: fmtNow(),
      endAt: null,
      manualHidden: false,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...b.history, { when: '방금', title: '재노출', by: '관리자' }],
    }));
    setConfirm(null);
  }
  function confirmDeleteAction(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    if (openId === id) setOpenId(null);
    setConfirm(null);
  }
  function confirmBulkStop() {
    const eligible = selectedIds.filter((id) => {
      const b = banners.find((x) => x.id === id);
      return b && computeStatus(b) === '노출중';
    });
    eligible.forEach((id) => {
      updateBanner(id, (b) => ({
        ...b,
        manualHidden: true,
        updatedBy: '관리자',
        updatedAt: '방금',
        history: [...b.history, { when: '방금', title: '노출 중지', detail: '일괄 처리', by: '관리자' }],
      }));
    });
    setSelectedIds([]);
    setConfirm(null);
  }
  function confirmBulkPositionChange() {
    selectedIds.forEach((id) => updateBanner(id, (b) => ({ ...b, positionCode: bulkPosition })));
    setSelectedIds([]);
    setConfirm(null);
  }

  function openOrderManage() {
    setOrderDraft(banners.filter((b) => b.positionCode === orderPosition).sort((a, b) => a.order - b.order).map((b) => b.id));
    setConfirm({ kind: 'orderManage' });
  }
  function changeOrderPosition(code: string) {
    setOrderPosition(code);
    setOrderDraft(banners.filter((b) => b.positionCode === code).sort((a, b) => a.order - b.order).map((b) => b.id));
  }
  function moveOrder(idx: number, dir: -1 | 1) {
    setOrderDraft((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function saveOrder() {
    orderDraft.forEach((id, i) => updateBanner(id, (b) => ({ ...b, order: i + 1 })));
    setConfirm(null);
  }

  function submitEditor(form: BannerFormData) {
    const existing = editorTarget !== 'new' ? editorTarget : null;
    let startAt: string | null;
    let manualHidden = false;
    if (form.publishMode === '즉시') {
      startAt = fmtNow();
    } else if (form.publishMode === '예약') {
      startAt = `${form.startDate} ${form.startTime}`;
    } else {
      manualHidden = true;
      startAt = existing?.startAt ?? null;
    }
    const endAt = form.endMode === '없음' ? null : `${form.endDate} ${form.endTime}`;

    if (existing) {
      updateBanner(existing.id, (b) => ({
        ...b,
        name: form.name,
        positionCode: form.positionCode,
        device: form.device,
        hasPcImage: form.hasPcImage,
        hasMobileImage: form.hasMobileImage,
        useDesktopForMobile: form.useDesktopForMobile,
        altText: form.altText,
        title: form.title,
        description: form.description,
        buttonLabel: form.buttonLabel,
        linkType: form.linkType,
        linkUrl: form.linkUrl,
        target: form.target,
        order: form.order,
        startAt,
        endAt,
        manualHidden,
        updatedBy: '관리자',
        updatedAt: '방금',
        history: [...b.history, { when: '방금', title: '배너 수정', by: '관리자' }],
        memos: form.memo ? [...b.memos, { when: '방금', by: '관리자', text: form.memo }] : b.memos,
      }));
      openDetail(existing.id);
    } else {
      const id = nextId(banners);
      const created: Banner = {
        id,
        name: form.name,
        positionCode: form.positionCode,
        device: form.device,
        hasPcImage: form.hasPcImage,
        hasMobileImage: form.hasMobileImage,
        useDesktopForMobile: form.useDesktopForMobile,
        thumbColor: '#6366f1',
        altText: form.altText,
        title: form.title,
        description: form.description,
        buttonLabel: form.buttonLabel,
        linkType: form.linkType,
        linkUrl: form.linkUrl,
        target: form.target,
        order: form.order,
        startAt,
        endAt,
        manualHidden,
        linkedContent: null,
        impressions: 0,
        clicks: 0,
        manager: '관리자',
        updatedBy: '관리자',
        createdAt: '방금',
        updatedAt: '방금',
        history: [{ when: '방금', title: '배너 등록', by: '관리자' }],
        memos: form.memo ? [{ when: '방금', by: '관리자', text: form.memo }] : [],
      };
      setBanners((prev) => [created, ...prev]);
      openDetail(id);
    }
  }

  function rowMenuItems(b: Banner, status: ReturnType<typeof computeStatus>) {
    const canDelete = (status === '작성중' || status === '비활성') && !b.startAt && b.impressions === 0;
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(b.id) },
    ];
    if (status !== '노출종료') items.push({ label: '수정', click: () => openEditor(b) });
    items.push({ sep: true });
    if (status === '작성중' || status === '비활성') items.push({ label: '노출', click: () => publishNow(b.id) });
    if (status === '노출예정') items.push({ label: '예약 취소', click: () => cancelSchedule(b.id) });
    if (status === '노출중') items.push({ label: '노출 중지', fg: '#dc2626', click: () => setConfirm({ kind: 'stop', id: b.id }) });
    if (status === '노출종료') items.push({ label: '재노출', click: () => setConfirm({ kind: 'repost', id: b.id }) });
    items.push({ label: '복제', click: () => duplicate(b.id) });
    if (canDelete) items.push({ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', id: b.id }) });
    return items.map((it) => (it.click ? { ...it, click: () => { it.click!(); setMenuId(null); } } : it));
  }

  const rows: GridRow[] = filtered.map((b) => {
    const status = computeStatus(b);
    const sm = BANNER_STATUS_META[status];
    const review = needsReview(b);
    const pos = positionMeta(b.positionCode);
    const cells: Cell[] = [
      { kind: 'thumbTitle', thumb: b.thumbColor, title: '', id: b.id, onClick: () => openDetail(b.id) },
      { kind: 'noWarn', no: b.name, hasIssue: review.flag, issueTitle: review.reasons.join(' · ') },
      { kind: 'text', text: pos.label, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: b.device, color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'text', text: fmtRange(b), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: b.target === '전체 사용자' ? '전체' : b.target === '로그인 사용자' ? '로그인' : '특정그룹', color: '#52525b', size: '11.5px', weight: 500 },
      { kind: 'text', text: String(b.order), color: '#71717a', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'badge', text: status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: b.clicks.toLocaleString('ko-KR'), color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
      { kind: 'rowMenu', detailLabel: '상세', onDetail: () => openDetail(b.id), open: menuId === b.id, onToggle: () => setMenuId(menuId === b.id ? null : b.id), items: rowMenuItems(b, status) },
    ];
    return {
      id: b.id,
      cells,
      onClick: () => openDetail(b.id),
      selected: selectedIds.includes(b.id),
      onToggleSelect: () => toggleSel(b.id),
    };
  });

  const confirmBanner = confirm && 'id' in confirm ? banners.find((b) => b.id === confirm.id) ?? null : null;
  const bulkStopEligible = selectedIds.filter((id) => {
    const b = banners.find((x) => x.id === id);
    return b && computeStatus(b) === '노출중';
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>배너</div>
            <div className={styles.subtitle}>서비스 화면의 노출 위치·기간·순서·디바이스별 배너를 관리합니다.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'positionInfo' })}>노출 위치 정보</button>
            <button type="button" className={styles.bulkBtn} onClick={openOrderManage}>순서 관리</button>
            <button type="button" className={styles.createBtn} onClick={() => openEditor('new')}>＋ 배너 등록</button>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTER_LABELS.map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                type="button"
                className={styles.qfBtn}
                style={{ borderColor: active ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: active ? 'var(--accent)' : '#fff' }}
                onClick={() => setFilter(k)}
              >
                <span className={styles.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{k}</span>
                <span className={styles.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[k] || 0}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm} defaultValue="전체">
              <option>전체</option>
              <option>배너명</option>
              <option>배너번호</option>
            </select></label>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="배너명 또는 번호" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>노출위치</span><select aria-label="노출위치" className={styles.selectXs} value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
              <option value="전체">노출위치 전체</option>
              {BANNER_POSITIONS.map((p) => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select></label>
            <label className="globalFilterField"><span>디바이스</span><select aria-label="디바이스" className={styles.selectXs} value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)}>
              <option value="전체">디바이스 전체</option>
              <option value="PC">PC</option>
              <option value="Mobile">Mobile</option>
            </select></label>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체'); setPositionFilter('전체'); setDeviceFilter('전체'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{selectedIds.length}건 선택됨</span>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkPosition' })}>노출 위치 변경</button>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkStop' })}>노출 중지</button>
          <button type="button" className={styles.bulkBtn} data-grid-download="selected">다운로드</button>
        </div>
      )}

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1100px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="등록된 배너가 없습니다."
        />
      </div>

      {selected && (
        <BannerDetailDrawer
          banner={selected}
          onClose={() => setOpenId(null)}
          onEdit={() => openEditor(selected)}
          onPublishNow={() => publishNow(selected.id)}
          onCancelSchedule={() => cancelSchedule(selected.id)}
          onRequestStop={() => setConfirm({ kind: 'stop', id: selected.id })}
          onRequestRepost={() => setConfirm({ kind: 'repost', id: selected.id })}
          onDuplicate={() => duplicate(selected.id)}
          onRequestDelete={() => setConfirm({ kind: 'delete', id: selected.id })}
          onAddMemo={(text) => addMemo(selected.id, text)}
        />
      )}

      {editorTarget && (
        <BannerEditorDrawer
          banner={editorTarget === 'new' ? null : editorTarget}
          allBanners={banners}
          todayIso={todayIso()}
          onCancel={closePanels}
          onSubmit={submitEditor}
        />
      )}

      {confirm?.kind === 'stop' && confirmBanner && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>배너 노출을 중지하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirmBanner.name}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>노출 위치</span><span>{positionMeta(confirmBanner.positionCode).label}</span></div>
              <div className={styles.dialogSummaryRow}><span>현재 상태</span><span>노출중</span></div>
            </div>
            <input className={styles.searchInput} style={{ width: '100%', maxWidth: 'none', marginBottom: 16 }} placeholder="중지 사유 (선택)" value={stopReason} onChange={(e) => setStopReason(e.target.value)} />
            <div className={styles.dialogBody} style={{ marginBottom: 0 }}>중지 후 사용자 화면에서 즉시 노출되지 않습니다.</div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => confirmStop(confirmBanner.id)}>노출 중지</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'repost' && confirmBanner && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>다시 노출하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirmBanner.name}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>새 노출 시작</span><span>즉시</span></div>
              <div className={styles.dialogSummaryRow}><span>새 노출 종료</span><span>종료일 없음</span></div>
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={() => confirmRepostAction(confirmBanner.id)}>재노출</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'delete' && confirmBanner && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>배너를 삭제하시겠습니까?</div>
            <div className={styles.dialogBody}>{`'${confirmBanner.name}'이(가) 삭제됩니다. 노출 이력이 없는 배너만 삭제할 수 있습니다.`}</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => confirmDeleteAction(confirmBanner.id)}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkStop' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 노출 중지</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>노출 중지 가능</span><span>{bulkStopEligible.length}건</span></div>
              <div className={styles.dialogSummaryRow}><span>제외</span><span>{selectedIds.length - bulkStopEligible.length}건</span></div>
            </div>
            {selectedIds.length - bulkStopEligible.length > 0 && (
              <div className={styles.dialogWarnList}>선택한 항목 중 &apos;노출중&apos; 상태가 아닌 건은 제외됩니다.</div>
            )}
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} disabled={bulkStopEligible.length === 0} onClick={confirmBulkStop}>
                {bulkStopEligible.length}건 노출 중지
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkPosition' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 노출 위치 변경</div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 16 }} value={bulkPosition} onChange={(e) => setBulkPosition(e.target.value)}>
              {BANNER_POSITIONS.map((p) => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmBulkPositionChange}>변경</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'positionInfo' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox} style={{ width: 'min(520px, 92%)' }}>
            <div className={styles.dialogTitle}>배너 노출 위치</div>
            <div className={styles.dialogSummary}>
              {BANNER_POSITIONS.map((p) => (
                <div key={p.code} style={{ padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>{p.label}</div>
                  <div style={{ fontSize: 11.5, color: '#71717a' }}>PC {p.pcSpec} · Mobile {p.mobileSpec} · 최대 {p.maxCount}개 · {p.mode}</div>
                </div>
              ))}
            </div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={() => setConfirm(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'orderManage' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>배너 노출 순서</div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 12 }} value={orderPosition} onChange={(e) => changeOrderPosition(e.target.value)}>
              {BANNER_POSITIONS.map((p) => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
            <div className={styles.dialogSummary}>
              {orderDraft.length === 0 && <div className={styles.emptyInline}>이 위치에 등록된 배너가 없습니다</div>}
              {orderDraft.map((id, i) => {
                const b = banners.find((x) => x.id === id);
                if (!b) return null;
                return (
                  <div className={styles.dialogSummaryRow} key={id}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{i + 1}. {b.name}</span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className={styles.attachRemove} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }} onClick={() => moveOrder(i, -1)}>↑</button>
                      <button type="button" className={styles.attachRemove} disabled={i === orderDraft.length - 1} style={{ opacity: i === orderDraft.length - 1 ? 0.3 : 1 }} onClick={() => moveOrder(i, 1)}>↓</button>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={saveOrder}>순서 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
