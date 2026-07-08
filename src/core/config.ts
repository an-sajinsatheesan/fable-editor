/** Transcribed group-by-group from the editor's built-in toolbar layout so that
 *  `toolbar: true` (the default) renders identically to the hard-coded original. */
export const DEFAULT_TOOLBAR =
  'undo redo | preview print | importword revhistory | fontfamily fontsize | fontsizeincrease fontsizedecrease | ' +
  'bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
  'bullist numlist | outdent indent | link blockquote changecase lineheight wordspacing | removeformat | blocks | ' +
  'ltr rtl | quickimage quicktable template charmap | fullscreen sourcecode';

/** Transcribed from the editor's built-in menu keys so that `menubar: true` (the
 *  default) renders identically to the hard-coded original. */
export const DEFAULT_MENUBAR = 'file edit view insert format tools table help';

export const FONTS: [string, string][] = [
  ['Andale Mono', 'andale mono,times'],
  ['Arial', 'arial,helvetica,sans-serif'],
  ['Arial Black', 'arial black,avant garde'],
  ['Book Antiqua', 'book antiqua,palatino'],
  ['Comic Sans MS', 'comic sans ms,sans-serif'],
  ['Courier New', 'courier new,courier'],
  ['Georgia', 'georgia,palatino'],
  ['Helvetica', 'helvetica'],
  ['Impact', 'impact,chicago'],
  ['Oswald', 'oswald'],
  ['Sakkal Majalla', 'sakkal majalla'],
  ['Symbol', 'symbol'],
  ['Tahoma', 'tahoma,arial,helvetica,sans-serif'],
  ['Terminal', 'terminal,monaco'],
  ['Times New Roman', 'times new roman,times'],
  ['Trebuchet MS', 'trebuchet ms,geneva'],
  ['Verdana', 'verdana,geneva'],
  ['Webdings', 'webdings'],
  ['Wingdings', 'wingdings,zapf dingbats']
];

export const SIZES = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '72px', '96px'];

export const MIN_FONT_PX = 1;
export const MAX_FONT_PX = 100;

export const LINE_HEIGHTS = ['1', '1.15', '1.4', '1.5', '1.75', '2', '2.5', '3'];

export const WORD_SPACINGS = ['1px', '2px', '4px', '6px', '8px', '12px'];

export const BLOCKS: [string, string][] = [
  ['p', 'para'],
  ['h1', 'heading1'],
  ['h2', 'heading2'],
  ['h3', 'heading3'],
  ['h4', 'heading4'],
  ['h5', 'heading5'],
  ['h6', 'heading6'],
  ['pre', 'pre']
];

/** Quick-access text color chips shown directly in the toolbar. */
export const QUICK_COLORS = ['#F76707', '#4263EB', '#CC5DE8'];

export const COLORS = [
  '#BFEDD2',
  '#FBEEB8',
  '#F8CAC6',
  '#ECCAFA',
  '#C2E0F4',
  '#2DC26B',
  '#F1C40F',
  '#E03E2D',
  '#B96AD9',
  '#3598DB',
  '#169179',
  '#E67E23',
  '#BA372A',
  '#843FA1',
  '#236FA1',
  '#ECF0F1',
  '#CED4D9',
  '#95A5A6',
  '#7E8C8D',
  '#34495E',
  '#000000',
  '#FFFFFF'
];

export const CHARS = [
  '©',
  '®',
  '™',
  '§',
  '¶',
  '†',
  '‡',
  '•',
  '…',
  '′',
  '″',
  '‰',
  '°',
  '±',
  '×',
  '÷',
  '≈',
  '≠',
  '≤',
  '≥',
  '∞',
  'µ',
  '√',
  '∑',
  '€',
  '£',
  '¥',
  '¢',
  '←',
  '→',
  '↑',
  '↓',
  '«',
  '»',
  '“',
  '”',
  '‘',
  '’',
  '–',
  '—',
  '؟',
  '،',
  '؛',
  '٪',
  '٭',
  'ـ',
  '٠',
  '١'
];
