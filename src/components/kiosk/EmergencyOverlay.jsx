import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CloudLightning, Shield, ChevronRight } from 'lucide-react';
import { useKiosk } from './KioskContext';

function EvacuationPlan() {
  return (
    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden border-2 border-destructive/40 bg-black/60">
      <svg viewBox="0 0 400 220" className="w-full" style={{ display: 'block' }}>
        <rect width="400" height="220" fill="#0a0a0a" />
        <rect x="20" y="20" width="360" height="180" rx="8" fill="none" stroke="#444" strokeWidth="3" />
        <rect x="20" y="20" width="180" height="90" rx="4" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />
        <text x="110" y="68" textAnchor="middle" fill="#555" fontSize="11" fontFamily="sans-serif">Halle 1</text>
        <rect x="200" y="20" width="180" height="90" rx="4" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />
        <text x="290" y="68" textAnchor="middle" fill="#555" fontSize="11" fontFamily="sans-serif">Halle 2</text>
        <rect x="20" y="110" width="360" height="90" rx="4" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />
        <text x="200" y="160" textAnchor="middle" fill="#555" fontSize="11" fontFamily="sans-serif">Eingangsbereich</text>
        <rect x="20" y="48" width="16" height="24" fill="#ff003c" opacity="0.9" rx="2" />
        <text x="28" y="60" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">EXIT</text>
        <rect x="364" y="48" width="16" height="24" fill="#ff003c" opacity="0.9" rx="2" />
        <text x="372" y="60" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">EXIT</text>
        <rect x="188" y="184" width="24" height="16" fill="#ff003c" opacity="0.9" rx="2" />
        <text x="200" y="194" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">EXIT</text>
        <rect x="364" y="148" width="16" height="24" fill="#ff003c" opacity="0.9" rx="2" />
        <text x="372" y="160" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">EXIT</text>
        <circle cx="200" cy="140" r="10" fill="#2F6F5E" opacity="0.9" />
        <circle cx="200" cy="140" r="5" fill="white" />
        <path d="M200 145 L200 178" stroke="#ff003c" strokeWidth="2.5" strokeDasharray="4,3" markerEnd="url(#arrowRed)" />
        <path d="M100 85 L40 68" stroke="#ff003c" strokeWidth="2.5" strokeDasharray="4,3" markerEnd="url(#arrowRed)" />
        <path d="M290 150 L368 158" stroke="#ff003c" strokeWidth="2.5" strokeDasharray="4,3" markerEnd="url(#arrowRed)" />
        <defs>
          <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#ff003c" />
          </marker>
        </defs>
      </svg>
      <div className="flex items-center justify-center gap-6 px-4 py-2 bg-black/40 text-xs font-interface text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-destructive inline-block" /> Notausgang
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2F6F5E] inline-block" /> Sie sind hier
        </span>
      </div>
    </div>
  );
}

const TYPE_CONFIG = {
  evacuation: {
    icon: AlertTriangle,
    color: '#ff003c',
    label: { de: 'EVAKUIERUNG', en: 'EVACUATION', ar: 'إخلاء', uk: 'ЕВАКУАЦІЯ' },
    hint: { de: 'PFEILEN FOLGEN · RUHE BEWAHREN', en: 'FOLLOW ARROWS · STAY CALM', ar: 'اتبع الأسهم · حافظ على هدوئك', uk: 'СЛІДУЙТЕ СТРІЛКАМ · ЗБЕРІГАЙТЕ СПОКІЙ' },
    showPlan: true,
    showArrows: true,
  },
  weather: {
    icon: CloudLightning,
    color: '#f59e0b',
    label: { de: 'WETTERWARNUNG', en: 'WEATHER WARNING', ar: 'تحذير طقس', uk: 'ПОПЕРЕДЖЕННЯ ПРО ПОГОДУ' },
    hint: { de: 'BITTE GEBÄUDE AUFSUCHEN · NICHT INS FREIE', en: 'SEEK SHELTER INSIDE · DO NOT GO OUTSIDE', ar: 'ابقَ في الداخل · لا تخرج', uk: 'ЗАЛИШАЙТЕСЬ У ПРИМІЩЕННІ' },
    showPlan: false,
    showArrows: false,
  },
  security: {
    icon: Shield,
    color: '#3b82f6',
    label: { de: 'SICHERHEITSHINWEIS', en: 'SECURITY NOTICE', ar: 'تنبيه أمني', uk: 'ПОПЕРЕДЖЕННЯ БЕЗПЕКИ' },
    hint: { de: 'ANWEISUNGEN DES PERSONALS FOLGEN', en: 'FOLLOW STAFF INSTRUCTIONS', ar: 'اتبع تعليمات الموظفين', uk: 'ДОТРИМУЙТЕСЬ ВКАЗІВОК ПЕРСОНАЛУ' },
    showPlan: false,
    showArrows: false,
  },
  general: {
    icon: AlertTriangle,
    color: '#ff003c',
    label: { de: 'NOTFALL', en: 'EMERGENCY', ar: 'طوارئ', uk: 'НАДЗВИЧАЙНА СИТУАЦІЯ' },
    hint: { de: 'BITTE RUHIG BLEIBEN', en: 'PLEASE STAY CALM', ar: 'يرجى الهدوء', uk: 'БУДЬ ЛАСКА, ЗБЕРЕЖІТЬ СПОКІЙ' },
    showPlan: true,
    showArrows: true,
  },
};

