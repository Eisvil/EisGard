// Ключ → путь к PNG-медальону в /public/icons/objects/
export const OBJECT_ICONS: Record<string, string> = {
  // Основные объекты
  forge:        '/icons/objects/forge.png',
  gardens:      '/icons/objects/gardens.png',
  huts:         '/icons/objects/huts.png',
  coop:         '/icons/objects/coop.png',
  training:     '/icons/objects/training.png',
  tavern:       '/icons/objects/tavern.png',
  shed:         '/icons/objects/shed.png',
  pottery:      '/icons/objects/pottery.png',
  guardhouse:   '/icons/objects/guardhouse.png',

  // Ремесленные
  loom:         '/icons/objects/loom.png',
  tannery:      '/icons/objects/tannery.png',
  kiln:         '/icons/objects/kiln.png',
  carpenter:    '/icons/objects/carpenter.png',
  brewery:      '/icons/objects/brewery.png',
  woodcutter:   '/icons/objects/woodcutter.png',
  bone_carving: '/icons/objects/bone_carving.png',
  fishing:      '/icons/objects/fishing.png',
  fishery:      '/icons/objects/fishery.png',
  jewelry:      '/icons/objects/jewelry.png',

  // Хозяйственные
  well:         '/icons/objects/well.png',
  granary:      '/icons/objects/granary.png',
  stable:       '/icons/objects/stable.png',
  bathhouse:    '/icons/objects/bathhouse.png',
  storage:      '/icons/objects/storage.png',
  farming:      '/icons/objects/farming.png',
  apiary:       '/icons/objects/apiary.png',
  medicine:     '/icons/objects/medicine.png',
  herbalist:    '/icons/objects/herbalist.png',
  bakery:       '/icons/objects/bakery.png',

  // Общественные
  market:       '/icons/objects/market.png',
  bell:         '/icons/objects/bell.png',
  scriptorium:  '/icons/objects/scriptorium.png',
  dock:         '/icons/objects/dock.png',
  shrine:       '/icons/objects/shrine.png',

  // Воинские
  watchtower:   '/icons/objects/watchtower.png',
  armory:       '/icons/objects/armory.png',
};

export function ObjectIcon({
  slug,
  size = 54,
  className = 'hotspot-icon',
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const src = OBJECT_ICONS[slug];
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={slug}
      width={size}
      height={size}
      className={className}
      draggable={false}
    />
  );
}
