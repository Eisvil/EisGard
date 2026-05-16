import type { AdminDonation, Building, ChronicleEntry, VolunteerApplication } from "./types";

export const zoneLabels = {
  craft: "Ремесленная",
  public: "Общественная",
  residential: "Жилая",
  household: "Хозяйственная"
} as const;

export const statusLabels = {
  idea: "Замысел",
  fundraising: "Сбор открыт",
  building: "Строится",
  finishing: "Завершение",
  active: "Действует"
} as const;

export const buildings: Building[] = [
  {
    slug: "kuznica",
    title: "Кузница",
    zone: "craft",
    status: "building",
    icon: "Hammer",
    marker: { x: 44.5, y: 47 },
    shortDescription: "Сердце ремесленной жизни поселения.",
    description:
      "Здесь будут коваться железо, рождаться инструменты и оружие наших предков. Кузница станет первой мастерской, где гости увидят живую работу ремесленника.",
    historicalNote:
      "В поселениях X-XIII веков кузнец был одним из ключевых мастеров: от его работы зависели хозяйство, строительство, охота и военное дело.",
    budget: 200000,
    collected: 136000,
    image: "/assets/buildings/kuznica.png",
    slots: [
      {
        id: "forge",
        title: "Горн кузницы",
        description: "Каменная кладка, жаровая зона и базовое оснащение горна.",
        price: 2500,
        remaining: 3,
        image: "/assets/buildings/kuznica.png"
      },
      {
        id: "roof",
        title: "Кровля кузницы",
        description: "Дранка, крепления и работа по защите мастерской от непогоды.",
        price: 8000,
        remaining: 5,
        image: "/assets/buildings/kuznica.png"
      },
      {
        id: "tools",
        title: "Малый инструмент",
        description: "Молотки, клещи, напильники и расходные материалы.",
        price: 5000,
        remaining: 12,
        image: "/assets/buildings/kuznica.png"
      }
    ]
  },
  {
    slug: "ogorody",
    title: "Огороды",
    zone: "public",
    status: "fundraising",
    icon: "Leaf",
    marker: { x: 51.5, y: 21 },
    shortDescription: "Исторические грядки, садовые культуры и плетни.",
    description:
      "Огороды покажут, как община выращивала пищу, лекарственные травы и полезные растения. Это тихая, но очень живая часть будущего городища.",
    historicalNote:
      "Грядки, плодовые деревья, изгороди и простые водные решения были частью повседневной устойчивости поселения.",
    budget: 100000,
    collected: 42000,
    image: "/assets/buildings/ogorody.png",
    slots: [
      {
        id: "garden-bed",
        title: "Историческая грядка",
        description: "Плетеный короб, земля, посадочный материал.",
        price: 1500,
        remaining: 8,
        image: "/assets/buildings/ogorody.png"
      },
      {
        id: "fruit-tree",
        title: "Плодовое дерево",
        description: "Саженец, опора и уход в первый сезон.",
        price: 3000,
        remaining: 10,
        image: "/assets/buildings/ogorody.png"
      }
    ]
  },
  {
    slug: "kuryatnik",
    title: "Курятник",
    zone: "household",
    status: "idea",
    icon: "Bird",
    marker: { x: 76.6, y: 34 },
    shortDescription: "Первый живой объект хозяйственной части.",
    description:
      "Курятник добавит поселению настоящий быт: птицу, кормление, уход, детские экскурсии и простую хозяйственную механику.",
    historicalNote:
      "Домашняя птица была важным источником яиц, мяса и перьев, а малые хозяйственные постройки формировали повседневный ритм двора.",
    budget: 50000,
    collected: 7500,
    image: "/assets/buildings/kuryatnik.png",
    slots: [
      {
        id: "coop-frame",
        title: "Сруб курятника",
        description: "Деревянный каркас и базовая сборка.",
        price: 5000,
        remaining: 6,
        image: "/assets/buildings/kuryatnik.png"
      },
      {
        id: "perches",
        title: "Насесты и кормушки",
        description: "Внутреннее оснащение для птицы.",
        price: 1500,
        remaining: 8,
        image: "/assets/buildings/kuryatnik.png"
      }
    ]
  },
  {
    slug: "zagon-dlya-kur",
    title: "Загон для кур",
    zone: "household",
    status: "idea",
    icon: "Home",
    marker: { x: 70.5, y: 79 },
    shortDescription: "Огороженный выгул с навесом.",
    description:
      "Загон нужен, чтобы птица могла жить на открытом воздухе, а гости видели хозяйственный уклад поселения не только на картинках.",
    historicalNote:
      "Простые плетни, навесы и выгородки были естественной частью хозяйственного двора.",
    budget: 15000,
    collected: 0,
    image: "/assets/buildings/zagon-dlya-kur.png",
    slots: [
      {
        id: "fence",
        title: "Плетень",
        description: "Материалы и сборка ограждения.",
        price: 1000,
        remaining: 10,
        image: "/assets/buildings/zagon-dlya-kur.png"
      },
      {
        id: "shade",
        title: "Навес",
        description: "Небольшая защита от солнца и дождя.",
        price: 2500,
        remaining: 3,
        image: "/assets/buildings/zagon-dlya-kur.png"
      }
    ]
  }
];

