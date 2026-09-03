import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './MembersPage.module.css';
import { MEMBERS, type Member } from '../../data/members';
import { ACCENT, avatarColors, formatNumber, formatWon } from '../../lib/theme';
import { buildSpark, TOTAL_MEMBERS } from './membersData';
import { getModeConfig, ST, type BusinessMode, type ChipDef, type ModeConfig } from './modeConfig';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { buildMemberDetail } from './memberDetail';
import { MemberExportModal, MemberStatusModal } from './MemberModals';
import { SearchField } from '../../components/SearchField';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const MODES: BusinessMode[] = ['B2C', 'C2C', 'B2B'];
const PAGE_LABELS = ['‹', '1', '2', '3', '4', '5', '›'];

function colMinPx(w: string): number {
  const m = w.match(/(\d+)px/);
  return m ? parseInt(m[1], 10) : 80;
}

function renderCell(key: string, r: Member, mode: BusinessMode, cfg: ModeConfig): ReactNode {
  const isB2B = mode === 'B2B';
  switch (key) {
    case 'no':
      return <span className={styles.cellId}>{(isB2B ? 'B' : '') + r.id}</span>;
    case 'member': {
      const [avBg, avFg] = avatarColors(r.id);
      return (
        <div className={styles.who}>
          <div className={styles.avatar} style={{ background: avBg, color: avFg }}>{r.name[0]}</div>
          <div className={styles.whoText}>
            <span className={styles.whoName}>{r.name}</span>
            <span className={styles.whoHandle}>{isB2B ? r.email : r.handle}</span>
          </div>
        </div>
      );
    }
    case 'contact':
      return (
        <div className={styles.stackCell}>
          <span className={styles.stackTop}>{r.email}</span>
          <span className={styles.stackSub}>{r.phone}</span>
        </div>
      );
    case 'grade': {
      const c = r.grade === 'VIP' ? { bg: '#f5f3ff', fg: '#6d28d9' } : r.grade === 'Gold' ? { bg: '#fffbeb', fg: '#b45309' } : { bg: '#f4f4f5', fg: '#52525b' };
      return <span className={styles.miniBadge} style={{ background: c.bg, color: c.fg }}>{r.grade}</span>;
    }
    case 'group':
      return <span className={styles.cellProvider}>{r.group}</span>;
    case 'buy':
      return (
        <div className={styles.stackCell}>
          <span className={styles.stackTop}>주문 {r.orders}건</span>
          <span className={styles.stackSub}>누적 {formatWon(r.spend)}</span>
        </div>
      );
    case 'status': {
      const s = isB2B ? r.account : r.status;
      const st = ST[s] ?? ST['정상'];
      return (
        <span className={styles.cellStatus} style={{ color: st.fg }}>
          <span className={styles.statusDot} style={{ background: st.dot }} />
          {s}
        </span>
      );
    }
    case 'joined':
      return <span className={styles.cellJoined}>{r.joined}</span>;
    case 'seen': {
      const fg = r.seen === '—' ? '#c4c4c8' : r.seenDays !== null && r.seenDays > 30 ? '#b45309' : '#52525b';
      return <span className={styles.cellSeen} style={{ color: fg }}>{r.seen}</span>;
    }
    case 'channel':
      return <span className={styles.cellProvider}>{r.provider}</span>;
    case 'mkt':
      return <span className={styles.cellProvider} style={{ color: r.marketing ? '#047857' : '#a1a1aa' }}>{r.marketing ? '동의' : '미동의'}</span>;
    case 'role':
      return <span className={styles.miniBadge} style={{ background: '#eef2ff', color: '#4338ca' }}>{cfg.badge(r)}</span>;
    case 'seller':
      return r.seller
        ? <span className={styles.miniBadge} style={{ background: r.sellerStatus === '승인' ? '#ecfdf5' : r.sellerStatus === '정지' ? '#fef2f2' : '#fffbeb', color: r.sellerStatus === '승인' ? '#047857' : r.sellerStatus === '정지' ? '#b91c1c' : '#b45309' }}>{r.sellerStatus || '미승인'}</span>
        : <span className={styles.cellMuted}>—</span>;
    case 'trade':
      return isB2B
        ? <span className={styles.miniBadge} style={{ background: r.companyTrade === '거래중' ? '#ecfdf5' : r.companyTrade === '거래중지' ? '#fef2f2' : '#f4f4f5', color: r.companyTrade === '거래중' ? '#047857' : r.companyTrade === '거래중지' ? '#b91c1c' : '#52525b' }}>{r.companyTrade || '—'}</span>
        : (
          <div className={styles.stackCell}>
            <span className={styles.stackTop}>거래 {r.tradesBuy + r.tradesSell}건</span>
            <span className={styles.stackSub}>판매 {r.tradesSell}건</span>
          </div>
        );
    case 'listings':
      return <span className={styles.cellRight}>{r.listings}</span>;
    case 'risk':
      return <span className={styles.cellRight} style={{ color: r.reports + r.disputes > 0 ? '#b91c1c' : '#a1a1aa' }}>{r.reports}/{r.disputes}</span>;
    case 'sanction':
      return r.restriction ? <span className={styles.miniBadge} style={{ background: '#fef2f2', color: '#b91c1c' }}>{r.restriction}</span> : <span className={styles.cellMuted}>—</span>;
    case 'company':
      return r.company ? <span className={styles.cellProvider}>{r.company}</span> : <span className={styles.cellMuted}>미소속</span>;
    case 'dept':
      return (
        <div className={styles.stackCell}>
          <span className={styles.stackTop}>{r.dept || '—'}</span>
          <span className={styles.stackSub}>{r.title}</span>
        </div>
      );
    case 'approval':
      return <span className={styles.miniBadge} style={{ background: r.approval === '승인 완료' ? '#ecfdf5' : '#fffbeb', color: r.approval === '승인 완료' ? '#047857' : '#b45309' }}>{r.approval}</span>;
    case 'email':
      return <span className={styles.cellEmail}>{r.email}</span>;
    default:
      return null;
  }
}

