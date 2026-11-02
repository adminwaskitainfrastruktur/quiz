// Efek riak (ripple) dari titik sentuh untuk tombol dan pilihan jawaban.
// Satu pendengar di dokumen, jadi berlaku untuk semua elemen interaktif tanpa mengubah komponennya.
const TARGETS = '.btn, .choice-row, .pill, .tile, .chip, .rank-main, .rank-move, .dock-btn, .optout';

export function installRipple() {
  if (typeof window === 'undefined') return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('pointerdown', (e) => {
    if (reduce.matches || e.button !== 0) return;
    const host = (e.target as HTMLElement).closest<HTMLElement>(TARGETS);
    if (!host || host.matches(':disabled') || host.closest('.is-off')) return;
    const r = host.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.left = `${e.clientX - r.left - size / 2}px`;
    dot.style.top = `${e.clientY - r.top - size / 2}px`;
    host.appendChild(dot);
    const done = () => dot.remove();
    dot.addEventListener('animationend', done, { once: true });
    window.setTimeout(done, 900);
  }, { passive: true });
}
