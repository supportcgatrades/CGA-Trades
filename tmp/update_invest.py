import re

with open('src/components/Invest.tsx', 'r') as f:
    content = f.read()

# Locate the payment options block
start_pattern = r'                 <div className="flex flex-col gap-4">[\s\S]+?\}\)\(\)\}\s+<\/div>'

replacement = """                 <div className="flex flex-col gap-6">
                   {/* 3 Columns Horizontally "Crypto, Wallet, Card" */}
                   <div className="grid grid-cols-3 gap-3">
                     {/* Crypto button */}
                     <button
                       type="button"
                       onClick={() => setPaymentMethod('crypto')}
                       className={cn(
                         "p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer",
                         paymentMethod === 'crypto'
                           ? "bg-[#a4d100]/10 border-[#a4d100]/40 shadow-lg text-white"
                           : "bg-white/5 border-white/5 hover:border-white/10 text-aura-muted hover:text-white"
                       )}
                     >
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                         paymentMethod === 'crypto' ? "bg-[#a4d100]/20 text-[#a4d100]" : "bg-white/5 text-aura-muted"
                       )}>
                         <RealisticBitcoinIcon />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-wider">Crypto</span>
                     </button>

                     {/* Wallet button */}
                     <button
                       type="button"
                       onClick={() => setPaymentMethod('wallet')}
                       className={cn(
                         "p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer",
                         paymentMethod === 'wallet'
                           ? "bg-[#a4d100]/10 border-[#a4d100]/40 shadow-lg text-white"
                           : "bg-white/5 border-white/5 hover:border-white/10 text-aura-muted hover:text-white"
                       )}
                     >
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                         paymentMethod === 'wallet' ? "bg-[#a4d100]/20 text-[#a4d100]" : "bg-white/5 text-aura-muted"
                       )}>
                         <RealisticWalletIcon />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-wider">Wallet</span>
                     </button>

                     {/* Card button */}
                     <button
                       type="button"
                       onClick={() => {
                         setPaymentMethod('card');
                         setShowCardUnavailable(true);
                       }}
                       className={cn(
                         "p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer",
                         paymentMethod === 'card'
                           ? "bg-[#a4d100]/10 border-[#a4d100]/40 shadow-lg text-white"
                           : "bg-white/5 border-white/5 hover:border-white/10 text-aura-muted hover:text-white"
                       )}
                     >
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                         paymentMethod === 'card' ? "bg-[#a4d100]/20 text-[#a4d100]" : "bg-white/5 text-aura-muted"
                       )}>
                         <RealisticCardIcon />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-wider">Card</span>
                     </button>
                   </div>

                   {/* Active payment method content area */}
                   <AnimatePresence mode="wait">
                     {paymentMethod === 'crypto' && (
                       <motion.div 
                         key="crypto-payment"
                         initial={{ opacity: 0, y: 10 }} 
                         animate={{ opacity: 1, y: 0 }} 
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ duration: 0.15 }}
                         className="space-y-5 pt-2"
                       >
                         <div className="flex gap-2">
                           {(['usdt', 'erc20', 'btc'] as const).map(t => (
                             <button 
                               type="button"
                               key={t} 
                               onClick={() => setCryptoType(t)}
                               className={cn(
                                 "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer",
                                 cryptoType === t ? "bg-[#a4d100] border-[#a4d100] text-black" : "bg-white/5 border-white/5 text-aura-muted hover:bg-white/10"
                               )}
                             >
                               {t.toUpperCase()}
                             </button>
                           ))}
                         </div>
                         <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col items-center gap-6">
                           <div className="p-4 bg-white rounded-2xl shadow-xl">
                             <QRCodeCanvas value={CRYPTO_ADDRESSES[cryptoType]} size={140} />
                           </div>
                           <div className="w-full space-y-2">
                             <p className="text-[10px] font-black uppercase text-center text-aura-muted tracking-widest">Target Address</p>
                             <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-inner">
                               <code className="text-[10px] font-mono text-white truncate">{CRYPTO_ADDRESSES[cryptoType]}</code>
                               <button 
                                 type="button"
                                 onClick={() => handleCopy(CRYPTO_ADDRESSES[cryptoType], 'wallet')} 
                                 className="text-[9px] font-black text-black bg-[#a4d100] px-3 py-1.5 rounded-lg uppercase tracking-widest cursor-pointer"
                               >
                                 {copiedField === 'wallet' ? 'Copied' : 'Copy'}
                               </button>
                             </div>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-aura-muted ml-1">Transaction ID</label>
                           <input 
                             type="text"
                             value={transactionId}
                             onChange={(e) => setTransactionId(e.target.value)}
                             placeholder="Transaction ID"
                             className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-xs font-mono focus:bg-white/10 focus:border-[#a4d100]/50 outline-none transition-all text-white"
                           />
                         </div>
                       </motion.div>
                     )}

                     {paymentMethod === 'wallet' && (
                       <motion.div 
                         key="wallet-payment"
                         initial={{ opacity: 0, y: 10 }} 
                         animate={{ opacity: 1, y: 0 }} 
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ duration: 0.15 }}
                         className="space-y-4 pt-2"
                       >
                         <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 flex-wrap gap-1">
                           {(['funding_balance', 'available_balance', 'referral_earnings', 'reward_dollar_balance'] as const).map(w => (
                             <button 
                               type="button"
                               key={w}
                               onClick={() => setSelectedWallet(w)}
                               className={cn(
                                 "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer",
                                 selectedWallet === w ? "bg-[#a4d100] text-black font-extrabold shadow-sm" : "text-aura-muted hover:text-white"
                               )}
                             >
                               {w === 'reward_dollar_balance' ? 'Reward' : w.split('_')[0]}
                             </button>
                           ))}
                         </div>

                         <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                           <div>
                             <p className="text-[8px] font-black text-aura-muted uppercase tracking-widest mb-1">New Allocation</p>
                             <p className="text-sm font-black text-white italic font-serif">{formatCurrency(confirmedAmount)}</p>
                           </div>
                           <button 
                             type="button"
                             onClick={() => {
                               const balance = walletBalanceToShow;
                               const cleanBalance = parseFloat(balance.toFixed(2));
                               
                               const appropriatePlan = (plans || []).filter((p: any) => p.active_status !== false).find((p: any) => cleanBalance >= p.min && cleanBalance <= p.max);
                               
                               if (appropriatePlan) {
                                 if (appropriatePlan.id !== selectedPlan?.id) {
                                   setSelectedPlan(appropriatePlan);
                                   toast.success(`Plan updated to ${appropriatePlan.name} for ${formatCurrency(cleanBalance)} allocation.`);
                                 }
                                 setConfirmedAmount(cleanBalance);
                               } else {
                                 setConfirmedAmount(cleanBalance);
                                 const activePlans = (plans || []).filter((p: any) => p.active_status !== false);
                                 if (activePlans.length > 0) {
                                   if (cleanBalance < activePlans[0].min) {
                                     toast.error(`Minimum investment is ${formatCurrency(activePlans[0].min)}`);
                                   } else if (cleanBalance > activePlans[activePlans.length - 1].max) {
                                     toast.error(`Maximum investment is ${formatCurrency(activePlans[activePlans.length - 1].max)}`);
                                   }
                                 }
                               }
                             }}
                             className="px-4 py-2 bg-[#a4d100]/10 hover:bg-[#a4d100]/20 text-[#a4d100] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-[#a4d100]/20 cursor-pointer"
                           >
                             USE MAX BALANCE
                           </button>
                         </div>

                         {confirmedAmount > walletBalanceToShow && (
                           <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center animate-pulse">Insufficient operational capital.</p>
                         )}
                         
                         {selectedPlan && (confirmedAmount < selectedPlan.min || confirmedAmount > selectedPlan.max) && (
                           <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                               Allocation outside {selectedPlan.name} limits ({formatCurrency(selectedPlan.min)} - {formatCurrency(selectedPlan.max)})
                             </p>
                             <div className="mt-3 grid grid-cols-1 gap-2">
                               {(plans || []).filter((p: any) => p.active_status !== false).map((p: any) => (
                                 confirmedAmount >= p.min && confirmedAmount <= p.max && (
                                   <button 
                                     type="button"
                                     key={p.id}
                                     onClick={() => setSelectedPlan(p)}
                                     className="w-full py-2 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer"
                                   >
                                     Switch to {p.name} Plan
                                   </button>
                                 )
                               ))}
                             </div>
                           </div>
                         )}
                       </motion.div>
                     )}

                     {paymentMethod === 'card' && (
                       <motion.div 
                         key="card-payment"
                         initial={{ opacity: 0, y: 10 }} 
                         animate={{ opacity: 1, y: 0 }} 
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ duration: 0.15 }}
                         className="p-6 bg-white/5 border border-white/5 rounded-3xl text-center space-y-4"
                       >
                         <div className="mx-auto w-12 h-12 rounded-full bg-[#a4d100]/10 border border-[#a4d100]/20 flex items-center justify-center text-[#a4d100]">
                           <CreditCard size={24} />
                         </div>
                         <div className="space-y-1">
                           <h3 className="text-lg font-black text-white uppercase tracking-wider">Card Payment</h3>
                           <p className="text-[10px] font-bold text-aura-muted uppercase tracking-widest leading-relaxed">
                             Instant settlement via card integration is currently coming soon.
                           </p>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>"""

new_content, count = re.subn(start_pattern, replacement, content)
if count == 0:
    print("Error: Could not locate the target block with regular expression.")
    # Fallback to a broader search or inspect
    sys.exit(1)

with open('src/components/Invest.tsx', 'w') as f:
    f.write(new_content)

print(f"Successfully replaced payment method block. Matches: {count}")
