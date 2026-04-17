![Java](https://img.shields.io/badge/Java-21-blue)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Docker](https://img.shields.io/badge/Docker-Container-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

# StayFinder 🏠

An Airbnb-inspired property rental platform built with Spring Boot (backend) and vanilla JS (frontend), served through nginx.

## Architecture

```
Browser → nginx:3000 → /api/*  → Spring Boot:8080 → PostgreSQL:5432
                     → /ws     → Spring Boot:8080 (WebSocket/STOMP)
                     → /*      → Static frontend files
```

## Quick Start (Docker)

```bash
docker-compose up --build
```

Then open **http://localhost:3000**

## Demo Credentials

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Guest | guest@stayfinder.com     | Admin@123 |
| Admin | admin@stayfinder.com     | Admin@123 |

> **Note:** Demo users are seeded in `V1__init.sql`. If they don't exist, register a new account.

## Development (without Docker)

### Backend
```bash
cd backend
# Requires: Java 21+, PostgreSQL running on localhost:5432
./mvnw spring-boot:run
# API available at http://localhost:8080/api/v1
```

### Frontend
```bash
# Serve with any static server — e.g.:
cd frontend
npx serve . -p 5500
# Then open http://localhost:5500
# NOTE: api.js auto-detects port 5500 → uses http://localhost:8080 directly
```

## Project Structure

```
stayfinder/
├── backend/                    # Spring Boot 3 + Java 21
│   └── src/main/java/com/stayfinder/
│       ├── config/             # Security, JWT, WebSocket
│       ├── controller/         # REST endpoints
│       ├── service/            # Business logic
│       ├── repository/         # JPA repositories
│       ├── entity/             # JPA entities
│       ├── dto/                # Request/Response DTOs
│       └── exception/          # Global error handling
├── frontend/                   # Vanilla JS SPA
│   ├── index.html              # Home / search page
│   ├── pages/                  # property, host, trips, wishlist
│   ├── js/                     # utils, api, auth, websocket, search, property, host
│   └── css/                    # Styles
├── nginx.conf                  # Reverse proxy config
└── docker-compose.yml          # Full stack orchestration
```
## 🚀 Features

### 🔐 Authentication & Security
- User Registration and Login
- JWT-based Authentication
- Role-based Access (Guest / Host / Admin)
- Secure API endpoints
- Refresh token support

### 🏠 Property Management
- Add new property listings
- Edit property details
- Upload property images
- Manage property availability
- Property search with filters

### 📅 Booking System
- Create booking
- Cancel booking
- Booking history
- Availability validation
- Automatic booking status updates

### ⭐ Reviews & Ratings
- Add reviews for properties
- Rate properties
- View user feedback
- Calculate average ratings

### ❤️ Wishlist System
- Save favorite properties
- Remove from wishlist
- View saved properties

### 🔔 Notification System
- Real-time notifications
- WebSocket-based messaging
- Booking confirmation alerts
- Property update notifications

### ⏰ Background Scheduler
- Automatically expire bookings
- Update availability
- Maintain booking integrity

### 🐳 Deployment Support
- Docker containerized setup
- nginx reverse proxy
- Multi-service architecture


## ⚙️ How StayFinder Works

### Step 1 — User Authentication
User registers or logs into the system.
JWT token is generated and used for secure API requests.

### Step 2 — Property Search
User searches properties by:
- Location
- Price
- Availability

Available properties are fetched from database.

### Step 3 — Property Booking
User selects:
- Check-in date
- Check-out date

Booking request is validated and saved.

### Step 4 — Wishlist Management
Users can save favorite properties to wishlist.

### Step 5 — Reviews & Ratings
Users can:
- Rate property
- Submit reviews

Average rating is calculated automatically.

### Step 6 — Notifications
Notifications are sent using WebSocket:
- Booking confirmation
- Status updates

### Step 7 — Background Processing
Scheduler runs periodically:
- Expires old bookings
- Updates property availability



## ✅ Advantages

- Secure JWT authentication
- Real-time notification support
- Modular backend architecture
- Scalable microservice-ready design
- Docker-based deployment
- Clean separation of frontend and backend
- Supports multiple user roles
- Efficient booking validation system


## ⚠️ Disadvantages

- No payment gateway integration yet
- Limited UI responsiveness
- No mobile application support
- Image storage not cloud-based
- Limited advanced filtering options



## 🧠 System Modules

The StayFinder platform contains the following major modules:

1. Authentication Module  
   Handles login, registration, JWT authentication.

2. Property Module  
   Manages property listings and availability.

3. Booking Module  
   Handles property bookings and cancellation.

4. Review Module  
   Manages ratings and feedback.

5. Wishlist Module  
   Stores user favorite properties.

6. Notification Module  
   Sends real-time notifications using WebSockets.

7. Scheduler Module  
   Runs background jobs for booking expiration.