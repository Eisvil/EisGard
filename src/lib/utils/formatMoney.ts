export function formatMoney(kopecks: number): string {
  return `${Math.floor(kopecks / 100).toLocaleString('ru-RU')} ₽`;
}

export function getProgress(raised: number, goal: number): number {
  if (goal === 0) return 100;
  return Math.min(100, Math.round((raised / goal) * 100));
}
