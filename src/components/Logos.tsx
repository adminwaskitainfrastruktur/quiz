// Logo perusahaan. File gambarnya diletakkan di public/brand/ (ikut terunggah ke hosting).
// Nama file bebas: yang mengandung "wki"/"waskita" = logo utama PT Waskita Karya Infrastruktur,
// yang mengandung "danantara" = logo pendamping Danantara Indonesia (dicari saat build, lihat vite.config.ts).
// Bila file belum ada, ditampilkan ikon pengganti agar tampilan tidak rusak.
import { useState } from 'react';
import { Icon } from './Icon';

export const LOGO_WKI = __LOGO_WKI__;
export const LOGO_DANANTARA = __LOGO_DANANTARA__;

function Img({ src, alt, className, fallback }: { src: string; alt: string; className: string; fallback?: JSX.Element }) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback ?? null;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} decoding="async" />;
}

/** Logo utama (WKI). */
export function LogoWki({ className = '', bare = false }: { className?: string; bare?: boolean }) {
  // `bare`: tanpa ikon pengganti (dipakai di halaman pembuka agar ikon tidak muncul dua kali)
  return (
    <Img src={LOGO_WKI} alt="Waskita Karya Infrastruktur" className={`logo logo-wki ${className}`}
      fallback={bare ? undefined : <span className={`brand-mark ${className}`} aria-hidden="true"><Icon name="crane" /></span>} />
  );
}

/** Logo pendamping (Danantara Indonesia). */
export function LogoDanantara({ className = '' }: { className?: string }) {
  return <Img src={LOGO_DANANTARA} alt="Danantara Indonesia" className={`logo logo-danantara ${className}`} />;
}
