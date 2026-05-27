const projects = [
  {
    id: "forge",
    name: "Кузница",
    shortName: "Кузница",
    zone: "Ремесленная",
    zoneLabel: "Ремесленная зона",
    image: "Референсы/Кузница.png",
    description: "Сердце ремесленной жизни поселения. Здесь будет коваться железо, рождаться инструмент и оружие наших предков.",
    state: "Строится",
    status: "building",
    percent: 68,
    raised: "136 000 ₽",
    goal: "200 000 ₽",
    spots: "12 слотов свободно",
    position: ["57%", "35%"]
  },
  {
    id: "gardens",
    name: "Огороды",
    shortName: "Огороды",
    zone: "Хозяйственная",
    zoneLabel: "Хозяйственная зона",
    image: "Референсы/Огороды.png",
    description: "Грядки для первых урожаев и школа бережного земледелия для участников городища.",
    state: "Строится",
    status: "building",
    percent: 42,
    raised: "42 000 ₽",
    goal: "100 000 ₽",
    spots: "8 слотов свободно",
    position: ["42%", "19%"]
  },
  {
    id: "huts",
    name: "Жилые избы",
    shortName: "Жилые избы",
    zone: "Жилая",
    zoneLabel: "Жилая зона",
    image: "Референсы/Изба.png",
    description: "Тёплые деревянные дома, восстановленные по традиционным технологиям строительства.",
    state: "Строится",
    status: "building",
    percent: 54,
    raised: "108 000 ₽",
    goal: "200 000 ₽",
    spots: "9 слотов свободно",
    position: ["27%", "35%"]
  },
  {
    id: "coop",
    name: "Курятник",
    shortName: "Курятник",
    zone: "Хозяйственная",
    zoneLabel: "Хозяйственная зона",
    image: "Референсы/Курятник.png",
    description: "Небольшое хозяйственное строение для устойчивой жизни и заботы о птице.",
    state: "Замысел",
    status: "planned",
    percent: 15,
    raised: "7 500 ₽",
    goal: "50 000 ₽",
    spots: "6 слотов свободно",
    position: ["30%", "59%"]
  },
  {
    id: "training",
    name: "Тренировочная площадка",
    shortName: "Трен. площадка",
    zone: "Общественная",
    zoneLabel: "Общественная зона",
    image: "Референсы/Тренировочная площадка.png",
    description: "Открытая площадка для ремесленной выучки, игр и встреч дружины.",
    state: "Замысел",
    status: "planned",
    percent: 0,
    raised: "0 ₽",
    goal: "15 000 ₽",
    spots: "10 слотов свободно",
    position: ["52%", "72%"]
  },
  {
    id: "tavern",
    name: "Таверна",
    shortName: "Таверна",
    zone: "Общественная",
    zoneLabel: "Общественная зона",
    image: "Референсы/Таверна.png",
    description: "Общий стол, живые беседы и место встречи гостей после дороги.",
    state: "Действует",
    status: "working",
    percent: 100,
    raised: "Содержится сообществом",
    goal: "",
    spots: "Открыта для гостей",
    position: ["81%", "56%"]
  },
  {
    id: "shed",
    name: "Общинный навес",
    shortName: "Общий навес",
    zone: "Общественная",
    zoneLabel: "Общественная зона",
    image: "Референсы/Общинный навес.png",
    description: "Укрытие для встреч, занятий и совместных работ в любую погоду.",
    state: "Завершён",
    status: "done",
    percent: 100,
    raised: "98 000 ₽",
    goal: "98 000 ₽",
    spots: "Построено вместе",
    position: ["75%", "26%"]
  },
  {
    id: "pottery",
    name: "Гончарная мастерская",
    shortName: "Гончарная",
    zone: "Ремесленная",
    zoneLabel: "Ремесленная зона",
    image: "Референсы/Гончарная мастерская.png",
    description: "Мастерская для обжига посуды и восстановления древних форм ремесла.",
    state: "Замысел",
    status: "planned",
    percent: 8,
    raised: "9 600 ₽",
    goal: "120 000 ₽",
    spots: "15 слотов свободно"
  },
  {
    id: "guardhouse",
    name: "Дружинный дом",
    shortName: "Дружинный дом",
    zone: "Воинская",
    zoneLabel: "Воинская зона",
    image: "Референсы/Дружинный дом.png",
    description: "Дом дружины и место хранения снаряжения, защищающее мирную жизнь поселения.",
    state: "Замысел",
    status: "planned",
    percent: 21,
    raised: "31 500 ₽",
    goal: "150 000 ₽",
    spots: "18 слотов свободно"
  }
];

