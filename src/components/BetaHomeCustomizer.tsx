import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { 
  TrendingUp, Wallet, ArrowUpRight, ArrowRightLeft, LayoutGrid,
  History, Gift, Coins, Cpu, Bot, Users, Zap,
  X, Plus, Check, RotateCcw, ChevronUp, ChevronDown,
  GripVertical, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { ROIEngineStats } from './ROIEngineDisplay';

export type HomeWidgetId = 'balance' | 'ai_bot' | 'actions';

export type ActionButtonId = 
  | 'invest'
  | 'fund'
  | 'withdraw'
  | 'transfer'
  | 'dashboard'
  | 'history'
  | 'reward'
  | 'token'
  | 'mining'
  | 'ai'
  | 'referral'
  | 'daily_roi';

export interface BetaHomeConfig {
  widgetOrder: HomeWidgetId[];
  visibleWidgets: HomeWidgetId[];
  actionButtons: ActionButtonId[];
}

export interface ActionDefinition {
  id: ActionButtonId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: (isLight: boolean) => string;
  description: string;
  getAction: (navigate: (path: string) => void, openTransferModal: () => void) => () => void;
}

export const ALL_ACTIONS: Record<ActionButtonId, ActionDefinition> = {
  invest: {
    id: 'invest',
    label: 'Invest',
    icon: TrendingUp,
    colorClass: (isLight) => (isLight ? 'text-blue-600' : 'text-blue-500'),
    description: 'Explore investment nodes & plans',
    getAction: (navigate) => () => navigate('/invest'),
  },
  fund: {
    id: 'fund',
    label: 'Fund',
    icon: Wallet,
    colorClass: () => 'text-white',
    description: 'Deposit digital assets to primary wallet',
    getAction: (navigate) => () => navigate('/fund/deposit'),
  },
  withdraw: {
    id: 'withdraw',
    label: 'Withdraw',
    icon: ArrowUpRight,
    colorClass: (isLight) => (isLight ? 'text-red-600' : 'text-red-500'),
    description: 'Withdraw balance to external wallet',
    getAction: (navigate) => () => navigate('/fund/withdraw'),
  },
  transfer: {
    id: 'transfer',
    label: 'Transfer',
    icon: ArrowRightLeft,
    colorClass: (isLight) => (isLight ? 'text-purple-600' : 'text-purple-400'),
    description: 'Transfer funds to another user instantly',
    getAction: (_, openTransferModal) => () => openTransferModal(),
  },
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    colorClass: (isLight) => (isLight ? 'text-emerald-600' : 'text-emerald-400'),
    description: 'Detailed analytics & holdings overview',
    getAction: (navigate) => () => navigate('/dashboard'),
  },
  history: {
    id: 'history',
    label: 'History',
    icon: History,
    colorClass: (isLight) => (isLight ? 'text-amber-600' : 'text-amber-400'),
    description: 'View full audit log of transactions',
    getAction: (navigate) => () => navigate('/fund/transactions'),
  },
  reward: {
    id: 'reward',
    label: 'Reward',
    icon: Gift,
    colorClass: (isLight) => (isLight ? 'text-pink-600' : 'text-pink-400'),
    description: 'Redeem points & special claim rewards',
    getAction: (navigate) => () => navigate('/rewards'),
  },
  token: {
    id: 'token',
    label: 'Token',
    icon: Coins,
    colorClass: (isLight) => (isLight ? 'text-yellow-600' : 'text-yellow-400'),
    description: 'Access TWN token ecosystem & staking',
    getAction: (navigate) => () => navigate('/token'),
  },
  mining: {
    id: 'mining',
    label: 'Mining',
    icon: Cpu,
    colorClass: (isLight) => (isLight ? 'text-cyan-600' : 'text-cyan-400'),
    description: 'Hashrate mining nodes & hardware rigs',
    getAction: (navigate) => () => navigate('/mining'),
  },
  ai: {
    id: 'ai',
    label: 'AI',
    icon: Bot,
    colorClass: (isLight) => (isLight ? 'text-violet-600' : 'text-violet-400'),
    description: 'High-frequency AI trading algorithms',
    getAction: (navigate) => () => navigate('/ai-marketplace'),
  },
  referral: {
    id: 'referral',
    label: 'Referral',
    icon: Users,
    colorClass: (isLight) => (isLight ? 'text-indigo-600' : 'text-indigo-400'),
    description: 'Team network coordinates & commissions',
    getAction: (navigate) => () => navigate('/referrals'),
  },
  daily_roi: {
    id: 'daily_roi',
    label: 'Daily ROI',
    icon: Zap,
    colorClass: () => 'text-[#009e42]',
    description: 'Daily points hub & yield protocol',
    getAction: (navigate) => () => navigate('/daily-points'),
  },
};

