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
    // Vendored/minified assets (PDF.js worker, ecc.) — non li scriviamo noi
    "public/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Regola rumorosa che non cambia il rendering; disabilitata come convenzione del progetto
      "react/no-unescaped-entities": "off",
      // React Compiler linter (plugin v7) troppo aggressivo con pattern SSR legittimi
      // come leggere localStorage/mediaQuery in useEffect e fare setState: li lasciamo passare
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // Template PDF con @react-pdf/renderer: <Image> e <Text> non sono HTML,
    // le regole jsx-a11y e next/image non si applicano.
    files: ["src/pdf/**/*.{ts,tsx}"],
    rules: {
      "jsx-a11y/alt-text": "off",
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