const statusColors = {
  planned: "#aeb4a0",
  building: "#e9b643",
  done: "#859c49",
  working: "#806741"
};

const projectIcons = {
  forge: '<path d="M4 7.2 9.1 2l2.1 2.1-1.5 1.5 4.1 4.1 2.8-2.8-.9-.9L20 1.8 24.2 6l-4.1 4.3-.9-.9-2.8 2.8 7.1 7.1-4.1 4.1-7.1-7.1-6.4 6.4-3-3 6.4-6.4-4.1-4.1L4 10.4V7.2Z"/>',
  gardens: '<path d="M21.9 2.6c.8 7.7-2.2 13.4-9 15.6L10 22.9l-2.8-1.7 3.2-4.3c-2.7-6.6.9-11.8 11.5-14.3ZM10.7 16.4c2.9-2.1 5.3-4.8 7.3-8.1-3.6 2.7-6.1 5.4-7.3 8.1Z"/>',
  huts: '<path d="M2.5 11.2 13 2.5l10.5 8.7v11.3h-7.1v-6h-6.8v6H2.5V11.2Zm5.1-.7h10.8L13 6.1l-5.4 4.4Z"/>',
  coop: '<path d="M6.2 11.3c0-3.8 3.1-6.8 7-6.8 2.6 0 4.8 1.3 6.1 3.4l3.9-.8-2 3.1c.2.7.3 1.4.3 2.1 0 3.9-3.2 6.8-7.2 6.8h-1l-1.2 3.5H9.8l.6-3.9a7.3 7.3 0 0 1-4.2-6.4Zm4-8.2 2.1 2.2L8.5 7 10.2 3.1ZM8 21.8l-3.5 1.1 2-3.5L8 21.8Z"/>',
  training: '<path d="m4.3 3.5 7 6.9-2.1 2.1-3-2.9-2 2-1.6-7.9 1.7-.2Zm15.4 0-7 6.9 2.1 2.1 3-2.9 2 2 1.6-7.9-1.7-.2ZM2.6 20.6l5.8-5.8 2.2 2.2-5.8 5.8H2.6v-2.2Zm18.8 0-5.8-5.8-2.2 2.2 5.8 5.8h2.2v-2.2Z"/>',
  tavern: '<path d="M4.5 5h12.8v14.1c0 2.1-1.7 3.9-3.9 3.9H8.4c-2.2 0-3.9-1.8-3.9-3.9V5Zm12.8 3h2.6c2 0 3.6 1.7 3.6 3.8v2.4c0 2.2-1.6 3.8-3.6 3.8h-2.6v-3h2.2c.7 0 1.1-.5 1.1-1.2v-1.7c0-.7-.4-1.2-1.1-1.2h-2.2V8Z"/>',
  shed: '<path d="M2 12.5 13 3l11 9.5v2H2v-2Zm3.7 3.3h2.8v7.1H5.7v-7.1Zm11.8 0h2.8v7.1h-2.8v-7.1ZM10.2 16h5.6v2.6h-5.6V16Z"/>',
  pottery: '<path d="M7 3h12v3.2c0 1.6-1.3 2.9-2.4 4.1 2.7 2.1 4 4.5 4 7 0 3.5-3.4 5.7-7.6 5.7s-7.6-2.2-7.6-5.7c0-2.5 1.3-4.9 4-7C8.3 9.1 7 7.8 7 6.2V3Zm.3 14.3h11.4c-.5-2.6-2.5-4.1-5.7-4.1s-5.2 1.5-5.7 4.1Z"/>',
  guardhouse: '<path d="M13 2 22.5 6v6.7c0 5.2-3.4 8.6-9.5 11.3-6.1-2.7-9.5-6.1-9.5-11.3V6L13 2Zm0 5.2v11.6c3.3-1.8 5-3.9 5-6.4V8.9l-5-1.7Z"/>'
};

const zones = ["Все зоны", "Ремесленная", "Общественная", "Хозяйственная", "Воинская"];
let selectedId = "forge";
let activeZone = "Все зоны";
let mapScale = 1;
let toastTimer;

