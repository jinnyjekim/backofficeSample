import { useMemo, useState } from 'react';
import styles from './opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { NoticeDetailDrawer } from './NoticeDetailDrawer';
import { NoticeEditorDrawer, type NoticeFormData } from './NoticeEditorDrawer';
import {
  NOTICES,
  NOTICE_CATEGORIES,
  PUBLICATION_STATUS_META,
  QUICK_FILTER_LABELS,
  computeStatus,
  fmtNow,
  fmtRange,
  isPinnedNow,
  matchesQuickFilter,
  todayIso,
  type Notice,
  type NoticeCategory,
  type NoticeQuickFilter,
} from './noticesData';

const GRID_TEMPLATE = '1.7fr 100px 60px 108px 84px 100px 68px 76px 88px 56px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '제목' },
  { label: '카테고리' },
  { label: '중요' },
  { label: '공개기간' },
  { label: '상태' },
  { label: '노출대상' },
  { label: '조회수', align: 'right' },
  { label: '등록자' },
  { label: '등록일' },
  { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

type ConfirmState =
  | { kind: 'end'; id: string }
  | { kind: 'delete'; id: string }
  | { kind: 'repost'; id: string }
  | { kind: 'bulkEnd' }
  | { kind: 'bulkCategory' }
  | null;

function nextId(list: Notice[]): string {
  const max = list.reduce((m, n) => {
    const n2 = parseInt(n.id.replace('NTC-', ''), 10);
    return Number.isNaN(n2) ? m : Math.max(m, n2);
  }, 0);
  return `NTC-${String(max + 1).padStart(4, '0')}`;
}

export function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(NOTICES);
  const [filter, setFilter] = useState<NoticeQuickFilter>('전체');
  const [categoryFilter, setCategoryFilter] = useState<'전체' | NoticeCategory>('전체');
  const [importantFilter, setImportantFilter] = useState<'전체' | '중요만'>('전체');
  const [pinnedFilter, setPinnedFilter] = useState<'전체' | '고정만'>('전체');
  const [q, setQ] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editorTarget, setEditorTarget] = useState<'new' | Notice | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [endReason, setEndReason] = useState('');
  const [bulkCategory, setBulkCategory] = useState<NoticeCategory>('서비스 안내');
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTER_LABELS.forEach((k) => { c[k] = notices.filter((n) => matchesQuickFilter(n, k)).length; });
    return c;
  }, [notices]);

  const filtered = useMemo(
    () =>
      notices.filter((n) => {
        if (!matchesQuickFilter(n, filter)) return false;
        if (categoryFilter !== '전체' && n.category !== categoryFilter) return false;
        if (importantFilter === '중요만' && !n.important) return false;
        if (pinnedFilter === '고정만' && !isPinnedNow(n)) return false;
        if (q && !(n.title.includes(q) || n.id.includes(q) || n.body.includes(q))) return false;
        return true;
      }),
    [notices, filter, categoryFilter, importantFilter, pinnedFilter, q],
  );

  const selected = openId ? notices.find((n) => n.id === openId) ?? null : null;

  function updateNotice(id: string, updater: (n: Notice) => Notice) {
    setNotices((prev) => prev.map((n) => (n.id === id ? updater(n) : n)));
  }

  function toggleSel(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelAll() {
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((n) => n.id)));
  }

  function openDetail(id: string) {
    setOpenId(id);
    setEditorTarget(null);
    setMenuId(null);
  }
  function openEditor(target: 'new' | Notice) {
    setEditorTarget(target);
    setOpenId(null);
    setMenuId(null);
  }
  function closePanels() {
    setOpenId(null);
    setEditorTarget(null);
  }

  function publishNow(id: string) {
    updateNotice(id, (n) => ({
      ...n,
      manualHidden: false,
      startAt: n.startAt ?? fmtNow(),
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...n.history, { when: '방금', title: '공개 전환', by: '관리자' }],
    }));
  }

  function cancelSchedule(id: string) {
    updateNotice(id, (n) => ({
      ...n,
      manualHidden: true,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...n.history, { when: '방금', title: '예약 취소', detail: '비공개로 전환', by: '관리자' }],
    }));
  }

  function duplicate(id: string) {
    const src = notices.find((n) => n.id === id);
    if (!src) return;
    const id2 = nextId(notices);
    const copy: Notice = {
      ...src,
      id: id2,
      title: `[복사본] ${src.title}`,
      startAt: null,
      endAt: null,
      manualHidden: false,
      views: 0,
      createdAt: '방금',
      updatedAt: '방금',
      updatedBy: '관리자',
      history: [{ when: '방금', title: '공지 복제', detail: `원본 ${src.id}`, by: '관리자' }],
      memos: [],
    };
    setNotices((prev) => [copy, ...prev]);
    openDetail(id2);
  }

  function addMemo(id: string, text: string) {
    updateNotice(id, (n) => ({ ...n, memos: [...n.memos, { when: '방금', by: '관리자', text }] }));
  }

  function confirmEndPosting(id: string) {
    updateNotice(id, (n) => ({
      ...n,
      endAt: fmtNow(),
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...n.history, { when: '방금', title: '게시 종료', detail: endReason || undefined, by: '관리자' }],
    }));
    setEndReason('');
    setConfirm(null);
  }

  function confirmRepost(id: string) {
    updateNotice(id, (n) => ({
      ...n,
      startAt: fmtNow(),
      endAt: null,
      manualHidden: false,
      updatedBy: '관리자',
      updatedAt: '방금',
      history: [...n.history, { when: '방금', title: '재게시', by: '관리자' }],
    }));
    setConfirm(null);
  }

  function confirmDelete(id: string) {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    if (openId === id) setOpenId(null);
    setConfirm(null);
  }

  function confirmBulkEnd() {
    const eligible = selectedIds.filter((id) => {
      const n = notices.find((x) => x.id === id);
      return n && computeStatus(n) === '공개중';
    });
    eligible.forEach((id) => {
      updateNotice(id, (n) => ({
        ...n,
        endAt: fmtNow(),
        updatedBy: '관리자',
        updatedAt: '방금',
        history: [...n.history, { when: '방금', title: '게시 종료', detail: '일괄 처리', by: '관리자' }],
      }));
    });
    setSelectedIds([]);
    setConfirm(null);
  }

  function confirmBulkCategory() {
    selectedIds.forEach((id) => updateNotice(id, (n) => ({ ...n, category: bulkCategory })));
    setSelectedIds([]);
    setConfirm(null);
  }

  function submitEditor(form: NoticeFormData) {
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
      updateNotice(existing.id, (n) => ({
        ...n,
        title: form.title,
        category: form.category,
        important: form.important,
        pinStart: form.pinEnabled ? form.pinStart : null,
        pinEnd: form.pinEnabled ? form.pinEnd : null,
        body: form.body,
        attachments: form.attachments,
        startAt,
        endAt,
        manualHidden,
        target: form.target,
        updatedBy: '관리자',
        updatedAt: '방금',
        history: [...n.history, { when: '방금', title: '공지 수정', by: '관리자' }],
        memos: form.memo ? [...n.memos, { when: '방금', by: '관리자', text: form.memo }] : n.memos,
      }));
      openDetail(existing.id);
    } else {
      const id = nextId(notices);
      const created: Notice = {
        id,
        title: form.title,
        category: form.category,
        important: form.important,
        pinStart: form.pinEnabled ? form.pinStart : null,
        pinEnd: form.pinEnabled ? form.pinEnd : null,
        manualHidden,
        startAt,
        endAt,
        target: form.target,
        author: '관리자',
        updatedBy: '관리자',
        views: 0,
        createdAt: '방금',
        updatedAt: '방금',
        body: form.body,
        attachments: form.attachments,
        linkedExposures: [],
        history: [{ when: '방금', title: '공지 등록', by: '관리자' }],
        memos: form.memo ? [{ when: '방금', by: '관리자', text: form.memo }] : [],
      };
      setNotices((prev) => [created, ...prev]);
      openDetail(id);
    }
  }

  function rowMenuItems(n: Notice, status: ReturnType<typeof computeStatus>) {
    const items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[] = [
      { label: '상세 보기', click: () => openDetail(n.id) },
    ];
    if (status !== '게시종료') items.push({ label: '수정', click: () => openEditor(n) });
    items.push({ sep: true });
    if (status === '작성중' || status === '비공개') items.push({ label: '공개', click: () => publishNow(n.id) });
    if (status === '공개예정') items.push({ label: '예약 취소', click: () => cancelSchedule(n.id) });
    if (status === '공개중') items.push({ label: '게시 종료', fg: '#dc2626', click: () => setConfirm({ kind: 'end', id: n.id }) });
    if (status === '게시종료') items.push({ label: '재게시', click: () => setConfirm({ kind: 'repost', id: n.id }) });
    items.push({ label: '복제', click: () => duplicate(n.id) });
    if (status === '작성중') items.push({ label: '삭제', fg: '#dc2626', click: () => setConfirm({ kind: 'delete', id: n.id }) });
    return items.map((it) => (it.click ? { ...it, click: () => { it.click!(); setMenuId(null); } } : it));
  }

  const rows: GridRow[] = filtered.map((n) => {
    const status = computeStatus(n);
    const sm = PUBLICATION_STATUS_META[status];
    const pinned = isPinnedNow(n);
    const titleText = `${n.important ? '⭐ ' : ''}${pinned ? '📌 ' : ''}${n.title}${n.attachments.length ? ' 📎' : ''}`;
    const cells: Cell[] = [
      { kind: 'text', text: titleText, color: '#18181b', size: '13px', weight: 600 },
      { kind: 'text', text: n.category, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: n.important ? '중요' : '-', color: n.important ? '#dc2626' : '#a1a1aa', size: '11.5px', weight: 600 },
      { kind: 'text', text: fmtRange(n), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'badge', text: status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: n.target === '전체 사용자' ? '전체' : '특정그룹', color: '#52525b', size: '11.5px', weight: 500 },
      { kind: 'text', text: n.views.toLocaleString('ko-KR'), color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
      { kind: 'text', text: n.author, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: n.createdAt, color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'rowMenu', detailLabel: '상세', onDetail: () => openDetail(n.id), open: menuId === n.id, onToggle: () => setMenuId(menuId === n.id ? null : n.id), items: rowMenuItems(n, status) },
    ];
    return {
      id: n.id,
      cells,
      onClick: () => openDetail(n.id),
      selected: selectedIds.includes(n.id),
      onToggleSelect: () => toggleSel(n.id),
    };
  });

  const confirmNotice = confirm && 'id' in confirm ? notices.find((n) => n.id === confirm.id) ?? null : null;
  const bulkEndEligible = selectedIds.filter((id) => {
    const n = notices.find((x) => x.id === id);
    return n && computeStatus(n) === '공개중';
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>공지사항</div>
            <div className={styles.subtitle}>서비스에 노출되는 공지사항을 등록·예약·종료하고 노출 대상과 기간을 관리합니다.</div>
          </div>
          <button type="button" className={styles.createBtn} onClick={() => openEditor('new')}>＋ 공지 등록</button>
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
            <select className={styles.selectSm} defaultValue="전체">
              <option>전체</option>
              <option>제목</option>
              <option>본문</option>
              <option>공지번호</option>
            </select>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="공지 제목, 본문 또는 번호" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <select className={styles.selectXs} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as '전체' | NoticeCategory)}>
              <option value="전체">카테고리 전체</option>
              {NOTICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className={styles.selectXs} value={importantFilter} onChange={(e) => setImportantFilter(e.target.value as '전체' | '중요만')}>
              <option value="전체">중요공지 전체</option>
              <option value="중요만">중요 공지만</option>
            </select>
            <select className={styles.selectXs} value={pinnedFilter} onChange={(e) => setPinnedFilter(e.target.value as '전체' | '고정만')}>
              <option value="전체">상단고정 전체</option>
              <option value="고정만">고정된 공지만</option>
            </select>
            <button type="button" className={styles.detailFilterBtn}>상세 필터 ＋</button>
            <div className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체'); setCategoryFilter('전체'); setImportantFilter('전체'); setPinnedFilter('전체'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
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
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkCategory' })}>카테고리 변경</button>
          <button type="button" className={styles.bulkBtn} onClick={() => setConfirm({ kind: 'bulkEnd' })}>게시 종료</button>
          <button type="button" className={styles.bulkBtn}>다운로드</button>
        </div>
      )}

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="1240px"
          selectable
          allSelected={filtered.length > 0 && selectedIds.length === filtered.length}
          onToggleAll={toggleSelAll}
          showPagination
          pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
          empty={rows.length === 0}
          emptyText="등록된 공지사항이 없습니다."
        />
      </div>

      {selected && (
        <NoticeDetailDrawer
          notice={selected}
          onClose={() => setOpenId(null)}
          onEdit={() => openEditor(selected)}
          onPublishNow={() => publishNow(selected.id)}
          onCancelSchedule={() => cancelSchedule(selected.id)}
          onRequestEnd={() => setConfirm({ kind: 'end', id: selected.id })}
          onRequestRepost={() => setConfirm({ kind: 'repost', id: selected.id })}
          onDuplicate={() => duplicate(selected.id)}
          onRequestDelete={() => setConfirm({ kind: 'delete', id: selected.id })}
          onAddMemo={(text) => addMemo(selected.id, text)}
        />
      )}

      {editorTarget && (
        <NoticeEditorDrawer
          notice={editorTarget === 'new' ? null : editorTarget}
          todayIso={todayIso()}
          onCancel={closePanels}
          onSubmit={submitEditor}
        />
      )}

      {confirm?.kind === 'end' && confirmNotice && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>게시를 종료하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirmNotice.title}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>현재</span><span>공개중</span></div>
              <div className={styles.dialogSummaryRow}><span>종료일</span><span>즉시</span></div>
            </div>
            <input className={styles.searchInput} style={{ width: '100%', maxWidth: 'none', marginBottom: 16 }} placeholder="종료 사유 (선택)" value={endReason} onChange={(e) => setEndReason(e.target.value)} />
            <div className={styles.dialogBody} style={{ marginBottom: 0 }}>게시 종료 후 사용자 목록에서 노출되지 않습니다.</div>
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => confirmEndPosting(confirmNotice.id)}>게시 종료</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'repost' && confirmNotice && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>다시 게시하시겠습니까?</div>
            <div className={styles.dialogBody}>{confirmNotice.title}</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>새 공개 시작</span><span>즉시</span></div>
              <div className={styles.dialogSummaryRow}><span>새 공개 종료</span><span>종료일 없음</span></div>
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={() => confirmRepost(confirmNotice.id)}>재게시</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'delete' && confirmNotice && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>공지를 삭제하시겠습니까?</div>
            <div className={styles.dialogBody}>{`'${confirmNotice.title}'이(가) 삭제됩니다. 공개 이력이 없는 작성중 공지만 삭제할 수 있습니다.`}</div>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} onClick={() => confirmDelete(confirmNotice.id)}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkEnd' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 게시 종료</div>
            <div className={styles.dialogSummary}>
              <div className={styles.dialogSummaryRow}><span>게시 종료 가능</span><span>{bulkEndEligible.length}건</span></div>
              <div className={styles.dialogSummaryRow}><span>제외</span><span>{selectedIds.length - bulkEndEligible.length}건</span></div>
            </div>
            {selectedIds.length - bulkEndEligible.length > 0 && (
              <div className={styles.dialogWarnList}>선택한 항목 중 &apos;공개중&apos; 상태가 아닌 건은 제외됩니다.</div>
            )}
            <div className={styles.dialogActions} style={{ marginTop: 16 }}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: '#dc2626', color: '#fff' }} disabled={bulkEndEligible.length === 0} onClick={confirmBulkEnd}>
                {bulkEndEligible.length}건 게시 종료
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm?.kind === 'bulkCategory' && (
        <div className={styles.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogTitle}>{selectedIds.length}건 카테고리 변경</div>
            <select className={styles.selectSm} style={{ width: '100%', marginBottom: 16 }} value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value as NoticeCategory)}>
              {NOTICE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.dialogBtn} style={{ border: '1px solid rgba(0,0,0,.12)', background: '#fff', color: '#52525b' }} onClick={() => setConfirm(null)}>취소</button>
              <button type="button" className={styles.dialogBtn} style={{ border: 0, background: 'var(--accent)', color: '#fff' }} onClick={confirmBulkCategory}>변경</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
