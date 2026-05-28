'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Coins, Clock, CreditCard, Package, Users, Handshake } from 'lucide-react';
import { ObjectIcon } from '@/lib/constants/objectIcons';
import { OBJECT_STATUS } from '@/lib/constants/objectStatus';
import { ZONES, ZONE_LABELS, type ZoneKey } from '@/lib/constants/zones';
import { formatMoney as _formatMoney, getProgress as _getProgress } from '@/lib/utils/formatMoney';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export type ChronicleEvent = {
  id: string;
  event_type: string;
  display_name: string;
  is_anonymous: boolean;
  avatar_url: string | null;
  object_name: string | null;
  object_slug: string | null;
  amount_kopecks: number | null;
  points: number | null;
  description: string | null;
  created_at: string;
};

export type NewsItem = {
  slug: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  tag: string | null;
  published_at: string | null;
};

export type SiteStats = {
  users: number;
  raised_kopecks: number;
  volunteer_days: number;
  objects_done: number;
};

export type UserProfile = {
  name: string;
  title?: string;
  points: number;
  donated_kopecks: number;
  volunteer_days: number;
  avatar_url?: string | null;
};

export type SettlementObject = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  zone: string;
  status: string;
  description: unknown;
  cover_url: string | null;
  icon_key: string | null;
  map_position_x: string | number | null;
  map_position_y: string | number | null;
  total_goal_rub: number;
  total_raised_rub: number;
};

const formatMoney = _formatMoney;
const getProgress = _getProgress;

function getDescription(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'text' in raw) return String((raw as Record<string, unknown>).text);
  return '';
}

function getSlotsLabel(obj: SettlementObject): string {
  if (obj.status === 'working') return 'Открыта для гостей';
  if (obj.status === 'done') return 'Построено вместе';
  return '';
}

function getStatusInfo(status: string) {
  return OBJECT_STATUS[status as keyof typeof OBJECT_STATUS] ?? OBJECT_STATUS.planned;
}

const ALL_ZONES = 'Все зоны' as const;

function formatTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60) || 1} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 172800) return 'вчера';
  return `${Math.floor(diff / 86400)} дн назад`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

type MapSectionProps = {
  objects: SettlementObject[];
  initialChronicle?: ChronicleEvent[];
  newsItems?: NewsItem[];
  siteStats?: SiteStats;
  userProfile?: UserProfile;
};

