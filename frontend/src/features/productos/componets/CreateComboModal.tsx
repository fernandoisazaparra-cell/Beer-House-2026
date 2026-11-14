import React, { useState, useEffect } from 'react';
import type { Combo } from '../combos.types';

interface CreateComboProps {
  initialCombo?: Combo;
  onSaveCombo: (comboData: Combo) => Promise<void>;
  onClose: () => void;
}

export const CreateComboModal: React.FC<CreateComboProps> = ({ initialCombo, onSaveCombo, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount: '0',
    stock: '10',
    imageUrl: '',
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCombo) {
      setFormData({
        name: initialCombo.name || '',
        description: initialCombo.description || '',
        price: initialCombo.price ? initialCombo.price.toString() : '',
        discount: initialCombo.discount ? initialCombo.discount.toString() : '0',
        stock: initialCombo.stock ? initialCombo.stock.toString() : '10',
        imageUrl: initialCombo.imageUrl || '',
      });
      setImagePreview(initialCombo.imageUrl || '');
    }
  }, [initialCombo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejador para la carga de archivos local (igual que en productos)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData((prev) => ({ ...prev, imageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSaveCombo({
        id: initialCombo ? initialCombo.id : 0,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        discount: Number(formData.discount),
        stock: Number(formData.stock),
        imageUrl: imagePreview || formData.imageUrl || 'https://via.placeholder.com/100?text=Combo',
        status: 'active',
        productsIncluded: initialCombo?.productsIncluded || []
      });
    } catch (err) {
      console.error('Error al guardar combo desde modal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '8px', width: '450px', border: '1px solid #c5a880', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#c5a880' }}>
            {initialCombo ? 'Editar Combo' : 'Crear Nuevo Combo (RN-052)'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Nombre del Combo</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Descripción</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: '4px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Precio Total ($)</label>
              <input
                type="number"
                name="price"
                min="1"
                value={formData.price}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Descuento (%)</label>
              <input
                type="number"
                name="discount"
                min="0"
                max="100"
                value={formData.discount}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Stock</label>
            <input
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
            />
          </div>

          {/* Selector de archivos para la imagen (idéntico a productos) */}
          <div>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Imagen del Combo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              style={{ width: '100%', color: '#bbb', fontSize: '13px' }}
            />
            {imagePreview && (
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Vista previa" 
                  style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #c5a880' }} 
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #888', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 16px', backgroundColor: '#c5a880', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}
            >
              {loading ? 'Guardando...' : 'Guardar y Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};