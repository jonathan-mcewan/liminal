const STORAGE_KEY = 'liminal_favourites';

export function loadFavourites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function save(favs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

export function saveFavourite(fav) {
  const favs = loadFavourites();
  favs.unshift(fav);
  save(favs);
  return favs;
}

export function deleteFavourite(id) {
  const favs = loadFavourites().filter(f => f.id !== id);
  save(favs);
  return favs;
}

export function clearAllFavourites() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if current settings match any saved favourite.
 * Returns the matching favourite's id, or null.
 */
export function findMatchingFavourite(settings) {
  const key = JSON.stringify(settings);
  const favs = loadFavourites();
  const match = favs.find(f => JSON.stringify(f.settings) === key);
  return match ? match.id : null;
}
