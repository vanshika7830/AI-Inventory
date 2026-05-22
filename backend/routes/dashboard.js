const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Total Revenue & Total Sales Count
    const revenueStats = await Sale.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          totalItemsSold: { $sum: '$quantity' },
          salesCount: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    const totalItemsSold = revenueStats.length > 0 ? revenueStats[0].totalItemsSold : 0;
    const salesCount = revenueStats.length > 0 ? revenueStats[0].salesCount : 0;

    // 2. Top 5 Selling Products
    const topProducts = await Sale.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$product',
          totalRevenue: { $sum: '$revenue' },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products', // matches MongoDB collection name
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$productInfo.name', 'Unknown Product'] },
          price: { $ifNull: ['$productInfo.price', 0] },
          category: { $ifNull: ['$productInfo.category', 'General'] },
          totalRevenue: 1,
          totalQuantity: 1,
        },
      },
    ]);

    // 3. Monthly Sales (Revenue over time)
    const monthlyStats = await Sale.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          revenue: { $sum: '$revenue' },
          salesCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySalesFormatted = monthlyStats.map((item) => ({
      month: `${monthNames[item._id.month]} ${item._id.year}`,
      revenue: item.revenue,
      salesCount: item.salesCount,
    }));

    // 4. Low Stock Count (Stock < 10)
    const lowStockCount = await Product.countDocuments({ user: userId, stock: { $lt: 10 } });

    // 5. Total Active Products
    const totalProducts = await Product.countDocuments({ user: userId });

    res.json({
      summary: {
        totalRevenue,
        totalItemsSold,
        salesCount,
        lowStockCount,
        totalProducts,
      },
      topProducts,
      monthlySales: monthlySalesFormatted,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

// @desc    Add a manual sale (useful for testing)
// @route   POST /api/dashboard/sale
// @access  Private
router.post('/sale', protect, async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ message: 'Product ID and quantity are required' });
  }

  try {
    const product = await Product.findOne({ _id: productId, user: req.user._id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient product stock' });
    }

    // Deduct stock
    product.stock -= quantity;
    await product.save();

    const revenue = product.price * quantity;

    const sale = new Sale({
      user: req.user._id,
      product: productId,
      quantity,
      revenue,
    });

    const savedSale = await sale.save();
    res.status(201).json(savedSale);
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ message: 'Server error recording sale' });
  }
});

// @desc    Seed mock data (products and sales) for quick visualization
// @route   POST /api/dashboard/seed
// @access  Private
router.post('/seed', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete existing products and sales for this user
    await Product.deleteMany({ user: userId });
    await Sale.deleteMany({ user: userId });

    // 1. Create Mock Products
    const mockProducts = [
      { name: 'Ultra Wireless Headset', description: 'Noise cancelling overhead headphones.', price: 120, stock: 45, category: 'Electronics', tags: ['wireless', 'headset', 'audio'] },
      { name: 'Smart Fitness Band v2', description: 'Tracks sleep, heart rate, and steps.', price: 50, stock: 8, category: 'Wearables', tags: ['fitness', 'smartband', 'health'] },
      { name: 'Ergonomic Office Chair', description: 'High back lumbar support office chair.', price: 250, stock: 15, category: 'Furniture', tags: ['office', 'chair', 'furniture'] },
      { name: 'Mechanical Keyboard (RGB)', description: 'Blue switch tactile mechanical keyboard.', price: 80, stock: 5, category: 'Computer Accessories', tags: ['keyboard', 'rgb', 'gaming'] },
      { name: 'USB-C Multiport Adapter', description: '8-in-1 USB-C dongle with HDMI.', price: 40, stock: 95, category: 'Computer Accessories', tags: ['usb-c', 'adapter', 'dongle'] },
      { name: 'Stainless Steel Water Bottle', description: 'Insulated double-walled sports flask.', price: 25, stock: 3, category: 'Home & Kitchen', tags: ['water bottle', 'insulated', 'sports'] },
    ];

    const createdProducts = await Product.insertMany(
      mockProducts.map((p) => ({ ...p, user: userId }))
    );

    // 2. Create Mock Sales over the past 5 months
    const salesData = [];
    const now = new Date();

    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Generate random sales for each month (e.g. past 5 months)
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 15);

      createdProducts.forEach((product) => {
        // Random chance of selling this product this month
        if (Math.random() > 0.3) {
          const qty = getRandomInt(2, 10);
          salesData.push({
            user: userId,
            product: product._id,
            quantity: qty,
            revenue: product.price * qty,
            date: date,
          });
        }
      });
    }

    const createdSales = await Sale.insertMany(salesData);

    res.status(201).json({
      message: 'Database seeded successfully',
      productsCreated: createdProducts.length,
      salesCreated: createdSales.length,
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ message: 'Seeding failed', error: error.message });
  }
});

module.exports = router;