const selectedName = document.querySelector("#selected-name");
const selectedZone = document.querySelector("#selected-zone");
const selectedPhoto = document.querySelector("#selected-photo");
const selectedDescription = document.querySelector("#selected-description");
const selectedPercent = document.querySelector("#selected-percent");
const selectedBar = document.querySelector("#selected-bar");
const selectedRaised = document.querySelector("#selected-raised");
const selectedGoal = document.querySelector("#selected-goal");
const cards = document.querySelector("#cards");
const hotspots = document.querySelector("#hotspots");
const filters = document.querySelector("#filters");
const mapImage = document.querySelector("#map-image");
const toast = document.querySelector("#toast");

function getProject(id) {
  return projects.find((project) => project.id === id);
}

function projectIcon(id, className = "project-icon") {
  return `<svg class="${className}" viewBox="0 0 26 26" aria-hidden="true">${projectIcons[id]}</svg>`;
}

function selectProject(id) {
  const project = getProject(id);
  if (!project) return;
  selectedId = id;
  selectedName.textContent = project.name;
  selectedZone.textContent = project.zoneLabel;
  selectedPhoto.src = project.image;
  selectedPhoto.alt = project.name;
  selectedDescription.textContent = project.description;
  selectedPercent.textContent = `${project.percent}%`;
  selectedBar.style.width = `${project.percent}%`;
  selectedRaised.textContent = project.raised;
  selectedGoal.textContent = project.goal || "общими усилиями";
  renderCards();
  document.querySelectorAll(".hotspot").forEach((button) => {
    button.classList.toggle("selected", button.dataset.id === id);
  });
}

function renderFilters() {
  filters.replaceChildren(...zones.map((zone) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter${zone === activeZone ? " active" : ""}`;
    button.textContent = zone;
    button.addEventListener("click", () => {
      activeZone = zone;
      renderFilters();
      renderCards();
    });
    return button;
  }));
}

function renderCards() {
  const visible = activeZone === "Все зоны"
    ? projects.slice(0, 4)
    : projects.filter((project) => project.zone === activeZone);

  cards.replaceChildren(...visible.map((project) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `object-card${project.id === selectedId ? " selected" : ""}`;
    card.style.setProperty("--status-color", statusColors[project.status]);
    card.innerHTML = `
      <img src="${project.image}" alt="">
      <span class="badge">${project.state}</span>
      <div class="object-copy">
        <h3>${projectIcon(project.id)}<span>${project.shortName}</span></h3>
        <div class="mini-progress"><span style="width:${project.percent}%"></span></div>
        <p>${project.raised}${project.goal ? ` / ${project.goal}` : ""}</p>
        <small>${project.spots}</small>
      </div>
    `;
    card.addEventListener("click", () => selectProject(project.id));
    return card;
  }));
}

function renderHotspots() {
  const featured = projects.filter((project) => project.position);
  hotspots.replaceChildren(...featured.map((project) => {
    const button = document.createElement("button");
    button.type = "button";
    const labelSide = parseFloat(project.position[0]) > 70 ? " label-left" : " label-right";
    button.className = `hotspot${project.id === selectedId ? " selected" : ""}${labelSide}`;
    button.dataset.id = project.id;
    button.style.left = project.position[0];
    button.style.top = project.position[1];
    button.setAttribute("aria-label", project.shortName);
    button.innerHTML = `<span class="hotspot-label">${project.shortName}</span><span class="hotspot-round">${projectIcon(project.id, "hotspot-icon")}</span>`;
    button.addEventListener("click", () => selectProject(project.id));
    return button;
  }));
}

function setZoom(nextScale) {
  mapScale = Math.max(1, Math.min(1.18, nextScale));
  mapImage.style.transform = `scale(${mapScale})`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

document.querySelector("#zoom-in").addEventListener("click", () => setZoom(mapScale + .06));
document.querySelector("#zoom-out").addEventListener("click", () => setZoom(mapScale - .06));

document.querySelectorAll("[data-support]").forEach((button) => {
  button.addEventListener("click", () => {
    showToast(`Вы выбрали поддержку: ${getProject(selectedId).name}`);
  });
});

document.querySelectorAll("[data-method]").forEach((button) => {
  button.addEventListener("click", () => showToast(`Направление: ${button.dataset.method}`));
});

document.querySelectorAll(".all-objects, .full-link").forEach((button) => {
  button.addEventListener("click", () => showToast("Раздел готовится к публикации"));
});

renderFilters();
renderCards();
renderHotspots();
