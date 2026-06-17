import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, User, AlertCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import { Message, Order } from '../types';

interface ChatViewProps {
  order: Order;
  currentUserRole: 'buyer' | 'provider';
  onClose: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ order, currentUserRole, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const otherUserName = currentUserRole === 'buyer' ? (order.cookName || 'Chef') : (order.buyerName || 'Neighbor');
  const otherUserId = currentUserRole === 'buyer' ? order.cookId : order.buyerId;

  // Monitor auth state to ensure we have a valid user before querying
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!order.id || !user) return;

    const q = query(
      collection(db, 'messages'),
      where('orderId', '==', order.id)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        
        // Sort messages by timestamp client-side to avoid needing a composite index
        msgs.sort((a, b) => {
          const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
          const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
          return timeA - timeB;
        });
        
        setMessages(msgs);
        setError(null);
        scrollToBottom();
      },
      (err) => {
        console.error("Snapshot error:", err);
        if (err.code === 'permission-denied') {
          setError("Unable to load messages. You may not have permission to view this chat.");
        } else {
          setError("Connection error. Please try again later.");
        }
      }
    );

    return () => unsubscribe();
  }, [order.id, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        orderId: order.id,
        senderId: user.uid,
        receiverId: otherUserId || 'unknown',
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false
      });
      setNewMessage('');
      setError(null);
    } catch (err: any) {
      console.error("Error sending message:", err);
      if (err.code === 'permission-denied') {
        setError("Message failed to send. Permission denied.");
      } else {
        setError("Failed to send message. Please try again.");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-4 shadow-sm">
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold border-2 border-white shadow-sm">
            {otherUserName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{otherUserName}</h3>
            <p className="text-xs text-gray-500 font-medium">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 justify-center">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        {messages.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium">Start chatting with {otherUserName}</p>
            <p className="text-xs text-gray-400">Ask about your order or special requests</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${
                    isMe 
                      ? 'bg-yellow-500 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                  <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-yellow-100' : 'text-gray-400'}`}>
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!!error}
          className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || !!error}
          className="bg-yellow-500 text-white p-3 rounded-xl hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-yellow-200"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatView;
