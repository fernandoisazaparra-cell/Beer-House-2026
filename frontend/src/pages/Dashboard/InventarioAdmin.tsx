// ==========================================
// 1. IMPORTACIONES Y TIPOS
// ==========================================
import { useEffect, useState } from 'react';
import './AdminShared.css';
import { 
  MdOutlineInventory 
} from "@/ui/icons";
import {
  getProductsAdmin,
  adjustStock,
  type Product
} from '@/features/dashboard/services/productsService';
import {
  getErrorMessage
} from '@/features/dashboard/services/errorsService';

type StockStatus = 'Óptimo' | 'Bajo Stock' | 'Agotado';

const getStatus = (item: Product): StockStatus => {
  if (item.stock === 0) return 'Agotado';
  if (item.stock <= item.min_stock) return 'Bajo Stock';
  return 'Óptimo';
};

const STATUS_CLASS: Record<StockStatus, string> = {
  'Óptimo': 'optimo',
  'Bajo Stock': 'bajo-stock',
  'Agotado': 'agotado',
};

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export const InventarioAdmin = () => {
  const [stockList, setStockList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getProductsAdmin();
        setError('');
        setStockList(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleUpdateStock = async (id: number, delta: number) => {
    try {
      const updated = await adjustStock(id, delta);
      setStockList((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Control de Inventario</h2>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-container">
        {loading ? (
          <p className="admin-loading">Cargando inventario...</p>
        ) : stockList.length === 0 ? (
          <p className="admin-empty">No hay productos registrados.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Estado</th>
                <th>Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody>
              {stockList.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 'bold' }}>#{item.id}</td>
                    <td>{item.name}</td>
                    <td style={{ fontSize: '16px', fontWeight: 'bold' }}>{item.stock} un.</td>
                    <td style={{ color: '#aaa' }}>{item.min_stock} un.</td>
                    <td>
                      <span className={`status-badge ${STATUS_CLASS[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleUpdateStock(item.id, -1)}
                        style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleUpdateStock(item.id, 1)}
                        style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleUpdateStock(item.id, 10)}
                        style={{ background: '#d4af37', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        +10
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
  <MdOutlineInventory />
};

export default InventarioAdmin;