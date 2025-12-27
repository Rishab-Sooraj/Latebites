# Flutter Installation Guide for macOS

Complete step-by-step guide to install Flutter and run the Latebites mobile app on your phone.

## 📋 Prerequisites

- macOS computer
- At least 2.8 GB of disk space
- Android phone with USB cable OR iPhone (for iOS)
- Internet connection

## 🔧 Step 1: Install Flutter SDK

### Option A: Using Git (Recommended)

1. **Open Terminal** (Applications → Utilities → Terminal)

2. **Create development directory**
   ```bash
   mkdir -p ~/development
   cd ~/development
   ```

3. **Clone Flutter repository**
   ```bash
   git clone https://github.com/flutter/flutter.git -b stable
   ```
   This will take a few minutes to download (~1.5 GB).

4. **Add Flutter to PATH**
   ```bash
   echo 'export PATH="$PATH:$HOME/development/flutter/bin"' >> ~/.zshrc
   source ~/.zshrc
   ```

5. **Verify installation**
   ```bash
   flutter --version
   ```
   You should see Flutter version information.

### Option B: Download ZIP

1. Download Flutter SDK from: https://docs.flutter.dev/get-started/install/macos
2. Extract to `~/development/flutter`
3. Follow step 4-5 above

## 🏥 Step 2: Run Flutter Doctor

```bash
flutter doctor
```

This command checks your environment and displays a report. Don't worry if you see ❌ marks - we'll fix them!

Expected output:
```
Doctor summary (to see all details, run flutter doctor -v):
[✓] Flutter (Channel stable, 3.x.x, on macOS...)
[✗] Android toolchain - develop for Android devices
[✗] Xcode - develop for iOS and macOS
[✗] Chrome - develop for the web
[✗] Android Studio (not installed)
```

## 📱 Step 3: Setup for Android

### Install Android Studio

1. **Download Android Studio**
   - Go to: https://developer.android.com/studio
   - Download the latest version for macOS
   - Open the `.dmg` file and drag Android Studio to Applications

2. **Run Android Studio**
   - Open Android Studio
   - Click "More Actions" → "SDK Manager"
   - In "SDK Platforms" tab, check:
     - ✅ Android 13.0 (Tiramisu)
     - ✅ Android 12.0 (S)
   - In "SDK Tools" tab, check:
     - ✅ Android SDK Build-Tools
     - ✅ Android SDK Command-line Tools
     - ✅ Android SDK Platform-Tools
     - ✅ Android Emulator
   - Click "Apply" and wait for installation

3. **Accept Android licenses**
   ```bash
   flutter doctor --android-licenses
   ```
   Type `y` for each license agreement.

4. **Create Android Virtual Device (Emulator)**
   - In Android Studio, click "More Actions" → "Virtual Device Manager"
   - Click "Create Device"
   - Select "Pixel 6" → Next
   - Select "Tiramisu" (API 33) → Download → Next
   - Click "Finish"

### Setup Physical Android Phone

1. **Enable Developer Options**
   - Go to Settings → About Phone
   - Find "Build Number"
   - Tap it 7 times (you'll see "You are now a developer!")

2. **Enable USB Debugging**
   - Go to Settings → System → Developer Options
   - Enable "USB Debugging"

3. **Connect Phone**
   - Connect your phone to Mac via USB cable
   - On your phone, tap "Allow" when prompted for USB debugging
   - On Mac, run:
     ```bash
     flutter devices
     ```
   - You should see your phone listed!

## 🍎 Step 4: Setup for iOS (Optional)

### Install Xcode

1. **Download Xcode**
   - Open App Store
   - Search for "Xcode"
   - Click "Get" (this is ~12 GB, will take time)

2. **Setup Xcode**
   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -runFirstLaunch
   ```

3. **Install CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

4. **Accept Xcode license**
   ```bash
   sudo xcodebuild -license accept
   ```

### Setup Physical iPhone

1. **Enable Developer Mode** (iOS 16+)
   - Go to Settings → Privacy & Security → Developer Mode
   - Turn on Developer Mode
   - Restart iPhone

2. **Trust Computer**
   - Connect iPhone via USB
   - On iPhone, tap "Trust" when prompted

## ✅ Step 5: Verify Everything

Run Flutter doctor again:
```bash
flutter doctor -v
```

You should see:
- ✅ Flutter
- ✅ Android toolchain
- ✅ Xcode (if installed)
- ✅ Android Studio

## 🚀 Step 6: Run the Latebites App

1. **Navigate to project**
   ```bash
   cd /Users/rishabsooraj/orchids-projects/food-rescue-manifesto/mobile_app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Setup Supabase credentials**
   - Open `.env` file in the mobile_app folder
   - Copy your SUPABASE_URL and SUPABASE_ANON_KEY from the web project's `.env.local`
   - Paste them into mobile_app/.env

4. **Check connected devices**
   ```bash
   flutter devices
   ```

5. **Run the app**
   
   **On Physical Phone:**
   ```bash
   flutter run
   ```
   
   **On Android Emulator:**
   ```bash
   # Start emulator first
   flutter emulators
   flutter emulators --launch <emulator_id>
   
   # Then run
   flutter run
   ```
   
   **On iOS Simulator:**
   ```bash
   open -a Simulator
   flutter run
   ```

## 🎉 Success!

The app should now be running on your device! You'll see:
1. Splash screen with "Latebites" logo
2. Beautiful landing page with all sections
3. Restaurant onboarding form
4. All the premium animations

## 🔥 Hot Reload

While the app is running:
- Press `r` - Hot reload (instant updates)
- Press `R` - Hot restart
- Press `q` - Quit

Make changes to the code and press `r` to see them instantly!

## 🐛 Common Issues

### "Command not found: flutter"
```bash
echo 'export PATH="$PATH:$HOME/development/flutter/bin"' >> ~/.zshrc
source ~/.zshrc
```

### "No devices found"
- Make sure USB debugging is enabled
- Try a different USB cable
- Restart your phone and computer

### "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter run
```

### "CocoaPods not installed" (iOS)
```bash
sudo gem install cocoapods
pod setup
```

## 📞 Need Help?

Run this for detailed diagnostics:
```bash
flutter doctor -v
```

Check Flutter documentation: https://docs.flutter.dev

---

**You're all set! Enjoy building with Flutter! 🚀**
