import { useState } from 'react';
import { Modal } from './modal';
import { FormField } from '@/shared'

interface VerifyTokenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (code: string) => void;
    email: string;
}

/**
 * Ejemplo: modal de verificación de código (OTP) enviado por email.
 * Reutiliza el <Modal> genérico, solo cambia el contenido interno.
 */
export const VerifyTokenModal = ({
    isOpen,
    onClose,
    onVerify,
    email
}: VerifyTokenModalProps) => {
    const [code, setCode] = useState('');

    const handleSubmit = (event: React.SubmitEvent) => {
        event.preventDefault();
        onVerify(code);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            title="Verifica tu correo"
            description={`Enviamos un código de 6 dígitos a ${email}`}
        >
            <form onSubmit={handleSubmit}>
                <FormField
                    label="Código de verificación"
                    name="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="one-time-code"
                />
                <button
                    type="submit"
                    style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '0.75rem',
                        background: 'transparent',
                        border: '1px solid #d4af37',
                        borderRadius: '8px',
                        color: '#d4af37',
                        cursor: 'pointer'
                    }}
                >
                    Verificar código
                </button>
            </form>
        </Modal>
    );
};

/**
 * Ejemplo de uso en la página de registro:
 *
 * const [showVerify, setShowVerify] = useState(false);
 *
 * <VerifyTokenModal
 *     isOpen={showVerify}
 *     onClose={() => setShowVerify(false)}
 *     email={registeredEmail}
 *     onVerify={(code) => {
 *         // llamar a tu endpoint /auth/verify-code
 *     }}
 * />
 */