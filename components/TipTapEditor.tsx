"use dom";

import { Extension } from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Image } from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import type { WebViewMessageEvent } from "react-native-webview";

interface TipTapEditorProps {
  content?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  dom?: import("expo/dom").DOMProps;
}

interface EditorUpdateEvent {
  editor: Editor;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md";
}

interface ColorPickerProps {
  editor: Editor;
}

interface PinchToResizeStorage {
  initialDistance: number;
  initialWidth: number;
  selectedImage: HTMLImageElement | null;
}

interface ImageAttributes {
  src: string;
  alt?: string;
  title?: string;
  width?: string | number;
  alignment?: "left" | "center" | "right";
}

// Custom extension for pinch-to-resize
const PinchToResize = Extension.create({
  name: "pinchToResize",

  addStorage() {
    return {
      initialDistance: 0,
      initialWidth: 0,
      selectedImage: null,
    };
  },

  onCreate() {
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;

      // Find the image element under the touch
      const target = event.touches[0].target as HTMLElement;
      const image = target.closest("img");
      if (!image) return;

      // Store initial pinch distance and image width
      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );

      this.storage.initialDistance = distance;
      this.storage.initialWidth = image.width;
      this.storage.selectedImage = image;

      // Prevent default zoom behavior
      event.preventDefault();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || !this.storage.selectedImage) return;

      // Calculate new distance and scale factor
      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );

      const scale = distance / this.storage.initialDistance;
      const newWidth = Math.max(
        50,
        Math.min(600, this.storage.initialWidth * scale)
      );

      // Apply new width while maintaining aspect ratio
      this.storage.selectedImage.style.width = `${newWidth}px`;
      this.storage.selectedImage.style.height = "auto";

      // Prevent default zoom behavior
      event.preventDefault();
    };

    const handleTouchEnd = () => {
      this.storage.selectedImage = null;
    };

    if (this.editor.view.dom) {
      this.editor.view.dom.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      this.editor.view.dom.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      this.editor.view.dom.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (this.editor.view.dom) {
        this.editor.view.dom.removeEventListener(
          "touchstart",
          handleTouchStart
        );
        this.editor.view.dom.removeEventListener("touchmove", handleTouchMove);
        this.editor.view.dom.removeEventListener("touchend", handleTouchEnd);
      }
    };
  },
});

// Custom extension for image alignment
const ImageAlignment = Extension.create({
  name: "imageAlignment",

  addGlobalAttributes() {
    return [
      {
        types: ["image"],
        attributes: {
          alignment: {
            default: "left",
            rendered: true,
            parseHTML: (element) => element.style.textAlign || "left",
            renderHTML: (attributes) => {
              if (!attributes.alignment) return {};
              return {
                style: `text-align: ${attributes.alignment}`,
              };
            },
          },
        },
      },
    ];
  },
});

const ColorPicker: React.FC<ColorPickerProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get current color from editor
  const currentColor = editor.getAttributes("textStyle").color || "#000000";

  const colors = [
    { name: "Default", value: "#000000" },
    { name: "Orange", value: "#f97316" },
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#22c55e" },
    { name: "Purple", value: "#a855f7" },
    { name: "Yellow", value: "#eab308" },
    { name: "Pink", value: "#ec4899" },
    { name: "Gray", value: "#6b7280" },
  ];

  // Force update when editor selection changes
  React.useEffect(() => {
    if (editor) {
      const handleUpdate = () => forceUpdate();
      editor.on("selectionUpdate", handleUpdate);
      return () => {
        editor.off("selectionUpdate", handleUpdate);
      };
    }
  }, [editor]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleColorSelect = (color: string) => {
    if (color === "#000000") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <ToolbarButton
        onClick={() => setIsOpen(!isOpen)}
        isActive={false}
        title="Text Color"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1px",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>A</span>
          <div
            style={{
              width: "14px",
              height: "2px",
              backgroundColor: currentColor,
              borderRadius: "1px",
            }}
          />
        </div>
      </ToolbarButton>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            padding: "8px",
            zIndex: 1000,
            minWidth: "120px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "4px",
            }}
          >
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                title={color.name}
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "4px",
                  border:
                    currentColor === color.value
                      ? "2px solid #f97316"
                      : "1px solid #d1d5db",
                  backgroundColor: color.value,
                  cursor: "pointer",
                  transition: "all 200ms ease-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
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
  size = "md",
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: size === "sm" ? "24px" : "28px",
      height: size === "sm" ? "24px" : "28px",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid",
      transition: "all 200ms ease-out",
      fontWeight: "600",
      fontSize: size === "sm" ? "11px" : "13px",
      cursor: "pointer",
      backgroundColor: isActive ? "#f97316" : "#ffffff",
      color: isActive ? "#ffffff" : "#374151",
      borderColor: isActive ? "#ea580c" : "#d1d5db",
      boxShadow: isActive ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
      transform: isActive ? "scale(1.05)" : "scale(1)",
    }}
    onMouseEnter={(e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = "#fff7ed";
        e.currentTarget.style.borderColor = "#fed7aa";
        e.currentTarget.style.color = "#ea580c";
        e.currentTarget.style.transform = "scale(1.02)";
      }
    }}
    onMouseLeave={(e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = "#ffffff";
        e.currentTarget.style.borderColor = "#d1d5db";
        e.currentTarget.style.color = "#374151";
        e.currentTarget.style.transform = "scale(1)";
      }
    }}
  >
    {children}
  </button>
);

