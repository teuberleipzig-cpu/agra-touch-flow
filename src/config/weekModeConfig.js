/**
 * weekModeConfig.js
 *
 * Lädt die Kiosk-Konfiguration.
 *
 * Strategie (in dieser Reihenfolge):
 *   1. /.netlify/functions/get-config  – Netlify Blob Store (Produktion)
 *   2. /config/kiosk-config.json       – Statische Datei (lokale Entwicklung
 *                                        und späterer eigener Server)
 *   3. Eingebaute Defaults             – Fallback wenn beides nicht klappt
 *
 * Die Stelen pollen alle 30 Sekunden – Modus-Wechsel vom Büro aus
 * werden so innerhalb von 30 Sekunden auf allen Stelen aktiv.
 */

const DEFAULTS = {
  system_mode: 'week',
  idle_timeout_seconds: 60,
  slideshow_images: [],
  scheduled_overrides: [],
  emergency_type: 'evacuation',
  emergency_message: null,
  active_event_id: null,
};

// Netlify Function Endpunkt
const NETLIFY_CONFIG_URL = '/.netlify/functions/get-config';

// Statische JSON (lokale Dev + späterer eigener Server)
const STATIC_CONFIG_URL  = '/config/kiosk-config.json';

/**
 * Lädt die Kiosk-Konfiguration.
 * Gibt immer ein vollständiges Config-Objekt zurück – nie null/undefined.
 *
 * @returns {Promise<object>}
 */
export async function loadKioskConfig() {
  // Versuch 1: Netlify Function
  try {
    const res = await fetch(`${NETLIFY_CONFIG_URL}?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return { ...DEFAULTS, ...data };
    }
  } catch {
    // nicht auf Netlify oder Function nicht verfügbar → weiter
  }

  // Versuch 2: Statische JSON-Datei (lokale Entwicklung / eigener Server)
  try {
    const res = await fetch(`${STATIC_CONFIG_URL}?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      return { ...DEFAULTS, ...data };
    }
  } catch {
    // auch das nicht verfügbar → Defaults
  }

  console.warn('[weekModeConfig] Keine Config-Quelle erreichbar, nutze Defaults');
  return { ...DEFAULTS };
}
