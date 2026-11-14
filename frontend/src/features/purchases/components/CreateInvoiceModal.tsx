import React, { useState, useEffect } from "react";
import { createPurchaseInvoice } from "../api/purchasesApi";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId?: number;
  orderNumber?: string;
  suggestedAmount?: number;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  orderNumber,
  suggestedAmount = 0,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState<number | string>(suggestedAmount);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Sincronizar el monto sugerido cada vez que se abra el modal o cambie la orden
  useEffect(() => {
    if (isOpen) {
      setAmount(suggestedAmount > 0 ? suggestedAmount : "");
      setInvoiceNumber("");
      setFileUrl("");
      setInvoiceDate(new Date().toISOString().split("T")[0]);
      setDueDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      );
    }
  }, [isOpen, suggestedAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = Number(amount);

    // Validaciones
    if (!invoiceNumber.trim()) {
      alert("Por favor ingrese el número de factura del proveedor.");
      return;
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("El monto total de la factura debe ser un valor mayor a $0.");
      return;
    }

    if (new Date(dueDate) < new Date(invoiceDate)) {
      alert("La fecha de vencimiento no puede ser anterior a la fecha de emisión.");
      return;
    }

    if (!orderId) {
      alert("No se identificó una orden de compra válida.");
      return;
    }

    try {
      setLoading(true);
      await createPurchaseInvoice({
        invoice_number: invoiceNumber,
        purchase_order_id: orderId,
        amount: numericAmount,
        invoice_date: invoiceDate,
        due_date: dueDate,
        file_url: fileUrl,
        payment_status: "Pendiente",
      });

      alert("Factura de compra registrada exitosamente.");
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al registrar la factura.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#1e1e1e",
          padding: "25px",
          borderRadius: "8px",
          width: "450px",
          color: "#fff",
          border: "1px solid #333",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: "18px",
            borderBottom: "1px solid #333",
            paddingBottom: "10px",
          }}
        >
          Registrar Factura de Compra {orderNumber ? `(${orderNumber})` : ""}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* N° Factura */}
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "13px",
                color: "#aaa",
              }}
            >
              N° Factura Proveedor *
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Ej: FACT-2026-001"
              required
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                color: "#fff",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Monto Total */}
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "13px",
                color: "#aaa",
              }}
            >
              Monto Total ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                color: "#fff",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Fechas */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "13px",
                  color: "#aaa",
                }}
              >
                Fecha Emisión
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#fff",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "13px",
                  color: "#aaa",
                }}
              >
                Fecha Vencimiento
              </label>
              <input
                type="date"
                min={invoiceDate}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#fff",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* URL Soporte */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "13px",
                color: "#aaa",
              }}
            >
              Enlace / URL Digital de Soporte (Opcional)
            </label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                color: "#fff",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Botones */}
          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                backgroundColor: "#444",
                color: "#fff",
                border: "none",
                padding: "8px 15px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "#2e7d32",
                color: "#fff",
                border: "none",
                padding: "8px 15px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? "Guardando..." : "Guardar Factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};