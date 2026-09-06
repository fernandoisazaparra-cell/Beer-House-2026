// ======================================================
// PRODUCTS
// Página / sección de catálogo de productos
// ======================================================
import styles from './Products.module.css'

// ======================================================
// TIPO DE DATOS DE LOS PRODUCTOS
// ======================================================
// interface Producto {
//     id: number
//     nombre: string
//     categoria: string
//     precio: string
//     precioAnterior: string
//     imagen: string
//     descuento: string
//     stock: boolean
//     destacado: boolean
// }

// ======================================================
// PRODUCTOS DE PRUEBA
// Después podemos reemplazarlos por los productos
// que vienen desde tu base de datos.
// ======================================================
// const productos: Producto[] = [
//     {
//         id: 1,
//         nombre: 'Reserva Ron viejo de caldas esencial 12 Años',
//         categoria: 'Ron',
//         precio: '$65.000',
//         precioAnterior: '$70.000',
//         imagen: './src/ui/assets/ing/Products/LICOR_DE__RON_VIEJO_DE_CALDAS_ESENCIAL_12_750_ML-removebg-preview.png',
//         descuento: '15%',
//         stock: true,
//         destacado: true
//     },
//     {
//         id: 2,
//         nombre: 'Reserva  Mast-jagermeilfer',
//         categoria: 'Whisky',
//         precio: '$385.000',
//         precioAnterior: '$450.000',
//         imagen: './src/ui/assets/ing/Products/2603712280137549-removebg-preview.png',
//         descuento: '15%',
//         stock: true,
//         destacado: true
//     },
//     {
//         id: 3,
//         nombre: 'Reserva Don julio reposado',
//         categoria: 'Whisky',
//         precio: '$185.000',
//         precioAnterior: '$250.000',
//         imagen: './src/ui/assets/ing/Products/Don_Julio_Reposado-removebg-preview.png',
//         descuento: '15%',
//         stock: true,
//         destacado: true
//     },
//     {
//         id: 3,
//         nombre: 'Reserva Ámbar 12 Años',
//         categoria: 'Whisky',
//         precio: '$385.000',
//         precioAnterior: '$450.000',
//         imagen: './src/ui/assets/ing/Products/Buchanan_s_12_Years_Aged-removebg-preview.png',
//         descuento: '15%',
//         stock: true,
//         destacado: true
//     },
// ]

// ======================================================
// COMPONENTE PRODUCTS
// ======================================================
export const Products = () => {
    return (
        <main className={styles.productsPage}>
            {/* ENCABEZADO DE LA PÁGINA */}
            {/* <section className={styles.pageHeader}>
                <h1>Nuestros <span>Productos</span></h1>
                <div className={styles.breadcrumb}>Inicio <span>›</span> Productos</div>
            </section> */}

            {/* CONTENIDO PRINCIPAL */}
            <section className={styles.catalog}>
                {/* FILTROS */}
            
                    

                    {/* CATEGORÍAS */}
                   

                    {/* RANGO DE PRECIO */}
                  

                    {/* PAÍS DE ORIGEN */}
                    
                    {/* AÑEJAMIENTO */}
                   
                

                {/* ÁREA DE PRODUCTOS */}
                <section className={styles.productsArea}>
                    {/* BUSCADOR Y ORDEN */}
                   

                    {/* GRID DE PRODUCTOS */}
                    <div className={styles.productsGrid}>
                      
                      
                    </div>
                </section>
            </section>
        </main>
    )
}