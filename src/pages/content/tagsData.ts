export interface Tag {
  id: string;
  name: string;
  code: string;
  count: number;
  use: boolean;
  desc: string;
  created: string;
  updated: string;
}

export const TAGS: Tag[] = [
  { id: 't01', name: '태그 01', code: 'TAG_001', count: 124, use: true, desc: '', created: '2026.07.01', updated: '2026.08.10' },
  { id: 't02', name: '태그 02', code: 'TAG_002', count: 18, use: true, desc: '', created: '2026.07.03', updated: '2026.07.03' },
  { id: 't03', name: '태그 03', code: 'TAG_003', count: 0, use: false, desc: '', created: '2026.07.05', updated: '2026.08.01' },
  { id: 't04', name: '감성', code: 'EMOTION', count: 52, use: true, desc: '', created: '2026.06.20', updated: '2026.08.09' },
  { id: 't05', name: '액션', code: 'ACTION', count: 87, use: true, desc: '', created: '2026.06.11', updated: '2026.08.05' },
  { id: 't06', name: '신작', code: 'NEW_RELEASE', count: 6, use: true, desc: '신규 등록 콘텐츠에 자동으로 붙는 태그', created: '2026.05.30', updated: '2026.08.11' },
  { id: 't07', name: '이벤트', code: 'EVENT', count: 0, use: true, desc: '', created: '2026.05.14', updated: '2026.07.02' },
  { id: 't08', name: '테스트', code: 'TEST', count: 0, use: false, desc: '배포 확인용 내부 태그', created: '2026.05.02', updated: '2026.05.02' },
  { id: 't09', name: '추천', code: 'RECOMMEND', count: 210, use: true, desc: '', created: '2026.04.18', updated: '2026.08.12' },
  { id: 't10', name: '완결', code: 'COMPLETE', count: 143, use: true, desc: '', created: '2026.04.02', updated: '2026.07.28' },
  { id: 't11', name: '미분류', code: 'UNCATEGORIZED', count: 0, use: false, desc: '', created: '2026.03.20', updated: '2026.03.20' },
  { id: 't12', name: '임시', code: 'TEMP', count: 0, use: false, desc: '', created: '2026.03.05', updated: '2026.03.05' },
];
