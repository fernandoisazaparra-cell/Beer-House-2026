import React, { useState } from 'react';
import { useCart } from '../../app/context/cartUse';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/app/api';
import { authFetch } from '@/shared/lib/authFetch';
import './CarritoPage.css';

export const CarritoPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
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

      // Elusuario se toma del token y el precio se recalcula en el backend (RF-043).
      const orderPayload = {
        items: cart.map((item) => ({
          product_id: Number(item.id),
          quantity: item.quantity,
        })),
        expected_total: totalPrice,
        payment_method: paymentMethod,
      };

      const res = await authFetch(`${API_URL}/sales/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const issues = Array.isArray(data.issues)
          ? data.issues.map((issue: { message?: string }) => issue.message).filter(Boolean).join('\n')
          : '';
        throw new Error(
          `${data.error || data.message || 'Error al procesar la compra.'}${issues ? `\n${issues}` : ''}`
        );
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
                    max={Math.min(item.stock ?? 20, 20)}
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
          <div className="summary-row">
            <label htmlFor="payment-method">Método de pago:</label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="cart-qty-input"
            >
              <option value="CARD">Tarjeta</option>
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="PSE">PSE</option>
              <option value="NEQUI">Nequi</option>
            </select>
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