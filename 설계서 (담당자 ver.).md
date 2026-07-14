# LocalHub UI/UX 와이어프레임 및 컴포넌트 구조 설계

> WBS 3번 작업 산출물. RFP [참고 4] 화면 구성(안)을 기반으로 서울 권역 + 선정 기능(대시보드, 게시판 추가기능)에 맞게 구체화.

---

## 1. 화면 목록

| # | 화면 | 내용 |
|---|---|---|
| 1 | 홈 화면 | 헤더(카테고리 네비게이션), 배너, 카테고리 카드 4종, 대시보드 요약, 최근 게시글, 챗봇 플로팅 버튼 |
| 2 | 게시판 목록 | 카테고리 탭, 검색창, 글쓰기 버튼, 게시글 목록(조회수 포함), 페이지네이션 |
| 3 | 게시글 상세 | 제목/내용/조회수/좋아요, 목록으로, 수정·삭제(비밀번호 확인 모달) |
| 4 | 게시글 작성/수정 | 제목/내용/카테고리/수정용 비밀번호 입력 폼, 등록/취소 |
| 5 | 데이터 시각화 대시보드 | 카테고리별·자치구별 게시글 통계 차트(Chart.js) |
| 6 | 챗봇 위젯(플로팅) | 접힌 상태(버튼) / 펼친 상태(대화창), 모바일은 전체화면 |

---

## 2. 화면별 상세 구성 (와이어프레임 설명)

### ① 홈 화면
- 상단 헤더: 로고(LocalHub) + 카테고리 네비게이션(관광지/문화시설/레포츠/쇼핑) + 검색 아이콘
- 배너: 서비스 소개 문구 ("서울 나들이 장소 공유 커뮤니티 — 원하는 지역의 장소를 찾고 방문 경험을 나눠보세요")
- 카테고리 카드 4개: 아이콘 + 라벨, 클릭 시 해당 카테고리로 필터링된 게시판 목록으로 이동
- 대시보드 요약: 자치구별 게시글 현황 미니 차트 (전체 대시보드는 별도 화면으로 링크)
- 최근 게시글: 제목 + 조회수 리스트 (최신순 3~5건)
- 우측 하단: 챗봇 플로팅 버튼

### ② 게시판 목록 화면
- 카테고리 탭(선택된 카테고리 강조 표시)
- 검색창 + 검색 버튼 (제목/내용 기준 검색)
- 글쓰기 버튼 (우측 상단)
- 게시글 목록 테이블: 번호 / 제목 / 조회수 / 좋아요 / 작성일
- 페이지네이션

### ③ 게시글 상세 화면
- 제목, 작성일, 조회수, 좋아요 버튼
- 본문 내용
- 목록으로 버튼
- 수정 / 삭제 버튼 → 클릭 시 비밀번호 확인 모달 노출
- 비밀번호 일치 확인(프론트엔드 로직, 평문 비교) 후에만 수정/삭제 진행

### ④ 게시글 작성/수정 화면
- 카테고리 선택(관광지/문화시설/레포츠/쇼핑)
- 제목 입력
- 내용 입력
- 수정용 비밀번호 입력 (숫자 4자리 이상, 작성 시 필수)
- 등록 / 취소 버튼

### ⑤ 데이터 시각화 대시보드
- 카테고리별 게시글 수 (막대 또는 도넛 차트)
- 자치구별 게시글 분포 (막대 차트)
- 인기 게시글 TOP5 (조회수 기준 랭킹)

### ⑥ 챗봇 위젯(플로팅)
- 접힌 상태: 우측 하단 원형 플로팅 버튼
- 펼친 상태: 대화창(타이틀바 + 닫기 버튼, 대화 히스토리 영역, 하단 입력창 + 전송 버튼)
- 모바일에서는 전체 화면으로 표시

---

## 3. Vue 컴포넌트 구조

