// ======================================================
// IMPORTACIONES
// ======================================================
import styles from './FeaturedProducts.module.css';
import { useCart } from '@/app/context/cartUse';

// ======================================================
// MARCAS PREMIUM
// ======================================================
const brands = [
  {
    name: "JACK DANIEL'S",
    image: "./src/ui/assets/img2/marcas/563018697248088-removebg-preview.png"
  },
  {
    name: "JOHNNIE WALKER",
    image: "./src/ui/assets/img2/marcas/9781324183546597-removebg-preview.png"
  },
  {
    name: "CHIVAS",
    image: "./src/ui/assets/img2/marcas/67413325663848126-removebg-preview.png"
  },
  {
    name: "Aguardiente_Antioqueño",
    image: "./src/ui/assets/img2/marcas/AGUARDIENTE_ANTIOQUEÑO_Logo_PNG_Vector__CDR__Free_Download-removebg-preview (1).png"
  },
  {
    name: "Ron",
    image: "./src/ui/assets/img2/marcas/Ron_Viejo_de_Caldas_Logo_PNG_Vector__AI__Free_Download-removebg-preview.png"
  },
  {
    name: "ABSOLUT",
    image: "frontend/src/ui/assets/img2/marcas/1119989001093064792.jpg"
  },
  {
    name: "BACARDÍ",
    image: ""
  }
];

// ======================================================
// PRODUCTOS DESTACADOS
// ======================================================
const products = [
  {
    id: "1",
    name: "Reserva Ámbar 12 Años",
    type: "Whisky",
    image: "./src/ui/assets/ing/Products/2603712280137549-removebg-preview.png",
    price: "$85.000",
    oldPrice: "$450.000",
    rating: "★★★★★",
    reviews: "(245)"
  },
  {
    id: "2",
    name: "Aguardiente Antioqueño Rojo",
    type: "Aguardiente",
    image: "./src/ui/assets/ing/Products/AGUARDIENTE AGUARDIENTE ROJO ANTIOQUEÑO 750ML.jpg",
    price: "$385.000",
    oldPrice: "$450.000",
    rating: "★★★★★",
    reviews: "(245)"
  },
  {
    id: "3",
    name: "Don Julio Reposado",
    type: "Tequila",
    image: "./src/ui/assets/ing/Products/Don_Julio_Reposado-removebg-preview.png",
    price: "$385.000",
    oldPrice: "$450.000",
    rating: "★★★★★",
    reviews: "(245)"
  },
  {
    id: "4",
    name: "Buchanan's 12 Años",
    type: "Whisky",
    image: "./src/ui/assets/ing/Products/Buchanan_s_12_Years_Aged-removebg-preview.png",
    price: "$385.000",
    oldPrice: "$450.000",
    rating: "★★★★★",
    reviews: "(245)"
  }
];

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================
export const FeaturedProducts = () => {
  const { addToCart } = useCart();

  return (
    <section className={styles.featuredSection}>
      {/* MARCAS PREMIUM */}
      <div className={styles.brandsContainer}>
        <div className={styles.sectionTitle}>
          <span></span>
          <h3>MARCAS PREMIUM</h3>
          <span></span>
        </div>

        {/* SLIDER DE MARCAS */}
        <div className={styles.brandsSlider}>
          <div className={styles.brands}>
            {brands.map((brand) => (
              <div className={styles.brand} key={brand.name}>
                {brand.image ? (
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className={styles.brandImage}
                  />
                ) : (
                  <div className={styles.brandPlaceholder}>
                    LOGO
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCTOS DESTACADOS */}
      <div className={styles.productsContainer}>
        <div className={styles.homeLabel}>
          SECCIÓN DE LA CASA
        </div>

        <h2 className={styles.productsTitle}>
          PRODUCTOS DESTACADOS
        </h2>

        {/* GRID DE PRODUCTOS */}
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <article
              className={styles.productCard}
              key={product.id}
            >
              {/* IMAGEN DEL PRODUCTO */}
              <div className={styles.productImage}>
                <span className={styles.featuredBadge}>
                  DESTACADO
                </span>

                <button
                  className={styles.favorite}
                  type="button"
                  aria-label={`Agregar ${product.name} a favoritos`}
                >
                  ♡
                </button>

                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className={styles.productImageFile}
                  />
                ) : (
                  <div className={styles.productImagePlaceholder}></div>
                )}
              </div>

              {/* INFORMACIÓN DEL PRODUCTO */}
              <div className={styles.productInfo}>
                <h3>{product.name}</h3>

                <p className={styles.productType}>
                  12 años • {product.type}
                </p>

                <div className={styles.rating}>
                  <span>{product.rating}</span>
                  <small>{product.reviews}</small>
                </div>

                {/* PRECIOS */}
                <div className={styles.priceContainer}>
                  <span className={styles.oldPrice}>
                    {product.oldPrice}
                  </span>
                  <strong className={styles.price}>
                    {product.price}
                  </strong>
                  <span className={styles.stock}>
                    En stock
                  </span>
                </div>

                {/* BOTÓN CARRITO */}
                <button
                  className={styles.cartButton}
                  type="button"
                  onClick={() =>
                    addToCart({
                      id: String(product.id),
                      name: product.name,
                      price: Number(String(product.price).replace(/[^0-9]/g, '')) || 0,
                      imageUrl: product.image,
                    })
                  }
                >
                  <span>🛒</span>
                  AGREGAR AL CARRITO
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};