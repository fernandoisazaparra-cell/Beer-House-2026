import React, { useEffect, useState } from "react";
import { 
  getLossRecords, 
  createLossRecord, 
  processLossApproval, 
  getProducts, 
  type LossRecord, 
  type SimpleEntity 
} from "../../features/inventory/api/inventoryApi";

export const LossesDashboard: React.FC = () => {
  const [records, setRecords] = useState<LossRecord[]>([]);
  const [products, setProducts] = useState<SimpleEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [lossData, prodData] = await Promise.all([
        getLossRecords(),
        getProducts()
      ]);
      setRecords(Array.isArray(lossData) ? lossData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (err) {
      console.error("Error al cargar datos de mermas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0 || !reason.trim()) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    try {
      await createLossRecord({
        product_id: Number(selectedProductId),
        quantity: Number(quantity),
        reason: reason.trim(),
        user_id: 1, // ID de usuario según contexto de sesión
      });
      alert("Solicitud de merma registrada exitosamente en estado Pendiente.");
      setIsModalOpen(false);
      setSelectedProductId("");
      setQuantity(1);
      setReason("");
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al registrar la merma.");
    }
  };

  const handleProcess = async (lossId: number, action: "APROBAR" | "RECHAZAR") => {
    const confirmMsg = action === "APROBAR" 
      ? "¿Desea APROBAR la baja de inventario? El stock se descontará automáticamente."
      : "¿Desea RECHAZAR esta solicitud de merma?";

    if (!window.confirm(confirmMsg)) return;

    try {
      await processLossApproval(lossId, action, "Supervisor");
      alert(`Merma #${lossId} procesada correctamente (${action}).`);
      loadData();
    } catch (err: any) {
      alert(err.message || "Error al procesar la merma.");
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#121212", color: "#fff", minHeight: "100vh" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <div>
          <h1 style={{ fontSize: "24px", margin: 0 }}>Gestión de Mermas, Pérdidas y Bajas </h1>
          <p style={{ color: "#aaa", fontSize: "13px", margin: "5px 0 0 0" }}>
            Registro y flujo de aprobación para de bajas por deterioro, rotura o vencimiento
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            backgroundColor: "#2e7d32",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Solicitar Baja por Merma
        </button>
      </div>

      {/* Tabla de Mermas */}
      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#1e1e1e", borderRadius: "6px", overflow: "hidden" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333", textAlign: "left", color: "#aaa" }}>
            <th style={{ padding: "12px" }}>ID</th>
            <th style={{ padding: "12px" }}>Fecha</th>
            <th style={{ padding: "12px" }}>Producto</th>
            <th style={{ padding: "12px" }}>Cantidad</th>
            <th style={{ padding: "12px" }}>Motivo / Justificación</th>
            <th style={{ padding: "12px" }}>Estado</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#aaa" }}>
                Cargando registros de mermas...
              </td>
            </tr>
          )}

          {!loading && records.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "12px", fontWeight: "bold" }}>#{r.id}</td>
              <td style={{ padding: "12px", color: "#aaa", fontSize: "12px" }}>{r.created_at}</td>
              <td style={{ padding: "12px", fontWeight: "bold" }}>{r.product_name}</td>
              <td style={{ padding: "12px", color: "#f44336", fontWeight: "bold" }}>-{r.quantity} un.</td>
              <td style={{ padding: "12px", color: "#ccc" }}>{r.reason}</td>
              <td style={{ padding: "12px" }}>
                <span
                  style={{
                    backgroundColor:
                      r.status === "Aprobado"
                        ? "#2e7d32"
                        : r.status === "Rechazado"
                        ? "#c62828"
                        : "#f57c00",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {r.status.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: "12px", textAlign: "center" }}>
                {r.status === "Pendiente" ? (
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button
                      onClick={() => handleProcess(r.id, "APROBAR")}
                      style={{
                        backgroundColor: "#1565c0",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleProcess(r.id, "RECHAZAR")}
                      style={{
                        backgroundColor: "#d32f2f",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <span style={{ color: "#666", fontSize: "12px" }}>Procesado</span>
                )}
              </td>
            </tr>
          ))}

          {!loading && records.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#aaa" }}>
                No hay registros de mermas reportados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal de Solicitud de Merma */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#1e1e1e", padding: "24px", borderRadius: "8px", width: "420px", border: "1px solid #333" }}>
            <h2 style={{ marginTop: 0, fontSize: "18px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
              Registrar Solicitud de Merma
            </h2>
            <form onSubmit={handleRegisterLoss}>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>Producto *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: "4px" }}
                  required
                >
                  <option value="">Seleccione un producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>Cantidad a Dar de Baja *</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: "4px" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>Motivo / Justificación *</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Botellas rotas por caída durante transporte en bodega..."
                  style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", color: "#fff", border: "1px solid #444", borderRadius: "4px" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ backgroundColor: "#444", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Guardar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};