# RankMaker

> **한국어** | [English](README.en.md)

**폴더에 이미지를 넣고 순위를 매겨, SNS용 포스터로 뽑아내는 오프라인 순위표.**
`index.html` 하나로 동작합니다 — 서버도, 설치도, 빌드도 없습니다.

## 목차

- [RankMaker](#rankmaker)
  - [목차](#목차)
  - [무엇을 하는 도구인가](#무엇을-하는-도구인가)
  - [시작하기](#시작하기)
  - [예제로 익히기](#예제로-익히기)
    - [`ex_라면` — 이미지 없이 `info.md` 만으로](#ex_라면--이미지-없이-infomd-만으로)
    - [`ex_chzzk_vtuber` — 영상, 브라우저에서 바로 재생](#ex_chzzk_vtuber--영상-브라우저에서-바로-재생)
    - [`ex_youtube_kpop` — 유튜브는 재생 불가](#ex_youtube_kpop--유튜브는-재생-불가)
  - [뷰 소개](#뷰-소개)
    - [Tier — 대략적인 분류부터](#tier--대략적인-분류부터)
    - [List — 상세 순위](#list--상세-순위)
    - [Gallery — 한눈에](#gallery--한눈에)
  - [WorldCup](#worldcup)
  - [Podium — 이미지 출력](#podium--이미지-출력)
  - [내 주제 만들기](#내-주제-만들기)
  - [저장과 백업](#저장과-백업)
  - [라이선스](#라이선스)
  - [개발자](#개발자)

## 무엇을 하는 도구인가

1. **Tier** 로 대략적인 순위를 나누고
2. **List** / **Gallery** 에서 자세한 순위를 매긴 다음
3. **Podium** 으로 이미지를 뽑습니다.

여기에 순위와 무관한 **WorldCup**(이상형 월드컵) 모드가 따로 있습니다.

## 시작하기

1. [Releases](https://github.com/bluekms/rankmaker/releases/latest) 에서 최신 zip 을 받아 압축을 풉니다.
2. `index.html` 을 브라우저로 엽니다. (Chrome / Edge 권장)
3. **"Connect Topics Folder"** 로 `topics` 폴더를 선택하거나, 폴더를 창에 끌어다 놓습니다.
   브라우저 보안상 필요한 **최초 1회** 승인이며, 다음부터는 자동으로 열립니다.

## 예제로 익히기

압축을 풀면 `topics/` 에 `ex_` 로 시작하는 예제 세 개가 들어 있습니다. 필요 없어지면 지우면 됩니다.

### `ex_라면` — 이미지 없이 `info.md` 만으로

이미지 파일이 하나도 없어도 순위표가 만들어집니다. 이름만 있으면 색 카드가 자동으로 생성됩니다.

```markdown
# global
- 🍜 먹어봄 [ ]

# 신라면.svg
- 🌶️ 매운맛: ★★★☆☆
+ 📅 출시: 1986년
```

- `# global` → 모든 아이템에 공통으로 붙는 줄
- `-` 로 쓴 줄 → **List·Gallery 양쪽**에 표시
- `+` 로 쓴 줄 → **List 에만** 표시

### `ex_chzzk_vtuber` — 영상, 브라우저에서 바로 재생

설명 줄에 치지직 클립 주소를 적어두면 WorldCup 카드 안에서 **바로 재생**됩니다.
이미지 주소를 적으면 카드 썸네일로 쓰입니다. 둘 다 **주소만 보고 자동으로 판별**합니다.

```markdown
# 시라유키 히나 - 발박수 하는 거 보고 휘둥그레.svg
- 👤 시라유키 히나 · 👁 399,168회
+ 🖼 https://video-phinf.pstatic.net/.../ZTIVw2ab9M_05.jpg
+ 🔗 https://chzzk.naver.com/clips/brl5GPRc6g
```

> 앞의 🖼 · 🔗 은 눈에 잘 띄라고 붙인 **장식일 뿐**입니다. 이모지를 지우거나 다른 걸 써도 똑같이 동작합니다.

> 치지직 · 네이버TV · Vimeo · SOOP · 폴더 안의 `.mp4`/`.webm` 는 카드 안에서 재생됩니다.

### `ex_youtube_kpop` — 유튜브는 재생 불가

유튜브는 `index.html` 을 파일로 열었을 때 임베드를 거부합니다(오류 153). 카드를 누르면 **새 탭에서 열립니다.**

## 뷰 소개

Tier · List · Gallery 는 **같은 순위를 공유**합니다. 한 곳에서 바꾸면 나머지에도 반영됩니다.
검색창은 **초성 검색**을 지원합니다. (`ㅅㄹㅁ` → 신라면)

### Tier — 대략적인 분류부터

![Tier 뷰](docs/tier.png)

아이템이 많을 땐 여기서 시작합니다. 티어 행에 끌어다 놓으면 그 티어에 들어가고, **티어 안의 순서가 그대로 순위**가 됩니다.

- 기본 5개 · `+ Add Tier` 로 추가(최대 10) · `×` 로 삭제(아이템은 맨 아래 `…` 로 이동)
- 라벨을 클릭해 이름 변경
- `Size` 로 아이콘 한 개의 크기 조절

### List — 상세 순위

![List 뷰](docs/list.png)

- 순위 숫자 클릭 → 직접 입력 / 마우스를 올리면 나오는 ▲▼ 로 한 칸 이동
- `⣿` 핸들을 잡고 드래그
- 동률 허용
- 아이템마다 메모 입력 (List 에서만 표시)

### Gallery — 한눈에

![Gallery 뷰](docs/gallery.png)

`Cols` 로 열 수를 조절합니다.

## WorldCup

**순위표와 완전히 독립된 기능입니다.** 여기서 무엇을 고르든 Tier / List / Gallery 순위는 바뀌지 않습니다.

<p align="center"><img src="docs/cup1.png" width="80%" alt="WorldCup 설정 화면"></p>

기본은 **2개 중 1개**를 고르는 방식이고, `Pick n of m` 으로 바꿀 수 있습니다.

<p align="center">
  <img src="docs/cup2.png" width="49%" alt="2개 중 1개">
  <img src="docs/cup3.png" width="49%" alt="4개 중 2개">
</p>

`Start from` 으로 참가 인원(16강, 32강 …)을 정하고, 진행 중에는 `Undo` 로 되돌리거나 `Quit` 로 나갑니다.
결과는 `cup.save.json` 에 따로 기록됩니다.

## Podium — 이미지 출력

List 또는 Gallery 에서 **Podium** 메뉴를 누르면 PNG 로 뽑을 수 있습니다.

| 메뉴 | 결과 |
|---|---|
| Instagram — 1:1 · Top 3 | 인스타그램용 정사각 단상 이미지 |
| Poster — Top 10 | Top 10 세로 포스터 |

<p align="center">
  <img src="docs/top3_light.png" width="49%" alt="Top 3 — 라이트">
  <img src="docs/top10_dark.png" width="49%" alt="Top 10 — 다크">
</p>

WorldCup 에서는 우승자 한 명으로 **Winner** 이미지가 만들어집니다.

**단상 그림은 교체할 수 있습니다.** `topics/podium.png` 가 전체 공통이고, 주제 폴더에 `topics/<주제>/podium.png` 를 넣으면 그 주제만 바뀝니다.

## 내 주제 만들기

`topics/` 아래 폴더 하나가 순위표 하나입니다.

```
topics/
├── podium.png        ← (선택) 공통 단상 그림
└── 나의주제/
    ├── 아이템1.png    ← 이미지 = 아이템, 파일명 = 이름
    ├── 아이템2.jpg
    ├── info.md       ← (선택) 설명
    └── save.json     ← 순위·체크 상태 — 자동 생성
```

`info.md` 규칙:

- `# 파일명` — 해당 아이템의 설명. 파일명과 정확히 일치해야 합니다.
  실제 파일이 없어도 됩니다 — 그때는 이름 카드나 설명에 적어둔 이미지 주소가 대신 쓰입니다.
- `# global` — 모든 아이템 설명 맨 위에 공통으로 붙습니다.
- `-` 필수 설명(어디서나 표시) / `+` 추가 설명(List 에서만)
- `[ ]` — 어디에나 체크박스를 넣을 수 있습니다.
- `http(s)://` 주소는 클릭 가능한 링크가 되고, 이미지·영상 주소는 썸네일·재생용으로 자동 인식됩니다.

> 예제의 🌶️ 📅 🔗 같은 이모지는 **전부 그냥 글자**입니다. 문법이 아니니 마음대로 바꾸거나 빼도 됩니다.
> 실제로 의미가 있는 기호는 줄 앞의 `-` `+`, 제목 줄의 `#`, 체크박스 `[ ]` 넷뿐입니다.

## 저장과 백업

- **Chrome / Edge** — 모든 변경이 주제 폴더의 `save.json` 에 즉시 자동 저장됩니다("저장됨 ✓").
- **Firefox / Safari** — 폴더에 직접 쓸 수 없어 브라우저에 저장됩니다. 백업은 아래 버튼으로 합니다.
- **Save** — 현재 순위를 `save.json` 파일로 내려받습니다.
- **Import** — 내려받은 `save.json` 을 다시 불러옵니다.

## 라이선스

[MIT](LICENSE)

## 개발자

**CrosS21** — [bluekms21@naver.com](mailto:bluekms21@naver.com) · [blog.naver.com/bluekms21](https://blog.naver.com/bluekms21)

이 프로젝트는 [Claude Code](https://claude.com/claude-code)를 이용한 **바이브 코딩**(vibe coding)으로 개발되었습니다.
