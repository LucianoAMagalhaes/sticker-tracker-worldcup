const ALBUM_DATA_URL = "data/album.json";
const SPECIAL_PREFIX = "special:";

const TYPE_LABELS = {
  team: "Time",
  shield: "Escudo",
  player: "Jogador",
  general: "Geral",
  coca: "Coca-Cola",
  special: "Especial",
};

let activeSectionId = null;

async function loadAlbum() {
  const response = await fetch(ALBUM_DATA_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${ALBUM_DATA_URL}`);
  }
  return response.json();
}

function getSelectionStickers(selection, layout) {
  const stickers = [];
  for (const rule of layout) {
    if (typeof rule.number === "number") {
      stickers.push({ id: `${selection.code}${rule.number}`, type: rule.type });
    } else if (typeof rule.rangeStart === "number") {
      for (let n = rule.rangeStart; n <= rule.rangeEnd; n++) {
        stickers.push({ id: `${selection.code}${n}`, type: rule.type });
      }
    }
  }
  return stickers;
}

function getSpecialStickers(special) {
  if (Array.isArray(special.ids)) {
    return special.ids.map((id) => ({ id, type: special.type }));
  }
  if (special.prefix && typeof special.count === "number") {
    return Array.from({ length: special.count }, (_, i) => ({
      id: `${special.prefix}${i + 1}`,
      type: special.type,
    }));
  }
  return [];
}

function buildSectionsIndex(album) {
  const sections = new Map();

  for (const group of album.groups) {
    for (const selection of group.selections) {
      sections.set(selection.code, {
        kind: "selection",
        id: selection.code,
        name: selection.name,
        groupId: group.id,
        groupName: group.name,
        stickers: getSelectionStickers(selection, album.selectionStickerLayout),
      });
    }
  }

  for (const special of album.specials) {
    const id = `${SPECIAL_PREFIX}${special.id}`;
    sections.set(id, {
      kind: "special",
      id,
      name: special.name,
      stickers: getSpecialStickers(special),
    });
  }

  return sections;
}

function renderOverview(album) {
  const status = document.querySelector("#progress-overview .overview__status");
  status.textContent =
    `Álbum carregado: ${album.totalStickers} figurinhas em ${album.groups.length} grupos.`;
}

function renderError(error) {
  const status = document.querySelector("#progress-overview .overview__status");
  status.textContent = `Erro ao carregar álbum: ${error.message}`;
}

function navItemHtml(id, name) {
  return `<li><button class="nav-item" type="button" data-section-id="${id}">${name}</button></li>`;
}

function navGroupHtml(title, items, modifier = "") {
  const className = modifier ? `nav-group ${modifier}` : "nav-group";
  return `
    <section class="${className}">
      <h2 class="nav-group__title">${title}</h2>
      <ul class="nav-group__list">${items}</ul>
    </section>
  `;
}

function renderNav(album) {
  const nav = document.getElementById("groups-nav");

  const groupsHtml = album.groups.map((group) => {
    const items = group.selections
      .map((selection) => navItemHtml(selection.code, selection.name))
      .join("");
    return navGroupHtml(group.name, items);
  }).join("");

  const specialsItems = album.specials
    .map((special) => navItemHtml(`${SPECIAL_PREFIX}${special.id}`, special.name))
    .join("");
  const specialsHtml = navGroupHtml("Especiais", specialsItems, "nav-group--specials");

  nav.innerHTML = groupsHtml + specialsHtml;
}

function stickerCardHtml(sticker) {
  const typeLabel = TYPE_LABELS[sticker.type] ?? "";
  return `
    <li class="sticker sticker--${sticker.type}" data-sticker-id="${sticker.id}">
      <span class="sticker__code">${sticker.id}</span>
      <span class="sticker__type">${typeLabel}</span>
    </li>
  `;
}

function renderStickers(section) {
  const container = document.getElementById("stickers-container");
  const count = section.stickers.length;
  container.innerHTML = `
    <p class="content__meta">${count} ${count === 1 ? "figurinha" : "figurinhas"}</p>
    <ul class="sticker-grid">${section.stickers.map(stickerCardHtml).join("")}</ul>
  `;
}

function renderContent(section) {
  const title = document.getElementById("content-title");
  title.textContent = section.kind === "selection"
    ? `${section.name} — ${section.groupName}`
    : section.name;
  renderStickers(section);
}

function setActiveSection(sectionId, sections) {
  const section = sections.get(sectionId);
  if (!section) return;

  activeSectionId = sectionId;

  for (const button of document.querySelectorAll(".nav-item")) {
    const isActive = button.dataset.sectionId === sectionId;
    button.classList.toggle("nav-item--active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  }

  renderContent(section);
}

function attachNavHandler(sections) {
  document.getElementById("groups-nav").addEventListener("click", (event) => {
    const button = event.target.closest(".nav-item");
    if (!button) return;
    setActiveSection(button.dataset.sectionId, sections);
  });
}

async function main() {
  try {
    const album = await loadAlbum();
    const sections = buildSectionsIndex(album);

    renderOverview(album);
    renderNav(album);
    attachNavHandler(sections);

    const firstSelectionId = album.groups[0].selections[0].code;
    setActiveSection(firstSelectionId, sections);
  } catch (error) {
    renderError(error);
    console.error(error);
  }
}

main();
