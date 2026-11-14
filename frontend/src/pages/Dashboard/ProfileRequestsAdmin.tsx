import React, { useEffect, useState } from "react";
import "./ProfileRequestsAdmin.css";
import {
  getPendingProfileRequests,
  approveProfileRequest,
  rejectProfileRequest,
  type ProfileRequestItem,
} from "@/features/auth/services/adminProfileService";

export const ProfileRequestsAdmin: React.FC = () => {
  const [requests, setRequests] = useState<ProfileRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getPendingProfileRequests();
      setRequests(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const res = (await approveProfileRequest(id)) as { message: string };
      setMessage(res.message);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = (await rejectProfileRequest(id)) as { message: string };
      setMessage(res.message);
      fetchRequests();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>Solicitudes de Actualización de Perfil </h2>
          <p className="admin-subtitle">
            Usuarios registrados con menos de 30 días de antigüedad que
            requieren aprobación manual para modificar su información.
          </p>
        </div>
      </div>

      {message && <div className="admin-alert">{message}</div>}

      {loading ? (
        <div className="admin-empty">Cargando solicitudes...</div>
      ) : requests.length === 0 ? (
        <div className="admin-empty">
          No hay solicitudes pendientes por revisar.
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Nombre Solicitado</th>
                <th>Fecha Solicitud</th>
                <th style={{ textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td style={{ fontWeight: 600, color: "#f4f4f5" }}>
                    {req.current_name}
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      color: "#a1a1aa",
                    }}
                  >
                    {req.user_email}
                  </td>
                  <td style={{ color: "#fcd34d", fontWeight: 500 }}>
                    {req.requested_first_name} {req.requested_last_name}
                  </td>
                  <td style={{ color: "#a1a1aa", fontSize: "0.85rem" }}>
                    {new Date(req.created_at).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="btn-approve"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="btn-reject"
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
