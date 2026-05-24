import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Coffee, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  CheckCircle2,
  Search,
  LayoutGrid,
  History,
  Wallet,
  ArrowLeft,
  Printer,
  X,
  Loader2,
  ChevronRight,
  Pizza,
  Utensils,
  Cookie,
  QrCode
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_URL = 'http://localhost:5000/api';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  
  // Workflow States: 'input' | 'customer_name' | 'payment' | 'verify_payment' | 'processing' | 'success'
  const [checkoutStep, setCheckoutStep] = useState('input');
  const [orderNumber, setOrderNumber] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = category === 'All' || p.category === category;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    if (checkoutStep !== 'input') return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    if (checkoutStep !== 'input') return;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => {
    if (checkoutStep !== 'input') return;
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  useEffect(() => {
    // Keyboard Shortcuts
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') resetOrder();
      if (e.key === 'Enter' && checkoutStep === 'payment') handleProcessPayment();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkoutStep, paymentMethod, total]);

  const handleConfirmOrder = () => {
    if (paymentMethod === 'Cash') {
      handleProcessPayment();
    } else {
      setCheckoutStep('verify_payment');
    }
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setCheckoutStep('processing');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      await axios.post(`${API_URL}/orders`, {
        subtotal,
        tax: 0,
        total,
        payment_method: paymentMethod,
        items: cart,
        customer_name: customerName || 'Guest'
      });
      
      setOrderNumber(Math.floor(Math.random() * 900) + 100);
      setCheckoutStep('success');
      fetchHistory(); // Refresh history after successful order
    } catch (error) {
      console.error('Order failed:', error);
      alert('Payment failed. Please try again.');
      setCheckoutStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    const printWindow = window.open('', '_blank');
    const receiptContent = `
      <html>
        <head>
          <title>Order #${orderNumber}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; text-align: center; }
            .header { font-weight: bold; font-size: 1.2em; margin-bottom: 10px; }
            .items { text-align: left; margin: 20px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 1.1em; display: flex; justify-content: space-between; }
            .footer { font-size: 0.8em; margin-top: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">CAFÉSTONE</div>
          <div>Order #${orderNumber}</div>
          <div style="font-weight: bold; margin-top: 5px;">Customer: ${customerName || 'Guest'}</div>
          <div>${new Date().toLocaleString()}</div>
          <div class="items">
            ${cart.map(item => `
              <div class="item">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          <div style="margin-top: 10px; text-align: left; font-size: 0.9em;">
            Payment: ${paymentMethod}
          </div>
          <div class="footer">Thank you for your order!</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  const resetOrder = () => {
    setCart([]);
    setCheckoutStep('input');
    setOrderNumber(null);
    setCustomerName('');
    setIsCartOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-stone-50 text-stone-900 overflow-hidden font-sans">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-600 rounded-lg text-white">
            <Coffee size={18} />
          </div>
          <span className="font-bold text-sm tracking-tight">Coffee Shop POS</span>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 bg-stone-100 rounded-lg text-stone-600 active:scale-95 transition-transform"
        >
          <ShoppingCart size={20} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* LEFT: Menu Categories (Desktop) */}
      <aside className="hidden md:flex w-20 bg-white border-r border-stone-200 flex-col items-center py-8 gap-8 shrink-0">
        <div className="p-3 bg-amber-600 rounded-2xl text-white shadow-lg shadow-amber-200">
          <Coffee size={28} />
        </div>
        <nav className="flex flex-col gap-6">
          <button 
            onClick={() => {
              setCategory('All');
              setShowHistory(false);
            }}
            className={cn(
              "p-3 rounded-2xl transition-all relative group",
              (category === 'All' && !showHistory) ? "bg-amber-50 text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <LayoutGrid size={22} />
          </button>
          
          <button 
            onClick={() => {
              setCategory('Coffee');
              setShowHistory(false);
            }}
            className={cn(
              "p-3 rounded-2xl transition-all relative group",
              (category === 'Coffee' && !showHistory) ? "bg-amber-50 text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <Coffee size={22} />
          </button>

          <button 
            onClick={() => {
              setCategory('Pastry');
              setShowHistory(false);
            }}
            className={cn(
              "p-3 rounded-2xl transition-all relative group",
              (category === 'Pastry' && !showHistory) ? "bg-amber-50 text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <Cookie size={22} />
          </button>

          <button 
            onClick={() => {
              setCategory('Pasta');
              setShowHistory(false);
            }}
            className={cn(
              "p-3 rounded-2xl transition-all relative group",
              (category === 'Pasta' && !showHistory) ? "bg-amber-50 text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <Pizza size={22} />
          </button>

          <button 
            onClick={() => {
              setCategory('Rice Meal');
              setShowHistory(false);
            }}
            className={cn(
              "p-3 rounded-2xl transition-all relative group",
              (category === 'Rice Meal' && !showHistory) ? "bg-amber-50 text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <Utensils size={22} />
          </button>

          <button 
            onClick={() => {
              setShowHistory(true);
              fetchHistory();
            }}
            className={cn(
              "p-3 rounded-2xl transition-all relative group",
              showHistory ? "bg-amber-50 text-amber-600 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            <History size={22} />
          </button>
        </nav>
      </aside>

      {/* Mobile Categories (Scrollable) */}
      <nav className="md:hidden bg-white border-b border-stone-100 flex gap-2 p-3 overflow-x-auto scrollbar-hide shrink-0">
        {[
          { id: 'All', icon: <LayoutGrid size={16} /> },
          { id: 'Coffee', icon: <Coffee size={16} /> },
          { id: 'Pastry', icon: <Cookie size={16} /> },
          { id: 'Pasta', icon: <Pizza size={16} /> },
          { id: 'Rice Meal', icon: <Utensils size={16} /> }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
              category === cat.id ? "bg-amber-600 border-amber-600 text-white shadow-md" : "bg-stone-50 border-stone-100 text-stone-500"
            )}
          >
            {cat.icon}
            {cat.id}
          </button>
        ))}
      </nav>

      {/* CENTER: Product Grid */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-20 bg-white border-b border-stone-200 items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {showHistory ? 'Order History' : 'Caféstone Dashboard'}
            </h1>
            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="Search menu..." 
              className="w-full pl-10 pr-4 py-2 bg-stone-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Mobile Search */}
        <div className="md:hidden p-3 bg-stone-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Search menu..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-50/50">
          {showHistory ? (
            <div className="space-y-6 max-w-6xl mx-auto w-full">
              {/* Total Sales Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-amber-600 p-6 rounded-3xl text-white shadow-xl shadow-amber-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total Sales</p>
                  <h2 className="text-3xl font-black tracking-tighter">
                    ${history.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                  </h2>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Orders</p>
                  <h2 className="text-3xl font-black tracking-tighter text-stone-900">{history.length}</h2>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Average Order</p>
                  <h2 className="text-3xl font-black tracking-tighter text-stone-900">
                    ${history.length > 0 ? (history.reduce((sum, o) => sum + o.total, 0) / history.length).toFixed(2) : '0.00'}
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest px-2">Recent Transactions</h3>
                {history.length === 0 ? (
                  <div className="text-center py-20 opacity-30 bg-white rounded-3xl border border-dashed border-stone-200">
                    <History size={48} className="mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">No orders found</p>
                  </div>
                ) : (
                  history.map(order => (
                    <div key={order.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-amber-200 transition-all flex items-center justify-between gap-6 group animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-black text-lg group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors shrink-0">
                          #{order.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                              {order.customer_name || 'Guest'}
                            </span>
                            <span className="w-1 h-1 bg-stone-200 rounded-full"></span>
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                              {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="w-1 h-1 bg-stone-200 rounded-full"></span>
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                              {new Date(order.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-stone-700 truncate italic opacity-80">
                            {order.items_summary}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-black text-stone-900 tracking-tight">${order.total.toFixed(2)}</p>
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mt-1",
                            order.payment_method === 'Cash' ? "bg-green-50 text-green-600" : 
                            order.payment_method === 'GCash' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                          )}>
                            {order.payment_method}
                          </span>
                        </div>
                        <ChevronRight size={18} className="text-stone-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20 md:pb-0">
              {filteredProducts.map(product => (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={checkoutStep !== 'input'}
                  className="bg-white p-2.5 md:p-3 rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-xl hover:shadow-stone-200/40 transition-all text-left group flex flex-col active:scale-95"
                >
                  <div className="aspect-square bg-stone-100 rounded-xl mb-2.5 md:mb-3 overflow-hidden relative">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-amber-800 shadow-sm border border-white/50">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <h3 className="font-bold text-stone-800 text-xs md:text-sm line-clamp-1">{product.name}</h3>
                  <p className="text-[9px] md:text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5 md:mt-1">{product.category}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Floating Cart Button */}
        {checkoutStep === 'input' && cart.length > 0 && (
          <div className="md:hidden fixed bottom-4 right-4 left-4 z-20">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-stone-900 text-white flex items-center justify-between px-6 py-4 rounded-2xl shadow-2xl active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ShoppingCart size={18} />
                </div>
                <span className="font-bold text-sm">{cart.length} Items</span>
              </div>
              <span className="font-black text-lg">${total.toFixed(2)}</span>
            </button>
          </div>
        )}
      </main>

      {/* RIGHT: Order Summary (Drawer on Mobile, Sidebar on Desktop) */}
      {(!showHistory || isCartOpen) && (
        <aside className={cn(
          "fixed inset-0 z-40 md:relative md:z-0 md:inset-auto md:w-[380px] bg-white md:border-l border-stone-200 flex flex-col transition-transform duration-300 ease-in-out shrink-0",
          (isCartOpen || (checkoutStep !== 'input' && checkoutStep !== 'success')) ? "translate-x-0" : "translate-x-full md:translate-x-0",
          showHistory && "hidden md:hidden" // Completely hide sidebar on desktop history view
        )}>
        {/* Overlay for Mobile */}
        <div 
          className={cn("absolute inset-0 bg-stone-900/40 md:hidden", isCartOpen ? "block" : "hidden")}
          onClick={() => setIsCartOpen(false)}
        />
        
        {/* Cart Content Container */}
        <div className="relative h-full bg-white flex flex-col shadow-2xl">
          <div className="p-5 md:p-6 border-b border-stone-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <ShoppingCart size={20} />
              </div>
              <h2 className="font-bold text-lg">
                {checkoutStep === 'input' ? 'Current Order' : 
                 checkoutStep === 'customer_name' ? 'Customer Info' :
                 checkoutStep === 'payment' ? 'Payment' : 
                 checkoutStep === 'processing' ? 'Processing...' : 'Complete'}
              </h2>
            </div>
            <button 
              onClick={() => checkoutStep === 'input' ? setIsCartOpen(false) : resetOrder()}
              className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          {cart.length > 0 && checkoutStep === 'input' && (
            <div className="px-6 py-2 border-b border-stone-50 flex justify-center shrink-0">
              <button onClick={() => setCart([])} className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors uppercase tracking-widest border border-red-100/50">
                Clear All Items
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {checkoutStep === 'input' && (
            <>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-stone-400 space-y-4">
                  <ShoppingCart size={48} strokeWidth={1.5} />
                  <p className="font-medium text-sm">Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="w-14 h-14 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-100">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-stone-800 truncate">{item.name}</h4>
                      <p className="text-amber-600 text-xs font-bold mt-0.5">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-stone-50 rounded-lg p-1 border border-stone-100">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded text-stone-500 hover:text-amber-600 transition-all"><Minus size={14} /></button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded text-stone-500 hover:text-amber-600 transition-all"><Plus size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {checkoutStep === 'customer_name' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setCheckoutStep('input')} className="flex items-center gap-2 text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-wider">
                <ArrowLeft size={14} /> Back to Order
              </button>
              
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">Customer Details</h3>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Who are we serving today?</p>
                </div>
                
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Customer Name</label>
                   <input 
                     type="text"
                    autoFocus
                    placeholder="Enter customer name..."
                    className="w-full px-4 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/5 transition-all outline-none"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setCheckoutStep('payment');
                    }}
                  />
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                  <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    Customer name will be printed on the receipt and stored in order history for easier tracking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'payment' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <button onClick={() => setCheckoutStep('input')} className="flex items-center gap-2 text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-wider">
                <ArrowLeft size={14} /> Back to Menu
              </button>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'Cash', label: 'Cash', icon: <Banknote size={24} /> },
                  { id: 'GCash', label: 'GCash', icon: <Wallet size={24} />, details: '0912-345-6789' },
                  { id: 'Bank Transfer', label: 'Bank Transfer', icon: <CreditCard size={24} />, details: 'BDO: 1234-5678-90' }
                ].map(method => (
                  <div key={method.id} className="space-y-2">
                    <button 
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                        paymentMethod === method.id ? "border-amber-600 bg-amber-50/50 text-amber-700 shadow-sm" : "border-stone-100 hover:border-stone-200 text-stone-600"
                      )}
                    >
                      {method.icon}
                      <span className="font-bold text-sm">{method.label}</span>
                    </button>
                    
                    {paymentMethod === method.id && method.details && (
                      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-32 h-32 bg-white border border-stone-200 rounded-lg flex items-center justify-center">
                            <QrCode size={100} className="text-stone-800" />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Payment Details</p>
                            <p className="text-sm font-black text-stone-800">{method.details}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {checkoutStep === 'verify_payment' && (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setCheckoutStep('payment')} className="flex items-center gap-2 text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-wider mb-6">
                <ArrowLeft size={14} /> Back to Methods
              </button>
              
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">Scan to Pay</h3>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Complete payment via {paymentMethod}</p>
                </div>

                <div className="p-8 bg-white border-2 border-amber-600 rounded-3xl shadow-2xl shadow-amber-100/50 relative group">
                  <div className="w-48 h-48 flex items-center justify-center">
                    <QrCode size={180} className="text-stone-900" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    Official QR
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 w-full max-w-[280px] text-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Account Details</p>
                  <p className="text-base font-black text-stone-800 tracking-tight">
                    {paymentMethod === 'GCash' ? '0912-345-6789' : 'BDO: 1234-5678-90'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-amber-600 animate-pulse">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Waiting for transfer...</span>
                </div>
              </div>
            </div>
          )}

          {checkoutStep === 'processing' && (
            <div className="h-full flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-95 duration-300">
              <Loader2 size={48} className="text-amber-600 animate-spin" />
              <div>
                <h3 className="font-bold text-stone-800">Processing Payment</h3>
                <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-bold">Connecting to terminal...</p>
              </div>
            </div>
          )}

          {checkoutStep === 'success' && (
            <div className="h-full flex flex-col animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center gap-4 mb-8 text-center pt-8">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center border-4 border-green-100">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-800">Payment Successful</h3>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Order # {orderNumber}</p>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 mb-6">
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-xs text-stone-500 font-medium">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                    <span>Total Paid</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <button onClick={printReceipt} className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-stone-200 rounded-2xl font-bold text-sm text-stone-600 hover:bg-stone-50 transition-all active:scale-95">
                  <Printer size={18} /> Print Receipt
                </button>
                <button onClick={resetOrder} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-xl shadow-stone-200 active:scale-95">
                  New Order
                </button>
              </div>
            </div>
          )}
        </div>

        {checkoutStep !== 'success' && checkoutStep !== 'processing' && (
          <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end pt-2">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-500 pb-1">Total Amount</span>
                <span className="text-3xl font-black text-stone-900 tracking-tighter">${total.toFixed(2)}</span>
              </div>
            </div>

            {checkoutStep === 'input' ? (
              <button 
                disabled={cart.length === 0}
                onClick={() => setCategory('All')} // This is just a placeholder, the actual logic is in the button click
                className="hidden" // Hiding the old button to replace it with the new logic
              ></button>
            ) : null}

            {checkoutStep === 'input' && (
              <button 
                disabled={cart.length === 0}
                onClick={() => setCheckoutStep('customer_name')}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 group",
                  cart.length === 0 ? "bg-stone-200 text-stone-400 cursor-not-allowed" : "bg-stone-900 text-white hover:bg-black shadow-xl shadow-stone-200 active:scale-95"
                )}
              >
                Proceed to Payment
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {checkoutStep === 'customer_name' && (
              <button 
                onClick={() => setCheckoutStep('payment')}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-sm hover:bg-black shadow-xl shadow-stone-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Continue to Payment
                <ChevronRight size={18} />
              </button>
            )}

            {checkoutStep === 'payment' && (
              <button 
                onClick={handleConfirmOrder}
                className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-sm hover:bg-amber-700 shadow-xl shadow-amber-100 transition-all active:scale-95"
              >
                Confirm & Pay ${total.toFixed(2)}
              </button>
            )}

            {checkoutStep === 'verify_payment' && (
              <button 
                onClick={handleProcessPayment}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-sm hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95"
              >
                Payment Received & Complete
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
    )}
    </div>
  );
}

export default App;