```
src/
├── main.js                          # 팀전체
├── App.vue                          # 팀전체
├── router/
│   └── index.js                     # 라우팅 설정 (홈/게시판/상세/작성/대시보드) — 팀전체
│
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue            # 로고 + 카테고리 네비게이션 + 검색 — 이진효
│   │   └── ChatbotWidget.vue        # 챗봇 플로팅 버튼 + 대화창 (전역 배치) — 양성호
│   │
│   ├── home/
│   │   ├── HomeBanner.vue           # 서비스 소개 배너 — 이진효
│   │   ├── CategoryCard.vue         # 카테고리 카드 (props: icon, label, category) — 이진효
│   │   └── DashboardSummary.vue     # 홈 화면용 미니 통계 요약 — 오수빈
│   │
│   ├── board/
│   │   ├── PostSearchBar.vue        # 검색창 + 글쓰기 버튼 — 이진효
│   │   ├── PostTable.vue            # 게시글 목록 테이블 — 이진효
│   │   ├── PostPagination.vue       # 페이지네이션 — 이진효
│   │   ├── PostDetail.vue           # 게시글 상세 (제목/본문/조회수/좋아요) — 이진효
│   │   ├── PostForm.vue             # 작성/수정 공용 폼 — 오수빈
│   │   └── PasswordConfirmModal.vue # 수정/삭제 시 비밀번호 확인 모달 — 오수빈
│   │
│   └── dashboard/
│       ├── CategoryChart.vue        # 카테고리별 통계 차트 — 오수빈
│       ├── DistrictChart.vue        # 자치구별 통계 차트 — 오수빈
│       └── TopPostsRanking.vue      # 인기 게시글 랭킹 — 오수빈
│
├── views/
│   ├── HomeView.vue                 # ① 홈 화면 — 이진효
│   ├── BoardListView.vue            # ② 게시판 목록 — 이진효
│   ├── PostDetailView.vue           # ③ 게시글 상세 — 이진효
│   ├── PostFormView.vue             # ④ 게시글 작성/수정 — 오수빈
│   └── DashboardView.vue            # ⑤ 데이터 시각화 대시보드 — 오수빈
│
├── composables/
│   ├── usePosts.js                  # localStorage 게시글 CRUD 로직 (get/add/update/delete) — 오수빈
│   └── useChatbot.js                # OpenAI API 호출 로직 — 양성호
│
└── utils/
    └── placeData.js                 # 서울 JSON(관광지/문화시설/레포츠/쇼핑) 로드 및 가공 — 오수빈
```

---

## 4. 화면 ↔ 라우팅 매핑

| 라우트 경로 | 화면 | 컴포넌트 |
|---|---|---|
| `/` | 홈 화면 | `HomeView.vue` |
| `/board/:category` | 게시판 목록 | `BoardListView.vue` |
| `/board/:category/:id` | 게시글 상세 | `PostDetailView.vue` |
| `/board/:category/write` | 게시글 작성 | `PostFormView.vue` |
| `/board/:category/edit/:id` | 게시글 수정 | `PostFormView.vue` (수정 모드) |
| `/dashboard` | 데이터 시각화 대시보드 | `DashboardView.vue` |

---

## 5. 담당자 배정 참고 (WBS 5~10번과 연결)

| 컴포넌트 그룹 | 관련 WBS 작업 |
|---|---|
| `layout/`, `home/` | UI 레이아웃 및 게시판 목록/상세 컴포넌트 구현 |
| `board/PostTable.vue`, `board/PostForm.vue`, `composables/usePosts.js` | 게시판 CRUD 및 localStorage 연동 개발 |
| `layout/ChatbotWidget.vue`, `composables/useChatbot.js` | 챗봇 API 개발 / 챗봇 UI 위젯 개발 |
| `dashboard/` | 데이터 시각화 대시보드 구현 |
| `board/PostSearchBar.vue`, 조회수·좋아요 로직 | 게시판 추가기능 구현 |
