const ALBUMS_MANIFEST_URL = "data/albums.json";
const STORAGE_NAMESPACE = "sticker-tracker";
const ACTIVE_ALBUM_KEY = `${STORAGE_NAMESPACE}:active-album`;
const LEGACY_COLLECTION_KEY = "sticker-tracker-wordcup2022:collection";
const LEGACY_FILTER_KEY = "sticker-tracker-wordcup2022:filter";
const LEGACY_ALBUM_ID = "2022";
const SPECIAL_PREFIX = "special:";
const STATUS_CYCLE = ["missing", "owned", "duplicate"];
const DUPLICATES_VIEW_ID = "view:duplicates";
const MISSING_VIEW_ID = "view:missing";
const FILTERS = ["all", "missing", "owned", "duplicate"];

const FILTER_LABELS = {
  all: "Todas",
  missing: "faltantes",
  owned: "obtidas",
  duplicate: "repetidas",
};

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

let albumsManifest = null;
let activeAlbumId = null;
let activeSectionId = null;
let sectionsIndex = null;
let stickerToSection = new Map();
let collection = {};
let album = null;
let feedbackTimer = null;
let currentFilter = "all";

function collectionStorageKey(albumId) {
  return `${STORAGE_NAMESPACE}:${albumId}:collection`;
}

function filterStorageKey(albumId) {
  return `${STORAGE_NAMESPACE}:${albumId}:filter`;
}

async function loadAlbumsManifest() {
  const response = await fetch(ALBUMS_MANIFEST_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${ALBUMS_MANIFEST_URL}`);
  }
  return response.json();
}

async function loadAlbumById(albumId) {
  const entry = albumsManifest.albums.find((a) => a.id === albumId);
  if (!entry) throw new Error(`Unknown album id: ${albumId}`);
  const response = await fetch(entry.file);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${entry.file}`);
  }
  return response.json();
}

// Move data from the pre-multi-album storage keys into the 2022 namespace.
// Runs once: if the new keys already exist, the old ones are left alone.
function migrateLegacyKeysIfNeeded() {
  const newCollectionKey = collectionStorageKey(LEGACY_ALBUM_ID);
  const legacyCollection = localStorage.getItem(LEGACY_COLLECTION_KEY);
  if (legacyCollection !== null && localStorage.getItem(newCollectionKey) === null) {
    localStorage.setItem(newCollectionKey, legacyCollection);
    localStorage.removeItem(LEGACY_COLLECTION_KEY);
  }
  const newFilterKey = filterStorageKey(LEGACY_ALBUM_ID);
  const legacyFilter = localStorage.getItem(LEGACY_FILTER_KEY);
  if (legacyFilter !== null && localStorage.getItem(newFilterKey) === null) {
    localStorage.setItem(newFilterKey, legacyFilter);
    localStorage.removeItem(LEGACY_FILTER_KEY);
  }
}

function resolveActiveAlbumId() {
  const stored = localStorage.getItem(ACTIVE_ALBUM_KEY);
  if (stored && albumsManifest.albums.some((a) => a.id === stored)) {
    return stored;
  }
  return albumsManifest.defaultAlbumId ?? albumsManifest.albums[0].id;
}

function saveActiveAlbumId() {
  try {
    localStorage.setItem(ACTIVE_ALBUM_KEY, activeAlbumId);
  } catch (error) {
    console.warn("Failed to save active album:", error);
  }
}

function loadCollection() {
  try {
    const raw = localStorage.getItem(collectionStorageKey(activeAlbumId));
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
    localStorage.setItem(collectionStorageKey(activeAlbumId), JSON.stringify(collection));
  } catch (error) {
    console.warn("Failed to save collection to storage:", error);
  }
}

function loadFilter() {
  const stored = localStorage.getItem(filterStorageKey(activeAlbumId));
  return FILTERS.includes(stored) ? stored : "all";
}