export const DEFAULT_BETA_CONFIG: BetaHomeConfig = {
  widgetOrder: ['balance', 'actions', 'ai_bot'],
  visibleWidgets: ['balance', 'actions', 'ai_bot'],
  actionButtons: ['invest', 'fund', 'withdraw', 'transfer'],
};

export interface BetaHomeCustomizerProps {
  user: any;
  profile: any;
  investments: any[];
  isLight: boolean;
  renderBalanceBoard: () => React.ReactNode;
  openTransferModal: () => void;
  navigate: (path: string) => void;
  isEditing?: boolean;
  setIsEditing?: (val: boolean) => void;
}

// Sub-component for each reorderable widget item with drag handle
function ReorderableWidgetItem({
  widgetId,
  index,
  totalItems,
  title,
  isLight,
  onMove,
  onRemove,
  children
}: {
  key?: React.Key;
  widgetId: HomeWidgetId;
  index: number;
  totalItems: number;
  title: string;
  isLight: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (widgetId: HomeWidgetId) => void;
  children: React.ReactNode;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={widgetId}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "relative rounded-3xl p-2.5 transition-all border border-dashed border-[#009e42]/45 shadow-sm",
        isLight ? "bg-[#009e42]/[0.02]" : "bg-[#009e42]/[0.02]"
      )}
    >
      {/* Widget Header Toolbar in Edit Mode */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-[#009e42]">
          <div 
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#009e42]/10 transition-colors touch-none"
            title="Drag up or down to reorder"
          >
            <GripVertical size={15} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Move Up */}
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
            title="Move Up"
          >
            <ChevronUp size={13} />
          </button>

          {/* Move Down */}
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === totalItems - 1}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
            title="Move Down"
          >
            <ChevronDown size={13} />
          </button>

          {/* Remove Widget */}
          <button
            type="button"
            onClick={() => onRemove(widgetId)}
            className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer ml-1"
            title="Remove Widget"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      <div className="pointer-events-none select-none">
        {children}
      </div>
    </Reorder.Item>
  );
}

