import { useState } from 'react';
import styles from './ContactDetailDrawer.module.css';
import { CONTACT_STATUS_META, type Contact, type ContactStatus } from './contactsData';

const TABS: { key: string; label: string }[] = [
  { key: 'basic', label: '기본정보' },
  { key: 'contact', label: '연락처' },
  { key: 'duty', label: '담당 업무' },
  { key: 'linked', label: '연결 거래' },
  { key: 'activity', label: '활동 / 메모' },
  { key: 'history', label: '변경 이력' },
];

interface Props {
  contact: Contact;
  allContacts: Contact[];
  onClose: () => void;
  onTogglePrimaryDirect: (id: string) => void;
  onConfirmPrimary: (id: string) => void;
  onSetStatus: (id: string, status: ContactStatus) => void;
  onAddMemo: (id: string, text: string) => void;
}

export function ContactDetailDrawer({
  contact,
  allContacts,
  onClose,
  onTogglePrimaryDirect,
  onConfirmPrimary,
  onSetStatus,
  onAddMemo,
}: Props) {
  const [activeTab, setActiveTab] = useState('basic');
  const [showPrimaryConfirm, setShowPrimaryConfirm] = useState(false);
  const [showUseConfirm, setShowUseConfirm] = useState(false);
  const [memoText, setMemoText] = useState('');

  const sm = CONTACT_STATUS_META[contact.status];
  const otherPrimary = allContacts.find((c) => c.company === contact.company && c.isPrimary && c.id !== contact.id);

  function togglePrimary() {
    if (!contact.isPrimary && otherPrimary) {
      setShowPrimaryConfirm((v) => !v);
    } else {
      onTogglePrimaryDirect(contact.id);
    }
  }
  function confirmPrimary() {
    onConfirmPrimary(contact.id);
    setShowPrimaryConfirm(false);
  }
  function toggleUse() {
    if (contact.status === '사용') {
      setShowUseConfirm((v) => !v);
    } else {
      onSetStatus(contact.id, '사용');
    }
  }
  function confirmUse() {
    onSetStatus(contact.id, '미사용');
    setShowUseConfirm(false);
  }
  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(contact.id, memoText.trim());
    setMemoText('');
  }

  const primaryActionLabel = contact.isPrimary ? '주 담당자 해제' : '주 담당자로 지정';
  const useActionLabel = contact.status === '사용' ? '미사용 처리' : '사용 처리';

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.avatar}>{contact.name.slice(0, 1)}</div>
          <div className={styles.headBody}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{contact.name}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{contact.status}</span>
              {contact.isPrimary && <span className={styles.badge} style={{ background: '#eef2ff', color: '#4338ca' }}>주 담당</span>}
            </div>
            <div className={styles.sub}>{contact.id} · <a href="#" onClick={(e) => e.preventDefault()}>{contact.company} 상세 보기</a></div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.actionRow}>
          <button type="button" className={styles.actionBtn}>수정</button>
          <button type="button" className={styles.actionBtn} onClick={togglePrimary}>{primaryActionLabel}</button>
          <div className={styles.spacer} />
          <button
            type="button"
            className={styles.useBtn}
            style={{
              borderColor: contact.status === '사용' ? '#fecaca' : 'rgba(0,0,0,.12)',
              background: contact.status === '사용' ? '#fef2f2' : '#fff',
              color: contact.status === '사용' ? '#dc2626' : '#3f3f46',
            }}
            onClick={toggleUse}
          >
            {useActionLabel}
          </button>
        </div>

        {showPrimaryConfirm && (
          <div className={styles.panel}>
            <div className={styles.panelText}>
              현재 주 담당자는 <b>{otherPrimary ? otherPrimary.name : '-'}</b>입니다.
              <br />
              {contact.name}님을 새 주 담당자로 변경하시겠습니까? 기존 주 담당자는 일반 담당자로 변경됩니다.
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancel} onClick={() => setShowPrimaryConfirm(false)}>취소</button>
              <button type="button" className={styles.panelConfirm} onClick={confirmPrimary}>변경</button>
            </div>
          </div>
        )}

        {showUseConfirm && (
          <div className={styles.dangerPanel}>
            <div className={styles.dangerText}>
              담당자를 미사용 처리하시겠습니까?
              <br />
              신규 거래·연락 대상 선택 시 표시되지 않으며, 기존 이력은 유지됩니다.
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancel} onClick={() => setShowUseConfirm(false)}>취소</button>
              <button type="button" className={styles.dangerConfirm} onClick={confirmUse}>미사용 처리</button>
            </div>
          </div>
        )}

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {activeTab === 'basic' && (
          <div>
            <div className={styles.sectionTitle}>기본정보</div>
            <div className={styles.fieldBox}>
              {[
                { label: '담당자 ID', value: contact.id },
                { label: '이름', value: contact.name },
                { label: '소속회사', value: `${contact.company} (${contact.companyCode})` },
                { label: '부서', value: contact.dept },
                { label: '직책', value: contact.title },
                { label: '상태', value: contact.status },
                { label: '등록일', value: contact.registered },
                { label: '최근 수정', value: contact.updated },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div>
            <div className={styles.sectionTitle}>연락처 정보</div>
            <div className={styles.fieldBox}>
              {[
                { label: '이메일', value: contact.email },
                { label: '휴대전화', value: contact.phone },
                { label: '회사 전화', value: contact.officePhone },
                { label: '내선', value: contact.ext },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'duty' && (
          <div>
            <div className={styles.sectionTitle}>담당 업무</div>
            <div className={styles.rolesRow}>
              {contact.roles.map((r) => (
                <span className={styles.roleChip} key={r}>{r}</span>
              ))}
              {contact.roles.length === 0 && <span className={styles.emptyInline}>등록된 역할이 없습니다</span>}
            </div>
            <div className={styles.sectionTitle}>담당 범위</div>
            <div className={styles.scopeBox}>
              {contact.scope.map((s, i) => (
                <div className={styles.scopeItem} key={i}>- {s}</div>
              ))}
              {contact.scope.length === 0 && <div className={styles.emptyInline}>등록된 담당 범위가 없습니다</div>}
            </div>
          </div>
        )}

        {activeTab === 'linked' && (
          <div>
            <div className={styles.linkedSummaryGrid}>
              {[
                { label: '진행 계약', value: `${contact.linked.contract}건` },
                { label: '진행 견적', value: `${contact.linked.quote}건` },
                { label: '최근 주문', value: `${contact.linked.order}건` },
              ].map((s) => (
                <div className={styles.linkedSummaryCell} key={s.label}>
                  <div className={styles.summaryLabel}>{s.label}</div>
                  <div className={styles.summaryValue}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.tableBox}>
              <div className={styles.linkedHeadRow}>
                <span>유형</span><span>번호</span><span>상태</span><span style={{ textAlign: 'right' }}>최근일</span>
              </div>
              {contact.linkedRows.map((l, i) => (
                <div className={styles.linkedRow} key={i}>
                  <span className={styles.tableCellSub}>{l.type}</span>
                  <span className={styles.linkCell}>{l.no}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: l.statusFg }}>{l.status}</span>
                  <span className={styles.tableCellSub} style={{ textAlign: 'right' }}>{l.when}</span>
                </div>
              ))}
              {contact.linkedRows.length === 0 && <div className={styles.emptyRow}>연결된 거래가 없습니다</div>}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {contact.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.admin}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            {contact.memos.length === 0 && <div className={styles.emptyInline}>등록된 메모가 없습니다</div>}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>변경 이력</div>
            <div className={styles.sectionSub}>회사 · 역할 · 주담당 · 상태 변경을 추적합니다</div>
            {contact.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.change}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineAdmin}>{h.admin}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
