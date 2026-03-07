# Socket.IO Real-Time Architecture

This document explains how real-time updates work across the Sneaker Drop application using **Socket.IO WebSockets**.

---

## Overview

The system uses **bidirectional real-time communication** between the backend server and connected frontend clients. When any user performs an action (reserve, purchase, or reservation expires), all other connected clients are instantly notified.

```
┌─────────────────────────────────────────────────────────┐
│                   Backend Server                         │
│  (Express + Socket.IO)                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Controllers emit events via io.emit(...)         │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ WebSocket
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Browser │    │ Browser │    │ Browser │
    │   Tab1  │    │   Tab2  │    │   Tab3  │
    │(Listens)│    │(Listens)│    │(Listens)│
    └─────────┘    └─────────┘    └─────────┘
```

---

## Architecture Layers

### 1. Backend: Server Setup

**File:** `backend/server.js`

```javascript
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Initialize io for use in controllers
const ioUtil = require('./src/utils/io');
ioUtil.init(io);

// Load real-time event handlers
const realtime = require('./src/utils/realtime');
realtime(io);
```

**Key Points:**
- HTTP server wraps the Express app
- Socket.IO server attached to HTTP server
- CORS enabled for cross-origin connections
- `io` instance exported for use in controllers

---

### 2. Backend: IO Utility Module

**File:** `backend/src/utils/io.js`

```javascript
let ioInstance = null;

exports.init = (io) => {
  ioInstance = io;
};

exports.getIo = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }
  return ioInstance;
};
```

**Purpose:**
- Provides singleton pattern for Socket.IO instance
- Controllers import and call `getIo()` to broadcast events
- Ensures only one instance throughout the app lifecycle

---

### 3. Backend: Real-Time Event Handler

**File:** `backend/src/utils/realtime.js`

```javascript
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('client connected', socket.id);
    socket.on('disconnect', () => console.log('client disconnected', socket.id));
  });
};
```

**Purpose:**
- Listens for client connections
- Logs connection/disconnection for debugging
- Could be extended for client-to-server events (e.g., user joins room)

---

### 4. Backend: Event Emission Points

Events are emitted from controllers when state changes occur:

#### A. Reservation Creation

**File:** `backend/src/controllers/reservationController.js`

```javascript
exports.reserveItem = async (req, res) => {
  // ... transaction logic ...
  
  // Broadcast to all connected clients
  const io = require('../utils/io').getIo();
  io.emit('stockUpdated', { 
    dropId, 
    availableStock: drop.availableStock 
  });
  
  res.json({ reservation: { ... } });
};
```

**Trigger:** User clicks "Reserve" button  
**Event:** `stockUpdated`  
**Payload:**
```json
{
  "dropId": 1,
  "availableStock": 45
}
```

#### B. Reservation Expiration

**File:** `backend/src/controllers/reservationController.js`

```javascript
exports.expireReservations = async () => {
  // Runs every 5 seconds (setInterval in server.js)
  
  for (const r of expired) {
    // ... restore stock ...
    
    const io = require('../utils/io').getIo();
    io.emit('stockUpdated', { dropId: drop.id, availableStock: drop.availableStock });
    io.emit('reservationExpired', { dropId: drop.id, userId: reservation.userId });
  }
};
```

**Trigger:** 60-second reservation timeout  
**Events:**
- `stockUpdated`: Stock restored
- `reservationExpired`: Notify user their reservation is gone

**Payload:**
```json
{
  "dropId": 1,
  "userId": "user-1"
}
```

#### C. Purchase Completion

**File:** `backend/src/controllers/purchaseController.js`

```javascript
exports.completePurchase = async (req, res) => {
  // ... purchase logic ...
  
  const io = require('../utils/io').getIo();
  io.emit('purchaseMade', { 
    dropId: purchase.dropId, 
    userId: purchase.userId,
    username: reservation.userId
  });
  
  res.json({ success: true, purchase });
};
```

**Trigger:** User completes purchase  
**Event:** `purchaseMade`  
**Payload:**
```json
{
  "dropId": 1,
  "userId": "user-1",
  "username": "user-1"
}
```

---

### 5. Frontend: Socket Connection

**File:** `frontend/src/App.js`

```javascript
useEffect(() => {
  // Determine socket URL from environment
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
  const socketUrl = apiBase.replace(/\/api\/?$/, ''); // Strip '/api'
  
  const { io } = require('socket.io-client');
  const socket = io(socketUrl, { transports: ['websocket'] });
  
  // Connection lifecycle
  socket.on('connect', () => {
    console.log('socket connected', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('socket disconnected');
  });
  
  return () => {
    socket.disconnect(); // Cleanup on component unmount
  };
}, [user.id]);
```

**Key Points:**
- Creates persistent WebSocket connection on app load
- `socketUrl` removes `/api` suffix from API base URL
- Cleans up connection when component unmounts
- Connection persists across page navigation within SPA

---

### 6. Frontend: Event Listeners

#### A. Stock Updates

```javascript
socket.on('stockUpdated', ({ dropId, availableStock }) => {
  setDrops(prev => prev.map(d => 
    d.id === dropId 
      ? { ...d, availableStock } 
      : d
  ));
});
```

