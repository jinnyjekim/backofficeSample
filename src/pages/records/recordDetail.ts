import type { BanMember, LeftMember } from '../../data/members';
import { ACCENT, RED } from '../../lib/theme';
import type { Pill } from './recordsData';

export interface DetailField {
  label: string;
  value: string;
  color?: string;
  pill?: Pill;
}

export interface DetailSection {
  title: string;
  note?: string;
  fields: DetailField[];
}

export interface TimelineEntry {
  title: string;
  when: string;
  dot: string;
}

export interface EvidenceEntry {
  text: string;
  linkLabel: string;
}

export interface RecDetail {
  title: string;
  sub: string;
  sections: DetailSection[];
  evidence?: EvidenceEntry[];
  timeline: TimelineEntry[];
  footer: string;
  action: string;
}

const pill = (bg: string, fg: string): Pill => ({ bg, fg });

export function buildLeftDetail(rd: LeftMember): RecDetail {
  return {
    title: '탈퇴 회원 상세',
    sub: '#' + rd.id + ' · ' + rd.name,
    sections: [
      {
        title: '기본 정보',
        fields: [
          { label: '회원번호', value: String(rd.id) },
          { label: '이메일 / 계정', value: rd.email },
          { label: '가입 방식', value: 'Naver', pill: pill('#ecfdf5', '#059669') },
          { label: '가입일', value: rd.joined },
          { label: '이용 기간', value: rd.dur },
          { label: '정지 이력', value: rd.type === '관리자처리' ? '2회' : '없음', color: rd.type === '관리자처리' ? '#b91c1c' : '#8b8b93' },
        ],
      },
      {
        title: '탈퇴 정보',
        fields: [
          { label: '탈퇴일', value: rd.left },
          { label: '탈퇴 유형', value: rd.type, pill: rd.type === '관리자처리' ? pill('#fffbeb', '#b45309') : pill('#f4f4f5', '#52525b') },
          { label: '탈퇴 사유', value: rd.reason },
        ],
      },
      {
        title: '개인정보 처리',
        note: rd.data === '보관중' ? '개인정보 보호법에 따라 탈퇴 후 1년간 보관 후 파기됩니다. 파기 예정일 이전에 임의 삭제하려면 별도 승인이 필요합니다.' : undefined,
        fields: [
          { label: '데이터 상태', value: rd.data, pill: rd.data === '보관중' ? pill('#fffbeb', '#b45309') : pill('#f4f4f5', '#52525b') },
          { label: '파기 예정일', value: rd.data === '보관중' ? '2027.08.08' : '파기 완료', color: rd.data === '보관중' ? '#b45309' : '#8b8b93' },
        ],
      },
    ],
    timeline: [
      ...(rd.rejoin ? [{ title: '재가입', when: '2026.08.08', dot: ACCENT }] : []),
      { title: rd.type === '관리자처리' ? '관리자 탈퇴 처리' : '본인 탈퇴 신청', when: rd.left, dot: '#a1a1aa' },
      { title: '가입', when: rd.joined, dot: '#d4d4d8' },
    ],
    footer: '계정 복구가 필요한 경우 별도의 계정 복구 프로세스를 통해 진행하세요.',
    action: '복구 요청',
  };
}

export function buildBanDetail(rd: BanMember): RecDetail {
  return {
    title: '제재 회원 상세',
    sub: '#' + rd.id + ' · ' + rd.name,
    sections: [
      {
        title: '기본 정보',
        fields: [
          { label: '회원번호', value: String(rd.id) },
          { label: '이메일 / 계정', value: rd.email },
          { label: '현재 상태', value: rd.state, pill: pill('#f4f4f5', '#52525b') },
        ],
      },
      {
        title: '제재 정보',
        note: rd.type === '영구정지' ? '영구정지는 해제 시 상위 관리자 승인이 필요합니다. 해제 시 제재 이력은 보존됩니다.' : undefined,
        fields: [
          { label: '제재 유형', value: rd.type, pill: rd.type === '영구정지' ? pill('#fef2f2', '#b91c1c') : /정지$/.test(rd.type) ? pill('#fffbeb', '#b45309') : pill('#f4f4f5', '#52525b') },
          { label: '제재 사유', value: rd.reason },
          { label: '시작일', value: rd.start },
          { label: '해제 예정', value: rd.end, color: rd.end === '—' ? '#b91c1c' : '#18181b' },
          { label: '처리자', value: rd.by },
        ],
      },
      {
        title: '누적 이력',
        fields: [
          { label: '제재 횟수', value: rd.count + '회' },
          { label: '신고 접수', value: rd.type === '경고' ? '1건' : '5건' },
          { label: '이의신청', value: '없음', color: '#8b8b93' },
        ],
      },
    ],
    evidence: rd.evidence.map(([text, linkLabel]) => ({ text, linkLabel })),
    timeline: [
      { title: rd.type + ' 적용', when: rd.start + ' · ' + rd.by, dot: RED },
      { title: '신고 누적 임계 도달', when: '2026.07.26', dot: '#a1a1aa' },
      { title: '최초 경고', when: '2026.06.14', dot: '#d4d4d8' },
    ],
    footer: '제재 해제 시 회원에게 알림이 발송되며 이력은 보존됩니다.',
    action: '제재 해제',
  };
}
