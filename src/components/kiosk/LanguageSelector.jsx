import React from 'react';
import { motion } from 'framer-motion';
import { useKiosk } from './KioskContext';

const LANGUAGES = [
  { code: 'de', label: 'DE' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
  { code: 'uk', label: 'UK' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useKiosk();

  return (
    <div className="flex items-center gap-2">
      {LANGUAGES.map(lang => (
        <motion.button
          key={lang.code}
          whileTap={{ scale: 0.9 }}
          onClick={() => setLanguage(lang.code)}
          className={`
            w-11 h-9 rounded-lg font-interface font-semibold text-sm
            transition-all touch-manipulation select-none
            ${language === lang.code
              ? 'bg-primary text-black'
              : 'bg-white/[0.06] text-white/50 border border-white/[0.08]'
            }
          `}
        >
          {lang.label}
        </motion.button>
      ))}
    </div>
  );
}