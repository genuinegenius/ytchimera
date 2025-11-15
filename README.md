# YTB Chimera - YouTube Video Promotion App

A React Native mobile application built with Expo that allows users to earn and spend credits through YouTube video interactions.

## Overview

YTB Chimera operates on a credit-based economy where users can:
- **Earn Credits:** Watch YouTube videos, like them, or subscribe to channels
- **Spend Credits:** Submit your own YouTube videos to be promoted to other users
- **Welcome Bonus:** New users receive 1,000 credits to get started

## Tech Stack

- **Framework:** React Native 0.79.6 with Expo 54
- **Language:** TypeScript
- **Navigation:** React Navigation (Stack & Bottom Tabs)
- **Backend:** Firebase (Authentication & Firestore Database)
- **State Management:** React Context API
- **UI Components:** React Native core components, Expo Vector Icons
- **Video Player:** react-native-youtube-iframe

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on physical device (optional)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ytchimera
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# iOS (Mac only)
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
ytchimera/
├── App.tsx                          # Main app component
├── index.ts                         # App entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── eas.json                         # EAS Build config
├── firestore.rules                  # Firestore security rules
├── assets/                          # App icons and images
└── src/
    ├── components/                  # Reusable components
    │   ├── AdModal.tsx
    │   └── SkeletonLoader.tsx
    ├── contexts/                    # React contexts
    │   └── ThemeContext.tsx
    ├── navigation/                  # Navigation setup
    │   └── AppNavigator.tsx
    ├── screens/                     # App screens
    │   ├── AuthScreen.tsx
    │   ├── HomeScreen.tsx
    │   ├── WatchScreen.tsx
    │   ├── SubmitVideoScreen.tsx
    │   ├── ProfileScreen.tsx
    │   ├── EditProfileScreen.tsx
    │   └── CreditHistoryScreen.tsx
    ├── services/                    # Business logic
    │   ├── firebase.ts
    │   ├── authService.ts
    │   ├── videoService.ts
    │   └── adService.ts
    └── types/                       # TypeScript types
        └── index.ts
```

## Features

### Authentication
- Email/password sign up and sign in
- Persistent authentication with AsyncStorage
- 1,000 welcome bonus credits for new users

### Home Dashboard
- Credit balance display
- User statistics (videos watched, liked, subscribes, submitted)
- "How It Works" information section
- Pull-to-refresh

### Earn Credits (Watch Screen)
- Random video queue from other users
- YouTube video player integration
- Watch time tracking
- Optional like and subscribe interactions
- Credit rewards:
  - Watch: 50 credits/minute
  - Like: 100 credits
  - Subscribe: 150 credits

### Submit Videos
- YouTube URL validation and preview
- Customizable watch time requirement (1-10 minutes)
- Select interaction types (watch, like, subscribe)
- Target views slider
- Real-time cost calculator
- Credit balance verification

### Profile Management
- Edit display name, bio, website
- Upload profile picture
- Social media links (Twitter, Instagram, YouTube, LinkedIn)
- Dark/light theme switcher
- Privacy settings
- Contact preferences

### Credit History
- Complete transaction history
- Total credits earned summary
- Detailed interaction records
- Pull-to-refresh

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)

2. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password

3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Deploy the security rules from `firestore.rules`

4. Update Firebase config in `src/services/firebase.ts` with your credentials

5. Collections structure:
   - `users` - User profiles and credits
   - `videos` - Submitted videos for promotion
   - `interactions` - User activity and earnings

## YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create API credentials (API Key)
5. Update API key in `src/services/videoService.ts`
6. Restrict the API key to:
   - YouTube Data API v3
   - Your app's bundle IDs (iOS/Android)

## AdMob Setup (Optional - Currently Mock)

The app includes mock ad service for development. To integrate real AdMob:

1. Create AdMob account and app
2. Create rewarded ad units for iOS and Android
3. Update app IDs in `app.json`:
   - iOS: `ios.config.googleMobileAdsAppId`
   - Android: `android.config.googleMobileAdsAppId`
4. Install and configure `react-native-google-mobile-ads`
5. Replace mock implementation in `src/services/adService.ts`

## Building for Production

### EAS Build

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure build:
```bash
eas build:configure
```

4. Build for iOS:
```bash
eas build --platform ios
```

5. Build for Android:
```bash
eas build --platform android
```

## Environment Variables

For production, consider using environment variables for:
- Firebase configuration
- YouTube API key
- AdMob IDs

Use `expo-constants` and `app.config.js` for environment-specific configs.

## Known Limitations

- AdMob integration is mocked (not production-ready)
- Some profile features are placeholders (notifications, help & support, privacy policy)
- No password reset functionality
- No two-factor authentication
- No push notifications

## Future Enhancements

- Social features (following, friends, messaging)
- Advanced analytics and reporting
- Achievements and gamification
- In-app purchases for credits
- Premium subscription tiers
- Video categories and tags
- Watch history and favorites
- Improved error handling and offline support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Copyright © 2024 YTB Chimera. All rights reserved.

## Support

For support, please contact: support@ytbchimera.app (placeholder)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-15