export default function EmergencyOverlay() {
  const { config, language } = useKiosk();
  const emergencyType = config?.emergency_type || 'evacuation';
  const message = config?.emergency_message;
  const lang = ['de', 'en', 'ar', 'uk'].includes(language) ? language : 'de';

  const cfg = TYPE_CONFIG[emergencyType] || TYPE_CONFIG.general;
  const Icon = cfg.icon;
  const color = cfg.color;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden" style={{ backgroundColor: '#060608' }}>
      {/* Pulsing border */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ boxShadow: [`inset 0 0 0 10px ${color}60`, `inset 0 0 0 10px ${color}20`, `inset 0 0 0 10px ${color}60`] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* TOP BANNER */}
      <motion.div
        className="flex-none flex items-center justify-center gap-4 py-5 px-6"
        style={{ backgroundColor: `${color}22`, borderBottom: `2px solid ${color}44` }}
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <Icon style={{ color }} strokeWidth={2.5} className="w-10 h-10 flex-shrink-0" />
        </motion.div>
        <h1 className="font-display font-black tracking-widest uppercase" style={{ color, fontSize: 'clamp(1.6rem, 6vw, 3rem)' }}>
          {cfg.label[lang]}
        </h1>
        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <Icon style={{ color }} strokeWidth={2.5} className="w-10 h-10 flex-shrink-0" />
        </motion.div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 px-6 py-4 overflow-hidden">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl rounded-2xl px-6 py-4 text-center"
            style={{ backgroundColor: `${color}18`, border: `1.5px solid ${color}50` }}
          >
            <p className="font-display font-bold text-white leading-snug" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}>
              {message}
            </p>
          </motion.div>
        )}

        {cfg.showArrows && (
          <motion.div
            className="flex items-center gap-2"
            animate={{ x: [0, 18, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          >
            {[0, 1, 2].map(i => (
              <ChevronRight key={i} style={{ color, opacity: 1 - i * 0.25 }} className="w-16 h-16" strokeWidth={3} />
            ))}
            <span className="font-display font-black text-white ml-2" style={{ fontSize: 'clamp(1.4rem, 5vw, 2.4rem)' }}>
              AUSGANG
            </span>
            {[0, 1, 2].map(i => (
              <ChevronRight key={i + 3} style={{ color, opacity: 0.75 - i * 0.25 }} className="w-16 h-16" strokeWidth={3} />
            ))}
          </motion.div>
        )}

        {!cfg.showArrows && (
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Icon style={{ color }} className="w-32 h-32" strokeWidth={1.5} />
          </motion.div>
        )}

        {cfg.showPlan && (
          <div className="w-full max-w-lg">
            <p className="font-interface text-white/40 text-sm uppercase tracking-widest text-center mb-2">Evakuierungsplan</p>
            <EvacuationPlan />
          </div>
        )}
      </div>

      {/* BOTTOM HINT BAR */}
      <div className="flex-none py-4 px-6 text-center" style={{ backgroundColor: `${color}15`, borderTop: `1.5px solid ${color}30` }}>
        <p className="font-display font-extrabold tracking-widest" style={{ color, fontSize: 'clamp(0.9rem, 3vw, 1.4rem)' }}>
          {cfg.hint[lang]}
        </p>
      </div>
    </div>
  );
}