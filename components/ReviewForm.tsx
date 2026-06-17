import React, { useState } from 'react';
import { Order, Review } from '../types';
import { Star, X } from 'lucide-react';

interface ReviewFormProps {
  order: Order;
  onSubmit: (review: Omit<Review, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ order, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      orderId: order.id,
      itemId: order.itemId,
      cookId: order.cookId,
      buyerName: order.buyerName,
      rating,
      comment,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900">Rate Your Meal</h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">You ordered</p>
          <h4 className="font-bold text-gray-900 text-lg">{order.itemTitle}</h4>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90 focus:outline-none"
              >
                <Star
                  size={32}
                  className={`${
                    star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'
                  } transition-colors duration-200`}
                />
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
              Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the taste? Was it fresh?"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[100px] resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;
