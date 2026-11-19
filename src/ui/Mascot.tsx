import { cn } from './cn';

export type MascotMood = 'happy' | 'thinking' | 'cheering' | 'sleepy';

export interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  float?: boolean;
}

const INK = '#3D2C4E';

/** Mellow: a soft marshmallow sprout who cheers learners on. */
export function Mascot({ mood = 'happy', size = 120, className, float = true }: MascotProps) {
  const eyeY = mood === 'thinking' ? 68 : 70;
  return (
    <svg
      role="img"
      aria-label={`Mellow the mascot, feeling ${mood}`}
      viewBox="0 0 120 130"
      width={size}
      height={size * (130 / 120)}
      className={cn(float && 'animate-float', 'drop-shadow-[0_12px_18px_rgba(160,100,170,0.25)]', className)}
    >
      <defs>
        <linearGradient id="mellow-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF0F5" />
          <stop offset="1" stopColor="#FFC6D9" />
        </linearGradient>
        <linearGradient id="mellow-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B9F3D0" />
          <stop offset="1" stopColor="#7FD8A8" />
        </linearGradient>
      </defs>

      {/* sprout */}
      <path d="M60 26 C60 16 60 12 60 8" stroke="#7FD8A8" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M60 12 C48 2 38 8 40 16 C48 20 56 18 60 12Z" fill="url(#mellow-leaf)" />
      <path d="M60 12 C72 2 82 8 80 16 C72 20 64 18 60 12Z" fill="url(#mellow-leaf)" />

      {/* arms */}
      {mood === 'cheering' ? (
        <>
          <path d="M22 70 Q10 50 16 40" stroke="#FFC6D9" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M98 70 Q110 50 104 40" stroke="#FFC6D9" strokeWidth="10" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse cx="18" cy="82" rx="8" ry="12" fill="#FFC6D9" />
          <ellipse cx="102" cy="82" rx="8" ry="12" fill="#FFC6D9" />
        </>
      )}

      {/* body */}
      <path
        d="M60 24 C88 24 106 44 106 74 C106 104 86 122 60 122 C34 122 14 104 14 74 C14 44 32 24 60 24Z"
        fill="url(#mellow-body)"
      />
      <ellipse cx="46" cy="44" rx="14" ry="8" fill="#FFFFFF" opacity="0.6" />

      {/* eyes */}
      {mood === 'sleepy' ? (
        <>
          <path d="M38 72 q6 5 12 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M70 72 q6 5 12 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <g className="animate-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <ellipse cx="44" cy={eyeY} rx="6" ry="8" fill={INK} />
          <ellipse cx="76" cy={eyeY} rx="6" ry="8" fill={INK} />
          <circle cx="46" cy={eyeY - 4} r="2.2" fill="#fff" />
          <circle cx="78" cy={eyeY - 4} r="2.2" fill="#fff" />
        </g>
      )}

      {/* cheeks */}
      <ellipse cx="32" cy="86" rx="9" ry="5.5" fill="#FF9EB5" opacity="0.65" />
      <ellipse cx="88" cy="86" rx="9" ry="5.5" fill="#FF9EB5" opacity="0.65" />

      {/* mouth & extras */}
      {mood === 'happy' && <path d="M52 86 q8 9 16 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />}
      {mood === 'cheering' && <path d="M50 84 q10 16 20 0 z" fill={INK} />}
      {mood === 'thinking' && (
        <>
          <path d="M54 90 q6 -3 12 0" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="98" cy="30" r="5" fill="#CDB4F5" opacity="0.8" />
          <circle cx="108" cy="18" r="3" fill="#CDB4F5" opacity="0.6" />
        </>
      )}
      {mood === 'sleepy' && (
        <>
          <ellipse cx="60" cy="90" rx="4" ry="3" fill={INK} />
          <text x="92" y="36" fontFamily="Fredoka, sans-serif" fontSize="16" fill="#CDB4F5">
            z
          </text>
        </>
      )}
    </svg>
  );
}
