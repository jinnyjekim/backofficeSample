import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { useMemo, useState } from 'react';
import styles from './RecordsPage.module.css';
import { BAN_MEMBERS, LEFT_MEMBERS, type BanMember, type LeftMember, type MemberBusinessType } from '../../data/members';
import { buildBanView, buildLeftView } from './recordsData';
import { buildBanDetail, buildLeftDetail } from './recordDetail';
import { RecordDetailDrawer } from './RecordDetailDrawer';
import { SanctionModal, type SanctionSubmit } from './SanctionModal';
import { SANCTION_LEVEL, type SanctionMode } from './sanctionOptions';
import { formatNumber } from '../../lib/theme';
import { CommonButton, CommonInput } from '../../components/common';
import { DataGrid } from '../../components/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';

const PAGE_LABELS = ['‹', '1', '2', '3', '4', '5', '›'];
const BUSINESS_MODES: MemberBusinessType[] = ['B2C', 'C2C', 'B2B'];
const LEFT_MODE_NOTES: Record<MemberBusinessType, string> = {
  B2C: '구매·포인트 기준',
  C2C: '거래·판매대금 기준',
  B2B: '회사·권한 기준',
};
const BAN_MODE_NOTES: Record<MemberBusinessType, string> = {
  B2C: '고객·구매 영향 기준',
  C2C: '거래·판매 위험 기준',
  B2B: '회사·계정 권한 기준',
};

interface Props {
  kind: 'left' | 'ban';
}

interface ModalState {
  mode: SanctionMode;
  target: BanMember | null;
}

