# 📱 Lost & Found App

A modern Lost & Found mobile application built with **React Native**, **Expo**, **TypeScript**, and **Firebase**. The application helps users report lost items, post found items, and connect owners with recovered belongings through an easy-to-use interface.

---

## 🚀 Features

- 🔐 User Authentication (Firebase Authentication)
- 📦 Report Lost Items
- 🎯 Report Found Items
- 🔍 Browse Lost & Found Listings
- 🖼 Upload Item Images
- 📍 Item Details with Location
- 👤 User Profile Management
- ❤️ Modern & Responsive UI
- ☁ Firebase Cloud Backend
- 📱 Cross-platform (Android, iOS & Web)

---

## 🛠 Technologies Used

### Frontend
- React Native
- Expo
- TypeScript
- Expo Router
- NativeWind (Tailwind CSS)
- React Native Reanimated

### Backend & Cloud
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

### Development Tools
- Visual Studio Code
- Git & GitHub
- npm

---

## 📂 Project Structure

```text
lostfoundapp/
│
├── app/                # Application screens
├── assets/             # Images, fonts, icons
├── components/         # Reusable UI components
├── constants/          # Constants
├── hooks/              # Custom hooks
├── firebase.ts         # Firebase configuration
├── package.json
└── README.md
```

---

## ⚙ Installation

### Clone the repository

```bash
git clone https://github.com/dilum-shamilka/lostfoundapp.git
```

Move into the project

```bash
cd lostfoundapp
```

Install dependencies

```bash
npm install
```

Start the Expo development server

```bash
npx expo start
```

---

## 📱 Running the App

After starting Expo, you can run the project using:

- Android Emulator
- iOS Simulator
- Expo Go
- Web Browser

---

## 🔥 Firebase Setup

Create a Firebase project and enable:

- Authentication (Email & Password)
- Cloud Firestore
- Firebase Storage

Create a Firebase configuration file:

```ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

export const app = initializeApp(firebaseConfig);
```

---

## 🚀 Future Improvements

- Push Notifications
- Chat between users
- QR Code Item Verification
- Google Sign-In
- Dark Mode
- Admin Dashboard
- AI Image Search
- Map Integration
- Item Claim Verification

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push to GitHub

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request

---

## 👨‍💻 Developer

**Dilum Shamilka**

Software Engineering Student

GitHub: https://github.com/dilum-shamilka

---

## 📄 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project useful, don't forget to ⭐ star the repository on GitHub!