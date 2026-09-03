import { useMemo, useState } from 'react';
import styles from './opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { fmtNow, todayIso } from './noticesData';
import { PopupDetailDrawer } from './PopupDetailDrawer';
import { PopupEditorDrawer, type PopupFormData } from './PopupEditorDrawer';
import {
  POPUPS,
  POPUP_SCREENS,
  POPUP_STATUS_META,
  QUICK_FILTER_LABELS,
  computeStatus,
  fmtRange,
  matchesQuickFilter,
  needsReview,
  type Popup,
  type PopupQuickFilter,
} from './popupsData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = '118px 1.3fr 74px 48px 94px 72px 36px 72px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '미리보기' },
  { label: '팝업명' },
  { label: '노출화면' },
  { label: '대상' },
  { label: '기간' },
  { label: '빈도' },
  { label: '우선순위', align: 'right' },
  { label: '상태' },
];
const PAGE_LABELS = ['1', '2'];

type ConfirmState =
  | { kind: 'stop'; id: string }
  | { kind: 'delete'; id: string }
  | { kind: 'repost'; id: string }
  | { kind: 'bulkStop' }
  | { kind: 'priorityManage' }
  | null;

function nextId(list: Popup[]): string {
  const max = list.reduce((m, p) => {
    const n = parseInt(p.id.replace('POP-', ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `POP-${String(max + 1).padStart(3, '0')}`;
}

export function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>(POPUPS);
  const [filter, setFilter] = useState<PopupQuickFilter>('전체');
  const [screenFilter, setScreenFilter] = useState('전체');
  const [q, setQ] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<'new' | Popup | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [stopReason, setStopReason] = useState('');
  const [priorityScreen, setPriorityScreen] = useState(POPUP_SCREENS[0]);
  const [priorityDraft, setPriorityDraft] = useState<string[]>([]);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTER_LABELS.forEach((k) => { c[k] = popups.filter((p) => matchesQuickFilter(p, k)).length; });
    return c;
  }, [popups]);

  const filtered = useMemo(
    () =>
      popups.filter((p) => {
        if (!matchesQuickFilter(p, filter)) return false;
        if (screenFilter !== '전체' && p.screen !== screenFilter) return false;
        if (q && !(p.name.includes(q) || p.title.includes(q) || p.id.includes(q))) return false;
        return true;
      }),
    [popups, filter, screenFilter, q],
  );

  const selected = openId ? popups.find((p) => p.id === openId) ?? null : null;

  function updatePopup(id: string, updater: (p: Popup) => Popup) {
    setPopups((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  }
  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((p) => p.id)));
  }
  function openDetail(id: string) {
    setOpenId(id);
    setEditorTarget(null);
    setMenuId(null);
  }
  function openEditor(target: 'new' | Popup) {
    setEditorTarget(target);
    setOpenId(null);
    setMenuId(null);
  }
  function closePanels() {
    setOpenId(null);
    setEditorTarget(null);
  }

  function publishNow(id: string) {
    updatePopup(id, (p) => ({
      ...p,
      manualHidden: false,
      startAt: p.startAt ?? fmtNow(),
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...p.history, { when: '방금', title: '노출 전환', by: '관리자' }],
    }));
  }
  function cancelSchedule(id: string) {
    updatePopup(id, (p) => ({
      ...p,
      manualHidden: true,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...p.history, { when: '방금', title: '예약 취소', detail: '비활성으로 전환', by: '관리자' }],
    }));
  }
  function duplicate(id: string) {
    const src = popups.find((p) => p.id === id);
    if (!src) return;
    const id2 = nextId(popups);
    const copy: Popup = {
      ...src,
      id: id2,
      name: `[복사본] ${src.name}`,
      startAt: null,
      endAt: null,
      manualHidden: false,
      impressions: 0,
      clicks: 0,
      closes: 0,
      hideTodayCount: 0,
      createdAt: '방금',
      updatedAt: '방금',
      updatedBy: '관리자',
      history: [{ when: '방금', title: '팝업 복제', detail: `원본 ${src.id}`, by: '관리자' }],
      memos: [],
    };
    setPopups((prev) => [copy, ...prev]);
    openDetail(id2);
  }
  function addMemo(id: string, text: string) {
    updatePopup(id, (p) => ({ ...p, memos: [...p.memos, { when: '방금', by: '관리자', text }] }));
  }

  function confirmStopAction(id: string) {
    updatePopup(id, (p) => ({
      ...p,
      manualHidden: true,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...p.history, { when: '방금', title: '노출 중지', detail: stopReason || undefined, by: '관리자' }],
    }));
    setStopReason('');
    setConfirm(null);
  }
  function confirmRepostAction(id: string) {
    updatePopup(id, (p) => ({
      ...p,
      startAt: fmtNow(),
      endAt: null,
      manualHidden: false,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...p.history, { when: '방금', title: '재노출', by: '관리자' }],
    }));
    setConfirm(null);
  }
  function confirmDeleteAction(id: string) {
    setPopups((prev) => prev.filter((p) => p.id !== id));
    if (openId === id) setOpenId(null);
    setConfirm(null);
  }
  function confirmBulkStop() {
    const eligible = selectedIds.filter((id) => {
      const p = popups.find((x) => x.id === id);
      return p && computeStatus(p) === '노출중';
    });
    eligible.forEach((id) => {
      updatePopup(id, (p) => ({
        ...p,
        manualHidden: true,
        updatedBy: '관리자',
        updatedAt: '방금',
        history: [...p.history, { when: '방금', title: '노출 중지', detail: '일괄 처리', by: '관리자' }],
      }));
    });
    setSelectedIds([]);
    setConfirm(null);
  }

  function openPriorityManage() {
    setPriorityDraft(popups.filter((p) => p.screen === priorityScreen).sort((a, b) => a.priority - b.priority).map((p) => p.id));
    setConfirm({ kind: 'priorityManage' });
  }
  function changePriorityScreen(s: string) {
    setPriorityScreen(s);
    setPriorityDraft(popups.filter((p) => p.screen === s).sort((a, b) => a.priority - b.priority).map((p) => p.id));
  }
  function movePriority(idx: number, dir: -1 | 1) {
    setPriorityDraft((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function savePriority() {
    priorityDraft.forEach((id, i) => updatePopup(id, (p) => ({ ...p, priority: i + 1 })));
    setConfirm(null);
  }

  function submitEditor(form: PopupFormData) {
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
      updatePopup(existing.id, (p) => ({
        ...p,
        name: form.name,
        title: form.title,
        body: form.body,
        type: form.type,
        screen: form.screen,
        device: form.device,
        hasPcImage: form.hasPcImage,
        hasMobileImage: form.hasMobileImage,
        useDesktopForMobile: form.useDesktopForMobile,
        timing: form.timing,
        delaySeconds: form.delaySeconds,
        target: form.target,
        frequency: form.frequency,
        maxCount: form.maxCount,
        close: form.close,
        primaryLabel: form.primaryLabel,
        linkType: form.linkType,
        linkUrl: form.linkUrl,
        priority: form.priority,
        startAt,
        endAt,
        manualHidden,
        updatedBy: '관리자',
        updatedAt: '방금',
        history: [...p.history, { when: '방금', title: '팝업 수정', by: '관리자' }],
        memos: form.memo ? [...p.memos, { when: '방금', by: '관리자', text: form.memo }] : p.memos,
      }));
      openDetail(existing.id);
    } else {
      const id = nextId(popups);
      const created: Popup = {
        id,
        name: form.name,
        title: form.title,
        body: form.body,
        type: form.type,
        screen: form.screen,
        device: form.device,
        hasPcImage: form.hasPcImage,
        hasMobileImage: form.hasMobileImage,
        useDesktopForMobile: form.useDesktopForMobile,
        thumbColor: '#6366f1',
        timing: form.timing,
        delaySeconds: form.delaySeconds,
        target: form.target,
        frequency: form.frequency,
        maxCount: form.maxCount,
        close: form.close,
        primaryLabel: form.primaryLabel,
        linkType: form.linkType,
        linkUrl: form.linkUrl,
        priority: form.priority,
        startAt,
        endAt,
        manualHidden,
        linkedContent: null,
        impressions: 0,
        clicks: 0,
        closes: 0,
        hideTodayCount: 0,
        manager: '관리자',
        updatedBy: '관리자',
        createdAt: '방금',
        updatedAt: '방금',
        history: [{ when: '방금', title: '팝업 등록', by: '관리자' }],
        memos: form.memo ? [{ when: '방금', by: '관리자', text: form.memo }] : [],
      };
      setPopups((prev) => [created, ...prev]);
      openDetail(id);
    }
  }

  const rows: GridRow[] = filtered.map((p) => {
    const status = computeStatus(p);
    const sm = POPUP_STATUS_META[status];
    const review = needsReview(p, popups);
    const cells: Cell[] = [
      { kind: 'thumbTitle', thumb: p.thumbColor, title: '', id: p.id, onClick: () => openDetail(p.id) },
      { kind: 'noWarn', no: p.name, hasIssue: review.flag, issueTitle: review.reasons.join(' · ') },
      { kind: 'text', text: p.screen, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: p.target === '전체 사용자' ? '전체' : p.target === '로그인 사용자' ? '로그인' : p.target === '비로그인 사용자' ? '비로그인' : '특정그룹', color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'text', text: fmtRange(p), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: p.frequency, color: '#52525b', size: '11.5px', weight: 500 },
      { kind: 'text', text: String(p.priority), color: '#71717a', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'badge', text: status, bg: sm.bg, fg: sm.fg },
    ];
    return {
      id: p.id,
      cells,
      onClick: () => openDetail(p.id),
      selected: selectedIds.includes(p.id),
      onToggleSelect: () => toggleSel(p.id),
    };
  });

  const confirmPopup = confirm && 'id' in confirm ? popups.find((p) => p.id === confirm.id) ?? null : null;
  const bulkStopEligible = selectedIds.filter((id) => {
    const p = popups.find((x) => x.id === id);
    return p && computeStatus(p) === '노출중';
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>팝업</div>
            <div className={styles.subtitle}>서비스 화면에 노출되는 팝업의 노출 조건·빈도·우선순위를 관리합니다.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={styles.bulkBtn} onClick={openPriorityManage}>우선순위 관리</button>
            <button type="button" className={styles.createBtn} onClick={() => openEditor('new')}>＋ 팝업 등록</button>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTER_LABELS.map((k) => {
            const active = filter === k;
            return (
              <CommonButton
                key={k}
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.qfBtn} ${active ? styles.active : ''}`}
                onClick={() => setFilter(k)}
              >
                <span className={styles.qfLabel}>{k}</span>
                <span className={styles.qfCount}>{counts[k] || 0}</span>
              </CommonButton>
            );
          })}
        </div>

        <div className={styles.filterBox}>
          <div className={styles.filterRow1}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm} defaultValue="전체">
              <option>전체</option>
              <option>팝업명</option>
              <option>팝업번호</option>
            </select></label>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="팝업 관리명, 제목 또는 번호" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>노출화면</span><select aria-label="노출화면" className={styles.selectXs} value={screenFilter} onChange={(e) => setScreenFilter(e.target.value)}>
              <option value="전체">노출화면 전체</option>
              {POPUP_SCREENS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select></label>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체'); setScreenFilter('전체'); setQ(''); }}>초기화</button>
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
      </header>

      {selectedIds.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkLabel}>{selectedIds.length}건 선택됨</span>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkStop' })}>노출 중지</button>
          <button type="button" className={styles.bulkBtn} data-grid-download="selected">다운로드</button>
        </div>
      )}

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="895px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="등록된 팝업이 없습니다."
        />
      </div>

      {selected && (
        <PopupDetailDrawer
          popup={selected}
          allPopups={popups}
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
        <PopupEditorDrawer
          popup={editorTarget === 'new' ? null : editorTarget}
          allPopups={popups}
          todayIso={todayIso()}
          onCancel={closePanels}
          onSubmit={submitEditor}
        />
      )}

      {confirm?.kind === 'stop' && confirmPopup && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>팝업 노출을 중지하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirmPopup.title}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>노출 화면</span><span>{confirmPopup.screen}</span></div>
              <div className={styles.dialogSummaryRow}><span>노출 대상</span><span>{confirmPopup.target}</span></div>
            </div>
            <input className={styles.searchInput} style={{ width: '100%', maxWidth: 'none', marginBottom: 16 }} placeholder="중지 사유 (선택)" value={stopReason} onChange={(e) => setStopReason(e.target.value)} />
            <div className={styles.dialogBody} style={{ marginBottom: 0 }}>중지 후 새로운 사용자에게 더 이상 노출되지 않습니다.</div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => confirmStopAction(confirmPopup.id)}>노출 중지</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'repost' && confirmPopup && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>다시 노출하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirmPopup.title}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>새 노출 시작</span><span>즉시</span></div>
              <div className={styles.dialogSummaryRow}><span>새 노출 종료</span><span>종료일 없음</span></div>
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={() => confirmRepostAction(confirmPopup.id)}>재노출</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'delete' && confirmPopup && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>팝업을 삭제하시겠습니까?</div>
            <div className={styles.dialogBody}>{`'${confirmPopup.name}'이(가) 삭제됩니다. 노출 이력이 없는 팝업만 삭제할 수 있습니다.`}</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => confirmDeleteAction(confirmPopup.id)}>삭제</button>
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

      {confirm?.kind === 'priorityManage' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>팝업 우선순위 관리</div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 12 }} value={priorityScreen} onChange={(e) => changePriorityScreen(e.target.value)}>
              {POPUP_SCREENS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <div className={styles.dialogSummary}>
              {priorityDraft.length === 0 && <div className={styles.emptyInline}>이 화면에 등록된 팝업이 없습니다</div>}
              {priorityDraft.map((id, i) => {
                const p = popups.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <div className={styles.dialogSummaryRow} key={id}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{i + 1}. {p.name}</span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className={styles.attachRemove} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }} onClick={() => movePriority(i, -1)}>↑</button>
                      <button type="button" className={styles.attachRemove} disabled={i === priorityDraft.length - 1} style={{ opacity: i === priorityDraft.length - 1 ? 0.3 : 1 }} onClick={() => movePriority(i, 1)}>↓</button>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={savePriority}>우선순위 저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
