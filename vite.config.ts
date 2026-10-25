import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { allowedHosts: ['localhost', '127.0.0.1'], hmr: { port: Number(process.env.PORT || 4173) + 20000 } } });
