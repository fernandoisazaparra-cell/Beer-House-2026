
import { BrowserRouter } from "react-router-dom";
import { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "@/ui/styles/main.css";

import { AuthProvider, useAuth } from "./context";
import { AppRoutes } from "./router/Router";
import { TermsConfirmationModal } from "@/shared";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const TermsConfirmationGate = () => {
    const { needsTermsConfirmation, confirmGoogleTerms } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();

    const handleConfirm = async () => {
        setIsLoading(true);
        setError(undefined);

        try {
            await confirmGoogleTerms();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Ocurrió un error inesperado."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TermsConfirmationModal
            isOpen={needsTermsConfirmation}
            onConfirm={handleConfirm}
            isLoading={isLoading}
            error={error}
        />
    );
};

export const App = () => {
    return (
        <BrowserRouter>
            <GoogleOAuthProvider clientId={googleClientId}>
                <AuthProvider>
                    <AppRoutes />
                    <TermsConfirmationGate />
                </AuthProvider>
            </GoogleOAuthProvider>
        </BrowserRouter>
    );
};
