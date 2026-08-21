import { ACCENT } from '../../lib/theme';
import { CONFIRM_META, MATCH_META, fmtWon, type Deposit, type DepositResult, type InvoiceCandidate, type Memo, type HistoryEntry } from './depositConfirmData';

export interface TabDef {
  key: string;
  label: string;
  weight: number;
  fg: string;
  mark: string;
  active: boolean;
}

export interface FieldRow {
  label: string;
  value: string;
  weight: number;
  color: string;
}

export interface CheckRow {
  icon: string;
  label: string;
  color: string;
}

export interface DepositDetailUI {
  activeTab: string;
  showHoldPanel: boolean;
}

export interface DepositDetailActions {
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onConfirmDeposit: () => void;
  onResume: () => void;
  onToggleHoldPanel: () => void;
  onConfirmHold: () => void;
}

export interface DepositDetail {
  depositor: string;
  amount: string;
  depositedAt: string;
  confirmLabel: string;
  confirmBg: string;
  confirmFg: string;
  matchLabel: string;
  matchBg: string;
  matchFg: string;
  close: () => void;

  hasIssue: boolean;
  issueLabel: string | null;

  hasCandidate: boolean;
  candidatePartner: string;
  candidateInvoice: string;
  candidateAmount: string;

  canConfirm: boolean;
  canResume: boolean;
  confirmDeposit: () => void;
  resume: () => void;
  showHoldPanel: boolean;
  toggleHoldPanel: () => void;
  confirmHold: () => void;

  tabs: TabDef[];
  isInfo: boolean;
  isMatch: boolean;
  isVerify: boolean;
  isResult: boolean;
  isDocs: boolean;
  isHistory: boolean;

  infoFields: FieldRow[];
  invoiceCandidates: InvoiceCandidate[];
  verifyFields: FieldRow[];
  checks: CheckRow[];

  isConfirmed: boolean;
  notConfirmed: boolean;
  resultFields: { label: string; value: string }[];

  docs: string[];
  memos: Memo[];
  history: HistoryEntry[];
}

const TABS: [string, string][] = [
  ['info', '입금정보'],
  ['match', '거래처/청구매칭'],
  ['verify', '금액검증'],
  ['result', '수금반영'],
  ['docs', '증빙/메모'],
  ['history', '처리이력'],
];

export function buildDepositDetail(d: Deposit, ui: DepositDetailUI, actions: DepositDetailActions): DepositDetail {
  const cm = CONFIRM_META[d.confirmStatus];
  const mm = MATCH_META[d.matchStatus];
  const tabs: TabDef[] = TABS.map(([key, label]) => {
    const active = ui.activeTab === key;
    return {
      key,
      label,
      weight: active ? 700 : 500,
      fg: active ? '#18181b' : '#8b8b93',
      mark: active ? `inset 0 -2px 0 ${ACCENT}` : 'none',
      active,
    };
  });
  const exactMatch = d.invoiceCandidates.some((ic) => ic.remaining === fmtWon(d.amount));

  const result: DepositResult | null = d.result;

  return {
    depositor: d.depositor,
    amount: fmtWon(d.amount),
    depositedAt: d.depositedAt,
    confirmLabel: d.confirmStatus,
    confirmBg: cm.bg,
    confirmFg: cm.fg,
    matchLabel: d.matchStatus,
    matchBg: mm.bg,
    matchFg: mm.fg,
    close: actions.onClose,

    hasIssue: !!d.issue,
    issueLabel: d.issue,

    hasCandidate: !!d.candidatePartner && d.confirmStatus !== '확인완료',
    candidatePartner: d.candidatePartner || '확인되지 않음',
    candidateInvoice: d.candidateInvoice || '-',
    candidateAmount: d.candidateAmount || '-',

    canConfirm: d.confirmStatus === '확인대기' || d.confirmStatus === '확인필요',
    canResume: d.confirmStatus === '보류',
    confirmDeposit: actions.onConfirmDeposit,
    resume: actions.onResume,
    showHoldPanel: ui.showHoldPanel,
    toggleHoldPanel: actions.onToggleHoldPanel,
    confirmHold: actions.onConfirmHold,

    tabs,
    isInfo: ui.activeTab === 'info',
    isMatch: ui.activeTab === 'match',
    isVerify: ui.activeTab === 'verify',
    isResult: ui.activeTab === 'result',
    isDocs: ui.activeTab === 'docs',
    isHistory: ui.activeTab === 'history',

    infoFields: [
      { label: '입금일시', value: d.depositedAt, weight: 600, color: '#18181b' },
      { label: '입금금액', value: fmtWon(d.amount), weight: 700, color: '#18181b' },
      { label: '입금자명', value: d.depositor, weight: 500, color: '#3f3f46' },
      { label: '입금은행', value: d.bank, weight: 500, color: '#3f3f46' },
      { label: '수취계좌', value: d.account, weight: 500, color: '#3f3f46' },
      { label: '거래번호', value: d.txId, weight: 500, color: '#3f3f46' },
      { label: '수집방식', value: d.collectSource, weight: 500, color: '#3f3f46' },
    ],

    invoiceCandidates: d.invoiceCandidates,

    verifyFields: [
      { label: '입금금액', value: fmtWon(d.amount), weight: 700, color: '#18181b' },
      { label: '청구 미수', value: d.invoiceCandidates[0] ? d.invoiceCandidates[0].remaining : '-', weight: 500, color: '#3f3f46' },
      { label: '검증 결과', value: exactMatch ? '금액 일치' : d.invoiceCandidates.length ? '부분/불일치' : '매칭 없음', weight: 700, color: exactMatch ? '#059669' : '#d97706' },
    ],
    checks: [
      { icon: d.candidatePartner ? '✓' : '⚠', label: '거래처 확인', color: d.candidatePartner ? '#059669' : '#dc2626' },
      { icon: exactMatch ? '✓' : '⚠', label: '금액 일치', color: exactMatch ? '#059669' : '#d97706' },
      { icon: d.issue && d.issue.includes('중복') ? '⚠' : '✓', label: '중복 거래 없음', color: d.issue && d.issue.includes('중복') ? '#dc2626' : '#059669' },
      { icon: d.invoiceCandidates.length ? '✓' : '⚠', label: '청구 매칭 완료', color: d.invoiceCandidates.length ? '#059669' : '#dc2626' },
    ],

    isConfirmed: !!result,
    notConfirmed: !result,
    resultFields: result
      ? [
          { label: '생성된 결제', value: result.payment },
          { label: '연결 청구', value: result.invoice },
          { label: '수금 반영', value: result.collection },
        ]
      : [],

    docs: d.docs,
    memos: d.memos,
    history: d.history,
  };
}
