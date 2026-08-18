# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
