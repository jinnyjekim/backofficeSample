import { DatePicker } from '../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import drawer from './opsDrawerShared.module.css';
import shared from './opsShared.module.css';
import styles from './OperatingMessagesPage.module.css';
import { OperatingMessageDetailDrawer } from './OperatingMessageDetailDrawer';
import { CommonButton } from '../../components/common';
import { CHANNELS, MESSAGE_TYPES, OPERATING_MESSAGES, type MessageChannel, type MessageStatus, type OperatingMessage, type TargetType } from './messageData';

type Quick = '전체' | '작성중' | '발송 예정' | '발송 완료' | '중지';
type Editor = { mode: 'create' | 'edit' | 'clone'; id?: string } | null;
type FormState = { managementName: string; type: string; channels: MessageChannel[]; title: string; content: string; targetType: TargetType; memberStatus: string; memberType: string; joinFrom: string; joinTo: string; individualIds: string; sendMode: '즉시 발송' | '예약 발송'; scheduledDate: string; scheduledTime: string };
type Preview = { title: string; content: string; channels: MessageChannel[] } | null;

const QUICK: Quick[] = ['전체', '작성중', '발송 예정', '발송 완료', '중지'];
const STATUS_META: Record<MessageStatus, { bg: string; fg: string }> = { 작성중: { bg: '#f4f4f5', fg: '#52525b' }, '발송 예정': { bg: '#eff6ff', fg: '#2563eb' }, 발송중: { bg: '#fff7ed', fg: '#c2410c' }, '발송 완료': { bg: '#ecfdf5', fg: '#047857' }, '일부 실패': { bg: '#fff7ed', fg: '#c2410c' }, 실패: { bg: '#fef2f2', fg: '#dc2626' }, 중지: { bg: '#f4f4f5', fg: '#71717a' } };
const COLUMNS = [{ label: '메시지명 / ID' }, { label: '사용자 노출 제목' }, { label: '유형' }, { label: '채널' }, { label: '대상' }, { label: '상태' }, { label: '발송 예정일' }, { label: '발송 완료일' }];
const emptyForm = (): FormState => ({ managementName: '', type: '안내', channels: ['앱 내'], title: '', content: '', targetType: '전체 사용자', memberStatus: '정상', memberType: '전체', joinFrom: '', joinTo: '', individualIds: '', sendMode: '즉시 발송', scheduledDate: '', scheduledTime: '10:00' });
function quickMatch(message: OperatingMessage, quick: Quick) { return quick === '전체' || message.status === quick; }

