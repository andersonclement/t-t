import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  count: number;
  image?: string;
}

export type OrderStatus = 'pending_validation' | 'validated' | 'preparing' | 'out_for_delivery' | 'delivered' | 'rejected' | 'en_cours' | 'livre' | 'annule';

export interface Order {
  id: string;
  patientId: string;
  pharmacistId?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  mode: 'delivery' | 'pickup';
  paymentMethod?: string;
  createdAt: any;
  updatedAt: any;
  date?: string; // For legacy UI compatibility
}

interface OrderContextType {
  orders: Order[];
  addOrder: (orderData: Omit<Order, 'id' | 'patientId' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  loading: boolean;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !profile) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let q;
    if (profile.role === 'pharmacist') {
      // Scope to the pharmacist's own orders
      q = query(
        collection(db, 'orders'),
        where('pharmacistId', '==', auth.currentUser.uid)
      );
    } else {
      // Patients only see their own orders
      q = query(
        collection(db, 'orders'), 
        where('patientId', '==', auth.currentUser.uid)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt as Timestamp;
        return {
          id: doc.id,
          ...data,
          date: createdAt ? createdAt.toDate().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Date inconnue'
        } as Order;
      });

      // Sort in JavaScript to guarantee index-free operation
      ordersData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Orders sync error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'patientId' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!auth.currentUser) throw new Error("User must be logged in to place an order");

    const newOrder = {
      ...orderData,
      patientId: auth.currentUser.uid,
      status: 'pending_validation',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      // 1. Add order to firestore
      await addDoc(collection(db, 'orders'), newOrder);

      // 2. Automatically deduct stock in Firestore medication_stock
      for (const item of orderData.items) {
        if (item.id && !item.id.startsWith('med-local-')) {
          const medRef = doc(db, 'medication_stock', item.id);
          try {
            await updateDoc(medRef, {
              stock: increment(-item.count)
            });
          } catch (e) {
            console.warn("Failed to deduct firestore stock for item:", item.id, e);
          }
        }
      }

      // 3. Automatically deduct stock in localStorage fallback
      try {
        const stored = localStorage.getItem('medimap_meds_stock');
        if (stored) {
          const localMeds = JSON.parse(stored);
          const updatedMeds = localMeds.map((m: any) => {
            const orderedItem = orderData.items.find(i => i.id === m.id);
            if (orderedItem) {
              return { ...m, stock: Math.max(0, m.stock - orderedItem.count) };
            }
            return m;
          });
          localStorage.setItem('medimap_meds_stock', JSON.stringify(updatedMeds));
        }
      } catch (localErr) {
        console.warn("Failed to deduct localStorage stock:", localErr);
      }

    } catch (err) {
      console.error("Failed to add order:", err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to update order status:", err);
      throw err;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus, loading }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}
