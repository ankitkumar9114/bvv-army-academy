import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The site is served from the root of its own domain, https://bvvarmyacademy.in/ (GitHub Pages custom domain), so
 * assets are requested from "/". Without a custom domain GitHub Pages serves https://<user>.github.io/<repo>/: then
 * build with BASE_PATH=/<repo>/ (repository variable BASE_PATH in the deploy workflow).
 */
export default defineConfig(() => ({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // Firebase modules are imported on demand (catalog, CMS). Pre-bundling them together keeps a single
  // @firebase/app instance in dev; otherwise firebase/auth fails with "Component auth has not been registered yet".
  optimizeDeps: { include: ['firebase/app', 'firebase/auth', 'firebase/firestore'] },
}));
