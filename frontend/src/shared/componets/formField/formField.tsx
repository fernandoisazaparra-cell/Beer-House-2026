import { useState } from 'react';
import styles from './formField.module.css';

import {
    FaEye,
    FaEyeSlash
} from '@/ui/icons'

interface FormFieldProps {
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    value?: string;
    error?: string;
    autoComplete?: string;
    icon?: React.ReactNode;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormField = ({
    label,
    name,
    type = 'text',
    placeholder,
    value,
    error,
    icon,
    autoComplete,
    onChange
}: FormFieldProps) => {

    const [showPassword, setShowPassword] = useState(false);

    const inputType =
        type === 'password' && showPassword
            ? 'text'
            : type;

    return (
        <div className={styles.formField}>
            <label htmlFor={name}>
                {label}
            </label>

            <div
                className={`${styles.inputWrapper} ${
                    error ? styles.inputError : ''
                }`}
            >
                {icon}

                <input
                    id={name}
                    name={name}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={onChange}
                />

                {type === 'password' && (
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label={
                            showPassword
                                ? 'Ocultar contraseña'
                                : 'Mostrar contraseña'
                        }
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye /> }
                    </button>
                )}
            </div>

            {error && (
                <span className={styles.error}>
                    {error}
                </span>
            )}
        </div>
    );
};