**Receives:** Stock change from any user's reservation  
**Action:** Updates React state, re-renders all DropCard components  
**Result:** All tabs instantly show new stock count

#### B. Reservation Expiration

```javascript
socket.on('reservationExpired', ({ dropId, userId }) => {
  if (userId === user.id) {
    setCurrentReservation(null);
    addNotification('Your reservation expired', 'warning');
  }
});
```

**Receives:** Reservation timeout event  
**Action:**
- If for current user: clear local reservation state
- Show warning toast notification  
**Result:** User can no longer purchase; "Reserved" button goes away

#### C. Purchase Notifications

```javascript
socket.on('purchaseMade', ({ dropId, userId, username }) => {
  addNotification(`User ${username || userId} purchased item`, 'info');
});
```

**Receives:** Purchase completion event  
**Action:** Display "info" toast notification  
**Result:** Users see system-wide purchase activity

---

## Data Flow Example: Reserve → Expire → Update

### Scenario: User reserves item in Tab 1, sees update in Tab 2

```
Tab 1 (Browser)              Backend              Tab 2 (Browser)
─────────────────            ───────              ─────────────────

User clicks 
"Reserve" 
Button
    │
    └──POST /api/reservations──► reserveItem()
                                      │
                                      ├─ Decrement stock (50→49)
                                      ├─ Create Reservation row
                                      │
                                      └─ io.emit('stockUpdated', 
                                             { dropId: 1, 
                                               availableStock: 49 })
                                             │
                                             ├──────────────────► socket.on('stockUpdated')
                                             │                        │
                                             │                        └─ setDrops([...])
                                             │                             Re-render ✓
                                             └──────────────────► (local Tab 1 also updates)
                                             
                          [5 seconds later...]
                          
                          setInterval runs expireReservations()
                                      │
                                      ├─ Check dates
                                      ├─ Find expired reservation
                                      ├─ Mark completed = true
                                      ├─ Restore stock (49→50)
                                      │
                                      ├─ io.emit('stockUpdated', 
                                      │      { dropId: 1, 
                                      │        availableStock: 50 })
                                      │
                                      ├─ io.emit('reservationExpired',
                                      │      { dropId: 1, 
                                      │        userId: 'user-1' })
                                             │
                                             ├──────────────────► socket.on('stockUpdated')
                                             │                        └─ setDrops([...])
                                             │                             Re-render ✓
                                             │
                                             └──────────────────► socket.on('reservationExpired')
                                                                      ├─ userId matches
                                                                      └─ setCurrentReservation(null)
                                                                           Re-render ✓
```

---

## Environment Variables

For socket connection to work correctly:

### Frontend (.env or .env.local)
```
REACT_APP_API_BASE=http://localhost:5000/api
# Socket URL will be derived as: http://localhost:5000
```

### Backend (.env)
```
FRONTEND_URL=http://localhost:3000
# Or for production: https://yourapp.com
PORT=5000
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Socket not connecting | API base URL includes `/api` | Frontend strips `/api` automatically |
| Events not received | CORS not configured | Check `socket.io` cors options in server.js |
| Updates lag between tabs | Browser tabs have separate JS contexts | Events update React state which re-renders |
| Socket reconnects repeatedly | Server not accessible | Verify backend is running and URL is correct |
| No notifications on purchase | Event listener not registered | Check socket.on handlers in app useEffect |

---

## Performance Considerations

1. **Broadcast Scope:** `io.emit()` sends to ALL connected clients
   - For targeting specific users, use rooms: `io.to(userId).emit(...)`
   - Current implementation is acceptable for small-scale apps

2. **Polling vs WebSockets:**
   - WebSocket: Real-time, persistent connection (current)
   - Polling: HTTP requests every N seconds (slower, more overhead)

3. **Event Frequency:**
   - `expireReservations` runs every 5 seconds (heavy on database)
   - Consider optimizing with timestamps instead of polling

4. **Memory Usage:**
   - Each connected socket holds connection state
   - Auto-cleanup on disconnect prevents leaks

---

## Development Debugging

### Browser DevTools
Open DevTools (F12) → Network → WS (WebSocket) to monitor:
- Connection handshake
- Incoming events in real-time
- Event payloads

### Server Logs
```bash
node backend/server.js
# Output:
# client connected 8A9B2C4D
# stockUpdated sent to all clients
# client disconnected 8A9B2C4D
```

### Test Multiple Tabs
1. Open `http://localhost:3000` in two browser tabs
2. Perform action in Tab 1
3. Observe Tab 2 updates instantly
4. Check browser console for socket logs

---

## Summary

| Component | Role | File |
|-----------|------|------|
| **Socket.IO Server** | Maintains WebSocket connections | `backend/server.js` |
| **IO Utility** | Singleton pattern for io instance | `backend/src/utils/io.js` |
| **Realtime Handler** | Connection lifecycle management | `backend/src/utils/realtime.js` |
| **Controllers** | Emit events on state changes | `backend/src/controllers/*.js` |
| **React Hook** | Establish client connection | `frontend/src/App.js` (useEffect) |
| **Event Listeners** | Update UI on socket events | `frontend/src/App.js` (socket.on) |

**Result:** Real-time inventory synchronization across all browser tabs and users.
