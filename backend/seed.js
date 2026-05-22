const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');
const Sale = require('./models/Sale');

dotenv.config({ path: path.join(__dirname, '.env') });

const productsData = [
  { name: 'Wireless Noise-Canceling Headphones', description: 'Premium over-ear headphones with active noise cancellation.', price: 299.99, stock: 45, category: 'Electronics', tags: ['audio', 'wireless', 'premium'] },
  { name: 'Ergonomic Office Chair', description: 'Comfortable mesh office chair with lumbar support.', price: 199.50, stock: 12, category: 'Furniture', tags: ['office', 'comfort'] },
  { name: 'Mechanical Gaming Keyboard', description: 'RGB mechanical keyboard with cherry MX red switches.', price: 129.99, stock: 8, category: 'Gaming', tags: ['rgb', 'mechanical', 'keyboard'] },
  { name: 'Smart Home Hub', description: 'Centralize your smart devices with voice control capabilities.', price: 89.00, stock: 0, category: 'Smart Home', tags: ['smart', 'voice', 'hub'] },
  { name: '4K Ultra HD Monitor', description: '27-inch 4K IPS display for creators and gamers.', price: 349.99, stock: 25, category: 'Electronics', tags: ['monitor', '4k', 'display'] },
  { name: 'Stainless Steel Water Bottle', description: 'Vacuum insulated water bottle keeps drinks cold for 24h.', price: 24.99, stock: 150, category: 'Accessories', tags: ['hydration', 'durable'] },
  { name: 'Adjustable Standing Desk', description: 'Electric height adjustable desk for home office.', price: 499.00, stock: 5, category: 'Furniture', tags: ['desk', 'standing', 'office'] },
  { name: 'Wireless Charging Pad', description: 'Fast 15W wireless charger for smartphones.', price: 39.99, stock: 85, category: 'Electronics', tags: ['charging', 'wireless'] },
  { name: 'Yoga Mat', description: 'Non-slip eco-friendly yoga mat with alignment lines.', price: 45.00, stock: 60, category: 'Fitness', tags: ['yoga', 'fitness', 'mat'] },
  { name: 'Bluetooth Speaker', description: 'Waterproof portable bluetooth speaker with deep bass.', price: 59.99, stock: 40, category: 'Audio', tags: ['speaker', 'portable', 'waterproof'] },
  { name: 'Smartwatch Series 5', description: 'Fitness tracker and smartwatch with heart rate monitor.', price: 199.99, stock: 30, category: 'Wearables', tags: ['watch', 'fitness', 'smart'] },
  { name: 'Coffee Espresso Machine', description: 'Automatic espresso machine with milk frother.', price: 299.00, stock: 15, category: 'Appliances', tags: ['coffee', 'espresso', 'kitchen'] },
  { name: 'Leather Laptop Sleeve', description: 'Premium genuine leather sleeve for 15-inch laptops.', price: 49.99, stock: 20, category: 'Accessories', tags: ['leather', 'laptop', 'sleeve'] },
  { name: 'LED Desk Lamp', description: 'Dimmable LED desk lamp with USB charging port.', price: 35.00, stock: 110, category: 'Lighting', tags: ['lamp', 'led', 'desk'] },
  { name: 'Resistance Band Set', description: 'Set of 5 heavy-duty resistance bands for home workouts.', price: 19.99, stock: 200, category: 'Fitness', tags: ['workout', 'bands', 'fitness'] }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Find or create user
    let user = await User.findOne({ email: 'demo@example.com' });
    if (!user) {
      user = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'password123'
      });
      await user.save();
      console.log('Created demo user: demo@example.com');
    } else {
      console.log('Using existing user:', user.email);
    }

    // Clear existing data for this user
    await Product.deleteMany({ user: user._id });
    await Sale.deleteMany({ user: user._id });
    console.log('Cleared existing products and sales for user.');

    // Insert Products
    const productsToInsert = productsData.map(p => ({ ...p, user: user._id }));
    const insertedProducts = await Product.insertMany(productsToInsert);
    console.log(`Inserted ${insertedProducts.length} products.`);

    // Generate random sales for some products over the past 30 days
    const salesData = [];
    const now = new Date();
    
    // Create ~25 random sales
    for (let i = 0; i < 25; i++) {
      const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
      const randomQty = Math.floor(Math.random() * 3) + 1;
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const saleDate = new Date(now.getTime() - (randomDaysAgo * 24 * 60 * 60 * 1000));
      
      salesData.push({
        user: user._id,
        product: randomProduct._id,
        quantity: randomQty,
        revenue: randomProduct.price * randomQty,
        date: saleDate
      });
    }

    const insertedSales = await Sale.insertMany(salesData);
    console.log(`Inserted ${insertedSales.length} sales records.`);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
