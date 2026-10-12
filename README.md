# FotoOwl.AI — React Native Mobile Application

> **React Native Mobile Engineering & UI/UX Assignment Submission for FotoOwl.ai**  
> *"Every Moment, Beautifully Captured"*

---

## 1. Project Overview

**FotoOwl.AI** is a production-quality, photography-focused mobile application built with **React Native**, **Expo SDK 57**, and **TypeScript**. Designed for an AI-powered media and event photography platform, FotoOwl.AI delivers high-fidelity media exploration, real-time client-side search and filtering, offline session persistence, synchronized favorites, detailed technical asset previews, full-screen image viewing, and direct gallery downloads.

---

## 2. Branding Note & Logo Disclosure

- **Official Application Name**: `FotoOwl.AI`
- **Branding Foundation**: Modern photography aesthetic anchored by deep charcoal navy foundations (`#0B111E`), crisp typography, soft neutral cards in light mode, and signature teal/cyan highlights (`#06B6D4`, `#22D3EE`).
- **Brand Logo & Emblem Disclosure**:  
  > *Notice:* An inspection of the initial project folder showed no pre-existing official raster or SVG assets for FotoOwl.ai. In accordance with the assignment guidelines, a dedicated, reusable `BrandLogo` component (`src/components/BrandLogo.tsx`) has been crafted featuring a stylized geometric AI owl emblem with camera aperture eyes and neural accents. This serves as a clean, temporary placeholder until official company vector brand guidelines and SVGs are integrated.

---

## 3. Features Implemented

### 🚀 Splash & Onboarding Flow
- Animated splash screen featuring the FotoOwl.AI logo, app title, and tagline (*"Every Moment, Beautifully Captured"*).
- Silent session restoration on app launch with zero visual flicker.
- Direct redirection: Authenticated users bypass the login screen and land directly on the Gallery, while unauthenticated users are routed to Login.

### 🔐 Authentication & Registration
- **User Registration**:
  - Full Name (minimum 2 characters).
  - Email Address (RFC format validation).
  - Gender selection with custom radio buttons (`Male`, `Female`, `Other`).
  - Mobile Number (strictly numeric, exactly 10 digits).
  - Street Address.
  - City dropdown selector with popular Indian metropolitan hubs.
  - Password & Confirm Password (minimum 6 characters, matching confirmation).
  - Duplicate registration protection for existing emails.
  - Local database persistence via `@react-native-async-storage/async-storage`.
- **User Login**:
  - Validates credentials against locally registered user database.
  - Active session tokens and timestamps persisted across restarts.
  - Show/hide password controls.
  - **Quick Demo Account Button**: One-tap auto-fill (`demo@fotoowl.ai` / `password123`) for evaluation.

### 📸 Photo Gallery (Home Screen)
- **Real API Integration**: Fetches real media from `https://picsum.photos/v2/list?page=1&limit=50`.
- **High-Performance Grid**: Rendered with React Native `FlatList` with optimized thumbnail rendering.
- **Infinite Scrolling**: Auto-fetches subsequent pages (`page=2`, `page=3`, ...) upon reaching 40% of list end.
- **Pull-to-Refresh**: Instant gallery refresh via native `RefreshControl`.
- **Request In-Flight Guards**: Prevents duplicate network calls and deduplicates incoming photo IDs.
- **Resilient Network Handling**: User-friendly `ErrorState` with retry buttons and loading indicators.

### 🔍 Real-Time Search & Alphabetic Filters
- Real-time case-insensitive search by photographer/author name.
- Custom debouncing (`useDebounce`) to ensure 60fps scrolling and eliminate UI lag.
- **Author Alphabetic Filters**:
  - `All Images`
  - `Authors A–M`
  - `Authors N–Z`
- Combined search query and alphabetic filters operate concurrently without corrupting the underlying photo dataset.
- Polished empty states when search returns no matching photographers.

