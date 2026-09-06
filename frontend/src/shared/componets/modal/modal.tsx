import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './modal.module.css';
import { FaTimes } from '@/ui/icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    closeOnOverlayClick?: boolean;
    showCloseButton?: boolean;
    footer?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Modal genérico y reutilizable.
 * Sirve como contenedor para cualquier contenido: formularios,
 * verificación de token/OTP, confirmaciones, mensajes, etc.
 *
 * El contenido específico (form, inputs de token, texto) se pasa
 * como `children`, así este componente no sabe ni le importa
 * qué hay dentro — solo maneja apertura/cierre, overlay, foco y tamaño.
 */
export const Modal = ({
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    closeOnOverlayClick = true,
    showCloseButton = true,
    footer,
    children
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Cerrar con la tecla Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Bloquear el scroll del fondo mientras el modal está abierto
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Enfocar el modal al abrirse (accesibilidad)
    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className={styles.overlay}
            onMouseDown={handleOverlayClick}
        >
            <div
                ref={modalRef}
                className={`${styles.modal} ${styles[size]}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                tabIndex={-1}
            >
                {showCloseButton && (
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <FaTimes />
                    </button>
                )}

                {(title || description) && (
                    <div className={styles.header}>
                        {title && (
                            <h2 id="modal-title" className={styles.title}>
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className={styles.description}>{description}</p>
                        )}
                    </div>
                )}

                <div className={styles.content}>
                    {children}
                </div>

                {footer && (
                    <div className={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};