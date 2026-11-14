import React, { useEffect, useState } from "react";
import { getPhysicalCounts, applyStockAdjustment } from "../../features/inventory/api/inventoryApi";
import { PhysicalCountModal } from "../../features/inventory/components/PhysicalCountModal";
import { authFetch } from "@/shared/lib/authFetch";

interface PhysicalCount {
  id: number;
  product_id: number;
  product_name: string;
  system_stock: number;
  physical_stock: number;
  difference: number;
  difference_percentage: number;
  signed_act_url?: string;
  user_id: number;
  count_date: string;
}

export const PhysicalCountsDashboard: React.FC = () => {
  const [counts, setCounts] = useState<PhysicalCount[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar conteos
      const countsData = await getPhysicalCounts();
      setCounts(Array.isArray(countsData) ? countsData : []);

      // Cargar catálogo de productos para el modal
      const resProducts = await authFetch("http://localhost:5000/api/products/")
      if (resProducts.ok) {
        const prodData = await resProducts.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      }
    } catch (err) {
      console.error("Error al cargar auditorías de inventario:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyAdjustment = async (count: PhysicalCount) => {
    if (!window.confirm(`¿Desea aplicar el ajuste del conteo #${count.id} al stock real del producto '${count.product_name}'?`)) {
      return;
    }

    try {
      await applyStockAdjustment(count.id, "Supervisor", "Usuario Sistema");
      alert("Ajuste aplicado correctamente al stock real.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al aplicar el ajuste de inventario.");
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#121212", color: "#fff", minHeight: "100vh" }}>
      {/* Cabecera */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Auditoría y Conteos Físicos </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          + Registrar Conteo Físico
        </button>
      </div>

      {/* Tabla de Registros */}
      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#1e1e1e", borderRadius: "6px", overflow: "hidden" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333", textAlign: "left", color: "#aaa" }}>
            <th style={{ padding: "12px" }}>ID Conteo</th>
            <th style={{ padding: "12px" }}>Producto</th>
            <th style={{ padding: "12px" }}>Stock Sistema</th>
            <th style={{ padding: "12px" }}>Stock Físico</th>
            <th style={{ padding: "12px" }}>Diferencia</th>
            <th style={{ padding: "12px" }}>Variación %</th>
            <th style={{ padding: "12px" }}>Soporte / Acta</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={8} style={{ padding: "20px", textAlign: "center", color: "#aaa" }}>
                Cargando historial de auditorías...
              </td>
            </tr>
          )}

          {!loading && counts.map((c) => {
            const isHighDiscrepancy = c.difference_percentage > 2.0;
            return (
              <tr key={c.id} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>#{c.id}</td>
                <td style={{ padding: "12px" }}>{c.product_name}</td>
                <td style={{ padding: "12px" }}>{c.system_stock}</td>
                <td style={{ padding: "12px", fontWeight: "bold" }}>{c.physical_stock}</td>
                <td style={{ padding: "12px", color: c.difference < 0 ? "#f44336" : c.difference > 0 ? "#4caf50" : "#fff" }}>
                  {c.difference > 0 ? `+${c.difference}` : c.difference}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ backgroundColor: isHighDiscrepancy ? "#c62828" : "#2e7d32", padding: "3px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: "bold" }}>
                    {c.difference_percentage.toFixed(2)}%
                  </span>
                </td>
                <td style={{ padding: "12px", fontSize: "12px", color: "#aaa" }}>
                  {c.signed_act_url || "Sin soporte registrado"}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  {c.difference !== 0 ? (
                    <button
                      onClick={() => handleApplyAdjustment(c)}
                      style={{ backgroundColor: "#1565c0", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                    >
                      Aplicar Ajuste
                    </button>
                  ) : (
                    <span style={{ color: "#4caf50", fontSize: "12px" }}>✓ Cuadrado</span>
                  )}
                </td>
              </tr>
            );
          })}

          {!loading && counts.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: "20px", textAlign: "center", color: "#777" }}>
                No hay auditorías ni conteos físicos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      <PhysicalCountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        products={products}
      />
    </div>
  );
};