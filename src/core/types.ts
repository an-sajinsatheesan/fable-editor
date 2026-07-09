export type EditorLanguage = 'en' | 'ar';

export interface ToolbarGroupConfig {
  items: string[];
}

export interface MenuConfig {
  [key: string]: Array<string | { label: string; action: string; shortcut?: string }>;
}

export interface EditorInitOptions {
  target: HTMLElement;
  language?: EditorLanguage;
  height?: number;
  initialContent?: string;
  onChange?: (content: string) => void;
  onReady?: (editor: FableEditorApi) => void;
  /** `true`/omitted = default menu set (`file edit view insert format tools table help`).
   *  `false` = hidden. A string is a space-separated subset/reorder of those keys, e.g.
   *  `'file edit view insert format tools table help'`. Unknown tokens are ignored with a
   *  console warning; recognized tokens render in the order given, duplicates are dropped. */
  menubar?: boolean | string;
  /** `true`/omitted = the built-in default toolbar. `false` = hidden. A string lays out
   *  the toolbar: `|` separates visual groups, spaces separate items within a group, e.g.
   *  `'undo redo | bold italic'`. Unknown tokens are ignored with a console warning. */
  toolbar?: boolean | string;
  statusbar?: boolean;
  readonly?: boolean;
  /** Storage key suffix for the autosaved draft; defaults to the page path. */
  draftKey?: string;
  /** Overrides the font-family list shown in the toolbar's font dropdown. Array of
   *  `[displayName, cssFontFamilyValue]` tuples. Defaults to a built-in list. */
  fontFamilyFormats?: [string, string][];
  /** Custom CSS for the editable content area. Because FableEditor's editable region is a
   *  plain `contenteditable` div (not an iframe), this is NOT arbitrary global CSS: the
   *  literal word `body` in your CSS is rewritten to a selector scoped to this editor
   *  instance's content div, and every other selector is used verbatim (your
   *  responsibility to scope). Intended for the common pattern of
   *  `body { font-family: ...; font-size: ... }` plus `@import` font declarations. */
  contentStyle?: string;
  /** MIME types accepted by the native image file picker (the `accept` attribute).
   *  Defaults to `['image/jpeg','image/jpg','image/png','image/gif','image/bmp','image/webp']`. */
  imageFileTypes?: string[];
  /** Called when a user picks or drops an image. Resolve with the URL to
   *  insert (e.g. after uploading to S3/Azure Blob/your own server). If
   *  omitted, images are inlined as base64 data URIs instead. The host resolves a URL
   *  and the engine owns all placeholder/progress/insert UI, so there's no separate
   *  "picker" concept to configure. */
  imageUploadHandler?: (file: File) => Promise<string>;
  /** Called when imageUploadHandler rejects, so the host app can surface it. */
  onImageUploadError?: (error: unknown, file: File) => void;
  /** MIME types accepted by the native video file picker (the `accept` attribute).
   *  Defaults to `['video/mp4','video/webm','video/ogg']`. */
  videoFileTypes?: string[];
  /** Called when a user picks or drops a video. Resolve with the URL to
   *  insert (e.g. after uploading to S3/Azure Blob/your own server). If
   *  omitted, videos are inlined as base64 data URIs instead. Mirrors
   *  `imageUploadHandler` — the engine owns all placeholder/progress/insert UI. */
  videoUploadHandler?: (file: File) => Promise<string>;
  /** Called when videoUploadHandler rejects, so the host app can surface it. */
  onVideoUploadError?: (error: unknown, file: File) => void;
}

export interface FableEditorApi {
  getContent(): string;
  setContent(html: string): void;
  insertContent(html: string): void;
  setLanguage(lang: EditorLanguage): void;
  focus(): void;
  destroy(): void;
  importWordFile(file: File): Promise<void>;
  restoreDraft(): boolean;
  getRevisions(): Array<{ time: number; html: string }>;
}

export interface DialogButton {
  label: string;
  primary?: boolean;
  action: () => void;
}

export interface MenuItemDef {
  label: string;
  icon?: string;
  action?: () => void;
  shortcut?: string;
  previewStyle?: string;
  on?: boolean;
  /** Hover flyout submenu items. */
  sub?: Array<MenuItemDef | '|'>;
  /** Hover flyout with custom content (e.g. the table size grid). */
  subBuild?: (el: HTMLElement) => void;
  /** Called with true/false as the pointer enters/leaves the item (e.g. to highlight the table row/column an operation will target). */
  hover?: (on: boolean) => void;
}

export type TableOperation =
  | 'rowabove'
  | 'rowbelow'
  | 'delrow'
  | 'colbefore'
  | 'colafter'
  | 'delcol'
  | 'deltable';
