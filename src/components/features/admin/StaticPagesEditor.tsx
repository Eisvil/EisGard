'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TiptapEditor } from './TiptapEditor';
import { CheckCircle2, FileText, ExternalLink } from 'lucide-react';

type PageSlug = 'about' | 'privacy' | 'personal-data';

type PageMeta = {
  slug: PageSlug;
  title: string;
  label: string;
  requireConfirm: boolean;
};

const PAGES: PageMeta[] = [
  { slug: 'about', title: 'О проекте', label: 'О проекте', requireConfirm: false },
  { slug: 'privacy', title: 'Политика конфиденциальности', label: 'Политика конфиденциальности', requireConfirm: true },
  { slug: 'personal-data', title: 'Обработка персональных данных', label: 'Обработка персональных данных', requireConfirm: true },
];

const LS_KEY = (slug: string) => `static_page_draft_${slug}`;

function useDraftAutosave(slug: string, body: Record<string, unknown>) {
  useEffect(() => {
    const id = setInterval(() => {
      if (Object.keys(body).length > 0) {
        localStorage.setItem(LS_KEY(slug), JSON.stringify(body));
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [slug, body]);
}

type EditorState = {
  slug: PageSlug;
  title: string;
  body: Record<string, unknown>;
};

export function StaticPagesEditor() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<EditorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingSlug = useRef<PageMeta | null>(null);

  useDraftAutosave(current?.slug ?? '', current?.body ?? {});

  const openPage = useCallback(async (page: PageMeta) => {
    setOpen(true);
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/static-pages/${page.slug}`);
      const json = await res.json();
      const serverBody = json.data?.body ?? {};
      const draftRaw = localStorage.getItem(LS_KEY(page.slug));
      const body = draftRaw ? (JSON.parse(draftRaw) as Record<string, unknown>) : serverBody;
      setCurrent({ slug: page.slug, title: page.title, body });
    } catch {
      setError('Не удалось загрузить страницу');
    } finally {
      setLoading(false);
    }
  }, []);

  function handleClickPage(page: PageMeta) {
    if (page.requireConfirm) {
      pendingSlug.current = page;
      setConfirmOpen(true);
    } else {
      openPage(page);
    }
  }

  async function handleSave() {
    if (!current) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/static-pages/${current.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: current.body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Ошибка');
      localStorage.removeItem(LS_KEY(current.slug));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {PAGES.map(page => (
        <div
          key={page.slug}
          className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
        >
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{page.label}</div>
              <div className="text-xs text-muted-foreground">/{page.slug}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink size={14} />
            </a>
            <Button size="sm" variant="outline" onClick={() => handleClickPage(page)}>
              Редактировать
            </Button>
          </div>
        </div>
      ))}

      {/* Confirm dialog for legal pages */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Редактирование юридической страницы</AlertDialogTitle>
            <AlertDialogDescription>
              Вы собираетесь редактировать «{pendingSlug.current?.label}». Изменения будут опубликованы
              немедленно и могут иметь юридические последствия. Продолжить?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { pendingSlug.current = null; }}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSlug.current) openPage(pendingSlug.current);
                setConfirmOpen(false);
              }}
            >
              Продолжить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={o => { if (!o) { setOpen(false); setCurrent(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{current?.title ?? 'Загрузка...'}</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Загрузка...
            </div>
          )}

          {!loading && current && (
            <>
              <div className="border border-border rounded-md overflow-hidden">
                <TiptapEditor
                  value={current.body}
                  onChange={body => setCurrent(prev => prev ? { ...prev, body } : prev)}
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Черновик сохраняется автоматически каждые 30 сек
                </p>
                <div className="flex items-center gap-2">
                  {saved && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 size={14} /> Сохранено
                    </span>
                  )}
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Сохраняю...' : 'Сохранить'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
