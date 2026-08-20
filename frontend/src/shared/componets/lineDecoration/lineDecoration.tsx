import styles from './lineDecoration.module.css'

interface DecorativeDividerProps {
    variant?: 'diamond' | 'text';
    children?: React.ReactNode;
    color?: string;
}

export const LineDecoration = ({
    variant = 'diamond',
    children,
    color = 'currentColor',
}: DecorativeDividerProps) => {
    return (
        <div
            className={`${styles.decorative_divider}`}
            style={{ '--divider-color': color } as React.CSSProperties}
        >
            <span className={styles.decorative_divider__line} />
            {variant === 'diamond' && (
                <span className={styles.decorative_divider__diamond} />
            )}
            {variant === 'text' && (
                <span className={styles.decorative_divider__text}>
                    {children}
                </span>
            )}
            <span className={styles.decorative_divider__line} />
        </div>
    );
};