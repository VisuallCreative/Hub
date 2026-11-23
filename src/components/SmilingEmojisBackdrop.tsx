import React from 'react';

export default function SmilingEmojisBackdrop() {
  return (
    <div
      id="pkxd-emoji-backdrop"
      data-testid="pkxd-emoji-backdrop"
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
    >
      {/* Subtle violet & magenta ambient depth glows */}
      <div
        className="absolute -top-28 -left-24 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-45"
        style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.34) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-28 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-35"
        style={{ background: 'radial-gradient(circle, rgba(232, 121, 249, 0.25) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 left-1/4 w-[26rem] h-[26rem] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%)' }}
      />

      {/* Signature PK XD watermark pattern at subtle 20% opacity */}
      <svg
        className="w-full h-full opacity-[0.20]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Reusable Laughing XD Face Circle (squinting >< eyes + big D grin cut-out) */}
          <g id="pkxd-xd-face">
            <mask id="xd-face-mask">
              <rect x="-60" y="-60" width="120" height="120" fill="white" />
              {/* Left squinting '>' eye */}
              <path
                d="M -28 -18 L -8 -10 L -26 2"
                fill="none"
                stroke="black"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Right squinting '<' eye */}
              <path
                d="M 28 -18 L 8 -10 L 26 2"
                fill="none"
                stroke="black"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Wide laughing 'D' mouth */}
              <path
                d="M -30 12 Q 0 16 30 12 C 29 34 16 42 0 42 C -16 42 -29 34 -30 12 Z"
                fill="black"
              />
            </mask>
            <circle cx="0" cy="0" r="46" fill="#7C3AED" mask="url(#xd-face-mask)" />
          </g>

          {/* Reusable Spiky Starburst Exclamation Badge */}
          <g id="pkxd-burst-exclaim">
            <mask id="burst-mask">
              <rect x="-60" y="-60" width="120" height="120" fill="white" />
              <rect x="-5.5" y="-23" width="11" height="27" rx="5.5" fill="black" />
              <circle cx="0" cy="17" r="6" fill="black" />
            </mask>
            <polygon
              points="0,-46 10,-32 27,-38 25,-20 43,-16 32,-1 45,14 27,21 29,39 12,33 0,47 -12,33 -29,39 -27,21 -45,14 -32,-1 -43,-16 -25,-20 -27,-38 -10,-32"
              fill="#7C3AED"
              stroke="#7C3AED"
              strokeWidth="4"
              strokeLinejoin="round"
              mask="url(#burst-mask)"
            />
          </g>

          {/* Reusable Rounded Speech Bubble */}
          <g id="pkxd-speech-bubble">
            <path
              d="M -34 -22 C -34 -32 -26 -38 -14 -38 L 16 -38 C 28 -38 36 -30 36 -18 L 36 8 C 36 20 28 28 16 28 L -10 28 L -28 40 L -23 24 C -30 20 -34 14 -34 6 Z"
              fill="#7C3AED"
            />
          </g>

          <pattern
            id="pkxd-emoji-tile"
            width="420"
            height="420"
            patternUnits="userSpaceOnUse"
          >
            {/* Top-left Burst '!' */}
            <use href="#pkxd-burst-exclaim" transform="translate(66, 72) rotate(-14) scale(0.88)" />
            {/* Top-center XD face */}
            <use href="#pkxd-xd-face" transform="translate(216, 68) rotate(-18) scale(0.95)" />
            {/* Top-right Speech Bubble */}
            <use href="#pkxd-speech-bubble" transform="translate(362, 86) rotate(12) scale(0.76)" />

            {/* Middle-left Speech Bubble */}
            <use href="#pkxd-speech-bubble" transform="translate(52, 212) rotate(-10) scale(0.72)" />
            {/* Middle-center Burst '!' */}
            <use href="#pkxd-burst-exclaim" transform="translate(188, 224) rotate(16) scale(0.92)" />
            {/* Middle-right XD face */}
            <use href="#pkxd-xd-face" transform="translate(338, 206) rotate(14) scale(1.0)" />

            {/* Bottom-left XD face */}
            <use href="#pkxd-xd-face" transform="translate(92, 344) rotate(11) scale(0.94)" />
            {/* Bottom-center Speech Bubble */}
            <use href="#pkxd-speech-bubble" transform="translate(244, 346) rotate(8) scale(0.82)" />
            {/* Bottom-right Burst '!' */}
            <use href="#pkxd-burst-exclaim" transform="translate(370, 352) rotate(-12) scale(0.82)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pkxd-emoji-tile)" />
      </svg>
    </div>
  );
}
