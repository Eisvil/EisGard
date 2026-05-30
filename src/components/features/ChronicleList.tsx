'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { formatMoney } from '@/lib/utils/formatMoney';
import type { ChronicleEvent } from '@/components/features/MapSection';

type FilterType = 'all' | 'donation' | 'volunteer' | 'material';

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'Все',
  donation: 'Пожертвования',
  volunteer: 'Волонтёрство',
  material: 'Материалы',
};

const EVENT_ICONS: Record<string, string> = {
  donation: '♙',
  volunteer: '◷',
  material: '⚒',
  object_done: '★',
  manual: '♙',
};

function getEventDescription(ev: ChronicleEvent): string {
  if (ev.event_type === 'donation') {
    const amount = ev.amount_kopecks ? formatMoney(ev.amount_kopecks) : '';
    const obj = ev.object_name ? ` на «${ev.object_name}»` : ' на развитие Городища';
    return `пожертвовал${obj}${amount ? ` ${amount}` : ''}`;
  }
  if (ev.event_type === 'volunteer') {
    const obj = ev.object_name ? ` «${ev.object_name}»` : '';
    const pts = ev.points ? ` +${ev.points} баллов` : '';
    return `волонтёрство${obj}${pts}`;
  }
  if (ev.event_type === 'material') {
    const obj = ev.object_name ? ` для «${ev.object_name}»` : '';
    return `передал материалы${obj}`;
  }
  if (ev.event_type === 'object_done') {
    return ev.description ?? `объект завершён${ev.object_name ? ` «${ev.object_name}»` : ''}`;
  }
  return ev.description ?? 'участвует в проекте';
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

type ChronicleListProps = {
  initialData: ChronicleEvent[];
  initialTotal: number;
};

const PER_PAGE = 20;

function pluralEvents(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'событие';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'события';
  return 'событий';
}

export function ChronicleList({ initialData, initialTotal }: ChronicleListProps) {
  const [events, setEvents] = useState<ChronicleEvent[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const prependEvent = useCallback((ev: ChronicleEvent) => {
    setEvents(prev => [ev, ...prev]);
    setTotal(t => t + 1);
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel('chronicle-page')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chronicle_events' },
        (payload) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(async () => {
            const r = payload.new as Record<string, unknown>;
            let objectName: string | null = null;
            let objectSlug: string | null = null;
            if (r.object_id) {
              const { data } = await supabase
                .from('objects')
                .select('name, slug')
                .eq('id', r.object_id as string)
                .single();
              objectName = data?.name ?? null;
              objectSlug = data?.slug ?? null;
            }
            prependEvent({
              id: r.id as string,
              event_type: r.event_type as string,
              display_name: (r.is_anonymous || !r.display_name) ? 'Аноним' : r.display_name as string,
              is_anonymous: r.is_anonymous as boolean,
              avatar_url: null,
              object_name: objectName,
              object_slug: objectSlug,
              amount_kopecks: r.amount_kopecks as number | null,
              points: r.points as number | null,
              description: r.description as string | null,
              created_at: r.created_at as string,
            });
          }, 500);
        }
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [prependEvent]);

  async function loadMore() {
    setLoading(true);
    const nextPage = page + 1;
    const params = new URLSearchParams({
      page: String(nextPage),
      per_page: String(PER_PAGE),
    });
    if (filter !== 'all') params.set('event_type', filter);

    try {
      const res = await fetch(`/api/chronicle?${params}`);
      const json = await res.json() as { data: ChronicleEvent[]; meta: { total: number } };
      setEvents(prev => [...prev, ...json.data]);
      setTotal(json.meta.total);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  async function applyFilter(f: FilterType) {
    setFilter(f);
    setLoading(true);
    setPage(1);
    const params = new URLSearchParams({ page: '1', per_page: String(PER_PAGE) });
    if (f !== 'all') params.set('event_type', f);
    try {
      const res = await fetch(`/api/chronicle?${params}`);
      const json = await res.json() as { data: ChronicleEvent[]; meta: { total: number } };
      setEvents(json.data);
      setTotal(json.meta.total);
    } finally {
      setLoading(false);
    }
  }

  const hasMore = events.length < total;

  return (
    <div className="chronicle-page">
      <div className="chronicle-filters" role="group" aria-label="Фильтр событий">
        {(Object.entries(FILTER_LABELS) as [FilterType, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chronicle-filter${filter === key ? ' active' : ''}`}
            onClick={() => applyFilter(key)}
          >
            {label}{key === filter && total > 0 ? ` (${total})` : ''}
          </button>
        ))}
      </div>

      <p className="chronicle-count">{total} {pluralEvents(total)} в летописи</p>

      {events.length === 0 && !loading && (
        <div className="chronicle-empty-state">
          <p className="chronicle-empty-icon">📜</p>
          <p className="chronicle-empty-title">
            {filter === 'all' ? 'Летопись пока пуста' : 'Событий не найдено'}
          </p>
          {filter === 'all' && (
            <p className="chronicle-empty-sub">
              Стань первым участником — поддержи проект и войди в историю Городища
            </p>
          )}
          {filter === 'all' && (
            <a href="/auth/register" className="primary-button chronicle-empty-cta">
              Стать участником
            </a>
          )}
        </div>
      )}

      <ul className="chronicle-full-list">
        {events.map((ev) => (
          <li key={ev.id} className="chronicle-full-item">
            {ev.avatar_url ? (
              <img src={ev.avatar_url} alt="" className="chronicle-avatar" />
            ) : (
              <span className="chronicle-avatar chronicle-avatar-placeholder" aria-hidden="true">
                {EVENT_ICONS[ev.event_type] ?? '•'}
              </span>
            )}
            <div className="chronicle-body">
              <strong className="chronicle-name">{ev.display_name}</strong>
              {' '}
              <span className="chronicle-action">{getEventDescription(ev)}</span>
              {ev.object_slug && (
                <> — <Link href={`/objects/${ev.object_slug}`} className="chronicle-object-link">{ev.object_name}</Link></>
              )}
            </div>
            <time className="chronicle-time" dateTime={ev.created_at}>
              {formatDateFull(ev.created_at)}
            </time>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="chronicle-load-more">
          <button
            type="button"
            className="text-link"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Загрузка…' : 'Показать ещё'}
          </button>
        </div>
      )}
    </div>
  );
}
