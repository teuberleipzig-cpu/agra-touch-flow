/**
 * Admin.jsx – Kiosk-Steuerung (Base44-unabhängig)
 *
 * Funktionen:
 *   - PIN-Schutz (4-stellig, im Browser geprüft)
 *   - Modus wechseln: Week / Event / Emergency
 *   - Notfall-Typ und Nachricht konfigurieren
 *   - Screensaver-Bilder verwalten (URLs)
 *   - Idle-Timeout anpassen
 *
 * Speicherung:
 *   - Änderungen werden sofort in localStorage gespeichert
 *     (wirkt auf diese Stele/diesen Browser sofort)
 *   - Zusätzlich: fertige JSON zum Kopieren für den Server
 *     (damit alle Stelen die Änderung bekommen, muss die
 *      /config/kiosk-config.json auf dem Server aktualisiert werden)
 *
 * PIN ändern: ADMIN_PIN unten anpassen.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor, CalendarDays, AlertTriangle, Shield, Clock,
  ImageIcon, Copy, Check, ChevronRight, Lock, Eye, EyeOff,
  Trash2, Plus, Save, LogOut, Info, CloudLightning,
  RefreshCw
} from 'lucide-react';
import { loadKioskConfig } from '@/config/weekModeConfig.js';

// ─── Passwort hier ändern ────────────────────────────────────────────────────
const ADMIN_PIN = '1234';
// ─────────────────────────────────────────────────────────────────────────────

const LOCALSTORAGE_KEY = 'agra_kiosk_config';
const SESSION_KEY = 'agra_admin_session';

// Schreibt Config in localStorage (wirkt sofort auf diese Stele)
function saveConfigLocally(config) {
  try {
    const clean = { ...config };
    delete clean._comment;
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    console.warn('localStorage nicht verfügbar:', e);
  }
}

// Liest Config aus localStorage (Überschreibung durch Admin)
function loadLocalOverride() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatJson(config) {
  const clean = { ...config };
  delete clean._comment;
  return JSON.stringify(clean, null, 2);
}

// ── PIN-Eingabe Komponente ────────────────────────────────────────────────────
function PinScreen({ onSuccess }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const inputs = useRef([]);

  const handleDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError(false);
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
    if (index === 3 && value) {
      const pin = [...next.slice(0, 3), value].join('');
      if (pin === ADMIN_PIN) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => {
          setDigits(['', '', '', '']);
          inputs.current[0]?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-10 px-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-white text-2xl">Admin</p>
            <p className="font-interface text-white/40 text-sm tracking-widest uppercase">AGRA Kiosk Steuerung</p>
          </div>
        </div>

        {/* PIN-Eingabe */}
        <div className="flex flex-col items-center gap-6">
          <p className="font-interface text-white/50 text-base">PIN eingeben</p>
          <div className="flex gap-4">
            {digits.map((d, i) => (
              <motion.input
                key={i}
                ref={el => inputs.current[i] = el}
                animate={error ? { x: [-6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.3 }}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className={`
                  w-16 h-16 text-center text-2xl font-display font-bold rounded-2xl
                  bg-white/[0.06] border-2 text-white outline-none
                  transition-all duration-150 select-text
                  ${error ? 'border-destructive' : d ? 'border-primary' : 'border-white/[0.12]'}
                  focus:border-primary focus:bg-white/[0.08]
                `}
              />
            ))}
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-interface text-destructive text-sm"
            >
              Falscher PIN
            </motion.p>
          )}
          <button
            onClick={() => setShowPin(v => !v)}
            className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm font-interface"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPin ? 'PIN verbergen' : 'PIN anzeigen'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Haupt-Admin-Interface ─────────────────────────────────────────────────────
