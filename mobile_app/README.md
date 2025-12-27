# Latebites Mobile App

A premium Flutter mobile application for the Latebites food rescue platform.

**Surplus is a gift, not a burden.**

## 🎨 Design Philosophy

This mobile app perfectly mirrors the web application's premium aesthetic:
- **Colors**: Deep earthy green (`#2D4A3E`) on warm off-white background
- **Typography**: Cormorant Garamond (serif) + Plus Jakarta Sans (sans-serif)
- **Animations**: Smooth, intentional, cinematic
- **Attitude**: Dignified, calm, philosophical

## 📱 Features

- ✅ Splash screen with animated logo
- ✅ Full landing page with all sections from web
- ✅ Restaurant onboarding form with real-time validation
- ✅ Email verification flow
- ✅ Supabase backend integration
- ✅ Premium UI components with micro-animations
- ✅ Parallax images with grayscale-to-color effect

## 🚀 Getting Started

### Prerequisites

1. **Install Flutter SDK**
   ```bash
   # Download Flutter
   cd ~/development
   git clone https://github.com/flutter/flutter.git -b stable
   
   # Add to PATH (add this to your ~/.zshrc)
   export PATH="$PATH:$HOME/development/flutter/bin"
   
   # Verify installation
   flutter doctor
   ```

2. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK
   - Create Android Virtual Device (AVD)

3. **Setup Your Phone for Debugging**
   
   **For Android:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"
   - Connect phone via USB
   - Run `flutter devices` to verify

   **For iOS (Mac only):**
   - Install Xcode from App Store
   - Run `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`
   - Run `sudo xcodebuild -runFirstLaunch`

### Installation

1. **Navigate to the mobile app directory**
   ```bash
   cd /Users/rishabsooraj/orchids-projects/food-rescue-manifesto/mobile_app
   ```

2. **Configure Supabase credentials**
   
   Edit `.env` file and add your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   You can find these in your web project's `.env.local` file.

3. **Install dependencies**
   ```bash
   flutter pub get
   ```

4. **Run the app**
   
   **On Android Emulator:**
   ```bash
   # Start emulator from Android Studio or:
   flutter emulators --launch <emulator_id>
   
   # Run app
   flutter run
   ```
   
   **On Physical Device:**
   ```bash
   # Make sure device is connected and USB debugging is enabled
   flutter devices  # Verify device is detected
   flutter run      # App will install and run on your phone
   ```
   
   **On iOS Simulator (Mac only):**
   ```bash
   open -a Simulator
   flutter run
   ```

### Hot Reload

While the app is running, you can make changes to the code and press:
- `r` - Hot reload (fast, preserves state)
- `R` - Hot restart (slower, resets state)
- `q` - Quit

## 📂 Project Structure

```
mobile_app/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── config/
│   │   ├── theme.dart              # Design system
│   │   └── supabase_config.dart    # Supabase setup
│   ├── screens/
│   │   ├── splash_screen.dart      # Animated splash
│   │   ├── home_screen.dart        # Landing page
│   │   ├── onboarding_screen.dart  # Restaurant form
│   │   └── verify_screen.dart      # Email verification
│   ├── widgets/
│   │   ├── reveal_text.dart        # Animated text
│   │   ├── parallax_image.dart     # Image effects
│   │   ├── custom_button.dart      # Premium buttons
│   │   └── section_wrapper.dart    # Layout helpers
│   └── services/
│       └── supabase_service.dart   # Backend API
├── assets/
│   └── fonts/                       # Custom fonts
├── pubspec.yaml                     # Dependencies
├── .env                             # Environment variables
└── README.md                        # This file
```

## 🎯 Development Tips

1. **Check Flutter Doctor**
   ```bash
   flutter doctor -v
   ```
   This shows what's installed and what's missing.

2. **View Logs**
   ```bash
   flutter logs
   ```

3. **Build APK for Testing**
   ```bash
   flutter build apk --debug
   ```
   APK will be in: `build/app/outputs/flutter-apk/app-debug.apk`

4. **Clean Build**
   If you encounter issues:
   ```bash
   flutter clean
   flutter pub get
   flutter run
   ```

## 🐛 Troubleshooting

**"Command not found: flutter"**
- Make sure Flutter is in your PATH
- Run: `export PATH="$PATH:$HOME/development/flutter/bin"`
- Add to `~/.zshrc` for persistence

**"No devices found"**
- For Android: Enable USB debugging and accept the prompt on your phone
- For iOS: Make sure Xcode is installed
- Run: `flutter devices` to check

**"Supabase credentials not found"**
- Make sure `.env` file exists in `mobile_app/` directory
- Check that SUPABASE_URL and SUPABASE_ANON_KEY are set

**Build errors**
- Run: `flutter clean && flutter pub get`
- Check that all dependencies are compatible

## 📝 Notes

- The app uses Google Fonts, so an internet connection is needed for first run
- Images are cached for better performance
- Form validation matches the web app exactly
- All animations are optimized for 60fps

## 🎨 Design Tokens

```dart
// Colors
Primary: #2D4A3E (Deep earthy green)
Background: #FAF9F7 (Warm off-white)
Foreground: #262626 (Dark gray)

// Typography
Serif: Cormorant Garamond
Sans: Plus Jakarta Sans

// Animation Durations
Fast: 300ms
Normal: 600ms
Slow: 1000ms
Cinematic: 1500ms
```

## 📄 License

© 2024 Latebites — Coimbatore, India

---

**Built with ❤️ using Flutter**
