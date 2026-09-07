import {
  HomeLabel,
  CategoryGrid,
  FeaturedProducts
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
    </>
  );
};