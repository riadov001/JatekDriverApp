import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { MenuItem } from "./api";

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface CartContextType {
  restaurantId: number | null;
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity: number) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [restaurantId, setRestaurantId] = useState<number | null>(() => {
    const saved = localStorage.getItem("jatek_cart_restaurant");
    return saved ? parseInt(saved, 10) : null;
  });
  
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("jatek_cart_items");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("jatek_cart_restaurant", restaurantId ? restaurantId.toString() : "");
    localStorage.setItem("jatek_cart_items", JSON.stringify(items));
  }, [restaurantId, items]);

  const addItem = (menuItem: MenuItem, quantity: number) => {
    if (restaurantId !== null && restaurantId !== menuItem.restaurantId) {
      if (window.confirm("Adding items from another restaurant will clear your current cart. Continue?")) {
        setRestaurantId(menuItem.restaurantId);
        setItems([{ menuItem, quantity }]);
      }
      return;
    }

    setRestaurantId(menuItem.restaurantId);
    setItems(currentItems => {
      const existing = currentItems.find(i => i.menuItem.id === menuItem.id);
      if (existing) {
        return currentItems.map(i => 
          i.menuItem.id === menuItem.id 
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...currentItems, { menuItem, quantity }];
    });
  };

  const removeItem = (menuItemId: number) => {
    setItems(currentItems => {
      const newItems = currentItems.filter(i => i.menuItem.id !== menuItemId);
      if (newItems.length === 0) {
        setRestaurantId(null);
      }
      return newItems;
    });
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems(currentItems =>
      currentItems.map(i =>
        i.menuItem.id === menuItemId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setRestaurantId(null);
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        restaurantId,
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
