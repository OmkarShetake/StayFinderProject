<div align="center">

<img src="https://img.shields.io/badge/Java-21-FF6B35?style=for-the-badge&logo=openjdk&logoColor=white"/>
<img src="https://img.shields.io/badge/Spring_Boot-3.2.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white"/>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white"/>
<img src="https://img.shields.io/badge/Apache_Kafka-KRaft-231F20?style=for-the-badge&logo=apachekafka&logoColor=white"/>
<img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
<img src="https://img.shields.io/badge/WebSocket-STOMP_1.2-FF385C?style=for-the-badge&logo=socket.io&logoColor=white"/>
<img src="https://img.shields.io/badge/Cloudinary-Image_Upload-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white"/>
<img src="https://img.shields.io/badge/Leaflet.js-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white"/>
<img src="https://img.shields.io/badge/SpringDoc_OpenAPI-2.3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black"/>
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge"/>

<br/><br/>

```
███████╗████████╗ █████╗ ██╗   ██╗███████╗██╗███╗   ██╗██████╗ ███████╗██████╗ 
██╔════╝╚══██╔══╝██╔══██╗╚██╗ ██╔╝██╔════╝██║████╗  ██║██╔══██╗██╔════╝██╔══██╗
███████╗   ██║   ███████║ ╚████╔╝ █████╗  ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝
╚════██║   ██║   ██╔══██║  ╚██╔╝  ██╔══╝  ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗
███████║   ██║   ██║  ██║   ██║   ██║     ██║██║ ╚████║██████╔╝███████╗██║  ██║
╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝
```

### 🏠 Next-Gen AI-Powered Property Rental & Travel Platform
### *🤖 Gemini AI Co-Host · ⚛️ React 19 + Vite · ☕ Spring Boot 3 · ⚡ Kafka KRaft · 🔔 WebSockets · 🗺️ Leaflet · 💬 Live Chat*

<br/>

