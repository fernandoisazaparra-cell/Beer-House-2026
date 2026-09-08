import { useEffect, useState } from 'react';
import './AdminShared.css';
import './VentasAdmin.css';
import { 
  FcSalesPerformance 
} from '@/ui/icons';
import {
  getOrders,
  getOrderDetail,
  createOrder,
  type Order
} from '@/features/dashboard/services/ordersService';
import {
  getProductsAdmin,
  type Product
} from '@/features/dashboard/services/productsService';
import {
  getErrorMessage
} from '@/features/dashboard/services/errorsService';
import {
  formatCurrency,
  formatDate
} from '@/features/dashboard/services/dashboardStatsService';

interface NewSaleForm {
  client: string;
  email: string;
  paymentMethod: string;
  productId: string;
  quantity: string;
  unitPrice: string;
}

export const VentasAdmin = () => {
  const [sales, setSales] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const [newSale, setNewSale] = useState<NewSaleForm>({
    client: '',
    email: '',
    paymentMethod: 'Efectivo',
    productId: '',
    quantity: '1',
    unitPrice: '',
  });

  const totalIncome = sales.reduce((acc, sale) => acc + sale.total, 0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersData, productsData] = await Promise.all([
          getOrders(),
          getProductsAdmin(),
        ]);
        setError('');
        setSales(ordersData);
        setProducts(productsData);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewSale((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'productId') {
        const product = products.find((p) => p.id === Number(value));
        if (product) {
          next.unitPrice = String(product.price);
        }
      }
      return next;
    });
  };

  const selectedProduct = products.find((p) => p.id === Number(newSale.productId));

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();

    const product = selectedProduct;
    const quantity = Number(newSale.quantity);
    const unitPrice = Number(newSale.unitPrice);

    if (!newSale.client.trim() || !product || !quantity || unitPrice < 0) {
      alert('Completa el cliente, el producto, la cantidad y el precio unitario.');
      return;
    }
    if (product.stock < quantity) {
      alert(`Stock insuficiente para "${product.name}" (disponible: ${product.stock}).`);
      return;
    }

    setSaving(true);
    try {
      const created = await createOrder({
        client_name: newSale.client.trim(),
        client_email: newSale.email.trim() || null,
        payment_method: newSale.paymentMethod,
        status: 'completado',
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_price: unitPrice,
          },
        ],
      });
      setSales((prev) => [created, ...prev]);

      setNewSale({
        client: '',
        email: '',
        paymentMethod: 'Efectivo',
        productId: '',
        quantity: '1',
        unitPrice: '',
      });
      setIsNewSaleOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDetail = async (sale: Order) => {
    setSelectedSale(sale);
    try {
      const detail = await getOrderDetail(sale.id);
      setSelectedSale(detail);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>Histórico de Ventas</h2>
        </div>
        <div className="sales-header-actions">
          <div className="sales-summary-card">
            <span className="summary-label">Total Ingresos:</span>
            <span className="sales-total-amount">
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <button
            onClick={() => setIsNewSaleOpen(true)}
            className="btn-primary"
          >
            + Registrar Venta
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-container">
        {loading ? (
          <p className="admin-loading">Cargando ventas...</p>
        ) : sales.length === 0 ? (
          <p className="admin-empty">No hay ventas registradas.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Recibo</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Método de Pago</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td style={{ fontWeight: 'bold' }}>{sale.code}</td>
                  <td>{formatDate(sale.created_at)}</td>
                  <td>{sale.client_name}</td>
                  <td>{sale.payment_method || '—'}</td>
                  <td className="price-text">{formatCurrency(sale.total)}</td>
                  <td>
                    <button
                      onClick={() => handleOpenDetail(sale)}
                      className="btn-secondary"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Nueva Venta */}
      {isNewSaleOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Registrar Nueva Venta</h3>
            <form onSubmit={handleAddSale} className="form-group">
              <div className="form-field">
                <label>Cliente</label>
                <input
                  type="text"
                  name="client"
                  value={newSale.client}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Correo (opcional)</label>
                <input
                  type="email"
                  name="email"
                  value={newSale.email}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Método de Pago</label>
                <select
                  name="paymentMethod"
                  value={newSale.paymentMethod}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Nequi / Transferencia">Nequi / Transferencia</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                </select>
              </div>

              <div className="form-field">
                <label>Producto</label>
                <select
                  name="productId"
                  value={newSale.productId}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {formatCurrency(product.price)} (stock: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && selectedProduct.stock === 0 && (
                <p className="admin-error">Este producto está agotado.</p>
              )}

              <div className="form-row">
                <div className="form-field">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max={selectedProduct?.stock ?? 1}
                    value={newSale.quantity}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>Precio Unitario ($)</label>
                  <input
                    type="number"
                    name="unitPrice"
                    min="0"
                    step="0.01"
                    value={newSale.unitPrice}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsNewSaleOpen(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle de Venta */}
      {selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Detalle Recibo: {selectedSale.code}</h3>
            <div className="sale-detail-info">
              <p><strong>Cliente:</strong> {selectedSale.client_name}</p>
              <p><strong>Fecha:</strong> {formatDate(selectedSale.created_at)}</p>
              <p><strong>Método de Pago:</strong> {selectedSale.payment_method || '—'}</p>
            </div>

            <table className="admin-table detail-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sale-detail-total">
              Total: <span>{formatCurrency(selectedSale.total)}</span>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  <FcSalesPerformance />
};

export default VentasAdmin;