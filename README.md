<div align="center">

<img src="https://img.shields.io/badge/Java-21-FF6B35?style=for-the-badge&logo=openjdk&logoColor=white"/>
<img src="https://img.shields.io/badge/Spring_Boot-3.2.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white"/>
<img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white"/>
<img src="https://img.shields.io/badge/Apache_Kafka-KRaft-231F20?style=for-the-badge&logo=apachekafka&logoColor=white"/>
<img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
<img src="https://img.shields.io/badge/WebSocket-STOMP_1.2-FF385C?style=for-the-badge&logo=socket.io&logoColor=white"/>
<img src="https://img.shields.io/badge/Cloudinary-Image_Upload-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white"/>
<img src="https://img.shields.io/badge/Leaflet.js-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white"/>
<img src="https://img.shields.io/badge/SpringDoc_OpenAPI-2.3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black"/>
<img src="https://img.shields.io/badge/jjwt-0.12.3-yellow?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Flyway-9-CC0200?style=for-the-badge&logo=flyway&logoColor=white"/>
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

### 🏠 A full-stack AI-powered Airbnb-inspired property rental platform
### *🤖 Gemini AI · ⚡ Kafka KRaft · 🔔 Real-time WebSocket · 🔐 JWT · ☁️ Cloudinary · 📧 Email · 🗺 Map · 💬 Chat*

<br/>

