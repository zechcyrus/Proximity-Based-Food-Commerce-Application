import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { FoodItem, Order, Review, UserRole, OrderStatus } from '../types';

// --- Users ---

export const subscribeToUser = (userId: string, callback: (user: any) => void) => {
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      callback({ uid: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

export const updateUserProfile = async (userId: string, updates: any) => {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, updates);
};

// --- Foods ---

export const subscribeToFoods = (callback: (foods: FoodItem[]) => void) => {
  const q = query(collection(db, 'foods'));
  return onSnapshot(q, (snapshot) => {
    const foods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FoodItem));
    // Sort client-side
    // Assuming foods have a timestamp, if not we might need to add it or sort by something else
    // The original code had orderBy('timestamp', 'desc'), so we assume it exists.
    // However, looking at addFoodToDb, we do add timestamp.
    // We need to handle potential missing timestamp in existing data if any.
    foods.sort((a, b) => {
      const timeA = (a as any).timestamp?.seconds || 0;
      const timeB = (b as any).timestamp?.seconds || 0;
      return timeB - timeA;
    });
    callback(foods);
  }, (error) => {
    console.error("Error subscribing to foods:", error);
  });
};

export const addFoodToDb = async (food: Omit<FoodItem, 'id'>, imageFile?: File) => {
  let imageUrl = food.image;
  
  if (imageFile) {
    imageUrl = await uploadImage(imageFile, `foods/${Date.now()}_${imageFile.name}`);
  }

  const docRef = await addDoc(collection(db, 'foods'), {
    ...food,
    image: imageUrl,
    timestamp: Timestamp.now()
  });
  return docRef.id;
};

export const updateFoodInDb = async (id: string, updates: Partial<FoodItem>, imageFile?: File) => {
  let imageUrl = updates.image;
  
  if (imageFile) {
    imageUrl = await uploadImage(imageFile, `foods/${Date.now()}_${imageFile.name}`);
  }

  const docRef = doc(db, 'foods', id);
  await updateDoc(docRef, {
    ...updates,
    ...(imageUrl ? { image: imageUrl } : {}),
    updatedAt: Timestamp.now()
  });
};

export const deleteFoodFromDb = async (id: string) => {
  await deleteDoc(doc(db, 'foods', id));
};

// --- Orders ---

export const subscribeToOrders = (userId: string, role: UserRole, callback: (orders: Order[]) => void) => {
  let q;
  if (role === 'buyer') {
    q = query(collection(db, 'orders'), where('buyerId', '==', userId));
  } else {
    q = query(collection(db, 'orders'), where('cookId', '==', userId));
  }

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date() // Convert Firestore Timestamp to Date
    } as Order));
    
    // Sort client-side
    orders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    callback(orders);
  }, (error) => {
    console.error("Error subscribing to orders:", error);
  });
};

export const addOrderToDb = async (order: Omit<Order, 'id'>) => {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...order,
    timestamp: Timestamp.now()
  });
  return docRef.id;
};

export const updateOrderStatusInDb = async (orderId: string, status: OrderStatus) => {
  const docRef = doc(db, 'orders', orderId);
  await updateDoc(docRef, { status });
};

// --- Reviews ---

export const subscribeToReviews = (callback: (reviews: Review[]) => void) => {
  const q = query(collection(db, 'reviews'));
  return onSnapshot(q, (snapshot) => {
    const reviews = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    } as Review));
    
    // Sort client-side
    reviews.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    callback(reviews);
  }, (error) => {
    console.error("Error subscribing to reviews:", error);
  });
};

export const addReviewToDb = async (review: Omit<Review, 'id' | 'timestamp'>) => {
  await addDoc(collection(db, 'reviews'), {
    ...review,
    timestamp: Timestamp.now()
  });
};

// --- Storage ---

export const uploadImage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};
