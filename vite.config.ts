import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages serves a project site from https://<user>.github.io/<REPO_NAME>/,
 * so production assets must be requested from /<REPO_NAME>/.
 *
 * To change it: edit REPO_NAME below, OR set the BASE_PATH env variable
 * (e.g. BASE_PATH=/ for a custom domain or a <user>.github.io repo).
 */
const REPO_NAME = 'bvv-army-academy';

export default defineConfig(({ command, isPreview }) => ({
  // dev server runs at "/"; build and `npm run preview` use the GitHub Pages path.
  base: process.env.BASE_PATH ?? (command === 'build' || isPreview ? `/${REPO_NAME}/` : '/'),
  plugins: [react()],
  // Firebase modules are imported on demand (catalog, CMS). Pre-bundling them together keeps a single
  // @firebase/app instance in dev; otherwise firebase/auth fails with "Component auth has not been registered yet".
  optimizeDeps: { include: ['firebase/app', 'firebase/auth', 'firebase/firestore'] },
}));
