#!/bin/bash

# Capacitor가 Java 21로 생성한 파일들을 Java 17로 자동 수정하는 스크립트

echo "🔧 Fixing Android Java version to 17..."

# capacitor-cordova-android-plugins/build.gradle
if [ -f "android/capacitor-cordova-android-plugins/build.gradle" ]; then
  sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' android/capacitor-cordova-android-plugins/build.gradle
  sed -i '' 's/gradle:8\.7\.2/gradle:8.6.0/g' android/capacitor-cordova-android-plugins/build.gradle
  echo "✅ Fixed capacitor-cordova-android-plugins/build.gradle"
fi

# app/capacitor.build.gradle
if [ -f "android/app/capacitor.build.gradle" ]; then
  sed -i '' 's/JavaVersion.VERSION_21/JavaVersion.VERSION_17/g' android/app/capacitor.build.gradle
  echo "✅ Fixed app/capacitor.build.gradle"
fi

echo "✅ Android Java version fixed to 17"
