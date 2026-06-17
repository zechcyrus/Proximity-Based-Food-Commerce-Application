
import React, { useState } from 'react';
import { FoodItem, Review } from '../types';
import { ChevronLeft, Star, Clock, ShieldCheck, Heart, MapPin, ShoppingCart, CreditCard, User } from 'lucide-react';

interface ItemDetailProps {
  item: FoodItem;
  reviews: Review[];
  onBack: () => void;
  onBook: (quantity: number) => void;
  onAddToCart: (quantity: number) => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ item, reviews, onBack, onBook, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);

  const handleIncrement = () => {
    if (quantity < item.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const itemReviews = reviews.filter(r => r.itemId === item.id);
  const averageRating = itemReviews.length > 0 
    ? (itemReviews.reduce((acc, r) => acc + r.rating, 0) / itemReviews.length).toFixed(1) 
    : item.rating;

  return (
    <div className="min-h-screen bg-white animate-in slide-in-from-right-4 duration-500 pb-32">
      <div className="relative h-96">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute top-12 left-6 right-6 flex justify-between">
          <button onClick={onBack} className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => setLiked(!liked)} className={`w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-colors ${liked ? 'text-red-500' : 'text-white'}`}>
            <Heart size={20} className={liked ? "fill-red-500" : ""} />
          </button>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10 bg-white rounded-t-[2.5rem] pt-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-yellow-100 text-yellow-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
            Homemade
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star size={12} className="text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-gray-900">{averageRating}</span> 
            <span className="text-gray-400">({itemReviews.length > 0 ? itemReviews.length : 'Verified'})</span>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-4">{item.title}</h1>
        
        <div className="flex items-center gap-4 py-4 border-y border-gray-100 mb-6">
          <div className="w-12 h-12 rounded-full bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center text-yellow-700 font-black text-xl">
            {item.cookName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900">{item.cookName}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} className="text-yellow-600" />
              <span>{item.address}</span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded text-[10px] font-bold border ${item.dietaryType === 'veg' ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}`}>
            {item.dietaryType === 'veg' ? 'VEG' : 'NON-VEG'}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Description</h3>
            <p className="text-gray-600 leading-relaxed text-sm">{item.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-yellow-500 shadow-sm">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase">Pickup Till</p>
                <p className="text-sm font-bold text-gray-900">{item.availableUntil}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-500 shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase">Stock</p>
                <p className="text-sm font-bold text-gray-900">{item.quantity} Left</p>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {itemReviews.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                Reviews <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{itemReviews.length}</span>
              </h3>
              <div className="space-y-4">
                {itemReviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-[10px]">
                          {review.buyerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-gray-900">{review.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-6 flex flex-col gap-4 z-40 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase mb-1">Total</p>
            <p className="text-2xl font-black text-gray-900">₹{(item.price * quantity).toFixed(0)}</p>
          </div>
          <div className="flex items-center bg-gray-100 rounded-2xl p-1">
            <button onClick={handleDecrement} className="w-8 h-8 flex items-center justify-center font-black text-lg text-gray-900">-</button>
            <span className="w-10 text-center font-black text-gray-900">{quantity}</span>
            <button onClick={handleIncrement} className="w-8 h-8 flex items-center justify-center font-black text-lg text-gray-900">+</button>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => onAddToCart(quantity)}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-yellow-100 text-yellow-800 font-black rounded-2xl text-xs uppercase tracking-widest border border-yellow-200"
          >
            <ShoppingCart size={18} /> Add to Cart
          </button>
          <button 
            onClick={() => onBook(quantity)}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl"
          >
            <CreditCard size={18} /> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
