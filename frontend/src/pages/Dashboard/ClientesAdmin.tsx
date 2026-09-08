import { useEffect, useState } from 'react';
import './AdminShared.css';
import {
   RiCustomerService2Fill 
  } from "react-icons/ri";
import {
  getUsers,
  updateUserRol,
  deleteUser,
  type AdminUser,
  type UserRol
} from '@/features/dashboard/services/usersService';
import {
  getErrorMessage
} from '@/features/dashboard/services/errorsService';
import {
  formatDate
} from '@/features/dashboard/services/dashboardStatsService';

export const ClientesAdmin = () => {
  const [clients, setClients] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getUsers();
        setError('');
        setClients(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleChangeRol = async (client: AdminUser, rol: UserRol) => {
    if (client.rol === rol) return;

    try {
      const updated = await updateUserRol(client.id, rol);
      setClients((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (client: AdminUser) => {
    if (!window.confirm(`¿Eliminar al usuario "${client.name}"? Esta acción no se puede deshacer.`)) return;

    try {
      await deleteUser(client.id);
      setClients((prev) => prev.filter((u) => u.id !== client.id));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Clientes</h2>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-container">
        {loading ? (
          <p className="admin-loading">Cargando clientes...</p>
        ) : clients.length === 0 ? (
          <p className="admin-empty">No hay usuarios registrados.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Cuenta</th>
                <th>Registro</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td style={{ fontWeight: 'bold' }}>#{client.id}</td>
                  <td>{client.name}</td>
                  <td style={{ color: 'var(--color-brand)' }}>{client.email}</td>
                  <td>
                    <span className={`status-badge ${client.google ? 'cancelado' : 'completado'}`}>
                      {client.google ? 'Google' : 'Email'}
                    </span>
                  </td>
                  <td style={{ color: '#aaa' }}>{formatDate(client.created_at)}</td>
                  <td>
                    <select
                      value={client.rol}
                      onChange={(e) => handleChangeRol(client, e.target.value as UserRol)}
                      className="status-select"
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(client)} className="btn-danger">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
  <RiCustomerService2Fill />
};

export default ClientesAdmin;