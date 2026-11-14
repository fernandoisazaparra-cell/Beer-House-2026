import styles from './CartDrawer.module.css'

export interface CartItem {
  id: number | string
  name: string
  price: number
  quantity: number
  status?: string
  stockError?: boolean
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  onUpdateQuantity: (id: number | string, newQty: number) => void
  onRemoveItem: (id: number | string) => void
  onCheckout: () => void
}

const formatCOP = (value: number): string => `$${value.toLocaleString('es-CO')}`

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <div className={styles.overlay}>
      {/* Fondo oscuro translúcido: al hacer clic se cierra */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      <div className={styles.drawerContainer}>
        <div className={styles.drawerContent}>
          {/* Cabecera */}
          <div className={styles.header}>
            <h2 className={styles.title}>Tu Carrito de Compras</h2>
            <button onClick={onClose} className={styles.closeBtn}>
              &times;
            </button>
          </div>

          {/* Lista de productos */}
          <div className={styles.bodyList}>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <span style={{ fontSize: '2rem' }}>🛒</span>
                <p style={{ marginTop: '0.75rem' }}>Tu carrito está vacío.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className={styles.cartItemCard}>
                  <div className={styles.itemHeader}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <span className={styles.itemPrice}>
                      {formatCOP(item.price * item.quantity)}
                    </span>
                  </div>

                  <p className={styles.itemUnit}>Unitario: {formatCOP(item.price)}</p>

                  {/* Alertas de reglas de negocio */}
                  {item.status === 'inactive' && (
                    <span className={styles.errorTextInactive}>⚠️ Producto inactivo (RN-012)</span>
                  )}
                  {item.stockError && (
                    <span className={styles.errorTextStock}>⚠️ Stock insuficiente (RN-018)</span>
                  )}

                  <div className={styles.itemFooter}>
                    <div className={styles.quantityControls}>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className={styles.qtyBtn}
                      >
                        -
                      </button>
                      <span className={styles.qtyNumber}>{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className={styles.qtyBtn}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className={styles.deleteBtn}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pie de página */}
          {cart.length > 0 && (
            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Total estimado:</span>
                <span className={styles.totalAmount}>{formatCOP(total)}</span>
              </div>

              <button onClick={onCheckout} className={styles.checkoutBtn}>
                Proceder al Pago / Validar Carrito
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}