export const chronicleEntries: ChronicleEntry[] = [
  {
    id: "1",
    name: "Иван Петров",
    action: "поддержал горн кузницы",
    amount: 5000,
    time: "2 ч назад",
    buildingSlug: "kuznica"
  },
  {
    id: "2",
    name: "Артель из Казани",
    action: "заявила волонтерский выезд к кузнице",
    hours: 120,
    time: "5 ч назад",
    buildingSlug: "kuznica"
  },
  {
    id: "3",
    name: "Мария Соколова",
    action: "закрыла часть кровли кузницы",
    amount: 3000,
    time: "вчера",
    buildingSlug: "kuznica"
  },
  {
    id: "4",
    name: "Тайный доброхот",
    action: "подарил плодовое дерево для огородов",
    amount: 3000,
    time: "2 дня назад",
    buildingSlug: "ogorody"
  }
];

export const adminDonations: AdminDonation[] = [
  {
    id: "don-001",
    donorName: "Иван Петров",
    donorEmail: "ivan@example.ru",
    buildingSlug: "kuznica",
    buildingTitle: "Кузница",
    slotTitle: "Горн кузницы",
    amount: 5000,
    status: "paid",
    createdAt: "сегодня, 12:10",
    paidAt: "сегодня, 12:12"
  },
  {
    id: "don-002",
    donorName: "Мария Соколова",
    donorEmail: "maria@example.ru",
    buildingSlug: "kuznica",
    buildingTitle: "Кузница",
    slotTitle: "Кровля кузницы",
    amount: 3000,
    status: "paid",
    createdAt: "вчера, 18:30",
    paidAt: "вчера, 18:32"
  },
  {
    id: "don-003",
    donorName: "Тайный доброхот",
    donorEmail: "hidden@example.ru",
    buildingSlug: "ogorody",
    buildingTitle: "Огороды",
    slotTitle: "Плодовое дерево",
    amount: 3000,
    status: "pending",
    createdAt: "сегодня, 14:22"
  },
  {
    id: "don-004",
    donorName: "Павел Морозов",
    donorEmail: "pavel@example.ru",
    buildingSlug: "kuryatnik",
    buildingTitle: "Курятник",
    slotTitle: "Сруб курятника",
    amount: 5000,
    status: "failed",
    createdAt: "2 дня назад"
  }
];

export const volunteerApplications: VolunteerApplication[] = [
  {
    id: "vol-001",
    name: "Артем Крылов",
    email: "artem@example.ru",
    phone: "+7 900 111-22-33",
    buildingSlug: "kuznica",
    buildingTitle: "Кузница",
    skills: ["плотник", "разнорабочий"],
    preferredDates: "1-7 июня",
    comment: "Могу приехать на неделю, есть опыт рубки и сборки навесов.",
    status: "new",
    hours: 0,
    points: 0,
    createdAt: "сегодня, 09:14"
  },
  {
    id: "vol-002",
    name: "Артель из Казани",
    email: "artel@example.ru",
    phone: "+7 900 222-33-44",
    buildingSlug: "kuznica",
    buildingTitle: "Кузница",
    skills: ["кузнец", "плотник", "организация лагеря"],
    preferredDates: "15-20 июня",
    comment: "Группа из 4 человек, можем закрыть часть работ по кузнице.",
    status: "approved",
    hours: 120,
    points: 600,
    createdAt: "вчера, 16:40"
  },
  {
    id: "vol-003",
    name: "Елена Воронова",
    email: "elena@example.ru",
    phone: "+7 900 333-44-55",
    buildingSlug: "ogorody",
    buildingTitle: "Огороды",
    skills: ["сад", "травы", "экскурсии"],
    preferredDates: "выходные июля",
    comment: "Хочу помочь с грядками и будущими детскими экскурсиями.",
    status: "reviewing",
    hours: 0,
    points: 0,
    createdAt: "2 дня назад"
  }
];

export function getBuilding(slug: string) {
  return buildings.find((building) => building.slug === slug);
}
