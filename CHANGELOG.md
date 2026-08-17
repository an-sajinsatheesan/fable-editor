# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
