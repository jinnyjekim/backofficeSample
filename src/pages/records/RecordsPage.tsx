import { useMemo, useState } from 'react';
import styles from './RecordsPage.module.css';
import { BAN_MEMBERS, LEFT_MEMBERS, type BanMember, type LeftMember, type MemberBusinessType } from '../../data/members';
import { buildBanView, buildLeftView } from './recordsData';
import { buildBanDetail, buildLeftDetail } from './recordDetail';
import { RecordDetailDrawer } from './RecordDetailDrawer';
import { SanctionModal, type SanctionSubmit } from './SanctionModal';
import { SANCTION_LEVEL, type SanctionMode } from './sanctionOptions';
import { formatNumber } from '../../lib/theme';
import { SearchField } from '../../components/SearchField';
import { CommonButton } from '../../components/common';

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

  const isLeft = kind === 'left';
  const rec = useMemo(
    () => (isLeft ? buildLeftView(LEFT_MEMBERS, filter, query, mode) : buildBanView(banData, filter, query, mode)),
    [isLeft, filter, query, mode, banData],
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
          <div className={styles.stepLabel}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepTitle}>조건 설정</span>
            <span className={styles.stepHint}>{rec.filterHint}</span>
          </div>

          <div className={styles.conditionBar}>
            <SearchField
              value={query}
              onValueChange={setQuery}
              placeholder={rec.placeholder}
            />
            {rec.filters.map((f) => (
              <CommonButton
                key={f.label}
                variant={f.active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.filterBtn} ${f.active ? styles.active : ''}`}
                onClick={() => setFilter(f.label)}
              >
                {f.label}
                <span className={styles.filterCount}>{f.count}</span>
              </CommonButton>
            ))}
          </div>

          <div className={`${styles.stepLabel} ${styles.step2}`}>
            <span className={styles.stepNum}>2</span>
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
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepTitle}>{rec.listTitle}</span>
            <span className={styles.tableHeadHint}>{rec.listHint}</span>
            <div className={styles.spacer} />
            <span className={styles.tableHeadResult}>{rec.resultLabel}</span>
          </div>

          <div className={styles.tableScroll}>
            <div className={styles.colHead} style={{ minWidth: rec.minWidth, gridTemplateColumns: rec.grid }}>
              {rec.cols.map((c) => (
                <span key={c.label} style={{ textAlign: c.align }}>{c.label}</span>
              ))}
            </div>
            <div>
              {rec.rows.map((r) => (
                <div
                  key={r.raw.id}
                  className={styles.row}
                  style={{
                    minWidth: rec.minWidth,
                    gridTemplateColumns: rec.grid,
                    background: openId === r.raw.id ? '#f8fafc' : 'transparent',
                  }}
                  onClick={() => setOpenId(openId === r.raw.id ? null : r.raw.id)}
                >
                  {r.cells.map((c, i) => (
                    <div className={styles.cellWrap} style={{ textAlign: c.align }} key={i}>
                      <span
                        className={styles.cellText}
                        style={{
                          background: c.pill?.bg,
                          color: c.pill?.fg ?? c.color,
                          padding: c.pill ? '2px 8px' : 0,
                          fontSize: c.pill ? '11px' : c.size,
                          fontWeight: c.pill ? 600 : c.weight,
                        }}
                      >
                        {c.text}
                      </span>
                      {c.sub && <span className={styles.cellSub}>{c.sub}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.pager}>
            <span className={styles.rangeLabel}>{rec.rangeLabel}</span>
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
      </div>
    </div>
  );
}
