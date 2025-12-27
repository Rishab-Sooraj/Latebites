# 🚀 Quick Start Guide - Latebites Mobile App

**Get the app running on your phone in under 30 minutes!**

## ⚡ Fast Track (If you already have Flutter)

```bash
# 1. Navigate to project
cd /Users/rishabsooraj/orchids-projects/food-rescue-manifesto/mobile_app

# 2. Setup Supabase credentials
# Edit .env file and add your SUPABASE_URL and SUPABASE_ANON_KEY

# 3. Install dependencies
flutter pub get

# 4. Connect your phone via USB and enable USB debugging

# 5. Run the app
flutter run
```

Done! 🎉

---

## 📱 First Time Setup

### Step 1: Install Flutter (10-15 minutes)

```bash
# Clone Flutter SDK
mkdir -p ~/development
cd ~/development
git clone https://github.com/flutter/flutter.git -b stable

# Add to PATH
echo 'export PATH="$PATH:$HOME/development/flutter/bin"' >> ~/.zshrc
source ~/.zshrc

# Verify
flutter --version
```

### Step 2: Install Android Studio (5-10 minutes)

1. Download from: https://developer.android.com/studio
2. Install and open Android Studio
3. Go to SDK Manager → Install Android SDK
4. Run: `flutter doctor --android-licenses` (type 'y' for all)

### Step 3: Setup Your Phone (2 minutes)

**Android:**
1. Settings → About Phone → Tap "Build Number" 7 times
2. Settings → Developer Options → Enable "USB Debugging"
3. Connect phone via USB
4. Tap "Allow" on phone when prompted

**iPhone (Mac only):**
1. Install Xcode from App Store
2. Settings → Privacy & Security → Developer Mode → ON
3. Connect phone via USB
4. Tap "Trust" on phone

### Step 4: Run the App (2 minutes)

```bash
# Navigate to project
cd /Users/rishabsooraj/orchids-projects/food-rescue-manifesto/mobile_app

# Copy Supabase credentials
# Open .env file and paste your SUPABASE_URL and SUPABASE_ANON_KEY
# (You can find these in your web project's .env.local file)

# Install dependencies
flutter pub get

# Check if phone is detected
flutter devices

# Run the app!
flutter run
```

---

## 🎨 What You'll See

1. **Splash Screen** - Animated "Latebites" logo
2. **Home Screen** - Full landing page with:
   - Hero section: "Surplus is a gift, not a burden"
   - The Problem section
   - Our Belief (Dignity, Transparency, Intention)
   - What We Do section
   - Impact section
   - Vision section
   - How We Work (3 bag sizes)
   - Founders section
   - Onboarding CTA
3. **Onboarding Screen** - Restaurant form with real-time validation
4. **Premium UI** - Exact same colors, fonts, and animations as the web!

---

## 🔥 Hot Reload Magic

While the app is running:
- Press `r` → Instant reload (see changes immediately!)
- Press `R` → Full restart
- Press `q` → Quit

Try it:
1. Open `lib/screens/home_screen.dart`
2. Change some text
3. Press `r` in terminal
4. See the change instantly on your phone! 🚀

---

## 🐛 Troubleshooting

**"Command not found: flutter"**
```bash
export PATH="$PATH:$HOME/development/flutter/bin"
source ~/.zshrc
```

**"No devices found"**
- Enable USB debugging on your phone
- Try a different USB cable
- Run: `flutter devices` to check

**"Supabase error"**
- Make sure `.env` file has your Supabase credentials
- Check that the credentials are correct

**Build errors**
```bash
flutter clean
flutter pub get
flutter run
```

---

## 📚 Full Documentation

- **Complete Setup Guide**: See `FLUTTER_SETUP.md`
- **Project Details**: See `README.md`
- **Web Project**: See parent directory

---

## ✨ Features Implemented

✅ Splash screen with animations
✅ Complete landing page (all 10 sections)
✅ Restaurant onboarding form
✅ Real-time form validation (green/red borders)
✅ Supabase integration
✅ Email verification flow
✅ Premium UI matching web exactly
✅ Smooth animations (1500ms cinematic)
✅ Parallax images with grayscale effect
✅ Custom buttons with micro-animations

---

## 🎯 Next Steps

1. **Install Flutter** (if not done)
2. **Run `flutter doctor`** to check setup
3. **Connect your phone**
4. **Run the app**
5. **Enjoy the premium experience!**

---

**Need help? Check the full setup guide in `FLUTTER_SETUP.md`**

**Built with ❤️ using Flutter - No compromises on design!**
