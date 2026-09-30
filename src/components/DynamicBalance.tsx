import React from 'react';
import { cn } from '../lib/utils';

interface DynamicBalanceProps {
  value: string;
  className?: string;
  baseSizeMobile?: string; 
  baseSizeDesktop?: string;
  containerClassName?: string;
}

export const DynamicBalance: React.FC<DynamicBalanceProps> = ({ 
  value, 
  className, 
  baseSizeMobile, 
  baseSizeDesktop,
  containerClassName
}) => {
  const charCount = value.length;

  // We use a heuristic for scaling text based on its length
  // Mobile heuristic (defaults optimized for cards)
  const getMobileSize = () => {
    if (baseSizeMobile) return baseSizeMobile;
    if (charCount > 16) return "text-[clamp(0.6rem,3vw,0.8rem)]";
    if (charCount > 13) return "text-[clamp(0.8rem,4vw,1rem)]";
    if (charCount > 10) return "text-[clamp(1rem,5vw,1.1rem)]";
    return "text-lg";
  };

  // Desktop heuristic (defaults optimized for cards)
  const getDesktopSize = () => {
    if (baseSizeDesktop) return baseSizeDesktop;
    if (charCount > 20) return "lg:text-sm";
    if (charCount > 18) return "lg:text-base";
    if (charCount > 16) return "lg:text-lg";
    if (charCount > 14) return "lg:text-xl";
    if (charCount > 12) return "lg:text-2xl";
    if (charCount > 10) return "lg:text-3xl";
    return "lg:text-4xl";
  };

  return (
    <div className={cn("w-full h-full flex items-center justify-center overflow-hidden min-h-[1.5em]", containerClassName)}>
        <p className={cn(
            "font-black tracking-tighter italic font-serif leading-none whitespace-nowrap transition-all duration-300 px-1",
            getMobileSize(),
            getDesktopSize(),
            className
        )}>
            {value}
        </p>
    </div>
  );
};
