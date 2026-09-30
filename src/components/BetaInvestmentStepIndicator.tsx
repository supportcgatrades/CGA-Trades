import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

export type StepState = 'completed' | 'active' | 'pending';

export interface BetaInvestmentStepIndicatorProps {
  currentView: 'summary' | 'method_select' | 'payment' | 'processing';
  isConfirmed?: boolean;
  isPaymentSuccessful?: boolean;
  className?: string;
}

const STEPS = [
  { id: 1, title: 'Confirm Investment' },
  { id: 2, title: 'Proceed to Payment' },
  { id: 3, title: 'Choose Payment Method' },
  { id: 4, title: 'Payment Successful' },
] as const;

export default function BetaInvestmentStepIndicator({
  currentView,
  isConfirmed = false,
  isPaymentSuccessful = false,
  className
}: BetaInvestmentStepIndicatorProps) {
  // Determine status of each of the 4 steps
  const getStepStatus = (stepId: 1 | 2 | 3 | 4): StepState => {
    if (isPaymentSuccessful) {
      return 'completed';
    }

    if (currentView === 'processing') {
      if (stepId <= 3) return 'completed';
      return 'active'; // step 4 is actively verifying/processing
    }

    if (currentView === 'method_select' || currentView === 'payment') {
      if (stepId <= 2) return 'completed';
      if (stepId === 3) return 'active';
      return 'pending';
    }

    // currentView === 'summary'
    if (isConfirmed) {
      if (stepId === 1) return 'completed';
      if (stepId === 2) return 'active';
      return 'pending';
    }

    // Before confirmation:
    if (stepId === 1) return 'active';
    return 'pending';
  };

  // Calculate progress bar percentage between step 1 (0%) and step 4 (100%)
  const getProgressPercentage = () => {
    if (isPaymentSuccessful) return 100;
    if (currentView === 'processing') return 100;
    if (currentView === 'method_select' || currentView === 'payment') return 66.6;
    if (isConfirmed) return 33.3;
    return 0;
  };

  return (
    <div 
      id="cga-beta-investment-step-indicator"
      className={cn(
        "w-full mb-6 p-3 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#11141b]/90 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all select-none",
        className
      )}
    >
      <div className="relative">
        {/* Connector Line Track */}
        <div className="absolute top-3.5 sm:top-4 left-[12.5%] right-[12.5%] h-[2px] bg-slate-200 dark:bg-white/10 -z-0">
          <div 
            className="h-full bg-[#009e42] transition-all duration-500 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* 4 Step Columns */}
        <div className="grid grid-cols-4 relative z-10 gap-1 sm:gap-2">
          {STEPS.map((step) => {
            const status = getStepStatus(step.id);
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            const isPending = status === 'pending';

            return (
              <div 
                key={step.id} 
                id={`beta-step-${step.id}`}
                className="flex flex-col items-center text-center group"
              >
                {/* Step Circle / Badge */}
                <div 
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 font-mono text-[10px] sm:text-xs shrink-0",
                    isCompleted && "bg-[#009e42] text-white border-2 border-[#009e42] shadow-[0_0_12px_rgba(0,158,66,0.35)] scale-100",
                    isActive && "bg-white dark:bg-[#11141b] text-[#009e42] border-2 border-[#009e42] ring-4 ring-[#009e42]/20 font-black shadow-[0_0_14px_rgba(0,158,66,0.25)] scale-105",
                    isPending && "bg-slate-100 dark:bg-[#161a23] text-slate-400 dark:text-aura-muted border border-slate-300 dark:border-white/10"
                  )}
                >
                  {isCompleted ? (
                    <Check size={13} strokeWidth={3} className="text-white" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-2 flex flex-col items-center">
                  <span 
                    className={cn(
                      "text-[8.5px] min-[380px]:text-[9.5px] sm:text-[11px] leading-[1.15] sm:leading-tight transition-colors duration-200 text-center select-none max-w-[72px] min-[380px]:max-w-[85px] sm:max-w-none mx-auto",
                      isCompleted && "text-slate-800 dark:text-white/95 font-bold",
                      isActive && "text-[#009e42] font-black drop-shadow-sm",
                      isPending && "text-slate-400 dark:text-aura-muted font-medium"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
