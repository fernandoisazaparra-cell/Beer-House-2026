import {
  HomeLabel,
  CategoryGrid,
  FeaturedProducts,
  Products,
  Footer
} from '@/features'

import {
  LogoLine
} from '@/shared'

export const Home = () => {
  return (
    <>
      <HomeLabel />
      <LogoLine />
      <CategoryGrid />

       {/* Marcas Premium + Productos Destacados */}
      <FeaturedProducts />

       <Products/>

         {/* FOOTER */}
      <Footer />
    
    </>
  );
};