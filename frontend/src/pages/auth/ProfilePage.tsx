import React, { useState } from "react";
import { updateProfile } from "@/features/auth/services";
import styles from "./profilePage.module.css";

interface UserProfileProps {
  currentUser?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export const ProfilePage: React.FC<UserProfileProps> = ({ currentUser }) => {
  const [firstName, setFirstName] = useState(currentUser?.first_name || "Juan");
  const [lastName, setLastName] = useState(currentUser?.last_name || "Pérez");
  const email = currentUser?.email || "juan.perez@example.com";
  const [birthDate, setBirthDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate || undefined,
      });

      if (res.status === 202) {
        setFeedbackMessage({
          type: "warning",
          text: res.data.message,
        });
      } else {
        setFeedbackMessage({
          type: "success",
          text: res.data.message || "Perfil actualizado correctamente.",
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Error al conectar con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["profile-container"]}>
      <div className={styles["profile-card"]}>
        <div className={styles["profile-header"]}>
          <h2 className={styles["profile-title"]}>Mi Perfil</h2>
          <p className={styles["profile-subtitle"]}>
            Gestiona la información de tu cuenta y consulta tus estados
          </p>
        </div>

        {feedbackMessage && (
          <div className={`${styles["feedback-alert"]} ${styles[feedbackMessage.type]}`}>
            <span className={styles["alert-icon"]}>
              {feedbackMessage.type === "warning"
                ? "⚠️"
                : feedbackMessage.type === "success"
                ? "✓"
                : "✕"}
            </span>
            <div className={styles["alert-text"]}>
              {feedbackMessage.text}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles["profile-form"]}>
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              Correo Electrónico{" "}
              <span className={styles["optional"]}>(No editable)</span>
            </label>
            <input
              type="email"
              value={email}
              disabled
              className={`${styles["form-input"]} ${styles["disabled"]}`}
            />
          </div>

          <div className={styles["form-grid"]}>
            <div className={styles["form-group"]}>
              <label className={styles["form-label"]}>Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={styles["form-input"]}
                placeholder="Ingresa tu nombre"
              />
            </div>

            <div className={styles["form-group"]}>
              <label className={styles["form-label"]}>Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={styles["form-input"]}
                placeholder="Ingresa tu apellido"
              />
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={styles["form-input"]}
            />
          </div>

          <div className={styles["submit-container"]}>
            <button
              type="submit"
              disabled={loading}
              className={styles["btn-submit"]}
            >
              {loading ? "Guardando cambios..." : "Actualizar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};