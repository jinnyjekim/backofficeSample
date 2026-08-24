import { useState } from 'react';
import { SETTLEMENTS, type Settlement } from './settlementData';

export function useSettlementDrawer(initial: Settlement[] = SETTLEMENTS) {
  const [settlements, setSettlements] = useState<Settlement[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showHoldPanel, setShowHoldPanel] = useState(false);

  const selected = selectedId ? settlements.find((r) => r.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
    setShowHoldPanel(false);
  }

  function closeDetail() {
    setSelectedId(null);
  }

  function updateSettlement(id: string, updater: (r: Settlement) => Settlement) {
    setSettlements((prev) => prev.map((r) => (r.id === id ? updater(r) : r)));
  }

  function confirmSettle() {
    if (!selected) return;
    updateSettlement(selected.id, (r) => ({
      ...r,
      settleStatus: '정산확정',
      payStatus: r.payStatus === '지급전' ? '지급예정' : r.payStatus,
      history: [...r.history, { when: '방금', title: '정산 확정', by: 'admin01' }],
    }));
  }

  function requestPay() {
    if (!selected) return;
    updateSettlement(selected.id, (r) => ({
      ...r,
      payStatus: '지급완료',
      payDate: '방금',
      history: [
        ...r.history,
        { when: '방금', title: '지급 요청', by: 'admin01' },
        { when: '방금', title: '지급 완료', by: 'system' },
      ],
    }));
  }

  function retryPay() {
    if (!selected) return;
    updateSettlement(selected.id, (r) => ({
      ...r,
      payStatus: '지급완료',
      payDate: '방금',
      history: [...r.history, { when: '방금', title: '지급 재시도 · 완료', by: 'system' }],
    }));
  }

  function resume() {
    if (!selected) return;
    updateSettlement(selected.id, (r) => ({
      ...r,
      settleStatus: '정산대기',
      issues: [],
      history: [...r.history, { when: '방금', title: '보류 해제', by: 'admin01' }],
    }));
  }

  function confirmHold() {
    if (!selected) return;
    updateSettlement(selected.id, (r) => ({
      ...r,
      settleStatus: '보류',
      issues: r.issues.length ? r.issues : ['거래 데이터 확인 필요'],
      history: [...r.history, { when: '방금', title: '정산 보류', detail: '거래 데이터 확인 필요', by: 'admin01' }],
    }));
    setShowHoldPanel(false);
  }

  return {
    settlements,
    selected,
    activeTab,
    setActiveTab,
    showHoldPanel,
    openDetail,
    closeDetail,
    toggleHoldPanel: () => setShowHoldPanel((v) => !v),
    confirmSettle,
    requestPay,
    retryPay,
    resume,
    confirmHold,
  };
}
