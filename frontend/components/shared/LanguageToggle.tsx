'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LanguageToggle() {
  const { toggleLocale, locale } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={toggleLocale}
      className="relative flex items-center gap-2 h-12 px-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all duration-300"
      aria-label="Toggle Language"
      id="language-toggle"
    >
      <Globe className="w-5 h-5 text-primary-light" />
      <span className="font-medium min-w-[32px] uppercase text-sm md:text-base">
        {locale === 'en' ? 'EN' : 'SW'}
      </span>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={locale}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full shadow-[0_0_8px_rgba(245,166,35,0.6)]"
        />
      </AnimatePresence>
    </Button>
  );
}
