# LOANRUN

React 19 + Vite, JSX와 일반 CSS를 사용합니다.

## 실행
```sh
npm install
npm run dev
npm run build
npm run lint
```

## Figma 홈 화면
원본: https://www.figma.com/design/99CGlU1HCY1wurn4wBhpI6/26-4호선톤?node-id=128-852

| URL | 화면 | Figma node |
| --- | --- | --- |
| / 또는 /?screen=pro | B1 홈 PRO | 128:854 |
| /?screen=free | B2 홈 Free | 128:1151 |
| /?screen=seven-loans | B-7 홈 대출 7개 예시 | 386:18655 |
| /?screen=rate-change | B1-r 금리 변경 안내 | 391:19874 |

홈 예시 데이터는 src/pages/Home/data.js에 있습니다. 내 대출 전체 보기와 대출 관리 메뉴는 /loans로 이동합니다. 예산·지출, 위험 분석, 상환 리포트 등 미구현 메뉴는 준비 중 안내를 엽니다. 금리 변경 배너는 닫을 수 있습니다.

## 파일 구조
- src/components/Sidebar/Sidebar.jsx, Sidebar.scss: 독립된 공용 사이드바
- src/pages/Home/components/LoanOverview.jsx: 대출 요약, 대출별 상환 트랙
- src/pages/Home/components/MonthlyRepayment.jsx: 이번 달 상환
- src/pages/Home/components/RiskCard.jsx: 위험도 및 Free 잠금 상태
- src/pages/Home/components/DetailDialog.jsx: 준비 중 안내, 기본 dialog의 키보드 포커스·Escape 동작
- src/pages/Home/data.js: 화면별 상태와 예시 대출
- src/assets/home/: Figma에서 받은 원본 SVG 9개
- src/App.jsx, App.css: 홈 조합 및 반응형 레이아웃
- src/index.scss: 공통 토큰·타이포그래피
- public/fonts/: 로컬 Pretendard 폰트

## 공용 사이드바 사용
```jsx
import Sidebar from './components/Sidebar/Sidebar.jsx'

<Sidebar
  active="loans"
  plan="Free"
  onNavigate={item => navigate(item.href)}
/>
```

active는 home, loans, budget, risk, reports, settings를 지원합니다. plan은 Free 또는 Pro입니다. onNavigate를 생략하면 기본 링크로 이동합니다. items 속성으로 { id, label, href, pro? } 배열을 전달해 메뉴를 변경할 수 있습니다. 본문에는 id="main-content"를 지정하면 본문 이동 링크가 동작합니다.

Free의 사이드바 배지 '라벨'은 원본 Figma 인스턴스 텍스트를 그대로 반영했습니다.

## 원본 자산
SVG의 내부 경로와 고유 크기는 변경하지 않았습니다.
- loanrun-logo.svg: 로고, 38.0372 × 20.04
- pace-steady-dot.svg / pace-slow-dot.svg / pace-ahead-dot.svg: 순항·속도 조절·앞서 달림 점, 6 × 6
- repayment-donut-track.svg: 도넛 바탕, 96 × 96
- repayment-donut-paid.svg: 도넛 납부 구간, 47.1498 × 41.704
- pro-lock.svg: 잠금, 20 × 20
- rate-change-info.svg: 안내, 20 × 20
- close.svg: 닫기, 16 × 16

Pretendard Variable: https://github.com/orioncactus/pretendard (SIL OFL 1.1).
활성 사이드바의 IBM Plex Sans KR는 Google Fonts에서 로드하며 네트워크가 없으면 Pretendard로 표시합니다.

## 검증
npm run build 및 npm run lint. verification/check.mjs는 설치된 Chrome의 헤드리스 모드로 4개 화면의 자산 로딩·배치·상호작용과 1024/390px 가로 넘침을 검사하고 스크린샷을 저장합니다. 개발 서버 실행 후 node verification/check.mjs로 재실행할 수 있습니다.


## ?? ??
??? ??? pages?, ?? ???? ???? ??? ??? components? ???. Home ?? ??? pages/Home/components? ?? ?? ??? ?? ?????. ???? .scss? ???? ?? sass ?? ???? Vite? ?????. SVG? ??? ?? kebab-case ???? ?????.

## 대출 관리
Figma: https://www.figma.com/design/99CGlU1HCY1wurn4wBhpI6/26-4호선톤?node-id=129-1142

| URL | 화면 |
| --- | --- |
| /loans | 내 대출 |
| /loans/monthly | 이번 달 상환·캘린더 |
| /loans/segments | 구간 기록·월별 상세 펼침 |
| /loans/plan | 상환 계획 |
| /loans/history | 상환 내역 |
| /loans/plan/edit | 계획 수정 |

대출별 조회는 ?loan=all, ?loan=credit, ?loan=mortgage로 지정합니다. 홈의 사이드바와 내 대출 전체 보기에서도 진입할 수 있습니다. 대출 관리 메뉴가 활성화되면 하위 메뉴 4개가 나타나며 현재 화면에 표시 막대가 붙습니다. 브라우저 뒤로·앞으로 이동과 직접 URL 진입을 지원합니다.

### 파일
- src/pages/Loans/Loans.jsx, Loans.scss: 대출관리 페이지·SCSS
- src/pages/Loans/components/: 내 대출 카드, 필터, 캘린더, 내역, 기록, 계획 및 입력 모달
- src/pages/Loans/data.js: 원본 Figma 예시 데이터
- src/pages/Loans/icons.js: 원본 SVG 참조
- src/assets/loans/: 용도별 kebab-case 이름의 원본 SVG
- src/components/Sidebar/: 홈과 대출관리가 공유하는 사이드바

Sidebar는 기존 props에 activeSub를 추가했습니다. active="loans", activeSub="overview" | "monthly" | "segments" | "plan"으로 사용합니다. onNavigate로 전달하는 하위 메뉴에는 parent: 'loans'가 포함됩니다.

### 동작 범위
대출 추가(3단계 또는 직접 입력), 납부 기록 저장, 상환 계획 변경을 지원합니다. 추가·변경 데이터는 localStorage의 loanrun-loans-v1에 저장하며 새로고침 후에도 유지합니다. 서버·은행 연동은 없습니다. 금리 변경 기록은 조회 모달로 제공하며, 자동 상환 계산과 금리 변경 입력·납부 수정/삭제는 구현 범위에 포함되지 않습니다. 계획 비교와 과거 차트는 Figma 예시 데이터입니다.

### 검증
개발 서버 실행 후 node verification/loans-check.mjs로 6개 화면, 홈에서 이동·4개 하위 메뉴·대출 필터·날짜 선택·기록 저장·계획 변경·대출 추가 및 1024/390px 넘침을 검증합니다. 스크린샷과 결과는 verification/loans-*.png, verification/loans-checks.json에 저장됩니다.
