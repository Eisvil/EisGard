export const OBJECT_STATUS = {
  draft:    { label: 'Черновик',  color: '#aeb4a0' },
  planned:  { label: 'Замысел',   color: '#aeb4a0' },
  building: { label: 'Строится',  color: '#e9b643' },
  done:     { label: 'Завершён',  color: '#859c49' },
  working:  { label: 'Действует', color: '#806741' },
} as const;

export type ObjectStatus = keyof typeof OBJECT_STATUS;
