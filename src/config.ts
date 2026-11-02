// Pengaturan situs. Endpoint relatif terhadap halaman kuesioner,
// jadi folder `api/` harus ikut diunggah di samping index.html.
export const CONFIG = {
  endpoint: import.meta.env.VITE_ENDPOINT || 'api/submit.php',
  /** Kunci penyimpanan draf di browser responden. Ganti bila struktur kuesioner berubah besar. */
  storageKey: 'kuesioner-wki-v3',
  /** Batas waktu kirim (ms). */
  timeoutMs: 30000,
};
