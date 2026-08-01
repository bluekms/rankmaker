# RankMaker

> [한국어](README.md) | **English**

An offline ranking board: drop images into a folder and rank them. Runs from a single `index.html` — no server, no install.

## Getting started

1. Clone this repository or download the ZIP.
2. Open `index.html` in your browser. (Chrome / Edge recommended)
3. Click **"Connect topics folder"** and pick the `topics` folder, or drag & drop it onto the window.
   This one-time approval is required by browser security; subsequent launches open automatically.

> On Firefox/Safari, changes are saved in the browser instead of the folder — use Export/Import for file backups.

## Creating a topic

One folder under `topics/` = one ranking board. Make a folder and drop images in.

```
topics/
└── my-topic/
    ├── item1.png      ← image = item, filename = name
    ├── item2.jpg
    ├── info.md        ← (optional) descriptions
    └── save.json      ← ranks & checks — auto-created on first interaction
```

## Writing info.md

```markdown
# global
- Owned: no [ ] / yes [ ]

# item1.png
- score: 8.1          ← "-" required: always shown
+ players: 2–4        ← "+" extra: list view only
```

- `# global` — lines shown at the top of every item's description.
- `# filename` — description for that image; must match the filename exactly.
- `[ ]` — put checkboxes anywhere. Their state is stored in `save.json`.

## Using the app

| To do | How |
|---|---|
| Switch topics | Dropdown at the top left |
| Search | Header search box — names & descriptions, Korean chosung (`ㅅㄹㅁ`) supported |
| Switch views | List / Gallery buttons; set column count in gallery view |
| Toggle theme | 🌙 / ☀️ at the top right |
| Move a rank one step | Hover the rank number → ▲▼ |
| Type a rank | Click the rank number (Enter to confirm / Esc to cancel) |
| Drag to reorder | Grab the ⣿ handle |
| Export as image | "Image export" menu → Instagram (1:1, Top 3 podium) / Poster (Top 10) PNG |
| Backup / restore | Export / Import (`save.json` file) |

- Typing an existing rank creates a tie: 1, 1, 1, then 4.
- Numbers above the item count (e.g. 999) insert as sole last; 0 or below as sole first.
- Every change is auto-saved instantly ("Saved ✓").

## Examples

Folders prefixed with `ex_` are samples — delete them when no longer needed.

- `topics/ex_boardgame/` — five board games; three-checkbox line and required/extra descriptions.
- `topics/ex_라면/` — five instant noodles; single checkbox, star (★) ratings, Korean filenames and chosung search.

## License

[MIT](LICENSE)

## Author

**bluekms21** — [bluekms21@naver.com](mailto:bluekms21@naver.com) · [blog.naver.com/bluekms21](https://blog.naver.com/bluekms21)

This project was built by **vibe coding** with [Claude Code](https://claude.com/claude-code).
