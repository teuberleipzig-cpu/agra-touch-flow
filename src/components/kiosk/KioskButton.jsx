import React from 'react';
import { motion } from 'framer-motion';

export default function KioskButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'surface', // 'surface' | 'primary' | 'glass'
  size = 'large', // 'large' | 'medium' | 'small'
  className = '' 
}) {
  const baseClasses = "relative overflow-hidden rounded-2xl flex items-center gap-6 transition-all active:scale-[0.97] touch-manipulation select-none";
  
  const variants = {
    surface: "kiosk-surface hover:kiosk-surface-hover border border-white/[0.06]",
    primary: "bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 cyan-glow",
    glass: "kiosk-surface hover:kiosk-surface-hover border border-white/[0.08]"
  };

  const sizes = {
    large: "min-h-[140px] px-10 py-8",
    medium: "min-h-[100px] px-8 py-5",
    small: "min-h-[72px] px-6 py-4"
  };

  const iconSizes = {
    large: "w-12 h-12",
    medium: "w-9 h-9",
    small: "w-6 h-6"
  };

  const textSizes = {
    large: "text-3xl",
    medium: "text-2xl",
    small: "text-lg"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97, y: 3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && (
        <div className={`flex-shrink-0 ${variant === 'primary' ? 'text-primary' : 'text-primary/80'}`}>
          <Icon className={iconSizes[size]} strokeWidth={1.5} />
        </div>
      )}
      <span className={`font-display font-bold tracking-tight ${textSizes[size]} ${variant === 'primary' ? 'text-primary text-shadow-glow' : 'text-foreground'}`}>
        {label}
      </span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
      )}
    </motion.button>
  );
}