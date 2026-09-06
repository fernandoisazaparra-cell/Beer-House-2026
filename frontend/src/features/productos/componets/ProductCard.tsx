import type { Producto } from '../productos.types'
import { useCart } from '../../../app/context/cartUse'

interface ProductCardProps {
  producto: Producto
}

export const ProductCard = ({ producto }: ProductCardProps) => {
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    const precio = Number(
      producto.precio.replace('$', '').replace(/\./g, '').replace(',', '.')
    )

    addToCart({
      id: String(producto.id),
      name: producto.nombre,
      price: precio,
      imageUrl: producto.imagen
    })
  }

  return (
    <article>
      <img src={producto.imagen} alt={producto.nombre} />
      <h3>{producto.nombre}</h3>
      <p>{producto.precio}</p>
      <button type="button" onClick={handleAddToCart}>
        Agregar al carrito
      </button>
    </article>
  )
}

