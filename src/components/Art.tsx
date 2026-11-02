// Ilustrasi SVG bergaya datar (tajam di semua ukuran layar, ringan, tanpa file gambar terpisah).
const N = '#0f2a4f'; // navy
const B = '#2563c9'; // biru
const A = '#f5a524'; // amber
const D = '#c97f0a'; // amber gelap
const L = '#e8effb'; // biru muda
const G = '#c9d2df'; // abu
const W = '#ffffff';

const Excavator = () => (
  <g>
    <rect x="4" y="47" width="36" height="10" rx="5" fill={N} />
    {[10, 18, 26, 34].map((x) => <circle key={x} cx={x} cy="52" r="2.6" fill={G} />)}
    <rect x="8" y="30" width="26" height="17" rx="3" fill={A} />
    <rect x="21" y="33" width="10" height="8" rx="1.5" fill={L} />
    <rect x="8" y="42" width="26" height="3" fill={D} />
    <path d="M30 35 L45 17 L57 30" fill="none" stroke={A} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M30 35 L45 17 L57 30" fill="none" stroke={D} strokeWidth="1.2" strokeDasharray="2 3" />
    <path d="M53 30 L61 30 L58 40 L51 38 Z" fill={N} />
  </g>
);

const Truck = () => (
  <g>
    <path d="M4 22 L38 22 L40 44 L4 44 Z" fill={A} />
    <path d="M4 28 H39 M4 34 H39" stroke={D} strokeWidth="1.5" />
    <path d="M41 28 H52 L59 36 V44 H41 Z" fill={N} />
    <path d="M44 31 H51 L55 36 H44 Z" fill={L} />
    <rect x="2" y="43" width="58" height="4" rx="2" fill={N} />
    {[12, 26, 51].map((x) => (
      <g key={x}><circle cx={x} cy="49" r="6" fill={N} /><circle cx={x} cy="49" r="2.4" fill={G} /></g>
    ))}
  </g>
);

const Plant = () => (
  <g>
    <rect x="6" y="16" width="15" height="34" rx="2" fill={A} />
    <ellipse cx="13.5" cy="16" rx="7.5" ry="3" fill={D} />
    <path d="M6 50 L13.5 58 L21 50" fill={D} />
    <path d="M21 42 L42 18" stroke={N} strokeWidth="3" strokeLinecap="round" />
    <rect x="30" y="34" width="28" height="22" rx="2" fill={N} />
    <rect x="34" y="39" width="6" height="6" fill={L} /><rect x="44" y="39" width="6" height="6" fill={L} />
    <rect x="50" y="18" width="5" height="16" fill={B} />
    <circle cx="53" cy="13" r="3" fill={G} /><circle cx="57" cy="8" r="2.2" fill={G} />
    <rect x="2" y="56" width="60" height="3" rx="1.5" fill={G} />
  </g>
);

const Crane = () => (
  <g>
    <rect x="17" y="12" width="8" height="44" fill="none" stroke={A} strokeWidth="2.5" />
    {[18, 26, 34, 42, 50].map((y) => <path key={y} d={`M17 ${y} L25 ${y + 6} M25 ${y} L17 ${y + 6}`} stroke={A} strokeWidth="1.4" />)}
    <path d="M6 12 H60" stroke={N} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M21 4 L8 12 M21 4 L54 12" stroke={N} strokeWidth="1.6" />
    <rect x="5" y="13" width="9" height="7" rx="1" fill={N} />
    <path d="M48 12 V32" stroke={N} strokeWidth="1.5" />
    <path d="M48 32 a3.5 3.5 0 1 0 3.5 3.5" fill="none" stroke={N} strokeWidth="2" strokeLinecap="round" />
    <rect x="42" y="38" width="13" height="10" rx="1" fill={B} />
    <rect x="12" y="56" width="18" height="4" rx="1" fill={N} />
  </g>
);

const Survey = () => (
  <g>
    <path d="M32 36 L18 60 M32 36 L32 60 M32 36 L46 60" stroke={N} strokeWidth="3" strokeLinecap="round" />
    <rect x="28" y="33" width="8" height="5" rx="1" fill={N} />
    <rect x="22" y="14" width="20" height="19" rx="3" fill={A} />
    <circle cx="32" cy="23.5" r="5" fill={N} /><circle cx="32" cy="23.5" r="2" fill={L} />
    <rect x="27" y="8" width="10" height="6" rx="2" fill="none" stroke={N} strokeWidth="2" />
    <path d="M46 20 H58" stroke={B} strokeWidth="2" strokeDasharray="2 2.5" strokeLinecap="round" />
    <circle cx="59" cy="20" r="2.5" fill={B} />
  </g>
);

