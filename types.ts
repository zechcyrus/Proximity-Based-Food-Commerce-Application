
export type UserRole = 'buyer' | 'cook';
export type DietaryType = 'veg' | 'non-veg';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered';

export interface Message {
  id: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any; // Firestore Timestamp or Date
  read: boolean;
}

export interface User {
  uid: string;
  email: string | null;
  role: UserRole;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  licenseUrl?: string;
  licenseUploadedAt?: any;
  createdAt: any; // Firestore Timestamp
  displayName?: string;
  avatar?: string;
  location?: string;
}

export interface FoodItem {
  id: string;
  cookId: string;
  cookName: string;
  title: string;
  description: string;
  price: number;
  image: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distance: string;
  rating: number;
  availableUntil: string;
  quantity: number;
  dietaryType: DietaryType;
  category: string;
  calculatedDistance?: number;
  timestamp?: any; // Firestore Timestamp or Date
}

export interface CartItem extends FoodItem {
  cartQuantity: number;
}

export interface Order {
  id: string;
  itemId: string;
  itemTitle: string;
  buyerName: string;
  buyerId: string;
  cookId: string;
  cookName: string;
  status: OrderStatus;
  timestamp: Date;
  price: number;
  quantity: number;
  total: number;
  address?: string;
  paymentMethod?: 'cod' | 'online';
}

export interface Review {
  id: string;
  orderId: string;
  itemId: string;
  cookId: string;
  buyerName: string;
  rating: number;
  comment: string;
  timestamp: Date;
}

export interface Payment {
  id: string;
  orderIds: string[];
  providerId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  method: 'online' | 'cod';
  transactionId?: string;
  timestamp: Date;
}