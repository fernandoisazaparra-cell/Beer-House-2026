// ======================================================
// FOOTER - BEER HOUSE
// Contiene:
// 1. Beneficios de la tienda
// 2. Galería de Instagram
// 3. Información de la empresa
// 4. Enlaces de navegación
// 5. Información de contacto
// ======================================================

import styles from './Footer.module.css'

import { PiCarProfileFill } from "react-icons/pi";

import { FaLock } from "react-icons/fa";

import { LuBadgeCheck } from "react-icons/lu";

import { IoStarOutline } from "react-icons/io5";

export const Footer = () => {
    return (
        <footer className={styles.footer}>

            {/* ==================================================
                SECCIÓN DE BENEFICIOS
            ================================================== */}
            <section className={styles.benefits}>

                <div className={styles.benefit}>
                    <span className={styles.benefitIcon}><PiCarProfileFill/></span>

                    <div>
                        <h3>ENVÍO RÁPIDO</h3>
                        <p>
                            Recibe tus productos de 24 a 48 horas.
                        </p>
                    </div>
                </div>


                <div className={styles.separator}></div>


                <div className={styles.benefit}>
                    <span className={styles.benefitIcon}><FaLock/></span>

                    <div>
                        <h3>PAGO SEGURO</h3>
                        <p>
                            Transacciones 100% seguras y protegidas.
                        </p>
                    </div>
                </div>


                <div className={styles.separator}></div>


                <div className={styles.benefit}>
                    <span className={styles.benefitIcon}><LuBadgeCheck/></span>

                    <div>
                        <h3>PRODUCTOS ORIGINALES</h3>
                        <p>
                            Garantizamos autenticidad en cada botella.
                        </p>
                    </div>
                </div>


                <div className={styles.separator}></div>


                <div className={styles.benefit}>
                    <span className={styles.benefitIcon}><IoStarOutline/></span>

                    <div>
                        <h3>GARANTÍA</h3>
                        <p>
                            Satisfacción garantizada o te devolvemos tu dinero.
                        </p>
                    </div>
                </div>

            </section>


            {/* ==================================================
                SECCIÓN INSTAGRAM
            ================================================== */}
           

        


            {/* ==================================================
                PARTE INFERIOR DEL FOOTER
            ================================================== */}
            <section className={styles.footerContent}>

                {/* ------------------------------------------------
                    INFORMACIÓN BEER HOUSE
                ------------------------------------------------ */}
                <div className={styles.brand}>

                    <h2>
                        ♢ BEER HOUSE
                    </h2>

                    <p>
                        El arte de servir con clase.
                        <br />
                        Licores premium para momentos inolvidables.
                    </p>

                    {/* Redes sociales */}
                    <div className={styles.socials}>

                        <a href="#" aria-label="Instagram">
                            ◎
                        </a>

                        <a href="#" aria-label="Facebook">
                            f
                        </a>

                        <a href="#" aria-label="WhatsApp">
                            ◉
                        </a>

                    </div>

                </div>


                {/* ------------------------------------------------
                    COLUMNA TIENDA
                ------------------------------------------------ */}
                <div className={styles.column}>

                    <h3>TIENDA</h3>

                    <a href="#">Todos los productos</a>
                    <a href="#">Promociones</a>
                    <a href="#">Nuevos productos</a>
                    <a href="#">Más vendidos</a>

                </div>


                {/* ------------------------------------------------
                    COLUMNA INFORMACIÓN
                ------------------------------------------------ */}
                <div className={styles.column}>

                    <h3>INFORMACIÓN</h3>

                    <a href="#">Nosotros</a>
                    <a href="#">Políticas de envío</a>
                    <a href="#">Políticas de devolución</a>
                    <a href="#">Términos y condiciones</a>

                </div>


                {/* ------------------------------------------------
                    COLUMNA AYUDA
                ------------------------------------------------ */}
                <div className={styles.column}>

                    <h3>AYUDA</h3>

                    <a href="#">Preguntas frecuentes</a>
                    <a href="#">Contacto</a>
                    <a href="#">Métodos de pago</a>
                    <a href="#">Seguimiento de pedido</a>

                </div>


                {/* ------------------------------------------------
                    COLUMNA CONTACTO
                ------------------------------------------------ */}
                <div className={styles.column}>

                    <h3>CONTACTO</h3>

                    <p>◉ +57 300 123 4567</p>
                    <p>✉ hola@beerhouse.com</p>
                    <p>♙ Medellin, Colombia</p>

                </div>

            </section>

        </footer>
    )
}