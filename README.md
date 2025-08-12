# Get It Done

A minimalist, responsive to‑do list application built with Next.js (App Router) and Firebase. It supports authenticated user sessions, profile display name updates, and task views segmented by timeframe (Today / Tomorrow). Designed for fast iteration and Vercel deployment.

---

## Key Features

- Next.js App Router setup ([src/app/layout.js](src/app/layout.js))
- Firebase Authentication & Firestore integration ([src/app/api/firebase-config.js](src/app/api/firebase-config.js))
- User session handling with redirect-on-logout logic
- Profile display name editing modal ([src/app/dashboard/component/Sidebar.js](src/app/dashboard/component/Sidebar.js))
- Custom profile update event: `window.dispatchEvent(new CustomEvent('profile-updated', { detail: { displayName } }))`
- Task view switching (Today / Tomorrow)
- Drag & drop foundation via `@dnd-kit/*` (available for future task ordering)
- Responsive sidebar with mobile close interaction
- Tailwind CSS (via PostCSS config)
- Ready for Vercel deployment

---

## Tech Stack

- Next.js 15 ([package.json](package.json))
- React 19
- Firebase Web SDK 12
- Firestore & Storage
- React Icons
- DnD Kit
- Tailwind/PostCSS pipeline

---

## Project Structure (Excerpt)

```
.
├─ package.json
├─ .env.example
├─ src/
│  └─ app/
│     ├─ layout.js
│     ├─ api/
│     │  └─ firebase-config.js
│     └─ dashboard/
│        └─ component/
│           └─ Sidebar.js
├─ public/
│  ├─ logo.png
│  └─ dashboard/
│     └─ blank-user.svg
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase project values. Typical variables (adjust to match those used in [src/app/api/firebase-config.js](src/app/api/firebase-config.js)):

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=##########
NEXT_PUBLIC_FIREBASE_APP_ID=1:##########:web:############
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

If admin SDK features are later added, keep those server-only (do NOT expose in `NEXT_PUBLIC_*`).

---

## Installation

```bash
git clone <repo-url>
cd to-do-list_app
cp .env.example .env.local  # then edit values
npm install
```

---

## Scripts (from [package.json](package.json))

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run start      # Start prod server
npm run lint       # Lint
```

Open http://localhost:3000 after `npm run dev`.

---

## Authentication Flow

- User state observed with `onAuthStateChanged` in [src/app/dashboard/component/Sidebar.js](src/app/dashboard/component/Sidebar.js)
- Missing session redirects to `/auth/sign-in`
- Sign out button calls logout logic (see auth utilities in `src/app/api/auth` if present)

---

## Profile Editing

Located in the sidebar modal:
- Updates display name via `updateUserProfile`
- Implements a timeout safeguard and success/error feedback
- Broadcasts `profile-updated` window event for cross-component sync

---

## UI / UX Notes

- Sidebar is fixed width (mobile-aware)
- Active view styling via conditional classes
- Accessible buttons (aria labels on edit / close)
- Loading states: sign-out + username fetch placeholder

---

## Extending Tasks

Suggested next steps:
- Implement Firestore collections: `tasks/{userId}/items`
- Add fields: `title`, `dueDate`, `status`, `order`
- Use `@dnd-kit/sortable` to persist drag reordering
- Add optimistic UI updates + server sync

---

## Deployment (Vercel)

1. Push repo to GitHub
2. Import to Vercel
3. Add all Firebase env vars in project settings
4. Trigger build (Next.js App Router is supported natively)

---

## Events & Integration Points

| Event | Purpose |
|-------|---------|
| profile-updated | Notify other components to refetch or update cached user display name |

Example listener:

```js
useEffect(() => {
  const handler = e => console.log('Profile updated:', e.detail.displayName);
  window.addEventListener('profile-updated', handler);
  return () => window.removeEventListener('profile-updated', handler);
}, []);
```

---

## Troubleshooting

- Blank username: Ensure Firebase auth user has `displayName` or update via modal.
- Stuck updating profile: Timeout protection (12s + 20s safety) logs to console.
- Redirect loops: Confirm auth state and sign-out sequence; see logic in [src/app/dashboard/component/Sidebar.js](src/app/dashboard/component/Sidebar.js).

---

## Roadmap Ideas

- Task filters & search
- Dark mode
- Offline persistence
- Notifications (Web Push)
- User avatars (upload to Storage)

---

## Contributing

1. Fork
2. Create feature branch
3. Commit with clear messages
4. Open PR

---

## License

Add a LICENSE file (MIT recommended) if you plan public contributions.

---

## Acknowledgments

- Next.js team
- Firebase
- DnD Kit
- Geist font (via `next/font`)
