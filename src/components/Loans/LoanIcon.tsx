import React from 'react';
import {
  User,
  Briefcase,
  Car,
  Home,
  Building2,
  Layers,
  CreditCard,
  GraduationCap,
  GitMerge,
  AlertCircle,
  HeartPulse,
  Hammer,
  Cpu,
  Landmark,
  Tractor,
  Coins,
  Rocket,
  RefreshCw,
  ShieldCheck,
  Unlock,
  LucideIcon
} from 'lucide-react';

interface LoanIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<string, LucideIcon> = {
  User,
  Briefcase,
  Car,
  Home,
  Building2,
  Layers,
  CreditCard,
  GraduationCap,
  Merge: GitMerge,
  GitMerge,
  AlertCircle,
  HeartPulse,
  Hammer,
  Cpu,
  Landmark,
  Tractor,
  Coins,
  Rocket,
  RefreshCw,
  ShieldCheck,
  Unlock
};

export default function LoanIcon({ iconName, className = "text-white", size = 20 }: LoanIconProps) {
  const IconComponent = ICON_MAP[iconName] || Landmark;
  return <IconComponent size={size} className={className} />;
}
