import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const MENU_ITEMS = [
  { key: 'week', label: 'Week', path: '/Home', color: 'from-primary/20 to-primary/5 border-primary/30 hover:border-primary/60 ring-1 ring-primary/20', iconColor: 'text-primary', textColor: 'text-white' },
  { key: 'b1', label: 'Event', path: '/EventMode', color: 'from-white/10 to-white/5 border-white/10 hover:border-white/25', iconColor: 'text-white/70', textColor: 'text-white/70' },
  { key: 'b2', label: 'B2', path: null, color: 'from-white/10 to-white/5 border-white/10 hover:border-white/25', iconColor: 'text-white/70', textColor: 'text-white/70' },
];

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#08090B] overflow-hidden gap-12 px-10">

      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
          <span className="font-display font-black text-white text-4xl leading-none">A</span>
        </div>
        <div className="text-center">
          <p className="font-display font-bold text-white text-3xl leading-tight tracking-tight">AGRA</p>
          <p className="font-interface text-white/40 text-sm tracking-widest uppercase">Messepark Leipzig</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {MENU_ITEMS.map(({ key, label, path, color, textColor }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.97 }}
            onClick={() => path && navigate(path)}
            className={`
              w-full py-6 rounded-2xl border bg-gradient-to-b
              font-display font-bold text-2xl tracking-wide
              touch-manipulation transition-colors duration-200
              ${color} ${textColor}
              ${!path ? 'opacity-50 cursor-default' : ''}
            `}
          >
            {label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}