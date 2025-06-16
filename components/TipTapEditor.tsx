'use dom';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface TipTapEditorProps {
  content?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  dom?: import('expo/dom').DOMProps;
}

interface EditorUpdateEvent {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive = false,
  children,
  title
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      w-8 h-8 rounded flex items-center justify-center
      border transition-all duration-200 ease-out
      ${isActive
        ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
        : 'bg-white/80 text-gray-700 border-orange-200 hover:bg-orange-50 hover:border-orange-300'
      }
    `}
  >
    {children}
  </button>
);

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1.5 p-3 bg-white/80 backdrop-blur-md border-b border-orange-200">
      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleBold().run(); }}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleItalic().run(); }}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleStrike().run(); }}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <span style={{textDecoration: 'line-through'}}>S</span>
      </ToolbarButton>

      <div className="w-px h-6 bg-orange-200 mx-1"></div>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <div className="w-px h-6 bg-orange-200 mx-1"></div>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleBulletList().run(); }}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        •
      </ToolbarButton>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleOrderedList().run(); }}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        1.
      </ToolbarButton>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleBlockquote().run(); }}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        &ldquo;
      </ToolbarButton>

      <div className="w-px h-6 bg-orange-200 mx-1"></div>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleCode().run(); }}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        &lt;&gt;
      </ToolbarButton>

      <ToolbarButton
        onClick={() => { editor.chain().focus().toggleCodeBlock().run(); }}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        &#123;&#125;
      </ToolbarButton>
    </div>
  );
};

export default function TipTapEditor({
  content = '',
  onContentChange,
  placeholder = 'Start writing your note...',
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable: editable,
    autofocus: true,
    onUpdate: ({ editor }: EditorUpdateEvent) => {
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
        editor.commands.setContent(content, false);
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
    <div className="w-full h-full bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-orange-200 flex flex-col">
      <EditorToolbar editor={editor} />

      <div className="flex-1 p-6 overflow-hidden">
        <style>
          {`
            body {
              margin: 0;
              background: linear-gradient(135deg, #fffbeb, #fff7ed, #fefce8);
              overflow: hidden;
            }

            .ProseMirror {
              outline: none;
              height: 100%;
              overflow-y: auto;
              padding: 0;
              font-size: 14px;
              line-height: 1.6;
              color: #111827;
              transition: all 200ms ease-out;
            }

            .ProseMirror:focus {
              outline: none;
            }

            .ProseMirror p {
              margin: 0 0 16px 0;
            }

            .ProseMirror:empty:before {
              content: "${placeholder}";
              color: #9ca3af;
              pointer-events: none;
              position: absolute;
              font-size: 14px;
            }

            .ProseMirror h1 {
              font-size: 36px;
              font-weight: bold;
              margin: 0 0 24px 0;
              color: #111827;
            }

            .ProseMirror h2 {
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 16px 0;
              color: #111827;
            }

            .ProseMirror h3 {
              font-size: 16px;
              font-weight: 600;
              margin: 0 0 12px 0;
              color: #111827;
            }

            .ProseMirror ul, .ProseMirror ol {
              padding-left: 24px;
              margin: 0 0 16px 0;
            }

            .ProseMirror li {
              margin-bottom: 4px;
            }

            .ProseMirror blockquote {
              border-left: 3px solid #f97316;
              padding-left: 16px;
              margin: 0 0 16px 0;
              color: #6b7280;
              font-style: italic;
              background: #fff7ed;
              border-radius: 4px;
              padding: 12px 16px;
            }

            .ProseMirror code {
              background-color: #fff7ed;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
              font-size: 12px;
              color: #ea580c;
              border: 1px solid #fed7aa;
            }

            .ProseMirror pre {
              background: linear-gradient(135deg, #fff7ed, #fefce8);
              padding: 16px;
              border-radius: 8px;
              overflow-x: auto;
              margin: 0 0 16px 0;
              border: 1px solid #fed7aa;
            }

            .ProseMirror pre code {
              background: none;
              padding: 0;
              border: none;
              color: #111827;
              font-size: 12px;
            }

            .ProseMirror strong {
              font-weight: 600;
              color: #f97316;
            }

            .ProseMirror em {
              font-style: italic;
              color: #ea580c;
            }

            /* Prevent zoom on double tap */
            * {
              touch-action: manipulation;
            }

            /* Selection styling */
            .ProseMirror ::selection {
              background: #fed7aa;
            }

            /* List styling */
            .ProseMirror ul li::marker {
              color: #f97316;
            }

            .ProseMirror ol li::marker {
              color: #f97316;
              font-weight: 600;
            }
          `}
        </style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}