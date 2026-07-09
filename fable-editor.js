/* =====================================================================
   FableEditor — rich text editor (menubar + toolbar + statusbar + RTL)
   with PowerPaste-style clean paste.
   Framework-free — to port into React, mount once inside useEffect
   and read content via getContent() in your onEditorChange handler.
   ===================================================================== */
(function(){
"use strict";

/* ---------------------------------------------------------- i18n */
const I18N = {
en:{ dir:'ltr',
  file:'File',edit:'Edit',view:'View',insert:'Insert',format:'Format',
  tools:'Tools',table:'Table',help:'Help',
  newdoc:'New document',preview:'Preview',print:'Print…',
  undo:'Undo',redo:'Redo',cut:'Cut',copy:'Copy',paste:'Paste',selectall:'Select all',
  fullscreen:'Fullscreen',sourcecode:'Source code',wordcount:'Word count',
  image:'Image…',inserttable:'Table',hr:'Horizontal line',charmap:'Special character…',
  datetime:'Date/time',pagebreak:'Page break',nbsp:'Nonbreaking space',
  bold:'Bold',italic:'Italic',underline:'Underline',strikethrough:'Strikethrough',
  superscript:'Superscript',subscript:'Subscript',clearformat:'Clear formatting',
  rowabove:'Insert row before',rowbelow:'Insert row after',delrow:'Delete row',
  colbefore:'Insert column before',colafter:'Insert column after',delcol:'Delete column',
  deltable:'Delete table',
  ltr:'Left to right',rtl:'Right to left',
  alignleft:'Align left',aligncenter:'Align center',alignright:'Align right',
  alignjustify:'Justify',numlist:'Numbered list',bullist:'Bullet list',
  forecolor:'Text color',backcolor:'Background color',removeformat:'Clear formatting',
  outdent:'Decrease indent',indent:'Increase indent',
  fontfamily:'Font family',fontsize:'Font size',blocks:'Blocks',
  quickimage:'Insert image',quicktable:'Insert table',more:'More…',
  para:'Paragraph',heading:'Heading',pre:'Preformatted',
  removecolor:'Remove color',
  statushelp:'Press Alt+0 for help',words:'words',
  helpttl:'Help',shortcuts:'Handy shortcuts',close:'Close',save:'Save',cancel:'Cancel',
  srcttl:'Source code',wcttl:'Word count',wcwords:'Words',wcchars:'Characters',
  pastehint:'Use Ctrl+V / ⌘V to paste',
  liststyles_ol:['Default','Lower alpha','Lower roman','Upper alpha','Upper roman'],
  liststyles_ul:['Default','Circle','Square'],
  previewttl:'Preview',
  tablepropsttl:'Table properties',tblwidth:'Width',tblcellspacing:'Cell spacing',
  tblcellpadding:'Cell padding',tblborder:'Border width',tblalign:'Alignment',
  alignnone:'None',
  uploadimg:'Upload from computer',imagelink:'Insert from URL',
  imageurlph:'Paste image URL…',insertimg:'Insert',dropimage:'Drop image here',
  uploading:'Uploading…',uploadfailed:'Upload failed — click to retry',deleteimg:'Delete image',
  template:'Templates',tplimgleft:'Image left, text right',tplimgright:'Image right, text left',
  tplimgtop:'Image top, text below',tplimgcenter:'Text top, image center',deltemplate:'Delete template',
  video:'Video',quickvideo:'Insert video',deletevideo:'Delete video',
  uploadvideo:'Upload from computer',videolink:'Insert from URL',
  videourlph:'Paste video URL…',insertvideo:'Insert',dropvideo:'Drop video here',
  mathformula:'Insert math formula',mathdlgttl:'Insert Math Formula',
  mathderivation:'Multi-line derivation',editmath:'Edit formula',deletemath:'Delete formula',
  videodlgttl:'Insert/edit video',vidgeneral:'General',vidembed:'Embed',vidadvanced:'Advanced',
  vidsource:'Source',vidembedhint:'Paste your embed code below:',
  vidaltsource:'Alternative source URL',vidposter:'Media poster (Image URL)',
  emoji:'Emojis…',
  chcat_currency:'Currency',chcat_text:'Text & punctuation',chcat_math:'Mathematical',
  chcat_arrows:'Arrows',chcat_symbols:'Symbols',chcat_latin:'Extended Latin',chcat_arabic:'Arabic',
  emcat_smileys:'Smileys & emotion',emcat_people:'People & body',emcat_animals:'Animals & nature',
  emcat_food:'Food & drink',emcat_travel:'Travel & places',emcat_activities:'Activities',
  emcat_objects:'Objects',emcat_symbols:'Symbols',emcat_flags:'Flags'
},
ar:{ dir:'rtl',
  file:'ملف',edit:'تحرير',view:'عرض',insert:'إدراج',format:'التنسيق',
  tools:'الأدوات',table:'جدول',help:'تعليمات',
  newdoc:'مستند جديد',preview:'معاينة',print:'طباعة…',
  undo:'تراجع',redo:'إعادة',cut:'قص',copy:'نسخ',paste:'لصق',selectall:'تحديد الكل',
  fullscreen:'ملء الشاشة',sourcecode:'الكود المصدري',wordcount:'عدد الكلمات',
  image:'صورة…',inserttable:'جدول',hr:'خط أفقي',charmap:'رمز خاص…',
  datetime:'التاريخ/الوقت',pagebreak:'فاصل الصفحة',nbsp:'مسافة غير فاصلة',
  bold:'غامق',italic:'مائل',underline:'تسطير',strikethrough:'يتوسطه خط',
  superscript:'نص مرتفع',subscript:'نص منخفض',clearformat:'مسح التنسيق',
  rowabove:'إدراج صف قبل',rowbelow:'إدراج صف بعد',delrow:'حذف الصف',
  colbefore:'إدراج عمود قبل',colafter:'إدراج عمود بعد',delcol:'حذف العمود',
  deltable:'حذف الجدول',
  ltr:'من اليسار إلى اليمين',rtl:'من اليمين إلى اليسار',
  alignleft:'محاذاة لليسار',aligncenter:'توسيط',alignright:'محاذاة لليمين',
  alignjustify:'ضبط',numlist:'قائمة رقمية',bullist:'قائمة نقطية',
  forecolor:'لون النص',backcolor:'لون الخلفية',removeformat:'مسح التنسيق',
  outdent:'إنقاص المسافة البادئة',indent:'زيادة المسافة البادئة',
  fontfamily:'عائلة الخط',fontsize:'حجم الخط',blocks:'الفقرات',
  quickimage:'إدراج صورة',quicktable:'إدراج جدول',more:'المزيد…',
  para:'الفقرة',heading:'العنوان',pre:'منسق مسبقاً',
  removecolor:'إزالة اللون',
  statushelp:'اضغط على Alt+0 للحصول على مساعدة',words:'الكلمات',
  helpttl:'تعليمات',shortcuts:'اختصارات مفيدة',close:'إغلاق',save:'حفظ',cancel:'إلغاء',
  srcttl:'الكود المصدري',wcttl:'عدد الكلمات',wcwords:'الكلمات',wcchars:'الأحرف',
  pastehint:'استخدم Ctrl+V / ⌘V للصق',
  liststyles_ol:['افتراضي','أبجدي صغير','روماني صغير','أبجدي كبير','روماني كبير'],
  liststyles_ul:['افتراضي','دائرة','مربع'],
  previewttl:'معاينة',
  tablepropsttl:'خصائص الجدول',tblwidth:'العرض',tblcellspacing:'تباعد الخلايا',
  tblcellpadding:'حشو الخلايا',tblborder:'عرض الحدود',tblalign:'المحاذاة',
  alignnone:'بدون',
  uploadimg:'رفع من الجهاز',imagelink:'إدراج من رابط',
  imageurlph:'الصق رابط الصورة…',insertimg:'إدراج',dropimage:'أسقط الصورة هنا',
  uploading:'جارٍ الرفع…',uploadfailed:'فشل الرفع — انقر لإعادة المحاولة',deleteimg:'حذف الصورة',
  template:'قوالب',tplimgleft:'صورة يسار، نص يمين',tplimgright:'صورة يمين، نص يسار',
  tplimgtop:'صورة أعلى، نص أسفل',tplimgcenter:'نص أعلى، صورة وسط',deltemplate:'حذف القالب',
  video:'فيديو',quickvideo:'إدراج فيديو',deletevideo:'حذف الفيديو',
  uploadvideo:'رفع من الجهاز',videolink:'إدراج من رابط',
  videourlph:'الصق رابط الفيديو…',insertvideo:'إدراج',dropvideo:'أسقط الفيديو هنا',
  mathformula:'إدراج معادلة رياضية',mathdlgttl:'إدراج معادلة رياضية',
  mathderivation:'اشتقاق متعدد الأسطر',editmath:'تعديل المعادلة',deletemath:'حذف المعادلة',
  videodlgttl:'إدراج/تعديل فيديو',vidgeneral:'عام',vidembed:'تضمين',vidadvanced:'متقدم',
  vidsource:'المصدر',vidembedhint:'الصق كود التضمين أدناه:',
  vidaltsource:'رابط مصدر بديل',vidposter:'صورة الغلاف (رابط الصورة)',
  emoji:'رموز تعبيرية…',
  chcat_currency:'عملات',chcat_text:'نص وعلامات ترقيم',chcat_math:'رموز رياضية',
  chcat_arrows:'أسهم',chcat_symbols:'رموز',chcat_latin:'لاتينية موسعة',chcat_arabic:'عربية',
  emcat_smileys:'وجوه ومشاعر',emcat_people:'أشخاص وإيماءات',emcat_animals:'حيوانات وطبيعة',
  emcat_food:'طعام وشراب',emcat_travel:'سفر وأماكن',emcat_activities:'أنشطة',
  emcat_objects:'أشياء',emcat_symbols:'رموز',emcat_flags:'أعلام'
}};
let lang = 'en';
const t = k => I18N[lang][k];

/* -------- fonts / sizes / blocks -------- */
const FONTS = [
 ['Andale Mono','andale mono,times'],['Arial','arial,helvetica,sans-serif'],
 ['Arial Black','arial black,avant garde'],['Book Antiqua','book antiqua,palatino'],
 ['Comic Sans MS','comic sans ms,sans-serif'],['Courier New','courier new,courier'],
 ['Georgia','georgia,palatino'],['Helvetica','helvetica'],['Impact','impact,chicago'],
 ['Oswald','oswald'],['Sakkal Majalla','sakkal majalla'],['Symbol','symbol'],
 ['Tahoma','tahoma,arial,helvetica,sans-serif'],['Terminal','terminal,monaco'],
 ['Times New Roman','times new roman,times'],['Trebuchet MS','trebuchet ms,geneva'],
 ['Verdana','verdana,geneva'],['Webdings','webdings'],['Wingdings','wingdings,zapf dingbats']
];
const SIZES = ['8pt','10pt','12pt','14pt','18pt','24pt','36pt'];
const BLOCKS = [['p','para'],['h1','heading1'],['h2','heading2'],['h3','heading3'],
                ['h4','heading4'],['h5','heading5'],['h6','heading6'],['pre','pre']];
const COLORS = [
 '#BFEDD2','#FBEEB8','#F8CAC6','#ECCAFA','#C2E0F4',
 '#2DC26B','#F1C40F','#E03E2D','#B96AD9','#3598DB',
 '#169179','#E67E23','#BA372A','#843FA1','#236FA1',
 '#ECF0F1','#CED4D9','#95A5A6','#7E8C8D','#34495E',
 '#000000','#FFFFFF'
];
const CHARS = ['©','®','™','§','¶','†','‡','•','…','′','″','‰','°','±','×','÷',
 '≈','≠','≤','≥','∞','µ','√','∑','€','£','¥','¢','←','→','↑','↓',
 '«','»','“','”','‘','’','–','—','؟','،','؛','٪','٭','ـ','٠','١'];

/* special characters + emoji, grouped for the two-pane pickers
   (category tabs left, glyph grid right); keys are i18n label keys */
const CHAR_CATEGORIES = [
 {key:'chcat_currency',chars:['€','£','¥','¢','$','₹','₽','₩','₺','₴','₦','฿','₫','₪','﷼','¤']},
 {key:'chcat_text',chars:['§','¶','†','‡','•','…','′','″','‰','–','—','¡','¿','·','‹','›','«','»','“','”','‘','’','„','‚','¦','ª','º']},
 {key:'chcat_math',chars:['°','±','×','÷','≈','≠','≤','≥','∞','µ','√','∑','∫','∂','∆','∏','π','Ω','α','β','γ','θ','λ','σ','φ','ω','∈','∉','∪','∩','⊂','⊃','∀','∃','∅','∝','∴','¬','½','⅓','¼','¾','⅔','⅛','⅜','⅝','⅞','¹','²','³']},
 {key:'chcat_arrows',chars:['←','→','↑','↓','↔','↕','⇐','⇒','⇑','⇓','⇔','↖','↗','↘','↙','↩','↪','⤴','⤵']},
 {key:'chcat_symbols',chars:['©','®','™','℠','№','℮','✓','✗','★','☆','✦','♠','♣','♥','♦','♪','♫','☀','☁','☂','☾','☹','☺','✉','✂','✎','☞','☜']},
 {key:'chcat_latin',chars:['À','Á','Â','Ã','Ä','Å','Æ','Ç','È','É','Ê','Ë','Ì','Í','Î','Ï','Ñ','Ò','Ó','Ô','Õ','Ö','Ø','Ù','Ú','Û','Ü','Ý','ß','à','á','â','ã','ä','å','æ','ç','è','é','ê','ë','ì','í','î','ï','ñ','ò','ó','ô','õ','ö','ø','ù','ú','û','ü','ý','ÿ']},
 {key:'chcat_arabic',chars:['؟','،','؛','٪','٭','ـ','٠','١','٢','٣','٤','٥','٦','٧','٨','٩','﴾','﴿','۞','؎']}
];
const EMOJI_CATEGORIES = [
 {key:'emcat_smileys',chars:['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😋','😛','😜','🤪','🤨','🧐','🤓','😎','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😫','😩','🥺','😢','😭','😤','😠','😡','🤯','😳','🥵','🥶','😱','😨','😥','🤗','🤔','🤭','🤫','😐','😑','😬','🙄','😯','😴','😪','😷','🤒','🤕','🤢','🤧','😈','💀','👻','👽','🤖','💩','😺','😸','😹','😻','🙀']},
 {key:'emcat_people',chars:['👋','🤚','✋','🖖','👌','🤏','✌','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝','👍','👎','✊','👊','👏','🙌','👐','🤲','🤝','🙏','💪','✍','💅','🤳','👂','👃','👀','👁','🧠','👶','🧒','👦','👧','🧑','👨','👩','🧓','👴','👵','👮','👷','💂','🕵','👸','🤴','👰','🤵','🤰','👼','🎅','🦸','🦹','🧙','🧚','🧛','🧟','💃','🕺','🚶','🏃','🧘']},
 {key:'emcat_animals',chars:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐢','🐍','🦎','🦖','🐙','🦑','🦀','🐠','🐟','🐬','🐳','🦈','🐊','🐅','🦓','🦍','🐘','🦏','🐪','🦒','🦘','🐄','🐎','🐖','🐑','🐐','🦌','🐕','🐈','🐓','🦃','🦚','🦜','🦢','🕊','🐇','🦔','🌵','🌲','🌴','🌱','🌿','☘','🍀','🍁','🌸','🌺','🌻','🌹','🌷','💐']},
 {key:'emcat_food',chars:['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥒','🌶','🌽','🥕','🥔','🥐','🍞','🥖','🥨','🧀','🥚','🍳','🥞','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🌮','🌯','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍚','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🥜','🍯','🥛','☕','🍵','🥤','🍺','🥂','🍷','🍸','🍹']},
 {key:'emcat_travel',chars:['🚗','🚕','🚙','🚌','🏎','🚓','🚑','🚒','🚚','🚜','🛵','🏍','🚲','🛴','🚔','🚃','🚄','🚅','🚂','🚆','🚇','🚉','✈','🛫','🛬','💺','🚁','🚀','🛸','🚢','⛵','🚤','⚓','⛽','🚧','🗺','🗿','🗽','🗼','🏰','🏯','🎡','🎢','🎠','⛲','🏖','🏝','🌋','⛰','🏔','🗻','🏕','⛺','🏠','🏡','🏢','🏬','🏥','🏦','🏨','🏪','🏫','💒','⛪','🕌','🕍','🕋','⛩','🌅','🌄','🌇','🌆','🌃','🌉','🌌','🌠']},
 {key:'emcat_activities',chars:['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🏒','🏑','🏏','⛳','🏹','🎣','🥊','🥋','⛸','🎿','⛷','🏂','🏋','🤸','⛹','🤺','🏇','🧗','🏄','🏊','🚣','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖','🎫','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','🎯','🎳','🎮','🎰','🧩']},
 {key:'emcat_objects',chars:['⌚','📱','💻','⌨','🖥','🖨','🖱','🕹','💽','💾','💿','📀','📷','📸','📹','🎥','📞','☎','📺','📻','🎙','⏱','⏰','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯','💸','💵','💰','💳','💎','⚖','🔧','🔨','⚒','🛠','⛏','🔩','⚙','🧲','🔫','💣','🔪','🛡','🔮','🧿','🔭','🔬','💊','💉','🌡','🧬','🧪','🧹','🧺','🛁','🔑','🗝','🚪','🛋','🛏','🧸','🖼','🛍','🛒','🎁','🎈','🎀','🎊','🎉','✉','📩','📦','📜','📄','📊','📈','📉','📅','📋','📁','📰','📓','📚','📖','🔖','🔗','📎','📐','📏','📌','📍','✂','🖊','✒','🖌','🖍','📝','✏','🔍','🔒','🔓']},
 {key:'emcat_symbols',chars:['❤','🧡','💛','💚','💙','💜','🖤','💔','❣','💕','💞','💓','💗','💖','💘','💝','☮','✝','☪','🕉','☸','✡','☯','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⚛','❌','⭕','🛑','⛔','🚫','💯','💢','⚠','🚸','🔱','⚜','🔰','♻','✅','❇','✳','❎','🌐','💠','🌀','💤','🏧','♿','🚭','❗','❕','❓','❔','‼','⁉','💲','🔅','🔆','〽','ℹ','🆗','🆕','🆓','🆒','🆙','🈯','🈚']},
 {key:'emcat_flags',chars:['🏁','🚩','🎌','🏴','🏳','🇦🇪','🇸🇦','🇶🇦','🇰🇼','🇧🇭','🇴🇲','🇪🇬','🇯🇴','🇱🇧','🇮🇳','🇵🇰','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇵🇹','🇳🇱','🇧🇪','🇨🇭','🇸🇪','🇳🇴','🇩🇰','🇫🇮','🇮🇪','🇬🇷','🇹🇷','🇷🇺','🇺🇦','🇵🇱','🇯🇵','🇰🇷','🇨🇳','🇸🇬','🇲🇾','🇮🇩','🇹🇭','🇵🇭','🇻🇳','🇧🇷','🇦🇷','🇲🇽','🇿🇦','🇳🇬','🇰🇪','🇲🇦']}
];

/* ---------------------------------------------------------- icons */
const S = (inner,vb) => `<svg viewBox="${vb||'0 0 24 24'}">${inner}</svg>`;
const IC = {
 undo:S('<path d="M8.5 7 4.5 11l4 4"/><path d="M4.5 11H15a4.5 4.5 0 0 1 0 9h-4"/>'),
 redo:S('<path d="M15.5 7l4 4-4 4"/><path d="M19.5 11H9a4.5 4.5 0 0 0 0 9h4"/>'),
 ltr:S('<path d="M12 5h6M15.5 5v11M12 5a3 3 0 0 0 0 6h3.5"/><path d="M5 19h9"/><path class="f" d="M14 19l-3.2-2.2v4.4z" transform="rotate(180 12.4 19)"/>'),
 rtl:S('<path d="M12 5h6M15.5 5v11M12 5a3 3 0 0 0 0 6h3.5"/><path d="M10 19h9"/><path class="f" d="M10 19l3.2-2.2v4.4z" transform="rotate(180 11.6 19)"/>'),
 alignleft:S('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),
 aligncenter:S('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'),
 alignright:S('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'),
 alignjustify:S('<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>'),
 fullscreen:S('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
 numlist:S('<path d="M10 6h10M10 12h10M10 18h10"/><text x="3" y="8.4" font-size="7.5" stroke="none" fill="#222f3e" font-family="Arial">1</text><text x="3" y="14.4" font-size="7.5" stroke="none" fill="#222f3e" font-family="Arial">2</text><text x="3" y="20.4" font-size="7.5" stroke="none" fill="#222f3e" font-family="Arial">3</text>'),
 bullist:S('<path d="M10 6h10M10 12h10M10 18h10"/><circle class="f" cx="5" cy="6" r="1.6"/><circle class="f" cx="5" cy="12" r="1.6"/><circle class="f" cx="5" cy="18" r="1.6"/>'),
 chev:S('<path d="M2 3.5 6 7.5 10 3.5"/>','0 0 12 11'),
 backcolor:S('<path d="M9.5 14.5 5 19H3v-2l4.5-4.5M9.5 14.5 15 9l-2-2-5.5 5.5M15 9l3.5-3.5a1.4 1.4 0 0 1 2 2L17 11l-2-2z"/>'),
 outdent:S('<path d="M4 6h16M11 10h9M11 14h9M4 18h16"/><path class="f" d="M8 12l-4-2.6v5.2z"/>'),
 indent:S('<path d="M4 6h16M11 10h9M11 14h9M4 18h16"/><path class="f" d="M4 12l4-2.6v5.2z"/>'),
 more:S('<circle class="f" cx="5" cy="12" r="1.7"/><circle class="f" cx="12" cy="12" r="1.7"/><circle class="f" cx="19" cy="12" r="1.7"/>'),
 image:S('<rect x="4" y="5" width="16" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4 3 2.5L16 11l4 4.5"/>'),
 uploadic:S('<path d="M12 16V6M8.5 9.5 12 6l3.5 3.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>'),
 linkic:S('<path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7l-1.4 1.4"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.4-1.4"/>'),
 tableic:S('<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 10h16M4 14.5h16M9.5 5v14M14.5 5v14"/>'),
 hric:S('<path d="M4 12h16"/>'),
 charic:S('<text x="5" y="18" font-size="16" stroke="none" fill="#222f3e" font-family="Georgia">Ω</text>'),
 dateic:S('<rect x="4" y="6" width="16" height="14" rx="1.5"/><path d="M4 10h16M8 4v4M16 4v4"/>'),
 pbic:S('<path d="M4 12h3M9 12h3M14 12h3M19 12h1M4 5h16M4 19h16" stroke-dasharray="none"/>'),
 nbspic:S('<path d="M6 12v4h12v-4"/>'),
 srcic:S('<path d="M9 7 4 12l5 5M15 7l5 5-5 5"/>'),
 prevw:S('<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/>'),
 printic:S('<path d="M7 8V4h10v4M7 17H4V9h16v8h-3"/><rect x="7" y="14" width="10" height="6"/>'),
 cutic:S('<circle cx="6.5" cy="17.5" r="2.2"/><circle cx="17.5" cy="17.5" r="2.2"/><path d="M8.3 16 19 5M15.7 16 5 5"/>'),
 copyic:S('<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M5 15H4V4h11v1"/>'),
 pasteic:S('<rect x="6" y="5" width="12" height="15" rx="1.5"/><path d="M9 5a3 3 0 0 1 6 0"/>'),
 selall:S('<rect x="4" y="4" width="16" height="16" rx="1.5" stroke-dasharray="3 2.4"/>'),
 newic:S('<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>'),
 helpic:S('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.6c-.8.3-1 .9-1 1.8"/><circle class="f" cx="12" cy="16.6" r="1.1"/>'),
 wcic:S('<path d="M4 6h16M4 10h16M4 14h9"/><path d="M15 17.5l2 2 3.6-4"/>'),
 rowbefore:S('<rect x="4" y="12" width="16" height="7" rx="1"/><path d="M12 2v7M8.5 6l3.5-3.5L15.5 6"/>'),
 rowafter:S('<rect x="4" y="5" width="16" height="7" rx="1"/><path d="M12 15v7M8.5 18l3.5 3.5L15.5 18"/>'),
 rowdelete:S('<rect x="4" y="8.5" width="16" height="7" rx="1"/><path d="M8.5 10.3l7 3.4M15.5 10.3l-7 3.4"/>'),
 colbefore:S('<rect x="12" y="4" width="7" height="16" rx="1"/><path d="M2 12h7M6 8.5l-3.5 3.5L6 15.5"/>'),
 colafter:S('<rect x="5" y="4" width="7" height="16" rx="1"/><path d="M15 12h7M18 8.5l3.5 3.5L18 15.5"/>'),
 coldelete:S('<rect x="8.5" y="4" width="7" height="16" rx="1"/><path d="M10.3 8.5l3.4 7M10.3 15.5l3.4-7"/>'),
 tabledelete:S('<rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 10h16M4 14.5h16M9.5 5v14M14.5 5v14"/><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke-width="2.1"/>'),
 trash:S('<path d="M5 7h14M10 7V5h4v2M7.5 7l1 13h7l1-13"/>'),
 templateic:S('<rect x="4" y="4" width="16" height="16" rx="1.5"/><rect x="6.5" y="6.5" width="5" height="5" rx=".5"/><path d="M14 7.5h3.5M14 10h3.5M6.5 14h11M6.5 17h11"/>'),
 tplleft:S('<rect x="3" y="5" width="8" height="8" rx=".8"/><path d="M13.5 6.5H21M13.5 9.5H21M13.5 12.5H21M3 15.5h18M3 18.5h18"/>'),
 tplright:S('<rect x="13" y="5" width="8" height="8" rx=".8"/><path d="M3 6.5h7.5M3 9.5h7.5M3 12.5h7.5M3 15.5h18M3 18.5h18"/>'),
 tpltop:S('<rect x="5" y="3" width="14" height="9" rx=".8"/><path d="M3 15h18M3 18h18M3 21h12"/>'),
 tplcenter:S('<path d="M3 4h18M3 7h18M3 10h12"/><rect x="5" y="12.5" width="14" height="9" rx=".8"/>'),
 video:S('<rect x="3" y="6" width="13" height="12" rx="1.5"/><path d="M17 10l4-2.5v9L17 14z"/>'),
 mathic:S('<text x="3" y="18" font-size="17" stroke="none" fill="#222f3e" font-family="Georgia" font-style="italic">&#8721;</text>'),
 editic:S('<path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19 4 20z"/><path d="M13.5 6.5l4 4"/>'),
 emojiic:S('<circle cx="12" cy="12" r="8.5"/><path d="M8.6 14.3a4.6 4.6 0 0 0 6.8 0"/><path d="M9.2 9.6v.7M14.8 9.6v.7"/>')
};
const TXT = (html)=>`<span class="txt">${html}</span>`;

/* ---------------------------------------------------------- dom refs */
const shell   = document.getElementById('tox');
const menubar = document.getElementById('menubar');
const toolbar = document.getElementById('toolbar');
const ed      = document.getElementById('earea');
const sbHelp  = document.getElementById('sbHelp');
const sbWords = document.getElementById('sbWords');
const imgInput= document.getElementById('imgInput');
const vidInput= document.getElementById('vidInput');

let savedRange = null;
let foreColor = '#000000', backColor = '#FACC15';

/* ---------------------------------------------------------- selection */
function saveSel(){
  const s = window.getSelection();
  if(s.rangeCount && ed.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange();
}
function restoreSel(){
  if(!savedRange) return ed.focus();
  ed.focus();
  const s = window.getSelection();
  s.removeAllRanges(); s.addRange(savedRange);
}
function exec(cmd, val){
  restoreSel();
  document.execCommand('styleWithCSS', false, cmd!=='fontSize');
  document.execCommand(cmd, false, val ?? null);
  saveSel(); refreshState(); onChange();
}
function closestBlock(node){
  while(node && node !== ed){
    if(node.nodeType===1 && /^(P|DIV|H[1-6]|LI|PRE|BLOCKQUOTE|TD|TH)$/.test(node.tagName))
      return node;
    node = node.parentNode;
  }
  return null;
}
function selectedBlocks(){
  const s = window.getSelection();
  if(!s.rangeCount || !ed.contains(s.anchorNode)) return [];
  const r = s.getRangeAt(0);
  const blocks = [...ed.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,pre,blockquote,td,th')]
      .filter(b=>r.intersectsNode(b));
  if(!blocks.length){ const b = closestBlock(s.anchorNode); if(b) return [b]; }
  return blocks;
}

/* ---------------------------------------------------------- popups */
let openPop = null, popAnchor = null;
function closePop(){ if(openPop){ openPop.remove(); openPop=null;
  popAnchor?.classList.remove('open'); popAnchor=null; } }
function popup(anchor, build){
  if(openPop && popAnchor === anchor){ closePop(); return; }
  closePop();
  const el = document.createElement('div');
  el.className = 'pop'; el.dir = t('dir');
  build(el);
  document.body.appendChild(el);
  const r = anchor.getBoundingClientRect();
  el.style.top = (r.bottom + scrollY + 2) + 'px';
  const isRtl = t('dir')==='rtl';
  let x = isRtl ? r.right - el.offsetWidth : r.left;
  x = Math.max(8, Math.min(x + scrollX, scrollX + innerWidth - el.offsetWidth - 8));
  el.style.left = x + 'px';
  el.addEventListener('mousedown', e=>{ if(e.target.tagName!=='INPUT') e.preventDefault(); });
  openPop = el; popAnchor = anchor; anchor.classList.add('open');
}
document.addEventListener('mousedown', e=>{
  if(openPop && !openPop.contains(e.target) && !popAnchor.contains(e.target)) closePop();
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closePop(); closeDlg(); }});

function menuItems(el, items){
  items.forEach(it=>{
    if(it==='|'){ el.insertAdjacentHTML('beforeend','<div class="sep"></div>'); return; }
    const b = document.createElement('button');
    b.className = 'mi' + (it.on ? ' on':'');
    b.innerHTML = `<span class="ic">${it.icon||''}</span><span class="prev" ${it.previewStyle?`style="${it.previewStyle}"`:''}>${it.label}</span>${it.shortcut?`<span class="sc">${it.shortcut}</span>`:''}`;
    b.addEventListener('click', ()=>{ closePop(); it.action(); });
    el.appendChild(b);
  });
}

/* ---------------------------------------------------------- toolbar */
function tbtn(icon, tip, fn, id){
  const b = document.createElement('button');
  b.className='tbtn'; b.type='button'; b.title = tip; b.innerHTML = icon;
  if(id) b.dataset.id = id;
  b.addEventListener('mousedown', e=>e.preventDefault());
  b.addEventListener('click', fn);
  return b;
}
function group(...els){
  const g = document.createElement('div'); g.className='tgrp';
  els.forEach(e=>g.appendChild(e)); return g;
}
function splitBtn(icon, tip, mainFn, menuFn, id, colorbar){
  const w = document.createElement('div'); w.className='tsplit';
  const main = tbtn(icon + (colorbar?`<span class="colorbar" data-cb="${id}"></span>`:''), tip, mainFn, id);
  const arr = document.createElement('button');
  arr.className='arrow'; arr.type='button'; arr.innerHTML = IC.chev;
  arr.addEventListener('mousedown', e=>{ e.preventDefault(); saveSel(); });
  arr.addEventListener('click', ()=>menuFn(arr));
  w.append(main, arr);
  return w;
}
function tsel(cls, id, defLabel, menuFn){
  const b = document.createElement('button');
  b.className = 'tsel ' + cls; b.type='button'; b.dataset.id = id;
  b.innerHTML = `<span class="lbl empty">${defLabel||''}</span>${IC.chev}`;
  b.addEventListener('mousedown', e=>{ e.preventDefault(); saveSel(); });
  b.addEventListener('click', ()=>menuFn(b));
  return b;
}

function setListStyle(kind, style){
  restoreSel();
  const s = window.getSelection();
  let list = closestBlock(s.anchorNode)?.closest(kind);
  if(!list){ exec(kind==='ol' ? 'insertOrderedList' : 'insertUnorderedList');
             list = closestBlock(window.getSelection().anchorNode)?.closest(kind); }
  if(list) list.style.listStyleType = style;
  saveSel(); onChange();
}

function colorMenu(anchor, kind){
  popup(anchor, el=>{
    const grid = document.createElement('div'); grid.className='cpal';
    COLORS.forEach(c=>{
      const b=document.createElement('button'); b.style.background=c; b.title=c;
      b.addEventListener('click', ()=>{ closePop(); applyColor(kind,c); });
      grid.appendChild(b);
    });
    el.appendChild(grid);
    el.insertAdjacentHTML('beforeend','<div class="sep"></div>');
    menuItems(el,[{label:t('removecolor'),icon:IC.hric,action:()=>applyColor(kind,null)}]);
  });
}
function applyColor(kind, c){
  if(kind==='fore'){ foreColor = c||'#000000'; exec('foreColor', c||'#000000'); }
  else {
    backColor = c||'transparent';
    exec('hiliteColor', c||'transparent');
  }
  document.querySelectorAll(`[data-cb=${kind}]`).forEach(el=>
    el.style.background = (kind==='fore'?foreColor:backColor));
}

function fontMenu(anchor){
  popup(anchor, el=>menuItems(el, FONTS.map(([name,val])=>({
    label:name, previewStyle:`font-family:${val}`,
    on: currentFont()===name,
    action:()=>exec('fontName', val)
  }))));
}
function sizeMenu(anchor){
  popup(anchor, el=>menuItems(el, SIZES.map(s=>({
    label:s, on: currentSize()===s,
    action:()=>applyFontSize(s)
  }))));
}
function applyFontSize(pt){
  restoreSel();
  document.execCommand('styleWithCSS', false, false);
  document.execCommand('fontSize', false, '7');
  ed.querySelectorAll('font[size="7"]').forEach(f=>{
    const span = document.createElement('span');
    span.style.fontSize = pt;
    while(f.firstChild) span.appendChild(f.firstChild);
    f.replaceWith(span);
  });
  saveSel(); refreshState(); onChange();
}
function blocksMenu(anchor){
  popup(anchor, el=>menuItems(el, BLOCKS.map(([tag,key])=>({
    label: blockLabel(tag),
    previewStyle: tag.startsWith('h') ? `font-weight:700;font-size:${22-2*(+tag[1])}px`
                : tag==='pre' ? 'font-family:monospace' : '',
    on: currentBlock()===tag,
    action:()=>exec('formatBlock', '<'+tag+'>')
  }))));
}
function blockLabel(tag){
  if(tag==='p') return t('para');
  if(tag==='pre') return t('pre');
  return t('heading') + ' ' + tag[1];
}

function tableGrid(anchor, after){
  popup(anchor, el=>{
    const wrap = document.createElement('div'); wrap.className='tgridwrap';
    const grid = document.createElement('div'); grid.className='tgrid';
    const lbl = document.createElement('div'); lbl.className='tgridlbl'; lbl.textContent='1 × 1';
    const cells=[];
    for(let r=0;r<8;r++)for(let c=0;c<10;c++){
      const sp=document.createElement('span'); sp.dataset.r=r; sp.dataset.c=c;
      sp.addEventListener('mouseenter', ()=>{
        cells.forEach(x=>x.classList.toggle('hot', +x.dataset.r<=r && +x.dataset.c<=c));
        lbl.textContent = (c+1)+' × '+(r+1);
      });
      sp.addEventListener('click', ()=>{ closePop(); insertTable(r+1,c+1); after&&after(); });
      cells.push(sp); grid.appendChild(sp);
    }
    wrap.append(grid,lbl); el.appendChild(wrap);
  });
}
function insertTable(rows,cols){
  restoreSel();
  /* table-layout:fixed keeps the columns evenly sized while typing —
     text wraps at the column edge instead of widening the column */
  let html='<table style="border-collapse:collapse;width:100%;table-layout:fixed"><tbody>';
  for(let r=0;r<rows;r++){ html+='<tr>';
    for(let c=0;c<cols;c++) html+='<td style="border:1px solid #b9c2cc"><br></td>'; html+='</tr>'; }
  html+='</tbody></table><p><br></p>';
  document.execCommand('insertHTML', false, html);
  saveSel(); onChange();
}

function setDir(dir){
  restoreSel();
  const blocks = selectedBlocks();
  if(blocks.length) blocks.forEach(b=>b.setAttribute('dir',dir));
  else ed.setAttribute('dir',dir);
  saveSel(); refreshState(); onChange();
}

function buildToolbar(){
  toolbar.innerHTML='';
  toolbar.append(
    group( tbtn(IC.undo,t('undo'),()=>exec('undo')),
           tbtn(IC.redo,t('redo'),()=>exec('redo')) ),
    group( tbtn(IC.ltr,t('ltr'),()=>setDir('ltr'),'ltr'),
           tbtn(IC.rtl,t('rtl'),()=>setDir('rtl'),'rtl') ),
    group( tbtn(TXT('<b class="sans">B</b>'),t('bold'),()=>exec('bold'),'bold'),
           tbtn(TXT('<i>I</i>'),t('italic'),()=>exec('italic'),'italic'),
           tbtn(TXT('<u class="sans" style="font-weight:400">U</u>'),t('underline'),()=>exec('underline'),'underline'),
           tbtn(TXT('<s class="sans" style="font-weight:400">S</s>'),t('strikethrough'),()=>exec('strikeThrough'),'strikeThrough') ),
    group( tbtn(IC.alignleft,t('alignleft'),()=>exec('justifyLeft'),'justifyLeft'),
           tbtn(IC.aligncenter,t('aligncenter'),()=>exec('justifyCenter'),'justifyCenter'),
           tbtn(IC.alignright,t('alignright'),()=>exec('justifyRight'),'justifyRight'),
           tbtn(IC.alignjustify,t('alignjustify'),()=>exec('justifyFull'),'justifyFull'),
           tbtn(IC.fullscreen,t('fullscreen'),toggleFullscreen,'fullscreen') ),
    group( splitBtn(IC.numlist,t('numlist'),()=>exec('insertOrderedList'),
             a=>popup(a,el=>menuItems(el,
               ['decimal','lower-alpha','lower-roman','upper-alpha','upper-roman']
               .map((s,i)=>({label:t('liststyles_ol')[i],action:()=>setListStyle('ol',s)})))),
             'insertOrderedList'),
           splitBtn(IC.bullist,t('bullist'),()=>exec('insertUnorderedList'),
             a=>popup(a,el=>menuItems(el,
               ['disc','circle','square']
               .map((s,i)=>({label:t('liststyles_ul')[i],action:()=>setListStyle('ul',s)})))),
             'insertUnorderedList') ),
    group( splitBtn(TXT('<span class="sans" style="font-weight:600;text-decoration:underline">A</span>'),
             t('forecolor'),()=>applyColor('fore',foreColor),a=>colorMenu(a,'fore'),'fore',true),
           splitBtn(IC.backcolor,t('backcolor'),()=>applyColor('back',backColor),
             a=>colorMenu(a,'back'),'back',true),
           tbtn(TXT('<i>T</i><sub style="font-size:10px">x</sub>'),t('removeformat'),
             ()=>exec('removeFormat')) ),
    group( tbtn(IC.outdent,t('outdent'),()=>exec('outdent')),
           tbtn(IC.indent,t('indent'),()=>exec('indent')) ),
    group( tsel('w-font','fontsel','',fontMenu),
           tsel('w-size','sizesel','',sizeMenu) ),
    group( tsel('w-block','blocksel',t('para'),blocksMenu) ),
    group( tbtn(IC.more,t('more'),ev=>{
      const btn = ev.currentTarget; saveSel();
      popup(btn, el=>menuItems(el,[
        {label:t('quickimage'),icon:IC.image,action:insertImagePlaceholder},
        {label:t('quickvideo'),icon:IC.video,action:()=>videoDlg()},
        {label:t('quicktable'),icon:IC.tableic,action:()=>tableGrid(btn)},
        {label:t('mathformula'),icon:IC.mathic,action:()=>mathDlg()},
        {label:t('template'),icon:IC.templateic,action:()=>templateMenu(btn)},
        {label:t('charmap'),icon:IC.charic,action:()=>charMap()},
        {label:t('emoji'),icon:IC.emojiic,action:()=>emojiMap()}
      ]));
    }) )
  );
  /* restore colorbars */
  document.querySelectorAll('[data-cb=fore]').forEach(e=>e.style.background=foreColor);
  document.querySelectorAll('[data-cb=back]').forEach(e=>e.style.background=backColor);
}

/* ---------------------------------------------------------- menubar */
function mItem(label,icon,action,shortcut){ return {label:t(label),icon,action,shortcut}; }
function buildMenubar(){
  menubar.innerHTML='';
  const menus = {
    file:[ mItem('newdoc',IC.newic,()=>{ed.innerHTML='<p><br></p>';onChange();}),
           '|',
           mItem('preview',IC.prevw,previewDlg),
           mItem('print',IC.printic,printDoc,'Ctrl+P') ],
    edit:[ mItem('undo',IC.undo,()=>exec('undo'),'Ctrl+Z'),
           mItem('redo',IC.redo,()=>exec('redo'),'Ctrl+Y'), '|',
           mItem('cut',IC.cutic,()=>exec('cut'),'Ctrl+X'),
           mItem('copy',IC.copyic,()=>exec('copy'),'Ctrl+C'),
           mItem('paste',IC.pasteic,()=>alert(t('pastehint')),'Ctrl+V'), '|',
           mItem('selectall',IC.selall,()=>exec('selectAll'),'Ctrl+A') ],
    view:[ mItem('fullscreen',IC.fullscreen,toggleFullscreen),
           mItem('preview',IC.prevw,previewDlg),
           mItem('sourcecode',IC.srcic,sourceDlg) ],
    insert:[ mItem('image',IC.image,insertImagePlaceholder),
           mItem('video',IC.video,()=>videoDlg()),
           mItem('mathformula',IC.mathic,()=>mathDlg()),
           {label:t('inserttable'),icon:IC.tableic,action:()=>tableGrid(menubar.children[6]||menubar)},
           {label:t('template'),icon:IC.templateic,action:()=>templateMenu(menubar.children[3]||menubar)},
           mItem('hr',IC.hric,()=>exec('insertHorizontalRule')), '|',
           mItem('charmap',IC.charic,a=>charMap()),
           mItem('emoji',IC.emojiic,()=>emojiMap()),
           mItem('datetime',IC.dateic,()=>exec('insertText',
               new Date().toLocaleString(lang==='ar'?'ar-AE':'en-GB'))), '|',
           mItem('pagebreak',IC.pbic,()=>{restoreSel();
               document.execCommand('insertHTML',false,'<hr class="pagebreak"><p><br></p>');onChange();}),
           mItem('nbsp',IC.nbspic,()=>exec('insertText','\u00A0')) ],
    format:[ mItem('bold',null,()=>exec('bold'),'Ctrl+B'),
           mItem('italic',null,()=>exec('italic'),'Ctrl+I'),
           mItem('underline',null,()=>exec('underline'),'Ctrl+U'),
           mItem('strikethrough',null,()=>exec('strikeThrough')),
           mItem('superscript',null,()=>exec('superscript')),
           mItem('subscript',null,()=>exec('subscript')), '|',
           mItem('clearformat',null,()=>exec('removeFormat')) ],
    tools:[ mItem('sourcecode',IC.srcic,sourceDlg),
           mItem('wordcount',IC.wcic,wordCountDlg) ],
    table:[ {label:t('inserttable'),icon:IC.tableic,action:()=>tableGrid(menubar.children[6]||menubar)}, '|',
           mItem('rowabove',null,()=>tableOp('rowabove')),
           mItem('rowbelow',null,()=>tableOp('rowbelow')),
           mItem('delrow',null,()=>tableOp('delrow')), '|',
           mItem('colbefore',null,()=>tableOp('colbefore')),
           mItem('colafter',null,()=>tableOp('colafter')),
           mItem('delcol',null,()=>tableOp('delcol')), '|',
           mItem('deltable',null,()=>tableOp('deltable')) ],
    help:[ mItem('helpttl',IC.helpic,helpDlg,'Alt+0') ]
  };
  ['file','edit','view','insert','format','tools','table','help'].forEach(key=>{
    const b=document.createElement('button'); b.type='button'; b.textContent=t(key);
    b.addEventListener('mousedown',e=>{e.preventDefault();saveSel();});
    b.addEventListener('click',()=>popup(b, el=>menuItems(el, menus[key])));
    menubar.appendChild(b);
  });
}

/* ---------------------------------------------------------- table ops */
function tableOp(op){
  restoreSel();
  const s = window.getSelection();
  const cell = closestBlock(s.anchorNode)?.closest('td,th')
            || (s.anchorNode?.nodeType===1 ? s.anchorNode.closest?.('td,th') : null);
  if(!cell) return;
  const row = cell.parentElement, table = cell.closest('table');
  const idx = [...row.children].indexOf(cell);
  const newRow = ()=>{ const r=row.cloneNode(false);
      /* carry each source cell's inline style so borders / padding /
         column widths survive on inserted rows */
      [...row.children].forEach(src=>{const td=document.createElement('td');
        const st=src.getAttribute('style'); if(st) td.setAttribute('style',st);
        td.style.removeProperty('background-color');
        td.innerHTML='<br>';r.appendChild(td);});
      return r; };
  if(op==='rowabove') row.before(newRow());
  if(op==='rowbelow') row.after(newRow());
  if(op==='delrow'){ const body=row.parentElement; row.remove();
      if(!body.querySelector('tr')) table.remove(); }
  if(op==='colbefore'||op==='colafter')
    table.querySelectorAll('tr').forEach(tr=>{
      const ref = tr.children[Math.min(idx,tr.children.length-1)];
      const td=document.createElement('td');
      /* copy the reference cell's style so the new column keeps borders;
         width is dropped so the new column shares the table space */
      const st=ref.getAttribute('style'); if(st) td.setAttribute('style',st);
      td.style.removeProperty('width');
      td.style.removeProperty('background-color');
      td.innerHTML='<br>';
      op==='colbefore' ? ref.before(td) : ref.after(td);
    });
  if(op==='delcol'){
    table.querySelectorAll('tr').forEach(tr=>tr.children[idx]?.remove());
    if(!table.querySelector('td,th')) table.remove();
  }
  if(op==='deltable') table.remove();
  onChange();
  positionTableHandles();
}

function applyTableProps(table, vals){
  if(vals.width) table.style.width = /^\d+$/.test(vals.width) ? vals.width+'px' : vals.width;
  else table.style.removeProperty('width');

  const cells = [...table.querySelectorAll('td,th')];
  if(vals.cellpadding!=='') cells.forEach(c=>c.style.padding = vals.cellpadding+'px');
  else cells.forEach(c=>c.style.removeProperty('padding'));

  if(vals.cellspacing!==''){ table.style.borderCollapse='separate'; table.style.borderSpacing=vals.cellspacing+'px'; }
  else { table.style.borderCollapse='collapse'; table.style.removeProperty('border-spacing'); }

  if(vals.border!=='' && +vals.border>0){
    table.style.border = vals.border+'px solid #b9c2cc';
    cells.forEach(c=>c.style.border = vals.border+'px solid #b9c2cc');
  } else {
    table.style.removeProperty('border');
    cells.forEach(c=>c.style.removeProperty('border'));
  }

  table.style.removeProperty('margin-left'); table.style.removeProperty('margin-right');
  if(vals.align==='center'){ table.style.marginLeft='auto'; table.style.marginRight='auto'; }
  else if(vals.align==='right'){ table.style.marginLeft='auto'; table.style.marginRight='0'; }
  else if(vals.align==='left'){ table.style.marginLeft='0'; table.style.marginRight='auto'; }
}
function tablePropsDlg(){
  const table = tblActive; if(!table) return;
  let wIn, padIn, spIn, bIn, alignSel;
  const rowStyle='display:flex;align-items:center;gap:10px;margin:10px 0';
  const lblStyle='width:120px;color:#556;flex:none';
  const inputStyle='flex:1;border:1px solid #cfd6df;border-radius:6px;padding:7px 9px;font:14px inherit';
  const firstCell = table.querySelector('td,th');
  const curWidth = table.style.width || '';
  const curPad = firstCell && firstCell.style.padding ? parseFloat(firstCell.style.padding) : '';
  const curSp = table.style.borderSpacing ? parseFloat(table.style.borderSpacing) : '';
  const curBorder = table.style.borderWidth ? parseFloat(table.style.borderWidth) : '';
  const ml=table.style.marginLeft, mr=table.style.marginRight;
  const curAlign = (ml==='auto'&&mr==='auto') ? 'center' : (ml==='auto') ? 'right' : (mr==='auto'&&ml==='0') ? 'left' : '';

  dialog(t('tablepropsttl'), body=>{
    const mk=(labelKey, el)=>{
      const row=document.createElement('div'); row.style.cssText=rowStyle;
      const lbl=document.createElement('span'); lbl.style.cssText=lblStyle; lbl.textContent=t(labelKey);
      row.append(lbl, el); body.appendChild(row);
    };
    wIn=document.createElement('input'); wIn.type='text'; wIn.style.cssText=inputStyle;
    wIn.placeholder='e.g. 600px or 100%'; wIn.value=curWidth;
    mk('tblwidth', wIn);
    padIn=document.createElement('input'); padIn.type='number'; padIn.min='0'; padIn.style.cssText=inputStyle;
    padIn.value=curPad; mk('tblcellpadding', padIn);
    spIn=document.createElement('input'); spIn.type='number'; spIn.min='0'; spIn.style.cssText=inputStyle;
    spIn.value=curSp; mk('tblcellspacing', spIn);
    bIn=document.createElement('input'); bIn.type='number'; bIn.min='0'; bIn.style.cssText=inputStyle;
    bIn.value=curBorder; mk('tblborder', bIn);
    alignSel=document.createElement('select'); alignSel.style.cssText=inputStyle;
    [['','alignnone'],['left','alignleft'],['center','aligncenter'],['right','alignright']]
      .forEach(([v,k])=>{ const o=document.createElement('option'); o.value=v; o.textContent=t(k);
        if(v===curAlign) o.selected=true; alignSel.appendChild(o); });
    mk('tblalign', alignSel);
  },[
    {label:t('cancel'), action:closeDlg},
    {label:t('save'), pri:true, action:()=>{
      applyTableProps(table, {
        width: wIn.value.trim(), cellpadding: padIn.value.trim(),
        cellspacing: spIn.value.trim(), border: bIn.value.trim(), align: alignSel.value
      });
      closeDlg(); onChange(); positionTableHandles();
    }}
  ]);
}

/* ---------------------------------------------------------- dialogs */
let dlgOvl=null;
function closeDlg(){ dlgOvl?.remove(); dlgOvl=null; }
function dialog(title, bodyBuild, buttons){
  closeDlg(); closePop();
  dlgOvl = document.createElement('div'); dlgOvl.className='ovl';
  const d = document.createElement('div'); d.className='dlg'; d.dir=t('dir');
  d.innerHTML = `<header><span>${title}</span><button type="button">×</button></header>
                 <div class="body"></div><footer></footer>`;
  d.querySelector('header button').onclick = closeDlg;
  bodyBuild(d.querySelector('.body'));
  (buttons||[{label:t('close'),pri:true,action:closeDlg}]).forEach(b=>{
    const btn=document.createElement('button'); btn.type='button';
    btn.textContent=b.label; if(b.pri)btn.className='pri';
    btn.onclick=b.action; d.querySelector('footer').appendChild(btn);
  });
  dlgOvl.appendChild(d);
  dlgOvl.addEventListener('mousedown',e=>{ if(e.target===dlgOvl) closeDlg(); });
  document.body.appendChild(dlgOvl);
}
function sourceDlg(){
  let ta;
  dialog(t('srcttl'), body=>{
    ta=document.createElement('textarea'); ta.value=ed.innerHTML.replace(/></g,'>\n<');
    body.appendChild(ta);
  },[
    {label:t('cancel'),action:closeDlg},
    {label:t('save'),pri:true,action:()=>{ed.innerHTML=ta.value;closeDlg();onChange();}}
  ]);
}
function helpDlg(){
  dialog(t('helpttl'), body=>{
    const rows=[['Ctrl+B',t('bold')],['Ctrl+I',t('italic')],['Ctrl+U',t('underline')],
      ['Ctrl+Z',t('undo')],['Ctrl+Y',t('redo')],['Ctrl+A',t('selectall')],['Alt+0',t('helpttl')]];
    body.innerHTML = `<p style="color:#556">${t('shortcuts')}</p>
      <table class="kbd">${rows.map(r=>`<tr><td>${r[1]}</td><td><kbd>${r[0]}</kbd></td></tr>`).join('')}</table>`;
  });
}
function wordCountDlg(){
  dialog(t('wcttl'), body=>{
    body.innerHTML = `<table class="kbd">
      <tr><td>${t('wcwords')}</td><td>${countWords()}</td></tr>
      <tr><td>${t('wcchars')}</td><td>${ed.innerText.replace(/\s/g,'').length}</td></tr></table>`;
  });
}
function previewDlg(){
  dialog(t('previewttl'), body=>{
    const box=document.createElement('div');
    box.style.cssText='width:640px;max-width:78vw;max-height:52vh;overflow:auto;border:1px solid #e3e3e3;border-radius:6px;padding:14px;font-family:Helvetica,Arial,sans-serif;font-size:14px';
    box.innerHTML = ed.innerHTML; body.appendChild(box);
  });
}
/* two-pane picker shared by the special-character map and the emoji map:
   fixed category tabs on the left, the active category's glyphs on the right */
function glyphPickerDlg(title, cats, emoji){
  saveSel();
  dialog(title, body=>{
    const wrap=document.createElement('div'); wrap.className='chmap';
    const tabs=document.createElement('div'); tabs.className='chtabs';
    const panel=document.createElement('div'); panel.className='chpanel';
    const grid=document.createElement('div'); grid.className='chgrid'+(emoji?' emgrid':'');
    panel.appendChild(grid);
    const show=i=>{
      [...tabs.querySelectorAll('button')].forEach((b,bi)=>b.classList.toggle('on', bi===i));
      grid.innerHTML='';
      cats[i].chars.forEach(ch=>{
        const b=document.createElement('button'); b.type='button'; b.textContent=ch;
        b.onclick=()=>{ closeDlg(); exec('insertText',ch); };
        grid.appendChild(b);
      });
      panel.scrollTop=0;
    };
    cats.forEach((c,i)=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=t(c.key);
      b.addEventListener('click', ()=>show(i));
      tabs.appendChild(b);
    });
    wrap.append(tabs, panel);
    body.appendChild(wrap);
    show(0);
  });
}
function charMap(){ glyphPickerDlg(t('charmap').replace('…',''), CHAR_CATEGORIES, false); }
function emojiMap(){ glyphPickerDlg(t('emoji').replace('…',''), EMOJI_CATEGORIES, true); }
function printDoc(){
  const w=window.open('','_blank');
  w.document.write(`<html dir="${t('dir')}"><body style="font-family:Helvetica,Arial,sans-serif;font-size:14px">${ed.innerHTML}</body></html>`);
  w.document.close(); w.focus(); w.print();
}
function pickImage(){ imgInput.value=''; imgInput.click(); }
imgInput.addEventListener('change', ()=>{
  const file = imgInput.files[0]; if(!file) return;
  const ph = phUploadTarget; phUploadTarget=null;
  if(ph && ed.contains(ph)){ readImageFileInto(file, ph); return; }
  /* same flow as your file_picker_callback: FileReader → base64
     (in React, feed this into blobCache instead) */
  const fr=new FileReader();
  fr.onload=()=>{ restoreSel();
    document.execCommand('insertHTML',false,
      `<img src="${fr.result}" title="${file.name.replace(/"/g,'')}" alt="">`);
    onChange(); };
  fr.readAsDataURL(file);
});

/* ---------------------------------------------- image upload placeholder */
let phActive=null, phCtx=null, phUploadTarget=null;
function clearImgPlaceholderSel(){
  phCtx?.remove(); phCtx=null;
  phActive?.classList.remove('active'); phActive=null;
}
function imgPhHTML(id){
  return `<div class="img-ph"${id?` id="${id}"`:''} contenteditable="false">${IC.image}<span>${t('dropimage')}</span></div>`;
}
function removeImgPlaceholder(){
  const ph=phActive;
  if(!ph) return;
  clearImgPlaceholderSel();
  /* the placeholder inside a template block IS the media slot — deleting
     it drops the slot entirely, leaving a text-only block */
  (ph.closest('.tpl-media') || ph).remove();
  refreshState(); onChange();
}
function insertImagePlaceholder(){
  restoreSel();
  const id='img-ph-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  document.execCommand('insertHTML',false,imgPhHTML(id));
  const ph=ed.querySelector('#'+id);
  if(ph){ ph.removeAttribute('id'); selectImgPlaceholder(ph); }
  onChange();
}
function selectImgPlaceholder(ph){
  if(phActive===ph) return;
  clearImgPlaceholderSel();
  phActive=ph; ph.classList.add('active');
  phCtx=document.createElement('div');
  phCtx.className='tblctx img-ph-ctx'; phCtx.dir=t('dir');
  document.body.appendChild(phCtx);
  renderPhCtxButtons();
}
function renderPhCtxButtons(){
  if(!phCtx) return;
  phCtx.innerHTML='';
  phCtx.append(
    ctxBtn(IC.uploadic, t('uploadimg'), ()=>{ phUploadTarget=phActive; pickImage(); }),
    ctxBtn(IC.linkic, t('imagelink'), renderPhCtxUrlInput)
  );
  /* a template's media slot is image-first, but can host a video instead */
  if(phActive && phActive.closest('.tpl-media'))
    phCtx.append(ctxBtn(IC.video, t('quickvideo'), ()=>swapPlaceholderKind('video')));
  phCtx.append(ctxSep(), ctxBtn(IC.trash, t('deleteimg'), removeImgPlaceholder));
  positionImgPhCtx();
}
function renderPhCtxUrlInput(){
  if(!phCtx) return;
  phCtx.innerHTML='';
  const inp=document.createElement('input');
  inp.type='url'; inp.className='urlinp'; inp.placeholder=t('imageurlph');
  const ok=document.createElement('button');
  ok.type='button'; ok.className='txtbtn'; ok.textContent=t('insertimg');
  const submit=()=>{
    const url=inp.value.trim(), ph=phActive;
    if(!ph) return;
    if(!/^(https?:|data:image\/|blob:)/i.test(url)){ inp.classList.add('err'); inp.focus(); return; }
    ok.disabled=true; inp.disabled=true;
    /* only place the image once the URL actually loads, so the user gets a
       working preview instead of a broken-image icon */
    const probe=new Image();
    probe.onload=()=>replacePlaceholderWithImage(ph,url,'');
    probe.onerror=()=>{ ok.disabled=false; inp.disabled=false;
      inp.classList.add('err'); inp.focus(); };
    probe.src=url;
  };
  ok.addEventListener('click', submit);
  inp.addEventListener('input', ()=>inp.classList.remove('err'));
  inp.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); submit(); }
    else if(e.key==='Escape'){ e.stopPropagation(); renderPhCtxButtons(); }
  });
  phCtx.append(inp, ok);
  positionImgPhCtx();
  inp.focus();
}
function readImageFileInto(file, ph){
  if(ph.classList.contains('uploading')) return;
  /* set window.fableEditorImageUploadHandler = file => Promise<url> to route
     picked/dropped images to S3 / Azure Blob / your own server instead of
     inlining base64. */
  if(typeof window.fableEditorImageUploadHandler === 'function'){
    uploadImageFile(file, ph, window.fableEditorImageUploadHandler);
    return;
  }
  const fr=new FileReader();
  fr.onload=()=>{ if(ed.contains(ph))
    replacePlaceholderWithImage(ph, fr.result, file.name.replace(/"/g,'')); };
  fr.readAsDataURL(file);
}
function uploadImageFile(file, ph, handler){
  const title = file.name.replace(/"/g,'');
  ph.classList.remove('upload-error');
  ph.classList.add('uploading');
  const span = ph.querySelector('span');
  if(span) span.textContent = t('uploading');
  Promise.resolve().then(()=>handler(file))
    .then(url=>{ if(!ed.contains(ph)) return; replacePlaceholderWithImage(ph, url, title); })
    .catch(err=>{
      if(!ed.contains(ph)) return;
      ph.classList.remove('uploading');
      ph.classList.add('upload-error');
      if(span) span.textContent = t('uploadfailed');
      console.error('image upload failed', err);
    });
}
function replacePlaceholderWithImage(ph, src, title){
  const img=document.createElement('img');
  img.src=src; img.alt=''; if(title) img.title=title;
  ph.replaceWith(img);
  if(phActive===ph) clearImgPlaceholderSel();
  refreshState(); onChange();
}
function positionImgPhCtx(){
  if(phActive && !document.body.contains(phActive)){ clearImgPlaceholderSel(); return; }
  if(!phActive || !phCtx) return;
  const r=phActive.getBoundingClientRect();
  const cw=phCtx.offsetWidth, ch=phCtx.offsetHeight;
  let cx=r.left+scrollX+(r.width-cw)/2;
  cx=Math.max(8+scrollX, Math.min(cx, scrollX+innerWidth-cw-8));
  let cy=r.bottom+scrollY+8;
  if(r.bottom+8+ch>innerHeight-4) cy=Math.max(scrollY+4, r.top+scrollY-ch-8);
  phCtx.style.left=cx+'px';
  phCtx.style.top=cy+'px';
}
ed.addEventListener('mousedown', e=>{
  const ph = e.target.closest && e.target.closest('.img-ph');
  if(ph && ed.contains(ph)){ e.preventDefault(); ed.focus(); selectImgPlaceholder(ph); }
  else clearImgPlaceholderSel();
});
ed.addEventListener('keydown', e=>{
  if((e.key==='Delete'||e.key==='Backspace') && phActive){ e.preventDefault(); removeImgPlaceholder(); }
});
document.addEventListener('mousedown', e=>{
  if(!phActive) return;
  if(ed.contains(e.target) || (phCtx && phCtx.contains(e.target))) return;
  clearImgPlaceholderSel();
});
ed.addEventListener('scroll', positionImgPhCtx);
window.addEventListener('scroll', positionImgPhCtx, true);
window.addEventListener('resize', positionImgPhCtx);
ed.addEventListener('input', positionImgPhCtx);
/* an image file dropped onto the placeholder is consumed; every other drop
   stays blocked by the powerpaste_block_drop handler below */
ed.addEventListener('drop', e=>{
  const ph = e.target.closest && e.target.closest('.img-ph');
  if(!ph || !ed.contains(ph)) return;
  const file=[...(e.dataTransfer?.files||[])].find(f=>f.type.startsWith('image/'));
  if(file) readImageFileInto(file, ph);
});

/* ---------------------------------------------- video upload placeholder */
function pickVideo(){ vidInput.value=''; vidInput.click(); }
vidInput.addEventListener('change', ()=>{
  const file = vidInput.files[0]; if(!file) return;
  const vph = vphUploadTarget; vphUploadTarget=null;
  if(vph && ed.contains(vph)){ readVideoFileInto(file, vph); return; }
  const fr=new FileReader();
  fr.onload=()=>{ restoreSel();
    document.execCommand('insertHTML',false,
      `<video controls src="${fr.result}" title="${file.name.replace(/"/g,'')}"></video>`);
    onChange(); };
  fr.readAsDataURL(file);
});

let vphActive=null, vphCtx=null, vphUploadTarget=null;
function clearVphPlaceholderSel(){
  vphCtx?.remove(); vphCtx=null;
  vphActive?.classList.remove('active'); vphActive=null;
}
function vidPhHTML(id){
  return `<div class="vid-ph"${id?` id="${id}"`:''} contenteditable="false">${IC.video}<span>${t('dropvideo')}</span></div>`;
}
function removeVphPlaceholder(){
  const ph=vphActive;
  if(!ph) return;
  clearVphPlaceholderSel();
  /* like the image variant: a placeholder inside a template block IS the
     media slot — deleting it drops the slot, leaving a text-only block */
  (ph.closest('.tpl-media') || ph).remove();
  refreshState(); onChange();
}
/* swaps a template slot's placeholder between image and video kinds */
function swapPlaceholderKind(to){
  const ph = to==='video' ? phActive : vphActive;
  if(!ph) return;
  const tmp=document.createElement('div');
  tmp.innerHTML = to==='video' ? vidPhHTML() : imgPhHTML();
  const next=tmp.firstElementChild;
  if(to==='video') clearImgPlaceholderSel(); else clearVphPlaceholderSel();
  ph.replaceWith(next);
  if(to==='video') selectVphPlaceholder(next); else selectImgPlaceholder(next);
  onChange();
}
function insertVideoPlaceholder(){
  restoreSel();
  const id='vid-ph-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  document.execCommand('insertHTML',false,vidPhHTML(id));
  const ph=ed.querySelector('#'+id);
  if(ph){ ph.removeAttribute('id'); selectVphPlaceholder(ph); }
  onChange();
}
function selectVphPlaceholder(ph){
  if(vphActive===ph) return;
  clearVphPlaceholderSel();
  vphActive=ph; ph.classList.add('active');
  vphCtx=document.createElement('div');
  vphCtx.className='tblctx img-ph-ctx'; vphCtx.dir=t('dir');
  document.body.appendChild(vphCtx);
  renderVphCtxButtons();
}
function renderVphCtxButtons(){
  if(!vphCtx) return;
  vphCtx.innerHTML='';
  vphCtx.append(
    ctxBtn(IC.uploadic, t('uploadvideo'), ()=>{ vphUploadTarget=vphActive; pickVideo(); }),
    ctxBtn(IC.linkic, t('videolink'), renderVphCtxUrlInput)
  );
  /* inside a template slot, offer switching the slot back to an image */
  if(vphActive && vphActive.closest('.tpl-media'))
    vphCtx.append(ctxBtn(IC.image, t('quickimage'), ()=>swapPlaceholderKind('image')));
  vphCtx.append(ctxSep(), ctxBtn(IC.trash, t('deletevideo'), removeVphPlaceholder));
  positionVphCtx();
}
function renderVphCtxUrlInput(){
  if(!vphCtx) return;
  vphCtx.innerHTML='';
  const inp=document.createElement('input');
  inp.type='url'; inp.className='urlinp'; inp.placeholder=t('videourlph');
  const ok=document.createElement('button');
  ok.type='button'; ok.className='txtbtn'; ok.textContent=t('insertvideo');
  const submit=()=>{
    const url=inp.value.trim(), ph=vphActive;
    if(!ph) return;
    if(!/^(https?:|data:video\/|blob:)/i.test(url)){ inp.classList.add('err'); inp.focus(); return; }
    /* a page URL from a known video host can't play in a <video> tag —
       swap in the host's iframe player instead of probing it */
    const embed=videoEmbedUrl(url);
    if(embed){ replacePlaceholderWithEmbed(ph, embed); return; }
    ok.disabled=true; inp.disabled=true;
    /* only place the video once its metadata actually loads, so the user
       gets a working preview instead of a broken player */
    const probe=document.createElement('video');
    probe.preload='metadata';
    probe.onloadedmetadata=()=>replacePlaceholderWithVideo(ph,url,'');
    probe.onerror=()=>{ ok.disabled=false; inp.disabled=false;
      inp.classList.add('err'); inp.focus(); };
    probe.src=url;
  };
  ok.addEventListener('click', submit);
  inp.addEventListener('input', ()=>inp.classList.remove('err'));
  inp.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); submit(); }
    else if(e.key==='Escape'){ e.stopPropagation(); renderVphCtxButtons(); }
  });
  vphCtx.append(inp, ok);
  positionVphCtx();
  inp.focus();
}
function readVideoFileInto(file, ph){
  if(ph.classList.contains('uploading')) return;
  /* set window.fableEditorVideoUploadHandler = file => Promise<url> to route
     picked/dropped videos to S3 / Azure Blob / your own server instead of
     inlining base64. */
  if(typeof window.fableEditorVideoUploadHandler === 'function'){
    uploadVideoFile(file, ph, window.fableEditorVideoUploadHandler);
    return;
  }
  const fr=new FileReader();
  fr.onload=()=>{ if(ed.contains(ph))
    replacePlaceholderWithVideo(ph, fr.result, file.name.replace(/"/g,'')); };
  fr.readAsDataURL(file);
}
function uploadVideoFile(file, ph, handler){
  const title = file.name.replace(/"/g,'');
  ph.classList.remove('upload-error');
  ph.classList.add('uploading');
  const span = ph.querySelector('span');
  if(span) span.textContent = t('uploading');
  Promise.resolve().then(()=>handler(file))
    .then(url=>{ if(!ed.contains(ph)) return; replacePlaceholderWithVideo(ph, url, title); })
    .catch(err=>{
      if(!ed.contains(ph)) return;
      ph.classList.remove('uploading');
      ph.classList.add('upload-error');
      if(span) span.textContent = t('uploadfailed');
      console.error('video upload failed', err);
    });
}
function replacePlaceholderWithVideo(ph, src, title){
  const vid=document.createElement('video');
  vid.controls=true; vid.src=src; if(title) vid.title=title;
  ph.replaceWith(vid);
  if(vphActive===ph) clearVphPlaceholderSel();
  refreshState(); onChange();
}
function positionVphCtx(){
  if(vphActive && !document.body.contains(vphActive)){ clearVphPlaceholderSel(); return; }
  if(!vphActive || !vphCtx) return;
  const r=vphActive.getBoundingClientRect();
  const cw=vphCtx.offsetWidth, ch=vphCtx.offsetHeight;
  let cx=r.left+scrollX+(r.width-cw)/2;
  cx=Math.max(8+scrollX, Math.min(cx, scrollX+innerWidth-cw-8));
  let cy=r.bottom+scrollY+8;
  if(r.bottom+8+ch>innerHeight-4) cy=Math.max(scrollY+4, r.top+scrollY-ch-8);
  vphCtx.style.left=cx+'px';
  vphCtx.style.top=cy+'px';
}
ed.addEventListener('mousedown', e=>{
  const ph = e.target.closest && e.target.closest('.vid-ph');
  if(ph && ed.contains(ph)){ e.preventDefault(); ed.focus(); selectVphPlaceholder(ph); }
  else clearVphPlaceholderSel();
});
ed.addEventListener('keydown', e=>{
  if((e.key==='Delete'||e.key==='Backspace') && vphActive){ e.preventDefault(); removeVphPlaceholder(); }
});
document.addEventListener('mousedown', e=>{
  if(!vphActive) return;
  if(ed.contains(e.target) || (vphCtx && vphCtx.contains(e.target))) return;
  clearVphPlaceholderSel();
});
ed.addEventListener('scroll', positionVphCtx);
window.addEventListener('scroll', positionVphCtx, true);
window.addEventListener('resize', positionVphCtx);
ed.addEventListener('input', positionVphCtx);
/* a video file dropped onto the placeholder is consumed; every other drop
   stays blocked by the powerpaste_block_drop handler below */
ed.addEventListener('drop', e=>{
  const ph = e.target.closest && e.target.closest('.vid-ph');
  if(!ph || !ed.contains(ph)) return;
  const file=[...(e.dataTransfer?.files||[])].find(f=>f.type.startsWith('video/'));
  if(file) readVideoFileInto(file, ph);
});

/* ---------------------------------------------------------- video dialog / embeds */
/* maps a page URL from a known video host to its iframe player URL;
   null for anything else (e.g. direct .mp4 file URLs) */
function videoEmbedUrl(url){
  let m=url.match(/^https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^\s#]*[?&])?v=([\w-]{5,})/i);
  if(!m) m=url.match(/^https?:\/\/(?:www\.)?(?:youtu\.be|youtube\.com\/(?:embed|shorts|live))\/([\w-]{5,})/i);
  if(m) return 'https://www.youtube.com/embed/'+m[1];
  m=url.match(/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i);
  if(m) return 'https://player.vimeo.com/video/'+m[1];
  m=url.match(/^https?:\/\/(?:www\.)?dailymotion\.com\/video\/(\w+)/i);
  if(m) return 'https://www.dailymotion.com/embed/video/'+m[1];
  return null;
}
function videoEmbedHTML(src, w, h){
  return `<span class="video-embed" contenteditable="false"><iframe src="${src}" width="${w||560}" height="${h||314}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></span>`;
}
function replacePlaceholderWithEmbed(ph, embedUrl){
  const tmp=document.createElement('div');
  tmp.innerHTML=videoEmbedHTML(embedUrl);
  ph.replaceWith(tmp.firstElementChild);
  if(vphActive===ph) clearVphPlaceholderSel();
  refreshState(); onChange();
}
/* insert/edit-video dialog: General (source/width/height), Embed (embed code),
   Advanced (alternative source, poster image) */
function videoDlg(){
  saveSel();
  let srcInp, wInp, hInp, embedTa, altInp, posterInp;
  const field=(labelKey, input)=>{
    const f=document.createElement('div'); f.className='dfield';
    const l=document.createElement('label'); l.textContent=t(labelKey);
    f.append(l, input); return f;
  };
  const urlInput=()=>{ const i=document.createElement('input'); i.type='url'; return i; };
  dialog(t('videodlgttl'), body=>{
    const tabs=document.createElement('div'); tabs.className='dtabs';
    const panels=[];
    const show=i=>{
      [...tabs.querySelectorAll('button')].forEach((x,xi)=>x.classList.toggle('on', xi===i));
      panels.forEach((x,xi)=>x.style.display = xi===i ? '' : 'none');
    };
    const mkTab=(labelKey, build)=>{
      const b=document.createElement('button'); b.type='button'; b.textContent=t(labelKey);
      const p=document.createElement('div'); p.className='dtabpanel';
      build(p);
      const i=panels.length; panels.push(p);
      b.addEventListener('click', ()=>show(i));
      tabs.appendChild(b);
    };
    mkTab('vidgeneral', p=>{
      srcInp=urlInput(); srcInp.placeholder=t('videourlph'); srcInp.style.flex='1';
      const srcRow=document.createElement('div'); srcRow.className='drow';
      const upBtn=document.createElement('button');
      upBtn.type='button'; upBtn.className='txtbtn'; upBtn.textContent=t('uploadvideo');
      const file=document.createElement('input');
      file.type='file'; file.accept='video/mp4,video/webm,video/ogg'; file.style.display='none';
      upBtn.addEventListener('click', ()=>{ file.value=''; file.click(); });
      file.addEventListener('change', ()=>{
        const f=file.files[0]; if(!f) return;
        upBtn.disabled=true; upBtn.textContent=t('uploading');
        const done=url=>{ srcInp.value=url; upBtn.disabled=false; upBtn.textContent=t('uploadvideo'); };
        if(typeof window.fableEditorVideoUploadHandler==='function'){
          Promise.resolve().then(()=>window.fableEditorVideoUploadHandler(f))
            .then(done)
            .catch(err=>{ upBtn.disabled=false; upBtn.textContent=t('uploadfailed');
              console.error('video upload failed', err); });
        }else{
          const fr=new FileReader();
          fr.onload=()=>done(fr.result);
          fr.readAsDataURL(f);
        }
      });
      srcRow.append(srcInp, upBtn, file);
      p.appendChild(field('vidsource', srcRow));
      const dims=document.createElement('div'); dims.className='drow';
      wInp=document.createElement('input'); wInp.type='number'; wInp.value='560';
      hInp=document.createElement('input'); hInp.type='number'; hInp.value='314';
      dims.append(field('tblwidth', wInp), field('tblheight', hInp));
      p.appendChild(dims);
    });
    mkTab('vidembed', p=>{
      const hint=document.createElement('p');
      hint.textContent=t('vidembedhint');
      hint.style.cssText='margin:0 0 8px;color:#556;font-size:13.5px';
      embedTa=document.createElement('textarea');
      embedTa.style.cssText='width:100%;box-sizing:border-box;height:160px';
      p.append(hint, embedTa);
    });
    mkTab('vidadvanced', p=>{
      altInp=urlInput(); posterInp=urlInput();
      p.append(field('vidaltsource', altInp), field('vidposter', posterInp));
    });
    const wrap=document.createElement('div'); wrap.className='dtabbody';
    panels.forEach(p=>wrap.appendChild(p));
    body.append(tabs, wrap);
    show(0);
    setTimeout(()=>srcInp.focus(), 0);
  },[
    {label:t('cancel'),action:closeDlg},
    {label:t('save'),pri:true,action:()=>{
      const embedCode=embedTa.value.trim();
      const src=srcInp.value.trim();
      const w=parseInt(wInp.value,10)||560, h=parseInt(hInp.value,10)||314;
      closeDlg();
      if(!embedCode && !src) return;
      restoreSel();
      if(embedCode){
        document.execCommand('insertHTML',false,
          `<span class="video-embed" contenteditable="false">${embedCode}</span>`);
        onChange(); return;
      }
      const embed=videoEmbedUrl(src);
      if(embed){
        document.execCommand('insertHTML',false,videoEmbedHTML(embed,w,h));
      }else{
        const alt=altInp.value.trim(), poster=posterInp.value.trim();
        document.execCommand('insertHTML',false,
          `<video controls width="${w}" height="${h}"${poster?` poster="${escapeAttr(poster)}"`:''}>`+
          `<source src="${escapeAttr(src)}">${alt?`<source src="${escapeAttr(alt)}">`:''}</video>`);
      }
      onChange();
    }}
  ]);
}
/* selecting an embedded player shows a small delete toolbar (clicks can't
   reach the iframe itself — CSS gives the wrapper the pointer events) */
let embedActive=null, embedCtx=null;
function clearEmbedSel(){
  embedCtx?.remove(); embedCtx=null;
  embedActive?.classList.remove('math-selected'); embedActive=null;
}
function selectEmbedEl(el){
  if(embedActive===el) return;
  clearEmbedSel();
  embedActive=el; el.classList.add('math-selected');
  embedCtx=document.createElement('div');
  embedCtx.className='tblctx img-ph-ctx'; embedCtx.dir=t('dir');
  embedCtx.append(ctxBtn(IC.trash, t('deletevideo'), ()=>{ el.remove(); clearEmbedSel(); onChange(); }));
  document.body.appendChild(embedCtx);
  positionEmbedCtx();
}
function positionEmbedCtx(){
  if(!embedActive || !document.body.contains(embedActive)){ clearEmbedSel(); return; }
  if(!embedCtx) return;
  const r=embedActive.getBoundingClientRect();
  const cw=embedCtx.offsetWidth, ch=embedCtx.offsetHeight;
  let cx=r.left+scrollX+(r.width-cw)/2;
  cx=Math.max(8+scrollX, Math.min(cx, scrollX+innerWidth-cw-8));
  let cy=r.top+scrollY-ch-8;
  if(cy<scrollY+4) cy=r.bottom+scrollY+8;
  embedCtx.style.left=cx+'px';
  embedCtx.style.top=cy+'px';
}
ed.addEventListener('mousedown', e=>{
  const el = e.target.closest && e.target.closest('.video-embed');
  if(el && ed.contains(el)){ e.preventDefault(); selectEmbedEl(el); }
  else clearEmbedSel();
});
document.addEventListener('mousedown', e=>{
  if(!embedActive) return;
  if(ed.contains(e.target) || (embedCtx && embedCtx.contains(e.target))) return;
  clearEmbedSel();
});
ed.addEventListener('scroll', positionEmbedCtx);
window.addEventListener('scroll', positionEmbedCtx, true);
window.addEventListener('resize', positionEmbedCtx);
ed.addEventListener('input', positionEmbedCtx);

/* ---------------------------------------------------------- math / LaTeX formulas */
function escapeAttr(s){ return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }
function unescapeAttr(s){ return s.replace(/&quot;/g,'"').replace(/&amp;/g,'&'); }
function renderMathHTML(latex, block){
  try{ return katex.renderToString(latex, {throwOnError:false, displayMode:block, strict:'ignore'}); }
  catch(e){ return ''; }
}
/* shared by the math dialog, math paste and math typing: renders `src` and
   inserts it at the caret as the standard math element */
function insertMathElement(src, block){
  const latex = block ? `\\begin{aligned}${src}\\end{aligned}` : src;
  const rendered = renderMathHTML(latex, block);
  const tag = block ? 'div' : 'span';
  document.execCommand('insertHTML', false,
    `<${tag} class="math-fable${block?' math-fable-block':''}" contenteditable="false" data-latex="${escapeAttr(src)}">${rendered}</${tag}>`);
}
/* recognizes a plain-text clipboard payload that is entirely one math formula:
   $$…$$ / \[…\] (block), \(…\) (inline), a \begin{…}…\end{…} environment (block),
   or $…$ (inline — only when the inside looks like LaTeX, so "$50" stays text) */
function mathFromClipboard(text){
  const t=text.trim();
  if(!t) return null;
  const block = t.match(/^\$\$([\s\S]+)\$\$$/) || t.match(/^\\\[([\s\S]+)\\\]$/);
  if(block){
    const src=block[1].trim();
    if(!src || src.includes('$')) return null;
    return {latex:joinDerivationLines(src), block:true};
  }
  if(/^\\begin\{[a-zA-Z*]+\}[\s\S]+\\end\{[a-zA-Z*]+\}$/.test(t))
    return {latex:joinDerivationLines(t), block:true};
  const inline = t.match(/^\\\(([\s\S]+)\\\)$/) || t.match(/^\$([^$\n]+)\$$/);
  if(inline){
    const src=inline[1].trim();
    if(!src || src.includes('$')) return null;
    if(t.startsWith('$') && !/[\\^_{}=]/.test(src)) return null;
    return {latex:src, block:false};
  }
  return null;
}
/* a derivation pasted as separate lines has no explicit \\ row breaks — add them */
function joinDerivationLines(src){
  if(!/\n/.test(src)) return src;
  if(/\\\\/.test(src) || /\\begin\{/.test(src)) return src.replace(/\s*\n\s*/g,' ');
  return src.split(/\n+/).map(l=>l.trim()).filter(Boolean).join(' \\\\ ');
}
/* typing "$…$" converts to an inline formula the moment the closing "$" is
   typed; only kicks in when the run parses as valid LaTeX-ish syntax */
function tryMathTyping(e){
  const sel=window.getSelection();
  if(!sel || !sel.isCollapsed || !sel.anchorNode) return;
  const node=sel.anchorNode;
  if(node.nodeType!==3 || !ed.contains(node)) return;
  if(node.parentElement && node.parentElement.closest('.math-fable, pre, code')) return;
  const before=(node.textContent||'').slice(0, sel.anchorOffset);
  const m=before.match(/(?:^|[^\\$])\$([^$]+)$/);
  if(!m) return;
  const src=m[1];
  if(/^\s|\s$/.test(src) || !/[\\^_{}=]/.test(src)) return;
  const rendered=renderMathHTML(src, false);
  if(!rendered || rendered.includes('katex-error')) return;
  e.preventDefault();
  const range=document.createRange();
  range.setStart(node, sel.anchorOffset - src.length - 1);
  range.setEnd(node, sel.anchorOffset);
  sel.removeAllRanges(); sel.addRange(range);
  insertMathElement(src, false);
  onChange();
}
ed.addEventListener('keydown', e=>{
  if(e.key==='$' && !e.ctrlKey && !e.metaKey && !e.altKey) tryMathTyping(e);
});
function mathDlg(existing){
  saveSel();
  const isBlock = existing ? existing.classList.contains('math-fable-block') : false;
  const initialLatex = existing && existing.dataset.latex ? unescapeAttr(existing.dataset.latex) : '';
  let ta, derivChk, preview;
  const updatePreview=()=>{
    const src=ta.value||'', block=derivChk.checked;
    const latex=block?`\\begin{aligned}${src}\\end{aligned}`:src;
    preview.innerHTML = renderMathHTML(latex, block);
  };
  dialog(t('mathdlgttl'), body=>{
    ta=document.createElement('textarea'); ta.value=initialLatex;
    ta.placeholder='e.g. x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';
    ta.style.cssText='width:360px;max-width:100%;min-height:80px;font-family:monospace;font-size:13px';
    const chkRow=document.createElement('label');
    chkRow.style.cssText='display:flex;align-items:center;gap:6px;margin:8px 0;font-size:13.5px;color:#445';
    derivChk=document.createElement('input'); derivChk.type='checkbox'; derivChk.checked=isBlock;
    chkRow.append(derivChk, document.createTextNode(t('mathderivation')));
    preview=document.createElement('div'); preview.className='math-preview';
    preview.style.cssText='min-height:40px;margin-top:8px;padding:10px;border:1px solid #e1e5ea;border-radius:6px;overflow:auto';
    ta.addEventListener('input', updatePreview);
    derivChk.addEventListener('change', updatePreview);
    body.append(ta, chkRow, preview);
    setTimeout(()=>{ ta.focus(); updatePreview(); }, 0);
  },[
    {label:t('cancel'),action:closeDlg},
    {label:t('save'),pri:true,action:()=>{
      const src=ta.value.trim();
      closeDlg();
      if(!src) return;
      const block=derivChk.checked;
      const latex=block?`\\begin{aligned}${src}\\end{aligned}`:src;
      const rendered=renderMathHTML(latex, block);
      const dataLatex=escapeAttr(src);
      if(existing){
        existing.className = block?'math-fable math-fable-block':'math-fable';
        existing.dataset.latex = dataLatex;
        existing.innerHTML = rendered;
        clearMathSel(); onChange();
        return;
      }
      restoreSel();
      const tag = block?'div':'span';
      document.execCommand('insertHTML', false,
        `<${tag} class="math-fable${block?' math-fable-block':''}" contenteditable="false" data-latex="${dataLatex}">${rendered}</${tag}>`);
      onChange();
    }}
  ]);
}
let mathActive=null, mathCtx=null;
function clearMathSel(){
  mathCtx?.remove(); mathCtx=null;
  mathActive?.classList.remove('math-selected'); mathActive=null;
}
function selectMathEl(el){
  if(mathActive===el) return;
  clearMathSel();
  mathActive=el; el.classList.add('math-selected');
  mathCtx=buildMathCtxToolbar(el);
  positionMathCtx();
}
function buildMathCtxToolbar(el){
  const ctx=document.createElement('div'); ctx.className='tblctx img-ph-ctx'; ctx.dir=t('dir');
  ctx.append(
    ctxBtn(IC.editic, t('editmath'), ()=>mathDlg(el)),
    ctxSep(),
    ctxBtn(IC.trash, t('deletemath'), ()=>{ el.remove(); clearMathSel(); onChange(); })
  );
  document.body.appendChild(ctx);
  return ctx;
}
function positionMathCtx(){
  if(!mathActive || !document.body.contains(mathActive)){ clearMathSel(); return; }
  const r=mathActive.getBoundingClientRect();
  if(!mathCtx) return;
  const cw=mathCtx.offsetWidth, ch=mathCtx.offsetHeight;
  let cx=r.left+scrollX+(r.width-cw)/2;
  cx=Math.max(8+scrollX, Math.min(cx, scrollX+innerWidth-cw-8));
  let cy=r.top+scrollY-ch-8;
  if(cy<scrollY+4) cy=r.bottom+scrollY+8;
  mathCtx.style.left=cx+'px';
  mathCtx.style.top=cy+'px';
}
ed.addEventListener('mousedown', e=>{
  const el = e.target.closest && e.target.closest('.math-fable');
  if(el && ed.contains(el)){ e.preventDefault(); selectMathEl(el); }
  else clearMathSel();
});
document.addEventListener('mousedown', e=>{
  if(!mathActive) return;
  if(ed.contains(e.target) || (mathCtx && mathCtx.contains(e.target))) return;
  clearMathSel();
});
ed.addEventListener('scroll', positionMathCtx);
window.addEventListener('scroll', positionMathCtx, true);
window.addEventListener('resize', positionMathCtx);
ed.addEventListener('input', positionMathCtx);

/* ---------------------------------------------------------- templates */
const TPL_LAYOUTS=['img-left','img-right','img-top','img-center'];
const TPL_LABEL={'img-left':'tplimgleft','img-right':'tplimgright','img-top':'tplimgtop','img-center':'tplimgcenter'};
const TPL_ICON={'img-left':'tplleft','img-right':'tplright','img-top':'tpltop','img-center':'tplcenter'};
let tplActive=null, tplCtx=null;

/* miniature div-based mockup of a layout, mirroring what the block looks
   like in the editor: grey box = image slot, bars = heading/paragraph */
function tplPreviewHTML(layout){
  const img='<span class="pv-img"></span>';
  const head='<span class="pv-h"></span>';
  const line=w=>`<span class="pv-l" style="width:${w}%"></span>`;
  const col=inner=>`<span class="pv-col">${inner}</span>`;
  const row=inner=>`<span class="pv-row">${inner}</span>`;
  const textCol=col(head+line(100)+line(88));
  if(layout==='img-left')  return `<span class="pv">${row(img+textCol)}${line(100)}${line(72)}</span>`;
  if(layout==='img-right') return `<span class="pv">${row(textCol+img)}${line(100)}${line(72)}</span>`;
  if(layout==='img-top')   return `<span class="pv pv-c">${img}${head}${line(100)}${line(72)}</span>`;
  return `<span class="pv pv-c">${head}${line(100)}${line(72)}${img}</span>`;
}
function buildTemplatePickInto(el){
  const wrap=document.createElement('div');
  wrap.className='tplpick';
  TPL_LAYOUTS.forEach(layout=>{
    const tile=document.createElement('button');
    tile.type='button'; tile.className='tpltile'; tile.title=t(TPL_LABEL[layout]);
    tile.innerHTML=tplPreviewHTML(layout)+`<span class="tpllbl">${t(TPL_LABEL[layout])}</span>`;
    tile.addEventListener('click',()=>{ closePop(); insertTemplate(layout); });
    wrap.appendChild(tile);
  });
  el.appendChild(wrap);
}
function templateMenu(anchor){ popup(anchor, buildTemplatePickInto); }
function insertTemplate(layout){
  restoreSel();
  const media=`<div class="tpl-media" contenteditable="false">${imgPhHTML()}</div>`;
  const text=`<div class="tpl-text"><h2>${t('heading')}</h2><p>${t('para')}</p></div>`;
  /* text-above-image layout keeps DOM order = visual order so the caret
     travels naturally; every other layout has the media slot first */
  const inner = layout==='img-center' ? text+media : media+text;
  document.execCommand('insertHTML',false,`<div class="tpl tpl-${layout}">${inner}</div><p><br></p>`);
  saveSel(); onChange();
}
function clearTplSel(){
  tplCtx?.remove(); tplCtx=null;
  tplActive?.classList.remove('tpl-selected'); tplActive=null;
}
function selectTemplate(tpl){
  if(tplActive===tpl) return;
  clearTplSel();
  tplActive=tpl; tpl.classList.add('tpl-selected');
  tplCtx=document.createElement('div');
  tplCtx.className='tblctx tplctx'; tplCtx.dir=t('dir');
  document.body.appendChild(tplCtx);
  renderTplCtxButtons();
}
function renderTplCtxButtons(){
  if(!tplCtx || !tplActive) return;
  tplCtx.innerHTML='';
  TPL_LAYOUTS.forEach(layout=>{
    const b=ctxBtn(IC[TPL_ICON[layout]], t(TPL_LABEL[layout]), ()=>setTplLayout(layout));
    b.classList.toggle('on', tplActive.classList.contains('tpl-'+layout));
    tplCtx.appendChild(b);
  });
  tplCtx.append(ctxSep(), ctxBtn(IC.trash, t('deltemplate'), removeTemplate));
  positionTplCtx();
}
function setTplLayout(layout){
  const tpl=tplActive;
  if(!tpl) return;
  TPL_LAYOUTS.forEach(l=>tpl.classList.remove('tpl-'+l));
  tpl.classList.add('tpl-'+layout);
  /* keep DOM order = visual order (see insertTemplate) */
  const media=tpl.querySelector(':scope > .tpl-media');
  const text=tpl.querySelector(':scope > .tpl-text');
  if(media && text){
    if(layout==='img-center') tpl.appendChild(media);
    else tpl.insertBefore(media, text);
  }
  renderTplCtxButtons();
  positionImgPhCtx();
  onChange();
}
function removeTemplate(){
  const tpl=tplActive;
  if(!tpl) return;
  clearTplSel();
  if(phActive && tpl.contains(phActive)) clearImgPlaceholderSel();
  tpl.remove();
  refreshState(); onChange();
}
function positionTplCtx(){
  if(tplActive && !document.body.contains(tplActive)){ clearTplSel(); return; }
  if(!tplActive || !tplCtx) return;
  const r=tplActive.getBoundingClientRect();
  const cw=tplCtx.offsetWidth, ch=tplCtx.offsetHeight;
  let cx=r.left+scrollX+(r.width-cw)/2;
  cx=Math.max(8+scrollX, Math.min(cx, scrollX+innerWidth-cw-8));
  let cy=r.top+scrollY-ch-8;
  if(cy<scrollY+4) cy=r.bottom+scrollY+8;
  tplCtx.style.left=cx+'px';
  tplCtx.style.top=cy+'px';
}
ed.addEventListener('mousedown', e=>{
  const tpl = e.target.closest && e.target.closest('.tpl');
  if(tpl && ed.contains(tpl)) selectTemplate(tpl);
  else clearTplSel();
});
document.addEventListener('mousedown', e=>{
  if(!tplActive) return;
  if(ed.contains(e.target) || (tplCtx && tplCtx.contains(e.target))) return;
  clearTplSel();
});
ed.addEventListener('scroll', positionTplCtx);
window.addEventListener('scroll', positionTplCtx, true);
window.addEventListener('resize', positionTplCtx);
ed.addEventListener('input', positionTplCtx);

/* ---------------------------------------------------------- fullscreen / resize */
function toggleFullscreen(){
  shell.classList.toggle('fullscreen');
  const b=toolbar.querySelector('[data-id=fullscreen]');
  b?.classList.toggle('on', shell.classList.contains('fullscreen'));
  positionTableHandles();
}
(function(){
  const grip=document.getElementById('grip');
  let startY=0,startH=0;
  grip.addEventListener('mousedown',e=>{
    startY=e.clientY; startH=ed.offsetHeight; e.preventDefault();
    const mv=ev=>{ ed.style.height=Math.max(120,startH+ev.clientY-startY)+'px'; };
    const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);};
    addEventListener('mousemove',mv); addEventListener('mouseup',up);
  });
})();

/* ---------------------------------------------------------- table object resizing */
let tblActive=null, tblCorner=null, tblColBars=[], tblCtx=null;
let tblCellMark=null, tblOpMark=null, tblOpMarkKind=null;
function clearTableHandles(){
  tblCorner?.remove(); tblCorner=null;
  tblColBars.forEach(b=>b.remove()); tblColBars=[];
  tblCtx?.remove(); tblCtx=null;
  tblCellMark?.remove(); tblCellMark=null;
  tblOpMark?.remove(); tblOpMark=null; tblOpMarkKind=null;
  tblActive?.classList.remove('tbl-selected');
  tblActive=null;
}
function currentCell(){
  let node = savedRange ? savedRange.startContainer : null;
  if(!node || !ed.contains(node)){
    const s=window.getSelection();
    node = s && ed.contains(s.anchorNode) ? s.anchorNode : null;
  }
  while(node && node!==ed){
    if(node.nodeType===1 && /^(TD|TH)$/.test(node.tagName)) return node;
    node=node.parentNode;
  }
  return null;
}
/* border around the cell that holds the caret, so it is clear which
   cell / row / column the table operations will target */
function positionCellMarker(){
  if(!tblCellMark) return;
  const cell=currentCell();
  if(!cell || !tblActive || cell.closest('table')!==tblActive){
    tblCellMark.style.display='none'; return;
  }
  const r=cell.getBoundingClientRect();
  tblCellMark.style.display='block';
  tblCellMark.style.left=(r.left+scrollX)+'px';
  tblCellMark.style.top=(r.top+scrollY)+'px';
  tblCellMark.style.width=r.width+'px';
  tblCellMark.style.height=r.height+'px';
}
/* dashed highlight over the row/column a hovered operation targets */
function setOpTarget(kind){ tblOpMarkKind=kind; positionOpMark(); }
function positionOpMark(){
  const kind=tblOpMarkKind;
  const cell=kind?currentCell():null;
  if(!kind || !cell || !tblActive || cell.closest('table')!==tblActive){
    tblOpMark?.remove(); tblOpMark=null; return;
  }
  if(!tblOpMark){
    tblOpMark=document.createElement('div');
    tblOpMark.className='tbl-opmark';
    document.body.appendChild(tblOpMark);
  }
  const tr=tblActive.getBoundingClientRect();
  const cr=cell.getBoundingClientRect();
  const rr=cell.parentElement.getBoundingClientRect();
  tblOpMark.style.left=((kind==='row'?rr.left:cr.left)+scrollX)+'px';
  tblOpMark.style.top=((kind==='row'?rr.top:tr.top)+scrollY)+'px';
  tblOpMark.style.width=(kind==='row'?rr.width:cr.width)+'px';
  tblOpMark.style.height=(kind==='row'?rr.height:tr.height)+'px';
}
function ctxBtn(icon, tip, fn){
  const b=document.createElement('button'); b.type='button'; b.title=tip; b.innerHTML=icon;
  b.addEventListener('mousedown', e=>e.preventDefault());
  b.addEventListener('click', fn);
  return b;
}
function ctxSep(){ const s=document.createElement('div'); s.className='sep'; return s; }
function buildTableCtxToolbar(){
  const el=document.createElement('div'); el.className='tblctx'; el.dir=t('dir');
  /* hovering a row/column button highlights the row/column it targets */
  const hl=(b,kind)=>{
    b.addEventListener('mouseenter', ()=>setOpTarget(kind));
    b.addEventListener('mouseleave', ()=>setOpTarget(null));
    return b;
  };
  el.append(
    hl(ctxBtn(IC.rowbefore, t('rowabove'), ()=>tableOp('rowabove')),'row'),
    hl(ctxBtn(IC.rowafter, t('rowbelow'), ()=>tableOp('rowbelow')),'row'),
    hl(ctxBtn(IC.rowdelete, t('delrow'), ()=>tableOp('delrow')),'row'),
    ctxSep(),
    hl(ctxBtn(IC.colbefore, t('colbefore'), ()=>tableOp('colbefore')),'col'),
    hl(ctxBtn(IC.colafter, t('colafter'), ()=>tableOp('colafter')),'col'),
    hl(ctxBtn(IC.coldelete, t('delcol'), ()=>tableOp('delcol')),'col'),
    ctxSep(),
    ctxBtn(IC.trash, t('deltable'), ()=>tableOp('deltable')),
    ctxBtn(IC.tableic, t('tablepropsttl'), ()=>tablePropsDlg())
  );
  document.body.appendChild(el);
  return el;
}
function positionTableHandles(){
  if(!tblActive || !document.body.contains(tblActive)){ clearTableHandles(); return; }
  const rtl = ed.getAttribute('dir')==='rtl';
  const r = tblActive.getBoundingClientRect();
  const top = r.top+scrollY, left = r.left+scrollX,
        right = r.right+scrollX, bottom = r.bottom+scrollY;
  if(tblCorner){
    tblCorner.style.top = (bottom-5)+'px';
    tblCorner.style.left = (rtl ? left-5 : right-5)+'px';
    tblCorner.style.cursor = rtl ? 'nesw-resize' : 'nwse-resize';
  }
  if(tblCtx){
    const cw=tblCtx.offsetWidth, ch=tblCtx.offsetHeight;
    let cx = left + (right-left)/2 - cw/2;
    cx = Math.max(8+scrollX, Math.min(cx, scrollX+innerWidth-cw-8));
    let cy = top - ch - 8;
    if(cy < scrollY+4) cy = bottom + 8;
    tblCtx.style.left = cx+'px';
    tblCtx.style.top = cy+'px';
  }
  tblColBars.forEach(b=>b.remove()); tblColBars=[];
  const row = tblActive.rows[0];
  if(row){
    for(let i=0;i<row.cells.length-1;i++){
      const rA=row.cells[i].getBoundingClientRect();
      /* in RTL, column i sits physically to the right of column i+1 */
      const boundaryX = (rtl ? rA.left : rA.right) + scrollX;
      const bar=document.createElement('div');
      bar.className='tbl-colbar';
      bar.style.top=top+'px';
      bar.style.left=boundaryX+'px';
      bar.style.height=(bottom-top)+'px';
      document.body.appendChild(bar);
      bar.addEventListener('mousedown', e=>startColBarDrag(e,i));
      tblColBars.push(bar);
    }
  }
  positionCellMarker();
  positionOpMark();
}
function selectTableForResize(table){
  if(tblActive===table) return;
  clearTableHandles();
  tblActive=table;
  table.classList.add('tbl-selected');
  tblCorner=document.createElement('div');
  tblCorner.className='tbl-handle';
  document.body.appendChild(tblCorner);
  tblCorner.addEventListener('mousedown', startTableCornerDrag);
  tblCellMark=document.createElement('div');
  tblCellMark.className='tbl-cellmark';
  tblCellMark.style.display='none';
  document.body.appendChild(tblCellMark);
  tblCtx=buildTableCtxToolbar();
  positionTableHandles();
}
function withNoTextSelect(fn){
  const prev = document.body.style.userSelect;
  document.body.style.userSelect = 'none';
  fn(()=>{ document.body.style.userSelect = prev; });
}
function startTableCornerDrag(e){
  e.preventDefault();
  const table=tblActive; if(!table) return;
  const rtl = ed.getAttribute('dir')==='rtl';
  const startX=e.clientX, startW=table.getBoundingClientRect().width;
  table.style.tableLayout = table.style.tableLayout || 'fixed';
  withNoTextSelect(restore=>{
    const mv=ev=>{
      const dx = rtl ? -(ev.clientX-startX) : (ev.clientX-startX);
      table.style.width = Math.max(60, Math.round(startW+dx))+'px';
      positionTableHandles();
    };
    const up=()=>{ removeEventListener('mousemove',mv); removeEventListener('mouseup',up);
      restore(); onChange(); };
    addEventListener('mousemove',mv); addEventListener('mouseup',up);
  });
}
function startColBarDrag(e,i){
  e.preventDefault(); e.stopPropagation();
  const table=tblActive; if(!table) return;
  const rtl = ed.getAttribute('dir')==='rtl';
  const rows=[...table.rows];
  const colA=rows.map(r=>r.cells[i]).filter(Boolean);
  const colB=rows.map(r=>r.cells[i+1]).filter(Boolean);
  if(!colA.length||!colB.length) return;
  const startX=e.clientX;
  const wA=colA[0].getBoundingClientRect().width, wB=colB[0].getBoundingClientRect().width;
  table.style.tableLayout='fixed';
  withNoTextSelect(restore=>{
    const mv=ev=>{
      const dx=(rtl ? -1 : 1)*(ev.clientX-startX);
      colA.forEach(c=>c.style.width=Math.max(24,Math.round(wA+dx))+'px');
      colB.forEach(c=>c.style.width=Math.max(24,Math.round(wB-dx))+'px');
      positionTableHandles();
    };
    const up=()=>{ removeEventListener('mousemove',mv); removeEventListener('mouseup',up);
      restore(); onChange(); };
    addEventListener('mousemove',mv); addEventListener('mouseup',up);
  });
}
ed.addEventListener('mousedown', e=>{
  const table = e.target.closest && e.target.closest('table');
  if(table && ed.contains(table)) selectTableForResize(table);
  else clearTableHandles();
});
document.addEventListener('mousedown', e=>{
  if(ed.contains(e.target) || e.target===tblCorner || tblColBars.includes(e.target)
     || (tblCtx && tblCtx.contains(e.target))) return;
  clearTableHandles();
});
ed.addEventListener('scroll', positionTableHandles);
window.addEventListener('scroll', positionTableHandles, true);
window.addEventListener('resize', positionTableHandles);
ed.addEventListener('input', positionTableHandles);

/* ---------------------------------------------------------- state sync */
function currentBlock(){
  const s=window.getSelection();
  if(!s.anchorNode||!ed.contains(s.anchorNode)) return 'p';
  const b=closestBlock(s.anchorNode);
  return b ? b.tagName.toLowerCase().replace('div','p') : 'p';
}
function currentFont(){
  const s=window.getSelection();
  if(!s.anchorNode||!ed.contains(s.anchorNode)) return '';
  const el=s.anchorNode.nodeType===1?s.anchorNode:s.anchorNode.parentElement;
  const fam=getComputedStyle(el).fontFamily.toLowerCase();
  const hit=FONTS.find(([n,v])=>fam.includes(v.split(',')[0].toLowerCase()));
  return hit?hit[0]:'';
}
function currentSize(){
  const s=window.getSelection();
  if(!s.anchorNode||!ed.contains(s.anchorNode)) return '';
  const el=s.anchorNode.nodeType===1?s.anchorNode:s.anchorNode.parentElement;
  const pt=(parseFloat(getComputedStyle(el).fontSize)*0.75).toFixed(1).replace(/\.0$/,'');
  return SIZES.includes(pt+'pt') ? pt+'pt' : '';
}
function refreshState(){
  const inEd = ed.contains(window.getSelection().anchorNode);
  ['bold','italic','underline','strikeThrough','justifyLeft','justifyCenter',
   'justifyRight','justifyFull','insertOrderedList','insertUnorderedList']
   .forEach(c=>{
     const b=toolbar.querySelector(`[data-id=${c}]`);
     if(b) b.classList.toggle('on', inEd && document.queryCommandState(c));
   });
  const blk=closestBlock(window.getSelection().anchorNode);
  const dir = blk?.closest('[dir]')?.getAttribute('dir') || ed.getAttribute('dir') || t('dir');
  toolbar.querySelector('[data-id=ltr]')?.classList.toggle('on', inEd&&dir==='ltr');
  toolbar.querySelector('[data-id=rtl]')?.classList.toggle('on', inEd&&dir==='rtl');
  const setLbl=(id,val,def)=>{
    const l=toolbar.querySelector(`[data-id=${id}] .lbl`); if(!l)return;
    l.textContent = val||def||''; l.classList.toggle('empty',!val);
  };
  if(inEd){
    setLbl('fontsel',currentFont());
    setLbl('sizesel',currentSize());
    const blkTag=currentBlock();
    setLbl('blocksel', BLOCKS.some(b=>b[0]===blkTag)?blockLabel(blkTag):t('para'));
  }
  sbWords.textContent = countWords()+' '+t('words');
}
function countWords(){
  const txt=ed.innerText.trim();
  return txt ? txt.split(/\s+/).length : 0;
}
document.addEventListener('selectionchange', ()=>{
  if(ed.contains(window.getSelection().anchorNode)){ saveSel(); refreshState(); positionCellMarker(); }
});
ed.addEventListener('input', ()=>{ refreshState(); onChange(); });
ed.addEventListener('keydown', e=>{
  if(e.altKey && e.key==='0'){ e.preventDefault(); helpDlg(); }
});
function onChange(){
  /* == your onEditorChange — hook here in React port == */
  /* console.log(getContent()); */
}
window.getContent = ()=>ed.innerHTML;
window.setContent = h=>{ ed.innerHTML=h||'<p><br></p>'; refreshState(); clearTableHandles(); };

/* =====================================================================
   POWERPASTE ENGINE  (Word / Google Docs / Excel clean paste)
   ===================================================================== */
const ALLOWED_TAGS = new Set(['p','div','span','br','hr','a','b','strong','i','em','u',
 's','strike','sub','sup','h1','h2','h3','h4','h5','h6','blockquote','pre','code',
 'ul','ol','li','table','thead','tbody','tfoot','tr','td','th','caption','colgroup',
 'col','img','figure','figcaption','mark']);
const ALLOWED_STYLES = new Set(['text-align','direction','unicode-bidi','font-weight',
 'font-style','text-decoration','text-decoration-line','color','background-color',
 'background','background-image','background-position','background-repeat','background-size',
 'font-size','font-family','line-height','letter-spacing','vertical-align',
 'text-indent','margin','margin-top','margin-bottom','margin-left','margin-right',
 'margin-inline-start','margin-inline-end',
 'padding','padding-top','padding-bottom','padding-left','padding-right',
 'width','height','min-width','max-width','min-height','max-height',
 'border','border-top','border-right','border-bottom','border-left',
 'border-color','border-style','border-width','border-radius','border-collapse',
 'border-spacing','table-layout','float','display','box-sizing',
 'list-style-type','white-space']);
const ALLOWED_ATTRS = {'*':['dir','lang','colspan','rowspan'],
 a:['href','target','rel','title'], img:['src','alt','width','height','title'],
 col:['span','width'], td:['width','valign'], th:['width','valign'],
 table:['width','cellpadding','cellspacing']};

function preClean(html){
  return html
    /* keep Word list markers: unwrap the supportLists conditional so the
       mso-list:Ignore span (the "1." / "•" marker) survives for
       rebuildWordLists to inspect — stripping it made every list a <ul> */
    .replace(/<!--\[if !supportLists\]-->([\s\S]*?)<!--\[endif\]-->/gi,'$1')
    .replace(/<!--\[if !supportLists\]>([\s\S]*?)<!\[endif\]-->/gi,'$1')
    .replace(/<!\[if !supportLists\]>([\s\S]*?)<!\[endif\]>/gi,'$1')
    .replace(/<!--\[if [\s\S]*?<!\[endif\]-->/gi,'')
    .replace(/<!--[\s\S]*?-->/g,'')
    .replace(/<(script|style|xml|title)[\s\S]*?<\/\1>/gi,'')
    .replace(/<\/?(meta|link)[^>]*>/gi,'')
    .replace(/<\?xml[\s\S]*?\?>/gi,'')
    .replace(/<\/?(o|v|w|m|st1):[^>]*>/gi,'');
}
function styleMap(el){
  const map={}, raw=el.getAttribute&&el.getAttribute('style');
  if(!raw) return map;
  raw.split(';').forEach(p=>{ const i=p.indexOf(':'); if(i<1)return;
    map[p.slice(0,i).trim().toLowerCase()]=p.slice(i+1).trim(); });
  return map;
}
/* classify a Word list marker ("1." "أ." "١." "iv)" "•" …) so ordered
   lists — Latin AND Arabic numbering — round-trip instead of all
   collapsing into bullets */
function markerType(mt){
  if(/^[0-9]+[\.\)،]/.test(mt))                    return {ordered:true};
  if(/^[٠-٩۰-۹]+/.test(mt))         return {ordered:true, style:'arabic-indic'};
  if(/^[ivxlc]{2,}[\.\)]/.test(mt))                     return {ordered:true, style:'lower-roman'};
  if(/^[IVXLC]{2,}[\.\)]/.test(mt))                     return {ordered:true, style:'upper-roman'};
  if(/^[a-z][\.\)]/.test(mt))                           return {ordered:true, style:'lower-alpha'};
  if(/^[A-Z][\.\)]/.test(mt))                           return {ordered:true, style:'upper-alpha'};
  if(/^[ء-ي][\.\)،-]/.test(mt))          return {ordered:true, style:'arabic-indic'};
  return {ordered:false};
}
function rebuildWordLists(doc){
  const isListP = p=>{
    const s=(p.getAttribute('style')||'')+' '+(p.className||'');
    return /mso-list\s*:(?!\s*ignore)/i.test(s)||/MsoListParagraph/i.test(s);
  };
  const groups=[]; let cur=null;
  [...doc.body.querySelectorAll('p')].forEach(p=>{
    if(!isListP(p)){ cur=null; return; }
    const prev=p.previousElementSibling;
    if(cur&&prev&&cur[cur.length-1]===prev) cur.push(p);
    else{ cur=[p]; groups.push(cur); }
  });
  groups.forEach(group=>{
    const stack=[], rootAnchor=group[0];
    group.forEach(p=>{
      const style=p.getAttribute('style')||'';
      const level=+(style.match(/level(\d+)/i)?.[1]||1);
      const marker=[...p.querySelectorAll('span')].find(sp=>
        /mso-list\s*:\s*ignore/i.test(sp.getAttribute('style')||''));
      const mt=marker?marker.textContent.trim()
             :(p.textContent.trim().match(/^\S{1,4}/)||[''])[0];
      const {ordered, style: listStyle}=markerType(mt);
      if(marker) marker.remove();
      while(stack.length&&stack[stack.length-1].level>level) stack.pop();
      if(!stack.length||stack[stack.length-1].level<level){
        const list=doc.createElement(ordered?'ol':'ul');
        if(ordered&&listStyle) list.style.listStyleType=listStyle;
        if(stack.length){ const par=stack[stack.length-1].list;
          (par.lastElementChild||par).appendChild(list); }
        else rootAnchor.parentNode.insertBefore(list,rootAnchor);
        stack.push({list,level});
      }
      const li=doc.createElement('li');
      const keep=styleMap(p);
      const kept=['text-align','direction','unicode-bidi','color','font-size',
        'font-family','background-color'].filter(k=>keep[k])
        .map(k=>k+':'+keep[k]).join(';');
      if(kept) li.setAttribute('style',kept);
      if(p.getAttribute('dir')) li.setAttribute('dir',p.getAttribute('dir'));
      while(p.firstChild) li.appendChild(p.firstChild);
      stack[stack.length-1].list.appendChild(li);
      p.remove();
    });
  });
}
function fixGoogleDocs(doc){
  doc.querySelectorAll('b[id^="docs-internal-guid"]').forEach(b=>{
    while(b.firstChild) b.parentNode.insertBefore(b.firstChild,b);
    b.remove();
  });
}
function fixLegacyAttrs(doc){
  doc.querySelectorAll('table').forEach(tb=>{
    if(!styleMap(tb)['border-collapse']) tb.style.borderCollapse='collapse';
  });
  doc.querySelectorAll('[align]').forEach(el=>{
    const v=el.getAttribute('align').toLowerCase();
    if(el.tagName.toLowerCase()==='table'){
      /* align on a table centers the block itself, not its inline content */
      if(v==='center'){ el.style.marginLeft=el.style.marginLeft||'auto'; el.style.marginRight=el.style.marginRight||'auto'; }
      else if(v==='right') el.style.marginLeft=el.style.marginLeft||'auto';
      else if(v==='left') el.style.marginRight=el.style.marginRight||'auto';
    } else if(['left','right','center','justify'].includes(v)){
      el.style.textAlign=el.style.textAlign||v;
      /* Word aligns tables via <div align=...>; text-align cannot move a
         table box, so mirror the alignment onto the table margins */
      Array.from(el.children).forEach(ch=>{
        if(ch.tagName.toLowerCase()!=='table') return;
        if(v==='center'){ ch.style.marginLeft=ch.style.marginLeft||'auto'; ch.style.marginRight=ch.style.marginRight||'auto'; }
        else if(v==='right') ch.style.marginLeft=ch.style.marginLeft||'auto';
        else if(v==='left') ch.style.marginRight=ch.style.marginRight||'auto';
      });
    }
    el.removeAttribute('align');
  });
  /* <center> gets unwrapped by sanitize — keep tables inside it centered */
  doc.querySelectorAll('center table').forEach(tb=>{
    tb.style.marginLeft=tb.style.marginLeft||'auto';
    tb.style.marginRight=tb.style.marginRight||'auto';
  });
  doc.querySelectorAll('[bgcolor]').forEach(el=>{
    el.style.backgroundColor=el.style.backgroundColor||el.getAttribute('bgcolor');
    el.removeAttribute('bgcolor');
  });
}
function sanitize(node,doc){
  [...node.childNodes].forEach(child=>{
    if(child.nodeType===Node.COMMENT_NODE){ child.remove(); return; }
    if(child.nodeType!==Node.ELEMENT_NODE) return;
    const tag=child.tagName.toLowerCase();
    if(!ALLOWED_TAGS.has(tag)){
      if(tag==='font'){
        const span=doc.createElement('span');
        /* keep the style attr too — Word/LibreOffice put the real size there
           (<font size="4" style="font-size:14pt">) */
        if(child.getAttribute('style')) span.setAttribute('style',child.getAttribute('style'));
        if(child.getAttribute('color')) span.style.color=child.getAttribute('color');
        if(child.getAttribute('face')) span.style.fontFamily=child.getAttribute('face');
        const sz=child.getAttribute('size');
        if(sz&&!span.style.fontSize){
          const szMap={1:'8pt',2:'10pt',3:'12pt',4:'14pt',5:'18pt',6:'24pt',7:'36pt'};
          if(szMap[sz]) span.style.fontSize=szMap[sz];
        }
        while(child.firstChild) span.appendChild(child.firstChild);
        child.replaceWith(span); sanitize(span,doc); return;
      }
      sanitize(child,doc);
      while(child.firstChild) child.parentNode.insertBefore(child.firstChild,child);
      child.remove(); return;
    }
    const allowed=new Set([...(ALLOWED_ATTRS['*']||[]),...(ALLOWED_ATTRS[tag]||[])]);
    [...child.attributes].forEach(a=>{
      const n=a.name.toLowerCase();
      if(n!=='style'&&!allowed.has(n)) child.removeAttribute(a.name);
    });
    if(tag==='a'){
      const href=child.getAttribute('href')||'';
      if(!/^(https?:|mailto:|tel:|#)/i.test(href)) child.removeAttribute('href');
    }
    if(tag==='img'){
      const src=child.getAttribute('src')||'';
      /* powerpaste_allow_local_images:true → keep data: URIs;
         Word file:// refs are unreadable by the browser → placeholder */
      if(!/^(https?:|data:image\/|blob:)/i.test(src)){
        const ph=doc.createElement('span');
        ph.textContent='[local image — paste it separately]';
        ph.setAttribute('style','color:#a33;font-style:italic;font-size:12px');
        child.replaceWith(ph); return;
      }
    }
    const styles=styleMap(child), kept=[];
    for(const [k,v] of Object.entries(styles)){
      if(!ALLOWED_STYLES.has(k)) continue;
      if(/expression|javascript|url\s*\(\s*['"]?\s*file:/i.test(v)) continue;
      if(k==='font-weight'&&/^(400|normal)$/i.test(v)) continue;
      if(k==='font-style'&&/^normal$/i.test(v)) continue;
      if(k==='text-decoration'&&/^none$/i.test(v)) continue;
      kept.push(k+':'+v);
    }
    if(kept.length) child.setAttribute('style',kept.join(';'));
    else child.removeAttribute('style');
    child.removeAttribute('class');
    sanitize(child,doc);
    if(tag==='span'&&!child.attributes.length){
      while(child.firstChild) child.parentNode.insertBefore(child.firstChild,child);
      child.remove();
    }
  });
}
/* Word / Outlook / Excel keep most of the document's look (font, size,
   color, cell shading) in a <style> sheet + classes, not inline.
   PowerPaste inlines that sheet before cleaning — do the same, else the
   paste loses the copied document's formatting. */
function extractStyleRules(raw){
  const rules=[]; const re=/<style[^>]*>([\s\S]*?)<\/style>/gi; let m;
  while((m=re.exec(raw))){
    let css=m[1].replace(/<!--|-->/g,'').replace(/\/\*[\s\S]*?\*\//g,'');
    css=css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/gi,'');
    css=css.replace(/@[\w-]+[^{]*\{[^{}]*\}/g,'');           /* @page, @font-face, @list… */
    let rm; const rre=/([^{}]+)\{([^}]*)\}/g;
    while((rm=rre.exec(css))){
      const decls=rm[2].split(';').map(d=>{
        const i=d.indexOf(':'); if(i<1) return null;
        return [d.slice(0,i).trim().toLowerCase(), d.slice(i+1).trim()];
      }).filter(d=>d&&d[1]);
      if(!decls.length) continue;
      rm[1].split(',').map(s=>s.trim()).filter(s=>s&&!s.startsWith('@'))
        .forEach(sel=>rules.push({sel,decls}));
    }
  }
  return rules;
}
function applyStyleRules(doc, rules){
  if(!rules.length) return;
  const addMap=new Map();
  rules.forEach(({sel,decls})=>{
    let els; try{ els=doc.querySelectorAll(sel); }catch(e){ return; }
    els.forEach(el=>{
      let m=addMap.get(el); if(!m){ m={}; addMap.set(el,m); }
      decls.forEach(([k,v])=>{ m[k]=v; });   /* later rules win */
    });
  });
  addMap.forEach((m,el)=>{
    const have=styleMap(el);                  /* inline style always wins */
    /* presentational attributes (dir / align / bgcolor) carry the author's
       per-element intent — a generic sheet rule like LibreOffice's
       `p { direction:ltr; text-align:left }` must NOT override them, or an
       Arabic document flips to left-aligned LTR on paste */
    const hasDir=el.hasAttribute('dir'), hasAlign=el.hasAttribute('align');
    const add=Object.entries(m).filter(([k])=>{
      if(k in have) return false;
      if((k==='direction'||k==='unicode-bidi') && hasDir) return false;
      if(k==='text-align' && (hasAlign||hasDir)) return false;
      if((k==='background'||k==='background-color') && el.hasAttribute('bgcolor')) return false;
      return true;
    });
    if(!add.length) return;
    const prefix=add.map(([k,v])=>k+':'+v).join(';');
    const cur=el.getAttribute('style');
    el.setAttribute('style', cur ? prefix+';'+cur : prefix);
  });
}
/* Text copied out of PDFs arrives as Arabic *presentation-form* glyphs
   (U+FB50–U+FDFF / U+FE70–U+FEFE) instead of real letters, which breaks
   shaping, search and editing. NFKC-normalize just those runs. */
function normalizeArabicPresentation(s){
  return s.replace(/[ﭐ-﷿ﹰ-ﻼ]+/g, m=>m.normalize('NFKC'));
}
function normalizeArabicText(doc){
  const w=doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
  let n;
  while((n=w.nextNode()))
    if(/[ﭐ-﷿ﹰ-ﻼ]/.test(n.nodeValue))
      n.nodeValue=normalizeArabicPresentation(n.nodeValue);
}
function cleanPastedHTML(raw){
  const cssRules=extractStyleRules(raw);
  const doc=new DOMParser().parseFromString(preClean(raw),'text/html');
  applyStyleRules(doc, cssRules);
  if(/class="?Mso|mso-|urn:schemas-microsoft-com/i.test(doc.body.innerHTML))
    rebuildWordLists(doc);
  fixGoogleDocs(doc);
  fixLegacyAttrs(doc);
  sanitize(doc.body,doc);
  normalizeArabicText(doc);
  const emptyP=el=>el&&el.tagName==='P'&&!el.textContent.trim()&&!el.querySelector('img,table');
  while(emptyP(doc.body.firstElementChild)) doc.body.firstElementChild.remove();
  while(emptyP(doc.body.lastElementChild)) doc.body.lastElementChild.remove();
  return doc.body.innerHTML.trim();
}
window.cleanPastedHTML = cleanPastedHTML;

ed.addEventListener('paste', e=>{
  const cd=e.clipboardData; if(!cd) return;
  e.preventDefault();
  const html=cd.getData('text/html');
  const imgItem=[...cd.items].find(i=>i.type.startsWith('image/'));
  if(imgItem && !html){                 /* paste_data_images:true */
    const fr=new FileReader();
    fr.onload=()=>{ document.execCommand('insertHTML',false,
      `<img src="${fr.result}" alt="">`); onChange(); };
    fr.readAsDataURL(imgItem.getAsFile());
    return;
  }
  if(!html){
    /* plain-text pastes get two additive pre-checks before the normal text
       pipeline runs (the paste engine itself is untouched): a clipboard that
       is entirely one LaTeX formula/derivation becomes a rendered math
       element, and a bare video page URL (YouTube & co.) becomes an
       embedded player; anything else falls through unchanged */
    const raw=cd.getData('text/plain');
    const math=mathFromClipboard(raw);
    if(math){ insertMathElement(math.latex, math.block); onChange(); return; }
    const embed=/^\S+$/.test(raw.trim()) ? videoEmbedUrl(raw.trim()) : null;
    if(embed){ document.execCommand('insertHTML',false,videoEmbedHTML(embed)); onChange(); return; }
  }
  if(html){
    document.execCommand('insertHTML',false,cleanPastedHTML(html));
  }else{
    const txt=normalizeArabicPresentation(cd.getData('text/plain')).replace(/\r/g,'');
    const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let out;
    if(/\n/.test(txt)){
      /* multi-line (PDF / email copy): one paragraph per blank-line-separated
         block, dir="auto" so Arabic lines align right and English lines left
         exactly as in the source document */
      out=txt.split(/\n{2,}/).map(par=>
        `<p dir="auto">${esc(par).replace(/\n/g,'<br>')||'<br>'}</p>`).join('');
    }else{
      out=esc(txt);
    }
    document.execCommand('insertHTML',false,out);
  }
  onChange();
});
/* powerpaste_block_drop:true — block content drops into the editor */
ed.addEventListener('drop', e=>e.preventDefault());
ed.addEventListener('dragover', e=>e.preventDefault());

/* ---------------------------------------------------------- init / lang */
function initUI(){
  closePop(); closeDlg();
  document.documentElement.lang = lang;
  shell.dir = t('dir');
  ed.dir = t('dir');
  buildMenubar(); buildToolbar();
  sbHelp.textContent = t('statushelp');
  refreshState();
}
document.getElementById('langEn').addEventListener('click', function(){
  lang='en'; this.classList.add('on');
  document.getElementById('langAr').classList.remove('on'); initUI();
});
document.getElementById('langAr').addEventListener('click', function(){
  lang='ar'; this.classList.add('on');
  document.getElementById('langEn').classList.remove('on'); initUI();
});
initUI();
})();
