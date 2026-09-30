import React, { useState } from 'react';
import { 
  History, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sparkles, 
  TrendingUp, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { RetirementTransaction } from '../../services/retirementService';
import { toast } from 'sonner';

interface RetirementTransactionsProps {
  transactions: RetirementTransaction[];
}

export default function RetirementTransactions({ transactions }: RetirementTransactionsProps) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = transactions.filter((tx) => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || tx.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Transaction ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'contribution':
        return <ArrowDownLeft size={16} className="text-emerald-400" />;
      case 'investment':
        return <TrendingUp size={16} className="text-blue-400" />;
      case 'bonus':
        return <Sparkles size={16} className="text-lime-400" />;
      case 'withdrawal':
        return <ArrowUpRight size={16} className="text-amber-400" />;
      default:
        return <History size={16} className="text-purple-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 size={10} /> Completed
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock size={10} /> Pending Review
          </span>
        );
      case 'Failed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle size={10} /> Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Retirement Transaction Ledger</h2>
        <p className="text-xs text-muted-foreground">
          Traceable, immutable records of all retirement contributions, allocations, distributions, and 20% CGA annual bonuses.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID or description..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'contribution', label: 'Contributions' },
            { id: 'investment', label: 'Allocations' },
            { id: 'bonus', label: 'CGA Bonuses' },
            { id: 'withdrawal', label: 'Distributions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter === tab.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table / Cards */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#0b1021]/80 border-white/10' : 'bg-white border-slate-200'
      }`}>
        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <History size={28} className="mx-auto text-muted-foreground opacity-50" />
            <h4 className="text-xs font-bold text-foreground">No retirement transactions found</h4>
            <p className="text-[11px] text-muted-foreground">Transactions will appear as contributions, investments, or bonuses are recorded.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((tx) => {
              const formattedDate = new Date(tx.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={tx.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Left Column: Icon + Description + ID */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground capitalize">
                          {tx.type === 'bonus' ? '20% CGA Annual Bonus' : tx.type.replace('_', ' ')}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tx.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(tx.id)}
                          className="font-mono hover:text-emerald-400 flex items-center gap-1"
                        >
                          <span>{tx.id}</span>
                          {copiedId === tx.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amount & Balances */}
                  <div className="sm:text-right pl-12 sm:pl-0">
                    <div className={`text-sm font-bold ${
                      tx.type === 'bonus' || tx.type === 'contribution' ? 'text-emerald-400' : 'text-foreground'
                    }`}>
                      {tx.type === 'bonus' || tx.type === 'contribution' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Bal: ${tx.previous_balance.toLocaleString()} → ${tx.new_balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
