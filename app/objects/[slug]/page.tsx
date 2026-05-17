import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, ScrollText } from "lucide-react";
import { ChronicleList } from "@/components/ChronicleList";
import { ProgressSummary } from "@/components/building/ProgressSummary";
import { SupportSection } from "@/components/building/SupportSection";
import { getBuildingBySlug, getBuildings, getChronicleEntries, getProjectSettings } from "@/lib/data";
import { statusLabels, zoneLabels } from "@/lib/seed";
import { BuildingIcon } from "@/components/BuildingIcon";

export const dynamic = "force-dynamic";

type ObjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getBuildings().then((buildings) => buildings.map((building) => ({
    slug: building.slug
  })));
}

export async function generateMetadata({ params }: ObjectPageProps) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);

  if (!building) {
    return {};
  }

  return {
    title: `${building.title} | Живое Городище`,
    description: building.shortDescription,
    openGraph: {
      title: `${building.title} | Живое Городище`,
      description: building.shortDescription,
      images: [building.image]
    }
  };
}

export default async function ObjectPage({ params }: ObjectPageProps) {
  const { slug } = await params;
  const building = await getBuildingBySlug(slug);

  if (!building) {
    notFound();
  }

  const [objectChronicleEntries, paymentSettings] = await Promise.all([
    getChronicleEntries({ buildingSlug: building.slug, limit: 3 }),
    getProjectSettings()
  ]);
  return (
    <main className="object-page shell">
      <Link href="/" className="secondary-button back-link">
        <ArrowLeft size={17} />
        К карте
      </Link>

      <section className="object-hero">
        <div className="object-hero__media">
          <Image src={building.image} alt={building.title} fill className="object-cover" priority sizes="(max-width: 960px) 100vw, 58vw" />
        </div>

        <article className="parchment object-hero__content">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink-soft text-gold">
              <BuildingIcon name={building.icon} size={26} />
            </span>
            <div>
              <p className="text-sm font-semibold text-forest">{zoneLabels[building.zone]} зона</p>
              <h1 className="font-display text-4xl leading-none">{building.title}</h1>
            </div>
          </div>

          <span className="status-pill">{statusLabels[building.status]}</span>
          <p className="text-base leading-7 text-ink/82">{building.description}</p>
          <ProgressSummary collected={building.collected} budget={building.budget} />
          <a href="#slots" className="primary-button">
            <Heart size={18} />
            Выбрать слот поддержки
          </a>
        </article>
      </section>

      <section className="object-layout">
        <article className="parchment info-panel">
          <p className="eyebrow">Историческая справка</p>
          <h2>Почему это важно</h2>
          <p>{building.historicalNote}</p>
        </article>

        <article className="parchment info-panel" id="slots">
          <SupportSection
            buildingSlug={building.slug}
            buildingTitle={building.title}
            collected={building.collected}
            budget={building.budget}
            slots={building.slots}
            chronicleEntries={objectChronicleEntries}
            paymentSettings={paymentSettings}
          />
        </article>
      </section>

      <section className="parchment info-panel object-chronicle">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">Летопись объекта</p>
            <h2>
              <ScrollText size={25} />
              Последние события
            </h2>
          </div>
        </div>
        <ChronicleList buildingSlug={building.slug} limit={4} />
      </section>
    </main>
  );
}
