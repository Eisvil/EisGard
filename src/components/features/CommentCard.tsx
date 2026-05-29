'use client';

import { useState } from 'react';
import { TiptapRenderer } from './TiptapRenderer';
import { CommentEditor } from './CommentEditor';

export type CommentData = {
  id: string;
  body: Record<string, unknown>;
  photos: string[];
  created_at: string;
  updated_at: string | null;
  parent_id: string | null;
  user: { id: string; full_name: string | null; avatar_url: string | null };
};

type Props = {
  comment: CommentData;
  replies: CommentData[];
  currentUser: { id: string; role?: string } | null;
  objectSlug: string;
  onDeleted: (id: string) => void;
  onEdited: (updated: CommentData) => void;
  onReplyAdded: (reply: CommentData) => void;
};

const BAN_OPTIONS = [
  { value: '1h', label: '1 час' },
  { value: '1d', label: '1 день' },
  { value: '1m', label: '1 месяц' },
  { value: 'permanent', label: 'Навсегда' },
];

function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) +
    ' в ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  );
}

export function CommentCard({ comment, replies, currentUser, objectSlug, onDeleted, onEdited, onReplyAdded }: Props) {
  const [showReplyEditor, setShowReplyEditor] = useState(false);
  const [showEditEditor, setShowEditEditor] = useState(false);
  const [showBanPicker, setShowBanPicker] = useState(false);
  const [banDuration, setBanDuration] = useState('1d');
  const [overlayPhoto, setOverlayPhoto] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [banning, setBanning] = useState(false);
  const [banError, setBanError] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'moderator';
  const isOwn = currentUser?.id === comment.user.id;
  const canEdit = isOwn && Date.now() - new Date(comment.created_at).getTime() < 24 * 60 * 60 * 1000;

  async function handleDelete() {
    if (!confirm('Удалить комментарий?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/comments/${comment.id}`, { method: 'DELETE' });
      if (res.ok) onDeleted(comment.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleBan() {
    setBanning(true);
    setBanError('');
    try {
      const res = await fetch(`/api/admin/comments/${comment.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: banDuration }),
      });
      const json = await res.json();
      if (res.ok) {
        setShowBanPicker(false);
      } else {
        setBanError(json.error?.message ?? 'Ошибка');
      }
    } finally {
      setBanning(false);
    }
  }

  async function handleEdit(body: Record<string, unknown>, photos: string[]) {
    const res = await fetch(`/api/comments/${comment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, photos }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? 'Ошибка');
    onEdited(json.data as CommentData);
    setShowEditEditor(false);
  }

  async function handleReply(body: Record<string, unknown>, photos: string[]) {
    const res = await fetch(`/api/objects/${objectSlug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, photos, parent_id: comment.id }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? 'Ошибка');
    onReplyAdded(json.data as CommentData);
    setShowReplyEditor(false);
  }

  const initials = (comment.user.full_name ?? 'У').charAt(0).toUpperCase();

  return (
    <div className="comment-card">
      <div className="comment-meta">
        <div className="comment-avatar">
          {comment.user.avatar_url ? (
            <img src={comment.user.avatar_url} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="comment-meta-info">
          <span className="comment-author">{comment.user.full_name ?? 'Участник'}</span>
          <span className="comment-date">·&nbsp;{formatCommentDate(comment.created_at)}</span>
          {comment.updated_at && comment.updated_at !== comment.created_at && (
            <span className="comment-date" style={{ fontStyle: 'italic' }}>· изменён</span>
          )}
        </div>
      </div>

      {showEditEditor ? (
        <CommentEditor
          objectSlug={objectSlug}
          userId={currentUser!.id}
          initialBody={comment.body}
          initialPhotos={comment.photos}
          onSubmit={handleEdit}
          onCancel={() => setShowEditEditor(false)}
          submitLabel="Сохранить"
        />
      ) : (
        <div className="comment-body">
          <TiptapRenderer content={comment.body} />
        </div>
      )}

      {comment.photos.length > 0 && !showEditEditor && (
        <div className="comment-photos">
          {comment.photos.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="comment-photo-thumb"
              onClick={() => setOverlayPhoto(url)}
            />
          ))}
        </div>
      )}

      <div className="comment-actions">
        {currentUser && !comment.parent_id && !showReplyEditor && !showEditEditor && (
          <button type="button" className="comment-action-btn" onClick={() => setShowReplyEditor(true)}>
            Ответить
          </button>
        )}
        {canEdit && !showEditEditor && !showReplyEditor && (
          <button type="button" className="comment-action-btn" onClick={() => setShowEditEditor(true)}>
            Редактировать
          </button>
        )}
        {isAdmin && (
          <>
            <button
              type="button"
              className="comment-action-btn danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              Удалить
            </button>
            <button
              type="button"
              className="comment-action-btn danger"
              onClick={() => setShowBanPicker((v) => !v)}
            >
              Заблокировать
            </button>
          </>
        )}
      </div>

      {showBanPicker && (
        <div className="comment-ban-picker">
          <select value={banDuration} onChange={(e) => setBanDuration(e.target.value)}>
            {BAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {banError && <p style={{ color: '#c0392b', margin: 0, fontSize: '12px' }}>{banError}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="comment-action-btn danger"
              onClick={handleBan}
              disabled={banning}
            >
              {banning ? 'Блокировка…' : 'Заблокировать'}
            </button>
            <button type="button" className="comment-action-btn" onClick={() => setShowBanPicker(false)}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {showReplyEditor && (
        <CommentEditor
          objectSlug={objectSlug}
          userId={currentUser!.id}
          parentId={comment.id}
          onSubmit={handleReply}
          onCancel={() => setShowReplyEditor(false)}
          submitLabel="Ответить"
        />
      )}

      {replies.length > 0 && (
        <div className="comment-replies">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              replies={[]}
              currentUser={currentUser}
              objectSlug={objectSlug}
              onDeleted={onDeleted}
              onEdited={onEdited}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}

      {overlayPhoto && (
        <div className="comment-photo-overlay" onClick={() => setOverlayPhoto(null)}>
          <img src={overlayPhoto} alt="" />
        </div>
      )}
    </div>
  );
}
