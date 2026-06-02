'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type TiptapEditorProps = {
  value: Record<string, unknown>;
  onChange: (json: Record<string, unknown>) => void;
  simple?: boolean;
};

export function TiptapEditor({ value, onChange, simple }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, defaultProtocol: 'https' }),
      Image.configure({ HTMLAttributes: { class: 'tiptap-img' } }),
      Youtube.configure({ inline: false }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getJSON() as Record<string, unknown>);
    },
  });

  if (!editor) return null;

  async function insertImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const supabase = createBrowserSupabaseClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `news/${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('news-images')
        .upload(path, file, { upsert: false });
      if (error || !data) return;
      const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(data.path);
      editor?.chain().focus().setImage({ src: publicUrl }).run();
    };
    input.click();
  }

  function insertYoutube() {
    const url = prompt('Вставьте ссылку YouTube:');
    if (!url || !editor) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = prompt('Введите URL ссылки:', prev ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="tiptap-editor-wrap">
      <div className="tiptap-toolbar" role="toolbar" aria-label="Форматирование">
        <button
          type="button"
          title="Заголовок H2"
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >H2</button>
        <button
          type="button"
          title="Заголовок H3"
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >H3</button>
        <button
          type="button"
          title="Жирный"
          className={editor.isActive('bold') ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleBold().run()}
        ><b>B</b></button>
        <button
          type="button"
          title="Курсив"
          className={editor.isActive('italic') ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        ><i>I</i></button>
        <button
          type="button"
          title="Ссылка"
          className={editor.isActive('link') ? 'is-active' : ''}
          onClick={setLink}
        >🔗</button>
        {!simple && (
          <>
            <button
              type="button"
              title="Изображение"
              onClick={insertImage}
            >🖼</button>
            <button
              type="button"
              title="YouTube видео"
              onClick={insertYoutube}
            >▶</button>
          </>
        )}
        <button
          type="button"
          title="Маркированный список"
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >• —</button>
        <button
          type="button"
          title="Нумерованный список"
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >1.</button>
        <button
          type="button"
          title="Цитата"
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >"</button>
      </div>
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}
