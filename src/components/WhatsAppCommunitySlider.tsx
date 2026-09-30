import React from 'react';
import { motion } from 'motion/react';

// Single authoritative source of truth for the CGA WhatsApp Support Contact
export const CGA_WHATSAPP_SUPPORT_NUMBER = '19376002568';

export default function WhatsAppCommunitySlider() {
  const phoneNumber = CGA_WHATSAPP_SUPPORT_NUMBER;
  const prefilledMessage = 'Hello, I would like to speak with customer service. Please assist me.';
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(prefilledMessage)}`;

  return (
    <div className="relative select-none flex justify-end">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes custom-whatsapp-glow {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); }
          70% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
      `}} />

      {/* Realistic 3D WhatsApp Button pointing directly to customer service */}
      <motion.a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: [0, -4, 0]
        }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { duration: 0.3 },
          y: {
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer relative shadow-[0_8px_24px_rgba(37,211,102,0.35),inset_0_2px_4px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.2)] border border-[#25d366]/40"
        style={{
          background: 'radial-gradient(circle at 35% 25%, #4ade80 0%, #25d366 50%, #128c7e 100%)',
          animation: 'custom-whatsapp-glow 2.5s infinite ease-in-out',
        }}
        title="Contact WhatsApp Support"
        aria-label="Contact WhatsApp Support"
      >
        {/* Glossy top reflection layer for realistic 3D appearance */}
        <div 
          className="absolute top-0.5 left-0.5 right-0.5 h-[40%] rounded-t-full pointer-events-none opacity-35"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Clean crisp logo from imgur */}
        <img 
          src="https://i.imgur.com/lQP5DLm.png" 
          alt="WhatsApp Support" 
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-6 h-6 md:w-7 md:h-7 object-contain filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.35)] relative z-10" 
        />
      </motion.a>
    </div>
  );
}
