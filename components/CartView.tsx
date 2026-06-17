
import React, { useState } from 'react';
import { CartItem } from '../types';
import { Trash2, ShoppingBag, MapPin, CreditCard, Banknote, ChevronLeft } from 'lucide-react';

interface CartViewProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  onCheckout: (items: CartItem[], method: 'cod' | 'online') => void;
  onBack?: () => void;
  title?: string;
}

const CartView: React.FC<CartViewProps> = ({ items, onRemove, onCheckout, onBack, title = "Your Cart" }) => {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const total = items.reduce((acc, curr) => acc + (curr.price * curr.cartQuantity), 0);

  return (
    <div className="p-6 pt-12 animate-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto pb-32">
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <button onClick={onBack} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
            <ChevronLeft size={24} />
          </button>
        )}
        <h2 className="text-3xl font-black text-gray-900">{title}</h2>
      </div>
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <ShoppingBag size={64} className="mb-4" />
          <p className="font-black uppercase tracking-widest text-xs">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
              <img src={item.image} alt={item.title} className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900">{item.title}</h4>
                    <button onClick={() => onRemove(item.id)} className="text-red-400 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">₹{item.price} x {item.cartQuantity}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <MapPin size={10} /> {item.address}
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h3>
            <div className="space-y-3 mb-6">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400' : 'border-gray-200 hover:border-gray-300'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cod" 
                  checked={paymentMethod === 'cod'} 
                  onChange={() => setPaymentMethod('cod')}
                  className="hidden" 
                />
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-yellow-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />}
                </div>
                <Banknote size={20} className={paymentMethod === 'cod' ? 'text-yellow-700' : 'text-gray-400'} />
                <span className={`font-bold ${paymentMethod === 'cod' ? 'text-yellow-900' : 'text-gray-600'}`}>Pay on Delivery</span>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400' : 'border-gray-200 hover:border-gray-300'}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="online" 
                  checked={paymentMethod === 'online'} 
                  onChange={() => setPaymentMethod('online')}
                  className="hidden" 
                />
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'online' ? 'border-blue-500' : 'border-gray-300'}`}>
                  {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
                <CreditCard size={20} className={paymentMethod === 'online' ? 'text-blue-700' : 'text-gray-400'} />
                <span className={`font-bold ${paymentMethod === 'online' ? 'text-blue-900' : 'text-gray-600'}`}>Pay Now</span>
              </label>
            </div>

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-100">
              <span className="text-gray-500 font-bold">Total Amount</span>
              <span className="text-2xl font-black text-gray-900">₹{total}</span>
            </div>
            <button 
              onClick={() => onCheckout(items, paymentMethod)}
              className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 ${
                paymentMethod === 'online' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                  : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-yellow-100'
              }`}
            >
              {paymentMethod === 'online' ? 'Pay & Order' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;
