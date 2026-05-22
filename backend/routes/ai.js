const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Robust helper to generate content with retries and exponential backoff
const generateContentWithRetry = async (prompt, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response;
    } catch (error) {
      const errorStr = error.message || '';
      const isTransient = errorStr.includes('503') || errorStr.includes('429') || errorStr.includes('Service Unavailable') || errorStr.includes('overloaded') || errorStr.includes('quota');
      if (isTransient && i < retries - 1) {
        console.warn(`Gemini API call failed (Attempt ${i + 1}/${retries}). Retrying in ${delay}ms... Error: ${errorStr}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      } else {
        throw error;
      }
    }
  }
};

// Helper to clean JSON response from Gemini
const parseJsonArray = (text) => {
  try {
    let cleanText = text.trim();
    // Remove markdown code blocks if present
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Failed to parse JSON from AI response:', text);
    // Fallback: extract tags manually or return an array
    const words = text.match(/"([^"\\]|\\.)*"/g);
    if (words) {
      return words.map(w => w.replace(/"/g, ''));
    }
    return text.split(',').map(t => t.trim());
  }
};

// @desc    Generate product description
// @route   POST /api/ai/generate-description
// @access  Private
// @desc    Generate product description
// @route   POST /api/ai/generate-description
// @access  Private
router.post('/generate-description', protect, async (req, res) => {
  const { name, category } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Please provide both product name and category' });
  }

  try {
    const prompt = `Generate a compelling, professional, SEO-friendly e-commerce product description for a product named '${name}' in the category '${category}'. Keep it under 150 words. Write only the description, without any titles, markdown formatting, or HTML tags.`;
    
    const response = await generateContentWithRetry(prompt);
    const description = response.text().trim();

    res.json({ description });
  } catch (error) {
    console.error('Gemini generate description error:', error);
    res.status(500).json({ message: 'AI generation failed', error: error.message });
  }
});

// @desc    Generate product tags
// @route   POST /api/ai/generate-tags
// @access  Private
router.post('/generate-tags', protect, async (req, res) => {
  const { name, category, description } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Please provide both product name and category' });
  }

  try {
    const prompt = `Generate exactly 5 to 8 relevant SEO search tags/keywords for an e-commerce product named '${name}' in the category '${category}'${description ? ` with description: '${description}'` : ''}. Return ONLY a JSON array of strings (e.g. ["tag1", "tag2", "tag3"]). Do not wrap it in markdown code blocks or add any other text.`;

    const response = await generateContentWithRetry(prompt);
    const textResponse = response.text();
    
    const tags = parseJsonArray(textResponse);
    res.json({ tags });
  } catch (error) {
    console.error('Gemini generate tags error:', error);
    res.status(500).json({ message: 'AI tag generation failed', error: error.message });
  }
});

// @desc    Generate social media marketing caption
// @route   POST /api/ai/generate-caption
// @access  Private
router.post('/generate-caption', protect, async (req, res) => {
  const { name, category, price } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Please provide both product name and category' });
  }

  try {
    const prompt = `Create an engaging social media/Instagram marketing caption for a product named '${name}' in the category '${category}'${price ? ` priced at $${price}` : ''}. Include relevant emojis and popular hashtags. Keep it catchy, energetic, and ready to post.`;

    const response = await generateContentWithRetry(prompt);
    const caption = response.text().trim();

    res.json({ caption });
  } catch (error) {
    console.error('Gemini generate caption error:', error);
    res.status(500).json({ message: 'AI caption generation failed', error: error.message });
  }
});

// @desc    Generate sales & inventory dashboard suggestions
// @route   POST /api/ai/suggestions
// @access  Private
router.post('/suggestions', protect, async (req, res) => {
  const { topProducts, summary } = req.body;

  if (!topProducts || !summary) {
    return res.status(400).json({ message: 'Please provide topProducts and summary statistics' });
  }

  try {
    const prompt = `
      You are a smart retail AI business analyst. Analyze the following e-commerce sales dashboard data and provide:
      1. Pricing and stock advice for top products.
      2. General trending insights or strategy recommendations for the store.

      Store Statistics:
      - Total Revenue: $${summary.totalRevenue}
      - Total Items Sold: ${summary.totalItemsSold}
      - Sales Transactions: ${summary.salesCount}
      - Low Stock Alerts: ${summary.lowStockCount} products with stock < 10

      Top 5 Selling Products:
      ${topProducts.map((p, idx) => `${idx + 1}. Name: "${p.name}", Category: "${p.category}", Total Quantity Sold: ${p.totalQuantity}, Total Revenue: $${p.totalRevenue}, Unit Price: $${p.price}`).join('\n')}

      Provide exactly 4-5 bullet points of actionable advice in standard Markdown. Use clear headings and lists. Keep the response concise, encouraging, and business-focused.
    `;

    const response = await generateContentWithRetry(prompt);
    const suggestions = response.text().trim();

    // Create notification
    await Notification.create({
      user: req.user._id,
      type: 'info',
      message: 'New AI strategic suggestions generated for your store.',
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('Gemini generate suggestions error:', error);
    res.status(500).json({ message: 'AI suggestion generation failed', error: error.message });
  }
});

module.exports = router;
