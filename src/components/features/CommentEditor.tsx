'use client';

import { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type Props = {
  objectSlug: string;
  userId: string;
  parentId?: string | null;
  initialBody?: Record<string, unknown>;
  initialPhotos?: string[];
  onSubmit: (body: Record<string, unknown>, photos: string[]) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  banMessage?: string | null;
};

export function CommentEditor({
  objectSlug,
  userId,
  parentId,
  initialBody,
  initialPhotos = [],
  onSubmit,
  onCancel,
  submitLabel = 'Отправить',
  banMessage,
}: Props) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, horizontalRule: false }),
      Link.configure({ openOnClick: false, defaultProtocol: 'https' }),
    ],
    content: initialBody ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    immediatelyRender: false,
  });

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || photos.length >= 5) return;
    const remaining = 5 - photos.length;
    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    const supabase = createBrowserSupabaseClient();
    const newUrls: string[] = [];

    for (const file of toUpload) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/${objectSlug}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('comment-photos')
        .upload(path, file, { upsert: false });

      if (!upErr) {
        const { data } = supabase.storage.from('comment-photos').getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
    }

    setPhotos((prev) => [...prev, ...newUrls]);
    setUploading(false);
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function handleSubmit() {
    if (!editor) return;
    const body = editor.getJSON() as Record<string, unknown>;
    const text = editor.getText().trim();
    if (!text && photos.length === 0) {
      setError('Напишите что-нибудь или добавьте фото');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(body, photos);
      editor.commands.clearContent();
      setPhotos([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  }

  if (banMessage) {
    return (
      <div className="comment-banned-notice">{banMessage}</div>
    );
  }

  return (
    <div className="comment-editor-wrap">
      <div className="comment-editor-toolbar">
        <button
          type="button"
          className={`comment-editor-btn${editor?.isActive('bold') ? ' is-active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
          title="Жирный"
        >
          <strong>Ж</strong>
        </button>
        <button
          type="button"
          className={`comment-editor-btn${editor?.isActive('italic') ? ' is-active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}
          title="Курсив"
        >
          <em>К</em>
        </button>
        <button
          type="button"
          className={`comment-editor-btn${editor?.isActive('blockquote') ? ' is-active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run(); }}
          title="Цитата"
        >
          «»
        </button>
        <button
          type="button"
          className="comment-editor-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt('Ссылка:');
            if (url) editor?.chain().focus().setLink({ href: url }).run();
          }}
          title="Ссылка"
        >
          🔗
        </button>
      </div>

      <EditorContent editor={editor} className="comment-editor-tiptap" />

      {photos.length > 0 && (
        <div className="comment-photo-upload-row">
          {photos.map((url) => (
            <div key={url} className="comment-photo-preview">
              <img src={url} alt="" />
              <button
                type="button"
                className="comment-photo-remove"
                onClick={() => removePhoto(url)}
                aria-label="Удалить фото"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < 5 && (
        <div className="comment-photo-upload-row">
          <button
            type="button"
            className="comment-editor-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Загрузка…' : `+ Фото (${photos.length}/5)`}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handlePhotoUpload(e.target.files)}
          />
        </div>
      )}

      {error && <p className="modal-error" style={{ marginBottom: '8px' }}>{error}</p>}

      <div className="comment-editor-actions">
        {onCancel && (
          <button type="button" className="modal-close-btn" onClick={onCancel} disabled={submitting}>
            Отмена
          </button>
        )}
        <button
          type="button"
          className="primary-button"
          style={{ padding: '8px 20px', fontSize: '14px' }}
          onClick={handleSubmit}
          disabled={submitting || uploading}
        >
          {submitting ? 'Отправка…' : submitLabel}
        </button>
      </div>
    </div>
  );
}
