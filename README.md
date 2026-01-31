
<div align="center">

# 🍽️ SaveThePlate Frontend

**Reducing food waste, one plate at a time**

A modern web platform connecting businesses with surplus food to budget-conscious consumers, helping reduce food waste while saving money.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About

SaveThePlate is a **food waste reduction marketplace** that connects:
- 🏪 **Providers** (restaurants, cafes, grocery stores) with surplus food
- 🛒 **Clients** (consumers) looking for discounted quality food

**Impact:**
- 🌍 Reduce environmental impact of food waste
- 💰 Save money for consumers
- 📈 Generate revenue from surplus inventory for businesses

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- **Node.js** >= 18.x
- **npm** >= 9.x
- **Backend API** running at `http://localhost:3001` (or configure `NEXT_PUBLIC_BACKEND_URL`)

### Installation

```bash
# Clone the repository
git clone https://github.com/SaveThePlate/savetheplate-frontend.git
cd savetheplate-frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

The app will be available at **http://localhost:3000** 🎉

## 🛠️ Tech Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **React 18** - UI library  
- **TypeScript 5** - Type safety
- **Tailwind CSS** - Utility-first styling

### State Management & Data Fetching
- **React Query** (TanStack Query) - Server state management & caching
- **Context API** - Global state (User & Language)
- **Axios** - HTTP client with interceptors

### Maps & Location
- **Leaflet** - Interactive maps
- **Google Maps API** - Geocoding & location services
- **Geolocation API** - User location detection

### Real-time Communication
- **Socket.io Client** - WebSocket for live offer updates

### UI Components & Styling
- **Radix UI** - Accessible component primitives
- **Shadcn/ui** - Re-usable component library
- **Lucide Icons** & **Phosphor Icons** - Icon sets
- **Framer Motion** - Animations
- **GSAP** - Advanced animations

### Form Management & Validation
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation

### Additional Features
- **Internationalization** - Multi-language support (EN, FR)
- **QR Code** - Scanner (HTML5-QRCode) & Generator
- **PWA** - Progressive Web App with offline support
- **Charts** - Recharts for analytics

### Development Tools
- **ESLint** - Code linting
- **Jest** - Unit testing
- **OpenAPI TypeScript** - Type-safe API client generation

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js App (React Components)                      │   │
│  │  ├─ App Router (File-based routing)                  │   │
│  │  ├─ Server Components (RSC)                          │   │
│  │  └─ Client Components ("use client")                 │   │
│  └──────────────────────────────────────────────────────┘   │
│           ↕                      ↕                           │
│  ┌─────────────────┐    ┌──────────────────┐               │
│  │  React Query    │    │  Context API     │               │
│  │  (Data Cache)   │    │  (User/Language) │               │
│  └─────────────────┘    └──────────────────┘               │
│           ↕                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Axios Instance (HTTP Client + Auth Interceptors)    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           ↕                                    ↕
    ┌──────────────┐                    ┌──────────────┐
    │  REST API    │                    │  WebSocket   │
    │  (Backend)   │                    │  (Socket.io) │
    └──────────────┘                    └──────────────┘
```

### Key Architectural Decisions

- **App Router over Pages Router**: Better performance, streaming SSR, and nested layouts
- **React Query for Server State**: Automatic caching, refetching, and synchronization
- **Context API for Client State**: Lightweight global state for user and language preferences
- **Axios Interceptors**: Centralized auth token management and error handling
- **Type Generation**: OpenAPI schema → TypeScript types for compile-time safety

---

## 🌍 Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Required Variables

```bash
# Backend API URL (must be running for the app to work)
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Frontend URL (for OAuth callbacks)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### OAuth Configuration (Optional)

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Facebook OAuth  
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### Server-Side Only (Optional)

```bash
# JWT Secret for token validation
JWT_SECRET=your_jwt_secret_key

# Environment
NODE_ENV=development

# Performance monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false
```

> ⚠️ **Important**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never put secrets in these variables.

---

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

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 User Authentication
- Email/password authentication
- Google OAuth integration 
- Facebook OAuth integration
- Email verification
- Protected routes with RouteGuard

### 🗺️ Maps Integration
- Interactive Leaflet maps
- Google Maps geocoding
- User location detection
- Distance calculation
- Pickup location visualization

### 🌍 Internationalization (i18n)
- English and French languages
- Automatic language detection
- User preference storage
- Translation management scripts

</td>
<td width="50%">

### 🔍 Offer Discovery
- Browse available food offers
- Filter by type, taste, price
- Location-based search
- Interactive map view
- Real-time updates

### 📱 Progressive Web App
- Installable on mobile devices
- Offline support (service worker)
- Push notifications capability
- App-like experience

### ⚡ Real-time Features
- WebSocket notifications
- Live offer availability
- Order status updates

</td>
</tr>
</table>

### 👨‍💼 Provider Dashboard (`app/provider/`)
Create and manage your food offerings with a comprehensive dashboard:
- ➕ Create and edit food offers with multiple images
- 💰 Set pricing, quantity, and pickup times
- 📊 View detailed offer statistics and analytics
- 📦 Manage incoming orders
- ⭐ View ratings and customer reviews
- 🎯 Track performance metrics

### 🛒 Client Dashboard (`app/client/`)
Discover and purchase discounted food while reducing waste:
- 🔖 Browse and save favorite offers
- 🛍️ Place orders with easy checkout
- 📜 View complete order history
- 📱 QR code generation for pickup verification
- ⭐ Rate and review providers
- 🌱 Track your environmental impact (food saved, CO2 reduced)

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

---

## 🔧 Troubleshooting

### Common Issues

#### Backend Connection Failed
```bash
Error: Network Error or CORS error
```
**Solution:**
- Ensure backend is running at `http://localhost:3001`
- Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- Verify CORS is configured in backend to allow `http://localhost:3000`