export function MembersPage() {
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') || 'all';
  const initialBusiness = searchParams.get('business');

  const [mode, setMode] = useState<BusinessMode>(() => MODES.includes(initialBusiness as BusinessMode) ? initialBusiness as BusinessMode : 'B2C');
  const [data, setData] = useState<Member[]>(MEMBERS);
  const [view, setView] = useState(initialView);
  const [q, setQ] = useState('');
  const [chips, setChips] = useState<ChipDef[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [colsOpen, setColsOpen] = useState(false);
  const [cols, setCols] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<number[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState<{ kind: 'status' | 'export'; row?: Member } | null>(null);
  const [toast, setToast] = useState('');
  const [memos, setMemos] = useState<Record<number, { when: string; by: string; text: string }[]>>({});

  const searchRef = useRef<HTMLInputElement>(null);
  const cfg = useMemo(() => getModeConfig(mode), [mode]);

  function flash(msg: string) {
    setToast(msg);
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function switchMode(next: BusinessMode) {
    setMode(next);
    setView('all');
    setChips([]);
    setQ('');
    setSel([]);
    setPage(1);
    setOpenId(null);
    setMenuOpenId(null);
    setColsOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = document.activeElement;
      const isInput = target instanceof HTMLInputElement;
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setOpenId(null);
        setAddOpen(false);
        setColsOpen(false);
        setMenuOpenId(null);
        setSel([]);
        setModal(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const rows = useMemo(() => {
    const tabDef = cfg.tabs.find((t) => t.key === view) ?? cfg.tabs[0];
    let list = data.filter((r) => tabDef.test(r));
    chips.forEach((c) => { list = list.filter((r) => c.test(r)); });
    const t = q.trim().toLowerCase();
    if (t) list = list.filter((r) => (r.name + r.email + r.phone + r.id + cfg.searchExtra(r)).toLowerCase().includes(t));
    return list.slice().sort((a, b) => (desc ? b.id - a.id : a.id - b.id));
  }, [data, cfg, view, chips, q, desc]);

  const hasChips = chips.length > 0 || q.length > 0;

  const widgetsData = useMemo(() => cfg.widgets.map((w) => {
    const items = w.keys.map((k) => ({ ...k, count: rows.filter((r) => k.test(r)).length }));
    const max = Math.max(1, ...items.map((x) => x.count));
    const total = items.reduce((a, x) => a + x.count, 0) || 1;
    return {
      ...w,
      items: items.map((x) => ({
        ...x,
        pct: (x.count / total) * 100,
        rel: (x.count / max) * 100,
        share: rows.length ? `${Math.round((x.count / rows.length) * 100)}%` : '0%',
      })),
      noteText: w.note(rows),
    };
  }), [cfg, rows]);

  const kpis = useMemo(() => cfg.kpis(data), [cfg, data]);

  const segParts = useMemo(() => {
    const parts: string[] = [];
    const tabDef = cfg.tabs.find((t) => t.key === view);
    if (tabDef && tabDef.key !== 'all') parts.push(tabDef.label);
    chips.forEach((c) => parts.push(`${c.hint} ${c.value}`));
    if (q.trim()) parts.push(`검색 "${q.trim()}"`);
    return parts.length ? parts : ['조건 없음 — 전체 회원'];
  }, [cfg, view, chips, q]);

  const segShare = rows.length === data.length ? '전체' : `${Math.round((rows.length / data.length) * 100)}%`;
  const segBarPct = data.length ? `${Math.min(100, Math.round((rows.length / data.length) * 100))}%` : '0%';
  const spark = useMemo(() => buildSpark(rows), [rows]);

  const visible = useMemo(() => cfg.columns.filter((d) => d.req || (cols[mode + d.key] ?? d.on)), [cfg, cols, mode]);
  const colToggles = useMemo(() => cfg.columns.map((d) => ({
    key: d.key,
    label: d.label,
    locked: !!d.req,
    on: d.req || (cols[mode + d.key] ?? d.on),
  })), [cfg, cols, mode]);
  const gridTemplate = useMemo(() => `28px ${visible.map((d) => d.w).join(' ')} 34px`, [visible]);
  const minWidthPx = useMemo(() => 28 + visible.reduce((a, d) => a + colMinPx(d.w), 0) + 34, [visible]);

  const openMember = openId ? data.find((r) => r.id === openId) ?? null : null;
  const detail = openMember ? buildMemberDetail(openMember, mode, cfg) : null;

  function addChip(c: ChipDef) {
    setChips((prev) => prev.filter((x) => x.hint !== c.hint).concat([c]));
    setAddOpen(false);
    setSel([]);
  }
  function removeChip(i: number) {
    setChips((prev) => prev.filter((_, j) => j !== i));
    setSel([]);
  }
  function clearAll() {
    setChips([]);
    setQ('');
    setView('all');
    setSel([]);
  }
  function toggleRowSel(id: number) {
    setSel((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.concat([id])));
  }
  function toggleAll() {
    setSel((prev) => (prev.length === rows.length ? [] : rows.map((r) => r.id)));
  }
  function toggleCol(key: string) {
    const k = mode + key;
    const def = cfg.columns.find((d) => d.key === key);
    const cur = cols[k] ?? def?.on ?? true;
    setCols((prev) => ({ ...prev, [k]: !cur }));
  }
  function handleSecondary() {
    if (!openMember || !detail) return;
    if (detail.secondaryKind === 'approve') {
      setData((prev) => prev.map((r) => (r.id === openMember.id ? { ...r, approval: '승인 완료', account: '정상' } : r)));
      flash(`${openMember.name}님의 가입을 승인했습니다`);
      return;
    }
    if (detail.secondaryKind === 'sanction') {
      flash('제재 회원 페이지에서 제재를 등록하세요');
      return;
    }
    flash('비밀번호 초기화 메일을 발송했습니다');
  }
  function handleRowMenu(label: string, r: Member) {
    setMenuOpenId(null);
    if (label === '회원 상세') { setOpenId(r.id); setTab(0); return; }
    if (/상태 변경/.test(label)) { setModal({ kind: 'status', row: r }); return; }
    if (label === '회사 보기') { flash(`거래처 관리 > 회사 > ${r.company || '미소속'} 로 이동`); return; }
    flash(`${label} — 별도 화면으로 이동`);
  }
  function submitStatus(to: string, _reason: string, _detail: string) {
    if (!modal || modal.kind !== 'status' || !modal.row) return;
    const id = modal.row.id;
    const name = modal.row.name;
    setData((prev) => prev.map((r) => (r.id === id ? (mode === 'B2B' ? { ...r, account: to } : { ...r, status: to as Member['status'] }) : r)));
    setModal(null);
    flash(`${name}님의 상태를 ${to}(으)로 변경했습니다`);
  }
  function submitExport() {
    setModal(null);
    flash('내보내기를 시작합니다');
  }
  function addMemo(id: number, text: string) {
    setMemos((prev) => ({ ...prev, [id]: [{ when: '방금', by: '운영 관리자', text }, ...(prev[id] ?? [])] }));
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headTitleRow}>
          <span className={styles.headTitle}>{cfg.unit}</span>
          <span className={styles.headTotal}>{formatNumber(TOTAL_MEMBERS)}{cfg.unitSuffix}</span>
        </div>

        <div className={styles.modeToggleWrap}>
          <span className={styles.modeToggleHint}>템플릿 모드</span>
          <div className={styles.modeToggle}>
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                className={`${styles.modeBtn} ${mode === m ? styles.active : ''}`}
                onClick={() => switchMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <span className={styles.modeNote}>{cfg.note}</span>
        </div>

        <div className={styles.spacer} />

        <div className={styles.headActions}>
          <button type="button" className={styles.densityBtn} title="밀도" onClick={() => setDense((v) => !v)}>
            {dense ? '조밀' : '보통'}
          </button>
          <div className={styles.colsWrap}>
            <button type="button" className={styles.colsBtn} onClick={() => setColsOpen((v) => !v)}>컬럼 설정</button>
            {colsOpen && (
              <div className={styles.colsMenu}>
                {colToggles.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={styles.colsItem}
                    disabled={c.locked}
                    style={{ color: c.locked ? '#a1a1aa' : '#3f3f46', cursor: c.locked ? 'default' : 'pointer' }}
                    onClick={() => toggleCol(c.key)}
                  >
                    {c.label}
                    <span className={styles.colsTag}>{c.locked ? '고정' : c.on ? '표시' : '숨김'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <ExcelDownloadButton onClick={() => setModal({ kind: 'export' })} />
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.filterZone}>
            <nav className={styles.viewNav}>
              {cfg.tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`${styles.viewBtn} ${view === t.key ? styles.active : ''}`}
                  onClick={() => { setView(t.key); setPage(1); setSel([]); }}
                >
                  {t.label}
                  <span className={styles.viewCount}>{data.filter((r) => t.test(r)).length}</span>
                </button>
              ))}
            </nav>

            <div className={styles.stepLabel} style={{ marginTop: 12 }}>
              <span className={styles.stepTitle}>조건 설정</span>
              <span className={styles.stepHint}>검색어와 조건 칩으로 대상을 좁힙니다 · {cfg.label} 조건 세트</span>
            </div>

            <div className={styles.conditionBar}>
              <SearchField
                ref={searchRef}
                value={q}
                onValueChange={(value) => { setQ(value); setSel([]); }}
                placeholder={cfg.placeholder}
                shortcutHint="/"
              />

              {chips.map((c, i) => (
                <button key={i} type="button" className={styles.chip} onClick={() => removeChip(i)}>
                  <span className={styles.chipKey}>{c.hint}</span>
                  <span className={styles.chipValue}>{c.value}</span>
                  <span className={styles.chipX}>×</span>
                </button>
              ))}

              <div className={styles.addWrap}>
                <button type="button" className={styles.addBtn} onClick={() => setAddOpen((v) => !v)}>
                  ＋ 조건
                </button>
                {addOpen && (
                  <div className={styles.addMenu}>
                    {cfg.groups.map((g) => (
                      <div key={g.label} className={styles.addGroup}>
                        <div className={styles.addGroupLabel}>{g.label}</div>
                        {g.items.map((it) => (
                          <button key={it.hint + it.value} type="button" className={styles.addItem} onClick={() => addChip(it)}>
                            {it.hint} = {it.value}
                            <span className={styles.addItemHint}>{it.hint}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {hasChips && (
                <button type="button" className={styles.clearAllBtn} onClick={clearAll}>
                  전체 해제
                </button>
              )}
            </div>

            <div className={`${styles.stepLabel} ${styles.step2}`}>
              <span className={styles.stepTitle}>조건 결과 확인 · 내보내기</span>
              <span className={styles.stepHint}>위 조건에 해당하는 {cfg.unit} 수와 구성을 확인하고 그대로 추출합니다</span>
            </div>

            <div className={styles.segBand}>
              <div className={`${styles.segCell} ${styles.segCount}`}>
                <div className={styles.segCellLabel}>조건에 맞는 {cfg.unit}</div>
                <div className={styles.segCountRow}>
                  <span className={styles.segCountValue}>{formatNumber(rows.length)}</span>
                  <span className={styles.segCountUnit}>{cfg.unitSuffix}</span>
                  <span className={styles.segCountShare}>{segShare}</span>
                </div>
                <div className={styles.segProgressTrack}>
                  <div className={styles.segProgressFill} style={{ width: segBarPct }} />
                </div>
                <div className={styles.segTagsRow}>
                  {segParts.map((p) => (
                    <span className={styles.segTag} key={p}>{p}</span>
                  ))}
                </div>
                <div className={styles.segSparkWrap}>
                  <div className={styles.segSparkHead}>
                    <span>최근 14일 접속</span>
                    <span className={styles.segSparkStat}>
                      <span className={styles.segSparkCount}>{spark.recentLabel}</span>
                      {spark.shareLabel && <span>{spark.shareLabel}</span>}
                    </span>
                  </div>
                  <div className={styles.segSparkBars}>
                    {spark.bars.map((b, i) => (
                      <span key={i} title={b.title} className={styles.segSparkBar} style={{ height: b.h, background: b.color }} />
                    ))}
                  </div>
                </div>
              </div>

              {widgetsData.map((w, wi) => (
                <div className={`${styles.segCell} ${styles.segMix}`} key={wi}>
                  <div className={styles.segCellHead}>
                    <span className={styles.segCellLabel}>{w.title}</span>
                    {w.hint && <span className={styles.segCellHint}>{w.hint}</span>}
                  </div>
                  {w.partition && (
                    <div className={styles.mixBar}>
                      {w.items.map((it) => (
                        <div key={it.label} style={{ width: `${it.pct}%`, background: it.color }} />
                      ))}
                    </div>
                  )}
                  <div className={styles.barRows}>
                    {w.items.map((it) => (
                      <button
                        type="button"
                        className={styles.barRow}
                        key={it.label}
                        disabled={!it.chip}
                        style={!it.chip ? { cursor: 'default' } : undefined}
                        onClick={() => it.chip && addChip({ hint: it.chip.hint, value: it.chip.value, test: it.test })}
                      >
                        <span className={styles.barDot} style={{ background: it.color }} />
                        <span className={styles.barLabel}>{it.label}</span>
                        <span className={styles.barTrack}>
                          <span className={styles.barFill} style={{ width: `${it.rel}%`, background: it.color, opacity: 0.75 }} />
                        </span>
                        <span className={styles.barCount}>{it.count}</span>
                        <span className={styles.barShare}>{it.share}</span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.segCellNote}>
                    <span>{w.noteText}</span>
                  </div>
                </div>
              ))}

              <div className={`${styles.segCell} ${styles.segExport}`}>
                <div>
                  <div className={styles.segCellLabel}>이 조건으로</div>
                  <div className={styles.segExportHint}>
                    {sel.length ? `${sel.length}${cfg.unitSuffix}만 선택되어 있습니다` : `조건에 맞는 ${cfg.unit} 전체를 CSV·Excel로 내려받습니다`}
                  </div>
                </div>
                <div className={styles.segExportActions}>
                  <button type="button" className={styles.exportSegBtn} onClick={() => setModal({ kind: 'export' })}>
                    {sel.length ? `선택 ${sel.length}${cfg.unitSuffix} 내보내기` : `${rows.length}${cfg.unitSuffix} 내보내기`}
                  </button>
                  <button type="button" className={styles.saveSegBtn} onClick={() => setSaved((v) => !v)}>
                    {saved ? '✓ 내 뷰에 저장됨' : '이 조건 저장'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.statsRow}>
              {kpis.map((k) => (
                <div className={styles.statItem} key={k.label}>
                  <span className={styles.statLabel}>{k.label}</span>
                  <span className={styles.statValue} style={{ color: k.color ?? '#18181b' }}>{k.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableHead}>
              <span className={styles.stepTitle}>{cfg.unit} 목록 · 개별 작업</span>
              <span className={styles.tableHeadHint}>행을 누르면 상세, 체크하면 일괄 작업</span>
              <div className={styles.spacer} />
              <button type="button" className={styles.sortBtn} onClick={() => setDesc((v) => !v)}>
                가입일순 {desc ? '↓' : '↑'}
              </button>
              <span className={styles.tableHeadResult}>조건 결과 {formatNumber(rows.length)}{cfg.unitSuffix}</span>
            </div>

            <div className={styles.tableScrollOuter}>
              <div className={styles.tableScroll}>
                <div className={styles.colHead} style={{ gridTemplateColumns: gridTemplate, minWidth: minWidthPx }}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={rows.length > 0 && sel.length === rows.length}
                    onChange={toggleAll}
                  />
                  {visible.map((d) => (
                    <span key={d.key} style={{ textAlign: d.align ?? 'left' }}>{d.label}</span>
                  ))}
                  <span />
                </div>

                <div>
                  {rows.map((r) => {
                    const isSel = sel.includes(r.id);
                    const isOpen = openId === r.id;
                    return (
                      <div
                        key={r.id}
                        className={styles.row}
                        style={{
                          gridTemplateColumns: gridTemplate,
                          minWidth: minWidthPx,
                          padding: `${dense ? 5 : 9}px 14px`,
                          background: isOpen ? '#f8fafc' : isSel ? '#f7f8ff' : 'transparent',
                          boxShadow: isOpen ? `inset 2px 0 0 ${ACCENT}` : 'none',
                        }}
                        onClick={() => { setOpenId(isOpen ? null : r.id); setTab(0); }}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSel}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleRowSel(r.id)}
                        />
                        {visible.map((d) => (
                          <div key={d.key} style={{ textAlign: d.align ?? 'left', minWidth: 0 }}>
                            {renderCell(d.key, r, mode, cfg)}
                          </div>
                        ))}
                        <div className={styles.rowMenuWrap} onClick={(e) => e.stopPropagation()}>
                          <button type="button" className={styles.rowMenuBtn} onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}>⋯</button>
                          {menuOpenId === r.id && (
                            <div className={styles.rowMenuPopover}>
                              {cfg.rowMenu.map((label) => (
                                <button
                                  key={label}
                                  type="button"
                                  className={styles.rowMenuItem}
                                  style={{ color: /정지|중지|상태 변경|제재/.test(label) ? '#b91c1c' : '#3f3f46' }}
                                  onClick={() => handleRowMenu(label, r)}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {rows.length === 0 && (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyText}>조건에 맞는 {cfg.unit}이 없습니다</div>
                      <button type="button" className={styles.emptyClear} onClick={clearAll}>조건 전체 해제</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.pager}>
              <span className={styles.rangeLabel}>1–{rows.length} / {formatNumber(TOTAL_MEMBERS)}</span>
              <div className={styles.pageButtons}>
                {PAGE_LABELS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`${styles.pageBtn} ${String(page) === label ? styles.active : ''}`}
                    onClick={() => {
                      const p = parseInt(label, 10);
                      if (p) setPage(p);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        {detail && (
          <MemberDetailDrawer
            detail={detail}
            tab={tab}
            onTabChange={setTab}
            onClose={() => setOpenId(null)}
            onToggleSuspend={() => openMember && setModal({ kind: 'status', row: openMember })}
            onSecondary={handleSecondary}
            memos={memos[detail.id] ?? []}
            onAddMemo={(text) => addMemo(detail.id, text)}
          />
        )}
      </div>

      {sel.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{sel.length}{cfg.unitSuffix} 선택</span>
          {cfg.bulk.map((b) => (
            <button key={b.label} type="button" className={styles.bulkBtn} onClick={() => flash(`${b.label} — 별도 화면으로 이동`)}>{b.label}</button>
          ))}
          <button type="button" className={styles.bulkClose} onClick={() => setSel([])}>×</button>
        </div>
      )}
      {sel.length > 0 && <div className={styles.bulkNoteFloat}>{cfg.bulkNote}</div>}

      {modal?.kind === 'status' && modal.row && (
        <MemberStatusModal
          mode={mode}
          memberName={modal.row.name}
          currentStatus={mode === 'B2B' ? modal.row.account : modal.row.status}
          onCancel={() => setModal(null)}
          onSubmit={submitStatus}
        />
      )}
      {modal?.kind === 'export' && (
        <MemberExportModal
          mode={mode}
          count={sel.length || rows.length}
          onCancel={() => setModal(null)}
          onSubmit={submitExport}
        />
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