const Erection = () => (
  <g>
    <path d="M32 4 L14 60 M32 4 L50 60" stroke={N} strokeWidth="3" strokeLinecap="round" />
    <path d="M26 22 H38 M22 34 H42 M18 46 H46 M26 22 L42 34 L22 34 L46 46 L18 46 L50 58" fill="none" stroke={N} strokeWidth="1.5" />
    <path d="M10 16 H54" stroke={A} strokeWidth="3" strokeLinecap="round" />
    <path d="M14 16 V22 M50 16 V22" stroke={A} strokeWidth="2" />
    <path d="M4 26 Q32 34 60 26" fill="none" stroke={B} strokeWidth="1.5" />
  </g>
);

const Generator = () => (
  <g>
    <rect x="6" y="20" width="50" height="30" rx="4" fill={A} />
    <rect x="11" y="25" width="22" height="20" rx="2" fill={N} />
    {[29, 33, 37, 41].map((y) => <path key={y} d={`M14 ${y} H30`} stroke={G} strokeWidth="1.6" />)}
    <rect x="38" y="25" width="13" height="9" rx="1.5" fill={L} />
    <circle cx="41.5" cy="40" r="2" fill={N} /><circle cx="47.5" cy="40" r="2" fill={B} />
    <rect x="44" y="11" width="5" height="9" fill={N} />
    <path d="M27 6 L22 15 H28 L24 23" fill="none" stroke={B} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    <circle cx="16" cy="54" r="5" fill={N} /><circle cx="46" cy="54" r="5" fill={N} />
  </g>
);

const Others = () => (
  <g>
    <path d="M10 8 V58 M30 8 V58 M10 18 H30 M10 34 H30 M10 50 H30" stroke={N} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M10 18 L30 34 M30 34 L10 50" stroke={G} strokeWidth="1.5" />
    <rect x="6" y="56" width="28" height="4" rx="1" fill={N} />
    <path d="M38 50 L54 34" stroke={A} strokeWidth="5" strokeLinecap="round" />
    <path d="M51 26 a7 7 0 1 0 9 9 l-4 -1 -2 -4 z" fill={A} />
    <circle cx="46" cy="18" r="7" fill="none" stroke={B} strokeWidth="3" />
    <circle cx="46" cy="18" r="2.2" fill={B} />
    {[0, 60, 120, 180, 240, 300].map((r) => (
      <rect key={r} x="44.5" y="7.5" width="3" height="3.5" fill={B} transform={`rotate(${r} 46 18)`} />
    ))}
  </g>
);

const HardHat = () => (
  <g>
    <path d="M10 42 Q10 20 32 18 Q54 20 54 42 Z" fill={A} />
    <path d="M29 18 H35 V40 H29 Z" fill={D} />
    <rect x="4" y="40" width="56" height="7" rx="3.5" fill={D} />
    <path d="M20 28 Q22 24 26 22" stroke={W} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6" />
  </g>
);

const Coins = () => (
  <g>
    {[44, 38, 32, 26].map((y) => (
      <g key={y}><ellipse cx="22" cy={y + 4} rx="14" ry="4.5" fill={D} /><ellipse cx="22" cy={y} rx="14" ry="4.5" fill={A} /></g>
    ))}
    <rect x="38" y="16" width="22" height="30" rx="3" fill={N} />
    <rect x="42" y="20" width="14" height="6" rx="1" fill={L} />
    {[30, 36, 42].map((y) => [42, 47, 52].map((x) => <rect key={`${x}${y}`} x={x} y={y} width="3.5" height="3" rx=".6" fill={G} />))}
  </g>
);

const Blueprint = () => (
  <g>
    <rect x="6" y="10" width="44" height="46" rx="3" fill={B} />
    <path d="M12 18 H44 M12 18 V48 M12 30 H30 V48 M30 30 H44" stroke={L} strokeWidth="1.6" fill="none" />
    <path d="M12 48 H44" stroke={L} strokeWidth="1.6" strokeDasharray="2 2" />
    <path d="M44 56 L58 22 L62 24 L48 58 Z" fill={A} />
    <path d="M44 56 L45 60 L48 58" fill={N} />
  </g>
);

