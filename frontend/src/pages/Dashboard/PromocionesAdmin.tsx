import React, { useState } from 'react';
import './PromocionesAdmin.css';
import { 
  FaTag 
} from '@/ui/icons';

interface Promotion {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
}

const initialPromos: Promotion[] = [
  { id: 'PRM-01', code: 'BEERHAPPY', discountPercent: 15, active: true },
];

export const PromocionesAdmin = () => {
  const [promos, setPromos] = useState<Promotion[]>(initialPromos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', discountPercent: '' });

  const handleToggle = (id: string) => {
    setPromos(prev =>
      prev.map(p => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.code || !newPromo.discountPercent) return;
    setPromos([
      ...promos,
      {
        id: `PRM-0${promos.length + 1}`,
        code: newPromo.code.toUpperCase(),
        discountPercent: Number(newPromo.discountPercent),
        active: true,
      },
    ]);
    setNewPromo({ code: '', discountPercent: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Promociones y Cupones</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          + Crear Cupón
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Código Cupón</th>
              <th>Descuento (%)</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id}>
                <td className="coupon-code">{p.code}</td>
                <td>{p.discountPercent}% OFF</td>
                <td>
                  <span className={`status-badge ${p.active ? 'completado' : 'cancelado'}`}>
                    {p.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleToggle(p.id)} className="btn-secondary">
                    {p.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Nuevo Cupón</h3>
            <form onSubmit={handleAdd} className="form-group">
              <input
                type="text"
                placeholder="Código (Ej: DESCUENTO10)"
                value={newPromo.code}
                onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value })}
                required
                className="form-input"
              />
              <input
                type="number"
                placeholder="Porcentaje (%)"
                value={newPromo.discountPercent}
                onChange={(e) => setNewPromo({ ...newPromo, discountPercent: e.target.value })}
                required
                className="form-input"
              />
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  <FaTag />
};

export default PromocionesAdmin;