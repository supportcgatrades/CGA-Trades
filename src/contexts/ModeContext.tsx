import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type CGAMode = 'lite' | 'beta';

interface ModeContextType {
  mode: CGAMode;
  isLite: boolean;
  isBeta: boolean;
  setMode: (mode: CGAMode, onComplete?: () => void) => void;
  toggleMode: (onComplete?: () => void) => void;
  hasSeenBetaPrompt: boolean;
  dismissBetaPrompt: () => void;
  isTransitioning: boolean;
  transitionTarget: CGAMode | null;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

const STORAGE_KEY = 'cga_interface_mode';
const PROMPT_STORAGE_KEY = 'cga_beta_prompt_dismissed';

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<CGAMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'beta' || saved === 'lite') {
        return saved;
      }
    } catch (e) {
      console.warn("Could not read interface mode from localStorage", e);
    }
    // Default to 'lite' as per requirement
    return 'lite';
  });

  const [transitionTarget, setTransitionTarget] = useState<CGAMode | null>(null);

  const [hasSeenBetaPrompt, setHasSeenBetaPrompt] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PROMPT_STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-cga-mode', mode);
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      console.warn("Could not write interface mode to localStorage", e);
    }
  }, [mode]);

  const setMode = (newMode: CGAMode, onComplete?: () => void) => {
    if (newMode === mode) return;

    // Immediately trigger transition overlay (no toast, no banner)
    setTransitionTarget(newMode);

    // After 380ms, swap the mode and trigger navigation behind the overlay
    setTimeout(() => {
      setModeState(newMode);
      try {
        document.documentElement.setAttribute('data-cga-mode', newMode);
        localStorage.setItem(STORAGE_KEY, newMode);
      } catch (e) {
        console.warn("Could not write interface mode to localStorage", e);
      }
      if (onComplete) {
        onComplete();
      }
    }, 380);

    // After 850ms, smoothly remove the transition overlay
    setTimeout(() => {
      setTransitionTarget(null);
    }, 850);
  };

  const toggleMode = (onComplete?: () => void) => {
    setMode(mode === 'lite' ? 'beta' : 'lite', onComplete);
  };

  const dismissBetaPrompt = () => {
    setHasSeenBetaPrompt(true);
    try {
      localStorage.setItem(PROMPT_STORAGE_KEY, 'true');
    } catch (e) {}
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        isLite: mode === 'lite',
        isBeta: mode === 'beta',
        setMode,
        toggleMode,
        hasSeenBetaPrompt,
        dismissBetaPrompt,
        isTransitioning: transitionTarget !== null,
        transitionTarget,
      }}
    >
      {children}

      {/* Full-Screen Mode Transition Screen (Sections 6 & 7) */}
      <AnimatePresence>
        {transitionTarget && (
          <motion.div
            key="mode-transition-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#07090e] select-none cursor-default"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center px-6"
            >
              {/* CGA logo centered prominently */}
              <div className="relative mb-5 flex items-center justify-center">
                <img
                  src="https://i.imgur.com/nRbbYnS.png"
                  alt="CGA Logo"
                  className="h-14 md:h-16 w-auto object-contain brightness-110 drop-shadow-[0_0_30px_rgba(204,255,0,0.18)]"
                />
              </div>

              {/* Minimal typography: CGA Beta / CGA Lite */}
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-wide text-white">
                CGA {transitionTarget === 'beta' ? 'Beta' : 'Lite'}
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModeContext.Provider>
  );
};

export const useMode = (): ModeContextType => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};

