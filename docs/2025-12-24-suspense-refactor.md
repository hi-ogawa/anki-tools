# Suspense Refactor for getModels Query

## Goal

Implement "good async React" pattern to reduce flicker on initial load and during URL state transitions. Start with the first waterfall query (`getModels`).

## Current Behavior

```
App()
  ├── useQuery(getModels) → { data: models, isLoading, error }
  ├── Header
  │     ├── Model Select (needs models, disabled when loading/error)
  │     └── View Select (disabled when loading/error)
  └── Main
        └── Conditional content based on isLoading/error/models state
```

**Current UX flow:**

1. Initial render: Header visible with disabled selects, main shows "Connecting to Anki..."
2. On success: Selects enabled with options populated, main shows content
3. On error: Selects remain disabled, main shows error + retry button

**Key observation:** Header is always rendered, just with different enabled/disabled states.

## Problems

### 1. Loading state flicker

The `isLoading` conditional causes a brief flash of "Connecting to Anki..." text before the full UI renders.

### 2. Auto-select effect causes extra render

```tsx
useEffect(() => {
  if (hasAutoSelected.current) return;
  if (!models || urlModel) return;
  if (lastModel && models[lastModel]) {
    hasAutoSelected.current = true;
    setSearchParams((prev) => {
      prev.set("model", lastModel);
      return prev;
    });
  }
}, [models, urlModel, lastModel, setSearchParams]);
```

This effect runs AFTER render, so:

1. First render: no model in URL → shows "Select a note type to browse"
2. Effect fires → updates URL with lastModel
3. Second render: model in URL → shows actual content

This post-render URL mutation causes visible flicker.

### Solution: Compute effective model during render

With `useSuspenseQuery`, `models` is guaranteed available during render. We can compute the "effective model" synchronously:

```tsx
function AppWithData() {
  const { data: models } = useSuspenseQuery(api.getModels.queryOptions());
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastModel, setLastModel] = useLocalStorage("anki-browse-last-model", null);

  const urlModel = searchParams.get("model");

  // Compute effective model synchronously during render
  const effectiveModel = useMemo(() => {
    if (urlModel && models[urlModel]) return urlModel;
    if (lastModel && models[lastModel]) return lastModel;
    return null;
  }, [urlModel, lastModel, models]);

  // Sync URL if needed (still an effect, but won't cause content flicker)
  useEffect(() => {
    if (effectiveModel && effectiveModel !== urlModel) {
      setSearchParams((prev) => {
        prev.set("model", effectiveModel);
        return prev;
      }, { replace: true });
    }
  }, [effectiveModel, urlModel, setSearchParams]);

  // Use effectiveModel for rendering - no flicker because it's computed upfront
  // ...
}
```

Key insight: Use `effectiveModel` for all rendering decisions, not `urlModel`. The URL sync effect just keeps URL in sync but doesn't affect what's displayed.

Alternative: Use React Router's loader to handle this before component renders.

## Proposed Architecture

Keep it simple:

```
Root
└── QueryClientProvider
    └── Suspense fallback={<p>Connecting to Anki...</p>}
        └── ErrorBoundary fallback={<FullPageError />}
            └── App
                └── useSuspenseQuery(getModels)
                └── effectiveModel computed via useMemo
                └── ... rest of app
```

**Rationale:**

- getModels is expected to be very fast → Suspense fallback rarely shows
- If getModels fails, nothing works → full-page error + retry is appropriate
- No need for complex AppShell with multiple states

**Status:** Implemented. Initial mount shows brief fallback (expected behavior, see Findings section below).

## Implementation Steps

1. Add `react-error-boundary` package
2. Refactor `App` to use `useSuspenseQuery` for getModels
3. Compute `effectiveModel` synchronously via useMemo (replaces useEffect auto-select)
4. Sync URL in effect (non-blocking)
5. Wrap with Suspense + ErrorBoundary in `Root`
6. Remove `isLoading`/`schemaError` conditionals
7. Remove `hasAutoSelected` ref hack

## Findings: Suspense Fallback Behavior

### Initial Mount vs Subsequent Updates

React Suspense behavior differs between initial mount and subsequent updates:

1. **Initial mount** → Suspense fallback **WILL** show immediately when component suspends, regardless of how fast data returns (even 3ms)

2. **Subsequent updates wrapped in transitions** → Suspense fallback will **NOT** show again. React keeps showing current UI while loading in background.

Reference from [async-react example](https://github.com/anthropics/async-react):

```jsx
{/*
   This fallback will be shown when the LessonList suspends initially.
   It will not be show again, like when switching tabs or searching,
   because those updates are wrapped in transitions. Instead of showing
   the fallback again, the list will be updated in the background and
   the optimistic/pending states will be used to show loading instead.
*/}
<Suspense fallback={<Design.FallbackList />}>
  <LessonList ... />
</Suspense>
```

### Eliminating Initial Flash

To avoid the fallback flash on initial page load (without SSR), **prefetch data before component mounts** using React Router loader:

```tsx
const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    loader: async () => {
      await queryClient.prefetchQuery({
        queryKey: ["getModels"],
        queryFn: api.getModels,
        staleTime: Infinity,
      });
      return null;
    },
  },
]);
```

When data is already in cache, `useSuspenseQuery` returns immediately → no suspend → no fallback shown.

## Next Step: NotesView Suspense

Apply same pattern to `fetchItems` query in NotesView:

```
Suspense fallback={...}
  └── App (useSuspenseQuery: getModels)
        └── NotesView (useSuspenseQuery: fetchItems)
              └── content
```

**Benefits:**

- Both queries suspend under same boundary → single initial flash
- Subsequent URL changes (pagination, search, filters) wrapped in transitions → no fallback shown
- Use `useTransition` or action pattern for URL state changes

**Implementation:**

1. Change `useQuery` to `useSuspenseQuery` in NotesView for fetchItems
2. Remove `isLoading` conditional
3. Ensure URL state changes are in transitions (already using `unstable_useTransitions` in RouterProvider)
