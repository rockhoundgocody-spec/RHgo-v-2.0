import { useEffect, useRef } from 'react';
import { darkMapStyle } from './googleMapStyles';

/**
 * Custom hook for initializing a Google Map instance and managing markers.
 *
 * @param {Object} params
 * @param {boolean} params.mapsReady Whether Google Maps JS API is loaded
 * @param {Array<Object>} params.pins Array of items with { lat, lng, title, ... }
 * @param {Function} [params.getMarkerOptions] Custom marker options builder: (pin) => markerOptions
 * @param {Function} [params.onPinSelect] Callback when a marker is clicked: (pin) => void
 * @param {Array<Object>} [params.mapStyles] Optional Google Maps styles array
 * @returns {{ mapRef: React.RefObject, mapInstanceRef: React.RefObject }}
 */
export function useGoogleMap({
  mapsReady,
  pins = [],
  getMarkerOptions,
  onPinSelect,
  mapStyles = darkMapStyle,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;

    const center = pins.length
      ? { lat: pins[0].lat, lng: pins[0].lng }
      : { lat: 39.5, lng: -98.35 };

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: pins.length === 1 ? 10 : 5,
      mapTypeId: 'terrain',
      disableDefaultUI: true,
      zoomControl: true,
      styles: mapStyles,
    });

    mapInstanceRef.current = map;
  }, [mapsReady, pins, mapStyles]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsReady) return;

    // Clear old markers
    markersRef.current.forEach((m) => {
      window.google.maps.event?.clearInstanceListeners(m);
      m.setMap(null);
    });
    markersRef.current = [];

    if (!pins.length) return;

    const bounds = new window.google.maps.LatLngBounds();

    pins.forEach((pin) => {
      const defaultOptions = {
        position: { lat: pin.lat, lng: pin.lng },
        map: mapInstanceRef.current,
        title: pin.title || pin.mineral_name,
      };

      const customOptions = getMarkerOptions ? getMarkerOptions(pin) : {};
      const markerOptions = { ...defaultOptions, ...customOptions };

      const marker = new window.google.maps.Marker(markerOptions);

      if (onPinSelect) {
        marker.addListener('click', () => onPinSelect(pin));
      }

      markersRef.current.push(marker);
      bounds.extend({ lat: pin.lat, lng: pin.lng });
    });

    if (pins.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { top: 48, right: 24, bottom: 48, left: 24 });
    }

    return () => {
      markersRef.current.forEach((marker) => {
        window.google.maps.event?.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, [mapsReady, pins, getMarkerOptions, onPinSelect]);

  return { mapRef, mapInstanceRef };
}
