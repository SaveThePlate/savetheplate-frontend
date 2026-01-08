# Localization System

## Overview

This application uses a custom localization system that supports English (en) and French (fr) translations.

## File Structure

```
leftover-frontend/
├── locales/                    # Source locale files
│   ├── en.json                # English translations (source of truth)
│   └── fr.json                # French translations (source of truth)
├── public/locales/            # Public locale files (auto-synced from /locales)
│   ├── en.json                # Auto-generated - do not edit directly
│   └── fr.json                # Auto-generated - do not edit directly
└── context/
    └── LanguageContext.tsx    # Localization context provider
```

## How It Works

### Translation Loading Strategy

The `LanguageContext` uses a dual-loading strategy to ensure translations work reliably across all environments (desktop, mobile, development, production):

1. **Dynamic Import (Primary)**: Attempts to load translations using `import()` which works well in development and some production builds.

2. **Fetch Fallback (Secondary)**: If dynamic import fails, fetches translations from `/public/locales/` via HTTP. This method is more reliable on mobile devices and in standalone production builds.

### Build Process

1. **prebuild**: The `sync-locales.mjs` script automatically syncs locale files from `/locales` to `/public/locales` before each build.

2. **build**: Next.js builds the application with both locale sources available.

3. **postbuild**: For standalone builds, the `copy-standalone-assets.mjs` script copies the `locales/` folder to `.next/standalone/locales/`.

## Usage

### Adding/Editing Translations

1. **Only edit files in `/locales` directory**:
   - `/locales/en.json` - English translations
   - `/locales/fr.json` - French translations

2. The build process will automatically sync these to `/public/locales/`.

### In Components

```tsx
import { useLanguage } from "@/context/LanguageContext";

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t("landing.welcome_title")}</h1>
      <p>{t("common.loading")}</p>
      
      {/* With parameters */}
      <p>{t("order.id_message", { orderId: "12345" })}</p>
      
      {/* Change language */}
      <button onClick={() => setLanguage("fr")}>Français</button>
      <button onClick={() => setLanguage("en")}>English</button>
    </div>
  );
}
```

## Scripts

- `npm run dev` - Starts development server
- `npm run build` - Builds for production (includes locale sync)
- `node scripts/sync-locales.mjs` - Manually sync locales to public folder

## Troubleshooting

### Translations not loading on mobile

This issue has been fixed by:
1. Implementing a fetch-based fallback in `LanguageContext.tsx`
2. Ensuring locale files are synced to the public folder
3. Copying locale files to the standalone build output

### Outdated translations in production

Make sure to:
1. Edit only the files in `/locales` directory
2. Run the build process (prebuild hook will sync files automatically)
3. The `/public/locales` files are auto-generated and should not be edited directly

### Adding a new language

1. Create a new JSON file in `/locales` (e.g., `es.json`)
2. Add the language to the `Language` type in `LanguageContext.tsx`
3. Update `scripts/sync-locales.mjs` to include the new language file
4. Update the `LanguageSwitcher` component to show the new language option

## Technical Details

### Why Two Locations?

- `/locales/`: Source of truth, used by dynamic imports in development
- `/public/locales/`: Fallback location, accessible via HTTP fetch for reliability on all platforms

### Mobile Compatibility

The fetch-based fallback ensures that translations work reliably on mobile browsers where:
- Dynamic imports with template literals may fail
- Webpack/module resolution might behave differently
- Service workers and PWA caching are involved

### Standalone Build Considerations

In Next.js standalone builds (Docker deployments), the output tracing might not include dynamically imported JSON files. Our build process ensures locales are explicitly copied to the standalone output directory.

