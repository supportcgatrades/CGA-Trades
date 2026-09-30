import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RotatingButtonTextProps {
  texts: string[];
  interval?: number;
}

export const RotatingButtonText: React.FC<RotatingButtonTextProps> = ({ 
  texts, 
  interval = 2500 
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <div className="relative flex items-center justify-center w-full h-[1.2em] overflow-hidden" style={{ perspective: '1000px' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ rotateX: -90, opacity: 0, y: 15 }}
          animate={{ rotateX: 0, opacity: 1, y: 0 }}
          exit={{ rotateX: 90, opacity: 0, y: -15 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.16, 1, 0.3, 1] // Custom ease
          }}
          style={{ transformStyle: 'preserve-3d' }}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
        >
          <span className="uppercase font-black text-center w-full">{texts[index]}</span>
        </motion.div>
      </AnimatePresence>
      {/* Sizer - helps keep the button height consistent */}
      <span className="invisible uppercase px-4 font-black">{texts[0]}</span>
    </div>
  );
};
