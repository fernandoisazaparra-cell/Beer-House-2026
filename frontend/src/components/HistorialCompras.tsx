import React, { useEffect, useState } from 'react';

interface PurchaseOrder {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

interface HistorialComprasProps {
  userId: number;
}

export const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const HistorialCompras: React.FC<HistorialComprasProps> = ({ userId }) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/purchases/history/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`Error del servidor (${response.status}): No se pudo cargar el historial.`);
        }

        const data = await response.json();
        setOrders(data);
      } catch (err: any) {
        console.error("Detalle del error en historial:", err);
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs font-semibold text-green-400 bg-green-900/40 rounded-md">Aprobado</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs font-semibold text-red-400 bg-red-900/40 rounded-md">Rechazado</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-400 bg-yellow-900/40 rounded-md">Pendiente</span>;
    }
  };

  if (loading) {
    return <div className="text-center py-6 text-amber-400">Cargando historial de compras...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-lg text-center text-red-400 my-4">
        <p className="font-semibold">⚠️ {error}</p>
        <p className="text-xs text-neutral-400 mt-1">Verifica la consola del navegador (F12) para más detalles.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-neutral-900 text-neutral-100 rounded-lg shadow-xl border border-amber-500/20 mt-6">
      <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
        Historial de Compras
      </h2>

      {orders.length === 0 ? (
        <p className="text-neutral-400 text-center py-6">No tienes compras registradas todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-amber-500/80 text-sm">
                <th className="py-3 px-4">ID ORDEN</th>
                <th className="py-3 px-4">PRODUCTO</th>
                <th className="py-3 px-4">CANTIDAD</th>
                <th className="py-3 px-4">TOTAL</th>
                <th className="py-3 px-4">MÉTODO DE PAGO</th>
                <th className="py-3 px-4">ESTADO</th>
                <th className="py-3 px-4">FECHA</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition">
                  <td className="py-3 px-4 font-mono text-sm text-neutral-400">#CLI-{order.id}</td>
                  <td className="py-3 px-4 font-medium">{order.product_name}</td>
                  <td className="py-3 px-4">{order.quantity}</td>
                  <td className="py-3 px-4 text-amber-400 font-semibold">${order.total_amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-neutral-300">{order.payment_method}</td>
                  <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-4 text-sm text-neutral-400">{order.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};