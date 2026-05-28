import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatMoney, getProgress } from '@/lib/utils/formatMoney';
import { OBJECT_STATUS } from '@/lib/constants/objectStatus';
import { SlotsSection } from '@/components/features/SlotsSection';
import { DonatedToast } from '@/components/features/DonatedToast';
import { SubscribeSectionClient } from '@/components/features/SubscribeSectionClient';
import { ObjectViewTracker } from '@/components/features/ObjectViewTracker';
import type { SlotForDonate } from '@/components/features/DonateModal';

type ObjectRow = {
  id: string;
  slug: string;
  name: string;
  zone: string;
  status: string;
  description: unknown;
  cover_url: string | null;
  total_goal_rub: number;
  total_raised_rub: number;
};

type SlotRow = {
  id: string;
  name: string;
  goal_value: number;
  current_value: number;
  unit: string;
  slot_type: string;
};

type ChronicleRow = {
  id: string;
  display_name: string;
  is_anonymous: boolean;
  amount_kopecks: number | null;
  created_at: string;
};

type Params = { slug: string };
type SearchParams = { donated?: string };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function getDescription(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'text' in raw) return String((raw as Record<string, unknown>).text);
  return '';
}

export default async function ObjectPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { donated } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  let profileName: string | undefined;
  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle() as { data: { full_name: string } | null };
    profileName = prof?.full_name ?? undefined;
  }

  const { data: rawObject } = await supabase
    .from('objects')
    .select('id, slug, name, zone, status, description, cover_url, total_goal_rub, total_raised_rub')
    .eq('slug', slug)
    .neq('status', 'draft')
    .maybeSingle();

  const object = rawObject as ObjectRow | null;
  if (!object) notFound();

  const { data: rawSlots } = await supabase
    .from('slots')
    .select('id, name, goal_value, current_value, unit, slot_type')
    .eq('object_id', object.id)
    .eq('slot_type', 'money')
    .eq('is_closed', false)
    .order('sort_order');

  const { data: rawChronicle } = await supabase
    .from('chronicle_events')
    .select('id, display_name, is_anonymous, amount_kopecks, created_at')
    .eq('object_id', object.id)
    .eq('event_type', 'donation')
    .order('created_at', { ascending: false })
    .limit(20);

  const slots = (rawSlots ?? []) as SlotRow[];
  const chronicle = (rawChronicle ?? []) as ChronicleRow[];

  const statusInfo = OBJECT_STATUS[object.status as keyof typeof OBJECT_STATUS] ?? OBJECT_STATUS.planned;
  const pct = getProgress(object.total_raised_rub, object.total_goal_rub);
  const moneySlots: SlotForDonate[] = slots.map((s) => ({
    id: s.id,
    name: s.name,
    goal_value: s.goal_value,
    current_value: s.current_value,
    unit: s.unit,
  }));

  return (
    <div className="object-page-layout">
      <ObjectViewTracker objectId={object.id} />
      <DonatedToast show={donated === 'true'} />

      <nav style={{ marginBottom: '16px', fontSize: '14px', fontFamily: 'var(--sans)', color: 'var(--olive-soft)' }}>
        <Link href="/" className="text-link" style={{ fontSize: '14px' }}>← На главную</Link>
      </nav>

      {object.cover_url ? (
        <div className="object-hero">
          <img src={object.cover_url} alt={object.name} />
          <div className="object-hero-overlay">
            <h1>{object.name}</h1>
            <span
              className="badge"
              style={{ '--status-color': statusInfo.color } as React.CSSProperties}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="object-hero-placeholder" style={{ position: 'relative' }}>
          <span>🏰</span>
          <h1 style={{ position: 'absolute', bottom: '24px', left: '28px', color: 'var(--olive-dark)', fontSize: '28px', fontFamily: 'var(--serif)', margin: 0 }}>
            {object.name}
          </h1>
        </div>
      )}

      {object.total_goal_rub > 0 && (
        <div className="object-progress-section panel" style={{ padding: '20px 24px' }}>
          <div className="object-progress-header">
            <span className="raised">{formatMoney(object.total_raised_rub)}</span>
            <span className="goal">из {formatMoney(object.total_goal_rub)}</span>
            <span className="pct">{pct}%</span>
          </div>
          <div className="progress">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div style={{ marginTop: '28px' }}>
        <div className="eyebrow" style={{ marginBottom: '20px' }}>Поддержать объект</div>
        <SlotsSection slots={moneySlots} objectId={object.id} objectSlug={object.slug} defaultName={profileName} />
        {isLoggedIn && (
          <SubscribeSectionClient
            objectId={object.id}
            objectSlug={object.slug}
            objectName={object.name}
            defaultName={profileName}
          />
        )}
      </div>

      {getDescription(object.description) && (
        <div className="object-description panel" style={{ padding: '24px' }}>
          <h2>Об объекте</h2>
          <p>{getDescription(object.description)}</p>
        </div>
      )}

      {chronicle.length > 0 && (
        <div className="object-chronicle">
          <h2>Летопись вкладов</h2>
          <div className="chronicle-list">
            {chronicle.map((e) => (
              <div key={e.id} className="chronicle-item">
                <span className="name">
                  {e.is_anonymous ? 'Аноним' : (e.display_name || 'Участник')}
                </span>
                <span>пожертвовал</span>
                {e.amount_kopecks != null && (
                  <span className="amount">{formatMoney(e.amount_kopecks)}</span>
                )}
                <span className="time">{formatDate(e.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
