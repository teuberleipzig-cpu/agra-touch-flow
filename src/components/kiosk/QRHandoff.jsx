import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, QrCode } from 'lucide-react';
import { useKiosk } from './KioskContext';

export default function QRHandoff({ label, url }) {
  const [showQR, setShowQR] = useState(false);
  const { t } = useKiosk();

  // Generate a simple QR code URL using a public API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url || 'https://agra-leipzig.de')}&bgcolor=0A0A0C&color=00F3FF`;

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95, y: 3 }}
        onClick={() => setShowQR(true)}
        className="flex items-center gap-4 px-8 py-5 rounded-2xl bg-primary/10 border-2 border-primary/30 cyan-glow touch-manipulation"
      >
        <Smartphone className="w-8 h-8 text-primary" />
        <span className="font-display font-bold text-xl text-primary text-shadow-glow">
          {label || t('downloadMap')}
        </span>
      </motion.button>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col items-center gap-8 p-12"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                <div className="relative bg-card rounded-3xl p-8 border border-primary/20 cyan-glow">
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-72 h-72"
                  />
                </div>
              </div>
              <div className="text-center space-y-3">
                <div className="flex items-center gap-3 justify-center">
                  <QrCode className="w-8 h-8 text-primary" />
                  <p className="font-display font-bold text-3xl text-foreground">{t('scanQR')}</p>
                </div>
                <p className="text-xl text-muted-foreground font-interface">{label}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowQR(false)}
                className="w-16 h-16 rounded-full kiosk-surface border border-white/[0.1] flex items-center justify-center text-muted-foreground hover:text-foreground touch-manipulation"
              >
                <X className="w-8 h-8" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}