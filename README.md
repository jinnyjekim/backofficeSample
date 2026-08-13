# 회원 관리 백오피스 (Member Admin UI)

Claude Design에서 만든 `회원 관리.dc.html` 프로토타입을 React + TypeScript로 실구현한 프로젝트입니다.

## 스택

- React 19 + TypeScript
- Vite
- React Router
- CSS Modules
- Mock 데이터 (백엔드 연동 없음 — `src/data/members.ts`)

## 화면 구성

- **대시보드** (`/dashboard`) — 오늘 확인할 항목, KPI, 주간 추이, 회원 현황, 실시간 활동
- **회원 목록** (`/members`) — 검색 + 조건 칩 필터, 세그먼트 요약(상태 구성/가입 경로/내보내기), 회원 테이블 + 상세 드로어, 일괄 작업
- **탈퇴 회원** (`/members/left`) — 탈퇴 사유·이용 기간·개인정보 보관/파기 상태
- **제재 회원** (`/members/ban`) — 제재 유형·사유·기간·근거·누적 이력

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
```
