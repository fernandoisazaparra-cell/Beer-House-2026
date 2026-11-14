
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/authUse";

interface ProtectedRouteProps {
    allowedRoles?: string[];
    children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    children,
}) => {
    const {
        user,
        token,
        needsTermsConfirmation,
        isAuthLoading
    } = useAuth();

    // Esperar a que termine la recuperación de sesión.
    if (isAuthLoading) {
        return <div>Cargando sesión...</div>;
    }

    // Comprobar autenticación.
    if (!token || !user) {
        return <Navigate to="/auth/login" replace />;
    }

    // Exigir confirmación de términos.
    if (needsTermsConfirmation) {
        return <Navigate to="/auth/confirm-terms" replace />;
    }

    // Comprobar permisos.
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
        if (
            user.rol === "admin" ||
            user.rol === "supervisor"
        ) {
            return <Navigate to="/dashboard" replace />;
        }

        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
