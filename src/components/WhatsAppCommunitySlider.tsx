import React from 'react';
import { motion } from 'motion/react';

// Single authoritative source of truth for the CGA WhatsApp Support Contact
export const CGA_WHATSAPP_SUPPORT_NUMBER = '19376002568';
export const CGA_WHATSAPP_SUPPORT_MESSAGE = 'Hello, I would like to speak with customer service. Please assist me.';
export const CGA_WHATSAPP_SUPPORT_URL = `https://wa.me/${CGA_WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(CGA_WHATSAPP_SUPPORT_MESSAGE)}`;

// Exact provided WhatsApp logo asset: https://imgur.com/Ci61RDN
export const CGA_WHATSAPP_LOGO_URL = 'https://i.imgur.com/Ci61RDN.png';
export const CGA_WHATSAPP_LOGO_PAGE = 'https://imgur.com/Ci61RDN';

export function WhatsAppIcon({ className = "w-full h-full" }: { className?: string }) {
  return (
    <img 
      src={CGA_WHATSAPP_LOGO_URL} 
      data-asset-url={CGA_WHATSAPP_LOGO_PAGE}
      alt="WhatsApp" 
      className={`${className} object-contain pointer-events-none select-none`}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== '/whatsapp-logo.png') {
          target.src = '/whatsapp-logo.png';
        }
      }}
    />
  );
}

export default function WhatsAppCommunitySlider() {
  const whatsappLink = CGA_WHATSAPP_SUPPORT_URL;

  return (
    <div className="relative select-none flex justify-end pointer-events-none">
      {/* Floating WhatsApp Button: Fixed, stable anchor hitbox with animated visual inner icon */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 md:w-14 md:h-14 min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer relative filter drop-shadow-[0_6px_16px_rgba(37,211,102,0.45)] hover:drop-shadow-[0_8px_22px_rgba(37,211,102,0.6)] active:scale-95 transition-transform touch-manipulation z-10 pointer-events-auto"
        title="Contact WhatsApp Support"
        aria-label="Contact WhatsApp Support"
      >
        <motion.div
          animate={{
            y: [0, -3, 0]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="w-full h-full flex items-center justify-center pointer-events-none"
        >
          <WhatsAppIcon className="w-full h-full object-contain pointer-events-none" />
        </motion.div>
      </a>
    </div>
  );
}
