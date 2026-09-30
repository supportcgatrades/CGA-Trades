import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { COUNTRIES, Country } from '../constants/countries';
import Footer from './Footer';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

export default function CountrySelection() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  // Extract referral code if present in the URL
  const queryParams = new URLSearchParams(location.search);
  const refCode = queryParams.get('ref');

  // Filter countries dynamically
  const filteredCountries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleSelectCountry = (country: Country) => {
    const signupContext = {
      countryName: country.name,
      countryCode: country.code,
      countryFlag: country.flag,
      name: country.name,
      code: country.code,
      flag: country.flag
    };

    try {
      localStorage.setItem('cga_signup_country', JSON.stringify(signupContext));
      sessionStorage.setItem('cga_signup_country', JSON.stringify(signupContext));
    } catch (e) {
      console.warn("Storage quota / error saving selected country:", e);
    }

    // Immediately navigate to the existing CGA signup form, preserving referral code if present
    if (refCode) {
      navigate(`/signup?ref=${encodeURIComponent(refCode)}`);
    } else {
      navigate('/signup');
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col justify-between transition-colors duration-300",
        isDark ? "bg-[#050608] text-white" : "bg-slate-50 text-slate-900"
      )}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={cn(
            "absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[140px] opacity-30",
            isDark ? "bg-primary/20" : "bg-primary/10"
          )}
        />
        <div
          className={cn(
            "absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full blur-[160px] opacity-20",
            isDark ? "bg-secondary/15" : "bg-secondary/10"
          )}
        />
      </div>

      {/* Main Content Area - No Navigation Bar */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
        {/* Minimal CGA Branding */}
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="relative mb-5 group cursor-pointer" onClick={() => navigate('/welcome')}>
            <img
              src="https://i.imgur.com/nRbbYnS.png"
              alt="CGA Logo"
              className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,158,66,0.25)] transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-tight">
            Choose your country
          </h1>
        </div>

        {/* Search Field */}
        <div className="relative mb-6 sm:mb-8">
          <div className="relative flex items-center">
            <Search
              size={18}
              className={cn(
                "absolute left-4.5 pointer-events-none transition-colors",
                isDark ? "text-white/40" : "text-slate-400"
              )}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your country"
              autoFocus
              className={cn(
                "w-full h-14 pl-12 pr-11 rounded-2xl text-sm sm:text-base font-medium transition-all outline-none shadow-sm",
                isDark
                  ? "bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:border-primary/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-primary/10"
                  : "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary/70 focus:ring-4 focus:ring-primary/10"
              )}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className={cn(
                  "absolute right-4 p-1 rounded-full transition-colors",
                  isDark ? "text-white/40 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                )}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchTerm && (
            <div
              className={cn(
                "mt-2 text-[11px] font-semibold uppercase tracking-wider pl-2",
                isDark ? "text-aura-muted" : "text-slate-500"
              )}
            >
              Found {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'}
            </div>
          )}
        </div>

        {/* Complete Country List */}
        <div className="space-y-2">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelectCountry(country)}
                type="button"
                className={cn(
                  "w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left group select-none cursor-pointer",
                  isDark
                    ? "bg-white/[0.02] border-white/5 hover:border-primary/40 hover:bg-white/[0.06] active:bg-white/[0.08]"
                    : "bg-white border-slate-200 hover:border-primary/50 hover:bg-slate-50 active:bg-slate-100 shadow-sm"
                )}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <span
                    className="text-2xl sm:text-3xl leading-none shrink-0 select-none w-9 text-center"
                    role="img"
                    aria-label={`${country.name} flag`}
                  >
                    {country.flag}
                  </span>
                  <div className="truncate">
                    <span
                      className={cn(
                        "text-sm sm:text-base font-bold tracking-tight block truncate group-hover:text-primary transition-colors",
                        isDark ? "text-white" : "text-slate-900"
                      )}
                    >
                      {country.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pl-3">
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                      isDark
                        ? "bg-white/5 border border-white/10 text-white/50"
                        : "bg-slate-100 border border-slate-200 text-slate-500"
                    )}
                  >
                    {country.code}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div
              className={cn(
                "py-16 text-center rounded-2xl border flex flex-col items-center justify-center gap-3",
                isDark ? "bg-white/[0.02] border-white/5 text-aura-muted" : "bg-white border-slate-200 text-slate-500"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">
                🌍
              </div>
              <div className="text-sm font-bold uppercase tracking-wider">No country found</div>
              <p className="text-xs max-w-xs text-center font-medium opacity-75">
                We couldn't find any country matching "{searchTerm}". Please check your spelling.
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-xs font-bold text-primary hover:underline uppercase tracking-wider"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Existing CGA Footer */}
      <Footer />
    </div>
  );
}
