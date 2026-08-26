import { useState } from 'react';
import { Modal } from './modal';
import { FormField } from '@/shared'
import { FaShieldAlt } from 'react-icons/fa'

import styles from './modalToken.module.css'

interface VerifyTokenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (code: string) => void;
    email: string;
    error?: string;
}

export const VerifyTokenModal = ({
    isOpen,
    onClose,
    onVerify,
    email,
    error
}: VerifyTokenModalProps) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            await onVerify(code);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="sm"
            title="Verifica tu correo"
            description={`Enviamos un código de 6 caracteres a ${email}`}
        >
            <div className={styles.tokenModalContent}>
                <div className={styles.tokenModalIcon}>
                    <FaShieldAlt />
                </div>

                <form onSubmit={handleSubmit}>
                    <FormField
                        label="Código de verificación"
                        name="code"
                        type="text"
                        placeholder="Ej: aB3k9X"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        error={error}
                        autoComplete="one-time-code"
                    />

                    <button
                        type="submit"
                        className={styles.tokenModalButton}
                        disabled={isLoading || code.length < 6}
                    >
                        {isLoading ? 'Verificando...' : 'Verificar código'}
                    </button>
                </form>
            </div>
        </Modal>
    );
};
