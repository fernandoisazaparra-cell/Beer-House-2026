import React, { useState, useEffect } from "react";
import { createSupplier, updateSupplier } from "../api/suppliersApi";

interface Supplier {
  id?: number;
  name: string;
  nit: string;
  representative?: string;
  email: string;
  phone: string;
  address?: string;
  payment_terms?: string;
  delivery_method?: string;
}

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supplierToEdit,
}) => {
  const [name, setName] = useState("");
  const [nit, setNit] = useState("");
  const [representative, setRepresentative] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(supplierToEdit && supplierToEdit.id);

  useEffect(() => {
    if (isOpen) {
      if (supplierToEdit) {
        setName(supplierToEdit.name || "");
        setNit(supplierToEdit.nit || "");
        setRepresentative(supplierToEdit.representative || "");
        setEmail(supplierToEdit.email || "");
        setPhone(supplierToEdit.phone || "");
        setAddress(supplierToEdit.address || "");
        setPaymentTerms(supplierToEdit.payment_terms || "");
        setDeliveryMethod(supplierToEdit.delivery_method || "");
      } else {
        setName("");
        setNit("");
        setRepresentative("");
        setEmail("");
        setPhone("");
        setAddress("");
        setPaymentTerms("");
        setDeliveryMethod("");
      }
    }
  }, [isOpen, supplierToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !nit.trim() || !email.trim() || !phone.trim()) {
      alert("Por favor complete los campos obligatorios (*).");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name,
        nit,
        representative,
        email,
        phone,
        address,
        payment_terms: paymentTerms,
        delivery_method: deliveryMethod,
      };

      if (isEditing && supplierToEdit?.id) {
        await updateSupplier(supplierToEdit.id, payload);
        alert("Proveedor actualizado exitosamente.");
      } else {
        await createSupplier(payload);
        alert("Proveedor registrado exitosamente.");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al procesar el proveedor.");
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
          width: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#fff",
          border: "1px solid #333",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "18px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
          {isEditing ? `Editar Proveedor: ${supplierToEdit?.name}` : "Registrar Nuevo Proveedor"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Nombre y NIT */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
                Nombre / Razón Social *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
                NIT / RUC * {isEditing && "(Bloqueado)"}
              </label>
              <input
                type="text"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                disabled={isEditing}
                required
                style={{ width: "100%", padding: "8px", backgroundColor: isEditing ? "#1a1a1a" : "#2a2a2a", border: "1px solid #444", color: isEditing ? "#888" : "#fff", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Contacto y Representante */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
                Teléfono de Contacto *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Representante y Dirección */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
              Representante Legal (Opcional)
            </label>
            <input
              type="text"
              value={representative}
              onChange={(e) => setRepresentative(e.target.value)}
              style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
              Dirección Física (Opcional)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", boxSizing: "border-box" }}
            />
          </div>

          {/* Condiciones comerciales */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
                Condiciones de Pago
              </label>
              <input
                type="text"
                placeholder="Ej: Contado / Crédito 30 días"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#aaa" }}>
                Forma de Entrega
              </label>
              <input
                type="text"
                placeholder="Ej: Camión propio / Envío"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                style={{ width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #444", color: "#fff", borderRadius: "4px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ backgroundColor: "#444", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
            >
              {loading ? "Guardando..." : isEditing ? "Actualizar Proveedor" : "Guardar Proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};