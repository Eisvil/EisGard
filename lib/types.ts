import type { IconName } from "./icons";

export type BuildingZone = "craft" | "public" | "residential" | "household";

export type BuildingStatus = "idea" | "fundraising" | "building" | "finishing" | "active";

export type DonationSlot = {
  id: string;
  title: string;
  description: string;
  price: number;
  remaining: number;
  image: string;
};

export type ChronicleEntry = {
  id: string;
  name: string;
  action: string;
  amount?: number;
  hours?: number;
  time: string;
  buildingSlug?: string;
};

export type DonationStatus = "pending" | "paid" | "cancelled" | "failed" | "refunded";

export type AdminDonation = {
  id: string;
  donorName: string;
  donorEmail: string;
  buildingSlug: string;
  buildingTitle: string;
  slotTitle: string;
  amount: number;
  status: DonationStatus;
  createdAt: string;
  paidAt?: string;
};

export type VolunteerStatus = "new" | "reviewing" | "approved" | "declined" | "completed";

export type VolunteerApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  buildingSlug: string;
  buildingTitle: string;
  skills: string[];
  preferredDates: string;
  comment: string;
  status: VolunteerStatus;
  hours: number;
  points: number;
  createdAt: string;
};

export type Building = {
  slug: string;
  title: string;
  zone: BuildingZone;
  status: BuildingStatus;
  icon: IconName;
  marker: {
    x: number;
    y: number;
  };
  shortDescription: string;
  description: string;
  historicalNote: string;
  budget: number;
  collected: number;
  image: string;
  slots: DonationSlot[];
};