interface ToolbarSeparatorProps {
  orientation?: "vertical" | "horizontal";
}

const ToolbarSeparator: React.FC<ToolbarSeparatorProps> = ({
  orientation = "vertical",
}) => (
  <div
    style={{
      backgroundColor: "#e5e7eb",
      width: orientation === "vertical" ? "1px" : "100%",
      height: orientation === "vertical" ? "20px" : "1px",
      margin: "0 1px",
    }}
  />
);

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        if (imageUrl) {
          editor.chain().focus().setImage({ src: imageUrl }).run();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* First Row - History & Basic Formatting */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "3px",
        }}
      >
        {/* History Controls */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().undo().run();
          }}
          isActive={false}
          title="Undo"
        >
          ↶
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            editor.chain().focus().redo().run();
          }}
          isActive={false}
          title="Redo"
        >
          ↷
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleBold().run();
          }}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleItalic().run();
          }}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            // For now, we'll use code mark as underline since underline extension isn't available
            editor.chain().focus().toggleCode().run();
          }}
          isActive={editor.isActive("code")}
          title="Underline"
        >
          <span style={{ textDecoration: "underline" }}>U</span>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleStrike().run();
          }}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <span style={{ textDecoration: "line-through" }}>S</span>
        </ToolbarButton>

        <ColorPicker editor={editor} />

        <ToolbarSeparator />

        {/* Image Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: "none" }}
        />
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          isActive={false}
          title="Insert Image"
        >
          <span style={{ fontSize: "16px" }}>🖼️</span>
        </ToolbarButton>

        {/* Lists */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleBulletList().run();
          }}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          •
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run();
          }}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          1.
        </ToolbarButton>
      </div>

      {/* Second Row - Advanced Formatting & Structure */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "3px",
        }}
      >
        {/* Headings */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
          size="sm"
        >
          H1
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
          size="sm"
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
          size="sm"
        >
          H3
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Content Elements */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleBlockquote().run();
          }}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          &ldquo;
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleCodeBlock().run();
          }}
          isActive={editor.isActive("codeBlock")}
          title="Code Block"
        >
          &lt;/&gt;
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Additional Tools */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().setHorizontalRule().run();
          }}
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
  content = "",
  onContentChange,
  placeholder = "Start writing your note...",
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: "80%",
              renderHTML: (attributes: ImageAttributes) => {
                if (attributes.width) {
                  return {
                    style: `width: ${attributes.width}${typeof attributes.width === "number" ? "px" : ""};`,
                  };
                }
                return {
                  style: "max-width: 300px; width: auto;",
                };
              },
            },
            alignment: {
              default: "left",
              renderHTML: (attributes) => {
                return {
                  style: `margin: 16px ${attributes.alignment === "left" ? "0" : "auto"} 16px ${attributes.alignment === "right" ? "auto" : "0"};`,
                };
              },
            },
          };
        },
      }).configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: "max-width: 400px; width: auto; height: auto;",
        },
      }),
      PinchToResize,
      ImageAlignment,
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
        console.log("📝 TipTap editor created with content:", content);
      }
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [editor, content]);

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Create the HTML content for the WebView with Tiptap initialization
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://unpkg.com/@tiptap/core@2.1.13"></script>
        <script src="https://unpkg.com/@tiptap/starter-kit@2.1.13"></script>
        <script src="https://unpkg.com/@tiptap/extension-image@2.1.13"></script>
        <style>
          body {
            margin: 0;
            padding: 24px;
            background: linear-gradient(135deg, #fffbeb, #fff7ed, #fefce8);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            min-height: 100vh;
          }

          .ProseMirror {
            outline: none;
            min-height: calc(100vh - 48px);
            font-size: 14px;
            line-height: 1.6;
            color: #111827;
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

          /* Add mobile-friendly image styles */
          .ProseMirror img {
            width: auto;
            height: auto;
            display: block;
            margin: 16px 0;  /* Default left alignment margins */
            border-radius: 8px;
            border: 2px solid #fed7aa;
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
            object-fit: contain;
            box-sizing: border-box;
          }

          /* Ensure images don't overflow their containers */
          .ProseMirror div:has(> img) {
            max-width: 100%;
            overflow: hidden;
          }

          .ProseMirror img[style*="text-align: left"] {
            margin-left: 0;
            margin-right: auto;
          }

          .ProseMirror img[style*="text-align: center"] {
            margin-left: auto;
            margin-right: auto;
          }

          .ProseMirror img[style*="text-align: right"] {
            margin-left: auto;
            margin-right: 0;
          }

          /* Add all your other ProseMirror styles here */
        </style>
      </head>
      <body>
        <div id="editor"></div>
        <script>
          // Initialize Tiptap
          let editor = new window.Editor({
            element: document.querySelector('#editor'),
            extensions: [
              StarterKit,
              Image.configure({
                inline: true,
                allowBase64: true,
              }),
            ],
            content: ${JSON.stringify(content)},
            editable: ${editable},
            onUpdate: ({ editor }) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'content-change',
                content: editor.getHTML()
              }));
            },
          });

          // Add pinch-to-zoom functionality
          (function() {
            let initialDistance = 0;
            let initialWidth = 0;
            let selectedImage = null;

            document.addEventListener('touchstart', (event) => {
              if (event.touches.length !== 2) return;
              
              const target = event.touches[0].target;
              const image = target.closest('img');
              if (!image) return;

              initialDistance = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
              );
              initialWidth = image.width;
              selectedImage = image;
              event.preventDefault();
            }, { passive: false });

            document.addEventListener('touchmove', (event) => {
              if (event.touches.length !== 2 || !selectedImage) return;

              const distance = Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
              );

              const scale = distance / initialDistance;
              const newWidth = Math.max(50, Math.min(600, initialWidth * scale));

              selectedImage.style.width = newWidth + 'px';
              selectedImage.style.height = 'auto';
              event.preventDefault();
            }, { passive: false });

            document.addEventListener('touchend', () => {
              selectedImage = null;
            });
          })();
        </script>
      </body>
    </html>
  `;

  // Handle messages from WebView
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "content-change") {
        onContentChange?.(data.content);
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  };

  return (
    <View className="flex-1 bg-white/80 backdrop-blur-md rounded-lg border border-orange-200 shadow-sm overflow-hidden">
      <EditorToolbar editor={editor} />

      <View className="flex-1 p-6">
        <style>
          {`
            body {
              margin: 0;
              background: linear-gradient(135deg, #fffbeb, #fff7ed, #fefce8);
              overflow: hidden;
              -webkit-tap-highlight-color: transparent;
            }

            .ProseMirror {
              outline: none;
              height: 100%;
              overflow-y: auto;
              padding: 16px;
              font-size: 14px;
              line-height: 1.6;
              color: #111827;
              transition: all 200ms ease-out;
            }

            .ProseMirror > * {
              max-width: 100%;
              box-sizing: border-box;
              word-wrap: break-word;
              overflow-wrap: break-word;
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
              padding: 16px;
            }

            /* Add mobile-friendly image styles */
            .ProseMirror img {
              width: auto;
              height: auto;
              display: block;
              margin: 24px 0;  /* Increased vertical margin for better spacing */
              border-radius: 8px;
              border: 2px solid #fed7aa;
              touch-action: none;
              -webkit-user-select: none;
              user-select: none;
              object-fit: contain;
              box-sizing: border-box;
            }

            /* Ensure images don't overflow their containers */
            .ProseMirror div:has(> img) {
              max-width: 100%;
              overflow: hidden;
            }

            .ProseMirror img[style*="text-align: left"] {
              margin-left: 0;
              margin-right: auto;
            }

            .ProseMirror img[style*="text-align: center"] {
              margin-left: auto;
              margin-right: auto;
            }

            .ProseMirror img[style*="text-align: right"] {
              margin-left: auto;
              margin-right: 0;
            }

            /* Prevent zoom on double tap */
            * {
              touch-action: manipulation;
            }
          `}
        </style>
        <EditorContent editor={editor} />
      </View>
    </View>
  );
}