export function MapSection({ objects, initialChronicle = [], newsItems = [], siteStats, userProfile }: MapSectionProps) {
  const router = useRouter();
  const defaultObj = objects.find(o => o.slug === 'kuznitsa') ?? objects[0];
  const [selectedId, setSelectedId] = useState(defaultObj?.id ?? '');
  const [activeZone, setActiveZone] = useState<string>(ALL_ZONES);
  const [mapScale, setMapScale] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const [chronicles, setChronicles] = useState<ChronicleEvent[]>(initialChronicle);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapCanvasRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);
  const [hotspotStyle, setHotspotStyle] = useState<React.CSSProperties>({});

  function updateHotspotBounds() {
    const canvas = mapCanvasRef.current;
    const img = mapImageRef.current;
    if (!canvas || !img || !img.naturalWidth || !img.naturalHeight) return;
    const cW = canvas.clientWidth;
    const cH = canvas.clientHeight;
    const scale = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    setHotspotStyle({
      position: 'absolute',
      left: (cW - w) / 2,
      top: (cH - h) / 2,
      right: 'auto',
      bottom: 'auto',
      width: w,
      height: h,
    });
  }

  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(updateHotspotBounds);
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prependChronicle = useCallback((event: ChronicleEvent) => {
    setChronicles(prev => [event, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel('chronicle-home')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chronicle_events' },
        (payload) => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const r = payload.new as Record<string, unknown>;
            prependChronicle({
              id: r.id as string,
              event_type: r.event_type as string,
              display_name: (r.is_anonymous || !r.display_name) ? 'Аноним' : r.display_name as string,
              is_anonymous: r.is_anonymous as boolean,
              avatar_url: null,
              object_name: null,
              object_slug: null,
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
  }, [prependChronicle]);

  const selected = objects.find(o => o.id === selectedId) ?? objects[0];

  const visibleCards = activeZone === ALL_ZONES
    ? objects.slice(0, 4)
    : objects.filter(o => ZONE_LABELS[o.zone as ZoneKey] === activeZone);

  const hotspots = objects.filter(
    o => o.map_position_x != null && o.map_position_y != null
  );

  function selectObject(id: string) {
    setSelectedId(id);
  }

  function handleZoom(delta: number) {
    setMapScale(prev => Math.max(1, Math.min(1.18, prev + delta)));
  }

  function showToast(message: string) {
    setToastMsg(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2600);
  }

  const selStatus = selected ? getStatusInfo(selected.status) : null;
  const selProgress = selected
    ? getProgress(selected.total_raised_rub, selected.total_goal_rub)
    : 0;
  const selDesc = selected ? getDescription(selected.description) : '';

  function renderMoneyLabel(raised: number, goal: number, status: string) {
    if (status === 'working' && raised === 0) return 'Содержится сообществом';
    if (goal === 0) return formatMoney(raised);
    return `${formatMoney(raised)} / ${formatMoney(goal)}`;
  }

  return (
    <>
      {/* Left sidebar — selected object */}
      <aside className="feature panel" aria-label="Выбранный объект">
        <p className="eyebrow"><span></span> Объект городища <span></span></p>
        {selected && (
          <>
            <h1>{selected.name}</h1>
            <p className="selected-zone">
              {ZONE_LABELS[selected.zone as ZoneKey]} зона
            </p>
            {selected.cover_url && (
              <img
                className="selected-photo"
                src={selected.cover_url}
                alt={selected.name}
              />
            )}
            <p className="selected-description">{selDesc}</p>
            <div className="progress-heading">
              <span>Прогресс объекта</span>
              <strong>{selProgress}%</strong>
            </div>
            <div className="progress">
              <span style={{ width: `${selProgress}%` }}></span>
            </div>
            <p className="money">
              <strong>
                {renderMoneyLabel(
                  selected.total_raised_rub,
                  selected.total_goal_rub,
                  selected.status
                )}
              </strong>
            </p>
            <button
              className="primary-button donate"
              type="button"
              onClick={() => router.push(`/objects/${selected.slug}`)}
            >
              Поддержать объект
            </button>
          </>
        )}
      </aside>

      {/* Map */}
      <section className="settlement-map" aria-label="Интерактивная карта поселения">
        <div className="map-canvas" ref={mapCanvasRef}>
          <img
            ref={mapImageRef}
            src="/map/settlement.png"
            alt="Иллюстрированная карта городища с постройками"
            id="map-image"
            style={{ transform: `scale(${mapScale})` }}
            onLoad={updateHotspotBounds}
          />

          {/* Player HUD */}
          <section className="player-hud" aria-label="Профиль участника">
            <div className="player-avatar" aria-hidden="true">
              {userProfile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userProfile.avatar_url} alt={userProfile.name} style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <svg viewBox="0 0 44 44">
                  <path className="avatar-bg" d="M22 2a20 20 0 1 1 0 40 20 20 0 0 1 0-40Z" />
                  <path className="avatar-face" d="M22 9.2c4.1 0 6.5 3.2 6.5 7.5 0 3.5-1.8 6.6-4.5 7.6l1.1 3.1 6.9 3.8v5.1H12v-5.1l6.9-3.8 1-3.1c-2.6-1.1-4.4-4.1-4.4-7.6 0-4.3 2.4-7.5 6.5-7.5Z" />
                  <path className="avatar-coat" d="M13.1 36.4v-4.1l6.2-3.7 2.7 4.1 2.7-4.1 6.2 3.7v4.1H13.1Z" />
                </svg>
              )}
            </div>
            <div className="player-identity">
              <strong>{userProfile?.name ?? 'Гость городища'}</strong>
              <small>{userProfile?.title ?? (userProfile ? 'Участник' : 'Войдите, чтобы участвовать')}</small>
            </div>
            <div className="player-resources" aria-label="Ресурсы участника">
              <span><b><Star size={15} strokeWidth={1.75} aria-hidden="true" /></b> {userProfile ? userProfile.points.toLocaleString('ru') : '—'} <small>баллов</small></span>
              <span><b><Coins size={15} strokeWidth={1.75} aria-hidden="true" /></b> {userProfile ? Math.round(userProfile.donated_kopecks / 100).toLocaleString('ru') : '—'} <small>руб.</small></span>
              <span><b><Clock size={15} strokeWidth={1.75} aria-hidden="true" /></b> {userProfile ? userProfile.volunteer_days : '—'} <small>дн</small></span>
            </div>
          </section>

          {/* Hotspots — positioned to match actual rendered image bounds */}
          <div className="hotspots" style={hotspotStyle}>
            {hotspots.map(obj => {
              const x = Number(obj.map_position_x);
              const y = Number(obj.map_position_y);
              const labelSide = x > 70 ? 'label-left' : 'label-right';
              return (
                <button
                  key={obj.id}
                  type="button"
                  className={`hotspot ${obj.id === selectedId ? 'selected' : ''} ${labelSide}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  aria-label={obj.short_name ?? obj.name}
                  onClick={() => selectObject(obj.id)}
                >
                  <span className="hotspot-label">{obj.short_name ?? obj.name}</span>
                  <span className="hotspot-round">
                    <ObjectIcon slug={obj.icon_key ?? obj.slug} className="hotspot-icon" />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Zoom */}
          <div className="zoom panel">
            <button type="button" aria-label="Приблизить" onClick={() => handleZoom(0.06)}>+</button>
            <button type="button" aria-label="Отдалить" onClick={() => handleZoom(-0.06)}>−</button>
          </div>

          {/* Legend */}
          <ul className="legend panel" aria-label="Статусы объектов">
            <li><span className="planned"></span>Замысел</li>
            <li><span className="building"></span>Строится</li>
            <li><span className="done"></span>Завершён</li>
            <li><span className="working"></span>Действует</li>
          </ul>
        </div>
      </section>

      {/* Right rail */}
      <aside className="right-rail">
        <section className="stats panel" aria-label="Показатели проекта">
          <h2>Строим вместе</h2>
          <dl>
            <div>
              <dt className="icon" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                  <path d="M16 13.5a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4ZM9.5 24v-3.1c0-3.1 2.9-5.2 6.5-5.2s6.5 2.1 6.5 5.2V24M7.5 12.2a3.1 3.1 0 1 0 0-6.2M7.5 15c-2.9 0-5 1.8-5 4.2v2.5h4.2M24.5 12.2a3.1 3.1 0 1 1 0-6.2M24.5 15c2.9 0 5 1.8 5 4.2v2.5h-4.2" />
                </svg>
              </dt>
              <dd><strong>{(siteStats?.users ?? 0).toLocaleString('ru')}</strong><small>Участники проекта</small></dd>
            </div>
            <div>
              <dt className="icon" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                  <path d="M7 13h18v12H7zM9.5 13V9h13v4M5 25h22M11 17v4M16 17v4M21 17v4" />
                  <path className="icon-detail" d="M13 8c0-2 1.6-3.5 3-3.5S19 6 19 8" />
                </svg>
              </dt>
              <dd><strong>{formatMoney(siteStats?.raised_kopecks ?? 0)}</strong><small>Собрано средств</small></dd>
            </div>
            <div>
              <dt className="icon" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                  <path d="M10 4h12M10 28h12M11 5c0 6.2 5 6 5 11s-5 4.8-5 11M21 5c0 6.2-5 6-5 11s5 4.8 5 11" />
                  <path className="icon-detail" d="M13 9h6l-3 4-3-4ZM13 24h6l-3-4-3 4Z" />
                </svg>
              </dt>
              <dd><strong>{(siteStats?.volunteer_days ?? 0).toLocaleString('ru')} дн</strong><small>Волонтёрских дней</small></dd>
            </div>
            <div>
              <dt className="icon" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                  <path d="M4 15.5 16 5l12 10.5M7 13v13h18V13M13 26v-8h6v8" />
                  <path className="icon-detail" d="M21 9V5h3v7" />
                </svg>
              </dt>
              <dd><strong>{siteStats?.objects_done ?? 0}</strong><small>Объектов завершено</small></dd>
            </div>
          </dl>
          <h3 className="rail-section-title">Летопись</h3>
          <ul className="activity">
            {chronicles.length === 0 && (
              <li><span style={{ color: '#9a927f', fontSize: 13 }}>Событий пока нет</span></li>
            )}
            {chronicles.slice(0, 3).map((ev, i) => (
              <li key={ev.id}>
                {ev.avatar_url ? (
                  <img src={ev.avatar_url} alt="" className="portrait" style={{ objectFit: 'cover' }} />
                ) : (
                  <b className={`portrait p${(i % 3) + 1}`} aria-hidden="true"></b>
                )}
                <span>
                  {ev.display_name}
                  <small>
                    {ev.event_type === 'donation' && ev.amount_kopecks
                      ? <>пожертвовал{ev.object_name ? ` на «${ev.object_name}»` : ''}<br /><strong>{formatMoney(ev.amount_kopecks)}</strong></>
                      : ev.event_type === 'volunteer'
                      ? <>волонтёр{ev.object_name ? ` «${ev.object_name}»` : ''}{ev.points ? <><br /><strong>+{ev.points} баллов</strong></> : null}</>
                      : ev.event_type === 'material'
                      ? <>передал материалы</>
                      : ev.description ?? 'участвует в проекте'}
                  </small>
                </span>
                <time>{formatTimeAgo(ev.created_at)}</time>
              </li>
            ))}
          </ul>
          <button
            className="text-link full-link"
            type="button"
            onClick={() => router.push('/chronicle')}
          >
            Вся летопись <span>→</span>
          </button>
        </section>
      </aside>

      {/* Objects panel */}
      <section className="objects panel" aria-labelledby="objects-heading">
        <div className="objects-header">
          <h2 id="objects-heading">Объекты городища</h2>
          <div className="filters" aria-label="Фильтр зоны">
            <button
              type="button"
              className={`filter${activeZone === ALL_ZONES ? ' active' : ''}`}
              onClick={() => setActiveZone(ALL_ZONES)}
            >
              Все зоны
            </button>
            {ZONES.map(zone => (
              <button
                key={zone}
                type="button"
                className={`filter${activeZone === zone ? ' active' : ''}`}
                onClick={() => setActiveZone(zone)}
              >
                {zone}
              </button>
            ))}
          </div>
          <button
            className="text-link all-objects"
            type="button"
            onClick={() => showToast('Раздел готовится к публикации')}
          >
            Все объекты <span>→</span>
          </button>
        </div>
        <div className="cards">
          {visibleCards.map(obj => {
            const info = getStatusInfo(obj.status);
            const prog = getProgress(obj.total_raised_rub, obj.total_goal_rub);
            const slotsLabel = getSlotsLabel(obj);
            return (
              <button
                key={obj.id}
                type="button"
                className={`object-card${obj.id === selectedId ? ' selected' : ''}`}
                style={{ '--status-color': info.color } as React.CSSProperties}
                onClick={() => router.push(`/objects/${obj.slug}`)}
              >
                {obj.cover_url
                  ? <img src={obj.cover_url} alt={obj.name} />
                  : <span className="object-card-placeholder" aria-hidden="true" />
                }
                <span className="badge">{info.label}</span>
                <div className="object-copy">
                  <h3>
                    <ObjectIcon slug={obj.icon_key ?? obj.slug} className="project-icon" />
                    <span>{obj.short_name ?? obj.name}</span>
                  </h3>
                  <div className="mini-progress">
                    <span style={{ width: `${prog}%` }}></span>
                  </div>
                  <p>
                    {formatMoney(obj.total_raised_rub)}
                    {obj.total_goal_rub > 0 && ` / ${formatMoney(obj.total_goal_rub)}`}
                  </p>
                  {slotsLabel && <small>{slotsLabel}</small>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Support panel */}
      <section className="support panel" id="support" aria-labelledby="support-heading">
        <h2 id="support-heading">Как поддержать</h2>
        <div className="support-grid">
          <button type="button" onClick={() => showToast('Направление: Финансовая поддержка')}>
            <b><CreditCard size={28} strokeWidth={1.5} aria-hidden="true" /></b><strong>Финансовая поддержка</strong><small>Разовый или ежемесячный вклад</small>
          </button>
          <button type="button" onClick={() => showToast('Направление: Материалы и инструменты')}>
            <b><Package size={28} strokeWidth={1.5} aria-hidden="true" /></b><strong>Материалы и инструменты</strong><small>Древесина, металл, инструменты и другое</small>
          </button>
          <button type="button" onClick={() => showToast('Направление: Волонтёрство')}>
            <b><Users size={28} strokeWidth={1.5} aria-hidden="true" /></b><strong>Волонтёрство</strong><small>Помощь руками и участие в жизни</small>
          </button>
          <button type="button" onClick={() => showToast('Направление: Партнёрство')}>
            <b><Handshake size={28} strokeWidth={1.5} aria-hidden="true" /></b><strong>Партнёрство</strong><small>Поддержка от бизнеса и организаций</small>
          </button>
        </div>
      </section>

      {/* Chronicle / News */}
      <section className="chronicle panel" id="chronicle" aria-labelledby="chronicle-heading">
        <h2 id="chronicle-heading">Новости<br />городища</h2>
        {newsItems.length === 0 && (
          <article style={{ gridColumn: '2 / -1', color: '#9a927f', fontSize: 14, alignSelf: 'center' }}>
            Новостей пока нет — следите за обновлениями.
          </article>
        )}
        {newsItems.slice(0, 5).map((n) => (
          <article key={n.slug} style={{ cursor: 'pointer' }} onClick={() => router.push(`/news/${n.slug}`)}>
            {n.cover_url
              ? <img src={n.cover_url} alt="" />
              : <div style={{ width: 88, height: 112, borderRadius: 5, background: '#e8dfc8', flexShrink: 0 }} />
            }
            <div>
              <time>{n.published_at ? formatDate(n.published_at) : ''}</time>
              <h3>{n.title}</h3>
              {n.summary && <p>{n.summary.slice(0, 80)}{n.summary.length > 80 ? '…' : ''}</p>}
              {n.tag && <small>{n.tag.toUpperCase()}</small>}
            </div>
          </article>
        ))}
      </section>

      {/* Toast */}
      <div
        className={`toast${toastMsg ? ' visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toastMsg}
      </div>
    </>
  );
}
