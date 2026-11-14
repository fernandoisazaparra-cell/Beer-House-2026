import React, { useEffect, useState } from "react";
import { getSuppliers, toggleSupplierStatus } from "../api/suppliersApi";
import { SupplierModal } from "../components/SupplierModal";

interface Supplier {
  id: number;
  name: string;
  nit: string;
  representative?: string;
  email: string;
  phone: string;
  address?: string;
  payment_terms?: string;
  delivery_method?: string;
  is_active: boolean;
}

export const SuppliersDashboard: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers(includeInactive);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [includeInactive]);

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (sup: Supplier) => {
    const action = sup.is_active ? "inactivar" : "reactivar";
    if (!window.confirm(`¿Está seguro de que desea ${action} al proveedor '${sup.name}'?`)) {
      return;
    }

    try {
      await toggleSupplierStatus(sup.id, !sup.is_active);
      alert(`Proveedor ${sup.is_active ? "inactivado" : "reactivado"} exitosamente.`);
      loadSuppliers();
    } catch (error: any) {
      alert(error.message || "Error al cambiar estado del proveedor.");
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#121212", color: "#fff", minHeight: "100vh" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Gestión de Proveedores - Beer House 2026</h1>
        <button
          onClick={handleOpenCreate}
          style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          + Nuevo Proveedor
        </button>
      </div>

      {/* Controles de filtro */}
      <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
        <label style={{ fontSize: "14px", color: "#aaa", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            style={{ marginRight: "8px" }}
          />
          Mostrar también proveedores inactivos
        </label>
      </div>

      {/* Tabla de Proveedores */}
      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#1e1e1e", borderRadius: "6px", overflow: "hidden" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333", textAlign: "left", color: "#aaa" }}>
            <th style={{ padding: "12px" }}>NIT</th>
            <th style={{ padding: "12px" }}>Nombre / Razón Social</th>
            <th style={{ padding: "12px" }}>Representante</th>
            <th style={{ padding: "12px" }}>Contacto</th>
            <th style={{ padding: "12px" }}>Condiciones</th>
            <th style={{ padding: "12px" }}>Estado</th>
            <th style={{ padding: "12px", textAlign: "center" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#aaa" }}>
                Cargando proveedores...
              </td>
            </tr>
          )}

          {!loading &&
            suppliers.map((sup) => (
              <tr key={sup.id} style={{ borderBottom: "1px solid #222", opacity: sup.is_active ? 1 : 0.6 }}>
                <td style={{ padding: "12px", fontWeight: "bold" }}>{sup.nit}</td>
                <td style={{ padding: "12px" }}>{sup.name}</td>
                <td style={{ padding: "12px" }}>{sup.representative || "N/A"}</td>
                <td style={{ padding: "12px", fontSize: "13px" }}>
                  <div>📧 {sup.email}</div>
                  <div>📞 {sup.phone}</div>
                </td>
                <td style={{ padding: "12px", fontSize: "13px", color: "#aaa" }}>
                  {sup.payment_terms || "N/A"}
                </td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      backgroundColor: sup.is_active ? "#2e7d32" : "#d32f2f",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    {sup.is_active ? "ACTIVO" : "INACTIVO"}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleOpenEdit(sup)}
                      style={{ backgroundColor: "#1565c0", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleStatus(sup)}
                      style={{ backgroundColor: sup.is_active ? "#c62828" : "#2e7d32", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                    >
                      {sup.is_active ? "Inactivar" : "Reactivar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

          {!loading && suppliers.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#777" }}>
                No hay proveedores registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadSuppliers}
        supplierToEdit={selectedSupplier}
      />
    </div>
  );
};