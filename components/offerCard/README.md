# Offer Card Components - Refactored Structure

## Overview

This directory contains a refactored, optimized structure for offer cards that separates client and provider implementations for better maintainability, performance, and code organization.

## Structure

```
offerCard/
├── index.ts                    # Main exports
├── types.ts                    # Shared TypeScript interfaces
├── utils.ts                    # Shared utility functions
├── ClientOfferCard.tsx         # Client-specific card component
├── ProviderOfferCard.tsx       # Provider-specific card component (to be created)
└── shared/                     # Reusable sub-components
    ├── PriceBadge.tsx          # Price display badge
    ├── QuantityBadge.tsx       # Quantity indicator badge
    └── ProviderOverlay.tsx     # Provider info overlay
```

## Benefits

### 1. **Performance**
- ✅ No role checking on every render
- ✅ Smaller bundle size (tree-shaking removes unused code)
- ✅ Faster initial render (no conditional logic)

### 2. **Maintainability**
- ✅ Clear separation of concerns
- ✅ Easier to modify client/provider-specific features
- ✅ Shared code in one place (DRY principle)

### 3. **Type Safety**
- ✅ Separate props interfaces for each card type
- ✅ Better TypeScript inference
- ✅ Compile-time error checking

### 4. **Code Organization**
- ✅ Modular structure
- ✅ Easy to find and modify specific features
- ✅ Better testability

## Usage

### Client Side
```tsx
import { ClientOfferCard } from "@/components/offerCard";

<ClientOfferCard
  offerId={offer.id}
  title={offer.title}
  description={offer.description}
  price={offer.price}
  // ... other props
  reserveLink={`/client/offers/${offer.id}`}
/>
```

### Provider Side
```tsx
import { ProviderOfferCard } from "@/components/offerCard";

<ProviderOfferCard
  offerId={offer.id}
  title={offer.title}
  // ... other props
  onDelete={handleDelete}
  onUpdate={handleUpdate}
/>
```

## Migration Path

1. Replace `CustomCard` imports with specific card imports
2. Update props to match new interfaces
3. Remove role-based conditional rendering
4. Test both client and provider flows

## Next Steps

- [ ] Create `ProviderOfferCard.tsx` with editing functionality
- [ ] Update `Offers.tsx` to use `ClientOfferCard`
- [ ] Update `provider/home/page.tsx` to use `ProviderOfferCard`
- [ ] Remove old `CustomCard.tsx` after migration
- [ ] Add unit tests for each component

