import { ChronicleFeed } from "./ChronicleFeed";
import { getChronicleEntries } from "@/lib/data";

type ChronicleListProps = {
  buildingSlug?: string;
  limit?: number;
};

export async function ChronicleList({ buildingSlug, limit }: ChronicleListProps) {
  const entries = await getChronicleEntries({ buildingSlug, limit });

  return <ChronicleFeed entries={entries} showAllLink={Boolean(limit)} />;
}
