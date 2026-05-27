const STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
  completed: 'Завершена',
};

export interface VolunteerApplicationRow {
  id: string;
  campName: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  days_worked: number | null;
  points_awarded: number;
  status: string;
  created_at: string;
}

interface Props {
  applications: VolunteerApplicationRow[];
}

function formatDateRange(from: string | null, to: string | null): string {
  if (!from) return '—';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return to ? `${fmt(from)} — ${fmt(to)}` : fmt(from);
}

export function VolunteerTable({ applications }: Props) {
  if (applications.length === 0) {
    return <p className="profile-empty">Волонтёрских заявок пока нет.</p>;
  }

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>Заезд</th>
            <th>Даты</th>
            <th>Статус</th>
            <th>Дни</th>
            <th>Баллы</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td>{a.campName ?? '—'}</td>
              <td>{formatDateRange(a.dateFrom, a.dateTo)}</td>
              <td>
                <span
                  className="sub-status-badge"
                  data-status={a.status}
                >
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </td>
              <td>{a.days_worked ?? '—'}</td>
              <td>{a.points_awarded > 0 ? `+${a.points_awarded.toLocaleString('ru-RU')}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
