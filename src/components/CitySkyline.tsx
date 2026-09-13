import React from 'react';

interface Props {
  className?: string;
}

export const CitySkyline: React.FC<Props> = ({ className = 'w-full max-w-[280px] h-auto' }) => {
  return (
    <svg
      viewBox="0 0 400 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ground/Water gentle waves */}
      <path
        d="M0 82C60 80 90 85 150 82C210 79 260 84 320 81C360 79 385 83 400 82"
        stroke="#00a86b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 87C80 85 130 89 190 86C250 83 310 88 380 85"
        stroke="#0080ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Buildings & Landmarks in soft teal/green with blue/yellow accents */}
      {/* Left house */}
      <rect x="25" y="55" width="22" height="25" rx="2" fill="#e8f8f0" stroke="#00a86b" strokeWidth="2" />
      <polygon points="22,55 36,40 50,55" fill="#fef3c7" stroke="#00a86b" strokeWidth="2" />
      <rect x="32" y="65" width="8" height="15" fill="#0080ff" />

      {/* Small tree */}
      <circle cx="62" cy="62" r="10" fill="#a7f3d0" stroke="#00a86b" strokeWidth="2" />
      <rect x="60.5" y="70" width="3" height="11" fill="#78350f" />

      {/* Commercial / Town Hall Block */}
      <rect x="78" y="44" width="30" height="36" rx="2" fill="#e0f2fe" stroke="#00a86b" strokeWidth="2" />
      {/* Windows */}
      <rect x="83" y="50" width="6" height="6" fill="#0080ff" />
      <rect x="97" y="50" width="6" height="6" fill="#0080ff" />
      <rect x="83" y="60" width="6" height="6" fill="#0080ff" />
      <rect x="97" y="60" width="6" height="6" fill="#0080ff" />
      <rect x="90" y="70" width="7" height="10" fill="#00a86b" />

      {/* Palm Tree (Amazonian symbol) */}
      <path d="M125 80 Q127 50 132 38" stroke="#00a86b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M132 38 Q118 32 110 40" stroke="#00a86b" strokeWidth="2" strokeLinecap="round" />
      <path d="M132 38 Q125 24 118 20" stroke="#00a86b" strokeWidth="2" strokeLinecap="round" />
      <path d="M132 38 Q140 22 148 24" stroke="#00a86b" strokeWidth="2" strokeLinecap="round" />
      <path d="M132 38 Q150 35 154 44" stroke="#00a86b" strokeWidth="2" strokeLinecap="round" />

      {/* Modern civic tower / Belo Monte / Obelisk center icon */}
      <path d="M178 80 L188 22 L198 80 Z" fill="#e8f8f0" stroke="#00a86b" strokeWidth="2" />
      <circle cx="188" cy="18" r="5" fill="#f59e0b" stroke="#00a86b" strokeWidth="1.5" />
      <line x1="184" y1="52" x2="192" y2="52" stroke="#00a86b" strokeWidth="2" />
      <line x1="182" y1="64" x2="194" y2="64" stroke="#00a86b" strokeWidth="2" />

      {/* Church / Chapel with Cross */}
      <rect x="215" y="48" width="34" height="32" rx="2" fill="#fff" stroke="#00a86b" strokeWidth="2" />
      <polygon points="212,48 232,28 252,48" fill="#e0f2fe" stroke="#00a86b" strokeWidth="2" />
      {/* Small spire & cross */}
      <rect x="230" y="16" width="4" height="12" fill="#0080ff" />
      <line x1="228" y1="20" x2="236" y2="20" stroke="#0080ff" strokeWidth="2" />
      <path d="M228 66 A4 4 0 0 1 236 66 L236 80 L228 80 Z" fill="#00a86b" />

      {/* Tree cluster */}
      <circle cx="265" cy="60" r="12" fill="#a7f3d0" stroke="#00a86b" strokeWidth="2" />
      <circle cx="278" cy="65" r="9" fill="#6ee7b7" stroke="#00a86b" strokeWidth="2" />
      <rect x="264" y="70" width="3" height="10" fill="#78350f" />

      {/* Urban Apartments / School */}
      <rect x="296" y="38" width="36" height="42" rx="2" fill="#fef3c7" stroke="#00a86b" strokeWidth="2" />
      <rect x="302" y="44" width="5" height="5" fill="#f59e0b" />
      <rect x="312" y="44" width="5" height="5" fill="#f59e0b" />
      <rect x="322" y="44" width="5" height="5" fill="#f59e0b" />
      <rect x="302" y="54" width="5" height="5" fill="#f59e0b" />
      <rect x="312" y="54" width="5" height="5" fill="#f59e0b" />
      <rect x="322" y="54" width="5" height="5" fill="#f59e0b" />
      <rect x="302" y="64" width="5" height="5" fill="#f59e0b" />
      <rect x="312" y="64" width="5" height="5" fill="#f59e0b" />
      <rect x="322" y="64" width="5" height="5" fill="#f59e0b" />

      {/* Right Houses & Trees */}
      <polygon points="340,58 354,45 368,58" fill="#e8f8f0" stroke="#00a86b" strokeWidth="2" />
      <rect x="343" y="58" width="22" height="22" rx="1" fill="#fff" stroke="#00a86b" strokeWidth="2" />
      <circle cx="382" cy="65" r="10" fill="#a7f3d0" stroke="#00a86b" strokeWidth="2" />
    </svg>
  );
};
