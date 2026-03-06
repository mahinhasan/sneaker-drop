# 👟 Sneaker-Drop Inventory System

Professional Real-Time High-Traffic Inventory System for Limited Edition Sneaker Drops. Built with **React**, **Node.js/Express**, **PostgreSQL (Sequelize)**, and **Socket.io**.

---

## 🛠️ Architecture & Professional Implementation

### ⚡ Professional Layout & UX
- **ERP-Inspired UI**: A clean, professional dashboard using a customized **Bootstrap 5** implementation.
- **Component-Based Architecture**: Modularized frontend with reusable components (`DropCard`, `apiService`) and custom hooks.
- **Real-Time Visibility**: Instant stock synchronization across all connected clients via WebSockets.
- **Feedback-First Design**: Loading states, pulse animations, and interactive toast notifications for all system events.

### 🛡️ Atomic Reservation System (Concurrency Control)
- **Problem**: Overselling in high-traffic scenarios (e.g., 100 users for 1 item).
- **Solution**: Implemented using **Serializable Transactions** with **FOR UPDATE row-level locking** in PostgreSQL.
- **Mechanism**: The reservation transaction checks `availableStock`, decrements it, and creates the reservation record atomically. If the stock is 0 or a serialization error occurs (due to concurrent writes), the transaction rolls back and the user is notified.

### 🔄 Intelligent Stock Recovery (Expiration Logic)
- **Mechanism**: Reservations have a 60-second TTL (`expiresAt`).
- **Recovery Job**: A transactional background worker identifies expired reservations, restores stock to the main pool, and broadcasts the update.
- **Real-Time Notification**: The specific user whose reservation expired receives a targeted WebSocket notification to clear their local "Reserved" state.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v16+)
- PostgreSQL

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Update with your DB credentials
npm run db:migrate     # Initialize schema
npm run db:seed        # Seed sample sneakers
npm start              # Starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start              # Starts on http://localhost:3000
```

---

## 📦 Features & API

### Drop Activity Feed
- **Top 3 Purchasers**: Each product card displays the three most recent successful buyers, fetched via nested Sequelize includes.
- **Live Stock**: A dynamic progress bar reflects the current inventory status in real-time.

### API Endpoints
- `POST /api/drops`: Initialize a new sneaker drop (Admins).
- `GET /api/drops`: Retrieve all active drops with nested purchase history.
- `POST /api/reservations`: Atomic item reservation.
- `POST /api/purchases`: Finalize purchase using a valid reservation ID.

---

## 🧪 Testing Concurrency
To verify the "No Overselling" rule:
1. Open two browser windows side-by-side.
2. Observe the real-time stock count update in Window B when you click "Reserve" in Window A.
3. Wait 60 seconds to see the stock automatically "recover" back to the available pool.

---

## 📹 Deployment & Demo
- **Hosted Database**: Neon PostgreSQL (Serverless).
- **Hosting**: Vercel (Frontend & Serverless Functions).
- **Demo**: [Insert Loom Link Here]

---

Developed with ❤️ for the Sneaker Drop Technical Assessment.
