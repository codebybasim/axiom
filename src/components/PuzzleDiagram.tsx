import React from 'react';
import { PuzzleId } from '../types/puzzle';

interface PuzzleDiagramProps {
  id: PuzzleId;
  accentColor: string;
}

export const PuzzleDiagram: React.FC<PuzzleDiagramProps> = ({ id, accentColor }) => {
  const renderArt = () => {
    switch (id) {
      case 'traffic':
        return (
          <g>
            <rect x="28" y="14" width="104" height="62" rx="6" fill="#131926" stroke="#334155" strokeWidth="1.5" />
            <rect x="34" y="38" width="38" height="14" rx="4" fill="#F43F5E" />
            <rect x="82" y="20" width="14" height="36" rx="4" fill="#38BDF8" />
            <rect x="44" y="56" width="38" height="14" rx="4" fill="#F59E0B" />
            <rect x="104" y="34" width="14" height="36" rx="4" fill="#10B981" />
            <path d="M 134 45 L 146 45 M 141 40 L 146 45 L 141 50" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      case 'lasermirrors':
        return (
          <g>
            <rect x="28" y="14" width="104" height="62" rx="6" fill="#101522" stroke="#334155" strokeWidth="1.5" />
            <circle cx="40" cy="28" r="5" fill="#38BDF8" />
            <polyline points="40,28 112,28 112,62 66,62" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="106" y1="22" x2="118" y2="34" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            <line x1="106" y1="68" x2="118" y2="56" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            <polygon points="66,55 73,62 66,69 59,62" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
            <rect x="68" y="38" width="16" height="12" rx="2" fill="#334155" />
          </g>
        );
      case 'flowconnect':
        return (
          <g>
            <rect x="30" y="14" width="100" height="62" rx="6" fill="#101522" stroke="#334155" strokeWidth="1.5" />
            <polyline points="44,26 80,26 80,62" fill="none" stroke="#F43F5E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="44,44 62,44 62,62" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="98,26 116,26 116,62" fill="none" stroke="#10B981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="44" cy="26" r="5" fill="#F43F5E" stroke="#fff" strokeWidth="1.5" />
            <circle cx="80" cy="62" r="5" fill="#F43F5E" stroke="#fff" strokeWidth="1.5" />
            <circle cx="44" cy="44" r="5" fill="#38BDF8" stroke="#fff" strokeWidth="1.5" />
            <circle cx="62" cy="62" r="5" fill="#38BDF8" stroke="#fff" strokeWidth="1.5" />
            <circle cx="98" cy="26" r="5" fill="#10B981" stroke="#fff" strokeWidth="1.5" />
            <circle cx="116" cy="62" r="5" fill="#10B981" stroke="#fff" strokeWidth="1.5" />
          </g>
        );
      case 'flasksort':
        return (
          <g>
            {[36, 62, 88, 114].map((x, idx) => (
              <g key={x}>
                <rect x={x - 9} y="20" width="18" height="52" rx="8" fill="#0F1522" stroke="#475569" strokeWidth="1.5" />
                {idx < 3 && (
                  <>
                    <rect x={x - 7} y="56" width="14" height="12" rx="2" fill={['#F43F5E', '#38BDF8', '#10B981'][idx]} />
                    <rect x={x - 7} y="42" width="14" height="12" rx="2" fill={['#38BDF8', '#10B981', '#F43F5E'][idx]} />
                    <rect x={x - 7} y="28" width="14" height="12" rx="2" fill={['#F59E0B', '#F43F5E', '#38BDF8'][idx]} />
                  </>
                )}
              </g>
            ))}
          </g>
        );
      case 'pipeconduit':
        return (
          <g>
            <rect x="30" y="14" width="100" height="62" rx="6" fill="#101522" stroke="#334155" strokeWidth="1.5" />
            <polyline points="44,28 80,28 80,46 114,46 114,62" fill="none" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="80,46 46,46 46,62" fill="none" stroke="#38BDF8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="44" cy="28" r="7" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1.5" />
            <circle cx="114" cy="62" r="6" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
            <circle cx="46" cy="62" r="6" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
          </g>
        );
      case 'untangle':
        return (
          <g>
            <line x1="42" y1="24" x2="118" y2="66" stroke="#FB7185" strokeWidth="2" />
            <line x1="118" y1="24" x2="42" y2="66" stroke="#FB7185" strokeWidth="2" />
            <polyline points="42,24 80,16 118,24 118,66 80,74 42,66 42,24" fill="none" stroke="#34D399" strokeWidth="2" />
            {[
              [42, 24], [80, 16], [118, 24],
              [118, 66], [80, 74], [42, 66],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="5.5" fill="#1E293B" stroke="#34D399" strokeWidth="2" />
            ))}
          </g>
        );
      case 'sokoban':
        return (
          <g>
            <rect x="30" y="14" width="100" height="62" rx="6" fill="#101522" stroke="#334155" strokeWidth="1.5" />
            <rect x="44" y="26" width="16" height="16" rx="3" fill="#F59E0B" stroke="#FDE68A" strokeWidth="1.5" />
            <rect x="98" y="46" width="16" height="16" rx="3" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
            <circle cx="78" cy="34" r="7" fill="#38BDF8" stroke="#fff" strokeWidth="1.5" />
            <circle cx="106" cy="30" r="5" fill="none" stroke="#F59E0B" strokeWidth="2" />
            <rect x="68" y="50" width="16" height="14" rx="2" fill="#334155" />
          </g>
        );
      case 'icedrift':
        return (
          <g>
            <rect x="30" y="14" width="100" height="62" rx="6" fill="#0F182A" stroke="#334155" strokeWidth="1.5" />
            <polyline points="42,62 42,26 114,26 114,54 84,54" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeDasharray="4 3" />
            <circle cx="42" cy="62" r="5.5" fill="#38BDF8" stroke="#fff" strokeWidth="1.5" />
            <polygon points="84,47 91,54 84,61 77,54" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
            <rect x="118" y="20" width="10" height="12" rx="2" fill="#475569" />
            <rect x="70" y="48" width="10" height="12" rx="2" fill="#475569" />
          </g>
        );
      case 'blockfit':
        return (
          <g>
            <rect x="44" y="16" width="72" height="58" rx="6" fill="#101522" stroke="#334155" strokeWidth="1.5" />
            <path d="M 48 20 H 78 V 34 H 63 V 48 H 48 Z" fill="#38BDF8" />
            <path d="M 80 20 H 112 V 48 H 96 V 34 H 80 Z" fill="#F59E0B" />
            <path d="M 48 50 H 78 V 70 H 48 Z" fill="#10B981" />
            <path d="M 80 36 H 94 V 70 H 80 Z" fill="#F43F5E" />
            <path d="M 96 50 H 112 V 70 H 96 Z" fill="#A78BFA" />
          </g>
        );
      case 'onestroke':
        return (
          <g>
            <rect x="32" y="14" width="96" height="62" rx="6" fill="#101522" stroke="#334155" strokeWidth="1.5" />
            <polyline points="44,62 44,26 68,26 68,62 92,62 92,26 116,26 116,62" fill="none" stroke="#2DD4BF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="44" cy="62" r="6" fill="#0F172A" stroke="#2DD4BF" strokeWidth="2.5" />
            <circle cx="116" cy="62" r="6" fill="#2DD4BF" stroke="#fff" strokeWidth="1.5" />
          </g>
        );
      case 'logicgates':
        return (
          <g>
            <rect x="24" y="20" width="22" height="16" rx="4" fill="#10B981" />
            <rect x="24" y="54" width="22" height="16" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
            <line x1="46" y1="28" x2="66" y2="38" stroke="#10B981" strokeWidth="2" />
            <line x1="46" y1="62" x2="66" y2="52" stroke="#475569" strokeWidth="2" />
            <rect x="66" y="30" width="32" height="30" rx="6" fill="#151E30" stroke="#38BDF8" strokeWidth="1.5" />
            <text x="82" y="49" textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700" fill="#E2E8F0">XOR</text>
            <line x1="98" y1="45" x2="116" y2="45" stroke="#10B981" strokeWidth="2.5" />
            <circle cx="124" cy="45" r="8" fill="#10B981" stroke="#A7F3D0" strokeWidth="1.5" />
          </g>
        );
      case 'matchstick':
        return (
          <g>
            <text x="80" y="55" textAnchor="middle" fontSize="28" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#FBBF24">
              8 - 4 = 4
            </text>
            <line x1="34" y1="67" x2="126" y2="67" stroke="#FBBF24" strokeWidth="2" strokeOpacity="0.4" />
          </g>
        );
      case 'mysterygrid':
        return (
          <g>
            <rect x="38" y="14" width="84" height="62" rx="6" fill="#101522" stroke="#334155" strokeWidth="1.5" />
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => {
                const isCheck = r === c;
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={44 + c * 25}
                      y={20 + r * 18}
                      width="20"
                      height="14"
                      rx="3"
                      fill={isCheck ? 'rgba(16,185,129,0.22)' : '#172033'}
                      stroke={isCheck ? '#10B981' : '#334155'}
                      strokeWidth="1"
                    />
                    <text
                      x={54 + c * 25}
                      y={30 + r * 18}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill={isCheck ? '#34D399' : '#FB7185'}
                    >
                      {isCheck ? '✓' : '✕'}
                    </text>
                  </g>
                );
              })
            )}
          </g>
        );
      case 'safecracker':
        return (
          <g>
            {[
              { x: 38, c: '#F43F5E' },
              { x: 60, c: '#38BDF8' },
              { x: 82, c: '#10B981' },
              { x: 104, c: '#F59E0B' },
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy="34" r="8" fill={p.c} />
            ))}
            {[
              { x: 38, c: '#10B981' },
              { x: 60, c: '#10B981' },
              { x: 82, c: '#F59E0B' },
              { x: 104, c: '#334155' },
            ].map((p, i) => (
              <circle key={i} cx={p.x} cy="60" r="5.5" fill={p.c} />
            ))}
          </g>
        );
      case 'minesweeper':
        return (
          <g>
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2, 3].map((c) => {
                const x = 44 + c * 18;
                const y = 14 + r * 16;
                const open = r === 0 || (r === 1 && c < 2);
                const flag = r === 2 && c === 2;
                return (
                  <g key={`${r}-${c}`}>
                    <rect
                      x={x}
                      y={y}
                      width="15"
                      height="13"
                      rx="2"
                      fill={open ? '#0F172A' : flag ? '#7F1D1D' : '#1E293B'}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    {r === 1 && c === 1 && (
                      <text x={x + 7.5} y={y + 10} textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono" fontWeight="700" fill="#38BDF8">
                        2
                      </text>
                    )}
                    {flag && <circle cx={x + 7.5} cy={y + 6.5} r="3" fill="#F87171" />}
                  </g>
                );
              })
            )}
          </g>
        );
      case 'sudoku':
      default:
        return (
          <g>
            <rect x="44" y="13" width="72" height="64" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
            <line x1="68" y1="13" x2="68" y2="77" stroke="#475569" strokeWidth="1.5" />
            <line x1="92" y1="13" x2="92" y2="77" stroke="#475569" strokeWidth="1.5" />
            <line x1="44" y1="34" x2="116" y2="34" stroke="#475569" strokeWidth="1.5" />
            <line x1="44" y1="56" x2="116" y2="56" stroke="#475569" strokeWidth="1.5" />
            <text x="56" y="28" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#E2E8F0">5</text>
            <text x="80" y="28" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill={accentColor}>3</text>
            <text x="104" y="49" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill="#E2E8F0">7</text>
            <text x="56" y="70" textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700" fill={accentColor}>9</text>
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 160 90"
      className="w-full h-full select-none"
      role="img"
      aria-label={`${id} puzzle diagram`}
    >
      <rect width="160" height="90" fill="#0B0D12" />
      {renderArt()}
    </svg>
  );
};
