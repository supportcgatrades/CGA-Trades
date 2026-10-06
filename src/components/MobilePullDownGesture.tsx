import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMode } from '../contexts/ModeContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { isGoogleProfileIncomplete } from '../utils/googleProfile';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function MobilePullDownGesture() {
  const { isLite, toggleMode } = useMode();
  const { user, profile } = useAuth();
  const { openVerificationPrompt } = useUI();
  const navigate = useNavigate();

  const [revealHeight, setRevealHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRetracting, setIsRetracting] = useState(false);
  const [isThresholdReached, setIsThresholdReached] = useState(false);

  // Mutable refs to prevent unnecessary re-attaching of event listeners on every drag frame
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isAtTopRef = useRef<boolean>(false);
  const isDraggingStateRef = useRef<boolean>(false);
  const hasVibratedRef = useRef<boolean>(false);
  const revealHeightRef = useRef<number>(0);
  const isThresholdReachedRef = useRef<boolean>(false);
  const isSwitchingRef = useRef<boolean>(false);
  const retractTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleModeRef = useRef(toggleMode);
  toggleModeRef.current = toggleMode;

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const isLiteRef = useRef(isLite);
  isLiteRef.current = isLite;

  useEffect(() => {
    // Only register on mobile viewports (< 768px)
    const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
    if (!isMobile()) return;

    const rootEl = document.getElementById('root');

    const updateTransform = (yOffset: number, dragging: boolean) => {
      if (!rootEl) return;
      if (yOffset > 0) {
        rootEl.style.transform = `translate3d(0, ${yOffset}px, 0)`;
        rootEl.style.transition = dragging ? 'none' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)';
      } else {
        rootEl.style.transform = 'translate3d(0, 0px, 0)';
        rootEl.style.transition = dragging ? 'none' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)';
      }
    };

    const cancelAndCleanUp = () => {
      isAtTopRef.current = false;
      isDraggingStateRef.current = false;
      revealHeightRef.current = 0;
      isThresholdReachedRef.current = false;
      hasVibratedRef.current = false;
      touchStartY.current = null;
      touchStartX.current = null;

      setIsDragging(false);
      setRevealHeight(0);
      setIsThresholdReached(false);
      setIsRetracting(true);

      if (rootEl) {
        rootEl.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        rootEl.style.transform = 'translate3d(0, 0px, 0)';
      }

      if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
      retractTimerRef.current = setTimeout(() => {
        setIsRetracting(false);
        if (rootEl) {
          rootEl.style.transform = '';
          rootEl.style.transition = '';
        }
      }, 320);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isSwitchingRef.current) return;
      // Only initiate if scroll position is at the very top of the page
      if (window.scrollY <= 2) {
        if (retractTimerRef.current) {
          clearTimeout(retractTimerRef.current);
          retractTimerRef.current = null;
        }
        setIsRetracting(false);
        isAtTopRef.current = true;
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
        isDraggingStateRef.current = false;
        hasVibratedRef.current = false;
        revealHeightRef.current = 0;
        isThresholdReachedRef.current = false;
      } else {
        isAtTopRef.current = false;
        touchStartY.current = null;
        touchStartX.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTopRef.current || touchStartY.current === null || isSwitchingRef.current) return;

      // Cancel if user scrolled down into page content
      if (window.scrollY > 2) {
        cancelAndCleanUp();
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const rawDeltaY = currentY - touchStartY.current;
      const rawDeltaX = Math.abs(currentX - (touchStartX.current ?? currentX));

      // If predominantly horizontal swipe, don't hijack vertical pull-down
      if (!isDraggingStateRef.current && rawDeltaX > Math.abs(rawDeltaY)) {
        return;
      }

      // Only handle downward drag from top of page
      if (rawDeltaY <= 0) {
        if (isDraggingStateRef.current) {
          cancelAndCleanUp();
        }
        return;
      }

      // Prevent native browser overscroll/pull-to-refresh while pulling CGA gesture
      if (e.cancelable) {
        e.preventDefault();
      }

      if (!isDraggingStateRef.current) {
        isDraggingStateRef.current = true;
        setIsDragging(true);
        setIsRetracting(false);
      }

      // Target maximum expansion: approximately 25% of current mobile viewport height
      const target25vh = Math.round(window.innerHeight * 0.25);
      const threshold = target25vh * 0.85;

      // Soft rubber-band resistance curve
      const normalized = Math.min(1.15, Math.pow(rawDeltaY / 150, 0.82));
      const currentH = Math.min(target25vh * 1.05, normalized * target25vh);

      revealHeightRef.current = currentH;
      setRevealHeight(currentH);

      // Physically translate root page downward with finger
      updateTransform(currentH, true);

      // Check if threshold reached
      const reached = currentH >= threshold;
      if (reached !== isThresholdReachedRef.current) {
        isThresholdReachedRef.current = reached;
        setIsThresholdReached(reached);

        // Tactile vibration tick upon crossing the threshold
        if (reached && !hasVibratedRef.current) {
          hasVibratedRef.current = true;
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(12);
            } catch (err) {}
          }
        } else if (!reached) {
          hasVibratedRef.current = false;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isAtTopRef.current || touchStartY.current === null) {
        cancelAndCleanUp();
        return;
      }

      const reached = isThresholdReachedRef.current;

      if (reached && !isSwitchingRef.current) {
        if (isLiteRef.current && user && isGoogleProfileIncomplete(user, profile)) {
          cancelAndCleanUp();
          openVerificationPrompt("Please complete your account verification to access CGA Beta.");
          return;
        }

        // Mode switch threshold reached: smoothly return page and trigger mode switch
        isSwitchingRef.current = true;
        isDraggingStateRef.current = false;
        setIsDragging(false);
        setRevealHeight(0);
        setIsThresholdReached(false);
        setIsRetracting(true);

        if (rootEl) {
          rootEl.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          rootEl.style.transform = 'translate3d(0, 0px, 0)';
        }

        if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
        retractTimerRef.current = setTimeout(() => {
          setIsRetracting(false);
          if (rootEl) {
            rootEl.style.transform = '';
            rootEl.style.transition = '';
          }
        }, 320);

        // Execute smooth mode switch
        toggleModeRef.current(() => {
          navigateRef.current('/home');
          isSwitchingRef.current = false;
        });
      } else {
        // Did not reach threshold or user cancelled: clean up state and smoothly return
        cancelAndCleanUp();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      if (retractTimerRef.current) clearTimeout(retractTimerRef.current);
      if (rootEl) {
        rootEl.style.transform = '';
        rootEl.style.transition = '';
      }
    };
  }, []); // Run once on mount; all updates are managed via refs and state without resetting transforms

  if (typeof document === 'undefined') return null;

  // Visual state cleanup: do not render portal when not dragging and not retracting
  if (!isDragging && !isRetracting) return null;
  if (revealHeight <= 0 && !isRetracting) return null;

  const target25vh = typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.25) : 180;
  const thresholdDist = target25vh * 0.85;
  const pullProgress = Math.min(1, Math.max(0, (revealHeight - 20) / Math.max(1, thresholdDist - 20)));
  const translateY = (1 - pullProgress) * -4;
  const scale = isThresholdReached ? 1.04 : 0.95 + pullProgress * 0.05;

  return createPortal(
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] pointer-events-none select-none md:hidden overflow-hidden",
        isDragging
          ? "transition-none"
          : "transition-[height,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      )}
      style={{
        height: `${revealHeight}px`,
        opacity: revealHeight > 0 ? 1 : 0,
        display: revealHeight > 0 || isRetracting ? 'block' : 'none'
      }}
      aria-hidden="true"
    >
      {/* 1. Main upper sheet of the CGA primary-color reveal */}
      <div
        className="w-full h-full"
        style={{ backgroundColor: 'var(--color-primary, #009e42)' }}
      />

      {/* 2. Large Smooth Half-Circle / Curved Arc Bottom Edge */}
      <div className="relative w-full -mt-px overflow-hidden pointer-events-none">
        <svg
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          className="w-full h-10 sm:h-12 pointer-events-none"
          style={{
            fill: 'var(--color-primary, #009e42)',
            filter: 'drop-shadow(0 6px 14px rgba(0, 0, 0, 0.25))',
          }}
        >
          <path d="M 0,0 L 0,2 C 25,24 75,24 100,2 L 100,0 Z" />
        </svg>

        {/* 3. Destination Mode Pill (Clean minimal indicator) */}
        {revealHeight > 18 && (
          <div
            className="absolute inset-x-0 bottom-2 sm:bottom-2.5 flex items-center justify-center pointer-events-none"
            style={{
              opacity: Math.min(1, pullProgress * 1.3),
              transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
              transition: isDragging
                ? 'none'
                : 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              className={cn(
                "px-4 py-1.5 rounded-full backdrop-blur-md transition-all duration-200 shadow-md",
                isThresholdReached
                  ? "bg-black/50 border border-white/50 text-white shadow-lg scale-105"
                  : "bg-black/25 border border-white/20 text-white/95"
              )}
            >
              <span className="text-[11px] sm:text-xs font-bold tracking-wider leading-none whitespace-nowrap select-none uppercase">
                {isLite ? 'Switch to Beta' : 'Switch to Lite'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
