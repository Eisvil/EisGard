'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';

type TiptapRendererProps = {
  content: Record<string, unknown> | null | undefined;
  className?: string;
};

export function TiptapRenderer({ content, className }: TiptapRendererProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Image.configure({ HTMLAttributes: { class: 'tiptap-img' } }),
      Youtube.configure({ inline: false }),
    ],
    content: content ?? {},
    editable: false,
    immediatelyRender: false,
  });

  // Синхронизируем содержимое при смене content prop.
  // useEditor принимает content только как начальное значение и не реагирует
  // на изменения prop — необходим явный вызов setContent.
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!content) return null;

  return (
    <div className={`tiptap-content${className ? ` ${className}` : ''}`}>
      <EditorContent editor={editor} />
    </div>
  );
}
