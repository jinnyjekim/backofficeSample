import { useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './CsInquiriesPage.module.css';
import {
  getSlaInfo,
  inquiryIssues,
  STATUS_META,
  type InquiryEntry,
} from './inquiriesData';

type DetailTab = 'content' | 'related' | 'conversation' | 'memo' | 'history';

interface Props {
  inquiry: InquiryEntry;
  onClose: () => void;
  onAssign: () => void;
  onStart: () => void;
  onHold: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onSaveDraft: (body: string) => void;
  onSendReply: (body: string, channels: string[]) => void;
  onAddMemo: (body: string) => void;
}

const TEMPLATES: Record<string, string> = {
  '배송 지연 안내': '안녕하세요. 배송 지연으로 불편을 드려 죄송합니다. 배송사 확인 후 예상 도착 일정을 안내드리겠습니다.',
  '결제 확인 안내': '안녕하세요. 결제 승인 내역을 확인 중입니다. 확인이 완료되는 즉시 결과와 처리 일정을 안내드리겠습니다.',
  '환불 확인중': '안녕하세요. 카드사 승인 취소 상태를 확인 중입니다. 영업일 기준 처리 일정을 확인하여 다시 안내드리겠습니다.',
  '계정 재설정': '안녕하세요. 관리자 인증 후 비밀번호 재설정 링크를 발송해 드리겠습니다.',
};

export function InquiryDetailDrawer({ inquiry, onClose, onAssign, onStart, onHold, onComplete, onReopen, onSaveDraft, onSendReply, onAddMemo }: Props) {
  const [tab, setTab] = useState<DetailTab>('content');
  const [reply, setReply] = useState(inquiry.replyDraft);
  const [memo, setMemo] = useState('');
  const [channels, setChannels] = useState<string[]>(['서비스 알림', '이메일']);
  const [confirmSend, setConfirmSend] = useState(false);
  const [notice, setNotice] = useState('');
  const sla = getSlaInfo(inquiry);
  const meta = STATUS_META[inquiry.status];

  const toggleChannel = (channel: string) => {
    setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);
  };

  const send = () => {
    if (!inquiry.assignee) {
      setNotice('답변 전 담당자를 먼저 지정해 주세요.');
      return;
    }
    if (!reply.trim()) {
      setNotice('답변 내용을 입력해 주세요.');
      return;
    }
    setConfirmSend(true);
  };

  return (
    <div className={drawer.panelRoot} aria-label={`${inquiry.id} 문의 상세`}>
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{inquiry.id} · {inquiry.category} / {inquiry.subcategory}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{inquiry.title}</h2>
              <span className={drawer.badge} style={{ background: meta.bg, color: meta.fg }}>{inquiry.status}</span>
              {inquiry.reopened && <span className={styles.reopenBadge}>재문의</span>}
            </div>
            <div className={drawer.sub}>접수 {inquiry.receivedAt} · 담당 {inquiry.assignee ?? '미배정'}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className={styles.detailSummary}>
          <div><span>우선순위</span><strong>{inquiry.priority}</strong></div>
          <div><span>1차 답변 기한</span><strong>{inquiry.dueAt}</strong></div>
          <div><span>SLA</span><strong style={{ color: sla.color }}>{sla.label}</strong></div>
        </div>

        {inquiryIssues(inquiry).length > 0 && (
          <div className={styles.issueStrip}>⚠ {inquiryIssues(inquiry).join(' · ')}</div>
        )}

        <div className={drawer.actionRow}>
          <button type="button" className={drawer.actionLink} onClick={onAssign}>{inquiry.assignee ? '담당자 변경' : '담당자 지정'}</button>
          {inquiry.status === '접수' && <button type="button" className={drawer.actionLink} onClick={onStart}>처리 시작</button>}
          {!['처리 완료', '보류'].includes(inquiry.status) && <button type="button" className={drawer.actionLink} onClick={onHold}>보류</button>}
          <span className={drawer.spacer} />
          {inquiry.status === '처리 완료'
            ? <button type="button" className={drawer.primaryBtn} onClick={onReopen}>재오픈</button>
            : inquiry.status === '답변 완료' && <button type="button" className={drawer.primaryBtn} onClick={onComplete}>처리 완료</button>}
        </div>

        <div className={drawer.tabs}>
          {([
            ['content', '문의 내용'], ['related', `관련 정보 ${inquiry.relatedItems.length}`], ['conversation', `답변 · 대화 ${inquiry.messages.length}`],
            ['memo', `내부 메모 ${inquiry.internalMemos.length}`], ['history', '처리 이력'],
          ] as [DetailTab, string][]).map(([key, label]) => (
            <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className={drawer.scroll}>
        {tab === 'content' && (
          <>
            <div className={styles.customerCard}>
              <div className={styles.customerHead}>
                <div className={styles.customerAvatar}>{inquiry.customer.name.slice(0, 1)}</div>
                <div><strong>{inquiry.customer.name}</strong><span>{inquiry.customer.id} · {inquiry.customer.type}</span></div>
                <button type="button">고객 상세 ↗</button>
              </div>
              <div className={styles.customerFacts}>
                <span>이메일 <b>{inquiry.customer.email}</b></span>
                <span>연락처 <b>{inquiry.customer.phone}</b></span>
                <span>최근 문의 <b>{inquiry.customer.recentInquiryCount}건</b></span>
                <span>계정 상태 <b>{inquiry.customer.status}</b></span>
              </div>
              <p className={styles.piiNote}>개인정보는 권한 정책에 따라 마스킹되어 표시됩니다.</p>
            </div>

            <h3 className={drawer.sectionTitleLoose}>문의 원문 <span className={styles.immutable}>수정 불가</span></h3>
            <div className={styles.originalMessage}>{inquiry.body}</div>

            <h3 className={drawer.sectionTitleLoose}>첨부파일 {inquiry.attachments.length}</h3>
            {inquiry.attachments.length ? <div className={styles.attachmentList}>{inquiry.attachments.map((file) => (
              <div key={file.name} className={styles.attachmentItem}>
                <span className={styles.fileIcon}>{file.kind === 'image' ? 'IMG' : file.kind.toUpperCase()}</span>
                <div><strong>{file.name}</strong><span>{file.size} · 보안검사 {file.scanStatus}</span></div>
                <button type="button">미리보기</button><button type="button">다운로드</button>
              </div>
            ))}</div> : <div className={drawer.emptyInline}>첨부파일이 없습니다.</div>}

            <h3 className={drawer.sectionTitleLoose}>분류 및 태그</h3>
            <div className={styles.tagRow}>{[inquiry.category, inquiry.subcategory, ...inquiry.tags].map((tag) => <span key={tag}>{tag}</span>)}</div>
          </>
        )}

        {tab === 'related' && (
          <>
            <div className={styles.readOnlyNote}>연결 정보는 이 화면에서 변경되지 않습니다. 원본 업무 화면에서 확인해 주세요.</div>
            {inquiry.relatedItems.length ? inquiry.relatedItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className={styles.relatedCard}>
                <div className={styles.relatedIcon}>{item.type.slice(0, 1)}</div>
                <div><span>{item.type}</span><strong>{item.id}</strong><p>{item.detail}</p></div>
                <div className={styles.relatedStatus}>{item.status}</div>
                <button type="button">상세 ↗</button>
              </div>
            )) : <div className={styles.emptyPanel}><strong>연결된 주문·결제 정보가 없습니다.</strong><span>문의 번호로만 접수된 일반 문의입니다.</span></div>}
          </>
        )}

        {tab === 'conversation' && (
          <>
            <div className={styles.thread}>
              {inquiry.messages.map((message) => (
                <div key={message.id} className={`${styles.message} ${styles[`message_${message.role}`]}`}>
                  <div className={styles.messageMeta}><strong>{message.author}</strong><span>{message.sentAt}</span></div>
                  <div className={styles.messageBody}>{message.body}</div>
                  {message.notificationResult && <div className={styles.deliveryResult}>✓ {message.notificationResult}</div>}
                </div>
              ))}
            </div>

            {inquiry.status !== '처리 완료' ? (
              <div className={styles.composer}>
                <div className={styles.composerTop}>
                  <strong>고객 답변 작성</strong>
                  {inquiry.draftSavedAt && <span>임시저장 {inquiry.draftSavedAt}</span>}
                </div>
                <div className={styles.templateRow}>
                  <select defaultValue="" onChange={(event) => event.target.value && setReply(TEMPLATES[event.target.value])}>
                    <option value="">답변 템플릿 불러오기</option>
                    {Object.keys(TEMPLATES).map((template) => <option key={template}>{template}</option>)}
                  </select>
                  <button type="button" onClick={() => setReply((current) => `${current}${current ? '\n\n' : ''}[FAQ] 배송 및 환불 정책 안내를 참고해 주세요.`)}>FAQ 삽입</button>
                </div>
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="고객에게 전달할 답변을 입력해 주세요." />
                <div className={styles.channelRow}>
                  <span>발송 채널</span>
                  {['서비스 알림', '이메일', 'SMS'].map((channel) => (
                    <label key={channel}><input type="checkbox" checked={channels.includes(channel)} onChange={() => toggleChannel(channel)} />{channel}</label>
                  ))}
                </div>
                {notice && <div className={styles.formNotice}>{notice}</div>}
                <div className={styles.composerActions}>
                  <span>답변 발송 시 상태가 ‘답변 완료’로 변경됩니다.</span>
                  <button type="button" className={styles.secondaryButton} onClick={() => { onSaveDraft(reply); setNotice('임시저장했습니다.'); }}>임시저장</button>
                  <button type="button" className={styles.primaryButton} onClick={send}>답변 발송</button>
                </div>
              </div>
            ) : <div className={styles.closedComposer}>처리 완료된 문의입니다. 추가 답변이 필요하면 먼저 재오픈해 주세요.</div>}
          </>
        )}

        {tab === 'memo' && (
          <>
            <div className={styles.memoNotice}>🔒 내부 메모 · 고객 화면과 알림에는 절대 노출되지 않습니다.</div>
            <div className={styles.memoComposer}>
              <textarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="인수인계, 확인 요청 등 내부 메모를 남겨 주세요." />
              <button type="button" disabled={!memo.trim()} onClick={() => { onAddMemo(memo); setMemo(''); }}>메모 등록</button>
            </div>
            {inquiry.internalMemos.length ? inquiry.internalMemos.map((item) => (
              <div key={item.id} className={styles.memoItem}><div><strong>{item.author}</strong><span>{item.createdAt}</span></div><p>{item.body}</p></div>
            )) : <div className={styles.emptyPanel}><strong>등록된 내부 메모가 없습니다.</strong><span>메모는 고객에게 공개되지 않습니다.</span></div>}
          </>
        )}

        {tab === 'history' && (
          <>
            <div className={styles.historySummary}>현재 상태 <strong>{inquiry.status}</strong> · 담당자 <strong>{inquiry.assignee ?? '미배정'}</strong></div>
            {inquiry.history.slice().reverse().map((item) => (
              <div key={item.id} className={drawer.timelineItem}>
                <span className={styles[`historyDot_${item.kind}`]} />
                <div className={drawer.timelineBody}>
                  <div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{item.action}</strong><span className={drawer.timelineWhen}>{item.at}</span></div>
                  <div className={drawer.timelineDetail}>{item.actor}{item.detail ? ` · ${item.detail}` : ''}</div>
                </div>
              </div>
            ))}
            {inquiry.satisfaction && <div className={styles.satisfaction}><span>고객 만족도</span><strong>{'★'.repeat(inquiry.satisfaction.score)}{'☆'.repeat(5 - inquiry.satisfaction.score)}</strong><p>“{inquiry.satisfaction.comment}”</p></div>}
          </>
        )}
      </div>

      {confirmSend && (
        <div className={styles.drawerDialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmSend(false); }}>
          <div className={styles.confirmBox}>
            <strong>답변을 발송할까요?</strong>
            <p>발송 후 고객에게 {channels.length ? channels.join(', ') : '서비스 내'} 채널로 알림이 전송되며 상태가 ‘답변 완료’로 변경됩니다.</p>
            <div><button type="button" onClick={() => setConfirmSend(false)}>취소</button><button type="button" className={styles.primaryButton} onClick={() => { onSendReply(reply, channels); setConfirmSend(false); setNotice('답변을 발송했습니다.'); }}>발송</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
