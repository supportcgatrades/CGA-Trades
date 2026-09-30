import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  ArrowLeft,
  X,
  Bot,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
  Copy,
  Camera,
  Upload,
  Clock,
  Check,
  Trash2,
  Paperclip,
  AlertCircle,
  Eye,
  FileText,
  Image as ImageIcon,
  Cloud,
  FolderOpen
} from 'lucide-react';
import { useAuth, handleFirestoreError, OperationType } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  id: string;
}

export default function Support() {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    username: profile?.username || '',
    userId: profile?.public_id || '',
    email: profile?.email || '',
    subject: '',
    message: '',
    screenshot: '' // base64 representation
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Ticket History State
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  // Camera capturing state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Attachment states
  interface Attachment {
    name: string;
    data: string; // base64
    size: number; // in bytes
    type: string;
  }
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isViewingAllHistory, setIsViewingAllHistory] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Simulated Google Drive files
  const driveFiles = [
    { id: 'gd-1', name: 'cga_operation_receipt.png', type: 'image/png', size: 340 * 1024, sizeFormatted: '340 KB', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
    { id: 'gd-2', name: 'financial_verification.pdf', type: 'application/pdf', size: 850 * 1024, sizeFormatted: '850 KB', data: 'data:application/pdf;base64,JVBERi0xLjQKJbXtrscKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmo=' },
    { id: 'gd-3', name: 'identity_passport_scan.jpg', type: 'image/jpeg', size: 1.1 * 1024 * 1024, sizeFormatted: '1.1 MB', data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=' },
    { id: 'gd-4', name: 'support_request_details.txt', type: 'text/plain', size: 15 * 1024, sizeFormatted: '15 KB', data: 'data:text/plain;base64,U3VwcG9ydCBSZXF1ZXN0IGRldGFpbHMgYW5kIHN5c3RlbSBtZXRhZGF0YSBmb3IgQ0dBIFBsYXRmb3JtLg==' }
  ];

  const handleSelectDriveFile = (df: typeof driveFiles[0]) => {
    const currentTotal = attachments.reduce((sum, att) => sum + att.size, 0);
    if (currentTotal + df.size > 3 * 1024 * 1024) {
      toast.error(`File "${df.name}" exceeds the 3 MB total size limit.`);
      setIsDriveModalOpen(false);
      return;
    }

    setAttachments(prev => {
      if (prev.length >= 5) {
        toast.error("Maximum 5 attachments allowed");
        return prev;
      }
      return [...prev, {
        name: df.name,
        data: df.data,
        size: df.size,
        type: df.type
      }];
    });

    toast.success(`Attached from Google Drive: ${df.name}`);
    setIsDriveModalOpen(false);
  };

  // Chatbot State (not auto-opening by default)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: `Hello ${profile?.name || 'there'}! I'm CGA Trades Assistance. How can I assist you with your institutional asset flow today?`, id: '1' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Sync profile values to ticket form in background
  useEffect(() => {
    if (profile) {
      setTicketForm(prev => ({
        ...prev,
        username: profile.username || '',
        userId: profile.public_id || '',
        email: profile.email || ''
      }));
    } else if (user) {
      setTicketForm(prev => ({
        ...prev,
        username: user.displayName || '',
        userId: user.uid,
        email: user.email || ''
      }));
    }
  }, [profile, user]);

  // Fetch ticket history
  useEffect(() => {
    if (!user?.uid) return;
    const path = 'support_tickets';
    // Query without composite index by sorting client-side
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort client-side by created_at desc safely
      docs.sort((a: any, b: any) => {
        const timeA = a.created_at?.seconds || 0;
        const timeB = b.created_at?.seconds || 0;
        return timeB - timeA;
      });
      setUserTickets(docs);
      setIsLoadingTickets(false);
    }, (error) => {
      console.error("Error fetching tickets:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Refactored attachment logic to handle multiple files, images with compression, and non-image files with 3MB total size limit
  const addAttachment = (file: File) => {
    const currentTotal = attachments.reduce((sum, att) => sum + att.size, 0);
    if (currentTotal + file.size > 3 * 1024 * 1024) {
      toast.error(`File "${file.name}" exceeds the 3 MB total size limit.`);
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = window.Image ? new window.Image() : document.createElement('img') as any;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          
          // Estimate size of compressed image
          const stringLength = compressedBase64.length - 'data:image/jpeg;base64,'.length;
          const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;

          setAttachments(prev => {
            if (prev.length >= 5) {
              toast.error("Maximum 5 attachments allowed");
              return prev;
            }
            return [...prev, {
              name: file.name,
              data: compressedBase64,
              size: sizeInBytes,
              type: file.type
            }];
          });
          toast.success(`Attached image: ${file.name}`);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachments(prev => {
          if (prev.length >= 5) {
            toast.error("Maximum 5 attachments allowed");
            return prev;
          }
          return [...prev, {
            name: file.name,
            data: dataUrl,
            size: file.size,
            type: file.type
          }];
        });
        toast.success(`Attached file: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(addAttachment);
    }
  };

  // Camera functions
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError("Could not access your camera. Please ensure permissions are granted or upload an image instead.");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
      
      const stringLength = compressedBase64.length - 'data:image/jpeg;base64,'.length;
      const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;

      const currentTotal = attachments.reduce((sum, att) => sum + att.size, 0);
      if (currentTotal + sizeInBytes > 3 * 1024 * 1024) {
        toast.error("Photo exceeds the 3 MB total size limit.");
        stopCamera();
        return;
      }

      setAttachments(prev => {
        if (prev.length >= 5) {
          toast.error("Maximum 5 attachments allowed");
          return prev;
        }
        return [...prev, {
          name: `camera_snap_${Date.now()}.jpg`,
          data: compressedBase64,
          size: sizeInBytes,
          type: 'image/jpeg'
        }];
      });

      toast.success("Photo captured and attached");
      stopCamera();
    }
  };

  const clearAttachment = () => {
    setAttachments([]);
    toast.success("Attachments cleared");
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!ticketForm.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    const path = 'support_tickets';
    try {
      await addDoc(collection(db, path), {
        userId: user?.uid, // Actual internal UID
        publicId: profile?.public_id || ticketForm.userId,
        username: profile?.username || ticketForm.username,
        email: profile?.email || ticketForm.email,
        subject: ticketForm.subject,
        message: ticketForm.message,
        screenshot: attachments[0]?.data || '', // legacy fallback
        attachments: attachments.map(att => ({
          name: att.name,
          data: att.data,
          size: att.size,
          type: att.type
        })),
        status: 'open',
        created_at: serverTimestamp()
      });
      setIsSubmitted(true);
      toast.success("Ticket submitted successfully");
      setTimeout(() => {
        setIsSubmitted(false);
        setTicketForm(prev => ({ ...prev, subject: '', message: '', screenshot: '' }));
        setAttachments([]);
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: chatInput, id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}` };
    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, userName: profile?.name })
      });
      
      const data = await response.json();

      const botMessage: ChatMessage = { 
        role: 'bot', 
        text: data.text || "I apologize, I'm having trouble processing your request. Please try contacting our support team directly.", 
        id: `bot-${Date.now()}-${Math.random().toString(36).substring(7)}` 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const botMessage: ChatMessage = { 
        role: 'bot', 
        text: "I encountered an error. Please contact our support team via WhatsApp or Telegram.", 
        id: `bot-err-${Date.now()}-${Math.random().toString(36).substring(7)}` 
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#050608] text-white">
      {/* Edge-to-Edge Premium Header Banner with Web App Primary Color gradient and border */}
      <div className="support-header-banner w-full h-[180px] md:h-[240px] mb-12 relative overflow-hidden bg-gradient-to-r from-[#0a1122] via-[#0d1c10] to-[#0a1122] border-b-2 border-[#009e42] flex items-center justify-center select-none">
        {/* Background Grid Accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Glowing Orbs in Web App Primary Color */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#009e42]/10 rounded-full blur-[90px] pointer-events-none" />
        
        <div className="relative z-10 px-6 max-w-7xl mx-auto w-full flex flex-col items-center md:items-start text-center md:text-left space-y-2">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="support-header-title text-3xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase italic font-serif text-white"
          >
            Support <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#009e42] to-emerald-400 font-serif">Center</span>
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-8 pb-24">
        {/* SECTION 1: ALL SUPPORT CHANNELS & EMAILS AT THE TOP */}
      <section className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ContactCard 
            icon={
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.97.53-1.33.52-.4-.01-1.17-.23-1.74-.41-.7-.23-1.26-.35-1.21-.74.03-.2.29-.41.79-.62 3.09-1.34 5.15-2.23 6.19-2.67 2.94-1.24 3.55-1.45 3.95-1.46.09 0 .28.02.4.12.1.08.13.19.14.28-.01.07.01.21 0 .31z" />
              </svg>
            }
            label="Telegram Support" 
            value="@cga_help" 
            href="https://t.me/cga_help"
            brandColor="text-sky-400"
            bgColor="bg-sky-500/10"
          />


          {/* ADDED DEPOSITED SUPPORT EMAILS INSIDE PREMIUM EMAIL CARDS */}
          <EmailCard label="Backup Operations Support" email="capitalgrowthalliance@gmail.com" />
        </div>
      </section>

      {/* SECTION 2: TICKET FORM AT THE BOTTOM */}
      <div className="pt-4 max-w-4xl mx-auto w-full">
        {/* Support Ticket form placed perfectly at bottom of Support page */}
        <div className="space-y-6">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-sm backdrop-blur-sm relative">
             <div className="mb-8">
               <h2 className="text-2xl font-black text-white uppercase tracking-tight italic font-serif">ticket</h2>
             </div>

             <form onSubmit={handleTicketSubmit} className="space-y-6">
<div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Subject</label>
                   <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text"
                        required
                        placeholder="subjects"
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-200 outline-none focus:border-[#009e42]/50 transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Message / Query Description</label>
                   <textarea 
                     required
                     placeholder="Describe your issue or query in detail..."
                     value={ticketForm.message}
                     onChange={(e) => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                     rows={6}
                     className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-sm font-medium text-slate-200 outline-none focus:border-[#009e42]/50 transition-all resize-none"
                   />
                </div>

                 {/* Screenshot upload & camera capture section (re-styled to collapsed Attach files hyperlink with scroll-up options pedal) */}
                 <div className="space-y-3 mt-1 relative">

                    
                    <div className="relative inline-block">
                      {/* Hyperlink and icon trigger together */}
                      <button
                        type="button"
                        onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#009e42] hover:text-[#02d147] transition-colors cursor-pointer select-none group border-b border-dashed border-[#009e42]/40 pb-0.5"
                      >
                        <Paperclip size={16} className="text-[#009e42] group-hover:scale-110 transition-transform" />
                        <span>Attach files</span>
                      </button>

                      {/* Scroll up options pedal */}
                      <AnimatePresence>
                        {isAttachmentMenuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-[1010] cursor-default bg-transparent" 
                              onClick={() => setIsAttachmentMenuOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 15, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 15, scale: 0.95 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="absolute left-0 bottom-full mb-3 z-[1015] w-64 bg-[#0c1017] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-md"
                            >
                              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-3 py-1.5 mb-1 border-b border-white/5">
                                Select Source
                              </div>
                              
                              {/* Google Drive Option */}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsDriveModalOpen(true);
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-xl text-left transition-all cursor-pointer group text-xs text-slate-200 hover:text-white"
                              >
                                <Cloud size={14} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                                <span className="font-bold">Google Drive</span>
                              </button>

                              {/* Choose Files Option */}
                              <button
                                type="button"
                                onClick={() => {
                                  fileInputRef.current?.click();
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-xl text-left transition-all cursor-pointer group text-xs text-slate-200 hover:text-white"
                              >
                                <FolderOpen size={14} className="text-slate-400 group-hover:text-[#009e42] transition-colors" />
                                <span className="font-bold">Choose Files</span>
                              </button>

                              {/* Take Photo Option */}
                              <button
                                type="button"
                                onClick={() => {
                                  startCamera();
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-xl text-left transition-all cursor-pointer group text-xs text-slate-200 hover:text-white"
                              >
                                <Camera size={14} className="text-slate-400 group-hover:text-pink-400 transition-colors" />
                                <span className="font-bold">Take Photo</span>
                              </button>

                              {/* Photo Gallery Option */}
                              <button
                                type="button"
                                onClick={() => {
                                  galleryInputRef.current?.click();
                                  setIsAttachmentMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 rounded-xl text-left transition-all cursor-pointer group text-xs text-slate-200 hover:text-white"
                              >
                                <ImageIcon size={14} className="text-slate-400 group-hover:text-amber-400 transition-colors" />
                                <span className="font-bold">Photo Gallery / Library</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Hidden Inputs for Standard Choosing */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      multiple 
                      className="hidden" 
                      onChange={handleFileUploadChange} 
                    />
                    <input 
                      type="file" 
                      ref={galleryInputRef} 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUploadChange} 
                    />

                    {/* Beautiful current attachments preview list */}
                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Attached Files ({attachments.length})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={14} className="text-slate-400 shrink-0" />
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-200 truncate">{att.name}</p>
                                  <p className="text-[9px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAttachments(prev => prev.filter((_, i) => i !== idx));
                                  toast.success(`Removed attachment: ${att.name}`);
                                }}
                                className="text-red-400 hover:text-red-300 p-1 cursor-pointer shrink-0"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium">
                          Total size: {(attachments.reduce((sum, att) => sum + att.size, 0) / (1024 * 1024)).toFixed(2)} MB / 3.00 MB
                        </p>
                      </div>
                    )}
                 </div>

                 <button 
                    disabled={isSubmitting || !ticketForm.message || !ticketForm.subject}
                    className={cn(
                      "w-full py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] cursor-pointer",
                      isSubmitted 
                        ? "bg-green-500 text-white font-bold uppercase tracking-[0.3em] text-xs" 
                        : "bg-[#009e42] hover:bg-[#02d147] disabled:opacity-40 disabled:bg-[#009e42]/20"
                    )}
                  >
                    {isSubmitting ? (
                      <span className="text-white font-bold uppercase tracking-[0.3em] text-xs flex items-center gap-2">
                        <Loader2 className="animate-spin" size={18} /> Submitting ticket...
                      </span>
                    ) : isSubmitted ? (
                      <span className="text-white font-bold uppercase tracking-[0.3em] text-xs flex items-center gap-2">
                        <CheckCircle2 size={18} /> Ticket Submitted
                      </span>
                    ) : (
                      <span className="text-white font-normal font-sans text-sm tracking-normal normal-case">
                        Submit Ticket
                      </span>
                    )}
                  </button>
             </form>
          </section>

          {/* SECTION 3: TICKET HISTORY */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-sm backdrop-blur-sm mt-8">
             <div className="mb-6 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight italic font-serif">Ticket History</h3>
                   
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-slate-400">
                   {userTickets.length} {userTickets.length === 1 ? 'ticket' : 'tickets'}
                </div>
             </div>

             {isLoadingTickets ? (
               <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Loader2 className="animate-spin text-[#009e42]" size={24} />
                  <span className="text-xs uppercase font-bold tracking-widest">Loading Ticket Records...</span>
               </div>
             ) : userTickets.length === 0 ? (
               <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Clock className="mx-auto text-slate-500 mb-3 animate-pulse" size={32} />
                  <p className="text-sm font-bold text-slate-400">No ticket records found</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Submit your first inquiry above</p>
               </div>
             ) : (
                <div className="space-y-6">
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {userTickets.slice(0, 5).map((ticket) => {
                    const dateStr = ticket.created_at ? 
                      (ticket.created_at.toDate ? ticket.created_at.toDate().toLocaleString() : new Date(ticket.created_at.seconds ? ticket.created_at.seconds * 1000 : ticket.created_at).toLocaleString()) 
                      : "No date";
                      
                    return (
                      <div 
                        key={ticket.id}
                        className="p-5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                           <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase font-mono bg-white/5 px-2 py-0.5 rounded text-white tracking-widest">
                                Ticket ID: {ticket.id.substring(0, 8)}...
                              </span>
                              <h4 className="text-sm font-bold text-white tracking-tight mt-1">
                                 {ticket.subject || "Platform Ticket"}
                              </h4>
                           </div>
                           
                           <div>
                             <span className={cn(
                               "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border leading-none",
                               ticket.status === 'resolved' 
                                 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                 : ticket.status === 'in-progress'
                                   ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                   : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                             )}>
                               {ticket.status === 'resolved' ? 'treated / successful' : ticket.status === 'in-progress' ? 'treating / in progress' : 'pending'}
                             </span>
                           </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                           {ticket.message}
                        </p>

                        {ticket.screenshot && (
                          <div className="pt-2">
                             <details className="group">
                                <summary className="text-[10px] font-black uppercase tracking-widest text-[#009e42] cursor-pointer hover:underline list-none flex items-center gap-1.5 select-none">
                                   <Paperclip size={12} /> View Attachment
                                </summary>
                                <div className="mt-3 p-2 bg-black/40 border border-white/10 rounded-xl inline-block max-w-full">
                                   <img 
                                     src={ticket.screenshot} 
                                     alt="Ticket Screenshot" 
                                     className="max-h-[180px] rounded-lg object-contain"
                                     referrerPolicy="no-referrer"
                                   />
                                </div>
                             </details>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase font-mono">
                           <span>{dateStr}</span>
                        </div>
                      </div>
                    );
                  })}
               </div>
                  {userTickets.length > 5 && (
                    <div className="flex justify-center pt-4 pb-2">
                      <button
                        type="button"
                        onClick={() => setIsViewingAllHistory(true)}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-[#009e42] hover:text-[#02d147] transition-all cursor-pointer"
                      >
                        View All Support History
                      </button>
                    </div>
                  )}
                </div>
             )}
          </section>
        </div>
      </div>

      {/* Floating Chatbot Launch Trigger if minimized (Default Behavior) */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 z-[2000] w-14 h-14 bg-gradient-to-tr from-aura-lime via-emerald-500 to-teal-500 text-slate-950 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.35)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
          >
            <Bot size={26} className="text-slate-950" />
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Popup */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[2000] w-[350px] md:w-[400px] h-[500px] md:h-[600px] bg-[#0a0c10] border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
          >
             {/* Chat Header */}
             <div className="bg-slate-900 p-5 flex items-center justify-between text-white border-b border-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-aura-lime rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-aura-lime/20">
                     <Bot size={22} className="text-slate-950" />
                   </div>
                   <div>
                       <h4 className="text-xs font-black uppercase tracking-widest italic font-serif text-white">CGA Assistance</h4>
                       <p className="text-[10px] text-aura-lime font-bold uppercase tracking-widest">Online & Ready</p>
                   </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-white"
                >
                  <X size={20} />
                </button>
             </div>

             {/* Chat Messages */}
             <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-transparent">
                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                       "flex flex-col max-w-[85%] space-y-1",
                       msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-4 text-xs font-medium leading-relaxed",
                      msg.role === 'user' 
                        ? "bg-blue-600 text-white rounded-t-2xl rounded-bl-2xl shadow-md" 
                        : "bg-white/5 border border-white/10 text-slate-200 rounded-t-2xl rounded-br-2xl shadow-sm"
                    )}>
                       {msg.text}
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
                      {msg.role === 'user' ? 'Me' : 'CGA Assistance'}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex flex-col items-start space-y-1 max-w-[85%]">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-t-2xl rounded-br-2xl">
                       <div className="flex gap-1">
                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                         <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                       </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
             </div>

             {/* Chat Input */}
             <div className="p-4 bg-[#0a0c10] border-t border-white/10">
                <div className="relative">
                   <input 
                     type="text"
                     placeholder="Type your message..."
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-xs font-bold text-slate-200 outline-none focus:border-blue-500 transition-all"
                   />
                   <button 
                     onClick={handleSendMessage}
                     disabled={!chatInput.trim() || isTyping}
                     className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-aura-lime text-slate-950 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 cursor-pointer"
                   >
                     <Send size={16} className="text-slate-950" />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Drive Mock Modal */}
      <AnimatePresence>
        {isDriveModalOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0c1017] border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Cloud size={18} className="text-blue-400" />
                  <h3 className="text-base font-black uppercase tracking-wider text-white">Google Drive</h3>
                </div>
                <button 
                  onClick={() => setIsDriveModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Recent Files</p>
              
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {driveFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleSelectDriveFile(file)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 border border-white/5 hover:border-[#009e42]/20 rounded-xl text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">{file.name}</p>
                        <p className="text-[9px] text-slate-500">{file.type === 'pdf' ? 'PDF Document' : 'Spreadsheet'} • {file.size}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded bg-blue-500/5 group-hover:bg-blue-400 group-hover:text-slate-950 transition-all">
                      Import
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 text-right">
                <button
                  onClick={() => setIsDriveModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Webcam Live Capture Modal Overlay */}
      <AnimatePresence>
        {isCameraActive && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 md:bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Camera size={18} className="text-pink-500" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Capture Photo</h3>
                </div>
                <button 
                  onClick={stopCamera}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {cameraError ? (
                <div className="text-center p-6 text-red-500 dark:text-red-400 space-y-3">
                  <AlertCircle className="mx-auto" size={28} />
                  <p className="text-xs font-bold uppercase leading-relaxed">{cameraError}</p>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl text-xs font-bold text-slate-800 dark:text-white uppercase cursor-pointer"
                  >
                    Close Camera
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-200 dark:border-white/10">
                    <video 
                      ref={videoRef} 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2 w-full justify-center pt-2">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 py-3 bg-[#009e42] hover:bg-[#02d147] text-white font-black uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Camera size={14} /> Capture File
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Ticket Details Modal (Pop-up preview of complete details) */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 md:bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 25 }}
              className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[85vh] overflow-y-auto scrollbar-thin space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                <div className="space-y-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase font-mono bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded text-slate-700 dark:text-slate-300 tracking-wider">
                      Ticket Ref: {selectedTicket.id.substring(0, 12)}
                    </span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border leading-none",
                      selectedTicket.status === 'resolved' 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : selectedTicket.status === 'in-progress'
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    )}>
                      {selectedTicket.status === 'resolved' ? 'treated / successful' : selectedTicket.status === 'in-progress' ? 'treating / in progress' : 'pending'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic font-serif pt-1.5">
                    {selectedTicket.subject || "Platform Ticket"}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Details Body */}
              <div className="space-y-4 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-1 gap-4 bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 p-4 rounded-2xl">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Submitted Date</p>
                    <p className="text-slate-800 dark:text-slate-300 font-bold">
                      {selectedTicket.created_at ? 
                        (selectedTicket.created_at.toDate ? selectedTicket.created_at.toDate().toLocaleString() : new Date(selectedTicket.created_at.seconds ? selectedTicket.created_at.seconds * 1000 : selectedTicket.created_at).toLocaleString()) 
                        : "No date"}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Message / Query Description</p>
                  <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Legacy Screenshot Fallback */}
                {selectedTicket.screenshot && !selectedTicket.attachments && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Attachment</p>
                    <div className="p-2 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl inline-block">
                      <img 
                        src={selectedTicket.screenshot} 
                        alt="Ticket Attachment" 
                        className="max-h-[250px] rounded-lg object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}

                {/* Refactored Attachments List */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                      Attached Files ({selectedTicket.attachments.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedTicket.attachments.map((att: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col space-y-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{att.name}</p>
                              {att.size && (
                                <p className="text-[9px] text-slate-500">{(att.size / 1024).toFixed(1)} KB</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Render preview if it's an image */}
                          {att.data && (att.type?.startsWith('image/') || att.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i)) && (
                            <div className="p-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden mt-1 text-center">
                              <img 
                                src={att.data} 
                                alt={att.name} 
                                className="max-h-[120px] mx-auto rounded object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* Data/import triggers */}
                          {att.data && !(att.type?.startsWith('image/') || att.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i)) && (
                            <a
                              href={att.data}
                              download={att.name}
                              className="text-[9px] font-black uppercase text-[#009e42] hover:underline flex items-center gap-1 mt-1"
                            >
                              <FolderOpen size={10} /> Download Document
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/5 text-right">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-5 py-2.5 bg-[#009e42] hover:bg-[#02d147] text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Immersive View All Ticket History overlay/page */}
      <AnimatePresence>
        {isViewingAllHistory && (
          <div className="fixed inset-0 z-[2500] bg-slate-50 dark:bg-[#050608] text-slate-900 dark:text-white flex flex-col overflow-hidden">
            {/* Header bar styled exactly with primary color header accents */}
            <div className="w-full bg-white dark:bg-[#0c1017] border-b-2 border-[#009e42] px-6 py-5 flex items-center justify-between shrink-0 shadow-xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsViewingAllHistory(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight italic font-serif text-slate-900 dark:text-white">Full Ticket Record</h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">Monitoring CGA Treatment Desk Logs</p>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-400">
                {userTickets.length} total records
              </div>
            </div>

            {/* Scrollable history container */}
            <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto w-full space-y-4 scrollbar-thin">
              {userTickets.map((ticket) => {
                const dateStr = ticket.created_at ? 
                  (ticket.created_at.toDate ? ticket.created_at.toDate().toLocaleString() : new Date(ticket.created_at.seconds ? ticket.created_at.seconds * 1000 : ticket.created_at).toLocaleString()) 
                  : "No date";

                return (
                  <button 
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                    }}
                    className="w-full text-left p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#009e42]/20 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                          ID: {ticket.id}
                        </span>
                        <span className="text-[8px] font-mono text-slate-500">•</span>
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                          {dateStr}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-[#009e42] transition-colors">
                        {ticket.subject || "Platform Ticket"}
                      </h4>
                    </div>

                    <div>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border leading-none",
                        ticket.status === 'resolved' 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : ticket.status === 'in-progress'
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {ticket.status === 'resolved' ? 'treated / successful' : ticket.status === 'in-progress' ? 'treating / in progress' : 'pending'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

function ContactCard({ icon, label, value, href, brandColor = "text-blue-500", bgColor = "bg-blue-500/10" }: { icon: React.ReactNode, label: string, value: string, href: string, brandColor?: string, bgColor?: string }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-[#009e42]/30 hover:bg-white/[0.02] transition-all backdrop-blur-sm"
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", bgColor, brandColor)}>
          {icon}
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-xs font-black text-slate-100 tracking-tight">{value}</p>
        </div>
      </div>
      <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
    </a>
  );
}

function EmailCard({ email, label }: { email: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    toast.success(`${email} copied to clipboard!`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 hover:bg-white/[0.02] transition-all backdrop-blur-sm relative overflow-hidden">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
          <Mail size={18} />
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-xs font-black text-slate-100 tracking-tight select-all">{email}</p>
        </div>
      </div>
      <button 
        onClick={handleCopy}
        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/20 cursor-pointer flex items-center justify-center shrink-0"
        title="Copy to Clipboard"
      >
        {copied ? (
          <CheckCircle2 size={13} className="text-blue-400" />
        ) : (
          <Copy size={13} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
        )}
      </button>
    </div>
  );
}
