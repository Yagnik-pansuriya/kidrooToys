import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        // Silence legacy @import and color-function deprecation warnings.
        // These come from existing patterns across the codebase and do not
        // affect functionality — will be migrated to @use in a future pass.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'legacy-js-api'],
      },
    },
  },
})

