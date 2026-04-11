# Responsive Check Script

Throwaway script per catturare screenshot responsive durante il lavoro di fix mobile.

## Uso

1. Avviare il dev server in un terminale:
   ```bash
   npm run dev
   ```

2. In un altro terminale, lanciare lo script:
   ```bash
   TEST_EMAIL=... TEST_PASSWORD=... npx tsx scripts/responsive-check.ts <label> [route]
   ```

   Esempi:
   - `npx tsx scripts/responsive-check.ts baseline` → tutte le route
   - `npx tsx scripts/responsive-check.ts after-quote-editor /nuovo` → solo `/nuovo`

## Output

`.responsive-screenshots/<label>/<route>/<viewport>.png`

La directory `.responsive-screenshots/` è in `.gitignore`.

## Cleanup

Questo script verrà rimosso (insieme a `@playwright/test` devDependency) al completamento del lavoro responsive.
