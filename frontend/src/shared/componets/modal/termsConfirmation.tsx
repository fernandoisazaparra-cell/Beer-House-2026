import React, { useState } from 'react';
import { Modal } from './modal';
import { FormCheckbox } from '@/shared';
import { FaHandshake } from 'react-icons/fa';

import styles from './modalToken.module.css'

interface TermsConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => Promise<void>;
    isLoading?: boolean;
    error?: string;
}

export const TermsConfirmationModal = ({
    isOpen,
    onConfirm,
    isLoading = false,
    error
}: TermsConfirmationModalProps) => {
    const [terms, setTerms] = useState(false);
    const [years, setYears] = useState(false);
    const [localError, setLocalError] = useState<string | undefined>();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!terms || !years) {
            setLocalError('Debes aceptar los términos y confirmar tu edad.');
            return;
        }
        setLocalError(undefined);
        await onConfirm();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {}}
            size="sm"
            showCloseButton={false}
            closeOnOverlayClick={false}
            title="Confirma tus datos"
            description="Para continuar, acepta los términos y confirma tu edad."
        >
            <div className={styles.tokenModalContent}>
                <div className={styles.tokenModalIcon}>
                    <FaHandshake />
                </div>

                <form onSubmit={handleSubmit}>
                    <FormCheckbox
                        name="terms"
                        checked={terms}
                        onChange={() => setTerms((prev) => !prev)}
                    >
                        Acepto los <a href="">Términos y Condiciones</a> y la <a href="">Política de Privacidad</a>
                    </FormCheckbox>

                    <FormCheckbox
                        name="years"
                        checked={years}
                        onChange={() => setYears((prev) => !prev)}
                    >
                        Declaro bajo mi responsabilidad que soy mayor de 18 años
                    </FormCheckbox>

                    {(localError || error) && (
                        <span className={styles.generalError}>
                            {error || localError}
                        </span>
                    )}

                    <button
                        type="submit"
                        className={styles.tokenModalButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Confirmando...' : 'Aceptar y continuar'}
                    </button>
                </form>
            </div>
        </Modal>
    );
};
