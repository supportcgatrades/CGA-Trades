import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { LoanProductDefinition } from '../../services/loanService';
import LoanIcon from './LoanIcon';

interface LoanCardProps {
  key?: any;
  product: LoanProductDefinition;
  onViewLoan: (product: LoanProductDefinition) => void;
}

export default function LoanCard({ product, onViewLoan }: LoanCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative bg-[#0b0e14]/90 hover:bg-[#10141d] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-5 md:p-6 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-[0_10px_30px_rgba(16,185,129,0.08)] overflow-hidden"
    >
      {/* Subtle top ambient accent line on hover */}
      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/60 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-all duration-300">
            <LoanIcon iconName={product.iconName} size={20} className="text-emerald-400" />
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-400/80 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/15">
            from {product.baseInterestRate}% APR
          </span>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight mb-2 group-hover:text-emerald-300 transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-6 font-normal">
          {product.shortDescription}
        </p>
      </div>

      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-white/40 font-medium">
          Up to ${(product.maxAmount >= 1000000 ? `${product.maxAmount / 1000000}M` : `${product.maxAmount / 1000}k`)}
        </span>

        <button
          onClick={() => onViewLoan(product)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-black text-white text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95"
        >
          <span>View Loan</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.div>
  );
}
