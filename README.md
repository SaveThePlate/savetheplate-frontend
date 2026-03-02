
# SaveThePlate Frontend

This is the frontend for SaveThePlate, a platform to reduce food waste by connecting businesses with surplus food to consumers.

**Tech stack:** Next.js, React, TypeScript, Tailwind CSS

## Quick Start

1. Clone the repo and run `npm install`
2. Remove .local from the `.env.local` and fill in the required values
3. Start the dev server: `npm run dev`

The app will be available at http://localhost:3000

**State Management & Data Fetching:**
- React Query (TanStack Query)
- Context API (User & Language)
- Axios

**Maps & Location:**
- Leaflet (Interactive maps)
- Google Maps API
- Geolocation API

**Real-time Communication:**
- Socket.io Client (WebSocket)

**Additional Libraries:**
- React Hook Form (Form management)
- Zod (Validation)
- Next-intl (Internationalization)
- React Email (Email templates)
- QR Code Scanner
- HTML5-QRCode

**Development Tools:**
- ESLint
- Prettier
- Jest (Testing)
- OpenAPI TypeScript Generator

## 🚀 Getting Started

### Prerequisites

```bash
node >= 18.x
npm >= 9.x
```

## 📁 Project Structure

```
leftover-frontend/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── providers.tsx            # React Query & context providers
│   ├── auth/                    # Authentication pages
│   ├── client/                  # Client dashboard
│   ├── provider/                # Provider dashboard
│   ├── onboarding/              # User onboarding flow
│   ├── contact/                 # Contact page
│   ├── privacy/                 # Privacy policy
│   └── impact/                  # Environmental impact page
├── components/                   # React components
│   ├── Nav.tsx                  # Navigation bar
│   ├── Footer.tsx               # Footer component
│   ├── Offers.tsx               # Offer listing
│   ├── MapComponent.tsx         # Map integration
│   ├── QRScanner.tsx            # QR code scanner
│   ├── GuidedTour.tsx           # User onboarding tour
│   ├── offerCard/               # Offer card components
│   ├── ui/                      # Reusable UI components (Shadcn)
│   └── hooks/                   # Custom React hooks
├── context/                      # React Context
│   ├── UserContext.tsx          # User state management
│   └── LanguageContext.tsx      # Language preferences
├── hooks/                        # Custom hooks
│   ├── useOffers.ts             # Offers data hook
│   ├── useWebSocket.ts          # WebSocket connection
│   └── useBlobUrl.ts            # Image handling
├── lib/                          # Utility libraries
│   ├── axiosInstance.ts         # Axios configuration
│   ├── queryClient.ts           # React Query setup
│   ├── OpenApiFetch.ts          # API client
│   └── utils.ts                 # Helper functions
├── locales/                      # Translation files
│   ├── en.json                  # English translations
│   └── fr.json                  # French translations
├── generated/                    # Auto-generated code
│   ├── api/                     # OpenAPI types
│   └── types/                   # Prisma types
├── services/                     # API services
│   └── openapi/                 # OpenAPI client
├── public/                       # Static assets
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service worker
│   └── locales/                 # Public translation files
├── scripts/                      # Build scripts
│   ├── sync-locales.mjs         # Sync translation files
│   └── verify-locales.mjs       # Validate translations
└── package.json
```

## ✨ Key Features

### User Authentication
- Email/password authentication
- Google OAuth integration 
- Facebook OAuth integration
- Email verification
- Protected routes with RouteGuard

### Offer Discovery
- Browse all available food offers
- Filter by food type, taste, price range
- Search by location
- Interactive map view with markers
- Distance calculation from user location
- Real-time offer updates

### Provider Dashboard (`app/provider/`)
- Create and manage food offers
- Upload offer images (multiple)
- Set pricing, quantity, and pickup times
- View offer statistics
- Manage orders
- View ratings and reviews

### Client Dashboard (`app/client/`)
- Browse and save favorite offers
- Place orders
- Order history
- QR code for order pickup
- Rate providers
- Track environmental impact

