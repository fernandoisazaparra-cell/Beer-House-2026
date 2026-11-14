import React, { useState } from 'react';
import { useCart } from '../../app/context/cartUse';
import { useNavigate } from 'react-router-dom';
import './CarritoPage.css';

export const CarritoPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setLoading(true);

      // Estructura para enviar la venta al backend
      const orderPayload = {
        user_id: 1, // Puedes tomarlo de useAuth() si lo tienes configurado
        items: cart.map((item) => ({
          product_id: Number(item.id),
          quantity: item.quantity,
          unit_price: item.price,
        })),
        total_amount: totalPrice,
      };

      const res = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al procesar la compra.');
      }

      alert('¡Pedido realizado y registrado con éxito!');
      clearCart();
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Ocurrió un error inesperado al procesar la compra.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty-container">
        <h2>Tu carrito está vacío 🛒</h2>
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
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="product-img-thumb" />
                  ) : (
                    <div className="product-img-placeholder">🍺</div>
                  )}
                  <span>{item.name}</span>
                </td>
                <td className="price-text">${item.price.toLocaleString('es-CO')}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max={99}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    onKeyDown={handleQuantityKeyDown}
                    className="cart-qty-input"
                  />
                </td>
                <td className="price-text">
                  ${(item.price * item.quantity).toLocaleString('es-CO')}
                </td>
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
            <span className="cart-total-price">${totalPrice.toLocaleString('es-CO')}</span>
          </div>
          <div className="cart-actions-row">
            <button onClick={clearCart} className="btn-secondary" disabled={loading}>
              Vaciar Carrito
            </button>
            <button onClick={handleCheckout} className="btn-primary" disabled={loading}>
              {loading ? 'Procesando...' : 'Finalizar Compra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarritoPage;