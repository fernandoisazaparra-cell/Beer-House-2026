import { useState } from "react";
import styles from "./header.module.css";
import { useNavigate, Link } from "react-router-dom";

import {
  IoIosNotifications,
  IoIosMenu,
  RiShoppingCartFill,
  TiArrowSortedDown,
} from "@/ui/icons";

import { useLayout } from "@/features/layout/context";

import { useMediaQuery, BreakPoints } from "@/app/hooks";

import { Logo, User } from "@/shared";

import { useAuth } from "@/app/context";
import { useCart } from "@/app/context/cartUse";

import { API_ROUTES } from "@/app/api";

// Drawer de notificaciones de inventario
import { NotificationDrawer } from "@/components/NotificationDrawer";
// Carrito lateral
import CartDrawer from "@/components/CartDrawer";
// Validación del carrito contra el backend (RN-012 y RN-018)
import { validateCartWithBackend } from "@/services/cartService";

export const Header = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // States
  const { isClose, toggleClose } = useLayout();
  const isCompact = useMediaQuery({ query: BreakPoints.tablet });

  // Estado para controlar el Drawer de Notificaciones y el badge del contador
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [alertsCount, setAlertsCount] = useState<number>(0);

  // Carrito real (CartContext): el mismo que usan las tarjetas de producto
  const {
    cart,
    totalItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
  } = useCart();

  // Checkout: valida el carrito con el backend (RN-012 y RN-018)
  const handleCheckout = async () => {
    const validationResult = await validateCartWithBackend(cart);

    if (!validationResult.success) {
      alert(
        "Atención: Hay cambios en los productos (Stock o Estado Inactivo). Revisa tu carrito.",
      );
      return;
    }

    alert("¡Todo en orden! Redirigiendo a pasarela de pagos...");
  };

  return (
    <header
      className={`${styles.header} ${isCompact ? styles.responsive : ""}`}
    >
      <nav className={styles.nav}>
        <div className={styles.contentLeft}>
          {isCompact ? (
            <Logo />
          ) : (
            <div className={styles.openContainer}>
              <TiArrowSortedDown
                className={`
                                    ${styles.icon} 
                                    ${styles.iconOpen} 
                                    ${isClose ? styles.close : ""}
                                `}
                onClick={() => toggleClose()}
              />
            </div>
          )}
        </div>

        <div className={styles.contentRigth}>
          <div className={styles.ContentOptions}>
            {/* Icono de Campana con Badge del Contador */}
            <div
              style={{
                position: "relative",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
              onClick={() => setIsDrawerOpen(true)}
              title="Notificaciones de Inventario"
            >
              <IoIosNotifications className={styles.icon} />
              {alertsCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-6px",
                    backgroundColor: "#f44336",
                    color: "#ffffff",
                    borderRadius: "50%",
                    padding: "2px 5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    lineHeight: 1,
                    minWidth: "16px",
                    textAlign: "center",
                    boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {alertsCount}
                </span>
              )}
            </div>

            {/* Icono del Carrito interactivo con su badge de cantidad */}
            <div
              style={{
                position: "relative",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
              onClick={() => setIsCartOpen(true)}
              title="Ver Carrito de Compras"
            >
              <RiShoppingCartFill className={styles.icon} />
              {totalItems > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-6px",
                    backgroundColor: "#4f46e5", // Índigo para diferenciarlo de las alertas
                    color: "#ffffff",
                    borderRadius: "50%",
                    padding: "2px 5px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    lineHeight: 1,
                    minWidth: "16px",
                    textAlign: "center",
                    boxShadow: "0 0 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {totalItems}
                </span>
              )}
            </div>

            {isCompact && (
              <IoIosMenu
                className={styles.icon}
                onClick={() => toggleClose()}
              />
            )}
          </div>

          {!isCompact && token ? (
            <div>
              <Link
                to="/perfil"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <User variant="header" />
              </Link>
            </div>
          ) : !isCompact ? (
            <div className={styles.contentLogin}>
              <button
                onClick={() => navigate(API_ROUTES.Auth.Registre)}
                className={styles.login}
              >
                <h2>Iniciar sesión</h2>
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      {/* Panel Lateral Desplegable de Notificaciones */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAlertsCountChange={(count) => setAlertsCount(count)}
      />

      {/* Panel Lateral Desplegable del Carrito */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={(id, newQty) => {
          if (newQty <= 0) removeFromCart(String(id));
          else updateQuantity(String(id), newQty);
        }}
        onRemoveItem={(id) => removeFromCart(String(id))}
        onCheckout={handleCheckout}
      />
    </header>
  );
};