const Gear = () => (
  <g>
    <circle cx="26" cy="34" r="13" fill="none" stroke={N} strokeWidth="6" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
      <rect key={r} x="23" y="14" width="6" height="7" rx="1" fill={N} transform={`rotate(${r} 26 34)`} />
    ))}
    <circle cx="26" cy="34" r="4" fill={A} />
    <path d="M40 54 L52 42" stroke={A} strokeWidth="6" strokeLinecap="round" />
    <path d="M49 33 a8 8 0 1 0 10 10 l-4.5 -1 -2.5 -4.5 z" fill={A} />
    <path d="M38 12 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 z" fill={B} />
  </g>
);

const EQUIPMENT = [Excavator, Truck, Plant, Crane, Survey, Erection, Generator, Others];

/** Ilustrasi kelompok alat (urutan sama dengan KELOMPOK_ALAT di survey.ts). */
export function EquipmentArt({ index }: { index: number }) {
  const Art = EQUIPMENT[index % EQUIPMENT.length];
  return <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false"><Art /></svg>;
}

const STEP_ART: Record<string, () => JSX.Element> = {
  profil: HardHat,
  kondisi: Excavator,
  tarif: Coins,
  kebutuhan: Crane,
  subkon: Blueprint,
  layanan: Gear,
  penutup: Survey,
};

/** Ilustrasi pada kepala setiap bagian. */
export function StepArt({ id }: { id: string }) {
  const Art = STEP_ART[id] ?? Excavator;
  return (
    <svg className="step-art" viewBox="0 0 64 64" width="96" height="96" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="31" fill={L} />
      <g transform="translate(6 6) scale(.81)"><Art /></g>
    </svg>
  );
}

/** Pemandangan proyek beranimasi untuk halaman pembuka. */
export function HeroScene() {
  return (
    <svg className="hero-scene" viewBox="0 0 320 150" aria-hidden="true" focusable="false">
      <path d="M0 132 H320" stroke="rgba(255,255,255,.35)" strokeWidth="2" />
      <path d="M0 140 H320" stroke="rgba(255,255,255,.15)" strokeWidth="2" strokeDasharray="10 12" />
      {/* gedung latar */}
      <g opacity=".25" fill={W}>
        <rect x="150" y="70" width="34" height="62" /><rect x="190" y="52" width="26" height="80" /><rect x="222" y="84" width="30" height="48" />
      </g>
      {/* tower crane dengan kait berayun */}
      <g transform="translate(232 6) scale(1.5)">
        <rect x="17" y="12" width="8" height="72" fill="none" stroke={A} strokeWidth="2" />
        {[18, 28, 38, 48, 58, 68].map((y) => <path key={y} d={`M17 ${y} L25 ${y + 8} M25 ${y} L17 ${y + 8}`} stroke={A} strokeWidth="1.1" />)}
        <path d="M-30 12 H50" stroke={W} strokeWidth="3" strokeLinecap="round" />
        <path d="M21 3 L-26 12 M21 3 L46 12" stroke={W} strokeWidth="1.2" />
        <rect x="38" y="13" width="9" height="6" rx="1" fill={N} />
        <g className="swing">
          <path d="M-18 12 V40" stroke={W} strokeWidth="1.2" />
          <rect x="-25" y="40" width="14" height="9" rx="1" fill={A} />
        </g>
      </g>
      {/* truk berjalan */}
      <g className="drive">
        <g transform="translate(0 92) scale(.72)"><Truck /></g>
      </g>
      {/* ekskavator dengan lengan bergerak */}
      <g transform="translate(70 70) scale(.95)">
        <rect x="4" y="47" width="36" height="10" rx="5" fill={N} />
        <rect x="8" y="30" width="26" height="17" rx="3" fill={A} />
        <rect x="21" y="33" width="10" height="8" rx="1.5" fill={L} />
        <g className="dig">
          <path d="M30 35 L45 17 L57 30" fill="none" stroke={A} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M53 30 L61 30 L58 40 L51 38 Z" fill={W} />
        </g>
      </g>
    </svg>
  );
}
