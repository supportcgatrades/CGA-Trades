import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Search, 
  ChevronDown, 
  ThumbsUp, 
  MoreHorizontal, 
  CheckCircle2,
  Calendar,
  X,
  Send,
  ArrowLeft,
  MessageSquarePlus,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { REVIEWS, Review } from '../constants/landingData';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';

// --- HELPERS ---
const CATEGORIES = ['All Investments', 'Growth Plan', 'Customer Support', 'Security', 'User Experience', 'High Returns', 'Transparency'];
const RATINGS = ['All Ratings', '5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];
const TIME_FILTERS = ['All Time', 'Last 24 Hours', 'Last Week', 'Last Month', 'Last Year'];

const TAGS = ['Growth Plan', 'Customer Support', 'Security', 'Easy to Use', 'High Returns', 'Transparency'];

const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
  if (diff < 2592000000) return `${Math.floor(diff / 604800000)} weeks ago`;
  if (diff < 31536000000) return `${Math.floor(diff / 2592000000)} months ago`;
  return `${Math.floor(diff / 31536000000)} years ago`;
};

const parseTimeAgo = (timeStr: string): number => {
  const now = Date.now();
  const num = parseInt(timeStr) || 1;
  if (timeStr.includes('minute')) return now - num * 60000;
  if (timeStr.includes('hour')) return now - num * 3600000;
  if (timeStr.includes('day')) return now - num * 86400000;
  if (timeStr.includes('week')) return now - num * 604800000;
  if (timeStr.includes('month')) return now - num * 2592000000;
  if (timeStr.includes('year')) return now - num * 31536000000;
  return now - 86400000;
};

