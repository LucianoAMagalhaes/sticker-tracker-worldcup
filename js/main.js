const ALBUM_DATA_URL = "data/album.json";
const SPECIAL_PREFIX = "special:";
const STORAGE_KEY = "sticker-tracker-wordcup2022:collection";
const STATUS_CYCLE = ["missing", "owned", "duplicate"];
const DUPLICATES_VIEW_ID = "view:duplicates";

const TYPE_LABELS = {
  team: "Time",
  shield: "Escudo",
  player: "Jogador",
  general: "Geral",
  coca: "Coca-Cola",
  special: "Especial",
};

const STATUS_LABELS = {
  missing: "faltando",
  owned: "obtida",
  duplicate: "repetida",
};

let activeSectionId = null;
let sectionsIndex = null;
let stickerToSection = new Map();
let collection = {};
let album = null;
let feedbackTimer = null;

async function loadAlbum() {
  const response = await fetch(ALBUM_DATA_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${ALBUM_DATA_URL}`);
  }
  return response.json();
}

function loadCollection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (error) {
    console.warn("Failed to load collection from storage:", error);
    return {};
  }
}

function saveCollection() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  } catch (error) {
    console.warn("Failed to save collection to storage:", error);
  }
}

function getStatus(stickerId) {
  return collection[stickerId] ?? "missing";
}

function cycleStatus(stickerId) {
  const current = getStatus(stickerId);
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
  if (next === "missing") {
    delete collection[stickerId];
  } else {
    collection[stickerId] = next;
  }
  saveCollection();
  return next;
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

  sections.set(DUPLICATES_VIEW_ID, {
    kind: "duplicates-view",
    id: DUPLICATES_VIEW_ID,
    name: "Minhas repetidas",
  });

  stickerToSection = new Map();
  for (const section of sections.values()) {
    if (!section.stickers) continue;
    for (const sticker of section.stickers) {
      stickerToSection.set(sticker.id, section.id);
    }
  }

  return sections;
}

function countDuplicates() {
  let count = 0;
  for (const status of Object.values(collection)) {
    if (status === "duplicate") count++;
  }
  return count;
}

function getDuplicatesBySection() {
  const groups = [];
  for (const section of sectionsIndex.values()) {
    if (!section.stickers) continue;
    const duplicates = section.stickers.filter((s) => getStatus(s.id) === "duplicate");
    if (duplicates.length > 0) {
      groups.push({ section, duplicates });
    }
  }
  return groups;
}

function computeOverviewStats() {
  let owned = 0;
  let duplicate = 0;
  let total = 0;
  for (const section of sectionsIndex.values()) {
    for (const sticker of section.stickers) {
      total++;
      const status = getStatus(sticker.id);
      if (status === "owned") owned++;
      else if (status === "duplicate") duplicate++;
    }
  }
  const have = owned + duplicate;
  const missing = total - have;
  const pct = total > 0 ? Math.round((have / total) * 100) : 0;
  return { total, have, owned, duplicate, missing, pct };
}

function computeSectionStats(section) {
  let owned = 0;
  let duplicate = 0;
  for (const sticker of section.stickers) {
    const status = getStatus(sticker.id);
    if (status === "owned") owned++;
    else if (status === "duplicate") duplicate++;
  }
  return {
    total: section.stickers.length,
    have: owned + duplicate,
    owned,
    duplicate,
  };
}

function renderOverview() {
  const display = document.getElementById("overview-display");
  const stats = computeOverviewStats();
  const dupWord = stats.duplicate === 1 ? "repetida" : "repetidas";
  const dupContent = stats.duplicate > 0
    ? `<button type="button" class="overview__link" data-action="view-duplicates">${stats.duplicate} ${dupWord} para troca</button>`
    : `${stats.duplicate} ${dupWord} para troca`;
  display.innerHTML = `
    <p class="overview__status">
      <strong>${stats.have}</strong> de <strong>${stats.total}</strong> figurinhas (${stats.pct}%)
    </p>
    <div class="overview__bar" role="progressbar" aria-valuemin="0" aria-valuemax="${stats.total}" aria-valuenow="${stats.have}">
      <div class="overview__fill" style="width: ${stats.pct}%"></div>
    </div>
    <p class="overview__breakdown">
      ${dupContent} ·
      ${stats.missing} faltando
    </p>
  `;
}

function renderError(error) {
  const display = document.getElementById("overview-display");
  display.innerHTML = `<p class="overview__status">Erro ao carregar álbum: ${error.message}</p>`;
}

function showActionFeedback(message, kind = "info") {
  const el = document.getElementById("action-feedback");
  if (!el) return;
  el.textContent = message;
  el.dataset.kind = kind;
  el.hidden = false;
  if (feedbackTimer) clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    el.hidden = true;
    feedbackTimer = null;
  }, 4000);
}

function navItemHtml(sectionId) {
  const section = sectionsIndex.get(sectionId);
  if (section.kind === "duplicates-view") {
    const count = countDuplicates();
    return `
      <li>
        <button class="nav-item" type="button" data-section-id="${sectionId}">
          <span class="nav-item__name">${section.name}</span>
          <span class="nav-item__progress" data-progress-for="${sectionId}">${count}</span>
        </button>
      </li>
    `;
  }
  const stats = computeSectionStats(section);
  const isComplete = stats.have === stats.total;
  const progressClass = isComplete
    ? "nav-item__progress nav-item__progress--complete"
    : "nav-item__progress";
  return `
    <li>
      <button class="nav-item" type="button" data-section-id="${sectionId}">
        <span class="nav-item__name">${section.name}</span>
        <span class="${progressClass}" data-progress-for="${sectionId}">${stats.have}/${stats.total}</span>
      </button>
    </li>
  `;
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

  const viewsHtml = navGroupHtml("Visões", navItemHtml(DUPLICATES_VIEW_ID), "nav-group--views");

  const groupsHtml = album.groups.map((group) => {
    const items = group.selections
      .map((selection) => navItemHtml(selection.code))
      .join("");
    return navGroupHtml(group.name, items);
  }).join("");

  const specialsItems = album.specials
    .map((special) => navItemHtml(`${SPECIAL_PREFIX}${special.id}`))
    .join("");
  const specialsHtml = navGroupHtml("Especiais", specialsItems, "nav-group--specials");

  nav.innerHTML = viewsHtml + groupsHtml + specialsHtml;
}

function updateNavProgressFor(sectionId) {
  const section = sectionsIndex.get(sectionId);
  if (!section) return;
  const span = document.querySelector(`[data-progress-for="${sectionId}"]`);
  if (!span) return;
  if (section.kind === "duplicates-view") {
    span.textContent = countDuplicates();
    return;
  }
  const stats = computeSectionStats(section);
  span.textContent = `${stats.have}/${stats.total}`;
  span.classList.toggle("nav-item__progress--complete", stats.have === stats.total);
}

function stickerAriaLabel(sticker, status) {
  const typeLabel = TYPE_LABELS[sticker.type] ?? "";
  return `Figurinha ${sticker.id} (${typeLabel}) — ${STATUS_LABELS[status]}`;
}

function stickerCardHtml(sticker) {
  const status = getStatus(sticker.id);
  const typeLabel = TYPE_LABELS[sticker.type] ?? "";
  return `
    <li>
      <button type="button" class="sticker"
              data-sticker-id="${sticker.id}"
              data-type="${sticker.type}"
              data-status="${status}"
              aria-label="${stickerAriaLabel(sticker, status)}">
        <span class="sticker__code">${sticker.id}</span>
        <span class="sticker__type">${typeLabel}</span>
      </button>
    </li>
  `;
}

function sectionMetaText(section) {
  const stats = computeSectionStats(section);
  const parts = [`${stats.have}/${stats.total} obtidas`];
  if (stats.duplicate > 0) {
    parts.push(`${stats.duplicate} repetida${stats.duplicate === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

function renderStickers(section) {
  const container = document.getElementById("stickers-container");
  container.innerHTML = `
    <p class="content__meta" id="content-meta">${sectionMetaText(section)}</p>
    <ul class="sticker-grid">${section.stickers.map(stickerCardHtml).join("")}</ul>
  `;
}

function renderDuplicatesList() {
  const container = document.getElementById("stickers-container");
  const groups = getDuplicatesBySection();
  const total = countDuplicates();

  if (groups.length === 0) {
    container.innerHTML = `
      <p class="content__placeholder">
        Sem figurinhas repetidas no momento. Clique duas vezes em qualquer figurinha para marcá-la como repetida.
      </p>
    `;
    return;
  }

  const sectionsCount = groups.length;
  const dupWord = total === 1 ? "figurinha repetida" : "figurinhas repetidas";
  const secWord = sectionsCount === 1 ? "seleção" : "seções";

  const groupsHtml = groups.map(({ section, duplicates }) => {
    const headerText = section.kind === "selection"
      ? `${section.name} — ${section.groupName}`
      : section.name;
    return `
      <section class="duplicates-group">
        <h3 class="duplicates-group__title">
          ${headerText}
          <span class="duplicates-group__count">(${duplicates.length})</span>
        </h3>
        <ul class="sticker-grid duplicates-group__list">${duplicates.map(stickerCardHtml).join("")}</ul>
      </section>
    `;
  }).join("");

  container.innerHTML = `
    <p class="content__meta">${total} ${dupWord} em ${sectionsCount} ${secWord}</p>
    ${groupsHtml}
  `;
}

function updateContentMeta() {
  const section = sectionsIndex.get(activeSectionId);
  if (!section || !section.stickers) return;
  const meta = document.getElementById("content-meta");
  if (meta) meta.textContent = sectionMetaText(section);
}

function renderContent(section) {
  const title = document.getElementById("content-title");
  if (section.kind === "duplicates-view") {
    title.textContent = section.name;
    renderDuplicatesList();
    return;
  }
  title.textContent = section.kind === "selection"
    ? `${section.name} — ${section.groupName}`
    : section.name;
  renderStickers(section);
}

function applyActiveSectionState(sectionId) {
  for (const button of document.querySelectorAll(".nav-item")) {
    const isActive = button.dataset.sectionId === sectionId;
    button.classList.toggle("nav-item--active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  }
}

function setActiveSection(sectionId) {
  const section = sectionsIndex.get(sectionId);
  if (!section) return;
  activeSectionId = sectionId;
  applyActiveSectionState(sectionId);
  renderContent(section);
}

function refreshAll() {
  renderOverview();
  renderNav(album);
  applyActiveSectionState(activeSectionId);
  const section = sectionsIndex.get(activeSectionId);
  if (section) renderContent(section);
}

function handleStickerClick(card) {
  const stickerId = card.dataset.stickerId;
  const type = card.dataset.type;
  const newStatus = cycleStatus(stickerId);
  const originatingSectionId = stickerToSection.get(stickerId);

  if (activeSectionId === DUPLICATES_VIEW_ID) {
    renderDuplicatesList();
  } else {
    card.dataset.status = newStatus;
    card.setAttribute("aria-label", stickerAriaLabel({ id: stickerId, type }, newStatus));
    updateContentMeta();
  }

  if (originatingSectionId) updateNavProgressFor(originatingSectionId);
  updateNavProgressFor(DUPLICATES_VIEW_ID);
  renderOverview();
}

function isValidCollection(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  for (const status of Object.values(value)) {
    if (status !== "owned" && status !== "duplicate") return false;
  }
  return true;
}

function exportCollection() {
  const payload = JSON.stringify(collection, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `colecao-copa-2022-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  const count = Object.keys(collection).length;
  showActionFeedback(
    `Coleção exportada (${count} ${count === 1 ? "entrada" : "entradas"}).`,
    "success",
  );
}

function importFromText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    showActionFeedback(`Arquivo inválido: ${error.message}`, "error");
    return;
  }
  if (!isValidCollection(parsed)) {
    showActionFeedback(
      "Arquivo inválido: estrutura esperada é um objeto { stickerId: 'owned' | 'duplicate' }.",
      "error",
    );
    return;
  }
  const incoming = Object.keys(parsed).length;
  const current = Object.keys(collection).length;
  const message = current === 0
    ? `Importar ${incoming} ${incoming === 1 ? "entrada" : "entradas"}?`
    : `Substituir sua coleção atual (${current}) por ${incoming} ${incoming === 1 ? "entrada" : "entradas"}? Esta ação não pode ser desfeita.`;
  if (!confirm(message)) {
    showActionFeedback("Importação cancelada.", "info");
    return;
  }
  collection = parsed;
  saveCollection();
  refreshAll();
  showActionFeedback(
    `Coleção importada (${incoming} ${incoming === 1 ? "entrada" : "entradas"}).`,
    "success",
  );
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => importFromText(String(reader.result ?? ""));
  reader.onerror = () => showActionFeedback("Falha ao ler o arquivo.", "error");
  reader.readAsText(file);
  event.target.value = "";
}

function attachHandlers() {
  document.getElementById("groups-nav").addEventListener("click", (event) => {
    const button = event.target.closest(".nav-item");
    if (!button) return;
    setActiveSection(button.dataset.sectionId);
  });

  document.getElementById("stickers-container").addEventListener("click", (event) => {
    const card = event.target.closest(".sticker");
    if (!card) return;
    handleStickerClick(card);
  });

  document.getElementById("progress-overview").addEventListener("click", (event) => {
    const link = event.target.closest('[data-action="view-duplicates"]');
    if (!link) return;
    setActiveSection(DUPLICATES_VIEW_ID);
  });

  document.getElementById("export-btn").addEventListener("click", exportCollection);

  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", handleImportFile);
}

async function main() {
  try {
    album = await loadAlbum();
    sectionsIndex = buildSectionsIndex(album);
    collection = loadCollection();

    renderOverview();
    renderNav(album);
    attachHandlers();

    const firstSelectionId = album.groups[0].selections[0].code;
    setActiveSection(firstSelectionId);
  } catch (error) {
    renderError(error);
    console.error(error);
  }
}

main();
