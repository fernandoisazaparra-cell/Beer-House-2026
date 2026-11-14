
import { useCallback, useEffect, useState } from "react";
import "./CampaignsAdmin.css";
import { authFetch } from "../../shared/lib/authFetch";

interface Campaign {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  budget: number;
  channels: string[];
  status: string;
  legal_approved: boolean;
  closed_at?: string | null;
  final_results?: string | null;
  learnings?: string | null;
}

interface CampaignForm {
  name: string;
  start_date: string;
  end_date: string;
  budget: string;
  channels: string;
}

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "") + "/campaigns";

const EMPTY_FORM: CampaignForm = {
  name: "",
  start_date: "",
  end_date: "",
  budget: "",
  channels: "",
};

const CampaignsAdmin = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  const request = useCallback(
    async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      const response = await authFetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "No fue posible completar la solicitud."
        );
      }

      return data as T;
    },
    []
  );

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await request<Campaign[]>("");

      if (!Array.isArray(data)) {
        throw new Error("El servidor devolvió un formato de campañas inválido.");
      }

      setCampaigns(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar las campañas."
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateForm = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createCampaign = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const budget = Number(form.budget);

    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!form.start_date || !form.end_date) {
      setError("Debes indicar las fechas de inicio y finalización.");
      return;
    }

    if (form.end_date < form.start_date) {
      setError("La fecha final no puede ser anterior a la inicial.");
      return;
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      setError("El presupuesto debe ser un número mayor que cero.");
      return;
    }

    const channels = form.channels
      .split(",")
      .map((channel) => channel.trim())
      .filter(Boolean);

    if (channels.length === 0) {
      setError("Debes indicar al menos un canal de registro.");
      return;
    }

    try {
      setSaving(true);

      await request("/".replace(/\/$/, ""), {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          start_date: form.start_date,
          end_date: form.end_date,
          budget,
          channels,
          included_products: [],
        }),
      });

      setForm(EMPTY_FORM);
      setMessage("Registro académico creado correctamente.");
      await reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible crear el registro."
      );
    } finally {
      setSaving(false);
    }
  };

  const registerLegalApproval = async (campaign: Campaign) => {
    const documentUrl = window.prompt(
      "Ingresa la referencia del documento de aprobación:"
    );

    if (!documentUrl?.trim()) return;

    setError("");
    setMessage("");

    try {
      setSaving(true);

      await request(`/${campaign.id}/legal-approval`, {
        method: "POST",
        body: JSON.stringify({
          document_url: documentUrl.trim(),
          is_approved: true,
        }),
      });

      setMessage("Aprobación registrada correctamente.");
      await reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible registrar la aprobación."
      );
    } finally {
      setSaving(false);
    }
  };

  const closeCampaign = async (campaign: Campaign) => {
    const finalResults = window.prompt(
      "Describe los resultados de la simulación académica:"
    );

    if (finalResults === null) return;

    const learnings = window.prompt(
      "Describe los aprendizajes obtenidos:"
    );

    if (learnings === null) return;

    setError("");
    setMessage("");

    try {
      setSaving(true);

      await request(`/${campaign.id}/close`, {
        method: "POST",
        body: JSON.stringify({
          final_results: finalResults.trim(),
          learnings: learnings.trim(),
        }),
      });

      setMessage("Registro cerrado correctamente.");
      await reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cerrar el registro."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "No disponible";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("es-CO");
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLANNING: "En planificación",
      APPROVED: "Aprobada",
      ACTIVE: "En seguimiento",
      CLOSED: "Cerrada",
    };

    return labels[status] ?? status;
  };

  return (
    <section className="campaigns-admin">
      <header className="campaigns-admin__header">
        <div>
          <h1>Administración de campañas</h1>
          <p>
            Registro, aprobación documental y seguimiento de ejercicios
            académicos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reload()}
          disabled={loading || saving}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {error && (
        <div className="campaigns-admin__alert campaigns-admin__alert--error">
          {error}
        </div>
      )}

      {message && (
        <div className="campaigns-admin__alert campaigns-admin__alert--success">
          {message}
        </div>
      )}

      <section className="campaigns-admin__form-section">
        <h2>Nuevo registro académico</h2>

        <form onSubmit={createCampaign} className="campaigns-admin__form">
          <label>
            Nombre
            <input
              name="name"
              value={form.name}
              onChange={updateForm}
              maxLength={150}
              required
              placeholder="Nombre del ejercicio"
            />
          </label>

          <label>
            Fecha inicial
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={updateForm}
              required
            />
          </label>

          <label>
            Fecha final
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={updateForm}
              min={form.start_date || undefined}
              required
            />
          </label>

          <label>
            Presupuesto de demostración
            <input
              type="number"
              name="budget"
              value={form.budget}
              onChange={updateForm}
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
            />
          </label>

          <label>
            Canales de registro
            <input
              name="channels"
              value={form.channels}
              onChange={updateForm}
              required
              placeholder="Canal interno, informe, presentación"
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear registro"}
          </button>
        </form>
      </section>

      <section className="campaigns-admin__list-section">
        <h2>Registros existentes</h2>

        {loading ? (
          <p>Cargando registros...</p>
        ) : campaigns.length === 0 ? (
          <p>No hay registros disponibles.</p>
        ) : (
          <div className="campaigns-admin__table-wrapper">
            <table className="campaigns-admin__table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Inicio</th>
                  <th>Finalización</th>
                  <th>Presupuesto</th>
                  <th>Estado</th>
                  <th>Aprobación documental</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{campaign.name}</td>
                    <td>{formatDate(campaign.start_date)}</td>
                    <td>{formatDate(campaign.end_date)}</td>
                    <td>
                      {Number(campaign.budget).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                      })}
                    </td>
                    <td>{statusLabel(campaign.status)}</td>
                    <td>
                      {campaign.legal_approved
                        ? "Aprobación registrada"
                        : "Pendiente"}
                    </td>
                    <td>
                      <div className="campaigns-admin__actions">
                        <button
                          type="button"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          Ver
                        </button>

                        {!campaign.legal_approved &&
                          campaign.status !== "CLOSED" && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                void registerLegalApproval(campaign)
                              }
                            >
                              Registrar aprobación
                            </button>
                          )}

                        {campaign.status !== "CLOSED" && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void closeCampaign(campaign)}
                          >
                            Cerrar registro
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedCampaign && (
        <div className="campaigns-admin__modal">
          <div
            className="campaigns-admin__modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-detail-title"
          >
            <h2 id="campaign-detail-title">Detalle del registro</h2>

            <p><strong>Nombre:</strong> {selectedCampaign.name}</p>
            <p><strong>Estado:</strong> {statusLabel(selectedCampaign.status)}</p>
            <p>
              <strong>Canales:</strong>{" "}
              {Array.isArray(selectedCampaign.channels)
                ? selectedCampaign.channels.join(", ")
                : "No disponibles"}
            </p>
            <p>
              <strong>Resultados:</strong>{" "}
              {selectedCampaign.final_results || "Sin registrar"}
            </p>
            <p>
              <strong>Aprendizajes:</strong>{" "}
              {selectedCampaign.learnings || "Sin registrar"}
            </p>

            <button
              type="button"
              onClick={() => setSelectedCampaign(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CampaignsAdmin;
