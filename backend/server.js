require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const sequelize = require('./src/config/database');

// load models to register associations
require('./src/models/Drop');
require('./src/models/User');
require('./src/models/Purchase');
require('./src/models/Reservation');

const dropRoutes = require('./src/routes/drop');
const reservationRoutes = require('./src/routes/reservation');
const purchaseRoutes = require('./src/routes/purchase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/api/drops', dropRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/purchases', purchaseRoutes);

// simple health check
app.get('/', (req, res) => res.send('Sneaker Drop API'));

// initialize io util for controllers
const ioUtil = require('./src/utils/io');
ioUtil.init(io);

// WebSocket event handling
const realtime = require('./src/utils/realtime');
realtime(io);

// start background job to expire reservations every 5 seconds
const { expireReservations } = require('./src/controllers/reservationController');
setInterval(expireReservations, 5000);

// start server
const PORT = process.env.PORT || 5000;

sequelize
  .authenticate()
  .then(() => {
    console.log('DB connected');
    server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch((err) => console.error('DB connection error', err));
