import Link from 'next/link';
import { formatMoney } from '@/lib/utils/formatMoney';

export interface DonationRow {
  id: string;
  amount_kopecks: number;
  points_awarded: number;
  confirmed_at: string | null;
  objectName: string | null;
  objectSlug: string | null;
}

interface Props {
  donations: DonationRow[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DonationsTable({ donations }: Props) {
  if (donations.length === 0) {
    return <p className="profile-empty">Пожертвований пока нет.</p>;
  }

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Объект</th>
            <th>Сумма</th>
            <th>Баллы</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((d) => (
            <tr key={d.id}>
              <td>{d.confirmed_at ? formatDate(d.confirmed_at) : '—'}</td>
              <td>
                {d.objectSlug ? (
                  <Link href={`/objects/${d.objectSlug}`} className="text-link">
                    {d.objectName ?? d.objectSlug}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--olive-soft)' }}>
                    {d.objectName ?? 'Объект удалён'}
                  </span>
                )}
              </td>
              <td>{formatMoney(d.amount_kopecks)}</td>
              <td>+{d.points_awarded.toLocaleString('ru-RU')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
