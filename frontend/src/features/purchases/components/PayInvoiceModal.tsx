import React, { useState } from "react";
import { payPurchaseInvoice } from "../api/purchasesApi";

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoiceId?: number;
  invoiceNumber?: string;
  amount?: number;
}

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  invoiceId,
  invoiceNumber,
  amount = 0,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("Transferencia Bancaria");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) return;

    try {
      setLoading(true);
      await payPurchaseInvoice(invoiceId, {
        payment_method: paymentMethod,
        payment_status: "Pagada",
      });

      alert("Pago de la factura registrado con éxito.");
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al registrar pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "#1e1e1e", padding: "25px", borderRadius: "8px", width: "400px", color: "#fff", border: "1px solid #333" }}>
        <h2 style={{ marginTop: 0, fontSize: "18px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
          Registrar Pago - {invoiceNumber}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "#aaa" }}>Monto A Pagar</label>
            <input
              type="text"
              value={`$${Number(amount).toLocaleString("es-ES")}`}
              disabled
              style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#4caf50", fontWeight: "bold", borderRadius: "4px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "#aaa" }}>Método de Pago *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", boxSizing: "border-box" }}
            >
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta de Débito/Crédito">Tarjeta de Débito/Crédito</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ backgroundColor: "#444", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
              {loading ? "Procesando..." : "Confirmar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};