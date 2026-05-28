'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils/formatMoney';

type Analytics = {
  views_total:           number;
  views_7d:              number;
  donations_count:       number;
  donations_sum_kopecks: number;
  avg_donation_kopecks:  number;
};

type Props = { objectId: string };

export function AnalyticsPanel({ objectId }: Props) {
  const [data, setData]     = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch(`/api/admin/objects/${objectId}/analytics`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error.message);
        else setData(j.data as Analytics);
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [objectId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    { title: 'Просмотры всего',    value: data.views_total.toLocaleString('ru') },
    { title: 'Просмотры за 7 дней', value: data.views_7d.toLocaleString('ru') },
    { title: 'Пожертвований',       value: data.donations_count.toLocaleString('ru') },
    { title: 'Собрано',             value: formatMoney(data.donations_sum_kopecks) },
    { title: 'Средний донат',       value: data.donations_count > 0 ? formatMoney(data.avg_donation_kopecks) : '—' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {metrics.map(({ title, value }) => (
        <Card key={title}>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-semibold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
