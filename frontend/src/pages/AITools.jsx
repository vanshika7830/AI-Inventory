import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { ToastContext } from '../context/ToastContext';
import {
  Sparkles,
  Copy,
  CheckCircle,
  HelpCircle,
  FileText,
  Instagram,
  RefreshCw,
  ShoppingBag,
  Sliders,
  DollarSign,
  Tag,
  BookOpen
} from 'lucide-react';

const AITools = () => {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const { addToast } = useContext(ToastContext);
  const isDark = theme === 'dark';

  // Catalog products for quick select
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form states
  const [form, setForm] = useState({
    productId: '',
    name: '',
    category: '',
    price: ''
  });

  // Generator states
  const [activeTab, setActiveTab] = useState('caption'); // 'caption', 'description', 'tags'
  const [output, setOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch catalog products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products for AI copywriter:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Autofill form when product selection changes
  const handleProductSelect = (e) => {
    const prodId = e.target.value;
    if (!prodId) {
      setForm({ productId: '', name: '', category: '', price: '' });
      return;
    }

    const selected = products.find(p => p._id === prodId);
    if (selected) {
      setForm({
        productId: prodId,
        name: selected.name,
        category: selected.category,
        price: selected.price
      });
    }
  };

  // Generate action
  const handleGenerate = async (e) => {
    e.preventDefault();
    const { name, category, price } = form;

    if (!name || !category) {
      addToast("Please provide at least a Product Name and Category before generating.", "warning");
      return;
    }

    try {
      setGenerating(true);
      setOutput('');
      setCopied(false);

      let res;
      if (activeTab === 'caption') {
        res = await axios.post('/api/ai/generate-caption', { name, category, price });
        setOutput(res.data.caption);
        addToast("Social caption generated!", "success");
      } else if (activeTab === 'description') {
        res = await axios.post('/api/ai/generate-description', { name, category });
        setOutput(res.data.description);
        addToast("SEO description generated!", "success");
      } else if (activeTab === 'tags') {
        res = await axios.post('/api/ai/generate-tags', { name, category });
        // Format tags array nicely
        const tagsVal = Array.isArray(res.data.tags) ? res.data.tags.join(', ') : res.data.tags;
        setOutput(tagsVal);
        addToast("SEO search tags generated!", "success");
      }
    } catch (err) {
      console.error('AI copywriting failed:', err);
      const errMsg = err.response?.data?.message || err.message;
      setOutput('AI Generation Failed: ' + errMsg);
      addToast('AI Generation Failed: ' + errMsg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Copy to clipboard helper
  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    addToast("Content copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Panel */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white transition-colors duration-200">
          AI Copywriter & Tools
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Auto-generate stunning e-commerce copy, social media advertising captions, and search engine keywords powered by Gemini.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Settings & Form Panel */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-brand-light" />
              Copywriting Settings
            </h3>

            {/* Select Product Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">
                Quick Select Product
              </label>
              {loadingProducts ? (
                <div className="h-10 w-full rounded-xl bg-gray-100 dark:bg-dark-900 animate-pulse border border-gray-200 dark:border-gray-800"></div>
              ) : (
                <select
                  value={form.productId}
                  onChange={handleProductSelect}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input cursor-pointer font-medium"
                >
                  <option value="">-- Create Custom/Manual --</option>
                  {products.map((prod) => (
                    <option key={prod._id} value={prod._id}>
                      {prod.name} ({prod.category})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[10px] text-gray-400 mt-1.5">Choose an item from catalog to auto-fill configurations below.</p>
            </div>

            {/* Inputs */}
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Vintage Leather Boots"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1.5">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Footwear"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1.5">
                  Retail Price ($) <span className="text-[10px] text-gray-400 italic font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="e.g. 89.99"
                  min="0"
                  step="0.01"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm glass-input font-medium"
                />
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={generating || !form.name || !form.category}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand to-brand-light hover:brightness-110 hover:shadow-lg hover:shadow-brand/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Write Content with Gemini
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Copywriter Output Panel */}
        <div className="lg:col-span-3 p-6 rounded-2xl glass-card flex flex-col justify-between space-y-6">
          <div className="space-y-4 flex-1 flex flex-col">
            {/* Tabs Selector */}
            <div className="flex bg-gray-100/50 dark:bg-dark-900/40 p-1.5 rounded-xl border border-gray-200/30 dark:border-gray-800/80">
              <button
                onClick={() => { setActiveTab('caption'); setOutput(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'caption'
                    ? 'bg-white dark:bg-dark-750 text-brand dark:text-brand-light shadow-sm'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                <Instagram className="h-4 w-4" />
                Social Caption
              </button>
              <button
                onClick={() => { setActiveTab('description'); setOutput(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'description'
                    ? 'bg-white dark:bg-dark-750 text-brand dark:text-brand-light shadow-sm'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                SEO Description
              </button>
              <button
                onClick={() => { setActiveTab('tags'); setOutput(''); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'tags'
                    ? 'bg-white dark:bg-dark-750 text-brand dark:text-brand-light shadow-sm'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                <Tag className="h-4 w-4" />
                SEO Search Tags
              </button>
            </div>

            {/* Output Display Container */}
            <div className="flex-1 min-h-[16rem] relative p-5 bg-white/50 dark:bg-dark-900/30 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
              {generating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="h-10 w-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 animate-pulse">
                    Gemini AI is processing your request...
                  </p>
                </div>
              ) : output ? (
                <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-wrap select-all">
                  {output}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-brand/5 border border-brand/10 flex items-center justify-center text-brand dark:text-brand-light">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Draft copywriting outputs</h4>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">
                      Configure your product's features on the left sidebar and click generate. Results will populate here instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              {output && !generating && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    Content Ready to Copy
                  </span>
                  
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                      copied
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : 'bg-white hover:bg-gray-100 dark:bg-dark-800 dark:hover:bg-dark-750 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITools;
