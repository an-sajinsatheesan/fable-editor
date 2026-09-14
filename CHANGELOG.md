# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.3.2]

### Fixed

- **A cropped picture pasted from Word disappeared entirely.** Cropping makes
  Word turn on `RelyOnVML`, and it then describes the picture only as a VML
  `<v:shape>` around a `<v:imagedata src="file:///.../clip_image001.png">` -
  either inside a downlevel-hidden `<!--[if gte vml 1]>` comment or as live
  markup - omitting the plain `<img>` fallback it normally writes alongside.
  The paste engine drops conditional comments and does not understand VML, so
  the picture recovered from the RTF flavor (added in 1.3.0) had no `<img>` tag
  left to land on and the paste lost it silently. `unwrapVmlImages()` now gives
  such a shape the `<img>` Word withheld, carrying over the shape's `style`
  width and height (converted from `pt` to `px`) so the picture keeps the size
  it had in the document. A shape whose `src` already matches an `<img>` in the
  same paste is left alone, so a picture that does have its fallback is not
  duplicated. The shape's `croptop`/`cropbottom` attributes are not applied:
  the picture comes in uncropped.

- **Every picture recovered from the RTF flavor could lose its leading bytes.**
  `decodePict()` stripped nested property groups and control words by deleting
  them outright, which glued whatever surrounded them together. Word ends a
  picture header with `\bliptagN{\*\blipuid ...}` hard against the hex payload,
  so removing the uid group let the `\bliptag` parameter's `\d*` run straight
  on into the hex and eat its first digits (`89504e47...` became `e470...`),
  corrupting the picture with no error at all. Both removals now leave a space
  behind.

## [1.3.1]

### Fixed

- **A pasted Word table lost the border on its first cell once the document was
  sent as an email.** Word describes a cell's borders as three parallel
  longhands - `border-color` / `border-style` / `border-width`, one value per
  side - and a browser re-copy of Word content keeps that split. Mail pipelines
  allowlist inline CSS one property at a time, and the one in front of this
  content kept `border-color` and `border-width` while dropping `border-style`;
  since the initial `border-style` is `none`, a width and a colour on their own
  drew nothing at all. Only the first cell of each row looked wrong, because
  Word writes `border-<side>: none` for the edges a cell shares with its
  neighbour, so every other cell still had a `border-style` list to keep.
  `getContentForEmail()` now re-emits each side as a single
  `border-<side>: <width> <style> <colour>` (collapsed to one `border:` when all
  four agree), so a side survives or disappears as a unit no matter which
  longhand a sanitizer drops. A side left carrying a width or colour but no
  style is read back as `solid`, which repairs content that was already
  flattened before it came back into the editor; `windowtext`, the deprecated
  system colour Word still emits, becomes plain black; and `border-collapse` is
  pinned inline with a matching `cellspacing="0"` so a table cannot fall back to
  spaced-out cells either. Borders are untouched in `getContent()` and the paste
  engine is unchanged.

## [1.3.0]

### Fixed

- **Images were lost when pasting from a Word document opened off the local
  disk.** Desktop Word writes `<img src="file:///…/msohtmlclip1/01/
  clip_image001.png">` into the HTML clipboard flavor - a local temp file the
  browser cannot read - so the paste engine replaced it with the "[local image
  - paste it separately]" placeholder. The same paste also carries a `text/rtf`
  flavor with every picture embedded as hex in a `{\pict}` group; those are now
  decoded and paired with the images in the HTML before the paste engine runs,
  which is how TinyMCE PowerPaste implements `powerpaste_allow_local_images`.
  Pictures become inline base64 by default, or go through `imageUploadHandler`
  when one is configured. Pastes from webmail are unaffected, and anything that
  still cannot be recovered (a true vector metafile) keeps the placeholder.
  The paste engine itself is unchanged.

- **An image came out at a different size in Preview and in a sent email than
  it had in the editor.** Inserted images carried no dimensions at all - they
  only looked right inside the editor because of its `.earea img
  { max-width:100% }` rule, which does not exist in the preview dialog (it
  mounts outside the editor) or in a mail client. Inserted images now get an
  explicit width, and `getContentForEmail()` makes the on-screen size explicit
  on every image. Resizing an image by its corner handle now also writes the
  `width` attribute, which is what Outlook desktop follows. Images in template
  media slots stay fluid as before.

- **Documents saved before the editor recorded image sizes are corrected when
  they load.** Content arriving through `setContent()` or `initialContent` has
  any size-less image measured and stamped once it decodes, so an existing
  document renders the same in the editor, in Preview and in a sent mail without
  the host having to migrate stored HTML. Images that already carry a size, and
  template slots, are left untouched; a single change event is emitted once the
  images settle, and none at all when nothing needed stamping.

### Changed

- **Preview now renders at the editor's own content width** instead of a fixed
  640px box, so an image is the same size in Preview as in the editor and in
  the sent mail rather than being silently scaled down. The preview dialog is
  allowed to grow wider than a standard dialog to make that width reachable; on
  a viewport too small for it, content scales down instead of being clipped.

## [1.2.8]

### Fixed

