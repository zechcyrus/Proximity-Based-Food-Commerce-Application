import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export const deleteChatForOrder = async (orderId: string) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('orderId', '==', orderId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(document => 
      deleteDoc(doc(db, 'messages', document.id))
    );
    
    await Promise.all(deletePromises);
    console.log(`Chat messages for order ${orderId} deleted.`);
  } catch (error) {
    console.error("Error deleting chat messages:", error);
  }
};
