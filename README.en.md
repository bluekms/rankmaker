# RankMaker

> [한국어](README.md) | **English**

**An offline ranking board: drop images into a folder, rank them, export share-ready posters.**
Runs from a single `index.html` — no server, no install, no build.

## Contents

- [What it does](#what-it-does)
- [Getting started](#getting-started)
- [Learn from the examples](#learn-from-the-examples)
- [Views](#views)
- [WorldCup](#worldcup)
- [Podium — image export](#podium--image-export)
- [Creating your own topic](#creating-your-own-topic)
- [Saving and backup](#saving-and-backup)

## What it does

1. Sort things roughly with **Tier**,
2. fine-tune the exact order in **List** / **Gallery**,
3. export it with **Podium**.

Plus a separate **WorldCup** (bracket) mode that has nothing to do with your ranking.

## Getting started

1. Download the latest zip from [Releases](https://github.com/bluekms/rankmaker/releases/latest) and unzip it.
2. Open `index.html` in your browser. (Chrome / Edge recommended)
3. Click **"Connect Topics Folder"** and pick the `topics` folder, or drag & drop it onto the window.
   This one-time approval is required by browser security; later launches open automatically.

## Learn from the examples

The zip ships three examples under `topics/`, all prefixed `ex_`. Delete them when you're done.

### `ex_라면` — no images, just `info.md`

A board works even with zero image files. Items with only a name get an auto-generated color card.

```markdown
# global
- 🍜 tried it [ ]

# 신라면.svg
- 🌶️ heat: ★★★☆☆
+ 📅 released: 1986
```

- `# global` → lines prepended to every item
- lines starting with `-` → shown in **both List and Gallery**
- lines starting with `+` → shown in **List only**

### `ex_chzzk_vtuber` — video, playable right in the browser

Put a CHZZK clip URL in a description line and it **plays inside the WorldCup card**.
An image URL becomes the card thumbnail. Both are detected from **the URL alone**.

```markdown
# 시라유키 히나 - 발박수 하는 거 보고 휘둥그레.svg
- 👤 Shirayuki Hina · 👁 399,168
+ 🖼 https://video-phinf.pstatic.net/.../ZTIVw2ab9M_05.jpg
+ 🔗 https://chzzk.naver.com/clips/brl5GPRc6g
```

> The leading 🖼 and 🔗 are **decoration only** — remove them or use anything else and it still works.

> CHZZK, Naver TV, Vimeo, SOOP, and local `.mp4` / `.webm` files all play inline.

### `ex_youtube_kpop` — YouTube can't play inline

YouTube refuses to embed when `index.html` is opened as a local file (error 153). Clicking the card **opens a new tab** instead.

## Views

Tier, List and Gallery **share one ranking** — change it in one place and the others follow.
Search supports Korean chosung (`ㅅㄹㅁ` → 신라면).

### Tier — start rough

![Tier view](docs/tier.png)

Best place to start when you have a lot of items. Drop onto a row to join that tier; **the order inside a tier is the rank**.

- 5 rows by default · `+ Add Tier` to add (max 10) · `×` to delete (its items move to the `…` pool)
- Click a label to rename it
- `Size` sets the icon size

### List — exact ranks

![List view](docs/list.png)

- Click the rank number to type one; hover it for ▲▼ to nudge by one
- Grab the `⣿` handle to drag
- Ties allowed
- A memo box per item (List view only)

### Gallery — see everything

![Gallery view](docs/gallery.png)

`Cols` sets the number of columns.

## WorldCup

**Completely independent from the ranking board.** Nothing you pick here changes Tier / List / Gallery.

<p align="center"><img src="docs/cup1.png" width="80%" alt="WorldCup setup"></p>

The default is **pick 1 of 2**; change it with `Pick n of m`.

<p align="center">
  <img src="docs/cup2.png" width="49%" alt="1 of 2">
  <img src="docs/cup3.png" width="49%" alt="2 of 4">
</p>

`Start from` sets the bracket size (16, 32, …). While playing, `Undo` steps back and `Quit` exits.
Results are recorded separately in `cup.save.json`.

## Podium — image export

In List or Gallery view, open the **Podium** menu to export a PNG.

| Menu | Result |
|---|---|
| Instagram — 1:1 · Top 3 | Square podium image for Instagram |
| Poster — Top 10 | Tall Top 10 poster |

<p align="center">
  <img src="docs/top3_light.png" width="49%" alt="Top 3 — light">
  <img src="docs/top10_dark.png" width="49%" alt="Top 10 — dark">
</p>

In WorldCup, the same export produces a single **Winner** image.

**The podium artwork is replaceable.** `topics/podium.png` applies to every topic; drop `topics/<topic>/podium.png` to override it for one topic.

## Creating your own topic

One folder under `topics/` = one board.

```
topics/
├── podium.png       ← (optional) shared podium artwork
└── my-topic/
    ├── item1.png    ← image = item, filename = name
    ├── item2.jpg
    ├── info.md      ← (optional) descriptions
    └── save.json    ← ranks & checks — auto-created
```

`info.md` rules:

- `# filename` — description for that item; must match the filename exactly.
  The file doesn't have to exist — a name card, or an image URL from the description, is used instead.
- `# global` — lines shown at the top of every item's description.
- `-` required lines (always shown) / `+` extra lines (List view only)
- `[ ]` — put checkboxes anywhere.
- `http(s)://` addresses render as clickable links; image and video URLs are picked up as thumbnails and playable media.

> The 🌶️ 📅 🔗 emoji in the examples are **just text**. They aren't syntax — change or drop them freely.
> Only four things actually mean something: the leading `-` and `+`, the `#` heading, and `[ ]`.

## Saving and backup

- **Chrome / Edge** — every change is auto-saved to `save.json` in the topic folder ("Saved ✓").
- **Firefox / Safari** — can't write to the folder, so changes are kept in the browser. Use the buttons below to back up.
- **Save** — downloads the current ranking as a `save.json` file.
- **Import** — loads a `save.json` back in.

## License

[MIT](LICENSE)

## Author

**CrosS21** — [bluekms21@naver.com](mailto:bluekms21@naver.com) · [blog.naver.com/bluekms21](https://blog.naver.com/bluekms21)

This project was built by **vibe coding** with [Claude Code](https://claude.com/claude-code).