- **Long menus (e.g. Format) could render off the bottom of the viewport.**
  `.pop` already had `max-height:70vh; overflow:auto`, but only its horizontal
  position was clamped to the viewport - a menu opened near the bottom of a
  short window rendered mostly below the visible screen. Added the same
  vertical clamp the submenu flyout already used.

- **A flyout nested inside another flyout (e.g. Table > Cell > Cell
  background) opened at the top-left corner of the screen.** `openSubFor()`
  removed the currently-open flyout *before* measuring its anchor's position -
  for a 2-level-deep flyout, the anchor is itself a descendant of the flyout
  being removed, so by the time it measured, the anchor was detached and gave
  an all-zero rect. Fixed by capturing the position first.

- **That same nested flyout then left a visual gap behind it.** Fixing the
  position above surfaced that only one flyout could be tracked/open at a
  time - opening "Cell background" closed the "Cell" flyout that visually
  bridged it back to the top-level "Table" menu. Replaced the single tracked
  flyout with a proper stack that only closes flyouts *deeper* than whatever
  is being hovered, so every ancestor level stays open and connected.

- **Undo/redo toolbar icons pointed at each other instead of outward in the
  RTL editor.** RTL naturally reverses the toolbar's flex order (redo ends up
  left of undo), but the icon glyphs stayed fixed, so each arrow ended up
  pointing toward the center. Added `data-id` hooks to both buttons and an
  `[dir=rtl] ... svg { transform: scaleX(-1) }` rule.

- **Scrolling a long open dropdown closed it instead of scrolling its
  content.** A regression from 1.2.7's "close dropdown on page scroll" fix -
  that scroll listener fires for any scroll in the document (capture:true is
  what lets it catch a scrollable ancestor), including the popup's own
  `overflow:auto` scrolling. Now only closes for a scroll that happened
  outside the open menu/flyouts.

- **Hardened the Help dialog's keyboard-shortcut badges (`<kbd>`) against
  low-contrast host-app CSS collisions.** The rule was a bare, unscoped `kbd`
  tag selector with no explicit `color` (just inherited from an ancestor) -
  unlike everything else in this stylesheet. A host page with its own global
  `kbd` styling could out-specificity it and override just one of
  background/color. Scoped to `.dlg kbd` with its own explicit color.

- Verified `removeFormat` ("Clear formatting") works correctly - no change
  needed there.

## [1.2.7]

### Fixed

- **Open toolbar/menubar dropdowns stayed anchored to their open-time screen
  position while the page scrolled**, visually detaching from the button that
  opened them. Every other floating element (table handles, image handles,
  context toolbars) already repositions on scroll via a shared window-level
  scroll listener; the menu popup was the one thing left out of it. It's now
  closed on scroll, same as the rest.

- **The RTL submenu arrow (the `›`/`‹` indicator on menu items with a
  submenu, e.g. Templates) never flipped direction in the Arabic editor.**
  The popup element gets `dir="rtl"` set directly on itself, but the CSS rule
  read `[dir=rtl] .pop .mi .subarrow svg`, which only matches when `.pop` is
  a *descendant* of a `dir="rtl"` element - never true here, since `.pop` is
  the element carrying the attribute. Changed to `.pop[dir=rtl] .mi .subarrow svg`.

## [1.2.6]

### Fixed

- **`getContentForEmail()` direction detection now falls back to scanning the
  content itself, not just the editor's configured UI language.**

  Previously, when no element in the pasted/typed content carried an
  explicit `dir="rtl"`/`dir="ltr"` attribute (common with plain-text paste,
  or clipboard sources that don't tag direction at all), `getContentForEmail()`
  fell back straight to the editor's configured UI language
  (`this.ed.getAttribute('dir')` / the `language` init option) to decide the
  output direction. Concretely: pasting Arabic text with no `dir` markup into
  an editor configured with `language: 'en'` produced `dir="ltr"` output with
  no `text-align` stamped on any paragraph — reproducing, one layer inward,
  the exact silent-LTR-override bug this method exists to prevent.

  Blocks (`p`, `div`, `li`, `td`, `th`, `blockquote`, `h1`–`h6`, `pre`,
  `figcaption`) that have no reliable explicit `dir` (missing, or `dir="auto"`
  from `normalizeTextPaste`) now get their direction from a first-strong-
  character scan of their own text — the same idea as HTML5's `dir="auto"`
  resolution — before ever consulting the editor's configured language. That
  language is now used only as the last resort, when a block has neither an
  explicit `dir` nor any strongly-directional character at all (empty, or
  purely numeric/neutral content).

  Content that already carries explicit `dir` attributes (Word/Outlook paste,
  or the toolbar's own ltr/rtl buttons) is unaffected — that remains the
  highest-priority signal, exactly as before.

  `getContent()` is unchanged.

## [1.2.5]

### Added

- **`getContentForEmail()`** — returns the same HTML as `getContent()`, wrapped
  so its RTL/LTR direction survives being dropped into a fixed-alignment host
  (e.g. an email template's `<td align="left">`), which otherwise forces left
  alignment onto any descendant that has no `text-align` of its own, even one
  with its own `dir="rtl"`. Exposed on the core editor and the React/Angular
  wrappers alongside the existing `getContent()`.
