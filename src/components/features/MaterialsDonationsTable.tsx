const STATUS_LABELS: Record<string, string> = {
  pending: 'На рассмотрении',
  contacted: 'Связались',
  not_contacted: 'Не удалось связаться',
  received: 'Получено',
  cancelled: 'Отменено',
};

export interface MaterialApplicationRow {
  id: string;
  materialName: string | null;
  unit: string | null;
  quantity: number;
  actual_qty: number | null;
  status: string;
  created_at: string;
}

interface Props {
  applications: MaterialApplicationRow[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function MaterialsDonationsTable({ applications }: Props) {
  if (applications.length === 0) {
    return <p className="profile-empty">Заявок на материалы пока нет.</p>;
  }

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Материал</th>
            <th>Количество</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id}>
              <td>{formatDate(a.created_at)}</td>
              <td>{a.materialName ?? '—'}</td>
              <td>
                {a.actual_qty != null
                  ? `${a.actual_qty} ${a.unit ?? ''}`
                  : `${a.quantity} ${a.unit ?? ''}`}
              </td>
              <td>
                <span
                  className="sub-status-badge"
                  data-status={a.status}
                >
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
