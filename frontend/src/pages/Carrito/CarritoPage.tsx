import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../app/context/cartUse';
import { useAuth } from '@/app/context';
import { createPublicOrder } from '@/features/dashboard/services/ordersService';
import { getErrorMessage } from '@/features/dashboard/services/errorsService';
import './CarritoPage.css';

export const CarritoPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { user } = useAuth();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientName, setClientName] = useState(user?.name ?? '');
  const [clientEmail, setClientEmail] = useState(user?.email ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderCode, setOrderCode] = useState('');

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleOpenCheckout = () => {
    setCheckoutError('');
    setCheckoutOpen(true);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      setCheckoutError('Ingresa tu nombre para continuar.');
      return;
    }

    setSubmitting(true);
    setCheckoutError('');
    try {
      const order = await createPublicOrder({
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        items: cart.map((item) => ({
          product_id: Number(item.id) || null,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      });

      clearCart();
      setCheckoutOpen(false);
      setOrderCode(order.code);
    } catch (err) {
      setCheckoutError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (orderCode) {
    return (
      <div className="cart-empty-container">
        <h2>¡Pedido {orderCode} recibido!</h2>
        <p>
          En breve un asesor confirmará tu pedido por los datos que registraste.
          Puedes seguir comprando mientras tanto.
        </p>
        <Link to="/productos" className="checkout-btn-primary">
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-empty-container">
        <h2>Tu carrito está vacío</h2>
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
            <button onClick={handleOpenCheckout} className="btn-primary">
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <div className="checkout-overlay">
          <div className="checkout-modal">
            <h3>Finalizar Compra</h3>
            <p className="checkout-total">
              Total a pagar: <strong>${totalPrice.toLocaleString()}</strong>
            </p>
            <form onSubmit={handleCheckout}>
              <div className="checkout-field">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="checkout-input"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className="checkout-field">
                <label>Email (opcional)</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="checkout-input"
                  placeholder="tu@email.com"
                />
              </div>
              {checkoutError && <p className="checkout-error">{checkoutError}</p>}
              <div className="checkout-actions">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="checkout-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="checkout-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Enviando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarritoPage;