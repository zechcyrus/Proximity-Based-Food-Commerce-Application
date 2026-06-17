
import React, { useState, useEffect } from 'react';
import { UserRole, FoodItem, Order, OrderStatus, CartItem, Review, Payment } from './types';
import SplashScreen from './components/SplashScreen';
import AuthScreen from './components/AuthScreen';
import BuyerHome from './components/BuyerHome';
import ProviderHome from './components/ProviderHome';
import ItemDetail from './components/ItemDetail';
import CartView from './components/CartView';
import ProfileView from './components/ProfileView';
import ReviewForm from './components/ReviewForm';
import ChatView from './components/ChatView';
import { Home, ShoppingBag, User, PlusCircle, ShoppingCart, MapPin, Navigation, MessageCircle } from 'lucide-react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  subscribeToFoods, 
  subscribeToOrders, 
  subscribeToReviews, 
  addFoodToDb, 
  updateFoodInDb, 
  deleteFoodFromDb, 
  addOrderToDb, 
  updateOrderStatusInDb, 
  addReviewToDb,
  subscribeToUser
} from './services/db';
import { deleteChatForOrder } from './services/chatService';
import { performCleanup } from './services/cleanupService';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type AppState = 'splash' | 'auth' | 'main' | 'detail' | 'success' | 'chat' | 'checkout';
type Tab = 'home' | 'orders' | 'cart' | 'profile' | 'favorites';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('splash');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [role, setRole] = useState<UserRole>('buyer');
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [lastOrderTotalQuantity, setLastOrderTotalQuantity] = useState(0);
  const [buyerLocation, setBuyerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Real-time Shared State
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Run cleanup service on app start
  useEffect(() => {
    performCleanup();
    // Optional: Run periodically every hour
    const interval = setInterval(performCleanup, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Firestore Subscriptions
  useEffect(() => {
    if (authUser) {
      setIsProfileLoading(true);
      const unsubscribe = subscribeToUser(authUser.uid, (profile) => {
        if (profile) {
          setUserProfile(profile);
          // If profile has role, sync it (optional, but good for consistency)
          if (profile.role) setRole(profile.role);
        } else {
          // New user, profile might not exist yet or handled in AuthScreen
          setUserProfile({ uid: authUser.uid, email: authUser.email, role: 'buyer', verificationStatus: 'unverified' });
        }
        setIsProfileLoading(false);
      });
      return () => unsubscribe();
    } else {
      setUserProfile(null);
      setIsProfileLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      const unsubscribe = subscribeToFoods(setFoods);
      return () => unsubscribe();
    } else {
      setFoods([]);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      const unsubscribe = subscribeToOrders(authUser.uid, role, setOrders);
      return () => unsubscribe();
    } else {
      setOrders([]);
    }
  }, [authUser, role]);

  useEffect(() => {
    if (authUser) {
      const unsubscribe = subscribeToReviews(setReviews);
      return () => unsubscribe();
    } else {
      setReviews([]);
    }
  }, [authUser]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        // Don't set state to 'main' here, wait for profile
      } else {
        setAuthUser(null);
        setUserProfile(null);
        if (state !== 'splash') {
          setState('auth');
        }
      }
    });
    return () => unsubscribe();
  }, [state]);

  // Transition to main only when profile is loaded
  useEffect(() => {
    if (authUser && !isProfileLoading && (state === 'auth' || state === 'splash')) {
      setState('main');
    }
  }, [authUser, isProfileLoading, state]);

  const refreshLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBuyerLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting buyer location:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Request location permission for Buyer
  useEffect(() => {
    if (state === 'main' && role === 'buyer' && !buyerLocation) {
      refreshLocation();
    }
  }, [state, role, buyerLocation]);

  const handleAuth = (selectedRole: UserRole) => {
    setRole(selectedRole);
    // State transition handled by useEffect when profile loads
    setActiveTab('home');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setState('auth');
      setSelectedItem(null);
      setCart([]);
      setActiveTab('home');
      setBuyerLocation(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSelectItem = (item: FoodItem) => {
    setSelectedItem(item);
    setState('detail');
  };

  const addToCart = (item: FoodItem, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + quantity } : i);
      }
      return [...prev, { ...item, cartQuantity: quantity }];
    });
  };

  const handleBuyNow = (item: FoodItem, quantity: number = 1) => {
    setCheckoutItems([{ ...item, cartQuantity: quantity }]);
    setState('checkout');
  };

  const addFoodListing = async (newFood: FoodItem, imageFile?: File) => {
    try {
      // Remove id as it will be generated by Firestore
      const { id, ...foodData } = newFood;
      await addFoodToDb(foodData, imageFile);
    } catch (error) {
      console.error("Error adding food:", error);
      alert("Failed to add listing");
    }
  };

  const deleteFoodListing = async (id: string) => {
    try {
      await deleteFoodFromDb(id);
      setCart(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error("Error deleting food:", error);
      alert("Failed to delete listing");
    }
  };

  const editFoodListing = async (updatedFood: FoodItem, imageFile?: File) => {
    try {
      const { id, ...updates } = updatedFood;
      await updateFoodInDb(id, updates, imageFile);
      setCart(prev => prev.map(i => i.id === updatedFood.id ? { ...updatedFood, cartQuantity: i.cartQuantity } : i));
    } catch (error) {
      console.error("Error updating food:", error);
      alert("Failed to update listing");
    }
  };

  const processOrders = async (items: CartItem[], method: 'cod' | 'online', transactionId?: string) => {
    const newOrderEntries: Order[] = [];
    const newPayments: Payment[] = [];
    let totalQty = 0;

    // Group items by provider (cookId)
    const itemsByProvider: Record<string, CartItem[]> = {};
    items.forEach(item => {
      if (!itemsByProvider[item.cookId]) {
        itemsByProvider[item.cookId] = [];
      }
      itemsByProvider[item.cookId].push(item);
    });

    for (const [providerId, providerItems] of Object.entries(itemsByProvider)) {
      const providerOrderIds: string[] = [];
      let providerTotalAmount = 0;

      for (const item of providerItems) {
        totalQty += item.cartQuantity;
        providerTotalAmount += item.price * item.cartQuantity;

        for (let i = 0; i < item.cartQuantity; i++) {
          const orderData: Omit<Order, 'id'> = {
            itemId: item.id,
            itemTitle: item.title,
            buyerName: authUser?.displayName || "Local Neighbor",
            buyerId: authUser?.uid || "unknown",
            cookId: item.cookId,
            cookName: item.cookName,
            status: method === 'online' ? 'confirmed' : 'pending',
            timestamp: new Date(),
            price: item.price,
            quantity: 1,
            total: item.price,
            address: item.address,
            paymentMethod: method
          };

          try {
            const orderId = await addOrderToDb(orderData);
            providerOrderIds.push(orderId);
            newOrderEntries.push({ id: orderId, ...orderData });
          } catch (error) {
            console.error("Error creating order:", error);
          }
        }

        // Update food quantity in DB
        const currentFood = foods.find(f => f.id === item.id);
        if (currentFood) {
          try {
            await updateFoodInDb(item.id, { quantity: Math.max(0, currentFood.quantity - item.cartQuantity) });
          } catch (error) {
            console.error("Error updating food quantity:", error);
          }
        }
      }

      if (method === 'online' && transactionId) {
        newPayments.push({
          id: Math.random().toString(36).substr(2, 9),
          orderIds: providerOrderIds,
          providerId: providerId,
          amount: providerTotalAmount,
          currency: 'INR',
          status: 'success',
          method: 'online',
          transactionId: transactionId,
          timestamp: new Date()
        });
      }
    }

    if (newPayments.length > 0) {
      setPayments(prev => [...newPayments, ...prev]);
      console.log("Payments stored:", newPayments);
    }
    
    setLastOrder(newOrderEntries[0]);
    setLastOrderTotalQuantity(totalQty);
    setState('success');

    setCart([]);

    setTimeout(() => {
      setState('main');
      setActiveTab('orders');
    }, 4000);
  };

  const handlePlaceOrder = (items: CartItem[], method: 'cod' | 'online') => {
    if (method === 'online') {
      const totalAmount = items.reduce((acc, curr) => acc + (curr.price * curr.cartQuantity), 0);
      
      const options = {
        key: "YOUR_RAZORPAY_KEY", // Test Key
        amount: totalAmount * 100, // Amount in paise
        currency: "INR",
        name: "Proximity",
        description: "Food Order Payment",
        handler: function (response: any) {
          console.log("Payment Successful", response);
          processOrders(items, 'online', response.razorpay_payment_id);
        },
        prefill: {
          name: authUser?.displayName || "Guest",
          email: authUser?.email || "guest@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#FACC15"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } else {
      processOrders(items, 'cod');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatusInDb(orderId, status);
      
      if (status === 'delivered') {
        try {
          await deleteChatForOrder(orderId);
        } catch (error) {
          console.error("Failed to delete chat for order:", orderId, error);
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleReviewSubmit = async (reviewData: Omit<Review, 'id' | 'timestamp'>) => {
    try {
      await addReviewToDb(reviewData);
      setReviewingOrder(null);
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const handleChat = (order: Order) => {
    setActiveChatOrder(order);
    setState('chat');
  };

  const getDirectionsUrl = (address?: string) => {
    if (!address) return '#';
    const destination = encodeURIComponent(address);
    if (buyerLocation) {
      const origin = `${buyerLocation.latitude},${buyerLocation.longitude}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${destination}`;
  };

  const renderTabContent = () => {
    if (activeTab === 'profile') {
      return (
        <ProfileView 
          role={role} 
          orders={orders}
          reviews={reviews}
          foods={foods}
          onLogout={handleLogout} 
        />
      );
    }

    if (role === 'buyer') {
      switch (activeTab) {
        case 'home':
          return <BuyerHome foods={foods} onSelectItem={handleSelectItem} onAddToCart={addToCart} onBuyNow={handleBuyNow} userLocation={buyerLocation} onRefresh={refreshLocation} />;
        case 'cart':
          return <CartView items={cart} onRemove={(id) => setCart(c => c.filter(i => i.id !== id))} onCheckout={handlePlaceOrder} />;
        case 'orders':
          return (
            <div className="p-6 pt-12 animate-in fade-in duration-500 pb-32">
               <h2 className="text-2xl font-black mb-6">Your Orders</h2>
               <div className="space-y-4">
                 {orders.length === 0 ? (
                   <div className="text-center py-20 text-gray-400">
                     <p>No orders yet.</p>
                   </div>
                 ) : orders.map(o => {
                   const hasReviewed = reviews.some(r => r.orderId === o.id);
                   return (
                   <div key={o.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{o.itemTitle}</h4>
                       <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                         {o.status}
                       </span>
                     </div>
                     <p className="text-xs text-gray-500 mb-3">Quantity: {o.quantity} • Total: ₹{o.total}</p>
                     
                     <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                       <div className="flex items-center gap-1 text-[10px] text-gray-400 truncate max-w-[180px]">
                         <MapPin size={10} className="flex-shrink-0" /> {o.address}
                       </div>
                       <div className="flex gap-2">
                         {o.status !== 'pending' && (
                           <button
                             onClick={() => handleChat(o)}
                             className="text-[10px] font-black uppercase tracking-wider text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-1"
                           >
                             <MessageCircle size={12} /> Chat
                           </button>
                         )}
                         {o.status === 'delivered' && !hasReviewed && (
                           <button
                             onClick={() => setReviewingOrder(o)}
                             className="text-[10px] font-black uppercase tracking-wider text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-200 transition-all active:scale-95"
                           >
                             Review
                           </button>
                         )}
                         <a 
                           href={getDirectionsUrl(o.address)}
                           target="_blank"
                           rel="noreferrer"
                           className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100 hover:bg-yellow-100 transition-all active:scale-95"
                         >
                           <Navigation size={12} />
                           Directions
                         </a>
                       </div>
                     </div>
                   </div>
                   );
                 })}
               </div>
            </div>
          );
        default:
          return <div className="p-6 pt-12">Coming Soon</div>;
      }
    } else {
      switch (activeTab) {
        case 'home':
          return (
            <ProviderHome 
              orders={orders} 
              listings={foods}
              user={userProfile}
              onAddListing={addFoodListing}
              onEditListing={editFoodListing}
              onDeleteListing={deleteFoodListing}
              onUpdateOrder={updateOrderStatusInDb}
              onChat={handleChat}
            />
          );
        default:
          return <div className="p-6 pt-12">Coming Soon</div>;
      }
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'splash':
        return <SplashScreen onFinish={() => setState(authUser ? 'main' : 'auth')} />;
      case 'auth':
        return <AuthScreen onLogin={handleAuth} />;
      case 'main':
        return renderTabContent();
        case 'chat':
        return activeChatOrder ? (
          <ChatView 
            order={activeChatOrder} 
            currentUserRole={role} 
            onClose={() => setState('main')} 
          />
        ) : null;
      case 'checkout':
        return (
          <CartView 
            items={checkoutItems} 
            onRemove={() => setState('main')} 
            onCheckout={handlePlaceOrder} 
            onBack={() => setState('main')}
            title="Express Checkout"
          />
        );
      case 'detail':
        return selectedItem ? (
          <ItemDetail 
            item={selectedItem} 
            reviews={reviews}
            onBack={() => setState('main')} 
            onBook={(qty) => handleBuyNow(selectedItem, qty)}
            onAddToCart={(qty) => {
              addToCart(selectedItem, qty);
              setState('main');
              setActiveTab('cart');
            }}
          />
        ) : null;
      case 'success':
        return (
          <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300 z-[100]">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-3xl font-black mb-2 text-gray-900">Order Placed!</h2>
            <p className="text-gray-500 mb-6">{lastOrderTotalQuantity} portion(s) ordered. Neighbor {lastOrder?.cookId === 'cook_1' ? 'Chef You' : (selectedItem?.cookName || 'Chef')} is starting to cook.</p>
            
            <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100 w-full max-w-xs mb-6">
              <h4 className="font-bold text-yellow-800 mb-2 flex items-center justify-center gap-2">
                <MapPin size={16} /> Pickup Location
              </h4>
              <p className="text-sm text-yellow-700 mb-4">{lastOrder?.address}</p>
              <a 
                href={getDirectionsUrl(lastOrder?.address)}
                target="_blank"
                rel="noreferrer"
                className="block w-full bg-yellow-400 py-3 rounded-xl text-gray-900 font-black text-xs uppercase tracking-widest shadow-lg"
              >
                {buyerLocation ? "Get Directions" : "Open in Google Maps"}
              </a>
              {buyerLocation && <p className="text-[8px] text-yellow-600 mt-2 font-bold uppercase">Route from your current location</p>}
            </div>
            
            <p className="text-[10px] text-gray-400 uppercase tracking-widest animate-pulse">Redirecting to orders...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 overflow-x-hidden relative shadow-2xl">
      {renderContent()}

      {reviewingOrder && (
        <ReviewForm
          order={reviewingOrder}
          onSubmit={handleReviewSubmit}
          onCancel={() => setReviewingOrder(null)}
        />
      )}

      {(state === 'main' || (state === 'detail' && role === 'buyer')) && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around py-4 z-40">
          <button onClick={() => { setState('main'); setActiveTab('home'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-yellow-600' : 'text-gray-400'}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold uppercase">Home</span>
          </button>
          
          {role === 'buyer' ? (
            <>
              <button onClick={() => { setState('main'); setActiveTab('orders'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-yellow-600' : 'text-gray-400'}`}>
                <ShoppingBag size={24} />
                <span className="text-[10px] font-bold uppercase">Orders</span>
              </button>
              <button onClick={() => { setState('main'); setActiveTab('cart'); }} className={`relative flex flex-col items-center gap-1 ${activeTab === 'cart' ? 'text-yellow-600' : 'text-gray-400'}`}>
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.reduce((a, b) => a + b.cartQuantity, 0)}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase">Cart</span>
              </button>
            </>
          ) : (
            <button onClick={() => { setState('main'); setActiveTab('home'); }} className="flex flex-col items-center gap-1 text-gray-400">
              <PlusCircle size={32} className="text-yellow-500" />
            </button>
          )}

          <button onClick={() => { setState('main'); setActiveTab('profile'); }} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-yellow-600' : 'text-gray-400'}`}>
            <User size={24} />
            <span className="text-[10px] font-bold uppercase">Profile</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
