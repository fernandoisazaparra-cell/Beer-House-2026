import styles from '../Products.module.css'
import type { Producto } from '../productos.types'
import { ProductCard } from '@/shared'

interface ProductsGridProps {
  productos: Producto[]
}

export const ProductsGrid = ({ productos }: ProductsGridProps) => {

  console.log(productos)
  return (
    <div className={styles.productsGrid}>
      {productos.map((producto) => (
        <ProductCard 
          key={producto.id}
          id={producto.id} 
          name={producto.nombre} 
          image={producto.imagen} 
          category={producto.categoria}
          price={producto.precio}
        />
      ))}
    </div>
  )
}