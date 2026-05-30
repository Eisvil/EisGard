import Link from 'next/link';
import { ObjectIcon } from '@/lib/constants/objectIcons';
import { OBJECT_STATUS } from '@/lib/constants/objectStatus';
import { formatMoney, getProgress } from '@/lib/utils/formatMoney';

export type ObjectGridItem = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  icon_key: string | null;
  cover_url: string | null;
  status: string;
  total_raised_rub: number;
  total_goal_rub: number;
};

type Props = {
  objects: ObjectGridItem[];
  currentSlug: string;
};

export function ObjectsGrid({ objects, currentSlug }: Props) {
  if (objects.length === 0) return null;

  return (
    <section className="objects-grid-section">
      <div className="eyebrow"><span />Другие объекты городища<span /></div>
      <div className="objects-grid-track">
        {objects.map((obj) => {
          const isCurrent = obj.slug === currentSlug;
          const info = OBJECT_STATUS[obj.status as keyof typeof OBJECT_STATUS] ?? OBJECT_STATUS.planned;
          const pct = getProgress(obj.total_raised_rub, obj.total_goal_rub);

          return (
            <Link
              key={obj.id}
              href={`/objects/${obj.slug}`}
              className={`object-grid-card${isCurrent ? ' object-grid-card--active' : ''}`}
              style={{ '--status-color': info.color } as React.CSSProperties}
              aria-current={isCurrent ? 'page' : undefined}
            >
              {obj.cover_url ? (
                <img src={obj.cover_url} alt={obj.name} className="object-grid-card-img" />
              ) : (
                <div className="object-grid-card-placeholder" />
              )}
              <span className="badge">{info.label}</span>
              <div className="object-grid-card-body">
                <strong>
                  <ObjectIcon slug={obj.icon_key ?? obj.slug} className="project-icon" />
                  {obj.short_name ?? obj.name}
                </strong>
                <div className="mini-progress">
                  <span style={{ width: `${pct}%` }} />
                </div>
                <small>{formatMoney(obj.total_raised_rub)}{obj.total_goal_rub > 0 ? ` / ${formatMoney(obj.total_goal_rub)}` : ''}</small>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
