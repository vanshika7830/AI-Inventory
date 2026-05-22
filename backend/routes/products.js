const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// @desc    Get all products for the logged in user
// @route   GET /api/products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error fetching product details' });
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, price, stock, category, tags } = req.body;

    if (!name || price === undefined || stock === undefined || !category) {
      return res.status(400).json({ message: 'Please provide name, price, stock, and category' });
    }

    const product = new Product({
      user: req.user._id,
      name,
      description,
      price,
      stock,
      category,
      tags: tags || [],
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, price, stock, category, tags } = req.body;

    // Find product and ensure it belongs to the user
    let product = await Product.findOne({ _id: req.params.id, user: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name !== undefined ? name : product.name;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.category = category !== undefined ? category : product.category;
    product.tags = tags !== undefined ? tags : product.tags;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

module.exports = router;
