import styles from './footer.module.css'

export const Footer = () => {
    const year = new Date().getFullYear()

    return (
        <footer className={styles.footer}>
            <div className={styles.brand}>
                <span>BEER</span>
                <span>HOUSE</span>
            </div>

            <p>© {year} Beer House. Todos los derechos reservados.</p>
        </footer>
    )
}