#### WebSocket Not Connecting
```bash
WebSocket connection failed
```
**Solution:**
- Check if backend WebSocket server is running
- Verify firewall/proxy settings
- Check browser console for detailed error messages
- Try polling fallback (Socket.io handles this automatically)

#### OAuth Issues
```bash
OAuth redirect not working
```
**Solution:**
- Verify `NEXT_PUBLIC_FRONTEND_URL` matches your actual URL
- Check OAuth provider console for correct redirect URI configuration
- Ensure OAuth credentials are correct in `.env.local`

#### Build Errors
```bash
Type error: Cannot find module
```
**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

#### Images Not Loading
```bash
Images return 404 or broken
```
**Solution:**
- Check if backend is serving images correctly
- Verify `NEXT_PUBLIC_BACKEND_URL` configuration
- Check network tab in browser DevTools for actual requests

---

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t savetheplate-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_URL=https://api.yourapp.com \
  -e NEXT_PUBLIC_FRONTEND_URL=https://yourapp.com \
  savetheplate-frontend
```

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on every push

### Environment-Specific Configuration

**Production checklist:**
- ✅ Set `NODE_ENV=production`
- ✅ Configure production `NEXT_PUBLIC_BACKEND_URL`
- ✅ Add OAuth credentials for production domains
- ✅ Enable performance monitoring if needed
- ✅ Configure CDN for static assets
- ✅ Set up error tracking (e.g., Sentry)

---

## 🌐 Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | ✅ Fully supported |
| Firefox | 88+ | ✅ Fully supported |
| Safari | 14+ | ✅ Fully supported (PWA limited) |
| Edge | 90+ | ✅ Fully supported |
| Mobile Safari | iOS 14+ | ✅ PWA installable |
| Chrome Mobile | Android 90+ | ✅ PWA installable |

**Required features:**
- ES2020 support
- WebSocket or polling fallback
- Geolocation API
- Local Storage
- Service Worker (for PWA)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository** and clone your fork
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our code standards
4. **Test your changes**:
   ```bash
   npm run test
   npm run lint
   npm run build
   ```
5. **Commit with descriptive messages**:
   ```bash
   git commit -m "feat: add new offer filter component"
   ```
6. **Push to your fork** and create a Pull Request

### Code Standards

- ✅ Use TypeScript for all new code
- ✅ Follow existing code style (ESLint will enforce this)
- ✅ Write tests for new features
- ✅ Update translations in both `en.json` and `fr.json`
- ✅ Use Tailwind CSS for styling (avoid inline styles)
- ✅ Add JSDoc comments for complex functions
- ✅ Keep components small and focused

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Pull Request Guidelines

- Provide clear description of changes
- Link related issues
- Include screenshots for UI changes
- Ensure all checks pass (tests, linting, build)
- Request review from maintainers

---

## ⚡ Performance & Optimization

### Current Optimizations

✅ **React Query Caching**
- 2-minute stale time for offer data
- 10-minute garbage collection
- Automatic background refetching

✅ **Image Optimization**
- Next.js Image component for automatic optimization
- Lazy loading for off-screen images
- WebP format with fallbacks

✅ **Code Splitting**
- Automatic route-based code splitting
- Dynamic imports for heavy components
- Tree-shaking to remove unused code

✅ **Bundle Analysis**
```bash
npm run analyze
```

### Performance Monitoring

```bash
# Enable performance monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true npm run dev
```

### Optimization Tips

1. **Use Server Components** when possible (no "use client" needed)
2. **Lazy load heavy components**:
   ```typescript
   const MapComponent = dynamic(() => import('@/components/MapComponent'), {
     ssr: false,
     loading: () => <MapSkeleton />
   });
   ```
3. **Optimize images** using Next.js Image component
4. **Minimize bundle size** by checking `npm run analyze` results
5. **Use React Query** for server data (automatic caching & deduplication)

---

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
- **Next.js 16 App Router** - File-based routing, server components, streaming SSR
- **React Query** - Data fetching, caching, and synchronization
- **Tailwind CSS** - Utility-first styling approach
- **TypeScript** - Type safety and interfaces
- **WebSocket** - Real-time bidirectional communication
- **PWA** - Progressive web app concepts and offline-first strategies

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

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project Links
- **Repository**: [github.com/SaveThePlate/savetheplate-frontend](https://github.com/SaveThePlate/savetheplate-frontend)
- **Backend API**: [github.com/SaveThePlate/leftover-backend](https://github.com/SaveThePlate/leftover-backend)
- **Issues**: [Report bugs or request features](https://github.com/SaveThePlate/savetheplate-frontend/issues)

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<div align="center">

**Made with ❤️ by the SaveThePlate Team**

*Reducing food waste, one plate at a time* 🍽️

**Last Updated:** January 2026

</div>