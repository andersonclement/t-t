import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy,
  Timestamp 
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
      // Pharmacists see all orders (initially, or can be scoped to their pharmacy)
      q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    } else {
      // Patients only see their own orders
      q = query(
        collection(db, 'orders'), 
        where('patientId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
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
      await addDoc(collection(db, 'orders'), newOrder);
    } catch (err) {
      console.error("Failed to add order:", err);
      throw err;
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, loading }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
}
