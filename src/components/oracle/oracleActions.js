export function detectLogIntent(text) {
  const normalized = String(text ?? '').toLowerCase();
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