### Real-time Features
- WebSocket notifications for new offers
- Order status updates
- Live offer availability

### Maps Integration
- Leaflet for interactive maps
- Google Maps for geocoding
- User location detection
- Distance calculation
- Pickup location visualization

### Internationalization (i18n)
- English and French languages
- Automatic language detection
- User preference storage
- Translation management scripts

### Progressive Web App (PWA)
- Installable on mobile devices
- Offline support (service worker)
- Push notifications capability
- App-like experience

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev                # Start dev server (0.0.0.0)

# Building
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run Next.js linter

# Testing
npm run test               # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report

# Code Generation
npm run gen-apis           # Generate TypeScript types from OpenAPI
npm run gen-types          # Generate types from Prisma schema

# Localization
npm run verify-locales     # Validate translation files

# Analysis
npm run analyze            # Analyze bundle size

# Integration Testing
npm run test:websocket     # Test WebSocket connection
npm run test:google-auth   # Test Google OAuth
npm run test:facebook-auth # Test Facebook OAuth
```

### Adding New Pages

1. Create a new folder in `app/` directory
2. Add `page.tsx` for the page component
3. Add `layout.tsx` if custom layout needed
4. Update navigation in `components/Nav.tsx`
5. Add translations to `locales/en.json` and `locales/fr.json`

### Working with APIs

API calls are centralized using:
- `lib/axiosInstance.ts` - Configured Axios with auth interceptors
- `lib/OpenApiFetch.ts` - Type-safe API client
- `hooks/useOffers.ts` - React Query hooks for data fetching

Example:
```typescript
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';

export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/offer');
      return data;
    },
  });
}
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

Test files are located in `__tests__` directories or alongside components with `.test.tsx` extension.

### Testing Strategy
- Unit tests for utility functions (`lib/__tests__/`)
- Component tests for UI components (`components/__tests__/`)
- Integration tests for API interactions
- Manual E2E testing for critical flows


## 🌍 Internationalization

The app supports multiple languages using a custom i18n setup.

### Translation Files

- `locales/en.json` - English translations
- `locales/fr.json` - French translations

### Adding Translations

1. Add key-value pairs to both language files
2. Use the translation in components:

```typescript
import { useLanguage } from '@/context/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  return <h1>{t('welcome_message')}</h1>;
}
```

3. Verify translations:
```bash
npm run verify-locales
```

### Language Detection

- Browser language preference
- User profile preference
- Default: French

## 👥 For New Interns

Welcome to SaveThePlate! Here's your learning path:

### Week 1: Setup & Exploration
1. Set up your development environment
2. Run the project locally
3. Explore the UI and user flows
4. Review the component structure
5. Understand the routing (Next.js App Router)
6. Read through key components (Nav, Offers, MapComponent)

### Week 2: First Contributions
1. Pick a "good first issue" from the backlog
2. Make your first component or fix a bug
3. Write or update tests
4. Create your first PR
5. Learn from code review feedback

### Week 3+: Deeper Work
1. Implement a new feature
2. Work with APIs and state management
3. Add translations for your features
4. Optimize performance
5. Improve accessibility

### Key Concepts to Learn
- **Next.js 14 App Router** - File-based routing, server components
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **TypeScript** - Type safety and interfaces
- **WebSocket** - Real-time communication
- **PWA** - Progressive web app concepts

### Useful Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Common Tasks & Where to Find Code
- **Add a new page**: Create folder in `app/`
- **Create UI component**: Add to `components/` or `components/ui/`
- **Add API call**: Use hooks in `hooks/` or `lib/axiosInstance.ts`
- **Style something**: Use Tailwind classes or module CSS
- **Add translation**: Update `locales/*.json`
- **Fix layout**: Check `app/layout.tsx` and `components/SharedLayout.tsx`

### Pro Tips
- Use the browser DevTools React and React Query extensions
- Check the Network tab for API calls
- Use `console.log` strategically (but remove before committing)
- Test on mobile viewport (responsive design is crucial)
- Ask questions early and often
- Review other PRs to learn patterns

---

**Last Updated:** January 2026