### ❤️ Centralized Favorites System
- Toggle photos as favorites from Home, Favorites, or Image Details.
- Centralized `FavoritesContext` with $O(1)$ ID lookups via `Set`.
- Instant cross-screen synchronization: adding/removing a favorite on one screen immediately updates all other screens and tab badge counts.
- Persistent storage across app restarts (`@fotoowl_favorites`).
- Dedicated **Favorites Screen** with author search, photo cards, direct removal, and "Browse Photos" empty state CTA.

### 🖼️ Image Details & Full-Screen Viewer
- High-resolution hero display with photographer attribution, asset ID, and dimensions (`width × height`).
- **Full-Screen Viewer**: Modal full-screen viewing with edge-to-edge presentation.
- **Functional Gallery Download**:
  - Uses `expo-media-library` and `expo-file-system`.
  - Prompts for platform permissions.
  - Saves photos directly to the device photo library (creates a `"FotoOwl.AI"` album when supported).
  - Handles permission denials and failure states gracefully with user alerts.
- **Native Sharing Sheet**: Direct media sharing via `expo-sharing` (mobile) or Web Share API (web).

### 👤 Profile & Customization
- Displays full member profile: Name, Email, Mobile, Gender, Address, City.
- **Edit Profile Modal**: Validates and updates profile details, immediately persisting to storage and active session.
- **Avatar Selection**: Choose between AI Owl avatars (`AI Owl Prime`, `Photo Pro`, `Vision Focus`, `Galaxy Vision`).
- **Dark / Light Theme Switcher**: Toggle between dark charcoal and light neutral themes; choice persists in storage across restarts.
- **Logout with Confirmation Dialog**: Secure session clearing with cancel/confirm protection.

---

## 4. Technology Stack & Libraries

| Technology | Purpose |
|---|---|
| **React Native (0.86.3)** | Core mobile application framework |
| **Expo (SDK ~57.0.27)** | Tooling, runtime, and native module integration |
| **TypeScript (strict)** | Complete type safety, models, and interfaces |
| **@react-navigation/native** | Routing and screen hierarchy |
| **@react-navigation/native-stack** | Native transitions for Auth & Details flows |
| **@react-navigation/bottom-tabs** | Bottom navigation bar with dynamic badges |
| **@react-native-async-storage/async-storage** | Local state and session persistence |
| **expo-media-library** | Device photo gallery permissions and asset creation |
| **expo-file-system** | Background image download and filesystem cache management |
| **expo-sharing** | Native platform share sheet integration |
| **@expo/vector-icons** | Consistent Ionicons design system |
| **Jest & ts-jest** | Automated unit tests for form validation and filters |

---

## 5. Architecture & Project Structure

