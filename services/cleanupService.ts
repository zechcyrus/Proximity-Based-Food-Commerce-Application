
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  Timestamp, 
  writeBatch,
  limit
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

export const performCleanup = async () => {
  console.log("Starting cleanup service...");
  const now = Date.now();
  // 24 hours in milliseconds
  const twentyFourHoursAgo = Timestamp.fromMillis(now - 24 * 60 * 60 * 1000);
  // 5 hours in milliseconds
  const fiveHoursAgo = Timestamp.fromMillis(now - 5 * 60 * 60 * 1000);

  try {
    await cleanupLicenseImages(twentyFourHoursAgo);
    await cleanupConfirmedOrders(twentyFourHoursAgo);
    await cleanupUnsoldFood(fiveHoursAgo);
    await cleanupMessages(fiveHoursAgo);
    console.log("Cleanup service completed successfully.");
  } catch (error) {
    console.error("Error during cleanup service execution:", error);
  }
};

const cleanupLicenseImages = async (threshold: Timestamp) => {
  // 1. License images from storage should get automatically delete after 24 hours
  try {
    const q = query(
      collection(db, 'users'), 
      where('licenseUploadedAt', '<=', threshold)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let hasUpdates = false;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      if (userData.licenseUrl) {
        try {
          // Create a reference to the file to delete
          const fileRef = ref(storage, userData.licenseUrl);
          await deleteObject(fileRef).catch(e => {
             // Ignore if object not found, it might have been deleted already
             if (e.code !== 'storage/object-not-found') console.error(`Error deleting license file for user ${userDoc.id}:`, e);
          });
          
          // Update user document to remove the URL
          // We keep the verification status as is, assuming the license was processed
          // or if it wasn't, the admin should have seen it by now.
          // If we want to invalidate, we could set verificationStatus: 'unverified'
          // But the requirement is just about deleting the image.
          batch.update(userDoc.ref, {
            licenseUrl: null,
            licenseUploadedAt: null
          });
          hasUpdates = true;
        } catch (e) {
          console.error(`Failed to cleanup license for user ${userDoc.id}:`, e);
        }
      }
    }

    if (hasUpdates) await batch.commit();
  } catch (error) {
    console.error("Error in cleanupLicenseImages:", error);
  }
};

const cleanupConfirmedOrders = async (threshold: Timestamp) => {
  // 2. if orders get confirmed they should get deleted after 24 hours from my database
  try {
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'confirmed'),
      where('timestamp', '<=', threshold)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let hasDeletes = false;
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      hasDeletes = true;
    });

    if (hasDeletes) await batch.commit();
  } catch (error) {
    console.error("Error in cleanupConfirmedOrders:", error);
  }
};

const cleanupUnsoldFood = async (threshold: Timestamp) => {
  // 3. If No one buys food the data should get deleted from my database after 5 hours
  // 4. Similary with order, the food image should get deleted.
  try {
    const q = query(
      collection(db, 'foods'),
      where('timestamp', '<=', threshold)
    );

    const snapshot = await getDocs(q);
    
    for (const foodDoc of snapshot.docs) {
      const foodData = foodDoc.data();
      
      // Check if any orders exist for this food
      // We check for ANY order, regardless of status, to determine if "someone bought it"
      // If there is a pending order, we probably shouldn't delete the food yet.
      const ordersQ = query(
        collection(db, 'orders'),
        where('itemId', '==', foodDoc.id),
        limit(1)
      );
      const ordersSnapshot = await getDocs(ordersQ);

      if (ordersSnapshot.empty) {
        // No orders found, safe to delete
        
        // Delete image if exists
        if (foodData.image) {
          try {
              const imageRef = ref(storage, foodData.image);
              await deleteObject(imageRef).catch(e => {
                  if (e.code !== 'storage/object-not-found') console.error(`Error deleting food image for ${foodDoc.id}:`, e);
              });
          } catch (e) {
              console.error(`Error creating ref for food image ${foodDoc.id}:`, e);
          }
        }
        
        // Delete food document
        await deleteDoc(foodDoc.ref);
      }
    }
  } catch (error) {
    console.error("Error in cleanupUnsoldFood:", error);
  }
};

const cleanupMessages = async (threshold: Timestamp) => {
  // 5. All messages should get deleted after 5 hours
  try {
    const q = query(
      collection(db, 'messages'),
      where('timestamp', '<=', threshold)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    let hasDeletes = false;

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      hasDeletes = true;
    });

    if (hasDeletes) await batch.commit();
  } catch (error) {
    console.error("Error in cleanupMessages:", error);
  }
};
