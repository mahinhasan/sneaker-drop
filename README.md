# Sneaker-Drop Inventory System

A professional, real-time inventory management system for high-traffic limited edition sneaker drops. This application ensures data integrity during massive traffic spikes using advanced database techniques and provides a seamless user experience with real-time updates.

## Technical Stack

- **Frontend**: React.js with custom CSS (Ashy Dark Theme)
- **Backend**: Node.js and Express
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Real-time Communication**: Socket.io (WebSockets)
- **Deployment**: Vercel ready

## Project Structure

- `backend/`: Node.js server, services, and PostgreSQL models.
- `frontend/`: React application and styles.
- `vercel.json`: Configuration for unified deployment.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database instance

### Database Setup

The application uses Sequelize's `sync({ alter: true })` mechanism, which automatically creates and updates the database schema based on the defined models. There is no need for manual SQL scripts.

1. Create a PostgreSQL database (e.g., `sneaker_drop`).
2. Configure the connection in `backend/.env`.

### Environment Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
DB_NAME=sneaker_drop
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Installation and Running

#### 1. Backend

```bash
cd backend
npm install
npm start
```

On first run, the system automatically:
- Synchronizes the database schema.
- Creates a default user (`alice`).
- Initializes three sample sneaker drops.

#### 2. Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3000`.

## Architecture Choices

### 60-Second Reservation Expiration

To handle limited stock effectively, the system implements a temporary reservation window.

1. **Reservation Record**: When a user clicks "Reserve", a record is created in the `reservations` table with an `expiresAt` timestamp set to 60 seconds from the current time.
2. **Background Job**: The backend runs a periodic job (every 5 seconds) that identifies expired and uncompleted reservations.
3. **Stock Recovery**: When a reservation expires:
   - The `completed` flag is set to `true` (to prevent re-processing).
   - The `availableStock` for the associated item is incremented by 1.
   - A WebSocket event (`stockUpdated`) is broadcast to all clients to update the UI.
   - A specific event (`reservationExpired`) is sent to the affected user to reset their local UI state.

### Concurrency and Atomic Reservations

The most critical challenge in a "Drop" scenario is preventing overselling when hundreds of users attempt to reserve the last remaining item simultaneously.

**Solution: Serializable Transactions with Row-Level Locking**

The reservation logic in `reservationService.js` uses a strict isolation strategy:

1. **Serializable Isolation**: The transaction is initiated with `ISOLATION_LEVELS.SERIALIZABLE`, the highest level of isolation, which prevents phantom reads and serialization anomalies.
2. **Row-Level Locking**: The `Drop.findByPk` call uses `lock: t.LOCK.UPDATE`. This places an exclusive lock on the specific sneaker's row. Any concurrent transaction attempting to read or update this row must wait until the first one commits or rolls back.
3. **Atomic Decrement**: Inside the locked transaction, the system checks if `availableStock > 0`. If yes, it decrements the stock and creates the reservation record in one atomic step.
4. **Error Handling**: If two transactions conflict, PostgreSQL raises a serialization error. The backend catches this and returns a "Concurrency conflict" message, prompting the user to try again safely.

## UI & Design Features

- **Ashy Theme**: A professional, high-contrast dark theme (Slate & Indigo) designed for readability.
- **Centered Layout**: Main content and navigation are restricted to a 60% container for a clean, focused ERP-like experience.
- **Live Feed**: Each product card displays a real-time feed of recent successful purchases.
- **Responsive Navigation**: Includes a dashboard for live drops and a comprehensive history section for both personal and system-wide orders.
