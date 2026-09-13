import React from 'react';

interface Props {
  className?: string;
}

export const PanoramicBanner: React.FC<Props> = ({ className }) => {
  return (
    <div
      className={
        className ||
        "relative w-full aspect-[16/9] max-h-52 sm:max-h-56 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 group"
      }
    >
      {/* High definition photographic-quality scenic Amazon river & town representation */}
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 640 360"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#bae6fd" />
            <stop offset="65%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
          
          <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="0.8">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="35%" stopColor="#0369a1" />
            <stop offset="70%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>

          <linearGradient id="forestGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          <linearGradient id="forestGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>

          <linearGradient id="shoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <radialGradient id="sunGlow" cx="0.85" cy="0.2" r="0.4">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#fef08a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky with soft Amazonian morning sunlight */}
        <rect width="640" height="360" fill="url(#skyGrad)" />
        <rect width="640" height="200" fill="url(#sunGlow)" />

        {/* Soft Distant Clouds */}
        <path d="M40 70 Q70 50 110 65 Q140 45 190 60 Q230 75 250 85 L20 85 Z" fill="#ffffff" opacity="0.4" />
        <path d="M380 50 Q430 35 480 50 Q520 40 570 55 L350 70 Z" fill="#ffffff" opacity="0.5" />

        {/* Distant rainforest hills across the Xingu River */}
        <path d="M0 140 Q150 125 320 135 Q480 120 640 138 L640 165 L0 165 Z" fill="#1e3a2b" opacity="0.6" />
        <path d="M0 150 Q180 138 360 148 Q520 136 640 152 L640 175 L0 175 Z" fill="#14532d" opacity="0.8" />

        {/* The Great Xingu River - wide curves */}
        <path
          d="M0 168 Q180 155 350 170 Q510 158 640 172 L640 280 Q450 260 280 290 Q120 310 0 285 Z"
          fill="url(#waterGrad)"
        />

        {/* River reflections & water glimmer */}
        <path d="M120 195 C200 190 280 205 380 195" stroke="#7dd3fc" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
        <path d="M220 220 C320 215 420 230 540 218" stroke="#38bdf8" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
        <path d="M60 240 C160 232 260 248 360 238" stroke="#bae6fd" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
        <path d="M340 255 C420 250 510 262 600 252" stroke="#e0f2fe" strokeWidth="2" opacity="0.6" strokeLinecap="round" />

        {/* Small river boats (Voadeiras / Barcos do Xingu) */}
        <path d="M260 215 L285 215 L290 212 L265 212 Z" fill="#ffffff" />
        <path d="M272 208 L275 212" stroke="#ef4444" strokeWidth="1.5" />
        <circle cx="280" cy="210" r="1.5" fill="#f59e0b" />
        {/* Boat wake */}
        <path d="M255 216 Q245 218 235 220" stroke="#bae6fd" strokeWidth="1.5" opacity="0.6" />

        <path d="M440 240 L460 240 L464 238 L444 238 Z" fill="#f8fafc" />
        <path d="M448 235 L450 238" stroke="#0284c7" strokeWidth="1.5" />

        {/* Vitória do Xingu Urban Shoreline & Lush Canopy */}
        <path
          d="M0 270 Q140 255 300 272 Q460 252 640 265 L640 360 L0 360 Z"
          fill="url(#forestGrad1)"
        />

        {/* Riverbank red clay/soil line (Barro amazônico) */}
        <path
          d="M0 270 Q140 255 300 272 Q460 252 640 265 L640 276 Q460 263 300 282 Q140 266 0 279 Z"
          fill="url(#shoreGrad)"
        />

        {/* Town canopy trees & vegetation puffs */}
        <ellipse cx="60" cy="300" rx="35" ry="25" fill="url(#forestGrad2)" />
        <ellipse cx="120" cy="295" rx="40" ry="28" fill="#15803d" />
        <ellipse cx="200" cy="310" rx="45" ry="30" fill="url(#forestGrad2)" />
        <ellipse cx="360" cy="305" rx="50" ry="32" fill="#166534" />
        <ellipse cx="490" cy="295" rx="45" ry="30" fill="url(#forestGrad2)" />
        <ellipse cx="580" cy="305" rx="40" ry="28" fill="#15803d" />

        {/* Waterfront houses and municipal buildings */}
        {/* House 1 */}
        <rect x="75" y="275" width="22" height="18" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
        <polygon points="72,275 86,263 100,275" fill="#ef4444" />

        {/* House 2 */}
        <rect x="150" y="280" width="26" height="20" fill="#fef08a" stroke="#334155" strokeWidth="1" />
        <polygon points="147,280 163,267 179,280" fill="#b91c1c" />

        {/* Modern Civic Building / Orla de Vitória do Xingu */}
        <rect x="235" y="265" width="48" height="30" rx="2" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
        <rect x="240" y="270" width="10" height="8" fill="#0284c7" />
        <rect x="255" y="270" width="10" height="8" fill="#0284c7" />
        <rect x="270" y="270" width="8" height="8" fill="#0284c7" />
        <rect x="254" y="283" width="10" height="12" fill="#00a86b" />

        {/* Palm trees along the avenue */}
        <path d="M190 285 Q192 265 195 255" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
        <circle cx="195" cy="254" r="7" fill="#22c55e" opacity="0.9" />

        <path d="M295 280 Q297 262 300 252" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
        <circle cx="300" cy="251" r="8" fill="#22c55e" opacity="0.9" />

        <path d="M420 275 Q422 258 426 248" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
        <circle cx="426" cy="247" r="7" fill="#22c55e" opacity="0.9" />

        {/* Church spire and cross */}
        <rect x="315" y="268" width="24" height="25" fill="#ffffff" stroke="#334155" strokeWidth="1" />
        <polygon points="312,268 327,248 342,268" fill="#0284c7" />
        <line x1="327" y1="242" x2="327" y2="248" stroke="#ffffff" strokeWidth="2" />
        <line x1="324" y1="245" x2="330" y2="245" stroke="#ffffff" strokeWidth="1.5" />

        {/* Pier / Trapiche de Vitória do Xingu extending into water */}
        <rect x="250" y="258" width="6" height="16" fill="#78350f" />
        <rect x="246" y="252" width="14" height="6" fill="#b45309" />
        <circle cx="249" cy="250" r="2" fill="#ffffff" />
      </svg>

      {/* Subtle overlay pill badge indicating the location */}
      <div className="absolute bottom-2.5 right-3 bg-black/45 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Vitória do Xingu — Pará</span>
      </div>
    </div>
  );
};
