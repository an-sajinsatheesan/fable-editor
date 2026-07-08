import { EditorLanguage } from './types';

export interface I18nStrings {
  dir: 'ltr' | 'rtl';
  file: string;
  edit: string;
  view: string;
  insert: string;
  format: string;
  tools: string;
  table: string;
  help: string;
  newdoc: string;
  preview: string;
  print: string;
  undo: string;
  redo: string;
  cut: string;
  copy: string;
  paste: string;
  selectall: string;
  fullscreen: string;
  sourcecode: string;
  wordcount: string;
  image: string;
  inserttable: string;
  hr: string;
  charmap: string;
  datetime: string;
  pagebreak: string;
  nbsp: string;
  bold: string;
  italic: string;
  underline: string;
  strikethrough: string;
  superscript: string;
  subscript: string;
  clearformat: string;
  rowabove: string;
  rowbelow: string;
  delrow: string;
  colbefore: string;
  colafter: string;
  delcol: string;
  deltable: string;
  ltr: string;
  rtl: string;
  alignleft: string;
  aligncenter: string;
  alignright: string;
  alignjustify: string;
  numlist: string;
  bullist: string;
  forecolor: string;
  backcolor: string;
  removeformat: string;
  outdent: string;
  indent: string;
  fontfamily: string;
  fontsize: string;
  blocks: string;
  quickimage: string;
  quicktable: string;
  more: string;
  para: string;
  heading: string;
  pre: string;
  removecolor: string;
  currentcolor: string;
  statushelp: string;
  words: string;
  helpttl: string;
  shortcuts: string;
  close: string;
  save: string;
  cancel: string;
  srcttl: string;
  wcttl: string;
  wcwords: string;
  wcchars: string;
  pastehint: string;
  liststyles_ol: string[];
  liststyles_ul: string[];
  previewttl: string;
  tablepropsttl: string;
  tblwidth: string;
  tblcellspacing: string;
  tblcellpadding: string;
  tblborder: string;
  tblalign: string;
  alignnone: string;
  quote: string;
  link: string;
  linkttl: string;
  linkurl: string;
  unlink: string;
  lineheight: string;
  wordspacing: string;
  changecase: string;
  lowercase: string;
  uppercase: string;
  capitalize: string;
  customcolor: string;
  normal: string;
  revhistory: string;
  revempty: string;
  restore: string;
  currentver: string;
  importword: string;
  importfail: string;
  restoredraft: string;
  draftempty: string;
  deleteimg: string;
  rotateleft: string;
  rotateright: string;
  fliphorizontal: string;
  flipvertical: string;
  cell: string;
  row: string;
  column: string;
  cellprops: string;
  rowprops: string;
  colprops: string;
  tblheight: string;
  valign: string;
  valigntop: string;
  valignmiddle: string;
  valignbottom: string;
  fill: string;
  nocell: string;
  uploadimg: string;
  imagelink: string;
  imageurlph: string;
  insertimg: string;
  dropimage: string;
  uploading: string;
  uploadfailed: string;
  template: string;
  tplimgleft: string;
  tplimgright: string;
  tplimgtop: string;
  tplimgcenter: string;
  deltemplate: string;
}

