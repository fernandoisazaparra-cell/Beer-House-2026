import React, { useEffect, useState } from 'react';
import { authFetch } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";


interface Supplier {
  id: number;
  name: string;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
}

interface OrderItem {
  product_id: number;
  quantity: number;
  unit_cost: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([{ product_id: 0, quantity: 1, unit_cost: 0 }]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 1. Proveedores activos
      authFetch(`${API_URL}/suppliers`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            setSuppliers(data.filter((s: Supplier) => s.is_active));
          } else {
            setSuppliers([]);
          }
        })
        .catch(() => setSuppliers([]));

      // 2. Productos
      authFetch(`${API_URL}/products/`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setProducts(Array.isArray(data) ? data : []))
        .catch(() => setProducts([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { product_id: 0, quantity: 1, unit_cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return; // Mantiene al menos 1 fila
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: number) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSupplier) {
      setError('Debes seleccionar un proveedor.');
      return;
    }

    const invalidItems = items.some((i) => i.product_id === 0 || i.quantity <= 0 || i.unit_cost <= 0);
    if (invalidItems) {
      setError('Todos los productos deben tener ítem seleccionado, cantidad > 0 y costo > 0.');
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/purchases/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: Number(selectedSupplier),
          notes,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar la orden de compra.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#1e1e1e',
          color: '#fff',
          padding: '24px',
          borderRadius: '8px',
          width: '640px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '18px', fontSize: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
          Generar Orden de Compra
        </h2>

        {error && (
          <div style={{ backgroundColor: '#d32f2f', color: '#fff', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* SELECCIÓN DE PROVEEDOR */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc', fontWeight: 'bold' }}>
              Proveedor (Solo activos)
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
                outline: 'none',
              }}
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* DETALLE DE PRODUCTOS CON ENCABEZADOS DE COLUMNA */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>
              Detalle de Productos
            </label>

            {/* ENCABEZADOS DE COLUMNA */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '6px', paddingRight: '28px' }}>
              <span style={{ flex: 3, fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>Producto</span>
              <span style={{ flex: 1.2, fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>Cantidad</span>
              <span style={{ flex: 1.5, fontSize: '12px', color: '#aaa', fontWeight: 'bold' }}>Costo Unit. ($)</span>
            </div>

            {/* FILAS DE PRODUCTOS */}
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(index, 'product_id', Number(e.target.value))}
                  style={{ flex: 3, padding: '8px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                >
                  <option value={0}>-- Seleccionar Producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Cant."
                  value={item.quantity || ''}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  style={{ flex: 1.2, padding: '8px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Costo U."
                  value={item.unit_cost || ''}
                  onChange={(e) => handleItemChange(index, 'unit_cost', Number(e.target.value))}
                  style={{ flex: 1.5, padding: '8px', backgroundColor: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                />

                {/* BOTÓN PARA QUITAR FILA */}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    style={{
                      backgroundColor: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    title="Eliminar fila"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              style={{
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: '4px',
              }}
            >
              + Agregar otro producto
            </button>
          </div>

          {/* OBSERVACIONES */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#ccc', fontWeight: 'bold' }}>
              Observaciones
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe notas adicionales sobre esta orden..."
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* ACCIONES */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #333', paddingTop: '15px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#555',
                color: '#fff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#2e7d32',
                color: '#fff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Guardar Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};