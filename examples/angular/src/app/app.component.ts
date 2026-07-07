import { Component } from '@angular/core';
import { FableEditorModule } from '@wysiwyg-sa/fable-editor/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FableEditorModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  content = '<p><strong>Angular wrapper</strong> is working.</p>';
  language: 'en' | 'ar' = 'en';

  onChange(content: string) {
    this.content = content;
  }

  logContent(editor: { getContent(): string }) {
    console.log(editor.getContent());
  }
}
