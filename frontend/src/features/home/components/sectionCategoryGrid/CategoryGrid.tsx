import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./CategoryGrid.module.css";
import {
  LuGlassWater as GlassWater,
  LuWine as Wine,
  LuBeer as Beer,
  LuMartini as Martini,
} from "react-icons/lu";
import {
  GiBrandyBottle,
  GiSquareBottle,
  GiGlassShot,
  GiChampagneCork,
  GiWineBottle,
  GiEarthAmerica,
} from "react-icons/gi";

export interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  to: string;
}

const ICON_SIZE = 36;

const defaultCategories: Category[] = [
  { id: "whisky", label: "Whisky", icon: <GlassWater size={ICON_SIZE} />, to: "/categoria/whisky" },
  { id: "ron", label: "Ron", icon: <GiBrandyBottle size={ICON_SIZE} />, to: "/categoria/ron" },
  { id: "vodka", label: "Vodka", icon: <GiSquareBottle size={ICON_SIZE} />, to: "/categoria/vodka" },
  { id: "tequila", label: "Tequila", icon: <GiGlassShot size={ICON_SIZE} />, to: "/categoria/tequila" },
  { id: "vino", label: "Vino", icon: <Wine size={ICON_SIZE} />, to: "/categoria/vino" },
  { id: "champana", label: "Champaña", icon: <GiChampagneCork size={ICON_SIZE} />, to: "/categoria/champana" },
  { id: "cerveza", label: "Cerveza", icon: <Beer size={ICON_SIZE} />, to: "/categoria/cerveza" },
  { id: "cocteles", label: "Cócteles", icon: <Martini size={ICON_SIZE} />, to: "/categoria/cocteles" },
  { id: "nacionales", label: "Nacionales", icon: <GiWineBottle size={ICON_SIZE} />, to: "/categoria/nacionales" },
  { id: "importados", label: "Importados", icon: <GiEarthAmerica size={ICON_SIZE} />, to: "/categoria/importados" },
];

export interface CategoryGridProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  categories?: Category[];
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  eyebrow = "Explora por tipo",
  title = "Nuestras categorías",
  description = "Diez mundos distintos de sabor, cada uno con su propio carácter.",
  categories = defaultCategories,
}) => {
  return (
    <section className={styles.section}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>

      <div className={styles.grid}>
        {categories.map((cat) => (
          <NavLink key={cat.id} to={cat.to} className={styles.card}>
            <span className={styles.iconWrapper}>{cat.icon}</span>
            <span className={styles.label}>{cat.label}</span>
            <span className={styles.link}>Ver productos -&gt;</span>
          </NavLink>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;