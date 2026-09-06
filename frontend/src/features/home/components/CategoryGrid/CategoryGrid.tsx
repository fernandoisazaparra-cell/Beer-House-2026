import { NavLink } from "react-router-dom";
import styles from "./CategoryGrid.module.css";

import {
  defaultCategories,
  type Category
} from '@/config'

interface CategoryGridProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  categories?: Category[];
}

export const CategoryGrid = ({
  eyebrow = "Explora por tipo",
  title = "Nuestras categorías",
  description = "Diez mundos distintos de sabor, cada uno con su propio carácter.",
  categories = defaultCategories,
}: CategoryGridProps) => {
  return (
    <section className={styles.section}>
      <div className={styles.textContent}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.grid}>
        {categories.map((cat) => (
          <NavLink key={cat.id} to={cat.to} className={styles.card}>
            <cat.icon className={styles.iconWrapper}/>
            <span className={styles.label}>{cat.label}</span>
            <span className={styles.link}>Ver productos -&gt;</span>
          </NavLink>
        ))}
      </div>
    </section>
  );
};