[🚀 Quick Start](#-quick-start) · [🤖 AI Features](#-ai-features-powered-by-google-gemini) · [⚡ Kafka](#-kafka-event-driven-architecture) · [✨ Features](#-features) · [🏗 Architecture](#-architecture) · [📡 API Reference](#-api-reference) · [🛠 Tech Stack](#-tech-stack)

</div>

---

## 📖 Overview

**StayFinder** is a production-grade AI-powered Airbnb clone built with **Spring Boot 3**, **Google Gemini AI**, **Apache Kafka (KRaft)**, and **Vanilla JS**. It implements the complete rental marketplace workflow — from AI-generated property descriptions and smart pricing to booking, real-time notifications via Kafka, host/guest chat, and review summaries — with a clean REST API, WebSocket push, map view, and a responsive frontend served through nginx.

> Built as a full-stack portfolio project demonstrating enterprise Java patterns, event-driven architecture with Kafka, AI integration, security best practices, and real-time communication.

---

## ⚡ Kafka Event-Driven Architecture

All notification delivery (in-app + email) flows through **Apache Kafka in KRaft mode** — no Zookeeper required.

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

### KRaft Mode — No Zookeeper

```
Producer/Consumer
       │
       ▼
+─────────────────────────+
│  Kafka (KRaft mode)     │
│  Controller + Broker    │  ← metadata stored internally
+─────────────────────────+
```

Kafka 3.x+ manages its own metadata — no Zookeeper container needed. Fewer moving parts, faster startup, simpler deployment.

### Topic Design

| Topic | Partitions | Key | Retention |
|---|---|---|---|
| `stayfinder.notifications` | 3 | `userId` — ordering guaranteed per user | 7 days |

### Event Types

| Event | Triggered by | Email sent |
|---|---|---|
| `BOOKING_CONFIRMED` | Instant book / host approval | Rich confirmation with dates & total |
| `BOOKING_CANCELLED` | Guest cancellation | Cancellation notice with reference |
| `BOOKING_MODIFIED` | Date/guest change | Updated booking details |
| `BOOKING_REQUEST` | Non-instant book | Pending request notification |
| `BOOKING_REJECTED` | Host declines | Rejection notice |
| `PROPERTY_APPROVED` | Admin approves | Listing live confirmation |
| `PROPERTY_REJECTED` | Admin rejects | Rejection with guidelines |
| `PROPERTY_DELETED` | Admin deletes | Removal notice |
| `NEW_REVIEW` | Guest submits review | Review notification with rating |

### Why Kafka?

- **Decoupling** — `BookingService` publishes and returns immediately. Email/notification delivery is fully async.
- **Resilience** — Email server down? Kafka retains the event. Nothing lost.
- **Retry** — `DefaultErrorHandler` with `FixedBackOff(2s, 3 retries)` before Dead Letter Topic.
- **Ordering** — `userId` as message key → all events for a user go to the same partition.
- **Scalability** — 3 partitions = 3 consumer threads processing in parallel.

---

## 🤖 AI Features (Powered by Google Gemini)

StayFinder uses **Google Gemini 2.5 Flash** via direct REST API calls.

### ✨ AI Property Description Generator
One-click professional listing descriptions for hosts.
- **API**: `POST /api/v1/host/properties/generate-description`
- **Where**: Host Dashboard → Add Listing → "✨ AI Generate" button

### 📊 AI Review Summary
Summarizes all property reviews into one sentence, auto-generated daily at 2 AM.
- **API**: `POST /api/v1/admin/properties/generate-review-summaries` (manual trigger)

### 🔍 Natural Language Search
Search like you talk — interprets queries like *"romantic beachfront villa for honeymoon"*.
- **API**: `POST /api/v1/properties/interpret-search`

### 🎯 Personalized Recommendations
Suggests properties based on booking history and travel patterns.
- **API**: `GET /api/v1/properties/recommendations`

### 💰 Smart Price Recommendation
AI-powered pricing based on location, season, amenities, and comparable properties.
- **API**: `GET /api/v1/host/properties/{id}/price-recommendation`

---

## ✨ Features

### 🔐 Authentication & Security
| Feature | Detail |
|---|---|
| JWT Authentication | Access token (24h) + Refresh token (7 days) |
| Role-based Access | `GUEST` · `HOST` · `ADMIN` |
| XSS Protection | All user input sanitized via `Utils.esc()` before rendering |
| Secure Password | BCrypt strength 12 |
| Token Refresh | Auto-refresh on 401 with silent retry |
| Forgot Password | Email-based reset with 1-hour expiry token |
| Email Verification | Required after registration |
| Secrets Management | All credentials in `.env` — never hardcoded, gitignored |

### 🏠 Property Management
| Feature | Detail |
|---|---|
| ✨ AI Description Generator | Generate professional descriptions with one click |
| 💰 Smart Price Recommendation | AI pricing based on market data & season |
| Create Listings | Full form with amenities, pricing, house rules |
| Cloudinary Upload | Direct browser-to-cloud image upload (up to 5 photos) |
| Admin Approval | PENDING → APPROVED / REJECTED workflow |
| Availability Calendar | Block/unblock dates with custom pricing |
| Category Filtering | Beach · Mountain · City · Countryside · Lakefront · Unique · Heritage · Camping |
| Instant Book | Toggle between instant confirmation or host approval |
| Weekend Pricing | Separate weekend rate |
| Long-stay Discount | Automatic discount for 7+ night stays |
| Map View | Interactive Leaflet.js map with price pins |
| Auto Coordinates | Lat/lng auto-filled from city name |

### 📅 Booking System
| Feature | Detail |
|---|---|
| Create Booking | Date conflict detection with DB-level validation |
| Modify Booking | Change dates/guests with live price recalculation |
| Cancel Booking | Guest cancellation with Kafka event to host |
| Auto-complete | Scheduler marks past bookings COMPLETED daily at 1 AM |
| Price Preview | Real-time breakdown before confirming |
| Booking Reference | Unique `BKG-XXXXXXXX` reference ID |

### 💬 Host/Guest Messaging
| Feature | Detail |
|---|---|
| Real-time Chat | WebSocket-powered chat per booking |
| Message History | Full conversation history |
| Unread Count | Live indicator via WebSocket |

### ⭐ Reviews & Ratings
| Feature | Detail |
|---|---|
| 📊 AI Review Summary | One-sentence summary, auto-generated daily |
| 6-category Rating | Cleanliness · Communication · Check-in · Location · Value · Accuracy |
| Verified Reviews | Only guests with completed bookings can review |
| Auto Rating Update | Recalculated on every new review |

### 🔔 Notifications
| Feature | Detail |
|---|---|
| Kafka Event Bus | All notifications flow through Kafka (KRaft mode) |
| WebSocket Push | Real-time in-app bell via SockJS + STOMP |
| HTML Emails | Rich email templates via Gmail SMTP |
| Unread Badge | Live count on navbar |

### 🛠 Admin Panel
| Feature | Detail |
|---|---|
| Property Moderation | Approve / Reject / Delete any property |
| All Bookings View | Platform-wide booking overview |
| Role Protection | Frontend + backend enforce `ADMIN` role |

### 🏡 Host Dashboard
| Feature | Detail |
|---|---|
| Overview Stats | Total earnings · bookings · listings · pending requests |
| Booking Management | Approve / decline guest requests |
| Listings Management | View all properties with status and ratings |
| Earnings Breakdown | Total · this month · completed stays |

### 🔍 Search & Discovery
| Feature | Detail |
|---|---|
| 🔍 Natural Language Search | "romantic beachfront villa for honeymoon" |
| 🎯 Personalized Recommendations | AI suggestions from booking history |
| Advanced Filters | City · dates · guests · price · type · category |
| URL-synced State | Shareable search URLs |
| Wishlist Toggle | Save/unsave directly from search results |

### 📱 UX
| Feature | Detail |
|---|---|
| Dark Mode | Full theme toggle — persists across sessions |
| Photo Lightbox | Full-screen gallery with keyboard navigation |
| Image Carousel | Swipeable carousel on property cards |
| Smooth Animations | Heart bounce, blur-to-sharp images, page fade-in |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser Client                         │
│   Vanilla JS · SockJS · STOMP · Cloudinary · Leaflet.js      │
└─────────────────────┬────────────────────────────────────────┘
                      │ HTTP / WebSocket
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                     nginx :3000                              │
│  /api/* → Spring Boot :8080   /ws → Spring Boot :8080        │
│  /*     → Static frontend                                    │
└─────────────────────┬────────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                 Spring Boot :8080                            │
│  Controllers → Services → Repositories → PostgreSQL         │
│  JWT Filter · WebSocket · 🤖 GeminiAIService                 │
│  NotificationService ──► NotificationEventProducer          │
└──────┬──────────────────────────────────┬────────────────────┘
       │                                  │
       ▼                                  ▼
┌─────────────────────┐      ┌────────────────────────┐
│  Kafka (KRaft)      │      │  Cloudinary CDN        │
│  stayfinder.        │      │  (Property Images)     │
│  notifications      │      └────────────────────────┘
└──────┬──────────────┘
       │ consume
       ▼
┌─────────────────────────────────────────┐
│  NotificationEventConsumer              │
│  DB + WebSocket push + Gmail SMTP email │
└─────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Language — Virtual Threads enabled |
| Spring Boot | 3.2.0 | Application framework |
| Spring Web | 3.2.0 | REST API |
| Spring Security | 6.2 | JWT auth + role-based access |
| Spring Data JPA | 3.2.0 | ORM with repositories |
| Spring WebSocket | 3.2.0 | Real-time notifications + chat |
| Spring Mail | 3.2.0 | Transactional email (Gmail SMTP) |
| Spring Validation | 3.2.0 | `@Valid` request validation |
| Spring Actuator | 3.2.0 | Health checks |
| SpringDoc OpenAPI | 2.3.0 | Swagger UI |
| **Apache Kafka (KRaft)** | **Confluent 7.5.0** | **Async event bus — no Zookeeper** |
| **spring-kafka** | **3.2.x** | **`@KafkaListener` + `KafkaTemplate`** |
| **Google Gemini AI** | **2.5-flash** | **AI via REST (`RestTemplate` + API key)** |
| PostgreSQL | 16 | Primary database |
| Flyway | 9 | DB migrations (V1–V6) |
| jjwt | 0.12.3 | JWT generation & validation |
| Lombok | Latest | Boilerplate reduction |
| BCrypt | Spring Security | Password hashing (strength 12) |
| JUnit 5 + Mockito | Spring Boot Test | Unit tests |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Vanilla JS (ES2022) | — | No framework — zero build step |
| SockJS | 1.6.1 | WebSocket transport |
| STOMP.js | 2.3.3 | Messaging protocol client |
| Cloudinary JS | — | Direct browser image upload |
| Leaflet.js | 1.9.4 | Map view with price pins |
| CSS Variables | — | Theming + dark mode |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Compose | Multi-service containerization |
| nginx | Reverse proxy + static files |
| Kafka (KRaft) | Event streaming — no Zookeeper |
| Cloudinary | Cloud image CDN |
| Gmail SMTP | Transactional emails |

---

## 🚀 Quick Start

### Option 1 — Docker (Recommended)

```bash
git clone https://github.com/omkarshetake/stayfinder.git
cd stayfinder

# Copy and fill in your credentials
cp .env.example backend/.env

docker-compose up --build
```

Open **http://localhost:3000** 🎉

### Option 2 — Local Development

**Prerequisites:** Java 21+, PostgreSQL 16+, Kafka running locally

```bash
# 1. Create database
createdb stayfinder_db

# 2. Fill in credentials
cp .env.example backend/.env
# Edit backend/.env

# 3. Start backend (reads backend/.env automatically)
cd backend
./mvnw spring-boot:run

# API  → http://localhost:8080/api/v1
# Docs → http://localhost:8080/swagger-ui/index.html

# 4. Serve frontend (new terminal)
cd frontend
npx serve . -p 5500
# Open http://localhost:5500
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| 👤 Guest | `guest@stayfinder.com` | `Guest@123` |
| 🏠 Host | `host@stayfinder.com` | `Admin@123` |
| ⚙️ Admin | `admin@stayfinder.com` | `Admin@123` |

> Default users are auto-created on first startup via `@PostConstruct` in `AuthService`.

---

## ⚙️ Environment Variables

Create `backend/.env` with the following (never commit this file — it is gitignored):

```env
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/stayfinder_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=yourpassword

# JWT
JWT_SECRET=your-256-bit-secret-key-change-in-production

# Mail (Gmail App Password)
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
MAIL_ENABLED=true
MAIL_FROM=your-gmail@gmail.com
MAIL_FROM_NAME=StayFinder

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_ENABLED=true

# Kafka
# Local dev  → localhost:29092  (exposed from Docker container)
# Docker     → kafka:9092       (set automatically by docker-compose)
KAFKA_BOOTSTRAP_SERVERS=localhost:29092

# Frontend URL (for password reset emails)
FRONTEND_URL=http://localhost:3000
```

### Getting a Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API Key → copy into `.env`
3. Free tier: 20 requests/day

### Getting a Gmail App Password
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a password for "Mail" → use it as `MAIL_PASSWORD`

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | ❌ | Register |
| `POST` | `/api/v1/auth/login` | ❌ | Login, get tokens |
| `POST` | `/api/v1/auth/refresh` | ❌ | Refresh access token |
| `GET` | `/api/v1/auth/me` | ✅ | Current user |
| `POST` | `/api/v1/auth/become-host` | ✅ | Upgrade to host |
| `PATCH` | `/api/v1/auth/profile` | ✅ | Update profile |
| `POST` | `/api/v1/auth/forgot-password` | ❌ | Send reset email |
| `POST` | `/api/v1/auth/reset-password` | ❌ | Reset with token |

### Properties
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/properties/search` | ❌ | Search with filters |
| `GET` | `/api/v1/properties/{id}` | ❌ | Property detail |
| `GET` | `/api/v1/properties/{id}/availability` | ❌ | Availability |
| `POST` | `/api/v1/host/properties` | ✅ HOST | Create listing |
| `GET` | `/api/v1/host/properties` | ✅ HOST | My listings |
| `POST` | `/api/v1/host/properties/generate-description` | ✅ HOST | 🤖 AI description |
| `GET` | `/api/v1/host/properties/{id}/price-recommendation` | ✅ HOST | 🤖 Smart price |
| `POST` | `/api/v1/properties/interpret-search` | ❌ | 🤖 NL search |
| `GET` | `/api/v1/properties/recommendations` | ✅ | 🤖 Personalized recs |

### Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/bookings` | ✅ | Create booking |
| `GET` | `/api/v1/bookings` | ✅ | My bookings |
| `PATCH` | `/api/v1/bookings/{id}/cancel` | ✅ | Cancel |
| `PATCH` | `/api/v1/bookings/{id}/modify` | ✅ | Modify dates/guests |
| `POST` | `/api/v1/bookings/price-preview` | ✅ | Price calculation |

### Messages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/messages` | ✅ | Send message |
| `GET` | `/api/v1/messages/booking/{id}` | ✅ | Get conversation |
| `GET` | `/api/v1/messages/unread/count` | ✅ | Unread count |

### Reviews
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/reviews` | ✅ | Submit review |
| `GET` | `/api/v1/reviews/property/{id}` | ❌ | Property reviews |
| `GET` | `/api/v1/reviews/property/{id}/summary` | ❌ | Rating summary |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/properties` | ✅ ADMIN | List by status |
| `PATCH` | `/api/v1/admin/properties/{id}/approve` | ✅ ADMIN | Approve |
| `PATCH` | `/api/v1/admin/properties/{id}/reject` | ✅ ADMIN | Reject |
| `DELETE` | `/api/v1/admin/properties/{id}` | ✅ ADMIN | Delete |
| `GET` | `/api/v1/admin/bookings` | ✅ ADMIN | All bookings |
| `POST` | `/api/v1/admin/properties/generate-review-summaries` | ✅ ADMIN | 🤖 AI summaries |

> Full interactive docs: `http://localhost:8080/swagger-ui/index.html`

---

## 📁 Project Structure

```
stayfinder/
├── backend/src/main/java/com/stayfinder/
│   ├── config/          # Security, JWT, WebSocket, Swagger, KafkaConfig
│   ├── controller/      # Auth, Property, Booking, Review, Message, Notification
│   ├── kafka/           # NotificationEvent, Producer, Consumer
│   ├── service/         # Business logic + EmailService + GeminiAIService
│   ├── entity/          # JPA entities
│   ├── dto/             # Request/Response DTOs
│   ├── repository/      # Spring Data JPA interfaces
│   ├── scheduler/       # BookingScheduler + ReviewSummaryScheduler
│   └── exception/       # GlobalExceptionHandler
├── backend/src/test/java/com/stayfinder/service/
│   ├── AuthServiceTest.java      # 8 unit tests
│   └── BookingServiceTest.java   # 11 unit tests
├── backend/src/main/resources/
│   ├── application.yml           # Single config file — secrets via .env
│   └── db/migration/             # Flyway V1–V6
├── frontend/
│   ├── index.html
│   ├── pages/           # search, property, host, admin, trips, wishlist, chat, profile
│   ├── css/             # global, nav, auth, index, search, property, host, chat, admin, trips
│   └── js/              # utils, api, auth, websocket, search, search-page, property,
│                        # host, admin, chat, trips, profile, wishlist, index,
│                        # forgot-password, reset-password, verify-email
├── nginx.conf
├── docker-compose.yml   # postgres + kafka (KRaft) + backend + frontend
├── backend/.env         # secrets — gitignored
└── .env.example
```

---

## 🚧 Known Limitations

- No payment gateway (Stripe/Razorpay planned)
- Email requires Gmail App Password setup
- Map view requires properties to have lat/lng coordinates
- AI features require Gemini API key (free tier: 20 requests/day)
- Kafka requires Docker or local Kafka running on port 29092

---

## 🎯 Why StayFinder Stands Out

| Feature | StayFinder | Airbnb | OYO | Booking.com |
|---------|-----------|--------|-----|-------------|
| AI Property Descriptions | ✅ | ❌ | ❌ | ❌ |
| AI Smart Pricing | ✅ | ✅ Paid | ❌ | ❌ |
| Natural Language Search | ✅ | ❌ | ❌ | ❌ |
| Personalized AI Recs | ✅ | ✅ | ❌ | ✅ |
| AI Review Summaries | ✅ | ❌ | ❌ | ❌ |
| Kafka Event Streaming | ✅ | ✅ Internal | ❌ | ✅ Internal |
| Real-time Chat | ✅ | ✅ | ❌ | ✅ |
| Open Source | ✅ | ❌ | ❌ | ❌ |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License.

---

<div align="center">

**Built with ❤️ by Omkar Shetake**

[![GitHub](https://img.shields.io/badge/GitHub-omkarshetake-181717?style=for-the-badge&logo=github)](https://github.com/omkarshetake)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/omkar-shetake-53356b285/)

*If this project helped you, please give it a ⭐*

</div>
