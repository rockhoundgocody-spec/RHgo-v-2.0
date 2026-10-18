export function detectLogIntent(text) {
  const normalized = String(text ?? '').toLowerCase();
  if (/\b(don['’]?t|do not|never|stop|cancel)\b/.test(normalized)) return false;
  if (!/^(?:(?:hey\s+)?clover[,!:.]?\s*)?(?:please\s+|(?:can|could|would) you\s+)*(?:log|save|record|add|create|catalog|new specimen)\b/.test(normalized.trim())) return false;
  return /\b(log|save|record|add|create|catalog)\b.*\b(specimen|find|rock|mineral|sample|stone|crystal)\b/.test(normalized)
    || /\b(new specimen|log this|save this|record this)\b/.test(normalized);
}

export function getCurrentCoordinates(geolocation = globalThis.navigator?.geolocation) {
  if (typeof geolocation?.getCurrentPosition !== 'function') return Promise.resolve({});
  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve({}),
      { timeout: 4000, maximumAge: 60000 },
    );
  });
}