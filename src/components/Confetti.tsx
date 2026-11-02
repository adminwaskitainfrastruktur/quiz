// Konfeti ringan saat jawaban terkirim (dinonaktifkan bila pengguna memilih kurangi gerakan).
import { useMemo } from 'react';

const COLORS = ['#f5a524', '#2563c9', '#1d8a52', '#0f2a4f', '#ffd166', '#7aa7ff'];

export function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dur: 2.2 + Math.random() * 1.6,
      rot: Math.random() * 360,
      drift: (Math.random() - 0.5) * 160,
      color: COLORS[i % COLORS.length],
      w: 6 + Math.random() * 6,
      round: Math.random() > 0.7,
    })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} style={{
          left: `${p.left}%`, background: p.color, width: p.w, height: p.round ? p.w : p.w * 0.45,
          borderRadius: p.round ? '50%' : 2, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          ['--rot' as string]: `${p.rot}deg`, ['--drift' as string]: `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}