function AdminPanel() {
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [activeSection, setActiveSection] = useState('mode');

  // Config laden: localStorage-Override hat Vorrang vor Server-Config
  useEffect(() => {
    const localOverride = loadLocalOverride();
    if (localOverride) {
      setConfig(localOverride);
    } else {
      loadKioskConfig().then(setConfig);
    }
  }, []);

  const update = (changes) => {
    setConfig(prev => ({ ...prev, ...changes }));
  };

  const handleSave = () => {
    saveConfigLocally(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(formatJson(config)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  const handleReloadFromServer = async () => {
    const serverConfig = await loadKioskConfig();
    setConfig(serverConfig);
    localStorage.removeItem(LOCALSTORAGE_KEY);
  };

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    update({ slideshow_images: [...(config.slideshow_images || []), { url }] });
    setNewImageUrl('');
  };

  const removeImage = (index) => {
    const next = [...(config.slideshow_images || [])];
    next.splice(index, 1);
    update({ slideshow_images: next });
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-[#08090B] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const SECTIONS = [
    { key: 'mode', label: 'Modus', icon: Monitor },
    { key: 'emergency', label: 'Notfall', icon: AlertTriangle },
    { key: 'screensaver', label: 'Screensaver', icon: ImageIcon },
    { key: 'system', label: 'System', icon: Shield },
    { key: 'export', label: 'Export', icon: Copy },
  ];

  const modeConfig = {
    week: { label: 'Wochenmodus', icon: Monitor, desc: 'Zeigt kommende Veranstaltungen und Geländeplan', color: 'text-primary border-primary/40 bg-primary/10' },
    event: { label: 'Eventmodus', icon: CalendarDays, desc: 'Zeigt aktive Messe / Veranstaltung', color: 'text-blue-400 border-blue-400/40 bg-blue-400/10' },
    emergency: { label: 'Notfall', icon: AlertTriangle, desc: 'Überblendet alle Stelen mit Notfall-Overlay', color: 'text-destructive border-destructive/40 bg-destructive/10' },
  };

  const emergencyTypes = [
    { value: 'evacuation', label: 'Evakuierung', icon: AlertTriangle },
    { value: 'weather', label: 'Wetterwarnung', icon: CloudLightning },
    { value: 'security', label: 'Sicherheitshinweis', icon: Shield },
    { value: 'general', label: 'Allgemeiner Notfall', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#08090B] flex flex-col">

      {/* ── TOP BAR ── */}
      <div className="flex-none flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="font-display font-black text-white text-lg">A</span>
          </div>
          <div>
            <p className="font-display font-bold text-white text-xl leading-tight">AGRA Admin</p>
            <p className="font-interface text-white/40 text-xs tracking-widest uppercase">Kiosk Steuerung</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Aktueller Modus Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-interface text-sm font-semibold ${modeConfig[config.system_mode]?.color || 'text-white/50 border-white/20'}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {modeConfig[config.system_mode]?.label || config.system_mode}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/70 font-interface text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">

        {/* ── SIDEBAR ── */}
        <div className="w-56 flex-none border-r border-white/[0.06] py-6 px-3 space-y-1">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                font-interface text-sm font-medium transition-all text-left
                ${activeSection === key
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                }
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >

              {/* ── MODUS ── */}
              {activeSection === 'mode' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Systemmodus</h2>
                    <p className="font-interface text-white/40 text-sm mt-1">Wechselt alle Stelen innerhalb von 30 Sekunden</p>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(modeConfig).map(([key, { label, icon: Icon, desc, color }]) => (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => update({ system_mode: key })}
                        className={`
                          w-full flex items-center gap-5 px-6 py-5 rounded-2xl border-2 text-left transition-all
                          ${config.system_mode === key
                            ? `${color} shadow-lg`
                            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
                          }
                        `}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.system_mode === key ? 'bg-current/10' : 'bg-white/[0.05]'}`}>
                          <Icon className={`w-6 h-6 ${config.system_mode === key ? 'text-current' : 'text-white/40'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-display font-bold text-lg ${config.system_mode === key ? 'text-current' : 'text-white/70'}`}>{label}</p>
                          <p className={`font-interface text-sm ${config.system_mode === key ? 'text-current/70' : 'text-white/30'}`}>{desc}</p>
                        </div>
                        {config.system_mode === key && (
                          <div className="w-3 h-3 rounded-full bg-current flex-shrink-0" />
                        )}
                      </motion.button>
                    ))}
                  </div>

                  {/* Hinweis Notfallmodus */}
                  {config.system_mode === 'emergency' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/30"
                    >
                      <Info className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="font-interface text-destructive/80 text-sm leading-relaxed">
                        Notfallmodus aktiv. Alle Stelen zeigen das Notfall-Overlay.
                        Wechsle zu „Notfall"-Einstellungen um Typ und Nachricht festzulegen.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── NOTFALL ── */}
              {activeSection === 'emergency' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Notfall-Einstellungen</h2>
                    <p className="font-interface text-white/40 text-sm mt-1">Wird angezeigt wenn der Modus auf „Notfall" gestellt ist</p>
                  </div>

                  {/* Notfall-Typ */}
                  <div className="space-y-3">
                    <p className="font-interface text-white/60 text-sm font-medium uppercase tracking-widest">Notfall-Typ</p>
                    <div className="grid grid-cols-2 gap-3">
                      {emergencyTypes.map(({ value, label, icon: Icon }) => (
                        <motion.button
                          key={value}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => update({ emergency_type: value })}
                          className={`
                            flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left transition-all
                            ${config.emergency_type === value
                              ? 'border-destructive/60 bg-destructive/10 text-destructive'
                              : 'border-white/[0.08] bg-white/[0.02] text-white/50 hover:border-white/20'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-interface font-medium text-sm">{label}</span>
                          {config.emergency_type === value && <div className="ml-auto w-2 h-2 rounded-full bg-destructive" />}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Notfall-Nachricht */}
                  <div className="space-y-3">
                    <p className="font-interface text-white/60 text-sm font-medium uppercase tracking-widest">Nachricht (optional)</p>
                    <textarea
                      value={config.emergency_message || ''}
                      onChange={e => update({ emergency_message: e.target.value || null })}
                      placeholder="z. B.: Bitte verlassen Sie sofort das Gebäude über die markierten Ausgänge."
                      rows={3}
                      className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-3 text-white font-interface text-base resize-none outline-none focus:border-primary/50 placeholder-white/20 transition-colors"
                    />
                    <p className="font-interface text-white/25 text-xs">Leer lassen für keine zusätzliche Nachricht</p>
                  </div>
                </div>
              )}

              {/* ── SCREENSAVER ── */}
              {activeSection === 'screensaver' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Screensaver-Bilder</h2>
                    <p className="font-interface text-white/40 text-sm mt-1">
                      Werden angezeigt wenn keine Interaktion stattfindet.
                      Leer lassen → Fallback-Bilder aus <code className="text-primary/70 text-xs">/assets/</code>
                    </p>
                  </div>

                  {/* Vorhandene Bilder */}
                  <div className="space-y-3">
                    {(config.slideshow_images || []).length === 0 ? (
                      <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <ImageIcon className="w-5 h-5 text-white/20" />
                        <p className="font-interface text-white/30 text-sm">Keine Bilder konfiguriert – Fallback-Bilder werden verwendet</p>
                      </div>
                    ) : (
                      (config.slideshow_images || []).map((img, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl border border-white/[0.08] bg-white/[0.02] group"
                        >
                          {/* Vorschau */}
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/[0.04] flex-shrink-0">
                            <img
                              src={img.url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          </div>
                          <p className="flex-1 font-interface text-white/50 text-sm truncate">{img.url}</p>
                          <button
                            onClick={() => removeImage(i)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Neues Bild hinzufügen */}
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addImage()}
                      placeholder="https://example.com/bild.jpg"
                      className="flex-1 bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-3 text-white font-interface text-sm outline-none focus:border-primary/50 placeholder-white/20 transition-colors"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={addImage}
                      disabled={!newImageUrl.trim()}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/20 border border-primary/30 text-primary font-interface font-semibold text-sm disabled:opacity-30 transition-all hover:bg-primary/30"
                    >
                      <Plus className="w-4 h-4" />
                      Hinzufügen
                    </motion.button>
                  </div>

                  <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <Info className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                    <p className="font-interface text-white/30 text-xs leading-relaxed">
                      Bilder müssen öffentlich erreichbar sein. Alternativ Dateien in <code className="text-primary/50">/public/assets/</code> legen
                      und als <code className="text-primary/50">/assets/dateiname.jpg</code> eintragen.
                    </p>
                  </div>
                </div>
              )}

              {/* ── SYSTEM ── */}
              {activeSection === 'system' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Systemeinstellungen</h2>
                    <p className="font-interface text-white/40 text-sm mt-1">Allgemeine Kiosk-Parameter</p>
                  </div>

                  {/* Idle-Timeout */}
                  <div className="space-y-4">
                    <p className="font-interface text-white/60 text-sm font-medium uppercase tracking-widest">Idle-Timeout</p>
                    <div className="flex items-center gap-5 px-6 py-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                      <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-interface text-white font-medium">Screensaver nach</p>
                        <p className="font-interface text-white/35 text-sm">Sekunden ohne Interaktion</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => update({ idle_timeout_seconds: Math.max(10, (config.idle_timeout_seconds || 60) - 10) })}
                          className="w-10 h-10 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/60 hover:text-white flex items-center justify-center font-bold text-lg transition-colors"
                        >−</motion.button>
                        <span className="font-display font-bold text-2xl text-white w-16 text-center">
                          {config.idle_timeout_seconds || 60}s
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => update({ idle_timeout_seconds: Math.min(300, (config.idle_timeout_seconds || 60) + 10) })}
                          className="w-10 h-10 rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/60 hover:text-white flex items-center justify-center font-bold text-lg transition-colors"
                        >+</motion.button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[30, 60, 90, 120, 180].map(s => (
                        <button
                          key={s}
                          onClick={() => update({ idle_timeout_seconds: s })}
                          className={`px-4 py-2 rounded-xl font-interface text-sm transition-all ${
                            config.idle_timeout_seconds === s
                              ? 'bg-primary/20 border border-primary/40 text-primary'
                              : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70'
                          }`}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vom Server neu laden */}
                  <div className="space-y-3">
                    <p className="font-interface text-white/60 text-sm font-medium uppercase tracking-widest">Server-Sync</p>
                    <div className="flex items-center gap-4 px-6 py-5 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                      <RefreshCw className="w-5 h-5 text-white/40 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-interface text-white/70 text-sm font-medium">Vom Server neu laden</p>
                        <p className="font-interface text-white/30 text-xs mt-0.5">Lokale Änderungen verwerfen und <code>/config/kiosk-config.json</code> laden</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReloadFromServer}
                        className="px-4 py-2 rounded-xl border border-white/[0.12] text-white/50 hover:text-white hover:border-white/30 font-interface text-sm transition-all"
                      >
                        Neu laden
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── EXPORT ── */}
              {activeSection === 'export' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Config exportieren</h2>
                    <p className="font-interface text-white/40 text-sm mt-1">
                      Diese JSON auf dem Server als <code className="text-primary/70">/config/kiosk-config.json</code> speichern,
                      damit alle Stelen die Einstellungen übernehmen
                    </p>
                  </div>

                  {/* JSON-Preview */}
                  <div className="relative">
                    <pre className="bg-white/[0.03] border border-white/[0.08] rounded-2xl px-6 py-5 font-mono text-sm text-primary/80 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      {formatJson(config)}
                    </pre>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyJson}
                      className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.10] text-white/50 hover:text-white font-interface text-xs transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Kopiert!' : 'Kopieren'}
                    </motion.button>
                  </div>

                  {/* Anleitung */}
                  <div className="space-y-3 px-6 py-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <p className="font-interface text-white/60 text-sm font-medium uppercase tracking-widest">Anleitung</p>
                    <ol className="space-y-2 font-interface text-white/40 text-sm">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">1</span>
                        JSON oben kopieren
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">2</span>
                        Auf dem Webserver <code className="text-primary/60">public/config/kiosk-config.json</code> öffnen
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">3</span>
                        Inhalt ersetzen und speichern
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">4</span>
                        Alle Stelen übernehmen die Änderung innerhalb von 30 Sekunden automatisch
                      </li>
                    </ol>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── SAVE BAR (sticky bottom) ── */}
      <div className="flex-none border-t border-white/[0.06] px-8 py-4 flex items-center justify-between bg-[#08090B]">
        <p className="font-interface text-white/30 text-sm">
          Änderungen wirken sofort auf diese Stele · Andere Stelen: JSON exportieren und auf Server speichern
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-interface font-semibold text-sm transition-all
            ${saved
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-primary hover:bg-primary/90 text-white border border-primary'
            }
          `}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Gespeichert!' : 'Auf dieser Stele speichern'}
        </motion.button>
      </div>
    </div>
  );
}

// ── Root-Export: PIN-Guard ────────────────────────────────────────────────────
export default function Admin() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );

  if (!authenticated) {
    return <PinScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return <AdminPanel />;
}
