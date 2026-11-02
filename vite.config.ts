/// <reference types="vitest" />
import { readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Server PHP lokal untuk api/ dan admin/ saat `npm run dev` (lihat `npm run api`).
const PHP = 'http://127.0.0.1:8081';

// config.php berisi password: hanya ikut di build mode "lokal" (`npm run serve`),
// tidak pernah ikut di build untuk diunggah ke hosting (`npm run build`).
const dropSecrets = (mode: string): Plugin => ({
  name: 'drop-secrets',
  apply: 'build',
  closeBundle() {
    if (mode !== 'lokal') rmSync(resolve(__dirname, 'dist/api/config.php'), { force: true });
  },
});

// Logo dicari otomatis di public/brand/ (termasuk subfolder) berdasarkan nama file:
//   mengandung "wki" atau "waskita" → logo utama; mengandung "danantara" → logo pendamping.
// Bila tidak ada nama yang cocok tetapi hanya ada satu gambar lain selain Danantara, gambar itu dipakai
// sebagai logo utama. Hasil pencarian dicetak di terminal saat build/dev.
const IMG = /\.(png|svg|webp|jpe?g|gif|avif)$/i;
function listImages(dir: string, prefix = ''): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? listImages(resolve(dir, d.name), `${prefix}${d.name}/`) : IMG.test(d.name) ? [`${prefix}${d.name}`] : []);
  } catch {
    return [];
  }
}
const toUrl = (rel: string) => `brand/${rel.split('/').map(encodeURIComponent).join('/')}`;
function findLogos() {
  const all = listImages(resolve(__dirname, 'public/brand'));
  const pick = (re: RegExp) => all.filter((f) => re.test(f)).sort((a, b) => a.length - b.length)[0];
  const danantara = pick(/danantara/i);
  let wki = pick(/wki|waskita/i);
  const rest = all.filter((f) => f !== danantara);
  if (!wki && rest.length === 1) wki = rest[0];
  return { all, wki, danantara };
}
const LOGOS = findLogos();
const logoReport = (): Plugin => ({
  name: 'logo-report',
  buildStart() {
    const show = (f?: string) => (f ? `public/brand/${f}` : 'TIDAK DITEMUKAN');
    console.log(`\n[logo] Isi public/brand: ${LOGOS.all.length ? LOGOS.all.join(', ') : '(tidak ada gambar)'}`);
    console.log(`[logo] Logo utama (WKI): ${show(LOGOS.wki)}`);
    console.log(`[logo] Logo pendamping (Danantara): ${show(LOGOS.danantara)}\n`);
  },
});

export default defineConfig(({ mode }) => ({
  define: {
    __LOGO_WKI__: JSON.stringify(LOGOS.wki ? toUrl(LOGOS.wki) : ''),
    __LOGO_DANANTARA__: JSON.stringify(LOGOS.danantara ? toUrl(LOGOS.danantara) : ''),
  },
  // './' agar hasil build bisa ditaruh di akar subdomain maupun subfolder.
  base: './',
  plugins: [react(), dropSecrets(mode), logoReport()],
  server: {
    port: 8080,
    strictPort: true,
    proxy: { '/api': PHP, '/admin': PHP },
  },
  preview: { port: 8080, strictPort: true },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
  test: { environment: 'node' },
}));
