export function getPinnedSpecimens(specimens = []) {
  return specimens.filter(({ lat, lng }) =>
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
