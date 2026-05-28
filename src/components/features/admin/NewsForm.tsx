'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TiptapEditor } from '@/components/features/admin/TiptapEditor';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

function slugify(input: string): string {
  const CYRILLIC_MAP: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return input
    .toLowerCase()
    .split('')
    .map((c) => CYRILLIC_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

type NewsFormData = {
  id?: string;
  slug?: string;
  title?: string;
  summary?: string | null;
  body?: Record<string, unknown>;
  cover_url?: string | null;
  tag?: string | null;
  published?: boolean;
};

type NewsFormProps = {
  mode: 'create' | 'edit';
  initialData?: NewsFormData;
};

export function NewsForm({ mode, initialData }: NewsFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [tag, setTag] = useState(initialData?.tag ?? '');
  const [body, setBody] = useState<Record<string, unknown>>(initialData?.body ?? {});
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_url ?? '');
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState('');

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (mode === 'create') setSlug(slugify(v));
  };

  const handleBodyChange = useCallback((json: Record<string, unknown>) => {
    setBody(json);
  }, []);

  async function uploadCover(file: File) {
    setCoverUploading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `covers/${Date.now()}.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from('news-images')
        .upload(path, file, { upsert: false });
      if (uploadError || !data) { setError('Ошибка загрузки обложки'); return; }
      const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(data.path);
      setCoverUrl(publicUrl);
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSave(publish?: boolean) {
    setSaving(true);
    setError('');
    const finalPublished = publish !== undefined ? publish : published;
    try {
      const payload = {
        title,
        summary: summary || null,
        body,
        cover_url: coverUrl || null,
        tag: tag || null,
        published: finalPublished,
      };

      let res: Response;
      if (mode === 'create') {
        res = await fetch('/api/admin/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/news/${initialData?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json() as { error?: { message?: string } };
      if (!res.ok) {
        setError(json.error?.message ?? 'Ошибка сохранения');
        return;
      }

      router.push('/admin/news');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="news-title">Заголовок *</Label>
        <Input
          id="news-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Начат сруб кузницы"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="news-slug">Slug</Label>
        <Input
          id="news-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="nachat-srub-kuznitsy"
          maxLength={80}
          disabled={mode === 'edit'}
          className={mode === 'edit' ? 'opacity-60' : ''}
        />
        <p className="text-xs text-muted-foreground">Автогенерируется из заголовка. При создании можно изменить.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="news-summary">Краткое описание (для главной)</Label>
        <Textarea
          id="news-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Краткое описание до 500 символов..."
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">{summary.length}/500</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="news-tag">Тег</Label>
        <Input
          id="news-tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="РЕМЕСЛО"
          maxLength={60}
        />
      </div>

      <div className="space-y-2">
        <Label>Обложка</Label>
        <div className="flex items-center gap-3">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
            disabled={coverUploading}
            className="max-w-xs"
          />
          {coverUploading && <span className="text-sm text-muted-foreground">Загрузка…</span>}
        </div>
        {coverUrl && (
          <img src={coverUrl} alt="" className="mt-2 h-32 w-48 rounded object-cover" />
        )}
      </div>

      <div className="space-y-2">
        <Label>Содержание</Label>
        <TiptapEditor value={body} onChange={handleBodyChange} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={() => handleSave(false)}
          variant="outline"
          disabled={saving || !title}
        >
          {saving ? 'Сохранение…' : 'Сохранить черновик'}
        </Button>
        <Button
          onClick={() => handleSave(true)}
          disabled={saving || !title}
        >
          {saving ? 'Публикация…' : (published ? 'Сохранить' : 'Опубликовать')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/news')}
          disabled={saving}
        >
          Отмена
        </Button>
      </div>
    </div>
  );
}
