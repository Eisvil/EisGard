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

export type PaymentProviderPreference = "mock" | "tbank_collection_manual" | "yookassa";

export type UserRole = "participant" | "moderator" | "editor" | "admin" | "superadmin";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  points: number;
  publicName: string;
  createdAt: string;
};

export type ProjectSettings = {
  projectName: string;
  legalName: string;
  contactEmail: string;
  telegramAdminChat: string;
  donationTerms: string;
  privacyPolicy: string;
  paymentProviderPreference: PaymentProviderPreference;
  tbankCollectionEnabled: boolean;
  tbankCollectionUrl: string;
  tbankCollectionTitle: string;
  tbankCollectionDescription: string;
  yookassaEnabled: boolean;
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
