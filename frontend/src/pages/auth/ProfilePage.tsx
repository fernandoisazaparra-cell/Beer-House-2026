import React, { useState } from "react";
import { updateProfile } from "@/features/auth/services";
import styles from "./profilePage.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface UserProfileProps {
  currentUser?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  onUserChange?: (changes: { email?: string; name?: string }) => void;
}

export const ProfilePage: React.FC<UserProfileProps> = ({
  currentUser,
  onUserChange,
}) => {
  const [firstName, setFirstName] = useState(currentUser?.first_name || "Juan");
  const [lastName, setLastName] = useState(currentUser?.last_name || "Pérez");
  const [email, setEmail] = useState(currentUser?.email || "");
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

    if (!EMAIL_PATTERN.test(email.trim())) {
      setFeedbackMessage({
        type: "error",
        text: "Introduce una dirección de correo electrónico válida.",
      });
      setLoading(false);
      return;
    }

    if (!birthDate) {
      setFeedbackMessage({
        type: "error",
        text: "La fecha de nacimiento es obligatoria.",
      });
      setLoading(false);
      return;
    }

    if (new Date(`${birthDate}T00:00:00`) > new Date()) {
      setFeedbackMessage({
        type: "error",
        text: "La fecha de nacimiento no puede ser futura.",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        birth_date: birthDate,
      });

      setFeedbackMessage({
        type: res.status === 202 ? "warning" : "success",
        text: res.data.message || "Perfil actualizado correctamente.",
      });

      if (res.status === 200 && res.data.user) {
        const updatedEmail = res.data.user.email;
        const updatedName = [
          res.data.user.first_name,
          res.data.user.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        setEmail(updatedEmail);
        onUserChange?.({ email: updatedEmail, name: updatedName });
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
          <div
            className={`${styles["feedback-alert"]} ${styles[feedbackMessage.type]}`}
          >
            <span className={styles["alert-icon"]}>
              {feedbackMessage.type === "warning"
                ? "⚠️"
                : feedbackMessage.type === "success"
                ? "✓"
                : "✕"}
            </span>
            <div className={styles["alert-text"]}>{feedbackMessage.text}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles["profile-form"]}>
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles["form-input"]}
            />
            <small>Los cambios de correo requieren 30 días de antigüedad.</small>
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
            <label className={styles["form-label"]}>Fecha de Nacimiento</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              required
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
