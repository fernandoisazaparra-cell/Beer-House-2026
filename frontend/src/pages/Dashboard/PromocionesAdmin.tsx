import { useEffect, useState } from 'react';
import './AdminShared.css';
import './PromocionesAdmin.css';
import { 
  FaTag 
} from '@/ui/icons';
import {
  getPromotions,
  createPromotion,
  togglePromotion,
  deletePromotion,
  type Promotion
} from '@/features/dashboard/services/promotionsService';
import {
  getErrorMessage
} from '@/features/dashboard/services/errorsService';
import {
  formatDate
} from '@/features/dashboard/services/dashboardStatsService';

interface PromotionForm {
  code: string;
  discountPercent: string;
  expiresAt: string;
}

const emptyForm: PromotionForm = { code: '', discountPercent: '', expiresAt: '' };

export const PromocionesAdmin = () => {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PromotionForm>(emptyForm);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getPromotions();
        setError('');
        setPromos(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleToggle = async (promo: Promotion) => {
    try {
      const updated = await togglePromotion(promo.id);
      setPromos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (promo: Promotion) => {
    if (!window.confirm(`¿Eliminar el cupón "${promo.code}"?`)) return;

    try {
      await deletePromotion(promo.id);
      setPromos((prev) => prev.filter((p) => p.id !== promo.id));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    const discount = Number(formData.discountPercent);
    if (!formData.code.trim() || !discount || discount < 0 || discount > 100) {
      alert('Ingresa un código y un descuento entre 0 y 100.');
      return;
    }

    setSaving(true);
    try {
      const created = await createPromotion({
        code: formData.code.trim(),
        discount_percent: discount,
        active: true,
        expires_at: formData.expiresAt || null,
      });
      setPromos((prev) => [...prev, created]);
      setFormData(emptyForm);
      setIsModalOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Promociones y Cupones</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          + Crear Cupón
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-container">
        {loading ? (
          <p className="admin-loading">Cargando promociones...</p>
        ) : promos.length === 0 ? (
          <p className="admin-empty">No hay promociones registradas.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código Cupón</th>
                <th>Descuento (%)</th>
                <th>Expira</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id}>
                  <td className="coupon-code">{p.code}</td>
                  <td>{p.discount_percent}% OFF</td>
                  <td style={{ color: '#aaa' }}>{formatDate(p.expires_at)}</td>
                  <td>
                    <span className={`status-badge ${p.active ? 'completado' : 'cancelado'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleToggle(p)} className="btn-secondary">
                        {p.active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => handleDelete(p)} className="btn-danger">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Nuevo Cupón</h3>
            <form onSubmit={handleAdd} className="form-group">
              <div className="form-field">
                <label>Código</label>
                <input
                  type="text"
                  placeholder="Código (Ej: DESCUENTO10)"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Porcentaje de descuento (%)</label>
                <input
                  type="number"
                  placeholder="Porcentaje (%)"
                  min="0"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label>Fecha de expiración (opcional)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
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