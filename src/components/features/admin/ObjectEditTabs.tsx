'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObjectForm } from './ObjectForm';
import { SlotsManager } from './SlotsManager';
import { AnalyticsPanel } from './AnalyticsPanel';
import { DeleteObjectDialog } from './DeleteObjectDialog';

type ZoneKey = 'craft' | 'public' | 'farming' | 'military' | 'residential';
type StatusKey = 'draft' | 'planned' | 'building' | 'done' | 'working';

type Slot = {
  id: string;
  slot_type: 'money' | 'labor';
  name: string;
  goal_value: number;
  unit: string;
  current_value: number;
  is_closed: boolean;
  sort_order: number;
  image_url: string | null;
  description: string | null;
  historical_note: Record<string, unknown> | null;
};

type ObjectWithSlots = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  zone: ZoneKey;
  status: StatusKey;
  description: string | null;
  cover_url: string | null;
  icon_key: string | null;
  map_position_x: number | null;
  map_position_y: number | null;
  sort_order: number;
  allow_comments: boolean;
  historical_note: Record<string, unknown> | null;
  slots: Slot[];
};

type Props = { object: ObjectWithSlots };

export function ObjectEditTabs({ object }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{object.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">/{object.slug}</p>
        </div>
        <DeleteObjectDialog objectId={object.id} objectName={object.name} />
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="slots">Слоты ({object.slots.length})</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <ObjectForm mode="edit" object={object} />
        </TabsContent>

        <TabsContent value="slots" className="mt-4">
          <SlotsManager objectId={object.id} initialSlots={object.slots} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsPanel objectId={object.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
