import { useState, useRef } from 'react';
import 'fable-editor/style.css';
import { FableEditor } from 'fable-editor/react';
import type { FableEditorApi } from 'fable-editor';

function App() {
  const [value, setValue] = useState('<p><strong>React wrapper</strong> is working.</p>');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const editorRef = useRef<FableEditorApi>(null);

  return (
    <div style={{ maxWidth: 1000, margin: '30px auto', padding: '0 20px' }}>
      <h2>FableEditor — React test</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setLanguage('en')} disabled={language === 'en'}>
          English
        </button>{' '}
        <button onClick={() => setLanguage('ar')} disabled={language === 'ar'}>
          العربية
        </button>{' '}
        <button onClick={() => console.log(editorRef.current?.getContent())}>
          Log content
        </button>{' '}
        <button onClick={() => editorRef.current?.setContent('<p>Reset content</p>')}>
          Reset
        </button>
      </div>
      <FableEditor
        ref={editorRef}
        value={value}
        onChange={setValue}
        language={language}
        height={400}
      />
      <h3>HTML output</h3>
      <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 6 }}>
        {value}
      </pre>
    </div>
  );
}

export default App;
