import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone Firebase Cloud Function project, not part of the Next app.
    "sih2026-live-sync/**",
    // Standalone local Node script, not part of the Next app.
    "analytics-dashboard/**",
  ]),
]);

export default eslintConfig;
