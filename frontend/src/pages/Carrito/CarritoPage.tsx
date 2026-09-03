import React from 'react';
import { useCart } from '../../app/context/cartUse';
import './CarritoPage.css';

export const CarritoPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty-container">
        <h2>Tu carrito está vacío </h2>
        <p>Añade algunas cervezas para comenzar tu pedido.</p>
      </div>
    );
  }

  return (
    <div className="cart-page-container">
      <h2>Tu Carrito de Compras</h2>
      <div className="cart-content">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td className="cart-product-info">
                  <img src={item.imageUrl} alt={item.name} className="product-img-thumb" />
                  <span>{item.name}</span>
                </td>
                <td className="price-text">${item.price.toLocaleString()}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    onKeyDown={handleQuantityKeyDown}
                    className="cart-qty-input"
                  />
                </td>
                <td className="price-text">${(item.price * item.quantity).toLocaleString()}</td>
                <td>
                  <button onClick={() => removeFromCart(item.id)} className="btn-danger">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-summary-card">
          <h3>Resumen del Pedido</h3>
          <div className="summary-row">
            <span>Total:</span>
            <span className="cart-total-price">${totalPrice.toLocaleString()}</span>
          </div>
          <div className="cart-actions-row">
            <button onClick={clearCart} className="btn-secondary">
              Vaciar Carrito
            </button>
            <button onClick={() => alert('¡Pedido realizado con éxito!')} className="btn-primary">
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarritoPage;