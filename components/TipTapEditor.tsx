'use dom';

import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect } from 'react';

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
  size?: 'sm' | 'md';
}

interface ColorPickerProps {
  editor: Editor;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get current color from editor
  const currentColor = editor.getAttributes('textStyle').color || '#000000';

  const colors = [
    { name: 'Default', value: '#000000' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Gray', value: '#6b7280' },
  ];

  // Force update when editor selection changes
  React.useEffect(() => {
    if (editor) {
      const handleUpdate = () => forceUpdate();
      editor.on('selectionUpdate', handleUpdate);
      return () => {
        editor.off('selectionUpdate', handleUpdate);
      };
    }
  }, [editor]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleColorSelect = (color: string) => {
    if (color === '#000000') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setIsOpen(false);
  };

    return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <ToolbarButton
        onClick={() => setIsOpen(!isOpen)}
        isActive={false}
        title="Text Color"
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>A</span>
          <div style={{
            width: '14px',
            height: '2px',
            backgroundColor: currentColor,
            borderRadius: '1px'
          }} />
        </div>
      </ToolbarButton>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          backgroundColor: '#ffffff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: '8px',
          zIndex: 1000,
          minWidth: '120px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px'
          }}>
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                title={color.name}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                                    border: currentColor === color.value
                    ? '2px solid #f97316'
                    : '1px solid #d1d5db',
                  backgroundColor: color.value,
                  cursor: 'pointer',
                  transition: 'all 200ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive = false,
  children,
  title,
  size = 'md'
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: size === 'sm' ? '24px' : '28px',
      height: size === 'sm' ? '24px' : '28px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid',
      transition: 'all 200ms ease-out',
      fontWeight: '600',
      fontSize: size === 'sm' ? '11px' : '13px',
      cursor: 'pointer',
      backgroundColor: isActive ? '#f97316' : '#ffffff',
      color: isActive ? '#ffffff' : '#374151',
      borderColor: isActive ? '#ea580c' : '#d1d5db',
      boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
    }}
    onMouseEnter={(e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = '#fff7ed';
        e.currentTarget.style.borderColor = '#fed7aa';
        e.currentTarget.style.color = '#ea580c';
        e.currentTarget.style.transform = 'scale(1.02)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.borderColor = '#d1d5db';
        e.currentTarget.style.color = '#374151';
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
  >
    {children}
  </button>
);

interface ToolbarSeparatorProps {
  orientation?: 'vertical' | 'horizontal';
}

const ToolbarSeparator: React.FC<ToolbarSeparatorProps> = ({ orientation = 'vertical' }) => (
  <div
    style={{
      backgroundColor: '#e5e7eb',
      width: orientation === 'vertical' ? '1px' : '100%',
      height: orientation === 'vertical' ? '20px' : '1px',
      margin: '0 1px',
    }}
  />
);

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    }}>
      {/* First Row - History & Basic Formatting */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '3px',
      }}>
        {/* History Controls */}
        <ToolbarButton
          onClick={() => { editor.chain().focus().undo().run(); }}
          isActive={false}
          title="Undo"
        >
          ↶
        </ToolbarButton>

        <ToolbarButton
          onClick={() => { editor.chain().focus().redo().run(); }}
          isActive={false}
          title="Redo"
        >
          ↷
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Text Formatting */}
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
          onClick={() => {
            // For now, we'll use code mark as underline since underline extension isn't available
            editor.chain().focus().toggleCode().run();
          }}
          isActive={editor.isActive('code')}
          title="Underline"
        >
          <span style={{textDecoration: 'underline'}}>U</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleStrike().run(); }}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <span style={{textDecoration: 'line-through'}}>S</span>
        </ToolbarButton>

        <ColorPicker editor={editor} />

        <ToolbarSeparator />

        {/* Lists */}
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
      </div>

      {/* Second Row - Advanced Formatting & Structure */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '3px',
      }}>
        {/* Headings */}
        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); }}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
          size="sm"
        >
          H1
        </ToolbarButton>

        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
          size="sm"
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
          size="sm"
        >
          H3
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Content Elements */}
        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleBlockquote().run(); }}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          &ldquo;
        </ToolbarButton>

        <ToolbarButton
          onClick={() => { editor.chain().focus().toggleCodeBlock().run(); }}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          &lt;/&gt;
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Additional Tools */}
        <ToolbarButton
          onClick={() => { editor.chain().focus().setHorizontalRule().run(); }}
          isActive={false}
          title="Horizontal Rule"
        >
          —
        </ToolbarButton>
      </div>
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
    extensions: [
      StarterKit,
      TextStyle,
      Color,
    ],
    content: content,
    editable: editable,
    autofocus: true,
    onUpdate: ({ editor }: EditorUpdateEvent) => {
      const html = editor.getHTML();
      if (onContentChange) {
        onContentChange(html);
      }
    },
    onSelectionUpdate: ({ editor }: { editor: Editor }) => {
      // Force re-render when selection changes to update active states
    },
    onCreate: ({ editor }: { editor: Editor }) => {
      if (__DEV__) {
        console.log('📝 TipTap editor created with content:', content);
      }
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      if (__DEV__) {
        console.log('📝 TipTap content update check:', {
          propContent: content,
          currentContent,
          areEqual: currentContent === content
        });
      }
      
      if (currentContent !== content) {
        if (__DEV__) {
          console.log('📝 TipTap updating content from:', currentContent, 'to:', content);
        }
        editor.commands.setContent(content, false);
      }
    }
  }, [editor, content]);

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      if (__DEV__) {
        console.log('📝 TipTap updating editable state to:', editable);
      }
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
      borderRadius: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #fed7aa',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <EditorToolbar editor={editor} />

      <div style={{ flex: 1, padding: '24px', overflow: 'hidden' }}>
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
              text-decoration: underline;
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
              text-decoration: none;
            }

            .ProseMirror strong {
              font-weight: 600;
              color: #f97316;
            }

            .ProseMirror em {
              font-style: italic;
              color: #ea580c;
            }

            .ProseMirror hr {
              border: none;
              border-top: 2px solid #fed7aa;
              margin: 24px 0;
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

            /* Text color support */
            .ProseMirror [style*="color"] {
              /* Ensure color styles are preserved */
            }
          `}
        </style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}