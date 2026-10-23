import React from 'react';

interface TadmiLogoProps {
  /** 'full' renders the complete TADMI wordmark; 'icon' renders the signature A-mark with the coral dot */
  variant?: 'full' | 'icon';
  /** Height in pixels or CSS value. Defaults to 24 for full, 24 for icon */
  height?: number | string;
  /** Primary text/stroke color. Defaults to currentColor */
  color?: string;
  /** Accent dot color. Defaults to #EA5B2D */
  accentColor?: string;
  /** Optional extra CSS class */
  className?: string;
}

export const TadmiLogo: React.FC<TadmiLogoProps> = ({
  variant = 'full',
  height,
  color = 'currentColor',
  accentColor = '#EA5B2D',
  className = '',
}) => {
  if (variant === 'icon') {
    const h = height ?? 26;
    return (
      <svg
        className={`tadmi-logo-icon ${className}`}
        height={h}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ verticalAlign: 'middle', flexShrink: 0 }}
        aria-label="Tadmi Logo Icon"
      >
        {/* Signature A-chevron */}
        <polyline
          points="6,38 22,6 38,38"
          stroke={color}
          strokeWidth="4.6"
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
        {/* Accent dot */}
        <circle cx="22" cy="32" r="3.6" fill={accentColor} />
      </svg>
    );
  }

  const h = height ?? 24;
  return (
    <svg
      className={`tadmi-logo-full ${className}`}
      height={h}
      viewBox="0 0 216 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
      aria-label="TADMI"
    >
      {/* T */}
      <line x1="4" y1="6" x2="42" y2="6" stroke={color} strokeWidth="4.2" strokeLinecap="butt" />
      <line x1="23" y1="6" x2="23" y2="38" stroke={color} strokeWidth="4.2" strokeLinecap="butt" />

      {/* A */}
      <polyline
        points="52,38 69.5,6 87,38"
        stroke={color}
        strokeWidth="4.2"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      {/* A orange accent dot */}
      <circle cx="69.5" cy="32" r="3.5" fill={accentColor} />

      {/* D (Modern open curve) */}
      <path
        d="M 98 6 L 115 6 A 16 16 0 0 1 115 38 L 98 38"
        stroke={color}
        strokeWidth="4.2"
        strokeLinecap="butt"
        fill="none"
      />

      {/* M */}
      <polyline
        points="140,38 140,6 159,27 178,6 178,38"
        stroke={color}
        strokeWidth="4.2"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        fill="none"
      />

      {/* I */}
      <line x1="192" y1="6" x2="192" y2="38" stroke={color} strokeWidth="4.2" strokeLinecap="butt" />
    </svg>
  );
};

export default TadmiLogo;
