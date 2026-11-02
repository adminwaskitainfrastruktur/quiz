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

// Logo dicari otomatis di public/brand/ berdasarkan nama file (huruf besar/kecil & spasi bebas):
//   mengandung "wki" atau "waskita" → logo utama; mengandung "danantara" → logo pendamping.
function findLogo(pattern: RegExp, fallback: string) {
  try {
    const file = readdirSync(resolve(__dirname, 'public/brand'))
      .filter((n) => /\.(png|svg|webp|jpe?g)$/i.test(n) && pattern.test(n))
      .sort((a, b) => a.length - b.length)[0];
    return file ? `brand/${encodeURIComponent(file)}` : fallback;
  } catch {
    return fallback;
  }
}

export default defineConfig(({ mode }) => ({
  define: {
    __LOGO_WKI__: JSON.stringify(findLogo(/wki|waskita/i, 'brand/logo-wki.png')),
    __LOGO_DANANTARA__: JSON.stringify(findLogo(/danantara/i, 'brand/logo-danantara.png')),
  },
  // './' agar hasil build bisa ditaruh di akar subdomain maupun subfolder.
  base: './',
  plugins: [react(), dropSecrets(mode)],
  server: {
    port: 8080,
    strictPort: true,
    proxy: { '/api': PHP, '/admin': PHP },
  },
  preview: { port: 8080, strictPort: true },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
  test: { environment: 'node' },
}));
