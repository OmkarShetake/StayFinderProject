# StayFinder — React.js Frontend

AI-powered Airbnb-inspired rental platform frontend migrated to **React.js + Vite**.

## Tech Stack
- **Framework:** React 18 + Vite
- **Language:** JavaScript ES2022
- **Routing:** React Router DOM (v6)
- **HTTP Client:** Axios with JWT auto-refresh interceptors
- **State Management:** React Context API (`AuthContext`, `ThemeContext`, `WebSocketContext`, `ToastContext`)
- **Real-Time WebSockets:** SockJS + STOMP.js
- **Image Uploads:** Cloudinary Unsigned Upload API
- **Maps:** Leaflet.js with interactive price markers
- **Styles:** Migrated StayFinder CSS with full responsive layout & Dark Mode

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The application will start on `http://localhost:3000` and automatically proxies:
- `/api/v1` -> `http://localhost:8080/api/v1`
- `/ws` -> `http://localhost:8080/ws`

### 3. Build for Production
```bash
npm run build
```
Production assets are generated in `dist/`.