export function OperatingMessagesPage() {
  const [messages, setMessages] = useState<OperatingMessage[]>(OPERATING_MESSAGES);
  const [quick, setQuick] = useState<Quick>('전체');
  const [searchField, setSearchField] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [preview, setPreview] = useState<Preview>(null);
  const [previewChannel, setPreviewChannel] = useState<MessageChannel>('앱 내');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const types = useMemo(() => [...new Set([...MESSAGE_TYPES, ...messages.map((message) => message.type)])], [messages]);

  const filtered = useMemo(() => messages.filter((message) => {
    if (!quickMatch(message, quick) || (typeFilter && message.type !== typeFilter) || (statusFilter && message.status !== statusFilter) || (channelFilter && !message.channels.includes(channelFilter as MessageChannel)) || (targetFilter && message.targetType !== targetFilter)) return false;
    const sendDate = (message.sentAt ?? message.scheduledAt ?? message.createdAt).slice(0, 10);
    if (dateFrom && sendDate < dateFrom) return false;
    if (dateTo && sendDate > dateTo) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    if (searchField === '메시지 ID') return message.id.toLowerCase().includes(query);
    if (searchField === '메시지명') return message.managementName.toLowerCase().includes(query);
    if (searchField === '제목') return message.title.toLowerCase().includes(query);
    if (searchField === '등록자') return message.createdBy.toLowerCase().includes(query);
    return `${message.id} ${message.managementName} ${message.title} ${message.createdBy}`.toLowerCase().includes(query);
  }), [channelFilter, dateFrom, dateTo, messages, quick, search, searchField, statusFilter, targetFilter, typeFilter]);

  const selected = messages.find((message) => message.id === detailId) ?? null;
  const cancelTarget = messages.find((message) => message.id === cancelId) ?? null;
  const estimatedTargets = form.targetType === '전체 사용자' ? 12482 : form.targetType === '개별 지정' ? form.individualIds.split(/[\s,]+/).filter(Boolean).length : form.memberType === 'VIP' ? 1842 : form.joinFrom ? 326 : 6480;
  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2600); }
  function resetFilters() { setQuick('전체'); setSearchField('전체'); setKeyword(''); setSearch(''); setTypeFilter(''); setStatusFilter(''); setChannelFilter(''); setTargetFilter(''); setDateFrom(''); setDateTo(''); }
  function toggleChannel(channel: MessageChannel) { setForm((current) => ({ ...current, channels: current.channels.includes(channel) ? current.channels.filter((item) => item !== channel) : [...current.channels, channel] })); }

  function formFrom(message: OperatingMessage): FormState {
    const [scheduledDate = '', scheduledTime = '10:00'] = (message.scheduledAt ?? '').split(' ');
    return { managementName: message.managementName, type: message.type, channels: message.channels, title: message.title, content: message.content, targetType: message.targetType, memberStatus: '정상', memberType: message.targetDetail.includes('VIP') ? 'VIP' : '전체', joinFrom: '', joinTo: '', individualIds: message.targetType === '개별 지정' ? message.targetDetail : '', sendMode: message.scheduledAt && !message.sentAt ? '예약 발송' : '즉시 발송', scheduledDate, scheduledTime };
  }

  function openCreate(source?: OperatingMessage) {
    if (!source) { setForm(emptyForm()); setEditor({ mode: 'create' }); return; }
    setForm({ ...formFrom(source), managementName: `[복사본] ${source.managementName}`, sendMode: '예약 발송', scheduledDate: '', scheduledTime: '10:00' });
    setEditor({ mode: 'clone' }); setDetailId(null);
  }

  function openEdit(message: OperatingMessage) { if (!['작성중', '발송 예정'].includes(message.status)) return notify('작성중 또는 발송 예정 메시지만 수정할 수 있습니다.'); setForm(formFrom(message)); setEditor({ mode: 'edit', id: message.id }); setDetailId(null); }
  function validate(mode: 'draft' | 'send') { if (!form.managementName.trim() || !form.title.trim()) return '메시지명과 사용자 노출 제목을 입력해 주세요.'; if (!form.content.trim()) return '메시지 내용을 입력해 주세요.'; if (!form.channels.length) return '발송 채널을 하나 이상 선택해 주세요.'; if (form.targetType === '개별 지정' && estimatedTargets === 0) return '발송할 사용자 ID를 입력해 주세요.'; if (mode === 'send' && form.sendMode === '예약 발송' && (!form.scheduledDate || !form.scheduledTime)) return '예약 발송 일시를 입력해 주세요.'; if (mode === 'send' && form.sendMode === '예약 발송' && `${form.scheduledDate} ${form.scheduledTime}` <= '2026-08-26 15:40') return '예약 일시는 현재 이후로 설정해 주세요.'; return ''; }
  function targetDetail() { if (form.targetType === '전체 사용자') return '정상 회원 전체'; if (form.targetType === '개별 지정') return `${form.individualIds.split(/[\s,]+/).filter(Boolean).slice(0, 1).join('')} 외 ${Math.max(estimatedTargets - 1, 0)}명`; return `회원 상태 ${form.memberStatus} · 회원 유형 ${form.memberType}${form.joinFrom ? ` · 가입일 ${form.joinFrom}~${form.joinTo || ''}` : ''}`; }

  function save(mode: 'draft' | 'send') {
    if (!editor) return;
    const error = validate(mode); if (error) return notify(error);
    const scheduledAt = mode === 'send' && form.sendMode === '예약 발송' ? `${form.scheduledDate} ${form.scheduledTime}` : null;
    const status: MessageStatus = mode === 'draft' ? '작성중' : scheduledAt ? '발송 예정' : '발송 완료';
    const now = '2026-08-26 15:40';
    const current = editor.id ? messages.find((message) => message.id === editor.id) : null;
    const id = current?.id ?? `MSG-20260826-${String(messages.length + 2).padStart(3, '0')}`;
    const next: OperatingMessage = { id, managementName: form.managementName.trim(), title: form.title.trim(), type: form.type.trim(), channels: form.channels, targetType: form.targetType, targetDetail: targetDetail(), estimatedTargets, actualTargets: status === '발송 완료' ? estimatedTargets : 0, status, scheduledAt, sentAt: status === '발송 완료' ? now : null, content: form.content, createdBy: current?.createdBy ?? 'admin01', createdAt: current?.createdAt ?? now, updatedAt: now, result: status === '발송 완료' ? { success: estimatedTargets, failed: 0, opened: 0, clicked: 0 } : { success: 0, failed: 0, opened: 0, clicked: 0 }, failures: [], history: [{ at: now, actor: 'admin01', action: mode === 'draft' ? '임시저장' : scheduledAt ? '예약 발송 설정' : '즉시 발송 완료', detail: scheduledAt ?? `${form.channels.join(', ')} · ${estimatedTargets.toLocaleString()}명` }, ...(current?.history ?? [])] };
    setMessages((items) => current ? items.map((message) => message.id === current.id ? next : message) : [next, ...items]);
    setEditor(null); setDetailId(id); notify(mode === 'draft' ? '운영 메시지를 임시저장했습니다.' : scheduledAt ? '예약 발송을 설정했습니다.' : '운영 메시지를 즉시 발송했습니다.');
  }

  function cancelSending() { if (!cancelId) return; setMessages((items) => items.map((message) => message.id !== cancelId ? message : { ...message, status: '중지', updatedAt: '2026-08-26 15:40', history: [{ at: '2026-08-26 15:40', actor: 'admin01', action: message.status === '발송 예정' ? '예약 발송 취소' : '발송 중지', detail: '관리자 요청' }, ...message.history] })); setCancelId(null); notify('메시지 발송을 중지했습니다.'); }
  function retry(message: OperatingMessage) { setMessages((items) => items.map((item) => item.id !== message.id ? item : { ...item, status: '발송중', updatedAt: '2026-08-26 15:40', history: [{ at: '2026-08-26 15:40', actor: 'admin01', action: '실패 대상 재발송', detail: `${item.result.failed.toLocaleString()}건 재처리 시작` }, ...item.history] })); notify('실패 대상 재발송을 시작했습니다.'); }
  function showPreview(message: OperatingMessage) { setPreview({ title: message.title, content: message.content, channels: message.channels }); setPreviewChannel(message.channels[0] ?? '앱 내'); }

  const rows: GridRow[] = filtered.map((message) => { const meta = STATUS_META[message.status]; const sendDate = message.sentAt ?? message.scheduledAt ?? '-'; return { id: message.id, onClick: () => setDetailId(message.id), cells: [
    { kind: 'stack', title: message.managementName, subtitle: message.id }, { kind: 'text', text: message.title, tip: message.title }, { kind: 'pillText', text: message.type, bg: '#f4f4f5', fg: '#52525b' }, { kind: 'text', text: message.channels.join(' · '), size: '11px' }, { kind: 'stack', title: message.targetType, subtitle: `${message.estimatedTargets.toLocaleString()}명` }, { kind: 'badge', text: message.status, bg: meta.bg, fg: meta.fg }, { kind: 'text', text: message.scheduledAt ?? '-', numeric: true, size: '11px' }, { kind: 'text', text: message.sentAt ?? (sendDate === '-' ? '-' : '-'), numeric: true, size: '11px' },
  ] }; });

  return <section className={shared.page} onClick={() => menuId && setMenuId(null)}>
    <div className={shared.headTop}><div className={shared.headRow}><div><h1 className={shared.title}>운영 메시지</h1><p className={shared.subtitle}>서비스 사용자에게 전달할 운영 안내를 작성하고 대상·채널·발송 일정 및 결과를 관리합니다.</p></div><button type="button" className={shared.createBtn} onClick={() => openCreate()}>+ 메시지 등록</button></div>
      <div className={shared.quickFilters}>
        {QUICK.map((item) => {
          const active = quick === item;
          return (
            <CommonButton
              key={item}
              variant={active ? 'primary-light' : 'secondary'}
              size="md"
              className={`${shared.qfBtn} ${active ? styles.quickActive : ''}`}
              onClick={() => setQuick(item)}
            >
              <span className={shared.qfLabel}>{item}</span>
              <span className={shared.qfCount}>{messages.filter((message) => quickMatch(message, item)).length}</span>
            </CommonButton>
          );
        })}
      </div>
      <div className={shared.filterBox}><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm} value={searchField} onChange={(event) => setSearchField(event.target.value)}><option>전체</option><option>메시지 ID</option><option>메시지명</option><option>제목</option><option>등록자</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="메시지 ID / 메시지명 / 제목 / 등록자"/><button type="submit" className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>메시지 유형</span><select aria-label="메시지 유형" className={shared.selectSm} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">전체 메시지 유형</option>{types.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>발송 상태</span><select aria-label="발송 상태" className={shared.selectSm} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">전체 발송 상태</option>{Object.keys(STATUS_META).map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>발송 채널</span><select aria-label="발송 채널" className={shared.selectSm} value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}><option value="">전체 발송 채널</option>{CHANNELS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>대상 유형</span><select aria-label="대상 유형" className={shared.selectSm} value={targetFilter} onChange={(event) => setTargetFilter(event.target.value)}><option value="">전체 대상 유형</option><option>전체 사용자</option><option>조건 지정</option><option>개별 지정</option></select></label><label className={styles.radioRow}>발송일 <DatePicker value={dateFrom} onChange={(event) => setDateFrom(event.target.value)}/><span>–</span><DatePicker value={dateTo} onChange={(event) => setDateTo(event.target.value)}/></label><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={resetFilters}>초기화</button></div></div>
    </div>
    <div className={shared.gridWrap}><div className={shared.resultRow}><span className={shared.resultLabel}>총 {filtered.length}개 메시지</span><div className={shared.resultActions}><select className={shared.pageSizeSelect}><option>20개씩</option><option>50개씩</option></select></div></div><DataGrid columns={COLUMNS} rows={rows} gridTemplate="minmax(190px,1.5fr) minmax(170px,1.3fr) 72px 125px 110px 88px 125px 125px" minWidth="1060px" empty={filtered.length === 0} emptyText="검색 조건에 해당하는 운영 메시지가 없습니다." emptySubtext="검색어나 필터 조건을 변경하거나 새 메시지를 등록해 주세요." emptyActionLabel="메시지 등록" emptyActionClick={() => openCreate()} showPagination pages={[{ label: '‹' }, { label: '1', active: true }, { label: '›' }]} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'}/></div>
    {selected && <OperatingMessageDetailDrawer key={`${selected.id}-${selected.status}-${selected.updatedAt}`} message={selected} onClose={() => setDetailId(null)} onEdit={() => openEdit(selected)} onClone={() => openCreate(selected)} onCancel={() => setCancelId(selected.id)} onRetry={() => retry(selected)} onPreview={() => showPreview(selected)}/>}
    {editor && <Dialog title={editor.mode === 'edit' ? '운영 메시지 수정' : editor.mode === 'clone' ? '운영 메시지 복제' : '운영 메시지 등록'} wide onClose={() => setEditor(null)}><p className={shared.dialogBody}>메시지명은 관리자용 구분값이며, 사용자에게는 별도의 노출 제목과 내용이 전달됩니다.</p><div className={styles.formGrid}><Field label="메시지명 *"><input value={form.managementName} onChange={(event) => setForm({ ...form, managementName: event.target.value })}/></Field><Field label="메시지 유형 *"><input list="message-types" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}/><datalist id="message-types">{types.map((item) => <option key={item} value={item}/>)}</datalist></Field></div><div className={styles.sectionLabel}>발송 채널 *</div><div className={styles.checkGroup}>{CHANNELS.map((channel) => <label key={channel}><input type="checkbox" checked={form.channels.includes(channel)} onChange={() => toggleChannel(channel)}/> {channel}</label>)}</div><Field label="사용자 노출 제목 *"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></Field><Field label="메시지 내용 *"><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={6}/></Field><div className={styles.sectionLabel}>발송 대상 *</div><div className={styles.radioRow}>{(['전체 사용자', '조건 지정', '개별 지정'] as TargetType[]).map((item) => <label key={item}><input type="radio" checked={form.targetType === item} onChange={() => setForm({ ...form, targetType: item })}/> {item}</label>)}</div><div className={styles.targetBox}>{form.targetType === '전체 사용자' && <span>현재 발송 가능한 정상 회원 전체를 대상으로 합니다.</span>}{form.targetType === '조건 지정' && <div className={styles.formGrid}><Field label="회원 상태"><select value={form.memberStatus} onChange={(event) => setForm({ ...form, memberStatus: event.target.value })}><option>정상</option><option>휴면</option><option>전체</option></select></Field><Field label="회원 유형"><select value={form.memberType} onChange={(event) => setForm({ ...form, memberType: event.target.value })}><option>전체</option><option>일반</option><option>VIP</option><option>사업자</option></select></Field><Field label="가입 시작일"><DatePicker value={form.joinFrom} onChange={(event) => setForm({ ...form, joinFrom: event.target.value })}/></Field><Field label="가입 종료일"><DatePicker value={form.joinTo} onChange={(event) => setForm({ ...form, joinTo: event.target.value })}/></Field></div>}{form.targetType === '개별 지정' && <Field label="사용자 ID"><textarea value={form.individualIds} onChange={(event) => setForm({ ...form, individualIds: event.target.value })} placeholder="쉼표 또는 줄바꿈으로 사용자 ID 입력"/></Field>}<div className={styles.estimate}><span>예상 발송 대상</span><strong>{estimatedTargets.toLocaleString()}명</strong></div></div><div className={styles.sectionLabel}>발송 설정 *</div><div className={styles.radioRow}>{(['즉시 발송', '예약 발송'] as const).map((item) => <label key={item}><input type="radio" checked={form.sendMode === item} onChange={() => setForm({ ...form, sendMode: item })}/> {item}</label>)}</div>{form.sendMode === '예약 발송' && <div className={styles.formGrid}><Field label="예약 날짜 *"><DatePicker value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })}/></Field><Field label="예약 시간 *"><input type="time" value={form.scheduledTime} onChange={(event) => setForm({ ...form, scheduledTime: event.target.value })}/></Field></div>}<div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setEditor(null)}>취소</button><button type="button" className={drawer.actionLink} onClick={() => { setPreview({ title: form.title || '메시지 제목', content: form.content, channels: form.channels.length ? form.channels : ['앱 내'] }); setPreviewChannel(form.channels[0] ?? '앱 내'); }}>미리보기</button><button type="button" className={drawer.editCancel} onClick={() => save('draft')}>임시저장</button><button type="button" className={drawer.editConfirm} onClick={() => save('send')}>{form.sendMode === '즉시 발송' ? '즉시 발송' : '발송 예약'}</button></div></Dialog>}
    {preview && <Dialog title="채널별 메시지 미리보기" wide onClose={() => setPreview(null)}><div className={styles.previewTabs}>{preview.channels.map((channel) => <button key={channel} type="button" className={previewChannel === channel ? styles.previewActive : ''} onClick={() => setPreviewChannel(channel)}>{channel}</button>)}</div><div className={styles.phonePreview}><div className={styles.pushCard}><small>{previewChannel === '이메일' ? '서비스 운영팀' : previewChannel === 'SMS' ? 'Web 발신' : '서비스명 · 지금'}</small><strong>{preview.title}</strong><p>{preview.content || '입력된 메시지 내용이 없습니다.'}</p></div></div><div className={shared.dialogActions}><button type="button" className={drawer.editConfirm} onClick={() => setPreview(null)}>확인</button></div></Dialog>}
    {cancelTarget && <Dialog title={cancelTarget.status === '발송 예정' ? '예약 발송 취소' : '메시지 발송 중지'} onClose={() => setCancelId(null)}><p className={shared.dialogBody}><strong>{cancelTarget.managementName}</strong>{cancelTarget.status === '발송 예정' ? `은 ${cancelTarget.scheduledAt}에 발송될 예정입니다. 예약을 취소하면 상태가 중지로 변경됩니다.` : '의 발송을 중지합니다. 이미 처리된 대상의 메시지는 회수되지 않습니다.'}</p><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={() => setCancelId(null)}>닫기</button><button type="button" className={styles.dangerConfirm} onClick={cancelSending}>{cancelTarget.status === '발송 예정' ? '발송 취소' : '발송 중지'}</button></div></Dialog>}
    {toast && <div className={styles.toast}>{toast}</div>}
  </section>;
}

function Dialog({ title, wide, onClose, children }: { title: string; wide?: boolean; onClose: () => void; children: React.ReactNode }) { return <div className={shared.dialogOverlay} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`${shared.dialogBox} ${wide ? styles.wideDialog : ''}`}><div className={styles.dialogHead}><h2 className={shared.dialogTitle}>{title}</h2><button type="button" onClick={onClose}>✕</button></div>{children}</div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
