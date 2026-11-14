import React, { useEffect, useState } from 'react';
import {
  getInventoryHistory,
  getProducts,
  getStockAlerts,
  getSuppliers,
  registerAdjustment,
  registerEntry,
  type DetailedStockAlert,
  type InventoryMovement,
} from '../api/inventoryApi';
import styles from './InventoryDashboard.module.css';

export const InventoryDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<DetailedStockAlert[]>([]);
  const [history, setHistory] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados de modales
  const [showEntryModal, setShowEntryModal] = useState<boolean>(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<boolean>(false);

  // Formularios
  const [entryForm, setEntryForm] = useState({
    product_id: 0,
    supplier_id: 0,
    quantity: 1,
    invoice_number: '',
    reason: '',
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    product_id: 0,
    quantity: 1,
    movement_type: 'ADJUSTMENT_OUT' as 'ADJUSTMENT_OUT' | 'ADJUSTMENT_IN',
    reason: '',
  });
  const [formError, setFormError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsData, historyData, productsData, suppliersData] = await Promise.all([
        getStockAlerts(),
        getInventoryHistory(),
        getProducts().catch(() => []),
        getSuppliers().catch(() => []),
      ]);
      setAlerts(alertsData);
      setHistory(historyData);
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error al cargar datos del inventario:', error);
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
    if (!entryForm.product_id || !entryForm.supplier_id || !entryForm.invoice_number.trim()) {
      setFormError('Todos los campos obligatorios deben ser diligenciados (RN-021).');
      return;
    }
    try {
      await registerEntry(entryForm);
      setShowEntryModal(false);
      setEntryForm({ product_id: 0, supplier_id: 0, quantity: 1, invoice_number: '', reason: '' });
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar entrada.';
      setFormError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar ajuste.';
      setFormError(message);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando datos de inventario...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Control de Inventario - Beer House 2026</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowEntryModal(true);
            }}
            className={styles.btnEntry}
          >
            + Registrar Entrada
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setShowAdjustmentModal(true);
            }}
            className={styles.btnAdjustment}
          >
            - Registrar Merma / Ajuste
          </button>
        </div>
      </div>

      {/* Alertas */}
      <section className={styles.cardSection}>
        <h2 className={styles.sectionTitle}>Alertas de Stock Mínimo ({alerts.length})</h2>
        {alerts.length === 0 ? (
          <p className={styles.emptyOk}>Todos los productos mantienen niveles adecuados de existencia.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableHeaderCell}>Producto</th>
                <th className={styles.tableHeaderCell}>Stock Actual</th>
                <th className={styles.tableHeaderCell}>Stock Mínimo</th>
                <th className={styles.tableHeaderCell}>Nivel de Riesgo</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((item) => (
                <tr key={item.product_id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{item.product_name}</td>
                  <td className={item.current_stock === 0 ? styles.stockCritical : styles.stockWarning}>
                    {item.current_stock}
                  </td>
                  <td className={styles.tableCell}>{item.min_stock}</td>
                  <td className={styles.tableCell}>
                    <span
                      className={
                        item.alert_level === 'CRITICO' ? styles.badgeCritical : styles.badgeWarning
                      }
                    >
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
      <section className={styles.cardSection}>
        <h2 className={styles.sectionTitle}>Historial de Movimientos de Inventario</h2>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeaderRow}>
              <th className={styles.tableHeaderCell}>Fecha</th>
              <th className={styles.tableHeaderCell}>Tipo</th>
              <th className={styles.tableHeaderCell}>Producto</th>
              <th className={styles.tableHeaderCell}>Cantidad</th>
              <th className={styles.tableHeaderCell}>Soporte / Motivo</th>
            </tr>
          </thead>
          <tbody>
            {history.map((mov) => (
              <tr key={mov.id} className={styles.tableRow}>
                <td className={styles.tableCell}>{new Date(mov.created_at).toLocaleString()}</td>
                <td className={styles.movementType}>{mov.movement_type}</td>
                <td className={styles.tableCell}>{mov.product_name}</td>
                <td className={mov.movement_type === 'ENTRY' ? styles.qtyEntry : styles.qtyOut}>
                  {mov.movement_type === 'ENTRY' ? `+${mov.quantity}` : `-${mov.quantity}`}
                </td>
                <td className={styles.tableCell}>
                  {mov.invoice_number || mov.reason || 'Sin observación'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Modal Entrada */}
      {showEntryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Registrar Entrada por Compra</h3>
            {formError && <p className={styles.formError}>{formError}</p>}
            <form onSubmit={handleCreateEntry}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Producto</label>
                <select
                  value={entryForm.product_id}
                  onChange={(e) => setEntryForm({ ...entryForm, product_id: Number(e.target.value) })}
                  className={styles.input}
                >
                  <option value={0}>Seleccione un producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Proveedor</label>
                <select
                  value={entryForm.supplier_id}
                  onChange={(e) => setEntryForm({ ...entryForm, supplier_id: Number(e.target.value) })}
                  className={styles.input}
                >
                  <option value={0}>Seleccione un proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={entryForm.quantity}
                  onChange={(e) => setEntryForm({ ...entryForm, quantity: Number(e.target.value) })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroupLast}>
                <label className={styles.label}>Número de Factura</label>
                <input
                  type="text"
                  value={entryForm.invoice_number}
                  onChange={(e) => setEntryForm({ ...entryForm, invoice_number: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnSaveEntry}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Merma */}
      {showAdjustmentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Registrar Merma / Ajuste</h3>
            {formError && <p className={styles.formError}>{formError}</p>}
            <form onSubmit={handleCreateAdjustment}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Producto</label>
                <select
                  value={adjustmentForm.product_id}
                  onChange={(e) =>
                    setAdjustmentForm({ ...adjustmentForm, product_id: Number(e.target.value) })
                  }
                  className={styles.input}
                >
                  <option value={0}>Seleccione un producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={adjustmentForm.quantity}
                  onChange={(e) =>
                    setAdjustmentForm({ ...adjustmentForm, quantity: Number(e.target.value) })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroupLast}>
                <label className={styles.label}>Motivo (Soporte Obligatorio)</label>
                <textarea
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className={styles.textarea}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className={styles.btnCancel}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.btnSaveAdjustment}>
                  Aplicar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};