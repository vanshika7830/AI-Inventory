import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { ToastContext } from '../context/ToastContext';
import {
  Search,
  Grid,
  List,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  Filter,
  X,
  Tag,
  CheckCircle,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Package,
  Layers,
  DollarSign,
  ShoppingBag
} from 'lucide-react';

const Products = () => {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const { addToast } = useContext(ToastContext);
  const isDark = theme === 'dark';

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);

  // Modal Form State
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    tags: ''
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/products');
      setProducts(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Could not retrieve product list. Ensure your backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Escape key close modal listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDeleteConfirm(false);
        setSelectedDetailProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Gemini AI Description & Tag Generator
  const handleAiGeneration = async () => {
    const { name, category } = form;
    if (!name || !category) {
      addToast("Please provide at least a Product Name and Category before generating with AI.", "warning");
      return;
    }

    try {
      setAiGenerating(true);
      // Call generate description API
      const descRes = await axios.post('/api/ai/generate-description', { name, category });
      // Call generate tags API
      const tagsRes = await axios.post('/api/ai/generate-tags', { name, category });

      const generatedDesc = descRes.data.description;
      const generatedTags = Array.isArray(tagsRes.data.tags)
        ? tagsRes.data.tags.join(', ')
        : tagsRes.data.tags;

      setForm(prev => ({
        ...prev,
        description: generatedDesc,
        tags: generatedTags
      }));

      // Store onboarding AI action tag if needed
      localStorage.setItem('onboarding_ai_generated', 'true');
      addToast("AI description and search tags generated!", "success");
    } catch (err) {
      console.error('AI description/tag generation failed:', err);
      addToast('AI generation failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  // Open Add Product Modal
  const openAddModal = () => {
    setModalMode('add');
    setSelectedProductId(null);
    setForm({
      name: '',
      category: '',
      price: '',
      stock: '',
      description: '',
      tags: ''
    });
    setShowModal(true);
  };

  // Open Edit Product Modal
  const openEditModal = (product) => {
    setModalMode('edit');
    setSelectedProductId(product._id);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '')
    });
    setShowModal(true);
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (id) => {
    setSelectedProductId(id);
    setShowDeleteConfirm(true);
  };

  // Handle Form Submit (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, category, price, stock, description, tags } = form;

    if (!name || !category || price === '' || stock === '') {
      addToast("Please fill in Name, Category, Price, and Stock fields.", "warning");
      return;
    }

    try {
      setSubmitLoading(true);
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        description,
        tags: tagsArray
      };

      if (modalMode === 'add') {
        await axios.post('/api/products', payload);
        addToast(`Product "${name}" successfully added to inventory.`, "success");
      } else {
        await axios.put(`/api/products/${selectedProductId}`, payload);
        addToast(`Product "${name}" successfully updated.`, "success");
      }

      setShowModal(false);
      await fetchProducts();
      window.dispatchEvent(new Event('notification-added'));
    } catch (err) {
      console.error('Failed to save product:', err);
      addToast('Error saving product: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    try {
      await axios.delete(`/api/products/${selectedProductId}`);
      setShowDeleteConfirm(false);
      await fetchProducts();
      window.dispatchEvent(new Event('notification-added'));
      addToast("Product successfully deleted from catalog.", "success");
    } catch (err) {
      console.error('Delete product failed:', err);
      addToast('Error deleting product: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  // Sell Modal State
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellProduct, setSellProduct] = useState(null);
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellLoading, setSellLoading] = useState(false);

  const openSellModal = (prod) => {
    setSellProduct(prod);
    setSellQuantity(1);
    setShowSellModal(true);
  };

  const handleSellProduct = async (e) => {
    e.preventDefault();
    if (!sellProduct || sellQuantity < 1) return;
    if (sellQuantity > sellProduct.stock) {
      addToast(`Cannot sell more than available stock (${sellProduct.stock} units).`, 'warning');
      return;
    }
    try {
      setSellLoading(true);
      await axios.post('/api/dashboard/sale', {
        productId: sellProduct._id,
        quantity: Number(sellQuantity)
      });
      setShowSellModal(false);
      setSellProduct(null);
      await fetchProducts();
      window.dispatchEvent(new Event('notification-added'));
      addToast(`Sold ${sellQuantity} unit(s) of "${sellProduct.name}". Dashboard updated!`, 'success');
    } catch (err) {
      console.error('Sell product failed:', err);
      addToast('Error recording sale: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSellLoading(false);
    }
  };

  // Get unique categories list
  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Filtering Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase()) ||
      (product.tags && product.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));

    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    const matchesStock = selectedStockStatus === 'All' ||
      (selectedStockStatus === 'Low Stock' && product.stock < 10) ||
      (selectedStockStatus === 'In Stock' && product.stock >= 10) ||
      (selectedStockStatus === 'Out of Stock' && product.stock === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white transition-colors duration-200">
            Product Catalog
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your store inventory, categories, stock levels, and write SEO descriptions using Gemini AI.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-brand hover:bg-brand-light text-white transition-all active:scale-[0.98] shadow-lg shadow-brand/20 self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Product
        </button>
      </div>

      {/* Toolbar Filters Panel */}
      <div className="p-4 rounded-2xl glass-card flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tag, category..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass-input"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Selector */}
          <div className="flex items-center gap-2 bg-white/40 dark:bg-dark-900/30 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs w-full sm:w-auto">
            <Layers className="h-3.5 w-3.5 text-brand-light shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-300 font-semibold focus:outline-none cursor-pointer w-full"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center gap-2 bg-white/40 dark:bg-dark-900/30 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs w-full sm:w-auto">
            <Package className="h-3.5 w-3.5 text-brand-light shrink-0" />
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="bg-transparent text-gray-700 dark:text-gray-300 font-semibold focus:outline-none cursor-pointer w-full"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock (&ge; 10)</option>
              <option value="Low Stock">Low Stock (&lt; 10)</option>
              <option value="Out of Stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* View Toggles */}
          <div className="flex items-center gap-1 bg-white/30 dark:bg-dark-900/30 p-1 rounded-xl border border-gray-200 dark:border-gray-800 ml-auto md:ml-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-dark-750 text-brand shadow-sm'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-dark-750 text-brand shadow-sm'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Grid Content */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase animate-pulse">
            Loading Catalog...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-red-400">Database Connection Issue</h3>
          <p className="text-sm text-red-300 max-w-md mx-auto">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 rounded-2xl glass-card text-center flex flex-col items-center justify-center space-y-4 px-6 border border-dashed border-gray-300 dark:border-gray-800">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center border border-gray-200 dark:border-gray-850 text-gray-400 dark:text-gray-500">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No products found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mt-1">
              {search || selectedCategory !== 'All' || selectedStockStatus !== 'All'
                ? "Try adjusting your search filters or add a new custom product to inventory."
                : "Your inventory is currently empty. Create your first product below to start tracking catalog details."}
            </p>
          </div>
          {(!search && selectedCategory === 'All' && selectedStockStatus === 'All') && (
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand hover:bg-brand-light text-white flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Your First Product
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl glass-card overflow-hidden border border-gray-200 dark:border-gray-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-dark-900/60 border-b border-gray-200 dark:border-gray-850">
                <tr>
                  <th className="px-6 py-4 font-bold">Product Name</th>
                  <th className="px-6 py-4 font-bold">Category</th>
                  <th className="px-6 py-4 font-bold text-right">Price</th>
                  <th className="px-6 py-4 font-bold text-center">Stock Status</th>
                  <th className="px-6 py-4 font-bold">Tags</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-850/50">
                {filteredProducts.map((prod) => (
                  <tr key={prod._id} className="hover:bg-gray-100/30 dark:hover:bg-dark-700/10 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span 
                          onClick={() => setSelectedDetailProduct(prod)}
                          className="font-bold cursor-pointer hover:text-brand-light dark:hover:text-brand-light hover:underline transition-colors"
                        >
                          {prod.name}
                        </span>
                        {prod.description && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5 max-w-xs md:max-w-md">
                            {prod.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand/10 text-brand-light border border-brand/20 uppercase tracking-wider whitespace-nowrap">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                      ${prod.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        {prod.stock === 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping"></span>
                            Out of Stock (0)
                          </span>
                        ) : prod.stock < 10 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            Low Stock ({prod.stock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                            In Stock ({prod.stock})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[12rem] md:max-w-xs">
                        {prod.tags && prod.tags.length > 0 ? (
                          prod.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-800">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No tags</span>
                        )}
                        {prod.tags && prod.tags.length > 3 && (
                          <span className="text-[9px] text-gray-400 font-bold self-center">+{prod.tags.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openSellModal(prod)}
                          disabled={prod.stock === 0}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/15 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={prod.stock === 0 ? 'Out of Stock' : 'Sell Units'}
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-dark-750 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(prod._id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/15 text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <div key={prod._id} className="p-6 rounded-2xl glass-card flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-none hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 group">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-brand/10 text-brand-light border border-brand/20 uppercase tracking-wider shrink-0 mt-0.5 whitespace-nowrap">
                    {prod.category}
                  </span>
                  
                  {prod.stock === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25">
                      Out of Stock
                    </span>
                  ) : prod.stock < 10 ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Low Stock
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                      In Stock
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 
                    onClick={() => setSelectedDetailProduct(prod)}
                    className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 hover:text-brand-light dark:hover:text-brand-light cursor-pointer hover:underline transition-colors"
                  >
                    {prod.name}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-400 line-clamp-3 mt-1.5 h-12 leading-relaxed">
                    {prod.description || <span className="italic text-gray-400/60 dark:text-gray-500/60">No product description provided.</span>}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1 h-6 overflow-hidden">
                  {prod.tags && prod.tags.slice(0, 4).map((tag, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-800">
                      {tag}
                    </span>
                  ))}
                  {prod.tags && prod.tags.length > 4 && (
                    <span className="text-[9px] text-gray-400 font-bold self-center">+{prod.tags.length - 4}</span>
                  )}
                </div>
              </div>

              {/* Price & Actions Row */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">UnitPrice</span>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                    ${prod.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openSellModal(prod)}
                    disabled={prod.stock === 0}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={prod.stock === 0 ? 'Out of Stock' : 'Sell Units'}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(prod)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-800 dark:hover:bg-dark-750 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-200 dark:border-gray-800 transition-all active:scale-95"
                    title="Edit Product"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(prod._id)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-rose-500/10 dark:bg-dark-800 dark:hover:bg-rose-500/10 text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 border border-gray-200 dark:border-gray-800 hover:border-rose-200 dark:hover:border-rose-500/25 transition-all active:scale-95"
                    title="Delete Product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reusable Form Modal (Add / Edit) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-8 rounded-2xl glass-panel border border-gray-200 dark:border-gray-800 shadow-2xl relative space-y-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-light" />
                {modalMode === 'add' ? 'Add New Catalog Item' : 'Update Catalog Item'}
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Configure basic inventory details. Let Gemini generate descriptions and SEO tag lists instantly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Leather Jacket"
                    className="w-full px-3 py-2.5 rounded-xl text-sm glass-input font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Apparel"
                    className="w-full px-3 py-2.5 rounded-xl text-sm glass-input font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 149.99"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 rounded-xl text-sm glass-input font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Stock size</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="e.g. 20"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-xl text-sm glass-input font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">SEO description</label>
                  <button
                    type="button"
                    onClick={handleAiGeneration}
                    disabled={aiGenerating || !form.name || !form.category}
                    className="text-xs font-bold text-brand-light hover:text-white flex items-center gap-1 disabled:opacity-50 disabled:hover:text-brand-light transition-colors"
                  >
                    {aiGenerating ? (
                      <span className="h-3 w-3 border border-brand-light/30 border-t-brand-light rounded-full animate-spin"></span>
                    ) : (
                      <Sparkles className="h-3 w-3 animate-pulse" />
                    )}
                    Generate with AI
                  </button>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell a story or let Gemini generate it..."
                  rows="3"
                  className="w-full px-3 py-2.5 rounded-xl text-sm glass-input resize-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">SEO Search Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. leather, vintage, fashion"
                  className="w-full px-3 py-2.5 rounded-xl text-sm glass-input font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand hover:bg-brand-light text-white flex items-center gap-1.5 transition-all shadow-lg shadow-brand/10 disabled:opacity-50"
                >
                  {submitLoading ? (
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : modalMode === 'add' ? 'Add Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-panel border border-red-500/25 shadow-2xl relative space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-rose-950/30 border border-red-200 dark:border-rose-900/30 text-red-500 dark:text-rose-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Catalog Item?</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                This action is permanent and cannot be undone. Any related sales logs will lose referencing.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/15 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Slide-Over Drawer */}
      {selectedDetailProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSelectedDetailProduct(null)}
          ></div>

          {/* Drawer container */}
          <div className="fixed inset-y-0 right-0 max-w-md w-full flex pl-10">
            <div className="w-full bg-white dark:bg-black border-l border-gray-200 dark:border-white/20 shadow-2xl flex flex-col justify-between animate-slide-left overflow-y-auto">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-white/20 flex items-center justify-between bg-gray-50/50 dark:bg-black">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-brand-light dark:text-white" />
                  <span className="font-bold text-lg text-gray-900 dark:text-white">Product Summary</span>
                </div>
                <button
                  onClick={() => setSelectedDetailProduct(null)}
                  className="text-gray-400 hover:text-gray-700 dark:text-white/60 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 p-6 space-y-6">
                {/* Product Name */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40">Product Name</span>
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {selectedDetailProduct.name}
                  </h2>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200/55 dark:border-white/20">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 block mb-1">Category</span>
                    <div className="mt-1">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-brand/10 text-brand-light border border-brand/20 dark:bg-white dark:text-black dark:border-white uppercase tracking-wider whitespace-nowrap">
                        {selectedDetailProduct.category}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200/55 dark:border-white/20">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 block mb-1">Price</span>
                    <span className="text-base font-extrabold text-gray-900 dark:text-white block mt-1">
                      ${selectedDetailProduct.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Stock Level */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200/55 dark:border-white/20 col-span-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 block mb-2">Stock Level</span>
                    <div className="flex items-center gap-3">
                      {selectedDetailProduct.stock === 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/25 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping"></span>
                          Out of Stock
                        </span>
                      ) : selectedDetailProduct.stock < 10 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Low Stock ({selectedDetailProduct.stock} left)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                          In Stock ({selectedDetailProduct.stock} units)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 block">SEO Description</span>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-black border border-gray-200/40 dark:border-white/20 min-h-[6rem] max-h-48 overflow-y-auto">
                    <p className="text-sm text-gray-700 dark:text-white leading-relaxed font-medium">
                      {selectedDetailProduct.description || <span className="italic text-gray-400/50 dark:text-white/30">No description has been added for this product. Use the Edit modal to generate one with AI.</span>}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 block">Search & SEO Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDetailProduct.tags && selectedDetailProduct.tags.length > 0 ? (
                      selectedDetailProduct.tags.map((tag, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-black text-gray-600 dark:text-white rounded-lg border border-gray-200 dark:border-white/20 font-semibold">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-white/30 italic">No tags associated with this product</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200 dark:border-white/20 bg-gray-50/50 dark:bg-black flex gap-3">
                <button
                  onClick={() => {
                    openSellModal(selectedDetailProduct);
                    setSelectedDetailProduct(null);
                  }}
                  disabled={selectedDetailProduct.stock === 0}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {selectedDetailProduct.stock === 0 ? 'Out of Stock' : 'Sell Units'}
                </button>
                <button
                  onClick={() => {
                    openEditModal(selectedDetailProduct);
                    setSelectedDetailProduct(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-brand hover:bg-brand-light text-white flex items-center justify-center gap-1.5 shadow-lg shadow-brand/10 transition-colors dark:bg-white dark:hover:bg-white/90 dark:text-black dark:shadow-none"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    openDeleteModal(selectedDetailProduct._id);
                    setSelectedDetailProduct(null);
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10 transition-colors flex items-center justify-center gap-1.5 dark:bg-transparent dark:border dark:border-white/30 dark:hover:bg-white/10 dark:text-white dark:shadow-none"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Sell Product Modal */}
      {showSellModal && sellProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-panel border border-gray-200 dark:border-gray-800 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <ShoppingBag className="h-4.5 w-4.5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Sell Units</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px]">{sellProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSellModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSellProduct} className="p-6 space-y-5">
              {/* Stock info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Available Stock</span>
                <span className={`text-sm font-bold ${
                  sellProduct.stock < 10 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {sellProduct.stock} units
                </span>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Quantity to Sell
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSellQuantity(q => Math.max(1, q - 1))}
                    className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-white font-bold text-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors active:scale-95"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    max={sellProduct.stock}
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(Math.max(1, Math.min(sellProduct.stock, parseInt(e.target.value) || 1)))}
                    className="flex-1 h-10 text-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setSellQuantity(q => Math.min(sellProduct.stock, q + 1))}
                    className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-white font-bold text-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors active:scale-95"
                  >+</button>
                </div>
                {sellQuantity > sellProduct.stock && (
                  <p className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Exceeds available stock
                  </p>
                )}
              </div>

              {/* Revenue Preview */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Revenue Generated</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${(sellProduct.price * sellQuantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Unit Price</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">${sellProduct.price.toLocaleString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sellLoading || sellQuantity > sellProduct.stock || sellQuantity < 1}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {sellLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ShoppingBag className="h-4 w-4" />
                  )}
                  {sellLoading ? 'Recording...' : `Confirm Sale`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
