import React, { useState } from 'react';
import './VentasAdmin.css';
import { 
  FcSalesPerformance 
} from '@/ui/icons';

export interface SaleItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  date: string;
  client: string;
  paymentMethod: string;
  amount: number;
  items: SaleItem[];
}

const initialSales: Sale[] = [
  {
    id: 'VTA-101',
    date: '2026-08-28',
    client: 'Carlos Pérez',
    paymentMethod: 'Tarjeta de Crédito',
    amount: 85000,
    items: [{ productName: 'Cerveza IPA', quantity: 5, unitPrice: 17000 }],
  },
  {
    id: 'VTA-102',
    date: '2026-08-29',
    client: 'Enana',
    paymentMethod: 'Nequi / Transferencia',
    amount: 120000,
    items: [
      { productName: 'Whisky 12 Años', quantity: 1, unitPrice: 90000 },
      { productName: 'Cerveza Stout', quantity: 2, unitPrice: 15000 },
    ],
  },
];

export const VentasAdmin = () => {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Estado formulario venta
  const [newSale, setNewSale] = useState({
    client: '',
    paymentMethod: 'Efectivo',
    productName: '',
    quantity: 1,
    unitPrice: '',
  });

  const totalIncome = sales.reduce((acc, sale) => acc + sale.amount, 0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setNewSale({ ...newSale, [e.target.name]: e.target.value });
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSale.client || !newSale.productName || !newSale.unitPrice) return;

    const computedAmount = Number(newSale.quantity) * Number(newSale.unitPrice);
    const createdSale: Sale = {
      id: `VTA-10${sales.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      client: newSale.client,
      paymentMethod: newSale.paymentMethod,
      amount: computedAmount,
      items: [
        {
          productName: newSale.productName,
          quantity: Number(newSale.quantity),
          unitPrice: Number(newSale.unitPrice),
        },
      ],
    };

    setSales([createdSale, ...sales]);
    setNewSale({
      client: '',
      paymentMethod: 'Efectivo',
      productName: '',
      quantity: 1,
      unitPrice: '',
    });
    setIsNewSaleOpen(false);
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
              ${totalIncome.toLocaleString()}
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

      <div className="admin-table-container">
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
                <td style={{ fontWeight: 'bold' }}>{sale.id}</td>
                <td>{sale.date}</td>
                <td>{sale.client}</td>
                <td>{sale.paymentMethod}</td>
                <td className="price-text">${sale.amount.toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => setSelectedSale(sale)}
                    className="btn-secondary"
                  >
                    Ver Detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <input
                  type="text"
                  name="productName"
                  value={newSale.productName}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
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
                    min="1"
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
                <button type="submit" className="btn-primary">
                  Guardar Venta
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
            <h3 className="modal-title">Detalle Recibo: {selectedSale.id}</h3>
            <div className="sale-detail-info">
              <p><strong>Cliente:</strong> {selectedSale.client}</p>
              <p><strong>Fecha:</strong> {selectedSale.date}</p>
              <p><strong>Método de Pago:</strong> {selectedSale.paymentMethod}</p>
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
                {selectedSale.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>${(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sale-detail-total">
              Total: <span>${selectedSale.amount.toLocaleString()}</span>
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