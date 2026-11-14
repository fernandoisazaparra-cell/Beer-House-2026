import React from 'react';
import { useAuth } from '@/app/context/authUse';
import { useCart } from '@/app/context/cartUse';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import type { Combo } from '../combos.types';

interface ComboCardProps {
  combo: Combo;
}

export const ComboCard: React.FC<ComboCardProps> = ({ combo }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const isAdminOrSupervisor = user?.rol === 'admin' || user?.rol === 'supervisor';

  const handleAddCombo = () => {
    if (isAdminOrSupervisor) return;

    addToCart({
      id: String(combo.id),
      name: `[Combo] ${combo.name}`,
      price: combo.price,
      imageUrl: combo.imageUrl,
    });
  };

  return (
    <div
      style={{
        background: '#121212',
        border: '1px solid rgba(197, 168, 128, 0.3)',
        borderRadius: '8px',
        padding: '15px',
        color: '#fff',
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        {combo.discount > 0 && (
          <span
            style={{
              background: '#c5a880',
              color: '#000',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            OFERTA {combo.discount}% OFF
          </span>
        )}

        <img
          src={combo.imageUrl}
          alt={combo.name}
          style={{
            width: '100%',
            height: '160px',
            objectFit: 'cover',
            borderRadius: '6px',
            marginBottom: '10px',
          }}
        />

        <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
          {combo.name}
        </h4>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 10px 0', minHeight: '30px' }}>
          {combo.description}
        </p>

        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c5a880', marginBottom: '10px' }}>
          {formatCurrency(combo.price)}
        </div>
      </div>

      <div>
        {/* RN-053: Advertencia legal obligatoria visible en contenidos publicados */}
        <div
          style={{
            fontSize: '9px',
            color: '#f87171',
            background: '#1a1a1a',
            padding: '6px',
            borderRadius: '4px',
            marginBottom: '10px',
            border: '1px solid rgba(248, 113, 113, 0.2)',
          }}
        >
          ⚠ Prohibida su venta a menores de 18 años. El exceso de alcohol es perjudicial para la salud.
        </div>

        {/* BOTÓN RESTRINGIDO SEGÚN ROL */}
        {isAdminOrSupervisor ? (
          <button
            type="button"
            disabled
            style={{
              width: '100%',
              background: 'linear-gradient(180deg, #1f1910 0%, #14100b 100%)',
              border: '1px solid #57401f',
              color: '#a08355',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'not-allowed',
              fontWeight: '600',
              fontSize: '10px',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            Vista de Administrador
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddCombo}
            style={{
              width: '100%',
              background: '#c5a880',
              color: '#000',
              fontWeight: '600',
              padding: '8px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            AGREGAR COMBO AL CARRITO
          </button>
        )}
      </div>
    </div>
  );
};