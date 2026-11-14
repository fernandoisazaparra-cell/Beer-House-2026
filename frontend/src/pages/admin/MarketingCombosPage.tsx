
import { useCallback, useEffect, useState } from "react";
import "./MarketingCombosPage.css";
import { authFetch } from "../../shared/lib/authFetch";

interface Combo {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  status?: string;
}

interface Campaign {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  budget: number;
  channels: string[] | string;
  status: string;
  legal_approved: boolean;
}

type ActiveTab = "combos" | "campaigns";

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

export const MarketingCombosPage = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("combos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async <T,>(endpoint: string): Promise<T> => {
    const response = await authFetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || data.message || "No fue posible consultar los datos."
      );
    }

    return data as T;
  }, []);

  const loadCombos = useCallback(async () => {
    const data = await fetchData<Combo[]>("/campaigns/combos");

    if (!Array.isArray(data)) {
      throw new Error("El servidor devolvió un listado de combos inválido.");
    }

    setCombos(data);
  }, [fetchData]);

  const loadCampaigns = useCallback(async () => {
    const data = await fetchData<Campaign[]>("/campaigns");

    if (!Array.isArray(data)) {
      throw new Error("El servidor devolvió un listado de registros inválido.");
    }

    setCampaigns(data);
  }, [fetchData]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        loadCombos(),
        loadCampaigns(),
      ]);

      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected"
        )
        .map((result) =>
          result.reason instanceof Error
            ? result.reason.message
            : "Error al cargar información."
        );

      if (errors.length > 0) {
        setError(errors.join(" "));
      }
    } catch {
      setError("No fue posible cargar la información.");
    } finally {
      setLoading(false);
    }
  }, [loadCombos, loadCampaigns]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const formatCurrency = (value: number) => {
    return Number(value || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
    });
  };

  const formatChannels = (channels: string[] | string) => {
    if (Array.isArray(channels)) {
      return channels.join(", ");
    }

    return channels || "No registrados";
  };

  const formatDate = (date: string) => {
    if (!date) return "No disponible";

    const parsedDate = new Date(`${date}T00:00:00`);

    return Number.isNaN(parsedDate.getTime())
      ? date
      : parsedDate.toLocaleDateString("es-CO");
  };

  return (
    <main className="marketing-container">
      <header className="marketing-header">
        <h1>Administración de combos y registros académicos</h1>
      </header>

      <nav className="marketing-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("combos")}
          className={`marketing-tab-btn ${
            activeTab === "combos" ? "active" : ""
          }`}
        >
          Combos registrados
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`marketing-tab-btn ${
            activeTab === "campaigns" ? "active" : ""
          }`}
        >
          Registros académicos
        </button>
      </nav>

      <button
        type="button"
        onClick={() => void loadData()}
        disabled={loading}
        className="marketing-tab-btn"
      >
        {loading ? "Actualizando..." : "Actualizar información"}
      </button>

      {error && (
        <div className="marketing-empty" role="alert">
          {error}
        </div>
      )}

      {activeTab === "combos" ? (
        <section>
          <h2 className="marketing-section-title">
            Listado de combos de demostración
          </h2>

          <div className="marketing-combos-grid">
            {combos.map((combo) => (
              <article key={combo.id} className="marketing-combo-card">
                <div>
                  <h3>{combo.name}</h3>
                  <p>{combo.description || "Sin descripción registrada."}</p>
                </div>

                <div className="marketing-combo-footer">
                  <span className="marketing-combo-price">
                    {formatCurrency(combo.price)}
                  </span>

                  <span className="marketing-combo-stock">
                    Existencias: {combo.stock}
                  </span>
                </div>
              </article>
            ))}

            {!loading && combos.length === 0 && (
              <p className="marketing-empty">
                No hay combos registrados todavía.
              </p>
            )}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="marketing-section-title">
            Registros académicos
          </h2>

          <div className="marketing-table-container">
            <table className="marketing-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fechas</th>
                  <th>Presupuesto</th>
                  <th>Canales</th>
                  <th>Estado</th>
                  <th>Aprobación documental</th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{campaign.name}</td>

                    <td>
                      {formatDate(campaign.start_date)} al{" "}
                      {formatDate(campaign.end_date)}
                    </td>

                    <td>
                      {formatCurrency(campaign.budget)}
                    </td>

                    <td>{formatChannels(campaign.channels)}</td>

                    <td>{campaign.status}</td>

                    <td>
                      {campaign.legal_approved ? (
                        <span className="badge-legal-approved">
                          Aprobación registrada
                        </span>
                      ) : (
                        <span className="badge-legal-pending">
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && campaigns.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <p className="marketing-empty">
                        No hay registros disponibles.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
};
