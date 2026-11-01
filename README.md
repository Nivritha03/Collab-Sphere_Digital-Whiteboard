# Collab-Sphere Digital Whiteboard
## Always-Live Collaborative Whiteboard with Mobile Home-Screen Widgets (Android & iOS)

Collab-Sphere is a full-stack, real-time collaborative digital whiteboard application supporting multi-device mobile synchronization (native Android & native iOS), persistent server rooms, live home-screen widgets, and cloud deployments.

---

## 📱 Mobile Applications (Android & iOS)

Collab-Sphere provides native mobile applications for Android and iOS using Capacitor, with native background widget providers, foreground services, and WidgetKit / ActivityKit integrations.

### 🤖 Android Application

- **Application ID**: `com.collabsphere.app`
- **Location**: `frontend/android/`
- **Native Widget Provider**: `com.collabsphere.app.WhiteboardWidgetProvider`
- **Live Background Service**: `com.collabsphere.app.LiveWhiteboardForegroundService`

#### Built Release Artifacts:
1. **Debug APK** (Direct Testing / Sideloading):
   - Path: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
2. **Release APK** (Direct Distribution):
   - Path: `frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk`
3. **Google Play App Bundle (.aab)**:
   - Path: `frontend/android/app/build/outputs/bundle/release/app-release.aab`

#### How to Install on Android Device:
```bash
# Connect Android phone via USB with USB Debugging enabled:
adb install frontend/android/app/build/outputs/apk/debug/app-debug.apk
```
*Or transfer `app-debug.apk` directly to your phone via Google Drive / USB file transfer and tap to install.*

#### How to Build / Rebuild in Android Studio:
```bash
cd frontend
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease
```

---

### 🍏 iOS Application

- **Bundle Identifier**: `com.collabsphere.app`
- **Location**: `frontend/ios/App/`
- **Xcode Workspace / Project**: `frontend/ios/App/App.xcodeproj`
- **Native WidgetKit Extension**: `frontend/ios/App/App/CollabSphereWidget.swift`
- **ActivityKit Live Activity**: `frontend/ios/App/App/CollabSphereLiveActivity.swift`

#### How to Open and Deploy on iPhone (requires macOS + Xcode):
1. Open the project in Xcode:
   ```bash
   cd frontend
   npx cap open ios
   # Or open frontend/ios/App/App.xcodeproj directly in Xcode
   ```
2. Select your Apple Developer Team in **Signing & Capabilities**.
3. Plug in your physical iPhone, select it as the run target, and click **Run (Cmd + R)**.
4. For TestFlight / App Store submission:
   - Select **Product > Archive**.
   - In the Organizer, click **Distribute App > App Store Connect > Upload**.

---

## ☁️ Production Backend Deployment (Docker & MySQL)

The backend is configured with production MySQL and containerized via Docker.

### Running with Docker Compose:
```bash
# Set your secure database password
export DB_PASSWORD="YourStrongPassword123!"

# Start MySQL and Spring Boot backend
docker compose up -d --build
```

The Spring Boot backend will connect to persistent MySQL at port `8080`.

---

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- Java 17+
- Android SDK (installed at `C:\Users\<user>\AppData\Local\Android\Sdk`)

### 1. Start Backend:
```bash
cd backend
./mvnw.cmd spring-boot:run
```

### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` or open your local network IP on mobile.
