# RankMaker — Board games

> **This branch is a board-game data branch.**
> It carries roughly 1,400 titles from nine Korean publishers as topics.
> For how the app works — `info.md` syntax and the rest — **see the original README**:
> [한국어](https://github.com/bluekms/rankmaker/blob/main/README.md) · [English](https://github.com/bluekms/rankmaker/blob/main/README.en.md)
>
> What is special here: **the pictures are not stored in the repository.**
> Each item carries a BGG image URL in `info.md`, so they display normally;
> you only fetch files when exporting a poster — see [Attaching pictures by URL](docs/image-url.en.md).

## Topics inside

| Topic | Titles |
|---|---|
| 팝콘에듀 · 만두게임즈 · 보드엠 · 아스모디코리아 | 200–290 each |
| 행복한바오밥 · MTSGames · 젬블로컴퍼니 | 70–180 each |
| 옐로우미플 · 데블다이스 | 20–40 each |
| **BggTop100_260805** | 100 (BGG overall rank 1–100) |

**No pictures in the repo.** They load from the URLs in `info.md`; files are needed only for poster export → **[Attaching pictures by URL](docs/image-url.en.md)**

> [한국어](README.md) | **English**

**An offline ranking board: collect images, rank them, export share-ready posters.**
Runs from a single `index.html` — no server, no install, no build.

Rough them out in **Tier** → refine in **List / Gallery** → export with **Podium**.
There is also a **WorldCup** (favorite tournament) mode, kept entirely separate from the ranking.

## Getting started

1. Grab the zip from [Releases](https://github.com/bluekms/rankmaker/releases/latest) and unpack it.
2. Open `index.html` in a browser. (Chrome / Edge recommended)
3. Hit **Choose Topics Folder** and pick `topics`, or drag the folder onto the window.
   You pick it once per visit — the browser remembers the last location, so it is two clicks.

## Folder layout

```
topics/
├── images/           ← every picture lives here, shared by all topics
│   ├── shin.png
│   └── jin.png
├── podium.png        ← (optional) shared podium artwork
└── my topic/
    ├── info.md       ← what goes in, and how it is described
    └── save.json     ← ranks and checkboxes — created for you
```

**Topic folders hold no pictures.** If several topics cover the same thing, one copy of the image is enough.

> **You do not have to build this by hand.** Pick **`+ New Topic`** at the end of the topic list and drop a folder of
> images on it: the folder name becomes the topic, the pictures are copied into `topics/images/`, and `info.md` is
> written for you with one entry per image.
> If the folder already carries an `info.md`, that file is imported as-is instead of the skeleton — a folder with
> just an `info.md` and no pictures works too.
>
> Below it, **`- Unused Images`** lists pictures no `info.md` refers to, so you can pick them off.

## Writing `info.md`

```markdown
// Ramen ranking      ← topic name (optional)

# global             ← prepended to every item's description
- 🍜 tried it [ ]

# shin.png            ← one item. The name is the filename in topics/images/
- 🌶️ heat: ★★★☆☆
+ 📅 released: 1986
```

| Token | Meaning |
|---|---|
| `# filename` | One item. Must match the filename in `topics/images/` exactly |
| `# global` | Prepended to every item's description |
| `-` / `+` | Always shown / shown in List only |
| `[ ]` | A checkbox, anywhere you like |
| `//` | Settings — topic name, `dark`, `grid`, `columns: 4` |

**The image file is optional** — without one you get a card with just the name on it. A web URL can stand in for the file; that is mostly for very large lists, so it lives in [Attaching pictures by URL](docs/image-url.en.md).

> The 🌶️ 📅 🔗 emoji in the examples are **just text**. They carry no meaning — change them freely.
> Only `#` `-` `+` `[ ]` `//` are actual syntax.

## Views

Tier, List and Gallery **share one ranking**. Change it in one place and the others follow.

### Tier — start rough

![Tier view](docs/tier.png)

Drop an item onto a tier row to move it there; **its position within the row is its rank**.
Five rows by default · `+ Add Tier` to add (max 10) · `×` to remove · click a label to rename · `Size` for icon size.

### List — exact ranks

![List view](docs/list.png)

Click a rank number to type one, use ▲▼ to nudge, or drag the `⣿` handle. Each item can carry a memo.

> Ranks run 1, 2, 3 with no gaps and no ties — when two things are too close to call, put them in the same tier.

### Gallery — see everything

![Gallery view](docs/gallery.png)

`Cols` sets the column count.

### Search and undo

- **Search** matches item names only, and understands Korean initial consonants (`ㅅㄹㅁ` → 신라면). Turn on `All Text` to search descriptions too; matches are highlighted.
- **Undo** rewinds order, tier and checkbox changes up to 50 steps. `Ctrl+Z` works too.

## WorldCup

**Completely separate from the ranking.** Nothing you pick here changes Tier / List / Gallery.

<p align="center"><img src="docs/cup1.png" width="80%" alt="WorldCup setup"></p>

By default you pick **1 of 2**; `Pick n of m` changes that.

<p align="center">
  <img src="docs/cup2.png" width="49%" alt="1 of 2">
  <img src="docs/cup3.png" width="49%" alt="2 of 4">
</p>

`Start from` sets the bracket size (16, 32 …). While running you can `Undo` or `Quit`.
Results are recorded separately in `cup.save.json`.

## Podium — image export

Export a PNG from the **Podium** menu in List or Gallery. In WorldCup you get a **Winner** image of the champion.

<p align="center">
  <img src="docs/top3_light.png" width="49%" alt="Top 3 — light">
  <img src="docs/top10_dark.png" width="49%" alt="Top 10 — dark">
</p>

**The podium artwork is replaceable.** `topics/podium.png` applies everywhere; `topics/<topic>/podium.png` overrides it for that topic.

> The poster needs pictures **as files**. If some are attached by URL, a dialog explains how to get them — see [Attaching pictures by URL](docs/image-url.en.md).

## Saving and backup

- **Chrome / Edge** — every change is written straight to the topic's `save.json` (`Saved ✓`).
- **Firefox / Safari** — no direct folder access, so changes are kept in the browser. Back them up with the buttons below.
- **Save** — download the current ranking as `save.json`.
- **Load** — read a downloaded `save.json` back in.

## License

[MIT](LICENSE)

## Author

**CrosS21** — [bluekms21@naver.com](mailto:bluekms21@naver.com) · [blog.naver.com/bluekms21](https://blog.naver.com/bluekms21)

Built with [Claude Code](https://claude.com/claude-code) — vibe coding.
