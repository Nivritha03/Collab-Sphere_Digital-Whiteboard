# Collab-Sphere Digital Whiteboard

A full-stack, real-time collaborative digital whiteboard application. It enables multiple users to draw, brainstorm, and collaborate simultaneously on a shared canvas.

## Features

- **Real-time Collaboration**: See others drawing on the board instantly using WebSockets.
- **Drawing Tools & Shapes**: Various tools including freehand drawing, lines, rectangles, circles, and text input for comprehensive diagramming.
- **Export Capabilities**: Export your whiteboard canvas to PDF (powered by jsPDF) or image.
- **Responsive Design**: Modern, responsive, and interactive UI built with React, Tailwind CSS, and Framer Motion.
- **Seamless State Management**: Efficient client-side state handling with Zustand.
- **Spring Boot Backend**: Robust and scalable Java backend architecture for managing whiteboard sessions securely.

## Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4, Framer Motion (animations), Lucide React (icons)
- **State Management**: Zustand
- **Routing**: React Router DOM (v7)
- **Real-time Communication**: `@stomp/stompjs` & `sockjs-client`
- **Other Utilities**: `jspdf`, `uuid`

### Backend
- **Framework**: Spring Boot (Java 17)
- **Data Persistence**: Spring Data JPA with MySQL & H2 Database
- **Security**: Spring Security
- **Real-time Communication**: Spring WebSocket
- **Utilities**: Lombok, dotenv-java

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Java 17+
- Maven
- MySQL (if connecting to a local/remote MySQL instance)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your environment variables for database connections (using `.env` or `application.properties`/`application.yml`).
3. Build and run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *(On Windows, use `mvnw.cmd spring-boot:run`)*
   *The backend will typically start on `http://localhost:8080`.*

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will typically start on `http://localhost:5173`.*

## Project Structure

```text
Collab-Sphere_Digital-Whiteboard/
├── backend/            # Spring Boot REST API & WebSocket server
└── frontend/           # React frontend application
```