function saveFilter() {
  try {
    localStorage.setItem(filterStorageKey(activeAlbumId), currentFilter);
  } catch (error) {
    console.warn("Failed to save filter to storage:", error);
  }
}

function matchesFilter(status) {
  if (currentFilter === "all") return true;
  if (currentFilter === "owned") return status === "owned" || status === "duplicate";
  return status === currentFilter;
}

function filterStickers(stickers) {
  if (currentFilter === "all") return stickers;
  return stickers.filter((s) => matchesFilter(getStatus(s.id)));
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

  sections.set(MISSING_VIEW_ID, {
    kind: "missing-view",
    id: MISSING_VIEW_ID,
    name: "Minhas faltantes",
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

function getMissingBySection() {
  const groups = [];
  for (const section of sectionsIndex.values()) {
    if (!section.stickers) continue;
    const missing = section.stickers.filter((s) => getStatus(s.id) === "missing");
    if (missing.length > 0) {
      groups.push({ section, missing });
    }
  }
  return groups;
}

function countMissing() {
  let count = 0;
  for (const section of sectionsIndex.values()) {
    if (!section.stickers) continue;
    for (const sticker of section.stickers) {
      if (getStatus(sticker.id) === "missing") count++;
    }
  }
  return count;
}

function computeOverviewStats() {
  let owned = 0;
  let duplicate = 0;
  let total = 0;
  for (const section of sectionsIndex.values()) {
    if (!section.stickers) continue;
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
  if (section.kind === "duplicates-view" || section.kind === "missing-view") {
    const count = section.kind === "duplicates-view" ? countDuplicates() : countMissing();
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

  const viewsItems = navItemHtml(DUPLICATES_VIEW_ID) + navItemHtml(MISSING_VIEW_ID);
  const viewsHtml = navGroupHtml("Visões", viewsItems, "nav-group--views");

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
  if (section.kind === "missing-view") {
    span.textContent = countMissing();
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
  if (currentFilter !== "all") {
    const visible = filterStickers(section.stickers).length;
    parts.push(`mostrando ${visible} ${FILTER_LABELS[currentFilter]}`);
  }
  return parts.join(" · ");
}

function copyButtonHtml(target) {
  return `<button type="button" class="action action--small" data-copy="${target}">Copiar lista</button>`;
}

function metaRowHtml(metaContent, copyTarget) {
  const copy = copyTarget ? copyButtonHtml(copyTarget) : "";
  return `
    <div class="content__meta-row">
      <p class="content__meta" id="content-meta">${metaContent}</p>
      ${copy}
    </div>
  `;
}

function renderStickers(section) {
  const container = document.getElementById("stickers-container");
  const visible = filterStickers(section.stickers);
  const body = visible.length === 0
    ? `<p class="content__placeholder">Nenhuma figurinha corresponde ao filtro atual.</p>`
    : `<ul class="sticker-grid">${visible.map(stickerCardHtml).join("")}</ul>`;
  const copyTarget = currentFilter !== "all" && visible.length > 0 ? "filtered-section" : null;
  container.innerHTML = metaRowHtml(sectionMetaText(section), copyTarget) + body;
}

function renderGroupedList({ groups, total, emptyMessage, singularNoun, pluralNoun, copyTarget }) {
  const container = document.getElementById("stickers-container");

  if (groups.length === 0) {
    container.innerHTML = `<p class="content__placeholder">${emptyMessage}</p>`;
    return;
  }

  const sectionsCount = groups.length;
  const noun = total === 1 ? singularNoun : pluralNoun;
  const secWord = sectionsCount === 1 ? "seleção" : "seções";

  const groupsHtml = groups.map(({ section, stickers }) => {
    const headerText = section.kind === "selection"
      ? `${section.name} — ${section.groupName}`
      : section.name;
    return `
      <section class="duplicates-group">
        <h3 class="duplicates-group__title">
          ${headerText}
          <span class="duplicates-group__count">(${stickers.length})</span>
        </h3>
        <ul class="sticker-grid duplicates-group__list">${stickers.map(stickerCardHtml).join("")}</ul>
      </section>
    `;
  }).join("");

  container.innerHTML = metaRowHtml(`${total} ${noun} em ${sectionsCount} ${secWord}`, copyTarget) + groupsHtml;
}

function renderDuplicatesList() {
  const groups = getDuplicatesBySection().map(({ section, duplicates }) => ({ section, stickers: duplicates }));
  renderGroupedList({
    groups,
    total: countDuplicates(),
    emptyMessage: "Sem figurinhas repetidas no momento. Clique duas vezes em qualquer figurinha para marcá-la como repetida.",
    singularNoun: "figurinha repetida",
    pluralNoun: "figurinhas repetidas",
    copyTarget: "duplicates",
  });
}

function renderMissingList() {
  const groups = getMissingBySection().map(({ section, missing }) => ({ section, stickers: missing }));
  renderGroupedList({
    groups,
    total: countMissing(),
    emptyMessage: "Sem figurinhas faltantes — você completou o álbum!",
    singularNoun: "figurinha faltante",
    pluralNoun: "figurinhas faltantes",
    copyTarget: "missing",
  });
}

function updateContentMeta() {
  const section = sectionsIndex.get(activeSectionId);
  if (!section || !section.stickers) return;
  const meta = document.getElementById("content-meta");
  if (meta) meta.textContent = sectionMetaText(section);
}

function renderFilters() {
  const container = document.getElementById("content-filters");
  const section = sectionsIndex.get(activeSectionId);
  if (!section || !section.stickers) {
    container.hidden = true;
    return;
  }
  // Filter chips only apply to per-section views, not virtual lists.
  container.hidden = false;
  for (const button of container.querySelectorAll(".filter")) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("filter--active", isActive);
    if (isActive) {
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }
  }
}

function renderContent(section) {
  const title = document.getElementById("content-title");
  if (section.kind === "duplicates-view") {
    title.textContent = section.name;
    renderFilters();
    renderDuplicatesList();
    return;
  }
  if (section.kind === "missing-view") {
    title.textContent = section.name;
    renderFilters();
    renderMissingList();
    return;
  }
  title.textContent = section.kind === "selection"
    ? `${section.name} — ${section.groupName}`
    : section.name;
  renderFilters();
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
  } else if (activeSectionId === MISSING_VIEW_ID) {
    renderMissingList();
  } else if (currentFilter !== "all") {
    const section = sectionsIndex.get(activeSectionId);
    if (section) renderStickers(section);
  } else {
    card.dataset.status = newStatus;
    card.setAttribute("aria-label", stickerAriaLabel({ id: stickerId, type }, newStatus));
    updateContentMeta();
  }

  if (originatingSectionId) updateNavProgressFor(originatingSectionId);
  updateNavProgressFor(DUPLICATES_VIEW_ID);
  updateNavProgressFor(MISSING_VIEW_ID);
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
  anchor.download = `colecao-copa-${activeAlbumId}-${date}.json`;
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

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    if (!document.execCommand("copy")) throw new Error("Comando de cópia recusado");
  } finally {
    document.body.removeChild(area);
  }
}

async function copyAndAnnounce(text, count) {
  if (count === 0) {
    showActionFeedback("Nenhuma figurinha para copiar.", "error");
    return;
  }
  try {
    await copyToClipboard(text);
    showActionFeedback(
      `Lista copiada (${count} código${count === 1 ? "" : "s"}).`,
      "success",
    );
  } catch (error) {
    console.warn("Clipboard error:", error);
    showActionFeedback("Falha ao copiar para a área de transferência.", "error");
  }
}

function buildGroupedText(groups) {
  return groups.map(({ section, stickers }) => {
    const header = section.kind === "selection"
      ? `${section.name} (${section.groupName})`
      : section.name;
    return `${header}: ${stickers.map((s) => s.id).join(", ")}`;
  }).join("\n");
}

function handleCopyClick(button) {
  const target = button.dataset.copy;

  if (target === "filtered-section") {
    const section = sectionsIndex.get(activeSectionId);
    if (!section?.stickers) return;
    const visible = filterStickers(section.stickers);
    copyAndAnnounce(visible.map((s) => s.id).join(", "), visible.length);
    return;
  }

  if (target === "duplicates") {
    const groups = getDuplicatesBySection().map(({ section, duplicates }) => ({ section, stickers: duplicates }));
    const total = groups.reduce((sum, g) => sum + g.stickers.length, 0);
    copyAndAnnounce(buildGroupedText(groups), total);
    return;
  }

  if (target === "missing") {
    const groups = getMissingBySection().map(({ section, missing }) => ({ section, stickers: missing }));
    const total = groups.reduce((sum, g) => sum + g.stickers.length, 0);
    copyAndAnnounce(buildGroupedText(groups), total);
    return;
  }
}

function renderAlbumSelector() {
  const select = document.getElementById("album-selector");
  if (!select) return;
  select.innerHTML = albumsManifest.albums
    .map((a) => {
      const label = a.shortName || a.name;
      const selected = a.id === activeAlbumId ? " selected" : "";
      return `<option value="${a.id}"${selected}>${label}</option>`;
    })
    .join("");
  select.disabled = albumsManifest.albums.length < 2;
}

function updateDocumentTitle() {
  const label = album.shortName || album.name;
  document.title = `${label} — Sticker Tracker`;
}

async function switchAlbum(newAlbumId) {
  if (newAlbumId === activeAlbumId) return;
  try {
    album = await loadAlbumById(newAlbumId);
    activeAlbumId = newAlbumId;
    saveActiveAlbumId();
    sectionsIndex = buildSectionsIndex(album);
    collection = loadCollection();
    currentFilter = loadFilter();
    updateDocumentTitle();
    renderOverview();
    renderNav(album);
    const firstSelectionId = album.groups[0].selections[0].code;
    setActiveSection(firstSelectionId);
  } catch (error) {
    renderError(error);
    console.error(error);
  }
}

function attachHandlers() {
  document.getElementById("groups-nav").addEventListener("click", (event) => {
    const button = event.target.closest(".nav-item");
    if (!button) return;
    setActiveSection(button.dataset.sectionId);
  });

  document.getElementById("stickers-container").addEventListener("click", (event) => {
    const copyBtn = event.target.closest("[data-copy]");
    if (copyBtn) {
      handleCopyClick(copyBtn);
      return;
    }
    const card = event.target.closest(".sticker");
    if (!card) return;
    handleStickerClick(card);
  });

  document.getElementById("progress-overview").addEventListener("click", (event) => {
    const link = event.target.closest('[data-action="view-duplicates"]');
    if (!link) return;
    setActiveSection(DUPLICATES_VIEW_ID);
  });

  document.getElementById("content-filters").addEventListener("click", (event) => {
    const button = event.target.closest(".filter");
    if (!button) return;
    const filter = button.dataset.filter;
    if (!FILTERS.includes(filter) || filter === currentFilter) return;
    currentFilter = filter;
    saveFilter();
    const section = sectionsIndex.get(activeSectionId);
    if (section) renderContent(section);
  });

  document.getElementById("export-btn").addEventListener("click", exportCollection);

  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", handleImportFile);

  const albumSelector = document.getElementById("album-selector");
  if (albumSelector) {
    albumSelector.addEventListener("change", (event) => {
      switchAlbum(event.target.value);
    });
  }
}

async function main() {
  try {
    albumsManifest = await loadAlbumsManifest();
    migrateLegacyKeysIfNeeded();
    activeAlbumId = resolveActiveAlbumId();
    saveActiveAlbumId();
    album = await loadAlbumById(activeAlbumId);

    sectionsIndex = buildSectionsIndex(album);
    collection = loadCollection();
    currentFilter = loadFilter();

    updateDocumentTitle();
    renderAlbumSelector();
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
