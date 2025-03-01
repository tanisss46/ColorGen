import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ onClick }) => {
  return (
    <Link to="/" className="cursor-pointer" onClick={onClick}>
      <svg viewBox="0 0 340 80" xmlns="http://www.w3.org/2000/svg" className="w-[285px] h-[64px] -mt-1">
        <defs>
          <linearGradient id="softGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#94A3B8' }} />
            <stop offset="100%" style={{ stopColor: '#64748B' }} />
          </linearGradient>
        </defs>
        
        {/* Main logo group */}
        <g transform="translate(10,25)"> 
          {/* Playful color dots */}
          <g transform="translate(0,25)">
            <circle cx="15" cy="0" r="8" fill="#FDA4AF" opacity="0.9" />
            <circle cx="35" cy="0" r="8" fill="#93C5FD" opacity="0.9" />
            <circle cx="55" cy="0" r="8" fill="#86EFAC" opacity="0.9" />
          </g>
          
          {/* "colorgen" text */}
          <text x="75" y="35" style={{
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontWeight: 400,
            fontSize: '38px',
            letterSpacing: '-0.5px'
          }}>
            <tspan fill="#334155">color</tspan>
            <tspan fill="#64748B">gen</tspan>
          </text>
          
          {/* Domain dot */}
          <circle cx="238" cy="32" r="3.5" fill="#FDA4AF" opacity="0.9" />
          
          {/* "co" text with space */}
          <text x="248" y="35" style={{
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontWeight: 300,
            fontSize: '38px'
          }}>
            <tspan fill="#94A3B8">co</tspan>
          </text>
          
          {/* Tagline */}
          <text x="75" y="80" style={{
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: '16px',
            fontWeight: 300,
            letterSpacing: '1px'
          }} fill="#94A3B8">
            create your palette
          </text>
        </g>
      </svg>
    </Link>
  );
};

export default Logo;
