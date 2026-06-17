
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Filter, Utensils, ShoppingCart, CreditCard, Sliders } from 'lucide-react';
import { auth } from '../services/firebase';
import { FoodItem } from '../types';

interface BuyerHomeProps {
  foods: FoodItem[];
  onSelectItem: (item: FoodItem) => void;
  onAddToCart: (item: FoodItem) => void;
  onBuyNow: (item: FoodItem) => void;
  userLocation: { latitude: number; longitude: number } | null;
  onRefresh?: () => void;
}

const BuyerHome: React.FC<BuyerHomeProps> = ({ foods, onSelectItem, onAddToCart, onBuyNow, userLocation, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [radius, setRadius] = useState(500); // Default 500m
  const [showFilters, setShowFilters] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullMoveY, setPullMoveY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    if (window.scrollY === 0 && y > pullStartY && pullStartY > 0) {
      setPullMoveY(y - pullStartY);
    }
  };

  const handleTouchEnd = () => {
    if (pullMoveY > 80) {
      setIsRefreshing(true);
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullMoveY(0);
      }, 1500);
    } else {
      setPullMoveY(0);
    }
    setPullStartY(0);
  };

  // Haversine formula to calculate distance in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Helper to format timestamp
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredFoods = foods.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.cookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.address.toLowerCase().includes(searchTerm.toLowerCase());
    const hasQuantity = item.quantity > 0;

    let withinRadius = true;

    if (userLocation) {
      // Check if item has valid coordinates (not 0,0 and not undefined)
      const hasValidLocation = item.latitude && item.longitude && (item.latitude !== 0 || item.longitude !== 0);
      
      if (hasValidLocation) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          item.latitude,
          item.longitude
        );
        withinRadius = distance <= radius;
      } else {
        // If item has no location data (or 0,0), include it regardless of radius
        // This ensures items added without "Locate Me" still appear
        withinRadius = true;
      }
    }

    return matchesSearch && hasQuantity && withinRadius;
  }).map(item => {
    // Add calculated distance to the item for display
    if (userLocation && item.latitude && item.longitude) {
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );
      return { ...item, calculatedDistance: dist };
    }
    return item;
  });

  return (
    <div 
      className="pb-24 animate-in slide-in-from-bottom-4 duration-500 min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 flex justify-center items-center pointer-events-none transition-all duration-300 z-50"
        style={{ 
          height: isRefreshing ? '60px' : `${Math.min(pullMoveY * 0.4, 80)}px`,
          opacity: Math.min(pullMoveY / 50, 1)
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-md">
          <div className={`w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullMoveY * 2}deg)` }} />
        </div>
      </div>

      <header className="bg-yellow-400 p-6 pt-12 rounded-b-[2rem] shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-yellow-900 text-sm font-bold opacity-80 flex items-center gap-1">
              <MapPin size={14} /> Local Neighbors
            </p>
            <h1 className="text-2xl font-black text-gray-900">Proximity Flavors</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-100 shadow-sm flex items-center justify-center border-2 border-white text-yellow-700 font-black">
            {auth.currentUser?.displayName 
              ? auth.currentUser.displayName.charAt(0).toUpperCase() 
              : (auth.currentUser?.email ? auth.currentUser.email.charAt(0).toUpperCase() : 'U')}
          </div>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search for dishes, cooks, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-xl py-3 pl-12 pr-4 text-gray-900 font-medium placeholder:text-gray-400 outline-none shadow-sm focus:ring-2 focus:ring-yellow-600/20"
          />
        </div>

        {/* Radius Filter */}
        <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-black uppercase tracking-widest text-yellow-900 flex items-center gap-2">
              <Sliders size={14} /> Search Radius
            </label>
            <span className="text-xs font-bold text-yellow-900 bg-white/40 px-2 py-1 rounded-lg">
              {radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="3000"
            step="100"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2 bg-yellow-900/20 rounded-lg appearance-none cursor-pointer accent-yellow-900"
          />
          <div className="flex justify-between text-[10px] font-bold text-yellow-900/60 mt-1">
            <span>100m</span>
            <span>3km</span>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-gray-900">Fresh Near You</h2>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg text-gray-600 transition-colors ${showFilters ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100'}`}
          >
            <Filter size={18} />
          </button>
        </div>

        <div className="grid gap-6">
          {filteredFoods.length > 0 ? filteredFoods.map(item => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col transition-transform active:scale-[0.98]"
            >
              <div className="relative h-48 overflow-hidden" onClick={() => onSelectItem(item)}>
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm flex items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-black text-gray-900">{item.rating}</span>
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} /> {item.availableUntil}
                </div>
                {item.dietaryType === 'veg' && (
                  <div className="absolute top-3 left-3 bg-green-500 p-1.5 rounded-full shadow-lg border-2 border-white">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
                {item.dietaryType === 'non-veg' && (
                  <div className="absolute top-3 left-3 bg-red-500 p-1.5 rounded-full shadow-lg border-2 border-white">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-1" onClick={() => onSelectItem(item)}>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">{item.title}</h3>
                  <span className="text-yellow-600 font-black text-xl">₹{item.price.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs mb-3 font-bold flex-wrap" onClick={() => onSelectItem(item)}>
                  <span>by {item.cookName}</span>
                  {item.timestamp && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">{formatTimeAgo(item.timestamp)}</span>
                    </>
                  )}
                  <span>•</span>
                  <MapPin size={10} className="text-yellow-600" />
                  <span className="truncate max-w-[120px]">
                    {item.calculatedDistance 
                      ? `${item.calculatedDistance < 1000 ? Math.round(item.calculatedDistance) + 'm' : (item.calculatedDistance / 1000).toFixed(1) + 'km'} away` 
                      : item.address}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    onClick={() => onAddToCart(item)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-50 text-yellow-700 font-black rounded-xl text-[10px] uppercase tracking-wider border border-yellow-200"
                  >
                    <ShoppingCart size={14} /> Add to Cart
                  </button>
                  <button 
                    onClick={() => onBuyNow(item)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow-lg shadow-gray-200"
                  >
                    <CreditCard size={14} /> Buy Now
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.quantity} portions left</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-24 flex flex-col items-center gap-4">
              <div className="bg-gray-100 p-6 rounded-full text-gray-300">
                <Utensils size={48} />
              </div>
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">
                {userLocation ? "No dishes found within range" : "Waiting for location..."}
              </p>
              {userLocation && (
                <button 
                  onClick={() => setRadius(3000)}
                  className="text-yellow-600 font-bold text-xs hover:underline"
                >
                  Increase search radius
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BuyerHome;