```
Fotoowl.Ai/
├── __tests__/                      # Automated unit test suites
│   ├── filters.test.ts             # Search & A-M / N-Z filter tests
│   └── validation.test.ts          # Email, phone, password validation tests
├── assets/                         # Application icons & splash assets
├── src/
│   ├── components/                 # Reusable UI components
│   │   ├── BrandLogo.tsx           # Reusable FotoOwl.AI logo emblem
│   │   ├── BrandedHeader.tsx       # Header with logo, theme toggle & title
│   │   ├── ConfirmationDialog.tsx  # Modal confirmation dialog
│   │   ├── EmptyState.tsx          # Clean empty state with icon & CTA
│   │   ├── ErrorState.tsx          # Network error screen with retry button
│   │   ├── FilterSelector.tsx      # All, A-M, N-Z filter pills
│   │   ├── LoadingIndicator.tsx    # Branded activity indicator
│   │   ├── PhotoCard.tsx           # Photo card with favorites toggle & ID
│   │   ├── PrimaryButton.tsx       # Button with variants (primary, danger, outline)
│   │   ├── SearchBar.tsx           # Author search input with clear button
│   │   └── TextInputField.tsx      # Form input with validation states
│   ├── constants/                  # Configuration & API endpoints
│   │   ├── api.ts                  # Picsum endpoints & page limits
│   │   └── cities.ts               # City selector data
│   ├── context/                    # Centralized React Context state
│   │   ├── AuthContext.tsx         # User authentication & session state
│   │   ├── FavoritesContext.tsx    # Global favorites state & sync
│   │   └── ThemeContext.tsx        # Dark/Light theme switching & persistence
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── useDebounce.ts          # Search debounce hook
│   │   ├── useFavorites.ts         # Favorites manager hook
│   │   ├── usePhotos.ts            # Gallery fetching & pagination hook
│   │   └── useTheme.ts             # Theme manager hook
│   ├── navigation/                 # Navigation setup
│   │   ├── AppNavigator.tsx        # Root conditional navigator
│   │   ├── AuthNavigator.tsx       # Splash, Login, Register stack
│   │   ├── MainTabNavigator.tsx    # Bottom tab bar (Home, Favorites, Profile)
│   │   └── types.ts                # Navigation parameter types
│   ├── screens/                    # Application screens
│   │   ├── Favorites/              # Saved favorites screen
│   │   ├── Home/                   # Main gallery screen
│   │   ├── ImageDetails/           # Details, download & full-screen view
│   │   ├── Login/                  # User login screen
│   │   ├── Profile/                # Profile management & settings
│   │   ├── Register/               # Registration screen
│   │   └── Splash/                 # Branded launch screen
│   ├── services/                   # External services
│   │   ├── api.ts                  # Picsum API client with timeout
│   │   └── media.ts                # Gallery download & native share service
│   ├── storage/                    # Storage layer
│   │   └── asyncStorage.ts         # Strongly typed AsyncStorage wrappers
│   ├── theme/                      # Design system
│   │   ├── colors.ts               # Dark & light color tokens
│   │   ├── theme.ts                # Typography, spacing & radius definitions
│   │   └── types.ts                # Theme types
│   ├── types/                      # TypeScript definitions
│   │   ├── navigation.ts           # Navigation param lists
│   │   ├── photo.ts                # Photo & filter models
│   │   └── user.ts                 # User & auth models
│   └── utils/                      # Helper utilities
│       ├── formatters.ts           # Filtering & dimension utilities
│       └── validation.ts           # Form validation functions
├── App.tsx                         # Root app entry point
├── app.json                        # Expo app manifest & permissions
├── jest.config.js                  # Jest configuration
├── package.json                    # Dependencies & scripts
└── tsconfig.json                   # Strict TypeScript compiler options
```

---

## 6. Installation & Run Commands

### Prerequisites
- Node.js (v18 or higher recommended; developed and tested on Node v22.14)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Application
Start the Expo development server:
```bash
npx expo start
```
From the interactive menu:
- Press `a` to open on an Android emulator or connected device.
- Press `i` to open on an iOS simulator.
- Press `w` to run in the web browser.

### 3. Run Automated Tests
Execute the Jest unit test suite:
```bash
npm test
```
*Result: 17 passed tests across validation and filtering suites.*

### 4. Run TypeScript Checks
Verify strict TypeScript compilation:
```bash
npx tsc --noEmit
```

### 5. Verify Production JS Bundling
Test the production bundle generation for both Android and iOS:
```bash
npx expo export
```

---

## 7. API Endpoint & Pagination Explanation

- **Endpoint**: `https://picsum.photos/v2/list?page=${page}&limit=50`
- **Pagination Strategy**:
  1. Initial load calls `page=1&limit=50`.
  2. As the user reaches the end of the `FlatList` (`onEndReachedThreshold={0.4}`), `loadMore()` requests `page=page+1`.
  3. Received items are deduplicated against existing photo IDs using `Set<string>` to prevent React list key collisions.
  4. An in-flight reference flag (`isFetchingRef`) blocks concurrent requests while pagination is underway.
  5. If an empty array is returned, `hasMore` is set to `false`, terminating further requests.

---

## 8. Authentication & Local Storage Assumptions

