const sequelize = require('../src/config/database');
const User = require('../src/models/User');
const Drop = require('../src/models/Drop');

(async () => {
  await sequelize.sync({ force: true });
  
  // Create users
  await User.create({ id: 'user-1', user: 'alice', fullName: 'Alice Johnson', primaryEmail: 'alice@example.com' });
  await User.create({ id: 'user-2', user: 'bob', fullName: 'Bob Smith', primaryEmail: 'bob@example.com' });
  await User.create({ id: 'user-3', user: 'charlie', fullName: 'Charlie Brown', primaryEmail: 'charlie@example.com' });
  await User.create({ id: 'user-4', user: 'diana', fullName: 'Diana Prince', primaryEmail: 'diana@example.com' });
  
  // Create drops with different stock levels
  // Full Stock
  await Drop.create({ 
    name: 'Air Jordan 1 Retro High OG', 
    price: 199.99, 
    totalStock: 100, 
    availableStock: 100 
  });
  
  // 50% Stock
  await Drop.create({ 
    name: 'Nike Dunk Low "Panda"', 
    price: 129.99, 
    totalStock: 200, 
    availableStock: 100 
  });
  
  // Low Stock (1 item)
  await Drop.create({ 
    name: 'Adidas Yeezy Boost 350 v2', 
    price: 219.99, 
    totalStock: 50, 
    availableStock: 1 
  });
  
  // Low Stock (5 items)
  await Drop.create({ 
    name: 'Converse Chuck Taylor 70s', 
    price: 89.99, 
    totalStock: 100, 
    availableStock: 5 
  });
  
  // Low Stock (1 item)
  await Drop.create({ 
    name: 'New Balance 990v6', 
    price: 175.00, 
    totalStock: 75, 
    availableStock: 1 
  });
  
  console.log('Seed completed');
  process.exit(0);
})();
