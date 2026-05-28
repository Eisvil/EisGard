'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VolunteerAppsManager } from './VolunteerAppsManager';
import { MaterialAppsManager } from './MaterialAppsManager';
import { PartnerAppsManager } from './PartnerAppsManager';
import DonationsTable from './DonationsTable';

type Camp = { id: string; name: string; date_from: string; date_to: string };
type ObjectOption = { id: string; name: string };
type Donation = {
  id: string;
  amount_kopecks: number;
  display_name: string;
  is_anonymous: boolean;
  source: string;
  status: string;
  points_awarded: number;
  confirmed_at: string | null;
  created_at: string | null;
  profiles: { full_name: string; avatar_url: string | null } | null;
  objects: { name: string; slug: string } | null;
  slots: { name: string } | null;
};
type Meta = { total: number; page: number; per_page: number };

type Props = {
  camps: Camp[];
  isAdmin: boolean;
  initialDonations: Donation[];
  initialMeta: Meta;
  objects: ObjectOption[];
};

export default function ApplicationsTabs({
  camps,
  isAdmin,
  initialDonations,
  initialMeta,
  objects,
}: Props) {
  return (
    <Tabs defaultValue="volunteers">
      <TabsList>
        <TabsTrigger value="volunteers">Волонтёры</TabsTrigger>
        <TabsTrigger value="materials">Материалы</TabsTrigger>
        <TabsTrigger value="partners">Партнёры</TabsTrigger>
        {isAdmin && <TabsTrigger value="donations">Пожертвования</TabsTrigger>}
      </TabsList>

      <TabsContent value="volunteers" className="mt-4">
        <VolunteerAppsManager initialCamps={camps} />
      </TabsContent>

      <TabsContent value="materials" className="mt-4">
        <MaterialAppsManager />
      </TabsContent>

      <TabsContent value="partners" className="mt-4">
        <PartnerAppsManager />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="donations" className="mt-4">
          <DonationsTable
            initialDonations={initialDonations}
            initialMeta={initialMeta}
            objects={objects}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
