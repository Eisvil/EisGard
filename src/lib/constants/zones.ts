export const ZONES = [
  'Ремесленная',
  'Общественная',
  'Хозяйственная',
  'Жилая',
  'Воинская',
] as const;

export type Zone = typeof ZONES[number];

export type ZoneKey = 'craft' | 'public' | 'farming' | 'military' | 'residential';

export const ZONE_LABELS: Record<ZoneKey, Zone> = {
  craft:       'Ремесленная',
  public:      'Общественная',
  farming:     'Хозяйственная',
  military:    'Воинская',
  residential: 'Жилая',
};

export const ZONE_KEYS: Record<Zone, ZoneKey> = {
  'Ремесленная':  'craft',
  'Общественная': 'public',
  'Хозяйственная':'farming',
  'Воинская':     'military',
  'Жилая':        'residential',
};
