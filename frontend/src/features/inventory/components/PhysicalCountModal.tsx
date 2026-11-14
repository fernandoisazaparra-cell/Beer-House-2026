import React, { useState, useEffect } from "react";
import { createPhysicalCount } from "../api/inventoryApi";

interface Product {
  id: number;
  name: string;
  stock: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
}

export const PhysicalCountModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess, products }) => {
  const [productId, setProductId] = useState<number | "">("");
  const [physicalStock, setPhysicalStock] = useState<number | "">("");
  const [responsibleUser, setResponsibleUser] = useState("Supervisor");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && products.length > 0) {
      setProductId(products[0].id);
      setPhysicalStock("");
      setReason("");
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === Number(productId));
  const currentSystemStock = selectedProduct ? selectedProduct.stock : 0;
  const numPhysical = Number(physicalStock || 0);
  const diff = numPhysical - currentSystemStock;
  const perc = currentSystemStock > 0 ? (Math.abs(diff) / currentSystemStock) * 100 : 0;
  const isHighDiscrepancy = perc > 2.0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || physicalStock === "") return;

    if (isHighDiscrepancy && !reason.trim()) {
      alert(`La diferencia es del ${perc.toFixed(2)}% (> 2%). Es obligatorio documentar el motivo o acta.`);
      return;
    }

    try {
      setLoading(true);
      await createPhysicalCount({
        product_id: Number(productId),
        physical_stock: numPhysical,
        signed_act_url: reason.trim(),
      });
      alert("Conteo físico auditorial registrado exitosamente.");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Error al registrar el conteo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "#1e1e1e", padding: "25px", borderRadius: "8px", width: "450px", color: "#fff", border: "1px solid #333" }}>
        <h2 style={{ marginTop: 0, fontSize: "18px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
          Auditoría de Conteo Físico
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>Seleccionar Producto *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px" }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Stock Sistema: {p.stock})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>Stock en Sistema</label>
              <input type="text" value={currentSystemStock} disabled style={{ width: "100%", padding: "8px", backgroundColor: "#1a1a1a", border: "1px solid #444", color: "#888", borderRadius: "4px" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>Conteo Físico *</label>
              <input
                type="number"
                min="0"
                value={physicalStock}
                onChange={(e) => setPhysicalStock(e.target.value === "" ? "" : Number(e.target.value))}
                required
                style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px" }}
              />
            </div>
          </div>

          {/* Indicador del 2% */}
          {physicalStock !== "" && (
            <div style={{ padding: "10px", borderRadius: "4px", marginBottom: "12px", backgroundColor: isHighDiscrepancy ? "#3e1212" : "#122e12", border: `1px solid ${isHighDiscrepancy ? "#8c1d1d" : "#1b5e20"}` }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: isHighDiscrepancy ? "#f44336" : "#4caf50" }}>
                Diferencia: {diff > 0 ? `+${diff}` : diff} unidades ({perc.toFixed(2)}%)
              </div>
              {isHighDiscrepancy && (
                <div style={{ fontSize: "11px", color: "#ff8a80", marginTop: "4px" }}>
                  ⚠️ Discrepancia &gt; 2%. Se requiere motivo / soporte de acta obligatorio.
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>Responsable del Conteo *</label>
            <input
              type="text"
              value={responsibleUser}
              onChange={(e) => setResponsibleUser(e.target.value)}
              required
              style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
              Motivo / Observación del Ajuste {isHighDiscrepancy && "*"}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describa la razón del conteo o inconsistencia..."
              style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ backgroundColor: "#444", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
              {loading ? "Registrando..." : "Guardar Conteo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};