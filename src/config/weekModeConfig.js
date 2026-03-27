/**
 * weekModeConfig.js – GitHub Pages Version
 *
 * Ermittelt den base-Pfad automatisch aus import.meta.env.BASE_URL
 * (Vite setzt das auf '/agra-touch-flow/' beim Build).
 * Lokal ist BASE_URL '/', also funktioniert es überall.
 */

const BASE = import.meta.env.BASE_URL || '/';

const DEFAULTS = {
  system_mode: 'week',
  idle_timeout_seconds: 60,
  slideshow_images: [],
  scheduled_overrides: [],
  emergency_type: 'evacuation',
  emergency_message: null,
  active_event_id: null,
  map_image_url: `${BASE}assets/venue-map.jpg`,
  map_points: [],
  map_zones: [],
  stelen: {},
  theme_mode: 'dark',
};

const STATIC_CONFIG_URL = `${BASE}config/kiosk-config.json`;

export async function loadKioskConfig() {
  try {
    const res = await fetch(`${STATIC_CONFIG_URL}?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return { ...DEFAULTS, ...data };
    }
  } catch {
    // Datei nicht erreichbar → Defaults
  }

  console.warn('[weekModeConfig] kiosk-config.json nicht erreichbar, nutze Defaults');
  return { ...DEFAULTS };
}
