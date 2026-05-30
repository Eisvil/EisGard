import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createStaticSupabaseClient } from '@/lib/supabase/static';
import { formatMoney, getProgress } from '@/lib/utils/formatMoney';
import { OBJECT_STATUS } from '@/lib/constants/objectStatus';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { SlotsSection } from '@/components/features/SlotsSection';
import { DonatedToast } from '@/components/features/DonatedToast';
import { ObjectViewTracker } from '@/components/features/ObjectViewTracker';
import { HistoricalNoteAccordion } from '@/components/features/HistoricalNoteAccordion';
import { CommentsSection } from '@/components/features/CommentsSection';
import { ObjectsGrid } from '@/components/features/ObjectsGrid';
import type { SlotForDonate } from '@/components/features/DonateModal';
import type { ObjectGridItem } from '@/components/features/ObjectsGrid';

type ObjectRow = {
  id: string;
  slug: string;
  name: string;
  zone: string;
  status: string;
  description: unknown;
  historical_note: Record<string, unknown> | null;
  cover_url: string | null;
  total_goal_rub: number;
  total_raised_rub: number;
  allow_comments: boolean;
};

type SlotRow = {
  id: string;
  name: string;
  goal_value: number;
  current_value: number;
  unit: string;
  slot_type: string;
  image_url: string | null;
  description: string | null;
  historical_note: Record<string, unknown> | null;
};

type ChronicleRow = {
  id: string;
  display_name: string;
  is_anonymous: boolean;
  amount_kopecks: number | null;
  created_at: string;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createStaticSupabaseClient() as any;
  const { data } = await supabase
    .from('objects')
    .select('name, description')
    .eq('slug', slug)
    .maybeSingle();
  const name = data?.name ?? 'Объект';
  const desc = typeof data?.description === 'string'
    ? data.description.slice(0, 160)
    : 'Поддержите строительство исторического поселения — поделитесь вкладом в летопись Городища.';
  return {
    title: `${name} — поддержать | Живое Городище`,
    description: desc,
  };
}

export async function generateStaticParams() {
  const supabase = createStaticSupabaseClient();
  const { data } = await supabase
    .from('objects')
    .select('slug')
    .neq('status', 'draft');
  return (data ?? []).map((o: { slug: string }) => ({ slug: o.slug }));
}

type Params = { slug: string };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function getDescription(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'text' in raw) return String((raw as Record<string, unknown>).text);
  return '';
}

export default async function ObjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createStaticSupabaseClient() as any;

  const { data: rawObject } = await supabase
    .from('objects')
    .select('id, slug, name, zone, status, description, historical_note, cover_url, total_goal_rub, total_raised_rub, allow_comments')
    .eq('slug', slug)
    .neq('status', 'draft')
    .maybeSingle();

  const object = rawObject as ObjectRow | null;
  if (!object) notFound();

  const [{ data: rawSlots }, { data: rawChronicle }, { data: rawAllObjects }] = await Promise.all([
    supabase
      .from('slots')
      .select('id, name, goal_value, current_value, unit, slot_type, image_url, description, historical_note')
      .eq('object_id', object.id)
      .eq('is_closed', false)
      .order('sort_order'),
    supabase
      .from('chronicle_events')
      .select('id, display_name, is_anonymous, amount_kopecks, created_at')
      .eq('object_id', object.id)
      .eq('event_type', 'donation')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('objects')
      .select('id, slug, name, short_name, icon_key, cover_url, status, total_raised_rub, total_goal_rub')
      .neq('status', 'draft')
      .order('sort_order'),
  ]);

  const slots = (rawSlots ?? []) as unknown as SlotRow[];
  const chronicle = (rawChronicle ?? []) as ChronicleRow[];
  const allObjects = (rawAllObjects ?? []) as ObjectGridItem[];

  const statusInfo = OBJECT_STATUS[object.status as keyof typeof OBJECT_STATUS] ?? OBJECT_STATUS.planned;
  const pct = getProgress(object.total_raised_rub, object.total_goal_rub);

  // Sequential slot locking: slot N locked if slot N-1 not fully funded
  const allSlots: SlotForDonate[] = slots.map((s, i) => {
    const prevSlot = i > 0 ? slots[i - 1] : null;
    const is_locked = prevSlot !== null && prevSlot.current_value < prevSlot.goal_value;
    return {
      id: s.id,
      name: s.name,
      goal_value: s.goal_value,
      current_value: s.current_value,
      unit: s.unit,
      slot_type: s.slot_type,
      image_url: s.image_url,
      description: s.description,
      historical_note: s.historical_note,
      is_locked,
      prev_slot_name: prevSlot?.name,
    };
  });

  return (
    <>
      <Header />
      <main>
      <div className="object-page-layout">
      <ObjectViewTracker objectId={object.id} />
      <DonatedToast />

      <nav style={{ marginBottom: '16px', fontSize: '14px', fontFamily: 'var(--sans)', color: 'var(--olive-soft)' }}>
        <Link href="/" className="text-link" style={{ fontSize: '14px' }}>← На главную</Link>
      </nav>

      {object.cover_url ? (
        <div className="object-hero">
          <img src={object.cover_url} alt={object.name} fetchPriority="high" />
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

      <ObjectsGrid objects={allObjects} currentSlug={object.slug} />

      <div style={{ marginTop: '28px' }}>
        <div className="eyebrow" style={{ marginBottom: '20px' }}>Выберите направление поддержки</div>
        <SlotsSection
          slots={allSlots}
          objectId={object.id}
          objectSlug={object.slug}
          objectName={object.name}
        />
      </div>

      {getDescription(object.description) && (
        <div className="object-description panel" style={{ padding: '24px' }}>
          <h2>Об объекте</h2>
          <p>{getDescription(object.description)}</p>
        </div>
      )}

      {object.historical_note && (
        <HistoricalNoteAccordion content={object.historical_note} />
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

      <CommentsSection
        objectId={object.id}
        objectSlug={object.slug}
        allowComments={object.allow_comments}
        currentUser={null}
      />
      </div>
      </main>
      <Footer />
    </>
  );
}
