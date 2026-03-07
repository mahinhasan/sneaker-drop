require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const sequelize = require('./src/config/database');

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
  path: '/socket.io/',
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

const corsOptions = {
  origin: true, // Allow all origins for easier dev/testing, or use '*'
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/drops', dropRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/purchases', purchaseRoutes);

app.get('/', (req, res) => res.send('Sneaker Drop API'));

const ioUtil = require('./src/utils/io');
ioUtil.init(io);

const realtime = require('./src/utils/realtime');
realtime(io);

const { expireReservationsJob } = require('./src/controllers/reservationController');
setInterval(expireReservationsJob, 5000);

const PORT = process.env.PORT || 5000;

const { findOrCreateUser } = require('./src/services/userService');
const { createDrop, getDrops } = require('./src/services/dropService');

sequelize
  .authenticate()
  .then(async () => {
    console.log('DB connected');
    
    // Sync models
    console.log('Synchronizing database...');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    // Ensure default user exists for frontend
    await findOrCreateUser({ id: 'user-1', user: 'alice', fullName: 'Alice Smith' });

    // Ensure at least one drop exists for a good first-run experience
    const drops = await getDrops();
    if (drops.length === 0) {
      console.log('Initializing first-run drops...');
      await createDrop('Air Jordan 1 Retro High OG', 199.99, 100);
      await createDrop('Nike Dunk Low "Panda"', 129.99, 200);
      await createDrop('Adidas Yeezy Boost 350 v2', 219.99, 50);
    }
    
    server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch((err) => console.error('DB connection error', err));
