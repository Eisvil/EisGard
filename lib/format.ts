export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function getProgress(collected: number, budget: number) {
  if (!budget) {
    return 0;
  }

  return Math.min(100, Math.max(0, (collected / budget) * 100));
}

