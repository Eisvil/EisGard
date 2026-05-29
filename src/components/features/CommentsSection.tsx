'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { CommentCard } from './CommentCard';
import type { CommentData } from './CommentCard';

const CommentEditor = dynamic(
  () => import('./CommentEditor').then((m) => ({ default: m.CommentEditor })),
  { ssr: false }
);

type Props = {
  objectId: string;
  objectSlug: string;
  allowComments: boolean;
  currentUser: { id: string; name?: string; role?: string } | null;
};

export function CommentsSection({ objectId, objectSlug, allowComments, currentUser }: Props) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [replies, setReplies] = useState<Record<string, CommentData[]>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [banMessage, setBanMessage] = useState<string | null>(null);

  async function fetchPage(p: number, append = false) {
    setLoading(true);
    try {
      const res = await fetch(`/api/objects/${objectSlug}/comments?page=${p}`);
      const json = await res.json() as {
        data?: CommentData[];
        replies?: CommentData[];
        meta?: { total: number };
      };
      if (json.data) {
        setComments((prev) => append ? [...prev, ...json.data!] : json.data!);
        setTotal(json.meta?.total ?? 0);
        if (json.replies) {
          const grouped: Record<string, CommentData[]> = {};
          for (const r of json.replies) {
            if (r.parent_id) {
              if (!grouped[r.parent_id]) grouped[r.parent_id] = [];
              grouped[r.parent_id].push(r);
            }
          }
          setReplies((prev) => append ? { ...prev, ...grouped } : grouped);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!allowComments) return;
    fetchPage(1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createBrowserSupabaseClient() as any;
    const channel = supabase
      .channel(`comments:${objectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'object_comments', filter: `object_id=eq.${objectId}` },
        async (payload: { new: { id: string } }) => {
          const newId = payload.new.id;
          const { data } = await supabase
            .from('object_comments')
            .select('id, body, photos, created_at, updated_at, parent_id, user:profiles!user_id(id, full_name, avatar_url)')
            .eq('id', newId)
            .maybeSingle();
          if (!data) return;
          const comment = data as unknown as CommentData;
          setComments((prev) => {
            if (prev.some((c) => c.id === newId)) return prev; // already added by handleNewComment
            return [comment, ...prev];
          });
          setTotal((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectId, objectSlug, allowComments]);

  async function handleNewComment(body: Record<string, unknown>, photos: string[]) {
    const res = await fetch(`/api/objects/${objectSlug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, photos }),
    });
    const json = await res.json() as { data?: CommentData; error?: { code: string; message?: string } };
    if (!res.ok) {
      if (json.error?.code === 'BANNED') setBanMessage(json.error.message ?? null);
      throw new Error(json.error?.message ?? 'Ошибка');
    }
    if (json.data) {
      setComments((prev) => [json.data!, ...prev]);
      setTotal((prev) => prev + 1);
    }
  }

  function handleDeleted(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
    setReplies((prev) => {
      const next = { ...prev };
      delete next[id];
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((r) => r.id !== id);
      }
      return next;
    });
    setTotal((prev) => Math.max(0, prev - 1));
  }

  function handleEdited(updated: CommentData) {
    if (updated.parent_id) {
      setReplies((prev) => ({
        ...prev,
        [updated.parent_id!]: (prev[updated.parent_id!] ?? []).map((r) =>
          r.id === updated.id ? updated : r
        ),
      }));
    } else {
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
  }

  function handleReplyAdded(reply: CommentData) {
    if (!reply.parent_id) return;
    setReplies((prev) => ({
      ...prev,
      [reply.parent_id!]: [...(prev[reply.parent_id!] ?? []), reply],
    }));
  }

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  }

  if (!allowComments) return null;

  return (
    <section className="comments-section">
      <h2>
        Комментарии
        {total > 0 && (
          <span style={{ fontFamily: 'var(--sans)', fontWeight: 400, fontSize: '16px', color: 'var(--olive-soft)', marginLeft: '8px' }}>
            ({total})
          </span>
        )}
      </h2>

      {currentUser ? (
        <CommentEditor
          objectSlug={objectSlug}
          userId={currentUser.id}
          onSubmit={handleNewComment}
          banMessage={banMessage}
        />
      ) : (
        <p style={{ fontFamily: 'var(--sans)', fontSize: '14px', color: 'var(--olive-soft)', marginBottom: '24px' }}>
          <a href="/login" className="text-link">Войдите</a>, чтобы оставить комментарий.
        </p>
      )}

      {loading && comments.length === 0 ? (
        <p style={{ color: 'var(--olive-soft)', fontFamily: 'var(--sans)' }}>Загрузка…</p>
      ) : !loading && comments.length === 0 ? (
        <p style={{ color: 'var(--olive-soft)', fontFamily: 'var(--sans)' }}>Пока нет комментариев. Будьте первым!</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              replies={replies[comment.id] ?? []}
              currentUser={currentUser}
              objectSlug={objectSlug}
              onDeleted={handleDeleted}
              onEdited={handleEdited}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}

      {comments.length < total && (
        <button
          type="button"
          className="comment-load-more text-link"
          onClick={handleLoadMore}
          disabled={loading}
          style={{ marginTop: '20px', display: 'block', width: '100%', textAlign: 'center' }}
        >
          {loading ? 'Загрузка…' : `Показать ещё (${total - comments.length})`}
        </button>
      )}
    </section>
  );
}
