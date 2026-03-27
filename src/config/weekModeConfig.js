/**
 * weekModeConfig.js
 *
 * Lädt die Kiosk-Konfiguration.
 *
 * Strategie (in dieser Reihenfolge):
 *   1. /config/kiosk-config.json  – Statische Datei im Repo (GitHub Pages)
 *   2. Eingebaute Defaults        – Fallback wenn Datei nicht erreichbar
 *
 * Modus-Wechsel: kiosk-config.json im Repo aktualisieren und committen.
 * GitHub Pages deployed innerhalb von ~1–2 Minuten, danach
 * übernehmen alle Stelen die Änderung beim nächsten Poll.
 */

const DEFAULTS = {
  system_mode: 'week',
  idle_timeout_seconds: 60,
  slideshow_images: [],
  scheduled_overrides: [],
  emergency_type: 'evacuation',
  emergency_message: null,
  active_event_id: null,
  map_image_url: '/assets/venue-map.jpg',
  map_points: [],
  map_zones: [],
  stelen: {},
  theme_mode: 'dark',
};

const STATIC_CONFIG_URL = '/config/kiosk-config.json';

/**
 * Lädt die Kiosk-Konfiguration.
 * Gibt immer ein vollständiges Config-Objekt zurück – nie null/undefined.
 *
 * @returns {Promise<object>}
 */
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
