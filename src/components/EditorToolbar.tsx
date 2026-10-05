import React from 'react';
import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Table as TableIcon,
  Rows,
  Columns,
  Trash2,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded text-sm transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
    }`;

  const disabledClass = 'opacity-40 cursor-not-allowed';

  return (
    <div className="bg-slate-100 border-b border-slate-300 p-2 flex flex-wrap items-center gap-1 text-sm select-none sticky top-16 z-20">
      {/* Undo / Redo */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-2 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`p-1.5 rounded text-slate-700 hover:bg-slate-200 ${
            !editor.can().undo() ? disabledClass : ''
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`p-1.5 rounded text-slate-700 hover:bg-slate-200 ${
            !editor.can().redo() ? disabledClass : ''
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-2 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Inline styles */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-2 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Lists & Quotes */}
      <div className="flex items-center space-x-0.5 border-r border-slate-300 pr-2 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      {/* Table Controls */}
      <div className="flex items-center space-x-0.5">
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className="p-1.5 rounded text-slate-700 hover:bg-slate-200"
          title="Insert Table (3x3)"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        {editor.can().addRowAfter() && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="p-1.5 rounded text-slate-700 hover:bg-slate-200 text-xs font-medium flex items-center"
              title="Add Row"
            >
              <Rows className="w-3.5 h-3.5 mr-0.5" /> +Row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="p-1.5 rounded text-slate-700 hover:bg-slate-200 text-xs font-medium flex items-center"
              title="Add Column"
            >
              <Columns className="w-3.5 h-3.5 mr-0.5" /> +Col
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="p-1.5 rounded text-red-600 hover:bg-red-50 text-xs font-medium flex items-center"
              title="Delete Table"
            >
              <Trash2 className="w-3.5 h-3.5 mr-0.5" /> Table
            </button>
          </>
        )}
      </div>
    </div>
  );
};