export function RecordsPage({ kind }: Props) {
  const [mode, setMode] = useState<MemberBusinessType>('B2C');
  const [filter, setFilter] = useState('전체');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [banData, setBanData] = useState<BanMember[]>(BAN_MEMBERS);
  const [modal, setModal] = useState<ModalState | null>(null);

  // 상세 필터 상태
  const [detailOpen, setDetailOpen] = useState(false);
  const [leftType, setLeftType] = useState('전체');
  const [leftFollowUp, setLeftFollowUp] = useState('전체');
  const [leftData, setLeftData] = useState('전체');
  const [banState, setBanState] = useState('전체');
  const [banHow, setBanHow] = useState('전체');
  const [extraRole, setExtraRole] = useState('전체');

  const isLeft = kind === 'left';
  const hasExtraFilter = isLeft
    ? leftType !== '전체' || leftFollowUp !== '전체' || leftData !== '전체' || extraRole !== '전체'
    : banState !== '전체' || banHow !== '전체' || extraRole !== '전체';

  const filteredLeftSource = useMemo(() => {
    return LEFT_MEMBERS.filter((r) => {
      if (leftType !== '전체' && r.type !== leftType) return false;
      if (leftFollowUp !== '전체' && r.followUp !== leftFollowUp) return false;
      if (leftData !== '전체' && r.data !== leftData) return false;
      if (extraRole !== '전체') {
        if (mode === 'B2C' && r.grade !== extraRole) return false;
        if (mode === 'C2C') {
          if (extraRole === 'buyer' && !r.buyer) return false;
          if (extraRole === 'seller' && !r.seller) return false;
          if (extraRole === 'both' && (!r.buyer || !r.seller)) return false;
        }
        if (mode === 'B2B' && r.role !== extraRole) return false;
      }
      return true;
    });
  }, [leftType, leftFollowUp, leftData, extraRole, mode]);

  const filteredBanSource = useMemo(() => {
    return banData.filter((r) => {
      if (banState !== '전체' && r.state !== banState) return false;
      if (banHow !== '전체' && r.how !== banHow) return false;
      if (extraRole !== '전체') {
        if (mode === 'B2C' && r.grade !== extraRole) return false;
        if (mode === 'C2C') {
          if (extraRole === 'buyer' && !r.buyer) return false;
          if (extraRole === 'seller' && !r.seller) return false;
          if (extraRole === 'both' && (!r.buyer || !r.seller)) return false;
        }
        if (mode === 'B2B' && r.role !== extraRole) return false;
      }
      return true;
    });
  }, [banData, banState, banHow, extraRole, mode]);

  const rec = useMemo(
    () => (isLeft ? buildLeftView(filteredLeftSource, filter, query, mode) : buildBanView(filteredBanSource, filter, query, mode)),
    [isLeft, filter, query, mode, filteredLeftSource, filteredBanSource],
  );

  const openRow = openId != null
    ? (isLeft ? LEFT_MEMBERS.find((r) => r.id === openId) : banData.find((r) => r.id === openId))
    : null;
  const detail = openRow
    ? (isLeft ? buildLeftDetail(openRow as LeftMember) : buildBanDetail(openRow as BanMember))
    : null;
  const banTarget = !isLeft && openRow ? (openRow as BanMember) : null;

  function switchMode(next: MemberBusinessType) {
    setMode(next);
    setFilter('전체');
    setQuery('');
    setOpenId(null);
    setPage(1);
    setLeftType('전체');
    setLeftFollowUp('전체');
    setLeftData('전체');
    setBanState('전체');
    setBanHow('전체');
    setExtraRole('전체');
  }

  function clearAll() {
    setQuery('');
    setFilter('전체');
    setPage(1);
    setLeftType('전체');
    setLeftFollowUp('전체');
    setLeftData('전체');
    setBanState('전체');
    setBanHow('전체');
    setExtraRole('전체');
    setDetailOpen(false);
  }

  function applySanction(result: SanctionSubmit) {
    if (result.mode === 'add') {
      const newRow: BanMember = {
        id: result.id!,
        name: result.name!,
        email: result.email || '—',
        handle: '@new_member',
        phone: '010-0000-****',
        provider: 'Email',
        businessType: mode,
        joined: '2026.08.27',
        type: result.type!,
        level: SANCTION_LEVEL[result.type!] ?? 3,
        reason: result.reason!,
        detail: result.detail!,
        start: result.start!,
        end: result.end ?? '—',
        state: '제재중',
        count: 1,
        by: '운영 관리자',
        how: '관리자 직접',
        evidence: [],
        grade: mode === 'B2C' ? 'Normal' : '',
        orders: 0,
        spend: 0,
        buyer: mode !== 'B2B',
        seller: false,
        listings: 0,
        tradesBuy: 0,
        tradesSell: 0,
        reports: 0,
        disputes: 0,
        company: '',
        companyCode: '',
        dept: '',
        title: '',
        role: '일반 사용자',
      };
      setBanData((prev) => [newRow, ...prev]);
      setModal(null);
      return;
    }

    const targetId = modal?.target?.id;
    if (targetId == null) {
      setModal(null);
      return;
    }
    setBanData((prev) => prev.map((r) => {
      if (r.id !== targetId) return r;
      if (result.mode === 'release') return { ...r, state: '해제' as const, end: r.end === '—' ? r.end : r.end };
      if (result.mode === 'extend') return { ...r, end: result.end ?? r.end };
      if (result.mode === 'change') {
        return {
          ...r,
          type: result.type ?? r.type,
          level: SANCTION_LEVEL[result.type ?? r.type] ?? r.level,
          reason: result.reason ?? r.reason,
          detail: result.detail ?? r.detail,
          end: result.end ?? r.end,
          count: r.count + 1,
        };
      }
      return r;
    }));
    setModal(null);
  }

  return (
    <div className={styles.page}>
      {detail && (
        <RecordDetailDrawer
          detail={detail}
          onClose={() => setOpenId(null)}
          onAction={banTarget ? () => setModal({ mode: 'release', target: banTarget }) : undefined}
          actionDisabled={banTarget ? banTarget.state !== '제재중' : false}
          extraActions={
            banTarget && banTarget.state === '제재중'
              ? [
                  { label: '변경', onClick: () => setModal({ mode: 'change', target: banTarget }) },
                  { label: '연장', onClick: () => setModal({ mode: 'extend', target: banTarget }) },
                ]
              : undefined
          }
        />
      )}

      {modal && (
        <SanctionModal
          mode={modal.mode}
          target={modal.target}
          onCancel={() => setModal(null)}
          onSubmit={applySanction}
        />
      )}

      <header className={styles.header}>
        <div className={styles.headTitleRow}>
          <span className={styles.headTitle}>{rec.title}</span>
          <span className={styles.headTotal}>{rec.total}</span>
        </div>
        <div className={styles.modeToggleWrap}>
          <span className={styles.modeToggleHint}>비즈니스 유형</span>
          <div className={styles.modeToggle}>
            {BUSINESS_MODES.map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.modeBtn} ${mode === item ? styles.active : ''}`}
                onClick={() => switchMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <span className={styles.modeNote}>{(isLeft ? LEFT_MODE_NOTES : BAN_MODE_NOTES)[mode]}</span>
        </div>
        <nav className={styles.viewNav}>
          {rec.views.map((v) => (
            <span key={v.label} className={`${styles.viewBtn} ${v.active ? styles.active : ''}`}>
              {v.label}
              <span className={styles.viewCount}>{formatNumber(v.count)}</span>
            </span>
          ))}
        </nav>
        <div className={styles.spacer} />
        <button type="button" className={styles.exportBtn}>내보내기</button>
      </header>

      <div className={styles.body}>
        <div className={styles.filterZone}>
          <div className={styles.filterBox} data-filter-expanded={detailOpen}>
            <div className={styles.searchRow}>
              <CommonInput
                className={styles.searchInput}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={rec.placeholder}
                clearable
                onClear={() => { setQuery(''); setPage(1); }}
              />
              <CommonButton type="button" variant="emphasis" size="md" className={styles.searchBtn} onClick={() => setPage(1)}>
                검색
              </CommonButton>

              <div className={styles.quickFilters}>
                {rec.filters.map((f) => (
                  <CommonButton
                    key={f.label}
                    variant={f.active ? 'primary-light' : 'secondary'}
                    size="md"
                    className={`${styles.quickFilterBtn} ${f.active ? styles.active : ''}`}
                    onClick={() => { setFilter(f.label); setPage(1); }}
                  >
                    <span className={styles.quickFilterLabel}>{f.label}</span>
                    <span className={styles.quickFilterCount}>{f.count}</span>
                  </CommonButton>
                ))}
              </div>

              <div className={styles.spacer} />

              <CommonButton
                type="button"
                variant="secondary"
                size="md"
                className="detailFilterBtn"
                aria-expanded={detailOpen}
                onClick={() => setDetailOpen((v) => !v)}
              >
                상세 필터
              </CommonButton>

              <CommonButton type="button" variant="secondary" size="md" className={styles.clearBtn} onClick={clearAll}>
                초기화
              </CommonButton>
            </div>

            <div className={styles.filterRow}>
              {isLeft ? (
                <>
                  <label className="globalFilterField">
                    <span>탈퇴 유형</span>
                    <select
                      aria-label="탈퇴 유형"
                      className={styles.smallSelect}
                      value={leftType}
                      onChange={(e) => { setLeftType(e.target.value); setPage(1); }}
                    >
                      <option value="전체">전체</option>
                      <option value="직접탈퇴">직접탈퇴</option>
                      <option value="관리자처리">관리자처리</option>
                    </select>
                  </label>

                  <label className="globalFilterField">
                    <span>후속 조치</span>
                    <select
                      aria-label="후속 조치"
                      className={styles.smallSelect}
                      value={leftFollowUp}
                      onChange={(e) => { setLeftFollowUp(e.target.value); setPage(1); }}
                    >
                      <option value="전체">전체</option>
                      <option value="완료">완료</option>
                      <option value="확인필요">확인필요</option>
                    </select>
                  </label>

                  <label className="globalFilterField">
                    <span>데이터 보관</span>
                    <select
                      aria-label="데이터 보관"
                      className={styles.smallSelect}
                      value={leftData}
                      onChange={(e) => { setLeftData(e.target.value); setPage(1); }}
                    >
                      <option value="전체">전체</option>
                      <option value="보관중">보관중</option>
                      <option value="파기완료">파기완료</option>
                    </select>
                  </label>

                  {mode === 'B2C' && (
                    <label className="globalFilterField">
                      <span>고객 등급</span>
                      <select
                        aria-label="고객 등급"
                        className={styles.smallSelect}
                        value={extraRole}
                        onChange={(e) => { setExtraRole(e.target.value); setPage(1); }}
                      >
                        <option value="전체">전체</option>
                        <option value="Gold">Gold</option>
                        <option value="Normal">Normal</option>
                      </select>
                    </label>
                  )}

                  {mode === 'C2C' && (
                    <label className="globalFilterField">
                      <span>이용 역할</span>
                      <select
                        aria-label="이용 역할"
                        className={styles.smallSelect}
                        value={extraRole}
                        onChange={(e) => { setExtraRole(e.target.value); setPage(1); }}
                      >
                        <option value="전체">전체</option>
                        <option value="buyer">구매 이용</option>
                        <option value="seller">판매 이용</option>
                        <option value="both">구매·판매</option>
                      </select>
                    </label>
                  )}

                  {mode === 'B2B' && (
                    <label className="globalFilterField">
                      <span>소속 권한</span>
                      <select
                        aria-label="소속 권한"
                        className={styles.smallSelect}
                        value={extraRole}
                        onChange={(e) => { setExtraRole(e.target.value); setPage(1); }}
                      >
                        <option value="전체">전체</option>
                        <option value="관리자">관리자</option>
                        <option value="승인 담당자">승인 담당자</option>
                        <option value="일반 사용자">일반 사용자</option>
                      </select>
                    </label>
                  )}
                </>
              ) : (
                <>
                  <label className="globalFilterField">
                    <span>제재 상태</span>
                    <select
                      aria-label="제재 상태"
                      className={styles.smallSelect}
                      value={banState}
                      onChange={(e) => { setBanState(e.target.value); setPage(1); }}
                    >
                      <option value="전체">전체</option>
                      <option value="제재중">제재중</option>
                      <option value="만료">만료</option>
                      <option value="해제">해제</option>
                    </select>
                  </label>

                  <label className="globalFilterField">
                    <span>처리 방식</span>
                    <select
                      aria-label="처리 방식"
                      className={styles.smallSelect}
                      value={banHow}
                      onChange={(e) => { setBanHow(e.target.value); setPage(1); }}
                    >
                      <option value="전체">전체</option>
                      <option value="관리자 직접">관리자 직접</option>
                      <option value="신고 처리">신고 처리</option>
                      <option value="자동 탐지">자동 탐지</option>
                    </select>
                  </label>

                  {mode === 'B2C' && (
                    <label className="globalFilterField">
                      <span>고객 등급</span>
                      <select
                        aria-label="고객 등급"
                        className={styles.smallSelect}
                        value={extraRole}
                        onChange={(e) => { setExtraRole(e.target.value); setPage(1); }}
                      >
                        <option value="전체">전체</option>
                        <option value="Gold">Gold</option>
                        <option value="Normal">Normal</option>
                      </select>
                    </label>
                  )}

                  {mode === 'C2C' && (
                    <label className="globalFilterField">
                      <span>이용 역할</span>
                      <select
                        aria-label="이용 역할"
                        className={styles.smallSelect}
                        value={extraRole}
                        onChange={(e) => { setExtraRole(e.target.value); setPage(1); }}
                      >
                        <option value="전체">전체</option>
                        <option value="buyer">구매 이용</option>
                        <option value="seller">판매 이용</option>
                        <option value="both">구매·판매</option>
                      </select>
                    </label>
                  )}

                  {mode === 'B2B' && (
                    <label className="globalFilterField">
                      <span>소속 권한</span>
                      <select
                        aria-label="소속 권한"
                        className={styles.smallSelect}
                        value={extraRole}
                        onChange={(e) => { setExtraRole(e.target.value); setPage(1); }}
                      >
                        <option value="전체">전체</option>
                        <option value="관리자">관리자</option>
                        <option value="승인 담당자">승인 담당자</option>
                        <option value="일반 사용자">일반 사용자</option>
                      </select>
                    </label>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={`${styles.stepLabel} ${styles.step2}`}>
            <span className={styles.stepTitle}>{rec.summaryTitle}</span>
            <span className={styles.stepHint}>{rec.summaryHint}</span>
          </div>

          <div className={styles.statsBand}>
            {rec.stats.map((s) => (
              <div className={styles.statCell} key={s.label}>
                <div className={styles.statCellLabel}>{s.label}</div>
                <div className={styles.statCellValueRow}>
                  <span className={styles.statCellValue} style={{ color: s.color }}>{s.value}</span>
                  <span className={styles.statCellUnit}>{s.unit}</span>
                </div>
                <div className={styles.statCellSub}>{s.sub}</div>
              </div>
            ))}
            <div className={styles.ctaCell}>
              <div>
                <div className={styles.statCellLabel}>{rec.ctaLabel}</div>
                <div className={styles.ctaHint}>{rec.ctaHint}</div>
              </div>
              <button
                type="button"
                className={styles.ctaButton}
                onClick={!isLeft ? () => setModal({ mode: 'add', target: null }) : undefined}
              >
                {rec.ctaButton}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHead}>
            <span className={styles.stepTitle}>{rec.listTitle}</span>
            <span className={styles.tableHeadHint}>{rec.listHint}</span>
            <div className={styles.spacer} />
            <span className={styles.tableHeadResult}>{rec.resultLabel}</span>
            <div className={styles.resultActions}>
              <ExcelDownloadButton type="button" data-grid-download />
              <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
                <option>20개씩 보기</option>
                <option>50개씩 보기</option>
              </select>
            </div>
          </div>

          <DataGrid
            columns={rec.cols.map((column) => ({ label: column.label, align: column.align }))}
            rows={rec.rows.map((row): GridRow => ({
              id: row.raw.id,
              bg: openId === row.raw.id ? '#f8fafc' : undefined,
              onClick: () => setOpenId(openId === row.raw.id ? null : row.raw.id),
              cells: row.cells.map((cell) => cell.pill
                ? { kind: 'pillText', text: cell.text, bg: cell.pill.bg, fg: cell.pill.fg, sub: cell.sub, align: cell.align }
                : cell.sub
                  ? { kind: 'stack', title: cell.text, subtitle: cell.sub, align: cell.align }
                  : { kind: 'text', text: cell.text, color: cell.color, size: cell.size, weight: cell.weight, align: cell.align }),
            }))}
            gridTemplate={rec.grid}
            minWidth={rec.minWidth}
            pages={PAGE_LABELS.map((label) => ({ label, active: String(page) === label, onClick: () => { const nextPage = parseInt(label, 10); if (nextPage) setPage(nextPage); } }))}
            rangeLabel={rec.rangeLabel}
            empty={rec.rows.length === 0}
            emptyText="조건에 맞는 기록이 없습니다."
          />
        </div>
      </div>
    </div>
  );
}