- **Local Persistence Model**: In accordance with the assignment guidelines, user accounts, sessions, and favorites are stored locally on the device using `@react-native-async-storage/async-storage`.
- **Session Keys**:
  - `@fotoowl_session`: Active user session and auth token.
  - `@fotoowl_users`: Registry of registered accounts.
  - `@fotoowl_favorites`: Curated list of user-favorited photos.
  - `@fotoowl_theme`: Preferred theme mode (`dark` or `light`).
- **Security Notice**: Local storage authentication is implemented specifically for assignment evaluation and offline standalone operation. In a production cloud backend, passwords would be hashed using Argon2/bcrypt on a secure auth server and exchange short-lived JWT tokens.

---

## 9. Android APK Build Instructions

To build a standalone installable Android APK:

### Option A: Using EAS Build (Recommended for Expo)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Configure the build profile in `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```
4. Trigger the APK build:
   ```bash
   eas build -p android --profile preview
   ```

### Option B: Local Android Gradle Build
1. Generate the native `/android` folder:
   ```bash
   npx expo prebuild --platform android
   ```
2. Build the APK via Gradle:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
   *The generated APK will be located at `android/app/build/outputs/apk/release/app-release.apk`.*

---

## 10. Environment Verification & Known Limitations

- **Bundling Verification**: Successfully tested via `npx expo export`. Both Android (`index-2dd4efe4bc20329f1b46b4c935937e69.hbc`, 2.5MB) and iOS (`index-7b330e45516bceae7ffa3ab98ebf8f4e.hbc`, 2.5MB) bundles compile with zero errors.
- **Type Checking**: Strict TypeScript validation (`npx tsc --noEmit`) passes with 0 errors.
- **Unit Testing**: All 17 Jest test suites pass.
- **Native Android SDK Tooling**: The current development container environment does not have the local Android SDK (`ANDROID_HOME` / `adb`) installed. Consequently, a local Gradle build cannot be executed inside this shell. The code is 100% prepped for EAS Build or standard Android Studio machines.
- **Image Saving**: On physical devices, media saving requires user permission grant for `READ_MEDIA_IMAGES` / `WRITE_EXTERNAL_STORAGE`. On web preview, saving falls back to standard file download.

---

## 11. Final Acceptance Checklist

| Feature | Status | Notes |
|---|---|---|
| Application named FotoOwl.AI | ✅ Complete | Set in `app.json`, header, branding |
| Branded Splash Screen | ✅ Complete | Centered logo, tagline, smooth animation |
| Company Logo & Identity | ✅ Complete | Dedicated `BrandLogo` component |
| Registration Screen | ✅ Complete | 8 fields, 10-digit mobile, radio, city dropdown, validation |
| Login Screen | ✅ Complete | Credential check, demo auto-fill, error handling |
| Session Persistence | ✅ Complete | Persists across app reloads via AsyncStorage |
| Gallery API Fetch | ✅ Complete | Live Picsum photos API with 50 items/page |
| Loading, Error & Retry | ✅ Complete | Dedicated components with refresh control |
| Infinite Scroll Pagination | ✅ Complete | Subsequent page requests with deduplication |
| Search & Alphabetic Filters | ✅ Complete | Search + All / A–M / N–Z work concurrently |
| Synchronized Favorites | ✅ Complete | Instant cross-screen state sync via Context |
| Image Details & Viewer | ✅ Complete | Metadata, dimensions, full-screen modal |
| Functional Image Download | ✅ Complete | Media library permission + file download |
| Profile Screen & Editing | ✅ Complete | View and update profile, avatar selection |
| Logout Confirmation | ✅ Complete | Custom confirmation dialog |
| Dark & Light Themes | ✅ Complete | Persisted theme preference toggle |
| Unit Tests | ✅ Complete | 17 Jest tests covering validation & filters |
| TypeScript Strict Mode | ✅ Complete | Zero errors on `npx tsc --noEmit` |
