import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface PopupRequest {
  id: string;
  onShow: () => void;
  onClose: () => void;
}

interface UIContextType {
  isTransferModalOpen: boolean;
  isDistractionFree: boolean;
  openTransferModal: () => void;
  closeTransferModal: () => void;
  setDistractionFree: (value: boolean) => void;
  mrBActivationPopup: { planName: string; amount: number } | null;
  setMrBActivationPopup: (val: { planName: string; amount: number } | null) => void;
  
  // Expose Queue Manager API
  requestPopup: (id: string, onShow: () => void, onClose: () => void) => void;
  closePopup: (id: string) => void;
  activePopupId: string | null;

  // New states for investment processing & popups
  isViewingProcessingScreen: boolean;
  setIsViewingProcessingScreen: (val: boolean) => void;
  processingInvestmentId: string | null;
  setProcessingInvestmentId: (val: string | null) => void;
  approvedNotificationPopup: { id: string; planName: string; amount: number } | null;
  setApprovedNotificationPopup: (val: { id: string; planName: string; amount: number } | null) => void;
  isWelcomeBonusDeductedPopupOpen: { planName: string; amount: number } | null;
  setIsWelcomeBonusDeductedPopupOpen: (val: { planName: string; amount: number } | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  
  // Queue Manager States / Refs
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const [queue, setQueue] = useState<PopupRequest[]>([]);
  const [isDelaying, setIsDelaying] = useState(false);
  const [hasShownPopupOnPath, setHasShownPopupOnPath] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Real active state of mrB activation popup
  const [mrBActivationValue, setMrBActivationValue] = useState<{ planName: string; amount: number } | null>(null);

  // New states for investment processing & popups
  const [isViewingProcessingScreen, setIsViewingProcessingScreen] = useState(false);
  const [processingInvestmentId, setProcessingInvestmentId] = useState<string | null>(null);
  const [approvedNotificationPopup, setApprovedNotificationPopup] = useState<{ id: string; planName: string; amount: number } | null>(null);
  const [isWelcomeBonusDeductedPopupOpen, setIsWelcomeBonusDeductedPopupOpen] = useState<{ planName: string; amount: number } | null>(null);

  // Keep a table/registry of actual callbacks to support multi-component onClose correctly
  const popupRegistryRef = useRef<Map<string, PopupRequest>>(new Map());

  // Prevent stale closures in interval/timers
  const stateRef = useRef({
    activePopupId,
    queue,
    isDelaying,
    hasShownPopupOnPath,
    currentPath
  });

  useEffect(() => {
    stateRef.current = {
      activePopupId,
      queue,
      isDelaying,
      hasShownPopupOnPath,
      currentPath
    };
  }, [activePopupId, queue, isDelaying, hasShownPopupOnPath, currentPath]);

  // Fast polling check of window path to reset hasShown flag upon transitioning to different routes
  useEffect(() => {
    const handleLocationPoll = () => {
      const actualPath = window.location.pathname;
      if (actualPath !== stateRef.current.currentPath) {
        setCurrentPath(actualPath);
        setHasShownPopupOnPath(false);

        // Allow some time for layout render to stabilize, then try processing queue on new path page session
        setTimeout(() => {
          const current = stateRef.current;
          if (!current.activePopupId && !current.isDelaying && current.queue.length > 0) {
            processNext(current.queue, false);
          }
        }, 150);
      }
    };

    const intervalId = setInterval(handleLocationPoll, 200);
    return () => clearInterval(intervalId);
  }, []);

  const openTransferModal = () => setIsTransferModalOpen(true);
  const closeTransferModal = () => setIsTransferModalOpen(false);
  const setDistractionFree = (value: boolean) => setIsDistractionFree(value);

  // Core Queue Processing Logic
  const processNext = (currentQueue: PopupRequest[], checkPathFlag = true) => {
    const current = stateRef.current;
    const isRestrictedPath = checkPathFlag ? current.hasShownPopupOnPath : false;

    if (current.activePopupId !== null || current.isDelaying || isRestrictedPath) {
      return;
    }

    if (currentQueue.length > 0) {
      const nextRequest = currentQueue[0];
      setQueue(prev => prev.slice(1));
      setActivePopupId(nextRequest.id);
      setHasShownPopupOnPath(true);
      nextRequest.onShow();
    }
  };

  const requestPopup = (id: string, onShow: () => void, onClose: () => void) => {
    const requestItem: PopupRequest = { id, onShow, onClose };
    popupRegistryRef.current.set(id, requestItem);

    const current = stateRef.current;

    // Do not add if already active
    if (current.activePopupId === id) {
      return;
    }

    const alreadyQueued = current.queue.some(item => item.id === id);
    const shouldHoldInQueue = current.activePopupId !== null || current.isDelaying || current.hasShownPopupOnPath;

    if (shouldHoldInQueue) {
      if (!alreadyQueued) {
        setQueue(prev => [...prev, requestItem]);
      }
    } else {
      setActivePopupId(id);
      setHasShownPopupOnPath(true);
      onShow();
    }
  };

  const closePopup = (id: string) => {
    const registry = popupRegistryRef.current.get(id);
    if (registry) {
      registry.onClose();
    }

    // If it was the active popup, clear active status and trigger the 5-30s random delay
    if (stateRef.current.activePopupId === id) {
      setActivePopupId(null);
      setIsDelaying(true);

      const randomDelayMs = (Math.floor(Math.random() * (30 - 5 + 1)) + 5) * 1000; // random 5s to 30s
      
      setTimeout(() => {
        setIsDelaying(false);
        
        // After delay completes, check if indeed stable & execute next queue item
        setTimeout(() => {
          const updated = stateRef.current;
          if (updated.activePopupId === null && !updated.isDelaying && !updated.hasShownPopupOnPath) {
            processNext(updated.queue, true);
          }
        }, 80);
      }, randomDelayMs);
    }

    // Clean up queue from matching records if any exist
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  // Intercept the mrBActivationPopup trigger seamlessly to register via Queue Manager
  const setMrBActivationPopup = (val: { planName: string; amount: number } | null) => {
    if (val) {
      requestPopup(
        'mr-b-reward',
        () => setMrBActivationValue(val),
        () => setMrBActivationValue(null)
      );
    } else {
      closePopup('mr-b-reward');
    }
  };

  return (
    <UIContext.Provider value={{ 
      isTransferModalOpen, 
      isDistractionFree,
      openTransferModal, 
      closeTransferModal,
      setDistractionFree,
      mrBActivationPopup: mrBActivationValue,
      setMrBActivationPopup,
      requestPopup,
      closePopup,
      activePopupId,
      isViewingProcessingScreen,
      setIsViewingProcessingScreen,
      processingInvestmentId,
      setProcessingInvestmentId,
      approvedNotificationPopup,
      setApprovedNotificationPopup,
      isWelcomeBonusDeductedPopupOpen,
      setIsWelcomeBonusDeductedPopupOpen
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
