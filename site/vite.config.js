import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// scripts/extract.mjs runs first: it copies the landing page into public/landing/ and writes
// src/data/site.json from the repo's own files, so every number on the page is generated.
export default defineConfig({
  base: '/AramideLanding/',
  plugins: [react()],
});
