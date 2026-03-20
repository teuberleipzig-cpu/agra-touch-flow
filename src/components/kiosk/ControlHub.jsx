import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from './KioskContext';
import LanguageSelector from './LanguageSelector';

export default function ControlHub({ onBack, onHome, showBack = true }) {
  const { t } = useKiosk();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] pb-6 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="kiosk-surface rounded-3xl px-6 py-4 flex items-center justify-between backdrop-blur-xl border border-white/[0.08]">
          <div className="flex items-center gap-3">
            {showBack && onBack && (
              <motion.button
                whileTap={{ scale: 0.9, y: 2 }}
                onClick={onBack}
                className="w-14 h-14 rounded-xl kiosk-surface hover:kiosk-surface-hover border border-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground transition-all touch-manipulation"
              >
                <ArrowLeft className="w-7 h-7" />
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9, y: 2 }}
              onClick={onHome}
              className="w-14 h-14 rounded-xl kiosk-surface hover:kiosk-surface-hover border border-white/[0.06] flex items-center justify-center text-primary hover:text-primary/80 transition-all touch-manipulation"
            >
              <Home className="w-7 h-7" />
            </motion.button>
          </div>

          <LanguageSelector />
        </div>
      </div>
    </div>
  );
}