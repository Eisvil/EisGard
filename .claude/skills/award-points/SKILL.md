---
name: award-points
description: "Начисляет баллы и пересчитывает титул. Единственная точка входа."
---

Реализуй и используй только эту функцию:

```typescript
// src/lib/points/awardPoints.ts
import { createServerClient } from '@/lib/supabase/server';

type PointsReason = 'donation' | 'volunteer_day' | 'material';

export async function awardPoints(
  userId: string,
  points: number,
  reason: PointsReason,
  sourceId: string,
  description: string
) {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single();

  const newPoints = (profile?.points ?? 0) + points;

  const { data: newTitle } = await supabase
    .from('titles')
    .select('id')
    .lte('points_threshold', newPoints)
    .order('points_threshold', { ascending: false })
    .limit(1)
    .single();

  await supabase.from('profiles').update({
    points: newPoints,
    title_id: newTitle?.id ?? null,
  }).eq('id', userId);

  await supabase.from('chronicle_entries').insert({
    user_id: userId,
    points_awarded: points,
    reason,
    source_id: sourceId,
    description,
  });
}
```

Вызывать только из: lib/payments/processWebhook.ts, actions/volunteer.ts, actions/materials.ts
НИКОГДА не делать прямой UPDATE profiles SET points вне этой функции.
