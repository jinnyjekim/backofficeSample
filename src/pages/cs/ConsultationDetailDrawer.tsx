import { useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './ConsultationsPage.module.css';
import { durationLabel, type ConsultationEntry } from './consultationsData';

type Tab = 'summary' | 'conversation' | 'related' | 'result' | 'memo' | 'history';

interface Props {
  item: ConsultationEntry;
  onClose: () => void;
  onReopen: () => void;
  onCorrect: () => void;
  onNewInquiry: () => void;
}

export function ConsultationDetailDrawer({ item, onClose, onReopen, onCorrect, onNewInquiry }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const resultColor = ['해결', '안내 완료', '고객 확인 완료'].includes(item.result) ? '#047857' : item.result === '후속 처리 필요' ? '#c2410c' : '#52525b';
  return <aside className={`${drawer.aside} ${styles.detailDrawer}`} aria-label={`${item.id} 상담 상세`}>
    <div className={drawer.head}>
      <div className={drawer.headRow}><div className={drawer.headBody}><div className={drawer.eyebrow}>{item.id} · {item.inquiryId ?? '수동 등록 상담'}</div><div className={drawer.titleRow}><h2 className={drawer.title}>{item.title}</h2><span className={drawer.badge} style={{ background: '#ecfdf5', color: resultColor }}>{item.result}</span>{item.reopened && <span className={styles.reopenBadge}>재문의 발생</span>}</div><div className={drawer.sub}>{item.category} &gt; {item.subcategory} · {item.channel} · {item.assignee}</div></div><button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button></div>
      <div className={styles.detailStats}><div><span>상담 시작</span><strong>{item.startedAt}</strong></div><div><span>상담 종료</span><strong>{item.completedAt ?? '진행중'}</strong></div><div><span>소요시간</span><strong>{durationLabel(item)}</strong></div><div><span>SLA 결과</span><strong className={item.slaResult === '초과' ? styles.dangerText : styles.successText}>{item.slaResult}</strong></div></div>
      <div className={drawer.actionRow}><button type="button" className={drawer.actionLink}>고객 보기 ↗</button>{item.inquiryId && <button type="button" className={drawer.actionLink} onClick={() => window.location.assign('/cs/inquiries')}>원 문의 보기 ↗</button>}<button type="button" className={drawer.actionLink} onClick={onCorrect}>상담 기록 정정</button><span className={drawer.spacer} /><button type="button" className={drawer.actionLink} onClick={onNewInquiry}>새 문의 등록</button>{item.inquiryId && <button type="button" className={drawer.primaryBtn} onClick={onReopen}>문의 재오픈</button>}</div>
      <div className={drawer.tabs}>{([['summary', '상담 요약'], ['conversation', `상담 내용 ${item.messages.length || ''}`], ['related', `관련 업무 ${item.related.length}`], ['result', '처리 결과'], ['memo', `내부 메모 ${item.memos.length}`], ['history', '처리 Timeline']] as [Tab, string][]).map(([key, label]) => <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>)}</div>
    </div>

    <div className={drawer.scroll}>
      {tab === 'summary' && <>
        <div className={styles.readOnlyNotice}>상담 History 원문은 수정할 수 없습니다. 잘못된 결과는 ‘상담 기록 정정’으로 Audit을 남겨 주세요.</div>
        <div className={styles.customerCard}><div className={styles.customerHeader}><div className={styles.avatar}>{item.customer.name.slice(0, 1)}</div><div><strong>{item.customer.name}</strong><span>{item.customer.id} · {item.customer.type}{item.customer.company ? ` · ${item.customer.company}` : ''}</span></div><button type="button">고객 상세 ↗</button></div><div className={styles.customerFacts}><span>회원 상태 <b>{item.customer.status}</b></span><span>연락처 <b>{item.customer.phone}</b></span><span>이메일 <b>{item.customer.email}</b></span><span>가입일 <b>{item.customer.joinedAt}</b></span><span>누적 상담 <b>{item.customer.totalConsultations}건</b></span><span>최근 30일 <b>{item.customer.recentConsultations}건</b></span></div><p>개인정보는 권한 정책에 따라 마스킹되어 표시됩니다.</p></div>
        <h3 className={drawer.sectionTitleLoose}>상담 Summary</h3><div className={drawer.fieldBox}><SummaryRow label="상담번호" value={item.id} /><SummaryRow label="문의번호" value={item.inquiryId ?? '-'} /><SummaryRow label="채널" value={item.channel} /><SummaryRow label="문의유형" value={`${item.category} > ${item.subcategory}`} /><SummaryRow label="담당자" value={`${item.assignee} · ${item.team}`} /><SummaryRow label="첫 답변" value={item.firstResponseAt ?? '-'} /><SummaryRow label="처리결과" value={item.result} /></div>
        {item.channel === '전화' && <><h3 className={drawer.sectionTitleLoose}>전화 상담</h3><div className={styles.callCard}><div><span>수신 / 발신</span><strong>{item.direction}</strong></div><div><span>통화시간</span><strong>{item.callMinutes}분</strong></div><div><span>상담원</span><strong>{item.assignee}</strong></div><button type="button" disabled>녹취 미연결</button></div></>}
        <h3 className={drawer.sectionTitleLoose}>고객 상담 History</h3><div className={styles.customerHistory}><div><span>08.24</span><strong>{item.subcategory}</strong><em>{item.result}</em></div><div><span>08.20</span><strong>이전 상담 내역</strong><em>안내 완료</em></div><button type="button">이 고객의 전체 상담 보기</button></div>
      </>}

      {tab === 'conversation' && <>
        <div className={styles.recordBlocks}><Record title="고객 요청" body={item.request} /><Record title="확인 내용" body={item.checked} /><Record title="처리 내용" body={item.resolution} /></div>
        {item.messages.length > 0 ? <><h3 className={drawer.sectionTitleLoose}>대화 원문 <span className={styles.locked}>수정 불가</span></h3><div className={styles.thread}>{item.messages.map((message) => <div key={message.id} className={`${styles.message} ${styles[`message_${message.role}`]}`}><div><strong>{message.author}</strong><span>{message.at}</span></div><p>{message.body}</p></div>)}</div></> : <div className={styles.noConversation}>전화·오프라인·수동 상담은 구조화된 상담 기록으로 보존됩니다.</div>}
      </>}

      {tab === 'related' && <>
        <div className={styles.readOnlyNotice}>관련 업무는 조회만 가능합니다. 변경은 각 주문·결제·배송 업무 화면에서 진행해 주세요.</div>{item.related.length ? item.related.map((related) => <div key={`${related.type}-${related.id}`} className={styles.relatedCard}><div className={styles.relatedIcon}>{related.type.slice(0, 1)}</div><div><span>{related.type}</span><strong>{related.id}</strong><p>{related.detail}</p></div><em>{related.status}</em><button type="button">보기 ↗</button></div>) : <div className={styles.emptyPanel}>연결된 주문·결제·배송 업무가 없습니다.</div>}
        <h3 className={drawer.sectionTitleLoose}>관련 상담</h3>{item.relatedConsultations.length ? item.relatedConsultations.map((id) => <div key={id} className={styles.relatedConsultation}><span>{id}</span><strong>같은 고객 또는 관련 주문 상담</strong><button type="button">상세</button></div>) : <div className={styles.emptyPanel}>연결된 다른 상담이 없습니다.</div>}
      </>}

      {tab === 'result' && <>
        <div className={styles.resultHero}><span>최종 처리 결과</span><strong>{item.result}</strong><p>{item.resolution}</p></div><div className={drawer.fieldBox}><SummaryRow label="종료 사유" value={item.completionReason} /><SummaryRow label="상담 종료" value={item.completedAt ?? '-'} /><SummaryRow label="처리자" value={item.assignee} /><SummaryRow label="후속 업무" value={item.followUp ?? '없음'} /></div>
        <h3 className={drawer.sectionTitleLoose}>SLA Snapshot 및 결과</h3><div className={styles.slaCard}><div><span>접수 당시 첫 답변 SLA</span><strong>{item.slaHours ? `${item.slaHours}시간` : '대상 아님'}</strong></div><div><span>실제 첫 답변</span><strong>{item.actualResponseMinutes === null ? '-' : item.actualResponseMinutes >= 60 ? `${Math.floor(item.actualResponseMinutes / 60)}시간 ${item.actualResponseMinutes % 60}분` : `${item.actualResponseMinutes}분`}</strong></div><div><span>판정</span><strong className={item.slaResult === '초과' ? styles.dangerText : styles.successText}>{item.slaResult === '초과' ? '⚠ 초과' : item.slaResult === '준수' ? '✓ 준수' : '대상 아님'}</strong></div></div>
        <h3 className={drawer.sectionTitleLoose}>고객 만족도</h3>{item.satisfaction ? <div className={`${styles.satisfaction} ${item.satisfaction <= 2 ? styles.lowSatisfaction : ''}`}><div><span>{'★'.repeat(item.satisfaction)}{'☆'.repeat(5 - item.satisfaction)}</span><strong>{item.satisfaction} / 5</strong></div>{item.satisfactionComment && <p>“{item.satisfactionComment}”</p>}<em>응답 {item.satisfactionAt}</em>{item.satisfaction <= 2 && <b>⚠ 낮은 만족도 · 관리자 검토 권장</b>}</div> : <div className={styles.emptyPanel}>만족도 응답이 수집되지 않았습니다.</div>}
      </>}

      {tab === 'memo' && <><div className={styles.memoNotice}>🔒 내부 메모 · 고객에게 발송된 답변과 분리된 Audit 기록입니다.</div>{item.memos.length ? item.memos.map((memo) => <div key={memo.id} className={styles.memoItem}><div><strong>{memo.author}</strong><span>{memo.at}</span></div><p>{memo.body}</p></div>) : <div className={styles.emptyPanel}>등록된 내부 메모가 없습니다.</div>}<div className={styles.memoPolicy}>상담 내역에서는 기존 메모를 덮어쓰지 않습니다. 추가 기록은 관리자 메모 메뉴에서 이 상담번호와 연결해 작성합니다.</div></>}

      {tab === 'history' && <><div className={styles.historyLegend}><span><i className={styles.dotCustomer} />고객</span><span><i className={styles.dotAdmin} />상담원</span><span><i className={styles.dotSystem} />시스템</span></div>{item.history.slice().reverse().map((event) => <div key={event.id} className={drawer.timelineItem}><span className={styles[`history_${event.kind}`]} /><div className={drawer.timelineBody}><div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{event.action}</strong><span className={drawer.timelineWhen}>{event.at}</span></div><div className={drawer.timelineDetail}>{event.actor}{event.detail ? ` · ${event.detail}` : ''}</div></div></div>)}</>}
    </div>
  </aside>;
}

function SummaryRow({ label, value }: { label: string; value: string }) { return <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>{label}</span><strong className={drawer.fieldValue}>{value}</strong></div>; }
function Record({ title, body }: { title: string; body: string }) { return <div className={styles.record}><strong>{title}</strong><p>{body}</p></div>; }
