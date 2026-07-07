import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FableEditor, EditorInitOptions, EditorLanguage, FableEditorApi } from '../core';

@Component({
  selector: 'fable-editor',
  standalone: true,
  template: `<div #container></div>`,
  styles: [':host { display: block; }']
})
export class FableEditorComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() language: EditorLanguage = 'en';
  @Input() height = 302;
  @Input() menubar: boolean | string = true;
  @Input() toolbar: boolean | string = true;
  @Input() statusbar = true;
  @Input() readonly = false;
  @Input() init: Partial<Omit<EditorInitOptions, 'target'>> = {};
  @Input() value = '';

  @Output() editorChange = new EventEmitter<string>();
  @Output() editorReady = new EventEmitter<FableEditorApi>();

  private editor?: FableEditor;
  private lastContent = '';

  ngOnInit(): void {
    this.lastContent = this.value;
    this.editor = new FableEditor({
      target: this.container.nativeElement,
      language: this.language,
      height: this.height,
      menubar: this.menubar,
      toolbar: this.toolbar,
      statusbar: this.statusbar,
      readonly: this.readonly,
      initialContent: this.value,
      ...this.init,
      onChange: (content) => {
        this.lastContent = content;
        this.editorChange.emit(content);
      },
      onReady: (api) => this.editorReady.emit(api)
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.editor) return;
    if (changes['language'] && !changes['language'].firstChange) {
      this.editor.setLanguage(this.language);
    }
    if (changes['value'] && !changes['value'].firstChange && this.value !== this.lastContent) {
      this.lastContent = this.value;
      this.editor.setContent(this.value ?? '');
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = undefined;
  }

  getContent(): string {
    return this.editor?.getContent() ?? '';
  }

  setContent(html: string): void {
    this.lastContent = html;
    this.editor?.setContent(html ?? '');
  }

  insertContent(html: string): void {
    this.editor?.insertContent(html);
  }

  setLanguage(lang: EditorLanguage): void {
    this.editor?.setLanguage(lang);
  }

  focus(): void {
    this.editor?.focus();
  }

  writeValue(value: string): void {
    this.editor?.setContent(value ?? '');
  }
}
