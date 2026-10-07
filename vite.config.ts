import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Production builds (and `vite preview` of them) are served from
// https://leemichaelo.github.io/cull-bench/, so assets need the /cull-bench/ base.
// Local dev (`npm run dev` on :5173) keeps the root base.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/cull-bench/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
  },
}));
