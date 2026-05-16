import { Bird, Hammer, Home, Leaf } from "lucide-react";
import type { IconName } from "@/lib/icons";

type BuildingIconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

export function BuildingIcon({ name, size = 24, className }: BuildingIconProps) {
  switch (name) {
    case "Bird":
      return <Bird size={size} className={className} />;
    case "Hammer":
      return <Hammer size={size} className={className} />;
    case "Leaf":
      return <Leaf size={size} className={className} />;
    case "Home":
    default:
      return <Home size={size} className={className} />;
  }
}
