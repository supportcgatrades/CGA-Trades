import React from 'react';

export default function PremiumLoader() {
  return (
    <div className="startup-container fixed inset-0 flex flex-col items-center justify-center z-[99999] select-none overflow-hidden bg-[#f8fafc] dark:bg-[#050608]">
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="loader-wrapper">
        <svg className="dotted-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#02d147" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 6" strokeOpacity="0.6" />
        </svg>
        <svg className="solid-ring" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#009e42" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="40 180" strokeOpacity="0.9" />
        </svg>
        <div className="logo-container">
          <img className="logo-img" src="https://i.imgur.com/nRbbYnS.png" alt="Capital Growth Alliance Logo" />
        </div>
      </div>
    </div>
  );
}
