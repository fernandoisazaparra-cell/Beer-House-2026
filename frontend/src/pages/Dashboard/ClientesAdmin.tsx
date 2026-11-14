
import React, { useState, useEffect, useCallback } from 'react';
import './ProductosAdmin.css';
import { RiCustomerService2Fill } from "react-icons/ri";
import { authFetch } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";

export interface Client {
  id: number;
  name: string;
  email: string;
}

interface ClientFormData {
  name: string;
  email: string;
  password: string;
}

const USERS_URL = `${API_URL.replace(/\/+$/, "")}/users/`;

export const ClientesAdmin = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    password: '',
  });

  // Consultar clientes desde el backend.
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      const response = await authFetch(USERS_URL);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'Error al consultar clientes.'
        );
      }

      if (!Array.isArray(data)) {
        throw new Error('La respuesta del servidor no tiene un formato válido.');
      }

      const mappedClients: Client[] = data.map((client: any) => ({
        id: Number(client.id),
        name: client.name || '',
        email: client.email || '',
      }));

      setClients(mappedClients);

    } catch (error) {
      console.error('Error al cargar clientes:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los clientes.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData(previous => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOpenAddModal = () => {
    setEditingClient(null);

    setFormData({
      name: '',
      email: '',
      password: '',
    });

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);

    setFormData({
      name: client.name,
      email: client.email,
      password: '',
    });

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingClient(null);

    setFormData({
      name: '',
      email: '',
      password: '',
    });
  };

  const handleSaveClient = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!name || !email) {
      alert('El nombre y el correo son obligatorios.');
      return;
    }

    if (!editingClient && !password) {
      alert('La contraseña es obligatoria para crear un cliente.');
      return;
    }

    try {
      setIsSaving(true);

      const isEditing = editingClient !== null;

      const url = isEditing
        ? `${USERS_URL}${editingClient.id}`
        : USERS_URL;

      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        name,
        email,
        ...(password ? { password } : {}),
      };

      const response = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.error ||
          responseData.details ||
          responseData.message ||
          'Error al procesar el cliente.'
        );
      }

      alert(
        isEditing
          ? '¡Cliente actualizado con éxito!'
          : '¡Cliente creado con éxito!'
      );

      setIsModalOpen(false);
      setEditingClient(null);

      setFormData({
        name: '',
        email: '',
        password: '',
      });

      await fetchClients();

    } catch (error) {
      console.error('Error al guardar cliente:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el cliente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClient = async (id: number) => {
    const confirmed = window.confirm(
      '¿Deseas eliminar este cliente de la base de datos?'
    );

    if (!confirmed) return;

    try {
      const response = await authFetch(`${USERS_URL}${id}`, {
        method: 'DELETE',
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.error ||
          responseData.message ||
          'Error al eliminar el cliente.'
        );
      }

      alert('Cliente eliminado correctamente.');

      await fetchClients();

    } catch (error) {
      console.error('Error al eliminar cliente:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el cliente.'
      );
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>
          <RiCustomerService2Fill
            style={{
              marginRight: '8px',
              verticalAlign: 'middle',
            }}
          />
          Gestión de Clientes
        </h2>

        <button
          onClick={handleOpenAddModal}
          className="btn-primary"
        >
          + Agregar cliente
        </button>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <p
            style={{
              color: '#d0a35c',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            Cargando clientes de la base de datos...
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: 'center',
                      color: '#888',
                      padding: '20px',
                    }}
                  >
                    No hay clientes registrados en la base de datos.
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 'bold' }}>
                      CLI-{client.id}
                    </td>

                    <td>{client.name}</td>

                    <td style={{ color: 'var(--color-brand)' }}>
                      {client.email}
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                        }}
                      >
                        <button
                          onClick={() => handleOpenEditModal(client)}
                          className="btn-secondary"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="btn-danger"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para agregar o editar clientes */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {editingClient
                ? 'Editar Cliente'
                : 'Agregar Nuevo Cliente'}
            </h3>

            <form
              onSubmit={handleSaveClient}
              className="form-group"
            >
              <div className="form-field">
                <label>Nombre Completo</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Correo Electrónico</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>
                  Contraseña {editingClient ? '(Opcional)' : ''}
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingClient}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={
                    editingClient
                      ? 'Dejar en blanco para mantener la actual'
                      : ''
                  }
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesAdmin;

