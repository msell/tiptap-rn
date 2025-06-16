'use dom';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface TipTapEditorProps {
  content?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  dom?: import('expo/dom').DOMProps;
}

export default function TipTapEditor({
  content = '',
  onContentChange,
  placeholder = 'Start typing...',
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onContentChange) {
        onContentChange(html);
      }
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '16px'
    }}>
      <style>
        {`
          body {
            margin: 0;
            background-color: #ffffff;
            overflow: hidden;
          }

          .ProseMirror {
            outline: none;
            height: calc(100vh - 32px);
            overflow-y: auto;
            padding: 0;
            font-size: 16px;
            line-height: 1.6;
            color: #1f2937;
          }

          .ProseMirror p {
            margin: 0 0 16px 0;
          }

          .ProseMirror:empty:before {
            content: "${placeholder}";
            color: #9ca3af;
            pointer-events: none;
            position: absolute;
          }

          .ProseMirror h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: #111827;
          }

          .ProseMirror h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 14px 0;
            color: #111827;
          }

          .ProseMirror h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 12px 0;
            color: #111827;
          }

          .ProseMirror ul, .ProseMirror ol {
            padding-left: 20px;
            margin: 0 0 16px 0;
          }

          .ProseMirror li {
            margin-bottom: 4px;
          }

          .ProseMirror blockquote {
            border-left: 3px solid #d1d5db;
            padding-left: 16px;
            margin: 0 0 16px 0;
            color: #6b7280;
            font-style: italic;
          }

          .ProseMirror code {
            background-color: #f3f4f6;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 14px;
          }

          .ProseMirror pre {
            background-color: #f3f4f6;
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 0 0 16px 0;
          }

          .ProseMirror pre code {
            background: none;
            padding: 0;
          }

          .ProseMirror strong {
            font-weight: 600;
          }

          .ProseMirror em {
            font-style: italic;
          }

          /* Prevent zoom on double tap */
          * {
            touch-action: manipulation;
          }

          /* Focus styles */
          .ProseMirror:focus {
            outline: none;
          }
        `}
      </style>
      <EditorContent editor={editor} />
    </div>
  );
}