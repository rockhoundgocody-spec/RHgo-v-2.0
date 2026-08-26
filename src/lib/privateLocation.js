function hasValidCoordinates(location) {
  return Number.isFinite(location?.lat)
    && location.lat >= -90
    && location.lat <= 90
    && Number.isFinite(location?.lng)
    && location.lng >= -180
    && location.lng <= 180;
}

export function buildPrivatePinRecord(userLocation, ownerEmail, now = new Date()) {
  if (!hasValidCoordinates(userLocation)) throw new Error('A valid GPS location is required');
  if (!ownerEmail) throw new Error('An authenticated owner is required');

  const label = `Field Pin · ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  return {
    owner_email: ownerEmail,
    mineral_name: 'Field Pin',
    notes: 'Private quick pin captured from Explore.',
    location_label: label,
    lat: userLocation.lat,
    lng: userLocation.lng,
    found_date: now.toISOString().split('T')[0],
  };
}
