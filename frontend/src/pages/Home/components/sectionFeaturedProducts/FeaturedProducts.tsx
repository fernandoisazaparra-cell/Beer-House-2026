// ======================================================
// IMPORTACIÓN DE ESTILOS
// ======================================================

import styles from './FeaturedProducts.module.css'


// ======================================================
// MARCAS PREMIUM
// ======================================================
// Aquí estarán las marcas de la sección superior.
//
// IMPORTANTE:
// "image: ''" significa que todavía no hemos colocado
// la imagen. Después tú podrás poner tu propia imagen.
//
// Ejemplo:
//
// image: jackDaniels
//
// cuando tengas importada la imagen.
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
    image: ""
  },
  {
    name: "BACARDÍ",
    image: ""
  }
]


// ======================================================
// PRODUCTOS DESTACADOS
// ======================================================
// Aquí estarán los productos.
//
// "image: ''" es el espacio donde después colocaremos
// tus imágenes reales.
// ======================================================

const products = [
  {
    name: "Reserva Ámbar 12 Años",
    type: "Whisky",
    image: "./src/ui/assets/ing/Products/2603712280137549-removebg-preview.png",
    price: "$85.000",
    oldPrice: "$450.000",
    rating: "★★★★★",
    reviews: "(245)"
  },

  {
    name: "Reserva Ámbar 12 Años",
    type: "Whisky",
    image: "./src/ui/assets/ing/Products/AGUARDIENTE AGUARDIENTE ROJO ANTIOQUEÑO 750ML.jpg",
    price: "$385.000",
    oldPrice: "$450.000",
    rating: "★★★★★",
    reviews: "(245)"
  },

  {
    name: "Reserva Ámbar 12 Años",
    type: "Whisky",
    image: "./src/ui/assets/ing/Products/Don_Julio_Reposado-removebg-preview.png",
    price: "$385.000",
    oldPrice: "$450.000",
    rating: "★★★★★",
    reviews: "(245)"
  },

  {
    name: "Reserva Ámbar 12 Años",
    type: "Whisky",
    image: "./src/ui/assets/ing/Products/Buchanan_s_12_Years_Aged-removebg-preview.png",
    price: "$385.000",
    oldPrice: "$450.000",
    rating: "★★★★★",
    reviews: "(245)"
  }
]


// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export const FeaturedProducts = () => {

  return (

    <section className={styles.featuredSection}>

      {/* ==================================================
          MARCAS PREMIUM
          ================================================== */}

      <div className={styles.brandsContainer}>

        {/* TÍTULO */}

        <div className={styles.sectionTitle}>

          <span></span>

          <h3>
            MARCAS PREMIUM
          </h3>

          <span></span>

        </div>


        {/* ==================================================
            SLIDER DE MARCAS
            ================================================== */}

        <div className={styles.brandsSlider}>

          {/* Flecha izquierda */}

          <button
            className={styles.brandArrow}
            type="button"
          >
            ‹
          </button>


          {/* Lista de marcas */}

          <div className={styles.brands}>

            {brands.map((brand) => (

              <div
                className={styles.brand}
                key={brand.name}
              >

                {/* ==========================================
                    IMAGEN DE LA MARCA
                    ========================================== */}

                {brand.image ? (

                  <img
                    src={brand.image}
                    alt={brand.name}
                    className={styles.brandImage}
                  />

                ) : (

                  /*
                    ESTE ESPACIO APARECE MIENTRAS
                    NO TENGAS LA IMAGEN.
                  */

                  <div className={styles.brandPlaceholder}>
                    LOGO
                  </div>

                )}

              </div>

            ))}

          </div>


          {/* Flecha derecha */}

          <button
            className={styles.brandArrow}
            type="button"
          >
            ›
          </button>

        </div>

      </div>


      {/* ==================================================
          PRODUCTOS DESTACADOS
          ================================================== */}

      <div className={styles.productsContainer}>

        {/* Texto pequeño */}

        <div className={styles.homeLabel}>
          SECCIÓN DE LA CASA
        </div>


        {/* Título principal */}

        <h2 className={styles.productsTitle}>
          PRODUCTOS DESTACADOS
        </h2>


        {/* ==================================================
            GRID DE PRODUCTOS
            ================================================== */}

        <div className={styles.productsGrid}>

          {products.map((product, index) => (

            <article
              className={styles.productCard}
              key={`${product.name}-${index}`}
            >

              {/* ==================================================
                  IMAGEN DEL PRODUCTO
                  ================================================== */}

              <div className={styles.productImage}>

                {/* Etiqueta */}

                <span className={styles.featuredBadge}>
                  DESTACADO
                </span>


                {/* Favoritos */}

                <button
                  className={styles.favorite}
                  type="button"
                  aria-label={`Agregar ${product.name} a favoritos`}
                >
                  ♡
                </button>


                {/* ==============================================
                    IMAGEN DEL PRODUCTO
                    ============================================== */}

                {product.image ? (

                  <img
                    src={product.image}
                    alt={product.name}
                    className={styles.productImageFile}
                  />

                ) : (

                  /*
                    ESTE ES EL ESPACIO VACÍO PARA TU IMAGEN.
                  */
                 
                  
                  <div className={styles.productImagePlaceholder}>
                  </div>

                )}

              </div>


              {/* ==================================================
                  INFORMACIÓN DEL PRODUCTO
                  ================================================== */}

              <div className={styles.productInfo}>

                {/* Nombre */}

                <h3>
                  {product.name}
                </h3>


                {/* Tipo */}

                <p className={styles.productType}>
                  12 años • {product.type}
                </p>


                {/* Calificación */}

                <div className={styles.rating}>

                  <span>
                    {product.rating}
                  </span>

                  <small>
                    {product.reviews}
                  </small>

                </div>


                {/* ==================================================
                    PRECIOS
                    ================================================== */}

                <div className={styles.priceContainer}>

                  {/* Precio anterior */}

                  <span className={styles.oldPrice}>
                    {product.oldPrice}
                  </span>


                  {/* Precio actual */}

                  <strong className={styles.price}>
                    {product.price}
                  </strong>


                  {/* Stock */}

                  <span className={styles.stock}>
                    En stock
                  </span>

                </div>


                {/* ==================================================
                    BOTÓN CARRITO
                    ================================================== */}

                <button
                  className={styles.cartButton}
                  type="button"
                >

                  <span>
                    🛒
                  </span>

                  AGREGAR AL CARRITO

                </button>

              </div>

            </article>

          ))}

        </div>

      </div>

    </section>
  )
}