import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  XCircle, 
  Trash2, 
  CheckCheck,
  ChevronRight,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: any;
}

export default function NotificationsPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const isCipher = profile.role === 'cipher';
    const isVerified = user.emailVerified || isCipher;

    if (!isVerified) return;

    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(items);
      setLoading(false);
    }, (error) => {
      console.error("Notifications fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', user.uid),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeIcon = (type: string, isUnread: boolean) => {
    switch (type) {
      case 'success': return <CheckCircle2 className={isUnread ? "text-emerald-600" : "text-emerald-500/70"} size={18} />;
      case 'warning': return <AlertTriangle className={isUnread ? "text-amber-600" : "text-amber-500/70"} size={18} />;
      case 'error': return <XCircle className={isUnread ? "text-rose-600" : "text-rose-500/70"} size={18} />;
      default: return <Info className={isUnread ? "text-blue-600" : "text-blue-500/70"} size={18} />;
    }
  };

  const parseDate = (date: any) => {
    if (!date) return new Date();
    if (typeof date.toDate === 'function') return date.toDate();
    if (date.seconds) return new Date(date.seconds * 1000);
    return new Date(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-aura-lime/20 border-t-aura-lime rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Clean, tiny navigation bar with nothing except back button and center tiny title */}
      <div className="flex items-center justify-between py-2 border-b border-white/5 bg-black/40 backdrop-blur-md px-4 rounded-xl">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold select-none">
          notifications
        </div>
        <div className="w-6" /> {/* balance spacing */}
      </div>

      <div className="flex justify-end pr-1">
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <CheckCheck size={12} />
            {t('mark_all_read')}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-sm">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-tight">{t('no_notifications')}</h3>
            <p className="text-zinc-500 text-xs uppercase tracking-widest">We'll alert you when something happens</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {notifications.map((notification) => {
              const isUnread = !notification.read;
              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "relative group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer",
                    isUnread 
                      ? "bg-zinc-100 text-zinc-950 border-zinc-200 shadow-[0_4px_12px_rgba(0,0,0,0.1)]" 
                      : "bg-white/[0.02] border-white/5 text-zinc-500 opacity-60 hover:opacity-80"
                  )}
                  onClick={() => isUnread && markAsRead(notification.id)}
                >
                  {isUnread && (
                    <div className="absolute top-5 left-2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                  )}
                  
                  <div className={cn(
                    "p-2.5 rounded-xl border flex-shrink-0",
                    isUnread ? "bg-zinc-200 border-zinc-300 text-zinc-900" : "bg-white/5 border-white/5 text-zinc-400"
                  )}>
                    {getTypeIcon(notification.type, isUnread)}
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={cn(
                        "text-sm uppercase tracking-tight truncate",
                        isUnread ? "font-extrabold text-zinc-950" : "font-medium text-zinc-400"
                      )}>
                        {notification.title}
                      </h4>
                      <div className={cn(
                        "flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest whitespace-nowrap px-2 py-0.5 rounded-full",
                        isUnread ? "bg-zinc-200 text-zinc-800" : "bg-white/5 text-zinc-400"
                      )}>
                        <Clock size={10} />
                        {notification.created_at ? formatDistanceToNow(parseDate(notification.created_at), { addSuffix: true }) : 'just now'}
                      </div>
                    </div>
                    <p className={cn(
                      "text-xs leading-relaxed max-w-2xl",
                      isUnread ? "font-bold text-zinc-900" : "font-normal text-zinc-500"
                    )}>
                      {notification.message}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className={cn(
                        "p-2 transition-colors rounded-lg",
                        isUnread ? "text-zinc-600 hover:text-red-600 hover:bg-zinc-200" : "text-zinc-500 hover:text-red-400 hover:bg-white/5"
                      )}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    {isUnread && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-2 text-zinc-600 hover:text-emerald-600 hover:bg-zinc-200 transition-colors rounded-lg"
                        title="Mark as read"
                      >
                        <CheckCheck size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
