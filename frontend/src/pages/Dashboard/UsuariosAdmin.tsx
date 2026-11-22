import React, { useCallback, useEffect, useState } from "react";
import {
  createUserAdmin,
  deleteUserAdmin,
  getClientsList,
  updateUserAdmin,
  type AdminUserPayload,
  type ClientUser,
} from "@/features/auth/services/clientAdminService";
import "./UsuariosAdmin.css";

const ROLES = [
  { value: "user", label: "Cliente" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin", label: "Administrador" },
];

const EMPTY_FORM: AdminUserPayload = {
  name: "",
  email: "",
  password: "",
  rol: "user",
};

export const UsuariosAdmin = () => {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientUser | null>(null);
  const [form, setForm] = useState<AdminUserPayload>(EMPTY_FORM);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      setUsers(await getClientsList());
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudieron cargar los usuarios.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (user: ClientUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      rol: user.rol || "user",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload: AdminUserPayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        rol: form.rol,
      };

      if (form.password) payload.password = form.password;

      if (editing) {
        await updateUserAdmin(editing.id, payload);
        setMessage({ type: "success", text: "Usuario actualizado con éxito." });
      } else {
        await createUserAdmin(payload);
        setMessage({ type: "success", text: "Usuario creado con éxito." });
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar el usuario.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: ClientUser) => {
    if (!window.confirm(`¿Eliminar al usuario ${user.name}?`)) return;

    setMessage(null);

    try {
      const result = await deleteUserAdmin(user.id);
      setMessage({ type: "success", text: result.message });
      await loadUsers();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo eliminar el usuario.",
      });
    }
  };

  return (
    <div className="users-admin">
      <header className="users-admin__header">
        <div>
          <h1>Usuarios</h1>
          <p>Administra el acceso y los roles del sistema.</p>
        </div>
        <button type="button" onClick={openCreate}>
          Nuevo usuario
        </button>
      </header>

      {message && (
        <div className={`users-admin__alert users-admin__alert--${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <table className="users-admin__table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.estado || "Activo"}</td>
                <td>{user.rol || "user"}</td>
                <td>
                  <button type="button" onClick={() => openEdit(user)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="users-admin__danger"
                    onClick={() => handleDelete(user)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5}>No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <div className="users-admin__overlay">
          <form className="users-admin__modal" onSubmit={handleSubmit}>
            <h2>{editing ? "Editar usuario" : "Nuevo usuario"}</h2>

            <label>
              Nombre
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label>
              Correo
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <label>
              Contraseña {editing && "(dejar vacío para conservar)"}
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
                minLength={8}
              />
            </label>

            <label>
              Rol
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              >
                {ROLES.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="users-admin__actions">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;
