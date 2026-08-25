import { FiCheck } from 'react-icons/fi';
import styles from './formCheckbox.module.css';

interface FormCheckboxProps {
    name: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    children: React.ReactNode;
}

export const FormCheckbox = ({
    name,
    checked,
    onChange,
    error,
    children
}: FormCheckboxProps) => {
    return (
        <div className={styles.formCheckbox}>
            <label className={styles.label}>
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    onChange={onChange}
                />

                <span className={`${styles.checkbox} ${error ? styles.errorCheck : ''}`}>
                    {checked && <FiCheck />}
                </span>

                <span className={styles.text}>
                    {children}
                </span>
            </label>

            {error && (
                <span className={styles.error}>
                    {error}
                </span>
            )}
        </div>
    );
};