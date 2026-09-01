import React, { useState } from 'react';
import './ProductosAdmin.css'; // Reutiliza el mismo CSS para mantener estilos unificados
import {
   RiCustomerService2Fill 
  } from "react-icons/ri";
export interface Client {
  id: string;
  name: string;
  email: string;
  password?: string;
}

const initialClients: Client[] = [
  { id: 'CLI-01', name: 'Carlos Pérez', email: 'carlos@gmail.com' },
  { id: 'CLI-02', name: 'Enana', email: 'enana@gmail.com' },
];

export const ClientesAdmin = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewClient({ ...newClient, [e.target.name]: e.target.value });
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email || !newClient.password) return;

    const createdClient: Client = {
      id: `CLI-0${clients.length + 1}`,
      name: newClient.name,
      email: newClient.email,
    };

    setClients([...clients, createdClient]);
    setNewClient({ name: '', email: '', password: '' });
    setIsModalOpen(false);
  };

  const handleResetPassword = (id: string) => {
    alert(`Enlace de restablecimiento enviado para el cliente ${id}`);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Clientes</h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          + Agregar cliente
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Contraseña</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td style={{ fontWeight: 'bold' }}>{client.id}</td>
                <td>{client.name}</td>
                <td style={{ color: 'var(--color-brand)' }}>{client.email}</td>
                <td>••••••••</td>
                <td>
                  <button
                    onClick={() => handleResetPassword(client.id)}
                    className="btn-secondary"
                  >
                    Restablecer Clave
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Agregar Nuevo Cliente</h3>
            <form onSubmit={handleAddClient} className="form-group">
              <div className="form-field">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  name="name"
                  value={newClient.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={newClient.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label>Contraseña Inicial</label>
                <input
                  type="password"
                  name="password"
                  value={newClient.password}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  <RiCustomerService2Fill />
};

export default ClientesAdmin;
