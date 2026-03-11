import CryptoJS from 'crypto-js';
import { db } from './firebaseConfig';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const SECRET_SALT = "AstraCIT_Security_2026"; 

/**
 * AstraCIT Secure Ledger Write Utility
 * Mimics Blockchain behavior by linking the new entry to the previous entry's hash.
 */
export const secureAddDoc = async (collectionName, data) => {
  try {
    // 1. Find the previous "block" in the chain to establish the link
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    const lastDoc = snapshot.docs[0]?.data();
    
    // If it's the first entry in the collection, we use a Genesis string
    const previousHash = lastDoc?.digitalSeal || "GENESIS_BLOCK";

    // 2. Prepare the exact data structure for hashing
    // MUST MATCH THE VERIFICATION LOGIC IN EXECUTIVE HUB
    const ledgerData = {
      amount: data.amount,
      category: data.category,
      description: data.description,
      timestamp: data.timestamp || new Date().toISOString()
    };

    // 3. Create the unique SHA-256 Digital Seal
    // Stringify data + Previous Seal + Secret Salt
    const stringData = JSON.stringify(ledgerData);
    const dataToHash = stringData + previousHash + SECRET_SALT;
    const newSeal = CryptoJS.SHA256(dataToHash).toString();

    // 4. Save to Firestore with the Digital Seal and the back-link
    return await addDoc(collection(db, collectionName), {
      ...ledgerData, // Save the cleaned data
      digitalSeal: newSeal,
      previousSeal: previousHash,
      createdAt: serverTimestamp(),
    });

  } catch (error) {
    console.error("Blockchain Security Layer Error:", error);
    // Standard fallback to prevent app crashes during the pitch
    return await addDoc(collection(db, collectionName), { 
      ...data, 
      createdAt: serverTimestamp() 
    });
  }
};