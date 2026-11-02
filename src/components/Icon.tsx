// Ikon garis sederhana (24×24, mengikuti warna teks).
const PATHS: Record<string, string> = {
  gauge: 'M12 14l4-4 M3.3 18a9 9 0 1 1 17.4 0 M12 5v1 M5.6 8.6l.7.7 M18.4 8.6l-.7.7',
  handshake: 'M11 17l2 2a1.4 1.4 0 0 0 2-2 M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2L15 11l-3 1-2-2 3-3h2l4 4 M21 11l-5-5 M3 11l5-5 4 1 M3 11l7 7a1.4 1.4 0 0 0 2-2',
  calendar: 'M8 2v4 M16 2v4 M3 9h18 M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M8 13h.01 M12 13h.01 M16 13h.01 M8 17h.01 M12 17h.01',
  wrench: 'M14.7 6.3a4 4 0 0 0 5 5L22 13.6 13.6 22l-2.3-2.3a4 4 0 0 0-5-5L3 11.4 4.4 10l2.3 2.3 3-3L7.4 7 8.8 5.6l2.3 2.3 3-3z',
  alert: 'M12 9v4 M12 17h.01 M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 18l6-6-6-6',
  check: 'M20 6L9 17l-5-5',
  crane: 'M4 21V5l6-2 10 4H10 M10 3v18 M2 21h12 M20 7v5 M18 12h4v3h-4z M4 9h6 M4 13h6 M4 17h6',
  clock: 'M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4 M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
  save: 'M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M7 3v5h8 M7 21v-7h10v7',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
};

export function Icon({ name }: { name: keyof typeof PATHS | string }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name] ?? ''} />
    </svg>
  );
}
