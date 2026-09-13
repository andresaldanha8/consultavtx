import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  showSubtitle?: boolean;
}

export const Logo: React.FC<Props> = ({ size = 'md', theme = 'light', showSubtitle = true }) => {
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: {
      number: 'text-2xl',
      vozes: 'text-xs tracking-widest',
      sub: 'text-[10px]',
      badge: 'w-4 h-4 text-[9px]',
    },
    md: {
      number: 'text-3xl sm:text-4xl',
      vozes: 'text-sm sm:text-base tracking-[0.2em]',
      sub: 'text-xs sm:text-sm',
      badge: 'w-5 h-5 text-[10px]',
    },
    lg: {
      number: 'text-5xl sm:text-6xl',
      vozes: 'text-lg sm:text-xl tracking-[0.25em]',
      sub: 'text-sm sm:text-base',
      badge: 'w-7 h-7 text-xs',
    },
  }[size];

  return (
    <div className="flex flex-col items-center select-none">
      {/* 100 with distinct color detail */}
      <div className="flex items-center font-black leading-none tracking-tight">
        {/* Number 1 in vibrant Blue */}
        <span className={`${sizeClasses.number} text-[#0080ff] font-extrabold`}>1</span>
        
        {/* First 0 in Warm Yellow / Gold */}
        <span className={`${sizeClasses.number} text-[#f59e0b] font-extrabold mx-[1px]`}>0</span>
        
        {/* Second 0 in Green with Speech Bubble interior */}
        <div className="relative inline-flex items-center justify-center">
          <span className={`${sizeClasses.number} text-[#00a86b] font-extrabold`}>0</span>
          {/* Subtle speech bubble dots in the counter */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[7px] sm:text-[9px] font-bold text-white tracking-tighter opacity-90">•••</span>
          </div>
        </div>
      </div>

      {/* VOZES DA CIDADE */}
      <div className="flex flex-col items-center mt-0.5">
        <span
          className={`font-black uppercase leading-tight ${sizeClasses.vozes} ${
            isDark ? 'text-white' : 'text-[#111e32]'
          }`}
        >
          VOZES
        </span>
        <span
          className={`font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] -mt-0.5 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          DA CIDADE
        </span>
      </div>

      {/* Vitória do Xingu subtitle */}
      {showSubtitle && (
        <span
          className={`italic font-serif font-medium mt-0.5 ${sizeClasses.sub} ${
            isDark ? 'text-[#00c982]' : 'text-[#00a86b]'
          }`}
        >
          Vitória do Xingu
        </span>
      )}
    </div>
  );
};
