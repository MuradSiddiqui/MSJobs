import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "supabase/**",
    "coverage/**",
    "playwright-report/**",
  ]),
  {
    files: ["src/lib/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "ai",
              message:
                "src/lib/core is a pure domain layer. Do not import I/O libraries.",
            },
            {
              name: "unpdf",
              message:
                "src/lib/core is a pure domain layer. Do not import I/O libraries.",
            },
            {
              name: "mammoth",
              message:
                "src/lib/core is a pure domain layer. Do not import I/O libraries.",
            },
          ],
          patterns: [
            {
              group: ["next", "next/*", "react", "react-dom", "react/*"],
              message:
                "src/lib/core is a pure domain layer. Do not import Next.js or React.",
            },
            {
              group: ["@supabase/*", "@/lib/supabase", "@/lib/supabase/*"],
              message:
                "src/lib/core is a pure domain layer. Do not import Supabase.",
            },
            {
              group: ["@ai-sdk", "@ai-sdk/*"],
              message:
                "src/lib/core is a pure domain layer. Do not import I/O libraries.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
