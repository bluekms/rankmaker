# RankMaker

> [한국어](README.md) | **English**

**An offline ranking board: collect images, rank them, export share-ready posters.**
Runs from a single `index.html` — no server, no install, no build.

Rough them out in **Tier** → refine in **List / Gallery** → export with **Podium**.
There is also a **WorldCup** (favorite tournament) mode, kept entirely separate from the ranking.

## Getting started

1. Grab the zip from [Releases](https://github.com/bluekms/rankmaker/releases/latest) and unpack it.
2. Open `index.html` in a browser. (Chrome / Edge recommended)
3. Hit **Connect Topics Folder** and pick `topics`, or drag the folder onto the window.
   The browser asks for permission **once**; after that it reopens on its own.

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

### Finding an image URL on BGG

Board game topics carry a **BGG original-resolution URL** in `info.md` instead of an image file. Here is how to get one.

**1. Take the BGG item id** from the game's page URL.

```
https://boardgamegeek.com/boardgame/164928/orleans            → 164928
https://boardgamegeek.com/boardgameexpansion/439816/...       → 439816   (same slot for expansions)
```

**2. Pull the original URL from the API.** Expansions and versions also answer to `objecttype=thing`.

```
https://api.geekdo.com/api/geekitems?objectid=164928&objecttype=thing
```

**`item.images.original`** in the response is the full-resolution URL.

```json
{ "item": { "images": {
    "thumb":    ".../__small/...200x150...",
    "original": ".../__original/img/.../0x0/filters:format(jpeg)/pic6228507.jpg"
} } }
```

**3. Add one line to the item.**

```markdown
# orleans.jpg
- ⭐ bgg rating: 8.05
+ 🔗 https://boardgamegeek.com/boardgame/164928/orleans
+ 🖼 https://cf.geekdo-images.com/.../__original/img/.../pic6228507.jpg
```

> **Do not try to upscale a thumbnail URL by hand.** Swapping `__itemrep` for `__original` returns the same
> thumbnail, and editing the size path (`/fit-in/246x300/`) breaks the signature and 400s. Always use
> `images.original` from the API.

> One URL per item, at the highest resolution you can get. The on-screen image and the download link in the
> poster dialog use the same URL, so that one address is the quality you end up with.

**Games that are not on BGG** have no URL to use — locally published items often aren't. Put the image file
in `topics/images/` for those, as before.

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
