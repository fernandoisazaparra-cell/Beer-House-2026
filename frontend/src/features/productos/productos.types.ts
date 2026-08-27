// ======================================================
// TIPO DE DATOS DE LOS PRODUCTOS
// ======================================================
export interface Producto {
    id: number
    nombre: string
    categoria: string
    precio: string
    precioAnterior: string
    imagen: string
    descuento: string
    stock: boolean
    destacado: boolean
}
// ======================================================
// PRODUCTOS DE PRUEBA
// Después podemos reemplazarlos por los productos
// que vienen desde tu base de datos.
// ======================================================
export const productos: Producto[] = [
    {
        id: 1,
        nombre: 'Reserva Ron viejo de caldas esencial 12 Años',
        categoria: 'Ron',
        precio: '$65.000',
        precioAnterior: '$70.000',
        imagen: './src/ui/assets/ing/Products/LICOR_DE__RON_VIEJO_DE_CALDAS_ESENCIAL_12_750_ML-removebg-preview.png',
        descuento: '15%',
        stock: true,
        destacado: true
    },
    {
        id: 2,
        nombre: 'Reserva  Mast-jagermeilfer',
        categoria: 'Whisky',
        precio: '$385.000',
        precioAnterior: '$450.000',
        imagen: './src/ui/assets/ing/Products/2603712280137549-removebg-preview.png',
        descuento: '15%',
        stock: true,
        destacado: true
    },
    {
        id: 3,
        nombre: 'Reserva Don julio reposado',
        categoria: 'Whisky',
        precio: '$185.000',
        precioAnterior: '$250.000',
        imagen: './src/ui/assets/ing/Products/Don_Julio_Reposado-removebg-preview.png',
        descuento: '15%',
        stock: true,
        destacado: true
    },
    {
        id: 4,
        nombre: 'Reserva Ámbar 12 Años',
        categoria: 'Whisky',
        precio: '$385.000',
        precioAnterior: '$450.000',
        imagen: './src/ui/assets/ing/Products/AGUARDIENTE AGUARDIENTE ROJO ANTIOQUEÑO 750ML.jpg',
        descuento: '15%',
        stock: true,
        destacado: true
    },
     {
        id: 5,
        nombre: 'Reserva Ámbar 12 Años',
        categoria: 'Whisky',
        precio: '$385.000',
        precioAnterior: '$450.000',
        imagen: './src/ui/assets/ing/Products/AGUARDIENTE ANTIOQUEÑO SIN AZUCAR TAPA AZUL 1000 ML.jpg',
        descuento: '15%',
        stock: true,
        destacado: true
    },
     {
        id: 6,
        nombre: 'Reserva Buchanas 12 Años',
        categoria: 'Whisky',
        precio: '$385.000',
        precioAnterior: '$450.000',
        imagen: './src/ui/assets/ing/Products/Buchanan_s_12_Years_Aged-removebg-preview.png',
        descuento: '15%',
        stock: true,
        destacado: true
    },
     {
        id: 7,
        nombre: 'Reserva Clud Colombia',
        categoria: 'Whisky',
        precio: '$105.000',
        precioAnterior: '$120.000',
        imagen: './src/ui/assets/ing/Products/647673990202911566.jpg ',
        descuento: '15%',
        stock: true,
        destacado: true
    },
     {
        id: 8,
        nombre: 'Aguila',
        categoria: 'Whisky',
        precio: '$5.000',
        precioAnterior: '$4500',
        imagen: './src/ui/assets/ing/Products/20195898325118156.jpg',
        descuento: '15%',
        stock: true,
        destacado: true
    },
     {
        id: 9,
        nombre: 'sipack Corona',
        categoria: 'Whisky',
        precio: '$25.000',
        precioAnterior: '$22.000',
        imagen: './src/ui/assets/ing/Products/43136108926806306-removebg-preview (1).png',
        descuento: '15%',
        stock: true,
        destacado: true
    },
     {
        id: 10,
        nombre: 'Caja de cerveza aguila',
        categoria: 'Cerveza',
        precio: '$75.000',
        precioAnterior: '$85.000',
        imagen: './src/ui/assets/ing/Products/455637687320506852-removebg-preview (1).png',
        descuento: '15%',
        stock: true,
        destacado: true
    },

]




