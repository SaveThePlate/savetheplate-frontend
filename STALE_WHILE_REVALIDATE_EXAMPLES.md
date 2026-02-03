/**
 * Example: How to Implement Stale-While-Revalidate on Other Pages
 * 
 * This file shows the exact pattern used on home page
 * Apply this same approach to:
 * - Orders list page
 * - Profile page
 * - Offer detail page
 * - Any page with data fetching
 */

// ============================================================================
// STEP 1: Add isInitialLoad state tracking
// ============================================================================

// Add this to your useState declarations:
const [loading, setLoading] = useState(true);
const [isInitialLoad, setIsInitialLoad] = useState(true); // ← ADD THIS LINE
const [data, setData] = useState<DataType[]>([]);
const [error, setError] = useState<string | null>(null);


// ============================================================================
// STEP 2: Set isInitialLoad to false after first fetch completes
// ============================================================================

const fetchData = async () => {
  setLoading(true);
  try {
    const result = await api.getData();
    setData(result);
  } catch (err) {
    setError(sanitizeErrorMessage(err));
  } finally {
    setLoading(false);
    setIsInitialLoad(false); // ← ADD THIS LINE - after first load, always false
  }
};

// Call this in useEffect
useEffect(() => {
  fetchData();
}, []);


// ============================================================================
// STEP 3: Update render logic to show skeleton only on initial load
// ============================================================================

// BEFORE (always shows skeleton while loading):
if (loading) {
  return <SkeletonLoader />;
}

// AFTER (shows skeleton only on initial load, cached data on refresh):
if (loading && isInitialLoad) {
  return <SkeletonLoader />; // First load: show skeleton
}

if (loading && !isInitialLoad && data.length > 0) {
  // Refresh: show cached data with refresh indicator
  return (
    <div className="opacity-90">
      <RefreshIndicator /> {/* Shows "Refreshing..." in corner */}
      <DataDisplay data={data} />
    </div>
  );
}

return <DataDisplay data={data} />;


// ============================================================================
// STEP 4: Optional - Create reusable hook for cleaner code
// ============================================================================

/**
 * Custom hook that manages SWR pattern automatically
 */
function useDataWithSWR<T>(
  key: string,
  fetchFn: () => Promise<T[]>,
  skeletonComponent: React.ReactNode
) {
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchFn();
        setData(result);
      } catch (err) {
        setError(sanitizeErrorMessage(err));
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    load();
  }, []);

  // Return loading state + skeleton component
  return {
    data,
    error,
    isLoading: loading,
    isInitialLoad,
    LoadingComponent: () => {
      if (loading && isInitialLoad) {
        return skeletonComponent;
      }
      return null;
    }
  };
}

// Usage:
const {
  data: offers,
  isLoading,
  isInitialLoad,
  LoadingComponent
} = useDataWithSWR('offers', fetchOffers, <OffersGridSkeleton />);

// Then in render:
if (LoadingComponent()) return <LoadingComponent />;
if (isLoading && !isInitialLoad && offers.length > 0) {
  return <DataWithRefresh data={offers} />;
}
return <DataDisplay data={offers} />;


// ============================================================================
// EXAMPLE 1: Orders List Page
// ============================================================================

// components/pages/OrdersPage.tsx
export const OrdersPage = () => {
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await api.getUserOrders();
        setOrders(data);
      } finally {
        setLoading(false);
        setIsInitialLoad(false); // KEY LINE
      }
    };
    fetchOrders();
  }, []);

  // Show skeleton only on first load
  if (loading && isInitialLoad) {
    return <OrdersListSkeleton />;
  }

  // Show cached orders while refreshing
  if (loading && !isInitialLoad && orders.length > 0) {
    return (
      <div className="opacity-90">
        <RefreshIndicator />
        <OrdersList orders={orders} />
      </div>
    );
  }

  return <OrdersList orders={orders} />;
};


// ============================================================================
// EXAMPLE 2: Profile Page
// ============================================================================

// app/client/profile/page.tsx
export const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await api.getUserProfile();
        setProfile(data);
      } finally {
        setLoading(false);
        setIsInitialLoad(false); // KEY LINE
      }
    };
    fetchProfile();
  }, []);

  // Skeleton on initial load
  if (loading && isInitialLoad) {
    return <ProfileSkeleton />;
  }

  // Show cached profile while reloading
  if (loading && !isInitialLoad && profile) {
    return (
      <div className="opacity-90">
        <RefreshIndicator />
        <ProfileContent profile={profile} />
      </div>
    );
  }

  return <ProfileContent profile={profile} />;
};


// ============================================================================
// STEP 5: Add RefreshIndicator component (reusable)
// ============================================================================

// components/RefreshIndicator.tsx
export const RefreshIndicator = () => {
  return (
    <div className="fixed top-2 right-4 text-sm text-gray-500 animate-pulse z-50">
      <Loader2 className="inline w-4 h-4 mr-1 animate-spin" />
      Refreshing...
    </div>
  );
};


// ============================================================================
// Common Mistakes to Avoid
// ============================================================================

// ❌ WRONG: Setting isInitialLoad in wrong place
const fetchData = () => {
  setLoading(true);
  setIsInitialLoad(false); // WRONG - sets too early!
  api.getData().then(data => {
    setData(data);
    setLoading(false);
  });
};

// ✅ CORRECT: Set after first fetch completes
const fetchData = async () => {
  setLoading(true);
  try {
    const data = await api.getData();
    setData(data);
  } finally {
    setLoading(false);
    setIsInitialLoad(false); // CORRECT - set in finally block
  }
};


// ❌ WRONG: Always showing skeleton
if (loading) return <Skeleton />;

// ✅ CORRECT: Show skeleton only on first load
if (loading && isInitialLoad) return <Skeleton />;


// ============================================================================
// Implementation Checklist
// ============================================================================

// For each page you want to improve:
// 
// [ ] Add: const [isInitialLoad, setIsInitialLoad] = useState(true);
// [ ] Add: setIsInitialLoad(false) in finally block of data fetch
// [ ] Update: if (loading) check to if (loading && isInitialLoad)
// [ ] Add: Show cached data while loading and !isInitialLoad
// [ ] Test: Verify skeleton shows on first load only
// [ ] Test: Verify cached data shows on refresh
// [ ] Test: Verify "Refreshing..." indicator appears
// [ ] Commit: Push changes with clear message about pattern used
//

// ============================================================================
// Performance Expectations
// ============================================================================

// Time to Interactive (TTI):
// Before:  User waits for full data fetch + render = 2-3 seconds
// After:   Shows skeleton immediately, cached data in ~300ms
//          User perceives instant feedback

// First Contentful Paint (FCP):
// Before:  Empty page + loading spinner = ~1.5s
// After:   Skeleton layout = ~0.3s

// Interaction to Paint (INP):
// Before:  Slow because loading overlays interact
// After:   Smooth because content always visible


// ============================================================================
// Debugging Tips
// ============================================================================

// If skeleton doesn't show:
// → Check: Is isInitialLoad actually being set?
// → Add: console.log('isInitialLoad:', isInitialLoad, 'loading:', loading)

// If cached data doesn't show on refresh:
// → Check: Is data array not empty? (needs data.length > 0)
// → Check: Is !isInitialLoad true? (second load or later)
// → Check: Is loading true? (fetch in progress)

// Monitor in React DevTools:
// → Watch isInitialLoad state changes
// → Verify it goes: true → false after first fetch
// → Check loading state timing
