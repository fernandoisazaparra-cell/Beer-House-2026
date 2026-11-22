import { useState } from 'react';
import type { ReactNode } from 'react';
import { CartContext } from './cartContext';
import type { CartItem } from './cartContext';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  const MAX_QUANTITY = 20; // Debe coincidir con backend/features/sales/domain/rules.py

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      const available = Math.min(product.stock ?? MAX_QUANTITY, MAX_QUANTITY);
      if (available < 1) return prevCart;
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, available) }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true); // Abre el carrito lateral automáticamente al agregar
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(
                Math.floor(quantity),
                Math.min(item.stock ?? MAX_QUANTITY, MAX_QUANTITY)
              ),
            }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};