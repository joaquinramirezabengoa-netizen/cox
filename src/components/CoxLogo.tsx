import React from 'react';

interface CoxLogoProps {
  className?: string;
}

export default function CoxLogo({ className = 'w-full h-auto' }: CoxLogoProps) {
  return (
    <svg
      viewBox="0 0 600 250"
      className={`cox-logo-svg ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Colorful gradient for the 'O' ring that perfectly matches the official COX brand identity */}
        <linearGradient id="cox-brand-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e11d48" /> {/* Coral Red */}
          <stop offset="35%" stopColor="#f43f5e" /> {/* Soft Rose */}
          <stop offset="70%" stopColor="#06b6d4" /> {/* Cyan/Turquoise */}
          <stop offset="100%" stopColor="#1d2d9c" /> {/* COX Blue */}
        </linearGradient>

        {/* Clip path to ensure the X letter stays perfectly flat at the top and bottom boundaries */}
        <clipPath id="cox-letter-clip">
          <rect x="380" y="45" width="200" height="160" rx="2" />
        </clipPath>
      </defs>

      <g id="cox-logo-artwork" strokeLinecap="round" strokeLinejoin="round">
        {/* Letter C (Vibrant Brand Navy Blue) */}
        <path
          d="M 175,80 A 80,80 0 1,0 175,170"
          fill="none"
          stroke="#1d2d9c"
          strokeWidth="38"
          strokeLinecap="butt"
        />

        {/* Letter O (Vibrant Brand Gradient Ring) */}
        <circle
          cx="300"
          cy="125"
          r="80"
          fill="none"
          stroke="url(#cox-brand-gradient)"
          strokeWidth="38"
        />

        {/* Inner brand signature dot (Aperture Lens Circle) */}
        <circle
          cx="345"
          cy="125"
          r="15"
          fill="#ffffff"
          stroke="none"
        />

        {/* Letter X (Vibrant Brand Navy Blue) clipped to guarantee flat horizontal boundaries */}
        <g clipPath="url(#cox-letter-clip)">
          <line
            x1="415"
            y1="40"
            x2="545"
            y2="210"
            stroke="#1d2d9c"
            strokeWidth="38"
            strokeLinecap="butt"
          />
          <line
            x1="545"
            y1="40"
            x2="415"
            y2="210"
            stroke="#1d2d9c"
            strokeWidth="38"
            strokeLinecap="butt"
          />
        </g>
      </g>
    </svg>
  );
}