export const I18N: Record<EditorLanguage, I18nStrings> = {
  en: {
    dir: 'ltr',
    file: 'File',
    edit: 'Edit',
    view: 'View',
    insert: 'Insert',
    format: 'Format',
    tools: 'Tools',
    table: 'Table',
    help: 'Help',
    newdoc: 'New document',
    preview: 'Preview',
    print: 'Print…',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectall: 'Select all',
    fullscreen: 'Fullscreen',
    sourcecode: 'Source code',
    wordcount: 'Word count',
    image: 'Image…',
    inserttable: 'Table',
    hr: 'Horizontal line',
    charmap: 'Special character…',
    datetime: 'Date/time',
    pagebreak: 'Page break',
    nbsp: 'Nonbreaking space',
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strikethrough: 'Strikethrough',
    superscript: 'Superscript',
    subscript: 'Subscript',
    clearformat: 'Clear formatting',
    rowabove: 'Insert row before',
    rowbelow: 'Insert row after',
    delrow: 'Delete row',
    colbefore: 'Insert column before',
    colafter: 'Insert column after',
    delcol: 'Delete column',
    deltable: 'Delete table',
    ltr: 'Left to right',
    rtl: 'Right to left',
    alignleft: 'Align left',
    aligncenter: 'Align center',
    alignright: 'Align right',
    alignjustify: 'Justify',
    numlist: 'Numbered list',
    bullist: 'Bullet list',
    forecolor: 'Text color',
    backcolor: 'Background color',
    removeformat: 'Clear formatting',
    outdent: 'Decrease indent',
    indent: 'Increase indent',
    fontfamily: 'Font family',
    fontsize: 'Font size',
    blocks: 'Blocks',
    quickimage: 'Insert image',
    quicktable: 'Insert table',
    more: 'More…',
    para: 'Paragraph',
    heading: 'Heading',
    pre: 'Preformatted',
    removecolor: 'Remove color',
    currentcolor: 'Current color',
    statushelp: 'Press Alt+0 for help',
    words: 'words',
    helpttl: 'Help',
    shortcuts: 'Handy shortcuts',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    srcttl: 'Source code',
    wcttl: 'Word count',
    wcwords: 'Words',
    wcchars: 'Characters',
    pastehint: 'Use Ctrl+V / ⌘V to paste',
    liststyles_ol: ['Default', 'Lower alpha', 'Lower roman', 'Upper alpha', 'Upper roman'],
    liststyles_ul: ['Default', 'Circle', 'Square'],
    previewttl: 'Preview',
    tablepropsttl: 'Table properties',
    tblwidth: 'Width',
    tblcellspacing: 'Cell spacing',
    tblcellpadding: 'Cell padding',
    tblborder: 'Border width',
    tblalign: 'Alignment',
    alignnone: 'None',
    quote: 'Blockquote',
    link: 'Link…',
    linkttl: 'Insert/edit link',
    linkurl: 'URL',
    unlink: 'Remove link',
    lineheight: 'Line height',
    wordspacing: 'Word spacing',
    changecase: 'Change case',
    lowercase: 'Lowercase',
    uppercase: 'Uppercase',
    capitalize: 'Capitalize Each Word',
    customcolor: 'Custom color…',
    normal: 'Normal',
    revhistory: 'Revision history',
    revempty: 'No revisions yet',
    restore: 'Restore',
    currentver: 'Current version',
    importword: 'Import from Word…',
    importfail: 'Could not import this file. Please choose a valid .docx document.',
    restoredraft: 'Restore last draft',
    draftempty: 'No saved draft found',
    deleteimg: 'Delete image',
    rotateleft: 'Rotate left',
    rotateright: 'Rotate right',
    fliphorizontal: 'Flip horizontal',
    flipvertical: 'Flip vertical',
    cell: 'Cell',
    row: 'Row',
    column: 'Column',
    cellprops: 'Cell properties…',
    rowprops: 'Row properties…',
    colprops: 'Column properties…',
    tblheight: 'Height',
    valign: 'Vertical align',
    valigntop: 'Top',
    valignmiddle: 'Middle',
    valignbottom: 'Bottom',
    fill: 'Fill',
    nocell: 'Click inside a table cell first',
    uploadimg: 'Upload from computer',
    imagelink: 'Insert from URL',
    imageurlph: 'Paste image URL…',
    insertimg: 'Insert',
    dropimage: 'Drop image here',
    uploading: 'Uploading…',
    uploadfailed: 'Upload failed — click to retry',
    template: 'Templates',
    tplimgleft: 'Image left, text right',
    tplimgright: 'Image right, text left',
    tplimgtop: 'Image top, text below',
    tplimgcenter: 'Text top, image center',
    deltemplate: 'Delete template'
  },
  ar: {
    dir: 'rtl',
    file: 'ملف',
    edit: 'تحرير',
    view: 'عرض',
    insert: 'إدراج',
    format: 'التنسيق',
    tools: 'الأدوات',
    table: 'جدول',
    help: 'تعليمات',
    newdoc: 'مستند جديد',
    preview: 'معاينة',
    print: 'طباعة…',
    undo: 'تراجع',
    redo: 'إعادة',
    cut: 'قص',
    copy: 'نسخ',
    paste: 'لصق',
    selectall: 'تحديد الكل',
    fullscreen: 'ملء الشاشة',
    sourcecode: 'الكود المصدري',
    wordcount: 'عدد الكلمات',
    image: 'صورة…',
    inserttable: 'جدول',
    hr: 'خط أفقي',
    charmap: 'رمز خاص…',
    datetime: 'التاريخ/الوقت',
    pagebreak: 'فاصل الصفحة',
    nbsp: 'مسافة غير فاصلة',
    bold: 'غامق',
    italic: 'مائل',
    underline: 'تسطير',
    strikethrough: 'يتوسطه خط',
    superscript: 'نص مرتفع',
    subscript: 'نص منخفض',
    clearformat: 'مسح التنسيق',
    rowabove: 'إدراج صف قبل',
    rowbelow: 'إدراج صف بعد',
    delrow: 'حذف الصف',
    colbefore: 'إدراج عمود قبل',
    colafter: 'إدراج عمود بعد',
    delcol: 'حذف العمود',
    deltable: 'حذف الجدول',
    ltr: 'من اليسار إلى اليمين',
    rtl: 'من اليمين إلى اليسار',
    alignleft: 'محاذاة لليسار',
    aligncenter: 'توسيط',
    alignright: 'محاذاة لليمين',
    alignjustify: 'ضبط',
    numlist: 'قائمة رقمية',
    bullist: 'قائمة نقطية',
    forecolor: 'لون النص',
    backcolor: 'لون الخلفية',
    removeformat: 'مسح التنسيق',
    outdent: 'إنقاص المسافة البادئة',
    indent: 'زيادة المسافة البادئة',
    fontfamily: 'عائلة الخط',
    fontsize: 'حجم الخط',
    blocks: 'الفقرات',
    quickimage: 'إدراج صورة',
    quicktable: 'إدراج جدول',
    more: 'المزيد…',
    para: 'الفقرة',
    heading: 'العنوان',
    pre: 'منسق مسبقاً',
    removecolor: 'إزالة اللون',
    currentcolor: 'اللون الحالي',
    statushelp: 'اضغط على Alt+0 للحصول على مساعدة',
    words: 'الكلمات',
    helpttl: 'تعليمات',
    shortcuts: 'اختصارات مفيدة',
    close: 'إغلاق',
    save: 'حفظ',
    cancel: 'إلغاء',
    srcttl: 'الكود المصدري',
    wcttl: 'عدد الكلمات',
    wcwords: 'الكلمات',
    wcchars: 'الأحرف',
    pastehint: 'استخدم Ctrl+V / ⌘V للصق',
    liststyles_ol: ['افتراضي', 'أبجدي صغير', 'روماني صغير', 'أبجدي كبير', 'روماني كبير'],
    liststyles_ul: ['افتراضي', 'دائرة', 'مربع'],
    previewttl: 'معاينة',
    tablepropsttl: 'خصائص الجدول',
    tblwidth: 'العرض',
    tblcellspacing: 'تباعد الخلايا',
    tblcellpadding: 'حشو الخلايا',
    tblborder: 'عرض الحدود',
    tblalign: 'المحاذاة',
    alignnone: 'بدون',
    quote: 'اقتباس',
    link: 'رابط…',
    linkttl: 'إدراج/تعديل رابط',
    linkurl: 'الرابط',
    unlink: 'إزالة الرابط',
    lineheight: 'تباعد الأسطر',
    wordspacing: 'تباعد الكلمات',
    changecase: 'تغيير حالة الأحرف',
    lowercase: 'أحرف صغيرة',
    uppercase: 'أحرف كبيرة',
    capitalize: 'تكبير أول حرف',
    customcolor: 'لون مخصص…',
    normal: 'عادي',
    revhistory: 'سجل المراجعات',
    revempty: 'لا توجد مراجعات بعد',
    restore: 'استعادة',
    currentver: 'النسخة الحالية',
    importword: 'استيراد من Word…',
    importfail: 'تعذر استيراد هذا الملف. الرجاء اختيار مستند ‎.docx صالح.',
    restoredraft: 'استعادة آخر مسودة',
    draftempty: 'لا توجد مسودة محفوظة',
    deleteimg: 'حذف الصورة',
    rotateleft: 'تدوير لليسار',
    rotateright: 'تدوير لليمين',
    fliphorizontal: 'قلب أفقي',
    flipvertical: 'قلب رأسي',
    cell: 'خلية',
    row: 'صف',
    column: 'عمود',
    cellprops: 'خصائص الخلية…',
    rowprops: 'خصائص الصف…',
    colprops: 'خصائص العمود…',
    tblheight: 'الارتفاع',
    valign: 'محاذاة عمودية',
    valigntop: 'أعلى',
    valignmiddle: 'وسط',
    valignbottom: 'أسفل',
    fill: 'تعبئة',
    nocell: 'انقر داخل خلية جدول أولاً',
    uploadimg: 'رفع من الجهاز',
    imagelink: 'إدراج من رابط',
    imageurlph: 'الصق رابط الصورة…',
    insertimg: 'إدراج',
    dropimage: 'أسقط الصورة هنا',
    uploading: 'جارٍ الرفع…',
    uploadfailed: 'فشل الرفع — انقر لإعادة المحاولة',
    template: 'قوالب',
    tplimgleft: 'صورة يسار، نص يمين',
    tplimgright: 'صورة يمين، نص يسار',
    tplimgtop: 'صورة أعلى، نص أسفل',
    tplimgcenter: 'نص أعلى، صورة وسط',
    deltemplate: 'حذف القالب'
  }
};

export function getStrings(lang: EditorLanguage): I18nStrings {
  return I18N[lang];
}