[🚀 Quick Start](#-quick-start) · [🤖 AI Features](#-ai-co-host-features-powered-by-google-gemini) · [⚡ Kafka Architecture](#-kafka-event-driven-architecture) · [✨ Features](#-features) · [🏗 Architecture](#-architecture) · [📡 API Reference](#-api-reference) · [🛠 Tech Stack](#-tech-stack)

</div>

---

## 📖 Overview

**StayFinder** is an enterprise-grade, next-generation travel rental platform built with **Spring Boot 3 (Java 21)**, **React.js 19 (Vite 8)**, **Google Gemini AI**, **Apache Kafka (KRaft mode)**, and **PostgreSQL 16**.

Going far beyond a generic rental clone, StayFinder introduces **AI Co-Host Intelligence** (quality audits, smart pricing, and contextual chat replies), **Digital Nomad & Workation verification**, event-driven asynchronous messaging via **Kafka**, and a modern reactive UI served with multi-stage **Docker & Nginx**.

> Designed as a high-impact portfolio platform demonstrating enterprise backend engineering, distributed event systems, generative AI integrations, and responsive Single Page Application architecture.

---

## 🤖 AI Co-Host Features (Powered by Google Gemini)

StayFinder integrates **Google Gemini 2.5 Flash** with low-latency in-memory caching and intelligent fallback mechanisms:

### 🌟 1. AI Listing Quality Audit & Health Score
A comprehensive audit engine that grades host listings from 0 to 100 based on search engine click-through metrics:
- **Title & Hook Audit**: Checks length and punchiness (e.g. highlights sea-view, villa style).
- **Story & Narrative Depth**: Evaluates word count, space flow, and neighborhood details.
- **Visual Gallery Completeness**: Verifies photo count and mosaic layout readiness.
- **Digital Nomad Readiness**: Checks for verified high-speed WiFi and dedicated workspaces.
- **1-Click AI Description Writer**: Calls Gemini to generate or expand professional listing copy.
- **Where**: Host Dashboard → Listings → Click `✨ AI Audit` on any property.

### 💬 2. AI Smart Reply Assistant for Hosts
In the real-time chat interface, an intelligent assistant analyzes incoming guest questions and suggests 3 instant contextual reply pills:
- `📶 WiFi & Work Info`: Instant network name, password, and speed confirmation.
- `⏰ Early / Regular Check-in`: Check-in window, luggage drop policies, and arrival timing.
- `🚗 Parking & Directions`: Reserved parking, gate code instructions, and location pins.
- `👋 Checkout Instructions`: Key drop and lockbox guidelines.
- `✏️ Custom Prompt Drawer`: Hosts can enter shorthand notes (e.g., *"allow late checkout at 12pm"*) to have AI compose a polished message.

### ✨ 3. AI Property Description Generator
- **API**: `POST /api/v1/host/properties/generate-description`
- Generates 5–6 sentence high-converting descriptions emphasizing amenities, guest capacity, and location.

### 📊 4. AI Review Summaries
- **API**: `POST /api/v1/admin/properties/generate-review-summaries`
- Condenses all guest reviews into an insightful one-sentence sentiment highlight. Auto-run via Spring Scheduler.

### 🔍 5. Natural Language & Semantic Search
- **API**: `POST /api/v1/properties/interpret-search`
- Interprets free-form requests like *"luxury villa in Goa near beach for 6 guests"* into structured database filters.
- Includes 1-click suggestion chips directly under the search bar.

### 💰 6. Smart Price Recommendation
- **API**: `GET /api/v1/host/properties/{id}/price-recommendation`
- Generates optimal price ranges based on local market averages, season, and amenity scores.

---

## ⚡ Kafka Event-Driven Architecture

All transactional notifications and emails are decoupled using **Apache Kafka in KRaft mode** (no ZooKeeper required):

```
BookingService  ─┐
PropertyService ─┼──► NotificationEventProducer ──► Kafka Topic
ReviewService   ─┘         (key = userId)        stayfinder.notifications
                                                    (3 partitions)
                                                         │
                                             NotificationEventConsumer
                                           (group: stayfinder-notification-group)
                                                 │              │
                                          DB + WebSocket      Email
                                      (in-app notification)  (Gmail SMTP)
```

### Event Lifecycle

| Event | Triggered By | Notification Action |
|---|---|---|
| `BOOKING_CONFIRMED` | Instant Book or Host approval | In-app bell + Rich HTML confirmation email |
| `BOOKING_CANCELLED` | Guest or Host cancellation | In-app alert + Cancellation notice |
| `BOOKING_MODIFIED` | Date or guest count adjustment | Updated reservation summary |
| `BOOKING_REQUEST` | Standard booking creation | Pending review alert for host |
| `BOOKING_REJECTED` | Host declines request | Rejection notice with recommendations |
| `PROPERTY_APPROVED`| Admin moderation approval | Listing live confirmation |
| `NEW_REVIEW` | Guest submits rating | Host notification with star score |

---

## ✨ Full Platform Features

### 🔐 Authentication & Security
- **JWT Architecture**: Access tokens (24h) + Refresh tokens (7 days) with silent automatic renewal.
- **Role-Based Access Control**: `GUEST`, `HOST`, `ADMIN` with route protection on both React and Spring Security.
- **BCrypt Encryption**: Password hashing with cost factor 12.
- **Account Verification**: Email verification token flow + password recovery with 1-hour expiration.

### 🏠 Property Marketplace & Nomad Mode
- **Nomad Ready Badges**: Automatic recognition of listings with verified WiFi and dedicated workstations.
- **5-Photo Mosaic Gallery**: Fluid responsive gallery with full-screen Lightbox keyboard navigation (`Esc`, `←`, `→`).
- **Interactive Leaflet Maps**: Dynamic price markers synced with search boundaries.
- **Direct Cloudinary Integration**: Unsigned browser-to-cloud image uploads with compression.
- **Availability Calendar**: Host date blocking, custom weekend rates, and 7+ night stay discounts.

### 📅 Booking Engine & Dynamic Pricing
- **Instant Book vs Request Flow**: Configurable per property.
- **Real-Time Price Breakdown**: Dynamic calculation of nights × rate + cleaning fee + service fee.
- **Database Concurrency Lock**: Prevents double-booking across simultaneous check-in requests.

### 💬 Real-Time Messaging & WebSockets
- **STOMP over SockJS**: Real-time communication per reservation thread.
- **AI Smart Reply Assistant**: One-click contextual draft generation.
- **Unread Counters**: Live badge counters across navbar and message tabs.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   React 19 + Vite Client                     │
│  React Router DOM · Axios · Context API · SockJS · STOMP     │
└─────────────────────┬────────────────────────────────────────┘
                      │ HTTP (REST) / WebSocket (STOMP)
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy :3000                 │
│  /api/* → Spring Boot :8080   /ws → Spring Boot :8080        │
│  /*     → React Production Build                             │
└─────────────────────┬────────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                 Spring Boot :8080 (Java 21)                  │
│  Controllers → Services → Repositories → PostgreSQL          │
│  JWT Filter · WebSocket Broker · 🤖 GeminiAIService          │
│  NotificationService ──► NotificationEventProducer           │
└──────┬──────────────────────────────────┬────────────────────┘
       │                                  │
       ▼                                  ▼
┌─────────────────────┐          ┌────────────────────────┐
│  Kafka (KRaft)      │          │  Cloudinary CDN        │
│  stayfinder.        │          │  (Property Photos)     │
│  notifications      │          └────────────────────────┘
└──────┬──────────────┘
       │ consume
       ▼
┌─────────────────────────────────────────┐
│  NotificationEventConsumer              │
│  Postgres DB + WebSocket Push + Email   │
└─────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Virtual Threads runtime |
| Spring Boot | 3.2.0 | Core micro-framework |
| Spring Security | 6.2 | JWT authentication & authorization |
| Spring Data JPA | 3.2.0 | PostgreSQL persistence & transactions |
| Spring WebSocket | 3.2.0 | STOMP messaging & notifications |
| Apache Kafka (KRaft) | Confluent 7.5.0 | Event streaming (Zero ZooKeeper) |
| Google Gemini AI | 2.5 Flash | Generative AI Co-Host engine |
| PostgreSQL | 16 | Relational database |
| Flyway | 9 | Versioned database schema migrations |
| SpringDoc OpenAPI | 2.3.0 | Swagger UI interactive documentation |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React.js | 19.x | Component UI architecture |
| Vite | 8.x | Next-gen lightning build tooling (~380ms) |
| React Router DOM | 7.x | Client-side routing with code-splitting (`lazy`) |
| Axios | 1.6+ | API client with JWT refresh interceptors |
| SockJS + STOMP.js | 1.6 / 2.3 | WebSocket transport & subscriptions |
| Leaflet.js | 1.9.4 | Interactive maps with price pins |
| Context API | Native | Auth, Theme, WebSocket, and Toast state |

---

## 🚀 Quick Start

### Option 1 — Docker Compose (Full Stack)

Ensure Docker Desktop is running:

```bash
git clone https://github.com/omkarshetake/stayfinder.git
cd stayfinder

# 1. Prepare environment file
cp backend/.env.example backend/.env

# 2. Build and launch all services
docker-compose up --build
```

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

---

### Option 2 — Local Development

#### 1. Start Infrastructure (PostgreSQL & Kafka)
```bash
docker-compose up -d postgres kafka
```

#### 2. Start Backend
```bash
cd backend
cp .env.example .env

# Run with Maven
./mvnw spring-boot:run
# or on Windows:
mvn spring-boot:run
```

#### 3. Start Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

App starts instantly on **[http://localhost:3000](http://localhost:3000)** with hot-module reloading and automatic proxying to `:8080`.

---

## 🔑 Demo Credentials

| Role | Email | Password | Preloaded Data |
|---|---|---|---|
| 👤 **Guest** | `guest@stayfinder.com` | `Guest@123` | Active trip bookings |
| 🏠 **Host** | `host@stayfinder.com` | `Admin@123` | 3 verified listings with revenue stats |
| ⚙️ **Admin** | `admin@stayfinder.com` | `Admin@123` | Full moderation access |

> Demo accounts and test listings are automatically seeded on startup via Flyway migrations.

---

## 📡 Key API Reference

### 🤖 AI Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/host/properties/generate-description` | `HOST` | AI listing narrative generation |
| `GET` | `/api/v1/host/properties/{id}/price-recommendation`| `HOST` | AI smart pricing recommendations |
| `POST` | `/api/v1/properties/interpret-search` | Public | AI natural language query parser |
| `GET` | `/api/v1/properties/recommendations` | Auth | AI personalized travel suggestions |
| `POST` | `/api/v1/admin/properties/generate-review-summaries` | `ADMIN`| AI batch review sentiment analysis |

### 🏠 Property Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/properties/search` | Public | Multi-filter property search |
| `GET` | `/api/v1/properties/{id}` | Public | Detailed property record |
| `POST` | `/api/v1/host/properties` | `HOST` | Create listing |
| `GET` | `/api/v1/host/properties` | `HOST` | Get host's listings |

### 📅 Booking & Messaging
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/bookings` | Auth | Create reservation |
| `POST` | `/api/v1/bookings/price-preview` | Auth | Dynamic price calculation |
| `POST` | `/api/v1/messages` | Auth | Send chat message |
| `GET` | `/api/v1/messages/booking/{id}` | Auth | Get conversation history |

---

## 📁 Repository Structure

```
stayfinder/
├── backend/
│   ├── src/main/java/com/stayfinder/
│   │   ├── config/          # Security, JWT, Kafka, WebSocket, Swagger
│   │   ├── controller/      # REST API Controllers (Auth, Property, Booking, Chat, Admin)
│   │   ├── dto/             # Request & Response Data Transfer Objects
│   │   ├── entity/          # JPA Entities (User, Property, Booking, Review, Message)
│   │   ├── kafka/           # Kafka KRaft Producers & Consumers
│   │   ├── repository/      # Spring Data JPA Repositories
│   │   ├── scheduler/       # Cron jobs for automated completion & review summaries
│   │   └── service/         # Business services + GeminiAIService + EmailService
│   ├── src/main/resources/
│   │   ├── application.yml   # Spring configuration (reads from .env)
│   │   └── db/migration/     # Flyway SQL migrations (V1–V6)
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/      # AuthModal, Navbar, Footer, PropertyCard, Lightbox, AI Modals
│   │   ├── context/         # AuthContext, ThemeContext, WebSocketContext, ToastContext
│   │   ├── hooks/           # useAuth, useWebSocket
│   │   ├── pages/           # Home, Search, PropertyDetail, HostDashboard, Chat, Admin, Trips...
│   │   ├── services/        # api, aiService, authService, hostService, propertyService...
│   │   ├── styles/          # global, search, property, host, chat, admin, trips CSS
│   │   └── utils/           # constants, formatters
│   ├── Dockerfile           # Multi-stage production container
│   ├── nginx.conf           # SPA fallback & proxy configuration
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml       # Orchestrates Postgres, Kafka KRaft, Backend, Frontend
└── README.md
```

---

## 📄 License

Distributed under the MIT License.

<div align="center">

**Built with ❤️ by Omkar Shetake**

[![GitHub](https://img.shields.io/badge/GitHub-omkarshetake-181717?style=for-the-badge&logo=github)](https://github.com/omkarshetake)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/omkar-shetake-53356b285/)

*If you found this project helpful, please give it a ⭐ on GitHub!*

</div>
