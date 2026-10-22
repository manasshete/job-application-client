import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // New in eslint-plugin-react-hooks v6. Most hits here are intentional
    // "settle to client value after mount" / "sync prop into state" effects
    // (hydration-safe dates, router.refresh data); surface them as warnings
    // rather than blocking.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  globalIgnores([
    '.next/**',
    // Vendored bundle from the design tool export, not hand-written source.
    'support.js',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/pdf.worker.min.mjs',
  ]),
])
