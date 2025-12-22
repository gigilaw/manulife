# Manulife - Portfolio Management Dashboard Assessment

## 📋 Overview

This portfolo management dashboard implements JWT-based authentication with refresh tokens for a financial application.

## 🚀 Features

### Authentication

-   **User Registration** with email validation
-   **User Login** with password hashing (bcrypt)
-   **JWT Authentication** with access & refresh tokens
-   **Token Refresh** with one-time use and revocation
-   **Secure Logout** with refresh token invalidation
-   **Automatic Login** upon successful registration

# 🐳 Docker Compose Application Setup

## 📋 Prerequisites

Ensure you have installed:

-   [Docker Desktop](https://docs.docker.com/get-docker/)

**Run application:**

1. Clone repository

```bash
git clone https://github.com/gigilaw/manulife.git
```

2. Populate .env file
3. Start Application

```bash
# Build and start all services. At project root level run:
docker-compose up --build
```

## 📊 API Endpoints

[Swagger Documentation](http://localhost:3000/api/swagger)

## 💾 Database Migration

```bash
# Go into docker BE container terminal
docker exec -it manulife-backend-api-1 /bin/sh

# Generate migration files
npm run migration:generate -- src/database/migrations/<filename>

# Run migration files
npm run migration:run
```

## 🧪 Tests

```bash
# Run test from /backend-api directory
npm run test
```

## 🔐 Authentication Security Implementation

### Token Strategy

-   **Access Token**: JWT, 15-minute expiry, stateless
-   **Refresh Token**: Stored in database, 2-hour expiry, revocable
-   **Token Rotation**: Refresh tokens are single-use (rotated on each refresh)

### Password Security

-   Bcrypt hashing with 10 salt rounds
-   Passwords never returned in API responses
-   Minimum 8-character requirement with validation

### Session Management

### Inactivity Timeout

-   **15-minute auto-logout** for inactive users
-   Implementation: Frontend inactivity timer + backend token expiry
-   User must re-authenticate after 15 minutes of no activity

### Maximum Session Length

-   **2-hour maximum session** regardless of activity
-   Refresh tokens expire after 2 hours, forcing full re-login

### Browser/Tab Closure

-   **Automatic logout** when browser/tab is closed
-   Tokens stored in **memory only**
-   No persistent sessions across browser sessions

## ⚠️ Authentication Known Limitations & Trade-offs

### Access Token Validity After Logout

#### ⚠️ **Issue**: Access tokens remain valid for up to 15 minutes after logout

```
timeline
    title Access Token Lifetime After Logout
    section Authentication Flow
        10:00 : User logs in - Gets access token<br>(expires 10:15)
        10:05 : User logs out - Refresh token revoked ✅
        10:06 : Attacker uses - stolen access token→ STILL WORKS ❌
        10:15 : Access token - naturally expires

```

#### Risk Mitigation:

-   Short 15-minute window reduces exposure
-   Trade-off for simplicity of this application
-   Frontend should clear tokens immediately on logout

#### Enhancements:

-   Token blacklisting system
-   Enhanced session management
-   Cron job to clear revovked tokens

## 📈 Portfolio & Assets Management

### API

-   Core operations only: Add, update, remove assets
-   Essential metrics: Current value, gain/loss, percentage returns
-   No complex historical tracking: Only current state calculations
-   Mimic real-time pricing update with mock api (Market Service)

### Design

-   Portfolio → User (1:1)
-   Portfolio → Assets (1:Many)
-   **_UUIDs_** for portfolio & assets ID

## 📝 Transactions

tbc
