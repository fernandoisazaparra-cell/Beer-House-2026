// ==========================================
// 1. IMPORTACIONES Y TIPOS
// ==========================================
import { useState } from 'react';
import { 
  MdOutlineInventory 
} from "@/ui/icons";
interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  status: 'Óptimo' | 'Bajo Stock' | 'Agotado';
}

const initialStock: StockItem[] = [
  { id: 'PROD-001', name: 'Cerveza IPA Artesanal', currentStock: 45, minStock: 10, status: 'Óptimo' },
  { id: 'PROD-002', name: 'Stout Negra 330ml', currentStock: 5, minStock: 15, status: 'Bajo Stock' },
  { id: 'PROD-003', name: 'Lager Rubia Clásica', currentStock: 0, minStock: 20, status: 'Agotado' },
];

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export const InventarioAdmin = () => {
  const [stockList, setStockList] = useState<StockItem[]>(initialStock);

  const handleUpdateStock = (id: string, delta: number) => {
    setStockList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.currentStock + delta);
          let newStatus: StockItem['status'] = 'Óptimo';
          if (newQty === 0) newStatus = 'Agotado';
          else if (newQty <= item.minStock) newStatus = 'Bajo Stock';

          return { ...item, currentStock: newQty, status: newStatus };
        }
        return item;
      })
    );
  };

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      <h2>Control de Inventario</h2>
      <div style={{ background: '#181818', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#aaa' }}>
              <th style={{ padding: '12px' }}>Código</th>
              <th style={{ padding: '12px' }}>Producto</th>
              <th style={{ padding: '12px' }}>Stock Actual</th>
              <th style={{ padding: '12px' }}>Stock Mínimo</th>
              <th style={{ padding: '12px' }}>Estado</th>
              <th style={{ padding: '12px' }}>Ajuste Rápido</th>
            </tr>
          </thead>
          <tbody>
            {stockList.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #282828' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.id}</td>
                <td style={{ padding: '12px' }}>{item.name}</td>
                <td style={{ padding: '12px', fontSize: '16px', fontWeight: 'bold' }}>{item.currentStock} un.</td>
                <td style={{ padding: '12px', color: '#aaa' }}>{item.minStock} un.</td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor:
                        item.status === 'Óptimo' ? '#1b4332' : item.status === 'Bajo Stock' ? '#5c3d11' : '#4a1212',
                      color:
                        item.status === 'Óptimo' ? '#4ade80' : item.status === 'Bajo Stock' ? '#facc15' : '#f87171',
                    }}
                  >
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '12px', display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleUpdateStock(item.id, -1)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>-1</button>
                  <button onClick={() => handleUpdateStock(item.id, 1)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>+1</button>
                  <button onClick={() => handleUpdateStock(item.id, 10)} style={{ background: '#d4af37', color: '#000', border: 'none', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>+10</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  <MdOutlineInventory />
};

export default InventarioAdmin;