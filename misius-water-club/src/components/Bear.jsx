import { moodFor } from '../utils.js';

const DARK = '#4a2f22';
const FACE = '#e8b58a';
const FACE_EDGE = '#b9814f';

function Eyes({ mood }) {
  if (mood === 'sleepy')
    return (
      <g stroke={DARK} strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d="M76 147 q8 7 16 0" />
        <path d="M108 147 q8 7 16 0" />
      </g>
    );
  if (mood === 'waking')
    return (
      <g fill={DARK}>
        <ellipse cx="84" cy="147" rx="5" ry="3.4" />
        <ellipse cx="116" cy="147" rx="5" ry="3.4" />
      </g>
    );
  if (mood === 'celebrating')
    return (
      <g stroke={DARK} strokeWidth="3.5" fill="none" strokeLinecap="round">
        <path d="M76 150 q8 -10 16 0" />
        <path d="M108 150 q8 -10 16 0" />
      </g>
    );
  const r = mood === 'excited' ? 6.8 : 5.6;
  return (
    <g>
      <circle cx="84" cy="146" r={r} fill={DARK} />
      <circle cx="116" cy="146" r={r} fill={DARK} />
      <circle cx="86" cy="143.8" r="2" fill="#fff" />
      <circle cx="118" cy="143.8" r="2" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }) {
  const line = { stroke: DARK, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' };
  if (mood === 'sleepy') return <path d="M94 173 q6 3 12 0" {...line} />;
  if (mood === 'waking') return <path d="M91 171 q9 7 18 0" {...line} />;
  if (mood === 'happy') return <path d="M90 169 q10 10 20 0" {...line} />;
  return (
    <g>
      <path d="M89 169 q11 17 22 0 z" fill="#7a2e3a" stroke={DARK} strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="100" cy="175" rx="5" ry="2.6" fill="#ff9bb5" />
    </g>
  );
}

export default function Bear({ pct, bumpKey = 0, onTap, size = 210 }) {
  const mood = moodFor(pct);
  const level = Math.max(0, Math.min(pct, 100));
  const waterY = 228 - (218 * level) / 100;
  const blush = mood !== 'sleepy';
  const hearts = mood === 'excited' || mood === 'celebrating';

  return (
    <button type="button" className="bear-btn" onClick={onTap} aria-label="Tap the bear for a message">
      <svg className="bear-svg" viewBox="0 0 200 240" width={size} height={size * 1.2} role="img" aria-label={`Teddy bear, ${mood}`}>
        <defs>
          <clipPath id="drop-clip">
            <path d="M100 10 C100 10 22 98 22 150 A78 78 0 0 0 178 150 C178 98 100 10 100 10 Z" />
          </clipPath>
          <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a9d4ff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#5c9df0" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <path d="M100 10 C100 10 22 98 22 150 A78 78 0 0 0 178 150 C178 98 100 10 100 10 Z" fill="rgba(255,255,255,0.1)" />

        <g clipPath="url(#drop-clip)">
          <g style={{ transform: `translateY(${waterY}px)`, transition: 'transform 0.9s cubic-bezier(0.3, 0.8, 0.3, 1)', opacity: level === 0 ? 0 : 1 }}>
            <g className="wave-move">
              <path d="M-100 0 Q-75 -8 -50 0 T0 0 T50 0 T100 0 T150 0 T200 0 T250 0 T300 0 T350 0 V320 H-100 Z" fill="url(#water-grad)" />
            </g>
          </g>
        </g>

        <path d="M100 10 C100 10 22 98 22 150 A78 78 0 0 0 178 150 C178 98 100 10 100 10 Z" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3" />
        <path d="M44 128 q-7 24 -2 44" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="4" strokeLinecap="round" />

        <g key={bumpKey} className={bumpKey ? 'bear-bump' : ''}>
          <g className={`bear-face ${mood}`}>
            {mood === 'celebrating' && (
              <g fill={FACE} stroke={FACE_EDGE} strokeWidth="3">
                <ellipse cx="48" cy="150" rx="9" ry="15" transform="rotate(-25 48 150)" />
                <ellipse cx="152" cy="150" rx="9" ry="15" transform="rotate(25 152 150)" />
              </g>
            )}
            <circle cx="68" cy="116" r="15" fill={FACE} stroke={FACE_EDGE} strokeWidth="3" />
            <circle cx="132" cy="116" r="15" fill={FACE} stroke={FACE_EDGE} strokeWidth="3" />
            <circle cx="68" cy="116" r="8" fill="#ffc2d6" />
            <circle cx="132" cy="116" r="8" fill="#ffc2d6" />
            <circle cx="100" cy="152" r="44" fill={FACE} stroke={FACE_EDGE} strokeWidth="3" />
            <ellipse cx="100" cy="166" rx="20" ry="15" fill="#fbe3c8" />
            {blush && (
              <g fill="#ff8fb0" opacity={mood === 'waking' ? 0.35 : 0.6}>
                <ellipse cx="72" cy="164" rx="8" ry="5" />
                <ellipse cx="128" cy="164" rx="8" ry="5" />
              </g>
            )}
            <Eyes mood={mood} />
            <ellipse cx="100" cy="159" rx="7" ry="5" fill="#5a3a2a" />
            <Mouth mood={mood} />
            {mood === 'celebrating' && (
              <g transform="rotate(8 100 112)">
                <path d="M82 112 L100 70 L118 112 Z" fill="#ffc2d6" stroke="#e58aa9" strokeWidth="2.5" strokeLinejoin="round" />
                <circle cx="95" cy="98" r="2.6" fill="#fff6e9" />
                <circle cx="105" cy="90" r="2.6" fill="#cdb8ff" />
                <circle cx="100" cy="68" r="6" fill="#fff6e9" />
              </g>
            )}
          </g>
        </g>

        {mood === 'sleepy' && (
          <g>
            <text x="138" y="112" className="zzz z1" fontSize="20">z</text>
            <text x="150" y="96" className="zzz z2" fontSize="26">Z</text>
            <text x="164" y="76" className="zzz z3" fontSize="32">Z</text>
          </g>
        )}
        {hearts && (
          <g fontSize="18">
            <text x="34" y="112" className="heart h1">❤</text>
            <text x="156" y="104" className="heart h2">❤</text>
            <text x="96" y="60" className="heart h3">❤</text>
          </g>
        )}
        {mood === 'celebrating' && (
          <g fontSize="18">
            <text x="22" y="70" className="heart h2">✨</text>
            <text x="164" y="60" className="heart h1">✨</text>
          </g>
        )}
      </svg>
    </button>
  );
}
