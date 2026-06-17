
import React from 'react';
import { LogOut, User as UserIcon, MapPin, Bell, Star, ShoppingBag, Utensils, MessageSquare } from 'lucide-react';
import { auth } from '../services/firebase';
import { Order, Review, FoodItem } from '../types';

interface ProfileViewProps {
  role: 'buyer' | 'cook';
  orders: Order[];
  reviews: Review[];
  foods: FoodItem[];
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ role, orders, reviews, foods, onLogout }) => {
  const user = auth.currentUser;

  // Buyer Stats
  const myOrders = orders.filter(o => role === 'buyer' ? true : false); // In App.tsx orders are already filtered or global? 
  // Wait, in App.tsx 'orders' seems to be global state. 
  // For buyer, it shows "Your Orders" which are filtered by... wait, App.tsx doesn't filter orders by user ID in the main view?
  // Checking App.tsx: 
  // const handlePlaceOrder... buyerName: user?.displayName || "Local Neighbor"
  // The 'orders' state in App.tsx seems to be ALL orders in this mock version.
  // I should filter by user if possible, but for this mock, I'll assume 'orders' passed to me are relevant to the user context 
  // OR I should filter them here if I can match IDs.
  // Since I don't have a robust user ID system in the mock data creation (it uses random IDs), 
  // I will assume for the BUYER role, the `orders` prop passed from App.tsx contains the buyer's orders.
  // BUT, looking at App.tsx, `orders` is a shared state.
  // For the purpose of this "Profile", I will filter orders where `buyerName` matches current user (if available) or just show all for the demo if user ID is missing.
  // Actually, App.tsx `renderTabContent` for buyer shows `orders` directly. So I will treat `orders` as "My Orders" for buyer.
  
  // Cook Stats
  // For cook, `orders` in App.tsx seems to be ALL orders too. 
  // ProviderHome filters them: `orders.filter(o => o.status === 'pending')` etc.
  // So I should filter orders for the cook.
  // In App.tsx, `addFoodListing` adds to `foods`. `handlePlaceOrder` uses `item.cookId`.
  // Mock foods have `cookId: 'cook_1'`.
  // So for Cook Profile, I should filter orders where `cookId` matches the current cook.
  // Since we are mocking 'cook_1' as the logged in cook in ProviderHome (implied), I'll stick to that.

  const isCook = role === 'cook';
  
  // Filter data based on role
  const relevantOrders = isCook 
    ? orders.filter(o => o.cookId === 'cook_1' || o.cookId === user?.uid)
    : orders; // Assuming App.tsx passes relevant orders, or we filter by buyer name? 
              // Let's filter by buyerName if user is logged in, otherwise show all (demo mode)
              // Actually, simpler: just use `orders` for buyer as is, assuming the app is single-player for now.

  const relevantReviews = isCook
    ? reviews.filter(r => r.cookId === 'cook_1' || r.cookId === user?.uid)
    : reviews.filter(r => r.buyerName === (user?.displayName || "Local Neighbor")); // Match by name for now

  const averageRating = isCook && relevantReviews.length > 0
    ? (relevantReviews.reduce((acc, r) => acc + r.rating, 0) / relevantReviews.length).toFixed(1)
    : 'New';

  return (
    <div className="p-6 pt-16 animate-in fade-in duration-500 h-full overflow-y-auto pb-32">
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 bg-yellow-100 rounded-full border-4 border-yellow-400 shadow-xl mb-4 flex items-center justify-center">
          <span className="text-4xl font-black text-yellow-600">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : (isCook ? 'C' : 'U'))}
          </span>
        </div>
        <h2 className="text-2xl font-black text-gray-900">{user?.displayName || (isCook ? 'Chef You' : 'Neighbor User')}</h2>
        <p className="text-gray-500 font-medium">{user?.email}</p>
        <div className="mt-1 bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
          Local {isCook ? 'Chef' : 'Foodie'}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
            {isCook ? 'Orders' : 'Ordered'}
          </p>
          <p className="text-xl font-black text-gray-900">{relevantOrders.length}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
            Reviews
          </p>
          <p className="text-xl font-black text-gray-900">{relevantReviews.length}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
            {isCook ? 'Rating' : 'Favorites'}
          </p>
          <div className="flex items-center justify-center gap-1">
            {isCook ? (
              <>
                <span className="text-xl font-black text-gray-900">{averageRating}</span>
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
              </>
            ) : (
              <span className="text-xl font-black text-gray-900">0</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Reviews Section */}
        <div>
          <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={18} /> {isCook ? 'Reviews Received' : 'My Reviews'}
          </h3>
          <div className="space-y-3">
            {relevantReviews.length > 0 ? relevantReviews.map(review => (
              <div key={review.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-900">
                    {isCook ? review.buyerName : `For: ${foods.find(f => f.id === review.itemId)?.title || 'Dish'}`}
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={10} 
                        className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 italic">"{review.comment}"</p>
                <p className="text-[10px] text-gray-400 mt-2 text-right">
                  {review.timestamp.toLocaleDateString()}
                </p>
              </div>
            )) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-xs">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Order History Section */}
        <div>
          <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag size={18} /> {isCook ? 'Recent Orders' : 'Order History'}
          </h3>
          <div className="space-y-3">
            {relevantOrders.length > 0 ? relevantOrders.slice(0, 5).map(order => (
              <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{order.itemTitle}</h4>
                  <p className="text-[10px] text-gray-500">
                    {new Date(order.timestamp).toLocaleDateString()} • ₹{order.total}
                  </p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {order.status}
                </span>
              </div>
            )) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-xs">No orders yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Links */}
        <div className="pt-4 border-t border-gray-100">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center font-black text-lg">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : <UserIcon size={20} />)}
              </div>
              <span className="font-bold text-gray-700">Account Settings</span>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border border-red-100 transition-all active:scale-95"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Proximity v1.3.0</p>
      </div>
    </div>
  );
};

export default ProfileView;