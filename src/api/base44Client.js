/**
 * base44Client – Stub-Version (Base44-unabhängig)
 *
 * Dieser Stub ersetzt den originalen Base44 SDK-Client.
 * Er exportiert ein Objekt mit der gleichen Struktur wie der echte Client,
 * aber alle Methoden sind No-Ops oder geben leere Ergebnisse zurück.
 *
 * Zweck: Bestehende Imports (z.B. in Admin.jsx) crashen nicht,
 * solange sie noch nicht vollständig migriert sind.
 *
 * Komponenten, die diesen Client nutzen:
 *   - src/components/kiosk/KioskContext.jsx  → wird in Block 4 migriert
 *   - src/pages/Admin.jsx                    → bleibt vorerst im Stub-Modus
 */

const noop = () => Promise.resolve([]);
const noopUpdate = () => Promise.resolve({});

const makeEntity = () => ({
  list: noop,
  filter: noop,
  get: noop,
  create: noopUpdate,
  update: noopUpdate,
  delete: noopUpdate,
  subscribe: () => () => {}, // gibt eine unsubscribe-Funktion zurück
});

export const base44 = {
  auth: {
    me: noop,
    logout: () => {},
    redirectToLogin: () => {},
  },
  entities: {
    KioskConfig: makeEntity(),
    Event: makeEntity(),
  },
  functions: {
    invoke: (name) => {
      console.warn(`[base44 stub] functions.invoke('${name}') called – stub returns empty result`);
      return Promise.resolve({ data: {} });
    },
  },
};
