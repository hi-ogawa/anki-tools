# Toast Notifications

## Goal

Replace browser `alert()` calls with toast notifications for better UX. Toasts are non-blocking and auto-dismiss.

## Current Usage

| Location           | Type    | Usage                                        |
| ------------------ | ------- | -------------------------------------------- |
| `src/root.tsx:55`  | Error   | Global mutation error handler in QueryClient |
| `src/root.tsx:447` | Success | "Copied N cards to clipboard"                |

Note: `window.confirm()` calls (lines 468, 475) are intentional for destructive bulk actions - keep as-is.

## Design Decisions

### Toast Library

**Option A: sonner** (recommended)

- Lightweight (~3KB), popular
- Simple API: `toast.error("message")`, `toast.success("message")`
- Good defaults, minimal setup
- shadcn/ui compatible

**Option B: @radix-ui/react-toast**

- Official Radix primitive
- More control, more boilerplate
- Requires building component from scratch

**Option C: react-hot-toast**

- Similar to sonner
- Slightly larger

**Choice: sonner** - simplest API, minimal code changes needed.

### Toast Position

**Option A: Top-right** (chosen)

- Standard web app pattern
- Doesn't block main content
- Consistent with most apps

**Option B: Bottom-center**

- Mobile-friendly
- Can block table pagination

### Toast Duration

- Error: 5 seconds (need time to read)
- Success: 3 seconds
- Allow manual dismiss via X button

## Implementation

### 1. Install sonner

```bash
pnpm add sonner
```

### 2. Add Toaster component (`src/main.tsx`)

```tsx
import { Toaster } from "sonner";

// In root render
<RouterProvider router={router} />
<Toaster position="top-right" richColors />
```

### 3. Replace alert() in QueryClient (`src/root.tsx:55`)

```tsx
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => toast.error(error.message),
    },
  },
});
```

### 4. Replace success alert (`src/root.tsx:447`)

```tsx
onSuccess: ({ count, action }) => {
  if (action === "copy") {
    toast.success(`Copied ${count} cards to clipboard`);
  }
},
```

## Files to Modify

1. `package.json` - add sonner dependency
2. `src/main.tsx` - add Toaster component
3. `src/root.tsx` - replace alert() with toast()

## Testing

E2E scenarios:

1. Trigger mutation error (e.g., stop Anki server) - verify toast appears
2. Copy cards to clipboard - verify success toast
3. Verify toasts auto-dismiss after timeout
4. Verify multiple toasts stack properly
