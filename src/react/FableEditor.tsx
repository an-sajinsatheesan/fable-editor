import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { FableEditor as FableEditorCore, EditorInitOptions, EditorLanguage, FableEditorApi } from '../core';

export interface FableEditorProps extends Omit<EditorInitOptions, 'target' | 'onChange' | 'onReady'> {
  value?: string;
  defaultValue?: string;
  onChange?: (content: string) => void;
  onReady?: (editor: FableEditorApi) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FableEditor = forwardRef<FableEditorApi, FableEditorProps>(
  ({ value, defaultValue, onChange, onReady, className, style, ...initOptions }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<FableEditorCore | null>(null);
    const isInternalChange = useRef(false);
    const lastValue = useRef(value ?? defaultValue);
    const onChangeRef = useRef(onChange);
    const onReadyRef = useRef(onReady);

    onChangeRef.current = onChange;
    onReadyRef.current = onReady;

    useImperativeHandle(ref, () => ({
      getContent: () => editorRef.current?.getContent() ?? '',
      setContent: (html: string) => editorRef.current?.setContent(html),
      insertContent: (html: string) => editorRef.current?.insertContent(html),
      setLanguage: (lang: EditorLanguage) => editorRef.current?.setLanguage(lang),
      focus: () => editorRef.current?.focus(),
      destroy: () => editorRef.current?.destroy(),
      importWordFile: (file: File) => editorRef.current?.importWordFile(file) ?? Promise.resolve(),
      restoreDraft: () => editorRef.current?.restoreDraft() ?? false,
      getRevisions: () => editorRef.current?.getRevisions() ?? []
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      const editor = new FableEditorCore({
        target: containerRef.current,
        initialContent: lastValue.current,
        onChange: (content) => {
          isInternalChange.current = true;
          lastValue.current = content;
          onChangeRef.current?.(content);
        },
        onReady: (api) => onReadyRef.current?.(api),
        ...initOptions
      });
      editorRef.current = editor;

      return () => {
        editor.destroy();
        editorRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (value === undefined) return;
      if (value === lastValue.current) return;
      if (isInternalChange.current) {
        isInternalChange.current = false;
        return;
      }
      lastValue.current = value;
      editorRef.current?.setContent(value);
    }, [value]);

    useEffect(() => {
      if (initOptions.language) {
        editorRef.current?.setLanguage(initOptions.language);
      }
    }, [initOptions.language]);

    return <div ref={containerRef} className={className} style={style} />;
  }
);

FableEditor.displayName = 'FableEditor';
