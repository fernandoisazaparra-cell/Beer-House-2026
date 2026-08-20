import {
  NavLink
} from 'react-router-dom'

import background from "@/ui/assets/Background1.jpg"

import {
  FaRegStar,
  FaTruckFast,
  GoShieldCheck
} from '@/ui/icons'

import CategoryGrid from './components/sectionCategoryGrid'

import { FeaturedProducts } from './components/sectionFeaturedProducts'

import { Footer } from './components/Footer/Footer'

import styles from './home.module.css'



export const Home = () => {
  return (
    <>



    <section className={styles.contentHome}>
        <img
          src={background}
          alt="Background del home"
          className={styles.background}
        />
        <div className={styles.overlay} />

        <div className={styles.contentText}>
          <div className={styles.text}>
            <span>El arte de</span>
            <span>Servir con clase</span>
          </div>

          <div className={styles.parrafo}>
            <p>
              Una selección exclusiva de licores premium, escogidos para quienes
              creen que cada brindis, merece una historia
            </p>
          </div>

          <ul className={styles.value}>
            <li className={styles.valueProm}>
              <FaRegStar className={styles.icon} />
              <div className={styles.textProm}>
                <span>+500</span>
                <h2>PRODUCTOS</h2>
              </div>
            </li>

            <div className={styles.line} />

            <li className={styles.valueProm}>
              <FaTruckFast className={styles.icon} />
              <div className={styles.textProm}>
                <span>ENVIOS</span>
                <h2>A TODO MEDELLIN</h2>
              </div>
            </li>

            <div className={styles.line} />

            <li className={styles.valueProm}>
              <GoShieldCheck className={styles.icon} />
              <div className={styles.textProm}>
                <span>100%</span>
                <h2>PRODUCTOS ORIGINALES</h2>
              </div>
            </li>
          </ul>

          <div className={styles.Buttons}>
            <NavLink
              to={"/"}
              className={styles.primaryCta}
            >
              <span>Compra ahora</span>
            </NavLink>

            <NavLink
              to={"/"}
              className={styles.secondaryCta}
            >
              <span>Explorar Catalogo</span>
            </NavLink>
          </div>
        </div>
      </section>

      <CategoryGrid />

       {/* Marcas Premium + Productos Destacados */}
      <FeaturedProducts />

         {/* FOOTER */}
      <Footer />
    
    </>
  );
};