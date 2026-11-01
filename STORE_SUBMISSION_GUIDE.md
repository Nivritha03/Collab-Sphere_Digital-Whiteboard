# Collab-Sphere: App Store & Google Play Store Submission Guide

This document contains metadata, privacy declarations, permission justifications, and review instructions for publishing **Collab-Sphere** on Google Play Store and Apple App Store.

---

## 1. Store Listing Metadata

### General Info
- **App Name**: Collab-Sphere
- **Sub-Title / Short Description** (Max 80 chars):
  `Real-time collaborative whiteboard with live home-screen preview widgets.`
- **Category**: Productivity / Tools / Education
- **Content Rating**: 4+ (Everyone / PEGI 3)

### Full Description:
```text
Collab-Sphere transforms teamwork and brainstorming into a seamless, real-time experience across all your devices.

Whether you are sketching diagrams, teaching, designing interfaces, or brainstorming with friends, Collab-Sphere keeps everyone in sync instantly.

Key Features:
- Real-Time Synchronization: Instant stroke-by-stroke vector updates over high-speed secure WebSockets.
- Live Home-Screen Widgets: Keep an eye on your ongoing brainstorm right from your phone's home screen with live preview widgets.
- One-Click Live Session: Activate live background widget tracking with a single tap.
- Multi-User Rooms: Create custom room names or join instantly via QR code, direct links, or Room IDs.
- Persistent Room History: Reconnect seamlessly at any time without losing strokes, drawings, or participant logs.
- Full Suite of Creative Tools: Freehand pen, shapes (rectangles, circles, arrows, lines), text notes, and precision erasers.
- Export & Sharing: Export your high-resolution boards to PDF or image files in one tap.

Experience seamless collaborative creativity anywhere with Collab-Sphere.
```

### Keywords (Apple App Store - max 100 chars):
`whiteboard,collaboration,drawing,realtime,sketch,notes,canvas,teamwork,brainstorm,widget`

---

## 2. Privacy Disclosures & Permissions

| Permission | Platform | Justification for Store Review |
|------------|----------|--------------------------------|
| **Camera** (`CAMERA`) | Android & iOS | Used solely to scan room QR codes for quick joining. |
| **Internet** (`INTERNET`, `ACCESS_NETWORK_STATE`) | Android & iOS | Required for real-time WebSocket canvas sync and account authentication. |
| **Foreground Service** (`FOREGROUND_SERVICE_DATA_SYNC`) | Android | Keeps the live home-screen whiteboard widget updated in real-time when the user activates Live Whiteboard mode. |
| **Post Notifications** (`POST_NOTIFICATIONS`) | Android | Displays the active Live Whiteboard ongoing status notification with direct deep-link into the room. |

---

## 3. Data Safety & Privacy Declarations

- **User Accounts**: Collects email and username for authentication purposes.
- **Data Encrypted in Transit**: Yes, all traffic is served over HTTPS and WSS.
- **Data Deletion Mechanism**: Users can request account and room deletion at any time.
- **Third-Party Trackers / Ads**: None.

---

## 4. App Store Reviewer Notes

```text
Demo Credentials for App Review:
- Email: <CREATE_DEDICATED_APP_REVIEWER_EMAIL_IN_YOUR_DASHBOARD>
- Password: <CREATE_SECURE_ONE_TIME_REVIEWER_PASSWORD>

Testing Instructions:
1. Sign in using the credentials provided above or register a new test account.
2. Create a room by typing any room name (e.g. "ReviewSession").
3. Draw strokes on the canvas using the pen or shape tools.
4. To test QR code joining: Tap the "Invite" button at the top right to generate the room QR code. Scan it from a second device or camera.
5. To test the live home-screen widget: Tap the "Live Widget" button in the whiteboard top bar and tap "Start Live Whiteboard". Minimize the app to view the updated widget on the home screen.
```