const ReviewCard = React.memo(({ review, index, isLight }: { review: Review & { timestamp?: number }; index: number; isLight: boolean }) => {
  const [timeText, setTimeText] = useState(review.timestamp ? formatRelativeTime(review.timestamp) : review.timeAgo);

  useEffect(() => {
    if (!review.timestamp) return;
    const interval = setInterval(() => {
      setTimeText(formatRelativeTime(review.timestamp!));
    }, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [review.timestamp]);

  const tag = useMemo(() => {
    const hash = review.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return TAGS[hash % TAGS.length];
  }, [review.id]);

  const initial = review.name.charAt(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 6) * 0.05 }}
      style={{ transform: 'translateZ(0)' }}
      className={cn(
        "border rounded-2xl p-6 transition-all duration-300 group relative flex flex-col h-full",
        isLight 
          ? "bg-white border-slate-200/80 text-slate-800 hover:bg-slate-100/30 hover:border-emerald-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)]" 
          : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-emerald-500/30 text-white"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden",
            isLight ? "bg-emerald-50 border-emerald-100" : "bg-emerald-500/20 border-emerald-500/20"
          )}>
             <span className="text-emerald-500 font-bold">{initial}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={cn("text-sm font-bold transition-colors", isLight ? "text-slate-800" : "text-white")}>{review.name}</h4>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                isLight ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-emerald-500/10 text-emerald-500"
              )}>
                <CheckCircle2 size={10} />
                <span>Verified</span>
              </div>
            </div>
            <p className={cn("text-[10px] mt-0.5 transition-colors", isLight ? "text-slate-400" : "text-aura-muted")}>{timeText}</p>
          </div>
        </div>
        <button className={cn("transition-colors", isLight ? "text-slate-400 hover:text-slate-800" : "text-aura-muted hover:text-white")}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={14} 
            className={cn(
              i < review.rating ? "text-emerald-500 fill-emerald-500" : (isLight ? "text-slate-100 fill-slate-100" : "text-white/10 fill-white/10")
            )} 
          />
        ))}
      </div>

      <p className={cn("text-sm leading-relaxed mb-6 line-clamp-4 transition-colors", isLight ? "text-slate-600" : "text-aura-muted")}>
        {review.text}
      </p>

      <div className="mt-auto">
        <div className={cn(
          "inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider mb-4",
          isLight ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" : "bg-emerald-50/10 border-emerald-500/20 text-emerald-500"
        )}>
          {tag}
        </div>
        
        <div className={cn("flex items-center justify-between pt-4 border-t transition-colors", isLight ? "border-slate-100" : "border-white/5")}>
          <button className={cn(
            "flex items-center gap-1.5 text-[10px] font-bold transition-colors", 
            isLight ? "text-slate-400 hover:text-emerald-600" : "text-aura-muted hover:text-emerald-500"
          )}>
            <ThumbsUp size={12} />
            Helpful ({Math.floor(Math.random() * 50) + 1})
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default function ReviewsPage() {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All Ratings');
  const [categoryFilter, setCategoryFilter] = useState('All Investments');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [sortBy, setSortBy] = useState('Most Recent');
  const [limit, setLimit] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [customReviews, setCustomReviews] = useState<any[]>([]);
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Prepare base reviews with mixed ratings
  const baseReviews = useMemo(() => {
    const cloned = [...REVIEWS];
    let twoStarCount = 0;
    let threeStarCount = 0;

    const modified = cloned.map((r, i) => {
      let rating = r.rating;
      if (twoStarCount < 20 && i % 15 === 0) {
        rating = 2;
        twoStarCount++;
      } else if (threeStarCount < 30 && i % 10 === 0) {
        rating = 3;
        threeStarCount++;
      }
      return { 
        ...r, 
        rating, 
        text: r.text.replace(/^["'“]|["'”]$/g, ''), // Remove quotes
        timestamp: parseTimeAgo(r.timeAgo) 
      };
    });

    return modified.sort(() => Math.random() - 0.5); // Randomly mixed by default
  }, []);

  const allReviews = useMemo(() => {
    const combined = [...customReviews, ...baseReviews];
    if (sortBy === 'Most Recent') {
      return combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    return combined;
  }, [customReviews, baseReviews, sortBy]);

  const filteredReviews = useMemo(() => {
    return allReviews.filter(review => {
      const matchesSearch = review.name.toLowerCase().includes(search.toLowerCase()) || 
                           review.text.toLowerCase().includes(search.toLowerCase());
      
      const ratingValue = ratingFilter === 'All Ratings' ? null : parseInt(ratingFilter[0]);
      const matchesRating = !ratingValue || review.rating === ratingValue;
      
      return matchesSearch && matchesRating;
    });
  }, [allReviews, search, ratingFilter]);

  const displayedReviews = filteredReviews.slice(0, limit);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setLimit(prev => prev + 12);
      setIsLoadingMore(false);
    }, 800);
  };

  const stats = useMemo(() => {
    const total = allReviews.length;
    const avg = (allReviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1);
    
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        (dist as any)[r.rating]++;
      }
    });

    const distributionPercentages = {
      5: Math.round((dist[5] / total) * 100),
      4: Math.round((dist[4] / total) * 100),
      3: Math.round((dist[3] / total) * 100),
      2: Math.round((dist[2] / total) * 100),
      1: Math.round((dist[1] / total) * 100),
    };

    return { total, avg, distribution: distributionPercentages };
  }, [allReviews]);

  const handleAddReview = (newReview: any) => {
    setCustomReviews(prev => [newReview, ...prev]);
    setIsWriteModalOpen(false);
    setSortBy('Most Recent');
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 selection:bg-emerald-500 selection:text-white",
      isLight ? "bg-slate-50 text-slate-800" : "bg-[#050816] text-white"
    )}>
      {/* Premium Navbar */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-[100] transition-all duration-500 h-20 px-6 lg:px-20 flex items-center justify-between backdrop-blur-md border-b",
        isScrolled 
          ? (isLight ? "bg-white/90 border-slate-200/80 h-16" : "bg-[#050816]/90 border-primary/20 h-16") 
          : "bg-transparent border-transparent"
      )}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg border transition-all group active:scale-95",
              isLight 
                ? "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-emerald-500/40" 
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-emerald-500/30 text-white"
            )}
            aria-label="Go Back"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/welcome')}>
            <img src="https://i.imgur.com/nRbbYnS.png" alt="Logo" className="w-8 h-8 lg:w-9 lg:h-9 object-contain" />
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => navigate('/invest')}
             className="px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
           >
             Invest Now
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-48 pb-20 px-6 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className={cn(
              "inline-flex items-center gap-2 py-1.5 px-4 rounded-full border backdrop-blur-sm",
              isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
            )}>
              <Star size={12} className="text-emerald-500 fill-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Trusted by Thousands</span>
            </div>
            <h1 className={cn("text-5xl lg:text-7xl font-black tracking-tight leading-[0.95] transition-colors", isLight ? "text-slate-800" : "text-white")}>
              Real <span className="text-emerald-500">Reviews</span> from<br/>
              Real <span className={isLight ? "text-slate-400" : "text-white/60"}>Investors</span>
            </h1>
            <p className={cn("text-lg font-medium max-w-lg transition-colors", isLight ? "text-slate-500" : "text-aura-muted")}>
              Discover what our users are saying about their experience with our investment platform.
            </p>
          </div>

          {/* Stats Card */}
          <div className={cn(
            "lg:justify-self-end w-full max-w-md border rounded-3xl p-8 backdrop-blur-md relative group transition-all",
            isLight 
              ? "bg-white border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03),0_0_25px_rgba(255,255,255,0.95)]" 
              : "bg-white/5 border-white/10"
          )}>
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
               <div className="text-center">
                 <p className={cn("text-6xl font-black transition-colors", isLight ? "text-slate-800" : "text-white")}>{stats.avg}</p>
                 <div className="flex items-center justify-center gap-0.5 my-3">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} size={18} className="text-emerald-500 fill-emerald-500" />
                   ))}
                 </div>
                 <p className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", isLight ? "text-slate-500" : "text-aura-muted")}>Out of 5</p>
                 <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors", isLight ? "text-slate-400" : "text-aura-muted/60")}>Based on {stats.total} reviews</p>
               </div>
               
               <div className="flex-1 w-full space-y-3">
                 {[5, 4, 3, 2, 1].map((rating) => (
                   <div key={rating} className="flex items-center gap-3">
                     <span className={cn("text-[10px] font-bold w-12 transition-colors", isLight ? "text-slate-400" : "text-white/40")}>{rating} Stars</span>
                     <div className={cn("flex-1 h-2 rounded-full overflow-hidden transition-colors", isLight ? "bg-slate-100" : "bg-white/5")}>
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(stats.distribution as any)[rating]}%` }}
                         transition={{ duration: 1, delay: 0.5 }}
                         className="h-full bg-emerald-500"
                       />
                     </div>
                     <span className={cn("text-[10px] font-bold w-8 transition-colors", isLight ? "text-slate-400" : "text-white/40")}>{(stats.distribution as any)[rating]}%</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className={cn(
        "sticky top-16 lg:top-20 z-50 px-6 py-6 border-y backdrop-blur-xl transition-all duration-300",
        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-[#050816]/80 border-white/5"
      )}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full h-14 border rounded-2xl pl-12 pr-4 text-sm font-medium focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all outline-none",
                isLight ? "bg-white border-slate-200 text-slate-800 placeholder-slate-400" : "bg-white/5 border-white/10 text-white placeholder-white/30"
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
             <FilterSelect value={ratingFilter} onChange={setRatingFilter} options={RATINGS} isLight={isLight} />
             <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={CATEGORIES} isLight={isLight} />
             <FilterSelect value={timeFilter} onChange={setTimeFilter} options={TIME_FILTERS} isLight={isLight} />
             
             <button 
               onClick={() => setIsWriteModalOpen(true)}
               className="h-14 px-6 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 ml-auto lg:ml-0"
             >
               <MessageSquarePlus size={16} />
               Write a Review
             </button>
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <h3 className={cn("text-xl font-bold transition-colors", isLight ? "text-slate-800" : "text-white")}>
            All <span className="text-emerald-500 italic">Reviews</span> ({filteredReviews.length})
          </h3>
          
          <div className={cn(
            "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors group",
            isLight ? "text-slate-400 hover:text-slate-700" : "text-aura-muted hover:text-white"
          )}>
            Sort by: <span className={cn("transition-colors", isLight ? "text-slate-700 group-hover:text-emerald-600" : "text-white group-hover:text-emerald-500")}>{sortBy}</span>
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 min-h-[600px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {displayedReviews.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} isLight={isLight} />
            ))}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {limit < filteredReviews.length && (
          <div className="flex justify-center mt-20">
            <button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className={cn(
                "px-12 py-5 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 disabled:opacity-50",
                isLight ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              )}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  Loading...
                </>
              ) : (
                <>
                  <Calendar size={16} className="text-emerald-500" />
                  Load More Reviews
                </>
              )}
            </button>
          </div>
        )}

        {filteredReviews.length === 0 && (
          <div className="py-40 text-center space-y-4">
             <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors", isLight ? "bg-slate-100" : "bg-white/5")}>
                <Search size={32} className={cn("transition-colors", isLight ? "text-slate-300" : "text-aura-muted/20")} />
             </div>
             <h4 className={cn("text-2xl font-bold transition-colors", isLight ? "text-slate-800" : "text-white")}>No results found</h4>
             <p className={cn("text-sm max-w-xs mx-auto transition-colors", isLight ? "text-slate-400" : "text-aura-muted")}>
               Try adjusting your filters or search term to find what you're looking for.
             </p>
             <button 
                onClick={() => {
                  setSearch('');
                  setRatingFilter('All Ratings');
                  setCategoryFilter('All Investments');
                  setTimeFilter('All Time');
                }}
                className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest hover:underline pt-4"
             >
               Clear All Filters
             </button>
          </div>
        )}
      </section>

      <WriteReviewModal 
        isOpen={isWriteModalOpen} 
        onClose={() => setIsWriteModalOpen(false)} 
        onSubmit={handleAddReview}
        userName={profile?.fullName || user?.displayName || 'Investor'}
        isLight={isLight}
      />

      <Footer />
    </div>
  );
}

function FilterSelect({ value, onChange, options, isLight }: { value: string, onChange: (v: string) => void, options: string[], isLight: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 px-6 border rounded-2xl flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
          isLight 
            ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50" 
            : "bg-white/5 border-white/10 text-white hover:bg-white/[0.08]",
          isOpen ? "border-emerald-500/40" : ""
        )}
      >
        <span className={cn(value.includes('All') ? (isLight ? "text-slate-400" : "text-aura-muted") : "text-emerald-500")}>{value}</span>
        <ChevronDown size={14} className={cn("transition-transform duration-300", isOpen ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={cn(
              "absolute top-full left-0 mt-2 w-56 border rounded-2xl overflow-hidden shadow-2xl z-[60] py-2 transition-all",
              isLight ? "bg-white border-slate-200" : "bg-[#0c101d] border-white/10"
            )}
          >
            {options.map((opt) => (
              <button 
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors",
                  value === opt 
                    ? "text-emerald-500 bg-emerald-500/5" 
                    : (isLight ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50" : "text-aura-muted hover:text-white hover:bg-white/5")
                )}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WriteReviewModal({ isOpen, onClose, onSubmit, userName, isLight }: { isOpen: boolean, onClose: () => void, onSubmit: (r: any) => void, userName: string, isLight: boolean }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        id: `custom-${Date.now()}`,
        name: userName,
        rating,
        text: text.trim(),
        timestamp: Date.now(),
        verified: true,
        countryCode: 'US',
        countryName: 'USA'
      });
      setText('');
      setRating(5);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg border rounded-[2.5rem] p-8 lg:p-10 shadow-2xl z-[201] overflow-hidden transition-colors",
              isLight ? "bg-white border-slate-200" : "bg-[#0c1122]/90 border-white/10 backdrop-blur-2xl"
            )}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <button onClick={onClose} className={cn("absolute top-6 right-6 transition-colors", isLight ? "text-slate-400 hover:text-slate-800" : "text-white/40 hover:text-white")}>
              <X size={24} />
            </button>

            <div className="relative space-y-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <MessageSquarePlus size={32} className="text-emerald-500" />
                </div>
                <h2 className={cn("text-3xl font-black tracking-tight transition-colors", isLight ? "text-slate-800" : "text-white")}>
                  Share your <span className="text-emerald-500">experience</span>
                </h2>
                <p className={cn("text-sm font-medium transition-colors", isLight ? "text-slate-500" : "text-aura-muted")}>
                  Your feedback helps thousands of investors make better decisions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", isLight ? "text-slate-400" : "text-white/40")}>Your Name</label>
                  <input 
                    type="text" 
                    value={userName} 
                    disabled 
                    className={cn(
                      "w-full h-14 border rounded-2xl px-6 text-sm font-bold outline-none cursor-not-allowed transition-all",
                      isLight ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-white/5 border-white/10 text-white/40"
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest text-center block transition-colors", isLight ? "text-slate-400" : "text-white/40")}>Rating</label>
                  <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="group transition-transform active:scale-95"
                      >
                        <Star 
                          size={32} 
                          className={cn(
                            "transition-all duration-300",
                            star <= rating 
                              ? "text-emerald-500 fill-emerald-500 scale-110" 
                              : isLight 
                                ? "text-slate-200 fill-slate-200 hover:text-slate-300" 
                                : "text-white/10 fill-white/10 hover:text-white/20"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", isLight ? "text-slate-400" : "text-white/40")}>Review</label>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tell us what you think..."
                    autoFocus
                    required
                    className={cn(
                      "w-full h-32 border rounded-2xl p-6 text-sm font-medium focus:border-emerald-500/50 transition-all outline-none resize-none",
                      isLight ? "bg-white border-slate-200 text-slate-800 focus:bg-slate-50" : "bg-white/5 border-white/10 text-white focus:bg-white/[0.08]"
                    )}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !text.trim()}
                  className="w-full h-16 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Review
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
