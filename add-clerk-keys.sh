#!/bin/bash

# Add Clerk keys to .env.local
echo "Adding Clerk keys to .env.local..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local..."
    touch .env.local
fi

# Add Clerk keys (append if not exists)
if ! grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local; then
    echo "" >> .env.local
    echo "# Clerk Authentication" >> .env.local
    echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dHJ1c3RpbmctZ2Vja28tOTkuY2xlcmsuYWNjb3VudHMuZGV2JA" >> .env.local
    echo "CLERK_SECRET_KEY=sk_test_0LpxaVikUHPuz4pl3RahgkDZ2MTBehE0Wpp6Dcbrb2" >> .env.local
    echo "NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in" >> .env.local
    echo "NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up" >> .env.local
    echo "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/browse" >> .env.local
    echo "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding" >> .env.local
    echo "✅ Clerk keys added to .env.local"
else
    echo "⚠️  Clerk keys already exist in .env.local"
fi
