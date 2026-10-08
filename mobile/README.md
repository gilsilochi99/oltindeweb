# Oltinde Mobile (Expo)

Phase 0 of the Oltinde mobile app: project scaffold, theming ported from the web app,
Firebase-backed auth (email/password + Google), and a role-aware tab shell. See
`../.claude` or ask Claude for the full phased roadmap.

## Stack

- Expo (TypeScript) + Expo Router, custom dev client (not Expo Go — see below)
- `@react-native-firebase` (native SDK, modular API) for Auth/Firestore/Storage/Messaging,
  pointed at the same `oltindeapp` Firebase project the web app uses
- NativeWind, themed with the same CSS variables as `../src/app/globals.css`
- TanStack Query, react-hook-form + zod

## Required manual setup before this runs on a device

These need Firebase/Google/Apple console access this session didn't have:

1. **Register native apps in the `oltindeapp` Firebase project** (console.firebase.google.com):
   - Add an Android app with package name `com.oltinde.app` → download `google-services.json`
     into `mobile/google-services.json`.
   - Add an iOS app with bundle ID `com.oltinde.app` → download `GoogleService-Info.plist`
     into `mobile/GoogleService-Info.plist`.
   - (Both paths are already wired up in `app.json`.)

2. **Google Sign-In**: in the Firebase console under Authentication → Sign-in method →
   Google, copy the **Web client ID** and paste it into
   `app/_layout.tsx`'s `GoogleSignin.configure({ webClientId: ... })` call (replacing the
   `REPLACE_WITH_OLTINDEAPP_WEB_CLIENT_ID...` placeholder). For iOS, also copy the iOS
   client's **reversed client ID** (from `GoogleService-Info.plist`, `REVERSED_CLIENT_ID`
   key) into `app.json`'s `iosUrlScheme` plugin option (replacing
   `REPLACE_WITH_IOS_REVERSED_CLIENT_ID`).

3. **Build a dev client** — `@react-native-firebase` and Google Sign-In are native modules,
   so this app can't run in plain Expo Go. Either:
   - `npx expo run:android` / `npx expo run:ios` locally (needs Android Studio / Xcode), or
   - `eas build --profile development` (needs an Expo/EAS account) — recommended, since it
     also covers iOS from Windows/Linux.

## Known benign warning

`npx expo-doctor` flags a "duplicate react" dependency because this folder lives inside
the Next.js web app's repo, which also has its own `react` in `../node_modules`. There's
no npm workspace link between the two — `mobile/` has its own independent
`node_modules` — so Metro's resolver (scoped to `mobile/` as its project root) never
actually reaches the parent tree. Safe to ignore.
