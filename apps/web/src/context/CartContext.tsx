import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  listingId: string;
  title: string;
  authors: string;
  askingPrice: number;
  conditionGrade: string;
  coverImage?: string;
  sellerCity?: string;
  missingPagesDefect?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (listingId: string) => void;
  clearCart: () => void;
  totalPrice: number;
  deliveryFee: number;
  totalOrderAmount: number;
  itemCount: number;
  pincode: string;
  setPincode: (pin: string) => void;
  isPilotIntracity: boolean;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  totalPrice: 0,
  deliveryFee: 40,
  totalOrderAmount: 0,
  itemCount: 0,
  pincode: '585401',
  setPincode: () => {},
  isPilotIntracity: true,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bookloop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [pincode, setPincode] = useState<string>('585401');

  useEffect(() => {
    try {
      localStorage.setItem('bookloop_cart', JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems((prev) => {
      // One unique physical copy per listing (C2C marketplace)
      if (prev.some((i) => i.listingId === newItem.listingId)) {
        return prev;
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (listingId: string) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isPilotIntracity = ['585401', '585402', '585403', '585404'].includes(pincode.trim());
  const deliveryFee = items.length === 0 ? 0 : isPilotIntracity ? 40 : 70;
  const totalPrice = items.reduce((sum, item) => sum + item.askingPrice, 0);
  const totalOrderAmount = totalPrice + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        totalPrice,
        deliveryFee,
        totalOrderAmount,
        itemCount: items.length,
        pincode,
        setPincode,
        isPilotIntracity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
