import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The site reads ../level-*/ JSON at build time, so every number on the page is generated, never typed.
export default defineConfig({
  base: '/guardrails-lab/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
