export interface Combo {
  id: string | number;
  name: string;
  description: string;
  price: number;
  discount: number;
  imageUrl: string;
  productsIncluded: (string | number)[];
  stock: number;
  status: 'active' | 'inactive';
}