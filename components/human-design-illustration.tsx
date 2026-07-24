'use client';

import type { HumanDesignResult } from '@/types';

/** Optional decorative bodygraph-style illustration (not authoritative chart). */
export function HumanDesignIllustration({ profile }: { profile: HumanDesignResult }) {
  const defined = new Set(profile.centers.defined.map((c) => c.toLowerCase()));

  const nodes = [
    { id: 'head', label: 'Head', x: 50, y: 8, key: 'head' },
    { id: 'ajna', label: 'Ajna', x: 50, y: 22, key: 'ajna' },
    { id: 'throat', label: 'Throat', x: 50, y: 36, key: 'throat' },
    { id: 'g', label: 'G', x: 50, y: 50, key: 'g' },
    { id: 'heart', label: 'Heart', x: 72, y: 50, key: 'heart' },
    { id: 'spleen', label: 'Spleen', x: 28, y: 58, key: 'spleen' },
    { id: 'solar', label: 'Solar Plexus', x: 72, y: 66, key: 'solar' },
    { id: 'sacral', label: 'Sacral', x: 50, y: 72, key: 'sacral' },
    { id: 'root', label: 'Root', x: 50, y: 88, key: 'root' },
  ];

  const isDefined = (key: string) => {
    if (key === 'solar') return defined.has('solar plexus') || [...defined].some((d) => d.includes('solar'));
    if (key === 'heart') return defined.has('heart (ego)') || defined.has('heart');
    return defined.has(key);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-full max-w-[220px] h-auto" aria-hidden>
        <defs>
          <linearGradient id="hdGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        {nodes.map((n, i) => {
          if (i > 0) {
            const prev = nodes[i - 1];
            return (
              <line
                key={`line-${n.id}`}
                x1={prev.x}
                y1={prev.y + 4}
                x2={n.x}
                y2={n.y - 4}
                stroke="#c7d2fe"
                strokeWidth="1.5"
              />
            );
          }
          return null;
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={isDefined(n.key) ? 6 : 5}
              fill={isDefined(n.key) ? 'url(#hdGlow)' : '#f8fafc'}
              stroke={isDefined(n.key) ? '#4f46e5' : '#cbd5e1'}
              strokeWidth="1.5"
            />
            <text x={n.x} y={n.y + 0.5} textAnchor="middle" fontSize="3" fill={isDefined(n.key) ? '#fff' : '#64748b'}>
              {n.label.split(' ')[0]}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-gray-500 text-center max-w-xs">
        Ilustrasi skematik Human Design — {profile.type} / {profile.profile}
      </p>
    </div>
  );
}
