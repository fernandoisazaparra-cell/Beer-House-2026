import React, { useEffect, useState } from 'react';
import { 
  getStockAlerts, 
  getInventoryHistory, 
  registerEntry, 
  registerAdjustment, 
  getProducts, 
  getSuppliers,
  type StockAlert, 
  type InventoryMovement 
} from '../api/inventoryApi';

export const InventoryDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [history, setHistory] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados de modales
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<boolean>(false);

  // Formularios
  const [entryForm, setEntryForm] = useState({ product_id: 0, supplier_id: 0, quantity: 1, invoice_number: '', reason: '' });
  const [adjustmentForm, setAdjustmentForm] = useState({ product_id: 0, quantity: 1, movement_type: 'ADJUSTMENT_OUT' as 'ADJUSTMENT_OUT' | 'ADJUSTMENT_IN', reason: '' });
  const [formError, setFormError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsData, historyData, productsData, suppliersData] = await Promise.all([
        getStockAlerts(),
        getInventoryHistory(),
        getProducts().catch(() => []),
        getSuppliers().catch(() => [])
      ]);
      setAlerts(alertsData);
      setHistory(historyData);
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error al cargar datos del inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!entryForm.product_id || !entryForm.supplier_id || !entryForm.invoice_number) {
      setFormError('Todos los campos obligatorios deben ser diligenciados (RN-021).');
      return;
    }
    try {
      await registerEntry(entryForm);
      setShowEntryModal(false);
      setEntryForm({ product_id: 0, supplier_id: 0, quantity: 1, invoice_number: '', reason: '' });
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Error al registrar entrada.');
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!adjustmentForm.product_id || !adjustmentForm.reason.trim()) {
      setFormError('Debe ingresar un motivo para el ajuste (RN-025).');
      return;
    }
    try {
      await registerAdjustment(adjustmentForm);
      setShowAdjustmentModal(false);
      setAdjustmentForm({ product_id: 0, quantity: 1, movement_type: 'ADJUSTMENT_OUT', reason: '' });
      await loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Error al registrar ajuste.');
    }
  };

  if (loading) return <div style={{ padding: '20px', color: '#ffffff' }}>Cargando datos de inventario...</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#121212', color: '#ffffff', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Control de Inventario - Beer House 2026</h1>
        <div>
          <button 
            onClick={() => { setFormError(''); setShowEntryModal(true); }}
            style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px', fontWeight: 'bold' }}
          >
            + Registrar Entrada
          </button>
          <button 
            onClick={() => { setFormError(''); setShowAdjustmentModal(true); }}
            style={{ backgroundColor: '#c62828', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            - Registrar Merma / Ajuste
          </button>
        </div>
      </div>

      {/* Alertas */}
      <section style={{ marginBottom: '30px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '6px', border: '1px solid #2a2a2a' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Alertas de Stock Mínimo ({alerts.length})</h2>
        {alerts.length === 0 ? (
          <p style={{ color: '#4caf50' }}>Todos los productos mantienen niveles adecuados de existencia.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#aaa' }}>
                <th style={{ padding: '10px' }}>Producto</th>
                <th style={{ padding: '10px' }}>Stock Actual</th>
                <th style={{ padding: '10px' }}>Stock Mínimo</th>
                <th style={{ padding: '10px' }}>Nivel de Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px' }}>{item.name}</td>
                  <td style={{ padding: '10px', color: item.stock === 0 ? '#f44336' : '#ff9800', fontWeight: 'bold' }}>{item.stock}</td>
                  <td style={{ padding: '10px' }}>{item.min_stock}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      backgroundColor: item.alert_level === 'CRITICO' ? '#b71c1c' : '#e65100',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {item.alert_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Historial */}
      <section style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '6px', border: '1px solid #2a2a2a' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Historial de Movimientos de Inventario</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#aaa' }}>
              <th style={{ padding: '10px' }}>Fecha</th>
              <th style={{ padding: '10px' }}>Tipo</th>
              <th style={{ padding: '10px' }}>Producto</th>
              <th style={{ padding: '10px' }}>Cantidad</th>
              <th style={{ padding: '10px' }}>Soporte / Motivo</th>
            </tr>
          </thead>
          <tbody>
            {history.map((mov) => (
              <tr key={mov.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '10px' }}>{new Date(mov.created_at).toLocaleString()}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{mov.movement_type}</td>
                <td style={{ padding: '10px' }}>{mov.product_name}</td>
                <td style={{ padding: '10px', color: mov.movement_type === 'ENTRY' ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                  {mov.movement_type === 'ENTRY' ? `+${mov.quantity}` : `-${mov.quantity}`}
                </td>
                <td style={{ padding: '10px' }}>{mov.invoice_number || mov.reason || 'Sin observación'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Modal Entrada */}
      {showEntryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '8px', width: '400px', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0 }}>Registrar Entrada por Compra</h3>
            {formError && <p style={{ color: '#f44336', fontSize: '13px' }}>{formError}</p>}
            <form onSubmit={handleCreateEntry}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Producto</label>
                <select 
                  value={entryForm.product_id} 
                  onChange={(e) => setEntryForm({ ...entryForm, product_id: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2b2b2b', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                >
                  <option value={0}>Seleccione un producto</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Proveedor</label>
                <select 
                  value={entryForm.supplier_id} 
                  onChange={(e) => setEntryForm({ ...entryForm, supplier_id: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2b2b2b', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                >
                  <option value={0}>Seleccione un proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Cantidad</label>
                <input 
                  type="number" min={1} 
                  value={entryForm.quantity} 
                  onChange={(e) => setEntryForm({ ...entryForm, quantity: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2b2b2b', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Número de Factura</label>
                <input 
                  type="text" 
                  value={entryForm.invoice_number} 
                  onChange={(e) => setEntryForm({ ...entryForm, invoice_number: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2b2b2b', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowEntryModal(false)} style={{ padding: '8px 12px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#2e7d32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Merma */}
      {showAdjustmentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '8px', width: '400px', border: '1px solid #333' }}>
            <h3 style={{ marginTop: 0 }}>Registrar Merma / Ajuste</h3>
            {formError && <p style={{ color: '#f44336', fontSize: '13px' }}>{formError}</p>}
            <form onSubmit={handleCreateAdjustment}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Producto</label>
                <select 
                  value={adjustmentForm.product_id} 
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, product_id: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2b2b2b', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                >
                  <option value={0}>Seleccione un producto</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Cantidad</label>
                <input 
                  type="number" min={1} 
                  value={adjustmentForm.quantity} 
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2b2b2b', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Motivo (Soporte Obligatorio)</label>
                <textarea 
                  value={adjustmentForm.reason} 
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#2b2b2b', color: '#fff', border: '1px solid #444', borderRadius: '4px', height: '60px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowAdjustmentModal(false)} style={{ padding: '8px 12px', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#c62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Aplicar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};