export default function BetaHomeCustomizer({
  user,
  profile,
  investments,
  isLight,
  renderBalanceBoard,
  openTransferModal,
  navigate,
  isEditing: propIsEditing,
  setIsEditing: propSetIsEditing,
}: BetaHomeCustomizerProps) {
  const storageKey = `cga_beta_home_customization_${user?.uid || 'guest'}`;

  // Load configuration with validation
  const [config, setConfig] = useState<BetaHomeConfig>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validWidgets: HomeWidgetId[] = ['balance', 'actions', 'ai_bot'];
        
        let widgetOrder: HomeWidgetId[] = Array.isArray(parsed.widgetOrder)
          ? parsed.widgetOrder.filter((w: any) => validWidgets.includes(w))
          : DEFAULT_BETA_CONFIG.widgetOrder;
        validWidgets.forEach(w => {
          if (!widgetOrder.includes(w)) widgetOrder.push(w);
        });

        // Ensure actions (Invest, Fund, Withdraw, Transfer) is positioned directly under the balance card
        if (widgetOrder.includes('balance') && widgetOrder.includes('actions')) {
          const withoutActions: HomeWidgetId[] = widgetOrder.filter(w => w !== 'actions');
          const balanceIdx = withoutActions.indexOf('balance');
          withoutActions.splice(balanceIdx + 1, 0, 'actions');
          widgetOrder = withoutActions;
        }

        let visibleWidgets: HomeWidgetId[] = Array.isArray(parsed.visibleWidgets)
          ? parsed.visibleWidgets.filter((w: any) => validWidgets.includes(w))
          : DEFAULT_BETA_CONFIG.visibleWidgets;

        if (visibleWidgets.includes('balance') && visibleWidgets.includes('actions')) {
          const withoutActions: HomeWidgetId[] = visibleWidgets.filter(w => w !== 'actions');
          const balanceIdx = withoutActions.indexOf('balance');
          withoutActions.splice(balanceIdx + 1, 0, 'actions');
          visibleWidgets = withoutActions;
        }

        const validActionKeys = Object.keys(ALL_ACTIONS) as ActionButtonId[];
        let actionButtons: ActionButtonId[] = Array.isArray(parsed.actionButtons)
          ? parsed.actionButtons.filter((a: any) => validActionKeys.includes(a))
          : DEFAULT_BETA_CONFIG.actionButtons;

        // Strict limit: maximum 4 action buttons
        if (actionButtons.length > 4) {
          actionButtons = actionButtons.slice(0, 4);
        }
        if (actionButtons.length === 0) {
          actionButtons = DEFAULT_BETA_CONFIG.actionButtons;
        }

        return { widgetOrder, visibleWidgets, actionButtons };
      }
    } catch (e) {
      console.warn("Error reading Beta home configuration:", e);
    }
    return DEFAULT_BETA_CONFIG;
  });

  const [internalEditing, setInternalEditing] = useState(false);
  const isEditing = propIsEditing !== undefined ? propIsEditing : internalEditing;
  const setIsEditing = useCallback((val: boolean) => {
    if (propSetIsEditing) {
      propSetIsEditing(val);
    }
    setInternalEditing(val);
  }, [propSetIsEditing]);

  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [replacingActionIndex, setReplacingActionIndex] = useState<number | null>(null);

  // Touch tracking for long press anywhere on Home
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const didTriggerLongPressRef = useRef(false);

  // Global listener for opening Edit Mode from anywhere on Home
  useEffect(() => {
    const handleOpenEdit = () => {
      setIsEditing(true);
    };
    window.addEventListener('cga_open_home_edit_mode', handleOpenEdit);
    return () => {
      window.removeEventListener('cga_open_home_edit_mode', handleOpenEdit);
    };
  }, [setIsEditing]);

  // Save to localStorage
  const saveConfig = (newConfig: BetaHomeConfig) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } catch (e) {
      console.warn("Could not save Beta home configuration:", e);
    }
  };

  const handleDone = () => {
    saveConfig(config);
    setIsEditing(false);
    toast.success("Home layout saved");
  };

  const handleReset = () => {
    setConfig(DEFAULT_BETA_CONFIG);
    saveConfig(DEFAULT_BETA_CONFIG);
    toast.success("Home layout restored to default");
  };

  // Long-press detection on the Home hero container
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (isEditing) return;
    touchStartPos.current = { x: clientX, y: clientY };
    didTriggerLongPressRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      didTriggerLongPressRef.current = true;
      setIsEditing(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 40]);
        } catch (_) {}
      }
    }, 600);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!touchStartPos.current || !longPressTimerRef.current) return;
    const dx = Math.abs(clientX - touchStartPos.current.x);
    const dy = Math.abs(clientY - touchStartPos.current.y);
    if (dx > 8 || dy > 8) {
      // User is scrolling or swiping: cancel long-press immediately
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPos.current = null;
    if (didTriggerLongPressRef.current) {
      setTimeout(() => {
        didTriggerLongPressRef.current = false;
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Widget management
  const moveWidget = (currentIndex: number, direction: -1 | 1) => {
    const visibleIds = config.widgetOrder.filter(id => config.visibleWidgets.includes(id));
    const currentId = visibleIds[currentIndex];
    const targetId = visibleIds[currentIndex + direction];
    if (!currentId || !targetId) return;

    const newOrder = [...config.widgetOrder];
    const rawCurrentIdx = newOrder.indexOf(currentId);
    const rawTargetIdx = newOrder.indexOf(targetId);
    if (rawCurrentIdx === -1 || rawTargetIdx === -1) return;

    newOrder[rawCurrentIdx] = targetId;
    newOrder[rawTargetIdx] = currentId;

    const updated = { ...config, widgetOrder: newOrder };
    setConfig(updated);
    saveConfig(updated);
  };

  const removeWidget = (widgetId: HomeWidgetId) => {
    const newVisible = config.visibleWidgets.filter(w => w !== widgetId);
    const updated = { ...config, visibleWidgets: newVisible };
    setConfig(updated);
    saveConfig(updated);
    toast.info(`Removed ${getWidgetTitle(widgetId)}`);
  };

  const addWidget = (widgetId: HomeWidgetId) => {
    if (config.visibleWidgets.includes(widgetId)) return;
    const newVisible = [...config.visibleWidgets, widgetId];
    const updated = { ...config, visibleWidgets: newVisible };
    setConfig(updated);
    saveConfig(updated);
    toast.success(`Restored ${getWidgetTitle(widgetId)}`);
  };

  const handleReorderWidgets = (newVisibleOrder: HomeWidgetId[]) => {
    // Preserve hidden items in their relative positions while adopting the new visible order
    const hidden = config.widgetOrder.filter(w => !config.visibleWidgets.includes(w));
    const merged = [...newVisibleOrder, ...hidden];
    const updated = { ...config, widgetOrder: merged };
    setConfig(updated);
    saveConfig(updated);
  };

  // Action Buttons Management
  const removeActionButton = (actionId: ActionButtonId) => {
    if (config.actionButtons.length <= 1) {
      toast.error("Keep at least 1 action shortcut");
      return;
    }
    const newButtons = config.actionButtons.filter(id => id !== actionId);
    const updated = { ...config, actionButtons: newButtons };
    setConfig(updated);
    saveConfig(updated);
  };

  const moveActionButton = (index: number, direction: -1 | 1) => {
    const newButtons = [...config.actionButtons];
    const target = index + direction;
    if (target < 0 || target >= newButtons.length) return;
    const temp = newButtons[index];
    newButtons[index] = newButtons[target];
    newButtons[target] = temp;
    const updated = { ...config, actionButtons: newButtons };
    setConfig(updated);
    saveConfig(updated);
  };

  const selectAvailableAction = (actionId: ActionButtonId) => {
    if (replacingActionIndex !== null) {
      // Replace existing button
      const newButtons = [...config.actionButtons];
      newButtons[replacingActionIndex] = actionId;
      const updated = { ...config, actionButtons: newButtons };
      setConfig(updated);
      saveConfig(updated);
      setReplacingActionIndex(null);
      setShowAddActionModal(false);
      toast.success(`Replaced with ${ALL_ACTIONS[actionId].label}`);
    } else {
      // Add new button (maximum 4)
      if (config.actionButtons.length >= 4) {
        toast.error("Maximum 4 action buttons allowed. Remove one first.");
        return;
      }
      const newButtons = [...config.actionButtons, actionId];
      const updated = { ...config, actionButtons: newButtons };
      setConfig(updated);
      saveConfig(updated);
      setShowAddActionModal(false);
      toast.success(`Added ${ALL_ACTIONS[actionId].label}`);
    }
  };

  const getWidgetTitle = (id: HomeWidgetId) => {
    switch (id) {
      case 'balance':
        return 'Balance & Assets';
      case 'ai_bot':
        return 'AI Bot Engine';
      case 'actions':
        return 'Action Shortcuts';
    }
  };

  // Filter available actions that are not currently displayed
  const availableActions = (Object.keys(ALL_ACTIONS) as ActionButtonId[]).filter(
    id => !config.actionButtons.includes(id)
  );

  // Removed widgets that can be added back
  const removedWidgets: HomeWidgetId[] = (['balance', 'ai_bot', 'actions'] as HomeWidgetId[]).filter(
    id => !config.visibleWidgets.includes(id)
  );

  // Render individual widget content by ID
  const renderWidgetContent = (widgetId: HomeWidgetId) => {
    switch (widgetId) {
      case 'balance':
        return (
          <div className="w-full">
            {renderBalanceBoard()}
          </div>
        );
      case 'ai_bot':
        return (
          <div className="w-full">
            <ROIEngineStats 
              investments={investments}
              profile={profile}
              user={user}
              variant="home"
            />
          </div>
        );
      case 'actions':
        return (
          <div className="w-full">
            {/* 
              FOUR BUTTONS MUST ALWAYS BE ONE ROW
              Using flex with flex-1 min-w-0 guarantees they stay on a single horizontal line 
              across all phone viewports, scaling intelligently with clean proportions.
            */}
            <div className="flex w-full items-stretch justify-between gap-1.5 xs:gap-2 sm:gap-3 max-w-xl mx-auto">
              {config.actionButtons.map((actionId, index) => {
                const actionDef = ALL_ACTIONS[actionId];
                if (!actionDef) return null;
                const IconComponent = actionDef.icon;
                const isFund = actionId === 'fund';

                return (
                  <div key={actionId} className="flex-1 min-w-0 relative group">
                    {/* Normal Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        if (isEditing || didTriggerLongPressRef.current) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        actionDef.getAction(navigate, openTransferModal)();
                      }}
                      className={cn(
                        "w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-3 sm:py-3.5 px-1 sm:px-2 rounded-2xl transition-all duration-200 active:scale-95 shadow-sm text-center select-none",
                        isEditing ? "cursor-default" : "cursor-pointer",
                        isFund
                          ? "text-white bg-[#009e42] hover:bg-[#02d147] border border-[#009e42]/20 shadow-[0_4px_15px_rgba(0,158,66,0.25)] hover:shadow-[0_4px_22px_rgba(0,158,66,0.35)]"
                          : isLight
                            ? "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                            : "text-zinc-300 bg-zinc-900/80 border border-white/10 hover:border-white/20 hover:text-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                      )}
                    >
                      <IconComponent 
                        size={15} 
                        className={cn(
                          isFund ? "text-white" : actionDef.colorClass(isLight)
                        )} 
                      />
                      <span className="text-[8.5px] xs:text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider sm:tracking-widest truncate max-w-full text-center leading-tight font-sans">
                        {actionDef.label}
                      </span>
                    </button>

                    {/* Edit Mode Controls on each Action Button */}
                    {isEditing && (
                      <div className="absolute -top-2 -right-1 flex items-center gap-0.5 z-30 pointer-events-auto">
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeActionButton(actionId);
                          }}
                          className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/30 transition-transform active:scale-90 cursor-pointer"
                          title="Remove action"
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                      </div>
                    )}

                    {/* Edit Mode Reorder / Replace bottom bar */}
                    {isEditing && (
                      <div className="flex items-center justify-center gap-1 mt-1.5 pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveActionButton(index, -1);
                          }}
                          disabled={index === 0}
                          className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer transition-colors"
                          title="Shift Left"
                        >
                          <ChevronLeft size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplacingActionIndex(index);
                            setShowAddActionModal(true);
                          }}
                          className="p-1 rounded-md bg-[#009e42]/15 hover:bg-[#009e42]/30 text-[#009e42] cursor-pointer transition-colors"
                          title="Replace Action"
                        >
                          <RefreshCw size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveActionButton(index, 1);
                          }}
                          disabled={index === config.actionButtons.length - 1}
                          className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer transition-colors"
                          title="Shift Right"
                        >
                          <ChevronRight size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Action Slot if less than 4 */}
              {isEditing && config.actionButtons.length < 4 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReplacingActionIndex(null);
                    setShowAddActionModal(true);
                  }}
                  className={cn(
                    "flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-2xl border-2 border-dashed border-[#009e42]/50 hover:border-[#009e42] bg-[#009e42]/5 hover:bg-[#009e42]/10 text-[#009e42] transition-all cursor-pointer pointer-events-auto",
                  )}
                  title="Add Action Button"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span className="text-[8px] xs:text-[9px] font-black uppercase tracking-wider text-center leading-none">
                    Add
                  </span>
                </button>
              )}
            </div>

            {/* In Edit mode: Helper & quick Add button if less than 4 */}
            {isEditing && (
              <div className="flex items-center justify-between mt-2 px-1 text-[9px] pointer-events-auto">
                <span className="text-zinc-500 font-medium">
                  {config.actionButtons.length} of 4 buttons active
                </span>
                {config.actionButtons.length < 4 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplacingActionIndex(null);
                      setShowAddActionModal(true);
                    }}
                    className="flex items-center gap-1 text-[#009e42] font-black uppercase tracking-wider hover:underline cursor-pointer"
                  >
                    <Plus size={11} /> Add Action
                  </button>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  // Only render widgets that are marked visible
  const visibleWidgetOrder = config.widgetOrder.filter(id => config.visibleWidgets.includes(id));

  return (
    <div 
      className="w-full flex flex-col items-center select-none"
      onTouchStartCapture={(e) => {
        if (e.touches.length === 1) {
          handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
        } else {
          handlePointerUp();
        }
      }}
      onTouchMoveCapture={(e) => {
        if (e.touches.length === 1) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        } else {
          handlePointerUp();
        }
      }}
      onTouchEndCapture={handlePointerUp}
      onTouchCancelCapture={handlePointerUp}
      onMouseDownCapture={(e) => {
        if (e.button === 0) {
          handlePointerDown(e.clientX, e.clientY);
        }
      }}
      onMouseMoveCapture={(e) => {
        handlePointerMove(e.clientX, e.clientY);
      }}
      onMouseUpCapture={handlePointerUp}
      onClickCapture={(e) => {
        if (didTriggerLongPressRef.current) {
          e.preventDefault();
          e.stopPropagation();
          didTriggerLongPressRef.current = false;
        }
      }}
    >
      {/* Subtle Edit Mode Top Header Bar */}
      <AnimatePresence>
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xl mx-auto px-1 mb-4 sticky top-14 z-40"
          >
            <div className={cn(
              "flex items-center justify-between px-3.5 py-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all",
              isLight
                ? "bg-white/95 border-[#009e42]/30 shadow-[#009e42]/10"
                : "bg-[#0B0D13]/95 border-[#009e42]/30 shadow-[#009e42]/15"
            )}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#009e42] animate-ping" />
              </div>

              <div className="flex items-center gap-2">
                {/* Reset Control */}
                <button
                  type="button"
                  onClick={handleReset}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer",
                    isLight 
                      ? "text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200" 
                      : "text-zinc-400 bg-white/5 hover:bg-white/10 border border-white/10 hover:text-white"
                  )}
                  title="Reset to default Home configuration"
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>

                {/* Done / Check Control */}
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-[#009e42] hover:bg-[#02d147] active:bg-[#008236] shadow-md shadow-[#009e42]/25 transition-all cursor-pointer"
                  title="Save Home arrangement"
                >
                  <Check size={13} strokeWidth={3} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Main Hero Widgets Container */}
      <div className="w-full max-w-xl mx-auto px-1">
        {isEditing ? (
          <Reorder.Group
            axis="y"
            values={visibleWidgetOrder}
            onReorder={handleReorderWidgets}
            className="space-y-4 w-full"
          >
            {visibleWidgetOrder.map((widgetId, index) => (
              <ReorderableWidgetItem
                key={widgetId}
                widgetId={widgetId}
                index={index}
                totalItems={visibleWidgetOrder.length}
                title={getWidgetTitle(widgetId)}
                isLight={isLight}
                onMove={moveWidget}
                onRemove={removeWidget}
              >
                {renderWidgetContent(widgetId)}
              </ReorderableWidgetItem>
            ))}
          </Reorder.Group>
        ) : (
          /* Normal Functional State: Zero outlines, normal interaction */
          <div className="space-y-6 w-full">
            {visibleWidgetOrder.map(widgetId => (
              <div key={widgetId} className="w-full">
                {renderWidgetContent(widgetId)}
              </div>
            ))}
          </div>
        )}

        {/* Restore Removed Widgets Section inside Edit Mode */}
        {isEditing && removedWidgets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-2xl border border-white/10 bg-white/[0.02]"
          >
            <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-2.5">
              Available / Removed Widgets
            </h4>
            <div className="flex flex-wrap gap-2">
              {removedWidgets.map(widgetId => (
                <button
                  key={widgetId}
                  type="button"
                  onClick={() => addWidget(widgetId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wide uppercase bg-[#009e42]/10 hover:bg-[#009e42]/20 border border-[#009e42]/30 text-[#009e42] transition-all cursor-pointer"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  <span>Add {getWidgetTitle(widgetId)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal / Selector for Adding or Replacing an Action Button */}
      <AnimatePresence>
        {showAddActionModal && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => {
                setShowAddActionModal(false);
                setReplacingActionIndex(null);
              }}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={cn(
                "relative w-full max-w-sm rounded-3xl p-5 border shadow-2xl overflow-hidden z-10",
                isLight ? "bg-white border-slate-200" : "bg-[#0B0D13] border-white/10"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={cn("text-sm font-black tracking-wide uppercase", isLight ? "text-slate-900" : "text-white")}>
                    {replacingActionIndex !== null ? 'Replace Action' : 'Add Action Shortcut'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {replacingActionIndex !== null
                      ? `Select replacement for "${ALL_ACTIONS[config.actionButtons[replacingActionIndex]]?.label}"`
                      : 'Choose an action to add (max 4)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddActionModal(false);
                    setReplacingActionIndex(null);
                  }}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* List of Available Actions */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {availableActions.map(actionId => {
                  const actionDef = ALL_ACTIONS[actionId];
                  const IconComp = actionDef.icon;
                  return (
                    <button
                      key={actionId}
                      type="button"
                      onClick={() => selectAvailableAction(actionId)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer",
                        isLight
                          ? "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-[#009e42]/50"
                          : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-[#009e42]/50"
                      )}
                    >
                      <div className={cn("p-2 rounded-xl bg-white/5 shrink-0", actionDef.colorClass(isLight))}>
                        <IconComp size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={cn("text-xs font-black uppercase tracking-wider truncate", isLight ? "text-slate-800" : "text-white")}>
                          {actionDef.label}
                        </div>
                        <div className="text-[9px] text-zinc-400 truncate">
                          {actionDef.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {availableActions.length === 0 && (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  All available actions are already on your home screen!
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
