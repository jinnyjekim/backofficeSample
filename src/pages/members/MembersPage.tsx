import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './MembersPage.module.css';
import { MEMBERS, type Member } from '../../data/members';
import { ACCENT, STATUS_STYLE, avatarColors, formatNumber } from '../../lib/theme';
import { ADDABLE, CHANNEL_ORDER, STATS, TOTAL_MEMBERS, VIEW_LABELS, viewCount, type Chip, type ViewKey } from './membersData';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { buildMemberDetail, defaultTier, type Tier } from './memberDetail';

const VIEW_KEYS: ViewKey[] = ['all', 'new', 'risk', 'mkt'];
const PAGE_LABELS = ['‹', '1', '2', '3', '4', '5', '›'];

export function MembersPage() {
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get('view') as ViewKey) || 'all';

  const [data, setData] = useState<Member[]>(MEMBERS);
  const [view, setView] = useState<ViewKey>(initialView);
  const [q, setQ] = useState('');
  const [chips, setChips] = useState<Chip[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [sel, setSel] = useState<number[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [dense, setDense] = useState(false);
  const [tiers, setTiers] = useState<Record<number, Tier>>({});
  const [tab, setTab] = useState('basic');
  const [saved, setSaved] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

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
        setSel([]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const rows = useMemo(() => {
    let list = data.slice();
    if (view === 'new') list = list.filter((r) => r.fresh);
    if (view === 'risk') list = list.filter((r) => r.status === '정지' || r.status === '휴면');
    if (view === 'mkt') list = list.filter((r) => r.marketing);
    chips.forEach((c) => {
      list = list.filter((r) => String(r[c.field]) === c.value);
    });
    const t = q.trim().toLowerCase();
    if (t) list = list.filter((r) => (r.name + r.handle + r.email + r.id).toLowerCase().includes(t));
    list.sort((a, b) => (desc ? b.id - a.id : a.id - b.id));
    return list;
  }, [data, view, chips, q, desc]);

  const hasChips = chips.length > 0 || q.length > 0;

  const mix = useMemo(() => {
    return (['정상', '휴면', '정지', '탈퇴'] as const)
      .map((k) => ({ label: k, count: rows.filter((r) => r.status === k).length, color: STATUS_STYLE[k].dot }))
      .filter((x) => x.count > 0)
      .map((x) => ({ ...x, pct: rows.length ? (x.count / rows.length) * 100 : 0 }));
  }, [rows]);

  const channels = useMemo(() => {
    const chMax = Math.max(1, ...CHANNEL_ORDER.map((p) => rows.filter((r) => r.provider === p).length));
    return CHANNEL_ORDER.map((p) => {
      const count = rows.filter((r) => r.provider === p).length;
      return { label: p, count, pct: (count / chMax) * 100, color: count ? ACCENT : '#e4e4e7' };
    });
  }, [rows]);

  const segDesc = useMemo(() => {
    const parts: string[] = [];
    if (view !== 'all') parts.push(VIEW_LABELS[view]);
    chips.forEach((c) => parts.push(c.hint + ' ' + (c.value === 'true' ? '동의' : c.value)));
    if (q.trim()) parts.push('검색 "' + q.trim() + '"');
    return parts.length ? parts.join(' · ') : '조건 없음 — 전체 회원';
  }, [view, chips, q]);

  const segShare = rows.length === data.length ? '전체' : Math.round((rows.length / data.length) * 100) + '%';

  const openMember = openId ? data.find((r) => r.id === openId) ?? null : null;
  const tier: Tier = openMember ? tiers[openMember.id] ?? defaultTier(openMember) : '일반';
  const detail = openMember ? buildMemberDetail(openMember, tier) : null;

  function addChip(c: Chip) {
    setChips((prev) => prev.concat([c]));
    setAddOpen(false);
    setSel([]);
  }
  function removeChip(i: number) {
    setChips((prev) => prev.filter((_, j) => j !== i));
    setSel([]);
  }
  function pickChannel(p: string) {
    setChips((prev) => prev.filter((c) => c.field !== 'provider').concat([{ field: 'provider', value: p, hint: '경로', label: `가입 경로 = ${p}` }]));
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
  function toggleSuspend(id: number) {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: r.status === '정지' ? '정상' : '정지' } : r)));
  }
  function suspendSelected() {
    setData((prev) => prev.map((r) => (sel.includes(r.id) ? { ...r, status: '정지' } : r)));
    setSel([]);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headTitleRow}>
          <span className={styles.headTitle}>회원</span>
          <span className={styles.headTotal}>{formatNumber(TOTAL_MEMBERS)}명</span>
        </div>

        <nav className={styles.viewNav}>
          {VIEW_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`${styles.viewBtn} ${view === k ? styles.active : ''}`}
              onClick={() => {
                setView(k);
                setPage(1);
                setSel([]);
              }}
            >
              {VIEW_LABELS[k]}
              <span className={styles.viewCount}>{viewCount(k, data)}</span>
            </button>
          ))}
        </nav>

        <div className={styles.spacer} />

        <div className={styles.headActions}>
          <button type="button" className={styles.densityBtn} title="밀도" onClick={() => setDense((v) => !v)}>
            {dense ? '조밀' : '보통'}
          </button>
          <button type="button" className={styles.exportBtn}>
            <span>↓</span>내보내기
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.filterZone}>
            <div className={styles.stepLabel}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepTitle}>조건 설정</span>
              <span className={styles.stepHint}>검색어와 조건 칩으로 대상을 좁힙니다</span>
            </div>

            <div className={styles.conditionBar}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>⌕</span>
                <input
                  ref={searchRef}
                  className={styles.searchInput}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSel([]);
                  }}
                  placeholder="이름 · 이메일 · 회원번호 · @아이디 — 무엇이든 입력"
                />
                <span className={styles.slashKey}>/</span>
              </div>

              {chips.map((c, i) => (
                <button key={i} type="button" className={styles.chip} onClick={() => removeChip(i)}>
                  <span className={styles.chipKey}>{c.hint}</span>
                  <span className={styles.chipValue}>{c.value === 'true' ? '동의' : c.value}</span>
                  <span className={styles.chipX}>×</span>
                </button>
              ))}

              <div className={styles.addWrap}>
                <button type="button" className={styles.addBtn} onClick={() => setAddOpen((v) => !v)}>
                  ＋ 조건
                </button>
                {addOpen && (
                  <div className={styles.addMenu}>
                    {ADDABLE.map((a) => (
                      <button key={a.label} type="button" className={styles.addItem} onClick={() => addChip(a)}>
                        {a.label}
                        <span className={styles.addItemHint}>{a.hint}</span>
                      </button>
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
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepTitle}>조건 결과 확인 · 내보내기</span>
              <span className={styles.stepHint}>위 조건에 해당하는 회원 수와 구성을 확인하고 그대로 추출합니다</span>
            </div>

            <div className={styles.segBand}>
              <div className={`${styles.segCell} ${styles.segCount}`}>
                <div className={styles.segCellLabel}>조건에 맞는 회원</div>
                <div className={styles.segCountRow}>
                  <span className={styles.segCountValue}>{formatNumber(rows.length)}</span>
                  <span className={styles.segCountUnit}>명</span>
                  <span className={styles.segCountShare}>{segShare}</span>
                </div>
                <div className={styles.segCountDesc}>{segDesc}</div>
              </div>

              <div className={`${styles.segCell} ${styles.segMix}`}>
                <div className={styles.segCellLabel} style={{ marginBottom: 9 }}>상태 구성</div>
                <div className={styles.mixBar}>
                  {mix.map((m) => (
                    <div key={m.label} style={{ width: `${m.pct}%`, background: m.color }} />
                  ))}
                </div>
                <div className={styles.mixLegend}>
                  {mix.map((m) => (
                    <div className={styles.mixLegendItem} key={m.label}>
                      <span className={styles.mixDot} style={{ background: m.color }} />
                      <span className={styles.mixLabel}>{m.label}</span>
                      <span className={styles.mixCount}>{m.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${styles.segCell} ${styles.segChannel}`}>
                <div className={styles.segCellLabel} style={{ marginBottom: 9 }}>가입 경로</div>
                {channels.map((c) => (
                  <button type="button" className={styles.channelRow} key={c.label} onClick={() => pickChannel(c.label)}>
                    <span className={styles.channelLabel}>{c.label}</span>
                    <span className={styles.channelTrack}>
                      <span className={styles.channelFill} style={{ width: `${c.pct}%`, background: c.color }} />
                    </span>
                    <span className={styles.channelCount}>{c.count}</span>
                  </button>
                ))}
              </div>

              <div className={`${styles.segCell} ${styles.segExport}`}>
                <div>
                  <div className={styles.segCellLabel}>이 조건으로</div>
                  <div className={styles.segExportHint}>
                    {sel.length ? `${sel.length}명만 선택되어 있습니다` : '조건에 맞는 회원 전체를 CSV·Excel로 내려받습니다'}
                  </div>
                </div>
                <div className={styles.segExportActions}>
                  <button type="button" className={styles.exportSegBtn}>
                    {sel.length ? `선택 ${sel.length}명 내보내기` : `${rows.length}명 내보내기`}
                  </button>
                  <button type="button" className={styles.saveSegBtn} onClick={() => setSaved((v) => !v)}>
                    {saved ? '✓ 내 뷰에 저장됨' : '이 조건 저장'}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.statsRow}>
              {STATS.map((s) => (
                <div className={styles.statItem} key={s.label}>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
                  <span className={styles.statDelta} style={{ color: s.deltaColor }}>{s.delta}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableHead}>
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepTitle}>회원 목록 · 개별 작업</span>
              <span className={styles.tableHeadHint}>행을 누르면 상세, 체크하면 일괄 작업</span>
              <div className={styles.spacer} />
              <span className={styles.tableHeadResult}>조건 결과 {formatNumber(rows.length)}명</span>
            </div>

            <div className={styles.tableScrollOuter}>
              <div className={styles.tableScroll}>
                <div className={styles.colHead}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={rows.length > 0 && sel.length === rows.length}
                    onChange={toggleAll}
                  />
                  <span>번호</span>
                  <span>회원</span>
                  <span>이메일</span>
                  <span>경로</span>
                  <span>상태</span>
                  <button type="button" className={styles.sortBtn} onClick={() => setDesc((v) => !v)}>
                    가입일 {desc ? '↓' : '↑'}
                  </button>
                  <span>최근 접속</span>
                </div>

                <div>
                  {rows.map((r) => {
                    const [avBg, avFg] = avatarColors(r.id);
                    const isSel = sel.includes(r.id);
                    const isOpen = openId === r.id;
                    const seenFg = r.seen === '—' ? '#c4c4c8' : /일 전/.test(r.seen) && parseInt(r.seen) > 30 ? '#b45309' : '#52525b';
                    return (
                      <div
                        key={r.id}
                        className={styles.row}
                        style={{
                          padding: `${dense ? 5 : 9}px 14px`,
                          background: isOpen ? '#f8fafc' : isSel ? '#f7f8ff' : 'transparent',
                          boxShadow: isOpen ? `inset 2px 0 0 ${ACCENT}` : 'none',
                        }}
                        onClick={() => setOpenId(isOpen ? null : r.id)}
                      >
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={isSel}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleRowSel(r.id)}
                        />
                        <span className={styles.cellId}>{r.id}</span>
                        <div className={styles.who}>
                          <div className={styles.avatar} style={{ background: avBg, color: avFg }}>{r.name[0]}</div>
                          <div className={styles.whoText}>
                            <span className={styles.whoName}>{r.name}</span>
                            <span className={styles.whoHandle}>{r.handle}</span>
                          </div>
                        </div>
                        <span className={styles.cellEmail}>{r.email}</span>
                        <span className={styles.cellProvider}>{r.provider}</span>
                        <span className={styles.cellStatus} style={{ color: STATUS_STYLE[r.status].fg }}>
                          <span className={styles.statusDot} style={{ background: STATUS_STYLE[r.status].dot }} />
                          {r.status}
                        </span>
                        <span className={styles.cellJoined}>{r.joined}</span>
                        <span className={styles.cellSeen} style={{ color: seenFg }}>{r.seen}</span>
                      </div>
                    );
                  })}
                  {rows.length === 0 && (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyText}>조건에 맞는 회원이 없습니다</div>
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
            onToggleSuspend={() => toggleSuspend(detail.id)}
            onTierChange={(t) => setTiers((prev) => ({ ...prev, [detail.id]: t }))}
          />
        )}
      </div>

      {sel.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{sel.length}명 선택</span>
          <button type="button" className={styles.bulkBtn}>태그 지정</button>
          <button type="button" className={styles.bulkBtn}>쿠폰 발급</button>
          <button type="button" className={styles.bulkBtnDanger} onClick={suspendSelected}>이용 정지</button>
          <button type="button" className={styles.bulkBtnPrimary}>내보내기</button>
          <button type="button" className={styles.bulkClose} onClick={() => setSel([])}>×</button>
        </div>
      )}
    </div>
  );
}
