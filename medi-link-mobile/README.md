# pharva-mobile

React Native + Expo mobile application for the Pharva Healthcare Intelligence Platform.

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your Android or iOS device.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 51 |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| API | Axios + TanStack Query |
| Real-time | Socket.io Client |
| Notifications | Expo Notifications |
| Camera/Scan | expo-camera |
| Maps | react-native-maps + Expo Location |
| Payments | Paystack RN SDK |
| Storage | Expo SecureStore + AsyncStorage |
| Charts | Victory Native |

## Color Palette

```ts
// constants/colors.ts
export const Colors = {
  midnight: '#000000',  // primary text
  sage:     '#BBECCA',  // primary brand
  teal:     '#B7E6DC',  // secondary accent
  white:    '#FFFFFF',  // background
}
```

## Folder Structure

```
pharva-mobile/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-license.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── inventory.tsx
│   │   ├── marketplace.tsx
│   │   ├── network.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── components/
│   ├── ui/
│   └── shared/
├── constants/
│   └── colors.ts
├── hooks/
├── services/
├── store/
├── utils/
└── assets/
```

## Screens by Phase

**Phase 1:** Onboarding, license verification, dashboard with expiry alerts, inventory CRUD, barcode scanner, analytics, redistribution listings

**Phase 2:** Dead Stock Exchange with countdown timers, EmergencyRx, SabePay escrow, live order tracking, MedRoute

**Phase 3:** Professional messaging network, patient portal, medication reminders, home delivery tracking, MediCareer job board

**Phase 4:** AI demand alerts (DrugIntel), deep analytics dashboard, telehealth booking pilot
