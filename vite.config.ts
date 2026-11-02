/// <reference types="vitest" />
import { rmSync } from 'node:fs';
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

export default defineConfig(({ mode }) => ({
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
