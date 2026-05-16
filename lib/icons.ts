import { Bird, Hammer, Home, Leaf, type LucideIcon } from "lucide-react";

const iconMap = {
  Bird,
  Hammer,
  Home,
  Leaf
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconMap;

export function getIcon(name: IconName): LucideIcon {
  return iconMap[name] ?? Home;
}
