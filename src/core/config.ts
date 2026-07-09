/** Transcribed group-by-group from the editor's built-in toolbar layout so that
 *  `toolbar: true` (the default) renders identically to the hard-coded original. */
export const DEFAULT_TOOLBAR =
  'undo redo | preview print | importword revhistory | fontfamily fontsize | fontsizeincrease fontsizedecrease | ' +
  'bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
  'bullist numlist | outdent indent | link blockquote code changecase lineheight wordspacing letterspacing | removeformat | blocks | ' +
  'ltr rtl | quickimage quickvideo quicktable codesample template charmap emoji | fullscreen sourcecode';

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

export const LETTER_SPACINGS = ['0.5px', '1px', '1.5px', '2px', '3px', '4px'];

/** Languages offered by the code-sample dialog: [value stored in data-lang, label]. */
export const CODE_LANGS: [string, string][] = [
  ['plain', 'Plain text'],
  ['html', 'HTML/XML'],
  ['css', 'CSS'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['json', 'JSON'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['csharp', 'C#'],
  ['cpp', 'C/C++'],
  ['php', 'PHP'],
  ['ruby', 'Ruby'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['sql', 'SQL'],
  ['bash', 'Bash/Shell']
];

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

/** Category key = i18n string key for the tab label in the picker dialogs. */
export interface GlyphCategory {
  key: string;
  chars: string[];
}

/** Special-character map, grouped for the two-pane picker (tabs left, glyphs right).
 *  `CHARS` below is the legacy flat list and is kept exported for back-compat. */
export const CHAR_CATEGORIES: GlyphCategory[] = [
  {
    key: 'chcat_currency',
    chars: ['€', '£', '¥', '¢', '$', '₹', '₽', '₩', '₺', '₴', '₦', '฿', '₫', '₪', '﷼', '¤']
  },
  {
    key: 'chcat_text',
    chars: [
      '§', '¶', '†', '‡', '•', '…', '′', '″', '‰', '–', '—', '¡', '¿', '·',
      '‹', '›', '«', '»', '“', '”', '‘', '’', '„', '‚', '¦', 'ª', 'º'
    ]
  },
  {
    key: 'chcat_math',
    chars: [
      '°', '±', '×', '÷', '≈', '≠', '≤', '≥', '∞', 'µ', '√', '∑', '∫', '∂', '∆', '∏',
      'π', 'Ω', 'α', 'β', 'γ', 'θ', 'λ', 'σ', 'φ', 'ω', '∈', '∉', '∪', '∩', '⊂', '⊃',
      '∀', '∃', '∅', '∝', '∴', '¬', '½', '⅓', '¼', '¾', '⅔', '⅛', '⅜', '⅝', '⅞', '¹', '²', '³'
    ]
  },
  {
    key: 'chcat_arrows',
    chars: ['←', '→', '↑', '↓', '↔', '↕', '⇐', '⇒', '⇑', '⇓', '⇔', '↖', '↗', '↘', '↙', '↩', '↪', '⤴', '⤵']
  },
  {
    key: 'chcat_symbols',
    chars: [
      '©', '®', '™', '℠', '№', '℮', '✓', '✗', '★', '☆', '✦', '♠', '♣', '♥', '♦',
      '♪', '♫', '☀', '☁', '☂', '☾', '☹', '☺', '✉', '✂', '✎', '☞', '☜'
    ]
  },
  {
    key: 'chcat_latin',
    chars: [
      'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï',
      'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', 'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'ß',
      'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï',
      'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'ÿ'
    ]
  },
  {
    key: 'chcat_arabic',
    chars: ['؟', '،', '؛', '٪', '٭', 'ـ', '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '﴾', '﴿', '۞', '؎']
  }
];

/** Emoji map for the emoji picker — same two-pane dialog as the character map. */
export const EMOJI_CATEGORIES: GlyphCategory[] = [
  {
    key: 'emcat_smileys',
    chars: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
      '😘', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '😟', '😕',
      '🙁', '😣', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '🥵', '🥶', '😱', '😨',
      '😥', '🤗', '🤔', '🤭', '🤫', '😐', '😑', '😬', '🙄', '😯', '😴', '😪', '😷', '🤒', '🤕', '🤢',
      '🤧', '😈', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '🙀'
    ]
  },
  {
    key: 'emcat_people',
    chars: [
      '👋', '🤚', '✋', '🖖', '👌', '🤏', '✌', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝',
      '👍', '👎', '✊', '👊', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '✍', '💅', '🤳', '👂', '👃',
      '👀', '👁', '🧠', '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴', '👵', '👮', '👷', '💂',
      '🕵', '👸', '🤴', '👰', '🤵', '🤰', '👼', '🎅', '🦸', '🦹', '🧙', '🧚', '🧛', '🧟', '💃', '🕺',
      '🚶', '🏃', '🧘'
    ]
  },
  {
    key: 'emcat_animals',
    chars: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐢',
      '🐍', '🦎', '🦖', '🐙', '🦑', '🦀', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊', '🐅', '🦓', '🦍', '🐘',
      '🦏', '🐪', '🦒', '🦘', '🐄', '🐎', '🐖', '🐑', '🐐', '🦌', '🐕', '🐈', '🐓', '🦃', '🦚', '🦜',
      '🦢', '🕊', '🐇', '🦔', '🌵', '🌲', '🌴', '🌱', '🌿', '☘', '🍀', '🍁', '🌸', '🌺', '🌻', '🌹',
      '🌷', '💐'
    ]
  },
  {
    key: 'emcat_food',
    chars: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
      '🍅', '🍆', '🥑', '🥦', '🥒', '🌶', '🌽', '🥕', '🥔', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
      '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲',
      '🍛', '🍣', '🍱', '🥟', '🍤', '🍚', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬',
      '🍫', '🍿', '🍩', '🍪', '🥜', '🍯', '🥛', '☕', '🍵', '🥤', '🍺', '🥂', '🍷', '🍸', '🍹'
    ]
  },
  {
    key: 'emcat_travel',
    chars: [
      '🚗', '🚕', '🚙', '🚌', '🏎', '🚓', '🚑', '🚒', '🚚', '🚜', '🛵', '🏍', '🚲', '🛴', '🚔', '🚃',
      '🚄', '🚅', '🚂', '🚆', '🚇', '🚉', '✈', '🛫', '🛬', '💺', '🚁', '🚀', '🛸', '🚢', '⛵', '🚤',
      '⚓', '⛽', '🚧', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🎡', '🎢', '🎠', '⛲', '🏖', '🏝', '🌋',
      '⛰', '🏔', '🗻', '🏕', '⛺', '🏠', '🏡', '🏢', '🏬', '🏥', '🏦', '🏨', '🏪', '🏫', '💒', '⛪',
      '🕌', '🕍', '🕋', '⛩', '🌅', '🌄', '🌇', '🌆', '🌃', '🌉', '🌌', '🌠'
    ]
  },
  {
    key: 'emcat_activities',
    chars: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣',
      '🥊', '🥋', '⛸', '🎿', '⛷', '🏂', '🏋', '🤸', '⛹', '🤺', '🏇', '🧗', '🏄', '🏊', '🚣', '🚵',
      '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🎫', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼',
      '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '🎯', '🎳', '🎮', '🎰', '🧩'
    ]
  },
  {
    key: 'emcat_objects',
    chars: [
      '⌚', '📱', '💻', '⌨', '🖥', '🖨', '🖱', '🕹', '💽', '💾', '💿', '📀', '📷', '📸', '📹', '🎥',
      '📞', '☎', '📺', '📻', '🎙', '⏱', '⏰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '💸',
      '💵', '💰', '💳', '💎', '⚖', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙', '🧲', '🔫', '💣', '🔪',
      '🛡', '🔮', '🧿', '🔭', '🔬', '💊', '💉', '🌡', '🧬', '🧪', '🧹', '🧺', '🛁', '🔑', '🗝', '🚪',
      '🛋', '🛏', '🧸', '🖼', '🛍', '🛒', '🎁', '🎈', '🎀', '🎊', '🎉', '✉', '📩', '📦', '📜', '📄',
      '📊', '📈', '📉', '📅', '📋', '📁', '📰', '📓', '📚', '📖', '🔖', '🔗', '📎', '📐', '📏', '📌',
      '📍', '✂', '🖊', '✒', '🖌', '🖍', '📝', '✏', '🔍', '🔒', '🔓'
    ]
  },
  {
    key: 'emcat_symbols',
    chars: [
      '❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '☮', '✝', '☪', '🕉', '☸', '✡', '☯', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '⚛', '❌', '⭕', '🛑', '⛔', '🚫', '💯', '💢', '⚠', '🚸', '🔱', '⚜', '🔰',
      '♻', '✅', '❇', '✳', '❎', '🌐', '💠', '🌀', '💤', '🏧', '♿', '🚭', '❗', '❕', '❓', '❔',
      '‼', '⁉', '💲', '🔅', '🔆', '〽', 'ℹ', '🆗', '🆕', '🆓', '🆒', '🆙', '🈯', '🈚'
    ]
  },
  {
    key: 'emcat_flags',
    chars: [
      '🏁', '🚩', '🎌', '🏴', '🏳', '🇦🇪', '🇸🇦', '🇶🇦', '🇰🇼', '🇧🇭', '🇴🇲', '🇪🇬', '🇯🇴', '🇱🇧', '🇮🇳', '🇵🇰',
      '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇵🇹', '🇳🇱', '🇧🇪', '🇨🇭', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮',
      '🇮🇪', '🇬🇷', '🇹🇷', '🇷🇺', '🇺🇦', '🇵🇱', '🇯🇵', '🇰🇷', '🇨🇳', '🇸🇬', '🇲🇾', '🇮🇩', '🇹🇭', '🇵🇭', '🇻🇳', '🇧🇷',
      '🇦🇷', '🇲🇽', '🇿🇦', '🇳🇬', '🇰🇪', '🇲🇦'
    ]
  }
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
