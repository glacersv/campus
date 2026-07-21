import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function InstitutionLogo({ className = "w-16 h-16", showText = false }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  // Stable, official redirector of the school's Facebook profile picture (the original institutional logo)
  const originalLogoUrl = "https://graph.facebook.com/colegiosalesianosanjosesantaana/picture?type=large";

  return (
    <div className="flex items-center gap-3">
      {!imgError ? (
        <img
          src={originalLogoUrl}
          alt="Escudo Oficial Colegio Salesiano San José"
          className={`${className} object-contain shrink-0`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg
          className={`${className} shrink-0`}
          viewBox="0 0 200 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Slanted Flagpole / Cross Rod extending from bottom to top-right */}
          <line x1="120" y1="175" x2="105" y2="20" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />

          {/* Arched banner "AD ASTRA" on top of the flagpole */}
          <g transform="translate(10, 5)">
            {/* Top thick line */}
            <path
              d="M 50 35 L 140 50"
              stroke="#1E293B"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Bottom underline */}
            <path
              d="M 45 42 L 135 57"
              stroke="#1E293B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <text
              x="92"
              y="35"
              fontSize="14"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              fill="#1E293B"
              transform="rotate(9.5 92 35)"
              textAnchor="middle"
              letterSpacing="1.5"
            >
              AD ASTRA
            </text>
          </g>

          {/* Shield Structure */}
          <g transform="translate(10, 15)">
            <clipPath id="shield-clip-new">
              <path d="M 25 45 Q 90 62 155 45 C 155 45 155 135 90 175 C 25 135 25 45 25 45 Z" />
            </clipPath>

            {/* Shield Base Fill & Stroke */}
            <path
              d="M 25 45 Q 90 62 155 45 C 155 45 155 135 90 175 C 25 135 25 45 25 45 Z"
              fill="#FFFFFF"
              stroke="#1E293B"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Clipped shield details */}
            <g clipPath="url(#shield-clip-new)">
              {/* Left background: Royal Blue (Salvadoran Flag Motif) */}
              <rect x="0" y="0" width="90" height="200" fill="#0D71B9" />
              {/* White horizontal bar in the middle */}
              <rect x="0" y="80" width="90" height="32" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />

              {/* Right background: Forest Green */}
              <rect x="90" y="0" width="90" height="200" fill="#12562E" />

              {/* 4 Golden Stars on Green Side */}
              {/* Star 1 (Center Left) */}
              <path d="M 112 70 L 114 75 L 120 76 L 114 77 L 112 82 L 110 77 L 104 76 L 110 75 Z" fill="#FAB700" />
              {/* Star 2 (Large Center) */}
              <path d="M 145 78 L 148.5 85 L 157 87 L 148.5 89 L 145 96 L 141.5 89 L 133 87 L 141.5 85 Z" fill="#FAB700" />
              {/* Star 3 (Top Right) */}
              <path d="M 165 55 L 166.5 60 L 171 61 L 166.5 62 L 165 67 L 163.5 62 L 159 61 L 163.5 60 Z" fill="#FAB700" />
              {/* Star 4 (Bottom Center) */}
              <path d="M 115 120 L 117 124 L 122 125 L 117 126 L 115 130 L 113 126 L 108 125 L 113 124 Z" fill="#FAB700" />

              {/* Black Silhouette of climbing student pointing up */}
              <path
                d="M 98 160 
                   C 102 150, 105 135, 101 120 
                   C 97 114, 91 112, 85 106
                   C 92 106, 99 104, 103 108
                   C 108 112, 114 125, 117 132
                   C 120 135, 126 138, 128 135
                   C 122 130, 118 115, 116 110
                   C 114 105, 124 102, 128 98
                   C 132 94, 128 92, 122 95
                   C 116 98, 112 106, 110 110
                   L 109 103 L 105 100 L 103 103 Z"
                fill="#1E293B"
              />
              {/* Head of silhouette */}
              <circle cx="122" cy="98" r="5" fill="#1E293B" />

              {/* Yellow Diagonal Ribbon wrapped on lower left curve */}
              <g transform="rotate(-33 50 140)">
                <rect x="0" y="125" width="120" height="24" fill="#FAB700" stroke="#1E293B" strokeWidth="2" />
                <text
                  x="55"
                  y="142"
                  fontSize="12"
                  fontWeight="900"
                  fontFamily="Arial, sans-serif"
                  fill="#1E293B"
                  textAnchor="middle"
                  letterSpacing="1"
                >
                  SAN JOSÉ
                </text>
              </g>
            </g>
          </g>
        </svg>
      )}
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold font-display tracking-tight text-slate-100 leading-tight">
            Colegio Salesiano
          </span>
          <span className="text-base font-extrabold font-display tracking-tight text-salesiano-yellow leading-none">
            San José
          </span>
        </div>
      )}
    </div>
  );
}

