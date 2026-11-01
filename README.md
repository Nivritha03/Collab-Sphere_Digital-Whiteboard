# Collab-Sphere Digital Whiteboard
## Always-Live Collaborative Whiteboard with Mobile Home-Screen Widgets

Collab-Sphere is a full-stack, real-time collaborative digital whiteboard application supporting multi-device phone and tablet synchronization, persistent server rooms, and live mobile home-screen widget previews matching modern iOS & Android 14 widgets.

---

## 📱 Mobile Home-Screen Widget & Real-time Collaboration Architecture

As illustrated in the system concept:
- **Two or more people join the same whiteboard room** across separate mobile devices or tabs.
- **Incremental real-time drawing & editing**: Vector stroke coordinates are synchronized over WebSockets without full-frame re-uploads.
- **Home-Screen Live Preview Widget**: When returning to the phone home screen, the widget displays a cached live whiteboard preview, active participant count, room ID, and live connection status.
- **Control Menu & Quick Actions**:
  - `Open Whiteboard`: Deep-links straight back to the room.
  - `Preferences`: Toggles background sync, HD preview, and manual refresh.
  - `Stop Sharing`: Explicitly detaches and cleans up the home-screen preview without destroying server board history.
- **Persistent Storage & Disconnection Tolerance**: Server snapshots survive client closures and creator departure. Rooms remain available indefinitely.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite (`host: true` enabled for LAN testing)
- **Styling**: Tailwind CSS v4, Glassmorphic Design System, Framer Motion
- **Icons**: Lucide React
- **State Management**: Zustand
- **Routing**: React Router DOM (v7)
- **Real-time Communication**: `@stomp/stompjs` + `sockjs-client` + `BroadcastChannel` fallback
- **Export & QR**: `jspdf`, `qrcode`, `uuid`

### Backend
- **Framework**: Spring Boot (Java 17)
- **Data Persistence**: Spring Data JPA with H2 local fallback & MySQL support
- **Real-time Communication**: Spring WebSocket with STOMP message broker
- **Security & CORS**: Spring Security with multi-device origin allowance

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Java 17+
- Apache Maven 3.9+

---

### 1. Backend Setup

1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Run the Spring Boot application (using `./mvnw.cmd` on Windows or `./mvnw` on macOS/Linux):
   ```bash
   ./mvnw.cmd spring-boot:run
   ```
   *The backend starts on `http://localhost:8080` (or `http://<your-lan-ip>:8080`).*
   *H2 database Console is accessible at `http://localhost:8080/h2-console`.*

---

### 2. Frontend Setup

1. Open a terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   *Vite binds to all network interfaces (`http://0.0.0.0:5173`).*

---

## 📲 How to Connect Two Mobile Devices on the Same Whiteboard

1. **Find your computer's local IP address** (e.g. `172.20.10.5` or `192.168.1.X` via `ipconfig` or `ifconfig`).
2. **On Phone 1**:
   - Open browser to `http://<your-computer-ip>:5173`.
   - Enter your name and click **Initialize Space**.
   - Tap the **Invite** button at the top right to view the share link and **QR Code**.
3. **On Phone 2**:
   - Scan the QR code or navigate to `http://<your-computer-ip>:5173/room/<room-id>`.
   - Enter your name and click **Join Room**.
4. **Draw simultaneously**: Both phones see strokes, shapes, text, eraser, and active cursor positions in real time.
5. **View Home Screen Live Widgets**:
   - Navigate to `/widget-preview` or tap **Widgets** in the top bar to inspect Phone 1 (iOS style) and Phone 2 (Android 14 style) home screens with live previews and the Quick Actions control menu.
   - Tap **Stop Sharing** in the control menu to stop widget synchronization.

---

## 📡 REST Endpoints & WebSocket Destinations

### REST APIs
- `GET /api/whiteboard/{room}`: Fetch all stored stroke elements for the room.
- `GET /api/whiteboard/{room}/state`: Unified DTO returning elements, latest snapshot, participant count, and last updated timestamp for widgets.
- `GET /api/version/{room}`: Fetch historical snapshots for version rewinding.

### WebSocket Destinations
- **Client to Server**:
  - `/app/draw/{room}`: Broadcast stroke element & persist to room.
  - `/app/cursor/{room}`: Real-time user cursor coordinates.
  - `/app/presence/{room}`: Heartbeat and join/leave presence.
  - `/app/save/{room}`: Save version history snapshot.
  - `/app/room/{room}/undo`: Undo last action by user.
  - `/app/room/{room}/redo`: Redo action by user.
  - `/app/room/{room}/clear`: Clear the whiteboard canvas & db records.
- **Server to Client Subscriptions**:
  - `/topic/whiteboard/{room}`: Live element drawings.
  - `/topic/cursor/{room}`: Participant cursor movements.
  - `/topic/presence/{room}`: Presence events.
  - `/topic/undo/{room}`: Undo events.
  - `/topic/redo/{room}`: Redo events.
  - `/topic/clear/{room}`: Clear canvas events.
