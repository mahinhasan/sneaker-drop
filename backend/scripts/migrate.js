const sequelize = require('../src/config/database');

// load models to register associations
require('../src/models/Drop');
require('../src/models/User');
require('../src/models/Purchase');
require('../src/models/Reservation');

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    process.exit(0);
  } catch (err) {
    console.error('Sync error', err);
    process.exit(1);
  }
})();
