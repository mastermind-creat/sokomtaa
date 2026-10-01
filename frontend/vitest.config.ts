import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        // Use fake timers globally so tests can fast-forward setInterval
        fakeTimers: {
            toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
