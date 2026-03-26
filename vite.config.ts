import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function resolveBasePath(env: Record<string, string>) {
  if (env.VITE_BASE_PATH) {
    return env.VITE_BASE_PATH;
  }

  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (process.env.GITHUB_ACTIONS === 'true' && repository) {
    return `/${repository}/`;
  }

  return '/';
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    base: resolveBasePath(env),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
