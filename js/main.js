const ALBUM_DATA_URL = "data/album.json";

async function loadAlbum() {
  const response = await fetch(ALBUM_DATA_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${ALBUM_DATA_URL}`);
  }
  return response.json();
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

async function main() {
  try {
    const album = await loadAlbum();
    renderOverview(album);
  } catch (error) {
    renderError(error);
    console.error(error);
  }
}

main();
