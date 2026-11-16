
import React from 'react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import type { Combo } from '../combos.types';

interface ComboCardProps {
  combo: Combo;
}

export const ComboCard: React.FC<ComboCardProps> = ({ combo }) => {
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
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
          style={{
            width: '100%',
            height: '160px',
            objectFit: 'cover',
            borderRadius: '6px',
            marginBottom: '10px',
          }}
        />

        <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>
          {combo.name}
        </h4>

        <p style={{ fontSize: '12px', color: '#9ca3af' }}>
          {combo.description}
        </p>

        <div
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#c5a880',
            marginBottom: '10px',
          }}
        >
          {formatCurrency(combo.price)}
        </div>
      </div>

      <div
        style={{
          fontSize: '9px',
          color: '#f87171',
          background: '#1a1a1a',
          padding: '6px',
          borderRadius: '4px',
          border: '1px solid rgba(248, 113, 113, 0.2)',
        }}
      >
        Información académica. Prohibida la venta de alcohol a menores de 18 años.
      </div>
    </div>
  );
};
