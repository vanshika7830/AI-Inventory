import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { RevenueLineChart, CategoryBarChart } from '../components/Charts';
import {
  Sparkles,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  ClipboardList,
  AlertCircle,
  Lightbulb,
  ArrowUpRight,
  Circle,
  X,
  Download,
  Percent,
  Layers,
  FileText,
  Trash2
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  
  // Dashboard stats state
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Onboarding welcome states
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showChecklistBanner, setShowChecklistBanner] = useState(false);
  const [checklist, setChecklist] = useState({
    addProduct: false,
    generateAI: false,
    recordSale: false
  });

  // Modal Open States
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showRecordSaleModal, setShowRecordSaleModal] = useState(false);

  // Modal Form States: Add Product
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    tags: ''
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [productLoading, setProductLoading] = useState(false);

  // Modal Form States: Record Sale
  const [saleForm, setSaleForm] = useState({
    productId: '',
    quantity: 1
  });
  const [productsList, setProductsList] = useState([]);
  const [saleLoading, setSaleLoading] = useState(false);

  // AI Suggestions/Insights State
  const [aiInsights, setAiInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Chart Filter States
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/dashboard/stats', {
        params: { month: selectedMonth, year: selectedYear }
      });
      setStats(res.data);
      
      const totalProducts = res.data.summary?.totalProducts || 0;
      const salesCount = res.data.summary?.salesCount || 0;
      const isNewUser = totalProducts === 0 && salesCount === 0;

      // Check checklist items
      const addProductDone = totalProducts > 0;
      const recordSaleDone = salesCount > 0;
      const hasAiDescription = res.data.topProducts?.some(p => p.description && p.description.length > 0) || false;
      const generateAIDone = localStorage.getItem('onboarding_ai_generated') === 'true' || hasAiDescription;

      setChecklist({
        addProduct: addProductDone,
        generateAI: generateAIDone,
        recordSale: recordSaleDone
      });

      // Welcome Modal condition
      const dismissedModal = localStorage.getItem('onboarding_welcome_dismissed') === 'true';
      if (isNewUser && !dismissedModal) {
        setShowWelcomeModal(true);
      }

      // Checklist banner condition
      const dismissedBanner = localStorage.getItem('onboarding_checklist_dismissed') === 'true';
      const allDone = addProductDone && generateAIDone && recordSaleDone;
      if (!allDone && !dismissedBanner) {
        setShowChecklistBanner(true);
      } else {
        setShowChecklistBanner(false);
      }

      setError(null);
    } catch (err) {
      console.error('Fetch stats failed:', err);
      setError('Could not retrieve dashboard statistics. Ensure your database is connected and server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all products (for Record Sale dropdown selection)
  const fetchProductsList = async () => {
    try {
      const res = await axios.get('/api/products');
      setProductsList(res.data);
      if (res.data.length > 0) {
        setSaleForm(prev => ({ ...prev, productId: res.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching product list for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  // Watch modal opens to load dropdown data
  useEffect(() => {
    if (showRecordSaleModal) {
      fetchProductsList();
    }
  }, [showRecordSaleModal]);

  const handleGetStarted = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('onboarding_welcome_dismissed', 'true');
    setShowChecklistBanner(true);
  };

  const handleDismissChecklist = () => {
    setShowChecklistBanner(false);
    localStorage.setItem('onboarding_checklist_dismissed', 'true');
  };

  // Trigger Gemini AI Description & Tag autofill
  const handleAiGeneration = async () => {
    const { name, category } = productForm;
    if (!name || !category) {
      addToast("Please provide at least a Product Name and Category before generating with AI.", "warning");
      return;
    }

    try {
      setAiGenerating(true);

      // Generate Description
      const descRes = await axios.post('/api/ai/generate-description', { name, category });
      // Generate Tags
      const tagsRes = await axios.post('/api/ai/generate-tags', { name, category });

      const generatedDesc = descRes.data.description;
      const generatedTags = Array.isArray(tagsRes.data.tags) 
        ? tagsRes.data.tags.join(', ') 
        : tagsRes.data.tags;

      setProductForm(prev => ({
        ...prev,
        description: generatedDesc,
        tags: generatedTags
      }));

      // Store onboarding tag in localStorage
      localStorage.setItem('onboarding_ai_generated', 'true');
      setChecklist(prev => ({ ...prev, generateAI: true }));
      addToast("AI description and search tags generated!", "success");

    } catch (err) {
      console.error('AI autofill failed:', err);
      addToast('AI generation failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  // Save Product Submit
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const { name, category, price, stock, description, tags } = productForm;

    if (!name || !category || price === '' || stock === '') {
      addToast("Please enter Name, Category, Price, and Stock.", "warning");
      return;
    }

    try {
      setProductLoading(true);
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

      await axios.post('/api/products', {
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        description,
        tags: tagsArray
      });

      // Reset form & close
      setProductForm({
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        tags: ''
      });
      setShowAddProductModal(false);
      
      // Refresh stats
      await fetchStats();
      window.dispatchEvent(new Event('notification-added'));
      addToast(`Product "${name}" successfully added to inventory.`, "success");
    } catch (err) {
      console.error('Save product failed:', err);
      addToast('Error creating product: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setProductLoading(false);
    }
  };

  // Save Sale Submit
  const handleSaveSale = async (e) => {
    e.preventDefault();
    const { productId, quantity } = saleForm;

    if (!productId || !quantity || quantity < 1) {
      addToast("Please select a product and enter quantity.", "warning");
      return;
    }

    try {
      setSaleLoading(true);
      await axios.post('/api/dashboard/sale', {
        productId,
        quantity: Number(quantity)
      });

      setShowRecordSaleModal(false);
      setSaleForm({ productId: '', quantity: 1 });
      
      // Refresh stats
      await fetchStats();
      window.dispatchEvent(new Event('notification-added'));
      addToast("Sale logged and stock level updated.", "success");
    } catch (err) {
      console.error('Save sale failed:', err);
      addToast('Error recording sale: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaleLoading(false);
    }
  };

  // Delete a Sale
  const handleDeleteSale = async (saleId) => {
    if (!window.confirm("Are you sure you want to undo this sale? The product stock will be restored.")) {
      return;
    }
    try {
      setLoading(true);
      await axios.delete(`/api/dashboard/sale/${saleId}`);
      await fetchStats();
      addToast("Sale record deleted and stock restored.", "success");
    } catch (err) {
      console.error('Delete sale failed:', err);
      addToast('Error deleting sale: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Gemini Strategic suggestions
  const handleGenerateInsights = async () => {
    if (!stats || isDbEmpty) {
      addToast("Cannot generate AI Suggestions without product data. Please add a product first!", "warning");
      return;
    }

    try {
      setInsightsLoading(true);
      const res = await axios.post('/api/ai/suggestions', {
        summary: stats.summary,
        topProducts: stats.topProducts
      });
      
      setAiInsights(res.data.suggestions);
      window.dispatchEvent(new Event('notification-added'));
      addToast("Gemini AI retail suggestions generated successfully!", "success");
    } catch (err) {
      console.error('Suggestions generation failed:', err);
      addToast('Error generating suggestions: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Export CSV Report
  const handleExportReport = () => {
    if (!stats) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "--- SMARTSTORE AI STORE REPORT ---\n\n";
    csvContent += "METRIC,VALUE\n";
    csvContent += `Total Revenue,$${stats.summary.totalRevenue}\n`;
    csvContent += `Total Items Sold,${stats.summary.totalItemsSold}\n`;
    csvContent += `Total Products,${stats.summary.totalProducts}\n`;
    csvContent += `Low Stock Alerts,${stats.summary.lowStockCount}\n\n`;
    
    csvContent += "TOP PRODUCTS REPORT\n";
    csvContent += "Product Name,Category,Quantity Sold,Revenue Generated,Unit Price\n";
    stats.topProducts.forEach(p => {
      csvContent += `"${p.name}",${p.category},${p.totalQuantity},$${p.totalRevenue},$${p.price}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `smartstore_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("CSV Report downloaded.", "success");
  };

  const isDbEmpty = !stats || !stats.summary || stats.summary.totalProducts === 0;
  const isSalesEmpty = !stats || !stats.summary || stats.summary.salesCount === 0;

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 3) * 100);

  // Calculate live sale totals
  const selectedProduct = productsList.find(p => p._id === saleForm.productId);
  const liveRevenue = selectedProduct ? (selectedProduct.price * saleForm.quantity) : 0;

  // Generate last 12 months for dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: d.toLocaleDateString('default', { month: 'short', year: 'numeric' })
    };
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* Onboarding Checklist Banner */}
      {showChecklistBanner && (
        <div className="rounded-2xl border-2 border-indigo-100 dark:border-brand/40 bg-indigo-50/70 dark:bg-dark-850 p-6 shadow-sm relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 p-4">
            <button 
              onClick={handleDismissChecklist}
              className="text-indigo-900/60 hover:text-indigo-900 dark:text-gray-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-indigo-100/60 dark:hover:bg-gray-700/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-indigo-950 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-brand-light" />
                Complete Onboarding Checklist ({completedCount}/3)
              </h3>
              <p className="text-sm text-indigo-900/70 dark:text-gray-300 max-w-xl leading-relaxed">
                Set up your workspace by completing these basic steps to activate full AI analytics and reporting.
              </p>
              
              <div className="flex items-center gap-3 pt-1">
                <div className="w-48 bg-indigo-100 dark:bg-dark-900 h-2 rounded-full overflow-hidden border border-indigo-200/40 dark:border-gray-800">
                  <div 
                    className="bg-indigo-600 dark:bg-brand h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <span className="text-xs text-indigo-600 dark:text-brand-light font-extrabold">{progressPercent}% Done</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 md:gap-8 items-center bg-white dark:bg-dark-900/80 p-4 rounded-xl border border-indigo-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2.5">
                {checklist.addProduct ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-indigo-600 dark:text-brand-light shrink-0" />
                )}
                <span className={`text-sm ${checklist.addProduct ? 'text-indigo-900/40 dark:text-gray-500 line-through font-medium' : 'text-indigo-950 dark:text-gray-200 font-bold'}`}>
                  1. Add first product
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {checklist.generateAI ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-indigo-600 dark:text-brand-light shrink-0" />
                )}
                <span className={`text-sm ${checklist.generateAI ? 'text-indigo-900/40 dark:text-gray-500 line-through font-medium' : 'text-indigo-950 dark:text-gray-200 font-bold'}`}>
                  2. Generate AI description
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {checklist.recordSale ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-indigo-600 dark:text-brand-light shrink-0" />
                )}
                <span className={`text-sm ${checklist.recordSale ? 'text-indigo-900/40 dark:text-gray-500 line-through font-medium' : 'text-indigo-950 dark:text-gray-200 font-bold'}`}>
                  3. Record a sale
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Bar (Primary Header Row) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white transition-colors duration-200">
            Welcome back, {user?.name || 'Store Owner'} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors duration-200">
            Analyze your store performance and use Gemini AI insights.
          </p>
        </div>
        
        {/* Quick Action Bar Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowAddProductModal(true)} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand hover:bg-brand-light text-white transition-all active:scale-[0.98] shadow-lg shadow-brand/20"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
          <button 
            onClick={() => setShowRecordSaleModal(true)} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-gray-100 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-800 transition-all active:scale-[0.98]"
          >
            <DollarSign className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Record Sale
          </button>
          <button 
            onClick={handleGenerateInsights} 
            disabled={insightsLoading || isDbEmpty}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand/5 hover:bg-brand/10 dark:bg-dark-750 dark:hover:bg-dark-700 text-brand dark:text-brand-light border border-brand/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {insightsLoading ? (
              <span className="h-4 w-4 border-2 border-brand/35 border-t-brand rounded-full animate-spin"></span>
            ) : (
              <Sparkles className="h-4 w-4 text-brand dark:text-brand-light" />
            )}
            Generate AI Insights
          </button>
          <button 
            onClick={handleExportReport} 
            disabled={!stats}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-gray-100 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-12 w-12 text-gray-900 dark:text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors">Total Revenue</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2 transition-colors">
            {isSalesEmpty ? '—' : `$${stats.summary.totalRevenue.toLocaleString()}`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">All transactions logged</p>
        </div>

        <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShoppingBag className="h-12 w-12 text-gray-900 dark:text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors">Active Products</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2 transition-colors">
            {isDbEmpty ? '—' : stats.summary.totalProducts}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">Stored items in catalog</p>
        </div>

        <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="h-12 w-12 text-gray-900 dark:text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors">Items Sold</p>
          <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2 transition-colors">
            {isSalesEmpty ? '—' : stats.summary.totalItemsSold}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">Units shipped to customers</p>
        </div>

        <div className="p-6 rounded-2xl glass-card relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="h-12 w-12 text-gray-900 dark:text-white" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors">Low Stock Items</p>
          <h3 className={`text-3xl font-extrabold mt-2 transition-colors ${!isDbEmpty && stats.summary.lowStockCount > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {isDbEmpty ? '—' : stats.summary.lowStockCount}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">Inventory warnings</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-white transition-colors">Revenue Over Time</h3>
            <select
              value={`${selectedMonth}-${selectedYear}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split('-');
                setSelectedMonth(parseInt(m));
                setSelectedYear(parseInt(y));
              }}
              className="text-xs font-semibold bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-brand/50 transition-colors cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <RevenueLineChart data={stats?.monthlySales} isEmpty={isSalesEmpty} />
        </div>

        <div className="p-6 rounded-2xl glass-card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-white transition-colors">Top Performing Products</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">By Sales Quantity</span>
          </div>
          <CategoryBarChart data={stats?.topProducts} isEmpty={isDbEmpty || isSalesEmpty} />
        </div>
      </div>

      {/* Recent Orders and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-brand-light" />
              Recent Order Transactions
            </h3>

            {isSalesEmpty || !stats.recentSales || stats.recentSales.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-dark-800 border border-gray-800 flex items-center justify-center text-gray-500">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No orders yet</h4>
                  <p className="text-xs text-gray-400 max-w-xs mt-1">
                    Log manual store sales to populate your live transaction stream.
                  </p>
                </div>
                <button
                  onClick={() => setShowRecordSaleModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-700 hover:bg-dark-600 border border-gray-800 text-white flex items-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <Plus className="h-3.5 w-3.5" /> Record First Sale
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase border-b border-gray-800">
                    <tr>
                      <th className="py-3 font-semibold">Product</th>
                      <th className="py-3 font-semibold">Quantity</th>
                      <th className="py-3 font-semibold">Revenue</th>
                      <th className="py-3 font-semibold">Date</th>
                      <th className="py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {stats.recentSales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-dark-700/10 group">
                        <td className="py-3.5 font-medium text-white">
                          {sale.product?.name || 'Deleted Product'}
                        </td>
                        <td className="py-3.5">{sale.quantity}</td>
                        <td className="py-3.5 text-emerald-400 font-semibold">
                          ${sale.revenue.toLocaleString()}
                        </td>
                        <td className="py-3.5 text-gray-500">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleDeleteSale(sale._id)}
                            className="p-1.5 rounded-lg text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all focus:opacity-100"
                            title="Undo Sale & Restore Stock"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-8 flex flex-col justify-between">
          
          {/* Low Stock Alerts Panel */}
          <div className="p-6 rounded-2xl glass-card space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-brand-light" />
              Inventory Alert Panel
            </h3>

            {isDbEmpty || stats.summary.lowStockCount === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">All good!</h4>
                  <p className="text-xs text-emerald-400/80 mt-1">No products are currently low on inventory stock (stock &lt; 10).</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-300">Low Stock Warning</h4>
                  <p className="text-xs text-red-400/80 mt-1">
                    You have {stats.summary.lowStockCount} product(s) falling below 10 units. Restock soon to prevent order delays.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI Strategy Suggestions Panel */}
          <div className="p-6 rounded-2xl glass-card space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-brand-light" />
                AI Strategy Suggestions
              </h3>

              {isDbEmpty ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <Lightbulb className="h-8 w-8 text-gray-600" />
                  <p className="text-xs text-gray-400 max-w-xs">
                    Add products first to get automated retail suggestions and pricing strategy from Gemini.
                  </p>
                </div>
              ) : aiInsights ? (
                // Output Gemini Insights
                <div className="mt-3 text-xs text-gray-300 leading-relaxed max-h-[12rem] overflow-y-auto space-y-3 border-l-2 border-brand/50 pl-3.5 pr-1">
                  {aiInsights.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-400 leading-relaxed">
                  <p>Click the "Generate AI Insights" button in the action bar above to receive analytics-based strategies.</p>
                </div>
              )}
            </div>
            
            {isDbEmpty && (
              <button
                onClick={() => setShowAddProductModal(true)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-light text-white transition-all active:scale-[0.98] flex items-center justify-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Your First Product
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-8 rounded-2xl glass-panel border border-gray-800 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowAddProductModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-light" />
                Add New Product
              </h2>
              <p className="text-xs text-gray-400 mt-1">Specify catalog item details. Description & tags can be generated by AI.</p>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Leather Jacket"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="e.g. Apparel"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 150"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="e.g. 20"
                    min="0"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase text-gray-400">Description</label>
                  <button
                    type="button"
                    onClick={handleAiGeneration}
                    disabled={aiGenerating || !productForm.name || !productForm.category}
                    className="text-xs font-bold text-brand-light hover:text-white flex items-center gap-1 disabled:opacity-50 disabled:hover:text-brand-light"
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
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Compelling product write-up..."
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg text-sm glass-input resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  placeholder="e.g. style, premium, winter"
                  className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-700 hover:bg-dark-600 text-gray-400 border border-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-light text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {productLoading ? (
                    <span className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Sale Modal */}
      {showRecordSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md">
          <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-gray-800 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowRecordSaleModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                Record Customer Sale
              </h2>
              <p className="text-xs text-gray-400 mt-1">Deducts inventory stock and registers transaction revenue.</p>
            </div>

            {productsList.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
                <p className="text-xs text-gray-400">No active products found in your database catalog. Please add a product first!</p>
                <button
                  onClick={() => {
                    setShowRecordSaleModal(false);
                    setShowAddProductModal(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-light text-white"
                >
                  Create Product
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveSale} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Select Product</label>
                  <select
                    value={saleForm.productId}
                    onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm glass-input cursor-pointer"
                    required
                  >
                    {productsList.map((prod) => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name} (Stock: {prod.stock} left) — ${prod.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: Math.max(1, Number(e.target.value)) })}
                    min="1"
                    className="w-full px-3 py-2 rounded-lg text-sm glass-input"
                    required
                  />
                </div>

                {/* Real-time price breakdown */}
                <div className="p-4 rounded-xl bg-dark-900 border border-gray-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-400">Estimated Revenue</span>
                  <span className="text-base font-bold text-emerald-400">${liveRevenue.toLocaleString()}</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecordSaleModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-dark-700 hover:bg-dark-600 text-gray-400 border border-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saleLoading}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand hover:bg-brand-light text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {saleLoading ? (
                      <span className="h-3 w-3 border border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : 'Save Transaction'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Welcome Onboarding Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-8 rounded-2xl glass-panel border border-brand/40 shadow-2xl relative space-y-6 text-center">
            
            <div className="inline-flex items-center justify-center p-4 bg-brand/20 border border-brand/30 rounded-full text-brand-light">
              <Sparkles className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white">
                Welcome to SmartStore AI 👋
              </h2>
              <p className="text-gray-400 text-sm">
                Let's set up your premium admin store in just 3 quick steps
              </p>
            </div>

            <div className="text-left bg-dark-900/50 rounded-xl border border-gray-800 p-5 space-y-4">
              <div className="flex gap-4">
                <div className="h-7 w-7 shrink-0 rounded-full bg-brand-light/20 flex items-center justify-center font-bold text-xs text-brand-light border border-brand-light/30">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Add Your First Product</h4>
                  <p className="text-xs text-gray-400">Specify details, prices, and configure stock sizes.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-7 w-7 shrink-0 rounded-full bg-brand-light/20 flex items-center justify-center font-bold text-xs text-brand-light border border-brand-light/30">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Generate description with AI</h4>
                  <p className="text-xs text-gray-400">Use built-in Gemini copywriter tools to generate SEO copy & search tags.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-7 w-7 shrink-0 rounded-full bg-brand-light/20 flex items-center justify-center font-bold text-xs text-brand-light border border-brand-light/30">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Log Your First Sale</h4>
                  <p className="text-xs text-gray-400">Record a sale transaction to plot line and bar charts instantly.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGetStarted}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand to-brand-light hover:brightness-110 hover:shadow-lg hover:shadow-brand/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
