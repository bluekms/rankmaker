# Attaching pictures by URL (advanced)

> [한국어](image-url.md) | [English](image-url.en.md) · [← README](../README.en.md)

Normally you drop the image file into `topics/images/` and you're done. **This page is for when that isn't practical.**

- Hundreds of items, and keeping every picture on disk makes the folder too heavy
- The picture already lives on the web and you want to use it as-is

## How to write it

Put the image URL on a description line. The `thumbnail-url:` label in front is there for whoever reads the file — drop it or write something else and it still works. The app goes by **the URL alone**.

```markdown
# orleans.jpg
- ⭐ bgg rating: 8.05
+ thumbnail-url: https://example.com/images/orleans.jpg
```

- **A file with the same name wins.** The URL is used only when no file exists.
- **One URL per item** is enough. If you write several, the first one is used.

### Splitting screen picture from poster picture

A line labelled `podium-url:` is taken as **the full-size original for the poster (Podium)**. What shows on screen is still the thumbnail.

```markdown
# orleans.jpg
+ thumbnail-url: https://example.com/images/orleans-500.jpg   ← screen (small, fast)
+ podium-url: https://example.com/images/orleans-original.jpg ← poster (original)
```

In a topic with hundreds of items this difference *is* the first-load time: with only the original, a 72-pixel tile still pulls down a few hundred KB.

- **`podium-url:` is optional.** Without it the thumbnail is used for the poster as well.
- The reverse works too — write only `podium-url:` and it also shows on screen.
- This one label must be written **literally** (`podium-url:` or `podium-url=`). Every other URL line counts as the thumbnail.
- It is recognised as a picture when the extension is `jpg` `png` `webp` `gif` `avif`, or the host is a known thumbnail host.
- A recognised URL line **disappears from the description** — it is being used as the picture, so there is no reason to print it as text too.

## It shows on screen but won't go into the poster

A URL-attached picture displays fine in the ranking. But exporting with **Podium** brings up a dialog.

```
The poster needs these images as files
Download each one into topics/images/ under the same filename, then save again.
```

This is a browser security rule. The poster is drawn on a canvas and exported as PNG, and drawing another site's image onto a canvas marks it **tainted**, which blocks the export. The rule exists so pages can't quietly read the pixels of images they don't own, and there is no way around it.

If the image's server allows use via the `Access-Control-Allow-Origin` header, the problem doesn't arise — but few servers do.

### What the dialog offers

| | |
|---|---|
| **Paste** | Right-click the picture, **Copy image**, then press this. The app saves it into `topics/images/` **under the item's own filename** — no navigating to the folder, no getting the name right. Repeat for each one; filling the last closes the dialog and saves the poster |
| **Open image ↗** | Opens the picture in a new tab, for when you'd rather download it yourself. With `podium-url:` set it opens **that original**, not the on-screen thumbnail |
| **Save with name cards** | Goes ahead anyway. That slot becomes a card with just the name on it |

Once a picture is on disk it is an ordinary local file and you are never asked again. The folder is shared, so **every other topic gets it too**.

### Sometimes it downloads itself

If the image server allows use (`Access-Control-Allow-Origin: *`), the app **fetches and saves it for you** when the topic opens. `Saved ✓ · 1 image(s)` means that happened, and no dialog appears at all. It is fetching for the poster, so with `podium-url:` set **that original** is what gets saved.

Pictures the app fetched are re-fetched when you point the URL in `info.md` at something else. **Files you put there yourself are left alone** — a file always wins, and using it is always the fastest path.

## In short

| What you're doing | What to use |
|---|---|
| Ranking things and **exporting posters** | Image files in `topics/images/` |
| Building a **catalogue of hundreds** | URLs |
| A bit of both | Mix freely. Items with a file use the file; items without use the URL |
