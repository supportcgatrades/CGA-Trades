/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import Invest from './components/Invest';
import Fund from './components/Fund';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Support from './components/Support';
import Guide from './components/Guide';
import Referrals from './components/Referrals';
import Rewards from './components/Rewards';
import CipherAdmin from './components/Admin/CipherAdmin';
import LandingPage from './components/LandingPage';
import Blog from './components/Blog';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import InvestmentTerms from './components/InvestmentTerms';
import TopInvestorsPage from './components/TopInvestorsPage';
import ReviewsPage from './components/ReviewsPage';
import NotificationsPage from './components/NotificationsPage';
import MarketTickers from './components/FooterPages/MarketTickers';
import StrategicNodes from './components/FooterPages/StrategicNodes';
import FAQ from './components/FAQ';
import About from './components/About';
import HowItWorks from './components/HowItWorks';
import Partners from './components/Partners';
import LiquidityPools from './components/FooterPages/LiquidityPools';
import NeuralAnalytics from './components/FooterPages/NeuralAnalytics';
import CookiePolicy from './components/FooterPages/CookiePolicy';
import AMLPolicy from './components/FooterPages/AMLPolicy';
import GlobalRegulatoryCorporateCompliance from './components/FooterPages/GlobalRegulatoryCorporateCompliance';
import TWNTokenPortal from './components/TWNTokenPortal';
import MiningPortal from './components/MiningPortal';
import DailyPointsHub from './components/DailyPointsHub';
import SpinAndWin from './components/SpinAndWin';
import SpinAndWinGuidelines from './components/SpinAndWinGuidelines';
import JoinUs from './components/JoinUs';
import AssetMultiplierPage from './components/AssetMultiplierPage';
import AIMarketplace from './components/AIMarketplace';
import Retirement from './components/Retirement/Retirement';
import Loans from './components/Loans/Loans';
import CountrySelection from './components/CountrySelection';
import StocksPage from './components/Markets/StocksPage';
import BondsPage from './components/Markets/BondsPage';
import MutualFundsPage from './components/Markets/MutualFundsPage';
import SecuritiesPortfolioPage from './components/Markets/SecuritiesPortfolioPage';
import SecuritiesOrdersPage from './components/Markets/SecuritiesOrdersPage';
import SecuritiesWatchlistPage from './components/Markets/SecuritiesWatchlistPage';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth, isCipherAdmin } from './contexts/AuthContext';
import { auth } from './lib/firebase';
import { LanguageProvider } from './contexts/LanguageContext';
import { UIProvider } from './contexts/UIContext';
import { UIConfigProvider } from './contexts/UIConfigContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ModeProvider } from './contexts/ModeContext';
import PremiumLoader from './components/PremiumLoader';

function ThemedToaster() {
  const { effectiveTheme } = useTheme();
  return <Toaster position="top-right" theme={effectiveTheme} closeButton richColors />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // If AuthContext is resolving or Firebase has an active authenticated session syncing into state
  if (loading || (auth.currentUser && !user)) {
    return <PremiumLoader />;
  }

  if (!user && !auth.currentUser) {
    return <Navigate to="/welcome" replace />;
  }

  if (profile?.suspended || profile?.banned) {
    // If user is banned/suspended, they are forced back to welcome
    // The LandingPage should probably show a notice if we want, or just generic rejection
    return <Navigate to="/welcome" state={{ error: 'Account access has been restricted by System Protocol.' }} replace />;
  }

  // Check if we just came from a successful login that reloaded the user
  const isVerifiedFromState = location.state?.verified === true;
  const isCipher = isCipherAdmin(user) || (auth.currentUser && isCipherAdmin(auth.currentUser)) || profile?.role === 'cipher';
  const isGoogleUser = Boolean(profile?.is_google_user || user?.providerData?.some(p => p.providerId === 'google.com'));
  const isVerified = user?.emailVerified || auth.currentUser?.emailVerified || profile?.email_verified || isGoogleUser || isVerifiedFromState || isCipher;

  if (!isVerified) {
     return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}

function CipherProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading || (auth.currentUser && !user)) {
    return <PremiumLoader />;
  }

  const isCipher = isCipherAdmin(user) || (auth.currentUser && isCipherAdmin(auth.currentUser)) || profile?.role === 'cipher';

  if ((!user && !auth.currentUser) || !isCipher) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <LanguageProvider>
          <AuthProvider>
            <UIConfigProvider>
              <UIProvider>
                <ModeProvider>
                  <ThemedToaster />
                  <Routes>
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/country-selection" element={<LandingPage />} />
              <Route path="/select-country" element={<LandingPage />} />
              <Route path="/cga-traits" element={<LandingPage />} />
              <Route path="/traits" element={<LandingPage />} />
              <Route path="/signup" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/help" element={<Support />} />
              <Route path="/join-us" element={<JoinUs />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/top-investors" element={<TopInvestorsPage />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/investment-terms" element={<InvestmentTerms />} />
              <Route path="/regulatory-compliance" element={<GlobalRegulatoryCorporateCompliance />} />
              <Route path="/cipher" element={
                <CipherProtectedRoute>
                  <CipherAdmin />
                </CipherProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/home" element={<Homepage />} />
                <Route path="/retirement" element={<Retirement />} />
                <Route path="/retirement/:tab" element={<Retirement />} />
                <Route path="/loans" element={<Loans />} />
                <Route path="/loans/:type" element={<Loans />} />
                <Route path="/multiplier-upgrade" element={<AssetMultiplierPage />} />
                <Route path="/guide" element={<Guide />} />
                <Route path="/token" element={<TWNTokenPortal />} />
                <Route path="/mining" element={<MiningPortal />} />
                <Route path="/ai-marketplace" element={<AIMarketplace />} />
                <Route path="/daily-points" element={<DailyPointsHub />} />
                <Route path="/spin" element={<SpinAndWin />} />
                <Route path="/spin-guidelines" element={<SpinAndWinGuidelines />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/invest" element={<Invest />} />
                <Route path="/fund" element={<Fund />} />
                <Route path="/fund/:tab" element={<Fund />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/:tab" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/help" element={<Support />} />
                <Route path="/join-us" element={<JoinUs />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/about" element={<About />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/markets" element={<StocksPage />} />
                <Route path="/markets/stocks" element={<StocksPage />} />
                <Route path="/markets/bonds" element={<BondsPage />} />
                <Route path="/markets/mutual-funds" element={<MutualFundsPage />} />
                <Route path="/markets/portfolio" element={<SecuritiesPortfolioPage />} />
                <Route path="/markets/orders" element={<SecuritiesOrdersPage />} />
                <Route path="/markets/watchlist" element={<SecuritiesWatchlistPage />} />
                <Route path="/stocks" element={<Navigate to="/markets/stocks" replace />} />
                <Route path="/bonds" element={<Navigate to="/markets/bonds" replace />} />
                <Route path="/mutual-funds" element={<Navigate to="/markets/mutual-funds" replace />} />
                <Route path="/market-tickers" element={<MarketTickers />} />
                <Route path="/nodes" element={<StrategicNodes />} />
                <Route path="/pools" element={<LiquidityPools />} />
                <Route path="/neural-analytics" element={<NeuralAnalytics />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/aml" element={<AMLPolicy />} />
                <Route path="/regulatory-compliance" element={<GlobalRegulatoryCorporateCompliance />} />
              </Route>
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </ModeProvider>
        </UIProvider>
        </UIConfigProvider>
      </AuthProvider>
    </LanguageProvider>
    </Router>
    </ThemeProvider>
  );
}

