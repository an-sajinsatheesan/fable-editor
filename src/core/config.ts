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

/** 25 swatches — a 5×5 grid in the picker (pastels, brights, darks, grays,
 *  then pink/brown/cyan + black/white). Shared by fore/back color and cell fill. */
export const COLORS = [
  '#FFFFFF',
  '#F4F4F4',
  '#E8EAED',
  '#DADCE0',
  '#000000',

  '#F28B82',
  '#FBBC04',
  '#FFF475',
  '#CCFF90',
  '#A7FFEB',

  '#CBF0F8',
  '#AECBFA',
  '#D7AEFB',
  '#FDCFE8',
  '#E6C9A8',

  '#EA4335',
  '#FB8C00',
  '#FDD835',
  '#34A853',
  '#00ACC1',

  '#4285F4',
  '#5E35B1',
  '#8E24AA',
  '#C2185B',
  '#6D4C41'
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
    chars: [
      '€','£','¥','¢','$','₹','₽','₩','₺','₴','₦','฿','₫','₪','﷼','¤',
      '₡','₱','₲','₵','₭','₮','₸','₼','₾','₿'
    ]
  },
  {
    key: 'chcat_text',
    chars: [
      '§','¶','†','‡','•','…','′','″','‰','‱','–','—','―','¡','¿','·',
      '‹','›','«','»','“','”','‘','’','„','‚','¦','ª','º',
      '‽','※','❝','❞','❮','❯'
    ]
  },
  {
    key: 'chcat_math',
    chars: [
      '°','±','×','÷','≈','≠','≤','≥','∞','µ','√','∑','∫','∂','∆','∏',
      'π','Ω','α','β','γ','δ','ε','θ','λ','σ','φ','ψ','ω',
      '∈','∉','∪','∩','⊂','⊃','⊆','⊇','∀','∃','∅','∝','∴','∵','¬','∧','∨',
      '½','⅓','¼','¾','⅔','⅛','⅜','⅝','⅞',
      '¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹','⁰',
      '₁','₂','₃','₄','₅','₆','₇','₈','₉','₀'
    ]
  },
  {
    key: 'chcat_arrows',
    chars: [
      '←','→','↑','↓','↔','↕','⇐','⇒','⇑','⇓','⇔',
      '↖','↗','↘','↙','↩','↪','↺','↻',
      '⤴','⤵','➜','➝','➞','➟','⇦','⇨','⇧','⇩'
    ]
  },
  {
    key: 'chcat_symbols',
    chars: [
      '©','®','™','℠','№','℮',
      '✓','✔','✗','✘',
      '★','☆','✦','✪',
      '♠','♣','♥','♦',
      '♪','♫','♬',
      '☀','☁','☂','☃','☾',
      '☹','☺','☻',
      '✉','✂','✎','✏',
      '☎','☏','⌛','⌚',
      '☞','☜','☝','☟'
    ]
  },
  {
    key: 'chcat_latin',
    chars: [
      'À','Á','Â','Ã','Ä','Å','Æ','Ç','È','É','Ê','Ë','Ì','Í','Î','Ï',
      'Ð','Ñ','Ò','Ó','Ô','Õ','Ö','Ø','Ù','Ú','Û','Ü','Ý','Þ','ß',
      'à','á','â','ã','ä','å','æ','ç','è','é','ê','ë','ì','í','î','ï',
      'ð','ñ','ò','ó','ô','õ','ö','ø','ù','ú','û','ü','ý','þ','ÿ',
      'Œ','œ','Š','š','Ž','ž','Ł','ł'
    ]
  },
  {
    key: 'chcat_arabic',
    chars: [
      '؟','،','؛','٪','٭','ـ',
      '٠','١','٢','٣','٤','٥','٦','٧','٨','٩',
      '﴾','﴿','۞','؎',
      'ء','آ','أ','ؤ','إ','ئ','ى','ة'
    ]
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
